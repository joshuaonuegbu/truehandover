import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "npm:stripe";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

type Interval = "week" | "month" | "year";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    enforceRateLimit(req, { name: "stripe-retainer-link", limit: 15, windowMs: 60_000 });

    if (req.method !== "POST") throw new Error("Method not allowed");

    const supabase = createUserClient(req);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const clientName = String(payload?.clientName || "Client").trim();
    const clientEmail = String(payload?.clientEmail || "").trim();
    const amount = Number(payload?.amount || 0);
    const interval = String(payload?.interval || "month").toLowerCase() as Interval;

    if (!clientEmail) throw new Error("Client email is required");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than 0");
    if (!["week", "month", "year"].includes(interval)) throw new Error("Invalid interval");

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, stripe_connect")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) throw new Error("Creator profile not found");

    const stripeAccountId = profile?.stripe_connect?.account_id || profile?.stripe_connect?.accountId;
    if (!stripeAccountId) throw new Error("Connect Stripe first in Settings > Payments.");

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("Stripe secret key missing");

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const appBaseUrl = (Deno.env.get("APP_BASE_URL") || "").trim().replace(/\/$/, "");
    const baseUrl = appBaseUrl || (req.headers.get("origin") || "http://localhost:5173");

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            recurring: { interval },
            product_data: {
              name: `${clientName} Retainer`,
              description: `Recurring ${interval} retainer payment secured by Sendational`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        creatorId: user.id,
        clientEmail,
        clientName,
        retainerInterval: interval,
      },
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${baseUrl}/dashboard?view=clients`,
        },
      },
      allow_promotion_codes: true,
    }, {
      stripeAccount: stripeAccountId,
    });

    return new Response(JSON.stringify({
      ok: true,
      url: paymentLink.url,
      id: paymentLink.id,
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
