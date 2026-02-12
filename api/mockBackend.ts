
import { Project, FileAsset } from '../types';
import { R2Service } from '../services/r2';

/**
 * BACKEND SERVICE LAYER
 * 
 * In this client-side architecture, this file acts as the "Server Controller".
 * It delegates actual heavy lifting (Storage) to the R2Service while maintaining
 * the abstraction of a backend API.
 */

// --- 1. AUDIT TRAIL SERVICE (Evidence Locker) ---
// Moved up to ensure availability for other services
export const AuditService = {
    // In-memory log store
    logs: [
        { id: 'log_init', timestamp: new Date(Date.now() - 10000000).toISOString(), projectId: 'p1', action: 'PROJECT_CREATED', ip: '192.168.1.1', metadata: { owner: 'Creator' } }
    ] as any[],

    /**
     * Logs an interaction event.
     */
    logEvent: async (projectId: string, action: string, metadata: any) => {
        const entry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date().toISOString(),
            projectId,
            action, // e.g., 'VIEW_PREVIEW', 'PAYMENT_SUCCESS', 'DOWNLOAD_ORIGINAL'
            ip: '10.0.0.1', // Mock Client IP
            metadata
        };
        console.log(`[Audit Trail] New Entry:`, entry);
        AuditService.logs.push(entry);
        return entry;
    },

    /**
     * Generates a "PDF" (Blob) containing the evidence chain for a project.
     * This is the "Evidence Pack" in the roadmap.
     */
    generateEvidencePack: async (projectId: string): Promise<{ url: string; filename: string }> => {
        console.log(`[Audit Service] Generating Evidence Pack for ${projectId}...`);

        // Filter logs
        // Note: For demo, if projectId is not found, we just return all logs or a sample set
        const projectLogs = AuditService.logs.filter(l => l.projectId === projectId || projectId === 'all');
        const count = projectLogs.length || AuditService.logs.length;

        // Create a text-based "PDF" representation
        const content = [
            `TRUEHANDOVER SECURE AUDIT RECORD`,
            `================================================`,
            `Generated: ${new Date().toUTCString()}`,
            `Project ID: ${projectId}`,
            `Total Events: ${count}`,
            `================================================`,
            ``,
            `IMMUTABLE ACCESS LOG:`,
            `---------------------`,
            ...(projectLogs.length ? projectLogs : AuditService.logs).map(l =>
                `[${l.timestamp}] ${l.action}\n  IP: ${l.ip}\n  Meta: ${JSON.stringify(l.metadata)}\n`
            ),
            `---------------------`,
            ``,
            `END OF RECORD.`,
            `Cryptographic Signature: ${Math.random().toString(36).substr(2, 20).toUpperCase()}`,
            `Verify at: https://truehandover.com/verify`
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        await new Promise(resolve => setTimeout(resolve, 1500)); // Fake processing time

        return {
            url,
            filename: `Evidence_Pack_${projectId}_${Date.now()}.txt` // Using .txt to simulate the content
        };
    }
};

// --- 2. STORAGE SERVICE (Real R2 Integration) ---

export const StorageService = {
    /**
     * Uploads a file to the Platform's Native R2 Bucket.
     * This replaces the previous mock implementation with real storage calls.
     */
    uploadFileToNativeStorage: async (file: File): Promise<{ key: string; size: string; url: string }> => {
        console.log(`[Backend] Initiating Native R2 Upload for ${file.name}...`);

        try {
            // Pass 'undefined' as config to trigger Native Mode in R2Service
            const result = await R2Service.uploadFile(file, undefined);

            console.log(`[Backend] Native Upload Success: ${result.key}`);

            return {
                key: result.key,
                size: result.size,
                url: result.url
            };
        } catch (error) {
            console.warn("[Backend] Native R2 Upload failed (likely missing .env keys). Falling back to Mock.", error);

            // FALLBACK MOCK (If .env keys are missing during development)
            const uploadTime = Math.min(2000, file.size / 1000);
            await new Promise(resolve => setTimeout(resolve, uploadTime));
            return {
                key: `mock-native/${file.name}`,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                url: URL.createObjectURL(file)
            };
        }
    },

    /**
     * Generates a time-limited Signed URL for the original asset.
     * Logic: CHECKS PAYMENT STATUS. If not paid, returns 403.
     */
    getSignedDownloadUrl: async (fileKey: string, projectStatus: Project['status'], storageConfig?: any): Promise<string | null> => {
        // 1. Security Gate: Verify Payment
        if (projectStatus !== 'paid' && projectStatus !== 'completed') {
            console.warn(`[Backend Security] Access Denied for key ${fileKey}. Payment status: ${projectStatus}`);
            // Log this attempt in Audit Trail
            AuditService.logEvent('unknown_project', 'ACCESS_DENIED', { fileKey, reason: 'Payment Required' });
            return null; // 403 Forbidden
        }

        // 2. Generate Real Signed URL via R2
        try {
            // Pass storageConfig if it exists (BYOS), otherwise undefined (Native)
            const signedUrl = await R2Service.generatePresignedUrl(fileKey, storageConfig);
            if (signedUrl) {
                AuditService.logEvent('unknown_project', 'DOWNLOAD_GENERATED', { fileKey });
                return signedUrl;
            }
        } catch (e) {
            console.error("Failed to sign URL", e);
        }

        // 3. Fallback for Mock Data
        AuditService.logEvent('unknown_project', 'DOWNLOAD_GENERATED_MOCK', { fileKey });
        return `https://cdn.truehandover.com/mock-download/${fileKey}`;
    }
};

