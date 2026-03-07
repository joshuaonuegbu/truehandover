import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

const bytesToBase64Url = (bytes: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlToBytes = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const bin = atob(normalized + padding);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const textToBase64Url = (value: string) => {
  // UTF-8 safe base64url encoding.
  const utf8 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return bytesToBase64Url(Uint8Array.from(utf8, (c) => c.charCodeAt(0)));
};

const base64UrlToText = (value: string) => {
  const bytes = base64UrlToBytes(value);
  const bin = Array.from(bytes).map((b) => `%${b.toString(16).padStart(2, "0")}`).join("");
  return decodeURIComponent(bin);
};

const signHmacSha256 = async (secret: string, message: string) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bytesToBase64Url(new Uint8Array(sig));
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    enforceRateLimit(req, { name: "client-portal-token", limit: 60, windowMs: 60_000 });

    if (req.method !== "POST") throw new Error("Method not allowed");

    const secret = (Deno.env.get("CLIENT_PORTAL_HMAC_SECRET") || "").trim();
    if (secret.length < 32) throw new Error("CLIENT_PORTAL_HMAC_SECRET must be at least 32 characters");

    const supabase = createUserClient(req);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json().catch(() => ({}));
    const clientEmail = String(payload?.clientEmail || "").trim().toLowerCase();
    if (!clientEmail || !clientEmail.includes("@")) throw new Error("Valid clientEmail is required");

    // Default: 365 days. You can shorten this later + add rotation UI.
    const ttlDays = Math.max(1, Math.min(365, Number(payload?.ttlDays || 365)));
    const exp = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;

    const portalPayload = {
      v: 1,
      creatorId: user.id,
      clientEmail,
      exp,
    };

    const payloadB64 = textToBase64Url(JSON.stringify(portalPayload));
    const sig = await signHmacSha256(secret, payloadB64);
    const token = `v1.${payloadB64}.${sig}`;

    return new Response(JSON.stringify({ ok: true, token, expiresAt: new Date(exp * 1000).toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const status =
      err instanceof CorsError ? 403 :
      err instanceof RateLimitError ? 429 :
      400;
    const retryAfter = err instanceof RateLimitError ? String(err.retryAfterSeconds) : undefined;
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        ...(retryAfter ? { "Retry-After": retryAfter } : {}),
      },
    });
  }
});
