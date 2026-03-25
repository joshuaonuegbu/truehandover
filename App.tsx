import React, { useState, useEffect, useContext, useRef, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams, Outlet, Link, useOutletContext } from 'react-router-dom';
import {
    Lock, FileText, Settings, Bell,
    LayoutDashboard, Check,
    CreditCard, Wallet, ShieldCheck,
    Plus, Download, ExternalLink, Briefcase,
    PieChart as PieChartIcon, Activity as ActivityIcon,
    X, Upload, ChevronRight, ChevronLeft,
    MessageSquare,
    Image as ImageIcon, Film, File,
    Sun, Moon,
    LockKeyhole,
    Verified, Search, ChevronDown, Clock,
    MoreHorizontal, Calendar, User, Mail, Globe, Shield, CreditCard as CreditCardIcon,
    TrendingUp, AlertCircle, FolderLock, Filter, LogOut, Copy,
    HardDrive, Trash2, Send, Eye, Pencil, CheckCircle,
    Unlock, FileCheck, DollarSign, History as HistoryIcon, Database, Link as LinkIcon, HelpCircle,
    ScanFace, LayoutGrid, List as ListIcon, FileArchive, Music, Share2,
    Monitor, Smartphone, Video, ArrowRight, Server, Fingerprint, Crown,
    Banknote, Cloud, Zap, Terminal, Hash, EyeOff, Scale, CalendarCheck, HardDrive as HardDriveIcon,
    Box, Disc, Command, Network, RefreshCw, Key,
    ArrowUpRight, Grip, MousePointerClick, Siren, FileWarning, ArrowDownRight,
    FileInput, Radio, Wifi, Receipt, ArrowLeftRight, TrendingDown, ShieldAlert,
    BarChart3, FileDigit, Landmark, Printer, PieChart, Users,
    QrCode
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar, Cell, Legend, ReferenceLine, YAxis, Pie, PieChart as RePieChart } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { playClick, playSuccess } from './utils/sound';
import { canToggleMockMode, isMockMode, setMockMode, setMockModeAndNavigate } from './config/mockMode';
import { createAuditTrailPdf, createRightsCertificatePdf } from './utils/reportPdfGenerator';
// Critical path — loaded eagerly (needed before auth resolves)
import LandingPage from './components/LandingPage';
import SignInPage from './components/SignInPage';
import { Card, Badge, GRADIENT_TEXT } from './components/Shared';
import ThemeModeDropdown from './components/ThemeModeDropdown';
import { ClientRolodexContent } from './components/ClientsPage';
import BrandLogo from './components/BrandLogo';

// Route-level code-splitting — only loaded when the user navigates to that route
const _importCreator = () => import('./components/CreatorPage');
const _importPreviewBiz = () => import('./components/ClientPreviewBiz');
const _importPortal = () => import('./components/ClientPortalPage');
const _importTrash = () => import('./components/TrashPage');
const _importHelp = () => import('./components/HelpPage');
const _importSettings = () => import('./components/SettingsPage');
const _importReports = () => import('./components/ReportsView');
const _importActivity = () => import('./components/ActivityView');

const CreatorPage = lazy(_importCreator);
const ClientPreviewBiz = lazy(_importPreviewBiz);
const ClientPortalPage = lazy(_importPortal);
const TrashPage = lazy(_importTrash);
const HelpPage = lazy(_importHelp);
const SettingsPage = lazy(_importSettings);
const ReportsView = lazy(_importReports);
const ActivityView = lazy(_importActivity);

// Hover-prefetch map — call the matching _import* fn on nav item hover so the
// chunk is in the module cache before the user even clicks the link.
const routePreloadMap: Record<string, () => Promise<unknown>> = {
    vault: _importPreviewBiz,   // Vault renders file cards; preload preview biz alongside
    activity: _importActivity,
    reports: _importReports,
    settings: _importSettings,
    help: _importHelp,
    trash: _importTrash,
};
import { DB, supabase } from './services/supabaseClient';
import { Project, UserProfile, ViewState, FileAsset } from './types';
import { StoreProvider, useStore } from './context/StoreContext';

// â”€â”€â”€ Toast system â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ToastKind = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; message: string; kind: ToastKind; }
type ToastFn = (message: string, kind?: ToastKind) => void;

const ToastContext = React.createContext<ToastFn>(() => {});

export const useToast = () => React.useContext(ToastContext);

/** Height (px) of the connection/update strip when visible; 0 when hidden. Lets header + main align with strip. */
const StripOffsetContext = React.createContext(0);
const useStripOffset = () => React.useContext(StripOffsetContext);

const ToastContainer = ({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) => {
    if (toasts.length === 0) return null;
    const kindStyles: Record<ToastKind, string> = {
        success: 'bg-white dark:bg-[#1e2420] border-blue-300 dark:border-blue-700/40 text-zinc-800 dark:text-white',
        error:   'bg-white dark:bg-[#201e1e] border-red-300   dark:border-red-700/40   text-zinc-800 dark:text-white',
        info:    'bg-white dark:bg-[#1e2028] border-blue-300  dark:border-blue-700/40  text-zinc-800 dark:text-white',
        warning: 'bg-white dark:bg-[#201f1e] border-amber-300 dark:border-amber-700/40 text-zinc-800 dark:text-white',
    };
    const iconStyles: Record<ToastKind, string> = {
        success: 'text-blue-600 dark:text-blue-400',
        error:   'text-red-500',
        info:    'text-blue-500',
        warning: 'text-amber-500',
    };
    const icons: Record<ToastKind, React.ElementType> = {
        success: CheckCircle, error: AlertCircle, info: Bell, warning: AlertCircle,
    };
    return (
        <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map(t => {
                const Icon = icons[t.kind];
                return (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-up max-w-xs ${kindStyles[t.kind]}`}
                    >
                        <Icon className={`w-4 h-4 shrink-0 ${iconStyles[t.kind]}`} />
                        <span className="text-sm font-medium flex-1 leading-snug">{t.message}</span>
                        <button onClick={() => dismiss(t.id)} className="ml-1 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-zinc-400">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// --- CONSTANTS ---
// OPTIMIZED: High-Fidelity Fine Grain SVG
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;
// Match the Landing hero dark-mode grain treatment for app shell backgrounds.
const HERO_NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;
const QUICK_DELIVERY_DRAFT_KEY = 'th_creator_draft_new';
const QUICK_DELIVERY_EVENT = 'hf-quick-delivery-files';
const QUICK_MESSAGE_PRESETS = [
    {
        label: 'Standard',
        text: "Hi {{name}}, your files are ready for review. Once payment is settled, the full delivery unlocks instantly."
    },
    {
        label: 'Warm',
        text: "Hi {{name}}, everything is ready on HeartFlair. Review the previews and unlock the final files whenever you're ready."
    },
    {
        label: 'Short',
        text: "Final assets are ready. Review the previews and unlock the full files after payment."
    }
];
const QUICK_RETENTION_OPTIONS = [
    { id: 'forever', label: 'Keep forever' },
    { id: '30_days', label: '30 days' },
    { id: '7_days', label: '7 days' },
    { id: '3_days', label: '3 days' },
    { id: '1_day', label: '1 day' },
];

const createQuickClientLink = () => {
    const rand = crypto.getRandomValues(new Uint8Array(16));
    const hex = Array.from(rand).map((b) => b.toString(16).padStart(2, '0')).join('');
    return `cl_${hex}_${Date.now().toString(36)}`;
};

const readQuickDeliveryDraft = (): { formData?: Partial<Project>; files?: FileAsset[] } | null => {
    try {
        const raw = localStorage.getItem(QUICK_DELIVERY_DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const detectQuickFileType = (file: Pick<File, 'name' | 'type'>): FileAsset['type'] => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.includes('pdf') || ext === 'pdf') return 'pdf';
    if (['fig', 'psd', 'ai', 'sketch', 'xd'].includes(ext)) return 'design';
    if (['doc', 'docx', 'txt', 'md', 'rtf', 'pages'].includes(ext) || file.type.startsWith('text/')) return 'doc';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'archive';
};

const formatQuickFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const buildQuickDraftAsset = (file: File): FileAsset => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: formatQuickFileSize(file.size),
    type: detectQuickFileType(file),
    locked: true,
    version: 1,
    uploadDate: new Date().toISOString(),
});

const appendFilesToQuickDraft = (incomingFiles: File[]) => {
    const existing = readQuickDeliveryDraft();
    const existingFiles = existing?.files || [];
    const nextFiles = [...existingFiles, ...incomingFiles.map(buildQuickDraftAsset)];
    try {
        localStorage.setItem(QUICK_DELIVERY_DRAFT_KEY, JSON.stringify({
            formData: existing?.formData || {},
            files: nextFiles
        }));
    } catch {
        // Ignore storage failures; widget state still updates in memory.
    }
    return nextFiles;
};

const computeQuickDueDate = (retention: string) => {
    const now = new Date();
    if (retention === 'forever') return '';
    const days = retention === '1_day' ? 1 : retention === '3_days' ? 3 : retention === '7_days' ? 7 : 30;
    now.setDate(now.getDate() + days);
    return now.toISOString().split('T')[0];
};

const mapQuickRetentionToAccessMode = (retention: string): Project['accessConfig'] => {
    if (retention === '1_day') return { mode: 'one_time', viewCount: 1 };
    if (retention === '7_days' || retention === '3_days' || retention === '30_days') return { mode: '7_day' };
    return { mode: 'permanent' };
};

// Shimmer base used by all skeleton blocks
const Shimmer = ({ className = '' }: { className?: string }) => (
    <div className={`bg-zinc-200 dark:bg-white/[0.07] rounded-xl relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
    </div>
);

// Dashboard skeleton — mirrors the greeting + stats + project list shape
const DashboardSkeleton = () => (
    <div className="space-y-6 pb-12 animate-fade-in absolute inset-0 w-full z-10 bg-[#f0f2f5] dark:bg-cosmic">
        <div className="flex flex-col gap-3 border-b border-zinc-200/50 dark:border-white/5 pb-8">
            <Shimmer className="h-10 w-64" />
            <Shimmer className="h-4 w-48" />
            <Shimmer className="h-7 w-72 rounded-full" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Shimmer className="h-48 w-full" />
                    <div className="space-y-3">
                        <Shimmer className="h-14 w-full" />
                        <Shimmer className="h-14 w-full" />
                        <Shimmer className="h-14 w-full" />
                    </div>
                </div>
                {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-4 py-5 border-b border-zinc-100 dark:border-white/5">
                        <Shimmer className="w-12 h-12 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Shimmer className="h-4 w-48" />
                            <Shimmer className="h-3 w-32" />
                        </div>
                        <Shimmer className="h-5 w-16 rounded-full shrink-0" />
                    </div>
                ))}
            </div>
            <div className="xl:col-span-4 space-y-4">
                <Shimmer className="h-6 w-32" />
                {[1,2,3,4].map(i => <Shimmer key={i} className="h-16 w-full" />)}
            </div>
        </div>
    </div>
);

// Vault skeleton — mirrors the search bar + card rows shape
const VaultSkeleton = () => (
    <div className="space-y-6 pb-12 animate-fade-in absolute inset-0 w-full z-10 bg-[#f0f2f5] dark:bg-cosmic">
        <div className="flex justify-between items-end border-b border-zinc-200/50 dark:border-white/5 pb-8">
            <div className="space-y-2">
                <Shimmer className="h-9 w-48" />
                <Shimmer className="h-4 w-72" />
            </div>
            <Shimmer className="h-12 w-36" />
        </div>
        <Shimmer className="h-14 w-full rounded-2xl" />
        {[1,2,3].map(i => <Shimmer key={i} className="h-64 w-full rounded-[2.5rem]" />)}
    </div>
);

// Generic thin-bar loader for all other routes
const PageLoader = () => (
    <div className="flex items-center justify-center h-64 w-full">
        <div className="flex flex-col items-center gap-3 opacity-40">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-200/50 dark:border-white/20 border-t-blue-600 dark:border-t-blue-500 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading</span>
        </div>
    </div>
);

// --- PRIVACY & CONTEXT ---
const PrivacyContext = React.createContext({
    privacyMode: false,
    togglePrivacyMode: () => { }
});

const usePrivacy = () => useContext(PrivacyContext);

const PrivacyBlur = ({ children, className = "", strength = 'normal' }: { children?: React.ReactNode, className?: string, strength?: 'normal' | 'strong' }) => {
    const { privacyMode } = usePrivacy();
    const [display, setDisplay] = useState(children);
    const [isBlurred, setIsBlurred] = useState(privacyMode);
    const [isScrambling, setIsScrambling] = useState(false);

    const intervalRef = useRef<any>(null);
    const originalTextRef = useRef(String(children));
    const mountedRef = useRef(false);

    useEffect(() => {
        originalTextRef.current = String(children);
        if (!isScrambling && !isBlurred) {
            setDisplay(children);
        }
    }, [children, isScrambling, isBlurred]);

    useEffect(() => {
        const chars = '0123456789$Â£â‚¬%&@#';
        const maxIterations = 12;
        let iteration = 0;

        if (!mountedRef.current) {
            mountedRef.current = true;
            setIsBlurred(privacyMode);
            setDisplay(children);
            return;
        }

        if (privacyMode) {
            setIsScrambling(true);
            setIsBlurred(false);

            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setDisplay(
                    String(originalTextRef.current).split('').map((char) => {
                        if (char === ' ' || char === ',' || char === '.') return char;
                        return chars[Math.floor(Math.random() * chars.length)];
                    }).join('')
                );

                iteration++;
                if (iteration >= maxIterations) {
                    clearInterval(intervalRef.current);
                    setIsScrambling(false);
                    setIsBlurred(true);
                    setDisplay(originalTextRef.current);
                }
            }, 30);

        } else {
            setIsBlurred(false);
            setIsScrambling(true);

            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setDisplay(prev =>
                    String(originalTextRef.current).split('').map((char) => {
                        if (char === ' ' || char === ',' || char === '.') return char;
                        return chars[Math.floor(Math.random() * chars.length)];
                    }).join('')
                );

                iteration++;
                if (iteration >= maxIterations) {
                    clearInterval(intervalRef.current);
                    setIsScrambling(false);
                    setDisplay(originalTextRef.current);
                }
            }, 30);
        }

        return () => clearInterval(intervalRef.current);
    }, [privacyMode]);

    return (
        <span
            className={`inline-block font-sans tracking-tight ${className}`}
            style={{
                filter: isBlurred ? `blur(${strength === 'strong' ? '16px' : '8px'})` : 'none',
                transition: 'none',
                userSelect: isBlurred ? 'none' : 'auto',
                cursor: isBlurred ? 'default' : 'text'
            }}
        >
            {isScrambling || isBlurred ? display : children}
        </span>
    );
};

// --- VISUAL FX COMPONENTS ---

const EditorialIcon = ({ className }: { className?: string }) => (
    <BrandLogo className={className} accentColor="#84cc16" />
);

// --- CUSTOM WIDGETS ---

const parseSizeToBytes = (size?: string): number => {
    if (!size) return 0;
    const m = String(size).trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
    if (!m) return 0;
    const value = Number(m[1]);
    const unit = m[2].toUpperCase();
    const multipliers: Record<string, number> = {
        B: 1,
        KB: 1024,
        MB: 1024 ** 2,
        GB: 1024 ** 3,
        TB: 1024 ** 4,
    };
    return Number.isFinite(value) ? value * (multipliers[unit] || 1) : 0;
};

const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
        value /= 1024;
        idx += 1;
    }
    const precision = idx >= 3 ? 1 : 0;
    return `${value.toFixed(precision)} ${units[idx]}`;
};

