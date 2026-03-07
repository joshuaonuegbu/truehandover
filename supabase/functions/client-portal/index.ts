import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

const base64UrlToBytes = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const bin = atob(normalized + padding);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const base64UrlToText = (value: string) => {
  const bytes = base64UrlToBytes(value);
  const bin = Array.from(bytes).map((b) => `%${b.toString(16).padStart(2, "0")}`).join("");
  return decodeURIComponent(bin);
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const verifyHmacSha256 = async (secret: string, message: string, signatureB64Url: string) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const expected = bytesToBase64Url(new Uint8Array(sig));
  // Constant-time-ish compare.
  if (expected.length !== signatureB64Url.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signatureB64Url.charCodeAt(i);
  return diff === 0;
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    enforceRateLimit(req, { name: "client-portal", limit: 120, windowMs: 60_000 });

    if (req.method !== "POST") throw new Error("Method not allowed");

    const { portalToken } = await req.json();
    const token = String(portalToken || "").trim();
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "v1") throw new Error("Invalid portal token");

    const secret = (Deno.env.get("CLIENT_PORTAL_HMAC_SECRET") || "").trim();
    if (secret.length < 32) throw new Error("CLIENT_PORTAL_HMAC_SECRET must be at least 32 characters");

    const payloadB64 = parts[1];
    const sigB64 = parts[2];
    const okSig = await verifyHmacSha256(secret, payloadB64, sigB64);
    if (!okSig) throw new Error("Invalid portal token");

    const payloadJson = base64UrlToText(payloadB64);
    const payload = JSON.parse(payloadJson || "{}");

    const creatorId = String(payload?.creatorId || "").trim();
    const clientEmail = String(payload?.clientEmail || "").trim().toLowerCase();
    const exp = Number(payload?.exp || 0);

    if (!creatorId || !clientEmail) throw new Error("Invalid portal token");
    if (!Number.isFinite(exp) || exp <= 0) throw new Error("Invalid portal token");
    if (Date.now() / 1000 > exp) throw new Error("Portal link expired");

    const admin = createServiceClient();

    const { data: projects, error } = await admin
      .from("projects")
      .select("id, name, amount, status, created_at, due_date, client, client_link")
      .eq("user_id", creatorId)
      .filter("client->>email", "eq", clientEmail)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ error: "Portal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstClient = projects[0].client || {};
    const totalValue = projects.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return new Response(JSON.stringify({
      portal: {
        client: {
          name: firstClient.name || "Client",
          email: firstClient.email || clientEmail,
          company: firstClient.company || "",
          avatar: firstClient.avatar || "",
        },
        totalProjects: projects.length,
        totalValue,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          amount: Number(p.amount || 0),
          status: p.status,
          createdAt: p.created_at,
          dueDate: p.due_date,
          clientLink: p.client_link,
        })),
      },
    }), {
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
