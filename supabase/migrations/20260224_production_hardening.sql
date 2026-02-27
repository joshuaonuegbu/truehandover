-- Production hardening migration (idempotent where possible)

BEGIN;

-- Webhook idempotency table (Stripe)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_receipts (
    event_id TEXT PRIMARY KEY,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    event_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

COMMIT;

