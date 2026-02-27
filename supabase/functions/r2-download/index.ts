import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";
import { signR2GetObject } from "../_shared/r2.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

const isPaid = (status: string) => status === "paid" || status === "completed";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    enforceRateLimit(req, { name: "r2-download", limit: 120, windowMs: 60_000 });

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clientLink, fileId, projectId } = await req.json();
    const token = String(clientLink || "").trim();
    const requestedFileId = String(fileId || "").trim();
    const requestedProjectId = String(projectId || "").trim();
    if (!requestedFileId) throw new Error("Missing fileId");

    // Auth path (creator): if Authorization is present, allow creator to download their own file.
    const hasAuth = Boolean(req.headers.get("Authorization"));
    if (hasAuth) {
      const supabase = createUserClient(req);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Unauthorized");

      const { data: file, error } = await supabase
        .from("files")
        .select("id, project_id, external_url, storage_provider")
        .eq("id", requestedFileId)
        .single();

      if (error || !file) throw new Error("File not found");

      // Ownership is enforced by RLS (auth.uid() = user_id) on files.
      if (file.storage_provider !== "native") {
        return new Response(JSON.stringify({ url: file.external_url }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const key = String(file.external_url || "").trim();
      if (!key) throw new Error("Missing storage key for file");

      const signed = await signR2GetObject({ key, expiresInSeconds: 600 });
      return new Response(JSON.stringify({ url: signed.url }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client path (no auth): require clientLink, and require project to be paid.
    if (!token) throw new Error("Missing clientLink");

    const admin = createServiceClient();
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("id, status, client_link")
      .eq("client_link", token)
      .single();

    if (projectError || !project) throw new Error("Project not found");
    if (requestedProjectId && requestedProjectId !== project.id) throw new Error("Project mismatch");

    if (!isPaid(String(project.status || ""))) {
      return new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: file, error: fileError } = await admin
      .from("files")
      .select("id, project_id, locked, external_url, storage_provider")
      .eq("id", requestedFileId)
      .eq("project_id", project.id)
      .single();

    if (fileError || !file) throw new Error("File not found");

    if (file.storage_provider !== "native") {
      return new Response(JSON.stringify({ url: file.external_url }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = String(file.external_url || "").trim();
    if (!key) throw new Error("Missing storage key for file");

    const signed = await signR2GetObject({ key, expiresInSeconds: 600 });
    return new Response(JSON.stringify({ url: signed.url }), {
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
