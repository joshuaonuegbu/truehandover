
import { supabase } from './supabaseClient';

/**
 * Cloudflare R2 uploads for Sendational (production posture)
 *
 * - Never put R2 secret keys in the browser (no `VITE_*_SECRET_KEY` patterns).
 * - Uploads must be performed via server-issued presigned URLs (Supabase Edge Functions).
 */

export const R2Service = {
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
