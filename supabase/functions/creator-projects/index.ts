import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { signR2GetObject } from "../_shared/r2.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

type DbProject = Record<string, any>;
type DbFile = Record<string, any>;

const mapFile = async (file: DbFile) => {
  const base = {
    id: file.id,
    name: file.name,
    size: file.size || "",
    type: file.type,
    locked: Boolean(file.locked),
    version: Number(file.version || 1),
    uploadDate: file.upload_date || file.created_at || new Date().toISOString(),
    tag: file.tag || "",
    storageProvider: file.storage_provider || "native",
    includeInLibrary: file.include_in_library !== false,
    milestoneId: file.milestone_id || undefined,
    folderName: file.folder_name || undefined,
    importSourceUrl: file.import_source_url || undefined,
    metadata: file.metadata || {},
  };

  // For platform storage, we store object keys in DB and return signed URLs.
  // For now: preview_url = preview object key, external_url = original object key (never returned as-is).
  if (file.storage_provider === "native" && file.preview_url) {
    const signed = await signR2GetObject({ key: file.preview_url, expiresInSeconds: 600 });
    return { ...base, previewUrl: signed.url };
  }

  // For legacy/BYOS links, treat preview_url/external_url as direct URLs.
  return {
    ...base,
    previewUrl: file.preview_url || undefined,
    externalUrl: file.external_url || undefined,
  };
};

const mapProject = async (project: DbProject) => {
  const files: DbFile[] = Array.isArray(project.files) ? project.files : [];
  const mappedFiles = await Promise.all(files.map(mapFile));

  return {
    id: project.id,
    name: project.name,
    description: project.description || "",
    client: project.client || { name: "", email: "" },
    amount: Number(project.amount || 0),
    status: project.status,
    createdAt: project.created_at || new Date().toISOString(),
    dueDate: project.due_date || "",
    files: mappedFiles,
    milestones: project.milestones || [],
    // Credentials are intentionally kept local-only for now (no passwords stored server-side).
    credentials: [],
    requiresSignature: Boolean(project.requires_signature),
    enableTips: project.enable_tips !== false,
    paymentMethods: project.payment_methods || {},
    useMilestones: Boolean(project.use_milestones),
    clientLink: project.client_link,
    type: project.type || undefined,
    theme: project.theme || undefined,
    message: project.message || undefined,
    enableClientLibrary: project.enable_client_library !== false,
    accessConfig: project.access_config || undefined,
    clientViewedAt: project.client_viewed_at || undefined,
    showWatermark: project.show_watermark !== false,
    showProtectedLabel: project.show_protected_label !== false,
  };
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    enforceRateLimit(req, { name: "creator-projects", limit: 240, windowMs: 60_000 });

    if (req.method !== "GET" && req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createUserClient(req);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*, files(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = await Promise.all((projects || []).map(mapProject));
    return new Response(JSON.stringify({ projects: mapped }), {
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
