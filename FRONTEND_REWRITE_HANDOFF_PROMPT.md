# Sendational Frontend Rewrite Handoff Prompt (Deep Context)

Use this as a copy/paste prompt for another coding LLM.

---

You are rebuilding the entire frontend from scratch for a product called Sendational.

You are NOT doing a visual refactor. You are designing and implementing a new UI system and frontend architecture while preserving current product behavior, route coverage, and backend integration contracts.

## 0) High-Level Goal

Build a clean, production-grade frontend that keeps the same business capabilities as the current app:
- Secure client delivery links
- Payment-gated file unlocks
- Creator workflow from draft to publish
- Client preview and payment flow
- Reporting, reminders, settings, storage, and client portal

You can completely replace the visual direction.

## 1) What This Product Is

Sendational is a secure handoff platform for freelancers, agencies, and creative studios.

Core trust problem:
- Creators do not want to release final files before payment.
- Clients want proof before they pay.

Core solution:
- Creator uploads or links deliverables.
- Client receives a secure preview link.
- Client can review protected previews, then pay.
- Full assets unlock after payment or manual verification.

## 2) User Roles

1. Creator (authenticated workspace user)
- Creates projects
- Uploads files or imports BYOS links
- Configures payment rails and access terms
- Publishes secure client links
- Tracks activity, reports, and clients

2. Client (public link user)
- Opens `/c/:token`
- Reviews protected assets
- Pays via Stripe or follows manual transfer instructions
- Gets unlocked downloads after payment state changes

3. Client Portal viewer (tokenized)
- Opens `/portal/:token`
- Sees a read-only list of all projects for one client email

## 3) Current Frontend Snapshot (Important Context)

Current codebase state:
- Stack: React + TypeScript + Vite + Tailwind CSS v4
- Routing: `react-router-dom`
- Charts: `recharts`
- Icons: `lucide-react`
- QR: `qrcode.react`
- Data/Auth: Supabase (`@supabase/supabase-js`)
- PWA: `vite-plugin-pwa`

Notable file scale:
- `App.tsx` is a large monolith (~6094 lines)
- `components/ClientPreviewPage.tsx` (~2825 lines)
- `components/LandingPage.tsx` (~2752 lines)
- `components/CreatorPage.tsx` (~2025 lines)

Major architectural issue to fix:
- Business logic and UI are heavily coupled in large files.
- Rewrite should split into clear domains, components, and route modules.

## 4) Route Map and Required Behavior

Public routes:
- `/` Landing/marketing page with conversion widget and quick-start behavior
- `/signin` Auth page
- `/c/:token` Client preview page using secure token
- `/portal/:token` Read-only client portal
- `/app` Must redirect to `/workspace`

Authenticated app shell routes:
- `/workspace`
- `/dashboard`
- `/projects`
- `/activity`
- `/reports`
- `/quotes`
- `/settings`
- `/storage`
- `/help`
- `/trash`

Creator routes:
- `/create`
- `/editor/:id`
- `/preview/:id`

Behavior details to preserve:
- `/dashboard?view=clients` toggles dashboard into clients/rolodex mode.
- In full layout mode, `/workspace` redirects to `/dashboard` while preserving `?quickstart=1`.

## 5) Current App Shell Behavior You Must Preserve Functionally

The current app supports 3 shell behaviors:

1. Docked workspace mode
- Delivery widget is persistent.
- Page content sits beside it on larger screens.

2. Full mode
- Traditional full-width page layout.
- Workspace route redirects to dashboard panel.

3. Small-screen widget/sheet mode
- Widget is persistent backdrop.
- Routes render as bottom-sheet style overlays on top.
- Mobile bottom nav exists for core routes.

Global interactions to preserve:
- Command palette (`Ctrl/Cmd+K`)
- Keyboard route chords: `g` then key (`d,v,a,r,s,c,q,h`)
- Global drag/drop file capture into quick-delivery draft
- Notifications menu + profile menu
- Theme mode: `light | dark | system`
- Privacy mode that blurs/scrambles financial values
- Toast notifications
- Offline strip + back-online strip + service worker update strip

