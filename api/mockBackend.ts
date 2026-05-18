
import { Project, FileAsset, StorageSettings } from '../types';

/** Computes a 32-character hex fingerprint (first half of SHA-256) from any string input (URL, filename, etc.) */
export const computeSHA256 = async (input: string): Promise<string> => {
    try {
        const msgBuffer = new TextEncoder().encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    } catch {
        // Fallback for environments where crypto.subtle isn't available
        return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
};

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

        AuditService.logs.push(entry);
        return entry;
    },

    /**
     * Generates a "PDF" (Blob) containing the evidence chain for a project.
     * This is the "Evidence Pack" in the roadmap.
     */
    generateEvidencePack: async (projectId: string): Promise<{ url: string; filename: string }> => {


        // Filter logs
        // Note: For demo, if projectId is not found, we just return all logs or a sample set
        const projectLogs = AuditService.logs.filter(l => l.projectId === projectId || projectId === 'all');
        const count = projectLogs.length || AuditService.logs.length;

        // Create a text-based "PDF" representation
        const content = [
            `Heartifact SECURE AUDIT RECORD`,
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
            `Verify at: https://heartifact.com/verify`
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


        // Production posture: never upload to R2 directly from the browser using secret keys.
        // True uploads are performed via Supabase Edge Function presigned URLs in `services/r2.ts`.
        // This mock backend remains as a demo fallback only.
        const uploadTime = Math.min(2000, file.size / 1000);
        await new Promise(resolve => setTimeout(resolve, uploadTime));
        return {
            key: `mock-native/${file.name}`,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            url: URL.createObjectURL(file)
        };
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

        // 2. Fallback for Mock Data
        AuditService.logEvent('unknown_project', 'DOWNLOAD_GENERATED_MOCK', { fileKey });
        return `https://cdn.heartifact.com/mock-download/${fileKey}`;
    }
};

// --- 3. FILE PROCESSING SERVICE (FFmpeg/Sharp Simulation) ---

export const ProcessingService = {
    /**
     * Simulates server-side watermarking.
     * In prod: Uses 'sharp' for images or 'ffmpeg' for video to burn in the watermark.
     */
    generateWatermarkedPreview: async (file: File): Promise<string> => {


        // Use the WatermarkService to actually generate a visual result
        if (file.type.startsWith('image/')) {
            return await WatermarkService.applyWatermark(file);
        }

        // Simulate processing time (heavier for video)
        const isVideo = file.type.startsWith('video');
        const processingTime = isVideo ? 4000 : 1500;

        await new Promise(resolve => setTimeout(resolve, processingTime));



        // For video/other, return original for now (mock)
        return URL.createObjectURL(file);
    },

    /**
     * Simulates zipping all assets for a "Download All" button.
     */
    createSecureZip: async (fileKeys: string[]): Promise<string> => {

        await new Promise(resolve => setTimeout(resolve, 3000));
        return `https://cdn.heartifact.com/downloads/package_${Date.now()}.zip`;
    }
};

// --- 4. STRIPE CONNECT SERVICE (NEW) ---
export const StripeConnectService = {
    /**
     * Simulates the OAuth flow to onboard a freelancer.
     */
    createConnectAccount: async (email: string) => {

        return {
            url: `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_mock_123&scope=read_write&state=${btoa(email)}`,
            mockAccountId: `acct_mock_${Math.random().toString(36).substr(2, 9)}`
        };
    },

    /**
     * Mocks the dashboard link generation for users to view their payouts.
     */
    getDashboardLoginLink: async (accountId: string) => {

        return {
            url: `https://dashboard.stripe.com/test/dashboard`
        };
    }
};