const StatusRibbon = ({ projects, user }: { projects: Project[]; user: UserProfile }) => {
    const demoMode = isMockMode();
    const stripeConnected = Boolean(user?.stripeConnect?.connected);
    const payoutsEnabled = Boolean(user?.stripeConnect?.payoutsEnabled);
    const nativeStorageCapacityBytes = 30 * 1024 ** 3;
    const demoRemainingNativeStorageBytes = 10 * 1024 ** 3;
    const totalBytes = projects.reduce((sum, p) => sum + (p.files || []).reduce((s, f) => s + parseSizeToBytes(f.size), 0), 0);
    const totalFiles = projects.reduce((sum, p) => sum + (p.files || []).length, 0);
    const usedNativeStorageBytes = demoMode ? nativeStorageCapacityBytes - demoRemainingNativeStorageBytes : totalBytes;
    const usagePct = Math.max(0, Math.min(100, Math.round((usedNativeStorageBytes / nativeStorageCapacityBytes) * 100)));

    return (
        <div className="flex flex-wrap items-center gap-4 md:gap-8 p-4 bg-white/50 dark:bg-charcoal border border-zinc-200/50 dark:border-white/5 rounded-2xl mb-8 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Stripe Connect: <span className={stripeConnected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}>{stripeConnected ? 'Connected' : 'Not connected'}</span></span>
            </div>

            <div className="hidden md:block w-px h-4 bg-zinc-200 dark:bg-white/10" />

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Banknote className="w-3.5 h-3.5" />
                <span>Next Payout: <span className="text-zinc-900 dark:text-white">{stripeConnected && payoutsEnabled ? 'Managed in Stripe' : 'Unavailable'}</span></span>
            </div>

            <div className="ml-auto flex items-center gap-4">
                {/* REVAMPED STORAGE WIDGET: Bigger, bolder, new design */}
                <div className="flex items-center gap-4 pl-2 pr-6 py-2 rounded-2xl bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/5 shadow-sm transition-all hover:shadow-md group">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        <HardDrive className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <div className="flex justify-between items-center leading-none">
                            <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">{demoMode ? 'Native Storage' : 'Storage Usage'}</span>
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                {demoMode ? `${formatBytes(demoRemainingNativeStorageBytes)} left` : <><span>{formatBytes(totalBytes)}</span> <span className="opacity-50">({totalFiles} files)</span></>}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 text-zinc-900 shadow-sm dark:bg-blue-500 rounded-full shadow-[0_0_12px_rgba(132,204,22,0.6)] transition-all" style={{ width: `${usagePct}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Timeline = ({ projects }: { projects: Project[] }) => {
    const demoMode = isMockMode();

    const formatLabel = (iso?: string) => {
        if (!iso) return 'Today';
        const d = new Date(iso);
        const now = new Date();
        const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const diff = Math.floor((startNow - startD) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        return d.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
    };

    const activities = projects
        .flatMap((p) => {
            const list: Array<{ date: string; dateSort: string; title: string; subtitle: string; icon: React.ElementType; color: 'lime' | 'white'; }> = [];
            const baseIso = p.createdAt || new Date().toISOString();
            list.push({
                date: formatLabel(baseIso),
                dateSort: baseIso,
                title: 'Project Created',
                subtitle: p.name,
                icon: Plus,
                color: 'white',
            });
            if ((p.files || []).length > 0) {
                list.push({
                    date: formatLabel(baseIso),
                    dateSort: baseIso,
                    title: 'Files Uploaded',
                    subtitle: `${p.files.length} assets`,
                    icon: Upload,
                    color: 'white',
                });
            }
            if (p.clientViewedAt) {
                list.push({
                    date: formatLabel(p.clientViewedAt),
                    dateSort: p.clientViewedAt,
                    title: 'Client Viewed',
                    subtitle: p.name,
                    icon: Eye,
                    color: 'lime',
                });
            }
            if (p.status === 'paid' || p.status === 'completed') {
                const paidIso = p.clientViewedAt || p.dueDate || baseIso;
                list.push({
                    date: formatLabel(paidIso),
                    dateSort: paidIso,
                    title: 'Payment Received',
                    subtitle: p.name,
                    icon: CreditCardIcon,
                    color: 'lime',
                });
            } else if (p.status === 'awaiting_signature') {
                const signIso = p.dueDate || baseIso;
                list.push({
                    date: formatLabel(signIso),
                    dateSort: signIso,
                    title: 'Awaiting Signature',
                    subtitle: p.client?.company || p.client?.name || 'Client',
                    icon: FileText,
                    color: 'lime',
                });
            }
            return list;
        })
        .sort((a, b) => new Date(b.dateSort).getTime() - new Date(a.dateSort).getTime());

    const demoSeedActivities = demoMode
        ? [
            { hoursAgo: 1, title: 'Client Comment Added', subtitle: 'Northline Studio', icon: MessageSquare, color: 'lime' as const },
            { hoursAgo: 2, title: 'Preview Link Opened', subtitle: 'Campaign Cutdowns', icon: Eye, color: 'lime' as const },
            { hoursAgo: 3, title: 'Files Uploaded', subtitle: '4 assets', icon: Upload, color: 'white' as const },
            { hoursAgo: 4, title: 'Project Created', subtitle: 'Launch Sequence', icon: Plus, color: 'white' as const },
            { hoursAgo: 5, title: 'Awaiting Signature', subtitle: 'Westbridge Labs', icon: FileText, color: 'lime' as const },
            { hoursAgo: 6, title: 'Payment Received', subtitle: 'Brand Motion Toolkit', icon: CreditCardIcon, color: 'lime' as const },
            { hoursAgo: 7, title: 'Preview Link Opened', subtitle: 'Editorial Retainer', icon: Eye, color: 'lime' as const },
            { hoursAgo: 8, title: 'Files Uploaded', subtitle: '7 assets', icon: Upload, color: 'white' as const },
            { hoursAgo: 9, title: 'Project Created', subtitle: 'Quarterly Deliverables', icon: Plus, color: 'white' as const },
            { hoursAgo: 10, title: 'Payment Received', subtitle: 'Founder Deck System', icon: CreditCardIcon, color: 'lime' as const },
            { hoursAgo: 11, title: 'Client Comment Added', subtitle: 'Mason & Vale', icon: MessageSquare, color: 'lime' as const },
            { hoursAgo: 12, title: 'Awaiting Signature', subtitle: 'Halden Group', icon: FileText, color: 'lime' as const },
            { hoursAgo: 14, title: 'Preview Link Opened', subtitle: 'Product Refresh', icon: Eye, color: 'lime' as const },
            { hoursAgo: 16, title: 'Payment Received', subtitle: 'Spring Identity', icon: CreditCardIcon, color: 'lime' as const },
            { hoursAgo: 18, title: 'Files Uploaded', subtitle: '2 assets', icon: Upload, color: 'white' as const },
            { hoursAgo: 20, title: 'Project Created', subtitle: 'Studio Retainer', icon: Plus, color: 'white' as const },
        ].map((item) => {
            const iso = new Date(Date.now() - item.hoursAgo * 60 * 60 * 1000).toISOString();
            return {
                date: formatLabel(iso),
                dateSort: iso,
                title: item.title,
                subtitle: item.subtitle,
                icon: item.icon,
                color: item.color,
            };
        })
        : [];

    const briefingActivities = [...activities, ...demoSeedActivities]
        .sort((a, b) => new Date(b.dateSort).getTime() - new Date(a.dateSort).getTime())
        .slice(0, demoMode ? 28 : 12);

    if (briefingActivities.length === 0) {
        return (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/50 dark:border-white/15 bg-zinc-50/70 dark:bg-white/[0.02] px-6 text-center">
                <Clock className="w-7 h-7 text-zinc-400 mb-3" />
                <p className="font-sans tracking-tight text-lg italic text-zinc-600 dark:text-zinc-300">No briefing activity yet.</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">Events will appear here as projects are created, viewed, signed, and paid.</p>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col gap-6 py-2 pb-12">
            <div className="absolute left-[88px] top-4 bottom-4 w-px bg-zinc-200 dark:bg-white/10" />
            {briefingActivities.map((item, i) => {
                const iconColor = {
                    lime: 'text-blue-600 dark:text-blue-400',
                    white: 'text-zinc-500 dark:text-zinc-400'
                }[item.color];

                return (
                    <div key={i} className="flex items-center gap-6 relative z-10 group pl-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-16 text-right font-mono">{item.date}</span>
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-500 text-zinc-900 shadow-sm dark:bg-blue-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'} ring-4 ring-[#f0f2f5] dark:ring-cosmic relative z-20`} />
                        <div className="flex-1 flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm dark:hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-zinc-100 dark:hover:border-white/5">
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-4 h-4 ${iconColor}`} />
                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{item.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 hidden sm:block uppercase tracking-wider">{item.subtitle}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const CyclingWidget = ({ projects }: { projects: Project[] }) => {
    const navigate = useNavigate();
    const [cycleIndex, setCycleIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const demoMode = isMockMode();
    const duration = 10000; // 10 seconds per slide
    const interval = 50; // Update frequency

    const paidProjects = projects.filter((p) => p.status === 'paid' || p.status === 'completed');
    const pendingProjects = projects.filter((p) => p.status === 'awaiting_payment' || p.status === 'awaiting_signature' || p.status === 'payment_verification');
    const activeClients = new Set(
        projects
            .filter((p) => p.clientViewedAt)
            .map((p) => p.client?.email || p.client?.name || p.client?.company || '')
            .filter(Boolean)
    ).size;

    const securedRevenue = demoMode ? 24500 : projects
        .filter((p) => p.status === 'paid' || p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);
        
    const pendingRevenue = demoMode ? 4200 : projects
        .filter((p) => p.status === 'awaiting_payment' || p.status === 'awaiting_signature' || p.status === 'payment_verification')
        .reduce((sum, p) => sum + p.amount, 0);
        
    const nativeStorageCapacityBytes = 30 * 1024 ** 3;
    const demoRemainingNativeStorageBytes = 10 * 1024 ** 3;
    const demoUsedNativeStorageBytes = nativeStorageCapacityBytes - demoRemainingNativeStorageBytes;
    const totalFiles = demoMode ? 142 : projects.reduce((sum, p) => sum + (p.files || []).length, 0);
    const totalBytes = demoMode ? demoUsedNativeStorageBytes : projects.reduce((sum, p) => sum + (p.files || []).reduce((s, f) => s + parseSizeToBytes(f.size), 0), 0);

    const storageBreakdown = demoMode
        ? [
            { label: 'Video', bytes: 10 * 1024 * 1024 * 1024, color: 'bg-indigo-500' },
            { label: 'Images', bytes: 6 * 1024 * 1024 * 1024, color: 'bg-sky-400' },
            { label: 'Docs', bytes: 4 * 1024 * 1024 * 1024, color: 'bg-blue-400' },
        ]
        : (() => {
            const bytesByType = projects.reduce<Record<string, number>>((acc, project) => {
                (project.files || []).forEach((file) => {
                    const bucket = file.type === 'video'
                        ? 'Video'
                        : file.type === 'image'
                            ? 'Images'
                            : 'Docs';
                    acc[bucket] = (acc[bucket] || 0) + parseSizeToBytes(file.size);
                });
                return acc;
            }, {});

            return [
                { label: 'Video', bytes: bytesByType.Video || 0, color: 'bg-indigo-500' },
                { label: 'Images', bytes: bytesByType.Images || 0, color: 'bg-sky-400' },
                { label: 'Docs', bytes: bytesByType.Docs || 0, color: 'bg-blue-400' },
            ].filter((item) => item.bytes > 0);
        })();
    const storageTotal = storageBreakdown.reduce((sum, item) => sum + item.bytes, 0);
    const recentProject = demoMode
        ? null
        : [...projects].sort((a, b) => {
            const aTime = new Date(a.clientViewedAt || a.createdAt || a.dueDate).getTime();
            const bTime = new Date(b.clientViewedAt || b.createdAt || b.dueDate).getTime();
            return bTime - aTime;
        })[0];
    const recentProjectTime = recentProject ? new Date(recentProject.clientViewedAt || recentProject.createdAt || recentProject.dueDate) : null;
    const msPerDay = 1000 * 60 * 60 * 24;

    // Derive the most recent open revision request from any project
    const latestRevision = projects
        .flatMap(p => (p.revisionRequests || [])
            .filter(r => r.status === 'open')
            .map(r => ({
                ...r,
                projectName: p.name,
                clientName: p.client?.name || 'Client',
                clientAvatar: p.client?.avatar,
                company: p.client?.company || '',
            }))
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
    const recentProjectLabel = recentProjectTime
        ? (() => {
            const dayDiff = Math.floor((Date.now() - recentProjectTime.getTime()) / msPerDay);
            if (dayDiff <= 0) return 'Today';
            if (dayDiff === 1) return 'Yesterday';
            if (dayDiff < 7) return `${dayDiff} days ago`;
            return recentProjectTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        })()
        : 'No activity yet';

    const demoSlides = [
        {
            id: 'revenue',
            render: () => (
                <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between h-full bg-white dark:bg-charcoal rounded-3xl transition-all duration-700 ease-in-out">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Net Revenue</span>
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-[10px] bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/30 dark:border-blue-500/20">
                                <ArrowUpRight className="w-3 h-3" /> {demoMode ? '12.5%' : 'Active'}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 mb-6">
                            <PrivacyBlur strength="strong" className={`font-sans tracking-tight text-5xl md:text-6xl tracking-tighter ${GRADIENT_TEXT}`}>${securedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300"><PrivacyBlur>${pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur> Pending</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 dark:opacity-40 pointer-events-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[{ v: 10 }, { v: 25 }, { v: 18 }, { v: 30 }, { v: 25 }, { v: 40 }, { v: 35 }, { v: 50 }]}>
                                <defs>
                                    <linearGradient id="colorHeroMini" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#84cc16" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                                    </linearGradient>
                                    <filter id="shadow" height="200%">
                                        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#84cc16" floodOpacity="0.8" />
                                    </filter>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke="#84cc16" strokeWidth={3} fill="url(#colorHeroMini)" filter="url(#shadow)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )
        },
        {
            id: 'storage',
            render: () => (
                <div className="absolute inset-0 p-6 sm:p-8 z-10 flex flex-col justify-between h-full bg-white dark:bg-[#23232e] rounded-3xl transition-all duration-700 ease-in-out">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-zinc-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Vault Storage</span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 px-2 py-1 rounded-md">{formatBytes(demoRemainingNativeStorageBytes)} left</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <div className="flex items-baseline gap-2">
                            <span className="font-sans tracking-tight text-4xl md:text-5xl text-zinc-900 dark:text-white tracking-tight">{Math.round(demoUsedNativeStorageBytes / (1024 ** 3))}</span>
                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">GB / 30 GB</span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="w-full h-2.5 flex rounded-full overflow-hidden gap-0.5 bg-zinc-100 dark:bg-white/5">
                                <div className="h-full bg-indigo-500 w-[50%]" />
                                <div className="h-full bg-sky-400 w-[30%]" />
                                <div className="h-full bg-blue-400 w-[20%]" />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Video (10GB)</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Images (6GB)</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Docs (4GB)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <button className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 transition-colors">
                            Manage Files <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )
        },
        {
            id: 'reviews',
            render: () => {
                const rev = latestRevision;
                const fmtTime = (iso: string) => {
                    const d = new Date(iso);
                    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                };
                return (
                <div className="absolute inset-0 flex h-full bg-zinc-50 dark:bg-charcoal rounded-3xl transition-all duration-700 ease-in-out overflow-hidden">
                    
                    {/* Left Side: Original Feedback */}
                    <div className={`flex flex-col justify-between p-6 sm:p-8 transition-all duration-500 ${isReplying ? 'w-1/2 border-r border-zinc-200/50 dark:border-white/5' : 'w-full'}`}>
                        {/* Header: Type + Time */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">New Feedback</span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">{rev ? fmtTime(rev.createdAt) : '—'}</span>
                        </div>

                        {/* Body: Quote */}
                        <div className="flex-1 flex flex-col justify-center py-2">
                            {rev ? (
                                <h3 className={`font-sans tracking-tight leading-snug text-zinc-900 dark:text-white transition-all duration-500 ${isReplying ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>
                                    "{rev.message}"
                                </h3>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                    <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No open feedback</span>
                                    <span className="text-xs text-zinc-400">Client revision requests will appear here</span>
                                </div>
                            )}
                        </div>

                        {/* Footer: User + Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-10 sm:pb-7">
                            <div className="flex items-center gap-3">
                                {rev?.clientAvatar ? (
                                    <img src={rev.clientAvatar} alt={rev.clientName} className="w-8 h-8 rounded-full bg-white border border-zinc-200/50 dark:border-white/10" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-white/10 border border-zinc-200/50 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                        {rev ? rev.clientName.charAt(0) : '?'}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{rev?.clientName ?? 'No requests'}</span>
                                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">{rev?.projectName ?? '—'}</span>
                                </div>
                            </div>
                            
                            {!isReplying && rev && (
                                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                                    <button className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/10 transition-all">
                                        Mark Resolved
                                    </button>
                                    <button 
                                        onClick={() => setIsReplying(true)}
                                        className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        Reply <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Reply Box */}
                    <div className={`flex flex-col p-6 sm:p-8 bg-white dark:bg-charcoal transition-all duration-500 ${isReplying ? 'w-1/2 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full p-0 overflow-hidden'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Reply to {rev?.clientName ?? 'Client'}</span>
                            <button onClick={() => setIsReplying(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <textarea 
                            className="flex-1 w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 rounded-xl p-3 text-sm text-zinc-900 dark:text-white resize-none focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                            placeholder="Type your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex justify-start mt-4">
                            <button 
                                onClick={() => { setIsReplying(false); setReplyText(''); playSuccess(); }}
                                className="px-4 py-2 rounded-lg bg-blue-500 text-zinc-900 shadow-sm text-white  text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                Send <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
                );
            }
        },
        {
            id: 'upgrade',
            render: () => (
                <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between h-full bg-gradient-to-br from-zinc-900 flex-col via-zinc-800 to-black text-white rounded-3xl animate-fade-in relative overflow-hidden transition-all duration-700 ease-in-out border border-white/10 shadow-2xl shadow-black/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-[#323242]/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    <div className="relative h-full flex flex-col justify-between z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-blue-500 text-zinc-900 shadow-sm text-white ">Upgrade</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-white dark:text-white/60">Business Tier</span>
                            </div>
                            <h3 className="font-sans tracking-tight text-3xl md:text-4xl leading-tight mb-2 text-white dark:text-white">Unlock unlimited project history.</h3>
                            <p className="text-sm opacity-80 max-w-[80%] text-zinc-300 dark:text-zinc-400">Get advanced reporting and client portals.</p>
                        </div>
                        <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all mt-4 text-blue-400 dark:text-blue-400">
                            View Plans <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )
        },
        {
            id: 'live_activity',
            render: () => (
                <div className="absolute inset-0 p-6 sm:p-8 z-10 flex flex-col justify-between h-full bg-zinc-900 dark:bg-[#23232e] rounded-3xl transition-all duration-700 ease-in-out relative overflow-hidden">
                    {/* Subtle grid background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/10 border border-white/10 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 text-zinc-900 shadow-sm"></span>
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white">Live Session</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/50">Right Now</span>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="relative">
                                <img src="https://api.dicebear.com/9.x/shapes/svg?seed=MikeRoss" alt="Client" className="w-12 h-12 rounded-full border-2 border-zinc-800" />
                                <div className="absolute -bottom-1 -right-1 bg-zinc-800 p-1 rounded-full border border-zinc-700">
                                    <Monitor className="w-3 h-3 text-blue-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight">Mike Ross</h3>
                                <p className="text-xs text-white/60">Vertex Corp</p>
                            </div>
                        </div>
                        <p className="font-sans tracking-tight text-xl text-white/90 leading-snug">
                            Currently viewing <span className="text-blue-400 font-sans font-medium">Q4_Financial_Report.pdf</span>
                        </p>
                    </div>

                    <div className="relative z-10 flex justify-start">
                        <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 backdrop-blur-md border border-white/10">
                            Join Session <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )
        }
    ];

    const realSlides = [
        {
            id: 'revenue',
            render: () => (
                <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between h-full bg-white dark:bg-charcoal rounded-3xl transition-all duration-700 ease-in-out">
                    <div>
                        <div className="flex justify-between items-start mb-4 gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Net Revenue</span>
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-[10px] bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/30 dark:border-blue-500/20 shrink-0">
                                <ArrowUpRight className="w-3 h-3" /> {paidProjects.length} closed
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 mb-6">
                            <PrivacyBlur strength="strong" className={`font-sans tracking-tight text-5xl md:text-6xl tracking-tighter ${GRADIENT_TEXT}`}>${securedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300"><PrivacyBlur>${pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur> Pending</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{paidProjects.length} paid or completed</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 dark:opacity-40 pointer-events-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={[
                                    { v: Math.max(securedRevenue * 0.18, pendingRevenue) },
                                    { v: Math.max(securedRevenue * 0.35, pendingRevenue) },
                                    { v: Math.max(securedRevenue * 0.52, pendingRevenue) },
                                    { v: Math.max(securedRevenue * 0.68, pendingRevenue) },
                                    { v: Math.max(securedRevenue * 0.84, pendingRevenue) },
                                    { v: Math.max(securedRevenue, pendingRevenue) },
                                ]}
                            >
                                <defs>
                                    <linearGradient id="colorHeroMiniLive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#84cc16" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                                    </linearGradient>
                                    <filter id="shadowLive" height="200%">
                                        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#84cc16" floodOpacity="0.8" />
                                    </filter>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke="#84cc16" strokeWidth={3} fill="url(#colorHeroMiniLive)" filter="url(#shadowLive)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )
        },
        {
            id: 'storage',
            render: () => (
                <div className="absolute inset-0 p-6 sm:p-8 z-10 flex flex-col justify-between h-full bg-white dark:bg-[#23232e] rounded-3xl transition-all duration-700 ease-in-out">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-zinc-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Project Storage</span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 px-2 py-1 rounded-md">{totalFiles} files</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-sans tracking-tight text-4xl md:text-5xl text-zinc-900 dark:text-white tracking-tight">{formatBytes(totalBytes)}</span>
                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Across {projects.length} project{projects.length === 1 ? '' : 's'}</span>
                        </div>

                        <div className="space-y-2">
                            <div className="w-full h-2.5 flex rounded-full overflow-hidden gap-0.5 bg-zinc-100 dark:bg-white/5">
                                {(storageBreakdown.length > 0 ? storageBreakdown : [{ label: 'Empty', bytes: 1, color: 'bg-zinc-300 dark:bg-white/10' }]).map((item) => (
                                    <div
                                        key={item.label}
                                        className={`h-full ${item.color}`}
                                        style={{ width: `${storageTotal > 0 ? (item.bytes / storageTotal) * 100 : 100}%` }}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                                {(storageBreakdown.length > 0 ? storageBreakdown : [{ label: 'No files', bytes: 0, color: 'bg-zinc-300' }]).map((item) => (
                                    <span key={item.label} className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} /> {item.label} ({item.bytes > 0 ? formatBytes(item.bytes) : '0 B'})
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        <span>{activeClients} active client{activeClients === 1 ? '' : 's'}</span>
                        <button onClick={() => { playClick(); navigate('/vault'); }} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 transition-colors">
                            Manage Files <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )
        },
        {
            id: 'activity',
            render: () => (
                <div className="absolute inset-0 p-6 sm:p-8 z-10 flex flex-col justify-between h-full bg-zinc-900 dark:bg-[#23232e] rounded-3xl transition-all duration-700 ease-in-out relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="relative z-10 flex justify-between items-start gap-3">
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/10 border border-white/10 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 text-zinc-900 shadow-sm"></span>
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white">Recent Activity</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/50">{recentProjectLabel}</span>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        {recentProject ? (
                            <>
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="relative">
                                        {recentProject.client.avatar ? (
                                            <img src={recentProject.client.avatar} alt={recentProject.client.name || 'Client'} className="w-12 h-12 rounded-full border-2 border-zinc-800 object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full border-2 border-zinc-800 bg-white/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-white/70" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 bg-zinc-800 p-1 rounded-full border border-zinc-700">
                                            <Monitor className="w-3 h-3 text-blue-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight">{recentProject.client.name || recentProject.client.company || 'Client'}</h3>
                                        <p className="text-xs text-white/60">{recentProject.client.company || recentProject.name}</p>
                                    </div>
                                </div>
                                <p className="font-sans tracking-tight text-xl text-white/90 leading-snug">
                                    {recentProject.clientViewedAt ? 'Last viewed' : 'Most recent project'} <span className="text-blue-400 font-sans font-medium">{recentProject.name}</span>
                                </p>
                                <p className="text-xs uppercase tracking-widest text-white/50 mt-3">
                                    {recentProject.status.replace(/_/g, ' ')} • ${recentProject.amount.toLocaleString()}
                                </p>
                            </>
                        ) : (
                            <div>
                                <h3 className="font-sans tracking-tight text-3xl text-white mb-2">No project activity yet.</h3>
                                <p className="text-sm text-white/70 max-w-sm">Create your first project to start tracking client views, payments, and delivery activity here.</p>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 flex justify-start">
                        <button onClick={() => { playClick(); navigate(recentProject ? '/activity' : '/create'); }} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 backdrop-blur-md border border-white/10">
                            {recentProject ? 'Open Activity' : 'Create Project'} <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )
        },
        // Reviews slide — shows the most recent open revision request from any project
        ...(latestRevision ? [{
            id: 'reviews',
            render: demoSlides.find(s => s.id === 'reviews')!.render,
        }] : []),
    ];
    const slides = demoMode ? demoSlides : realSlides;

    useEffect(() => {
        setCycleIndex((idx) => (idx >= slides.length ? 0 : idx));
    }, [slides.length]);

    useEffect(() => {
        let timer: any;
        if (!isPaused && !isReplying && slides.length > 1) {
            timer = setInterval(() => {
                setProgress((prev) => {
                    const next = prev + (interval / duration) * 100;
                    if (next >= 100) {
                        setCycleIndex((idx) => (idx + 1) % slides.length);
                        return 0;
                    }
                    return next;
                });
            }, interval);
        }
        return () => clearInterval(timer);
    }, [isPaused, isReplying, slides.length]);

    const manualChange = (index: number) => {
        setCycleIndex(index);
        setProgress(0);
        setIsReplying(false);
    };

    if (!demoMode && projects.length === 0) {
        return (
            <div className="w-full bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm relative h-[280px] p-6 sm:p-8">
                <div className="h-full flex flex-col items-center justify-center text-center opacity-90 p-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 flex items-center justify-center mb-4 shadow-sm">
                        <Database className="w-8 h-8 text-zinc-400 stroke-[1.5]" />
                    </div>
                    <h3 className="font-sans tracking-tight text-xl text-zinc-900 dark:text-white mb-2">Unlock Your Analytics</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed mb-6">
                        Create your first project to start tracking revenue, storage usage, and client engagement.
                    </p>
                    <button onClick={() => { playClick(); navigate('/create'); }} className="px-5 py-2.5 rounded-xl border border-zinc-200/50 dark:border-white/10 hover:border-zinc-200/50 dark:hover:border-white/20 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-[11px] font-bold uppercase tracking-wider transition-all">
                        Initialize Analytics
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm relative group hover:shadow-md transition-all h-[280px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Progress Bar */}
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-zinc-100 dark:bg-white/5 z-30 rounded-b-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div 
                    className="h-full bg-blue-500 text-zinc-900 shadow-sm dark:bg-blue-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(132,204,22,0.5)]"
                    style={{ width: `${progress}%`, opacity: isPaused ? 0.2 : 1 }}
                />
            </div>

            {slides.map((slide, i) => (
                <div 
                    key={slide.id} 
                    className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform ${
                        i === cycleIndex 
                            ? 'opacity-100 translate-x-0 z-20' 
                            : 'opacity-0 translate-x-8 z-10 pointer-events-none'
                    }`}
                >
                    {slide.render()}
                </div>
            ))}
            
            {/* Cycle Indicators */}
            <div className="absolute bottom-6 right-8 flex gap-2 z-30 pointer-events-auto">
                {slides.map((_, i) => (
                    <button 
                        key={i} 
                        onClick={() => manualChange(i)}
                        className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === cycleIndex ? 'w-8 bg-zinc-900 dark:bg-white' : 'w-1.5 bg-zinc-300 dark:bg-white/20 hover:bg-zinc-400'}`} 
                    />
                ))}
            </div>
        </div>
    );
};

const DashboardView = ({ projects, user }: { projects: Project[], user: UserProfile }) => {
    // ... same as before
    const navigate = useNavigate();
    const location = useLocation();
    const { openSearch } = useOutletContext<{ privacyMode: boolean; openSearch?: () => void }>();
    const [projectTab, setProjectTab] = useState<'pending' | 'draft' | 'paid'>('pending');
    const [briefingPulse, setBriefingPulse] = useState(false);
    const briefingPulseLocationKeyRef = useRef<string | null>(null);

    // Projects / Clients toggle — reads ?view=clients from URL so command palette can deep-link
    const [dashView, setDashView] = useState<'projects' | 'clients'>(() => {
        const params = new URLSearchParams(location.search);
        return params.get('view') === 'clients' ? 'clients' : 'projects';
    });

    useEffect(() => {
        const highlight = (location.state as { widgetPanelHighlight?: string } | null)?.widgetPanelHighlight;
        if (highlight !== 'briefing') return;
        if (briefingPulseLocationKeyRef.current === location.key) return;
        briefingPulseLocationKeyRef.current = location.key;
        setBriefingPulse(true);
        const timer = window.setTimeout(() => setBriefingPulse(false), 2400);
        return () => window.clearTimeout(timer);
    }, [location.key, location.state]);

    const filteredProjects = projects.filter(p => {
        if (projectTab === 'pending') return p.status === 'awaiting_payment';
        if (projectTab === 'draft') return p.status === 'draft' || p.status === 'awaiting_signature';
        if (projectTab === 'paid') return p.status === 'paid' || p.status === 'completed';
        return false;
    });

    const demoMode = isMockMode();
    const liveClients = demoMode
        ? [
            { id: 1, name: 'John Smith', project: 'Brand Identity', status: 'viewing', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=JohnSmith&backgroundColor=18181b&shape1Color=3b82f6&shape2Color=93c5fd&shape3Color=1e3a8a' },
            { id: 2, name: 'Sarah Chen', project: 'Website Redesign', status: 'idle', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=SarahChen&backgroundColor=0f172a&shape1Color=f472b6&shape2Color=fbcfe8&shape3Color=831843' },
            { id: 3, name: 'Mike Ross', project: 'Mobile App', status: 'offline', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=MikeRoss&backgroundColor=27272a&shape1Color=a78bfa&shape2Color=ddd6fe&shape3Color=5b21b6' },
        ]
        : projects
            .filter((p) => p.client?.name || p.client?.company)
            .slice(0, 3)
            .map((p, idx) => {
                const viewedRecently = p.clientViewedAt && (Date.now() - new Date(p.clientViewedAt).getTime()) < 1000 * 60 * 15;
                const fallbackAvatar = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(p.client.name || p.client.company || `Client${idx}`)}`;
                return {
                    id: p.id || idx,
                    name: p.client.name || p.client.company || 'Client',
                    project: p.name,
                    status: viewedRecently ? 'viewing' : (p.clientViewedAt ? 'idle' : 'offline'),
                    avatar: p.client.avatar || (demoMode ? fallbackAvatar : ''),
                };
            });

    const awaitingSignature = projects.filter((p) => p.status === 'awaiting_signature').length;
    const awaitingPayment = projects.filter((p) => p.status === 'awaiting_payment').length;
    const paidToday = projects.filter((p) => (p.status === 'paid' || p.status === 'completed') && p.clientViewedAt && new Date(p.clientViewedAt).toDateString() === new Date().toDateString()).length;
    const alerts = [
        awaitingSignature > 0 ? { id: 1, type: 'critical' as const, message: `${awaitingSignature} project${awaitingSignature === 1 ? '' : 's'} awaiting signature`, icon: FileWarning } : null,
        awaitingPayment > 0 ? { id: 2, type: 'warning' as const, message: `${awaitingPayment} project${awaitingPayment === 1 ? '' : 's'} awaiting payment`, icon: Clock } : null,
        paidToday > 0 ? { id: 3, type: 'info' as const, message: `${paidToday} payment${paidToday === 1 ? '' : 's'} confirmed today`, icon: Verified } : null,
    ].filter(Boolean) as Array<{ id: number; type: 'critical' | 'warning' | 'info'; message: string; icon: React.ElementType }>;

    return (
        <div className="space-y-6 animate-slide-up relative z-10 pb-12 bg-[#f0f2f5] dark:bg-cosmic">
            <div className="flex flex-col gap-6 border-b border-zinc-200/50 dark:border-white/5 pb-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h1 className="font-sans tracking-tight text-3xl md:text-5xl text-zinc-900 dark:text-white leading-tight mb-2">
                            <span>Dash</span><span className="text-[#84cc16] dark:text-[#a3e635]">board</span>
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-lg">Here's your project overview for today.</p>
                        {/* At-a-Glance strip — live stats derived from store */}
                        {(() => {
                            const pendingPayment = projects.filter(p => p.status === 'awaiting_payment');
                            const awaitingSignature = projects.filter(p => p.status === 'awaiting_signature');
                            const pendingTotal = pendingPayment.reduce((s, p) => s + p.amount, 0);
                            const chips = [
                                pendingPayment.length > 0 && {
                                    label: `${pendingPayment.length} payment${pendingPayment.length !== 1 ? 's' : ''} due`,
                                    value: `$${pendingTotal.toLocaleString()}`,
                                    color: 'amber' as const,
                                    icon: DollarSign,
                                    action: () => setProjectTab('pending'),
                                },
                                awaitingSignature.length > 0 && {
                                    label: `${awaitingSignature.length} awaiting signature`,
                                    value: null,
                                    color: 'blue' as const,
                                    icon: FileText,
                                    action: () => setProjectTab('draft'),
                                },
                                projects.length === 0 && {
                                    label: 'No projects yet',
                                    value: 'Create your first',
                                    color: 'slate' as const,
                                    icon: Briefcase,
                                    action: () => navigate('/create'),
                                },
                            ].filter(Boolean) as { label: string; value: string | null; color: 'amber' | 'blue' | 'lime' | 'slate'; icon: React.ElementType; action: () => void }[];
                            if (chips.length === 0) return (
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 text-[11px] font-bold text-blue-700 dark:text-blue-400">
                                    <CheckCircle className="w-3 h-3" /> All caught up — nothing pending.
                    </div>
                            );
                            const colorMap = {
                                amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30 text-amber-700 dark:text-amber-400',
                                blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30 text-blue-700 dark:text-blue-400',
                                lime: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30 text-blue-700 dark:text-blue-400',
                                slate: 'bg-zinc-100 dark:bg-white/5 border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400',
                            };
                            return (
                                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                                    {chips.map((chip, i) => (
                                        <button key={i} onClick={() => { playClick(); chip.action(); }} className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all hover:scale-[1.03] ${colorMap[chip.color]}`}>
                                            <chip.icon className="w-3 h-3" />
                                            <span className="whitespace-nowrap">{chip.label}{chip.value && <span className="opacity-70"> · {chip.value}</span>}</span>
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                    <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-white/5 rounded-2xl border border-zinc-200/50 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                        <button onClick={() => navigate('/create')} className="px-5 py-3 rounded-xl bg-blue-500 text-zinc-900 shadow-sm text-white  font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center gap-2 whitespace-nowrap">
                            <Plus className="w-4 h-4" /> New Project
                        </button>
                        <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 mx-1" />
                        <button onClick={() => navigate('/vault')} className="px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 font-sans font-bold text-xs uppercase tracking-widest transition-colors whitespace-nowrap">Vault</button>
                        <button onClick={() => navigate('/activity')} className="px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 font-sans font-bold text-xs uppercase tracking-widest transition-colors whitespace-nowrap">Activity</button>
                        <button onClick={() => navigate('/reports')} className="px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 font-sans font-bold text-xs uppercase tracking-widest transition-colors whitespace-nowrap">Reports</button>
                    </div>
                </div>
            </div>

            {/* Projects / Clients toggle */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 rounded-2xl p-1 w-fit border border-zinc-200/50 dark:border-white/10 shadow-sm">
                <button
                    onClick={() => { playClick(); setDashView('projects'); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${dashView === 'projects' ? 'bg-white dark:bg-white/10 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                >
                    <FolderLock className="w-3.5 h-3.5" /> Projects
                </button>
                <button
                    onClick={() => { playClick(); setDashView('clients'); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${dashView === 'clients' ? 'bg-white dark:bg-white/10 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                >
                    <Users className="w-3.5 h-3.5" /> Clients
                </button>
            </div>

            {dashView === 'clients' && <ClientRolodexContent />}

            {dashView === 'projects' && <>

            {/* Status Ribbon - Now part of dashboard logic */}
            <StatusRibbon projects={projects} user={user} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
                <div className="xl:col-span-8 flex flex-col gap-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* CYCLING WIDGET COMPONENT */}
                        <CyclingWidget projects={projects} />

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-1 pt-1">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                    <Siren className="w-3.5 h-3.5 text-red-500" /> Today's Priorities
                                </h3>
                                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-lg shadow-red-500/30 animate-pulse">{alerts.length} Actions</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                                {alerts.length === 0 ? (
                                    <div className="bg-zinc-50 dark:bg-[#23232e]/45 border-2 border-dashed border-zinc-200/50 dark:border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center flex-1 min-h-[220px]">
                                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center mb-4 shadow-sm border border-zinc-100 dark:border-white/10">
                                            <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                                        </div>
                                        <p className="font-sans tracking-tight text-xl text-zinc-900 dark:text-white mb-1">Clear Horizon</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px] mb-5">
                                            Everything is up to date. Ready for new incoming clients?
                                        </p>
                                        <button onClick={() => { playClick(); navigate('/create'); }} className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-blue-500 text-white dark:text-white text-[11px] font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center gap-2 group shadow-lg shadow-black/5">
                                            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" /> Create Project
                                        </button>
                                    </div>
                                ) : alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
                                        className="bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3 hover:border-zinc-200/50 dark:hover:border-white/20 transition-all cursor-pointer group shadow-sm"
                                    >
                                        <div className={`p-2.5 rounded-xl shrink-0 ${alert.type === 'critical' ? 'bg-red-500/10 text-red-500' : alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            <alert.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">{alert.type === 'critical' ? 'Urgent' : alert.type === 'warning' ? 'Warning' : 'Info'}</p>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate leading-tight">{alert.message}</p>
                                            </div>
                                        <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ... Rest of dashboard ... */}
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                            <ActivityIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Live Client Pulse
                        </h2>
                        {liveClients.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-zinc-200/50 dark:border-white/15 p-6 text-center bg-white/70 dark:bg-white/[0.02]">
                                <Monitor className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">No active client sessions.</p>
                                <p className="text-xs text-zinc-400 mt-1">Recent client activity appears here once someone opens a project link.</p>
                            </div>
                        ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {liveClients.map((client) => (
                                    <Card key={client.id} className="p-4 flex items-center gap-4 hover:border-blue-500/50 dark:hover:border-blue-500/50 cursor-pointer group" noPadding>
                                    <div className="relative">
                                        <img src={client.avatar} className="w-10 h-10 rounded-full object-cover" />
                                        {client.status === 'viewing' && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 text-zinc-900 shadow-sm"></span>
                                            </span>
                                        )}
                                        {client.status === 'idle' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-[#23232e]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{client.name}</h4>
                                                {client.status === 'viewing' && <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider animate-pulse">Live</span>}
                                        </div>
                                            <p className="text-xs text-zinc-500 truncate">{client.project}</p>
                                    </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                </Card>
                            ))}
                        </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-end justify-between mb-6">
                            <h2 className={`font-sans tracking-tight text-3xl tracking-tight ${GRADIENT_TEXT}`}>Active Projects</h2>
                            <div className="flex gap-4">
                                {['pending', 'draft', 'paid'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setProjectTab(tab as any)}
                                        className={`pb-1 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${projectTab === tab ? 'border-blue-600 text-zinc-900 dark:text-white dark:border-blue-500' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col border-t border-zinc-200/50 dark:border-white/5">
                            {filteredProjects.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center opacity-80 border-2 border-dashed border-zinc-200/50 dark:border-white/10 rounded-3xl m-4 bg-zinc-50 dark:bg-[#23232e]/45">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-white/5 flex items-center justify-center mb-6 shadow-sm border border-zinc-100 dark:border-white/10 relative">
                                        <Briefcase className="w-10 h-10 stroke-[1.5] text-zinc-400" />
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center border-2 border-white dark:border-[#23232e]">
                                            <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                    <h3 className="font-sans tracking-tight text-2xl text-zinc-900 dark:text-white mb-2">Start Your First Project</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[320px] text-center mb-8 leading-relaxed">
                                        Securely share files, collect payments, and manage client handovers in one professional workspace.
                                    </p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                        <button onClick={() => { playClick(); navigate('/create'); }} className="px-6 py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-black/5">
                                            <Plus className="w-4 h-4" /> Create Project
                                        </button>
                                        <button onClick={() => { playClick(); document.getElementById('vault-tab-draft')?.click(); }} className="px-6 py-3.5 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                                            Start with a Draft
                                        </button>
                                    </div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Takes less than 30 seconds</p>
                                </div>
                            ) : (
                                filteredProjects.map((p, i) => (
                                    <div
                                        key={p.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/preview/${p.id}`, { state: { from: location.pathname } })}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/preview/${p.id}`, { state: { from: location.pathname } }); }}
                                        className="group flex flex-col md:flex-row md:items-center justify-between py-6 border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 px-4 -mx-4 rounded-xl transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="font-mono text-xs text-zinc-300 dark:text-zinc-600 w-8">{(i + 1).toString().padStart(2, '0')}</span>
                                            <div className="relative">
                                                <img src={p.client.avatar} loading="lazy" className="w-12 h-12 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#23232e] ${p.status === 'paid' ? 'bg-blue-500 text-zinc-900 shadow-sm' : 'bg-amber-500'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{p.name}</h3>
                                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{p.client.company || p.client.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 mt-4 md:mt-0 ml-14 md:ml-0">
                                            <div className="text-right">
                                                <div className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-0.5">Value</div>
                                                <div className="font-sans tracking-tight text-lg text-zinc-900 dark:text-white">
                                                    <PrivacyBlur>${p.amount.toLocaleString()}</PrivacyBlur>
                                                </div>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <div className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-0.5">Due</div>
                                                <div className="font-mono text-sm text-zinc-600 dark:text-zinc-300">
                                                    {new Date(p.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center justify-center text-zinc-400 group-hover:bg-blue-500 text-zinc-900 shadow-sm group-hover:border-blue-600 group-hover:text-white dark:group-hover:bg-blue-500 dark:group-hover:text-black transition-all">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button onClick={() => navigate('/reports?focus=audit')} className="mt-8 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 group transition-colors">
                            View Full Ledger <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
                {/* ... Sidebar preserved ... */}
                <div className="xl:col-span-4 p-2 md:p-3 flex flex-col h-[calc(100vh-140px)] sticky top-24">
                    <div className={`relative flex-1 h-full overflow-visible ${briefingPulse ? 'widget-highlight-shell widget-highlight-double' : ''}`}>
                    <div className="flex flex-col flex-1 pb-2 h-full overflow-hidden rounded-2xl border border-transparent transition-[box-shadow,border-color] duration-700">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className={`font-serif text-3xl ${GRADIENT_TEXT}`}>The Briefing</h3>
                                <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-bold">Daily Timeline</p>
                            </div>
                            <button className="p-3 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors border border-zinc-200/50 dark:border-white/10">
                                <Filter className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto relative pr-2 custom-scrollbar briefing-scroll">
                            <Timeline projects={projects} />
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            </>}
        </div>
    );
};

const VaultView = ({ projects }: { projects: Project[] }) => {
    // ... same as before
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [vaultFilter, setVaultFilter] = useState<'all' | 'active' | 'paid' | 'archived'>('all');
    const [vaultLayout, setVaultLayout] = useState<'grid' | 'list'>('grid');
    const [qrProjectId, setQrProjectId] = useState<string | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

    const downloadBlob = (filename: string, blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    };

    const handleVaultInvoicePdf = async (project: Project) => {
        if (downloadingPdf) return;
        playClick();
        setDownloadingPdf(project.id + '_inv');
        try {
            const blob = await createAuditTrailPdf({
                projectName: project.name,
                projectId: project.id,
                evidenceId: `ev_${project.id}`,
                creatorName: '',
                creatorEmail: '',
                clientName: project.client?.name || 'Client',
                clientEmail: project.client?.email,
                status: project.status,
                amountUsd: project.amount,
                createdAt: project.createdAt,
                dueDate: project.dueDate,
                viewedAt: project.clientViewedAt,
                files: (project.files || []).map(f => ({ name: f.name, type: f.type, size: f.size, hash: f.metadata?.hash, locked: f.locked })),
                timeline: [],
            });
            downloadBlob(`Heartflair_Invoice_${project.name.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob);
        } catch { } finally { setDownloadingPdf(null); }
    };

    const handleVaultReceiptPdf = async (project: Project) => {
        if (downloadingPdf) return;
        playClick();
        setDownloadingPdf(project.id + '_rec');
        try {
            const blob = await createRightsCertificatePdf({
                certificateId: `cert_${project.id}`,
                projectName: project.name,
                projectId: project.id,
                creatorName: '',
                creatorEmail: '',
                clientName: project.client?.name || 'Client',
                clientEmail: project.client?.email,
                amountUsd: project.amount,
                issuedAt: new Date().toISOString(),
                effectiveAt: project.dueDate || new Date().toISOString(),
                status: project.status,
                scope: (project.files || []).map(f => f.name),
            });
            downloadBlob(`Heartflair_Receipt_${project.name.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob);
        } catch { } finally { setDownloadingPdf(null); }
    };

    const qrProject = qrProjectId ? projects.find(p => p.id === qrProjectId) : null;
    const qrUrl = qrProject ? `${window.location.origin}/c/${qrProject.clientLink}` : '';

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const visibleProjects = projects.filter((project) => {
        const statusMatch = (() => {
            if (vaultFilter === 'all') return true;
            if (vaultFilter === 'active') return ['draft', 'awaiting_signature', 'awaiting_payment', 'payment_verification'].includes(project.status);
            if (vaultFilter === 'paid') return project.status === 'paid';
            if (vaultFilter === 'archived') return project.status === 'completed';
            return true;
        })();

        if (!statusMatch) return false;
        if (!normalizedQuery) return true;

        const projectFields = [
            project.name,
            project.description,
            project.client?.name,
            project.client?.company,
            project.client?.email,
            project.id,
            project.type,
            project.status,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        if (projectFields.includes(normalizedQuery)) return true;

        return (project.files || []).some((file) => {
            const fileFields = [file.name, file.type, file.tag, file.folderName].filter(Boolean).join(' ').toLowerCase();
            return fileFields.includes(normalizedQuery);
        });
    });

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'image': return <ImageIcon className="w-6 h-6" />;
            case 'video': return <Film className="w-6 h-6" />;
            case 'pdf': return <FileText className="w-6 h-6" />;
            case 'archive': return <FileArchive className="w-6 h-6" />;
            case 'audio': return <Music className="w-6 h-6" />;
            default: return <File className="w-6 h-6" />;
        }
    };

    return (
        <div className="space-y-6 animate-slide-up relative z-10 bg-[#f0f2f5] dark:bg-cosmic">
            {/* ... Content same as previously provided, preserving logic ... */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
                <div>
                    <h2 className={`text-4xl font-sans tracking-tight font-medium tracking-tight ${GRADIENT_TEXT}`}>
                        Project <span className="px-2 py-0.5 rounded-lg bg-transparent text-blue-600 dark:text-blue-400">Vault</span>
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base mt-1">
                        Secure delivery pipeline and asset management.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/trash')} className="h-12 px-6 rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Trash</span>
                    </button>
                    <button onClick={() => navigate('/create')} className="h-12 px-8 rounded-xl bg-blue-500 text-zinc-900 shadow-sm text-white  font-bold text-sm uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(132,204,22,0.3)] dark:shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] dark:hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] transition-all hover:scale-105">
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>
            </div>
            {/* ... Rest of Vault View ... */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/50 dark:bg-charcoal backdrop-blur-md p-2 rounded-2xl border border-zinc-200/50 dark:border-white/5">
                <div className="relative w-full sm:flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects, clients, or files..."
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-transparent text-sm focus:bg-white dark:focus:bg-white/5 outline-none transition-all placeholder:text-zinc-500"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
                    {[
                        { key: 'all', label: 'All Projects' },
                        { key: 'active', label: 'Active' },
                        { key: 'paid', label: 'Paid' },
                        { key: 'archived', label: 'Archived' },
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => setVaultFilter(filter.key as 'all' | 'active' | 'paid' | 'archived')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${vaultFilter === filter.key ? 'bg-white dark:bg-white/10 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5'}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-zinc-300 dark:bg-white/10 mx-2" />
                    <button onClick={() => { playClick(); setVaultLayout('grid'); }} className={`p-2.5 rounded-lg transition-colors ${vaultLayout === 'grid' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5'}`} title="Card view"><LayoutGrid className="w-5 h-5" /></button>
                    <button onClick={() => { playClick(); setVaultLayout('list'); }} className={`p-2.5 rounded-lg transition-colors ${vaultLayout === 'list' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5'}`} title="List view"><ListIcon className="w-5 h-5" /></button>
                </div>
            </div>
            {/* Empty state */}
            {visibleProjects.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center opacity-80 border border-dashed border-zinc-200/50 dark:border-white/10 rounded-3xl bg-zinc-50 dark:bg-[#23232e]/45 m-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-white/5 flex items-center justify-center mb-6 shadow-sm border border-zinc-100 dark:border-white/10">
                        {searchQuery ? <Search className="w-10 h-10 stroke-[1.5] text-zinc-400" /> : <LockKeyhole className="w-10 h-10 stroke-[1.5] text-zinc-400" />}
                    </div>
                    
                    {searchQuery ? (
                        <>
                            <h3 className="font-sans tracking-tight text-2xl text-zinc-900 dark:text-white mb-2">No results found</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-[300px]">
                                We couldn't find any projects matching "{searchQuery}". Try adjusting your filters or search terms.
                            </p>
                            <button onClick={() => { playClick(); setSearchQuery(''); }} className="px-6 py-3 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-700 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors">
                                Clear Search
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="font-sans tracking-tight text-2xl text-zinc-900 dark:text-white mb-2">No Projects Yet</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-[320px] leading-relaxed">
                                Create your first project to organize deliverables, share files, and track payments in one place.
                            </p>
                            <button onClick={() => { playClick(); navigate('/create'); }} className="px-8 py-4 rounded-2xl bg-zinc-900 dark:bg-blue-500 text-white dark:text-white text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center gap-3 shadow-xl shadow-zinc-900/10 dark:shadow-blue-500/10">
                                <Plus className="w-5 h-5" /> Create First Project
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* â”€â”€ List view â”€â”€ */}
            {vaultLayout === 'list' && visibleProjects.length > 0 && (
                <div className="bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/5 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-100 dark:border-white/5">
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Project</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hidden md:table-cell">Client</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hidden sm:table-cell">Status</th>
                                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Value</th>
                                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hidden lg:table-cell">Files</th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {visibleProjects.map(project => {
                                const statusColors: Record<string, string> = {
                                    draft: 'text-zinc-500 bg-zinc-100 dark:bg-white/5',
                                    awaiting_signature: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',
                                    awaiting_payment: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
                                    payment_verification: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
                                    paid: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
                                    completed: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
                                };
                                return (
                                    <tr
                                        key={project.id}
                                        onClick={() => navigate(`/preview/${project.id}`, { state: { from: location.pathname } })}
                                        className="border-b border-zinc-50 dark:border-white/[0.03] hover:bg-zinc-50 dark:hover:bg-white/[0.03] cursor-pointer group transition-colors last:border-0"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={project.client.avatar} className="w-8 h-8 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all shrink-0" />
                                                <div>
                                                    <div className="font-bold text-zinc-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{project.name}</div>
                                                    <div className="text-[10px] font-mono text-zinc-400">#{project.id.toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300 hidden md:table-cell">{project.client.company || project.client.name}</td>
                                        <td className="px-5 py-4 hidden sm:table-cell">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusColors[project.status] || statusColors.draft}`}>
                                                {project.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-sans tracking-tight text-zinc-900 dark:text-white">${project.amount.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right font-mono text-zinc-500 hidden lg:table-cell">{project.files.length}</td>
                                        <td className="px-3 py-4">
                                            <ArrowUpRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* â”€â”€ Grid / card view â”€â”€ */}
            <div className={`grid grid-cols-1 gap-6 lg:gap-12 ${vaultLayout === 'list' ? 'hidden' : ''}`}>
                {visibleProjects.map(project => (
                    <div key={project.id} className="group relative w-full bg-white dark:bg-[#23232e] rounded-2xl lg:rounded-[2.5rem] overflow-hidden border border-zinc-200/50 dark:border-white/5 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-col lg:flex-row h-full min-h-[280px] lg:min-h-[340px]">
                            <div className="lg:w-[35%] bg-zinc-50 dark:bg-[#18181b] flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-zinc-200/50 dark:border-white/10 transition-colors overflow-hidden">
                                {/* CRANKED GRAIN: Adjusted for better visibility in light mode and subtlety in dark mode */}
                                <div className="absolute inset-0 opacity-[0.25] dark:opacity-[0.55] pointer-events-none mix-blend-multiply dark:mix-blend-overlay" style={{ backgroundImage: NOISE_SVG, filter: 'contrast(150%)' }} />
                                <div className="relative z-10 p-5 sm:p-6 lg:p-8 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${project.status === 'paid' ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-white/10 dark:border-white/20 dark:text-blue-400' : 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-white/10 dark:border-white/20 dark:text-amber-400'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'paid' ? 'bg-blue-500 text-zinc-900 shadow-sm dark:bg-blue-400' : 'bg-amber-600 dark:bg-amber-400'} animate-pulse`} />
                                                {project.status === 'paid' ? 'Secured' : 'Locked'}
                                            </div>
                                            <span className="font-mono text-xs text-zinc-400 dark:text-zinc-400 opacity-70">#{project.id.toUpperCase()}</span>
                                        </div>
                                        <h3 className="text-3xl font-sans tracking-tight font-medium text-zinc-900 dark:text-white leading-tight mb-2 group-hover:font-bold transition-all cursor-pointer" onClick={() => navigate(`/preview/${project.id}`, { state: { from: location.pathname } })}>{project.name}</h3>
                                        <div className="flex items-center gap-3 mt-4">
                                            <img src={project.client.avatar} className="w-8 h-8 rounded-full grayscale opacity-80 border border-zinc-200/50 dark:border-white/10" />
                                            <div>
                                                <div className="text-[9px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Client</div>
                                                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-300">{project.client.name}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="py-5 lg:py-8">
                                        <div className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-widest mb-1">Contract Value</div>
                                        <PrivacyBlur className="text-3xl sm:text-4xl lg:text-5xl font-sans tracking-tight font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">${project.amount.toLocaleString()}</PrivacyBlur>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-t border-zinc-200/50 dark:border-white/10 pt-6">
                                        <div>
                                            <div className="text-[9px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Files</div>
                                            <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">{project.files.length}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Size</div>
                                            <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">2.4<span className="text-xs opacity-50">GB</span></div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">Views</div>
                                            <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">24</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-[65%] bg-white dark:bg-[#23232e] flex flex-col relative">
                                <div className="flex-1 p-8 overflow-x-auto no-scrollbar flex items-center">
                                    <div className="flex gap-5">
                                        <button onClick={() => { playClick(); navigate(`/editor/${project.id}`); }} className="shrink-0 w-40 h-48 rounded-2xl border-2 border-dashed border-zinc-200/50 dark:border-white/10 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group/add">
                                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover/add:bg-blue-500 text-zinc-900 shadow-sm dark:group-hover/add:bg-blue-500 transition-colors">
                                                <Plus className="w-5 h-5 text-zinc-400 group-hover/add:text-white dark:group-hover/add:text-black" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover/add:text-blue-700 dark:group-hover/add:text-blue-400">Add Asset</span>
                                        </button>
                                        {project.files.map(f => (
                                            <div key={f.id} className="shrink-0 w-28 h-36 sm:w-32 sm:h-40 lg:w-40 lg:h-48 bg-zinc-50 dark:bg-[#1c1c21] rounded-xl lg:rounded-2xl border border-zinc-100 dark:border-white/5 overflow-hidden group/file relative hover:scale-110 hover:z-50 hover:shadow-2xl transition-all duration-300 ease-out origin-center">
                                                <div className="h-20 sm:h-24 lg:h-32 w-full bg-zinc-200 dark:bg-white/5 relative overflow-hidden">
                                                    {f.previewUrl ? <img src={f.previewUrl} loading="lazy" className="w-full h-full object-cover transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400">{getFileIcon(f.type)}</div>}
                                                </div>
                                                <div className="p-2 lg:p-3">
                                                    <div className="text-[10px] lg:text-xs font-bold text-zinc-900 dark:text-white truncate mb-0.5 lg:mb-1">{f.name}</div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[8px] lg:text-[9px] font-mono text-zinc-400">{f.size}</span>
                                                        <div className={`flex items-center gap-1 text-[7px] lg:text-[8px] font-bold uppercase ${f.locked ? 'text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>{f.locked ? 'Locked' : 'Open'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-16 lg:h-20 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-[#18181b]/50 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 md:px-8 overflow-x-auto no-scrollbar gap-3">
                                    <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                                        {/* Launch Preview — stable style across themes */}
                                        <button
                                            onClick={() => { playClick(); navigate(`/preview/${project.id}`, { state: { from: location.pathname } }); }}
                                            className="h-10 lg:h-12 px-4 lg:px-6 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest flex items-center gap-2 lg:gap-3 transition-all hover:scale-105 shadow-xl group/preview shrink-0
                                                bg-zinc-900 text-white shadow-black/20
                                                dark:bg-[#a3e635] dark:text-zinc-900 dark:shadow-[0_0_20px_rgba(163,230,53,0.35)]"
                                        >
                                            <span className="flex items-center gap-2 lg:gap-3">
                                                <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center shrink-0">
                                                    <Eye className="w-3 h-3 group-hover/preview:scale-110 transition-transform" />
                                                </span>
                                            <span className="shrink-0 hidden sm:inline">Launch Preview</span>
                                            <span className="shrink-0 sm:hidden">Preview</span>
                                            </span>
                                        </button>

                                        {/* Copy Client Link — gradient text, frosted border */}
                                        <button className="h-10 lg:h-12 px-3 lg:px-6 rounded-xl border font-bold text-[10px] lg:text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm shrink-0 group/copy
                                            bg-white/60 border-zinc-200/50 hover:bg-white hover:border-zinc-200/50 hover:shadow-md
                                            dark:bg-white/[0.04] dark:border-blue-500/20 dark:hover:bg-blue-500/10 dark:hover:border-blue-500/40">
                                            <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-blue-400 group-hover/copy:scale-110 transition-transform" />
                                            <span className="shrink-0 hidden md:inline bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-blue-500 dark:to-white">Copy Client Link</span>
                                            <span className="shrink-0 md:hidden hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-blue-500 dark:to-white">Copy</span>
                                        </button>

                                        {/* Send to Client — gradient text, frosted border */}
                                        <button
                                            onClick={() => {
                                                playClick();
                                                const email = project.client?.email;
                                                if (!email) return;
                                                const name = project.client?.name || 'there';
                                                const link = project.clientLink && project.clientLink !== '#'
                                                    ? `${window.location.origin}/c/${project.clientLink}`
                                                    : window.location.href;
                                                const subject = encodeURIComponent(`Your files are ready — ${project.name}`);
                                                const body = encodeURIComponent(`Hi ${name},\n\nYour project files are ready for review.\n\nAccess your secure vault here:\n${link}\n\nLet me know if you have any questions.`);
                                                window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
                                            }}
                                            className="hidden md:flex h-10 lg:h-12 px-6 rounded-xl border font-bold text-xs uppercase tracking-wider items-center gap-2 transition-all shadow-sm shrink-0 group/send
                                            bg-white/60 border-zinc-200/50 hover:bg-white hover:border-zinc-200/50 hover:shadow-md
                                            dark:bg-white/[0.04] dark:border-[#c4b5fd]/20 dark:hover:bg-[#c4b5fd]/10 dark:hover:border-[#c4b5fd]/40">
                                            <Send className="w-3.5 h-3.5 text-zinc-500 dark:text-[#c4b5fd] group-hover/send:scale-110 transition-transform" />
                                            <span className="shrink-0 bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-[#c4b5fd] dark:to-white">Send to Client</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                                        <button onClick={() => handleVaultInvoicePdf(project)} disabled={downloadingPdf === project.id + '_inv'} className="hidden lg:flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-40" title="Download Invoice PDF">{downloadingPdf === project.id + '_inv' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}</button>
                                        <button onClick={() => handleVaultReceiptPdf(project)} disabled={downloadingPdf === project.id + '_rec'} className="hidden lg:flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-40" title="Download Rights Receipt">{downloadingPdf === project.id + '_rec' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}</button>
                                        <button onClick={() => { playClick(); setQrProjectId(project.id); }} className="hidden lg:flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-all" title="Generate QR Code"><QrCode className="w-4 h-4" /></button>
                                        <div className="hidden lg:block h-6 w-px bg-zinc-300 dark:bg-white/10 mx-1" />
                                        <button onClick={() => navigate(`/editor/${project.id}`)} className="h-9 lg:h-10 w-9 lg:w-auto lg:px-4 rounded-lg bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all flex items-center justify-center gap-2"><Pencil className="w-3.5 h-3.5" /><span className="hidden lg:inline"> Edit</span></button>
                                        <button className="h-9 lg:h-10 w-9 lg:w-10 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>{/* end grid/card view */}

            {/* QR Code Modal / Bottom Sheet */}
            {qrProjectId && qrProject && (
                <div
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 dark:bg-[#323242]/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-300"
                    onClick={() => setQrProjectId(null)}
                >
                    <div
                        className="bg-white dark:bg-charcoal rounded-t-3xl sm:rounded-[2rem] p-8 max-w-sm w-full mx-auto shadow-2xl border border-zinc-200/50 dark:border-white/10 mt-auto sm:mt-0 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Mobile handle */}
                        <div className="w-12 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="font-sans tracking-tight text-xl font-bold text-zinc-900 dark:text-white">Vault QR Code</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Scan to open the client vault</p>
            </div>
                            <button onClick={() => setQrProjectId(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                        <div className="flex flex-col items-center gap-5">
                            <div className="p-4 bg-white rounded-2xl border border-zinc-200/50 shadow-sm">
                                <QRCodeSVG
                                    id="vault-qr-svg"
                                    value={qrUrl}
                                    size={200}
                                    bgColor="#ffffff"
                                    fgColor="#0e0e12"
                                    level="M"
                                    includeMargin={false}
                                />
                            </div>
                            <div className="w-full text-center">
                                <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{qrProject.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{qrProject.client.name}</p>
                                <p className="text-[10px] font-mono text-zinc-400 mt-1 break-all">{qrUrl}</p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => { navigator.clipboard.writeText(qrUrl); }}
                                    className="flex-1 py-3 rounded-xl border border-zinc-200/50 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy URL
                                </button>
                                <button
                                    onClick={() => navigate(`/preview/${qrProject.id}`)}
                                    className="flex-1 py-3 rounded-xl bg-zinc-900 dark:bg-blue-500 text-white dark:text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-3.5 h-3.5" /> Open Vault
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MobileNavBar = ({ navItems, currentPath, onNavigate }: { navItems: any[], currentPath: string, onNavigate: (id: string) => void }) => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[49] bg-white/90 dark:bg-[#1a1a23]/90 backdrop-blur-xl border-t border-zinc-200/50 dark:border-white/10">
        <div className="flex justify-around items-center h-16 sm:h-20 max-w-lg mx-auto">
            {navItems.map((item) => {
                const isActive = currentPath === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        onMouseEnter={() => routePreloadMap[item.id]?.()}
                        onTouchStart={() => routePreloadMap[item.id]?.()}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
                    >
                        <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-100/50 dark:bg-blue-500/10 -translate-y-1' : ''}`}>
                            <item.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-all ${isActive ? 'opacity-100' : 'opacity-0 scale-0 hidden sm:block'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

/** Full-bleed stage background */
const StageBackground = ({ isDarkMode }: { isDarkMode: boolean }) => (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
        {isDarkMode ? (
            <>
                <div className="absolute inset-0 bg-cosmic" />
                <div className="absolute bottom-[10%] right-[2%] w-[44vw] h-[46vh] rounded-full bg-indigo-400/5 blur-[190px]" />
                <div className="absolute bottom-[2%] right-[12%] w-[32vw] h-[34vh] rounded-full bg-teal-300/4 blur-[180px]" />
                <div className="absolute bottom-[18%] right-[22%] w-[20vw] h-[22vh] rounded-full bg-sky-300/3 blur-[170px]" />
                <div
                    className="absolute inset-0 opacity-[0.06] mix-blend-multiply"
                    style={{
                        backgroundImage: HERO_NOISE_SVG,
                        backgroundSize: '250px 250px',
                        filter: 'contrast(2200%) brightness(102%)'
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.82] mix-blend-overlay"
                    style={{
                        backgroundImage: HERO_NOISE_SVG,
                        backgroundSize: '250px 250px',
                        filter: 'contrast(2700%) brightness(102%)'
                    }}
                />
            </>
        ) : (
            <>
                <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-zinc-100 to-slate-100" />
                <div className="absolute top-[8%] right-[4%] w-[52vw] h-[58vh] rounded-full bg-sky-200/55 blur-[110px]" />
                <div className="absolute bottom-[4%] right-[14%] w-[42vw] h-[44vh] rounded-full bg-amber-100/75 blur-[100px]" />
                <div className="absolute top-[38%] right-[28%] w-[32vw] h-[32vh] rounded-full bg-rose-100/40 blur-[80px]" />
            </>
        )}
    </div>
);

/** Self-contained delivery widget — the "star" of the main surface */
const DeliveryWidget = ({ isDarkMode, onPublish }: { isDarkMode: boolean; onPublish: (project: Project) => Promise<void> | void }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const { projects } = useStore();
    const initialDraft = useMemo(() => readQuickDeliveryDraft(), []);
    const widgetShellRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [sendMode, setSendMode] = useState<'email' | 'link'>((initialDraft?.formData?.client?.email || '').trim() ? 'email' : 'link');
    const [files, setFiles] = useState<FileAsset[]>(initialDraft?.files || []);
    const [projectName, setProjectName] = useState(initialDraft?.formData?.name || '');
    const [linkLabel, setLinkLabel] = useState(initialDraft?.formData?.description || '');
    const [clientName, setClientName] = useState(initialDraft?.formData?.client?.name || '');
    const [clientEmail, setClientEmail] = useState(initialDraft?.formData?.client?.email || '');
    const [enablePayment, setEnablePayment] = useState((initialDraft?.formData?.amount || 0) > 0);
    const [amount, setAmount] = useState(initialDraft?.formData?.amount ? String(initialDraft.formData.amount) : '');
    const [retention, setRetention] = useState<'forever' | '30_days' | '7_days' | '3_days' | '1_day'>('3_days');
    const [showRetentionMenu, setShowRetentionMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(true);
    const [showMessageEditor, setShowMessageEditor] = useState(false);
    const [showWatermark, setShowWatermark] = useState(initialDraft?.formData?.showWatermark !== false);
    const [requiresSignature, setRequiresSignature] = useState(Boolean(initialDraft?.formData?.requiresSignature));
    const [enableClientLibrary, setEnableClientLibrary] = useState(initialDraft?.formData?.enableClientLibrary !== false);
    const [enableTips, setEnableTips] = useState(Boolean(initialDraft?.formData?.enableTips));
    const [message, setMessage] = useState(initialDraft?.formData?.message || '');
    const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
    const [publishMessage, setPublishMessage] = useState('');
    const [widgetView, setWidgetView] = useState<'create' | 'projects' | 'briefing'>('create');
    const [linkReady, setLinkReady] = useState<null | {
        projectId: string;
        projectName: string;
        clientUrl: string;
        clientName: string;
        clientEmail: string;
        message: string;
    }>(null);

    const formatWidgetTime = (iso: string) => {
        const ms = Date.now() - new Date(iso).getTime();
        if (Number.isNaN(ms) || ms < 0) return '';
        const minutes = Math.floor(ms / 60000);
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const briefingItems = useMemo(() => {
        const events: Array<{
            id: string;
            ts: string;
            title: string;
            subtitle: string;
            icon: React.ElementType;
            tone: 'neutral' | 'warning' | 'success';
        }> = [];

        projects.forEach((project) => {
            const createdTs = project.createdAt || new Date().toISOString();
            events.push({
                id: `created-${project.id}`,
                ts: createdTs,
                title: 'Project Created',
                subtitle: project.name,
                icon: Plus,
                tone: 'neutral',
            });

            if (project.clientViewedAt) {
                events.push({
                    id: `viewed-${project.id}`,
                    ts: project.clientViewedAt,
                    title: 'Client Viewed',
                    subtitle: project.name,
                    icon: Eye,
                    tone: 'neutral',
                });
            }

            if (project.status === 'paid' || project.status === 'completed') {
                events.push({
                    id: `paid-${project.id}`,
                    ts: project.clientViewedAt || project.dueDate || createdTs,
                    title: 'Payment Received',
                    subtitle: project.name,
                    icon: CreditCardIcon,
                    tone: 'success',
                });
            } else if (project.status === 'awaiting_signature') {
                events.push({
                    id: `signature-${project.id}`,
                    ts: project.dueDate || createdTs,
                    title: 'Awaiting Signature',
                    subtitle: project.client?.name || 'Client',
                    icon: FileText,
                    tone: 'warning',
                });
            }
        });

        return events
            .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
            .slice(0, 12);
    }, [projects]);

    const handleWidgetNavigate = (path: string, highlight: 'create' | 'projects' | 'briefing' = 'create') => {
        playClick();
        navigate(path, { state: { widgetPanelHighlight: highlight } });
    };

    const currentProjects = useMemo(
        () => projects.slice(0, 8),
        [projects]
    );

    const handleContinue = () => {
        handleWidgetNavigate('/create', 'create');
    };

    const canPublish = files.length > 0 && projectName.trim().length > 0 && (sendMode === 'link' || clientEmail.trim().length > 0);

    const handlePublish = async () => {
        if (!canPublish || publishState === 'publishing') {
            playClick();
            return;
        }

        setPublishState('publishing');
        setPublishMessage('');

        const projectId = crypto.randomUUID();
        const resolvedAmount = enablePayment ? Number(amount || 0) : 0;
        const status: Project['status'] =
            resolvedAmount > 0
                ? 'awaiting_payment'
                : requiresSignature
                    ? 'awaiting_signature'
                    : 'draft';

        const project: Project = {
            id: projectId,
            name: projectName.trim(),
            description: linkLabel.trim(),
            client: {
                name: clientName.trim() || 'Client',
                email: sendMode === 'email' ? clientEmail.trim() : '',
                phone: '',
                company: '',
                avatar: ''
            },
            amount: resolvedAmount,
            status,
            createdAt: new Date().toISOString().split('T')[0],
            dueDate: computeQuickDueDate(retention) || new Date().toISOString().split('T')[0],
            files,
            milestones: [],
            credentials: [],
            requiresSignature,
            enableTips,
            paymentMethods: {
                stripeEnabled: resolvedAmount > 0,
                venmo: '',
                cashapp: '',
                paypal: '',
                zelle: '',
                bankInfo: ''
            },
            useMilestones: false,
            clientLink: createQuickClientLink(),
            type: 'web',
            message,
            enableClientLibrary,
            accessConfig: mapQuickRetentionToAccessMode(retention),
            showWatermark,
            showProtectedLabel: true,
            theme: {
                name: 'Dashboard Quick Create',
                wallpaper: '',
                brightness: isDarkMode ? 'dark' : 'light',
                showGrain: false
            }
        };

        const clientUrl = (() => {
            try {
                return new URL(`/c/${project.clientLink}`, window.location.origin).toString();
            } catch {
                return `/c/${project.clientLink}`;
            }
        })();

        try {
            await onPublish(project);
            setLinkReady({
                projectId: project.id,
                projectName: project.name,
                clientUrl,
                clientName: project.client.name,
                clientEmail: project.client.email,
                message: project.message || ''
            });
            clearDraft({ keepLinkReady: true });
            setPublishState('success');
            setPublishMessage(`Published "${project.name}"`);
            playSuccess();
        } catch (error) {
            setPublishState('error');
            setPublishMessage(error instanceof Error ? error.message : 'Failed to publish project.');
            playClick();
        }
    };

    const handleCopyClientUrl = async () => {
        if (!linkReady?.clientUrl) return;
        try {
            await navigator.clipboard.writeText(linkReady.clientUrl);
            toast('Client link copied.');
            playSuccess();
        } catch {
            toast('Could not copy link.', 'error');
            playClick();
        }
    };

    const handleOpenClientVault = () => {
        if (!linkReady?.clientUrl) return;
        playClick();
        window.open(linkReady.clientUrl, '_blank', 'noopener,noreferrer');
    };

    const handleEmailClient = () => {
        if (!linkReady?.clientUrl) return;
        const email = (linkReady.clientEmail || '').trim();
        if (!email) {
            toast('Add a client email to send from the widget.', 'info');
            playClick();
            return;
        }
        const subject = `Your "${linkReady.projectName}" delivery is ready`;
        const intro = linkReady.message?.trim()
            ? linkReady.message.trim()
            : `Hi ${linkReady.clientName || 'there'}, your files are ready for review.`;
        const body = `${intro}\n\nOpen your vault:\n${linkReady.clientUrl}\n`;
        window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleCreateAnother = () => {
        playClick();
        setLinkReady(null);
        setPublishState('idle');
        setPublishMessage('');
    };

    const ingestFiles = (incoming: FileList | File[] | null) => {
        if (!incoming || incoming.length === 0) return;
        setFiles((prev) => [...prev, ...Array.from(incoming).map(buildQuickDraftAsset)]);
    };

    const clearDraft = (opts?: { keepLinkReady?: boolean }) => {
        playClick();
        if (!opts?.keepLinkReady) setLinkReady(null);
        setPublishState('idle');
        setPublishMessage('');
        setFiles([]);
        setProjectName('');
        setLinkLabel('');
        setClientName('');
        setClientEmail('');
        setEnablePayment(false);
        setAmount('');
        setRetention('3_days');
        setShowWatermark(true);
        setRequiresSignature(false);
        setEnableClientLibrary(true);
        setEnableTips(false);
        setMessage('');
        setSendMode('link');
        try {
            localStorage.removeItem(QUICK_DELIVERY_DRAFT_KEY);
        } catch {
            // Ignore storage failures.
        }
    };

    useEffect(() => {
        const handleQuickFiles = (event: Event) => {
            const customEvent = event as CustomEvent<File[]>;
            if (!customEvent.detail?.length) return;
            setFiles((prev) => [...prev, ...customEvent.detail.map(buildQuickDraftAsset)]);
        };
        window.addEventListener(QUICK_DELIVERY_EVENT, handleQuickFiles as EventListener);
        return () => window.removeEventListener(QUICK_DELIVERY_EVENT, handleQuickFiles as EventListener);
    }, []);

    useEffect(() => {
        if (!showMoreMenu && !showRetentionMenu) return;

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node | null;
            if (!target) return;
            if (widgetShellRef.current && !widgetShellRef.current.contains(target)) {
                setShowMoreMenu(false);
                setShowRetentionMenu(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowMoreMenu(false);
                setShowRetentionMenu(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showMoreMenu, showRetentionMenu]);

    useEffect(() => {
        const draft = {
            formData: {
                name: projectName,
                description: linkLabel,
                client: { name: clientName, email: sendMode === 'email' ? clientEmail : '', phone: '', company: '', avatar: '' },
                amount: enablePayment ? Number(amount || 0) : 0,
                status: 'draft' as const,
                dueDate: computeQuickDueDate(retention),
                files,
                milestones: [],
                credentials: [],
                message,
                enableClientLibrary,
                requiresSignature,
                enableTips,
                useMilestones: false,
                showWatermark,
                showProtectedLabel: true,
                accessConfig: mapQuickRetentionToAccessMode(retention),
                paymentMethods: {
                    stripeEnabled: enablePayment,
                    venmo: '',
                    cashapp: '',
                    paypal: '',
                    zelle: '',
                    bankInfo: ''
                },
                type: 'web' as const
            },
            files
        };
        try {
            localStorage.setItem(QUICK_DELIVERY_DRAFT_KEY, JSON.stringify(draft));
        } catch {
            // Ignore storage failures.
        }
    }, [amount, clientEmail, clientName, enableClientLibrary, enablePayment, enableTips, files, linkLabel, message, projectName, requiresSignature, retention, sendMode, showWatermark]);

    const inputCls = `w-full h-10 px-3.5 rounded-xl text-sm border outline-none transition-colors ${
        isDarkMode
            ? 'bg-white/8 border-white/10 text-white placeholder:text-zinc-400 focus:border-white/25'
            : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'
    }`;
    const sectionLineCls = isDarkMode ? 'border-white/10' : 'border-zinc-200';
    const panelSurfaceCls = isDarkMode ? 'bg-cosmic' : 'bg-[#f0f2f5]';
    const retentionLabel = QUICK_RETENTION_OPTIONS.find((option) => option.id === retention)?.label || '3 days';

    return (
        <div ref={widgetShellRef} className={`w-full sm:w-[372px] h-full rounded-[1.75rem] shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col ${
            isDarkMode
                ? 'bg-cosmic border border-white/[0.09]'
                : 'bg-[#f0f2f5] border border-zinc-200/80'
        }`}
        style={{
            '--color-brand': '#84cc16',
            '--color-brand-hover': '#65a30d',
            '--color-brand-glow': 'rgba(132, 204, 22, 0.5)',
            '--color-blue-400': '#a3e635',
            '--color-blue-500': '#84cc16',
            '--color-blue-600': '#65a30d',
            '--color-green-400': '#a3e635',
            '--color-green-500': '#84cc16',
            '--color-green-600': '#65a30d',
        } as React.CSSProperties}>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    ingestFiles(e.target.files);
                    e.currentTarget.value = '';
                }}
            />
            <input
                ref={folderInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    ingestFiles(e.target.files);
                    e.currentTarget.value = '';
                }}
                {...({ webkitdirectory: '', directory: '' } as any)}
            />

            <div className="px-6 pt-4 pb-3 border-b border-zinc-200/70 dark:border-white/10">
                <div className="flex items-center justify-center relative">
                    <div className="absolute left-0 flex items-center gap-2">
                        <EditorialIcon className="w-4 h-4 text-black dark:text-white shrink-0" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {widgetView === 'create' ? 'Create project' : widgetView === 'projects' ? 'Current projects' : 'The Briefing'}
                    </span>
                    {widgetView === 'create' ? (
                        <>
                            <button
                                onClick={() => {
                                    playClick();
                                    setShowMoreMenu((open) => !open);
                                    setShowRetentionMenu(false);
                                }}
                                className="absolute right-0 w-9 h-9 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                title="Widget options"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {showMoreMenu && (
                        <div className={`absolute right-0 top-11 w-48 rounded-2xl border shadow-xl z-20 p-2 ${isDarkMode ? 'bg-[#151521] border-white/10' : 'bg-white border-zinc-200'}`}>
                            <button
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    setShowAdvancedOptions((open) => !open);
                                    playClick();
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                {showAdvancedOptions ? 'Hide advanced options' : 'Show advanced options'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    setShowMessageEditor((open) => !open);
                                    playClick();
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                {showMessageEditor ? 'Hide client message' : 'Edit client message'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    handleContinue();
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                Open full studio
                            </button>
                            <button
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    clearDraft();
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                                Clear draft
                            </button>
                        </div>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => { playClick(); setWidgetView('create'); }}
                            className="absolute right-0 w-9 h-9 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Back to create"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 px-4 pb-4 pt-3 flex flex-col">
                <div className={`grid grid-cols-3 gap-1 p-1 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-white/70'}`}>
                    <button
                        onClick={() => { playClick(); setWidgetView('create'); }}
                        className={`h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${widgetView === 'create' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/5'}`}
                    >
                        Create
                    </button>
                    <button
                        onClick={() => {
                            playClick();
                            setWidgetView('projects');
                        }}
                        className={`h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${widgetView === 'projects' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/5'}`}
                    >
                        Current
                    </button>
                    <button
                        onClick={() => { playClick(); setWidgetView('briefing'); }}
                        className={`h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${widgetView === 'briefing' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/5'}`}
                    >
                        Briefing
                    </button>
                </div>

                <div className="mt-4 flex-1 min-h-0">
                {widgetView === 'create' && (
                <div className="h-full overflow-y-auto pr-1 briefing-scroll">
                {linkReady ? (
                    <div className={`rounded-2xl border p-4 ${panelSurfaceCls} ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}>
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">Link ready</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-300 truncate">{linkReady.projectName}</p>
                            </div>
                        </div>

                        <div className="mt-3 space-y-2">
                            <input
                                value={linkReady.clientUrl}
                                readOnly
                                className={inputCls}
                                onFocus={(e) => e.currentTarget.select()}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleCopyClientUrl}
                                    className={`h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${isDarkMode ? 'bg-white/8 text-white hover:bg-white/12 border border-white/10' : 'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200'}`}
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy link
                                </button>
                                <button
                                    onClick={handleOpenClientVault}
                                    className={`h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${isDarkMode ? 'bg-white/8 text-white hover:bg-white/12 border border-white/10' : 'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200'}`}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open vault
                                </button>
                                <button
                                    onClick={handleEmailClient}
                                    disabled={!linkReady.clientEmail?.trim()}
                                    className={`h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm ${!linkReady.clientEmail?.trim() ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${isDarkMode ? 'bg-white/8 text-white hover:bg-white/12 border border-white/10' : 'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200'}`}
                                >
                                    <Mail className="w-4 h-4" />
                                    Email
                                </button>
                                <button
                                    onClick={handleCreateAnother}
                                    className="h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Plus className="w-4 h-4" />
                                    New
                                </button>
                            </div>
                        </div>

                        <p className="mt-3 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
                            {publishMessage || 'Share the link above with your client.'}
                        </p>
                    </div>
                ) : (
                <>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => { playClick(); fileInputRef.current?.click(); }}
                        className={`rounded-2xl py-4 px-3 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${panelSurfaceCls}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-zinc-800 dark:text-zinc-100">Add files</span>
                    </button>
                    <button
                        onClick={() => { playClick(); folderInputRef.current?.click(); }}
                        className={`rounded-2xl py-4 px-3 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${panelSurfaceCls}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Box className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-zinc-800 dark:text-zinc-100">Add folders</span>
                    </button>
                </div>

                <div className="mt-4 space-y-1.5">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <button
                            onClick={() => { playClick(); setSendMode('link'); }}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${sendMode === 'link' ? 'border-blue-500' : 'border-zinc-300 dark:border-white/15'}`}
                            type="button"
                        >
                            <span className={`w-3.5 h-3.5 rounded-full ${sendMode === 'link' ? 'bg-blue-500' : 'bg-transparent'}`} />
                        </button>
                        <span className="text-sm text-zinc-900 dark:text-white">Create link</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <button
                            onClick={() => { playClick(); setSendMode('email'); }}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${sendMode === 'email' ? 'border-blue-500' : 'border-zinc-300 dark:border-white/15'}`}
                            type="button"
                        >
                            <span className={`w-3.5 h-3.5 rounded-full ${sendMode === 'email' ? 'bg-blue-500' : 'bg-transparent'}`} />
                        </button>
                        <span className="text-sm text-zinc-900 dark:text-white">Send email</span>
                    </label>
                </div>

                <div className={`mt-4 pt-3 border-t ${sectionLineCls}`}>
                    <div className="space-y-2.5">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm text-zinc-500 dark:text-zinc-400">{sendMode === 'email' ? 'Email to' : 'Link label'}</label>
                                {sendMode === 'email' && <span className="text-xs text-zinc-400">0 of 10</span>}
                            </div>
                            {sendMode === 'email' ? (
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    placeholder="client@company.com"
                                    className={inputCls}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={linkLabel}
                                    onChange={(e) => setLinkLabel(e.target.value)}
                                    placeholder="Campaign review link"
                                    className={inputCls}
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1.5">Client name</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Client or team"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1.5">Title</label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Q1 delivery package"
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className={`mt-4 pt-3 border-t ${sectionLineCls}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Files</span>
                            <span className="text-xs text-zinc-400">{files.length} added</span>
                        </div>
                        <div className="space-y-1.5 max-h-28 overflow-y-auto">
                            {files.slice(0, 6).map((file) => (
                                <div key={file.id} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs ${panelSurfaceCls}`}>
                                    <div className="min-w-0">
                                        <p className="truncate text-zinc-800 dark:text-zinc-100">{file.name}</p>
                                        <p className="text-zinc-400">{file.type.toUpperCase()}</p>
                                    </div>
                                    <span className="text-zinc-400 shrink-0">{file.size}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`mt-4 pt-3 border-t ${sectionLineCls} space-y-3`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Access control</span>
                        <span className="text-sm text-zinc-900 dark:text-white">{retention === 'forever' ? 'Public' : 'Timed'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'forever', label: 'Public' },
                            { id: '7_days', label: '7 days' },
                            { id: '1_day', label: 'Open once' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => { playClick(); setRetention(option.id as typeof retention); }}
                                className={`rounded-xl px-2 py-2 text-[11px] font-semibold border transition-colors cursor-pointer ${retention === option.id
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300'
                                    : `${panelSurfaceCls} ${isDarkMode ? 'border-white/10 text-zinc-300' : 'border-zinc-200 text-zinc-600'}`
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`mt-4 pt-3 border-t ${sectionLineCls}`}>
                    <button
                        onClick={() => { playClick(); setShowAdvancedOptions((open) => !open); }}
                        className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">View options</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
                    </button>
                    {showAdvancedOptions && (
                        <div className="mt-3 space-y-2.5">
                            {[
                                { key: 'watermark', label: 'Preview with watermark', checked: showWatermark, onToggle: () => setShowWatermark((v) => !v) },
                                { key: 'signature', label: 'Require signature', checked: requiresSignature, onToggle: () => setRequiresSignature((v) => !v) },
                                { key: 'library', label: 'Client library enabled', checked: enableClientLibrary, onToggle: () => setEnableClientLibrary((v) => !v) },
                                { key: 'tips', label: 'Allow tips', checked: enableTips, onToggle: () => setEnableTips((v) => !v) },
                            ].map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() => { playClick(); option.onToggle(); }}
                                    className={`w-full rounded-xl px-3.5 py-2.5 border flex items-center justify-between text-left cursor-pointer ${panelSurfaceCls} ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}
                                >
                                    <span className="text-sm text-zinc-800 dark:text-zinc-100">{option.label}</span>
                                    <div className={`w-9 h-5 rounded-full flex items-center transition-colors ${option.checked ? 'bg-blue-500' : isDarkMode ? 'bg-white/10' : 'bg-zinc-200'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${option.checked ? 'translate-x-4' : ''}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`mt-4 pt-3 border-t ${sectionLineCls}`}>
                    <button
                        onClick={() => {
                            playClick();
                            setEnablePayment((value) => !value);
                            if (!amount) setAmount('250');
                        }}
                        className={`w-full h-11 rounded-xl flex items-center gap-3 px-3.5 border transition-all cursor-pointer ${enablePayment
                            ? (isDarkMode ? 'bg-blue-900/20 border-blue-700/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700')
                            : `${panelSurfaceCls} ${isDarkMode ? 'border-white/10 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`
                        }`}
                    >
                        <DollarSign className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium flex-1 text-left">
                            {enablePayment ? 'Request payment' : 'No payment gate'}
                        </span>
                        <div className={`w-8 h-4 rounded-full flex items-center transition-all ${enablePayment ? 'bg-blue-500' : (isDarkMode ? 'bg-white/10' : 'bg-zinc-200')}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-all mx-0.5 ${enablePayment ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                    {enablePayment && (
                        <div className="mt-2">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="250.00"
                                className={inputCls}
                            />
                        </div>
                    )}
                </div>

                <div className={`mt-4 pt-3 border-t ${sectionLineCls}`}>
                    <button
                        onClick={() => { playClick(); setShowMessageEditor((open) => !open); }}
                        className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Client message</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showMessageEditor ? 'rotate-180' : ''}`} />
                    </button>
                    {showMessageEditor && (
                        <div className="mt-3 space-y-2">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Leave a message for your client..."
                                className={`w-full min-h-[96px] p-3 rounded-xl text-sm border outline-none transition-colors resize-y ${isDarkMode ? 'bg-white/8 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/25' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'}`}
                            />
                            <div className="flex flex-wrap gap-2">
                                {QUICK_MESSAGE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => {
                                            playClick();
                                            const name = clientName.trim().split(' ')[0] || 'Client';
                                            setMessage(preset.text.replace('{{name}}', name));
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${panelSurfaceCls} ${isDarkMode ? 'border-white/10 text-zinc-300' : 'border-zinc-200 text-zinc-600'}`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`mt-4 pt-3 border-t ${sectionLineCls}`}>
                    <div className="flex gap-2 relative">
                        <button
                            onClick={() => {
                                playClick();
                                setShowRetentionMenu((open) => !open);
                                setShowMoreMenu(false);
                            }}
                            className={`flex-1 h-12 rounded-2xl px-4 border flex items-center justify-between cursor-pointer ${panelSurfaceCls} ${isDarkMode ? 'border-white/10 text-zinc-200' : 'border-zinc-200 text-zinc-700'}`}
                        >
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">{retentionLabel}</span>
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showRetentionMenu ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            onClick={() => {
                                playClick();
                                setShowMoreMenu((open) => !open);
                                setShowRetentionMenu(false);
                            }}
                            className="w-12 h-12 rounded-2xl border border-blue-500 text-blue-500 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {showRetentionMenu && (
                            <div className={`absolute left-0 right-14 bottom-16 rounded-[1.5rem] border shadow-xl z-20 p-2 ${isDarkMode ? 'bg-[#151521] border-white/10' : 'bg-white border-zinc-200'}`}>
                                {QUICK_RETENTION_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            playClick();
                                            setRetention(option.id as typeof retention);
                                            setShowRetentionMenu(false);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <span>{option.label}</span>
                                        {retention === option.id && <Check className="w-4 h-4 text-blue-500" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        onClick={handleContinue}
                        className={`h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm ${isDarkMode ? 'bg-white/8 text-white hover:bg-white/12 border border-white/10' : 'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200'}`}
                    >
                        Studio
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={!canPublish || publishState === 'publishing'}
                        className={`h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${!canPublish || publishState === 'publishing' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} bg-blue-600 hover:bg-blue-700 text-white`}
                    >
                        {publishState === 'publishing' ? 'Publishing...' : 'Publish'}
                    </button>
                </div>

                <p className={`mt-3 text-center text-[10px] ${publishState === 'error' ? 'text-red-500' : publishState === 'success' ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {publishMessage || 'Draft auto-saves while you work in the widget.'}
                </p>
                </>
                )}
                </div>
                )}

                {widgetView === 'briefing' && (
                    <div className={`pt-3 border-t ${sectionLineCls} h-full flex flex-col`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent Briefing</span>
                            <button
                                onClick={() => { handleWidgetNavigate('/dashboard', 'briefing'); }}
                                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                                Open full
                            </button>
                        </div>
                        {briefingItems.length === 0 ? (
                            <div className={`rounded-2xl border border-dashed px-4 py-6 text-center ${isDarkMode ? 'border-white/10 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>
                                <Clock className="w-5 h-5 mx-auto mb-2 opacity-70" />
                                <p className="text-sm font-medium">No briefing activity yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 briefing-scroll">
                                {briefingItems.map((item) => {
                                    const toneClass = item.tone === 'success'
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : item.tone === 'warning'
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-zinc-500 dark:text-zinc-300';

                                    return (
                                        <div key={item.id} className={`rounded-xl border px-3 py-2.5 flex items-start gap-3 ${panelSurfaceCls} ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}>
                                            <item.icon className={`w-4 h-4 mt-0.5 shrink-0 ${toneClass}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.title}</p>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{item.subtitle}</p>
                                            </div>
                                            <span className="text-[10px] font-mono text-zinc-400 shrink-0">{formatWidgetTime(item.ts)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {widgetView === 'projects' && (
                    <div className={`pt-3 border-t ${sectionLineCls} h-full flex flex-col`}>
                        <div className="flex items-center justify-between mb-3 gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Current Projects</span>
                            <button
                                onClick={() => { handleWidgetNavigate('/dashboard', 'projects'); }}
                                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                                Open full
                            </button>
                        </div>
                        {currentProjects.length === 0 ? (
                            <div className={`rounded-2xl border border-dashed px-4 py-6 text-center ${isDarkMode ? 'border-white/10 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>
                                <Briefcase className="w-5 h-5 mx-auto mb-2 opacity-70" />
                                <p className="text-sm font-medium">No projects yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 briefing-scroll">
                                {currentProjects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => {
                                            playClick();
                                            navigate(`/preview/${project.id}`, { state: { widgetPanelHighlight: 'projects' } });
                                        }}
                                        className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${panelSurfaceCls} ${isDarkMode ? 'border-white/10 hover:bg-white/10' : 'border-zinc-200 hover:bg-white'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{project.name}</p>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{project.client?.name || 'Client'} · {project.status.replace(/_/g, ' ')}</p>
                                            </div>
                                            <span className="text-[10px] font-mono text-zinc-400 shrink-0">{formatWidgetTime(project.createdAt)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        </div>
    );
};

const AppLayout = ({ user, projects, isDarkMode, themeMode, onSetThemeMode, layoutMode, onSetLayoutMode, togglePrivacyMode, privacyMode, onSignOut }: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const stripOffset = useStripOffset();
    const { notifications, markNotificationRead, clearNotifications, saveProject } = useStore();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false); // NEW State
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [demoMode, setDemoMode] = useState(isMockMode());

    const handleDemoModeToggle = (next: boolean) => {
        setDemoMode(next);

        if (!next) {
            const returnTo = `${location.pathname}${location.search}${location.hash}`;
            setMockModeAndNavigate(false, `/signin?from=mode-switch&returnTo=${encodeURIComponent(returnTo)}`);
            return;
        }

        setMockMode(true);
    };

    // Determine current view state based on pathname for active highlighting
    const currentPath = location.pathname.split('/')[1] || 'app';

    const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            // Don't show global dropzone if we are in creator/editor where they have specific dropzones
            if (location.pathname.includes('/create') || location.pathname.includes('/editor')) return;
            if (e.dataTransfer?.types.includes('Files')) {
                setIsDraggingGlobal(true);
            }
        };
        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            if (e.clientX === 0 && e.clientY === 0) {
                setIsDraggingGlobal(false);
            }
        };
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            setIsDraggingGlobal(false);
            if (location.pathname.includes('/create') || location.pathname.includes('/editor')) return;
            
            if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                const droppedFiles = Array.from(e.dataTransfer.files);
                appendFilesToQuickDraft(droppedFiles);
                window.dispatchEvent(new CustomEvent(QUICK_DELIVERY_EVENT, { detail: droppedFiles }));
                if (!location.pathname.includes('/workspace')) navigate('/workspace');
            }
        };

        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, [location.pathname, navigate]);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'vault', label: 'Vault', icon: LockKeyhole },
        { id: 'activity', label: 'Activity', icon: ActivityIcon },
        { id: 'reports', label: 'Reports', icon: PieChartIcon },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    // g-chord state for "g+d / g+v / g+r / g+a / g+s" navigation shortcuts
    const gChordRef = useRef(false);
    const gChordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTypingTarget = !!target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable
            );
            if (isTypingTarget) return;

            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsSearchOpen((open) => !open);
                return;
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
                setIsProfileOpen(false);
                gChordRef.current = false;
                return;
            }

            // "g" chord navigation — press g then a letter within 800 ms
            if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                gChordRef.current = true;
                if (gChordTimer.current) clearTimeout(gChordTimer.current);
                gChordTimer.current = setTimeout(() => { gChordRef.current = false; }, 800);
                return;
            }
            if (gChordRef.current) {
                gChordRef.current = false;
                if (gChordTimer.current) clearTimeout(gChordTimer.current);
                const map: Record<string, string> = { d: '/dashboard', v: '/vault', a: '/activity', r: '/reports', s: '/settings', c: '/create', h: '/workspace' };
                const dest = map[e.key];
                if (dest) { e.preventDefault(); navigate(dest); }
            }
        };
        document.addEventListener('keydown', handleDown);
        return () => {
            document.removeEventListener('keydown', handleDown);
            if (gChordTimer.current) clearTimeout(gChordTimer.current);
        };
    }, [navigate]);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isProfileOpen && !(event.target as Element).closest('.profile-menu-container')) {
                setIsProfileOpen(false);
            }
            if (isNotifOpen && !(event.target as Element).closest('.notif-menu-container')) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen, isNotifOpen]);

    const SearchCommandPalette = ({ onClose }: { onClose: () => void }) => {
        const [query, setQuery] = useState('');
        const [selectedIndex, setSelectedIndex] = useState(0);
        const listRef = useRef<HTMLDivElement>(null);
        const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

        const routeItems = useMemo(() => ([
            { id: 'route-home', title: 'Home', subtitle: 'Return to the create-project surface', icon: EditorialIcon, action: () => navigate('/workspace') },
            { id: 'route-dashboard', title: 'Dashboard', subtitle: 'View your overview', icon: LayoutDashboard, action: () => navigate('/dashboard') },
            { id: 'route-vault', title: 'Vault', subtitle: 'Project and file ledger', icon: LockKeyhole, action: () => navigate('/vault') },
            { id: 'route-activity', title: 'Activity', subtitle: 'Recent actions and logs', icon: ActivityIcon, action: () => navigate('/activity') },
            { id: 'route-reports', title: 'Reports', subtitle: 'Revenue and metrics', icon: PieChartIcon, action: () => navigate('/reports') },
            { id: 'route-clients', title: 'Clients', subtitle: 'Rolodex and lifetime value', icon: Users, action: () => navigate('/dashboard?view=clients') },
            { id: 'route-settings', title: 'Settings', subtitle: 'Profile and integrations', icon: Settings, action: () => navigate('/settings') },
        ]), [navigate]);

        const commandItems = useMemo(() => {
            const items: any[] = [
                { id: 'cmd-create', title: 'Create Project', subtitle: 'Start a new handover', icon: Plus, action: () => navigate('/create'), kind: 'Action' },
                { id: 'cmd-theme', title: 'Toggle Theme', subtitle: 'Switch between light and dark mode', icon: themeMode === 'dark' ? Sun : Moon, action: () => { onSetThemeMode(themeMode === 'dark' ? 'light' : 'dark'); }, kind: 'Action' },
                { id: 'cmd-privacy', title: 'Toggle Privacy', subtitle: 'Hide sensitive financial data', icon: privacyMode ? Eye : EyeOff, action: togglePrivacyMode, kind: 'Action' },
            ];
            if (canToggleMockMode()) {
                items.push({ id: 'cmd-mock', title: 'Toggle Demo Data', subtitle: 'Switch between real and mock data', icon: Database, action: () => handleDemoModeToggle(!demoMode), kind: 'Action' });
            }
            return items;
        }, [navigate, themeMode, privacyMode, demoMode, onSetThemeMode, togglePrivacyMode, handleDemoModeToggle]);

        const normalized = query.trim().toLowerCase();

        const projectResults = (projects || []).flatMap((project: Project) => {
            const projectHaystack = [project.name, project.description, project.client?.name, project.client?.company, project.client?.email, project.id]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const projectMatch = !normalized || projectHaystack.includes(normalized)
                ? [{
                    id: `project-${project.id}`,
                    title: project.name,
                    subtitle: `${project.client?.company || project.client?.name || 'Client'} · ${project.status.replace('_', ' ')}`,
                    icon: Briefcase,
                    kind: 'Project',
                    action: () => navigate(`/preview/${project.id}`),
                }]
                : [];

            const fileMatches = (project.files || [])
                .filter((file) => {
                    if (!normalized) return false;
                    const fileHaystack = [file.name, file.type, file.tag, file.folderName].filter(Boolean).join(' ').toLowerCase();
                    return fileHaystack.includes(normalized);
                })
                .slice(0, 3)
                .map((file) => ({
                    id: `file-${project.id}-${file.id}`,
                    title: file.name,
                    subtitle: `${project.name} · ${file.type.toUpperCase()}`,
                    icon: FileText,
                    kind: 'Asset',
                    action: () => navigate(`/preview/${project.id}`),
                }));

            return [...projectMatch, ...fileMatches];
        });

        const routeResults = routeItems.filter((route) => {
            if (!normalized) return true;
            return `${route.title} ${route.subtitle}`.toLowerCase().includes(normalized);
        }).map((route) => ({ ...route, kind: 'Navigate' }));
        
        const commandResults = commandItems.filter((cmd) => {
            if (!normalized) return true;
            return `${cmd.title} ${cmd.subtitle}`.toLowerCase().includes(normalized);
        });

        const results = [...commandResults, ...routeResults, ...projectResults].slice(0, 12);

        // Reset selection when query or results change
        React.useEffect(() => { setSelectedIndex(0); }, [query]);

        // Scroll selected item into view
        React.useEffect(() => {
            itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
        }, [selectedIndex]);

        const executeResult = (action: () => void) => {
            playClick();
            action();
            onClose();
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const r = results[selectedIndex];
                if (r) executeResult(r.action);
            } else if (e.key === 'Tab') {
                // Focus trap: cycle through results
                e.preventDefault();
                if (e.shiftKey) {
                    setSelectedIndex(i => (i - 1 + results.length) % results.length);
                } else {
                    setSelectedIndex(i => (i + 1) % results.length);
                }
            }
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-start justify-center sm:pt-32 sm:px-4" onKeyDown={handleKeyDown}>
                <div className="absolute inset-0 bg-zinc-900/40 dark:bg-transparent backdrop-blur-[3px] transition-colors duration-300" onClick={onClose} />
                <div className="relative w-full sm:max-w-2xl bg-white dark:bg-[#1a1a23] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-white/10 overflow-hidden animate-slide-up ring-1 ring-black/5 pb-8 sm:pb-0">
                    <div className="w-12 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden" />
                    <div className="flex items-center gap-3 p-4 border-b border-zinc-100 dark:border-white/5">
                        <Search className="w-5 h-5 text-zinc-400" />
                    <input
                        autoFocus
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); }}
                            placeholder="Search projects, files, clients, or routes..."
                            className="flex-1 bg-transparent outline-none text-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 font-medium"
                        />
                        <kbd className="px-2 py-1 rounded bg-zinc-100 dark:bg-white/5 text-[10px] font-bold text-zinc-400 tracking-wider border border-zinc-200/50 dark:border-white/10">ESC</kbd>
                </div>
                    <div ref={listRef} className="p-2 max-h-[420px] overflow-y-auto">
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            {query.trim() ? 'Results' : 'Quick Access'}
                        </div>
                        {results.length === 0 && (
                            <div className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">No matches found. Try another keyword.</div>
                        )}
                        {results.map((result, idx) => (
                            <button
                                key={result.id}
                                ref={el => { itemRefs.current[idx] = el; }}
                                onClick={() => executeResult(result.action)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left group ${idx === selectedIndex ? 'bg-zinc-100 dark:bg-white/10' : 'hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                            >
                                <result.icon className={`w-4 h-4 transition-colors ${idx === selectedIndex ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
                                <div className="min-w-0 flex-1">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 block truncate">{result.title}</span>
                                    <span className="text-xs text-zinc-400 block truncate">{result.subtitle}</span>
                                </div>
                                <span className={`ml-auto text-xs transition-colors ${idx === selectedIndex ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`}>{result.kind}</span>
                    </button>
                        ))}
                    </div>
                    <div className="px-4 py-2.5 bg-zinc-50 dark:bg-[#1a1a23]/50 border-t border-zinc-100 dark:border-white/5 flex flex-wrap gap-x-4 gap-y-1.5 items-center text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-500 dark:text-zinc-300">↑↓</kbd> navigate</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-500 dark:text-zinc-300">↵</kbd> open</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-500 dark:text-zinc-300">Esc</kbd> close</span>
                        <span className="w-px h-3 bg-zinc-200 dark:bg-white/10 mx-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-600">Jump to —</span>
                        {([['d','Dashboard'],['v','Vault'],['r','Reports'],['a','Activity'],['s','Settings'],['c','Create']] as [string, string][]).map(([key, label]) => (
                            <button key={key} onClick={() => { navigate(label === 'Create' ? '/create' : `/${label.toLowerCase()}`); onClose(); }} className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                                <kbd className="px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-500 dark:text-zinc-300">g</kbd>
                                <kbd className="px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-500 dark:text-zinc-300">{key}</kbd>
                                {label}
                    </button>
                        ))}
                </div>
            </div>
        </div>
    );
    };

    const recentProfileEvents = projects
        .flatMap((p) => {
            const clientName = p.client?.company || p.client?.name || 'Client';
            const baseDate = p.createdAt || new Date().toISOString();
            const events: Array<{ id: string; title: string; detail: string; isHot?: boolean; ts: string }> = [];
            if (p.status === 'paid' || p.status === 'completed') {
                events.push({
                    id: `pay-${p.id}`,
                    title: 'Payment Received',
                    detail: `${clientName} paid $${p.amount.toLocaleString()}`,
                    isHot: true,
                    ts: p.clientViewedAt || p.dueDate || baseDate,
                });
            }
            if ((p.files || []).length > 0) {
                events.push({
                    id: `file-${p.id}`,
                    title: 'Files Updated',
                    detail: `${(p.files || []).length} assets in ${p.name}`,
                    ts: baseDate,
                });
            }
            if (p.clientViewedAt) {
                events.push({
                    id: `view-${p.id}`,
                    title: 'Client Viewed Vault',
                    detail: `${clientName} opened ${p.name}`,
                    ts: p.clientViewedAt,
                });
            }
            return events;
        })
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, 2);

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const ProfileMenu = () => (
        <div className="absolute top-16 right-0 w-80 bg-white/90 dark:bg-[#1a1a23]/90 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-2xl shadow-2xl p-4 animate-fade-in z-50 origin-top-right">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-white/5 mb-4">
                <div className="relative">
                    {user?.avatar ? (
                        <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="Profile" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 dark:bg-[#1a1a23] text-white flex items-center justify-center font-semibold shadow-sm">
                            {getInitials(user?.name)}
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 text-zinc-900 shadow-sm rounded-full border-2 border-white dark:border-[#1a1a23] flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white leading-tight">{user.name || 'Your Account'}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">{user.email || 'No email on file'}</p>
                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider mt-1 block">Pro Plan</span>
                </div>
            </div>

            {/* Notifications */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Recent Activity</span>
                    <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
                </div>
                {recentProfileEvents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-200/50 dark:border-white/15 p-3 text-center">
                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">No recent events yet.</p>
                    </div>
                ) : (
                <div className="space-y-1">
                        {recentProfileEvents.map((evt) => (
                            <div key={evt.id} className="flex gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${evt.isHot ? 'bg-red-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        <div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{evt.title}</p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{evt.detail}</p>
                        </div>
                    </div>
                        ))}
                        </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setIsProfileOpen(false); navigate('/settings'); }} className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/10 transition-all text-center group">
                    <Settings className="w-5 h-5 mx-auto mb-1 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white">Settings</span>
                </button>
                <button onClick={() => { setIsProfileOpen(false); routePreloadMap.help?.().finally(() => navigate('/help')); }} className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/10 transition-all text-center group">
                    <HelpCircle className="w-5 h-5 mx-auto mb-1 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white">Support</span>
                </button>
            </div>

            <button onClick={async () => { setIsProfileOpen(false); await onSignOut(); navigate('/signin'); }} className="w-full mt-4 py-2 text-[10px] font-bold uppercase text-zinc-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                <LogOut className="w-3 h-3" /> Sign Out
            </button>
        </div>
    );

    const headerHeightPx = 64;
    const isDockMode = layoutMode !== 'full';
    const isPanelOpen = isDockMode && currentPath !== 'workspace';
    const topbarGlassCls = 'bg-white/80 dark:bg-[#323242]/80 backdrop-blur-xl border border-zinc-200/60 dark:border-white/10 shadow-lg';
    const topbarGlassHoverCls = 'hover:bg-slate-200/70 dark:hover:bg-white/10';
    const greetingName = useMemo(() => {
        const fullName = (user?.name || '').trim();
        return fullName ? fullName.split(/\s+/)[0] : 'there';
    }, [user?.name]);
    const heroGreetingTemplate = useMemo(() => {
        const hour = new Date().getHours();
        const timeBasedTemplate = hour < 12
            ? 'Good Morning, {{name}}.'
            : hour < 18
                ? 'Good Afternoon, {{name}}.'
                : 'Good Evening, {{name}}.';
        const templates = [
            timeBasedTemplate,
            'Nice seeing you again, {{name}}.',
            'Hey there, {{name}}.',
            'Hi {{name}}, how are you?',
            'Great to have you here, {{name}}.',
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }, []);
    const heroTips = [
        'Drop files or folders to auto-build a draft instantly.',
        'Use Create Link when you want review without email friction.',
        'Enable watermark for previews, then unlock originals after payment.',
        'Set retention to 3 days for quick handovers and less clutter.',
        'Keep signatures on for approvals tied to each delivery.',
        'Use message presets to send polished client updates in seconds.',
        'Turn on client library for repeat buyers and returning teams.',
        'Toggle payment gate only when assets are fully final.',
        'Open Studio to add milestones when a project grows complex.',
        'Use Briefing to catch signatures, views, and payment status fast.',
        'Switch Alerts on before sending if you need real-time updates.',
        'Name projects by outcome, not file type, for cleaner search.',
        'Batch upload from folders to preserve structure on day one.',
        'Use one-time access for sensitive decks and legal documents.',
        'Pin high-value deliveries in Vault so they stay front and center.',
    ];
    const [heroTipIndex, setHeroTipIndex] = useState(0);
    const [showHeroGreeting, setShowHeroGreeting] = useState(false);
    const [heroGreetingPlayed, setHeroGreetingPlayed] = useState(false);
    const [heroGreetingPrefix, heroGreetingSuffix] = (heroGreetingTemplate || 'Hello, {{name}}.').split('{{name}}');

    useEffect(() => {
        if (!isDockMode || isPanelOpen) return;
        const timer = window.setInterval(() => {
            setHeroTipIndex((index) => (index + 1) % heroTips.length);
        }, 9000);
        return () => window.clearInterval(timer);
    }, [isDockMode, isPanelOpen, heroTips.length]);

    useEffect(() => {
        if (!isDockMode || heroGreetingPlayed || isPanelOpen) return;
        setShowHeroGreeting(true);
        const timer = window.setTimeout(() => {
            setShowHeroGreeting(false);
            setHeroGreetingPlayed(true);
        }, 9000);
        return () => window.clearTimeout(timer);
    }, [isDockMode, heroGreetingPlayed, isPanelOpen]);

    useEffect(() => {
        if (!isDockMode || !isPanelOpen || !showHeroGreeting) return;
        setShowHeroGreeting(false);
        setHeroGreetingPlayed(true);
    }, [isDockMode, isPanelOpen, showHeroGreeting]);

    const handleTopLevelNavigate = (id: string) => {
        if (currentPath === id) {
            navigate('/workspace');
            return;
        }

        const preloader = routePreloadMap[id];
        const targetPath = `/${id}`;

        if (preloader) {
            preloader().finally(() => {
                navigate(targetPath);
            });
            return;
        }

        navigate(targetPath);
    };

    return (
        <>
            {/* In-flow min-height so #root establishes document height while StageBackground/header/widget use position:fixed */}
            <div
                aria-hidden
                className={`min-h-screen w-full ${isDarkMode ? 'bg-cosmic' : 'bg-gradient-to-br from-stone-50 via-zinc-100 to-slate-100'}`}
            />
            {/* ── Stage background: full-bleed ambient canvas ── */}
            <StageBackground isDarkMode={isDarkMode} />

            {/* Global drag-drop overlay */}
            {isDraggingGlobal && (
                <div className="fixed inset-0 z-[999] bg-zinc-900/60 dark:bg-[#323242]/80 backdrop-blur-md flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
                    <div className="w-full max-w-lg mx-4 rounded-[2rem] border-2 border-dashed border-blue-500 bg-white/10 dark:bg-[#1a1a23]/50 flex flex-col items-center justify-center p-16 text-center shadow-2xl scale-105 animate-pulse">
                        <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center mb-6 shadow-xl shadow-blue-900/20">
                            <Plus className="w-10 h-10 text-white" strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Drop to Create Project</h2>
                        <p className="text-zinc-300 text-sm">Release files anywhere to start a new handover instantly.</p>
                    </div>
                </div>
            )}

            {/* ── Top bar ── */}
            <header
                className="fixed left-0 right-0 z-[85] flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-[top] duration-200 pointer-events-none"
                style={{ top: stripOffset, height: headerHeightPx }}
            >
                {/* Logo */}
                <button
                    className="flex items-center gap-2 cursor-pointer group shrink-0 pointer-events-auto"
                    onClick={() => { playClick(); navigate('/workspace'); }}
                    title="Home"
                >
                    <EditorialIcon className="w-5 h-5 text-black dark:text-white group-hover:rotate-12 transition-transform duration-500" />
                    <span className="font-serif font-medium text-zinc-900 dark:text-white hidden sm:block">HeartFlair</span>
                </button>

                {/* Nav pill + controls cluster */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                    {/* Desktop nav pill */}
                    <nav className={`hidden lg:flex items-center gap-0.5 rounded-full px-2 py-1.5 mr-1 ${topbarGlassCls}`}>
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { playClick(); handleTopLevelNavigate(item.id); }}
                                onMouseEnter={() => routePreloadMap[item.id]?.()}
                                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${currentPath === item.id ? 'bg-white/70 text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-zinc-600 dark:text-zinc-200 hover:bg-white/50 dark:hover:bg-white/5'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Search */}
                    <button
                        onClick={() => { playClick(); setIsSearchOpen(true); }}
                        className={`p-2.5 rounded-xl text-zinc-500 dark:text-zinc-300 transition-all cursor-pointer ${topbarGlassCls} ${topbarGlassHoverCls}`}
                        title="Search (Ctrl K)"
                    >
                        <Search className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => {
                            playClick();
                            onSetLayoutMode?.(layoutMode === 'full' ? 'dock' : 'full');
                        }}
                        className={`p-2.5 rounded-xl text-zinc-500 dark:text-zinc-300 transition-all cursor-pointer ${topbarGlassCls} ${topbarGlassHoverCls}`}
                        title={`Layout: ${layoutMode === 'full' ? 'Full workspace' : 'Docked widget'}`}
                    >
                        <ArrowLeftRight className="w-4 h-4" />
                    </button>

                    {/* Privacy toggle */}
                    <button
                        onClick={togglePrivacyMode}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer ${topbarGlassCls} ${privacyMode ? 'border-blue-700/30 dark:border-blue-400/30 text-blue-700 dark:text-blue-400' : `text-zinc-500 dark:text-zinc-300 ${topbarGlassHoverCls}`}`}
                        title="Privacy Mode"
                    >
                        {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    {/* Notifications */}
                    <div className="relative notif-menu-container">
                        <button
                            onClick={() => { playClick(); setIsNotifOpen(v => !v); if (!isNotifOpen) notifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id)); }}
                            className={`relative p-2.5 rounded-xl text-zinc-500 dark:text-zinc-300 transition-all cursor-pointer ${topbarGlassCls} ${topbarGlassHoverCls}`}
                            title="Notifications"
                        >
                            <Bell className="w-4 h-4" />
                            {notifications.some(n => !n.read) && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0e0e17]" />
                            )}
                        </button>
                        {isNotifOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1a1a23] border border-zinc-200/50 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Notifications</span>
                                    {notifications.length > 0 && (
                                        <button onClick={() => { clearNotifications(); setIsNotifOpen(false); }} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors cursor-pointer">Clear all</button>
                                    )}
                                </div>
                                <div className="max-h-72 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 px-4 gap-2 text-center">
                                            <Bell className="w-8 h-8 text-zinc-300 dark:text-white/20" />
                                            <span className="text-xs text-zinc-400 dark:text-zinc-500">No notifications yet</span>
                                            <span className="text-[10px] text-zinc-300 dark:text-zinc-600">Project updates will appear here</span>
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-zinc-50 dark:border-white/[0.04] last:border-0 transition-colors ${n.read ? 'opacity-60' : 'bg-indigo-50/50 dark:bg-indigo-900/10'}`}>
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-zinc-300' : 'bg-indigo-500'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-zinc-800 dark:text-white">{n.title}</p>
                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{n.body}</p>
                                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">{new Date(n.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Theme */}
                    <ThemeModeDropdown
                        themeMode={themeMode}
                        onChange={(mode) => { playClick(); onSetThemeMode(mode); }}
                        isDarkMode={isDarkMode}
                        compact
                        buttonClassName={`p-2.5 rounded-xl text-zinc-500 dark:text-zinc-300 transition-all flex items-center cursor-pointer ${topbarGlassCls} ${topbarGlassHoverCls}`}
                    />

                    {/* Mock / Real data toggle */}
                    {canToggleMockMode() && (
                        <button
                            onClick={() => { playClick(); handleDemoModeToggle(!demoMode); }}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${topbarGlassCls} ${demoMode
                                ? 'border-amber-300/70 dark:border-amber-700/30 text-amber-700 dark:text-amber-300'
                                : 'border-blue-300/70 dark:border-blue-700/30 text-blue-700 dark:text-blue-300'
                            }`}
                            title={demoMode ? 'Switch to real backend data' : 'Switch to mock demo data'}
                        >
                            {demoMode ? 'Mock' : 'Real'}
                        </button>
                    )}

                    {/* Profile */}
                    <div className="relative profile-menu-container">
                        <button
                            onClick={() => { playClick(); setIsProfileOpen(!isProfileOpen); }}
                            className="flex items-center gap-2 pl-1 cursor-pointer group/profile bg-transparent border-none"
                            aria-label="Open User Menu"
                        >
                            <div className="relative group-hover/profile:scale-105 transition-transform">
                                {user?.avatar ? (
                                    <img src={user.avatar} className="w-9 h-9 rounded-full border border-zinc-200/50 dark:border-white/10 shadow-sm object-cover" alt="Profile" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full border border-zinc-200/50 dark:border-white/10 shadow-sm bg-zinc-800 dark:bg-[#1a1a23] text-white flex items-center justify-center text-xs font-semibold">
                                        {getInitials(user?.name)}
                                    </div>
                                )}
                                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1a23] animate-pulse" />
                                <div className="absolute top-full right-0 mt-3 hidden group-hover/profile:flex flex-col items-end w-max pointer-events-none opacity-0 group-hover/profile:opacity-100 translate-y-1 group-hover/profile:translate-y-0 transition-all duration-200">
                                    <div className="px-3 py-1.5 bg-white/90 dark:bg-[#1a1a23]/90 backdrop-blur-md rounded-lg shadow-xl border border-zinc-200/50 dark:border-white/10 text-right">
                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Pro Account</span>
                                        <span className="block text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[120px]">{user.name}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                        {isProfileOpen && <ProfileMenu />}
                    </div>
                </div>
            </header>

            {/* ── Delivery Widget: floats left, vertically centered below header ── */}
            {isDockMode && (
                <div
                    className="fixed left-4 right-4 sm:left-8 sm:right-auto z-20 flex items-center transition-[opacity,transform] duration-500"
                    style={{ top: stripOffset + headerHeightPx, bottom: 72 }}
                >
                    <DeliveryWidget isDarkMode={isDarkMode} onPublish={saveProject} />
                </div>
            )}

            {/* ── Main Page Greeting (Hero) ── */}
            {layoutMode === 'full' && (
                <main
                    className="fixed left-0 right-0 bottom-0 z-[30] overflow-hidden"
                    style={{ top: stripOffset + headerHeightPx }}
                >
                    <div className="h-full overflow-y-auto px-3 sm:px-5 lg:px-6 xl:px-7 py-3 sm:py-4 bg-[#f0f2f5] dark:bg-cosmic">
                        {currentPath === 'workspace' ? (
                            <div className="h-full flex items-stretch justify-center">
                                <div className="h-full flex items-stretch py-2">
                                    <DeliveryWidget isDarkMode={isDarkMode} onPublish={saveProject} />
                                </div>
                            </div>
                        ) : (
                            <div key={location.pathname} className="h-full animate-route-in">
                                <Outlet context={{ privacyMode, openSearch: () => setIsSearchOpen(true) }} />
                            </div>
                        )}
                    </div>
                </main>
            )}

            {isDockMode && !isPanelOpen && (
                <div className="fixed left-[430px] right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center justify-center text-center pointer-events-none z-0 px-10 animate-fade-in duration-1000" style={{ top: `calc(50% + ${stripOffset/2}px)` }}>
                    <div className="relative w-full max-w-[1040px] min-h-[340px]">
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${showHeroGreeting ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <h1 className="font-serif text-7xl 2xl:text-[8.2rem] text-zinc-900 dark:text-white tracking-tight leading-[0.98] max-w-[1040px]">
                                <span className="block animate-fade-in">
                                    {heroGreetingPrefix}
                                    <span className="italic text-[#84cc16] dark:text-[#a3e635]">{greetingName}</span>
                                    {heroGreetingSuffix}
                                </span>
                            </h1>
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${showHeroGreeting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <div className="max-w-lg space-y-1">
                                <p key={heroTipIndex} className="text-xl text-zinc-500 dark:text-zinc-200 leading-relaxed font-medium animate-fade-in">
                                    {heroTips[heroTipIndex]}
                                </p>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-300 font-bold">
                                    Quick tip {heroTipIndex + 1} of {heroTips.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Panel backdrop ── */}
            {isDockMode && (
                <div
                    className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    style={{ top: stripOffset, background: 'rgba(0,0,0,0.22)' }}
                    onClick={() => { playClick(); navigate('/workspace'); }}
                />
            )}

            {/* ── Side panel ── */}
            {isDockMode && (
                <aside
                    className={`fixed right-0 bottom-0 z-[70] w-full max-w-[960px] lg:w-auto lg:max-w-none lg:left-[420px] xl:left-[440px] bg-[#f0f2f5] dark:bg-cosmic transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    style={{ top: stripOffset }}
                    aria-hidden={!isPanelOpen}
                >
                    <div className="h-full bg-[#f0f2f5] dark:bg-cosmic border-l border-zinc-200/60 dark:border-white/[0.09] shadow-2xl overflow-hidden flex flex-col transition-[box-shadow,border-color] duration-700" style={{ paddingTop: 12 }}>
                        <div className="shrink-0 h-14 px-5 flex items-center border-b border-zinc-100 dark:border-white/10 bg-[#f0f2f5] dark:bg-cosmic">
                            <button
                                onClick={() => { playClick(); navigate('/workspace'); }}
                                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Close
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="h-full px-3 sm:px-5 lg:px-6 xl:px-7 py-3 sm:py-4 bg-[#f0f2f5] dark:bg-cosmic">
                                <div key={location.pathname} className="h-full animate-route-in">
                                    <Outlet context={{ privacyMode, openSearch: () => setIsSearchOpen(true) }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            )}

            {/* ── Help FAB ── */}
            <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40">
                {currentPath === 'help' ? (
                    <button
                        onClick={() => { playClick(); navigate('/workspace'); }}
                        className="w-12 h-12 bg-zinc-900 dark:bg-white/10 hover:bg-zinc-800 dark:hover:bg-white/20 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-110 duration-300 cursor-pointer"
                        aria-label="Close help"
                    >
                        <X className="w-5 h-5" />
                    </button>
                ) : (
                    <Link
                        to="/help"
                        onClick={() => playSuccess()}
                        onMouseEnter={() => routePreloadMap.help?.()}
                        onTouchStart={() => routePreloadMap.help?.()}
                        className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:rotate-6 duration-300 cursor-pointer"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </Link>
                )}
            </div>

            {/* ── Mobile bottom navigation ── */}
            <MobileNavBar navItems={navItems} currentPath={currentPath} onNavigate={(id) => { playClick(); handleTopLevelNavigate(id); }} />

            {/* ── Search overlay (above everything including strip) ── */}
            {isSearchOpen && <SearchCommandPalette onClose={() => setIsSearchOpen(false)} />}
        </>
    );
}

// Wrapper to handle project lookup for Editor routes
const EditorWrapper = ({ projects, onSave, user }: { projects: Project[], onSave: (p: Project) => void, user: UserProfile }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const project = projects.find(p => p.id === id) || projects[0];
    return <CreatorPage existingProject={project} allProjects={projects} user={user} onSave={onSave} onBack={() => navigate('/vault')} />;
};

const CreatorWrapper = ({ projects, onSave, user }: { projects: Project[], onSave: (p: Project) => void, user: UserProfile }) => {
    const navigate = useNavigate();
    return <CreatorPage allProjects={projects} user={user} onSave={onSave} onBack={() => navigate('/vault')} />;
};

// Wrapper to handle project lookup for Preview routes
// Updated to accept themeMode (string) and onToggleTheme (function)
// FIXED: Enhanced navigation logic to properly handle 'Back' behavior, especially from lightbox
const PreviewWrapper = ({ projects, user, isDarkMode, themeMode, onToggleTheme, onSetThemeMode }: { projects: Project[], user: UserProfile, isDarkMode: boolean, themeMode: 'light' | 'dark' | 'system', onToggleTheme: () => void, onSetThemeMode: (mode: 'light' | 'dark' | 'system') => void }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const project = projects.find(p => p.id === id) || projects[0];

    const handleBack = () => {
        // 1. Try explicit internal history state
        if (location.state && location.state.from) {
            navigate(location.state.from);
            return;
        }

        // 2. Try generic back navigation if history depth suggests we came from somewhere
        // Note: history.length is often > 1 even on new tabs in some browsers, but > 2 is safer for deep links
        if (window.history.length > 2) {
            navigate(-1);
            return;
        }

        // 3. HARD FALLBACK: If we are "stuck" or landed directly on this page
        // Since we are inside the App wrapper, we are likely an admin/creator.
        // Default to Vault.
        navigate('/vault');
    };

    const libraryEnabled = project.enableClientLibrary !== false;
    const clientEmail = (project.client?.email || '').trim().toLowerCase();
    const libraryProjects = projects.filter(p => {
        if (p.id === project.id) return false;
        if (p.enableClientLibrary === false) return false;
        if ((p.status !== 'paid' && p.status !== 'completed') || !p.files?.some(f => f.includeInLibrary !== false)) return false;
        const candidateEmail = (p.client?.email || '').trim().toLowerCase();
        return clientEmail.length > 0 && candidateEmail === clientEmail;
    });

    return <ClientPreviewBiz project={project} user={user} onBack={handleBack} isDarkMode={isDarkMode} themeMode={themeMode} onToggleTheme={onToggleTheme} onSetThemeMode={onSetThemeMode} libraryProjects={libraryProjects} libraryEnabled={libraryEnabled} />;
};

const ClientLinkWrapper = ({ isDarkMode, themeMode, onToggleTheme, onSetThemeMode }: { isDarkMode: boolean, themeMode: 'light' | 'dark' | 'system', onToggleTheme: () => void, onSetThemeMode: (mode: 'light' | 'dark' | 'system') => void }) => {
    const { token } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [project, setProject] = useState<Project | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        let pollTimer: number | null = null;
        let pollAttempts = 0;
        const shouldPoll = () => {
            try {
                const payment = new URLSearchParams(location.search).get('payment');
                return payment === 'success';
            } catch {
                return false;
            }
        };
        const run = async () => {
            try {
                setLoading(true);
                setError(null);
                if (!supabase) throw new Error('Supabase is not configured.');
                const clientLink = (token || '').trim();
                if (!clientLink) throw new Error('Invalid client link.');
                const { data, error } = await supabase.functions.invoke('client-preview', {
                    body: { clientLink }
                });
                if (error) throw new Error(error.message);
                if (!data?.project) throw new Error('Project not found.');
                if (!cancelled) {
                    const next = data.project as Project;
                    setProject(next);

                    if (shouldPoll()) {
                        const isPaid = next.status === 'paid' || next.status === 'completed';
                        const anyLocked = (next.files || []).some((f: any) => f.locked);
                        // Webhooks can be eventually consistent; poll briefly after a successful payment redirect.
                        if ((!isPaid || anyLocked) && pollAttempts < 12) {
                            pollAttempts += 1;
                            if (pollTimer) window.clearTimeout(pollTimer);
                            pollTimer = window.setTimeout(run, 2000);
                        }
                    }
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Failed to load preview.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => {
            cancelled = true;
            if (pollTimer) window.clearTimeout(pollTimer);
        };
    }, [token, location.search]);

    if (loading) {
        return (
            <div className={`min-h-screen w-full flex items-center justify-center ${isDarkMode ? 'bg-cosmic text-white' : 'bg-white text-zinc-900'}`}>
                <div className="text-sm font-bold tracking-wide opacity-80">Loading secure preview…</div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className={`min-h-screen w-full flex items-center justify-center ${isDarkMode ? 'bg-cosmic text-white' : 'bg-white text-zinc-900'}`}>
                <div className="max-w-md w-full px-6">
                    <div className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-zinc-200/50 bg-zinc-50'}`}>
                        <div className="font-black tracking-wide mb-2">Preview unavailable</div>
                        <div className="text-sm opacity-80">{error || 'This link may be invalid or expired.'}</div>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className={`mt-4 w-full h-11 rounded-xl font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-500 text-zinc-900 shadow-sm text-white hover:bg-blue-700'}`}
                        >
                            Back to home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ClientPreviewBiz
            key={`${project.id}:${project.status}`}
            project={project}
            onBack={() => navigate('/')}
            isDarkMode={isDarkMode}
            themeMode={themeMode}
            onToggleTheme={onToggleTheme}
            onSetThemeMode={onSetThemeMode}
            libraryEnabled={false}
        />
    );
};

const ClientPortalWrapper = () => {
    const { token } = useParams();
    const [portal, setPortal] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setLoading(true);
            setError(null);
            const portalToken = (token || '').trim();
            if (!portalToken) {
                setError('Invalid portal token.');
                setLoading(false);
                return;
            }
            const result = await DB.getClientPortal(portalToken);
            if (cancelled) return;
            if (result.error) setError(result.error);
            else setPortal(result.portal);
            setLoading(false);
        };
        run();
        return () => { cancelled = true; };
    }, [token]);

    return <ClientPortalPage portal={portal} loading={loading} error={error} />;
};

const AppContent = () => {
    const [privacyMode, setPrivacyMode] = useState(false);
    // Read theme from URL search params (for iframe sync)
    const getInitialTheme = (): 'light' | 'dark' | 'system' => {
        try {
            const params = new URLSearchParams(window.location.search);
                const t = params.get('theme');
                if (t === 'light' || t === 'dark' || t === 'system') return t;
        } catch { }
        return 'system';
    };
    const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(getInitialTheme());
    const [layoutMode, setLayoutMode] = useState<'dock' | 'full'>(() => {
        try {
            const stored = localStorage.getItem('hf_layout_mode');
            if (stored === 'dock' || stored === 'full') return stored;
        } catch {
        }
        return 'dock';
    });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstVisitThemeNotice, setFirstVisitThemeNotice] = useState<string | null>(null);

    // â”€â”€ Offline / SW-update awareness â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [offlineDismissed, setOfflineDismissed] = useState(false);
    const [swUpdateReady, setSwUpdateReady] = useState(false);
    const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        const goOnline = () => {
            setIsOffline(false);
            setOfflineDismissed(false); // reset so strip shows again next time
        };
        const goOffline = () => {
            setIsOffline(true);
            setOfflineDismissed(false); // always show strip when connection drops
        };
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.ready.then(reg => {
            swRegistrationRef.current = reg;
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        setSwUpdateReady(true);
                    }
                });
            });
        });
    }, []);

    useEffect(() => {
        let cancelled = false;

        const preloadAllLazyScreens = () => {
            if (cancelled) return;
            Promise.allSettled([
                _importCreator(),
                _importPreviewBiz(),
                _importPortal(),
                _importActivity(),
                _importReports(),
                _importSettings(),
                _importHelp(),
                _importTrash(),
            ]).catch(() => {
                // Preload failures are non-fatal; route-level loading still works.
            });
        };

        const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: { timeout: number }) => number);
        const cic = (window as any).cancelIdleCallback as undefined | ((id: number) => void);

        if (typeof ric === 'function') {
            const idleId = ric(() => preloadAllLazyScreens(), { timeout: 1800 });
            return () => {
                cancelled = true;
                if (typeof cic === 'function') cic(idleId);
            };
        }

        const timer = window.setTimeout(() => preloadAllLazyScreens(), 600);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, []);

    // -- STATE MANAGEMENT via Store --
    const { projects, user, authResolved, saveProject, updateUser, resetStore, notifications, markNotificationRead, clearNotifications } = useStore();
    const isLiveMode = !isMockMode();
    const handleGetStarted = () => {
        if (user.id) {
            window.location.assign('/workspace');
            return;
        }

        if (isLiveMode) {
            setMockModeAndNavigate(true, '/workspace');
            return;
        }

        window.location.assign('/workspace');
    };

    const handleLandingQuickStartWithFiles = (files: File[]) => {
        if (!files || files.length === 0) {
            handleGetStarted();
            return;
        }

        appendFilesToQuickDraft(files);

        const destination = '/create?source=landing-drop';
        if (user.id) {
            window.location.assign(destination);
            return;
        }

        if (isLiveMode) {
            window.location.assign(`/signin?from=landing&returnTo=${encodeURIComponent(destination)}`);
            return;
        }

        window.location.assign(destination);
    };

    const protectLiveRoute = (element: React.ReactNode) => {
        if (!isLiveMode) return element;
        if (!authResolved) return <PageLoader />;
        if (!user.id) return <Navigate to="/signin" replace />;
        return element;
    };

    // Theme Management Effect
    useEffect(() => {
        const matchDark = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            let shouldBeDark = false;
            if (themeMode === 'system') {
                shouldBeDark = matchDark.matches;
            } else {
                shouldBeDark = themeMode === 'dark';
            }
            setIsDarkMode(shouldBeDark);
            // Toggle 'dark' class on HTML or Body if needed, though parent div handles it here
        };

        applyTheme();

        // Listen for system changes if in system mode
        if (themeMode === 'system') {
            matchDark.addEventListener('change', applyTheme);
            return () => matchDark.removeEventListener('change', applyTheme);
        }
    }, [themeMode]);

    useEffect(() => {
        try {
            localStorage.setItem('hf_layout_mode', layoutMode);
        } catch {
        }
    }, [layoutMode]);

    useEffect(() => {
        try {
            const isPreviewRoute = window.location.pathname.startsWith('/preview/') || window.location.pathname.startsWith('/c/') || window.location.pathname.startsWith('/portal/');
            if (isPreviewRoute) return;

            const alreadySeen = localStorage.getItem('th_theme_notice_seen') === '1';
            if (alreadySeen) return;

            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const appliedMode = prefersDark ? 'Dark mode' : 'Light mode';
            setFirstVisitThemeNotice(`${appliedMode} has been applied based on your operating system preference.`);
            localStorage.setItem('th_theme_notice_seen', '1');

            const timer = window.setTimeout(() => setFirstVisitThemeNotice(null), 5500);
            return () => window.clearTimeout(timer);
        } catch {
        }
    }, []);

    const cycleTheme = () => {
        const modes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
        const currentIndex = modes.indexOf(themeMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setThemeMode(modes[nextIndex]);
    };

    const togglePrivacyMode = () => {
        setPrivacyMode(!privacyMode);
    };

    // â”€â”€ Toast queue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastCounter = useRef(0);
    const showToast: ToastFn = React.useCallback((message, kind = 'success') => {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, message, kind }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);
    const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // Connection state: show "back online" briefly after reconnecting
    const [backOnline, setBackOnline] = useState(false);
    useEffect(() => {
        if (!isOffline && !offlineDismissed) {
            // just came back online — show confirmation strip for 3 s then hide
            setBackOnline(true);
            const t = setTimeout(() => setBackOnline(false), 3000);
            return () => clearTimeout(t);
        }
    }, [isOffline]); // eslint-disable-line react-hooks/exhaustive-deps

    const isLandingRoute = (() => {
        try {
            return window.location.pathname === '/';
        } catch {
            return false;
        }
    })();

    const [isSmallScreen, setIsSmallScreen] = useState(false);
    useEffect(() => {
        const checkScreen = () => setIsSmallScreen(window.innerWidth <= 1024);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    const isPreviewRoute = (() => {
        try {
            const p = window.location.pathname;
            return p.startsWith('/preview') || p.startsWith('/c/') || p.startsWith('/portal/');
        } catch {
            return false;
        }
    })();

    const suppressStrips = isLandingRoute || isPreviewRoute || isSmallScreen;

    const showOfflineStrip = !suppressStrips && isOffline && !offlineDismissed;
    const showBackOnlineStrip = !suppressStrips && !isOffline && backOnline;
    const showUpdateStrip = swUpdateReady && !suppressStrips;

    const anyStripVisible = showOfflineStrip || showBackOnlineStrip || showUpdateStrip;
    const stripHeightPx = 28; // h-7

    return (
        <ToastContext.Provider value={showToast}>
        <PrivacyContext.Provider value={{ privacyMode, togglePrivacyMode }}>
            <StripOffsetContext.Provider value={anyStripVisible ? stripHeightPx : 0}>
            {/* Outermost flex-col wrapper carries the dark class so strips honour it */}
            <div className={`${isDarkMode ? 'dark' : ''} flex flex-col min-h-screen font-sans`}>
                <ToastContainer toasts={toasts} dismiss={dismissToast} />

                {/* â”€â”€ Connection / update strips — fixed to viewport top so they're
                    always visible regardless of scroll position. The header and
                    main content read stripOffset via context to shift down. â”€â”€ */}
                {showOfflineStrip && (
                    <div className="fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 bg-zinc-800 dark:bg-[#0f0f15] border-b border-zinc-700 dark:border-white/10 text-zinc-100 text-[11px] font-bold h-7 z-[200]">
                        <div className="flex items-center gap-2 min-w-0">
                            <Wifi className="w-3 h-3 shrink-0 opacity-60" />
                            <span className="truncate">You're working offline — the app remains fully available.</span>
                        </div>
                        <button
                            onClick={() => setOfflineDismissed(true)}
                            className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
                {showBackOnlineStrip && (
                    <div className="fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 bg-blue-500 text-zinc-900 shadow-sm dark:bg-blue-500 text-zinc-900 shadow-sm text-white text-[11px] font-bold h-7 z-[200]">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span>Back online — connection restored.</span>
                        </div>
                    </div>
                )}

                {/* â”€â”€ SW update available strip â”€â”€ */}
                {showUpdateStrip && (
                    <div className="fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 bg-blue-500 text-zinc-900 shadow-sm text-white text-[11px] font-bold h-7 z-[200]">
                        <div className="flex items-center gap-2 min-w-0">
                            <RefreshCw className="w-3 h-3 shrink-0" />
                            <span className="truncate">A new version is ready.</span>
                            <button
                                onClick={() => { swRegistrationRef.current?.waiting?.postMessage({ type: 'SKIP_WAITING' }); window.location.reload(); }}
                                className="underline hover:no-underline transition-all shrink-0 ml-1"
                            >
                                Reload now
                            </button>
                        </div>
                        <button
                            onClick={() => setSwUpdateReady(false)}
                            className="shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                <BrowserRouter>
                    {/* First-visit theme notice — floats above content */}
                    {firstVisitThemeNotice && (
                        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] px-4">
                            <div className="flex items-center gap-2 rounded-full border border-zinc-200/50 dark:border-white/10 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-md shadow-lg px-4 py-2 text-[11px] font-bold tracking-wide text-zinc-700 dark:text-zinc-200">
                                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span>{firstVisitThemeNotice}</span>
                                <button
                                    type="button"
                                    onClick={() => setFirstVisitThemeNotice(null)}
                                    className="ml-1 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                                    aria-label="Dismiss theme notice"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                    <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <LandingPage
                                    onGetStarted={handleGetStarted}
                                    onQuickStartWithFiles={handleLandingQuickStartWithFiles}
                                    currentTheme={themeMode}
                                    onSetThemeMode={setThemeMode}
                                    toggleTheme={cycleTheme}
                                />
                            }
                        />
                        <Route path="/signin" element={<SignInPage themeMode={themeMode} toggleTheme={cycleTheme} />} />
                        <Route path="/c/:token" element={<ClientLinkWrapper isDarkMode={isDarkMode} themeMode={themeMode} onToggleTheme={cycleTheme} onSetThemeMode={setThemeMode} />} />
                        <Route path="/portal/:token" element={<ClientPortalWrapper />} />
                        <Route path="/app" element={<Navigate to="/workspace" replace />} />
                        <Route element={protectLiveRoute(<AppLayout
                            user={user}
                            projects={projects}
                            isDarkMode={isDarkMode}
                            themeMode={themeMode}
                            onSetThemeMode={setThemeMode}
                            layoutMode={layoutMode}
                            onSetLayoutMode={setLayoutMode}
                            setIsDarkMode={setIsDarkMode}
                            togglePrivacyMode={togglePrivacyMode}
                            privacyMode={privacyMode}
                            onSignOut={resetStore}
                        />)}>
                            {/* Home surface is DeliveryWidget in AppLayout; null outlet so /workspace stays a valid parent match for nested routes */}
                            <Route path="/workspace" element={null} />
                            <Route path="/dashboard" element={<Suspense fallback={<DashboardSkeleton />}><DashboardView projects={projects} user={user} /></Suspense>} />
                            <Route path="/activity" element={<Suspense fallback={<PageLoader />}><ActivityView /></Suspense>} />
                            <Route path="/vault" element={<Suspense fallback={<VaultSkeleton />}><VaultView projects={projects} /></Suspense>} />
                            <Route path="/reports" element={<Suspense fallback={<PageLoader />}><ReportsView /></Suspense>} />
                            <Route
                                path="/settings"
                                element={
                                    <Suspense fallback={<PageLoader />}>
                                        <SettingsPage user={user} onUpdateUser={updateUser} onSignOut={resetStore} />
                                    </Suspense>
                                }
                            />
                            <Route path="/trash" element={<TrashPage onBack={() => window.history.back()} />} />
                            <Route
                                path="/help"
                                element={
                                    <Suspense fallback={<PageLoader />}>
                                        <HelpPage onBack={() => window.history.back()} />
                                    </Suspense>
                                }
                            />
                        </Route>
                        <Route path="/create" element={protectLiveRoute(<CreatorWrapper projects={projects} onSave={saveProject} user={user} />)} />
                        <Route path="/editor/:id" element={protectLiveRoute(<EditorWrapper projects={projects} onSave={saveProject} user={user} />)} />
                        <Route path="/preview/:id" element={protectLiveRoute(<PreviewWrapper projects={projects} user={user} isDarkMode={isDarkMode} themeMode={themeMode} onToggleTheme={cycleTheme} onSetThemeMode={setThemeMode} />)} />
                    </Routes>
                    </Suspense>
                </BrowserRouter>

            </div>{/* end outermost flex-col dark wrapper */}
            </StripOffsetContext.Provider>
        </PrivacyContext.Provider>
        </ToastContext.Provider>
    );
};

export default function App() {
    return (
        <StoreProvider>
            <AppContent />
        </StoreProvider>
    );
}