## 6) Data Contract (Frontend Domain Types)

Keep compatibility with these core shapes and semantics:

`ProjectStatus`
- `draft`
- `awaiting_signature`
- `awaiting_payment`
- `payment_verification`
- `paid`
- `completed`

`AccessConfig`
- `mode`: `permanent | 7_day | one_time`
- `expiresAt?`
- `viewCount?`
- `scopeCreepPaused?`
- `pauseReason?`

`FileAsset`
- `id, name, size, type, locked`
- `previewUrl?, externalUrl?, downloadUrl?`
- `storageProvider` (`native`, `drive`, `dropbox`, `onedrive`, `box`, `wetransfer`, `s3`)
- `version, uploadDate, tag, metadata`
- `milestoneId?, includeInLibrary?, importSourceUrl?, folderName?`

`Project`
- `id, name, description`
- `client { name, email, phone?, company?, avatar? }`
- `amount, status, createdAt, dueDate`
- `files[], milestones[], credentials[]`
- `requiresSignature, enableTips`
- `paymentMethods { stripeEnabled?, venmo?, cashapp?, paypal?, zelle?, bankInfo? }`
- `clientLink`
- `theme` (wallpaper/pattern/layout/lightbox/brand colors)
- `message`
- `enableClientLibrary`
- `accessConfig`
- `clientViewedAt`
- `showWatermark, showProtectedLabel`
- `revisionRequests[]`

`UserProfile`
- Identity fields
- `stripeConnect { accountId, connected, displayName, chargesEnabled, payoutsEnabled }`
- `paymentMethods`
- `agencySettings`
- `storageSettings`
- `profilePreferences`

## 7) Backend Integration Contract (Do Not Break)

Frontend env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- optional `VITE_STRIPE_PUBLISHABLE_KEY`

Frontend invokes these edge functions/services:

1. `creator-projects`
- Returns creator projects (with mapped file URLs)

2. `client-preview`
- Input: `{ clientLink }`
- Output: `{ project }`
- Handles paid vs locked file URL exposure

3. `stripe-checkout`
- Input: `{ clientLink }`
- Output: `{ url, projectId }`

4. `manual-payment-verify`
- Input: `{ projectId }`
- Output: `{ success: true, status: "paid" }` on success

5. `stripe-onboarding`
- Input: optional return/refresh URLs
- Output: onboarding URL + Stripe account id

6. `stripe-retainer-link`
- Input: `{ clientName, clientEmail, amount, interval }`
- Output: `{ ok, url, id }`

7. `client-portal-token`
- Input: `{ clientEmail, ttlDays? }`
- Output: `{ ok, token, expiresAt }`

8. `client-portal`
- Input: `{ portalToken }`
- Output: `{ portal }`

9. `nudge-sender`
- Input: `{ projectId }` in manual mode
- Enforces cooldown and sends reminder email

10. `r2-presign`
- Input: `{ filename, contentType, projectId, variant }`
- Output: `{ uploadUrl, key }`

11. `r2-download`
- Input: `{ clientLink, fileId, projectId? }` (or auth path for creator)
- Output: signed download URL

12. `r2-zip-export`
- Input: `{ clientLink }`
- Output: ZIP blob stream for native files

13. Watermark proxy
- `r2-watermark-proxy?clientLink=...&fileId=...`
- Used for protected image previews without exposing raw object URLs

Other report-related APIs:
- `audit-trail` (PDF blob)
- `rights-transfer` (PDF blob)

Important storage rules:
- No secret cloud credentials in browser.
- Native uploads must use presigned URL flow.
- BYOS links are supported, but fully protected flow is native storage.

## 8) Current Feature Inventory (What Exists Today)

