
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
    }
};