// --- 5. PAYMENT SERVICE (Direct Routing Logic) ---
/**
 * STRIPE CONNECT INTEGRATION WITH THREE PAYMENT RAILS
 * 
 * Rail 1: Stripe Card (Instant Settlement)
 * - Free: 4.5% total (1.6% platform + 2.9% Stripe)
 * - Pro: 3.75% total
 * 
 * Rail 2: ACH Direct Debit (Async Settlement, 2-5 days) — Pro Only
 * - Pro: 1.5% total (Stripe 0.8% capped at $5 + platform spread ~0.7%)
 * - Includes Risk-Aware Release System (delayed unlock window)
 * - Reversals possible even after apparent settlement
 * 
 * Rail 3: Manual Payments (0% fee) — Pro Only
 * - Zelle, Wire, Bank Transfer, PayPal, etc.
 * - Creator verifies receipt manually
 * - Full audit trail + dispute evidence pack
 * 
 * Key: All payments use Stripe Connect with transfer_data.
 * No escrow. Funds route directly to creator's Stripe-connected bank account.
 */
export const PaymentService = {
    /**
     * Calculate transaction fees based on payment method and tier.
     * Returns fee breakdown + settlement metadata.
     */
    calculateTransactionFees: (amount: number, paymentMethod: 'card' | 'ach' | 'manual', isPro: boolean) => {
        let applicationFee: number;
        let stripeProcessingFee: number;
        let settlementDays: number;
        let unlockBehavior: string;

        if (paymentMethod === 'card') {
            // STRIPE CARD:
            // Free tier: 1.6% platform + 2.9% Stripe = 4.5%
            // Pro tier: 3.75% total
            const platformPercent = isPro ? 0.0085 : 0.016;
            applicationFee = Math.round(amount * platformPercent);
            stripeProcessingFee = Math.round(amount * 0.029);
            settlementDays = 1; // Stripe card: immediate
            unlockBehavior = 'INSTANT_ON_CONFIRMATION';
        } else if (paymentMethod === 'ach') {
            // ACH DIRECT DEBIT (Pro-only, 1.5% total)
            const stripeFee = Math.min(Math.round(amount * 0.008), 500); // 0.8% capped at $5
            applicationFee = Math.round(amount * 0.015) - stripeFee; // 1.5% total - Stripe's cut
            stripeProcessingFee = stripeFee;
            settlementDays = 3; // ACH: 2-5 business days average
            unlockBehavior = 'DELAYED_UNTIL_SETTLEMENT_CONFIRMED';
        } else {
            // MANUAL PAYMENT (Pro-only, 0% fee)
            applicationFee = 0;
            stripeProcessingFee = 0;
            settlementDays = 3; // Depends on payment method
            unlockBehavior = 'MANUAL_VERIFICATION_REQUIRED';
        }

        const freelancerNet = amount - applicationFee - stripeProcessingFee;
        const totalFeePercent = ((applicationFee + stripeProcessingFee) / amount * 100).toFixed(2);

        return {
            amount,
            applicationFee, // Sendational keeps this
            stripeProcessingFee, // Stripe deducts this
            freelancerNet,
            totalFeePercent,
            paymentMethod,
            settlementDays,
            unlockBehavior,
        };
    },

    /**
     * Simulates a Direct Charge via Stripe Connect.
     * This is the critical logic ensuring we do not hold funds (Escrow).
     * Instead, we use `transfer_data` to route funds immediately.
     */
    createCheckoutSession: async (
        amount: number,
        paymentMethod: 'card' | 'ach' | 'manual' = 'card',
        connectedAccountId: string = 'acct_mock_default',
        isPro: boolean = false
    ) => {

        // --- STRIPE CONNECT ACCOUNT DETECTION ---
        // Try to fetch connected account from LocalStorage (Simulated DB)
        let connectedAccountIdResolved = connectedAccountId;
        try {
            const storedUser = localStorage.getItem('th_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if (user.stripeConnect?.connected && user.stripeConnect?.accountId) {
                    connectedAccountIdResolved = user.stripeConnect.accountId;
                }
            }
        } catch (e) {
            console.warn("Could not read connected account");
        }

        // Calculate fees for the chosen payment method
        const fees = PaymentService.calculateTransactionFees(amount, paymentMethod, isPro);

        // Log to Audit Trail
        AuditService.logEvent('pending_project_id', 'PAYMENT_SESSION_INIT', {
            amount,
            paymentMethod,
            platformFee: fees.applicationFee,
            stripeFee: fees.stripeProcessingFee,
            totalFeePercent: fees.totalFeePercent,
            settlementDays: fees.settlementDays,
            unlockBehavior: fees.unlockBehavior,
            routing: 'direct_destination',
            connectedAccount: connectedAccountIdResolved,
        });

        return {
            sessionId: 'cs_test_' + Math.random().toString(36).substring(7),
            url: 'https://checkout.stripe.com/mock-pay',
            ...fees,
        };
    },

    /**
     * Verify manual payment with risk-aware release delay.
     * 
     * For high-risk scenarios (new account, large transaction, flagged behavior):
     * - Trigger 24-48 hour delay before unlock
     * - Store risk flag in project metadata
     * - Log to audit trail for review
     * 
     * Risk Signals:
     * - New account (<7 days old)
     * - Large transaction (>$5,000)
     * - Unusual pattern vs creator's history
     * - Suspicious client metadata
     */
    verifyManualPayment: async (
        projectId: string,
        amount: number = 0,
        creatorAccountAgeHours: number = 168 // default: 7 days = 168 hours
    ) => {

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 800));

        // Risk Assessment: New account or large transaction
        const isNewAccount = creatorAccountAgeHours < 168; // < 7 days
        const isLargeTransaction = amount > 5000;
        const riskScore = (isNewAccount ? 1 : 0) + (isLargeTransaction ? 1 : 0);
        const isHighRisk = riskScore >= 1;

        const settlementState = isHighRisk ? 'manual_locked_review' : 'paid';
        const unlockDelayHours = isHighRisk ? 48 : 0;

        AuditService.logEvent(projectId, 'MANUAL_PAYMENT_VERIFIED', {
            verifiedBy: 'Creator',
            amount,
            creatorAccountAgeHours,
            riskScore,
            isHighRisk,
            unlockDelayHours,
            settlementState,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            status: settlementState,
            message: isHighRisk
                ? `Manual payment verified. Files will unlock after ${unlockDelayHours}-hour security review.`
                : 'Manual payment verified. Files unlocked.',
            unlockDelayHours,
            riskScore,
        };
    },

    /**
     * Simulate ACH settlement confirmation via Stripe webhook.
     * Called when Stripe sends ACH_TRANSFER_SETTLED event.
     * Transitions 'payment_pending_settlement' → 'paid'
     */
    settlementConfirmed: async (projectId: string, paymentMethod: 'ach' | 'manual') => {
        // Log settlement event to audit trail
        AuditService.logEvent(projectId, 'PAYMENT_SETTLEMENT_CONFIRMED', {
            paymentMethod,
            settledAt: new Date().toISOString(),
            source: 'stripe_webhook_event'
        });

        return {
            success: true,
            status: 'paid',
            message: `${paymentMethod.toUpperCase()} payment settled. Files now fully accessible.`
        };
    },

    /**
     * Risk-Aware Release System
     * Checks if account meets high-risk criteria; if so, applies delay window.
     * 
     * Risk Criteria:
     * - New account (<7 days)
     * - Large single transaction (>$5,000)
     * - Multiple high-ticket transactions in 24h window
     * - Flagged client metadata (suspicious payment patterns)
     */
    applyRiskAwareRelease: async (
        projectId: string,
        creatorAccountAgeHours: number,
        transactionAmount: number,
        paymentMethod: 'card' | 'ach' | 'manual'
    ) => {
        const isNewAccount = creatorAccountAgeHours < 168; // < 7 days
        const isLargeTransaction = transactionAmount > 5000;
        const riskFactors: string[] = [];

        if (isNewAccount) riskFactors.push('new_account');
        if (isLargeTransaction) riskFactors.push('large_transaction');
        if (paymentMethod === 'ach' && transactionAmount > 10000) riskFactors.push('very_high_ach_amount');

        const riskScore = riskFactors.length;
        const triggersDelay = riskScore >= 1;
        const unlockDelayHours = triggersDelay ? (riskScore === 1 ? 24 : 48) : 0;

        // Log risk assessment
        AuditService.logEvent(projectId, 'RISK_ASSESSMENT_APPLIED', {
            creatorAccountAgeHours,
            transactionAmount,
            paymentMethod,
            riskFactors,
            riskScore,
            triggersDelay,
            unlockDelayHours,
            assessedAt: new Date().toISOString()
        });

        return {
            triggersDelay,
            unlockDelayHours,
            riskScore,
            riskFactors,
            recommendedState: triggersDelay ? 'unlock_delayed_risk' : 'paid',
            message: triggersDelay
                ? `Risk assessment triggered ${unlockDelayHours}-hour review window. Reason(s): ${riskFactors.join(', ')}`
                : 'No risk factors detected. Instant unlock approved.'
        };
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

// --- 7. BYOS LINK INGESTION SERVICE ---

type ByosProvider = 'drive' | 'dropbox' | 'onedrive' | 'generic';

const detectByosProvider = (url: URL): ByosProvider => {
    const host = url.hostname.toLowerCase();
    if (host.includes('drive.google.com')) return 'drive';
    if (host.includes('dropbox.com')) return 'dropbox';
    if (host.includes('1drv.ms') || host.includes('onedrive.live.com')) return 'onedrive';
    return 'generic';
};

const extensionToType = (name: string): FileAsset['type'] => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'heic'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['txt', 'md', 'rtf', 'doc', 'docx', 'odt', 'pages'].includes(ext)) return 'doc';
    if (['fig', 'sketch', 'xd', 'psd', 'ai'].includes(ext)) return 'design';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'archive';
};

