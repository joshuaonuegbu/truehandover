/**
 * r2-watermark-proxy — GET ?clientLink=xxx&fileId=yyy
 *
 * Fetches an image from R2 and returns it as an SVG with a server-side
 * watermark burned in. The raw R2 URL is never returned to the browser,
 * so inspect-element URL theft is prevented.
 *
 * Only serves native-storage image files (JPEG, PNG, WebP, GIF, AVIF).
 * Non-image or BYOS files return 422 so callers fall back to direct links.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { createR2Client, getR2BucketName } from "../_shared/r2.ts";
import { GetObjectCommand } from "npm:@aws-sdk/client-s3";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

const IMAGE_TYPES = [
  "image/jpeg", "image/jpg", "image/png",
  "image/webp", "image/gif", "image/avif", "image/tiff",
];

// 8 MB — large enough for any thumbnail, guards against huge originals landing here
const MAX_BYTES = 8 * 1024 * 1024;

const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const len = bytes.length;
  const chunkSize = 0x8000; // Avoid max-call-stack on large buffers
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
};

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] || c)
  );

/**
 * Build an SVG that wraps the original image as a base64 data-URI
 * with diagonal watermark text repeated across the canvas.
 * viewBox is fixed at 1000×1000; the embedded <image> uses
 * preserveAspectRatio so any aspect ratio is handled gracefully.
 */
const buildWatermarkedSvg = (base64: string, mimeType: string, label: string): string => {
  const safe = escapeXml(label);
  // Three watermark instances at different positions / opacities
  const wm = (x: number, y: number, size: number, opacity: number) =>
    `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-size="${size}" font-family="Arial,sans-serif" font-weight="bold" ` +
    `fill="rgba(255,255,255,${opacity})" transform="rotate(-35 ${x} ${y})" ` +
    `letter-spacing="4">${safe}</text>`;

  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`,
    ` viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">`,
    `<image href="data:${mimeType};base64,${base64}" x="0" y="0" width="1000" height="1000"`,
    ` preserveAspectRatio="xMidYMid meet"/>`,
    wm(500, 500, 52, 0.30),
    wm(200, 200, 36, 0.18),
    wm(800, 800, 36, 0.18),
    wm(750, 250, 30, 0.12),
    wm(250, 750, 30, 0.12),
    `</svg>`,
  ].join("");
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    assertCorsAllowed(req);
    // 300 req/min — each page load may fire several image requests
    enforceRateLimit(req, { name: "r2-watermark-proxy", limit: 300, windowMs: 60_000 });

    if (req.method !== "GET") throw new Error("Method not allowed");

    const url = new URL(req.url);
    const clientLink = (url.searchParams.get("clientLink") || "").trim();
    const fileId    = (url.searchParams.get("fileId")     || "").trim();
    if (!clientLink || !fileId) throw new Error("Missing clientLink or fileId");

    const admin = createServiceClient();

    // ── 1. Validate project ──────────────────────────────────────────────────
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("id, name, show_watermark, status")
      .eq("client_link", clientLink)
      .single();

    if (projectError || !project) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    // ── 2. Validate file belongs to project ──────────────────────────────────
    const { data: file, error: fileError } = await admin
      .from("files")
      .select("id, name, type, preview_url, storage_provider")
      .eq("id", fileId)
      .eq("project_id", project.id)
      .single();

    if (fileError || !file) {
      return new Response("File not found", { status: 404, headers: corsHeaders });
    }

    const mimeType  = String(file.type || "image/jpeg").toLowerCase();
    const previewKey = String(file.preview_url || "").trim();

    // Only handle native-storage image files
    if (file.storage_provider !== "native" || !previewKey || !IMAGE_TYPES.includes(mimeType)) {
      return new Response(
        JSON.stringify({ error: "Not a watermarkable file — use direct link" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 3. Fetch bytes from R2 ───────────────────────────────────────────────
    const r2     = createR2Client();
    const bucket = getR2BucketName();
    const obj    = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: previewKey }));

    if (!obj.Body) throw new Error("Empty response from storage");

    // Size guard — return a plain placeholder SVG if the preview is suspiciously large
    const contentLength = Number(obj.ContentLength || 0);
    if (contentLength > MAX_BYTES) {
      const placeholder =
        `<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
        `<rect width="400" height="300" fill="#111118"/>` +
        `<text x="200" y="135" text-anchor="middle" font-size="13" font-family="Arial" fill="#555">Large Preview</text>` +
        `<text x="200" y="165" text-anchor="middle" font-size="22" font-family="Arial" font-weight="bold" ` +
        `fill="rgba(255,255,255,0.28)" transform="rotate(-25 200 165)">PREVIEW ONLY</text></svg>`;
      return new Response(placeholder, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "no-cache" },
      });
    }

    // ── 4. Build SVG with watermark ──────────────────────────────────────────
    const bytes  = await (obj.Body as any).transformToByteArray();
    const base64 = toBase64(bytes);

    // Use project name as the watermark text (falls back to generic label)
    const watermarkLabel = (String(project.name || "").trim() || "PREVIEW ONLY").toUpperCase();
    const svg = buildWatermarkedSvg(base64, mimeType, watermarkLabel);

    return new Response(svg, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        // 5-min private cache — short enough that token rotation isn't a problem
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
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
