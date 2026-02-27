import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const webhookUrl = process.env.WEBHOOK_URL || 'http://127.0.0.1:54321/functions/v1/stripe-webhook';
const projectId = process.env.PROJECT_ID || '00000000-0000-0000-0000-000000000000';
const creatorId = process.env.CREATOR_ID || '00000000-0000-0000-0000-000000000000';

if (!stripeSecretKey || !webhookSecret) {
    console.error('Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET in environment.');
    process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

const eventPayload = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
        object: {
            id: `cs_test_${Date.now()}`,
            object: 'checkout.session',
            amount_total: 250000,
            currency: 'usd',
            metadata: {
                projectId,
                creatorId,
            },
        },
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
        id: null,
        idempotency_key: null,
    },
};

const payload = JSON.stringify(eventPayload);
const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
});

const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
    },
    body: payload,
});

const body = await response.text();
console.log(`Webhook status: ${response.status}`);
console.log(body);

if (!response.ok) {
    process.exit(1);
}
