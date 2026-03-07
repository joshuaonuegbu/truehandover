
import { createClient } from '@supabase/supabase-js';

// Access environment variables. 
// In a real deployment, these are injected by the build system (Vercel/Netlify).
// For the prompt-based generation, we assume these will be populated by the user.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Fallback logic if keys are missing (to prevent crashing the UI immediately)
const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured) {
    console.warn("⚠️ Supabase Credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
}

// Create the real client
export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * DATABASE TYPES HELPERS
 * This maps to `supabase/schema.sql`.
 */

export interface DatabaseProfile {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: string | null;
    subdomain: string | null;
    stripe_connect: any;
    payment_methods: any;
    agency_settings: any;
    storage_settings: any;
}

export interface DatabaseProject {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    amount: number;
    status: string;
    client: any;
    client_link: string;
    created_at: string;
    due_date: string | null;
    theme: any;
    payment_methods: any;
    message: string | null;
}

/**
 * Service Wrapper for Data Fetching
 * Use these helper functions in your components
 */
export const DB = {
    async getProfile(userId: string) {
        if (!supabase) return { data: null, error: 'No connection' };
        return await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
    },

    async getCreatorProjects() {
        if (!supabase) return { data: [], error: 'No connection' };
        const { data, error } = await supabase.functions.invoke('creator-projects');
        if (error) return { data: [], error: error.message };
        return { data: (data?.projects || []) as any[], error: null };
    },

    async updateProjectStatus(projectId: string, status: string) {
        if (!supabase) return { error: 'No connection' };
        return await supabase
            .from('projects')
            .update({ status })
            .eq('id', projectId);
    },

    async updateProfile(userId: string, updates: any) {
        if (!supabase) return { error: 'No connection' };
        return await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);
    },

    async saveProject(project: any) {
        if (!supabase) return { error: 'No connection' };
        return await supabase
            .from('projects')
            .upsert(project);
    },

    async upsertFile(file: any) {
        if (!supabase) return { error: 'No connection' };
        return await supabase
            .from('files')
            .upsert(file);
    },

    async deleteProject(projectId: string) {
        if (!supabase) return { error: 'No connection' };
        return await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);
    },

    /**
     * Download Audit Trail PDF for a project.
     * Calls the `audit-trail` Edge Function and returns a Blob.
     */
    async downloadAuditTrail(projectId: string): Promise<{ blob: Blob | null; error: string | null }> {
        if (!supabase) return { blob: null, error: 'No connection' };
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) return { blob: null, error: sessionError.message };
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) return { blob: null, error: 'Unauthorized' };

        const baseUrl = supabaseUrl.replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/functions/v1/audit-trail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                apikey: supabaseAnonKey,
            },
            body: JSON.stringify({ projectId }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            try {
                const json = JSON.parse(text);
                return { blob: null, error: json?.error || `HTTP ${res.status}` };
            } catch {
                return { blob: null, error: text || `HTTP ${res.status}` };
            }
        }

        return { blob: await res.blob(), error: null };
    },

    async downloadRightsTransfer(projectId: string): Promise<{ blob: Blob | null; error: string | null }> {
        if (!supabase) return { blob: null, error: 'No connection' };
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) return { blob: null, error: sessionError.message };
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) return { blob: null, error: 'Unauthorized' };

        const baseUrl = supabaseUrl.replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/functions/v1/rights-transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                apikey: supabaseAnonKey,
            },
            body: JSON.stringify({ projectId }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            try {
                const json = JSON.parse(text);
                return { blob: null, error: json?.error || `HTTP ${res.status}` };
            } catch {
                return { blob: null, error: text || `HTTP ${res.status}` };
            }
        }

        return { blob: await res.blob(), error: null };
    },

    /**
     * Send a payment nudge email to the client of a project.
     * Calls the `nudge-sender` Edge Function.
     */
    async sendNudge(projectId: string): Promise<{ ok: boolean; error: string | null; next_allowed_at?: string }> {
        if (!supabase) return { ok: false, error: 'No connection' };
        const { data, error } = await supabase.functions.invoke('nudge-sender', {
            body: { projectId },
        });
        if (error) return { ok: false, error: error.message };
        if (data?.error) return { ok: false, error: data.error, next_allowed_at: data.next_allowed_at };
        return { ok: data?.ok === true, error: null };
    },

    async createRetainerLink(input: { clientName: string; clientEmail: string; amount: number; interval: 'week' | 'month' | 'year' }): Promise<{ ok: boolean; url?: string; error: string | null }> {
        if (!supabase) return { ok: false, error: 'No connection' };
        const { data, error } = await supabase.functions.invoke('stripe-retainer-link', { body: input });
        if (error) return { ok: false, error: error.message };
        if (data?.error) return { ok: false, error: data.error };
        return { ok: true, url: data?.url, error: null };
    },

    async createClientPortalToken(clientEmail: string, ttlDays?: number): Promise<{ ok: boolean; token?: string; expiresAt?: string; error: string | null }> {
        if (!supabase) return { ok: false, error: 'No connection' };
        const { data, error } = await supabase.functions.invoke('client-portal-token', {
            body: { clientEmail, ttlDays },
        });
        if (error) return { ok: false, error: error.message };
        if (data?.error) return { ok: false, error: data.error };
        return { ok: true, token: data?.token, expiresAt: data?.expiresAt, error: null };
    },

    async getClientPortal(portalToken: string): Promise<{ portal: any | null; error: string | null }> {
        if (!supabase) return { portal: null, error: 'No connection' };
        const { data, error } = await supabase.functions.invoke('client-portal', {
            body: { portalToken },
        });
        if (error) return { portal: null, error: error.message };
        if (data?.error) return { portal: null, error: data.error };
        return { portal: data?.portal ?? null, error: null };
    },

    /**
     * Download all original files for a project as a single ZIP archive.
     * Uses the clientLink for auth (no creator JWT required — client-facing).
     * Calls the `r2-zip-export` Edge Function.
     */
    async downloadProjectZip(clientLink: string): Promise<{ blob: Blob | null; error: string | null }> {
        if (!supabase) return { blob: null, error: 'No connection' };
        const baseUrl = supabaseUrl.replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/functions/v1/r2-zip-export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: supabaseAnonKey,
            },
            body: JSON.stringify({ clientLink }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            try {
                const json = JSON.parse(text);
                return { blob: null, error: json?.error || `HTTP ${res.status}` };
            } catch {
                return { blob: null, error: text || `HTTP ${res.status}` };
            }
        }
        return { blob: await res.blob(), error: null };
    },
};
