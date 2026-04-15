
import { supabase } from './supabaseClient';
import { Project } from '../types';

type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

const ensureSupabase = () => {
    if (!supabase) {
        return { ok: false as const, error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }
    return { ok: true as const };
};

export const StripeConnectService = {
    getOnboardingUrl: async (args?: { returnUrl?: string; refreshUrl?: string }): Promise<ServiceResult<{ url: string; accountId?: string }>> => {
        const check = ensureSupabase();
        if (!check.ok) return { success: false, error: check.error };

        const { data, error } = await supabase.functions.invoke('stripe-onboarding', {
            body: {
                returnUrl: args?.returnUrl,
                refreshUrl: args?.refreshUrl,
            },
        });

        if (error || !data?.url) {
            return { success: false, error: error?.message || data?.error || 'Could not start Stripe onboarding.' };
        }

        return {
            success: true,
            data: {
                url: data.url,
                accountId: data.accountId,
            },
        };
    },
};

export const PaymentService = {
    createCheckoutSession: async (clientLink: string): Promise<ServiceResult<{ url: string }>> => {
        const check = ensureSupabase();
        if (!check.ok) return { success: false, error: check.error };

        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
            body: { clientLink },
        });

        if (error || !data?.url) {
            return { success: false, error: error?.message || data?.error || 'Could not create Stripe checkout session.' };
        }

        return { success: true, data: { url: data.url } };
    },

    verifyManualPayment: async (projectId: string): Promise<ServiceResult<{ status: 'paid' }>> => {
        const check = ensureSupabase();
        if (!check.ok) return { success: false, error: check.error };

        const { data, error } = await supabase.functions.invoke('manual-payment-verify', {
            body: { projectId },
        });

        if (error || !data?.success) {
            return { success: false, error: error?.message || data?.error || 'Could not verify manual payment.' };
        }

        return { success: true, data: { status: 'paid' } };
    },

    getClientPreviewProject: async (clientLink: string): Promise<ServiceResult<{ project: Project }>> => {
        const check = ensureSupabase();
        if (!check.ok) return { success: false, error: check.error };

        const { data, error } = await supabase.functions.invoke('client-preview', {
            body: { clientLink },
        });

        if (error || !data?.project) {
            return { success: false, error: error?.message || data?.error || 'Could not refresh project preview.' };
        }

        return { success: true, data: { project: data.project as Project } };
    },
};
