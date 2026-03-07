/**
 * r2-zip-export — POST { clientLink }
 *
 * Validates payment, fetches all native-storage original files from R2,
 * bundles them into a single ZIP and returns it as application/zip.
 *
 * BYOS (link-type) files are excluded since they live on external services.
 * Rate-limited to 20 req/min to prevent abuse of the download pipeline.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { createR2Client, getR2BucketName } from "../_shared/r2.ts";
import { GetObjectCommand } from "npm:@aws-sdk/client-s3";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";
import { zipSync } from "npm:fflate";

const isPaid = (status: string) =>
  status === "paid" || status === "completed";

const sanitizeFilename = (name: string): string =>
  (name || "file")
    .replace(/[^a-zA-Z0-9._\- ]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200) || "file";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    // Conservative limit — each call fetches potentially many large files
    enforceRateLimit(req, { name: "r2-zip-export", limit: 20, windowMs: 60_000 });

    if (req.method !== "POST") throw new Error("Method not allowed");

    const { clientLink } = await req.json();
    const token = String(clientLink || "").trim();
    if (!token) throw new Error("Missing clientLink");

    const admin = createServiceClient();

    // ── 1. Validate project + payment status ─────────────────────────────────
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("id, name, status")
      .eq("client_link", token)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isPaid(String(project.status))) {
      return new Response(
        JSON.stringify({ error: "Files are locked — payment required before downloading." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Load all files that have native R2 originals ──────────────────────
    const { data: files, error: filesError } = await admin
      .from("files")
      .select("id, name, type, external_url, storage_provider")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });

    if (filesError) throw filesError;

    const nativeFiles = (files || []).filter(
      (f: any) => f.storage_provider === "native" && String(f.external_url || "").trim(),
    );

    if (nativeFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No downloadable files found in this project." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 3. Fetch each file from R2 in parallel ───────────────────────────────
    const r2     = createR2Client();
    const bucket = getR2BucketName();

    // Build ZIP entries: { filename: Uint8Array }
    const zipEntries: Record<string, Uint8Array> = {};
    const seenNames = new Set<string>();

    await Promise.all(
      nativeFiles.map(async (f: any) => {
        try {
          const obj = await r2.send(
            new GetObjectCommand({ Bucket: bucket, Key: String(f.external_url) }),
          );
          if (!obj.Body) return;

          const bytes = await (obj.Body as any).transformToByteArray();

          // Deduplicate filenames (two files with the same display name is valid)
          let filename = sanitizeFilename(f.name);
          if (seenNames.has(filename)) {
            const dotIdx = filename.lastIndexOf(".");
            const ext  = dotIdx >= 0 ? filename.slice(dotIdx) : "";
            const base = dotIdx >= 0 ? filename.slice(0, dotIdx) : filename;
            filename = `${base}_${String(f.id).slice(0, 6)}${ext}`;
          }
          seenNames.add(filename);

          // Use level 0 (store only) — binary files are already compressed
          zipEntries[filename] = bytes;
        } catch {
          // Skip individual file failures — still return the rest
        }
      }),
    );

    if (Object.keys(zipEntries).length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve any files from storage." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 4. Build and return ZIP ───────────────────────────────────────────────
    // level: 0 = no deflate (binary content is already compressed)
    const zipped = zipSync(zipEntries, { level: 0 });

    const safeProjectName = sanitizeFilename(project.name || "delivery");

    return new Response(zipped, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeProjectName}.zip"`,
        "Content-Length": String(zipped.length),
        "Cache-Control": "no-store",
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
