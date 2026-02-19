# OAuth Deployment Guide (Google, Dropbox, OneDrive)

This app uses popup OAuth for BYOS drive connections in Settings → Storage → Cloud Drive.

## 1) Environment variables to set

Set these in your hosting platform (Production + Preview, if applicable):

- `VITE_GOOGLE_OAUTH_CLIENT_ID`
- `VITE_DROPBOX_OAUTH_CLIENT_ID`
- `VITE_ONEDRIVE_OAUTH_CLIENT_ID`

For local development, copy `.env.example` to `.env.local` and fill in values.

## 2) Redirect URI used by TrueHandover

The app callback page is:

- `https://YOUR_DOMAIN/oauth-popup.html`

For local dev:

- `http://localhost:5173/oauth-popup.html`

You must register both URLs in each OAuth provider console (replace `YOUR_DOMAIN`).

## 3) Google setup (Google Cloud Console)

1. Open Google Cloud Console → APIs & Services → Credentials.
2. Create **OAuth client ID** (Web application).
3. Add Authorized redirect URIs:
   - `https://YOUR_DOMAIN/oauth-popup.html`
   - `http://localhost:5173/oauth-popup.html`
4. Copy the **Client ID** value.
5. Set `VITE_GOOGLE_OAUTH_CLIENT_ID` to that value.
6. Ensure Drive API is enabled in the same project.

Scopes used by app:
- `https://www.googleapis.com/auth/drive.readonly`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

## 4) Dropbox setup (Dropbox App Console)

1. Open Dropbox App Console → Create app.
2. Choose **Scoped access** and app type you prefer.
3. In OAuth settings, add Redirect URIs:
   - `https://YOUR_DOMAIN/oauth-popup.html`
   - `http://localhost:5173/oauth-popup.html`
4. Copy the **App key** (used as OAuth client ID).
5. Set `VITE_DROPBOX_OAUTH_CLIENT_ID` to the App key.
6. Add permissions needed:
   - `account_info.read`
   - `files.metadata.read`

## 5) OneDrive setup (Microsoft Entra / Azure)

1. Open Microsoft Entra admin center → App registrations → New registration.
2. In Authentication, add platform **Single-page application**.
3. Add Redirect URIs:
   - `https://YOUR_DOMAIN/oauth-popup.html`
   - `http://localhost:5173/oauth-popup.html`
4. Copy **Application (client) ID**.
5. Set `VITE_ONEDRIVE_OAUTH_CLIENT_ID` to that ID.
6. API permissions (Microsoft Graph):
   - `Files.Read`
   - `User.Read`

## 6) Host-specific where to set env vars

### Vercel
- Project → Settings → Environment Variables.
- Add all 3 keys for Production (and Preview/Development if needed).
- Redeploy.

### Netlify
- Site settings → Environment variables.
- Add keys, trigger a new deploy.

### Render
- Dashboard → Web Service → Environment.
- Add keys, save, redeploy.

### Azure Static Web Apps
- Static Web App → Configuration → Application settings.
- Add keys, save, redeploy.

## 7) Verification checklist

1. Deploy with env vars set.
2. Open app → Settings → Storage → Cloud Drive.
3. Click Connect for each provider.
4. After successful auth, confirm label appears (email/name) and status is connected.
5. Try folder import in Creator to confirm provider tokens are active.

## 8) Security notes

- Keep OAuth preview in-app where possible (current behavior).
- Avoid forcing external "open in new tab" for sensitive assets; that bypasses parts of your in-app control surface.
- This is still client-side OAuth for a frontend app; for maximum control, move token exchange and provider API calls to a backend service and store tokens server-side.