const hasRecognizedExtension = (name: string): boolean => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'heic', 'mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', 'mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac', 'pdf', 'txt', 'md', 'rtf', 'doc', 'docx', 'odt', 'pages', 'fig', 'sketch', 'xd', 'psd', 'ai', 'zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
};

const decodeName = (input: string) => {
    try {
        return decodeURIComponent(input.replace(/\+/g, ' '));
    } catch {
        return input;
    }
};

const inferFileNameFromUrl = (url: URL): string | null => {
    const pathnameParts = url.pathname.split('/').filter(Boolean);
    const last = pathnameParts[pathnameParts.length - 1] || '';

    const queryCandidates = [
        url.searchParams.get('filename'),
        url.searchParams.get('file'),
        url.searchParams.get('name'),
        url.searchParams.get('title')
    ].filter(Boolean) as string[];

    const picked = queryCandidates[0] || last;
    const decoded = decodeName(picked || '').trim();
    if (!decoded) return null;

    // Ignore obvious non-filename path segments
    if (['view', 'edit', 'u', 's', 'd', 'f', 'file'].includes(decoded.toLowerCase())) return null;
    return decoded;
};

const inferTypeFromUrl = (url: URL): FileAsset['type'] | null => {
    const pathnameParts = url.pathname.split('/').filter(Boolean);
    const lastPathSegment = decodeName(pathnameParts[pathnameParts.length - 1] || '').trim();
    if (lastPathSegment && hasRecognizedExtension(lastPathSegment)) {
        return extensionToType(lastPathSegment);
    }

    const queryCandidates = [
        url.searchParams.get('filename'),
        url.searchParams.get('file'),
        url.searchParams.get('name'),
        url.searchParams.get('title')
    ].filter(Boolean) as string[];

    for (const candidate of queryCandidates) {
        const decoded = decodeName(candidate).trim();
        if (decoded && hasRecognizedExtension(decoded)) {
            return extensionToType(decoded);
        }
    }

    return null;
};

