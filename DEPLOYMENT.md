# Deployment Runbook (Production)

This app is a Vite + React SPA backed by Supabase (DB/Auth + Edge Functions), Stripe Connect, and Cloudflare R2.

## Current status snapshot (2026-02-24)

- `0) Prereqs`: ⚠️ Partially verifiable (dashboard prerequisites cannot be fully checked from repo)
- `1) Create/migrate DB`: ✅ Files exist, ⚠️ execution against remote DB not fully verifiable here
- `2) Supabase CLI`: ✅ Done (`npx supabase --version` returns `2.76.14`)
- `3) Repo linked`: ⚠️ Cannot verify from repo only (requires Supabase account/project context)
- `4) Function env vars`: ❌ Not done (missing required keys in `supabase/.env.local`)
- `5) Deploy functions`: ⚠️ Function code exists; deployment to hosted project cannot be verified here
- `6) Stripe webhook`: ⚠️ Cannot verify dashboard endpoint/subscription from local repo
- `7) R2 CORS`: ⚠️ Cannot verify Cloudflare dashboard CORS from local repo
- `8) Frontend deploy env`: ❌ Not done in `.env.local` for this runbook path (`prod:check` fails)
- `9) End-to-end verification`: ⚠️ Not yet evidenced in repo/tool output

`npm run prod:check` current result: `NEEDS FIXES`.

---

## Why there are two env files

- `.env.example`: committed template (safe, no secrets), used to document required keys for teammates/CI.
- `.env.local`: real machine-specific values (secrets), intentionally gitignored.

Why not just one file?
- One committed env file would risk exposing secrets in git.
- Teams need a shareable template (`.env.example`) plus private real values (`.env.local`).
- Different environments (local/staging/prod) usually need different values.

Important for this repo:
- `scripts/prod-check.mjs` reads `.env.local` and `supabase/.env.local` only.
- Your `.env` currently has Supabase keys, but `.env.local` does not, so `prod:check` fails.

---

## 0) Prereqs

Required:
- A Supabase project (DB + Edge Functions)
- A Stripe account (Connect enabled) + Stripe CLI (optional, recommended)
- A Cloudflare R2 bucket + access keys
- A deployed frontend URL (your `APP_BASE_URL`)

Status:
- ⚠️ Partially verifiable from repo; external dashboards/accounts cannot be fully confirmed here.

## 1) Create / migrate the Supabase database

In Supabase Dashboard → SQL Editor:

1. Run `supabase/schema.sql`
2. Run `supabase/migrations/20260224_production_hardening.sql`

Expected outcome:
- RLS enabled on `profiles`, `projects`, `files`, `milestones`, `credentials`
- `stripe_webhook_receipts` exists for webhook idempotency

Status:
- ✅ `supabase/schema.sql` exists and includes RLS policies + `stripe_webhook_receipts` table.
- ✅ `supabase/migrations/20260224_production_hardening.sql` exists.
- ⚠️ Remote execution not fully provable from local repo state.

## 2) Install Supabase CLI (required to deploy functions)

Command:

`npx supabase --version`

Status:
- ✅ Done (`2.76.14`).

## 3) Link the repo to your Supabase project

From repo root:

`npx supabase login`

`npx supabase link --project-ref <YOUR_PROJECT_REF>`

Status:
- ⚠️ Cannot verify final linked state from checked-in files alone.
- ✅ Helper script exists: `scripts/deploy-supabase.ps1` runs `supabase link`.

## 4) Configure Edge Function environment variables

Create `supabase/.env.local` from `supabase/.env.example` and fill:

- `ALLOWED_ORIGINS` (comma-separated; must include your `APP_BASE_URL`)
- `APP_BASE_URL` (no trailing slash)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

Then push secrets:

`npx supabase secrets set --env-file supabase/.env.local`

Status:
- ❌ Not done (current `supabase/.env.local` only has `STRIPE_SECRET_KEY`).
- ⚠️ Missing: `ALLOWED_ORIGINS`, `APP_BASE_URL`, `STRIPE_WEBHOOK_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.

## 5) Deploy Edge Functions

Deploy required functions:

`npx supabase functions deploy stripe-checkout`
`npx supabase functions deploy stripe-onboarding`
`npx supabase functions deploy stripe-webhook`
`npx supabase functions deploy client-preview`
`npx supabase functions deploy creator-projects`
`npx supabase functions deploy r2-presign`
`npx supabase functions deploy r2-download`

Status:
- ✅ All 7 function source folders exist locally.
- ⚠️ Hosted deployment state not verifiable from local repo alone.

## 6) Configure Stripe webhook endpoint

In Stripe Dashboard → Developers → Webhooks:

- Add endpoint:
  - `https://<YOUR_PROJECT_REF>.functions.supabase.co/stripe-webhook`
- Events:
  - `checkout.session.completed`
- Copy signing secret into `STRIPE_WEBHOOK_SECRET`

Status:
- ⚠️ Cannot verify Stripe Dashboard setup from local repo.
- ❌ `STRIPE_WEBHOOK_SECRET` currently missing in `supabase/.env.local`.

## 7) Configure Cloudflare R2 bucket CORS (required)

R2 must allow browser requests to presigned URLs.

In Cloudflare Dashboard → R2 → bucket → CORS:

- Allow origins: your `APP_BASE_URL` (and preview URLs)
- Allow methods: `GET`, `PUT`, `HEAD`
- Allow headers: `content-type`
- Expose headers: optional

Tip: after setting `ALLOWED_ORIGINS`, run `npm run prod:check` to print suggested CORS JSON.

Status:
- ⚠️ Cannot verify Cloudflare dashboard CORS here.
- ❌ Local function env values required to generate final CORS suggestion are currently incomplete.

## 8) Deploy the frontend

Set frontend env vars in your hosting platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Optional: `VITE_STRIPE_PUBLISHABLE_KEY`

Build:

`npm run build`

Status:
- ⚠️ `.env` has Supabase keys, but runbook/prod-check use `.env.local`.
- ❌ `npm run prod:check` currently fails frontend env check because `.env.local` is missing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## 9) Verification (end-to-end)

1. Log in as creator, connect Stripe (Settings → Payments).
2. Create a project, upload at least one image (native).
3. Open client link in private window (locked preview visible).
4. Click Pay, complete checkout:
   - Redirect `/#/c/<token>?payment=success`
   - Unlock within ~5–20 seconds
5. Download original via short-lived signed URL.

Local helper:

`npm run test:webhook`

Status:
- ⚠️ Not fully verified yet (no recorded passing E2E run in this repo context).

---

## Next actions to reach green quickly

1. Add required frontend keys to `.env.local` (or update `prod-check` if you intentionally want `.env`).
2. Complete `supabase/.env.local` with all required function keys.
3. Run:
   - `npx supabase secrets set --env-file supabase/.env.local`
   - Deploy 7 functions
4. Configure Stripe webhook endpoint + signing secret.
5. Configure R2 CORS.
6. Re-run `npm run prod:check` until it returns `Result: OK`.