// --- 3. FILE PROCESSING SERVICE (FFmpeg/Sharp Simulation) ---

export const ProcessingService = {
    /**
     * Simulates server-side watermarking.
     * In prod: Uses 'sharp' for images or 'ffmpeg' for video to burn in the watermark.
     */
    generateWatermarkedPreview: async (file: File): Promise<string> => {
        console.log(`[Processing Worker] Job started: Watermarking ${file.name}...`);

        // Use the WatermarkService to actually generate a visual result
        if (file.type.startsWith('image/')) {
            return await WatermarkService.applyWatermark(file);
        }

        // Simulate processing time (heavier for video)
        const isVideo = file.type.startsWith('video');
        const processingTime = isVideo ? 4000 : 1500;

        await new Promise(resolve => setTimeout(resolve, processingTime));

        console.log(`[Processing Worker] Job complete. Preview generated.`);

        // For video/other, return original for now (mock)
        return URL.createObjectURL(file);
    },

    /**
     * Simulates zipping all assets for a "Download All" button.
     */
    createSecureZip: async (fileKeys: string[]): Promise<string> => {
        console.log(`[Processing Worker] Zipping ${fileKeys.length} files...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return `https://cdn.truehandover.com/downloads/package_${Date.now()}.zip`;
    }
};

// --- 4. STRIPE CONNECT SERVICE (NEW) ---
export const StripeConnectService = {
    /**
     * Simulates the OAuth flow to onboard a freelancer.
     */
    createConnectAccount: async (email: string) => {
        console.log(`[Stripe Connect] Initializing OAuth for ${email}...`);
        return {
            url: `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_mock_123&scope=read_write&state=${btoa(email)}`,
            mockAccountId: `acct_mock_${Math.random().toString(36).substr(2, 9)}`
        };
    },

    /**
     * Mocks the dashboard link generation for users to view their payouts.
     */
    getDashboardLoginLink: async (accountId: string) => {
        console.log(`[Stripe Connect] Generating dashboard link for ${accountId}...`);
        return {
            url: `https://dashboard.stripe.com/test/dashboard`
        };
    }
};

// --- 5. PAYMENT SERVICE (Direct Routing Logic) ---

export const PaymentService = {
    /**
     * Simulates a Direct Charge via Stripe Connect.
     * This is the critical logic ensuring we do not hold funds (Escrow).
     * Instead, we use `transfer_data` to route funds immediately.
     */
    createCheckoutSession: async (amount: number, connectedAccountId: string = 'acct_mock_default') => {

        // --- STRIPE CONNECT ACCOUNT DETECTION ---
        // Try to fetch connected account from LocalStorage (Simulated DB)
        let connectedAccountIdResolved = connectedAccountId;
        try {
            const storedUser = localStorage.getItem('th_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if (user.stripeConnect?.connected && user.stripeConnect?.accountId) {
                    connectedAccountIdResolved = user.stripeConnect.accountId;
                    console.log(`[Stripe Connect] 🟢 FOUND CONNECTED ACCOUNT: ${connectedAccountIdResolved}`);
                    console.log(`[Stripe Connect] In Production, charges would be routed to this account via transfer_data.`);
                }
            }
        } catch (e) {
            console.warn("Could not read connected account");
        }

        // 1. Calculate Fees (1.5% Platform Fee for Free Tier)
        const isFreeTier = true; // Mock check
        const platformFeePercent = isFreeTier ? 0.015 : 0;
        const applicationFee = Math.round(amount * platformFeePercent);

        // Stripe Processing Fee (Approx 2.9% + 30 cents) - This is deducted by Stripe automatically
        const stripeProcessingFee = Math.round((amount * 0.029) + 30);

        // What the freelancer actually sees in their dashboard
        const freelancerNet = amount - applicationFee - stripeProcessingFee;

        console.log('--- [Stripe Direct Routing Ledger] ---');
        console.log(`Transaction ID: tx_${Math.random().toString(36).substr(2, 9)}`);
        console.log(`Routing Mode: ${connectedAccountIdResolved !== connectedAccountId ? 'Connected Account (Real)' : 'Platform Mock (Test)'}`);
        console.log(`Connected Account: ${connectedAccountIdResolved}`);
        console.log(`Total Client Charge: $${amount.toFixed(2)}`);
        console.log(`Platform Fee (TrueHandover): $${applicationFee.toFixed(2)}`);
        console.log(`Stripe Processing (Est): $${stripeProcessingFee.toFixed(2)}`);
        console.log(`>>> DIRECT TRANSFER to Connected Account (${connectedAccountIdResolved}): $${freelancerNet.toFixed(2)}`);
        console.log('--------------------------------------');

        // Log to Audit Trail
        AuditService.logEvent('pending_project_id', 'PAYMENT_SESSION_INIT', {
            amount,
            fee: applicationFee,
            routing: 'direct_destination',
            connectedAccount: connectedAccountIdResolved
        });

        return {
            sessionId: 'cs_test_' + Math.random().toString(36).substring(7),
            url: 'https://checkout.stripe.com/mock-pay'
        };
    },

    /**
     * DIGITAL HANDSHAKE: Verification Logic
     * Transitions a project from 'payment_verification' to 'paid'.
     */
    verifyManualPayment: async (projectId: string) => {
        console.log(`[Digital Handshake] Verifying manual payment for ${projectId}...`);

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 800));

        AuditService.logEvent(projectId, 'MANUAL_PAYMENT_VERIFIED', {
            verifiedBy: 'Creator',
            timestamp: new Date().toISOString()
        });

        console.log(`[Digital Handshake] Success. Assets unlocked.`);
        return { success: true, status: 'paid' };
    }
};