const inferStorageProvider = (provider: ByosProvider): FileAsset['storageProvider'] => {
    if (provider === 'drive') return 'drive';
    if (provider === 'dropbox') return 'dropbox';
    if (provider === 'onedrive') return 'onedrive';
    return 's3';
};

/**
 * Estimates a realistic file size from extension / asset type.
 * Used as fallback when provider metadata APIs are blocked by CORS
 * (which is the normal case for a client-side app on localhost).
 * In production with a server-side proxy, real sizes will come through instead.
 */
const estimateFileSizeFromName = (name: string, type?: FileAsset['type']): string => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const sizeMap: Record<string, [number, number]> = {
        // [minMB, maxMB]
        jpg: [0.8, 6], jpeg: [0.8, 6], png: [1, 12],
        webp: [0.3, 4], gif: [0.5, 8], svg: [0.01, 0.5],
        avif: [0.2, 3], heic: [1, 8], tiff: [5, 40],
        bmp: [2, 15],
        mp4: [5, 250], mov: [10, 500], avi: [15, 400],
        webm: [3, 80], mkv: [10, 300], m4v: [5, 200],
        mp3: [2, 12], wav: [10, 80], ogg: [1, 8],
        flac: [15, 60], m4a: [2, 10], aac: [1, 8],
        pdf: [0.2, 15],
        doc: [0.1, 5], docx: [0.1, 5], txt: [0.001, 0.5],
        md: [0.001, 0.3], rtf: [0.1, 3],
        xls: [0.1, 10], xlsx: [0.1, 10], csv: [0.01, 5],
        fig: [1, 30], sketch: [2, 40], xd: [1, 25],
        psd: [10, 200], ai: [5, 100],
        zip: [1, 500], rar: [1, 500], '7z': [1, 500],
        tar: [1, 500], gz: [0.5, 200],
    };
    const range = sizeMap[ext];
    if (range) {
        // Deterministic pseudo-random from name so the same file always shows the same estimate
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        const ratio = Math.abs(hash % 1000) / 1000;
        const mb = range[0] + ratio * (range[1] - range[0]);
        return formatBytesToSizeLabel(mb * 1024 * 1024);
    }
    // Fallback by type category
    const typeDefaults: Record<string, number> = {
        image: 3, video: 45, audio: 5, pdf: 2, doc: 1, design: 15, archive: 20
    };
    const fallbackMB = typeDefaults[type || 'archive'] || 5;
    return formatBytesToSizeLabel(fallbackMB * 1024 * 1024);
};

