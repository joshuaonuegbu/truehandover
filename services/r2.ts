
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageSettings } from "../types";

/**
 * Cloudflare R2 Service
 * Uses AWS SDK v3 as R2 is S3-API compatible.
 */

// --- NATIVE PLATFORM CONFIGURATION ---
// These keys are for the platform's default storage (when user doesn't bring their own).
// In a real production app, these would be used on the SERVER side (Node/Edge), not Client.
// For this "Serverless/Client-Side" prototype, we access them here.
const NATIVE_CONFIG: StorageSettings = {
    provider: 'r2',
    endpoint: (import.meta as any).env?.VITE_NATIVE_R2_ENDPOINT || '',
    accessKey: (import.meta as any).env?.VITE_NATIVE_R2_ACCESS_KEY || '',
    secretKey: (import.meta as any).env?.VITE_NATIVE_R2_SECRET_KEY || '',
    bucket: (import.meta as any).env?.VITE_NATIVE_R2_BUCKET || 'truehandover-native',
    accountId: ''
};

export const R2Service = {
    /**
     * Initializes the S3 Client for R2.
     * Checks if we are using User Config (BYOS) or Platform Native Config.
     */
    getClient: (config?: StorageSettings) => {
        // Use provided config, or fall back to Native if keys exist
        const activeConfig = config?.accessKey ? config : NATIVE_CONFIG;

        if (!activeConfig.endpoint || !activeConfig.accessKey || !activeConfig.secretKey) {
            console.warn("R2 Credentials missing. Ensure VITE_NATIVE_R2_* env vars are set or User Settings are configured.");
            throw new Error("Missing R2 Credentials");
        }

        return new S3Client({
            region: "auto",
            endpoint: activeConfig.endpoint,
            credentials: {
                accessKeyId: activeConfig.accessKey,
                secretAccessKey: activeConfig.secretKey || '',
            },
        });
    },

    /**
     * Test the connection by listing objects in the bucket.
     */
    testConnection: async (config: StorageSettings): Promise<boolean> => {
        try {
            const client = R2Service.getClient(config);
            const command = new ListObjectsV2Command({
                Bucket: config.bucket,
                MaxKeys: 1
            });
            await client.send(command);
            return true;
        } catch (error) {
            console.error("R2 Connection Test Failed:", error);
            throw error;
        }
    },

    /**
     * Uploads a file directly to the R2 bucket.
     * @param file The browser File object
     * @param config (Optional) User's BYOS settings. If null, uses Native Platform storage.
     * @param onProgress Callback for progress updates
     */
    uploadFile: async (file: File, config?: StorageSettings, onProgress?: (percent: number) => void) => {
        // Determine which bucket to use (User's or Platform's)
        const useNative = !config?.accessKey;
        const activeConfig = useNative ? NATIVE_CONFIG : config!;
        
        if (useNative && !activeConfig.accessKey) {
            throw new Error("Platform Storage not configured in .env");
        }

        const client = R2Service.getClient(activeConfig);
        
        // Generate a unique path. 
        // Native: organized by date/random to prevent collisions.
        // BYOS: organized by project/file for user readability.
        const fileExt = file.name.split('.').pop();
        const key = `vault/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const command = new PutObjectCommand({
            Bucket: activeConfig.bucket,
            Key: key,
            Body: file,
            ContentType: file.type,
        });

        try {
            if (onProgress) onProgress(10); // Fake start
            
            await client.send(command);
            
            if (onProgress) onProgress(100);

            // Return details needed to retrieve it later
            return {
                success: true,
                key: key,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                url: `${activeConfig.endpoint}/${activeConfig.bucket}/${key}`, // Raw URL (likely private)
                isNative: useNative
            };
        } catch (error) {
            console.error("R2 Upload Error:", error);
            throw error;
        }
    },

    /**
     * Generates a temporary Signed URL for the client to download the file.
     * Valid for 1 hour (3600 seconds).
     */
    generatePresignedUrl: async (key: string, config?: StorageSettings) => {
        // Determine config based on whether key implies Native or BYOS (simplified here to just check arg)
        const activeConfig = config?.accessKey ? config : NATIVE_CONFIG;
        
        const client = R2Service.getClient(activeConfig);
        const command = new GetObjectCommand({
            Bucket: activeConfig.bucket,
            Key: key,
        });

        try {
            const url = await getSignedUrl(client, command, { expiresIn: 3600 });
            return url;
        } catch (error) {
            console.error("Error generating presigned URL:", error);
            return null;
        }
    }
};