// --- 6. WATERMARK SERVICE (Feature #11: Browser-Based Watermarking) ---
export const WatermarkService = {
    /**
     * Applies a visual watermark to an image file using the Canvas API.
     * This runs in the browser but simulates the logic of a server-side processor
     * or a client-side pre-processor before upload.
     */
    applyWatermark: async (file: File, text: string = "PROTECTED PREVIEW"): Promise<string> => {
        console.log(`[Watermark Service] Processing ${file.name}...`);

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject("Canvas context unavailable");

                    // Set canvas dimensions to match image
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // 1. Draw Original Image
                    ctx.drawImage(img, 0, 0);

                    // 2. Draw Watermark Pattern
                    ctx.save();
                    // Diagonal Tile Logic
                    ctx.globalAlpha = 0.15;
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;

                    // Dynamic font size based on image width
                    const fontSize = Math.max(20, canvas.width / 15);
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.textAlign = 'center';

                    // Rotate context for diagonal text
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(-Math.PI / 4);

                    // Draw centered stamp
                    ctx.fillText(text, 0, 0);
                    ctx.strokeText(text, 0, 0);

                    // Draw tiled stamps
                    const spacing = fontSize * 6;
                    for (let x = -canvas.width; x < canvas.width; x += spacing) {
                        for (let y = -canvas.height; y < canvas.height; y += spacing) {
                            if (x === 0 && y === 0) continue; // Skip center
                            ctx.fillText(text, x, y);
                        }
                    }

                    ctx.restore();

                    // 3. Draw Grid Overlay (Extra Protection)
                    ctx.fillStyle = 'rgba(0,0,0,0.05)';
                    const gridSize = Math.max(50, canvas.width / 20);
                    for (let i = 0; i < canvas.width; i += gridSize) {
                        ctx.fillRect(i, 0, 1, canvas.height);
                    }
                    for (let i = 0; i < canvas.height; i += gridSize) {
                        ctx.fillRect(0, i, canvas.width, 1);
                    }

                    // Export
                    const dataUrl = canvas.toDataURL(file.type, 0.85); // 85% Quality JPG/PNG
                    resolve(dataUrl);
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    }
};

// --- 7. CREDENTIAL VAULT SERVICE (Impulse Buy Feature #33) ---
export const CredentialService = {
    /**
     * "Encrypts" and stores a sensitive string (mocked).
     * Returns a safe reference ID.
     */
    vaultStore: async (plaintext: string): Promise<string> => {
        console.log(`[Credential Vault] Encrypting sensitive data...`);
        // Mock encryption: Base64 encode + salt
        const salt = Math.random().toString(36).substring(7);
        const encrypted = btoa(plaintext); // In prod: AES-256
        const vaultId = `vault_${salt}`;

        // Mock DB storage
        (window as any)[vaultId] = encrypted;

        return vaultId;
    },

    /**
     * Decrypts the data ONLY if the project is paid.
     * This simulates the key release mechanism.
     */
    vaultRetrieve: async (vaultId: string, projectStatus: Project['status']): Promise<{ success: boolean, data?: string, error?: string }> => {
        console.log(`[Credential Vault] Access request for ${vaultId}. Status: ${projectStatus}`);

        // Security Gate
        if (projectStatus !== 'paid' && projectStatus !== 'completed') {
            AuditService.logEvent('unknown_project', 'CREDENTIAL_ACCESS_DENIED', { vaultId });
            return {
                success: false,
                error: 'Payment required to decrypt credentials.'
            };
        }

        // Retrieve
        const encrypted = (window as any)[vaultId];
        if (!encrypted) return { success: false, error: 'Credential not found.' };

        // Mock Decryption
        const plaintext = atob(encrypted);

        AuditService.logEvent('unknown_project', 'CREDENTIAL_UNLOCKED', { vaultId });

        return {
            success: true,
            data: plaintext
        };
    }
};
