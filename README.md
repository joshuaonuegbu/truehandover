# 🛡️ Heartifact

> **The Payment Bodyguard for Freelancers.**  
> *Contract Builder, Payment-Locked Delivery Vault, and Dispute Audit Shield.*

## 💡 The Core Idea: "Escrow-Lite"

In the freelance economy, there is a constant standoff at the end of a project:
1.  **The Client's Fear:** "I don't want to pay the full amount until I see the final work."
2.  **The Freelancer's Fear:** "I don't want to send the high-res files until I know the money is in the bank."

**Heartifact solves this trust gap.** It acts as a digital intermediary without the high fees or slow processing of traditional escrow services.

## 🚀 Key Features

### 1. 🔒 Payment-Locked Delivery Vault
Instead of sending files via email or Dropbox, freelancers upload deliverables to a **Heartifact Vault**.
-   **For the Freelancer:** Files are encrypted and locked.
-   **For the Client:** They receive a "Client Preview Link." They can see low-res watermarked previews (images), read the first page of PDFs, or watch 30-second clips of videos. This provides **Proof of Work**.
-   **The Exchange:** As soon as the client pays via the integrated checkout, the Vault instantly unlocks, allowing full-resolution downloads.

### 2. 💎 Conversion-Optimized Client View
The client interface is designed psychologically to encourage payment:
-   **Personalized:** Shows the freelancer's photo and a personal note.
-   **Trust Signals:** "Secured by Heartifact", SSL badges, and clear deliverables lists.
-   **Instant Gratification:** One-click payment flow with immediate file access.

### 3. 📊 Financial Command Center
A "Cyber-Vault" aesthetic dashboard for tracking:
-   **Cash Flow:** Visualized via Recharts.
-   **Storage:** Track vault usage.
-   **Activity:** Real-time ticker of incoming deposits and locked files.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18+
*   **Styling:** Tailwind CSS (featuring Glassmorphism, Dark Mode, and Framer-motion style CSS animations)
*   **Visualization:** Recharts
*   **Icons:** Lucide React

## 🎨 Design Philosophy

The UI uses a **"Cyber-Vault" aesthetic**:
-   **Obsidian & Emerald:** Dark, rich colors representing security and money.
-   **Glassmorphism:** Translucent panels to create depth.
-   **Micro-Interactions:** Haptic-style animations and sound effects on buttons to make finance feel tangible.

## BYOS (Bring Your Own Storage)

- Current production posture: no OAuth connectors (no provider tokens stored client-side).
- You can still add **external links** to your own storage, but native uploads are the only fully protected workflow.
- Roadmap: implement server-side OAuth (PKCE) + encrypted token storage before enabling connectors. See [OAUTH_DEPLOYMENT.md](OAUTH_DEPLOYMENT.md).

## Production Checklist

- **Supabase DB:** Apply `supabase/schema.sql` and `supabase/migrations/20260224_production_hardening.sql`.
- **Supabase DB (new):** Apply `supabase/migrations/20260228_nudge_and_audit.sql`.
- **Edge Functions:** Deploy `stripe-checkout`, `stripe-onboarding`, `stripe-webhook`, `manual-payment-verify`, `client-preview`, `creator-projects`, `r2-presign`, `r2-download`, `audit-trail`, `rights-transfer`, `nudge-sender`, `client-portal`, `client-portal-token`, `stripe-retainer-link`.
- **Server env vars (Edge Functions):** `ALLOWED_ORIGINS`, `APP_BASE_URL`, `CLIENT_PORTAL_HMAC_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `RESEND_API_KEY`, `NUDGE_FROM_EMAIL`.
- **Frontend env vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_STRIPE_PUBLISHABLE_KEY`.
- **R2 bucket CORS:** Allow browser `PUT`/`GET` to your presigned URLs (otherwise uploads/downloads will fail).
- Runbook: `DEPLOYMENT.md`.

Tip: generate safe random secrets with `npm run gen:secrets`.
