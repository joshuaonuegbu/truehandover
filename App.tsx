import React, { useState, useEffect, useContext, useRef, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams, Outlet, Link, useOutletContext } from 'react-router-dom';
import {
    Lock, FileText, Settings, Bell,
    LayoutDashboard, Check,
    CreditCard, Wallet, ShieldCheck,
    Plus, Download, ExternalLink, Briefcase,
    PieChart as PieChartIcon, Activity as ActivityIcon,
    X, Upload, ChevronRight,
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
import { isMockMode, setMockMode, setMockModeAndNavigate } from './config/mockMode';
// Critical path — loaded eagerly (needed before auth resolves)
import LandingPage from './components/LandingPage';
import SignInPage from './components/SignInPage';
import { Card, Badge, GRADIENT_TEXT } from './components/Shared';
import ThemeModeDropdown from './components/ThemeModeDropdown';
import { ClientRolodexContent } from './components/ClientsPage';

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

// ─── Toast system ────────────────────────────────────────────────────────────
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
        success: 'bg-white dark:bg-[#1e2420] border-lime-300 dark:border-lime-700/40 text-slate-800 dark:text-white',
        error:   'bg-white dark:bg-[#201e1e] border-red-300   dark:border-red-700/40   text-slate-800 dark:text-white',
        info:    'bg-white dark:bg-[#1e2028] border-blue-300  dark:border-blue-700/40  text-slate-800 dark:text-white',
        warning: 'bg-white dark:bg-[#201f1e] border-amber-300 dark:border-amber-700/40 text-slate-800 dark:text-white',
    };
    const iconStyles: Record<ToastKind, string> = {
        success: 'text-lime-600 dark:text-lime-400',
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
                        <button onClick={() => dismiss(t.id)} className="ml-1 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
// ─────────────────────────────────────────────────────────────────────────────

// --- CONSTANTS ---
// OPTIMIZED: High-Fidelity Fine Grain SVG
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

// Shimmer base used by all skeleton blocks
const Shimmer = ({ className = '' }: { className?: string }) => (
    <div className={`bg-slate-200 dark:bg-white/[0.07] rounded-xl relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
    </div>
);

// Dashboard skeleton — mirrors the greeting + stats + project list shape
const DashboardSkeleton = () => (
    <div className="space-y-6 pb-12 animate-fade-in absolute inset-0 w-full z-10 bg-[#f0f2f5] dark:bg-cosmic">
        <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-white/5 pb-8">
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
                    <div key={i} className="flex items-center gap-4 py-5 border-b border-slate-100 dark:border-white/5">
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
        <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/5 pb-8">
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
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-white/20 border-t-lime-600 dark:border-t-[#bef264] animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading</span>
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
        const chars = '0123456789$£€%&@#';
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
            className={`inline-block font-serif ${className}`}
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
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 15C4 10.6 9.4 7 16 7C22.6 7 28 10.6 28 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="22" r="6" fill="#bef264" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const BackgroundOrbs = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 dark:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-slate-300/20 rounded-full blur-[100px] animate-blob mix-blend-multiply" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gray-300/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply" />
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-slate-200/20 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply" />
    </div>
);

// --- CUSTOM WIDGETS ---

const HeaderClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strMinutes = minutes < 10 ? '0' + minutes : minutes;
        return { time: `${hours}:${strMinutes}`, period: ampm };
    };

    const { time: timeStr, period } = formatTime(time);

    return (
        // Adjusted: Reduced font size to roughly 28px (~5% smaller than text-3xl)
        <div className="hidden xl:flex items-baseline gap-1.5 font-serif text-[1.75rem] font-medium tracking-widest tabular-nums text-slate-900 dark:text-white transition-colors duration-300">
            <span>{timeStr}</span>
            <span className="text-sm font-bold text-lime-600 dark:text-[#bef264] -translate-y-1 ml-1">{period}</span>
        </div>
    );
};

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
        <div className="flex flex-wrap items-center gap-4 md:gap-8 p-4 bg-white/50 dark:bg-[#23232e] border border-slate-200 dark:border-white/5 rounded-2xl mb-8 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Stripe Connect: <span className={stripeConnected ? 'text-lime-600 dark:text-[#bef264]' : 'text-slate-500 dark:text-slate-400'}>{stripeConnected ? 'Connected' : 'Not connected'}</span></span>
            </div>

            <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-white/10" />

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Banknote className="w-3.5 h-3.5" />
                <span>Next Payout: <span className="text-slate-900 dark:text-white">{stripeConnected && payoutsEnabled ? 'Managed in Stripe' : 'Unavailable'}</span></span>
            </div>

            <div className="ml-auto flex items-center gap-4">
                {/* REVAMPED STORAGE WIDGET: Bigger, bolder, new design */}
                <div className="flex items-center gap-4 pl-2 pr-6 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:shadow-md group">
                    <div className="p-2.5 rounded-xl bg-lime-50 dark:bg-[#bef264]/10 text-lime-600 dark:text-[#bef264] group-hover:scale-105 transition-transform">
                        <HardDrive className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <div className="flex justify-between items-center leading-none">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{demoMode ? 'Native Storage' : 'Storage Usage'}</span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {demoMode ? `${formatBytes(demoRemainingNativeStorageBytes)} left` : <><span>{formatBytes(totalBytes)}</span> <span className="opacity-50">({totalFiles} files)</span></>}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-lime-600 dark:bg-[#bef264] rounded-full shadow-[0_0_12px_rgba(132,204,22,0.6)] transition-all" style={{ width: `${usagePct}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Timeline = ({ projects }: { projects: Project[] }) => {
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
            const list: Array<{ date: string; dateSort: string; title: string; subtitle: string; icon: React.ElementType; color: 'lime' | 'orange' | 'white'; }> = [];
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
                    color: 'orange',
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
                    color: 'orange',
                });
            }
            return list;
        })
        .sort((a, b) => new Date(b.dateSort).getTime() - new Date(a.dateSort).getTime())
        .slice(0, 12);

    if (activities.length === 0) {
        return (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50/70 dark:bg-white/[0.02] px-6 text-center">
                <Clock className="w-7 h-7 text-slate-400 mb-3" />
                <p className="font-serif text-lg italic text-slate-600 dark:text-slate-300">No briefing activity yet.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Events will appear here as projects are created, viewed, signed, and paid.</p>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col gap-6 py-2 pb-12">
            <div className="absolute left-[88px] top-4 bottom-4 w-px bg-slate-200 dark:bg-white/10" />
            {activities.map((item, i) => {
                const iconColor = {
                    lime: 'text-lime-600 dark:text-[#bef264]',
                    orange: 'text-[#fb923c]',
                    white: 'text-slate-500 dark:text-slate-400'
                }[item.color];

                return (
                    <div key={i} className="flex items-center gap-6 relative z-10 group pl-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-16 text-right font-mono">{item.date}</span>
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-lime-600 dark:bg-[#bef264] animate-pulse' : 'bg-slate-300 dark:bg-slate-700'} ring-4 ring-[#f0f2f5] dark:ring-cosmic relative z-20`} />
                        <div className="flex-1 flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm dark:hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-4 h-4 ${iconColor}`} />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 hidden sm:block uppercase tracking-wider">{item.subtitle}</span>
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
            { label: 'Docs', bytes: 4 * 1024 * 1024 * 1024, color: 'bg-lime-400' },
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
                { label: 'Docs', bytes: bytesByType.Docs || 0, color: 'bg-lime-400' },
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
                <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between h-full bg-white dark:bg-[#23232e] rounded-3xl transition-all duration-700 ease-in-out">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Revenue</span>
                            <div className="flex items-center gap-1 text-lime-600 dark:text-[#bef264] font-bold text-[10px] bg-lime-50 dark:bg-[#bef264]/10 px-2 py-1 rounded-full border border-lime-100 dark:border-[#bef264]/20">
                                <ArrowUpRight className="w-3 h-3" /> {demoMode ? '12.5%' : 'Active'}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 mb-6">
                            <PrivacyBlur strength="strong" className={`font-serif text-5xl md:text-6xl tracking-tighter ${GRADIENT_TEXT}`}>${securedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300"><PrivacyBlur>${pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur> Pending</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 dark:opacity-40 pointer-events-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[{ v: 10 }, { v: 25 }, { v: 18 }, { v: 30 }, { v: 25 }, { v: 40 }, { v: 35 }, { v: 50 }]}>
                                <defs>
                                    <linearGradient id="colorHeroMini" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#bef264" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#bef264" stopOpacity={0} />
                                    </linearGradient>
                                    <filter id="shadow" height="200%">
                                        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#bef264" floodOpacity="0.8" />
                                    </filter>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke="#bef264" strokeWidth={3} fill="url(#colorHeroMini)" filter="url(#shadow)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )
        },
        {
            id: 'storage',
            render: () => (
                <div className="absolute inset-0 p-6 sm:p-8 z-10 flex flex-col justify-between h-full bg-white dark:bg-[#1e293b] rounded-3xl transition-all duration-700 ease-in-out">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Vault Storage</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">{formatBytes(demoRemainingNativeStorageBytes)} left</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <div className="flex items-baseline gap-2">
                            <span className="font-serif text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight">{Math.round(demoUsedNativeStorageBytes / (1024 ** 3))}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">GB / 30 GB</span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="w-full h-2.5 flex rounded-full overflow-hidden gap-0.5 bg-slate-100 dark:bg-white/5">
                                <div className="h-full bg-indigo-500 w-[50%]" />
                                <div className="h-full bg-sky-400 w-[30%]" />
                                <div className="h-full bg-lime-400 w-[20%]" />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Video (10GB)</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Images (6GB)</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-lime-400" /> Docs (4GB)</span>
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
            render: () => (
                <div className="absolute inset-0 flex h-full bg-slate-50 dark:bg-[#1e293b] rounded-3xl transition-all duration-700 ease-in-out overflow-hidden">
                    
                    {/* Left Side: Original Feedback */}
                    <div className={`flex flex-col justify-between p-6 sm:p-8 transition-all duration-500 ${isReplying ? 'w-1/2 border-r border-slate-200 dark:border-white/5' : 'w-full'}`}>
                        {/* Header: Type + Time */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">New Feedback</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">09:42 AM</span>
                        </div>

                        {/* Body: Quote */}
                        <div className="flex-1 flex flex-col justify-center py-2">
                            <h3 className={`font-serif leading-snug text-slate-900 dark:text-white transition-all duration-500 ${isReplying ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>
                                "The typography system feels incredibly balanced now. Check the mobile spacing?"
                            </h3>
                        </div>

                        {/* Footer: User + Actions */}
                        <div className="flex items-end justify-between pb-2">
                            <div className="flex items-center gap-3">
                                <img src="https://api.dicebear.com/9.x/shapes/svg?seed=SarahChen" alt="Client" className="w-8 h-8 rounded-full bg-white border border-slate-200 dark:border-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Sarah Chen</span>
                                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Brand Identity</span>
                                </div>
                            </div>
                            
                            {!isReplying && (
                                <div className="flex items-center gap-2 pr-16">
                                    <button className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
                                        Mark Resolved
                                    </button>
                                    <button 
                                        onClick={() => setIsReplying(true)}
                                        className="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        Reply <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Reply Box */}
                    <div className={`flex flex-col p-6 sm:p-8 bg-white dark:bg-[#23232e] transition-all duration-500 ${isReplying ? 'w-1/2 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full p-0 overflow-hidden'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Reply to Sarah</span>
                            <button onClick={() => setIsReplying(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <textarea 
                            className="flex-1 w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:border-lime-500 dark:focus:border-[#bef264] transition-colors"
                            placeholder="Type your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex justify-start mt-4">
                            <button 
                                onClick={() => { setIsReplying(false); setReplyText(''); playSuccess(); }}
                                className="px-4 py-2 rounded-lg bg-lime-600 text-white dark:bg-[#bef264] dark:text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                Send <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'upgrade',
            render: () => (
                <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between h-full bg-slate-900 text-white dark:bg-white/5 dark:text-slate-900 rounded-3xl animate-fade-in relative overflow-hidden transition-all duration-700 ease-in-out">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-black/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    <div className="relative h-full flex flex-col justify-between z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-lime-500 text-white dark:bg-[#bef264] dark:text-black">Upgrade</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-white dark:text-white/60">Business Tier</span>
                            </div>
                            <h3 className="font-serif text-3xl md:text-4xl leading-tight mb-2 text-white dark:text-white">Unlock unlimited project history.</h3>
                            <p className="text-sm opacity-80 max-w-[80%] text-slate-300 dark:text-slate-400">Get advanced reporting and client portals.</p>
                        </div>
                        <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all mt-4 text-lime-400 dark:text-[#bef264]">
                            View Plans <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )
        },
        {
            id: 'live_activity',
            render: () => (
                <div className="absolute inset-0 p-6 sm:p-8 z-10 flex flex-col justify-between h-full bg-slate-900 dark:bg-black rounded-3xl transition-all duration-700 ease-in-out relative overflow-hidden">
                    {/* Subtle grid background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/10 border border-white/10 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white">Live Session</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/50">Right Now</span>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="relative">
                                <img src="https://api.dicebear.com/9.x/shapes/svg?seed=MikeRoss" alt="Client" className="w-12 h-12 rounded-full border-2 border-slate-800" />
                                <div className="absolute -bottom-1 -right-1 bg-slate-800 p-1 rounded-full border border-slate-700">
                                    <Monitor className="w-3 h-3 text-lime-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight">Mike Ross</h3>
                                <p className="text-xs text-white/60">Vertex Corp</p>
                            </div>
                        </div>
                        <p className="font-serif text-xl text-white/90 leading-snug">
                            Currently viewing <span className="text-lime-400 font-sans font-medium">Q4_Financial_Report.pdf</span>
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
                <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between h-full bg-white dark:bg-[#23232e] rounded-3xl transition-all duration-700 ease-in-out">
                    <div>
                        <div className="flex justify-between items-start mb-4 gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Revenue</span>
                            <div className="flex items-center gap-1 text-lime-600 dark:text-[#bef264] font-bold text-[10px] bg-lime-50 dark:bg-[#bef264]/10 px-2 py-1 rounded-full border border-lime-100 dark:border-[#bef264]/20 shrink-0">
                                <ArrowUpRight className="w-3 h-3" /> {paidProjects.length} closed
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 mb-6">
                            <PrivacyBlur strength="strong" className={`font-serif text-5xl md:text-6xl tracking-tighter ${GRADIENT_TEXT}`}>${securedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300"><PrivacyBlur>${pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyBlur> Pending</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <CheckCircle className="w-3 h-3 text-lime-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{paidProjects.length} paid or completed</span>
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
                                        <stop offset="5%" stopColor="#bef264" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#bef264" stopOpacity={0} />
                                    </linearGradient>
                                    <filter id="shadowLive" height="200%">
                                        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#bef264" floodOpacity="0.8" />
                                    </filter>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke="#bef264" strokeWidth={3} fill="url(#colorHeroMiniLive)" filter="url(#shadowLive)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )
        },
        {
            id: 'storage',
            render: () => (
                <div className="absolute inset-0 p-6 sm:p-8 z-10 flex flex-col justify-between h-full bg-white dark:bg-[#1e293b] rounded-3xl transition-all duration-700 ease-in-out">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Project Storage</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">{totalFiles} files</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-serif text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight">{formatBytes(totalBytes)}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Across {projects.length} project{projects.length === 1 ? '' : 's'}</span>
                        </div>

                        <div className="space-y-2">
                            <div className="w-full h-2.5 flex rounded-full overflow-hidden gap-0.5 bg-slate-100 dark:bg-white/5">
                                {(storageBreakdown.length > 0 ? storageBreakdown : [{ label: 'Empty', bytes: 1, color: 'bg-slate-300 dark:bg-white/10' }]).map((item) => (
                                    <div
                                        key={item.label}
                                        className={`h-full ${item.color}`}
                                        style={{ width: `${storageTotal > 0 ? (item.bytes / storageTotal) * 100 : 100}%` }}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                {(storageBreakdown.length > 0 ? storageBreakdown : [{ label: 'No files', bytes: 0, color: 'bg-slate-300' }]).map((item) => (
                                    <span key={item.label} className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} /> {item.label} ({item.bytes > 0 ? formatBytes(item.bytes) : '0 B'})
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
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
                <div className="absolute inset-0 p-6 sm:p-8 z-10 flex flex-col justify-between h-full bg-slate-900 dark:bg-black rounded-3xl transition-all duration-700 ease-in-out relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="relative z-10 flex justify-between items-start gap-3">
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/10 border border-white/10 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
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
                                            <img src={recentProject.client.avatar} alt={recentProject.client.name || 'Client'} className="w-12 h-12 rounded-full border-2 border-slate-800 object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full border-2 border-slate-800 bg-white/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-white/70" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 bg-slate-800 p-1 rounded-full border border-slate-700">
                                            <Monitor className="w-3 h-3 text-lime-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight">{recentProject.client.name || recentProject.client.company || 'Client'}</h3>
                                        <p className="text-xs text-white/60">{recentProject.client.company || recentProject.name}</p>
                                    </div>
                                </div>
                                <p className="font-serif text-xl text-white/90 leading-snug">
                                    {recentProject.clientViewedAt ? 'Last viewed' : 'Most recent project'} <span className="text-lime-400 font-sans font-medium">{recentProject.name}</span>
                                </p>
                                <p className="text-xs uppercase tracking-widest text-white/50 mt-3">
                                    {recentProject.status.replace(/_/g, ' ')} • ${recentProject.amount.toLocaleString()}
                                </p>
                            </>
                        ) : (
                            <div>
                                <h3 className="font-serif text-3xl text-white mb-2">No project activity yet.</h3>
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
        }
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
            <div className="w-full bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm relative h-[280px] p-6 sm:p-8">
                <div className="h-full flex flex-col items-center justify-center text-center opacity-90 p-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 shadow-sm">
                        <Database className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                    </div>
                    <h3 className="font-serif text-xl text-slate-900 dark:text-white mb-2">Unlock Your Analytics</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed mb-6">
                        Create your first project to start tracking revenue, storage usage, and client engagement.
                    </p>
                    <button onClick={() => { playClick(); navigate('/create'); }} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider transition-all">
                        Initialize Analytics
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="w-full bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm relative group hover:shadow-md transition-all h-[280px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Progress Bar */}
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-slate-100 dark:bg-white/5 z-30 rounded-b-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div 
                    className="h-full bg-lime-500 dark:bg-[#bef264] transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(132,204,22,0.5)]"
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
                        className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === cycleIndex ? 'w-8 bg-slate-900 dark:bg-white' : 'w-1.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400'}`} 
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

    // Projects / Clients toggle — reads ?view=clients from URL so command palette can deep-link
    const [dashView, setDashView] = useState<'projects' | 'clients'>(() => {
        const params = new URLSearchParams(location.search);
        return params.get('view') === 'clients' ? 'clients' : 'projects';
    });

    const filteredProjects = projects.filter(p => {
        if (projectTab === 'pending') return p.status === 'awaiting_payment';
        if (projectTab === 'draft') return p.status === 'draft' || p.status === 'awaiting_signature';
        if (projectTab === 'paid') return p.status === 'paid' || p.status === 'completed';
        return false;
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

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
        <div className="space-y-6 animate-slide-up relative z-10 pb-12">
            <div className="flex flex-col gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h1 className="font-serif text-3xl md:text-5xl text-slate-900 dark:text-white leading-tight mb-2">
                            <span className={GRADIENT_TEXT}>{getGreeting()}</span>, <span className="italic text-lime-600 dark:text-[#bef264]">{(user.name || 'there').split(' ')[0]}.</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Here's your project overview for today.</p>
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
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-700/30 text-[11px] font-bold text-lime-700 dark:text-lime-400">
                                    <CheckCircle className="w-3 h-3" /> All caught up — nothing pending.
                                </div>
                            );
                            const colorMap = {
                                amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30 text-amber-700 dark:text-amber-400',
                                blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30 text-blue-700 dark:text-blue-400',
                                lime: 'bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-700/30 text-lime-700 dark:text-lime-400',
                                slate: 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400',
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
                    <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                        <button onClick={() => navigate('/create')} className="px-5 py-3 rounded-xl bg-lime-600 text-white dark:bg-[#bef264] dark:text-black font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center gap-2 whitespace-nowrap">
                            <Plus className="w-4 h-4" /> New Project
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                        <button onClick={() => navigate('/vault')} className="px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 font-sans font-bold text-xs uppercase tracking-widest transition-colors whitespace-nowrap">Vault</button>
                        <button onClick={() => navigate('/activity')} className="px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 font-sans font-bold text-xs uppercase tracking-widest transition-colors whitespace-nowrap">Activity</button>
                        <button onClick={() => navigate('/reports')} className="px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 font-sans font-bold text-xs uppercase tracking-widest transition-colors whitespace-nowrap">Reports</button>
                    </div>
                </div>
            </div>

            {/* Projects / Clients toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-2xl p-1 w-fit border border-slate-200 dark:border-white/10 shadow-sm">
                <button
                    onClick={() => { playClick(); setDashView('projects'); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${dashView === 'projects' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <FolderLock className="w-3.5 h-3.5" /> Projects
                </button>
                <button
                    onClick={() => { playClick(); setDashView('clients'); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${dashView === 'clients' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <Users className="w-3.5 h-3.5" /> Clients
                </button>
            </div>

            {dashView === 'clients' && <ClientRolodexContent />}

            {dashView === 'projects' && <>

            {/* Status Ribbon - Now part of dashboard logic */}
            <StatusRibbon projects={projects} user={user} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12">
                <div className="xl:col-span-8 flex flex-col gap-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* CYCLING WIDGET COMPONENT */}
                        <CyclingWidget projects={projects} />

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-1 pt-1">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Siren className="w-3.5 h-3.5 text-red-500" /> Today's Priorities
                                </h3>
                                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-lg shadow-red-500/30 animate-pulse">{alerts.length} Actions</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                                {alerts.length === 0 ? (
                                    <div className="bg-slate-50 dark:bg-black/20 border-2 border-dashed border-slate-200 dark:border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center flex-1 min-h-[220px]">
                                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-white/10">
                                            <CheckCircle className="w-6 h-6 text-lime-600 dark:text-[#bef264]" strokeWidth={1.5} />
                                        </div>
                                        <p className="font-serif text-xl text-slate-900 dark:text-white mb-1">Clear Horizon</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] mb-5">
                                            Everything is up to date. Ready for new incoming clients?
                                        </p>
                                        <button onClick={() => { playClick(); navigate('/create'); }} className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-[#bef264] text-white dark:text-black text-[11px] font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center gap-2 group shadow-lg shadow-black/5">
                                            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" /> Create Project
                                        </button>
                                    </div>
                                ) : alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
                                        className="bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer group shadow-sm"
                                    >
                                        <div className={`p-2.5 rounded-xl shrink-0 ${alert.type === 'critical' ? 'bg-red-500/10 text-red-500' : alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            <alert.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{alert.type === 'critical' ? 'Urgent' : alert.type === 'warning' ? 'Warning' : 'Info'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{alert.message}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-lime-600 dark:group-hover:text-[#bef264] group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ... Rest of dashboard ... */}
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <ActivityIcon className="w-3.5 h-3.5 text-lime-600 dark:text-[#bef264]" /> Live Client Pulse
                        </h2>
                        {liveClients.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 p-6 text-center bg-white/70 dark:bg-white/[0.02]">
                                <Monitor className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No active client sessions.</p>
                                <p className="text-xs text-slate-400 mt-1">Recent client activity appears here once someone opens a project link.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {liveClients.map((client) => (
                                    <Card key={client.id} className="p-4 flex items-center gap-4 hover:border-lime-500/50 dark:hover:border-[#bef264]/50 cursor-pointer group" noPadding>
                                        <div className="relative">
                                            <img src={client.avatar} className="w-10 h-10 rounded-full object-cover" />
                                            {client.status === 'viewing' && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500"></span>
                                                </span>
                                            )}
                                            {client.status === 'idle' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-[#23232e]" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{client.name}</h4>
                                                {client.status === 'viewing' && <span className="text-[9px] font-bold text-lime-600 dark:text-[#bef264] uppercase tracking-wider animate-pulse">Live</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{client.project}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-lime-600 dark:group-hover:text-[#bef264] transition-colors" />
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-end justify-between mb-6">
                            <h2 className={`font-serif text-3xl tracking-tight ${GRADIENT_TEXT}`}>Active Projects</h2>
                            <div className="flex gap-4">
                                {['pending', 'draft', 'paid'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setProjectTab(tab as any)}
                                        className={`pb-1 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${projectTab === tab ? 'border-lime-600 text-slate-900 dark:text-white dark:border-[#bef264]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col border-t border-slate-200 dark:border-white/5">
                            {filteredProjects.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center opacity-80 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl m-4 bg-slate-50 dark:bg-black/20">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-white/5 flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-white/10 relative">
                                        <Briefcase className="w-10 h-10 stroke-[1.5] text-slate-400" />
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-lime-100 dark:bg-[#bef264]/20 rounded-xl flex items-center justify-center border-2 border-white dark:border-[#23232e]">
                                            <Plus className="w-4 h-4 text-lime-600 dark:text-[#bef264]" />
                                        </div>
                                    </div>
                                    <h3 className="font-serif text-2xl text-slate-900 dark:text-white mb-2">Start Your First Project</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[320px] text-center mb-8 leading-relaxed">
                                        Securely share files, collect payments, and manage client handovers in one professional workspace.
                                    </p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                        <button onClick={() => { playClick(); navigate('/create'); }} className="px-6 py-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-black/5">
                                            <Plus className="w-4 h-4" /> Create Project
                                        </button>
                                        <button onClick={() => { playClick(); document.getElementById('vault-tab-draft')?.click(); }} className="px-6 py-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                                            Start with a Draft
                                        </button>
                                    </div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Takes less than 30 seconds</p>
                                </div>
                            ) : (
                                filteredProjects.map((p, i) => (
                                    <div
                                        key={p.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/preview/${p.id}`, { state: { from: location.pathname } })}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/preview/${p.id}`, { state: { from: location.pathname } }); }}
                                        className="group flex flex-col md:flex-row md:items-center justify-between py-6 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 px-4 -mx-4 rounded-xl transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-lime-500/50"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="font-mono text-xs text-slate-300 dark:text-slate-600 w-8">{(i + 1).toString().padStart(2, '0')}</span>
                                            <div className="relative">
                                                <img src={p.client.avatar} loading="lazy" className="w-12 h-12 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#23232e] ${p.status === 'paid' ? 'bg-lime-500' : 'bg-amber-500'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-lime-700 dark:group-hover:text-[#bef264] transition-colors">{p.name}</h3>
                                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{p.client.company || p.client.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 mt-4 md:mt-0 ml-14 md:ml-0">
                                            <div className="text-right">
                                                <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-0.5">Value</div>
                                                <div className="font-serif text-lg text-slate-900 dark:text-white">
                                                    <PrivacyBlur>${p.amount.toLocaleString()}</PrivacyBlur>
                                                </div>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-0.5">Due</div>
                                                <div className="font-mono text-sm text-slate-600 dark:text-slate-300">
                                                    {new Date(p.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-lime-600 group-hover:border-lime-600 group-hover:text-white dark:group-hover:bg-[#bef264] dark:group-hover:text-black transition-all">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button onClick={() => navigate('/reports?focus=audit')} className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 group transition-colors">
                            View Full Ledger <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
                {/* ... Sidebar preserved ... */}
                <div className="xl:col-span-4 pl-0 xl:pl-10 border-l border-transparent xl:border-slate-200 dark:xl:border-white/5">
                    <div className="h-[calc(100vh-140px)] sticky top-24 flex flex-col pt-2">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className={`font-serif text-3xl tracking-tight ${GRADIENT_TEXT}`}>The Briefing</h3>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Daily Timeline</p>
                            </div>
                            <button className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors border border-slate-200 dark:border-white/10">
                                <Filter className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto relative pr-2 briefing-scroll">
                            <Timeline projects={projects} />
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
        <div className="space-y-6 animate-slide-up relative z-10">
            {/* ... Content same as previously provided, preserving logic ... */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
                <div>
                    <h2 className={`text-4xl font-serif font-medium tracking-tight ${GRADIENT_TEXT}`}>
                        Project <span className="px-2 py-0.5 rounded-lg bg-transparent text-lime-600 dark:text-[#bef264]">Vault</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
                        Secure delivery pipeline and asset management.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/trash')} className="h-12 px-6 rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Trash</span>
                    </button>
                    <button onClick={() => navigate('/create')} className="h-12 px-8 rounded-xl bg-lime-600 text-white dark:bg-[#bef264] dark:text-black font-bold text-sm uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(101,163,13,0.3)] dark:shadow-[0_0_20px_rgba(190,242,100,0.3)] hover:shadow-[0_0_30px_rgba(101,163,13,0.5)] dark:hover:shadow-[0_0_30px_rgba(190,242,100,0.5)] transition-all hover:scale-105">
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>
            </div>
            {/* ... Rest of Vault View ... */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/50 dark:bg-[#23232e] backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-white/5">
                <div className="relative w-full sm:flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-lime-600 dark:group-focus-within:text-[#bef264] transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects, clients, or files..."
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-transparent text-sm focus:bg-white dark:focus:bg-white/5 outline-none transition-all placeholder:text-slate-500"
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
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${vaultFilter === filter.key ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/5'}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-slate-300 dark:bg-white/10 mx-2" />
                    <button onClick={() => { playClick(); setVaultLayout('grid'); }} className={`p-2.5 rounded-lg transition-colors ${vaultLayout === 'grid' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/5'}`} title="Card view"><LayoutGrid className="w-5 h-5" /></button>
                    <button onClick={() => { playClick(); setVaultLayout('list'); }} className={`p-2.5 rounded-lg transition-colors ${vaultLayout === 'list' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/5'}`} title="List view"><ListIcon className="w-5 h-5" /></button>
                </div>
            </div>
            {/* Empty state */}
            {visibleProjects.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center opacity-80 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-slate-50 dark:bg-black/20 m-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-white/5 flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-white/10">
                        {searchQuery ? <Search className="w-10 h-10 stroke-[1.5] text-slate-400" /> : <LockKeyhole className="w-10 h-10 stroke-[1.5] text-slate-400" />}
                    </div>
                    
                    {searchQuery ? (
                        <>
                            <h3 className="font-serif text-2xl text-slate-900 dark:text-white mb-2">No results found</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8 max-w-[300px]">
                                We couldn't find any projects matching "{searchQuery}". Try adjusting your filters or search terms.
                            </p>
                            <button onClick={() => { playClick(); setSearchQuery(''); }} className="px-6 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                                Clear Search
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="font-serif text-2xl text-slate-900 dark:text-white mb-2">No Projects Yet</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8 max-w-[320px] leading-relaxed">
                                Create your first project to organize deliverables, share files, and track payments in one place.
                            </p>
                            <button onClick={() => { playClick(); navigate('/create'); }} className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-[#bef264] text-white dark:text-black text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center gap-3 shadow-xl shadow-slate-900/10 dark:shadow-[#bef264]/10">
                                <Plus className="w-5 h-5" /> Create First Project
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── List view ── */}
            {vaultLayout === 'list' && visibleProjects.length > 0 && (
                <div className="bg-white dark:bg-charcoal border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/5">
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Project</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">Client</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:table-cell">Status</th>
                                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Value</th>
                                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell">Files</th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {visibleProjects.map(project => {
                                const statusColors: Record<string, string> = {
                                    draft: 'text-slate-500 bg-slate-100 dark:bg-white/5',
                                    awaiting_signature: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',
                                    awaiting_payment: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
                                    payment_verification: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
                                    paid: 'text-lime-700 bg-lime-50 dark:bg-lime-900/20 dark:text-lime-400',
                                    completed: 'text-lime-700 bg-lime-50 dark:bg-lime-900/20 dark:text-lime-400',
                                };
                                return (
                                    <tr
                                        key={project.id}
                                        onClick={() => navigate(`/preview/${project.id}`, { state: { from: location.pathname } })}
                                        className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer group transition-colors last:border-0"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={project.client.avatar} className="w-8 h-8 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all shrink-0" />
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-lime-700 dark:group-hover:text-[#bef264] transition-colors">{project.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400">#{project.id.toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell">{project.client.company || project.client.name}</td>
                                        <td className="px-5 py-4 hidden sm:table-cell">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusColors[project.status] || statusColors.draft}`}>
                                                {project.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-serif text-slate-900 dark:text-white">${project.amount.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right font-mono text-slate-500 hidden lg:table-cell">{project.files.length}</td>
                                        <td className="px-3 py-4">
                                            <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-lime-600 dark:group-hover:text-[#bef264] transition-colors" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Grid / card view ── */}
            <div className={`grid grid-cols-1 gap-6 lg:gap-12 ${vaultLayout === 'list' ? 'hidden' : ''}`}>
                {visibleProjects.map(project => (
                    <div key={project.id} className="group relative w-full bg-white dark:bg-[#0f0f15] rounded-2xl lg:rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/5 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-col lg:flex-row h-full min-h-[280px] lg:min-h-[340px]">
                            <div className="lg:w-[35%] bg-slate-50 dark:bg-[#18181b] flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 transition-colors overflow-hidden">
                                {/* CRANKED GRAIN: Adjusted for better visibility in light mode and subtlety in dark mode */}
                                <div className="absolute inset-0 opacity-[0.25] dark:opacity-[0.55] pointer-events-none mix-blend-multiply dark:mix-blend-overlay" style={{ backgroundImage: NOISE_SVG, filter: 'contrast(150%)' }} />
                                <div className="relative z-10 p-5 sm:p-6 lg:p-8 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${project.status === 'paid' ? 'bg-lime-100 border-lime-200 text-lime-700 dark:bg-white/10 dark:border-white/20 dark:text-lime-400' : 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-white/10 dark:border-white/20 dark:text-amber-400'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'paid' ? 'bg-lime-600 dark:bg-lime-400' : 'bg-amber-600 dark:bg-amber-400'} animate-pulse`} />
                                                {project.status === 'paid' ? 'Secured' : 'Locked'}
                                            </div>
                                            <span className="font-mono text-xs text-slate-400 dark:text-slate-400 opacity-70">#{project.id.toUpperCase()}</span>
                                        </div>
                                        <h3 className="text-3xl font-serif font-medium text-slate-900 dark:text-white leading-tight mb-2 group-hover:font-bold transition-all cursor-pointer" onClick={() => navigate(`/preview/${project.id}`, { state: { from: location.pathname } })}>{project.name}</h3>
                                        <div className="flex items-center gap-3 mt-4">
                                            <img src={project.client.avatar} className="w-8 h-8 rounded-full grayscale opacity-80 border border-slate-200 dark:border-white/10" />
                                            <div>
                                                <div className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Client</div>
                                                <div className="text-xs font-bold text-slate-900 dark:text-slate-300">{project.client.name}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="py-5 lg:py-8">
                                        <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1">Contract Value</div>
                                        <PrivacyBlur className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-500">${project.amount.toLocaleString()}</PrivacyBlur>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-white/10 pt-6">
                                        <div>
                                            <div className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Files</div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{project.files.length}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Size</div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">2.4<span className="text-xs opacity-50">GB</span></div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Views</div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">24</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-[65%] bg-white dark:bg-[#23232e] flex flex-col relative">
                                <div className="flex-1 p-8 overflow-x-auto no-scrollbar flex items-center">
                                    <div className="flex gap-5">
                                        <button onClick={() => { playClick(); navigate(`/editor/${project.id}`); }} className="shrink-0 w-40 h-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-lime-600 dark:hover:border-[#bef264] hover:bg-lime-50 dark:hover:bg-[#bef264]/5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group/add">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover/add:bg-lime-600 dark:group-hover/add:bg-[#bef264] transition-colors">
                                                <Plus className="w-5 h-5 text-slate-400 group-hover/add:text-white dark:group-hover/add:text-black" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover/add:text-lime-700 dark:group-hover/add:text-[#bef264]">Add Asset</span>
                                        </button>
                                        {project.files.map(f => (
                                            <div key={f.id} className="shrink-0 w-28 h-36 sm:w-32 sm:h-40 lg:w-40 lg:h-48 bg-slate-50 dark:bg-[#1c1c21] rounded-xl lg:rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden group/file relative hover:scale-110 hover:z-50 hover:shadow-2xl transition-all duration-300 ease-out origin-center">
                                                <div className="h-20 sm:h-24 lg:h-32 w-full bg-slate-200 dark:bg-white/5 relative overflow-hidden">
                                                    {f.previewUrl ? <img src={f.previewUrl} loading="lazy" className="w-full h-full object-cover transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">{getFileIcon(f.type)}</div>}
                                                </div>
                                                <div className="p-2 lg:p-3">
                                                    <div className="text-[10px] lg:text-xs font-bold text-slate-900 dark:text-white truncate mb-0.5 lg:mb-1">{f.name}</div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[8px] lg:text-[9px] font-mono text-slate-400">{f.size}</span>
                                                        <div className={`flex items-center gap-1 text-[7px] lg:text-[8px] font-bold uppercase ${f.locked ? 'text-amber-500' : 'text-lime-600 dark:text-[#bef264]'}`}>{f.locked ? 'Locked' : 'Open'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-16 lg:h-20 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#18181b]/50 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 md:px-8 overflow-x-auto no-scrollbar gap-3">
                                    <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                                        {/* Launch Preview — primary CTA: gradient bg in dark, rich solid in light */}
                                        <button
                                            onClick={() => { playClick(); navigate(`/preview/${project.id}`, { state: { from: location.pathname } }); }}
                                            className="h-10 lg:h-12 px-4 lg:px-6 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest flex items-center gap-2 lg:gap-3 transition-all hover:scale-105 shadow-xl group/preview shrink-0 relative overflow-hidden
                                                bg-slate-900 text-white shadow-black/20
                                                dark:bg-transparent dark:text-[#111] dark:shadow-[#bef264]/20"
                                            style={{} as React.CSSProperties}
                                        >
                                            {/* Dark mode: lime gradient bg layer (no reflection) */}
                                            <span className="hidden dark:block absolute inset-0 bg-gradient-to-br from-[#d9f99d] via-[#bef264] to-[#a3e635] rounded-xl" />
                                            {/* Light mode: subtle gradient sheen */}
                                            <span className="dark:hidden absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 rounded-xl" />
                                            <span className="relative z-10 flex items-center gap-2 lg:gap-3">
                                                <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white/20 dark:bg-black/15 flex items-center justify-center shrink-0">
                                                    <Eye className="w-3 h-3 group-hover/preview:scale-110 transition-transform" />
                                                </span>
                                                <span className="shrink-0 hidden sm:inline">Launch Preview</span>
                                                <span className="shrink-0 sm:hidden">Preview</span>
                                            </span>
                                        </button>

                                        {/* Copy Client Link — gradient text, frosted border */}
                                        <button className="h-10 lg:h-12 px-3 lg:px-6 rounded-xl border font-bold text-[10px] lg:text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm shrink-0 group/copy
                                            bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md
                                            dark:bg-white/[0.04] dark:border-[#bef264]/20 dark:hover:bg-[#bef264]/10 dark:hover:border-[#bef264]/40">
                                            <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-[#bef264] group-hover/copy:scale-110 transition-transform" />
                                            <span className="shrink-0 hidden md:inline bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-[#bef264] dark:to-white">Copy Client Link</span>
                                            <span className="shrink-0 md:hidden hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-[#bef264] dark:to-white">Copy</span>
                                        </button>

                                        {/* Send to Client — gradient text, frosted border */}
                                        <button className="hidden md:flex h-10 lg:h-12 px-6 rounded-xl border font-bold text-xs uppercase tracking-wider items-center gap-2 transition-all shadow-sm shrink-0 group/send
                                            bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md
                                            dark:bg-white/[0.04] dark:border-[#c4b5fd]/20 dark:hover:bg-[#c4b5fd]/10 dark:hover:border-[#c4b5fd]/40">
                                            <Send className="w-3.5 h-3.5 text-slate-500 dark:text-[#c4b5fd] group-hover/send:scale-110 transition-transform" />
                                            <span className="shrink-0 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-[#c4b5fd] dark:to-white">Send to Client</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                                        <button className="hidden lg:flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-lime-600 dark:hover:text-[#bef264] transition-all" title="Invoice"><FileText className="w-4 h-4" /></button>
                                        <button className="hidden lg:flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-lime-600 dark:hover:text-[#bef264] transition-all" title="Receipt"><CheckCircle className="w-4 h-4" /></button>
                                        <button onClick={() => { playClick(); setQrProjectId(project.id); }} className="hidden lg:flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-lime-600 dark:hover:text-[#bef264] transition-all" title="Generate QR Code"><QrCode className="w-4 h-4" /></button>
                                        <div className="hidden lg:block h-6 w-px bg-slate-300 dark:bg-white/10 mx-1" />
                                        <button onClick={() => navigate(`/editor/${project.id}`)} className="h-9 lg:h-10 w-9 lg:w-auto lg:px-4 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-lime-50 dark:hover:bg-[#bef264]/10 hover:border-lime-200 dark:hover:border-[#bef264]/30 transition-all flex items-center justify-center gap-2"><Pencil className="w-3.5 h-3.5" /><span className="hidden lg:inline"> Edit</span></button>
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
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-300"
                    onClick={() => setQrProjectId(null)}
                >
                    <div
                        className="bg-white dark:bg-charcoal rounded-t-3xl sm:rounded-[2rem] p-8 max-w-sm w-full mx-auto shadow-2xl border border-slate-200 dark:border-white/10 mt-auto sm:mt-0 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Mobile handle */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Vault QR Code</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Scan to open the client vault</p>
                            </div>
                            <button onClick={() => setQrProjectId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="flex flex-col items-center gap-5">
                            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
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
                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{qrProject.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{qrProject.client.name}</p>
                                <p className="text-[10px] font-mono text-slate-400 mt-1 break-all">{qrUrl}</p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => { navigator.clipboard.writeText(qrUrl); }}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy URL
                                </button>
                                <button
                                    onClick={() => navigate(`/preview/${qrProject.id}`)}
                                    className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-[#bef264] text-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[49] bg-white/90 dark:bg-[#1a1a23]/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10">
        <div className="flex justify-around items-center h-16 sm:h-20 max-w-lg mx-auto">
            {navItems.map((item) => {
                const isActive = currentPath === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        onMouseEnter={() => routePreloadMap[item.id]?.()}
                        onTouchStart={() => routePreloadMap[item.id]?.()}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${isActive ? 'text-lime-600 dark:text-[#bef264]' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
                    >
                        <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-lime-100/50 dark:bg-[#bef264]/10 -translate-y-1' : ''}`}>
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

const AppLayout = ({ user, projects, isDarkMode, themeMode, onSetThemeMode, togglePrivacyMode, privacyMode, onSignOut }: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const stripOffset = useStripOffset();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false); // NEW State
    const [demoMode, setDemoMode] = useState(isMockMode());
    const mainContentTopGapPx = 10;

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
    const currentPath = location.pathname.split('/')[1] || 'dashboard';

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
                // Navigate to create with some global state (in a real app, pass files via context/state)
                navigate('/create', { state: { autoDrop: true } });
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
                const map: Record<string, string> = { d: '/dashboard', v: '/vault', a: '/activity', r: '/reports', s: '/settings', c: '/create' };
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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen]);

    const SearchCommandPalette = ({ onClose }: { onClose: () => void }) => {
        const [query, setQuery] = useState('');
        const [selectedIndex, setSelectedIndex] = useState(0);
        const listRef = useRef<HTMLDivElement>(null);
        const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

        const routeItems = useMemo(() => ([
            { id: 'route-dashboard', title: 'Dashboard', subtitle: 'View your overview', icon: LayoutDashboard, action: () => navigate('/dashboard') },
            { id: 'route-vault', title: 'Vault', subtitle: 'Project and file ledger', icon: LockKeyhole, action: () => navigate('/vault') },
            { id: 'route-activity', title: 'Activity', subtitle: 'Recent actions and logs', icon: ActivityIcon, action: () => navigate('/activity') },
            { id: 'route-reports', title: 'Reports', subtitle: 'Revenue and metrics', icon: PieChartIcon, action: () => navigate('/reports') },
            { id: 'route-clients', title: 'Clients', subtitle: 'Rolodex and lifetime value', icon: Users, action: () => navigate('/dashboard?view=clients') },
            { id: 'route-settings', title: 'Settings', subtitle: 'Profile and integrations', icon: Settings, action: () => navigate('/settings') },
        ]), [navigate]);

        const commandItems = useMemo(() => ([
            { id: 'cmd-create', title: 'Create Project', subtitle: 'Start a new handover', icon: Plus, action: () => navigate('/create'), kind: 'Action' },
            { id: 'cmd-theme', title: 'Toggle Theme', subtitle: 'Switch between light and dark mode', icon: themeMode === 'dark' ? Sun : Moon, action: () => { onSetThemeMode(themeMode === 'dark' ? 'light' : 'dark'); }, kind: 'Action' },
            { id: 'cmd-privacy', title: 'Toggle Privacy', subtitle: 'Hide sensitive financial data', icon: privacyMode ? Eye : EyeOff, action: togglePrivacyMode, kind: 'Action' },
            { id: 'cmd-mock', title: 'Toggle Demo Data', subtitle: 'Switch between real and mock data', icon: Database, action: () => handleDemoModeToggle(!demoMode), kind: 'Action' },
        ]), [navigate, themeMode, privacyMode, demoMode, onSetThemeMode, togglePrivacyMode, handleDemoModeToggle]);

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
                <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-colors duration-300" onClick={onClose} />
                <div className="relative w-full sm:max-w-2xl bg-white dark:bg-[#1a1a23] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-slide-up ring-1 ring-black/5 pb-8 sm:pb-0">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden" />
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-white/5">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); }}
                            placeholder="Search projects, files, clients, or routes..."
                            className="flex-1 bg-transparent outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                        />
                        <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-400 tracking-wider border border-slate-200 dark:border-white/10">ESC</kbd>
                    </div>
                    <div ref={listRef} className="p-2 max-h-[420px] overflow-y-auto">
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {query.trim() ? 'Results' : 'Quick Access'}
                        </div>
                        {results.length === 0 && (
                            <div className="px-4 py-8 text-sm text-slate-500 dark:text-slate-400">No matches found. Try another keyword.</div>
                        )}
                        {results.map((result, idx) => (
                            <button
                                key={result.id}
                                ref={el => { itemRefs.current[idx] = el; }}
                                onClick={() => executeResult(result.action)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left group ${idx === selectedIndex ? 'bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                                <result.icon className={`w-4 h-4 transition-colors ${idx === selectedIndex ? 'text-lime-600 dark:text-[#bef264]' : 'text-slate-400 group-hover:text-lime-600 dark:group-hover:text-[#bef264]'}`} />
                                <div className="min-w-0 flex-1">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{result.title}</span>
                                    <span className="text-xs text-slate-400 block truncate">{result.subtitle}</span>
                                </div>
                                <span className={`ml-auto text-xs transition-colors ${idx === selectedIndex ? 'text-lime-600 dark:text-[#bef264]' : 'text-slate-400'}`}>{result.kind}</span>
                            </button>
                        ))}
                    </div>
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-x-4 gap-y-1.5 items-center text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-slate-500 dark:text-slate-300">↑↓</kbd> navigate</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-slate-500 dark:text-slate-300">↵</kbd> open</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-slate-500 dark:text-slate-300">Esc</kbd> close</span>
                        <span className="w-px h-3 bg-slate-200 dark:bg-white/10 mx-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">Jump to —</span>
                        {([['d','Dashboard'],['v','Vault'],['r','Reports'],['a','Activity'],['s','Settings'],['c','Create']] as [string, string][]).map(([key, label]) => (
                            <button key={key} onClick={() => { navigate(label === 'Create' ? '/create' : `/${label.toLowerCase()}`); onClose(); }} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-slate-500 dark:text-slate-300">g</kbd>
                                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-slate-500 dark:text-slate-300">{key}</kbd>
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
        <div className="absolute top-16 right-0 w-80 bg-white/90 dark:bg-[#1a1a23]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 animate-fade-in z-50 origin-top-right">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
                <div className="relative">
                    {user?.avatar ? (
                        <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="Profile" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 dark:bg-slate-900 text-white flex items-center justify-center font-semibold shadow-sm">
                            {getInitials(user?.name)}
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-lime-500 rounded-full border-2 border-white dark:border-[#1a1a23] flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{user.name || 'Your Account'}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{user.email || 'No email on file'}</p>
                    <span className="text-[10px] font-bold uppercase text-lime-600 dark:text-[#bef264] tracking-wider mt-1 block">Pro Plan</span>
                </div>
            </div>

            {/* Notifications */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Recent Activity</span>
                    <button className="text-[10px] font-bold text-lime-600 dark:text-[#bef264] hover:underline">Mark all read</button>
                </div>
                {recentProfileEvents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/15 p-3 text-center">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No recent events yet.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {recentProfileEvents.map((evt) => (
                            <div key={evt.id} className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${evt.isHot ? 'bg-red-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-lime-600 dark:group-hover:text-[#bef264] transition-colors">{evt.title}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{evt.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setIsProfileOpen(false); navigate('/settings'); }} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all text-center group">
                    <Settings className="w-5 h-5 mx-auto mb-1 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white">Settings</span>
                </button>
                <button onClick={() => { setIsProfileOpen(false); navigate('/help'); }} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all text-center group">
                    <HelpCircle className="w-5 h-5 mx-auto mb-1 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white">Support</span>
                </button>
            </div>

            <button onClick={async () => { setIsProfileOpen(false); await onSignOut(); navigate('/signin'); }} className="w-full mt-4 py-2 text-[10px] font-bold uppercase text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                <LogOut className="w-3 h-3" /> Sign Out
            </button>
        </div>
    );

    const headerHeightPx = 80; // h-20

    return (
        <div className="flex-1 font-sans bg-[#f0f2f5] dark:bg-cosmic text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden relative">
            {/* GLOBAL DRAG DROP OVERLAY */}
            {isDraggingGlobal && (
                <div className="fixed inset-0 z-[999] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
                    <div className="w-full max-w-lg mx-4 rounded-[2rem] border-2 border-dashed border-lime-500 dark:border-[#bef264] bg-white/10 dark:bg-[#1a1a23]/50 flex flex-col items-center justify-center p-16 text-center shadow-2xl scale-105 animate-pulse">
                        <div className="w-24 h-24 rounded-full bg-lime-600 dark:bg-[#bef264] flex items-center justify-center mb-6 shadow-xl shadow-lime-900/20 dark:shadow-[#bef264]/20">
                            <Plus className="w-12 h-12 text-white dark:text-black" strokeWidth={3} />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-white mb-2">Drop to Create Project</h2>
                        <p className="text-slate-200">Release files anywhere to start a new handover instantly.</p>
                    </div>
                </div>
            )}

            {/* AMBIENT BACKGROUND EFFECTS */}
            <BackgroundOrbs />
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-grain mix-blend-overlay dark:block hidden"></div>

            {/* FIXED HEADER — sticks below strip when strip is visible, at top when not; never scrolls away */}
            <header
                className="fixed left-0 right-0 z-50 bg-[#f0f2f5]/90 dark:bg-cosmic/90 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 transition-[top] duration-200"
                style={{ top: stripOffset }}
            >
                <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Content */}
                    <div className="flex flex-row items-center justify-between h-20 gap-4">

                        {/* Left: Brand — always returns to dashboard home */}
                        <div className="flex items-center gap-3 cursor-pointer group shrink-0 scale-[1.05] origin-left" title="Go to Dashboard" onClick={() => { playClick(); navigate('/dashboard'); }}>
                            <div className="flex items-center gap-2 px-2 py-2 transition-all">
                                <EditorialIcon className="w-6 h-6 text-black dark:text-white group-hover:rotate-12 transition-transform duration-500" />
                                <span className={`font-serif font-medium tracking-tight text-lg text-slate-900 dark:text-white hidden sm:block`}>TrueHandover</span>
                            </div>
                        </div>

                        {/* Center: Navigation Links (Text Only) */}
                        <nav className="hidden lg:flex items-center gap-6 xl:gap-12 absolute left-1/2 -translate-x-1/2">
                            {navItems.map(item => {
                                const isActive = currentPath === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => { playClick(); navigate(`/${item.id}`); }}
                                        onMouseEnter={() => routePreloadMap[item.id]?.()}
                                        className={`
                                            relative text-base font-medium transition-colors duration-200 py-1
                                            ${isActive ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}
                                        `}
                                    >
                                        {item.label}
                                        {isActive && (
                                            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-slate-900 dark:bg-[#bef264] rounded-full animate-fade-in" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Right: User Profile & Controls */}
                        <div className="flex items-center justify-end gap-3 shrink-0">

                            {/* Search Trigger Button - REDESIGNED: Compact Pill with Hover Reveal */}
                            <button
                                onClick={() => { playClick(); setIsSearchOpen(true); }}
                                className="hidden lg:flex items-center gap-2.5 px-3 min-[1792px]:px-5 py-2.5 bg-slate-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-full shadow-sm hover:shadow-md transition-all duration-300 group text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                <Search className="w-4 h-4" strokeWidth={2.5} />
                                <span className="hidden min-[1792px]:inline text-xs font-bold uppercase tracking-widest">Search</span>
                                <span className="hidden min-[1792px]:inline w-0 overflow-hidden group-hover:w-20 transition-all duration-300 opacity-0 group-hover:opacity-50 text-[10px] whitespace-nowrap text-right font-mono ml-2">
                                    ⌘K / Ctrl K
                                </span>
                            </button>

                            <button onClick={() => { playClick(); setIsSearchOpen(true); }} className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"><Search className="w-5 h-5" /></button>

                            {/* Utility Buttons - Moved to group with Search */}
                            <button onClick={togglePrivacyMode} className={`p-2.5 rounded-xl transition-all hover:scale-105 ${privacyMode ? 'bg-lime-700/15 text-lime-700 dark:bg-[#bef264] dark:text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`} title="Privacy Mode">
                                {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>

                            <ThemeModeDropdown
                                themeMode={themeMode}
                                onChange={(mode) => { playClick(); onSetThemeMode(mode); }}
                                isDarkMode={isDarkMode}
                                compact
                                buttonClassName="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center"
                            />

                            {/* Data source toggle (Mock <-> Real) */}
                            <button
                                onClick={() => {
                                    playClick();
                                    handleDemoModeToggle(!demoMode);
                                }}
                                className={`px-3 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${demoMode
                                    ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700/30 dark:text-amber-300'
                                    : 'bg-lime-50 border-lime-200 text-lime-700 dark:bg-lime-900/20 dark:border-lime-700/30 dark:text-lime-300'
                                    }`}
                                title={demoMode ? 'Switch to real backend data' : 'Switch to mock demo data'}
                            >
                                {demoMode ? 'Mock Data' : 'Real Data'}
                            </button>

                            <div className="h-6 w-px bg-slate-300 dark:bg-white/10 mx-1 hidden sm:block" />

                            {/* LIVE CLOCK - Moved next to Profile */}
                            <HeaderClock />

                            {/* Profile with Popover Menu */}
                            <div className="relative profile-menu-container">
                                <button
                                    onClick={() => { playClick(); setIsProfileOpen(!isProfileOpen); }}
                                    className="flex items-center gap-2 pl-1 cursor-pointer group/profile bg-transparent border-none"
                                    aria-label="Open User Menu"
                                >
                                    <div className="relative group-hover/profile:scale-105 transition-transform">
                                        {user?.avatar ? (
                                            <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 shadow-sm object-cover" alt="Profile" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 shadow-sm bg-slate-800 dark:bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                                                {getInitials(user?.name)}
                                            </div>
                                        )}
                                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#f0f2f5] dark:border-cosmic animate-pulse" />

                                        {/* Refined Hover Tooltip */}
                                        <div className="absolute top-full right-0 mt-3 hidden group-hover/profile:flex flex-col items-end w-max pointer-events-none transition-all duration-300 opacity-0 group-hover/profile:opacity-100 translate-y-1 group-hover/profile:translate-y-0">
                                            <div className="px-3 py-1.5 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 dark:border-white/10 text-right">
                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Pro Account</span>
                                                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{user.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                                {isProfileOpen && <ProfileMenu />}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT — dynamic padding so it shifts smoothly with the header when strips appear/disappear. */}
            <main
                className="w-full max-w-[99%] mx-auto px-3 md:px-5 lg:px-7 pb-24 lg:pb-16 min-h-[500px] relative z-10 transition-[padding-top] duration-200 font-sans"
                style={{ paddingTop: headerHeightPx + stripOffset + mainContentTopGapPx }}
            >
                {/* key on pathname triggers the CSS route-in animation on every navigation */}
                <div key={location.pathname} className="animate-route-in">
                    <Outlet context={{ privacyMode, openSearch: () => setIsSearchOpen(true) }} />
                </div>
            </main>

            {/* Floating Action Button (Mapped to Help Page) */}
            <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40">
                <Link
                    to="/help"
                    onClick={() => { playSuccess(); }}
                    className="w-16 h-16 bg-lime-600 hover:bg-lime-700 text-white dark:bg-[#bef264] dark:hover:bg-[#a3e635] dark:text-black border dark:border-[#333] border-transparent rounded-[24px] flex items-center justify-center shadow-[0_0_20px_rgba(101,163,13,0.5)] dark:shadow-[0_0_20px_rgba(190,242,100,0.5)] transition-all hover:scale-110 hover:rotate-12 duration-300"
                >
                    <HelpCircle className="w-8 h-8" />
                </Link>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNavBar navItems={navItems} currentPath={currentPath} onNavigate={(id) => { playClick(); navigate(`/${id}`); }} />

            {/* Search Overlay */}
            {isSearchOpen && <SearchCommandPalette onClose={() => setIsSearchOpen(false)} />}

        </div>
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
            <div className={`min-h-screen w-full flex items-center justify-center ${isDarkMode ? 'bg-[#0f0f12] text-white' : 'bg-white text-slate-900'}`}>
                <div className="text-sm font-bold tracking-wide opacity-80">Loading secure preview…</div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className={`min-h-screen w-full flex items-center justify-center ${isDarkMode ? 'bg-[#0f0f12] text-white' : 'bg-white text-slate-900'}`}>
                <div className="max-w-md w-full px-6">
                    <div className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="font-black tracking-wide mb-2">Preview unavailable</div>
                        <div className="text-sm opacity-80">{error || 'This link may be invalid or expired.'}</div>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className={`mt-4 w-full h-11 rounded-xl font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'bg-[#bef264] text-black hover:bg-[#a3e635]' : 'bg-lime-600 text-white hover:bg-lime-700'}`}
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
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstVisitThemeNotice, setFirstVisitThemeNotice] = useState<string | null>(null);

    // ── Offline / SW-update awareness ────────────────────────────────────────
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

    // -- STATE MANAGEMENT via Store --
    const { projects, user, authResolved, saveProject, updateUser, resetStore } = useStore();
    const isLiveMode = !isMockMode();
    const handleGetStarted = () => {
        if (user.id) {
            window.location.assign('/dashboard');
            return;
        }

        if (isLiveMode) {
            setMockModeAndNavigate(true, '/dashboard');
            return;
        }

        window.location.assign('/dashboard');
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

    // ── Toast queue ────────────────────────────────────────────────────────────
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastCounter = useRef(0);
    const showToast: ToastFn = React.useCallback((message, kind = 'success') => {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, message, kind }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);
    const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
    // ──────────────────────────────────────────────────────────────────────────

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

                {/* ── Connection / update strips — fixed to viewport top so they're
                    always visible regardless of scroll position. The header and
                    main content read stripOffset via context to shift down. ── */}
                {showOfflineStrip && (
                    <div className="fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 bg-slate-800 dark:bg-[#0f0f15] border-b border-slate-700 dark:border-white/10 text-slate-100 text-[11px] font-bold h-7 z-[200]">
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
                    <div className="fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 bg-lime-600 dark:bg-lime-600 text-white text-[11px] font-bold h-7 z-[200]">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span>Back online — connection restored.</span>
                        </div>
                    </div>
                )}

                {/* ── SW update available strip ── */}
                {showUpdateStrip && (
                    <div className="fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 bg-lime-600 text-white text-[11px] font-bold h-7 z-[200]">
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
                            <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-md shadow-lg px-4 py-2 text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-200">
                                <CheckCircle className="w-4 h-4 text-lime-600 dark:text-[#bef264]" />
                                <span>{firstVisitThemeNotice}</span>
                                <button
                                    type="button"
                                    onClick={() => setFirstVisitThemeNotice(null)}
                                    className="ml-1 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
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
                                    currentTheme={themeMode}
                                    onSetThemeMode={setThemeMode}
                                    toggleTheme={cycleTheme}
                                />
                            }
                        />
                        <Route path="/signin" element={<SignInPage themeMode={themeMode} toggleTheme={cycleTheme} />} />
                        <Route path="/c/:token" element={<ClientLinkWrapper isDarkMode={isDarkMode} themeMode={themeMode} onToggleTheme={cycleTheme} onSetThemeMode={setThemeMode} />} />
                        <Route path="/portal/:token" element={<ClientPortalWrapper />} />
                        <Route element={protectLiveRoute(<AppLayout
                            user={user}
                            projects={projects}
                            isDarkMode={isDarkMode}
                            themeMode={themeMode}
                            onSetThemeMode={setThemeMode}
                            setIsDarkMode={setIsDarkMode}
                            togglePrivacyMode={togglePrivacyMode}
                            privacyMode={privacyMode}
                            onSignOut={resetStore}
                        />)}>
                            <Route path="/dashboard" element={<Suspense fallback={<DashboardSkeleton />}><DashboardView projects={projects} user={user} /></Suspense>} />
                            <Route path="/activity" element={<Suspense fallback={<PageLoader />}><ActivityView /></Suspense>} />
                            <Route path="/vault" element={<Suspense fallback={<VaultSkeleton />}><VaultView projects={projects} /></Suspense>} />
                            <Route path="/reports" element={<Suspense fallback={<PageLoader />}><ReportsView /></Suspense>} />
                            <Route path="/settings" element={<SettingsPage user={user} onUpdateUser={updateUser} onSignOut={resetStore} />} />
                            <Route path="/trash" element={<TrashPage onBack={() => window.history.back()} />} />
                            <Route path="/help" element={<HelpPage onBack={() => window.history.back()} />} />
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
