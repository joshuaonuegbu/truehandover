import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { signR2GetObject } from "../_shared/r2.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

type DbFile = Record<string, any>;

const isPaid = (status: string) => status === "paid" || status === "completed";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    enforceRateLimit(req, { name: "client-preview", limit: 120, windowMs: 60_000 });

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clientLink } = await req.json();
    const token = String(clientLink || "").trim();
    if (!token) throw new Error("Missing clientLink");

    const admin = createServiceClient();

    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("*")
      .eq("client_link", token)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark first view timestamp (best-effort).
    if (!project.client_viewed_at) {
      await admin
        .from("projects")
        .update({ client_viewed_at: new Date().toISOString() })
        .eq("id", project.id);
    }

    const { data: files, error: fileError } = await admin
      .from("files")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });

    if (fileError) throw fileError;

    const paid = isPaid(String(project.status || ""));

    const mappedFiles = await Promise.all(
      (files || []).map(async (f: DbFile) => {
        const lockedEffective = Boolean(f.locked) || !paid;

        let previewUrl: string | undefined;
        if (f.storage_provider === "native" && f.preview_url) {
          previewUrl = (await signR2GetObject({ key: f.preview_url, expiresInSeconds: 600 })).url;
        } else {
          previewUrl = f.preview_url || undefined;
        }

        let downloadUrl: string | undefined;
        if (!lockedEffective) {
          if (f.storage_provider === "native" && f.external_url) {
            downloadUrl = (await signR2GetObject({ key: f.external_url, expiresInSeconds: 300 })).url;
          } else if (f.external_url) {
            downloadUrl = f.external_url;
          }
        }

        return {
          id: f.id,
          name: f.name,
          size: f.size || "",
          type: f.type,
          locked: lockedEffective,
          previewUrl,
          downloadUrl,
          // For BYOS links we may surface externalUrl; for native we do not.
          externalUrl: f.storage_provider !== "native" ? (f.external_url || undefined) : undefined,
          version: Number(f.version || 1),
          uploadDate: f.upload_date || f.created_at || new Date().toISOString(),
          tag: f.tag || "",
          storageProvider: f.storage_provider || "native",
          includeInLibrary: f.include_in_library !== false,
          milestoneId: f.milestone_id || undefined,
          folderName: f.folder_name || undefined,
          importSourceUrl: f.import_source_url || undefined,
          metadata: f.metadata || {},
        };
      })
    );

    const safeProject = {
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
      credentials: [], // never expose credentials to clients
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

    return new Response(JSON.stringify({ project: safeProject }), {
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