### A) Landing (`/`)
- Multi-section marketing page
- Theme controls in nav
- Video modal and Get Started modal
- Cookie consent banner
- Quick file drop/picker flow that seeds quick-delivery draft
- Embedded "Try it now" widget with:
  - Storage mode toggle (local/cloud)
  - File add or cloud-provider stub selection
  - Client mini-form
  - Quick quote block
  - CTA into signup/workspace

### B) Auth (`/signin`)
- Combined sign-in/sign-up screen
- Supabase password auth
- Theme toggle
- Return path handling (`returnTo`)
- Optional mode-switch/back behavior

### C) Workspace Shell
- Header with nav, profile menu, notification menu
- Command palette + keyboard navigation
- Global drag/drop capture for files
- Help floating action button
- Mobile bottom nav for key routes

### D) Delivery Widget (Core Surface)
- Views: `create`, `projects`, `briefing`
- Quick project and quick quote patterns
- Local draft autosave in `localStorage`
- Quick publish flow builds `Project` object and link token
- Share-ready state includes URL, QR, and send actions

### E) Dashboard (`/dashboard`)
- Overview metrics and cards
- Status rollups
- Recent projects and client activity cards
- `?view=clients` loads client rolodex content

### F) Clients / Rolodex (dashboard clients mode)
- Client summaries aggregated from projects
- LTV, pending value, project counts, tier badges
- Search/sort/filter behavior
- Expandable per-client project rows
- Nudge action for awaiting payment
- Portal link generation/copy/open
- Retainer link generation
- Brand-kit save per client email

### G) Vault (`/vault`)
- Project browsing (grid/list-like cards)
- Status context + file counts + value
- Open editor/preview
- QR/share modal patterns

### H) Creator and Editor (`/create`, `/editor/:id`) [Critical]
- Tabs: `info`, `assets`, `portal`, `access`
- Local draft restore/autosave
- Core project/client/payment form
- Theme controls (wallpaper, pattern, lightbox/layout variants)
- File upload flow with progress
- Native upload path:
  - Ensure project exists
  - Presign original and preview objects
  - Upload via presigned PUT
  - Store keys/metadata/hash
- Link import path for BYOS URLs
- Duplicate URL/file prevention
- Inline file rename/resize and removal
- Credential blocks add/remove
- Milestone add/edit/remove
- Access mode controls with warnings (`permanent`, `7_day`, `one_time`)
- Scope-creep pause reason controls
- Stripe/manual rails controls
- Live embedded preview panel on the right

### I) Client Preview (`/preview/:id`, `/c/:token`) [Critical]
- Protected delivery UI
- File filters by type
- Grid/list asset views
- Rich lightbox with media/doc handling
- Revision request pins/messages in lightbox
- Credential vault widget (locked vs unlocked rendering)
- Payment terminal supports:
  - Stripe checkout
  - Manual "I sent payment" path (enters verification state)
  - Creator-side manual verify unlock path
- Lock/unlock behavior tied to project status and file lock
- One-time access UI logic (local key currently used for frontend gating)
- 7-day and one-time indicators
- Optional client library of prior paid projects by same client email
- Business preview device simulator modes (desktop/tablet/mobile/foldable)

### J) Client Portal (`/portal/:token`)
- Read-only project hub for one client email
- Totals (project count and value)
- Status badges
- Links to each delivery (`/c/:clientLink`)

### K) Activity (`/activity`)
- Ledger-style grouped timeline by date
- Filters: all/financial/access/system
- Search
- Topline metrics
- Privacy blur/scramble support for monetary values

### L) Reports (`/reports`)
- Time-range controls and charted metrics
- Client concentration and revenue trends
- Audit log section
- Per-project actions:
  - Download audit trail PDF
  - Download rights transfer certificate
  - Send reminder nudge
- Exports:
  - Ledger CSV
  - Monthly statement CSV/PDF
  - Annual tax ledger CSV/PDF
  - Portfolio overview PDF
  - Calendar ICS

### M) Quotes (`/quotes`)
- Quote builder with line items, tax, notes
- Load client template from prior projects
- Quote text generation
- Copy to clipboard
- Download `.txt`
- Download branded PDF

