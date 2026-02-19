
import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, Save, Upload, Calendar, DollarSign,
    User, FileText, Plus, X, Image as ImageIcon,
    Film, Music, File, CheckCircle, LayoutTemplate,
    Link as LinkIcon, Cloud, ExternalLink, RefreshCw,
    Sun, Moon, Grid, Activity, MoreHorizontal, Slash,
    Hexagon, Cpu, Plus as PlusIcon, Square, Trash2,
    Layers, ToggleRight, MessageSquare, Flag, PenTool,
    Wallet, Smartphone, Mail, Coins, ShieldAlert,
    Infinity, Hourglass, Flame, Camera, Type,
    Target, Radio, Crosshair, Box, Play, Hash,
    Monitor, AlertCircle, Loader2, Key, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { Project, FileAsset, ProjectTheme, Milestone, UserProfile, CredentialBlock } from '../types';
import { playClick, playSuccess } from '../utils/sound';
import ClientPreviewBiz from './ClientPreviewBiz';
import { InlineErrorBanner } from './Shared';
// Import the Backend Service and R2 Service
import { StorageService, ProcessingService, ByosLinkService, ByosFolderService } from '../api/mockBackend';
import { R2Service } from '../services/r2';

interface CreatorPageProps {
    existingProject?: Project | null;
    allProjects?: Project[];
    onSave: (project: Project) => void;
    onBack: () => void;
    user?: UserProfile;
}

const GRADIENT_TEXT = "text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-600 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-500";

// --- VISUAL CONSTANTS ---
// High-visibility SVG Grain (Matching ClientPreviewPage)
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`;

// --- PREMIUM WALLPAPERS ---
const WALLPAPER_PRESETS: ProjectTheme[] = [
    {
        name: 'Executive Matte',
        wallpaper: '',
        brightness: 'dark',
        showGrain: true
    },
    {
        name: 'Concrete Vault',
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
    { id: 'rhombus', label: 'Vault', icon: Square },
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
        className={`w-11 h-6 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 ${checked ? 'bg-lime-600 dark:bg-[#bef264]' : 'bg-slate-200 dark:bg-white/10'}`}
    >
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${checked ? 'translate-x-5 bg-white dark:bg-black' : 'bg-white'}`} />
    </button>
);

