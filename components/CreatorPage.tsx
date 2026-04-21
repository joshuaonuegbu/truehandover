
import React, { useState, useEffect, useMemo } from 'react';

// Lightweight client-side URL â†’ human-friendly type label (for the import-link modal preview badge).
const detectTypeFromUrl = (raw: string): string | null => {
    try {
        const parsed = new URL(raw.trim());
        // Try path first, then check for filename in query (dl.dropboxusercontent etc.)
        const fromPath = parsed.pathname.split('/').filter(Boolean).pop() || '';
        const fromQuery = parsed.searchParams.get('fname') || parsed.searchParams.get('name') || '';
        const candidate = fromPath.includes('.') ? fromPath : (fromQuery || fromPath);
        const ext = candidate.split('.').pop()?.toLowerCase().replace(/[?#&].*/, '') || '';
        const map: Record<string, string> = {
            jpg: 'Image', jpeg: 'Image', png: 'Image', gif: 'Image',
            webp: 'Image', bmp: 'Image', svg: 'Image', avif: 'Image', tiff: 'Image',
            mp4: 'Video', mov: 'Video', avi: 'Video', webm: 'Video', mkv: 'Video', m4v: 'Video',
            mp3: 'Audio', wav: 'Audio', ogg: 'Audio', flac: 'Audio', m4a: 'Audio',
            pdf: 'PDF',
            doc: 'Document', docx: 'Document', txt: 'Document', md: 'Document', rtf: 'Document',
            xls: 'Spreadsheet', xlsx: 'Spreadsheet', csv: 'Spreadsheet', numbers: 'Spreadsheet',
            ppt: 'Presentation', pptx: 'Presentation', key: 'Presentation',
            fig: 'Design', psd: 'Design', ai: 'Design', sketch: 'Design', xd: 'Design',
            zip: 'Archive', rar: 'Archive', '7z': 'Archive', tar: 'Archive', gz: 'Archive',
        };
        return map[ext] ?? null;
    } catch {
        return null;
    }
};
import {
    ChevronLeft, Save, Upload, Calendar, DollarSign,
    User, FileText, Plus, X, Image as ImageIcon,
    Music, File, CheckCircle, LayoutTemplate,
    Link as LinkIcon, Cloud, RefreshCw,
    Sun, Moon, Grid, Activity, MoreHorizontal, Slash,
    Hexagon, Cpu, Plus as PlusIcon, Square, Trash2,
    Layers, ToggleRight, MessageSquare, Flag, PenTool,
    Wallet, Smartphone, Mail, Coins, ShieldAlert,
    Infinity, Hourglass, Flame, Camera, Type,
    Target, Radio, Crosshair, Box, Play, Hash,
    Monitor, AlertCircle, Loader2, Key, PanelLeftClose, PanelLeftOpen, EyeOff, Pencil
} from 'lucide-react';
import { Project, FileAsset, ProjectTheme, Milestone, UserProfile, CredentialBlock } from '../types';
import { playClick, playSuccess } from '../utils/sound';
import ClientPreviewBiz from './ClientPreviewBiz';
import { InlineErrorBanner } from './Shared';
import { DB } from '../services/supabaseClient';
// Import the Backend Service and R2 Service
import { ProcessingService, ByosFolderService, ByosLinkService } from '../api/mockBackend';
import { R2Service } from '../services/r2';

interface CreatorPageProps {
    existingProject?: Project | null;
    allProjects?: Project[];
    onSave: (project: Project) => void;
    onBack: () => void;
    user?: UserProfile;
    themeMode?: 'light' | 'dark' | 'system';
}

const createClientLinkToken = () => {
    const rand = crypto.getRandomValues(new Uint8Array(16));
    const hex = Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('');
    return `cl_${hex}_${Date.now().toString(36)}`;
};

const ARCHIVED_LAYOUT_IDS = new Set(['cinema', 'split', 'portfolio', 'modeler', 'studio']);
const normalizePortalLayoutForPicker = (layout?: string): string => {
    if (!layout || ARCHIVED_LAYOUT_IDS.has(layout)) return 'default';
    return layout;
};


// --- VISUAL CONSTANTS ---
// High-visibility SVG Grain (Matching ClientPreviewPage)
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`;
const HERO_NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

// --- PREMIUM WALLPAPERS ---
const WALLPAPER_PRESETS: ProjectTheme[] = [
    {
        name: 'Executive Matte',
        wallpaper: '',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Concrete Studio',
        wallpaper: 'https://images.unsplash.com/photo-1487700160041-babef9c3cb55?q=80&w=2000&auto=format&fit=crop',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Midnight Silk',
        // Unsplash: a stone head with floral patterns (f5MVCuuriig)
        wallpaper: 'https://images.unsplash.com/photo-1753301638967-af6527de668e?auto=format&fit=crop&w=2000&q=80',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Titanium Mesh',
        wallpaper: 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?q=80&w=2000&auto=format&fit=crop',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Swiss Gallery',
        wallpaper: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=2000&auto=format&fit=crop&q=60',
        brightness: 'light',
        showGrain: false
    },
    {
        name: 'Obsidian Geometric',
        // Unsplash: abstract metallic sculpture with swirling blue/silver forms (J0TVQwQ0wqE)
        wallpaper: 'https://images.unsplash.com/photo-1768928955656-ee026c4baf15?auto=format&fit=crop&w=2000&q=80',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Deep Cosmos',
        // Unsplash: snowy mountain peak under a clear blue sky (l6x954tJsaA)
        wallpaper: 'https://images.unsplash.com/photo-1770909010343-47e39d4fa0b3?auto=format&fit=crop&w=2000&q=80',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Desert Dunes',
        wallpaper: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=2000&auto=format&fit=crop',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Royal Emerald',
        wallpaper: 'https://images.unsplash.com/photo-1615800098779-1be32e60cca3?q=80&w=2000&auto=format&fit=crop',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Platinum Foil',
        wallpaper: 'https://images.unsplash.com/photo-1533228876829-65c94e7b5025?q=80&w=2000&auto=format&fit=crop',
        brightness: 'light',
        showGrain: true
    },
    {
        name: 'Studio Smoke',
        wallpaper: 'https://images.unsplash.com/photo-1536514498073-50e69d39c6cf?q=80&w=2000&auto=format&fit=crop',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Aero Steel',
        // Unsplash: pink/green/blue abstract painting (UYgrVfIhBec)
        // NOTE: Avoid source.unsplash.com (often 503 / slow). Use direct CDN image instead.
        wallpaper: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=2000&q=80',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Ultraviolet Waves',
        // Unsplash: abstract purple wavy lines (WNkrBt0CiDQ)
        // NOTE: Avoid source.unsplash.com (often 503 / slow). Use direct CDN image instead.
        wallpaper: 'https://plus.unsplash.com/premium_photo-1667423711626-01ef87e78ec9?auto=format&fit=crop&w=2000&q=80',
        brightness: 'dark',
        showGrain: true
    }
];

// ... (Rest of Constants: AVATAR_PRESETS, PATTERNS, MESSAGE_PRESETS remain unchanged) ...
const AVATAR_PRESETS = [
    'https://api.dicebear.com/9.x/shapes/svg?seed=Hyper&backgroundColor=0a0a0a&shape1Color=bef264&shape2Color=ffffff&shape3Color=52525b',
    'https://api.dicebear.com/9.x/shapes/svg?seed=Flux&backgroundColor=18181b&shape1Color=3b82f6&shape2Color=93c5fd&shape3Color=1e3a8a',
    'https://api.dicebear.com/9.x/shapes/svg?seed=Orbit&backgroundColor=0f172a&shape1Color=f472b6&shape2Color=fbcfe8&shape3Color=831843',
    'https://api.dicebear.com/9.x/shapes/svg?seed=Prism&backgroundColor=171717&shape1Color=2dd4bf&shape2Color=ccfbf1&shape3Color=115e59',
    'https://api.dicebear.com/9.x/shapes/svg?seed=Vertex&backgroundColor=27272a&shape1Color=a78bfa&shape2Color=ddd6fe&shape3Color=5b21b6',
    'https://api.dicebear.com/9.x/shapes/svg?seed=Nexus&backgroundColor=000000&shape1Color=fbbf24&shape2Color=fef3c7&shape3Color=78350f',
    'https://api.dicebear.com/9.x/shapes/svg?seed=Echo&backgroundColor=1f2937&shape1Color=f87171&shape2Color=fee2e2&shape3Color=7f1d1d',
    'https://api.dicebear.com/9.x/shapes/svg?seed=Zenith&backgroundColor=111827&shape1Color=34d399&shape2Color=d1fae5&shape3Color=064e3b',
    'https://api.dicebear.com/9.x/shapes/svg?seed=Pulse&backgroundColor=09090b&shape1Color=60a5fa&shape2Color=dbeafe&shape3Color=1e40af',
    'https://api.dicebear.com/9.x/shapes/svg?seed=Quantum&backgroundColor=1c1917&shape1Color=c084fc&shape2Color=f3e8ff&shape3Color=6b21a8',
];

const PATTERNS = [
    { id: 'lines', label: 'Diagonal', icon: Slash },
    { id: 'dots', label: 'Polka', icon: MoreHorizontal },
    { id: 'grid', label: 'Standard', icon: Grid },
    { id: 'graph', label: 'Graph', icon: LayoutTemplate },
    { id: 'plus', label: 'Blueprint', icon: PlusIcon },
    { id: 'cross', label: 'Cross', icon: PlusIcon },
    { id: 'hex', label: 'Honeycomb', icon: Hexagon },
    { id: 'rhombus', label: 'Rhombus', icon: Square },
    { id: 'waves', label: 'Waves', icon: Activity },
    { id: 'radar', label: 'Radar', icon: Target },
    { id: 'zigzag', label: 'ZigZag', icon: Activity },
    { id: 'none', label: 'Clean', icon: X },
];

const MESSAGE_PRESETS = [
    {
        label: 'Standard',
        text: "Hi {{name}}, please review the watermarked previews. Once the final balance is settled, the original high-resolution files will unlock instantly."
    },
    {
        label: 'Formal',
        text: "Attached are the final deliverables for the project. Please process the remaining balance to release the high-resolution files."
    },
    {
        label: 'Casual',
        text: "Hey {{name}}! Here is the final work. You can download the full quality assets instantly after the balance is paid. Thanks!"
    },
    {
        label: 'Short',
        text: "Final assets ready. Payment required to unlock download."
    },
    {
        label: 'Warm',
        text: "Hi {{name}} - everything is ready. Take a look at the previews, and when you're happy, you can complete payment to unlock the full-resolution files immediately. Appreciate you!"
    },
    {
        label: 'Hand-Off',
        text: "Hi {{name}}, here's your delivery. You can preview everything now, and the secure download unlocks as soon as the remaining balance is paid. If you'd like any tweaks, just request a correction on the specific file."
    },
    {
        label: 'Milestones',
        text: "Hi {{name}}, your deliverables are ready for review. Once the current milestone is settled, the matching files will unlock for download right away."
    },
    {
        label: 'Contract',
        text: "Hi {{name}}, the final package is ready. Please review the previews and sign/pay to unlock the production files. Thank you."
    }
];

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => { playClick(); onChange(!checked); }}
        className={`w-11 h-6 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${checked ? 'bg-lime-400 dark:bg-lime-400' : 'bg-zinc-200 dark:bg-white/10'}`}
    >
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${checked ? 'translate-x-5 bg-white dark:bg-zinc-950' : 'bg-white dark:bg-zinc-500'}`} />
    </button>
);

