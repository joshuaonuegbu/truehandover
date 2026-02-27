import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { signR2PutObject } from "../_shared/r2.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

serve(async (req) => {
    const corsHeaders = buildCorsHeaders(req);
    const preflight = handleCorsPreflight(req, corsHeaders);
    if (preflight) return preflight;

    try {
        assertCorsAllowed(req);
        enforceRateLimit(req, { name: "r2-presign", limit: 60, windowMs: 60_000 });

        const originAuth = req.headers.get("Authorization");
        if (!originAuth) throw new Error("Missing auth header");

        // 1) Verify the user via Supabase Auth and run DB queries under the user JWT (RLS-friendly).
        const supabase = createUserClient(req);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized");

        // 2) Parse request for file info
        const { filename, contentType, projectId, variant } = await req.json();
        if (!filename || !projectId) throw new Error("Missing filename or projectId");
        const normalizedVariant = (variant === "preview" ? "preview" : "original") as "preview" | "original";

        // 3) Ensure the user actually owns the project they are uploading to
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, user_id')
            .eq('id', projectId)
            .single();

        if (projectError || !project || project.user_id !== user.id) {
            throw new Error("Forbidden: You do not own this project.");
        }

        // 4) Generate highly structured, collision-resistant object key
        // Pattern: projects/{projectId}/{userId}/{variant}/{timestamp}-{filename}
        const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const objectKey = `projects/${projectId}/${user.id}/${normalizedVariant}/${Date.now()}-${safeFilename}`;
        const { uploadUrl } = await signR2PutObject({ key: objectKey, contentType, expiresInSeconds: 600 });

        return new Response(
            JSON.stringify({
                uploadUrl,
                key: objectKey,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        );

    } catch (err: any) {
        const status =
            err instanceof CorsError ? 403 :
                err instanceof RateLimitError ? 429 :
                    400;
        const retryAfter = err instanceof RateLimitError ? String(err.retryAfterSeconds) : undefined;
        return new Response(JSON.stringify({ error: err.message }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
            },
            status,
        });
    }
});
