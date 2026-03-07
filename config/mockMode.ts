const MOCK_MODE_KEY = 'th_demo_mode';

/**
 * Returns true if the app is running in demo/mock mode.
 *
 * Resolution order (first match wins):
 *  1. localStorage override (set by the Developer toggle in Settings)
 *  2. VITE_DEMO_MODE env var ("true" / "false")
 *  3. Default: true in `vite dev`, false in production builds
 */
export const isMockMode = (): boolean => {
    const stored = localStorage.getItem(MOCK_MODE_KEY);
    if (stored !== null) return stored === 'true';
    if (import.meta.env.VITE_DEMO_MODE !== undefined) {
        return import.meta.env.VITE_DEMO_MODE === 'true';
    }
    return import.meta.env.DEV === true;
};

/**
 * Persistently enables or disables demo mode and reloads the app to apply.
 */
export const setMockMode = (value: boolean): void => {
    localStorage.setItem(MOCK_MODE_KEY, String(value));
    window.location.reload();
};
