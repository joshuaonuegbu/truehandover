const MOCK_MODE_KEY = 'th_demo_mode';

export const canToggleMockMode = (): boolean => {
    return import.meta.env.DEV === true || import.meta.env.VITE_ALLOW_DEMO_MODE === 'true';
};

/**
 * Returns true if the app is running in demo/mock mode.
 *
 * Resolution order (first match wins):
 *  1. localStorage override (set by the Developer toggle in Settings)
 *  2. VITE_DEMO_MODE env var ("true" / "false")
 *  3. Default: true in `vite dev`, false in production builds
 */
export const isMockMode = (): boolean => {
    // Never allow demo/mock mode to be toggled in production unless explicitly enabled.
    // This prevents accidentally shipping demo UI/data (or re-enabling it from a stale localStorage flag).
    if (canToggleMockMode()) {
        const stored = localStorage.getItem(MOCK_MODE_KEY);
        if (stored !== null) return stored === 'true';
    }
    if (import.meta.env.VITE_DEMO_MODE !== undefined) {
        return import.meta.env.VITE_DEMO_MODE === 'true';
    }
    return import.meta.env.DEV === true;
};

/**
 * Persistently enables or disables demo mode and reloads the app to apply.
 */
export const setMockMode = (value: boolean): void => {
    if (!canToggleMockMode()) return;
    localStorage.setItem(MOCK_MODE_KEY, String(value));
    window.location.reload();
};

export const setMockModeAndNavigate = (value: boolean, path: string): void => {
    if (!canToggleMockMode()) {
        window.location.assign(path);
        return;
    }
    localStorage.setItem(MOCK_MODE_KEY, String(value));
    window.location.assign(path);
};
