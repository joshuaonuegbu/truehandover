import React, { useState, useEffect, useContext, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams, Outlet, Link, useOutletContext, useSearchParams } from 'react-router-dom';
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
    FileInput, Wifi, Receipt, ArrowLeftRight, TrendingDown, ShieldAlert,
    BarChart3, FileDigit, Landmark, Printer, PieChart, Users,
    QrCode
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar, Cell, Legend, ReferenceLine, YAxis, Pie, PieChart as RePieChart } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { playClick, playSuccess } from './utils/sound';
import { useUiAccentHex } from './utils/useUiAccentHex';
import { accentCssVars } from './utils/themeTokens';
import { canToggleMockMode, isMockMode, setMockMode, setMockModeAndNavigate } from './config/mockMode';
import { createAuditTrailPdf, createRightsCertificatePdf } from './utils/reportPdfGenerator';
// Critical path — loaded eagerly (needed before auth resolves)
import LandingPage from './components/LandingPage';
import SignInPage from './components/SignInPage';
import { Card, Badge, Widget } from './components/Shared';
import ThemeModeDropdown from './components/ThemeModeDropdown';
import { ClientRolodexContent } from './components/ClientsPage';
import BrandLogo from './components/BrandLogo';
import DeliveryQuickQuote from './components/DeliveryQuickQuote';
import { makeQuoteLine, type QuoteLine, quoteCurrency } from './utils/quoteBuilderCore';

// Route-level code-splitting — only loaded when the user navigates to that route
const _importCreator = () => import('./components/CreatorPage');
const _importPreviewBiz = () => import('./components/ClientPreviewBiz');
const _importPortal = () => import('./components/ClientPortalPage');
const _importTrash = () => import('./components/TrashPage');
const _importHelp = () => import('./components/HelpPage');
const _importSettings = () => import('./components/SettingsPage');
const _importReports = () => import('./components/ReportsView');
const _importActivity = () => import('./components/ActivityView');
const _importQuotes = () => import('./components/QuotesPage');

const CreatorPage = lazy(_importCreator);
const ClientPreviewBiz = lazy(_importPreviewBiz);
const ClientPortalPage = lazy(_importPortal);
const TrashPage = lazy(_importTrash);
const HelpPage = lazy(_importHelp);
const SettingsPage = lazy(_importSettings);
const ReportsView = lazy(_importReports);
const ActivityView = lazy(_importActivity);
const QuotesPage = lazy(_importQuotes);

