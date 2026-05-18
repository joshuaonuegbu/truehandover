import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "npm:stripe";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

serve(async (req) => {
    const corsHeaders = buildCorsHeaders(req);
    const preflight = handleCorsPreflight(req, corsHeaders);
    if (preflight) return preflight;

    try {
        assertCorsAllowed(req);
        enforceRateLimit(req, { name: "stripe-checkout", limit: 20, windowMs: 60_000 });

        if (req.method !== 'POST') throw new Error('Method not allowed');

        const { clientLink } = await req.json();
        const token = String(clientLink || '').trim();
        if (!token) throw new Error("Missing clientLink");

        // Using the service role key to securely fetch project details without needing the client to be authenticated.
        const supabase = createServiceClient();

        // 1. Fetch Project and Creator Profile
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(`
            *,
            profiles(stripe_connect)
        `)
            .eq('client_link', token)
            .single();

        if (projectError || !project) throw new Error("Project not found");

        const stripeAccountId = project.profiles?.stripe_connect?.account_id;
        if (!stripeAccountId) {
            throw new Error("Creator has not configured payments yet.");
        }

        if (!project.amount || project.amount <= 0) {
            throw new Error("Project amount must be greater than zero to checkout.");
        }

        // 2. Initialize Stripe
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) throw new Error("Stripe secret key missing from environment variables");
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });

        // 3. Create Stripe Checkout Session (Direct Charge)
        const appBaseUrl = (Deno.env.get('APP_BASE_URL') || '').trim().replace(/\/$/, '');
        const baseUrl = appBaseUrl || (req.headers.get('origin') || 'http://localhost:5173');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: project.name,
                        description: "Secure delivery via Sendational",
                    },
                    unit_amount: Math.round(project.amount * 100), // convert to cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            payment_intent_data: {
                metadata: {
                    projectId: project.id,
                    creatorId: project.user_id,
                },
            },
            success_url: `${baseUrl}/c/${project.client_link}?payment=success`,
            cancel_url: `${baseUrl}/c/${project.client_link}?payment=cancelled`,
            metadata: {
                projectId: project.id,
                creatorId: project.user_id,
            }
        }, {
            stripeAccount: stripeAccountId, // Charge directly to the creator's connected Stripe account
        });

        return new Response(JSON.stringify({ url: session.url, projectId: project.id }), {
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