const CreatorPage: React.FC<CreatorPageProps> = ({ existingProject, allProjects = [], onSave, onBack, user }) => {
    // Initial State Construction
    const [formData, setFormData] = useState<Partial<Project>>(() => {
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
            enableClientLibrary: true,
            requiresSignature: false,
            enableTips: false,
            useMilestones: false,
            accessConfig: { mode: 'permanent' },
            paymentMethods: {
                stripeEnabled: true,
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

    const [files, setFiles] = useState<FileAsset[]>(existingProject?.files || []);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [newLink, setNewLink] = useState({ name: '', url: '', size: '', type: 'archive' });
    const [linkError, setLinkError] = useState<string | null>(null);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [linkImportMode, setLinkImportMode] = useState<'file' | 'folder'>('file');
    const [errors, setErrors] = useState<{ name?: boolean, amount?: boolean, files?: boolean }>({});

    // Credential Modal State
    const [showCredentialModal, setShowCredentialModal] = useState(false);
    const [newCredential, setNewCredential] = useState<Partial<CredentialBlock>>({});

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ status: 'uploading' | 'processing' | 'done', percent: number }>({ status: 'done', percent: 0 });
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Theme State
    const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [systemDark, setSystemDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [customWallpapers, setCustomWallpapers] = useState<ProjectTheme[]>([]);
    const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
    const [isPreviewDockedSidebarCollapsed, setIsPreviewDockedSidebarCollapsed] = useState(false);
    const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'tablet' | 'mobile' | 'foldable'>('desktop');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const assetInputRef = React.useRef<HTMLInputElement>(null); // For asset uploads

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    const isPreviewDark = previewTheme === 'system' ? systemDark : previewTheme === 'dark';
    const isCanvasPreviewMode = previewDeviceMode !== 'desktop';
    const connectedDriveProviders = [
        user?.storageSettings?.byosGoogleToken ? 'Google Drive' : null,
        user?.storageSettings?.byosDropboxToken ? 'Dropbox' : null,
        user?.storageSettings?.byosOneDriveToken ? 'OneDrive' : null
    ].filter(Boolean) as string[];

    const cyclePreviewTheme = () => {
        playClick();
        if (previewTheme === 'system') setPreviewTheme('light');
        else if (previewTheme === 'light') setPreviewTheme('dark');
        else setPreviewTheme('system');
    };

    const previewProject: Project = {
        id: existingProject?.id || 'preview-id',
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
        clientLink: '#',
        type: 'web',
        message: formData.message,
        enableClientLibrary: formData.enableClientLibrary !== false,
        accessConfig: formData.accessConfig,
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
        const project: Project = {
            ...previewProject,
            id: existingProject?.id || `p-${Date.now()}`
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
            let uploadedFileUrl = '';
            let uploadedFileSize = '0 MB';
            let uploadedKey = '';

            // Check if user has their own R2 configured (BYOS)
            const hasBYOS = user?.storageSettings?.accessKey && user.storageSettings.secretKey && user.storageSettings.endpoint;

            if (hasBYOS && user?.storageSettings) {
                // USER'S OWN STORAGE (BYOS)
                const result = await R2Service.uploadFile(file, user.storageSettings, (p) => setUploadProgress({ status: 'uploading', percent: p }));
                uploadedFileUrl = result.url;
                uploadedFileSize = result.size;
                uploadedKey = result.key;
            } else {
                // PLATFORM NATIVE STORAGE
                // We use the backend service wrapper which automatically handles the Native Keys securely
                // (or falls back to mock if .env is missing)
                setUploadProgress({ status: 'uploading', percent: 30 });
                const result = await StorageService.uploadFileToNativeStorage(file);
                uploadedFileUrl = result.url;
                uploadedFileSize = result.size;
                uploadedKey = result.key;
            }

            // 2. Server-Side Processing (Watermarking/Transcoding)
            setUploadProgress({ status: 'processing', percent: 70 });
            // For real implementation, this would be a backend call
            const previewUrl = await ProcessingService.generateWatermarkedPreview(file);

            setUploadProgress({ status: 'done', percent: 100 });

            const newFile: FileAsset = {
                id: `f-${Date.now()}`,
                name: file.name,
                size: uploadedFileSize,
                type: fileType as any,
                locked: true, // Locked by default
                version: 1,
                uploadDate: new Date().toISOString().split('T')[0],
                tag: 'DRAFT',
                storageProvider: hasBYOS ? 's3' : 'native',
                previewUrl: previewUrl,
                // We store the 'key' (or signed URL generator endpoint) as the downloadUrl concept
                // The actual signed URL is generated on-demand when user pays.
                // For this prototype, we store the public/semi-private URL returned.
                downloadUrl: uploadedFileUrl,
                includeInLibrary: true
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

        try {
            setIsAddingLink(true);
            playClick();
            const shouldImportAsFolder = linkImportMode === 'folder' || ByosFolderService.isLikelyFolderLink(trimmedUrl);

            if (shouldImportAsFolder) {
                const importedAssets = await ByosFolderService.importFolderLink({
                    url: trimmedUrl,
                    folderName: newLink.name.trim() || undefined,
                    storageConfig: user?.storageSettings
                });
                setFiles([...files, ...importedAssets]);
            } else {
                const generatedAsset = await ByosLinkService.ingestLink({
                    url: trimmedUrl,
                    customName: newLink.name.trim() || undefined,
                    customSize: newLink.size || undefined,
                    typeHint: (newLink.type as FileAsset['type']) || undefined
                });
                setFiles([...files, generatedAsset]);
            }

            setNewLink({ name: '', url: '', size: '', type: 'archive' });
            setLinkImportMode('file');
            setLinkError(null);
            setShowLinkModal(false);
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
        <div className="flex h-screen overflow-hidden bg-[#F2F5F3] dark:bg-cosmic">
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

            {/* LEFT PANEL: EDITOR (25%) */}
            <div className={`${isEditorCollapsed ? 'w-0 min-w-0 opacity-0 pointer-events-none' : 'w-[25%] min-w-[340px] opacity-100'} flex flex-col border-r border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#181821]/90 backdrop-blur-xl relative z-20 overflow-hidden transition-all duration-300`}>
                {/* Film Grain Overlay - Switched to SVG with stronger opacity & mix-blend-multiply for light mode */}
                <div
                    className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply dark:mix-blend-overlay opacity-15 dark:opacity-30"
                    style={{ backgroundImage: NOISE_SVG, filter: 'contrast(170%) brightness(100%)' }}
                ></div>

                {/* Editor Header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#181821]/70 backdrop-blur-md sticky top-0 z-30 relative">
                    <button
                        onClick={() => { playClick(); onBack(); }}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Vault
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={cyclePreviewTheme}
                            className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-lime-600 dark:hover:text-[#bef264] transition-colors"
                            title={`Preview Theme: ${previewTheme.charAt(0).toUpperCase() + previewTheme.slice(1)}`}
                        >
                            {previewTheme === 'light' && <Sun className="w-4 h-4" />}
                            {previewTheme === 'dark' && <Moon className="w-4 h-4" />}
                            {previewTheme === 'system' && <Monitor className="w-4 h-4" />}
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-lime-600 dark:bg-[#bef264] animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Editor</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => { playClick(); setIsEditorCollapsed(true); }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all"
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
                        <h2 className={`text-3xl font-serif font-semibold tracking-tight mb-1 ${GRADIENT_TEXT}`}>
                            Project Config
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Changes update the preview instantly.</p>
                    </div>

                    {/* Basic Info Card */}
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex justify-between">
                                    Project Name
                                    {errors.name && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Required</span>}
                                </label>
                                <input
                                    value={formData.name}
                                    onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: false }); }}
                                    placeholder="e.g. Q4 Marketing Campaign"
                                    className={`w-full p-3 bg-slate-50 dark:bg-black/20 border rounded-xl outline-none transition-colors text-sm font-bold text-slate-900 dark:text-white ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-lime-600 dark:focus:border-[#bef264]'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1 justify-between">
                                        <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Value</div>
                                        {errors.amount && <span className="text-red-500 text-[9px] font-bold">Required</span>}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={e => { setFormData({ ...formData, amount: Number(e.target.value) }); setErrors({ ...errors, amount: false }); }}
                                        className={`w-full p-3 bg-slate-50 dark:bg-black/20 border rounded-xl outline-none transition-colors font-mono text-sm text-slate-900 dark:text-white ${errors.amount ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-lime-600 dark:focus:border-[#bef264]'}`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="th-date-input w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-colors text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Client Card */}
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <User className="w-3 h-3" /> Client Details
                        </h3>

                        {/* Avatar Selector */}
                        <div className="flex items-center gap-4 mb-6">
                            <button type="button" className="relative group cursor-pointer border-none bg-transparent p-0" onClick={() => { playClick(); setShowAvatarSelector(!showAvatarSelector); }}>
                                <img src={formData.client?.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 dark:border-white/10" alt="Client Avatar" />
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                            </button>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Persona</p>
                                    <div className="flex gap-2">
                                        <button onClick={handleAutoGenerateAvatar} className="text-[10px] text-slate-500 hover:text-lime-600 dark:hover:text-[#bef264] font-bold hover:underline flex items-center gap-1" title="Generate from Name">
                                            <Type className="w-3 h-3" /> Auto
                                        </button>
                                        <button onClick={() => { playClick(); setShowAvatarSelector(!showAvatarSelector); }} className="text-[10px] text-lime-600 dark:text-[#bef264] font-bold hover:underline">
                                            {showAvatarSelector ? 'Close' : 'Browse'}
                                        </button>
                                    </div>
                                </div>
                                {showAvatarSelector && (
                                    <div className="grid grid-cols-5 gap-2 p-2 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5 animate-fade-in mt-2">
                                        {AVATAR_PRESETS.map((url, i) => (
                                            <button
                                                type="button"
                                                key={i}
                                                onClick={() => {
                                                    playClick();
                                                    setFormData({ ...formData, client: { ...formData.client!, avatar: url } });
                                                }}
                                                className={`w-8 h-8 rounded-full p-0 border-2 overflow-hidden transition-transform hover:scale-110 ${formData.client?.avatar === url ? 'border-lime-600 dark:border-[#bef264]' : 'border-transparent'}`}
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
                                className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-colors text-sm text-slate-900 dark:text-white"
                            />
                            <input
                                value={formData.client?.company}
                                onChange={e => setFormData({ ...formData, client: { ...formData.client!, company: e.target.value } })}
                                placeholder="Company"
                                className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-colors text-sm text-slate-900 dark:text-white"
                            />
                            <div className="grid grid-cols-1 gap-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                    <input
                                        value={formData.client?.email}
                                        onChange={e => setFormData({ ...formData, client: { ...formData.client!, email: e.target.value } })}
                                        placeholder="Email Address"
                                        className="w-full p-3 pl-10 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-colors text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                    <input
                                        value={formData.client?.phone}
                                        onChange={e => setFormData({ ...formData, client: { ...formData.client!, phone: e.target.value } })}
                                        placeholder="Phone (Optional)"
                                        className="w-full p-3 pl-10 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-colors text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW LINK SECURITY SECTION */}
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-3 h-3" /> Link Security
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => {
                                    playClick();
                                    setFormData({ ...formData, accessConfig: { mode: 'permanent' } });
                                }}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${formData.accessConfig?.mode === 'permanent' || !formData.accessConfig ? 'bg-lime-600/10 border-lime-600 text-lime-600 dark:bg-[#bef264]/10 dark:border-[#bef264] dark:text-[#bef264]' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                            >
                                <Infinity className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Permanent</span>
                            </button>

                            <button
                                onClick={() => {
                                    playClick();
                                    setFormData({ ...formData, accessConfig: { mode: '7_day' } });
                                }}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${formData.accessConfig?.mode === '7_day' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                            >
                                <Hourglass className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">7 Days</span>
                            </button>

                            <button
                                onClick={() => {
                                    playClick();
                                    setFormData({ ...formData, accessConfig: { mode: 'one_time' } });
                                }}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${formData.accessConfig?.mode === 'one_time' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
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
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Project Controls
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PenTool className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium dark:text-white">Require Signature</span>
                                </div>
                                <Toggle checked={formData.requiresSignature || false} onChange={v => setFormData({ ...formData, requiresSignature: v })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium dark:text-white">Enable Tipping</span>
                                </div>
                                <Toggle checked={formData.enableTips || false} onChange={v => setFormData({ ...formData, enableTips: v })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Radio className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <span className="text-sm font-medium dark:text-white">Client Library Mode</span>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Off = one-off handoff · On = recurring client history</p>
                                    </div>
                                </div>
                                <Toggle checked={formData.enableClientLibrary !== false} onChange={v => setFormData({ ...formData, enableClientLibrary: v })} />
                            </div>
                        </div>
                    </div>

                    {/* Milestones */}
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Flag className="w-3 h-3" /> Project Milestones
                            </h3>
                            <Toggle checked={formData.useMilestones || false} onChange={v => setFormData({ ...formData, useMilestones: v })} />
                        </div>

                        {formData.useMilestones && (
                            <div className="space-y-3 animate-fade-in">
                                {formData.milestones?.map((milestone, index) => (
                                    <div key={milestone.id} className="p-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5 space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                value={milestone.title}
                                                onChange={e => updateMilestone(index, 'title', e.target.value)}
                                                placeholder="Milestone Name"
                                                className="flex-1 p-2 bg-white dark:bg-white/5 rounded-lg text-xs border border-transparent focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-slate-900 dark:text-white"
                                            />
                                            <button onClick={() => removeMilestone(index)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={milestone.amount}
                                                onChange={e => updateMilestone(index, 'amount', Number(e.target.value))}
                                                placeholder="$ Amount"
                                                className="flex-1 p-2 bg-white dark:bg-white/5 rounded-lg text-xs border border-transparent focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-slate-900 dark:text-white"
                                            />
                                            <input
                                                type="date"
                                                value={milestone.dueDate}
                                                onChange={e => updateMilestone(index, 'dueDate', e.target.value)}
                                                className="th-date-input flex-1 p-2 bg-white dark:bg-white/5 rounded-lg text-xs border border-transparent focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-slate-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={addMilestone}
                                    className="w-full py-2 border border-dashed border-slate-300 dark:border-white/20 rounded-lg text-xs font-bold uppercase text-slate-500 hover:text-lime-600 dark:hover:text-[#bef264] hover:border-lime-600 dark:hover:border-[#bef264] transition-colors"
                                >
                                    + Add Milestone
                                </button>
                            </div>
                        )}
                    </div>

                    {/* NEW: CREDENTIAL VAULT SECTION */}
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Key className="w-3 h-3" /> Credential Vault
                            </h3>
                            <button
                                onClick={() => setShowCredentialModal(true)}
                                className="text-[10px] font-bold uppercase bg-slate-100 hover:bg-lime-600 hover:text-white dark:bg-white/20 dark:text-white dark:hover:bg-[#bef264] dark:hover:text-black px-3 py-1.5 rounded-lg transition-colors border border-transparent dark:border-white/10"
                            >
                                + Add Keys
                            </button>
                        </div>

                        {showCredentialModal && (
                            <div className="mb-4 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-dashed border-slate-300 dark:border-white/10 animate-fade-in">
                                <div className="space-y-3">
                                    <input
                                        placeholder="Service Name (e.g. WP Admin)"
                                        className="w-full p-2 bg-white dark:bg-black/40 rounded text-xs border border-transparent focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-slate-900 dark:text-white font-bold"
                                        value={newCredential.serviceName || ''}
                                        onChange={(e) => setNewCredential({ ...newCredential, serviceName: e.target.value })}
                                    />
                                    <input
                                        placeholder="Username"
                                        className="w-full p-2 bg-white dark:bg-black/40 rounded text-xs border border-transparent focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-slate-900 dark:text-white font-mono"
                                        value={newCredential.username || ''}
                                        onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                                    />
                                    <input
                                        placeholder="Password"
                                        className="w-full p-2 bg-white dark:bg-black/40 rounded text-xs border border-transparent focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-slate-900 dark:text-white font-mono"
                                        value={newCredential.password || ''}
                                        onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Notes (Optional)"
                                        className="w-full p-2 bg-white dark:bg-black/40 rounded text-xs border border-transparent focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-slate-900 dark:text-white resize-none h-16"
                                        value={newCredential.notes || ''}
                                        onChange={(e) => setNewCredential({ ...newCredential, notes: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowCredentialModal(false)} className="px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-white/10 rounded">Cancel</button>
                                        <button onClick={handleAddCredential} className="px-3 py-1.5 bg-lime-600 text-white dark:bg-[#bef264] dark:text-black text-[10px] font-bold uppercase rounded shadow-lg">Save Securely</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {formData.credentials?.map((cred) => (
                                <div key={cred.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <Key className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs dark:text-white">{cred.serviceName}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">****</div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeCredential(cred.id)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                            {(!formData.credentials || formData.credentials.length === 0) && !showCredentialModal && (
                                <div className="text-center py-4 text-[10px] text-slate-400 italic">No credentials added.</div>
                            )}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Wallet className="w-3 h-3" /> Payment Methods
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-black/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#635BFF]"></div>
                                    <span className="text-sm font-bold dark:text-white">Stripe Checkout</span>
                                </div>
                                <Toggle checked={formData.paymentMethods?.stripeEnabled || false} onChange={v => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, stripeEnabled: v } })} />
                            </div>

                            <div className="pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Venmo</div>
                                        <input
                                            value={formData.paymentMethods?.venmo}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, venmo: e.target.value } })}
                                            placeholder="@username"
                                            className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-xs text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cash App</div>
                                        <input
                                            value={formData.paymentMethods?.cashapp}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, cashapp: e.target.value } })}
                                            placeholder="$tag"
                                            className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-xs text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PayPal</div>
                                        <input
                                            value={formData.paymentMethods?.paypal}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, paypal: e.target.value } })}
                                            placeholder="paypal.me/you"
                                            className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-xs text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Zelle</div>
                                        <input
                                            value={formData.paymentMethods?.zelle}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, zelle: e.target.value } })}
                                            placeholder="Email or phone"
                                            className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-xs text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bank / Wire</div>
                                        <textarea
                                            value={formData.paymentMethods?.bankInfo}
                                            onChange={e => setFormData({ ...formData, paymentMethods: { ...formData.paymentMethods, bankInfo: e.target.value } })}
                                            placeholder="Routing / account / instructions"
                                            className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-xs h-24 resize-none text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 text-[10px] text-slate-400">
                                    Tip: Stripe is best for instant unlock. Add manual methods only if you need them.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Message Editor */}
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Personal Message
                        </h3>
                        <textarea
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Enter a personal message for the client..."
                            className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-colors text-sm min-h-[100px] resize-y mb-3 text-slate-900 dark:text-white"
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
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Selector */}
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none">
                        {/* ... Theme selector content ... */}
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <LayoutTemplate className="w-3 h-3" /> Wallpapers
                        </h3>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {/* Upload Custom Tile */}
                            <button
                                type="button"
                                onClick={() => { playClick(); fileInputRef.current?.click(); }}
                                className={`
                                    relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all bg-slate-100 dark:bg-white/5 border-dashed border-slate-300 dark:border-white/20 hover:border-lime-600 hover:bg-lime-50 dark:hover:border-[#bef264] dark:hover:bg-[#bef264]/5 flex flex-col items-center justify-center gap-2 w-full p-0
                                    ${formData.theme?.name === 'Custom' ? 'border-lime-600 ring-2 ring-lime-600/20 dark:border-[#bef264] dark:ring-[#bef264]/20' : ''}
                                `}
                            >
                                <Upload className="w-5 h-5 text-slate-400 group-hover:text-lime-600 dark:group-hover:text-[#bef264]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-lime-600 dark:group-hover:text-[#bef264]">Upload</span>
                            </button>

                            {/* Custom Wallpapers List */}
                            {customWallpapers.map((custom, i) => (
                                <button
                                    type="button"
                                    key={`custom-${i}`}
                                    onClick={() => { playClick(); setFormData({ ...formData, theme: { ...custom, pattern: formData.theme?.pattern || 'lines', showGrain: formData.theme?.showGrain ?? true } }); }}
                                    className={`
                                        relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all bg-slate-100 dark:bg-white/5 w-full p-0
                                        ${formData.theme?.wallpaper === custom.wallpaper ? 'border-lime-600 ring-2 ring-lime-600/20 dark:border-[#bef264] dark:ring-[#bef264]/20' : 'border-transparent hover:border-slate-300 dark:hover:border-white/20'}
                                    `}
                                >
                                    <img src={custom.wallpaper} className="w-full h-full object-cover" />

                                    {formData.theme?.wallpaper === custom.wallpaper && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                            <CheckCircle className="w-5 h-5 text-lime-600 dark:text-[#bef264] drop-shadow-md" />
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
                                    onClick={() => { playClick(); setFormData({ ...formData, theme: { ...preset, pattern: formData.theme?.pattern || 'lines', showGrain: formData.theme?.showGrain ?? true } }); }}
                                    className={`
                                        relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all bg-slate-100 dark:bg-white/5 w-full p-0
                                        ${formData.theme?.name === preset.name && !customWallpapers.find(c => c.wallpaper === formData.theme?.wallpaper) ? 'border-lime-600 ring-2 ring-lime-600/20 dark:border-[#bef264] dark:ring-[#bef264]/20' : 'border-transparent hover:border-slate-300 dark:hover:border-white/20'}
                                    `}
                                >
                                    {preset.wallpaper ? (
                                        <img src={preset.wallpaper} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Solid Color</span>
                                        </div>
                                    )}
                                    {formData.theme?.name === preset.name && !customWallpapers.find(c => c.wallpaper === formData.theme?.wallpaper) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <CheckCircle className="w-5 h-5 text-lime-600 dark:text-[#bef264] drop-shadow-md" />
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
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Layers className="w-3 h-3" /> Pattern Style
                                </h3>
                                <button
                                    onClick={toggleGrain}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${formData.theme?.showGrain ? 'bg-lime-600/20 text-lime-600 border-lime-600/50 dark:bg-[#bef264]/20 dark:text-[#bef264] dark:border-[#bef264]/50 border' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}
                                >
                                    {formData.theme?.showGrain ? 'Film Grain ON' : 'Film Grain OFF'}
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
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
                                            aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border transition-all hover:bg-slate-50 dark:hover:bg-white/5
                                            ${formData.theme?.pattern === p.id
                                                ? 'border-lime-600 bg-lime-600/10 text-lime-600 dark:border-[#bef264] dark:bg-[#bef264]/10 dark:text-[#bef264]'
                                                : 'border-slate-200 dark:border-white/10 text-slate-400'
                                            }
                                        `}
                                        title={p.label}
                                    >
                                        <p.icon className={`w-4 h-4 ${p.id === 'cross' ? 'rotate-45' : ''}`} />
                                        <span className="text-[9px] font-bold uppercase opacity-70">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Vault Assets */}
                    <div className="bg-white/90 dark:bg-[#242430] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-none relative overflow-hidden">
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
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Cloud className="w-3 h-3" /> Vault Assets
                                    {errors.files && <span className="text-red-500 ml-2 text-[9px]">Required</span>}
                                </h3>
                                <button
                                    onClick={() => { setShowLinkModal(true); setLinkError(null); }}
                                    className="text-[10px] font-bold uppercase bg-slate-100 hover:bg-lime-600 hover:text-white dark:bg-white/20 dark:text-white dark:hover:bg-[#bef264] dark:hover:text-black px-3 py-1.5 rounded-lg transition-colors border border-transparent dark:border-white/10"
                                >
                                    + Add Link
                                </button>
                            </div>

                            {showLinkModal && (
                                <div className="mb-4 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-dashed border-slate-300 dark:border-white/10 animate-fade-in">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setLinkImportMode('file')}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${linkImportMode === 'file' ? 'bg-lime-600 text-white border-lime-600 dark:bg-[#bef264] dark:text-black dark:border-[#bef264]' : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300'}`}
                                            >
                                                Single File
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLinkImportMode('folder')}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${linkImportMode === 'folder' ? 'bg-lime-600 text-white border-lime-600 dark:bg-[#bef264] dark:text-black dark:border-[#bef264]' : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300'}`}
                                            >
                                                Folder Import
                                            </button>
                                        </div>
                                        {linkError && (
                                            <InlineErrorBanner
                                                message={linkError}
                                                onDismiss={() => setLinkError(null)}
                                            />
                                        )}
                                        <input
                                            placeholder={linkImportMode === 'folder' ? 'Folder Label (optional)' : 'Name (e.g. Final_Cut.zip)'}
                                            className="w-full p-2 bg-white dark:bg-black/40 rounded text-xs border border-transparent focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-slate-900 dark:text-white"
                                            value={newLink.name}
                                            onChange={(e) => { setNewLink({ ...newLink, name: e.target.value }); if (linkError) setLinkError(null); }}
                                        />
                                        <input
                                            placeholder={linkImportMode === 'folder' ? 'Folder URL (Google / Dropbox / OneDrive)' : 'File URL'}
                                            className="w-full p-2 bg-white dark:bg-black/40 rounded text-xs border border-transparent focus:border-lime-600 dark:focus:border-[#bef264] outline-none text-slate-900 dark:text-white"
                                            value={newLink.url}
                                            onChange={(e) => { setNewLink({ ...newLink, url: e.target.value }); if (linkError) setLinkError(null); }}
                                        />
                                        {linkImportMode === 'folder' && (
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                Folder import lists assets and adds them as normal vault files. Connect your cloud account first in Settings → Storage → Cloud Drive.
                                            </p>
                                        )}
                                        {linkImportMode === 'folder' && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Connected:</span>
                                                {connectedDriveProviders.length > 0 ? connectedDriveProviders.map((provider) => (
                                                    <span key={provider} className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-lime-50 text-lime-700 border border-lime-200 dark:bg-[#bef264]/15 dark:text-[#bef264] dark:border-[#bef264]/20">
                                                        {provider}
                                                    </span>
                                                )) : (
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">None connected yet</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setShowLinkModal(false); setLinkError(null); setLinkImportMode('file'); }} className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-white/10 rounded transition-colors">Cancel</button>
                                            <button onClick={handleAddLink} disabled={isAddingLink} className="px-3 py-1.5 bg-lime-600 text-white dark:bg-[#bef264] dark:text-black text-[10px] font-bold uppercase rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isAddingLink ? (linkImportMode === 'folder' ? 'Importing...' : 'Adding...') : (linkImportMode === 'folder' ? 'Import Folder' : 'Add')}</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={`space-y-2 ${errors.files ? 'p-2 border border-red-500/50 rounded-xl bg-red-500/5' : ''}`}>
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
                                        <div className="w-8 h-8 rounded bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-500">
                                            {file.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-xs truncate dark:text-white">{file.name}</div>
                                            <div className="text-[10px] text-slate-500">{file.size}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFiles(files.map((f, idx) => idx === i ? { ...f, includeInLibrary: f.includeInLibrary === false ? true : false } : f));
                                                playClick();
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-colors ${file.includeInLibrary === false ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10' : 'bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100 dark:bg-[#bef264]/10 dark:text-[#bef264] dark:border-[#bef264]/20 dark:hover:bg-[#bef264]/20'}`}
                                            title="Include in client library"
                                        >
                                            Library
                                        </button>
                                        <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}

                                {isUploading ? (
                                    <div className="w-full py-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-lime-600 dark:text-[#bef264]" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                {uploadProgress.status === 'uploading' ? 'Uploading to R2...' : 'Processing & Watermarking...'}
                                            </span>
                                        </div>
                                        <div className="w-48 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-lime-600 dark:bg-[#bef264] transition-all duration-300"
                                                style={{ width: `${uploadProgress.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => assetInputRef.current?.click()}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-400 hover:text-lime-600 hover:border-lime-600 dark:hover:text-[#bef264] dark:hover:border-[#bef264] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Upload className="w-3 h-3" /> Upload Local File
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#181821]/90 backdrop-blur-md relative z-10">
                    <button
                        onClick={handleSave}
                        className="w-full py-4 rounded-2xl bg-lime-600 hover:bg-lime-700 text-white dark:bg-[#bef264] dark:hover:bg-[#a3e635] dark:text-black font-bold text-sm uppercase tracking-widest shadow-[0_16px_40px_rgba(132,204,22,0.30)] hover:shadow-[0_20px_48px_rgba(132,204,22,0.35)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {existingProject ? 'Update & Publish' : 'Create & Publish'}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: LIVE PREVIEW (75%) */}
            <div className="flex-1 relative bg-black overflow-hidden shadow-2xl">
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
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${isPreviewDark ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'}`}
                                    aria-label="Back to Vault"
                                    title="Back to Vault"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { playClick(); setIsEditorCollapsed(false); }}
                                    className="w-10 h-10 rounded-full bg-[#bef264] hover:bg-[#a3e635] text-black flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#bef264]/40 transition-all hover:scale-105 active:scale-90"
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
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${isPreviewDark ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'}`}
                                        aria-label="Back to Vault"
                                        title="Back to Vault"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); setIsEditorCollapsed(false); }}
                                        className="px-4 py-2 rounded-full bg-[#bef264] hover:bg-[#a3e635] text-black text-[10px] font-bold uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#bef264]/40 flex items-center gap-2 transition-all hover:scale-[1.02]"
                                        aria-label="Show Editor"
                                        title="Show Editor"
                                    >
                                        <PanelLeftOpen className="w-4 h-4" />
                                        Show Editor
                                    </button>
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70 whitespace-nowrap">
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">Live Preview Editor</span>
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
                    />
                </div>
            </div>
        </div>
    );
};

export default CreatorPage;