// Hover-prefetch map — call the matching _import* fn on nav item hover so the
// chunk is in the module cache before the user even clicks the link.
const routePreloadMap: Record<string, () => Promise<unknown>> = {
    vault: _importPreviewBiz,   // Vault renders file cards; preload preview biz alongside
    activity: _importActivity,
    reports: _importReports,
    settings: _importSettings,
    quotes: _importQuotes,
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
        <div className="fixed right-4 lg:right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none bottom-[calc(92px+env(safe-area-inset-bottom))] lg:bottom-8">
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
const isMobileLikeDevice = () => {
    try {
        const ua = navigator.userAgent || '';
        const touchLike = window.matchMedia('(pointer: coarse)').matches;
        const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
        return touchLike || mobileUa;
    } catch {
        return false;
    }
};
const QUICK_DELIVERY_DRAFT_KEY = 'th_creator_draft_new';
const QUICK_DELIVERY_EVENT = 'hf-quick-delivery-files';
/** Same-tab signal so shell can re-read draft file counts (e.g. after deletes). */
const QUICK_DELIVERY_DRAFT_CHANGED = 'hf-quick-delivery-draft-changed';
const QUICK_MESSAGE_PRESETS = [
    {
        label: 'Standard',
        text: "Hi {{name}}, your files are ready for review. Once payment is settled, the full delivery unlocks instantly."
    },
    {
        label: 'Warm',
        text: "Hi {{name}}, everything is ready on Heartifact. Review the previews and unlock the final files whenever you're ready."
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

const normalizeWidgetQuickQuoteLines = (raw: unknown): QuoteLine[] => {
    if (!Array.isArray(raw) || raw.length === 0) return [makeQuoteLine()];
    const out: QuoteLine[] = [];
    for (const row of raw) {
        if (row && typeof row === 'object') {
            const o = row as Record<string, unknown>;
            out.push({
                id: typeof o.id === 'string' ? o.id : crypto.randomUUID(),
                description: typeof o.description === 'string' ? o.description : '',
                qty: Math.max(0, Number(o.qty) || 0),
                rate: Math.max(0, Number(o.rate) || 0),
            });
        }
    }
    return out.length ? out : [makeQuoteLine()];
};

const readQuickDeliveryDraft = (): { formData?: Partial<Project>; files?: FileAsset[]; quickQuoteLines?: QuoteLine[] } | null => {
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
            files: nextFiles,
            quickQuoteLines: existing?.quickQuoteLines,
        }));
    } catch {
        // Ignore storage failures; widget state still updates in memory.
    }
    try {
        window.dispatchEvent(new Event(QUICK_DELIVERY_DRAFT_CHANGED));
    } catch {
        /* ignore */
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
    <BrandLogo className={className} />
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
        <div className="mb-4 md:mb-5 flex flex-col gap-4 border-b border-zinc-200/55 pb-4 dark:border-white/[0.08] sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-10 sm:gap-y-3">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/70 text-zinc-500 dark:border-white/[0.12] dark:text-zinc-400">
                        <CreditCard className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">Stripe</span>
                        <span className={`text-sm font-semibold tracking-tight ${stripeConnected ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>
                            {stripeConnected ? 'Connected' : 'Not connected'}
                        </span>
        </div>
            </div>

                <div className="hidden h-8 w-px bg-zinc-200/80 sm:block dark:bg-white/[0.08]" aria-hidden />

                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/70 text-zinc-500 dark:border-white/[0.12] dark:text-zinc-400">
                        <Banknote className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">Next payout</span>
                        <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
                            {stripeConnected && payoutsEnabled ? 'In Stripe' : 'Unavailable'}
                        </span>
            </div>
                    </div>
                        </div>

            <div className="flex min-w-0 flex-1 items-center gap-4 sm:max-w-md sm:justify-end lg:max-w-lg">
                <HardDrive className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                            {demoMode ? 'Project storage' : 'Storage'}
                        </span>
                        <span className="truncate text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                            {demoMode ? `${formatBytes(demoRemainingNativeStorageBytes)} free` : (
                                <>{formatBytes(totalBytes)} <span className="text-zinc-400 dark:text-zinc-500">· {totalFiles} files</span></>
                            )}
                        </span>
                        </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-white/[0.08]">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-[width] duration-500 dark:from-blue-500 dark:to-sky-400"
                            style={{ width: `${usagePct}%` }}
                        />
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
                    <div key={i} className="flex items-center relative z-10 group pl-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-16 text-right font-mono mr-6">{item.date}</span>
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-500 text-zinc-900 shadow-sm dark:bg-blue-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'} ring-4 ring-white/50 dark:ring-black/20 relative z-20 mr-3`} />
                        <div className="flex-1 flex items-center justify-between gap-6 p-3 rounded-lg hover:bg-white hover:shadow-sm dark:hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-zinc-100 dark:hover:border-white/5">
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-4 h-4 ${iconColor}`} />
                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{item.title}</span>
                            </div>
                            <span className="ml-6 text-[10px] font-mono text-zinc-400 hidden sm:block uppercase tracking-wider">{item.subtitle}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/** Noise + surface treatment aligned with Trash / Reports premium cards */
const CYCLING_WIDGET_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

const CyclingWidget = ({ projects, compact = false }: { projects: Project[]; compact?: boolean }) => {
    const navigate = useNavigate();
    const chartAccent = useUiAccentHex();
    const [cycleIndex, setCycleIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const demoMode = isMockMode();
    const duration = 10000; // 10 seconds per slide
    const interval = 50; // Update frequency

    /** Scales headline numbers with viewport + compact dock mode so fixed-height cards don’t feel oversized */
    const revenueAmountClass = compact
        ? 'text-[clamp(1.2rem,calc(0.55rem+5vw),1.95rem)]'
        : 'text-[clamp(1.35rem,calc(0.65rem+4.2vw),2.6rem)]';
    const storageHeroClass = compact
        ? 'text-[clamp(1.25rem,calc(0.7rem+4vw),2rem)]'
        : 'text-[clamp(1.35rem,calc(0.8rem+3.2vw),2.5rem)]';
    const feedbackQuoteClass = (replying: boolean) =>
        replying
            ? 'text-[clamp(0.75rem,calc(0.65rem+0.9vw),0.95rem)] leading-snug'
            : 'text-[clamp(0.8rem,calc(0.62rem+1.35vw),1.1rem)] sm:text-[clamp(0.88rem,calc(0.72rem+1.1vw),1.2rem)] leading-[1.45]';
    const slidePad = 'p-4 pb-12 sm:p-5 md:p-6 lg:p-8';

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
                <div className={`absolute inset-0 ${slidePad} z-10 flex min-h-0 flex-col justify-between bg-white dark:bg-charcoal transition-all duration-700 ease-in-out`}>
                    <div className="min-h-0">
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Net Revenue</span>
                            <div className="flex shrink-0 items-center gap-1 rounded-full border border-blue-500/30 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                                <ArrowUpRight className="h-3 w-3" /> {demoMode ? '12.5%' : 'Active'}
                            </div>
                        </div>
                        <div className="mb-4 flex items-baseline gap-1">
                            <PrivacyBlur strength="strong" className={`font-sans font-medium tracking-tight text-zinc-900 dark:text-white ${revenueAmountClass} tracking-tighter leading-[0.95]`}>${securedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur>
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
                                        <stop offset="5%" stopColor={chartAccent} stopOpacity={1} />
                                        <stop offset="95%" stopColor={chartAccent} stopOpacity={0} />
                                    </linearGradient>
                                    <filter id="shadow" height="200%">
                                        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor={chartAccent} floodOpacity="0.8" />
                                    </filter>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke={chartAccent} strokeWidth={3} fill="url(#colorHeroMini)" filter="url(#shadow)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )
        },
        {
            id: 'storage',
            render: () => (
                <div className="absolute inset-0 z-10 flex h-full flex-col justify-between overflow-hidden border border-zinc-200/50 bg-editorial transition-all duration-700 ease-in-out dark:border-white/[0.06] dark:bg-white/[0.04]">
                    <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]" style={{ backgroundImage: CYCLING_WIDGET_NOISE, backgroundRepeat: 'repeat' }} />
                    <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl dark:bg-sky-500/10" />
                    <div className={`relative z-10 flex h-full min-h-0 flex-col justify-between ${slidePad}`}>
                        <div>
                            <span className="mb-3 block border-l-2 border-blue-500 pl-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:border-lime-400 dark:text-zinc-400">
                                Project storage
                            </span>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="shrink-0 rounded-xl border border-zinc-200/60 bg-white/80 p-2.5 text-zinc-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-zinc-200">
                                        <HardDrive className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Native storage</p>
                                        <p className="truncate text-xs font-medium text-zinc-600 dark:text-zinc-300">Mixed assets · 30 GB ceiling</p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-lg border border-zinc-200/60 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-zinc-800 dark:border-white/10 dark:bg-white/10 dark:text-white">
                                    {formatBytes(demoRemainingNativeStorageBytes)} free
                                </span>
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 sm:gap-4">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span className={`font-sans font-medium tracking-tight text-zinc-900 tabular-nums dark:text-white ${storageHeroClass}`}>
                                    {Math.round(demoUsedNativeStorageBytes / (1024 ** 3))}
                                </span>
                                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">GB used</span>
                                <span className="w-full text-[11px] font-medium text-zinc-500 dark:text-zinc-400 sm:w-auto sm:pl-2">of 30 GB provisioned</span>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/5">
                                    <div className="h-full w-[50%] bg-indigo-500" />
                                    <div className="h-full w-[30%] bg-sky-400" />
                                    <div className="h-full w-[20%] bg-blue-400" />
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Video ~10 GB</span>
                                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Images ~6 GB</span>
                                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Docs ~4 GB</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-start border-t border-zinc-200/50 pt-4 dark:border-white/[0.06]">
                            <button type="button" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
                                Manage files <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
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
                <div className="absolute inset-0 flex h-full min-h-0 overflow-hidden bg-zinc-50 transition-all duration-700 ease-in-out dark:bg-charcoal">
                    <div className={`flex min-h-0 flex-col transition-all duration-500 ${isReplying ? 'w-1/2 border-r border-zinc-200/50 dark:border-white/5' : 'w-full'}`}>
                        <div className={`flex min-h-0 flex-1 flex-col ${slidePad}`}>
                            <div className="flex shrink-0 items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">New Feedback</span>
                                </div>
                                <span className="shrink-0 text-[10px] font-mono text-zinc-400">{rev ? fmtTime(rev.createdAt) : '—'}</span>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto py-2 sm:py-3">
                                {rev ? (
                                    <p className={`font-serif tracking-tight text-zinc-900 transition-all duration-500 dark:text-zinc-100 ${feedbackQuoteClass(isReplying)}`}>
                                        &ldquo;{rev.message}&rdquo;
                                    </p>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 py-4 opacity-60">
                                        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">No open feedback</span>
                                        <span className="text-center text-xs text-zinc-400">Client revision requests will appear here</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-zinc-200/60 pt-3 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                    {rev?.clientAvatar ? (
                                        <img src={rev.clientAvatar} alt={rev.clientName} className="h-8 w-8 shrink-0 rounded-full border border-zinc-200/50 bg-white dark:border-white/10" />
                                    ) : (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200/50 bg-zinc-200 text-[10px] font-bold text-zinc-500 dark:border-white/10 dark:bg-white/10">
                                            {rev ? rev.clientName.charAt(0) : '?'}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <span className="block truncate text-xs font-semibold text-zinc-900 dark:text-white">{rev?.clientName ?? 'No requests'}</span>
                                        <span className="block truncate text-[9px] font-mono uppercase tracking-wider text-zinc-400">{rev?.projectName ?? '—'}</span>
                                    </div>
                                </div>
                                {!isReplying && rev && (
                                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                        <button type="button" className="rounded-lg border border-transparent px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:border-zinc-200/50 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-white">
                                            Mark Resolved
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsReplying(true)}
                                            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white transition-transform hover:scale-[1.02] dark:bg-white dark:text-zinc-950"
                                        >
                                            Reply <ArrowRight className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        className={`flex min-h-0 flex-col bg-white transition-all duration-500 dark:bg-charcoal ${
                            isReplying ? `h-full w-1/2 min-w-0 translate-x-0 opacity-100 ${slidePad}` : 'w-0 translate-x-full overflow-hidden p-0 opacity-0'
                        }`}
                    >
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Reply to {rev?.clientName ?? 'Client'}</span>
                            <button type="button" onClick={() => setIsReplying(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <textarea
                            className="min-h-[100px] w-full flex-1 resize-none rounded-xl border border-zinc-200/50 bg-zinc-50 p-3 text-sm text-zinc-900 transition-colors focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-500"
                            placeholder="Type your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="mt-3 flex justify-start">
                            <button
                                type="button"
                                onClick={() => { setIsReplying(false); setReplyText(''); playSuccess(); }}
                                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-950 shadow-sm transition-transform hover:scale-[1.02]"
                            >
                                Send <Send className="h-3 w-3" />
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
                <div className={`absolute inset-0 ${slidePad} z-10 flex min-h-0 flex-col justify-between border border-zinc-200/40 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white shadow-2xl shadow-black/20 transition-all duration-700 ease-in-out dark:border-white/10`}>
                    <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl dark:bg-[#323242]/30" />
                    <div className="relative z-10 flex h-full min-h-0 flex-col justify-between">
                    <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-blue-500 text-zinc-950 shadow-sm">Upgrade</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Business Tier</span>
                    </div>
                            <h3 className="mb-2 font-sans font-medium leading-tight tracking-tight text-[clamp(1.1rem,calc(0.85rem+1.8vw),1.85rem)] text-white sm:text-[clamp(1.2rem,calc(0.95rem+1.5vw),2.15rem)]">
                                Unlock unlimited project history.
                            </h3>
                            <p className="max-w-[95%] text-xs leading-relaxed text-zinc-300 opacity-90 sm:text-sm dark:text-zinc-400">Get advanced reporting and client portals.</p>
                        </div>
                        <button type="button" className="mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-400 transition-all hover:gap-3 dark:text-blue-400">
                            View Plans <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )
        },
        {
            id: 'live_activity',
            render: () => (
                <div className={`absolute inset-0 ${slidePad} z-10 flex min-h-0 flex-col justify-between overflow-hidden bg-zinc-900 transition-all duration-700 ease-in-out dark:bg-[#23232e]`}>
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
                            <div className="min-w-0">
                                <h3 className="truncate text-[clamp(0.95rem,calc(0.82rem+0.6vw),1.15rem)] font-bold leading-tight text-white">Mike Ross</h3>
                                <p className="truncate text-xs text-white/60">Vertex Corp</p>
                            </div>
                        </div>
                        <p className="font-sans text-[clamp(0.85rem,calc(0.72rem+0.9vw),1.05rem)] leading-snug tracking-tight text-white/90">
                            Currently viewing <span className="font-medium text-blue-400">Q4_Financial_Report.pdf</span>
                        </p>
                    </div>

                    <div className="relative z-10 flex justify-start">
                        <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md transition-colors hover:bg-white/20">
                            Join Session <ArrowRight className="h-3 w-3" />
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
                <div className={`absolute inset-0 ${slidePad} z-10 flex min-h-0 flex-col justify-between bg-white dark:bg-charcoal transition-all duration-700 ease-in-out`}>
                    <div className="min-h-0">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Net Revenue</span>
                            <div className="flex shrink-0 items-center gap-1 rounded-full border border-blue-500/30 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                                <ArrowUpRight className="h-3 w-3" /> {paidProjects.length} closed
                                </div>
                        </div>
                        <div className="mb-4 flex items-baseline gap-1">
                            <PrivacyBlur strength="strong" className={`font-sans font-medium tracking-tight text-zinc-900 dark:text-white ${revenueAmountClass} tracking-tighter leading-[0.95]`}>${securedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur>
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
                                        <stop offset="5%" stopColor={chartAccent} stopOpacity={1} />
                                        <stop offset="95%" stopColor={chartAccent} stopOpacity={0} />
                                            </linearGradient>
                                    <filter id="shadowLive" height="200%">
                                        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor={chartAccent} floodOpacity="0.8" />
                                            </filter>
                                        </defs>
                                <Area type="monotone" dataKey="v" stroke={chartAccent} strokeWidth={3} fill="url(#colorHeroMiniLive)" filter="url(#shadowLive)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                    </div>
                </div>
            )
        },
        {
            id: 'storage',
            render: () => (
                <div className="absolute inset-0 z-10 flex h-full flex-col justify-between overflow-hidden border border-zinc-200/50 bg-editorial transition-all duration-700 ease-in-out dark:border-white/[0.06] dark:bg-white/[0.04]">
                    <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]" style={{ backgroundImage: CYCLING_WIDGET_NOISE, backgroundRepeat: 'repeat' }} />
                    <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl dark:bg-sky-500/10" />
                    <div className={`relative z-10 flex h-full min-h-0 flex-col justify-between ${slidePad}`}>
                        <div>
                            <span className="mb-3 block border-l-2 border-blue-500 pl-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:border-lime-400 dark:text-zinc-400">
                                Project storage
                            </span>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="shrink-0 rounded-xl border border-zinc-200/60 bg-white/80 p-2.5 text-zinc-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-zinc-200">
                                        <HardDrive className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">All projects</p>
                                        <p className="truncate text-xs font-medium text-zinc-600 dark:text-zinc-300">{totalFiles} files indexed</p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-lg border border-zinc-200/60 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-zinc-800 dark:border-white/10 dark:bg-white/10 dark:text-white">
                                    {projects.length} project{projects.length === 1 ? '' : 's'}
                                </span>
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 sm:gap-4">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span className={`font-sans font-medium tracking-tight text-zinc-900 tabular-nums dark:text-white ${storageHeroClass}`}>
                                    {formatBytes(totalBytes)}
                                </span>
                                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Total bytes</span>
                                <span className="w-full text-[11px] font-medium text-zinc-500 dark:text-zinc-400 sm:w-auto sm:pl-2">Across your workspace</span>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/5">
                                    {(storageBreakdown.length > 0 ? storageBreakdown : [{ label: 'Empty', bytes: 1, color: 'bg-zinc-300 dark:bg-white/10' }]).map((item) => (
                                        <div
                                            key={item.label}
                                            className={`h-full ${item.color}`}
                                            style={{ width: `${storageTotal > 0 ? (item.bytes / storageTotal) * 100 : 100}%` }}
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    {(storageBreakdown.length > 0 ? storageBreakdown : [{ label: 'No files', bytes: 0, color: 'bg-zinc-300' }]).map((item) => (
                                        <span key={item.label} className="flex items-center gap-1.5">
                                            <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} /> {item.label}{' '}
                                            <span className="font-normal opacity-90">({item.bytes > 0 ? formatBytes(item.bytes) : '0 B'})</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-zinc-200/50 pt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:border-white/[0.06] dark:text-zinc-400">
                            <span>{activeClients} active client{activeClients === 1 ? '' : 's'}</span>
                            <button type="button" onClick={() => { playClick(); navigate('/vault'); }} className="flex items-center gap-2 text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
                                Manage files <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'activity',
            render: () => (
                <div className={`absolute inset-0 ${slidePad} z-10 flex min-h-0 flex-col justify-between overflow-hidden bg-zinc-900 transition-all duration-700 ease-in-out dark:bg-[#23232e]`}>
                    <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="relative z-10 flex items-start justify-between gap-3">
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
                                    <div className="min-w-0">
                                        <h3 className="truncate text-[clamp(0.95rem,calc(0.82rem+0.6vw),1.15rem)] font-bold leading-tight text-white">{recentProject.client.name || recentProject.client.company || 'Client'}</h3>
                                        <p className="truncate text-xs text-white/60">{recentProject.client.company || recentProject.name}</p>
                                    </div>
                                </div>
                                <p className="font-sans text-[clamp(0.85rem,calc(0.72rem+0.9vw),1.05rem)] leading-snug tracking-tight text-white/90">
                                    {recentProject.clientViewedAt ? 'Last viewed' : 'Most recent project'}{' '}
                                    <span className="font-medium text-blue-400">{recentProject.name}</span>
                                </p>
                                <p className="mt-2 text-[10px] uppercase tracking-widest text-white/50">
                                    {recentProject.status.replace(/_/g, ' ')} • ${recentProject.amount.toLocaleString()}
                                </p>
                            </>
                        ) : (
                            <div>
                                <h3 className="mb-2 font-sans text-[clamp(1.1rem,calc(0.95rem+1vw),1.65rem)] font-medium tracking-tight text-white">No project activity yet.</h3>
                                <p className="max-w-sm text-xs leading-relaxed text-white/70 sm:text-sm">Create your first project to start tracking client views, payments, and delivery activity here.</p>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 flex justify-start">
                        <button type="button" onClick={() => { playClick(); navigate(recentProject ? '/activity' : '/create'); }} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md transition-colors hover:bg-white/20">
                            {recentProject ? 'Open Activity' : 'Create Project'} <ArrowRight className="h-3 w-3" />
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
            <div className={`w-full bg-transparent relative ${compact ? 'h-[250px] p-5 sm:p-6' : 'h-[280px] p-6 sm:p-8'}`}>
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
            className={`w-full bg-transparent relative group transition-all ${compact ? 'h-[250px]' : 'h-[280px]'}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >

            {/* Progress Bar */}
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-zinc-100 dark:bg-white/5 z-30 rounded-b-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div 
                    className="h-full bg-blue-500 text-zinc-900 shadow-sm dark:bg-blue-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(101,163,13,0.5)]"
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

const DashboardView = ({ projects, user, headerVariant = 'default' }: { projects: Project[], user: UserProfile, headerVariant?: 'default' | 'greeting' }) => {
    // ... same as before
    const navigate = useNavigate();
    const location = useLocation();
    const { openSearch, isCompactContent = false } = useOutletContext<{ privacyMode: boolean; openSearch?: () => void; isCompactContent?: boolean }>();
    const greetingName = useMemo(() => {
        const fullName = (user?.name || '').trim();
        return fullName ? fullName.split(/\s+/)[0] : 'there';
    }, [user?.name]);
    const greetingLine = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning,';
        if (hour < 18) return 'Good afternoon,';
        return 'Good evening,';
    }, []);
    const shouldUseGreetingHeader = headerVariant === 'greeting' || window.innerWidth < 880;
    const [projectTab, setProjectTab] = useState<'pending' | 'draft' | 'paid'>('pending');
    const [briefingPulse, setBriefingPulse] = useState(false);
    const briefingPulseLocationKeyRef = useRef<string | null>(null);

    // Projects / Clients toggle G�� reads ?view=clients from URL so command palette can deep-link
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
        <div className="space-y-6 animate-slide-up relative z-10 pb-24 lg:pb-12">
            <div className="flex flex-col gap-6 border-b border-zinc-200/50 dark:border-white/5 pb-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                            <span>Workspace</span>
                            <span className="text-zinc-300 dark:text-zinc-600">.</span>
                            <span className="font-mono font-normal tracking-normal normal-case text-zinc-500 dark:text-zinc-400">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        </div>
                        {shouldUseGreetingHeader ? (
                            <h1 className="font-serif tracking-tight text-3xl md:text-5xl text-zinc-900 dark:text-white leading-[1.05] mb-2">
                                {greetingLine}{' '}
                                <span className="italic text-lime-400 dark:text-blue-400">{greetingName}</span>.
                            </h1>
                        ) : (
                            <h1 className="font-sans tracking-tight text-3xl md:text-5xl text-zinc-900 dark:text-white leading-[1.05] mb-2">
                                Dashboard
                            </h1>
                        )}
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed mb-5">
                            Here&apos;s your project overview for today.
                        </p>
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
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                    All caught up - nothing pending.
                                </p>
                            );
                            const colorMap = {
                                amber: 'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200',
                                blue: 'text-zinc-900 dark:text-zinc-100 hover:text-zinc-950 dark:hover:text-white',
                                lime: 'text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200',
                                slate: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200',
                            };
                            return (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    {chips.map((chip, i) => (
                                        <button key={i} type="button" onClick={() => { playClick(); chip.action(); }} className={`inline-flex items-center gap-2 text-left text-[11px] font-bold transition-colors underline-offset-4 hover:underline ${colorMap[chip.color]}`}>
                                            <chip.icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                            <span>{chip.label}{chip.value && <span className="font-mono font-normal opacity-80"> . {chip.value}</span>}</span>
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                    <div className="flex flex-col gap-4 shrink-0 lg:items-end">
                        <button type="button" onClick={() => { playClick(); navigate('/create'); }} className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-500 text-zinc-950 font-bold text-xs uppercase tracking-widest hover:opacity-95 transition-opacity shadow-sm w-full sm:w-auto">
                            <Plus className="w-4 h-4" /> New Project
                        </button>
                        <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 lg:justify-end">
                            {([
                                { label: 'Projects', to: '/vault', icon: LockKeyhole },
                                { label: 'Activity', to: '/activity', icon: ActivityIcon },
                                { label: 'Reports', to: '/reports', icon: BarChart3 },
                            ] as const).map((item, idx) => (
                                <span key={item.label} className="inline-flex items-center">
                                    {idx > 0 && <span className="mx-2 text-zinc-300 dark:text-zinc-600 select-none" aria-hidden>.</span>}
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); navigate(item.to); }}
                                        className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors py-1"
                                    >
                                        <item.icon className="w-3.5 h-3.5" />
                                        {item.label}
                                    </button>
                                </span>
                            ))}
                            {openSearch && (
                                <>
                                    <span className="mx-2 text-zinc-300 dark:text-zinc-600 select-none" aria-hidden>.</span>
                                    <button type="button" onClick={() => { playClick(); openSearch(); }} className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors py-1">
                                        <Search className="w-3.5 h-3.5" />
                                        Search
                                    </button>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Projects / Clients toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="inline-flex self-start max-w-full p-1 rounded-2xl bg-zinc-200/60 dark:bg-black/40 border border-zinc-200/50 dark:border-white/[0.08]">
                <button
                    type="button"
                    onClick={() => { playClick(); setDashView('projects'); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${dashView === 'projects' ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white dark:shadow-[0_0_0_1px_rgba(0,0,0,0.08)]' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200'}`}
                >
                    <FolderLock className="w-3.5 h-3.5" /> Projects
                </button>
                <button
                    type="button"
                    onClick={() => { playClick(); setDashView('clients'); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${dashView === 'clients' ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white dark:shadow-[0_0_0_1px_rgba(0,0,0,0.08)]' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200'}`}
                >
                    <Users className="w-3.5 h-3.5" /> Clients
                </button>
                </div>
            </div>

            {dashView === 'clients' && <ClientRolodexContent />}

            {dashView === 'projects' && <>

            {/* Status Ribbon - Now part of dashboard logic */}
            <StatusRibbon projects={projects} user={user} />

            <div className={`grid grid-cols-1 gap-4 md:gap-5 ${isCompactContent ? '' : 'lg:grid-cols-12'}`}>
                <div className={`flex flex-col ${isCompactContent ? 'gap-4 md:gap-5' : 'lg:col-span-7 gap-3 md:gap-4 min-w-0'}`}>
                    <div className={`grid grid-cols-1 items-start gap-4 md:gap-5 ${isCompactContent ? '' : 'lg:grid-cols-2'}`}>
                        
                        {/* CYCLING WIDGET — Card shell matches ClientCard / dashboard lift on hover; items-start prevents grid stretch “beard” below fixed-height carousel */}
                        <Card noPadding className="relative h-fit w-full min-w-0 overflow-hidden !rounded-[2rem] shadow-sm">
                            <CyclingWidget projects={projects} compact={isCompactContent} />
                        </Card>

                        <Widget
                            title={"Today's Priorities"}
                            titleIcon={Siren}
                            surfaceless
                            titleClassName="font-serif text-[0.975rem] md:text-[1.22rem] font-medium tracking-tight text-zinc-900 dark:text-white"
                            headerClassName="px-4 pt-3 pb-2"
                            actions={<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">{alerts.length} Actions</span>}
                        >
                            <div className="flex-1 flex flex-col gap-3">
                                {alerts.length === 0 ? (
                                    <div className="bg-zinc-50 dark:bg-[#23232e]/45 border-2 border-dashed border-zinc-200/50 dark:border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center flex-1 min-h-[220px]">
                                        <div className="w-14 h-14 rounded-[1.25rem] bg-white dark:bg-white/5 flex items-center justify-center mb-4 shadow-sm border border-zinc-100 dark:border-white/10">
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
                                        className="bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/5 p-4 rounded-[2rem] flex items-center gap-3 hover:border-zinc-200/50 dark:hover:border-white/20 transition-all cursor-pointer group shadow-sm"
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
                        </Widget>
                    </div>

                    {/* Live Client Radar */}
                    <Widget title={"Live Client Radar"} titleIcon={ActivityIcon} surfaceless titleClassName="font-serif text-[0.975rem] md:text-[1.22rem] font-medium tracking-tight text-zinc-900 dark:text-white" headerClassName="px-4 pt-2 pb-2">
                        {liveClients.length === 0 ? (
                            <div className="rounded-[2rem] border border-dashed border-zinc-200/50 dark:border-white/15 p-6 text-center bg-white/70 dark:bg-white/[0.02]">
                                <Monitor className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">No active client sessions.</p>
                                <p className="text-xs text-zinc-400 mt-1">Recent client activity appears here once someone opens a project link.</p>
                            </div>
                        ) : (
                        <div className={`grid grid-cols-1 gap-4 ${isCompactContent ? '' : 'lg:grid-cols-3'}`}>
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
                    </Widget>

                    <Widget
                        title={"Active Projects"}
                        surfaceless
                        titleClassName="font-serif text-[0.975rem] md:text-[1.22rem] font-medium tracking-tight text-zinc-900 dark:text-white"
                        headerClassName="px-4 pt-2 pb-2"
                        actions={(
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
                        )}
                        className="border-none bg-transparent shadow-none rounded-[2rem]"
                    >
                        <div className="flex flex-col">
                            {filteredProjects.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center opacity-80 border-2 border-dashed border-zinc-200/50 dark:border-white/10 rounded-3xl m-4 bg-transparent">
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
                                        className="group flex flex-col md:flex-row md:items-center justify-between py-6 border-b border-transparent dark:border-transparent hover:border-zinc-100 dark:hover:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 px-4 -mx-4 rounded-xl transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="font-mono text-xs text-zinc-300 dark:text-zinc-600 w-8">{(i + 1).toString().padStart(2, '0')}</span>
                                            <div className="relative">
                                                <img src={p.client.avatar} loading="lazy" className="w-12 h-12 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#23232e] ${p.status === 'paid' ? 'bg-blue-500 text-zinc-900 shadow-sm' : 'bg-amber-500'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-serif text-lg font-normal tracking-tight text-zinc-900 dark:text-zinc-100 transition-[font-weight] group-hover:font-semibold">{p.name}</h3>
                                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{p.client.company || p.client.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 mt-4 md:mt-0">
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
                                            <div className="w-8 h-8 rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-200 group-hover:bg-blue-500 group-hover:border-blue-600 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:border-zinc-200 dark:group-hover:text-zinc-900 transition-all">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4">
                            <button onClick={() => navigate('/reports?focus=audit')} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 group transition-colors">
                            View Full Ledger <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    </Widget>
                </div>
                {/* Briefing Sidebar — wider column (5/12) from lg so it isn’t squeezed next to main */}
                <div className={`${isCompactContent ? 'p-2 md:p-3 flex flex-col h-[calc(100vh-140px)]' : 'lg:col-span-5 p-2 md:p-3 flex flex-col lg:min-w-0 lg:max-w-none lg:h-[calc(100vh-140px)] lg:sticky lg:top-24'}`}> 
                    <div className={`relative flex-1 h-full overflow-visible min-w-0 ${briefingPulse ? 'widget-highlight-shell widget-highlight-double' : ''}`}> 
                    <div className="flex flex-col flex-1 pb-2 h-full overflow-hidden p-4 sm:p-5 lg:p-6 transition-[box-shadow,border-color] duration-700 lg:ml-[-0.75rem] xl:ml-[-1.5rem]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-serif text-2xl text-zinc-900 dark:text-white">Briefing</h3>
                                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-bold">Daily Timeline</p>
                            </div>
                            <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors border border-zinc-200/50 dark:border-white/10">
                                <Filter className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto relative pr-2 pl-3 custom-scrollbar briefing-scroll">
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
    const { isCompactContent = false } = useOutletContext<{ isCompactContent?: boolean }>();
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
            downloadBlob(`Heartifact_Invoice_${project.name.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob);
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
            downloadBlob(`Heartifact_Receipt_${project.name.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob);
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
        <div className="space-y-6 animate-slide-up relative z-10 pb-24 lg:pb-12">
            {/* ... Content same as previously provided, preserving logic ... */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
                <div>
                    <h2 className={`${isCompactContent ? 'text-3xl' : 'text-4xl'} font-sans tracking-tight font-medium tracking-tight text-zinc-900 dark:text-white`}>
                        Your Projects
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base mt-1">
                        Secure delivery pipeline and asset management.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/trash')} className="h-12 px-5 rounded-full border border-red-200 dark:border-red-500/25 bg-white dark:bg-white/5 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/12 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] shadow-sm">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Trash</span>
                    </button>
                    <button onClick={() => navigate('/create')} className="h-12 px-8 rounded-2xl bg-blue-500 text-zinc-950 font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition-colors hover:opacity-95">
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>
            </div>
            {/* ... Rest of Vault View ... */}
            {/* overflow-visible: overflow-hidden clipped pill radii on the filter row; hf-no-glow avoids hf-surface ::after artifacts */}
            <div className={`hf-surface hf-no-glow ${isCompactContent ? 'flex flex-col gap-2 sm:gap-3' : 'flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3'} items-stretch bg-white dark:bg-charcoal p-2 rounded-[2rem] overflow-visible border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md`}>
                <div className={`relative w-full group min-w-0 ${isCompactContent ? '' : 'lg:flex-1'}`}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects, clients, or files..."
                        className="w-full h-11 sm:h-12 pl-12 pr-4 rounded-[2rem] bg-transparent text-sm focus:bg-white dark:focus:bg-white/5 outline-none transition-all placeholder:text-zinc-500"
                    />
                </div>
                <div className={`flex items-center gap-2 overflow-x-auto w-full no-scrollbar py-1 pl-1 pr-1 ${isCompactContent ? '' : 'lg:w-auto lg:flex-1 lg:justify-end'}`}>
                    {[
                        { key: 'all', label: 'All Projects' },
                        { key: 'active', label: 'Active' },
                        { key: 'paid', label: 'Paid' },
                        { key: 'archived', label: 'Archived' },
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => setVaultFilter(filter.key as 'all' | 'active' | 'paid' | 'archived')}
                            className={`px-4 sm:px-6 py-2.5 rounded-[2rem] text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${vaultFilter === filter.key ? 'bg-white dark:bg-white/10 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5'}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-zinc-300 dark:bg-white/10 mx-2" />
                    <button onClick={() => { playClick(); setVaultLayout('grid'); }} className={`p-2.5 rounded-[2rem] transition-colors shrink-0 ${vaultLayout === 'grid' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5'}`} title="Card view"><LayoutGrid className="w-5 h-5" /></button>
                    <button onClick={() => { playClick(); setVaultLayout('list'); }} className={`p-2.5 rounded-[2rem] transition-colors shrink-0 ${vaultLayout === 'list' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5'}`} title="List view"><ListIcon className="w-5 h-5" /></button>
                </div>
            </div>
            {/* Empty state */}
            {visibleProjects.length === 0 && (
                <div className="hf-surface py-24 flex flex-col items-center justify-center opacity-90 border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md rounded-[2rem] overflow-hidden bg-white dark:bg-charcoal m-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-white/5 flex items-center justify-center mb-6 shadow-sm border border-zinc-100 dark:border-white/10">
                        {searchQuery ? <Search className="w-10 h-10 stroke-[1.5] text-zinc-400" /> : <LockKeyhole className="w-10 h-10 stroke-[1.5] text-zinc-400" />}
                                            </div>
                    
                    {searchQuery ? (
                        <>
                            <h3 className="font-sans tracking-tight text-2xl text-zinc-900 dark:text-white mb-2">No results found</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-[300px]">
                                We couldn't find any projects matching "{searchQuery}". Try adjusting your filters or search terms.
                            </p>
                            <button onClick={() => { playClick(); setSearchQuery(''); }} className="px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-700 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors">
                                Clear Search
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="font-sans tracking-tight text-2xl text-zinc-900 dark:text-white mb-2">No Projects Yet</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-[320px] leading-relaxed">
                                Create your first project to organize deliverables, share files, and track payments in one place.
                            </p>
                            <button onClick={() => { playClick(); navigate('/create'); }} className="px-8 py-4 rounded-2xl bg-zinc-900 dark:bg-blue-500 text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center gap-3 shadow-xl shadow-zinc-900/10 dark:shadow-blue-500/10">
                                <Plus className="w-5 h-5" /> Create First Project
                            </button>
                        </>
                    )}
                                        </div>
            )}

            {/* â”€â”€ List view â”€â”€ */}
            {vaultLayout === 'list' && visibleProjects.length > 0 && (
                <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden">
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

            {/* ―― Grid / card view ―― */}
            <div className={`grid grid-cols-1 ${isCompactContent ? 'gap-4' : 'gap-6 lg:gap-8'} ${vaultLayout === 'list' ? 'hidden' : ''}`}>
                {visibleProjects.map((project, projectIndex) => (
                    <div 
                        key={project.id} 
                        className={`group relative w-full bg-white dark:bg-charcoal ${isCompactContent ? 'rounded-[1.75rem]' : 'rounded-[2.5rem]'} overflow-hidden border border-zinc-200/50 dark:border-white/[0.04] shadow-sm hover:shadow-2xl transition-all ${isCompactContent ? 'duration-300' : 'duration-500 hover:-translate-y-2'} animate-slide-up`}
                        style={{ animationDelay: `${projectIndex * 100}ms`, animationFillMode: 'both' }}
                    >
                        {/* Holographic Glass Sheen */}
                        <style>{`
                            @keyframes glass-sweep {
                                0% { transform: translateX(-150%) skewX(-15deg); }
                                20%, 100% { transform: translateX(250%) skewX(-15deg); }
                            }
                        `}</style>
                        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${isCompactContent ? 'rounded-[1.75rem]' : 'rounded-[2.5rem]'} z-0`}>
                            <div className="absolute top-0 right-1/2 w-3/4 h-[200%] -translate-y-1/4 bg-gradient-to-r from-transparent via-white/35 dark:via-white/20 to-transparent blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 [animation-play-state:paused] group-hover:[animation-play-state:running]" style={{ animation: `glass-sweep ${12 + (projectIndex * 2)}s infinite ease-out` }} />
                                    </div>
                        
                        <div className={`relative z-10 flex flex-col ${isCompactContent ? 'min-h-[300px]' : 'lg:flex-row min-h-[360px]'}`}>
                            {/* Left Pillar: Typography & Status */}
                            <div className={`${isCompactContent ? 'p-5' : 'lg:w-[45%] p-8 lg:p-12'} relative overflow-hidden flex flex-col justify-between`}>
                                <div className="absolute inset-0 opacity-[0.12] dark:opacity-[0.05] pointer-events-none mix-blend-multiply dark:mix-blend-overlay z-0" style={{ backgroundImage: NOISE_SVG, backgroundSize: '360px 360px', filter: 'contrast(104%) brightness(102%)' }} />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-md ${project.status === 'paid' ? 'bg-blue-50/50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : 'bg-zinc-50/50 border-zinc-200 text-zinc-600 dark:bg-white/5 dark:border-white/10 dark:text-zinc-300'}`}>
                                            <div className={`w-2 h-2 rounded-full ${project.status === 'paid' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-zinc-400'} animate-pulse`} />
                                            {project.status === 'paid' ? 'Access granted' : 'Assets locked'}
                                        </div>
                                        <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600 font-bold tracking-widest uppercase">ID/{project.id.slice(0,6)}</span>
                                        </div>
                                    
                                    <h3 
                                        className={`${isCompactContent ? 'text-3xl' : 'text-4xl lg:text-5xl'} font-sans tracking-tight font-medium text-zinc-900 dark:text-white leading-[1.1] mb-6 cursor-pointer group-hover:font-extrabold transition-all duration-300`}
                                        onClick={() => navigate(`/preview/${project.id}`, { state: { from: location.pathname } })}
                                    >
                                        {project.name}
                                    </h3>
                                    
                                    <div className="flex items-center gap-4 group/client cursor-pointer w-fit">
                                        <img src={project.client.avatar} className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-800 shadow-md transition-all duration-300 group-hover/client:ring-2 group-hover/client:ring-blue-500 group-hover/client:ring-offset-2 dark:group-hover/client:ring-offset-charcoal" />
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Prepared For</div>
                                            <div className="text-sm font-bold text-zinc-900 dark:text-white group-hover/client:text-blue-600 dark:transition-colors">{project.client.name}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`relative z-10 mt-8 w-full min-w-0 sm:mt-12`}>
                                    <div className="grid w-full min-w-0 grid-cols-1 gap-4 min-[480px]:grid-cols-3 sm:gap-6">
                                        <div className="flex min-w-0 items-center gap-4">
                                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                                                <svg className="absolute inset-0 h-full w-full -rotate-90">
                                                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-zinc-100 dark:text-white/5" />
                                                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray="138" strokeDashoffset={138 - (138 * Math.min(project.amount / 10000, 1))} strokeLinecap="round" className="text-blue-500 transition-all duration-1000 ease-out" />
                                                </svg>
                                                <DollarSign className="relative h-4 w-4 text-zinc-400" />
                            </div>
                                            <div className="min-w-0">
                                                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Value</div>
                                                <PrivacyBlur className="text-2xl font-sans font-medium tracking-tight text-zinc-900 dark:text-white min-[480px]:text-3xl">${project.amount.toLocaleString()}</PrivacyBlur>
                                            </div>
                                                </div>
                                        <div className="flex min-w-0 items-center gap-4 border-t border-zinc-200/50 pt-4 min-[480px]:border-t-0 min-[480px]:border-l min-[480px]:border-zinc-200/50 min-[480px]:pt-0 min-[480px]:pl-6 dark:border-white/10">
                                            <div className="flex h-10 shrink-0 items-end gap-[3px] py-1.5">
                                                {[40, 70, 100, 50, 80].map((h, idx) => (
                                                    <div key={idx} className="relative w-1.5 overflow-hidden rounded-t-sm bg-blue-500/10 dark:bg-blue-400/10" style={{ height: '100%' }}>
                                                        <div className="absolute bottom-0 left-0 w-full bg-blue-500 dark:bg-blue-400" style={{ height: `${h}%`, animation: `pulse-height 2s infinite ease-in-out`, animationDelay: `${idx * 200}ms` }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Assets</div>
                                                <div className="font-mono text-2xl text-zinc-900 dark:text-white min-[480px]:text-3xl">{project.files.length}</div>
                                            </div>
                                        </div>
                                        <div className="flex min-w-0 items-center gap-4 border-t border-zinc-200/50 pt-4 min-[480px]:border-t-0 min-[480px]:border-l min-[480px]:border-zinc-200/50 min-[480px]:pt-0 min-[480px]:pl-6 dark:border-white/10">
                                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-200/70 bg-white/80 dark:border-white/10 dark:bg-white/5">
                                                <Eye className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Views</div>
                                                <div className="font-mono text-2xl text-zinc-900 tabular-nums dark:text-white min-[480px]:text-3xl">{project.accessConfig?.viewCount ?? (project.clientViewedAt ? 1 : 0)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Pillar: Visual Showcase */}
                            <div className={`${isCompactContent ? 'relative flex flex-col p-5 border-t border-zinc-200/30 dark:border-white/[0.04]' : 'lg:w-[55%] relative flex flex-col p-8 lg:p-12 border-t lg:border-t-0 lg:border-l border-zinc-200/30 dark:border-white/[0.04]'}`}>
                                {/* Asset Gallery Stack */}
                                <div className="flex-1 flex items-center justify-start mb-8 relative">
                                    <div className={`flex ${isCompactContent ? '-space-x-5' : '-space-x-8 lg:-space-x-12'} group/gallery cursor-pointer hover:space-x-2 transition-all duration-500 ease-out`}
                                         onClick={() => { playClick(); navigate(`/editor/${project.id}`); }}>
                                        {project.files.slice(0, 4).map((f, i) => (
                                            <div 
                                                key={f.id} 
                                                className={`${isCompactContent ? 'w-24 h-32' : 'w-32 h-44 lg:w-44 lg:h-56'} rounded-2xl bg-zinc-100 dark:bg-[#1a1a20] border-4 border-white dark:border-[#111113] shadow-xl overflow-hidden relative transition-all duration-500 group-hover/gallery:rotate-0 group-hover/gallery:translate-y-0! animate-slide-up`}
                                                style={{ 
                                                    zIndex: i, 
                                                    transform: `rotate(${i % 2 === 0 ? 3 : -3}deg) translateY(${i * 4}px)`,
                                                    animationDelay: `${projectIndex * 100 + i * 150 + 200}ms`,
                                                    animationFillMode: 'both'
                                                }}
                                            >
                                                {f.previewUrl ? 
                                                    <img src={f.previewUrl} loading="lazy" className="w-full h-full object-cover saturate-[1.1] opacity-95 group-hover/gallery:scale-105 transition-transform duration-700 ease-out" /> 
                                                    : <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600">{getFileIcon(f.type)}</div>
                                                }
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300" />
                                                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover/gallery:opacity-100 transition-opacity translate-y-2 group-hover/gallery:translate-y-0 duration-300">
                                                    <div className="text-[10px] lg:text-xs font-bold text-white truncate drop-shadow-md">{f.name}</div>
                                                    <div className="flex justify-between items-center mt-0.5">
                                                        <div className="text-[8px] lg:text-[9px] font-mono text-white/70 drop-shadow-md">{f.size}</div>
                                                        <div className={`text-[7px] lg:text-[8px] font-bold uppercase ${f.locked ? 'text-amber-400' : 'text-blue-300'} drop-shadow-sm`}>{f.locked ? 'Locked' : 'Open'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {project.files.length > 4 && (
                                            <div className={`${isCompactContent ? 'w-24 h-32' : 'w-32 h-44 lg:w-44 lg:h-56'} rounded-2xl bg-zinc-900 dark:bg-zinc-800 border-4 border-white dark:border-[#111113] shadow-xl overflow-hidden relative flex flex-col items-center justify-center transition-all duration-500 group-hover/gallery:rotate-0 group-hover/gallery:translate-y-0! animate-slide-up`} style={{ zIndex: 10, transform: `rotate(5deg) translateY(16px)`, animationDelay: `${projectIndex * 100 + 4 * 150 + 200}ms`, animationFillMode: 'both' }}>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center transition-opacity group-hover/gallery:opacity-0 sm:opacity-100 sm:group-hover/gallery:opacity-100">
                                                    <div className="text-2xl lg:text-3xl font-sans tracking-tight font-medium text-white mb-1">+{project.files.length - 4}</div>
                                                    <div className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">More Assets</div>
                                    </div>
                                                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover/gallery:opacity-100 sm:opacity-0 sm:group-hover/gallery:opacity-0">
                                                    {project.files.slice(4, 6).map((f) => (
                                                        <div key={f.id} className="w-8 h-10 rounded-lg overflow-hidden border border-white/20 bg-zinc-800/70">
                                                            {f.previewUrl ? (
                                                                <img src={f.previewUrl} loading="lazy" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-zinc-400">{getFileIcon(f.type)}</div>
                                                            )}
                                </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {project.files.length === 0 && (
                                            <div className={`w-full max-w-[26rem] min-w-[11rem] ${isCompactContent ? 'h-36' : 'h-44 lg:h-56'} rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 hover:border-[#65a30d] hover:bg-[#eef3df] dark:hover:border-[#bef264]/45 dark:hover:bg-[#bef264]/10 transition-colors cursor-pointer group/add animate-slide-up`} style={{ animationDelay: `${projectIndex * 100 + 200}ms`, animationFillMode: 'both' }}>
                                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 group-hover/add:bg-[#65a30d] group-hover/add:text-white dark:group-hover/add:bg-[#bef264] dark:group-hover/add:text-zinc-950 transition-colors">
                                                    <Plus className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover/add:text-[#4d7c0f] dark:group-hover/add:text-[#bef264] transition-colors">Add First Asset</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Bottom Action Bar - Premium Minimalist */}
                                <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                                    <div className="flex gap-3">
                                        <button 
                                            className="h-12 px-4 rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
                                            onClick={() => navigate(`/editor/${project.id}`)}
                                            title="Edit Project"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Edit</span>
                                        </button>
                                        
                                        <button 
                                            className="hidden sm:flex h-12 px-6 rounded-full border border-zinc-200/50 dark:border-white/10 items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
                                            title="Copy Secure Link"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy Link</span>
                                        </button>
                                        
                                        {/* Send via email */}
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
                                                const body = encodeURIComponent(`Hi ${name},\n\nYour project files are ready for review.\n\nAccess your secure delivery link here:\n${link}\n\nLet me know if you have any questions.`);
                                                window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
                                            }}
                                            className="hidden lg:flex h-12 px-6 rounded-full border border-zinc-200/50 dark:border-white/10 items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Send Push</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => handleVaultInvoicePdf(project)} disabled={downloadingPdf === project.id + '_inv'} className="hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all disabled:opacity-40" title="Download Invoice PDF">{downloadingPdf === project.id + '_inv' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}</button>
                                        <button onClick={() => handleVaultReceiptPdf(project)} disabled={downloadingPdf === project.id + '_rec'} className="hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all disabled:opacity-40" title="Download Rights Receipt">{downloadingPdf === project.id + '_rec' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}</button>
                                        <button onClick={() => { playClick(); setQrProjectId(project.id); }} className="hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all" title="Generate QR Code"><QrCode className="w-4 h-4" /></button>
                                        <button className="h-10 w-10 flex items-center justify-center rounded-full border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        <button
                                            onClick={() => { playClick(); navigate(`/preview/${project.id}`, { state: { from: location.pathname } }); }}
                                            className="h-12 pl-6 pr-2 lg:pr-3 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-black dark:hover:bg-slate-200 font-bold text-[10px] lg:text-xs uppercase tracking-widest flex items-center gap-4 transition-colors shadow-xl group/launch shrink-0"
                                        >
                                            <span className="hidden sm:inline">Launch Preview</span>
                                            <span className="sm:hidden">Preview</span>
                                            <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center">
                                                <ArrowRight className="w-3.5 h-3.5 group-hover/launch:translate-x-1 group-hover/launch:scale-110 transition-all" />
                                            </div>
                                        </button>
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
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 dark:bg-[#323242]/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-300"
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
                                <h3 className="font-sans tracking-tight text-xl font-bold text-zinc-900 dark:text-white">Project QR code</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Scan to open the client delivery</p>
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
                                    className="flex-1 py-3 rounded-xl bg-zinc-900 dark:bg-blue-500 text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-3.5 h-3.5" /> Open delivery
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
    <div className="fixed bottom-0 inset-x-0 z-[88] flex justify-center items-end pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[22rem] mx-4 mb-3 rounded-[2rem] bg-white/30 dark:bg-cosmic/60 backdrop-blur-xl border border-zinc-200/35 dark:border-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between px-1.5 py-1.5 rounded-[2rem] bg-[#f0f2f5]/40 dark:bg-cosmic/56">
            {navItems.map((item) => {
                    const isActive =
                        currentPath === item.id ||
                        (item.id === 'workspace' && (currentPath === '' || currentPath === 'app'));
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                            onMouseEnter={() => routePreloadMap[item.id]?.()}
                            onTouchStart={() => routePreloadMap[item.id]?.()}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            className={`relative flex items-center justify-center w-12 h-11 rounded-[1.375rem] transition-all duration-200 active:scale-90 ${
                                isActive
                                    ? 'bg-[#ecfccb] dark:bg-[#bef264]/10 text-[#3f6212] dark:text-[#bef264]'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                            }`}
                        >
                            <item.icon
                                className="w-[1.1rem] h-[1.1rem]"
                                strokeWidth={isActive ? 2.5 : 1.75}
                            />
                            {isActive && (
                                <span className="absolute bottom-[5px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#84cc16] dark:bg-[#bef264]" />
                            )}
                        </button>
                    );
                })}
                        </div>
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
    const [quickQuoteLines, setQuickQuoteLines] = useState<QuoteLine[]>(() =>
        normalizeWidgetQuickQuoteLines(initialDraft?.quickQuoteLines)
    );
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
    /** When on the Create tab: build a project delivery vs a quote in a dedicated panel */
    const [createSubView, setCreateSubView] = useState<'project' | 'quote'>('project');
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
        const body = `${intro}\n\nOpen your delivery link:\n${linkReady.clientUrl}\n`;
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

    const removeDraftFile = (fileId: string) => {
        playClick();
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
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
        setQuickQuoteLines([makeQuoteLine()]);
        setCreateSubView('project');
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
            files,
            quickQuoteLines,
        };
        try {
            localStorage.setItem(QUICK_DELIVERY_DRAFT_KEY, JSON.stringify(draft));
        } catch {
            // Ignore storage failures.
        }
    }, [amount, clientEmail, clientName, enableClientLibrary, enablePayment, enableTips, files, linkLabel, message, projectName, quickQuoteLines, requiresSignature, retention, sendMode, showWatermark]);

    useEffect(() => {
        try {
            window.dispatchEvent(new Event(QUICK_DELIVERY_DRAFT_CHANGED));
        } catch {
            /* ignore */
        }
    }, [files]);

    const inputCls = `w-full h-10 px-3.5 rounded-xl text-sm border outline-none transition-colors ${
        isDarkMode
            ? 'bg-white/8 border-white/10 text-white placeholder:text-zinc-400 focus:border-white/25'
            : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'
    }`;
    const sectionLineCls = isDarkMode ? 'border-white/10' : 'border-zinc-200';
    const panelSurfaceCls = isDarkMode ? 'bg-white/8' : 'bg-[#fafafa]';
    const retentionLabel = QUICK_RETENTION_OPTIONS.find((option) => option.id === retention)?.label || '3 days';

    return (
        <div ref={widgetShellRef} className={`group relative w-full sm:w-[372px] h-full rounded-[1.75rem] shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col ${
            isDarkMode
                ? 'bg-cosmic border border-white/[0.09]'
                : 'bg-[#f0f2f5] border border-zinc-200/80'
        }`}
        style={accentCssVars(isDarkMode) as React.CSSProperties}>
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
                        {widgetView === 'create'
                            ? linkReady
                                ? 'Link ready'
                                : createSubView === 'quote'
                                    ? 'Create quote'
                                    : 'Create project'
                            : widgetView === 'projects'
                                ? 'Current projects'
                                : 'Briefing'}
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
                        className={`h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 ${widgetView === 'create' ? (isDarkMode ? 'bg-[#bef264] text-zinc-950 shadow-sm shadow-black/10' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/5'}`}
                    >
                        Create
                    </button>
                    <button
                        onClick={() => {
                            playClick();
                            setWidgetView('projects');
                        }}
                        className={`h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 ${widgetView === 'projects' ? (isDarkMode ? 'bg-[#bef264] text-zinc-950 shadow-sm shadow-black/10' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/5'}`}
                    >
                        Current
                    </button>
                    <button
                        onClick={() => { playClick(); setWidgetView('briefing'); }}
                        className={`h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 ${widgetView === 'briefing' ? (isDarkMode ? 'bg-[#bef264] text-zinc-950 shadow-sm shadow-black/10' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/5'}`}
                    >
                        Briefing
                    </button>
                </div>
                {widgetView !== 'create' && (
                    <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500 text-center px-1">Use tabs to switch between active work, projects, and briefing updates.</p>
                )}

                {widgetView === 'create' && !linkReady && (
                    <div className="mt-3 shrink-0">
                        <div className={`grid grid-cols-2 gap-1 p-1 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-white/70'}`}>
                            <button
                                type="button"
                                onClick={() => {
                                    playClick();
                                    setCreateSubView('project');
                                }}
                                className={`h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 ${
                                    createSubView === 'project'
                                        ? isDarkMode
                                            ? 'bg-[#bef264] text-zinc-950 shadow-sm shadow-black/10'
                                            : 'bg-white text-zinc-900 shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/5'
                                }`}
                            >
                                Create project
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    playClick();
                                    setCreateSubView('quote');
                                }}
                                className={`h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 ${
                                    createSubView === 'quote'
                                        ? isDarkMode
                                            ? 'bg-[#bef264] text-zinc-950 shadow-sm shadow-black/10'
                                            : 'bg-white text-zinc-900 shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/5'
                                }`}
                            >
                                Create quote
                            </button>
                        </div>
                        <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500 text-center px-1">Create project handles delivery setup; Create quote is for quick pricing drafts.</p>
                    </div>
                )}

                <div className="mt-4 flex-1 min-h-0 flex flex-col">
                {widgetView === 'create' && (
                <div className="flex flex-col flex-1 min-h-0 h-full">
                {linkReady ? (
                    <div className="h-full overflow-y-auto pr-1 briefing-scroll">
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
                                    Open delivery
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
                                    className={`h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${isDarkMode ? 'bg-[#bef264] hover:bg-[#d9f99d] text-zinc-950' : 'bg-blue-600 hover:bg-blue-700 text-zinc-950'}`}
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
                    </div>
                ) : createSubView === 'quote' ? (
                <div className="flex flex-col flex-1 min-h-0 h-full">
                    <div className="shrink-0 space-y-2 mb-2">
                        <div>
                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">Title</label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Quote or project name"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">Client name</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Client or team"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">Client email</label>
                            <input
                                type="email"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                placeholder="client@company.com"
                                className={inputCls}
                            />
                        </div>
                    </div>
                    <DeliveryQuickQuote
                        isDarkMode={isDarkMode}
                        projectTitle={projectName}
                        clientName={clientName}
                        clientEmail={clientEmail}
                        lines={quickQuoteLines}
                        onLinesChange={setQuickQuoteLines}
                        onApplyToPayment={(total) => {
                            const n = Math.max(0, total);
                            setEnablePayment(true);
                            setAmount(n > 0 ? n.toFixed(2) : (amount || ''));
                            toast(
                                n > 0
                                    ? `Payment set to ${quoteCurrency.format(n)}`
                                    : 'Payment on — enter an amount or add quote lines'
                            );
                        }}
                        onOpenFullBuilder={() => {
                            playClick();
                            navigate('/quotes');
                        }}
                        panelSurfaceCls={panelSurfaceCls}
                        footerExtra={(
                            <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed px-0.5">
                                Switch to{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        playClick();
                                        setCreateSubView('project');
                                    }}
                                    className="font-bold text-zinc-600 dark:text-zinc-300 underline underline-offset-2"
                                >
                                    Create project
                                </button>
                                {' '}to add files, set payment, and publish your project.
                            </p>
                        )}
                    />
                </div>
                ) : (
                <div className="flex flex-col flex-1 min-h-0 h-full">
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 briefing-scroll">
                <>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => { playClick(); fileInputRef.current?.click(); }}
                        className={`rounded-2xl py-4 px-3 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${panelSurfaceCls}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#bef264] text-zinc-950' : 'bg-blue-600 text-zinc-950'}`}>
                            <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-zinc-800 dark:text-zinc-100">Add files</span>
                    </button>
                    <button
                        onClick={() => { playClick(); folderInputRef.current?.click(); }}
                        className={`rounded-2xl py-4 px-3 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${panelSurfaceCls}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#bef264] text-zinc-950' : 'bg-blue-600 text-zinc-950'}`}>
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
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                            {files.map((file) => (
                                <div key={file.id} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs ${panelSurfaceCls}`}>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-zinc-800 dark:text-zinc-100">{file.name}</p>
                                        <p className="text-zinc-400">{file.type.toUpperCase()}</p>
                                    </div>
                                    <span className="text-zinc-400 shrink-0 tabular-nums">{file.size}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeDraftFile(file.id)}
                                        className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15 transition-colors cursor-pointer"
                                        aria-label={`Remove ${file.name}`}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
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
                                    className={`w-full rounded-2xl px-3.5 py-2.5 border flex items-center justify-between text-left cursor-pointer ${panelSurfaceCls} ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}
                                >
                                    <span className="text-sm text-zinc-800 dark:text-zinc-100">{option.label}</span>
                                    <div className={`w-9 h-5 rounded-full flex items-center transition-colors ${option.checked ? 'bg-blue-500' : isDarkMode ? 'bg-white/10' : 'bg-zinc-200'}`}>
                                        <div
                                            className={`w-4 h-4 rounded-full shadow-sm transition-transform mx-0.5 ${option.checked ? 'translate-x-4' : ''} ${
                                                option.checked
                                                    ? isDarkMode
                                                        ? 'bg-zinc-950'
                                                        : 'bg-white'
                                                    : isDarkMode
                                                        ? 'bg-zinc-500'
                                                        : 'bg-white'
                                            }`}
                                        />
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
                        className={`w-full h-11 rounded-2xl flex items-center gap-3 px-3.5 border transition-all cursor-pointer ${enablePayment
                            ? (isDarkMode ? 'bg-blue-900/20 border-blue-700/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700')
                            : `${panelSurfaceCls} ${isDarkMode ? 'border-white/10 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`
                        }`}
                    >
                        <DollarSign className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium flex-1 text-left">
                            {enablePayment ? 'Request payment' : 'No payment gate'}
                        </span>
                        <div className={`w-8 h-4 rounded-full flex items-center transition-all ${enablePayment ? 'bg-blue-500' : (isDarkMode ? 'bg-white/10' : 'bg-zinc-200')}`}>
                            <div
                                className={`w-3 h-3 rounded-full shadow-sm transition-all mx-0.5 ${enablePayment ? 'translate-x-4' : 'translate-x-0'} ${
                                    enablePayment
                                        ? isDarkMode
                                            ? 'bg-zinc-950'
                                            : 'bg-white'
                                        : isDarkMode
                                            ? 'bg-zinc-500'
                                            : 'bg-white'
                                }`}
                            />
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
                </>
                </div>
                <div className={`shrink-0 pt-3 border-t ${sectionLineCls}`}>
                <div className="grid grid-cols-2 gap-2">
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
                        className={`h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${!canPublish || publishState === 'publishing' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${isDarkMode ? 'bg-[#bef264] hover:bg-[#d9f99d] text-zinc-950' : 'bg-blue-600 hover:bg-blue-700 text-zinc-950'}`}
                    >
                        {publishState === 'publishing' ? 'Publishing...' : 'Publish'}
                    </button>
                </div>

                <p className={`mt-3 text-center text-[10px] ${publishState === 'error' ? 'text-red-500' : publishState === 'success' ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {publishMessage || 'Draft auto-saves while you work in the widget.'}
                </p>
                </div>
                </div>
                )}
                </div>
                )}

                {widgetView === 'briefing' && (
                    <div className={`pt-3 border-t ${sectionLineCls} h-full min-h-0 flex flex-col`}>
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
                                onClick={() => { handleWidgetNavigate('/vault', 'projects'); }}
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

/** When layout is full, `/workspace` redirects here — keep ?quickstart= so onboarding copy still applies. */
const FullLayoutWorkspaceRedirect = () => {
    const { search } = useLocation();
    return <Navigate to={`/dashboard${search}`} replace />;
};

const AppLayout = ({ user, projects, isDarkMode, themeMode, onSetThemeMode, layoutMode, onSetLayoutMode, togglePrivacyMode, privacyMode, onSignOut }: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const stripOffset = useStripOffset();
    const { notifications, markNotificationRead, clearNotifications, saveProject } = useStore();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false); // NEW State
    const [isRouteMenuOpen, setIsRouteMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);
    const routeMenuRef = useRef<HTMLDivElement | null>(null);
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
    const headerHeightPx = 64;
    const [searchParams, setSearchParams] = useSearchParams();
    const [draftVersion, setDraftVersion] = useState(0);
    const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
    const [mobileLikeContext, setMobileLikeContext] = useState(() => isMobileLikeDevice());
    // DOCK_MIN_WIDTH controls when the docked workspace (widget + side panel side-by-side) can be
    // rendered. We intentionally go below Tailwind's `lg` breakpoint so mid-sized screens still get
    // the docked experience; the sidebar CSS uses a matching custom breakpoint below.
    const DOCK_MIN_WIDTH = 880;
    const dockCapable = viewportWidth >= DOCK_MIN_WIDTH;
    // Small-screen mode uses the mobile bottom-sheet interaction model.
    const isSmallScreenSheetMode = !dockCapable;
    // layoutMode stored preference: 'full' | 'dock'. We derive a third `widget-only` state on-screen.
    const effectiveLayout: 'full' | 'dock' | 'widget' =
        layoutMode === 'full' ? 'full' : dockCapable ? 'dock' : 'widget';
    const isDockMode = effectiveLayout === 'dock';
    const isWidgetOnly = effectiveLayout === 'widget';
    // In small-screen sheet mode, always show the bottom nav.
    const showMobileNav = isSmallScreenSheetMode;
    // On mobile, the delivery widget is always the persistent backdrop (even when navigating to
    // other routes which render as bottom sheets above it).
    const showBottomSheet = showMobileNav && currentPath !== 'workspace' && currentPath !== 'app' && currentPath !== '' && currentPath !== 'signin' && currentPath !== 'signup';
    // On mobile the widget is always visible as the home backdrop.
    const showDeliveryWidget = isDockMode || isWidgetOnly || showMobileNav;
    const isPanelOpen = isDockMode && currentPath !== 'workspace';
    const isCompactContent = viewportWidth < 768 || (isDockMode && isPanelOpen && viewportWidth < 1536);
    const topNavFullThreshold = layoutMode === 'full' ? 900 : 1180;
    const showDesktopNavPill = !showMobileNav && viewportWidth >= topNavFullThreshold;
    const showRouteMenu = !showMobileNav && !showDesktopNavPill;

    // In widget-only mode, routes other than /workspace have no place to render — redirect so
    // the delivery widget stays the focus. Users can flip to full mode via the top-bar toggle.
    useEffect(() => {
        if (!isWidgetOnly) return;
        // Mobile uses the bottom-sheet pattern: pages render as sheets above the widget backdrop,
        // so the redirect must not fire on small screens.
        if (showMobileNav) return;
        if (currentPath === 'workspace' || currentPath === 'signin' || currentPath === 'signup') return;
        navigate('/workspace', { replace: true });
    }, [isWidgetOnly, currentPath, navigate, showMobileNav]);

    useEffect(() => {
        const bump = () => setDraftVersion((v) => v + 1);
        window.addEventListener(QUICK_DELIVERY_EVENT, bump);
        window.addEventListener(QUICK_DELIVERY_DRAFT_CHANGED, bump);
        return () => {
            window.removeEventListener(QUICK_DELIVERY_EVENT, bump);
            window.removeEventListener(QUICK_DELIVERY_DRAFT_CHANGED, bump);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setViewportWidth(window.innerWidth);
            setMobileLikeContext(isMobileLikeDevice());
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!showRouteMenu && isRouteMenuOpen) {
            setIsRouteMenuOpen(false);
        }
    }, [showRouteMenu, isRouteMenuOpen]);

    const quickstartDraftFileCount = useMemo(
        () => readQuickDeliveryDraft()?.files?.length ?? 0,
        [draftVersion, location.search]
    );

    const handleOpenQuickDelivery = useCallback(() => {
        playClick();
        onSetLayoutMode('dock');
        const qs = new URLSearchParams(window.location.search);
        const suffix = qs.get('quickstart') === '1' ? '?quickstart=1' : '';
        navigate(`/workspace${suffix}`);
    }, [navigate, onSetLayoutMode]);

    const outletCtx = useMemo(
        () => ({
            privacyMode,
            openSearch: () => setIsSearchOpen(true),
            openQuickDelivery: handleOpenQuickDelivery,
            layoutMode,
            isCompactContent,
        }),
        [privacyMode, layoutMode, handleOpenQuickDelivery, isCompactContent]
    );

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
        { id: 'vault', label: 'Projects', icon: LockKeyhole },
        { id: 'activity', label: 'Activity', icon: ActivityIcon },
        { id: 'reports', label: 'Reports', icon: PieChartIcon },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    // Mobile bottom-nav: core workspace shortcuts. Settings and Help remain in the
    // profile menu dropdown.
    const mobileNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'vault', label: 'Projects', icon: LockKeyhole },
        { id: 'activity', label: 'Activity', icon: ActivityIcon },
        { id: 'quotes', label: 'Quotes', icon: Receipt },
        { id: 'reports', label: 'Reports', icon: PieChartIcon },
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
                const map: Record<string, string> = { d: '/dashboard', v: '/vault', a: '/activity', r: '/reports', s: '/settings', c: '/create', q: '/quotes', h: '/workspace' };
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
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (!isProfileOpen) return;
            const target = event.target as Node | null;
            if (!target) return;
            const root = profileMenuRef.current;
            if (!root) return;
            const path = (event as any).composedPath?.() as EventTarget[] | undefined;
            if (path && path.includes(root)) return;
            if (root.contains(target)) return;
                setIsProfileOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isProfileOpen]);

    useEffect(() => {
        const handleRouteMenuOutside = (event: MouseEvent | TouchEvent) => {
            if (!isRouteMenuOpen) return;
            const target = event.target as Node | null;
            if (!target) return;
            const root = routeMenuRef.current;
            if (!root) return;
            const path = (event as any).composedPath?.() as EventTarget[] | undefined;
            if (path && path.includes(root)) return;
            if (root.contains(target)) return;
            setIsRouteMenuOpen(false);
        };
        document.addEventListener('mousedown', handleRouteMenuOutside);
        document.addEventListener('touchstart', handleRouteMenuOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleRouteMenuOutside);
            document.removeEventListener('touchstart', handleRouteMenuOutside);
        };
    }, [isRouteMenuOpen]);

    const SearchCommandPalette = ({ onClose }: { onClose: () => void }) => {
        const [query, setQuery] = useState('');
        const [selectedIndex, setSelectedIndex] = useState(0);
        const listRef = useRef<HTMLDivElement>(null);
        const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

        const routeItems = useMemo(() => ([
            { id: 'route-home', title: 'Home', subtitle: 'Return to the create-project surface', icon: EditorialIcon, action: () => navigate('/workspace') },
            { id: 'route-dashboard', title: 'Dashboard', subtitle: 'View your overview', icon: LayoutDashboard, action: () => navigate('/dashboard') },
            { id: 'route-vault', title: 'Projects', subtitle: 'Project and file ledger', icon: LockKeyhole, action: () => navigate('/vault') },
            { id: 'route-activity', title: 'Activity', subtitle: 'Recent actions and logs', icon: ActivityIcon, action: () => navigate('/activity') },
            { id: 'route-reports', title: 'Reports', subtitle: 'Revenue and metrics', icon: PieChartIcon, action: () => navigate('/reports') },
            { id: 'route-quotes', title: 'Quotes', subtitle: 'Create client proposals quickly', icon: FileDigit, action: () => navigate('/quotes') },
            { id: 'route-clients', title: 'Clients', subtitle: 'Rolodex and lifetime value', icon: Users, action: () => navigate('/dashboard?view=clients') },
            { id: 'route-settings', title: 'Settings', subtitle: 'Profile and integrations', icon: Settings, action: () => navigate('/settings') },
        ]), [navigate]);

        const commandItems = useMemo(() => {
            const items: any[] = [
                { id: 'cmd-create', title: 'Create Project', subtitle: 'Start a new handover', icon: Plus, action: () => navigate('/create'), kind: 'Action' },
                { id: 'cmd-quote', title: 'Create Quote', subtitle: 'Build a client quote draft', icon: FileDigit, action: () => navigate('/quotes'), kind: 'Action' },
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
            <div className="fixed inset-0 z-[120] flex items-end sm:items-start justify-center sm:pt-28 sm:px-4" onKeyDown={handleKeyDown}>
                <div className="absolute inset-0 bg-zinc-900/55 dark:bg-black/55 backdrop-blur-md transition-colors duration-300" onClick={onClose} />
                <div
                    className="relative w-full sm:max-w-2xl bg-white/95 dark:bg-[#16161f]/95 backdrop-blur-2xl rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.05)] border border-zinc-200/60 dark:border-white/10 overflow-hidden animate-slide-up pb-8 sm:pb-0"
                >
                    <div className="w-12 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden" />
                    {/* Subtle ambient glow */}
                    <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#a3e635]/15 dark:bg-[#bef264]/10 blur-[80px]" />
                    <div className="pointer-events-none absolute -bottom-32 -right-24 w-72 h-72 rounded-full bg-sky-300/10 dark:bg-indigo-500/10 blur-[90px]" />

                    <div className="relative flex items-center gap-3 px-5 py-4 border-b border-zinc-100/80 dark:border-white/5">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 flex items-center justify-center shrink-0">
                            <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        </div>
                    <input
                        autoFocus
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); }}
                            placeholder="Search projects, files, clients, or routes…"
                            className="flex-1 bg-transparent outline-none text-[15px] sm:text-base text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium tracking-tight"
                        />
                        <kbd className="hidden sm:inline-flex px-2 py-1 rounded-md bg-zinc-100 dark:bg-white/5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider border border-zinc-200/60 dark:border-white/10">ESC</kbd>
                </div>

                    <div ref={listRef} className="relative p-2 max-h-[440px] overflow-y-auto">
                        <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                            {query.trim() ? 'Results' : 'Quick access'}
                        </div>
                        {results.length === 0 && (
                            <div className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">No matches found. Try another keyword.</div>
                        )}
                        {results.map((result, idx) => {
                            const active = idx === selectedIndex;
                            return (
                                <button
                                    key={result.id}
                                    ref={el => { itemRefs.current[idx] = el; }}
                                    onClick={() => executeResult(result.action)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 my-0.5 rounded-2xl transition-all text-left group ${active ? 'bg-zinc-100/90 dark:bg-white/[0.08] shadow-sm' : 'hover:bg-zinc-50 dark:hover:bg-white/[0.04]'}`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${active ? 'bg-white dark:bg-white/[0.08] border border-zinc-200/70 dark:border-white/10 shadow-sm' : 'bg-zinc-100/70 dark:bg-white/[0.04] border border-transparent'}`}>
                                        <result.icon className={`w-4 h-4 transition-colors ${active ? 'text-[#65a30d] dark:text-[#bef264]' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 block truncate">{result.title}</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 block truncate">{result.subtitle}</span>
                                    </div>
                                    <span className={`ml-auto shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-colors ${active ? 'bg-[#a3e635]/20 dark:bg-[#bef264]/15 text-[#4d7c0f] dark:text-[#bef264] border border-[#a3e635]/35 dark:border-[#bef264]/25' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 border border-zinc-200/70 dark:border-white/10'}`}>{result.kind}</span>
                    </button>
                            );
                        })}
                    </div>

                    <div className="relative px-4 py-3 bg-zinc-50/80 dark:bg-black/20 border-t border-zinc-100/80 dark:border-white/5 flex flex-wrap gap-x-4 gap-y-1.5 items-center text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded-md border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-600 dark:text-zinc-300">↑↓</kbd> navigate</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded-md border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-600 dark:text-zinc-300">↵</kbd> open</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded-md border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-600 dark:text-zinc-300">Esc</kbd> close</span>
                        <span className="w-px h-3 bg-zinc-200 dark:bg-white/10 mx-1" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Jump to</span>
                        {([
                            ['d', 'Dashboard', '/dashboard'],
                            ['v', 'Projects', '/vault'],
                            ['r', 'Reports', '/reports'],
                            ['a', 'Activity', '/activity'],
                            ['s', 'Settings', '/settings'],
                            ['c', 'Create', '/create'],
                            ['q', 'Quotes', '/quotes'],
                        ] as [string, string, string][]).map(([key, label, path]) => (
                            <button key={key} onClick={() => { navigate(path); onClose(); }} className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors">
                                <kbd className="px-1.5 py-0.5 rounded-md border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-600 dark:text-zinc-300">g</kbd>
                                <kbd className="px-1.5 py-0.5 rounded-md border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-zinc-600 dark:text-zinc-300">{key}</kbd>
                                {label}
                    </button>
                        ))}
                </div>
            </div>
        </div>
    );
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };
    const isDefaultAvatar = (avatar?: string) =>
        Boolean(avatar && avatar.includes('photo-1507003211169-0a1dd7228f2d'));
    const hasCustomAvatar = Boolean(user?.avatar && !isDefaultAvatar(user.avatar));

    const ProfileMenu = () => (
        <div className="absolute top-16 right-0 w-80 border border-zinc-200/60 dark:border-white/12 rounded-2xl shadow-2xl p-4 animate-fade-in z-50 origin-top-right bg-white/86 dark:bg-[#1a1a23]/95 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-white/5 mb-4">
                <div className="relative">
                    {hasCustomAvatar ? (
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
                    <span className="text-[10px] font-bold uppercase text-lime-400 tracking-wider mt-1 block">Pro Plan</span>
                </div>
            </div>

            {/* Notifications */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Notifications</span>
                    {notifications.some((n: any) => !n.read) && (
                        <button
                            onClick={() => notifications.filter((n: any) => !n.read).forEach((n: any) => markNotificationRead(n.id))}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
                {notifications.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-200/50 dark:border-white/15 p-3 text-center">
                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">No notifications yet.</p>
                    </div>
                ) : (
                <div className="space-y-1">
                        {notifications.slice(0, 4).map((n: any) => (
                            <div key={n.id} className={`flex gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer group ${n.read ? 'opacity-70' : ''}`}>
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-zinc-300 dark:bg-zinc-600' : 'bg-red-500 animate-pulse'}`} />
                        <div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{n.title}</p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{n.body}</p>
                        </div>
                    </div>
                        ))}
                        {notifications.length > 0 && (
                            <button
                                onClick={() => clearNotifications()}
                                className="w-full mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-500 transition-colors"
                            >
                                Clear all
                            </button>
                        )}
                        </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setIsProfileOpen(false); navigate('/quotes'); }} className="p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 transition-all text-center group shadow-sm">
                    <FileDigit className="w-5 h-5 mx-auto mb-1 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white">Quotes</span>
                </button>
                <button onClick={() => { setIsProfileOpen(false); navigate('/settings'); }} className="p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 transition-all text-center group shadow-sm">
                    <Settings className="w-5 h-5 mx-auto mb-1 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white">Settings</span>
                </button>
                <button onClick={() => { setIsProfileOpen(false); routePreloadMap.help?.().finally(() => navigate('/help')); }} className="p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 transition-all text-center group shadow-sm">
                    <HelpCircle className="w-5 h-5 mx-auto mb-1 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white">Support</span>
                </button>
                {canToggleMockMode() && (
                    <button
                        onClick={() => {
                            playClick();
                            setIsProfileOpen(false);
                            handleDemoModeToggle(!demoMode);
                        }}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 transition-all text-center group shadow-sm"
                        title={demoMode ? 'Switch to real backend data' : 'Switch to mock demo data'}
                    >
                        <Database className={`w-5 h-5 mx-auto mb-1 transition-colors ${demoMode ? 'text-amber-600 dark:text-amber-300' : 'text-blue-600 dark:text-blue-300'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white">{demoMode ? 'Mock' : 'Real'}</span>
                    </button>
                )}
            </div>

            <button onClick={async () => { setIsProfileOpen(false); await onSignOut(); navigate('/signin'); }} className="w-full mt-4 py-2 text-[10px] font-bold uppercase text-zinc-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                <LogOut className="w-3 h-3" /> Sign Out
            </button>
        </div>
    );

    const workspaceQuickstartActive =
        isDockMode &&
        currentPath === 'workspace' &&
        searchParams.get('quickstart') === '1' &&
        quickstartDraftFileCount > 0;

    useEffect(() => {
        if (currentPath !== 'workspace') return;
        if (searchParams.get('quickstart') !== '1') return;
        if (quickstartDraftFileCount > 0) return;
        const next = new URLSearchParams(searchParams);
        next.delete('quickstart');
        setSearchParams(next, { replace: true });
    }, [currentPath, quickstartDraftFileCount, searchParams, setSearchParams]);

    const dismissWorkspaceQuickstart = useCallback(() => {
        playClick();
        const next = new URLSearchParams(searchParams);
        next.delete('quickstart');
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);
    const topbarGlassCls = layoutMode === 'full'
        ? 'bg-[#f0f2f5] dark:bg-cosmic border border-zinc-200/60 dark:border-white/10 shadow-none'
        : 'bg-white/80 dark:bg-[#323242]/80 backdrop-blur-xl border border-zinc-200/60 dark:border-white/10 shadow-lg';
    const topbarGlassHoverCls = layoutMode === 'full'
        ? 'hover:bg-slate-200 dark:hover:bg-[#2b2b3a]'
        : 'hover:bg-slate-200/70 dark:hover:bg-white/10';
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
        'Pin high-value deliveries in Projects so they stay front and center.',
    ];
    const [heroTipIndex, setHeroTipIndex] = useState(0);
    const [showHeroGreeting, setShowHeroGreeting] = useState(false);
    const [heroGreetingPlayed, setHeroGreetingPlayed] = useState(false);
    const [heroGreetingPrefix, heroGreetingSuffix] = (heroGreetingTemplate || 'Hello, {{name}}.').split('{{name}}');

    const heroActive = (isDockMode && !isPanelOpen) || isWidgetOnly;

    useEffect(() => {
        if (!heroActive || workspaceQuickstartActive) return;
        const timer = window.setInterval(() => {
            setHeroTipIndex((index) => (index + 1) % heroTips.length);
        }, 9000);
        return () => window.clearInterval(timer);
    }, [heroActive, heroTips.length, workspaceQuickstartActive]);

    useEffect(() => {
        if (!heroActive || heroGreetingPlayed || workspaceQuickstartActive) return;
        setShowHeroGreeting(true);
        const timer = window.setTimeout(() => {
            setShowHeroGreeting(false);
            setHeroGreetingPlayed(true);
        }, 9000);
        return () => window.clearTimeout(timer);
    }, [heroActive, heroGreetingPlayed, workspaceQuickstartActive]);

    useEffect(() => {
        if (!workspaceQuickstartActive) return;
        setShowHeroGreeting(false);
    }, [workspaceQuickstartActive]);

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

        // On desktop in widget-only mode, non-workspace routes need full layout.
        // On mobile the bottom-sheet pattern renders pages over the widget so no flip needed.
        if (isWidgetOnly && id !== 'workspace' && !showMobileNav) {
            onSetLayoutMode?.('full');
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

    const mobileSheetDragStartYRef = useRef<number | null>(null);
    const mobileSheetDidDragRef = useRef(false);

    const handleMobileSheetHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        mobileSheetDragStartYRef.current = event.clientY;
        mobileSheetDidDragRef.current = false;
    };

    const handleMobileSheetHandlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (mobileSheetDragStartYRef.current === null) return;
        const deltaY = event.clientY - mobileSheetDragStartYRef.current;
        if (deltaY > 10) {
            mobileSheetDidDragRef.current = true;
        }
    };

    const handleMobileSheetHandlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        if (mobileSheetDragStartYRef.current === null) return;
        const deltaY = event.clientY - mobileSheetDragStartYRef.current;
        mobileSheetDragStartYRef.current = null;
        const shouldDismissSheet = mobileSheetDidDragRef.current && deltaY > 60;
        mobileSheetDidDragRef.current = false;
        if (shouldDismissSheet) {
            playClick();
            navigate('/workspace');
        }
    };

    return (
        <>
            {/* In-flow min-height so #root establishes document height while StageBackground/header/widget use position:fixed */}
            <div
                aria-hidden
                className={`min-h-screen w-full ${isDarkMode ? 'bg-black' : 'bg-[#fafafa]'}`}
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
                className={`fixed left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-[top] duration-200 pointer-events-none ${
                    layoutMode === 'full' && !showMobileNav
                        ? 'bg-[#f0f2f5] dark:bg-cosmic border-b border-zinc-200/60 dark:border-white/10'
                        : ''
                }`}
                style={{ top: stripOffset, height: headerHeightPx }}
            >
                {/* Logo */}
                <button
                    className="flex items-center gap-2 cursor-pointer group shrink-0 pointer-events-auto"
                    onClick={() => { playClick(); navigate(layoutMode === 'full' ? '/dashboard' : '/workspace'); }}
                    title="Home"
                >
                    <EditorialIcon className="w-5 h-5 text-black dark:text-white group-hover:rotate-12 transition-transform duration-500" />
                    <span className="font-serif font-medium text-zinc-900 dark:text-white hidden sm:block">Heartifact</span>
                </button>

                {/* Nav pill + controls cluster */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                    {/* Desktop nav pill */}
                    <nav className={`${showDesktopNavPill ? 'flex' : 'hidden'} items-center gap-0.5 rounded-full px-2 py-1.5 mr-1 ${topbarGlassCls}`}>
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

                    {/* Compact routes menu for narrower desktop widths */}
                    <div ref={routeMenuRef} className={`relative ${showRouteMenu ? 'block' : 'hidden'}`}>
                        <button
                            type="button"
                            onClick={() => { playClick(); setIsRouteMenuOpen((open) => !open); }}
                            className={`p-2.5 rounded-xl text-zinc-500 dark:text-zinc-300 transition-all cursor-pointer ${topbarGlassCls} ${topbarGlassHoverCls}`}
                            title="More"
                            aria-label="More navigation"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {isRouteMenuOpen && (
                            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/90 dark:bg-[#1a1a23]/95 backdrop-blur-xl shadow-xl p-2 z-[110] animate-fade-in">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            playClick();
                                            setIsRouteMenuOpen(false);
                                            handleTopLevelNavigate(item.id);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                                            currentPath === item.id
                                                ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white'
                                                : 'text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search */}
                            <button
                                onClick={() => { playClick(); setIsSearchOpen(true); }}
                        className={`p-2.5 rounded-xl text-zinc-500 dark:text-zinc-300 transition-all cursor-pointer ${topbarGlassCls} ${topbarGlassHoverCls}`}
                        title="Search (Ctrl K)"
                    >
                        <Search className="w-4 h-4" />
                            </button>

                    {!isSmallScreenSheetMode && (
                        <button
                            onClick={() => {
                                playClick();
                                onSetLayoutMode?.(layoutMode === 'full' ? 'dock' : 'full');
                            }}
                            className={`inline-flex shrink-0 p-2 sm:p-2.5 rounded-xl text-zinc-500 dark:text-zinc-300 transition-all cursor-pointer ${topbarGlassCls} ${topbarGlassHoverCls}`}
                            title={
                                effectiveLayout === 'full'
                                    ? (dockCapable ? 'Switch to docked widget' : 'Switch to delivery widget')
                                    : effectiveLayout === 'widget'
                                        ? 'Switch to full workspace'
                                        : 'Switch to full workspace'
                            }
                            aria-label="Toggle layout"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                        </button>
                    )}

                    {/* Privacy toggle */}
                            <button
                        onClick={togglePrivacyMode}
                        className={`hidden sm:inline-flex p-2.5 rounded-xl transition-all cursor-pointer ${topbarGlassCls} ${privacyMode ? 'border-blue-700/30 dark:border-blue-400/30 text-blue-700 dark:text-blue-400' : `text-zinc-500 dark:text-zinc-300 ${topbarGlassHoverCls}`}`}
                        title="Privacy Mode"
                    >
                        {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>

                    {/* Theme */}
                    <ThemeModeDropdown
                        themeMode={themeMode}
                        onChange={(mode) => { playClick(); onSetThemeMode(mode); }}
                        isDarkMode={isDarkMode}
                        compact
                        buttonClassName={`p-2.5 rounded-xl text-zinc-500 dark:text-zinc-300 transition-all flex items-center cursor-pointer ${topbarGlassCls} ${topbarGlassHoverCls}`}
                    />

                    {/* Profile */}
                            <div ref={profileMenuRef} className="relative profile-menu-container pointer-events-auto">
                                <button
                                    type="button"
                            onClick={() => {
                                playClick();
                                const nextOpen = !isProfileOpen;
                                setIsProfileOpen(nextOpen);
                                if (nextOpen) {
                                    notifications.filter((n: any) => !n.read).forEach((n: any) => markNotificationRead(n.id));
                                }
                            }}
                                    className="flex items-center gap-2 pl-1 cursor-pointer group/profile bg-transparent border-none"
                                    aria-label="Open User Menu"
                                >
                                    <div className="relative group-hover/profile:scale-105 transition-transform">
                                {hasCustomAvatar ? (
                                    <img src={user.avatar} className="w-9 h-9 rounded-full border border-zinc-200/50 dark:border-white/10 shadow-sm object-cover" alt="Profile" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full border border-zinc-200/50 dark:border-white/10 shadow-sm bg-zinc-800 dark:bg-[#1a1a23] text-white flex items-center justify-center text-xs font-semibold">
                                        {getInitials(user?.name)}
                                    </div>
                                )}
                                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1a23] animate-pulse" />
                                <div className="absolute top-full right-0 mt-3 hidden group-hover/profile:flex flex-col items-end w-max pointer-events-none opacity-0 group-hover/profile:opacity-100 translate-y-1 group-hover/profile:translate-y-0 transition-all duration-200">
                                    <div className={`px-3 py-1.5 rounded-lg shadow-xl border border-zinc-200/50 dark:border-white/10 text-right ${isDockMode ? 'bg-white/30 dark:bg-[#1a1a23]/90 backdrop-blur-md' : 'bg-[#f0f2f5] dark:bg-[#1a1a23]'}`}>
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
            {showDeliveryWidget && (
                <div
                    className="fixed left-4 right-4 sm:left-8 sm:right-auto z-20 flex items-center transition-[opacity,transform] duration-500 bottom-[calc(88px+env(safe-area-inset-bottom))] lg:bottom-20"
                    style={{ top: stripOffset + headerHeightPx }}
                >
                    <DeliveryWidget isDarkMode={isDarkMode} onPublish={saveProject} />
                </div>
            )}

            {/* ── Main Page: desktop full layout ── */}
            {!showMobileNav && layoutMode === 'full' && (
                <main
                    className="fixed left-0 right-0 bottom-0 z-[30] overflow-hidden"
                    style={{ top: stripOffset + headerHeightPx }}
                >
                    <div className="h-full px-3 sm:px-5 lg:px-6 xl:px-7 pt-3 sm:pt-4 bg-[#f0f2f5] dark:bg-cosmic overflow-y-auto pb-24 sm:pb-28 lg:pb-6">
                        <div
                            key={location.pathname}
                            className="animate-route-in min-h-full"
                        >
                            <Outlet context={outletCtx} />
                        </div>
                    </div>
            </main>
            )}

            {/* ── Mobile bottom sheet: pages slide up over the delivery widget backdrop ── */}
            {showBottomSheet && (
                <>
                    {/* Tap-outside dismiss area (top 15% above the sheet) */}
                    <button
                        type="button"
                        aria-label="Dismiss"
                        onClick={() => { playClick(); navigate('/workspace'); }}
                        className="fixed inset-x-0 top-0 z-[39] h-[15svh] bg-transparent cursor-pointer border-0 p-0"
                    />
                    <aside
                        className="fixed left-0 right-0 bottom-0 z-[40] rounded-t-[2rem] bg-white/30 dark:bg-cosmic/60 backdrop-blur-xl border-t border-zinc-200/35 dark:border-white/[0.06] shadow-[0_-24px_60px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_-24px_60px_-10px_rgba(0,0,0,0.55)] animate-slide-up"
                        style={{ top: '15svh' }}
                    >
                        <div className="h-full flex flex-col rounded-t-[2rem] bg-[#f0f2f5]/40 dark:bg-cosmic/56 overflow-hidden">
                            {/* Drag handle */}
                            <div
                                className="shrink-0 flex justify-center pt-3 pb-1 touch-none cursor-grab active:cursor-grabbing"
                                onPointerDown={handleMobileSheetHandlePointerDown}
                                onPointerMove={handleMobileSheetHandlePointerMove}
                                onPointerUp={handleMobileSheetHandlePointerEnd}
                                onPointerCancel={handleMobileSheetHandlePointerEnd}
                            >
                                <div className="w-9 h-[3px] rounded-full bg-zinc-400/60 dark:bg-white/25" />
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth pb-24 px-3 pt-1">
                                <div key={location.pathname} className="animate-route-in min-h-full">
                                    <Outlet context={outletCtx} />
                                </div>
                            </div>
                        </div>
                    </aside>
                </>
            )}

            {isDockMode && !isPanelOpen && (
                <div
                    className="fixed left-[420px] right-8 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none z-[15] px-4 xl:px-10 animate-fade-in duration-1000"
                    style={{ top: `calc(50% + ${stripOffset / 2}px)` }}
                >
                    <div className="relative w-full max-w-[1040px] min-h-[280px] lg:min-h-[340px]">
                        {workspaceQuickstartActive && (
                            <div
                                className="absolute inset-0 flex items-center justify-center pointer-events-auto z-[1] transition-opacity duration-700 opacity-100"
                                role="region"
                                aria-label="Finish delivery from landing upload"
                            >
                                <div className="w-full max-w-3xl text-left space-y-5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                        From your landing upload
                                    </p>
                                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-4xl 2xl:text-6xl text-zinc-900 dark:text-white tracking-tight leading-[1.05]">
                                        <span className="italic text-lime-400 dark:text-[#bef264]">
                                            {quickstartDraftFileCount} file{quickstartDraftFileCount !== 1 ? 's' : ''}
                                        </span>
                                        {' '}
                                        <span className="text-zinc-800 dark:text-zinc-100">are in Quick delivery.</span>
                                    </h2>
                                    <p className="text-xs sm:text-sm md:text-base lg:text-base 2xl:text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium max-w-2xl">
                                        Name the handover and your client in the panel on the left, choose <span className="text-zinc-800 dark:text-white">Create link</span> or{' '}
                                        <span className="text-zinc-800 dark:text-white">Send email</span>, then <span className="text-zinc-800 dark:text-white">Publish</span> for a shareable project link.
                                        You can open <span className="text-zinc-800 dark:text-white">Studio</span> there anytime for milestones and advanced options.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={dismissWorkspaceQuickstart}
                                        className="text-sm font-medium text-zinc-500 dark:text-zinc-400 underline underline-offset-4 decoration-zinc-300/80 dark:decoration-white/25 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer bg-transparent border-0 p-0"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${workspaceQuickstartActive || !showHeroGreeting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl 2xl:text-[8.2rem] text-zinc-900 dark:text-white tracking-tight leading-[0.98] max-w-[1040px] px-1">
                                <span className="block animate-fade-in">
                                    {heroGreetingPrefix}
                                    <span className="italic text-lime-400 dark:text-[#bef264]">{greetingName}</span>
                                    {heroGreetingSuffix}
                                </span>
                            </h1>
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${workspaceQuickstartActive || showHeroGreeting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <div className="max-w-lg space-y-1">
                                <p key={heroTipIndex} className="text-base lg:text-lg 2xl:text-xl text-zinc-500 dark:text-zinc-200 leading-relaxed font-medium animate-fade-in px-1">
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

            {/* ── Widget-only hero (beside widget on wider, below on narrow) ── */}
            {isWidgetOnly && currentPath === 'workspace' && !workspaceQuickstartActive && (
                <div
                    className="fixed pointer-events-none z-[15] animate-fade-in duration-1000 hidden min-[700px]:flex items-center justify-start"
                    style={{
                        top: stripOffset + headerHeightPx,
                        bottom: `calc(88px + env(safe-area-inset-bottom))`,
                        left: `calc(32px + 372px + 24px)`,
                        right: '24px',
                    }}
                >
                    <div className="relative w-full max-w-md">
                        <h2 className={`font-serif text-2xl md:text-3xl text-zinc-900 dark:text-white tracking-tight leading-[1.1] transition-opacity duration-500 ${showHeroGreeting ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                            {heroGreetingPrefix}
                            <span className="italic text-lime-400 dark:text-[#bef264]">{greetingName}</span>
                            {heroGreetingSuffix}
                        </h2>
                        <div className={`space-y-1 transition-opacity duration-500 ${showHeroGreeting ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'}`}>
                            <p key={`wo-tip-${heroTipIndex}`} className="text-sm md:text-base text-zinc-500 dark:text-zinc-200 leading-relaxed font-medium animate-fade-in">
                                {heroTips[heroTipIndex]}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-300 font-bold">
                                Quick tip {heroTipIndex + 1} of {heroTips.length}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Panel backdrop ── spans header area too so clicking the nav strip also closes the panel ── */}
            {isDockMode && (
                <div
                    className={`fixed left-0 right-0 bottom-0 z-[60] transition-opacity duration-300 ${isPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    style={{ top: stripOffset, background: 'rgba(0,0,0,0.12)' }}
                    onClick={() => { playClick(); navigate('/workspace'); }}
                />
            )}

            {/* ── Side panel ── */}
            {isDockMode && (
                <aside
                    className={`fixed right-0 bottom-0 z-[70] w-full max-w-[960px] min-[880px]:w-auto min-[880px]:max-w-none min-[880px]:left-[420px] xl:left-[440px] bg-white/30 dark:bg-cosmic/60 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    style={{ top: stripOffset }}
                    aria-hidden={!isPanelOpen}
                >
                    <div className="h-full bg-[#f0f2f5]/40 dark:bg-cosmic/56 border-l border-zinc-200/35 dark:border-white/[0.06] shadow-lg overflow-hidden flex flex-col transition-[box-shadow,border-color] duration-700">
                        <div className="shrink-0 h-[4.25rem] px-5 pt-4 flex items-start border-b border-zinc-200/35 dark:border-white/[0.06]">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { playClick(); navigate('/workspace'); }}
                                    className="h-9 w-9 rounded-full border border-zinc-200/40 dark:border-white/15 bg-white/10 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/30 transition-colors flex items-center justify-center cursor-pointer backdrop-blur-sm"
                                    aria-label="Close panel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { playClick(); navigate('/workspace'); }}
                                    className="hidden min-[1600px]:inline text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    Close panel
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div
                                className="px-3 sm:px-5 lg:px-6 xl:px-7 pt-3 sm:pt-4 min-h-full pb-24 sm:pb-28 lg:pb-6"
                            >
                                <div
                                    key={location.pathname}
                                    className="animate-route-in min-h-full"
                                >
                                    <Outlet context={outletCtx} />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            )}

            {/* ── Help FAB ── */}
            <div className={`fixed right-4 lg:right-8 z-[110] ${showMobileNav ? 'bottom-[calc(88px+env(safe-area-inset-bottom))]' : 'bottom-[calc(16px+env(safe-area-inset-bottom))] lg:bottom-8'}`}>
                {currentPath === 'help' ? (
                    <button
                        onClick={() => { playClick(); navigate(layoutMode === 'full' ? '/dashboard' : '/workspace'); }}
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
                        className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-zinc-950 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:rotate-6 duration-300 cursor-pointer"
                    >
                        <HelpCircle className="w-5 h-5" />
                </Link>
                )}
            </div>

            {/* ── Mobile bottom navigation ── */}
            {showMobileNav && (
                <MobileNavBar navItems={mobileNavItems} currentPath={currentPath} onNavigate={(id) => { playClick(); handleTopLevelNavigate(id); }} />
            )}

            {/* ── Search overlay (above everything including strip) ── */}
            {isSearchOpen && <SearchCommandPalette onClose={() => setIsSearchOpen(false)} />}
        </>
    );
}

// Wrapper to handle project lookup for Editor routes
const EditorWrapper = ({ projects, onSave, user, themeMode }: { projects: Project[], onSave: (p: Project) => void, user: UserProfile, themeMode: 'light' | 'dark' | 'system' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const project = projects.find(p => p.id === id) || projects[0];
    return (
        <div className="animate-editor-in" style={{ animation: 'var(--animate-editor-in)' }}>
            <CreatorPage existingProject={project} allProjects={projects} user={user} themeMode={themeMode} onSave={onSave} onBack={() => navigate('/vault')} />
        </div>
    );
};

const CreatorWrapper = ({ projects, onSave, user, themeMode }: { projects: Project[], onSave: (p: Project) => void, user: UserProfile, themeMode: 'light' | 'dark' | 'system' }) => {
    const navigate = useNavigate();
    return (
        <div className="animate-editor-in" style={{ animation: 'var(--animate-editor-in)' }}>
            <CreatorPage allProjects={projects} user={user} themeMode={themeMode} onSave={onSave} onBack={() => navigate('/vault')} />
        </div>
    );
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
        // Default to Projects.
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
                            className={`mt-4 w-full h-11 rounded-xl font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'bg-blue-500 text-zinc-950 hover:bg-blue-600' : 'bg-blue-500 text-zinc-900 shadow-sm hover:bg-blue-700'}`}
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
    const [layoutPreference, setLayoutPreference] = useState<'dock' | 'full'>(() => {
        try {
            const stored = localStorage.getItem('hf_layout_mode');
            if (stored === 'dock' || stored === 'full') return stored;
        } catch {
        }
        return 'dock';
    });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstVisitThemeNotice, setFirstVisitThemeNotice] = useState<string | null>(null);

    const handleSetLayoutMode = useCallback((next: 'dock' | 'full') => {
        setLayoutPreference(next);
        setLayoutMode(next);
    }, []);

    useEffect(() => {
        const width = window.innerWidth;
        if (width < 880 && (layoutMode !== 'dock' || layoutPreference !== 'dock')) {
            setLayoutMode('dock');
            setLayoutPreference('dock');
        }
    }, [layoutMode, layoutPreference]);

    useEffect(() => {
        // The widget can gracefully collapse to full-width on very narrow screens, so we no longer
        // force full mode. Users can toggle between widget-only (dock preference) and full layout
        // on any screen size.
        const restoreDockIfPreferred = () => {
            if (isMobileLikeDevice()) return;
            if (layoutPreference === 'dock' && layoutMode === 'full') {
                setLayoutMode('dock');
            }
        };
        restoreDockIfPreferred();
        window.addEventListener('resize', restoreDockIfPreferred);
        return () => window.removeEventListener('resize', restoreDockIfPreferred);
    }, [layoutMode, layoutPreference]);

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
    const { projects, user, authResolved, saveProject, updateUser, resetStore } = useStore();
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

        // Workspace hero + quickstart guides visitors through Quick delivery (link vs email → Publish), not the full studio editor.
        const destination = '/workspace?quickstart=1';
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
            document.documentElement.classList.toggle('dark', shouldBeDark);
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
                            <span className="truncate">You're offline — please check your internet connection.</span>
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
                    <div className="fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 bg-blue-500 text-zinc-950 shadow-sm text-[11px] font-bold h-7 z-[200]">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span>Back online — connection restored.</span>
                        </div>
                    </div>
                )}

                {/* â”€â”€ SW update available strip â”€â”€ */}
                {showUpdateStrip && (
                    <div className="fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 bg-blue-500 text-zinc-950 shadow-sm text-[11px] font-bold h-7 z-[200]">
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
                            <div className="flex items-center gap-2 rounded-full border border-zinc-200/50 dark:border-white/10 bg-white/30 dark:bg-[#18181b]/90 backdrop-blur-md shadow-lg px-4 py-2 text-[11px] font-bold tracking-wide text-zinc-700 dark:text-zinc-200">
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
                            onSetLayoutMode={handleSetLayoutMode}
                            setIsDarkMode={setIsDarkMode}
                            togglePrivacyMode={togglePrivacyMode}
                            privacyMode={privacyMode}
                            onSignOut={resetStore}
                        />)}>
                            {/* Home surface is DeliveryWidget in AppLayout when docked; in full layout route redirects to a real panel. */}
                            <Route path="/workspace" element={layoutMode === 'full' ? <FullLayoutWorkspaceRedirect /> : null} />
                            <Route path="/dashboard" element={<Suspense fallback={<DashboardSkeleton />}><DashboardView projects={projects} user={user} headerVariant={layoutMode === 'full' ? 'greeting' : 'default'} /></Suspense>} />
                            <Route path="/activity" element={<Suspense fallback={<PageLoader />}><ActivityView /></Suspense>} />
                            <Route path="/vault" element={<Suspense fallback={<VaultSkeleton />}><VaultView projects={projects} /></Suspense>} />
                            <Route path="/reports" element={<Suspense fallback={<PageLoader />}><ReportsView /></Suspense>} />
                            <Route path="/quotes" element={<Suspense fallback={<PageLoader />}><QuotesPage /></Suspense>} />
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
                        <Route path="/create" element={protectLiveRoute(<CreatorWrapper projects={projects} onSave={saveProject} user={user} themeMode={themeMode} />)} />
                        <Route path="/editor/:id" element={protectLiveRoute(<EditorWrapper projects={projects} onSave={saveProject} user={user} themeMode={themeMode} />)} />
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

