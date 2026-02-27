import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "npm:stripe";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

serve(async (req) => {
    const corsHeaders = buildCorsHeaders(req);
    const preflight = handleCorsPreflight(req, corsHeaders);
    if (preflight) return preflight;

    try {
        assertCorsAllowed(req);
        enforceRateLimit(req, { name: "stripe-onboarding", limit: 30, windowMs: 60_000 });

        // 1. Verify User Session
        const originAuth = req.headers.get('Authorization');
        if (!originAuth) throw new Error("Missing auth header");

        const supabase = createUserClient(req);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized");

        // 2. Initialize Stripe
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) throw new Error("Stripe secret key missing from environment variables");
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });

        // 3. Fetch User Profile to get existing Stripe Connect ID if any
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) throw new Error("Profile not found");

        let stripeAccountId = profile.stripe_connect?.account_id;

        // 4. Create Connect Account if not present
        if (!stripeAccountId) {
            // Create a Standard Connect Account
            const account = await stripe.accounts.create({
                type: 'standard', // 'standard' is best for freelancers/agencies that want to own their stripe dashboard
            });
            stripeAccountId = account.id;

            // Save to profile
            const updatedStripeConnect = { ...(profile.stripe_connect || {}), account_id: stripeAccountId };
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ stripe_connect: updatedStripeConnect })
                .eq('id', user.id);

            if (updateError) throw new Error("Failed to save Stripe Connect ID to profile");
        }

        // 5. Build the Account Link for Onboarding
        const reqData = await req.json().catch(() => ({}));
        const appBaseUrl = (Deno.env.get('APP_BASE_URL') || '').trim().replace(/\/$/, '');
        const baseUrl = appBaseUrl || (req.headers.get('origin') || 'http://localhost:5173');
        const returnUrl = reqData.returnUrl || `${baseUrl}/#/settings`;
        const refreshUrl = reqData.refreshUrl || `${baseUrl}/#/settings`;

        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });

        return new Response(JSON.stringify({ url: accountLink.url, accountId: stripeAccountId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

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
