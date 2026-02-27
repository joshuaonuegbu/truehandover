import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "npm:stripe";
import { createServiceClient } from "../_shared/supabase.ts";

const markProjectPaid = async (admin: ReturnType<typeof createServiceClient>, projectId: string, creatorId?: string, details?: Record<string, any>) => {
    const { error: fileUpdateError } = await admin
        .from('files')
        .update({ locked: false })
        .eq('project_id', projectId);

    if (fileUpdateError) {
        console.error("Failed to unlock project files:", fileUpdateError.message);
    }

    const { error: projectUpdateError } = await admin
        .from('projects')
        .update({ status: 'paid' })
        .eq('id', projectId);

    if (projectUpdateError) {
        console.error("Failed to update project status:", projectUpdateError.message);
    }

    if (creatorId) {
        await admin.from('activity_logs').insert({
            user_id: creatorId,
            project_id: projectId,
            action: 'payment_received',
            details: details || {}
        });
    }
};

// Stripe requires the raw body to verify signatures. We must read req.text() instead of req.json()
serve(async (req) => {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !endpointSecret) {
        return new Response(JSON.stringify({ error: "Missing environment variables" }), { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return new Response(JSON.stringify({ error: "No signature provided" }), { status: 400 });
    }

    let event;
    let body = "";
    try {
        body = await req.text();
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
        return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 });
    }

    // Idempotency guard: only process each Stripe event once.
    const admin = createServiceClient();
    try {
        const { error: receiptError } = await admin
            .from('stripe_webhook_receipts')
            .insert({
                event_id: event.id,
                event_type: event.type,
                metadata: { livemode: event.livemode }
            });

        // Duplicate events should not error the webhook endpoint.
        if (receiptError && /duplicate key value|already exists/i.test(receiptError.message || '')) {
            return new Response(JSON.stringify({ received: true, duplicate: true }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            });
        }
        if (receiptError) {
            console.error("Failed to write webhook receipt:", receiptError.message);
        }
    } catch (e) {
        console.error("Webhook receipt insert failed:", e);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const projectId = session.metadata?.projectId;

        if (projectId) {
            // Stripe can emit completion events for sessions that are not fully paid depending on payment method.
            // We only unlock when Stripe marks the session as paid.
            if ((session as any).payment_status && (session as any).payment_status !== 'paid') {
                return new Response(JSON.stringify({ received: true, ignored: true }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
            const creatorId = session.metadata?.creatorId;
            await markProjectPaid(admin, projectId, creatorId, {
                amount: session.amount_total,
                currency: session.currency,
                source: 'checkout.session.completed'
            });
        }
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const projectId = paymentIntent.metadata?.projectId;
        const creatorId = paymentIntent.metadata?.creatorId;

        if (projectId) {
            await markProjectPaid(admin, projectId, creatorId, {
                amount: paymentIntent.amount_received || paymentIntent.amount,
                currency: paymentIntent.currency,
                source: 'payment_intent.succeeded'
            });
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    });
});
