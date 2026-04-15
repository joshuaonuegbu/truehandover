# BYOS OAuth Deployment Guide (Google Drive, Dropbox, OneDrive)

> Status (Feb 24, 2026): **Disabled** in the current production-hardening posture.
>
> Rationale: browser-held OAuth tokens + direct provider API calls are not acceptable for production security.
> Current BYOS support is **links-only** (paste a share link). For fully protected delivery, use **native uploads**.

This document is retained as a reference for a future secure connector implementation.

Historically, Heartifact supported "Bring Your Own Storage" (BYOS) via cloud-drive connections in:

`Settings -> Storage -> Cloud Drive`

## The Non-Negotiable Reality

If you want Heartifact to show an OAuth consent screen like "Heartifact wants access to your Drive",
you (Heartifact) must register an OAuth app with each provider at least once.

Your customers do **not** create OAuth keys. They simply click **Connect** and grant permissions.

## 1) Environment Variables (Frontend)

Set these in your hosting platform (Production + Preview):

- `VITE_GOOGLE_OAUTH_CLIENT_ID`
- `VITE_DROPBOX_OAUTH_CLIENT_ID`
- `VITE_ONEDRIVE_OAUTH_CLIENT_ID`

For local development, copy `.env.example` to `.env.local` and fill in values.

## 2) Redirect URI

The callback page used by this app:

- `https://YOUR_DOMAIN/oauth-popup.html`

Local dev (this repo runs Vite on port 3000):

- `http://localhost:3000/oauth-popup.html`

You must register both URLs in each OAuth provider console (replace `YOUR_DOMAIN`).

## 3) Google Setup (Google Cloud Console)

1. Google Cloud Console -> APIs & Services -> Credentials
2. Create **OAuth client ID** (Web application)
3. Add Authorized redirect URIs:
   - `https://YOUR_DOMAIN/oauth-popup.html`
   - `http://localhost:3000/oauth-popup.html`
4. Copy the **Client ID**
5. Set `VITE_GOOGLE_OAUTH_CLIENT_ID` to that value
6. Ensure Drive API is enabled in the same project

Scopes used by the app:

- `https://www.googleapis.com/auth/drive.readonly`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

## 4) Dropbox Setup (Dropbox App Console)

1. Dropbox App Console -> Create app
2. Choose **Scoped access** and the app type you prefer
3. Add Redirect URIs:
   - `https://YOUR_DOMAIN/oauth-popup.html`
   - `http://localhost:3000/oauth-popup.html`
4. Copy the **App key** (this is the OAuth client ID)
5. Set `VITE_DROPBOX_OAUTH_CLIENT_ID` to that value
6. Add permissions:
   - `account_info.read`
   - `files.metadata.read`

## 5) OneDrive Setup (Microsoft Entra / Azure AD)

1. Microsoft Entra admin center -> App registrations -> New registration
2. In Authentication, add platform **Single-page application**
3. Add Redirect URIs:
   - `https://YOUR_DOMAIN/oauth-popup.html`
   - `http://localhost:3000/oauth-popup.html`
4. Copy **Application (client) ID**
5. Set `VITE_ONEDRIVE_OAUTH_CLIENT_ID` to that value
6. API permissions (Microsoft Graph):
   - `Files.Read`
   - `User.Read`

## 6) Verification Checklist

1. Deploy with env vars set.
2. Open app -> Settings -> Storage -> Cloud Drive.
3. Click Connect for each provider.
4. Confirm the UI shows a connected label (email/name).
5. Try folder import in Creator to confirm provider auth is active.

## 7) Security Notes (Recommended Production Direction)

This repo currently demonstrates a frontend-only OAuth + import flow.

For maximum security in a real product, you should:

- Use Authorization Code + PKCE (not implicit tokens)
- Do token exchange and provider API calls on a backend service
- Store tokens server-side (encrypted), and never expose provider tokens or real storage URLs to clients
- Only return short-lived signed download URLs after payment clears
