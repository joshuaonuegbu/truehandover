export type ByosOAuthProvider = 'google' | 'dropbox' | 'onedrive';

interface OAuthResult {
    accessToken: string;
    expiresAt?: string;
    accountLabel?: string;
}

const getClientId = (provider: ByosOAuthProvider) => {
    const env = (import.meta as any).env || {};
    if (provider === 'google') return env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
    if (provider === 'dropbox') return env.VITE_DROPBOX_OAUTH_CLIENT_ID as string | undefined;
    return env.VITE_ONEDRIVE_OAUTH_CLIENT_ID as string | undefined;
};

const getRedirectUri = () => {
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    return new URL('oauth-popup.html', url.toString()).toString();
};

const buildOAuthUrl = (provider: ByosOAuthProvider, state: string) => {
    const redirectUri = getRedirectUri();
    const clientId = getClientId(provider);
    if (!clientId) {
        throw new Error(`Missing OAuth client ID for ${provider}. Set ${provider === 'google' ? 'VITE_GOOGLE_OAUTH_CLIENT_ID' : provider === 'dropbox' ? 'VITE_DROPBOX_OAUTH_CLIENT_ID' : 'VITE_ONEDRIVE_OAUTH_CLIENT_ID'} in your deployment environment and add this redirect URI in the provider console: ${redirectUri}`);
    }

    if (provider === 'google') {
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'token');
        url.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
        url.searchParams.set('include_granted_scopes', 'true');
        url.searchParams.set('prompt', 'consent');
        url.searchParams.set('state', state);
        return url.toString();
    }

    if (provider === 'dropbox') {
        const url = new URL('https://www.dropbox.com/oauth2/authorize');
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'token');
        url.searchParams.set('state', state);
        return url.toString();
    }

    const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('response_mode', 'fragment');
    url.searchParams.set('scope', 'Files.Read User.Read');
    url.searchParams.set('state', state);
    return url.toString();
};

const fetchAccountLabel = async (provider: ByosOAuthProvider, accessToken: string): Promise<string | undefined> => {
    try {
        if (provider === 'google') {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (!response.ok) return undefined;
            const data = await response.json();
            return data.email || data.name;
        }

        if (provider === 'dropbox') {
            const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (!response.ok) return undefined;
            const data = await response.json();
            return data.email || data.name?.display_name;
        }

        const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,userPrincipalName', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!response.ok) return undefined;
        const data = await response.json();
        return data.userPrincipalName || data.displayName;
    } catch {
        return undefined;
    }
};

export const connectByosProvider = (provider: ByosOAuthProvider): Promise<OAuthResult> => {
    const state = `${provider}:${Math.random().toString(36).slice(2)}:${Date.now()}`;
    const authUrl = buildOAuthUrl(provider, state);

    const width = 540;
    const height = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
    const popup = window.open(authUrl, `byos-oauth-${provider}`, `width=${width},height=${height},left=${left},top=${top}`);

    if (!popup) {
        return Promise.reject(new Error('Popup blocked. Please allow popups and try again.'));
    }

    return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            cleanup();
            reject(new Error('Connection timed out. Please try again.'));
        }, 120000);

        const popupPoll = window.setInterval(() => {
            if (popup.closed) {
                cleanup();
                reject(new Error('Connection window was closed before authorization completed.'));
            }
        }, 400);

        const cleanup = () => {
            window.clearTimeout(timeout);
            window.clearInterval(popupPoll);
            window.removeEventListener('message', onMessage);
            try {
                popup.close();
            } catch {
            }
        };

        const onMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            const data = event.data as any;
            if (!data || data.type !== 'TH_BYOS_OAUTH_RESULT') return;

            if (data.state !== state) {
                cleanup();
                reject(new Error('OAuth state mismatch. Please retry.'));
                return;
            }

            if (data.error) {
                cleanup();
                reject(new Error(data.error_description || data.error || 'Authorization failed.'));
                return;
            }

            if (!data.access_token) {
                cleanup();
                reject(new Error('No access token returned from provider.'));
                return;
            }

            const expiresIn = Number(data.expires_in || 0);
            const expiresAt = Number.isFinite(expiresIn) && expiresIn > 0
                ? new Date(Date.now() + expiresIn * 1000).toISOString()
                : undefined;

            const accessToken = data.access_token as string;
            fetchAccountLabel(provider, accessToken)
                .then((accountLabel) => {
                    cleanup();
                    resolve({ accessToken, expiresAt, accountLabel });
                })
                .catch(() => {
                    cleanup();
                    resolve({ accessToken, expiresAt });
                });
        };

        window.addEventListener('message', onMessage);
    });
};