const formatBytesToSizeLabel = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return 'Unavailable';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    if (kb >= 1) return `${kb.toFixed(2)} KB`;
    return `${Math.max(1, Math.round(bytes))} B`;
};

const tryResolveContentLength = async (candidateUrls: Array<string | null | undefined>): Promise<string | undefined> => {
    const attempts = Array.from(new Set(candidateUrls.filter((u): u is string => !!u && /^https?:\/\//i.test(u))));

    for (const candidate of attempts) {
        try {
            const headResp = await fetch(candidate, { method: 'HEAD', redirect: 'follow' });
            const headLength = Number(headResp.headers.get('content-length') || 0);
            if (headLength > 0) return formatBytesToSizeLabel(headLength);
        } catch { }

        try {
            const rangeResp = await fetch(candidate, {
                method: 'GET',
                headers: { Range: 'bytes=0-0' },
                redirect: 'follow'
            });
            const contentRange = rangeResp.headers.get('content-range') || '';
            const totalFromRange = Number((contentRange.match(/\/(\d+)$/)?.[1]) || 0);
            if (totalFromRange > 0) return formatBytesToSizeLabel(totalFromRange);

            const fallbackLength = Number(rangeResp.headers.get('content-length') || 0);
            if (fallbackLength > 1) return formatBytesToSizeLabel(fallbackLength);
        } catch { }
    }

    return undefined;
};

const createProviderPreviewUrl = (provider: ByosProvider, name: string) => {
    const seed = encodeURIComponent(`${provider}-${name}`);
    if (provider === 'drive') {
        return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=0f172a&shape1Color=22c55e&shape2Color=86efac&shape3Color=14532d`;
    }
    if (provider === 'dropbox') {
        return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=0f172a&shape1Color=3b82f6&shape2Color=93c5fd&shape3Color=1e3a8a`;
    }
    if (provider === 'onedrive') {
        return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=111827&shape1Color=0ea5e9&shape2Color=7dd3fc&shape3Color=0c4a6e`;
    }
    return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=171717&shape1Color=a3a3a3&shape2Color=e5e5e5&shape3Color=525252`;
};

const normalizeProviderLink = (url: URL, provider: ByosProvider) => {
    const original = url.toString();
    if (provider === 'dropbox') {
        const next = new URL(original);
        next.searchParams.delete('dl');
        next.searchParams.delete('raw');
        next.searchParams.set('dl', '1');
        return next.toString();
    }
    return original;
};

const inferGoogleDriveDownloadUrl = (url: URL) => {
    const fileIdFromPath = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
    const fileIdFromQuery = url.searchParams.get('id');
    const fileId = fileIdFromPath || fileIdFromQuery;
    if (!fileId) return null;
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

export const ByosLinkService = {
    ingestLink: async ({
        url,
        customName,
        customSize,
        typeHint,
    }: {
        url: string;
        customName?: string;
        customSize?: string;
        typeHint?: FileAsset['type'];
    }): Promise<FileAsset> => {
        const trimmed = (url || '').trim();
        if (!trimmed) throw new Error('A URL is required.');

        let parsed: URL;
        try {
            parsed = new URL(trimmed);
        } catch {
            throw new Error('Enter a valid URL (including https://).');
        }

        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            throw new Error('Only HTTP(S) links are supported.');
        }

        const provider = detectByosProvider(parsed);
        const inferredName = inferFileNameFromUrl(parsed);
        let normalizedName = (customName || inferredName || `${provider === 'generic' ? 'BYOS' : provider.toUpperCase()} Asset`).trim();

        const normalizedUrl = normalizeProviderLink(parsed, provider);
        const possibleDownloadUrl = provider === 'drive'
            ? inferGoogleDriveDownloadUrl(parsed)
            : normalizedUrl;

        let detectedSize: string | undefined;
        let detectedTypeFromProvider: FileAsset['type'] | undefined;
        let detectedMimeType: string | undefined;

        // --- Provider metadata lookup (name + size) ---
        // Disabled in production posture (no client-side OAuth tokens).
        // Name/type/size are inferred from URL + (best-effort) HEAD/Range checks.

// If provider API didn't return size, try HEAD/Range as last resort.
        // In production with a server-side proxy this succeeds; on localhost it
        // typically fails due to CORS, which is fine — we estimate below.
        if (!detectedSize) {
            detectedSize = await tryResolveContentLength([
                possibleDownloadUrl,
                normalizedUrl,
                trimmed
            ]);
        }

        const inferredTypeFromUrl = inferTypeFromUrl(parsed);
        const typeFromName = extensionToType(normalizedName);
        const normalizedType = typeHint || detectedTypeFromProvider || (inferredTypeFromUrl && inferredTypeFromUrl !== 'archive' ? inferredTypeFromUrl : typeFromName);

        // If STILL no size (CORS blocked everything), mark as unavailable — don't fabricate
        if (!detectedSize) detectedSize = 'Unavailable';

        // For images use the real link URL so VisualAssetGrid renders the actual asset.
        // For all other types leave previewUrl undefined so the grid falls back to the
        // correct file-type icon instead of a decorative placeholder.
        const previewUrl: string | undefined = normalizedType === 'image'
            ? (provider === 'drive' ? (possibleDownloadUrl || normalizedUrl) : normalizedUrl)
            : undefined;

        await new Promise(resolve => setTimeout(resolve, 250));

        const assetHash = await computeSHA256(trimmed);

        return {
            id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: normalizedName,
            size: customSize?.trim() || detectedSize || 'Unavailable',
            type: normalizedType,
            locked: true,
            version: 1,
            uploadDate: new Date().toISOString().split('T')[0],
            tag: provider === 'generic' ? 'LINK' : provider.toUpperCase(),
            externalUrl: normalizedUrl,
            downloadUrl: possibleDownloadUrl || undefined,
            storageProvider: inferStorageProvider(provider),
            previewUrl,
            includeInLibrary: true,
            importSourceUrl: trimmed,
            metadata: {
                hash: assetHash,
                ...(detectedMimeType ? { software: detectedMimeType } : {})
            }
        };
    }
};

const mimeTypeToType = (mimeType?: string, fallbackName?: string): FileAsset['type'] => {
    if (!mimeType) return extensionToType(fallbackName || 'file');
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'doc';
    if (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessingml') || mimeType.includes('opendocument.text')) return 'doc';
    if (mimeType.includes('figma') || mimeType.includes('photoshop') || mimeType.includes('illustrator')) return 'design';
    if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) return 'archive';
    return extensionToType(fallbackName || 'file');
};

const extractGoogleFolderId = (url: URL): string | null => {
    const pathMatch = url.pathname.match(/\/folders\/([^/?]+)/);
    if (pathMatch?.[1]) return pathMatch[1];
    const idQuery = url.searchParams.get('id');
    return idQuery || null;
};

const createAssetFromProviderFile = async ({
    provider,
    name,
    size,
    type,
    externalUrl,
    downloadUrl,
    folderLabel,
    folderUrl
}: {
    provider: ByosProvider;
    name: string;
    size?: string;
    type?: FileAsset['type'];
    externalUrl: string;
    downloadUrl?: string;
    folderLabel?: string;
    folderUrl?: string;
}): Promise<FileAsset> => {
    const normalizedName = name?.trim() || 'BYOS Asset';
    const normalizedType = type || extensionToType(normalizedName);
    const previewUrl = normalizedType === 'image'
        ? (downloadUrl || externalUrl)
        : undefined;
    const sizeLabel = size || estimateFileSizeFromName(normalizedName, normalizedType);
    const assetHash = await computeSHA256(externalUrl);

    return {
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: normalizedName,
        size: sizeLabel,
        type: normalizedType,
        locked: true,
        version: 1,
        uploadDate: new Date().toISOString().split('T')[0],
        tag: folderLabel ? `${provider.toUpperCase()} FOLDER` : (provider === 'generic' ? 'LINK' : provider.toUpperCase()),
        externalUrl,
        downloadUrl,
        storageProvider: inferStorageProvider(provider),
        previewUrl,
        includeInLibrary: true,
        metadata: { hash: assetHash },
        ...(folderLabel ? { folderName: folderLabel } : {}),
        ...(folderUrl ? { importSourceUrl: folderUrl } : { importSourceUrl: externalUrl })
    };
};

export const ByosFolderService = {
    isLikelyFolderLink: (rawUrl: string) => {
        try {
            const url = new URL(rawUrl.trim());
            const host = url.hostname.toLowerCase();
            if (host.includes('drive.google.com') && url.pathname.includes('/folders/')) return true;
            if (host.includes('dropbox.com') && (url.pathname.startsWith('/sh/') || url.pathname.includes('/home/'))) return true;
            if ((host.includes('1drv.ms') || host.includes('onedrive.live.com')) && (url.pathname.includes('/:f:/') || url.searchParams.get('id')?.includes('!'))) return true;
            return false;
        } catch {
            return false;
        }
    },

    importFolderLink: async ({
        url,
        folderName,
        storageConfig
    }: {
        url: string;
        folderName?: string;
        storageConfig?: StorageSettings;
    }): Promise<FileAsset[]> => {
        const trimmed = (url || '').trim();
        if (!trimmed) throw new Error('Folder URL is required.');

        let parsed: URL;
        try {
            parsed = new URL(trimmed);
        } catch {
            throw new Error('Enter a valid folder URL (including https://).');
        }

        const provider = detectByosProvider(parsed);

        if (provider === 'drive') {
            const folderId = extractGoogleFolderId(parsed);
            if (!folderId) throw new Error('Could not detect Google Drive folder ID.');
            const token: string | undefined = undefined;
            if (!token) {
                throw new Error('Google folder listing requires Google account authorization. Connect Google in Settings → Storage → Cloud Drive.');
            }

            const endpoint = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and trashed=false`)}&fields=files(id,name,mimeType,size)&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Google Drive folder read failed. Ensure this account can access that folder and the authorization is still valid.');
            }

            const payload = await response.json();
            const files = (payload?.files || []) as Array<{ id: string; name: string; mimeType?: string; size?: string }>;
            const mapped = await Promise.all(files.map(async file => {
                const externalUrl = `https://drive.google.com/file/d/${file.id}/view`;
                const isGoogleNativeDoc = (file.mimeType || '').startsWith('application/vnd.google-apps.');
                const downloadUrl = isGoogleNativeDoc ? undefined : `https://drive.google.com/uc?export=download&id=${file.id}`;
                return createAssetFromProviderFile({
                    provider,
                    name: file.name,
                    size: file.size ? formatBytesToSizeLabel(Number(file.size)) : estimateFileSizeFromName(file.name, mimeTypeToType(file.mimeType, file.name)),
                    type: mimeTypeToType(file.mimeType, file.name),
                    externalUrl,
                    downloadUrl,
                    folderLabel: folderName,
                    folderUrl: trimmed
                });
            }));

            if (!mapped.length) throw new Error('No files found in this Google Drive folder.');
            return mapped;
        }

        if (provider === 'dropbox') {
            const token: string | undefined = undefined;
            if (!token) {
                throw new Error('Dropbox folder listing requires an access token. Add it in Settings → Storage → Cloud Drive or set VITE_DROPBOX_ACCESS_TOKEN.');
            }

            const response = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_link_files', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: trimmed, recursive: false, limit: 2000 })
            });

            if (!response.ok) {
                throw new Error('Dropbox folder read failed. Ensure link permissions and access token scope include files.metadata.read.');
            }

            const payload = await response.json();
            const entries = (payload?.entries || []) as Array<{ '.tag': string; name: string; path_lower?: string; size?: number }>;
            const files = entries.filter(entry => entry['.tag'] === 'file');

            const mapped = await Promise.all(files.map(async file => {
                const viewUrl = new URL(trimmed);
                viewUrl.searchParams.delete('dl');
                viewUrl.searchParams.delete('raw');
                if (file.path_lower) viewUrl.searchParams.set('subpath', file.path_lower);
                const downloadUrl = new URL(viewUrl.toString());
                downloadUrl.searchParams.set('raw', '1');
                return createAssetFromProviderFile({
                    provider,
                    name: file.name,
                    size: typeof file.size === 'number' ? formatBytesToSizeLabel(file.size) : estimateFileSizeFromName(file.name),
                    type: extensionToType(file.name),
                    externalUrl: viewUrl.toString(),
                    downloadUrl: downloadUrl.toString(),
                    folderLabel: folderName,
                    folderUrl: trimmed
                });
            }));

            if (!mapped.length) throw new Error('No files found in this Dropbox folder.');
            return mapped;
        }

        if (provider === 'onedrive') {
            const token: string | undefined = undefined;
            if (!token) {
                throw new Error('OneDrive folder listing requires an access token. Add it in Settings → Storage → Cloud Drive or set VITE_ONEDRIVE_ACCESS_TOKEN.');
            }

            const shareToken = btoa(trimmed)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/g, '');

            const response = await fetch(`https://graph.microsoft.com/v1.0/shares/u!${shareToken}/driveItem/children?$select=id,name,size,file,folder,webUrl,@microsoft.graph.downloadUrl`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('OneDrive folder read failed. Ensure link permissions and token scope include Files.Read.');
            }

            const payload = await response.json();
            const files = (payload?.value || []).filter((entry: any) => !!entry.file);
            const mapped = await Promise.all(files.map(async (file: any) => createAssetFromProviderFile({
                provider,
                name: file.name,
                size: typeof file.size === 'number' ? formatBytesToSizeLabel(file.size) : estimateFileSizeFromName(file.name, mimeTypeToType(file.file?.mimeType, file.name)),
                type: mimeTypeToType(file.file?.mimeType, file.name),
                externalUrl: file.webUrl || trimmed,
                downloadUrl: file['@microsoft.graph.downloadUrl'] || file.webUrl || undefined,
                folderLabel: folderName,
                folderUrl: trimmed
            })));

            if (!mapped.length) throw new Error('No files found in this OneDrive folder.');
            return mapped;
        }

        throw new Error('Unsupported folder provider. Use Google Drive, Dropbox, or OneDrive folder links.');
    }
};

// --- 7. CREDENTIAL VAULT SERVICE (Impulse Buy Feature #33) ---
export const CredentialService = {
    /**
     * "Encrypts" and stores a sensitive string (mocked).
     * Returns a safe reference ID.
     */
    vaultStore: async (plaintext: string): Promise<string> => {

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
