# 🏗️ Heartifact Backend Infrastructure Roadmap

This document outlines the backend services required to migrate Heartifact from a client-side prototype to a production-ready SaaS platform.

**Ranking Criteria:**
1.  **Critical Path:** The application cannot function or secure assets without this.
2.  **Core Feature:** Essential for the value proposition (payments/watermarking).
3.  **Optimization:** Improves user experience or operational efficiency.

---

## 🚨 Critical Path (Must Have for Launch)

### 1. Relational Database (PostgreSQL)
*   **Criticality:** 10/10
*   **Provider:** Supabase, Neon, or AWS RDS.
*   **Role:** The "Source of Truth." Stores Users, Project metadata, File references, Milestones, Payment statuses, and Audit logs.
*   **Why:** Currently, the app relies on `localStorage`. A database is required to persist data across devices, clear caches, and manage complex relationships (e.g., User -> Projects -> Files).

### 2. Authentication & Session Management
*   **Criticality:** 10/10
*   **Provider:** Auth0, Clerk, Supabase Auth, or NextAuth.
*   **Role:** Handles Sign Up, Sign In, Password Reset, and Session Tokens (JWTs).
*   **Why:** You must gate API routes. Only the project owner can edit a project; only a verified client (or an authorized guest via a secure token) can view the preview.

### 3. Secure Object Storage (Private Bucket)
*   **Criticality:** 10/10
*   **Provider:** AWS S3 or Cloudflare R2.
*   **Role:** Hosting the raw asset files.
*   **Configuration:** **Private Access Only.** No public read permissions.
*   **Why:** Browsers cannot handle large file uploads reliably in memory. You need a scalable place to store 500MB+ zip files or high-res videos securely where the public cannot guess the URL.

### 4. Signed URL Generator API
*   **Criticality:** 10/10
*   **Role:** An API endpoint that validates a user's permissions and generates a temporary, time-sensitive download link (Signed URL).
*   **Why:** This is the core "Security" product.
    *   **Scenario A (Unpaid):** Server refuses to generate link.
    *   **Scenario B (Paid):** Server generates a link valid for 5 minutes.
    *   This prevents clients from sharing the link with others or accessing files after a specific time window.

---

## ⚙️ Core Logic (The "Business" Engine)

### 5. Payment Orchestration (Stripe Connect)
*   **Criticality:** 9/10
*   **Provider:** Stripe Connect (Standard or Express).
*   **Role:** Handling OAuth onboarding for freelancers, generating Checkout Sessions, and splitting funds (Platform Fee vs. Freelancer Payout).
*   **Why:** To avoid legal/regulatory liability (money transmission laws), you should not hold the funds yourself. Stripe Connect routes money directly from Client -> Freelancer.

### 6. Webhook Listener & State Machine
*   **Criticality:** 9/10
*   **Role:** A dedicated server endpoint waiting for Stripe events (e.g., `checkout.session.completed`).
*   **Why:** The "Handover" mechanism. When money leaves the client's bank, Stripe pings this backend. The backend then:
    1.  Validates the signature.
    2.  Updates the Database status from `LOCKED` to `PAID`.
    3.  Triggers the file release logic.

### 7. Async Media Processing Queue
*   **Criticality:** 8/10
*   **Stack:** Node.js + BullMQ + Redis (or AWS Lambda).
*   **Library:** `sharp` (images), `ffmpeg` (video).
*   **Role:** Ingests high-res uploads and generates:
    *   Low-res thumbnails.
    *   Watermarked versions for the preview page.
    *   Optimized video clips.
*   **Why:** Client-side watermarking is insecure and slow for large files. The server must create the "safe" version to display to the client before payment.

---

## ✨ Experience & Optimization

### 8. Transactional Email Service
*   **Criticality:** 7/10
*   **Provider:** Resend, Postmark, or SendGrid.
*   **Role:** Sending system emails.
    *   "Files Unlocked: Here is your receipt."
    *   "New Project Received."
    *   "Payment Failed."
*   **Why:** Clients need a permanent record of the transaction and a backup way to access their files.

### 9. File Archiver / Zipper Service
*   **Criticality:** 5/10
*   **Role:** An on-the-fly streaming service that bundles multiple files into a single `.zip` download.
*   **Why:** Quality of Life. If a project has 50 files, the client wants one "Download All" button, not 50 individual clicks.

### 10. Cron Jobs / Garbage Collection
*   **Criticality:** 4/10
*   **Role:** Automated scripts running daily.
*   **Why:**
    *   **Cleanup:** Delete files from the "Trash" after 30 days to save storage costs.
    *   **Security:** Invalidate "One-Time" links that have passed their window.
    *   **Nudges:** Send reminders for unpaid invoices older than 7 days.