const CreatorPage: React.FC<CreatorPageProps> = ({ existingProject, allProjects = [], onSave, onBack, user, themeMode = 'system' }) => {

    /** Returns `name` uniquified against `existingNames`, e.g. "photo (2).jpg" */
    const deduplicateFileName = (name: string, existingNames: string[]): string => {
        if (!existingNames.includes(name)) return name;
        const dotIdx = name.lastIndexOf('.');
        const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
        const ext = dotIdx > 0 ? name.slice(dotIdx) : '';
        let n = 1;
        let candidate = `${base} (${n})${ext}`;
        while (existingNames.includes(candidate)) { n++; candidate = `${base} (${n})${ext}`; }
        return candidate;
    };

    const estimateSizeFromAssetShape = (asset: Pick<FileAsset, 'name' | 'type'>): string => {
        const ext = (asset.name.split('.').pop() || '').toLowerCase();
        const defaultsByExt: Record<string, number> = {
            jpg: 3, jpeg: 3, png: 5, webp: 2, gif: 4, svg: 0.1,
            mp4: 45, mov: 120, webm: 25, avi: 80, mkv: 100,
            mp3: 5, wav: 35, m4a: 6, flac: 30,
            pdf: 2, doc: 1, docx: 1, txt: 0.05, md: 0.03,
            zip: 20, rar: 25, '7z': 20,
            fig: 12, psd: 80, ai: 35
        };
        const defaultsByType: Record<FileAsset['type'], number> = {
            image: 3,
            video: 45,
            audio: 5,
            pdf: 2,
            doc: 1,
            archive: 20,
            design: 15
        };
        const mb = defaultsByExt[ext] ?? defaultsByType[asset.type] ?? 5;
        if (mb < 1) return `${Math.max(1, Math.round(mb * 1024))} KB`;
        return `${mb.toFixed(2)} MB`;
    };

    const normalizeUnknownSize = (asset: FileAsset): FileAsset => {
        const current = (asset.size || '').trim();
        if (!current || /^unknown size/i.test(current)) {
            return { ...asset, size: estimateSizeFromAssetShape(asset) };
        }
        return asset;
    };

    // --- Draft key & one-time synchronous draft read (avoids useEffect race) ---
    const DRAFT_KEY = `th_creator_draft_${existingProject?.id || 'new'}`;
    const initialDraftRef = React.useRef<{ formData?: Partial<Project>; files?: FileAsset[] } | null | undefined>(undefined);
    if (initialDraftRef.current === undefined) {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            initialDraftRef.current = raw ? JSON.parse(raw) : null;
        } catch { initialDraftRef.current = null; }
    }
    const _initialDraft = initialDraftRef.current;

    // Initial State Construction
    const [formData, setFormData] = useState<Partial<Project>>(() => {
        // Prefer draft over persisted project so in-progress edits survive navigation
        if (_initialDraft?.formData) {
            const draft = _initialDraft.formData as any;
            const safePaymentMethods = { ...(draft.paymentMethods || {}) };
            if (safePaymentMethods.bankInfo) safePaymentMethods.bankInfo = '';
            return { ...draft, paymentMethods: safePaymentMethods };
        }

        const base = existingProject || {
            name: '',
            client: { name: '', email: '', phone: '', company: '', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=Client&backgroundColor=0a0a0a' },
            amount: 0,
            status: 'draft',
            dueDate: '',
            files: [],
            milestones: [],
            credentials: [],
            message: '',
            enableClientLibrary: false,
            requiresSignature: false,
            enableTips: false,
            useMilestones: false,
            showWatermark: true,
            showProtectedLabel: true,
            accessConfig: { mode: 'permanent' },
            paymentMethods: {
                stripeEnabled: Boolean(user?.stripeConnect?.connected || user?.stripeConnect?.accountId),
                venmo: '',
                cashapp: '',
                paypal: '',
                zelle: '',
                bankInfo: ''
            }
        };

        const defaultTheme = WALLPAPER_PRESETS[1];
        const incomingTheme = existingProject?.theme;

        const finalTheme = {
            ...defaultTheme,
            ...(incomingTheme || {}),
            showGrain: incomingTheme?.showGrain !== undefined ? incomingTheme.showGrain : true,
            pattern: incomingTheme?.pattern || 'lines'
        };

        return { ...base, theme: finalTheme };
    });

    const [files, setFiles] = useState<FileAsset[]>(() => {
        if (_initialDraft?.files?.length) return _initialDraft.files.map(normalizeUnknownSize);
        return (existingProject?.files || []).map(normalizeUnknownSize);
    });
    // Derived live set of URLs currently in the project — updates automatically when files are removed.
    // Using useMemo instead of a static useState<Set> so that deleting a file immediately unblocks its URL.
    const usedImportUrls = useMemo<Set<string>>(
        () => new Set(files.map(f => f.importSourceUrl || '').filter(Boolean)),
        [files]
    );
    const [editingFile, setEditingFile] = useState<{ idx: number; value: string } | null>(null);
    const [editingSize, setEditingSize] = useState<{ idx: number; value: string } | null>(null);
    const [draftRestoredNotice, setDraftRestoredNotice] = useState(!!_initialDraft?.formData || !!((_initialDraft?.files?.length || 0) > 0));
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [newLink, setNewLink] = useState({ name: '', url: '', size: '' });
    const [linkError, setLinkError] = useState<string | null>(null);
    const [linkNameWarning, setLinkNameWarning] = useState<string | null>(null);
    const [linkImportSuccess, setLinkImportSuccess] = useState<string | null>(null);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [detectedLinkType, setDetectedLinkType] = useState<string | null>(null);
    // External link imports are supported, but they're not as secure as native uploads.
    // For protected delivery (watermarked previews + gated downloads), upload files to platform storage.
    const [errors, setErrors] = useState<{ name?: boolean, amount?: boolean, files?: boolean }>({});

    // Credential Modal State
    const [showCredentialModal, setShowCredentialModal] = useState(false);
    const [newCredential, setNewCredential] = useState<Partial<CredentialBlock>>({});

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ status: 'uploading' | 'processing' | 'done', percent: number }>({ status: 'done', percent: 0 });
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Theme State
    const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'system'>(themeMode);
    const [systemDark, setSystemDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [customWallpapers, setCustomWallpapers] = useState<ProjectTheme[]>([]);
    const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
    const [isPreviewDockedSidebarCollapsed, setIsPreviewDockedSidebarCollapsed] = useState(false);
    const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'tablet' | 'mobile' | 'foldable'>('desktop');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const assetInputRef = React.useRef<HTMLInputElement>(null); // For asset uploads
    const stripeConnected = Boolean(user?.stripeConnect?.connected || user?.stripeConnect?.accountId);
    const draftProjectIdRef = React.useRef<string>(existingProject?.id || crypto.randomUUID());
    const draftClientLinkRef = React.useRef<string>(existingProject?.clientLink && existingProject.clientLink !== '#'
        ? existingProject.clientLink
        : createClientLinkToken());
    const appliedBrandKitEmailRef = React.useRef<string | null>(null);

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    useEffect(() => {
        setPreviewTheme(themeMode);
    }, [themeMode]);

    useEffect(() => {
        const email = (formData.client?.email || '').trim().toLowerCase();
        if (!email) {
            appliedBrandKitEmailRef.current = null;
            return;
        }
        if (appliedBrandKitEmailRef.current === email) return;

        const kits = (user?.agencySettings?.brandKits || {}) as Record<string, any>;
        const kit = kits[email];
        if (!kit) return;

        appliedBrandKitEmailRef.current = email;
        setFormData(prev => ({
            ...prev,
            client: {
                ...(prev.client as any),
                avatar: kit.logoUrl || (prev.client as any)?.avatar,
            },
            theme: {
                ...(prev.theme || WALLPAPER_PRESETS[1]),
                brandPrimary: kit.primaryColor || (prev.theme as any)?.brandPrimary,
                brandAccent: kit.accentColor || (prev.theme as any)?.brandAccent,
                brandLogoUrl: kit.logoUrl || (prev.theme as any)?.brandLogoUrl,
            },
        }));
    }, [formData.client?.email, user?.agencySettings?.brandKits]);

    // Continuous auto-save — persists every editor change to localStorage so
    // navigating away never loses work.  Draft is cleared only on Publish.
    const hasMountedRef = React.useRef(false);
    useEffect(() => {
        // Skip the very first render (state is already from localStorage via _initialDraft)
        if (!hasMountedRef.current) { hasMountedRef.current = true; return; }
        if (files.length === 0 && !(formData.name || '').trim()) {
            localStorage.removeItem(DRAFT_KEY);
            return;
        }
        const safePaymentMethods = { ...(formData.paymentMethods || {}) };
        if ((safePaymentMethods as any).bankInfo) (safePaymentMethods as any).bankInfo = '';
        const safeFormData = { ...formData, paymentMethods: safePaymentMethods };
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData: safeFormData, files }));
    }, [formData, files]); // eslint-disable-line react-hooks/exhaustive-deps

    const isPreviewDark = previewTheme === 'system' ? systemDark : previewTheme === 'dark';
    const isCanvasPreviewMode = previewDeviceMode !== 'desktop';
    const connectedDriveProviders: string[] = [];

    const cyclePreviewTheme = () => {
        playClick();
        if (previewTheme === 'system') setPreviewTheme('light');
        else if (previewTheme === 'light') setPreviewTheme('dark');
        else setPreviewTheme('system');
    };

    const previewProject: Project = {
        id: existingProject?.id || draftProjectIdRef.current,
        name: formData.name || 'Untitled Project',
        description: formData.description || '',
        client: formData.client as any,
        amount: formData.amount || 0,
        status: (formData.status as any) || 'draft',
        createdAt: existingProject?.createdAt || new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
        files: files,
        milestones: formData.milestones || [],
        credentials: formData.credentials || [],
        requiresSignature: formData.requiresSignature || false,
        enableTips: formData.enableTips || false,
        useMilestones: formData.useMilestones || false,
        paymentMethods: formData.paymentMethods,
        clientLink: existingProject?.clientLink && existingProject.clientLink !== '#'
            ? existingProject.clientLink
            : draftClientLinkRef.current,
        type: 'web',
        message: formData.message,
        enableClientLibrary: formData.enableClientLibrary !== false,
        accessConfig: formData.accessConfig,
        showWatermark: formData.showWatermark !== false,
        showProtectedLabel: formData.showProtectedLabel !== false,
        theme: {
            ...(formData.theme || WALLPAPER_PRESETS[1]),
            pattern: formData.theme?.pattern || 'lines',
            showGrain: formData.theme?.showGrain !== undefined ? formData.theme.showGrain : true
        }
    };

    const previewClientEmail = (previewProject.client?.email || '').trim().toLowerCase();
    const libraryProjects = allProjects.filter(p => {
        if (p.id === previewProject.id) return false;
        if (p.enableClientLibrary === false) return false;
        if ((p.status !== 'paid' && p.status !== 'completed') || !p.files?.some(f => f.includeInLibrary !== false)) return false;
        const candidateEmail = (p.client?.email || '').trim().toLowerCase();
        return previewClientEmail.length > 0 && candidateEmail === previewClientEmail;
    });

    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault();

        const newErrors = {
            name: !formData.name?.trim(),
            amount: !formData.amount || formData.amount <= 0,
            files: files.length === 0
        };

        if (newErrors.name || newErrors.amount || newErrors.files) {
            setErrors(newErrors);
            playClick();
            return;
        }

        playSuccess();
        localStorage.removeItem(DRAFT_KEY);
        const project: Project = {
            ...previewProject,
            id: previewProject.id
        };
        onSave(project);
        onBack();
    };

    // --- INTEGRATED REAL & MOCK BACKEND LOGIC ---
    const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        playClick();
        setUploadError(null);
        const file = e.target.files[0];
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const isDocLike = ['txt', 'md', 'rtf', 'doc', 'docx', 'odt', 'pages'].includes(ext)
            || file.type.startsWith('text/')
            || file.type.includes('word')
            || file.type.includes('officedocument')
            || file.type.includes('opendocument.text');
        const fileType = file.type.startsWith('image')
            ? 'image'
            : file.type.startsWith('video')
                ? 'video'
                : file.type.includes('pdf')
                    ? 'pdf'
                    : isDocLike
                        ? 'doc'
                        : file.type.startsWith('audio')
                            ? 'audio'
                            : 'archive';

        setIsUploading(true);
        setUploadProgress({ status: 'uploading', percent: 10 });

        try {
            let uploadedFileSize = '0 MB';
            let originalKey = '';
            let previewKey: string | undefined;

            const isDemoUser = !user?.id || user.id === 'u1';

            // Auto-fill project name if empty (Simple & Elegant!)
            let resolvedName = formData.name?.trim() || '';
            if (!resolvedName && file) {
                resolvedName = file.name;
                setFormData(prev => ({ ...prev, name: resolvedName }));
            }
            if (!resolvedName) resolvedName = 'Untitled Project';

            if (!isDemoUser) {
                // Ensure the project exists in Supabase before requesting presigned URLs.
                // (Presign validates ownership via projects table + RLS.)
                await DB.saveProject({
                    id: previewProject.id,
                    user_id: user.id,
                    name: resolvedName,
                    description: formData.description || null,
                    client: formData.client || {},
                    amount: formData.amount || 0,
                    status: (formData.status as any) || 'draft',
                    client_link: previewProject.clientLink,
                    due_date: formData.dueDate || null,
                    type: previewProject.type,
                    theme: previewProject.theme || {},
                    requires_signature: Boolean(formData.requiresSignature),
                    enable_tips: Boolean(formData.enableTips),
                    payment_methods: formData.paymentMethods || {},
                    use_milestones: Boolean(formData.useMilestones),
                    message: formData.message || null,
                    enable_client_library: formData.enableClientLibrary !== false,
                    access_config: formData.accessConfig || {},
                    show_watermark: formData.showWatermark !== false,
                    show_protected_label: formData.showProtectedLabel !== false,
                });
            }

            // 1) Generate a PREVIEW (watermarked) and upload separately when applicable.
            setUploadProgress({ status: 'processing', percent: 70 });
            const previewUrl = await ProcessingService.generateWatermarkedPreview(file);

            if (isDemoUser) {
                // Demo mode: keep everything local (no server-side storage).
                uploadedFileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            } else {
                // 2) Upload ORIGINAL via presigned URL (server-side R2 credentials).
                const original = await R2Service.uploadFileWithPresignedUrl(
                    file,
                    previewProject.id,
                    'original',
                    (p) => setUploadProgress({ status: 'uploading', percent: p })
                );
                originalKey = original.key;
                uploadedFileSize = original.size;

                // Only upload preview objects we can safely render (images for now).
                if (file.type.startsWith('image/')) {
                    const previewBlob = await fetch(previewUrl).then(r => r.blob());
                    const previewFile = new window.File(
                        [previewBlob],
                        `preview-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.+/g, '.')}.png`,
                        { type: previewBlob.type || 'image/png' }
                    );
                    const previewUpload = await R2Service.uploadFileWithPresignedUrl(
                        previewFile,
                        previewProject.id,
                        'preview'
                    );
                    previewKey = previewUpload.key;
                }
            }

            setUploadProgress({ status: 'done', percent: 100 });

            // Generate SHA-256 from file contents for audit-log fingerprinting
            let fileHash = '';
            try {
                const buffer = await file.arrayBuffer();
                const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                fileHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
            } catch { /* non-fatal */ }

            const newFile: FileAsset = {
                id: crypto.randomUUID(),
                name: deduplicateFileName(file.name, files.map(f => f.name)),
                size: uploadedFileSize,
                type: fileType as any,
                locked: true, // Locked by default
                version: 1,
                uploadDate: new Date().toISOString().split('T')[0],
                tag: 'DRAFT',
                storageProvider: 'native',
                previewUrl: previewUrl,
                includeInLibrary: true,
                metadata: {
                    ...(fileHash ? { hash: fileHash } : {}),
                    originalKey,
                    ...(previewKey ? { previewKey } : {}),
                } as any,
            };

            setFiles([...files, newFile]);
            setErrors(prev => ({ ...prev, files: false }));
            playSuccess();

        } catch (error) {
            console.error("Upload failed", error);
            setUploadError('Upload failed. Please check your storage configuration and try again.');
        } finally {
            setIsUploading(false);
            if (assetInputRef.current) assetInputRef.current.value = ''; // Reset input
        }
    };

    const handleAddLink = async () => {
        const trimmedUrl = newLink.url.trim();
        if (!trimmedUrl) {
            setLinkError('URL is required.');
            return;
        }

        // Duplicate URL — hard block (checks original input AND any previously-normalised importSourceUrl)
        if (usedImportUrls.has(trimmedUrl)) {
            setLinkError('This exact link is already in this project.');
            return;
        }
        const alsoExistsNormalised = files.some(
            f => (f.externalUrl || '').trim() === trimmedUrl || (f.importSourceUrl || '').trim() === trimmedUrl
        );
        if (alsoExistsNormalised) {
            setLinkError('This exact link is already in this project.');
            return;
        }

        try {
            setIsAddingLink(true);
            playClick();
            let parsed: URL;
            try {
                parsed = new URL(trimmedUrl);
            } catch {
                throw new Error('Enter a valid URL (including https://).');
            }

            const host = parsed.hostname.toLowerCase();
            const provider: 'google' | 'dropbox' | 'onedrive' | 'unknown' =
                host.includes('drive.google.com') || host.includes('docs.google.com')
                    ? 'google'
                    : host.includes('dropbox.com') || host.includes('dropboxusercontent.com')
                        ? 'dropbox'
                        : host.includes('1drv.ms') || host.includes('onedrive.live.com') || host.includes('sharepoint.com')
                            ? 'onedrive'
                            : 'unknown';

            if (ByosFolderService.isLikelyFolderLink(trimmedUrl)) {
                throw new Error('Folder links are not supported yet. Paste a direct file link instead.');
            }

            if (provider === 'unknown') {
                setLinkNameWarning('Tip: For best results, use direct file links from Drive/Dropbox/OneDrive.');
            }

            const importedAsset = await ByosLinkService.ingestLink({
                url: trimmedUrl,
                customName: newLink.name.trim() || undefined,
                customSize: newLink.size.trim() || undefined,
            });
            const renamedAsset = normalizeUnknownSize({ ...importedAsset, name: deduplicateFileName(importedAsset.name, files.map(f => f.name)) });
            setFiles(prev => [...prev, renamedAsset]);
            setLinkImportSuccess(`"${renamedAsset.name}" imported.`);
            setNewLink({ name: '', url: '', size: '' });
            setLinkError(null);
            setLinkNameWarning(null);
            setDetectedLinkType(null);
            // Modal stays open so the creator can add more links without re-opening
            setErrors(prev => ({ ...prev, files: false }));
            playSuccess();
        } catch (error: any) {
            setLinkError(error?.message || 'Could not process this link.');
        } finally {
            setIsAddingLink(false);
        }
    };

    // CREDENTIAL VAULT LOGIC
    const handleAddCredential = () => {
        if (!newCredential.serviceName || !newCredential.username || !newCredential.password) return;
        playClick();
        const block: CredentialBlock = {
            id: `cred_${Date.now()}`,
            serviceName: newCredential.serviceName,
            username: newCredential.username,
            password: newCredential.password,
            notes: newCredential.notes || ''
        };
        setFormData({
            ...formData,
            credentials: [...(formData.credentials || []), block]
        });
        setNewCredential({});
        setShowCredentialModal(false);
        playSuccess();
    };

    const removeCredential = (id: string) => {
        playClick();
        setFormData({
            ...formData,
            credentials: (formData.credentials || []).filter(c => c.id !== id)
        });
    };

    // ... [Rest of Component UI remains identical] ...

    const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            const currentTheme = formData.theme || WALLPAPER_PRESETS[1];

            const newTheme: ProjectTheme = {
                name: `Custom ${customWallpapers.length + 1}`,
                wallpaper: url,
                brightness: 'dark',
                showGrain: true
            };

            setCustomWallpapers([...customWallpapers, newTheme]);
            setFormData({
                ...formData,
                theme: { ...currentTheme, ...newTheme }
            });
            playSuccess();
        }
    };

    const handleDeleteCustomWallpaper = (e: React.MouseEvent, wallpaperUrl: string) => {
        e.stopPropagation();
        playClick();
        setCustomWallpapers(customWallpapers.filter(w => w.wallpaper !== wallpaperUrl));
        if (formData.theme?.wallpaper === wallpaperUrl) {
            setFormData({
                ...formData,
                theme: { ...WALLPAPER_PRESETS[1], pattern: formData.theme.pattern }
            });
        }
    };

    const handleAutoGenerateAvatar = () => {
        const name = formData.client?.name || 'Client';
        const seed = name.trim().length > 0 ? name : 'Client';
        const url = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0a0a0a`;
        setFormData({ ...formData, client: { ...formData.client!, avatar: url } });
        playClick();
    };

    const toggleGrain = () => {
        playClick();
        const currentTheme = formData.theme || WALLPAPER_PRESETS[1];
        setFormData({
            ...formData,
            theme: { ...currentTheme, showGrain: !currentTheme.showGrain }
        });
    };

    const addMilestone = () => {
        const newMilestone: Milestone = {
            id: `m-${Date.now()}`,
            title: '',
            amount: 0,
            status: 'pending',
            dueDate: ''
        };
        setFormData({
            ...formData,
            milestones: [...(formData.milestones || []), newMilestone]
        });
    };

    const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
        const updated = [...(formData.milestones || [])];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, milestones: updated });
    };

    const removeMilestone = (index: number) => {
        const updated = [...(formData.milestones || [])];
        updated.splice(index, 1);
        setFormData({ ...formData, milestones: updated });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f0f2f5] dark:bg-cosmic relative">
            <div
                className="absolute inset-0 opacity-[0.06] dark:opacity-0 mix-blend-multiply pointer-events-none z-0"
                style={{
                    backgroundImage: HERO_NOISE_SVG,
                    backgroundSize: '250px 250px',
                    filter: 'contrast(2200%) brightness(102%)'
                }}
            />
            <div
                className="absolute inset-0 opacity-0 dark:opacity-[0.82] mix-blend-overlay pointer-events-none z-0"
                style={{
                    backgroundImage: HERO_NOISE_SVG,
                    backgroundSize: '250px 250px',
                    filter: 'contrast(2700%) brightness(102%)'
                }}
            />
            <style>{`
                /* Ensure the native date picker icon stays visible in dark mode without forcing a light color-scheme. */
                .dark .th-date-input::-webkit-calendar-picker-indicator {
                    filter: invert(1) brightness(1.15);
                    opacity: 0.85;
                }
                .th-date-input::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                }
            `}</style>
            {/* Hidden Input for Wallpaper Upload */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleWallpaperUpload}
            />
            {/* Hidden Input for Asset Upload */}
            <input
                type="file"
                ref={assetInputRef}
                className="hidden"
                // accept multiple types
                onChange={handleAssetUpload}
            />

            {/* LEFT PANEL: EDITOR (~21% width — ~15% narrower than prior 25% / 340px min) */}
            <div className={`${isEditorCollapsed ? 'w-0 min-w-0 opacity-0 pointer-events-none' : 'w-[25%] lg:w-[28%] min-w-[340px] max-w-[480px] opacity-100'} flex flex-col border-r border-zinc-200/80 dark:border-white/10 bg-[#f0f2f5] dark:bg-cosmic relative z-20 overflow-hidden transition-all duration-300`}>
                {/* Match the workspace shell surface instead of a custom editor-only treatment */}
                <div
                    className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply dark:mix-blend-overlay opacity-[0.06] dark:opacity-[0.1]"
                    style={{ backgroundImage: NOISE_SVG, filter: 'contrast(150%)' }}
                ></div>

                {/* Editor Header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-200/80 dark:border-white/10 bg-[#f0f2f5]/92 dark:bg-cosmic/92 backdrop-blur-xl sticky top-0 z-30 relative">
                    <button
                        onClick={() => { playClick(); onBack(); }}
                        className="flex items-center gap-2 text-zinc-500 hover:text-obsidian dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Projects
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={cyclePreviewTheme}
                            className="p-2 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-lime-400 dark:hover:text-lime-400 transition-colors"
                            title={`Preview Theme: ${previewTheme.charAt(0).toUpperCase() + previewTheme.slice(1)}`}
                        >
                            {previewTheme === 'light' && <Sun className="w-4 h-4" />}
                            {previewTheme === 'dark' && <Moon className="w-4 h-4" />}
                            {previewTheme === 'system' && <Monitor className="w-4 h-4" />}
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-lime-400 dark:bg-lime-400 animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Live Editor</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => { playClick(); setIsEditorCollapsed(true); }}
                            className="p-2 rounded-xl bg-zinc-200 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-white/10 transition-all"
                            title="Collapse Editor"
                            aria-label="Collapse Editor"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 scroll-smooth relative z-10">
                    <div>
                        <h2 className="text-3xl font-sans tracking-tight font-semibold tracking-tight mb-1 text-zinc-900 dark:text-white">
                            Project Config
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Changes update the preview instantly.</p>
                    </div>

                    {draftRestoredNotice && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1">Draft restored from your last session. This is only saved locally — publish when ready to go live.</span>
                            <button onClick={() => setDraftRestoredNotice(false)}><X className="w-3 h-3" /></button>
                        </div>
                    )}

                    {/* Basic Info Card */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex justify-between">
                                    Project Name
                                    {errors.name && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Required</span>}
                                </label>
                                <input
                                    value={formData.name}
                                    onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: false }); }}
                                    placeholder="e.g. Q4 Marketing Campaign"
                                    className={`w-full p-3 bg-white dark:bg-white/8 border rounded-xl outline-none transition-colors text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 dark:border-white/10 focus:border-zinc-300 dark:focus:border-white/25'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1 justify-between">
                                        <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Value</div>
                                        {errors.amount && <span className="text-red-500 text-[9px] font-bold">Required</span>}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={e => { setFormData({ ...formData, amount: Number(e.target.value) }); setErrors({ ...errors, amount: false }); }}
                                        className={`w-full p-3 bg-white dark:bg-white/8 border rounded-xl outline-none transition-colors font-mono text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 ${errors.amount ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 dark:border-white/10 focus:border-zinc-300 dark:focus:border-white/25'}`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="th-date-input w-full p-3 bg-white dark:bg-white/8 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Client Card */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                            <User className="w-3 h-3" /> Client Details
                        </h3>

                        {/* Avatar Selector */}
                        <div className="flex items-center gap-4 mb-6">
                            <button type="button" className="relative group cursor-pointer border-none bg-transparent p-0" onClick={() => { playClick(); setShowAvatarSelector(!showAvatarSelector); }}>
                                <img src={formData.client?.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-zinc-200/50 dark:border-white/10" alt="Client Avatar" />
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                            </button>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Persona</p>
                                    <div className="flex gap-2">
                                        <button onClick={handleAutoGenerateAvatar} className="text-[10px] text-zinc-500 hover:text-lime-400 dark:hover:text-lime-400 font-bold hover:underline flex items-center gap-1" title="Generate from Name">
                                            <Type className="w-3 h-3" /> Auto
                                        </button>
                                        <button onClick={() => { playClick(); setShowAvatarSelector(!showAvatarSelector); }} className="text-[10px] text-lime-400 dark:text-lime-400 font-bold hover:underline">
                                            {showAvatarSelector ? 'Close' : 'Browse'}
                                        </button>
                                    </div>
                                </div>
                                {showAvatarSelector && (
                                    <div className="grid grid-cols-5 gap-2 p-2 bg-white dark:bg-white/8 rounded-xl border border-zinc-200/50 dark:border-white/5 animate-fade-in mt-2">
                                        {AVATAR_PRESETS.map((url, i) => (
                                            <button
                                                type="button"
                                                key={i}
                                                onClick={() => {
                                                    playClick();
                                                    setFormData({ ...formData, client: { ...formData.client!, avatar: url } });
                                                }}
                                                className={`w-8 h-8 rounded-full p-0 border-2 overflow-hidden transition-transform hover:scale-110 ${formData.client?.avatar === url ? 'border-lime-400 dark:border-lime-400' : 'border-transparent'}`}
                                            >
                                                <img src={url} className="w-full h-full object-cover" alt={`Avatar preset ${i + 1}`} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <input
                                value={formData.client?.name}
                                onChange={e => setFormData({ ...formData, client: { ...formData.client!, name: e.target.value } })}
                                placeholder="Client Name"
                                className="w-full p-3 bg-white dark:bg-white/8 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                            />
                            <input
                                value={formData.client?.company}
                                onChange={e => setFormData({ ...formData, client: { ...formData.client!, company: e.target.value } })}
                                placeholder="Company"
                                className="w-full p-3 bg-white dark:bg-white/8 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                            />
                            <div className="grid grid-cols-1 gap-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                                    <input
                                        value={formData.client?.email}
                                        onChange={e => setFormData({ ...formData, client: { ...formData.client!, email: e.target.value } })}
                                        placeholder="Email Address"
                                        className="w-full p-3 pl-10 bg-white dark:bg-white/8 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                    />
                                </div>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                                    <input
                                        value={formData.client?.phone}
                                        onChange={e => setFormData({ ...formData, client: { ...formData.client!, phone: e.target.value } })}
                                        placeholder="Phone (Optional)"
                                        className="w-full p-3 pl-10 bg-white dark:bg-white/8 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW LINK SECURITY SECTION */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-5 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden animate-fade-in">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-3 h-3" /> Link Security
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => {
                                    playClick();
                                    setFormData({ ...formData, accessConfig: { ...(formData.accessConfig || {}), mode: 'permanent' } });
                                }}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${formData.accessConfig?.mode === 'permanent' || !formData.accessConfig ? 'bg-lime-400/10 border-lime-400 text-lime-400 dark:bg-lime-400/10 dark:border-lime-400 dark:text-lime-400' : 'bg-editorial dark:bg-white/5 border-transparent text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                            >
                                <Infinity className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Permanent</span>
                            </button>

                            <button
                                onClick={() => {
                                    playClick();
                                    setFormData({ ...formData, accessConfig: { ...(formData.accessConfig || {}), mode: '7_day' } });
                                }}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${formData.accessConfig?.mode === '7_day' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-editorial dark:bg-white/5 border-transparent text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                            >
                                <Hourglass className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">7 Days</span>
                            </button>

                            <button
                                onClick={() => {
                                    playClick();
                                    setFormData({ ...formData, accessConfig: { ...(formData.accessConfig || {}), mode: 'one_time' } });
                                }}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${formData.accessConfig?.mode === 'one_time' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-editorial dark:bg-white/5 border-transparent text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                            >
                                <Flame className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Burn 1x</span>
                            </button>
                        </div>

                        {formData.accessConfig?.mode === 'one_time' && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                                <p className="text-[10px] text-red-600 dark:text-red-400 leading-relaxed">
                                    <strong>Warning:</strong> The link will permanently expire after the client opens it once. If they close the tab, they will be locked out.
                                </p>
                            </div>
                        )}
                        {formData.accessConfig?.mode === '7_day' && (
                            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
                                    <strong>Urgency:</strong> The link will expire 7 days after creation.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Project Controls */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Project Controls
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-zinc-400" />
                                    <div>
                                        <span className="text-sm font-medium dark:text-white">Scope Creep Pause</span>
                                        <p className="text-[10px] text-zinc-400 mt-0.5">Client sees a hard pause overlay until you resume.</p>
                                    </div>
                                </div>
                                <Toggle
                                    checked={formData.accessConfig?.scopeCreepPaused === true}
                                    onChange={v => setFormData({
                                        ...formData,
                                        accessConfig: {
                                            ...(formData.accessConfig || { mode: 'permanent' }),
                                            scopeCreepPaused: v,
                                            pauseReason: formData.accessConfig?.pauseReason || 'Project Paused: Revision Limit Reached'
                                        }
                                    })}
                                />
                            </div>
                            {formData.accessConfig?.scopeCreepPaused && (
                                <div className="pl-6">
                                    <label className="text-xs font-medium tracking-wider text-zinc-400">Pause Message</label>
                                    <input
                                        value={formData.accessConfig?.pauseReason || 'Project Paused: Revision Limit Reached'}
                                        onChange={e => setFormData({
                                            ...formData,
                                            accessConfig: {
                                                ...(formData.accessConfig || { mode: 'permanent' }),
                                                pauseReason: e.target.value
                                            }
                                        })}
                                        placeholder="Project Paused: Revision Limit Reached"
                                        className="mt-2 w-full p-2 bg-white dark:bg-white/8 border border-zinc-200/50 dark:border-white/10 rounded-lg focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-xs text-zinc-900 dark:text-white"
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PenTool className="w-4 h-4 text-zinc-400" />
                                    <span className="text-sm font-medium dark:text-white">Require Signature</span>
                                </div>
                                <Toggle checked={formData.requiresSignature || false} onChange={v => setFormData({ ...formData, requiresSignature: v })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-zinc-400" />
                                    <span className="text-sm font-medium dark:text-white">Enable Tipping</span>
                                </div>
                                <Toggle checked={formData.enableTips || false} onChange={v => setFormData({ ...formData, enableTips: v })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Radio className="w-4 h-4 text-zinc-400" />
                                    <div>
                                        <span className="text-sm font-medium dark:text-white">Client Library Mode</span>
                                        <p className="text-[10px] text-zinc-400 mt-0.5">Off = one-off handoff · On = recurring client history</p>
                                    </div>
                                </div>
                                <Toggle checked={formData.enableClientLibrary !== false} onChange={v => setFormData({ ...formData, enableClientLibrary: v })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <EyeOff className="w-4 h-4 text-zinc-400" />
                                    <div>
                                        <span className="text-sm font-medium dark:text-white">Tiled Watermark</span>
                                        <p className="text-[10px] text-zinc-400 mt-0.5">Show faint Heartifact text behind locked previews</p>
                                    </div>
                                </div>
                                <Toggle checked={formData.showWatermark !== false} onChange={v => setFormData({ ...formData, showWatermark: v })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-zinc-400" />
                                    <div>
                                        <span className="text-sm font-medium dark:text-white">Protected Preview Label</span>
                                        <p className="text-[10px] text-zinc-400 mt-0.5">Show the lock badge overlay on locked image previews</p>
                                    </div>
                                </div>
                                <Toggle checked={formData.showProtectedLabel !== false} onChange={v => setFormData({ ...formData, showProtectedLabel: v })} />
                            </div>
                        </div>
                    </div>

                    {/* Milestones */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <Flag className="w-3 h-3" /> Project Milestones
                            </h3>
                            <Toggle checked={formData.useMilestones || false} onChange={v => setFormData({ ...formData, useMilestones: v })} />
                        </div>

                        {formData.useMilestones && (
                            <div className="space-y-3 animate-fade-in">
                                {formData.milestones?.map((milestone, index) => (
                                    <div key={milestone.id} className="p-3 bg-white dark:bg-white/8 rounded-xl border border-zinc-200/50 dark:border-white/5 space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                value={milestone.title}
                                                onChange={e => updateMilestone(index, 'title', e.target.value)}
                                                placeholder="Milestone Name"
                                                className="flex-1 p-2 bg-white dark:bg-white/5 rounded-lg text-xs border border-transparent focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white"
                                            />
                                            <button onClick={() => removeMilestone(index)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={milestone.amount}
                                                onChange={e => updateMilestone(index, 'amount', Number(e.target.value))}
                                                placeholder="$ Amount"
                                                className="flex-1 p-2 bg-white dark:bg-white/5 rounded-lg text-xs border border-transparent focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white"
                                            />
                                            <input
                                                type="date"
                                                value={milestone.dueDate}
                                                onChange={e => updateMilestone(index, 'dueDate', e.target.value)}
                                                className="th-date-input flex-1 p-2 bg-white dark:bg-white/5 rounded-lg text-xs border border-transparent focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={addMilestone}
                                    className="w-full py-2 border border-dashed border-zinc-200/50 dark:border-white/20 rounded-lg text-xs font-bold uppercase text-zinc-500 hover:text-lime-400 dark:hover:text-lime-400 hover:border-lime-400 dark:hover:border-lime-400 transition-colors"
                                >
                                    + Add Milestone
                                </button>
                            </div>
                        )}
                    </div>

                    {/* NEW: CREDENTIAL VAULT SECTION */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <Key className="w-3 h-3" /> Project credentials
                            </h3>
                            <button
                                onClick={() => setShowCredentialModal(true)}
                                className="text-xs font-medium bg-zinc-100 hover:bg-lime-400 hover:text-white dark:bg-white/20 dark:text-white dark:hover:bg-lime-400 dark:hover:text-black px-3 py-1.5 rounded-lg transition-colors border border-transparent dark:border-white/10"
                            >
                                + Add Keys
                            </button>
                        </div>

                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-4">
                            Stored locally on this device for now (not synced to the server). Don’t paste master passwords here.
                        </p>

                        {showCredentialModal && (
                            <div className="mb-4 p-4 bg-white dark:bg-white/8 rounded-xl border border-dashed border-zinc-200/50 dark:border-white/10 animate-fade-in">
                                <div className="space-y-3">
                                    <input
                                        placeholder="Service Name (e.g. WP Admin)"
                                        className="w-full p-2 bg-white dark:bg-white/8 rounded text-xs border border-transparent focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white font-bold"
                                        value={newCredential.serviceName || ''}
                                        onChange={(e) => setNewCredential({ ...newCredential, serviceName: e.target.value })}
                                    />
                                    <input
                                        placeholder="Username"
                                        className="w-full p-2 bg-white dark:bg-white/8 rounded text-xs border border-transparent focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white font-mono"
                                        value={newCredential.username || ''}
                                        onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                                    />
                                    <input
                                        placeholder="Password"
                                        type="password"
                                        className="w-full p-2 bg-white dark:bg-white/8 rounded text-xs border border-transparent focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white font-mono"
                                        value={newCredential.password || ''}
                                        onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Notes (Optional)"
                                        className="w-full p-2 bg-white dark:bg-white/8 rounded text-xs border border-transparent focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white resize-none h-16"
                                        value={newCredential.notes || ''}
                                        onChange={(e) => setNewCredential({ ...newCredential, notes: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowCredentialModal(false)} className="px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-white/10 rounded">Cancel</button>
                                        <button onClick={handleAddCredential} className="px-3 py-1.5 bg-lime-400 text-white dark:bg-lime-400 dark:text-black text-[10px] font-bold uppercase rounded shadow-lg">Add Credential</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {formData.credentials?.map((cred) => (
                                <div key={cred.id} className="flex items-center justify-between p-3 bg-white dark:bg-white/8 rounded-xl border border-zinc-200/50 dark:border-white/5 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <Key className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs dark:text-white">{cred.serviceName}</div>
                                            <div className="text-[10px] text-zinc-500 font-mono">****</div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeCredential(cred.id)} className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                            {(!formData.credentials || formData.credentials.length === 0) && !showCredentialModal && (
                                <div className="text-center py-4 text-[10px] text-zinc-400 italic">No credentials added.</div>
                            )}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                            <Wallet className="w-3 h-3" /> Payment Methods
                        </h3>
                        {!stripeConnected && (
                            <div className="mb-4 p-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/10">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                                        Stripe is not connected yet. Enable manual methods below, or connect Stripe for instant auto-unlock payments.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); window.location.assign('/settings'); }}
                                        className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                                    >
                                        Connect Stripe
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 bg-white dark:bg-white/8 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#635BFF]"></div>
                                    <span className="text-sm font-bold dark:text-white">Stripe Checkout</span>
                                </div>
                                <Toggle checked={formData.paymentMethods?.stripeEnabled || false} onChange={v => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, stripeEnabled: v } })} />
                            </div>

                            <div className="pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Venmo</div>
                                        <input
                                            value={formData.paymentMethods?.venmo}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, venmo: e.target.value } })}
                                            placeholder="@username"
                                            className="w-full p-3 bg-white dark:bg-white/8 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Cash App</div>
                                        <input
                                            value={formData.paymentMethods?.cashapp}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, cashapp: e.target.value } })}
                                            placeholder="$tag"
                                            className="w-full p-3 bg-white dark:bg-white/8 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">PayPal</div>
                                        <input
                                            value={formData.paymentMethods?.paypal}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, paypal: e.target.value } })}
                                            placeholder="paypal.me/you"
                                            className="w-full p-3 bg-white dark:bg-white/8 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Zelle</div>
                                        <input
                                            value={formData.paymentMethods?.zelle}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, zelle: e.target.value } })}
                                            placeholder="Email or phone"
                                            className="w-full p-3 bg-white dark:bg-white/8 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bank / Wire</div>
                                        <textarea
                                            value={formData.paymentMethods?.bankInfo}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, bankInfo: e.target.value } })}
                                            placeholder="Routing / account / instructions"
                                            className="w-full p-3 bg-white dark:bg-white/8 border border-zinc-200/50 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none text-xs h-24 resize-none text-zinc-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 text-[10px] text-zinc-400">
                                    Tip: Stripe is best for instant unlock. Add manual methods only if you need them.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Message Editor */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Personal Message
                        </h3>
                        <textarea
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Enter a personal message for the client..."
                            className="w-full p-3 bg-white dark:bg-white/8 border border-zinc-200/50 dark:border-white/10 rounded-xl focus:border-zinc-300 dark:focus:border-white/25 outline-none transition-colors text-sm min-h-[100px] resize-y mb-3 text-zinc-900 dark:text-white"
                        />
                        <div className="flex flex-wrap gap-2">
                            {MESSAGE_PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => {
                                        const name = formData.client?.name.split(' ')[0] || 'Client';
                                        const text = preset.text.replace('{{name}}', name);
                                        setFormData({ ...formData, message: text });
                                        playClick();
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-white/10 text-xs font-medium tracking-wider text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5 hover:text-obsidian dark:hover:text-white transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Selector */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        {/* ... Theme selector content ... */}
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                            <LayoutTemplate className="w-3 h-3" /> Wallpapers
                        </h3>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {/* Upload Custom Tile */}
                            <button
                                type="button"
                                onClick={() => { playClick(); fileInputRef.current?.click(); }}
                                className={`
                                    relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all bg-zinc-200 dark:bg-white/5 border-dashed border-zinc-200/50 dark:border-white/20 hover:border-lime-400 hover:bg-blue-50 dark:hover:border-lime-400 dark:hover:bg-lime-400/5 flex flex-col items-center justify-center gap-2 w-full p-0
                                    ${formData.theme?.name === 'Custom' ? 'border-lime-400 ring-2 ring-lime-400/20 dark:border-lime-400 dark:ring-lime-400/20' : ''}
                                `}
                            >
                                <Upload className="w-5 h-5 text-zinc-400 group-hover:text-lime-400 dark:group-hover:text-lime-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-lime-400 dark:group-hover:text-lime-400">Upload</span>
                            </button>

                            {/* Custom Wallpapers List */}
                            {customWallpapers.map((custom, i) => (
                                <button
                                    type="button"
                                    key={`custom-${i}`}
                                    onClick={() => {
                                        playClick();
                                        setFormData({
                                            ...formData,
                                            theme: {
                                                ...custom,
                                                pattern: formData.theme?.pattern || 'lines',
                                                showGrain: formData.theme?.showGrain ?? true,
                                                layout: formData.theme?.layout || 'default',
                                                lightbox: formData.theme?.lightbox || 'default',
                                            },
                                        });
                                    }}
                                    className={`
                                        relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all bg-zinc-200 dark:bg-white/5 w-full p-0
                                        ${formData.theme?.wallpaper === custom.wallpaper ? 'border-lime-400 ring-2 ring-lime-400/20 dark:border-lime-400 dark:ring-lime-400/20' : 'border-transparent hover:border-zinc-200/50 dark:hover:border-white/20'}
                                    `}
                                >
                                    <img src={custom.wallpaper} className="w-full h-full object-cover" />

                                    {formData.theme?.wallpaper === custom.wallpaper && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                            <CheckCircle className="w-5 h-5 text-lime-400 dark:text-lime-400 drop-shadow-md" />
                                        </div>
                                    )}

                                    {/* Delete Button - Only visible on hover */}
                                    <div
                                        onClick={(e) => handleDeleteCustomWallpaper(e, custom.wallpaper)}
                                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                                        title="Delete Wallpaper"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </div>
                                </button>
                            ))}

                            {/* Preset Tiles */}
                            {WALLPAPER_PRESETS.map((preset, i) => (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={() => {
                                        playClick();
                                        setFormData({
                                            ...formData,
                                            theme: {
                                                ...preset,
                                                pattern: formData.theme?.pattern || 'lines',
                                                showGrain: formData.theme?.showGrain ?? true,
                                                layout: formData.theme?.layout || 'default',
                                                lightbox: formData.theme?.lightbox || 'default',
                                            },
                                        });
                                    }}
                                    className={`
                                        relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all bg-zinc-200 dark:bg-white/5 w-full p-0
                                        ${formData.theme?.name === preset.name && !customWallpapers.find(c => c.wallpaper === formData.theme?.wallpaper) ? 'border-lime-400 ring-2 ring-lime-400/20 dark:border-lime-400 dark:ring-lime-400/20' : 'border-transparent hover:border-zinc-200/50 dark:hover:border-white/20'}
                                    `}
                                >
                                    {preset.wallpaper ? (
                                        <img src={preset.wallpaper} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Solid Color</span>
                                        </div>
                                    )}
                                    {formData.theme?.name === preset.name && !customWallpapers.find(c => c.wallpaper === formData.theme?.wallpaper) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <CheckCircle className="w-5 h-5 text-lime-400 dark:text-lime-400 drop-shadow-md" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[8px] font-bold uppercase text-white tracking-widest">{preset.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Textures & Grain */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Layers className="w-3 h-3" /> Pattern Style
                                </h3>
                                <button
                                    onClick={toggleGrain}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wider transition-colors ${formData.theme?.showGrain ? 'bg-lime-400/20 text-lime-400 border-lime-400/50 dark:bg-lime-400/20 dark:text-lime-400 dark:border-lime-400/50 border' : 'bg-zinc-200 dark:bg-white/10 text-zinc-500'}`}
                                >
                                    {formData.theme?.showGrain ? 'Film Grain ON' : 'Film Grain OFF'}
                                </button>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {PATTERNS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            playClick();
                                            const currentTheme = formData.theme || WALLPAPER_PRESETS[1];
                                            setFormData({
                                                ...formData,
                                                theme: {
                                                    ...currentTheme,
                                                    pattern: p.id as any
                                                }
                                            });
                                        }}
                                        className={`
                                            aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border transition-all hover:bg-editorial dark:hover:bg-white/5 min-w-0 p-1.5 sm:p-0
                                            ${formData.theme?.pattern === p.id
                                                ? 'border-lime-400 bg-lime-400/10 text-lime-400 dark:border-lime-400 dark:bg-lime-400/10 dark:text-lime-400'
                                                : 'border-zinc-200/50 dark:border-white/10 text-zinc-400'
                                            }
                                        `}
                                        title={p.label}
                                    >
                                        <p.icon className={`w-4 h-4 ${p.id === 'cross' ? 'rotate-45' : ''}`} />
                                        <span className="w-full text-center truncate text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.03em] opacity-70">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Layout Selector */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        <div className="relative z-10">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                <LayoutTemplate className="w-3 h-3" /> Client Portal Layout
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'default', icon: LayoutTemplate, label: 'Default', shortLabel: 'Default' },
                                    { id: 'billboard', icon: Monitor, label: 'Billboard', shortLabel: 'Board' },
                                    { id: 'masonry', icon: Grid, label: 'Masonry', shortLabel: 'Mason' },
                                    { id: 'journal', icon: FileText, label: 'Journal', shortLabel: 'Journal' },
                                    { id: 'deck', icon: Layers, label: 'Deck', shortLabel: 'Deck' },
                                ].map(({ id: l, icon: LayoutIcon, label, shortLabel }) => (
                                    <button
                                        key={l}
                                        type="button"
                                        onClick={() => {
                                            playClick();
                                            // Make sure we have a fallback if theme doesn't exist yet
                                            const currentTheme = formData.theme || { ...WALLPAPER_PRESETS[1], pattern: 'lines', showGrain: true };
                                            setFormData({
                                                ...formData,
                                                theme: {
                                                    ...currentTheme,
                                                    layout: l as any
                                                }
                                            });
                                        }}
                                        className={`
                                            px-2 sm:px-3 py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all hover:bg-editorial dark:hover:bg-white/5 min-w-0
                                            ${normalizePortalLayoutForPicker(formData.theme?.layout as string | undefined) === l
                                                ? 'border-lime-400 bg-lime-400/10 text-lime-400 dark:border-lime-400 dark:bg-lime-400/10 dark:text-lime-400'
                                                : 'border-zinc-200/50 dark:border-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                            }
                                        `}
                                    >
                                        <LayoutIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                        <span className="w-full text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.04em] leading-tight truncate">
                                            <span className="sm:hidden">{shortLabel}</span>
                                            <span className="hidden sm:inline">{label}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p className="mt-3 text-[10px] text-zinc-500 leading-relaxed">
                                Select how clients will experience their deliverables. Default uses a standard grid, while other options provide curated, gallery-style presentations.
                            </p>
                            {/* Archived layouts: cinema, split, portfolio, modeler, and studio are preserved in code but removed from active selection. */}

                            <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-white/10">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                                    <Monitor className="w-3 h-3" /> Lightbox Style
                                </h4>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                    {[
                                        { id: 'default', label: 'Default', shortLabel: 'Default' },
                                        { id: 'pro', label: 'Pro', shortLabel: 'Pro' },
                                        { id: 'workstation', label: 'Workstation', shortLabel: 'Work' },
                                        { id: 'canvas', label: 'Canvas', shortLabel: 'Canvas' },
                                        { id: 'sheet', label: 'Sheet', shortLabel: 'Sheet' },
                                    ].map(({ id: lens, label, shortLabel }) => (
                                        <button
                                            key={lens}
                                            type="button"
                                            onClick={() => {
                                                playClick();
                                                const currentTheme = formData.theme || { ...WALLPAPER_PRESETS[1], pattern: 'lines', showGrain: true };
                                                setFormData({
                                                    ...formData,
                                                    theme: {
                                                        ...currentTheme,
                                                        lightbox: lens as any,
                                                    },
                                                });
                                            }}
                                            className={`
                                                px-2 sm:px-3 py-2 rounded-xl border text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.04em] transition-all min-w-0
                                                ${(formData.theme?.lightbox || 'default') === lens
                                                    ? 'border-lime-400 bg-lime-400/10 text-lime-400 dark:border-lime-400 dark:bg-lime-400/10 dark:text-lime-400'
                                                    : 'border-zinc-200/50 dark:border-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-editorial dark:hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            <span className="w-full text-center truncate">
                                                <span className="sm:hidden">{shortLabel}</span>
                                                <span className="hidden sm:inline">{label}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project assets */}
                    <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />
                        {/* ... Asset list logic ... */}
                        <div className="relative z-10">
                            {uploadError && (
                                <InlineErrorBanner
                                    message={uploadError}
                                    onDismiss={() => setUploadError(null)}
                                    className="mb-4"
                                />
                            )}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Cloud className="w-3 h-3" /> Project assets
                                    {errors.files && <span className="text-red-500 ml-2 text-[9px]">Required</span>}
                                </h3>
                                <button
                                    onClick={() => { setShowLinkModal(true); setLinkError(null); setLinkNameWarning(null); setLinkImportSuccess(null); }}
                                    className="text-xs font-medium bg-zinc-100 hover:bg-lime-400 hover:text-white dark:bg-white/20 dark:text-white dark:hover:bg-lime-400 dark:hover:text-black px-3 py-1.5 rounded-lg transition-colors border border-transparent dark:border-white/10"
                                >
                                    + Add Link
                                </button>
                            </div>

                            {showLinkModal && (
                                <div className="mb-4 p-4 bg-white dark:bg-white/8 rounded-xl border border-dashed border-zinc-200/50 dark:border-white/10 animate-fade-in">
                                    <div className="space-y-3">
                                        <div className="inline-flex items-center gap-2">
                                            <span className="px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider border bg-lime-400 text-white border-lime-400 dark:bg-lime-400 dark:text-black dark:border-lime-400">
                                                Secure Link Import
                                            </span>
                                            <span className="text-xs font-medium tracking-wider text-zinc-500 dark:text-zinc-400">
                                                (requires connected cloud drive)
                                            </span>
                                        </div>

                                        {linkImportSuccess && (
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 text-lime-400 dark:text-blue-400 text-[10px] font-bold">
                                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                                {linkImportSuccess}
                                            </div>
                                        )}

                                        {linkError && (
                                            <InlineErrorBanner
                                                message={linkError}
                                                onDismiss={() => setLinkError(null)}
                                            />
                                        )}

                                        <div>
                                            <input
                                                placeholder="Label (optional)"
                                                className="w-full p-2 bg-white dark:bg-white/8 rounded text-xs border border-transparent focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white"
                                                value={newLink.name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setNewLink({ ...newLink, name: val });
                                                    if (linkError) setLinkError(null);
                                                    const nameExists = val.trim() && files.some(f => f.name === val.trim());
                                                    setLinkNameWarning(nameExists ? `"${val.trim()}" already exists — will be renamed automatically.` : null);
                                                }}
                                            />
                                            {linkNameWarning && (
                                                <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                    <span>⚠</span> {linkNameWarning}
                                                </p>
                                            )}
                                        </div>
                                        <input
                                            placeholder="File or Folder URL (Google Drive / Dropbox / OneDrive)"
                                            className={`w-full p-2 bg-white dark:bg-white/8 rounded text-xs border focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white transition-colors ${newLink.url.trim() && files.some(f => (f.externalUrl || '') === newLink.url.trim())
                                                ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10'
                                                : 'border-transparent'
                                                }`}
                                            value={newLink.url}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewLink({ ...newLink, url: val });
                                                setDetectedLinkType(detectTypeFromUrl(val));
                                                if (val.trim() && (usedImportUrls.has(val.trim()) || files.some(f => (f.externalUrl || '') === val.trim() || (f.importSourceUrl || '') === val.trim()))) {
                                                    setLinkError('This exact link is already in this project.');
                                                } else if (linkError === 'This exact link is already in this project.') {
                                                    setLinkError(null);
                                                }
                                            }}
                                        />
                                        {detectedLinkType && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Detected:</span>
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-lime-400 border border-blue-200 dark:bg-lime-400/15 dark:text-lime-400 dark:border-lime-400/25">{detectedLinkType}</span>
                                            </div>
                                        )}

                                        <input
                                            placeholder="File size (optional, e.g. 24.5 MB)"
                                            className="w-full p-2 bg-white dark:bg-white/8 rounded text-xs border border-transparent focus:border-zinc-300 dark:focus:border-white/25 outline-none text-zinc-900 dark:text-white"
                                            value={newLink.size}
                                            onChange={(e) => {
                                                setNewLink({ ...newLink, size: e.target.value });
                                                if (linkError) setLinkError(null);
                                            }}
                                        />

                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                            Folder links import all files inside. Single-file links import just that file. Connect your cloud account first in Settings -&gt; Storage -&gt; Cloud Drive.
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-medium tracking-wider text-zinc-500 dark:text-zinc-400">Connected:</span>
                                            {connectedDriveProviders.length > 0 ? connectedDriveProviders.map((provider) => (
                                                <span key={provider} className="px-2 py-1 rounded-full text-xs font-medium tracking-wider bg-blue-50 text-lime-400 border border-blue-200 dark:bg-lime-400/15 dark:text-lime-400 dark:border-lime-400/20">
                                                    {provider}
                                                </span>
                                            )) : (
                                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">None connected yet</span>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setShowLinkModal(false); setLinkError(null); setLinkNameWarning(null); setLinkImportSuccess(null); }} className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-editorial dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/10 rounded-lg px-4 transition-colors">Done</button>
                                            <button onClick={handleAddLink} disabled={isAddingLink} className="px-3 py-1.5 bg-lime-400 text-white dark:bg-lime-400 dark:text-black text-[10px] font-bold uppercase rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isAddingLink ? 'Importing...' : 'Import Link'}</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={`space-y-2 ${errors.files ? 'p-2 border border-red-500/50 rounded-xl bg-red-500/5' : ''}`}>
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-white dark:bg-white/8 rounded-lg border border-zinc-200/50 dark:border-white/5">
                                        <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-white/10 flex items-center justify-center text-zinc-500">
                                            {file.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {editingFile?.idx === i ? (
                                                <input
                                                    autoFocus
                                                    className="font-bold text-xs w-full bg-transparent border-b border-lime-400 dark:border-lime-400 outline-none dark:text-white"
                                                    value={editingFile.value}
                                                    onChange={(e) => setEditingFile({ idx: i, value: e.target.value })}
                                                    onBlur={() => {
                                                        if (editingFile.value.trim())
                                                            setFiles(files.map((f, idx) => idx === i ? { ...f, name: deduplicateFileName(editingFile.value.trim(), files.filter((_, ii) => ii !== i).map(f => f.name)) } : f));
                                                        setEditingFile(null);
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingFile(null); }}
                                                />
                                            ) : (
                                                <div
                                                    className="font-bold text-xs truncate dark:text-white cursor-pointer hover:text-lime-400 dark:hover:text-lime-400 flex items-center gap-1 group/name"
                                                    onClick={() => setEditingFile({ idx: i, value: file.name })}
                                                    title="Click to rename"
                                                >
                                                    <span className="truncate">{file.name}</span>
                                                    <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/name:opacity-60 shrink-0 transition-opacity" />
                                                </div>
                                            )}
                                            {editingSize?.idx === i ? (
                                                <input
                                                    autoFocus
                                                    className="text-[10px] w-full bg-transparent border-b border-lime-400 dark:border-lime-400 outline-none text-zinc-500 dark:text-zinc-400"
                                                    value={editingSize.value}
                                                    placeholder="e.g. 24.5 MB"
                                                    onChange={(e) => setEditingSize({ idx: i, value: e.target.value })}
                                                    onBlur={() => {
                                                        if (editingSize.value.trim())
                                                            setFiles(files.map((f, idx) => idx === i ? { ...f, size: editingSize.value.trim() } : f));
                                                        setEditingSize(null);
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingSize(null); }}
                                                />
                                            ) : (
                                                <div
                                                    className={`text-[10px] text-zinc-500 ${file.externalUrl ? 'cursor-pointer hover:text-lime-400 dark:hover:text-lime-400 transition-colors' : ''}`}
                                                    onClick={() => { if (file.externalUrl) setEditingSize({ idx: i, value: file.size }); }}
                                                    title={file.externalUrl ? 'Click to edit size' : undefined}
                                                >{file.size}</div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFiles(files.map((f, idx) => idx === i ? { ...f, includeInLibrary: f.includeInLibrary === false ? true : false } : f));
                                                playClick();
                                            }}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-colors ${file.includeInLibrary === false ? 'bg-zinc-200 text-zinc-500 border-zinc-200/50 hover:bg-zinc-200 dark:bg-white/5 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/10' : 'bg-blue-50 text-lime-400 border-blue-200 hover:bg-blue-100 dark:bg-lime-400/10 dark:text-lime-400 dark:border-lime-400/20 dark:hover:bg-lime-400/20'}`}
                                            title="Include in client library"
                                        >
                                            {file.includeInLibrary === false ? (
                                                <>
                                                    <Plus className="w-3 h-3" />
                                                    Add to Library
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-3 h-3" />
                                                    In Library
                                                </>
                                            )}
                                        </button>
                                        <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-zinc-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}

                                {isUploading ? (
                                    <div className="w-full py-4 bg-editorial dark:bg-white/5 rounded-lg border border-zinc-200/50 dark:border-white/10 flex flex-col items-center justify-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-lime-400 dark:text-lime-400" />
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                                {uploadProgress.status === 'uploading' ? 'Uploading to R2...' : 'Processing & Watermarking...'}
                                            </span>
                                        </div>
                                        <div className="w-48 h-1 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-lime-400 dark:bg-lime-400 transition-all duration-300"
                                                style={{ width: `${uploadProgress.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => assetInputRef.current?.click()}
                                        className="w-full py-3 border-2 border-dashed border-zinc-200/50 dark:border-white/10 rounded-lg text-xs font-bold text-zinc-400 hover:text-lime-400 hover:border-lime-400 dark:hover:text-lime-400 dark:hover:border-lime-400 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Upload className="w-3 h-3" /> Upload Local File
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-200/80 dark:border-white/5 bg-[#f0f2f5]/92 dark:bg-cosmic/92 backdrop-blur-xl relative z-10">
                    <button
                        onClick={handleSave}
                        className="w-full py-4 rounded-2xl bg-lime-400 hover:bg-lime-400 text-zinc-950 font-bold text-sm uppercase tracking-widest shadow-[0_16px_40px_rgba(190, 242, 100,0.30)] hover:shadow-[0_20px_48px_rgba(190, 242, 100,0.35)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {existingProject ? 'Publish Changes' : 'Create & Publish'}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: LIVE PREVIEW (75%) */}
            <div className="flex-1 relative overflow-hidden shadow-2xl group/preview-area">

                {/* Collapsed editor restore control */}
                {isEditorCollapsed && (
                    <div
                        className={`absolute z-[60] pointer-events-auto ${!isCanvasPreviewMode && isPreviewDockedSidebarCollapsed ? 'top-8 left-8 flex items-center gap-2' : 'top-6 left-6 flex flex-col items-start gap-2'}`}
                    >
                        {!isCanvasPreviewMode && isPreviewDockedSidebarCollapsed ? (
                            /* Both sidebars collapsed (non-canvas): compact row with back + show-editor + details */
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => { playClick(); onBack(); }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${isPreviewDark ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-white hover:bg-editorial text-zinc-700 border border-zinc-200/50 shadow-sm'}`}
                                    aria-label="Back to Projects"
                                    title="Back to Projects"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { playClick(); setIsEditorCollapsed(false); }}
                                    className="w-10 h-10 rounded-full bg-lime-400 hover:bg-lime-400 text-black flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-lime-400/40 transition-all hover:scale-105 active:scale-90"
                                    aria-label="Show Editor"
                                    title="Show Editor"
                                >
                                    <PanelLeftOpen className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            /* Editor collapsed only (or canvas mode): full pill + back + badge */
                            <>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); onBack(); }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${isPreviewDark ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-white hover:bg-editorial text-zinc-700 border border-zinc-200/50 shadow-sm'}`}
                                        aria-label="Back to Projects"
                                        title="Back to Projects"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); setIsEditorCollapsed(false); }}
                                        className="px-4 py-2 rounded-full bg-lime-400 hover:bg-lime-400 text-black text-xs font-medium tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-lime-400/40 flex items-center gap-2 transition-all hover:scale-[1.02]"
                                        aria-label="Show Editor"
                                        title="Show Editor"
                                    >
                                        <PanelLeftOpen className="w-4 h-4" />
                                        Show Editor
                                    </button>
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-medium text-white/90 whitespace-nowrap">
                                    Editor collapsed (preview-only)
                                </div>
                            </>
                        )}
                    </div>
                )}
                {/* Overlay Badge */}
                <div className="absolute top-6 right-6 z-50 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                        <span className="text-xs font-medium text-white">Live Preview Editor</span>
                    </div>
                </div>

                {/* The Preview Component */}
                <div className={`w-full h-full ${isPreviewDark ? 'dark' : ''}`}>
                    <ClientPreviewBiz
                        project={previewProject}
                        libraryProjects={libraryProjects}
                        libraryEnabled={previewProject.enableClientLibrary !== false}
                        onBack={() => { }} // Disabled in preview
                        isDarkMode={isPreviewDark}
                        themeMode={previewTheme}
                        onToggleTheme={cyclePreviewTheme}
                        onSetThemeMode={setPreviewTheme}
                        user={user} // Pass user to allow sync
                        isEmbedded={true}
                        allowSidebarCollapse={true}
                        onDockedSidebarCollapseChange={setIsPreviewDockedSidebarCollapsed}
                        onDeviceModeChange={setPreviewDeviceMode}
                        reserveCollapsedHeaderBackSlot={isEditorCollapsed ? 2 : 0}
                        onRenameAsset={(fileId, newName) => setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f))}
                        onResizeAsset={(fileId, newSize) => setFiles(prev => prev.map(f => f.id === fileId ? { ...f, size: newSize } : f))}
                        onRemoveAsset={(fileId) => setFiles(prev => prev.filter(f => f.id !== fileId))}
                    />
                </div>
            </div>

            {/* Upload Progress Toast Overlay */}
            {isUploading && (
                <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[300] bg-white dark:bg-black/25 border border-zinc-200/50 dark:border-white/10 rounded-2xl shadow-2xl p-4 w-72 animate-slide-up ring-1 ring-black/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-bounce" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">Uploading Asset...</h4>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">{uploadProgress.status}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{Math.round(uploadProgress.percent)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${uploadProgress.percent}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatorPage;