### N) Settings (`/settings`)
- Tabs: `profile`, `payments`, `agency`, `storage`, `developer`
- Profile + avatar
- Stripe Connect onboarding and state
- Manual payment method fields
- Agency settings (branding/domain-related fields)
- Storage mode configuration and validation messaging
- Developer demo-mode toggle
- Save profile + sign out

### O) Storage (`/storage`)
- Tabs: `overview`, `configuration`, `analytics`, `cleanup`
- Usage bars and capacity visuals
- Mode switching (`platform`, `drive`, `s3`)
- Provider metadata fields
- Trend chart and cleanup suggestions

### P) Help (`/help`)
- FAQ search
- Category filters
- Accordion Q/A

### Q) Trash (`/trash`)
- Search and view toggles
- Restore and delete confirmations
- Urgency labels
- Empty-all flow
- Dataset is currently mocked

### R) Test Lab (`/test-lab`)
- Placeholder/dev surface

## 9) Known Gaps / Prototype Areas in Current Frontend

Preserve functionality but you may improve implementation quality:
- `App.tsx` is overgrown and should be decomposed.
- Demo mode exists and is heavily used for seeded mock data.
- Some surfaces are partially mocked (`trash`, parts of storage analytics).
- BYOS folder import requires provider auth not fully enabled in browser flow.
- Credentials are intentionally local-only right now (`credentials: []` from server mappings).
- Visual style is heavily stylized and inconsistent; this can be replaced entirely.

### Plug-And-Play Backend Truth (Important)

To avoid integration breakage, treat these as current-source-of-truth constraints:
- `credentials[]` is not currently persisted by the frontend DB write path; creator/client fetch paths return `credentials: []`.
- `revisionRequests[]` is not currently persisted via backend endpoints; preview revisions are effectively local/UI state.
- Milestones are modeled in frontend types, but current project upsert path only writes `use_milestones` and per-file `milestone_id`; milestone CRUD is not wired through dedicated backend calls.
- `one_time` access mode is currently enforced primarily in frontend behavior (local viewed key), not strict server-side one-time token invalidation.
- For native storage files, DB stores object keys and runtime URLs are minted by edge functions. Do not persist signed URLs as canonical file data.

## 10) What You Are Allowed To Change

You MAY change:
- Entire visual language
- Component library and layout system
- Internal state architecture
- Folder structure and code organization
- How shell modes are implemented, as long as behavior remains equivalent

You MUST keep:
- Route coverage and deep-linkability
- Core workflows and business semantics
- Backend function contracts and env var assumptions
- Mobile-first usability

## 11) Rewrite Requirements

2. Keep all critical user flows working.
3. Keep backend integration contracts intact.
4. Improve consistency, clarity, and accessibility.
5. Keep performance strong (route splitting, no giant route files).
6. Preserve payment-state-driven lock/unlock logic.
7. Preserve access mode behavior semantics.

## 12) Deliverables Required From You

1. New frontend architecture proposal
- Route modules
- Domain/state layers
- Shared UI primitives

2. New design system
- Tokens (color/type/spacing/radius/shadow/motion)
- Component primitives
- Accessibility rules

3. Full implementation across all routes listed above

4. Migration map
- old surface -> new files/modules

5. Parity checklist
- prove each critical workflow works

6. Testing plan
- route smoke tests
- creator publish flow
- client payment unlock flow
- report export actions

## 13) Non-Negotiable Acceptance Criteria

The rewrite is only acceptable if:
- Creator can create/edit/publish projects with assets and payment gating.
- Client preview links load and enforce locked/unlocked behavior correctly.
- Stripe checkout/manual verification flows still unlock appropriately.
- Reports/audit/reminder flows are still available.
- Settings/storage/Stripe onboarding remain operational.
- Mobile UX is complete and intentional (not desktop squeezed down).

If unsure, preserve existing business behavior over inventing new logic.

---

Now start by providing:
1. UI direction and principles
2. Proposed architecture
3. Step-by-step implementation plan
4. Then begin coding
