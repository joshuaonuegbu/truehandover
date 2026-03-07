
import { supabase } from './supabaseClient';
import type { StorageSettings } from '../types';

/**
 * Cloudflare R2 uploads for TrueHandover (production posture)
 *
 * - Never put R2 secret keys in the browser (no `VITE_*_SECRET_KEY` patterns).
 * - Uploads must be performed via server-issued presigned URLs (Supabase Edge Functions).
 */

export const R2Service = {
    /**
     * Test an S3-compatible bucket connection via a Supabase Edge Function proxy
     * so secret keys are never exposed client-side.
     */
    testConnection: async (config: StorageSettings): Promise<void> => {
        if (!supabase) {
            throw new Error('Supabase is not configured. Cannot test bucket connection.');
        }
        const { data, error } = await supabase.functions.invoke('r2-test-connection', {
            body: {
                endpoint: config.endpoint,
                bucket: config.bucket,
                accessKey: config.accessKey,
                secretKey: config.secretKey,
                region: config.region,
            },
        });
        if (error || data?.error) {
            throw new Error(error?.message || data?.error || 'Bucket connection test failed.');
        }
    },

    uploadFileWithPresignedUrl: async (
        file: File,
        projectId: string,
        variant: 'original' | 'preview' = 'original',
        onProgress?: (percent: number) => void
    ): Promise<{ success: true; key: string; size: string }> => {
        if (!supabase) {
            throw new Error('Supabase is not configured for presigned upload.');
        }

        if (onProgress) onProgress(10);

        const { data, error } = await supabase.functions.invoke('r2-presign', {
            body: {
                filename: file.name,
                contentType: file.type,
                projectId,
                variant,
            },
        });

        if (error || !data?.uploadUrl || !data?.key) {
            throw new Error(error?.message || data?.error || 'Could not get presigned upload URL.');
        }

        if (onProgress) onProgress(35);

        const uploadResponse = await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
        });

        if (!uploadResponse.ok) {
            throw new Error(`Presigned upload failed (${uploadResponse.status}).`);
        }

        if (onProgress) onProgress(100);

        return {
            success: true,
            key: data.key,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        };
    },
};
