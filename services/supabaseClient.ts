
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
 * This maps to the SQL schema defined in the backend requirements.
 */

export interface DatabaseProfile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    stripe_account_id: string | null;
}

export interface DatabaseProject {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    client_name: string | null;
    amount: number;
    status: 'draft' | 'awaiting_payment' | 'paid' | 'completed';
    access_token: string;
    created_at: string;
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

    async getProjects() {
        if (!supabase) return { data: [], error: 'No connection' };
        return await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
    },

    async updateProjectStatus(projectId: string, status: string) {
        if (!supabase) return { error: 'No connection' };
        return await supabase
            .from('projects')
            .update({ status })
            .eq('id', projectId);
    }
};
