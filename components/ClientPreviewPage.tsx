
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Lock, Unlock, Download, ShieldCheck,
    Play, Image as ImageIcon, FileText,
    ChevronLeft, MessageSquare,
    Clock, Search, Filter,
    LayoutGrid, Eye,
    Check,
    DollarSign, Banknote, Loader2, MessageSquarePlus, X, Send, CreditCard, RefreshCw,
    Maximize2, Grid as GridIcon, Minimize2, ArrowLeft, ArrowRight, ArrowUp, Flame,
    PenTool, Coins, AlertTriangle, Trash2, PanelRightClose, PanelRightOpen,
    FileCode, CheckCircle, Info, ExternalLink, Menu, Key, Copy, EyeOff, List, ZoomIn, ZoomOut, ShieldOff
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Project, FileAsset, UserProfile } from '../types';
import { playClick, playSuccess } from '../utils/sound';
import { PaymentTerminal } from './PaymentTerminal';
import { InlineErrorBanner } from './Shared';
import ThemeModeDropdown from './ThemeModeDropdown';

// --- PROPS INTERFACE ---
interface ClientPreviewPageProps {
    project: Project;
    libraryProjects?: Project[];
    libraryEnabled?: boolean;
    user?: UserProfile;
    isDarkMode: boolean;
    themeMode: 'light' | 'dark' | 'system';
    onToggleTheme: () => void;
    onSetThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
    onBack: () => void;
    isEmbedded?: boolean;
    allowSidebarCollapse?: boolean; // allow collapse controls even when embedded (Creator/editor preview)
    onDockedSidebarCollapseChange?: (collapsed: boolean) => void; // for embedded editor overlay positioning/sync
    reserveCollapsedHeaderBackSlot?: number; // number of icon-button slots (w-10 each) to reserve at the start of the collapsed header
    isLocked: boolean;
    lightboxIndex: number | null;
    setLightboxIndex: (index: number | null) => void;
    revisions: Record<string, any[]>;
    onPaymentComplete: () => void;
    handleSubmitRevision: (text: string) => void;
    handleDeleteRevision: (index: number) => void;
    activeFilter: 'all' | 'image' | 'doc' | 'video' | 'audio' | 'archive';
    setActiveFilter: (filter: 'all' | 'image' | 'doc' | 'video' | 'audio' | 'archive') => void;
    theme: any;
    filteredFiles: FileAsset[];
    handleRequestCorrection: (index: number) => void;
    accessDenied: boolean;
    refreshAccess: () => void;
    paymentError?: string | null;
    onDismissPaymentError?: () => void;
    // Inline asset editing (desktop preview mode only)
    onRenameAsset?: (fileId: string, newName: string) => void;
    onResizeAsset?: (fileId: string, newSize: string) => void;
    onRemoveAsset?: (fileId: string) => void;
}

interface ClientLibraryViewProps {
    projects: Project[];
    isDarkMode: boolean;
}

const ClientLibraryView: React.FC<ClientLibraryViewProps> = ({ projects, isDarkMode }) => {
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'newest' | 'oldest' | 'name'>('recent');
    const [recentViewedMap, setRecentViewedMap] = useState<Record<string, string>>(() => {
        try {
            const raw = localStorage.getItem('th_client_library_recent');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('th_client_library_recent', JSON.stringify(recentViewedMap));
        } catch {
        }
    }, [recentViewedMap]);

    const normalizedQuery = searchTerm.trim().toLowerCase();

    const visibleProjects = projects
        .map((libraryProject) => {
            const unlockedFiles = (libraryProject.files || []).filter(f => (f.includeInLibrary !== false) && (!f.locked || libraryProject.status === 'paid' || libraryProject.status === 'completed'));
            const filtered = unlockedFiles.filter(file => {
                if (!normalizedQuery) return true;
                const haystack = `${libraryProject.name} ${file.name} ${file.type}`.toLowerCase();
                return haystack.includes(normalizedQuery);
            });
            return { ...libraryProject, files: filtered };
        })
        .filter(p => p.files.length > 0)
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

            const recentA = Math.max(...a.files.map(f => new Date(recentViewedMap[f.id] || 0).getTime()), 0);
            const recentB = Math.max(...b.files.map(f => new Date(recentViewedMap[f.id] || 0).getTime()), 0);
            if (recentA === recentB) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return recentB - recentA;
        });

    const totalVisibleAssets = visibleProjects.reduce((acc, p) => acc + p.files.length, 0);

    const handleAssetOpen = (fileId: string) => {
        setRecentViewedMap(prev => ({ ...prev, [fileId]: new Date().toISOString() }));
    };

    return (
        <div className="space-y-5 pb-24">
            <section className={`rounded-3xl border p-4 md:p-5 ${isDarkMode ? 'bg-[#1a1a23]/50 border-white/10' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Client Library</p>
                        <p className={`text-xs ${textMuted} mt-1`}>{totalVisibleAssets} assets across {visibleProjects.length} deliveries</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-3 h-10 rounded-xl border ${isDarkMode ? 'bg-black/20 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                            <Search className="w-3.5 h-3.5" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search library"
                                className="bg-transparent outline-none text-xs w-40"
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className={`h-10 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none ${isDarkMode ? 'bg-black/20 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
                        >
                            <option value="recent">Recently Viewed</option>
                            <option value="newest">Newest Delivery</option>
                            <option value="oldest">Oldest Delivery</option>
                            <option value="name">Project Name</option>
                        </select>
                    </div>
                </div>
            </section>

            {visibleProjects.length === 0 && (
                <section className={`rounded-3xl border p-10 text-center ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-600'} backdrop-blur-md`}>
                    <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white/10 bg-black/10">
                        <Clock className={`w-6 h-6 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`} />
                    </div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {projects.length === 0 ? 'No past deliveries yet' : 'No library assets match your search'}
                    </div>
                    <div className="text-xs mt-2 opacity-70">
                        {projects.length === 0 ? 'Completed deliveries for this client will appear here.' : 'Try a different search query.'}
                    </div>
                </section>
            )}

            {visibleProjects.map((libraryProject) => {
                const unlockedFiles = libraryProject.files;

                return (
                    <section
                        key={libraryProject.id}
                        className={`rounded-3xl border p-5 md:p-6 ${isDarkMode ? 'bg-[#1a1a23]/70 border-white/10' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                            <div>
                                <h3 className={`text-xl font-serif font-medium ${textPrimary}`}>{libraryProject.name}</h3>
                                <p className={`text-xs font-bold uppercase tracking-widest ${textMuted} mt-1`}>
                                    Delivered {new Date(libraryProject.createdAt).toLocaleDateString()} · {unlockedFiles.length} assets
                                </p>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isDarkMode ? 'bg-[#bef264]/10 border-[#bef264]/20 text-[#bef264]' : 'bg-lime-50 border-lime-200 text-lime-700'}`}>
                                Library
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {unlockedFiles.map((file) => {
                                const href = file.downloadUrl || file.externalUrl || file.previewUrl;
                                const recentViewedAt = recentViewedMap[file.id];
                                return (
                                    <article
                                        key={file.id}
                                        className={`rounded-2xl border p-3 ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                                    >
                                        <div className="aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-black/10 flex items-center justify-center">
                                            {file.previewUrl ? (
                                                <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <FileText className={`w-7 h-7 ${textMuted}`} />
                                            )}
                                        </div>
                                        <p className={`text-sm font-bold truncate ${textPrimary}`}>{file.name}</p>
                                        <p className={`text-[10px] uppercase tracking-widest ${textMuted} mt-1`}>{file.type} · {file.size}</p>
                                        {recentViewedAt && (
                                            <p className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#bef264]' : 'text-lime-700'}`}>
                                                Viewed {new Date(recentViewedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                        {href ? (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => handleAssetOpen(file.id)}
                                                className={`mt-3 h-9 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-[#bef264] text-black hover:bg-[#a3e635]' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Open Asset
                                            </a>
                                        ) : (
                                            <div className={`mt-3 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                                                Link Unavailable
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

// --- VISUAL CONSTANTS & UTILS ---

const GRADIENT_TEXT = "text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-600 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-500";
// OPTIMIZED: High-contrast heavy grain
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`;

const SVG_PATTERNS = {
    lines: `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0' stroke='black' stroke-width='2' fill='none'/%3E%3C/svg%3E`,
    dots: `data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='2' fill='black'/%3E%3C/svg%3E`,
    grid: `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0H40V40' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E`,
    plus: `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 15V25M15 20H25' stroke='black' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E`,
    hex: `data:image/svg+xml,%3Csvg width='28' height='24' viewBox='0 0 28 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 0L28 6L28 18L14 24L0 18L0 6Z M14 0L0 6 M28 6L14 12L0 18 M28 18L14 12L0 6' fill='none' stroke='black' stroke-width='1'/%3E%3C/svg%3E`,
    rhombus: `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E`,
    waves: `data:image/svg+xml,%3Csvg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 10 0 20 10 T 40 10' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E`,
    radar: `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='5' fill='none' stroke='black' stroke-width='1.5'/%3E%3Ccircle cx='30' cy='30' r='12' fill='none' stroke='black' stroke-width='1.5'/%3E%3Ccircle cx='30' cy='30' r='20' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E`,
    cross: `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 15L25 25M25 15L15 25' stroke='black' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E`,
    graph: `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0H20V20' fill='none' stroke='black' stroke-width='0.5'/%3E%3C/svg%3E`,
    zigzag: `data:image/svg+xml,%3Csvg width='40' height='30' viewBox='0 0 40 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L10 0 L20 30 L30 0 L40 30' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E`
};

const EditorialIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 15C4 10.6 9.4 7 16 7C22.6 7 28 10.6 28 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="22" r="6" fill="#bef264" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const getFileIcon = (type: string) => {
    if (type === 'image' || type === 'design') return <ImageIcon className="w-8 h-8 opacity-50" />;
    if (type === 'video') return <Play className="w-8 h-8 opacity-50" />;
    if (type === 'archive') return <FileCode className="w-8 h-8 opacity-50" />;
    return <FileText className="w-8 h-8 opacity-50" />;
};

// --- SUB-COMPONENT: CREDENTIAL VAULT WIDGET ---
const CredentialVaultWidget = ({ credentials, isLocked, isDarkMode }: any) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

    const handleCopy = (text: string, id: string) => {
        playClick();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleReveal = (id: string) => {
        playClick();
        const next = new Set(revealedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setRevealedIds(next);
    };

    if (!credentials || credentials.length === 0) return null;

    return (
        <div className={`mt-8 ${isDarkMode ? 'bg-[#18181b]/50 border-white/5' : 'bg-white/60 border-slate-200'} border rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group/vault`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                        <Key className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Credential Vault</span>
                </div>
                {isLocked ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                        <Lock className="w-3 h-3" /> Encrypted
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-lime-500 bg-lime-500/10 px-2 py-1 rounded">
                        <Unlock className="w-3 h-3" /> Unlocked
                    </span>
                )}
            </div>

            {/* List */}
            <div className="space-y-3 relative z-10">
                {credentials.map((cred: any) => (
                    <div key={cred.id} className={`p-3 rounded-xl border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'} transition-all`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{cred.serviceName}</span>
                            {!isLocked && (
                                <button
                                    onClick={() => toggleReveal(cred.id)}
                                    className={`p-1 rounded hover:bg-white/10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                >
                                    {revealedIds.has(cred.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                            )}
                        </div>

                        {isLocked ? (
                            // LOCKED STATE
                            <div className="space-y-1 select-none">
                                <div className="h-6 w-full bg-slate-200 dark:bg-white/5 rounded flex items-center px-2">
                                    <span className="font-mono text-[10px] text-slate-400 tracking-widest blur-[4px]">user_hidden</span>
                                </div>
                                <div className="h-6 w-full bg-slate-200 dark:bg-white/5 rounded flex items-center px-2">
                                    <span className="font-mono text-[10px] text-slate-400 tracking-widest blur-[4px]">pass_hidden</span>
                                </div>
                            </div>
                        ) : (
                            // UNLOCKED STATE
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className={`flex-1 h-7 px-2 rounded border flex items-center font-mono text-[10px] truncate ${isDarkMode ? 'bg-black/40 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                                        {cred.username}
                                    </div>
                                    <button
                                        onClick={() => handleCopy(cred.username, cred.id + '_u')}
                                        className={`w-7 h-7 flex items-center justify-center rounded border ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50'} transition-colors`}
                                        title="Copy Username"
                                    >
                                        {copiedId === cred.id + '_u' ? <Check className="w-3 h-3 text-lime-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <div className={`flex-1 h-7 px-2 rounded border flex items-center font-mono text-[10px] truncate ${isDarkMode ? 'bg-black/40 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                                        {revealedIds.has(cred.id) ? cred.password : '****************'}
                                    </div>
                                    <button
                                        onClick={() => handleCopy(cred.password, cred.id + '_p')}
                                        className={`w-7 h-7 flex items-center justify-center rounded border ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50'} transition-colors`}
                                        title="Copy Password"
                                    >
                                        {copiedId === cred.id + '_p' ? <Check className="w-3 h-3 text-lime-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                                    </button>
                                </div>
                                {cred.notes && (
                                    <p className="text-[10px] text-slate-500 italic mt-1 pl-1 border-l-2 border-slate-200 dark:border-white/10">
                                        {cred.notes}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Locked Overlay Effect */}
            {isLocked && (
                <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-white/10 pointer-events-none" />
            )}
        </div>
    );
};

// --- SUB-COMPONENT: VISUAL ASSET GRID ---
const VisualAssetGrid = ({ files, isLocked, isDarkMode, isEmbedded, revisions, onAssetClick, onRequestCorrection, isPhoneLike, onRename, onResize, onRemove }: any) => {
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const brandGreenBg = isDarkMode ? 'bg-[#bef264]' : 'bg-lime-600';
    const brandGreenShadow = isDarkMode ? 'shadow-[0_0_10px_#bef264]' : 'shadow-[0_0_10px_rgba(101,163,13,0.5)]';
    const borderColor = isDarkMode ? 'border-white/5' : 'border-slate-200';
    const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());
    const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingNameVal, setEditingNameVal] = useState('');
    const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
    const [editingSizeVal, setEditingSizeVal] = useState('');
    const gridRef = useRef<HTMLDivElement | null>(null);
    const [gridCols, setGridCols] = useState(1);
    const getUnlockedPreviewUrl = (file: FileAsset) => {
        if (!file.previewUrl) return file.previewUrl;
        if (file.locked && isLocked) return file.previewUrl;
        if ((file.type === 'image' || file.type === 'design') && (file.downloadUrl || file.externalUrl)) {
            return file.downloadUrl || file.externalUrl || file.previewUrl;
        }
        // Try to request a higher-quality variant for unlocked previews when providers support URL params.
        let upgraded = file.previewUrl;
        upgraded = upgraded.replace(/([?&])w=\d+/i, '$1w=2400');
        upgraded = upgraded.replace(/([?&])width=\d+/i, '$1width=2400');
        upgraded = upgraded.replace(/([?&])q=\d+/i, '$1q=100');
        upgraded = upgraded.replace(/([?&])quality=\d+/i, '$1quality=100');
        return upgraded;
    };

    // Container-width based columns so embedded previews behave like real desktop when there's room.
    // Thresholds tuned for split-landscape: keep 2-up even when the docked sidebar is open.
    useEffect(() => {
        const el = gridRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const computeCols = (w: number) => (w >= 980 ? 3 : (w >= 500 ? 2 : 1));
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width ?? 0;
            setGridCols(computeCols(w));
        });
        ro.observe(el);
        setGridCols(computeCols(el.getBoundingClientRect().width));
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={gridRef} className="w-full">
            <div className="grid gap-3 sm:gap-4 lg:gap-6 pb-24" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
                {files.map((file: FileAsset, index: number) => {
                    const isRevisionSent = !!(revisions[file.id]?.length);
                    return (
                        <div
                        key={file.id}
                        className={`group relative ${isDarkMode ? 'bg-[#23232e] border-white/5 hover:shadow-white/5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]'} rounded-[1.5rem] border overflow-hidden transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-[1.01]`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Inline remove button (editor desktop preview only) */}
                        {onRemove && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
                                className="absolute top-2.5 right-2.5 z-[50] opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center shadow-lg"
                                title="Remove asset"
                                aria-label="Remove asset"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onAssetClick(index)}
                            className={`aspect-[16/10] w-full ${isDarkMode ? 'bg-[#0f0f15]' : 'bg-slate-50'} relative overflow-hidden rounded-t-[1.5rem] isolate flex items-center justify-center cursor-pointer border-none p-0`}
                            aria-label={`View details for ${file.name}`}
                        >
                            {file.previewUrl ? (
                                <img
                                    src={getUnlockedPreviewUrl(file)}
                                    alt={file.name}
                                    className={`w-full h-full object-cover rounded-t-[1.5rem] transition-all duration-700 [image-rendering:auto] ${file.locked && isLocked ? 'scale-105 blur-[8px] opacity-80' : 'group-hover:scale-[1.02] [filter:contrast(1.08)_saturate(1.06)_brightness(1.02)]'}`}
                                />
                            ) : (
                                <div className="opacity-20">{getFileIcon(file.type)}</div>
                            )}
                            {file.locked && isLocked && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                                    <div className={`absolute inset-0 rounded-t-[1.5rem] ${isDarkMode ? 'bg-black/20' : 'bg-white/10'} backdrop-blur-md`} />
                                    <div className="relative z-30 flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-2xl ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/20 border-white/30'} backdrop-blur-xl border flex items-center justify-center mb-4 shadow-2xl`}>
                                            <Lock className="w-7 h-7 text-white drop-shadow-md" />
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full ${isDarkMode ? 'bg-black/60 border-white/10' : 'bg-black/50 border-white/10'} backdrop-blur-md border text-[10px] font-bold uppercase tracking-widest text-white`}>Encrypted Preview</span>
                                    </div>
                                </div>
                            )}
                            <div className="absolute top-4 left-4 z-30">
                                <div className={`px-3 py-1.5 rounded-lg ${isDarkMode ? 'bg-black/80 border-white/10 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700'} backdrop-blur-md border shadow-sm flex items-center gap-2`}>
                                    {getFileIcon(file.type).props.className.includes('Image') ? <ImageIcon className="w-3 h-3 text-slate-500" /> : <FileText className="w-3 h-3 text-slate-500" />}
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{file.type}</span>
                                </div>
                            </div>
                            <div className="absolute inset-0 z-20 rounded-t-[1.5rem] bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform"><Maximize2 className="w-5 h-5" /></div>
                            </div>
                        </button>
                        <div className="p-4 md:p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1 min-w-0 pr-4">
                                    {onRename && editingNameId === file.id ? (
                                        <input
                                            autoFocus
                                            value={editingNameVal}
                                            onChange={(e) => setEditingNameVal(e.target.value)}
                                            onBlur={() => { if (editingNameVal.trim()) onRename(file.id, editingNameVal.trim()); setEditingNameId(null); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { if (editingNameVal.trim()) onRename(file.id, editingNameVal.trim()); setEditingNameId(null); } if (e.key === 'Escape') setEditingNameId(null); }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`w-full font-bold text-sm md:text-lg mb-1 bg-transparent border-b-2 outline-none truncate ${isDarkMode ? 'text-white border-[#bef264]' : 'text-slate-900 border-lime-500'}`}
                                        />
                                    ) : (
                                        <h3
                                            className={`font-bold text-sm md:text-lg ${textPrimary} mb-1 transition-colors truncate ${onRename ? 'cursor-text hover:opacity-70' : ''}`}
                                            onClick={onRename ? (e) => { e.stopPropagation(); setEditingNameId(file.id); setEditingNameVal(file.name); } : undefined}
                                            title={onRename ? 'Click to rename' : undefined}
                                        >{file.name}</h3>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-400">
                                        {onResize && editingSizeId === file.id ? (
                                            <input
                                                autoFocus
                                                value={editingSizeVal}
                                                onChange={(e) => setEditingSizeVal(e.target.value)}
                                                onBlur={() => { if (editingSizeVal.trim()) onResize(file.id, editingSizeVal.trim()); setEditingSizeId(null); }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { if (editingSizeVal.trim()) onResize(file.id, editingSizeVal.trim()); setEditingSizeId(null); } if (e.key === 'Escape') setEditingSizeId(null); }}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`w-20 font-mono bg-transparent border-b outline-none text-[10px] ${isDarkMode ? 'text-slate-300 border-[#bef264]/50' : 'text-slate-600 border-lime-400'}`}
                                            />
                                        ) : (
                                            <span
                                                className={onResize ? 'cursor-text hover:opacity-70' : ''}
                                                onClick={onResize ? (e) => { e.stopPropagation(); setEditingSizeId(file.id); setEditingSizeVal(file.size); } : undefined}
                                                title={onResize ? 'Click to edit size' : undefined}
                                            >{file.size}</span>
                                        )}
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" /><span className="uppercase tracking-wider">Version {file.version}.0</span>
                                    </div>
                                </div>
                                <div className={`w-2.5 h-2.5 shrink-0 rounded-full mt-1.5 ${file.locked && isLocked ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : `${brandGreenBg} ${brandGreenShadow}`}`} />
                            </div>
                            <div className={`${expandedSpecs.has(file.id) ? 'block' : (isPhoneLike ? 'hidden' : 'hidden md:block')} mb-4 md:mb-6 p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold uppercase text-slate-500">Technical Specs</span><ShieldCheck className="w-3 h-3 text-slate-400" /></div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-mono">
                                    <div><span className="opacity-60">Type</span> <span className="uppercase">{file.type}</span></div>
                                    <div><span className="opacity-60">Size</span> {file.size}</div>
                                    <div className="truncate"><span className="opacity-60">Source</span> {file.tag || (file.storageProvider && file.storageProvider !== 'native' ? `${file.storageProvider.charAt(0).toUpperCase()}${file.storageProvider.slice(1)}` : 'Native')}</div>
                                    <div><span className="opacity-60">Date</span> {file.uploadDate}</div>
                                    {file.folderName && <div className="col-span-2 truncate"><span className="opacity-60">Folder</span> {file.folderName}</div>}
                                    {file.metadata?.resolution && <div><span className="opacity-60">Res</span> {file.metadata.resolution}</div>}
                                    {file.metadata?.colorProfile && <div><span className="opacity-60">Fmt</span> {file.metadata.colorProfile}</div>}
                                    {file.metadata?.hash && (
                                        <div className="col-span-2 flex items-center gap-1.5 pt-0.5 border-t border-current/10">
                                            <span className="opacity-60 truncate flex-1">SHA {file.metadata.hash}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(file.metadata!.hash!);
                                                    setCopiedHashId(file.id);
                                                    setTimeout(() => setCopiedHashId(null), 2000);
                                                }}
                                                title="Copy SHA-256 hash"
                                                className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                                    copiedHashId === file.id
                                                        ? 'bg-lime-100 border-lime-300 text-lime-700 dark:bg-lime-900/30 dark:border-lime-700 dark:text-lime-400'
                                                        : 'border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <Copy className="w-2.5 h-2.5" />
                                                {copiedHashId === file.id ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`pt-4 md:pt-6 border-t ${borderColor} flex flex-col sm:flex-row gap-3`}>
                                {file.locked && isLocked ? (
                                    <>
                                        <button onClick={() => onRequestCorrection(index)} className={`flex-1 h-12 sm:h-11 flex items-center justify-center gap-2 rounded-lg border text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${isRevisionSent ? (isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' : 'bg-amber-100 text-amber-600 hover:bg-amber-200') : (isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-500')}`}>
                                            {isRevisionSent ? <CheckCircle className="w-4 h-4" /> : <MessageSquarePlus className="w-4 h-4" />} <span className="hidden sm:inline">{isRevisionSent ? "View Request" : "Request Correction"}</span><span className="sm:hidden">{isRevisionSent ? "View" : "Request"}</span>
                                        </button>
                                        <button aria-label="More Info" onClick={() => setExpandedSpecs(prev => { const next = new Set(prev); if (next.has(file.id)) next.delete(file.id); else next.add(file.id); return next; })} className={`h-12 sm:h-11 w-12 sm:w-11 flex items-center justify-center rounded-lg border transition-colors ${expandedSpecs.has(file.id) ? (isDarkMode ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-200 border-slate-300 text-slate-900') : (isDarkMode ? 'border-white/5 text-slate-400 hover:text-white' : 'border-slate-100 text-slate-400 hover:text-slate-900')}`}><Info className="w-4 h-4" /></button>
                                    </>
                                ) : (
                                    file.downloadUrl ? (
                                        <>
                                            <a href={file.downloadUrl} target="_blank" rel="noopener noreferrer" className={`flex-1 h-11 md:h-12 ${isDarkMode ? 'bg-[#bef264] hover:bg-[#a3e635] text-black' : 'bg-lime-600 hover:bg-lime-700 text-white'} font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 transition-all hover:scale-[1.02]`}>
                                                {file.externalUrl ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />} <span className="hidden sm:inline">{file.externalUrl ? "Open Secure Link" : "Download Original"}</span><span className="sm:hidden">{file.externalUrl ? "Open" : "Download"}</span>
                                            </a>
                                            <button aria-label="Request Correction" onClick={() => onRequestCorrection(index)} disabled={isRevisionSent} className={`h-12 w-12 flex items-center justify-center rounded-xl border transition-colors ${isRevisionSent ? (isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-default' : 'bg-amber-100 text-amber-600 cursor-default') : (isDarkMode ? 'border-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-500' : 'border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-amber-500')}`}><MessageSquarePlus className="w-5 h-5" /></button>
                                        </>
                                    ) : (
                                        <button disabled className="flex-1 h-12 bg-slate-200 dark:bg-white/10 text-slate-400 font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-wait"><Loader2 className="w-4 h-4 animate-spin" /> Generating Link...</button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                );
                })}
            </div>
        </div>
    );
};
// --- SUB-COMPONENT: VISUAL ASSET LIST (PREMIUM) ---
const VisualAssetList = ({ files, isLocked, isDarkMode, isEmbedded, onAssetClick, onRequestCorrection, revisions, onRename, onResize, onRemove }: any) => {
    const borderColor = isDarkMode ? 'border-white/5' : 'border-slate-200';
    const brandGreenBg = isDarkMode ? 'bg-[#bef264]' : 'bg-lime-600';
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingNameVal, setEditingNameVal] = useState('');
    const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
    const [editingSizeVal, setEditingSizeVal] = useState('');

    return (
        <div className="flex flex-col gap-4 pb-20">
            {files.map((file: FileAsset, index: number) => {
                const isRevisionSent = revisions?.[file.id]?.length > 0;
                const isFileLocked = file.locked && isLocked;

                return (
                    <div
                        key={file.id}
                        onClick={() => onAssetClick(index)}
                        className={`
                            group relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer backdrop-blur-md
                            ${isDarkMode
                                ? 'bg-[#14141b]/70 border-white/10 hover:border-white/20 shadow-[0_10px_35px_-14px_rgba(0,0,0,0.55)]'
                                : 'bg-white/70 border-slate-200 hover:border-slate-300 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.18)]'
                            }
                            hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)]
                        `}
                    >
                        {/* Inline remove button (editor desktop preview only) */}
                        {onRemove && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
                                className="absolute top-2.5 right-2.5 z-[50] opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center shadow-lg"
                                title="Remove asset"
                                aria-label="Remove asset"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {/* Hover glow */}
                        <div className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDarkMode
                            ? 'bg-[radial-gradient(circle_at_top_left,_rgba(190,242,100,0.10)_0%,_transparent_55%)]'
                            : 'bg-[radial-gradient(circle_at_top_left,_rgba(101,163,13,0.12)_0%,_transparent_55%)]'
                            }`} />

                        <div className="relative flex items-center gap-4 p-4 sm:p-5">
                            {/* Thumbnail */}
                            <button
                                type="button"
                                onClick={() => onAssetClick(index)}
                                className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-2xl ring-1 transition-all border-none p-0 ${isDarkMode ? 'bg-[#0f0f15] ring-white/10' : 'bg-slate-50 ring-slate-200/80'} group-hover:ring-white/20`}
                                aria-label={`View ${file.name}`}
                            >
                                {file.previewUrl ? (
                                    <img
                                        src={file.previewUrl}
                                        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isFileLocked ? 'blur-[3px] grayscale-[30%] opacity-60' : ''}`}
                                        alt={file.name}
                                    />
                                ) : (
                                    <div className="opacity-30">{getFileIcon(file.type)}</div>
                                )}
                                {isFileLocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <Lock className="w-5 h-5 text-white drop-shadow-lg" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                </div>
                            </button>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${isFileLocked
                                                ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                                                : `${brandGreenBg} ${isDarkMode ? 'shadow-[0_0_12px_rgba(190,242,100,0.35)]' : 'shadow-[0_0_10px_rgba(101,163,13,0.25)]'}`
                                                }`} />
                                            {onRename && editingNameId === file.id ? (
                                                <input
                                                    autoFocus
                                                    value={editingNameVal}
                                                    onChange={(e) => setEditingNameVal(e.target.value)}
                                                    onBlur={() => { if (editingNameVal.trim()) onRename(file.id, editingNameVal.trim()); setEditingNameId(null); }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { if (editingNameVal.trim()) onRename(file.id, editingNameVal.trim()); setEditingNameId(null); } if (e.key === 'Escape') setEditingNameId(null); }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`min-w-0 font-bold text-sm sm:text-base bg-transparent border-b-2 outline-none ${isDarkMode ? 'text-white border-[#bef264]' : 'text-slate-900 border-lime-500'}`}
                                                />
                                            ) : (
                                                <h3
                                                    className={`font-bold text-sm sm:text-base truncate ${isDarkMode ? 'text-white' : 'text-slate-900'} ${onRename ? 'cursor-text hover:opacity-70' : ''}`}
                                                    onClick={onRename ? (e) => { e.stopPropagation(); setEditingNameId(file.id); setEditingNameVal(file.name); } : undefined}
                                                    title={onRename ? 'Click to rename' : undefined}
                                                >{file.name}</h3>
                                            )}
                                            {isFileLocked ? (
                                                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Locked</span>
                                            ) : (
                                                <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isDarkMode ? 'text-[#bef264] bg-[#bef264]/10 border-[#bef264]/20' : 'text-lime-700 bg-lime-50 border-lime-200'}`}>Open</span>
                                            )}
                                        </div>

                                        <div className="mt-2 flex items-center gap-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono">
                                            <span className="uppercase tracking-wider">{file.type}</span>
                                            <span className={`w-px h-3 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                                            {onResize && editingSizeId === file.id ? (
                                                <input
                                                    autoFocus
                                                    value={editingSizeVal}
                                                    onChange={(e) => setEditingSizeVal(e.target.value)}
                                                    onBlur={() => { if (editingSizeVal.trim()) onResize(file.id, editingSizeVal.trim()); setEditingSizeId(null); }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { if (editingSizeVal.trim()) onResize(file.id, editingSizeVal.trim()); setEditingSizeId(null); } if (e.key === 'Escape') setEditingSizeId(null); }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`w-20 font-mono bg-transparent border-b outline-none text-[10px] ${isDarkMode ? 'text-slate-300 border-[#bef264]/50' : 'text-slate-600 border-lime-400'}`}
                                                />
                                            ) : (
                                                <span
                                                    className={onResize ? 'cursor-text hover:opacity-70' : ''}
                                                    onClick={onResize ? (e) => { e.stopPropagation(); setEditingSizeId(file.id); setEditingSizeVal(file.size); } : undefined}
                                                    title={onResize ? 'Click to edit size' : undefined}
                                                >{file.size}</span>
                                            )}
                                            {file.metadata?.resolution && (
                                                <>
                                                    <span className={`w-px h-3 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'} hidden sm:block`} />
                                                    <span className="hidden sm:block">{file.metadata.resolution}</span>
                                                </>
                                            )}
                                            <span className={`w-px h-3 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'} hidden sm:block`} />
                                            <span className="hidden sm:block uppercase tracking-wider">v{file.version}.0</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                        {isFileLocked ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRequestCorrection(index); }}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all text-[10px] font-bold uppercase tracking-widest ${isRevisionSent
                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                    : `${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`
                                                    }`}
                                                title={isRevisionSent ? 'View Request' : 'Request Correction'}
                                            >
                                                {isRevisionSent ? <CheckCircle className="w-4 h-4" /> : <MessageSquarePlus className="w-4 h-4" />}
                                                <span className="hidden md:inline">{isRevisionSent ? 'Requested' : 'Request'}</span>
                                            </button>
                                        ) : (
                                            <a
                                                href={file.downloadUrl}
                                                onClick={(e) => e.stopPropagation()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all text-[10px] font-bold uppercase tracking-widest ${isDarkMode
                                                    ? 'bg-[#bef264]/10 border-[#bef264]/20 text-[#bef264] hover:bg-[#bef264]/20'
                                                    : 'bg-lime-50 border-lime-200 text-lime-700 hover:bg-lime-100'}`}
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="hidden md:inline">Download</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// --- SUB-COMPONENT: VISUAL LIGHTBOX (OPTIMIZED) ---
const VisualLightbox = ({ file, allFiles, currentIndex, isLocked, isDarkMode, themeMode, revisions, onClose, onNext, onPrev, onSelect, onToggleTheme, onSetThemeMode, onSubmitRevision, onDeleteRevision, showWatermark = true, showProtectedLabel = true }: any) => {
    const [localShowWatermark, setLocalShowWatermark] = useState(showWatermark);
    const [localShowProtectedLabel, setLocalShowProtectedLabel] = useState(showProtectedLabel);
    // Sync when project-level props change
    useEffect(() => { setLocalShowWatermark(showWatermark); }, [showWatermark]);
    useEffect(() => { setLocalShowProtectedLabel(showProtectedLabel); }, [showProtectedLabel]);
    // START CLOSED to allow for animation sequence
    const [showSidebar, setShowSidebar] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const thumbnailDockRef = useRef<HTMLDivElement | null>(null);
    const hideDockButtonRef = useRef<HTMLButtonElement | null>(null);
    const [slideDirection, setSlideDirection] = useState<0 | 1 | -1>(0);
    const [currentRevisionText, setCurrentRevisionText] = useState('');
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [imagePreviewError, setImagePreviewError] = useState<string | null>(null);
    const [imageRetrySeed, setImageRetrySeed] = useState(0);
    const [textPreview, setTextPreview] = useState('');
    const [textPreviewError, setTextPreviewError] = useState<string | null>(null);
    const [isTextPreviewLoading, setIsTextPreviewLoading] = useState(false);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [imgRect, setImgRect] = useState({ width: 0, height: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);

    const computeImgRect = useCallback(() => {
        const img = imgRef.current;
        if (!img || !img.naturalWidth || !img.naturalHeight) return;
        const cw = img.clientWidth;
        const ch = img.clientHeight;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        const ratio = Math.min(cw / nw, ch / nh);
        setImgRect({ width: Math.round(nw * ratio), height: Math.round(nh * ratio) });
    }, []);
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const [searchParams] = useSearchParams();
    const pt = searchParams.get('pt');
    const paddingTop = pt ? `${pt}px` : undefined;

    // Push lightbox controls slightly lower on smaller devices so they don't feel glued to the status bar.
    const headerPaddingTop = paddingTop
        ? `max(28px, calc(${paddingTop} + 8px))`
        : 'max(28px, calc(20px + env(safe-area-inset-top)))';

    const [isClosing, setIsClosing] = useState(false);
    const isProtectedPreview = Boolean(file?.locked && isLocked);
    const inferredFileTypeFromUrl: FileAsset['type'] | null = (() => {
        const source = file?.downloadUrl || file?.externalUrl || '';
        if (!source) return null;
        try {
            const parsed = new URL(source);
            const pathName = parsed.pathname.split('/').filter(Boolean).pop() || '';
            const queryName = parsed.searchParams.get('filename') || parsed.searchParams.get('name') || parsed.searchParams.get('file') || '';
            const candidate = (queryName || pathName).toLowerCase();
            const ext = candidate.split('.').pop() || '';
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif', 'heic', 'tif', 'tiff'].includes(ext)) return 'image';
            if (['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
            if (['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
            if (ext === 'pdf') return 'pdf';
            if (['txt', 'md', 'rtf', 'doc', 'docx', 'odt', 'pages', 'csv', 'json', 'xml', 'log'].includes(ext)) return 'doc';
            if (['fig', 'sketch', 'xd', 'psd', 'ai'].includes(ext)) return 'design';
            return null;
        } catch {
            return null;
        }
    })();
    const effectiveFileType: FileAsset['type'] = file?.type === 'archive' && inferredFileTypeFromUrl
        ? inferredFileTypeFromUrl
        : (file?.type || 'archive');
    const viewerType: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'archive' | 'other' =
        (effectiveFileType === 'image' || effectiveFileType === 'design') ? 'image'
            : (effectiveFileType === 'video') ? 'video'
                : (effectiveFileType === 'audio') ? 'audio'
                    : (effectiveFileType === 'pdf') ? 'pdf'
                        : (effectiveFileType === 'doc') ? 'doc'
                            : (effectiveFileType === 'archive') ? 'archive'
                            : 'other';
    const playableUrl: string | undefined = file?.downloadUrl || file?.externalUrl;
    const fileExtension = (file?.name?.split('.').pop() || '').toLowerCase();
    const docSubtype: 'text' | 'office' | 'other' = ['txt', 'md', 'csv', 'json', 'xml', 'log', 'rtf'].includes(fileExtension)
        ? 'text'
        : ['doc', 'docx', 'odt', 'pages'].includes(fileExtension)
            ? 'office'
            : 'other';
    const officeEmbedUrl = playableUrl && /^https?:\/\//i.test(playableUrl)
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(playableUrl)}`
        : undefined;
    const lightboxImageSrc: string | undefined = (() => {
        if (!file) return undefined;
        if (isProtectedPreview) return file.previewUrl;
        if ((file.type === 'image' || file.type === 'design') && (file.downloadUrl || file.externalUrl || file.previewUrl)) {
            return file.downloadUrl || file.externalUrl || file.previewUrl;
        }
        if (!file.previewUrl) return undefined;
        let upgraded = file.previewUrl;
        upgraded = upgraded.replace(/([?&])w=\d+/i, '$1w=3000');
        upgraded = upgraded.replace(/([?&])width=\d+/i, '$1width=3000');
        upgraded = upgraded.replace(/([?&])q=\d+/i, '$1q=100');
        upgraded = upgraded.replace(/([?&])quality=\d+/i, '$1quality=100');
        return upgraded;
    })();
    const lightboxImageSrcWithRetry = lightboxImageSrc
        ? `${lightboxImageSrc}${lightboxImageSrc.includes('?') ? '&' : '?'}th_preview_retry=${imageRetrySeed}`
        : undefined;
    const hasRenderableContent = Boolean(
        lightboxImageSrc || (!isProtectedPreview && (viewerType === 'video' || viewerType === 'audio' || viewerType === 'pdf' || viewerType === 'doc' || viewerType === 'archive'))
    );

    useEffect(() => {
        setIsImageLoaded(false);
        setImagePreviewError(null);
        setImageRetrySeed(0);
        setImgRect({ width: 0, height: 0 });
        setZoomLevel(1);
        setTextPreview('');
        setTextPreviewError(null);
        setIsTextPreviewLoading(false);
    }, [file?.id]);

    useEffect(() => {
        if (isProtectedPreview || viewerType !== 'doc' || docSubtype !== 'text') return;
        const previewSource = playableUrl || file?.previewUrl;
        if (!previewSource) {
            setTextPreviewError('Text preview unavailable for this file.');
            return;
        }

        const controller = new AbortController();
        setIsTextPreviewLoading(true);
        setTextPreviewError(null);

        fetch(previewSource, { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Could not load text preview.');
                }
                const content = await response.text();
                setTextPreview(content.slice(0, 20000));
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                setTextPreview('');
                setTextPreviewError(error instanceof Error ? error.message : 'Could not load text preview.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsTextPreviewLoading(false);
            });

        return () => controller.abort();
    }, [file?.id, viewerType, docSubtype, playableUrl, file?.previewUrl, isProtectedPreview]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') { setSlideDirection(1); onNext(); }
            if (e.key === 'ArrowLeft') { setSlideDirection(-1); onPrev(); }
            if (e.key === '+' || e.key === '=') setZoomLevel((z) => Math.min(4, +(z + 0.2).toFixed(2)));
            if (e.key === '-' || e.key === '_') setZoomLevel((z) => Math.max(1, +(z - 0.2).toFixed(2)));
            if (e.key === '0') setZoomLevel(1);
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    // Force load event
    useEffect(() => {
        const timer = setTimeout(() => setIsImageLoaded(true), 1500);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    // Track rendered image dimensions so watermark overlay stays pixel-perfect on the asset
    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;
        const ro = new ResizeObserver(computeImgRect);
        ro.observe(img);
        return () => ro.disconnect();
    }, [file?.id, isImageLoaded, computeImgRect]);

    useEffect(() => {
        if (!showThumbnails) return;

        const handleOutsideDockClick = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node | null;
            if (!target) return;

            const clickedDock = thumbnailDockRef.current?.contains(target) ?? false;
            const clickedHideButton = hideDockButtonRef.current?.contains(target) ?? false;

            if (!clickedDock && !clickedHideButton) {
                setShowThumbnails(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideDockClick);
        document.addEventListener('touchstart', handleOutsideDockClick, { passive: true });

        return () => {
            document.removeEventListener('mousedown', handleOutsideDockClick);
            document.removeEventListener('touchstart', handleOutsideDockClick);
        };
    }, [showThumbnails]);

    // Sidebar animation (desktop only)
    useEffect(() => {
        if (window.innerWidth >= 1024) {
            const timer = setTimeout(() => setShowSidebar(true), 150);
            return () => clearTimeout(timer);
        } else {
            setShowSidebar(false);
        }
    }, []);

    return (
        // Premium frosted backdrop: keep heavy blur, but lower tint opacity (~65% reduction vs prior /90)
        <div className={`fixed inset-0 z-[100] flex items-stretch ${isDarkMode ? 'bg-black/25' : 'bg-slate-50/25'} backdrop-blur-3xl ${isClosing ? 'animate-lightbox-exit' : 'animate-lightbox-entry'}`}>
            <style>{`
                @keyframes slideInRight { from { transform: translateX(40px) scale(0.98); opacity: 0; filter: blur(4px); } to { transform: translateX(0) scale(1); opacity: 1; filter: blur(0); } }
                @keyframes slideInLeft { from { transform: translateX(-40px) scale(0.98); opacity: 0; filter: blur(4px); } to { transform: translateX(0) scale(1); opacity: 1; filter: blur(0); } }
                @keyframes lightboxEntry { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                @keyframes lightboxExit { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.96); } }
                .animate-slide-right { animation: slideInRight 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                .animate-slide-left { animation: slideInLeft 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                .animate-lightbox-entry { animation: lightboxEntry 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                .animate-lightbox-exit { animation: lightboxExit 0.3s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
            `}</style>

            {/* MAIN VIEWER CONTAINER */}
            <div className="flex-1 relative flex flex-col w-full h-full overflow-hidden z-10 transition-all duration-500">
                {/* Header Controls */}
                <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 md:p-6 grid grid-cols-3 items-start gap-3 z-50 pointer-events-none" style={{ paddingTop: headerPaddingTop }}>
                    <div className="pointer-events-auto justify-self-start">
                         <button
                             aria-label="Close Lightbox"
                             onClick={handleClose}
                            className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border ${isDarkMode
                                ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white transition-all duration-300'
                                : 'bg-white/95 hover:bg-white border-slate-200 text-slate-800 shadow-lg hover:scale-105 transition-all'
                                }`}
                         >
                             <X className="w-4 h-4 sm:w-5 sm:h-5" />
                         </button>
                    </div>
                    <div className="pointer-events-auto justify-self-center">
                        <div className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-mono text-[11px] sm:text-xs font-bold shadow-sm flex items-center gap-2 border ${isDarkMode ? 'bg-white/10 text-white border-white/10 backdrop-blur-md shadow-2xl' : 'bg-white/95 text-slate-700 border-slate-200'}`}>
                            <span>{currentIndex + 1}</span><span className={isDarkMode ? 'text-white' : 'opacity-30'}>/</span><span>{allFiles.length}</span>
                        </div>
                    </div>
                    <div className="pointer-events-auto justify-self-end">
                        <div className="flex items-center gap-2">
                            {(viewerType === 'image' || isProtectedPreview) && (
                                <>
                                    <button
                                        aria-label="Zoom Out"
                                        onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.2).toFixed(2)))}
                                        className={`hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full items-center justify-center border ${isDarkMode
                                            ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white transition-all duration-300'
                                            : 'bg-white/95 hover:bg-white border-slate-200 text-slate-800 shadow-lg hover:scale-105 transition-all'
                                            }`}
                                        title="Zoom Out"
                                    >
                                        <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                    <button
                                        aria-label="Reset Zoom"
                                        onClick={() => setZoomLevel(1)}
                                        className={`hidden sm:flex px-2.5 h-9 sm:h-10 md:h-12 rounded-full items-center justify-center border text-[11px] sm:text-xs font-mono font-bold ${isDarkMode
                                            ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white transition-all duration-300'
                                            : 'bg-white/95 hover:bg-white border-slate-200 text-slate-800 shadow-lg transition-all'
                                            }`}
                                        title="Reset Zoom"
                                    >
                                        {Math.round(zoomLevel * 100)}%
                                    </button>
                                    <button
                                        aria-label="Zoom In"
                                        onClick={() => setZoomLevel((z) => Math.min(4, +(z + 0.2).toFixed(2)))}
                                        className={`hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full items-center justify-center border ${isDarkMode
                                            ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white transition-all duration-300'
                                            : 'bg-white/95 hover:bg-white border-slate-200 text-slate-800 shadow-lg hover:scale-105 transition-all'
                                            }`}
                                        title="Zoom In"
                                    >
                                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </>
                            )}
                            {isProtectedPreview && (
                                <>
                                    <button
                                        aria-label="Toggle Watermark"
                                        onClick={() => { playClick(); setLocalShowWatermark((v: boolean) => !v); }}
                                        title={localShowWatermark ? 'Hide Watermark' : 'Show Watermark'}
                                        className={`hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full items-center justify-center border transition-all duration-300 ${
                                            isDarkMode
                                                ? `backdrop-blur-md border-white/10 shadow-2xl ${localShowWatermark ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`
                                                : `shadow-lg ${localShowWatermark ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-white/95 border-slate-200 text-slate-400 hover:bg-white hover:text-slate-700'}`
                                        }`}
                                    >
                                        {localShowWatermark ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </button>
                                    <button
                                        aria-label="Toggle Protected Label"
                                        onClick={() => { playClick(); setLocalShowProtectedLabel((v: boolean) => !v); }}
                                        title={localShowProtectedLabel ? 'Hide Protected Label' : 'Show Protected Label'}
                                        className={`hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full items-center justify-center border transition-all duration-300 ${
                                            isDarkMode
                                                ? `backdrop-blur-md border-white/10 shadow-2xl ${localShowProtectedLabel ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`
                                                : `shadow-lg ${localShowProtectedLabel ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-white/95 border-slate-200 text-slate-400 hover:bg-white hover:text-slate-700'}`
                                        }`}
                                    >
                                        {localShowProtectedLabel ? <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <ShieldOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </button>
                                </>
                            )}
                            <button
                                aria-label="Toggle Sidebar"
                                onClick={() => { playClick(); setShowSidebar(!showSidebar); }}
                                className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border ${isDarkMode
                                    ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white transition-all duration-300'
                                    : 'bg-white/95 hover:bg-white border-slate-200 text-slate-800 shadow-lg hover:scale-105 transition-all'
                                    }`}
                            >
                                {showSidebar ? <PanelRightClose className="w-4 h-4 sm:w-5 sm:h-5" /> : <PanelRightOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                 {/* Viewer Area - Centers and fits content with protected top/bottom spacing for controls. */}
                 <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-14 pt-20 sm:pt-24 md:pt-28 pb-20 sm:pb-24 md:pb-28 relative overflow-hidden z-10">
                    <button
                        aria-label="Previous"
                        onClick={() => { setSlideDirection(-1); onPrev(); }}
                        className={`absolute left-2 sm:left-3 md:left-8 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center z-40 group border transition-all duration-300 ${isDarkMode
                            ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white'
                            : 'bg-white/95 hover:bg-white border-slate-200 text-slate-800 shadow-lg'
                            }`}
                    >
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                    </button>
                    <button
                        aria-label="Next"
                        onClick={() => { setSlideDirection(1); onNext(); }}
                        className={`absolute right-2 sm:right-3 md:right-8 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center z-40 group border transition-all duration-300 ${isDarkMode
                            ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white'
                            : 'bg-white/95 hover:bg-white border-slate-200 text-slate-800 shadow-lg'
                            }`}
                    >
                        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
                    </button>

                    <div key={file.id} className={`relative w-full h-full max-w-full max-h-full flex items-center justify-center ${slideDirection === 1 ? 'animate-slide-right' : slideDirection === -1 ? 'animate-slide-left' : 'animate-fade-in'}`}>
                        {hasRenderableContent ? (
                            <div
                                className={`relative flex items-center justify-center transition-all z-20 ${(viewerType === 'image' || viewerType === 'video' || isProtectedPreview)
                                    ? 'w-full h-full max-w-full max-h-full'
                                    : `rounded-2xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#23232e] border border-white/5' : 'bg-white border border-slate-200'}`
                                    }`}
                                style={(viewerType === 'image' || viewerType === 'video' || isProtectedPreview)
                                    ? { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }
                                    : { width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                            >
                                {(viewerType === 'image' || isProtectedPreview) && (
                                    <>
                                        {!isImageLoaded && !imagePreviewError && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-white/5 z-10">
                                                <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                                            </div>
                                        )}
                                        <img
                                            ref={imgRef}
                                            src={lightboxImageSrcWithRetry}
                                            alt={file.name}
                                            onLoad={() => {
                                                setImagePreviewError(null);
                                                setIsImageLoaded(true);
                                                requestAnimationFrame(computeImgRect);
                                            }}
                                            onError={() => {
                                                setIsImageLoaded(false);
                                                setImagePreviewError('Could not load this preview from the provider link.');
                                            }}
                                            onWheel={(e) => {
                                                e.preventDefault();
                                                const delta = e.deltaY > 0 ? -0.15 : 0.15;
                                                setZoomLevel((z) => Math.max(1, Math.min(4, +(z + delta).toFixed(2))));
                                            }}
                                            onDoubleClick={() => setZoomLevel((z) => (z > 1 ? 1 : 2))}
                                            className={`block w-full h-full object-contain object-center transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'} ${zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                                            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 220ms ease, opacity 300ms ease', willChange: 'transform' }}
                                        />
                                        {imagePreviewError && !isProtectedPreview && (
                                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-center px-6 bg-slate-100/90 dark:bg-black/65 backdrop-blur-sm">
                                                <AlertTriangle className="w-8 h-8 text-amber-500" />
                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Preview unavailable</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md">The provider blocked inline rendering or the link expired. Retry to re-request the preview.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        playClick();
                                                        setImagePreviewError(null);
                                                        setImageRetrySeed((seed) => seed + 1);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 dark:bg-[#bef264] dark:hover:bg-[#a3e635] text-white dark:text-black text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                    Retry Preview
                                                </button>
                                            </div>
                                        )}
                                        {isProtectedPreview && imgRect.width > 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20">
                                                <div className="relative overflow-hidden" style={{
                                                    width: imgRect.width,
                                                    height: imgRect.height,
                                                    transform: `scale(${zoomLevel})`,
                                                    transformOrigin: 'center center'
                                                }}>
                                                    {localShowWatermark && (
                                                        <div className="absolute inset-0" style={{
                                                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-weight='900' font-size='24' fill='${isDarkMode ? 'white' : 'black'}' fill-opacity='0.07' transform='rotate(-45 150 150)' text-anchor='middle' dominant-baseline='middle' letter-spacing='4'%3ETRUEHANDOVER PREVIEW%3C/text%3E%3C/svg%3E")`,
                                                            backgroundRepeat: 'repeat',
                                                            backgroundSize: `${Math.round(300 / zoomLevel)}px ${Math.round(300 / zoomLevel)}px`
                                                        }} />
                                                    )}
                                                    {localShowProtectedLabel && (
                                                        <div className="absolute inset-0 flex items-center justify-center z-30">
                                                            <div className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl border backdrop-blur-md flex flex-col items-center shadow-2xl w-max max-w-[90%] ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white/60 border-slate-200 text-slate-900'}`}>
                                                                <EditorialIcon className={`w-7 h-7 sm:w-10 sm:h-10 mb-1.5 sm:mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
                                                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap">Protected Preview</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {!isProtectedPreview && viewerType === 'video' && (
                                    <video
                                        className="block w-full h-full max-w-full max-h-full object-contain object-center"
                                        controls
                                        playsInline
                                        poster={file.previewUrl}
                                        src={playableUrl}
                                    />
                                )}

                                {!isProtectedPreview && viewerType === 'audio' && (
                                    <div className="w-[min(880px,92vw)] p-6 md:p-10 flex flex-col md:flex-row items-center gap-6">
                                        <div className={`w-full md:w-[360px] aspect-square rounded-2xl overflow-hidden border ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'}`}>
                                            <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <div className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Audio Preview</div>
                                            <div className={`mt-1 text-lg font-bold ${textPrimary} truncate`}>{file.name}</div>
                                            <audio className="w-full mt-4" controls src={playableUrl} />
                                            {!playableUrl && (
                                                <div className={`mt-3 text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                                                    Playback URL not available.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!isProtectedPreview && viewerType === 'pdf' && (
                                    <div className="w-[min(1100px,92vw)] h-[min(720px,70vh)] rounded-2xl overflow-hidden border border-white/10 bg-black/10">
                                        {playableUrl ? (
                                            <iframe
                                                title={file.name}
                                                src={playableUrl}
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center gap-4 text-slate-400">
                                                <FileText className="w-10 h-10" />
                                                <span className="text-sm font-mono uppercase tracking-widest">PDF preview unavailable</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isProtectedPreview && viewerType === 'doc' && (
                                    <div className={`w-[min(1100px,92vw)] h-[min(720px,70vh)] rounded-2xl overflow-hidden border ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-white'}`}>
                                        {docSubtype === 'text' ? (
                                            <div className="w-full h-full p-5 overflow-auto">
                                                {isTextPreviewLoading ? (
                                                    <div className="w-full h-full flex items-center justify-center gap-3 text-slate-400">
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">Loading text preview…</span>
                                                    </div>
                                                ) : textPreview ? (
                                                    <pre className={`whitespace-pre-wrap break-words text-xs leading-relaxed font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{textPreview}</pre>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center gap-4 text-slate-400 text-center px-6">
                                                        <FileText className="w-10 h-10" />
                                                        <span className="text-sm font-mono uppercase tracking-widest">{textPreviewError || 'Text preview unavailable'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : docSubtype === 'office' && officeEmbedUrl ? (
                                            <iframe
                                                title={file.name}
                                                src={officeEmbedUrl}
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center text-slate-400 px-8">
                                                <FileText className="w-12 h-12" />
                                                <span className="text-sm font-mono uppercase tracking-widest">Inline document preview unavailable</span>
                                                <span className="text-[11px] leading-relaxed max-w-[480px]">
                                                    This document cannot be rendered inline from the current provider permissions or response headers.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isProtectedPreview && viewerType === 'archive' && (
                                    <div className="w-[min(820px,92vw)] p-10 flex flex-col items-center justify-center gap-4 text-center">
                                        <FileCode className={`w-14 h-14 ${isDarkMode ? 'text-white/70' : 'text-slate-700'}`} />
                                        <div className={`text-sm font-bold ${textPrimary}`}>{file.name}</div>
                                        <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>Archives don't have an inline preview. Download after unlock.</div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="w-full h-full max-w-3xl max-h-[600px] flex flex-col items-center justify-center gap-6 text-slate-400 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5">
                                {getFileIcon(file.type)}
                                <span className="text-sm font-mono uppercase tracking-widest">Preview Unavailable</span>
                            </div>
                        )}
                    </div>
                </div>

                {showThumbnails ? (
                    <>
                        <div ref={thumbnailDockRef} className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-[90%]"><div className={`flex items-center gap-2 p-2 rounded-2xl border backdrop-blur-md shadow-xl overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-[#18181b]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>{allFiles.map((f: FileAsset, idx: number) => (
                            <button
                                type="button"
                                key={f.id}
                                onClick={() => { playClick(); setSlideDirection(idx > currentIndex ? 1 : -1); onSelect(idx); }}
                                className={`relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all border-2 p-0 ${idx === currentIndex ? (isDarkMode ? 'border-white scale-110' : 'border-slate-900 scale-110') : 'border-transparent opacity-60 hover:opacity-100'}`}
                                aria-label={`Switch to ${f.name}`}
                            >
                                {f.previewUrl ? <img src={f.previewUrl} className="w-full h-full object-cover" alt={f.name} /> : <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}><FileText className="w-4 h-4 text-slate-400" /></div>}
                            </button>
                        ))}</div></div>
                        <button
                            ref={hideDockButtonRef}
                            onClick={() => setShowThumbnails(false)}
                            className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest z-30 border transition-all duration-300 ${isDarkMode
                                ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white/70 hover:text-white'
                                : 'bg-white text-slate-500 hover:text-slate-900 border-slate-200 shadow-lg'
                                }`}
                        >
                            <Minimize2 className="w-3.5 h-3.5" /> Hide Dock
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setShowThumbnails(true)}
                        className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest z-50 border transition-all duration-300 ${isDarkMode
                            ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white/70 hover:text-white'
                            : 'bg-white text-slate-500 hover:text-slate-900 border-slate-200 shadow-lg'
                            }`}
                    >
                        <GridIcon className="w-3.5 h-3.5" /> Show Files
                    </button>
                )}
            </div>

            {/* SIDEBAR */}
            <div className={`
                flex-shrink-0 backdrop-blur-2xl border-l border-slate-200 dark:border-white/5
                transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                ${isDarkMode
                    ? 'bg-[#1a1a24]/90 shadow-[0_0_80px_-10px_rgba(0,0,0,0.7)]'
                    : 'bg-[#f1f5f9]/90 shadow-[0_0_80px_-10px_rgba(0,0,0,0.35)]'}
                transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]

                fixed inset-0 z-[110] w-full
                lg:static lg:z-auto lg:h-full lg:border-l
                ${showSidebar
                    ? 'translate-x-0 opacity-100 lg:w-[350px] xl:w-[400px]'
                    : 'translate-x-full opacity-0 pointer-events-none lg:translate-x-0 lg:w-0 lg:border-l-0 lg:opacity-0 lg:pointer-events-none'
                }
            `}>
                <div className="w-full h-full flex flex-col pt-16 md:pt-0 overflow-hidden">
                    <button
                        aria-label="Close Sidebar"
                        onClick={() => setShowSidebar(false)}
                        className={`lg:hidden absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 ${isDarkMode
                            ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-2xl text-white/70 hover:text-white'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-lg'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-full lg:w-[350px] xl:w-[400px] flex flex-col h-full" style={{ paddingTop: paddingTop }}>
                        <div className={`p-6 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${revisions.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>Requests ({revisions.length})</div>
                                <div className="flex items-center gap-3">
                                    <ThemeModeDropdown
                                        themeMode={themeMode || 'system'}
                                        onChange={(mode) => {
                                            playClick();
                                            if (onSetThemeMode) onSetThemeMode(mode);
                                            else onToggleTheme();
                                        }}
                                        isDarkMode={isDarkMode}
                                        compact
                                        buttonClassName={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${isDarkMode
                                            ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                                            }`}
                                    />
                                    {file.locked && isLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className={`w-4 h-4 ${isDarkMode ? 'text-[#bef264]' : 'text-lime-600'}`} />}
                                </div>
                            </div>
                            <h3 className={`font-bold text-lg leading-tight ${textPrimary} truncate`}>{file.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 font-mono">{file.size} · {file.type.toUpperCase()}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                            {revisions.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40"><MessageSquare className="w-12 h-12 mb-4 stroke-1" /><p className="text-sm font-medium">No corrections yet</p><p className="text-xs max-w-[200px] mt-2">Describe what needs changing below to notify the creator.</p></div>
                            ) : (
                                revisions.map((rev: any, i: number) => (
                                    <div key={i} className={`p-4 rounded-xl text-sm group/rev relative ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                                        <button aria-label="Delete Request" onClick={() => onDeleteRevision(i)} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-500 opacity-0 group-hover/rev:opacity-100 transition-all"><X className="w-3.5 h-3.5" /></button>
                                        <p className={`${textPrimary} mb-2 pr-6`}>{rev.text}</p>
                                        <div className="flex items-center justify-between text-[10px] text-slate-500"><span className="font-bold uppercase tracking-wider">Request #{i + 1}</span><span>{rev.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className={`p-6 border-t ${isDarkMode ? 'border-white/5 bg-[#1a1a1f]/80' : 'border-slate-100 bg-slate-50/80'}`}>
                            {file.locked && isLocked ? (
                                <>
                                    <div className={`relative rounded-xl border transition-all focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200'}`}>
                                        <textarea value={currentRevisionText} onChange={(e) => setCurrentRevisionText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmitRevision(currentRevisionText); setCurrentRevisionText(''); } }} placeholder="Describe the correction needed..." className={`w-full h-24 p-4 bg-transparent outline-none text-sm resize-none ${textPrimary} placeholder:text-slate-500`} />
                                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">Shift+Enter for new line</span>
                                            <button aria-label="Send Revision" onClick={() => { onSubmitRevision(currentRevisionText); setCurrentRevisionText(''); }} disabled={!currentRevisionText.trim()} className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 hover:scale-105 transition-all shadow-md"><ArrowUp className="w-4 h-4" strokeWidth={3} /></button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center text-slate-400 mt-3">Requests are sent instantly to the creator.</p>
                                </>
                            ) : (
                                <div className="text-center">
                                    <a href={file.downloadUrl} target="_blank" rel="noopener noreferrer" className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-[#bef264] hover:bg-[#a3e635] text-black' : 'bg-lime-600 hover:bg-lime-700 text-white'}`}><Download className="w-4 h-4" /> Download Asset</a>
                                    <p className="text-[10px] text-slate-400 mt-3">Full resolution unlocked.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export const ClientPreviewPage: React.FC<ClientPreviewPageProps> = ({
    project, libraryProjects = [], libraryEnabled = true, user, isDarkMode, themeMode, onToggleTheme, onSetThemeMode, onBack, isEmbedded = false,
    allowSidebarCollapse = false,
    onDockedSidebarCollapseChange,
    reserveCollapsedHeaderBackSlot = 0,
    isLocked, lightboxIndex, setLightboxIndex, revisions, onPaymentComplete,
    handleSubmitRevision, handleDeleteRevision, activeFilter, setActiveFilter, theme,
    filteredFiles, handleRequestCorrection, accessDenied, refreshAccess
    , paymentError, onDismissPaymentError
    , onRenameAsset, onResizeAsset, onRemoveAsset
}) => {
    const navigate = useNavigate();
    const creatorName = user?.name || "Creator";
    // Prevent tiny "intro" transitions when the preview page first mounts (can feel like a jarring pop).
    // We still keep transitions for real interactions (theme toggle, collapsing sidebar, etc.).
    const [motionReady, setMotionReady] = useState(false);
    useEffect(() => {
        let cancelled = false;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { if (!cancelled) setMotionReady(true); });
        });
        return () => { cancelled = true; };
    }, []);
    const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false);
    const [isMobilePaymentOpen, setIsMobilePaymentOpen] = useState(false);
    const [isMobileHeaderHidden, setIsMobileHeaderHidden] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [contentView, setContentView] = useState<'delivery' | 'library'>('delivery');
    const [isSplitSidebarCollapsed, setIsSplitSidebarCollapsed] = useState(false);
    const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
    const availableLibraryProjects = libraryProjects.filter(lp => (lp.files || []).some(f => (f.includeInLibrary !== false) && (!f.locked || lp.status === 'paid' || lp.status === 'completed')));

    useEffect(() => {
        if (!libraryEnabled && contentView === 'library') setContentView('delivery');
    }, [libraryEnabled, contentView]);

    const collapseDockedSidebar = useCallback(() => {
        playClick();
        setIsSplitSidebarCollapsed(true);
    }, []);

    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['client']));
    const toggleSection = (id: string) => { setExpandedSections(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
    const mobileHeaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mainScrollRef = useRef<HTMLElement>(null);
    const isPendingVerification = project.status === 'payment_verification';
    const isPaid = project.status === 'paid' || project.status === 'completed';

    // --- SAFE AREA PADDING (for simulated devices) ---
    const [searchParams] = useSearchParams();
    const pt = searchParams.get('pt');
    const pb = searchParams.get('pb');
    const deviceParam = searchParams.get('device');
    const paddingTop = pt ? `${pt}px` : undefined;
    const paddingBottom = pb ? `${pb}px` : undefined;

    // Keep controls comfortably below the status bar / notch even when safe-area env vars are unavailable.
    const headerSafeTop = paddingTop
        ? `max(12px, ${paddingTop})`
        : 'max(12px, env(safe-area-inset-top, 0px))';

    // Viewport flags (used to stabilize simulated device canvas + improve small-screen landscape UX)
    const [viewport, setViewport] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
    }));
    useEffect(() => {
        const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        onResize();
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
        };
    }, []);

    // When rendered inside the simulator iframe, keep the outer mock status bar in sync with this preview's theme.
    useEffect(() => {
        try {
            if (window.self === window.top) return;
        } catch {
            return;
        }
        window.parent.postMessage({ type: 'TRUEHANDOVER_PREVIEW_THEME', isDarkMode }, window.location.origin);
    }, [isDarkMode]);

    const isBelowLg = viewport.width < 1024;
    const isLandscape = viewport.width > viewport.height;
    const deviceType = deviceParam === 'tablet' || deviceParam === 'mobile' || deviceParam === 'foldable' ? deviceParam : null;
    const isCanvasSim = Boolean(deviceType);
    const isPhoneLike = Math.min(viewport.width, viewport.height) < 500;
    const isRealTabletViewport = !deviceType && isBelowLg && !isPhoneLike;

    // Enable a true split layout for any landscape device inside the simulator, and for real devices
    // below `lg` (this includes phone landscape, where the sidebar can be collapsed).
    const isLandscapeSplit = !isEmbedded && isLandscape && (deviceType ? true : isBelowLg);
    // Docked sidebar collapse is supported for:
    // - Split landscape (mobile/tablet/foldable)
    // - Desktop (lg+) where the sidebar is docked
    const canCollapseDockedSidebar = (!isEmbedded || allowSidebarCollapse) && (isLandscapeSplit || !isBelowLg);
    // Sidebar placement:
    // - Docked in split-landscape + desktop
    // - Inline in the main scroll for stacked (portrait) small screens so users can scroll past it to the asset gallery.
    const showDockedSidebar = isEmbedded || isLandscapeSplit || !isBelowLg;
    const showInlineSidebar = !isEmbedded && !isLandscapeSplit && isBelowLg && isMobileInfoOpen;
    const isDockedSidebarCollapsed = canCollapseDockedSidebar && isSplitSidebarCollapsed;
    const splitSidebarExpandedWidth = isPhoneLike ? 300 : Math.min(380, Math.max(300, Math.round(viewport.width * 0.35)));

    // Allow parent containers (Creator/editor embedded previews) to reposition overlay UI when the docked sidebar collapses.
    useEffect(() => {
        onDockedSidebarCollapseChange?.(isDockedSidebarCollapsed);
    }, [isDockedSidebarCollapsed, onDockedSidebarCollapseChange]);

    // When inside the simulator iframe, publish sidebar collapse state so the outer shell/editor can stay in sync.
    useEffect(() => {
        let inIframe = false;
        try {
            inIframe = window.self !== window.top;
        } catch {
            inIframe = false;
        }
        if (!inIframe) return;
        window.parent.postMessage({
            type: 'TRUEHANDOVER_PREVIEW_SIDEBAR_STATE',
            collapsed: isDockedSidebarCollapsed,
        }, window.location.origin);
    }, [isDockedSidebarCollapsed]);

    // Simulator chrome: in light mode + landscape + collapsed sidebar, the status bar should blend with the vault
    // (transparent over the iframe) rather than forcing a solid bar that fights the vault background.
    useEffect(() => {
        let inIframe = false;
        try {
            inIframe = window.self !== window.top;
        } catch {
            inIframe = false;
        }
        if (!inIframe) return;

        // In light-mode landscape simulations, keep the status bar transparent so it inherits the column background
        // (matching the behavior in dark mode). This avoids a "forced white bar" that fights the vault backdrop.
        const wantsTransparentLightStatusBar =
            !isDarkMode &&
            Boolean(deviceType) &&
            isLandscapeSplit;

        window.parent.postMessage({
            type: 'TRUEHANDOVER_PREVIEW_STATUSBAR',
            mode: wantsTransparentLightStatusBar ? 'transparent' : 'solid',
        }, window.location.origin);
    }, [isDarkMode, deviceType, isLandscapeSplit]);
    // Extra top breathing room below the (mock) status bar:
    // - Mobile portrait can afford slightly more
    // - Everything else sits a touch closer for tighter, more premium spacing.
    // Real tablet responsive (no mock status bar): add a bit more breathing room so the glass header doesn't feel cramped.
    const headerExtraTopPx = deviceType === 'mobile' && !isLandscape ? 8 : isRealTabletViewport ? 10 : (deviceType && isLandscape ? 0 : 4);
    const headerChromePadTop = `calc(${headerSafeTop} + ${headerExtraTopPx}px)`;
    const hasMockStatusBar = Boolean(deviceType);
    const isActualDesktopViewport = !deviceType && !isBelowLg;
    const isTrueDesktop = !isEmbedded && isActualDesktopViewport;
    const isCompactDesktopHeader = isActualDesktopViewport && viewport.width < 1240;

    // Auto-hide mobile header after 5 seconds of inactivity (portrait + stacked only)
    // Disabled: users expect the project title header to remain visible and stable.
    const shouldAutoHideMobileHeader = false;
    const showMobileHeader = useCallback(() => {
        setIsMobileHeaderHidden(false);
        if (mobileHeaderTimerRef.current) clearTimeout(mobileHeaderTimerRef.current);
        if (!shouldAutoHideMobileHeader) return;
        mobileHeaderTimerRef.current = setTimeout(() => setIsMobileHeaderHidden(true), 5000);
    }, [shouldAutoHideMobileHeader]);

    const openMobileDetails = useCallback(() => {
        setIsMobileInfoOpen(true);
        showMobileHeader();
        // Ensure the inline details panel is visible when opening on stacked (portrait) layouts.
        requestAnimationFrame(() => {
            mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }, [showMobileHeader]);

    useEffect(() => {
        if (isEmbedded) return;
        showMobileHeader();
        return () => { if (mobileHeaderTimerRef.current) clearTimeout(mobileHeaderTimerRef.current); };
    }, [isEmbedded, showMobileHeader]);

    // In split landscape we keep the sidebar docked (not a bottom sheet) and prevent header auto-hide.
    useEffect(() => {
        if (!isLandscapeSplit) return;
        setIsMobileInfoOpen(false);
        setIsMobileHeaderHidden(false);
        if (mobileHeaderTimerRef.current) clearTimeout(mobileHeaderTimerRef.current);
    }, [isLandscapeSplit]);

    useEffect(() => {
        if (!canCollapseDockedSidebar) {
            setIsSplitSidebarCollapsed(false);
        }
    }, [canCollapseDockedSidebar]);

    // Show header on ANY scroll, hide after 5s of no scroll
    const lastScrollY = useRef(0);
    const handleMainScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (scrollTop !== lastScrollY.current) {
            showMobileHeader();
        }
        lastScrollY.current = scrollTop;
    }, [showMobileHeader]);

    // Pattern Styles
    let maskImage = 'none';
    let maskSize = 'auto';
    let maskRepeat = 'repeat';
    const pattern = theme.pattern || 'lines';

    if (pattern === 'radar') {
        // Single large concentric radar centered on page
        maskImage = `repeating-radial-gradient(
            circle at 50% 50%, 
            transparent 0, 
            transparent 127px, 
            black 127px, 
            black 128px
        )`;
        maskSize = '100% 100%';
        maskRepeat = 'no-repeat';
    } else if (pattern !== 'none' && SVG_PATTERNS[pattern as keyof typeof SVG_PATTERNS]) {
        maskImage = `url("${SVG_PATTERNS[pattern as keyof typeof SVG_PATTERNS]}")`;

        // ---- FIXED LOGIC STARTS HERE ----
        // Expanded to include all patterns so maskSize is never 'auto'
        if (['dots', 'hex', 'graph'].includes(pattern)) {
            maskSize = '24px 24px';
        } else if (['lines', 'grid', 'rhombus', 'plus', 'cross'].includes(pattern)) {
            maskSize = '40px 40px';
        } else if (pattern === 'waves') {
            maskSize = '40px 20px';
        } else if (pattern === 'zigzag') {
            maskSize = '40px 30px';
        } else {
            // Fallback default
            maskSize = '40px 40px';
        }
        // ---- FIXED LOGIC ENDS HERE ----
    }

    const patternColorClass = isDarkMode ? 'bg-white' : 'bg-slate-900';
    const patternOpacityClass = isDarkMode ? 'opacity-[0.1]' : 'opacity-[0.15]';
    // OPTIMIZED OVERLAY: Reduced opacity by 10%, increased depth/color by 10%
    // Light mode: reduce overlay tint so the wallpaper + film grain read more clearly (requested).
    const sidebarOverlay = isDarkMode ? 'from-[#1a1a24]/80 via-[#1a1a24]/60 to-[#1a1a24]/30' : 'from-[#f1f5f9]/70 via-[#f1f5f9]/60 to-[#f1f5f9]/35';
    const glassPanelClass = isDarkMode ? 'bg-[#2a2a35] border-white/5 shadow-black/20' : 'bg-white/60 border-slate-200 shadow-slate-200/50';
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
    const brandGreenBg = isDarkMode ? 'bg-[#bef264]' : 'bg-lime-600';

    if (accessDenied) {
        return (
            <div className={`h-screen w-full flex items-center justify-center flex-col ${isDarkMode ? 'bg-[#0f0f15] text-white' : 'bg-slate-50 text-slate-900'}`}>
                <div className="mb-6 relative"><div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse"><Flame className="w-10 h-10 text-red-500" /></div><div className="absolute top-0 right-0 p-2 bg-red-500 text-white text-[10px] font-bold uppercase rounded-full">Expired</div></div>
                <h1 className="font-serif text-4xl mb-3">Link Expired</h1>
                <p className={`text-center max-w-md ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-8`}>This secure link was configured for one-time access and has already been viewed. Please contact the creator to request a new access link.</p>
                <button onClick={refreshAccess} className={`px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>Refresh Status</button>
            </div>
        );
    }

    const sidebarBody = (
                <div className={`
                    relative z-20 flex-1 flex flex-col h-full overflow-hidden min-h-0
                    ${!isEmbedded ? ((isMobileInfoOpen || isLandscapeSplit) ? 'flex' : 'hidden lg:flex') : 'flex'}
                `}>
                    <div className={`flex-1 overflow-y-auto no-scrollbar px-4 md:px-6 lg:px-8 pt-2 pb-6 min-h-0`}>
                        <div className="mt-8 mb-8 hidden lg:block">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative group cursor-pointer"><img src={project.client.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"} className={`w-14 h-14 rounded-full border-2 ${isDarkMode ? 'border-white/10' : 'border-white shadow-sm'} shadow-xl object-cover`} /><div className={`absolute -bottom-1 -right-1 ${isDarkMode ? 'bg-black' : 'bg-white'} rounded-full p-1`}><div className={`w-3 h-3 ${brandGreenBg} rounded-full`} /></div></div>
                                <div><p className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary} mb-1`}>Delivery For</p><h3 className={`font-bold text-lg leading-none ${textPrimary}`}>{project.client.name}</h3></div>
                            </div>
                            <h1 className={`font-serif text-3xl md:text-4xl lg:text-[46px] font-medium ${textPrimary} leading-[0.95] tracking-tight mb-4 drop-shadow-sm`}>{project.name}</h1>
                            {/* Updated Description Color for Legibility: Darker Lime/Slate */}
                            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-800'} text-lg font-medium leading-relaxed`}>Complete deliverables package containing <span className={`${textPrimary} font-bold`}>{project.files.length} finalized assets</span>.</p>
                            {project.accessConfig?.mode === 'one_time' && <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest"><Flame className="w-3 h-3" /> One-Time Access Link</div>}
                            {project.accessConfig?.mode === '7_day' && <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest"><Clock className="w-3 h-3" /> Expires in 7 Days</div>}


                        </div>

                        {/* Mobile/Tablet Visible Info (When Expanded) */}
                        {/* Mobile: Expandable Accordion Sections */}
                        <div className="lg:hidden mb-6 pt-2 space-y-2">
                            {/* Section: Client & Project */}
                            <div className={`relative ${glassPanelClass} rounded-xl backdrop-blur-md overflow-hidden`}>
                                <button onClick={() => toggleSection('client')} className={`w-full flex items-center justify-between p-4 transition-colors ${expandedSections.has('client') ? '' : 'hover:bg-white/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <img src={project.client.avatar} className="w-9 h-9 rounded-full object-cover" />
                                        <div className="text-left">
                                            <p className={`text-sm font-bold ${textPrimary} leading-tight`}>{project.client.name}</p>
                                            <p className={`text-[10px] ${textSecondary} font-bold uppercase tracking-wider`}>{project.files.length} Assets · ${project.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <ChevronLeft className={`w-4 h-4 ${textSecondary} transition-transform duration-300 ${expandedSections.has('client') ? '-rotate-90' : 'rotate-180'}`} />
                                </button>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.has('client') ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className={`h-px w-full ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`} />
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>Complete deliverables package with <span className={`font-bold ${textPrimary}`}>{project.files.length} finalized assets</span>.</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {project.accessConfig?.mode === 'one_time' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider"><Flame className="w-3 h-3" /> One-Time Link</span>}
                                            {project.accessConfig?.mode === '7_day' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider"><Clock className="w-3 h-3" /> 7-Day Access</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Creator Message */}
                            <div className={`relative ${glassPanelClass} rounded-xl backdrop-blur-md overflow-hidden`}>
                                <button onClick={() => toggleSection('message')} className={`w-full flex items-center justify-between p-4`}>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Creator Message</span>
                                    <ChevronLeft className={`w-4 h-4 ${textSecondary} transition-transform duration-300 ${expandedSections.has('message') ? '-rotate-90' : 'rotate-180'}`} />
                                </button>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.has('message') ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="px-4 pb-4">
                                        <div className={`pl-4 border-l-2 ${isDarkMode ? 'border-[#bef264]/40' : 'border-lime-500/40'}`}>
                                            <p className={`text-sm ${textSecondary} font-medium leading-relaxed italic`}>"{project.message || `Hi ${project.client.name.split(' ')[0]}, please review the watermarked previews.`}"</p>
                                            <div className="mt-4 flex items-center gap-2">
                                                <span className={`text-[10px] font-bold ${textSecondary} uppercase tracking-widest`}>Creator Signature</span>
                                                <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'} mx-2`} />
                                                <span className={`font-serif italic ${textPrimary}`}>{creatorName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Payment Schedule */}
                            {project.useMilestones && project.milestones?.length > 0 && (
                                <div className={`relative ${glassPanelClass} rounded-xl backdrop-blur-md overflow-hidden`}>
                                    <button onClick={() => toggleSection('payment')} className={`w-full flex items-center justify-between p-4`}>
                                        <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Payment Schedule</span>
                                        <ChevronLeft className={`w-4 h-4 ${textSecondary} transition-transform duration-300 ${expandedSections.has('payment') ? '-rotate-90' : 'rotate-180'}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.has('payment') ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-4 pb-4 space-y-3">
                                            {project.milestones.map((m: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-2 h-2 rounded-full ${m.status === 'paid' ? brandGreenBg : (isDarkMode ? 'bg-slate-600' : 'bg-slate-300')}`} />
                                                        <div>
                                                            <span className={`text-sm font-bold ${textPrimary} block leading-tight`}>{m.title}</span>
                                                            <span className={`text-[10px] ${textSecondary} uppercase tracking-wider font-bold`}>{m.status}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm font-bold font-mono ${textPrimary}`}>${m.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className={`mt-2 pt-3 border-t border-dashed ${isDarkMode ? 'border-white/10' : 'border-slate-200'} flex items-center justify-between`}>
                                                <span className={`text-xs font-bold ${textPrimary}`}>Total</span>
                                                <span className={`text-lg font-serif font-bold ${textPrimary}`}>${project.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop-only (mobile/tablet use the accordion above to avoid duplicate panels) */}
                        <div className={`hidden lg:block relative ${glassPanelClass} p-6 rounded-2xl backdrop-blur-md transition-all`}>
                            <div className={`absolute -left-px top-6 bottom-6 w-0.5 ${brandGreenBg} rounded-r-full`} />
                            <p className={`text-sm ${textSecondary} font-sans font-medium leading-7`}>"{project.message || `Hi ${project.client.name.split(' ')[0]}, please review the watermarked previews.`}"</p>
                            <div className="mt-4 flex items-center gap-2"><span className={`text-[10px] font-bold ${textSecondary} uppercase tracking-widest`}>Creator Signature</span><div className={`h-px flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'} mx-2`} /><span className={`font-serif italic ${textPrimary}`}>{creatorName}</span></div>
                        </div>

                        {/* CREDENTIAL VAULT - NEW FEATURE #33 */}
                        <CredentialVaultWidget
                            credentials={project.credentials}
                            isLocked={isLocked}
                            isDarkMode={isDarkMode}
                        />

                        {project.useMilestones ? (
                            <div className="mt-10 space-y-4">
                                <div className={`flex justify-between items-end border-b border-slate-200 dark:border-white/5 pb-2`}><span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Payment Schedule</span></div>
                                <div className="space-y-4">
                                    {project.milestones.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-1.5 h-1.5 rounded-full ${m.status === 'paid' ? brandGreenBg : (isDarkMode ? 'bg-slate-600' : 'bg-slate-300')}`} /><div><span className={`text-sm font-bold ${textPrimary} block`}>{m.title}</span><span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>{m.status}</span></div></div><span className={`text-sm font-bold font-mono ${textPrimary}`}>${m.amount.toLocaleString()}</span></div>
                                    ))}
                                    <div className={`h-px w-full ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'} my-2`} /><div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-white/10"><span className={`text-sm font-bold ${textPrimary}`}>Total Contract</span><span className={`text-xl font-serif font-bold ${isDarkMode ? GRADIENT_TEXT : 'text-slate-900'}`}>${project.amount.toLocaleString()}</span></div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-10"><div className={`flex justify-between items-end border-b border-slate-200 dark:border-white/5 pb-2 mb-4`}><span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-lime-700'}`}>Project Value</span></div><div className="flex items-center justify-between"><span className={`text-sm font-bold ${textPrimary}`}>Total Contract</span><span className={`text-xl font-serif font-bold ${isDarkMode ? GRADIENT_TEXT : 'text-slate-900'}`}>${project.amount.toLocaleString()}</span></div></div>
                        )}
                    </div>

                    {/* Payment Terminal */}
                    {isLandscapeSplit && isPhoneLike && isLocked && !isPendingVerification ? (
                        // Phone landscape split: keep the footer compact so the details area stays useful.
                        // The full terminal lives in the bottom sheet (opened via the button below).
                        <div className={`relative z-20 py-3 pl-6 pr-5 ${isDarkMode ? 'bg-[#2a2a35]/95 border-t border-white/5' : 'bg-white/60 border-t border-slate-200'} backdrop-blur-xl shrink-0`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Total Due</p>
                                    <p className={`text-lg font-serif font-bold ${textPrimary} leading-tight`}>${project.amount.toLocaleString()}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { playClick(); setIsMobilePaymentOpen(true); }}
                                    className={`shrink-0 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2 ${isDarkMode ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                >
                                    {project.requiresSignature ? <PenTool className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                                    {project.requiresSignature ? 'Sign / Pay' : 'Pay Now'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`relative z-20 p-4 md:p-6 lg:p-8 ${isDarkMode ? 'bg-[#2a2a35]/95 border-t border-white/5' : 'bg-white/60 border-t border-slate-200'} backdrop-blur-xl shrink-0`}>
                            <PaymentTerminal
                                project={project}
                                isDarkMode={isDarkMode}
                                isEmbedded={isEmbedded}
                                isLandscapeCompact={isLandscapeSplit && isPhoneLike}
                                creatorName={creatorName}
                                onPaymentComplete={onPaymentComplete}
                                onMockVerify={onPaymentComplete}
                            />
                        </div>
                    )}
                </div>
    );

    return (
        <div className={`flex ${isLandscapeSplit ? 'flex-row' : 'flex-col'} lg:flex-row ${isEmbedded ? 'h-full w-full' : 'min-h-screen h-[100dvh]'} ${isDarkMode ? 'bg-cosmic text-slate-100' : 'bg-[#FDFDFD] text-slate-900'} font-sans overflow-hidden ${motionReady ? 'transition-colors duration-500' : ''} relative`}>
            {lightboxIndex !== null && filteredFiles[lightboxIndex] && (
                <VisualLightbox
                    file={filteredFiles[lightboxIndex]}
                    allFiles={filteredFiles}
                    currentIndex={lightboxIndex}
                    isLocked={isLocked && filteredFiles[lightboxIndex].locked}
                    isDarkMode={isDarkMode}
                    themeMode={themeMode}
                    revisions={revisions[filteredFiles[lightboxIndex].id] || []}
                    onClose={() => setLightboxIndex(null)}
                    onNext={() => { if (lightboxIndex < filteredFiles.length - 1) setLightboxIndex(lightboxIndex + 1); else setLightboxIndex(0); }}
                    onPrev={() => { if (lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1); else setLightboxIndex(filteredFiles.length - 1); }}
                    onSelect={setLightboxIndex}
                    onToggleTheme={onToggleTheme}
                    onSetThemeMode={onSetThemeMode}
                    onSubmitRevision={handleSubmitRevision}
                    onDeleteRevision={handleDeleteRevision}
                    showWatermark={project.showWatermark !== false}
                    showProtectedLabel={project.showProtectedLabel !== false}
                />
            )}

            {/* Mobile Backdrop Overlay (Payment only) */}
            {!isEmbedded && isMobilePaymentOpen && (
                <div
                    className="fixed inset-0 bg-transparent z-40 lg:hidden"
                    onClick={() => { setIsMobilePaymentOpen(false); showMobileHeader(); }}
                />
            )}

            <aside className={`
                flex-shrink-0 z-30 transition-[width,min-width,opacity,transform] duration-500 ease-in-out
                ${isLandscapeSplit
                    ? (isDockedSidebarCollapsed
                         ? 'opacity-0 -translate-x-2 pointer-events-none shadow-none border-r-0 h-full'
                         : 'h-full'
                      )
                     : isDockedSidebarCollapsed
                         ? 'w-0 opacity-0 -translate-x-2 pointer-events-none shadow-none border-r-0 h-full'
                         : `
                             lg:w-[350px] xl:w-[420px]
                             w-full
                             lg:h-full
                         `
                  }
                ${isDarkMode ? 'bg-[#23232e]' : 'bg-[#f1f5f9]'} 
                ${isDockedSidebarCollapsed ? 'border-r-0 border-b-0' : (isLandscapeSplit ? 'border-r border-slate-200 dark:border-white/5' : 'border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/5')}
                flex flex-col relative shadow-2xl overflow-hidden
            `}
            style={isLandscapeSplit
                ? {
                    width: `${isDockedSidebarCollapsed ? 0 : splitSidebarExpandedWidth}px`,
                    minWidth: `${isDockedSidebarCollapsed ? 0 : splitSidebarExpandedWidth}px`,
                }
                : undefined
            }>
                <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
                    {theme.wallpaper ? (
                        // ADJUSTED: Opacity adjusted per user request — Light boosted to full, Dark: 60%
                        <img src={theme.wallpaper} className={`w-full h-full object-cover transition-all duration-700 ${isDarkMode ? 'opacity-60 grayscale-[20%]' : 'opacity-100 grayscale-0'}`} alt="Background" />
                    ) : (
                        // GOLDILOCKS STYLE: If no wallpaper, show a subtle radial gradient to create "nice" depth without being overwhelming
                        <div className={`w-full h-full ${isDarkMode ? 'bg-[radial-gradient(circle_at_top_right,_#2d2d3a_0%,_#23232e_100%)]' : 'bg-[radial-gradient(circle_at_top_left,_#f8fafc_0%,_#e2e8f0_100%)]'}`} />
                    )}
                </div>

                {/* CRANKED GRAIN: Stronger film grain (requested). */}
                {theme.showGrain && (
                    <div
                        className={`absolute inset-0 z-0 pointer-events-none ${isDarkMode ? 'opacity-85 mix-blend-overlay' : 'opacity-80 mix-blend-overlay'}`}
                        style={{ backgroundImage: NOISE_SVG, filter: 'contrast(450%) brightness(110%)' }}
                    ></div>
                )}

                {/* UPDATED: Added backdrop-blur-sm to the overlay to smooth out noisy wallpapers behind text */}
                <div className={`absolute inset-0 z-10 bg-gradient-to-b ${sidebarOverlay} backdrop-blur-[1px]`} />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)]" />

                {/* Drag handle removed per user feedback — X button is sufficient */}

                {/* Mobile/Tablet Header (stacked layout) */}
                 {!isEmbedded && !isLandscapeSplit && (
                     <div
                        className={`lg:hidden relative shrink-0 z-50 ${!isMobileInfoOpen ? 'border-b border-slate-200 dark:border-white/5' : ''} ${isDarkMode ? 'bg-[#2b2b38]' : 'bg-[#f1f5f9]'}`}
                        style={{ paddingTop: headerChromePadTop }}
                     >
                        <div className="flex items-center gap-3 px-4 sm:px-5 pb-2">
                            <button
                                onClick={onBack}
                                className={`shrink-0 p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                                aria-label="Back"
                            >
                                <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
                            </button>

                            <div className="min-w-0 flex-1">
                                <h1 className={`font-serif ${isMobileInfoOpen ? 'text-base' : 'text-lg'} font-medium ${textPrimary} truncate leading-none`}>{project.name}</h1>
                                <p className={`text-[10px] ${textSecondary} mt-0.5 font-bold uppercase tracking-wider truncate`}>{project.files.length} Assets{isLocked && !isMobileInfoOpen ? ` · $${project.amount.toLocaleString()}` : ''}</p>
                            </div>

                            {isMobileInfoOpen ? (
                                <button
                                    onClick={() => { setIsMobileInfoOpen(false); showMobileHeader(); }}
                                    className={`shrink-0 p-2.5 rounded-full ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-colors`}
                                    aria-label="Close Details"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => { playClick(); openMobileDetails(); }}
                                    className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-colors`}
                                    aria-label="Details"
                                >
                                    <Menu className="w-3.5 h-3.5" />
                                    <span>Details</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Split Header (Landscape) — docked sidebar with collapse control */}
                {!isEmbedded && isLandscapeSplit && (
                    <div
                        className={`lg:hidden relative shrink-0 z-50 border-b border-slate-200 dark:border-white/5 ${isDarkMode ? 'bg-[#2b2b38]' : 'bg-[#f1f5f9]'}`}
                        style={{ paddingTop: headerChromePadTop }}
                    >
                        <div className="flex items-center gap-3 px-4 pb-2">
                            <button
                                onClick={() => { playClick(); onBack(); }}
                                className={`shrink-0 p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                                aria-label="Back"
                            >
                                <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
                            </button>

                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-bold ${textPrimary} truncate leading-tight`}>{project.name}</p>
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} truncate`}>{project.files.length} Assets{isLocked ? ` · $${project.amount.toLocaleString()}` : ''}</p>
                            </div>

                            <button
                                onClick={collapseDockedSidebar}
                                className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-colors`}
                                aria-label="Collapse Details"
                                title="Hide Details"
                            >
                                <PanelRightClose className="w-3.5 h-3.5" />
                                <span>Details</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Desktop Back Button Area (with Creator Preview Badge) */}
                {(!isEmbedded || allowSidebarCollapse) && (
                    <div
                        className="hidden lg:flex relative z-20 px-8 pt-8 pb-2 justify-between items-center gap-3 overflow-x-auto no-scrollbar"
                        style={{ paddingTop: paddingTop ? `max(32px, ${paddingTop})` : '32px' }}
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            {!isEmbedded && (
                                <button onClick={onBack} className={`group flex items-center gap-2 ${isCompactDesktopHeader ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-full ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900'} backdrop-blur-md border shadow-sm transition-all duration-300 hover:scale-105 shrink-0`}>
                                    <ChevronLeft className={`${isCompactDesktopHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'} group-hover:-translate-x-1 transition-transform`} />
                                    <span className={`${isCompactDesktopHeader ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-widest`}>Back</span>
                                </button>
                            )}
                            {/* Creator Preview Disclaimer — shown on full preview routes (not embedded editor preview). */}
                            {!isEmbedded && !project.clientViewedAt && (
                                <div className={`${isCompactDesktopHeader ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-full flex items-center gap-2 ${isCompactDesktopHeader ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-widest border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-100 border-amber-200 text-amber-700'} shrink-0`}>
                                    <Eye className={`${isCompactDesktopHeader ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                                    <span>Creator Preview</span>
                                </div>
                            )}
                            {/* Non-desktop layouts keep the collapse control here (left group). */}
                            {canCollapseDockedSidebar && !isDockedSidebarCollapsed && !isActualDesktopViewport && (
                                <button
                                    type="button"
                                    onClick={collapseDockedSidebar}
                                    className={`${isCompactDesktopHeader ? 'p-2' : 'p-2.5'} rounded-full border shadow-sm transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900'} backdrop-blur-md shrink-0`}
                                    aria-label="Collapse Details"
                                    title="Hide Details"
                                >
                                    <PanelRightClose className={`${isCompactDesktopHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                                </button>
                            )}
                        </div>
                        {/* Desktop-only: collapse button lives on the far right (red-spot placement). */}
                        {canCollapseDockedSidebar && !isDockedSidebarCollapsed && isActualDesktopViewport && (
                            <button
                                type="button"
                                onClick={collapseDockedSidebar}
                                className={`${isCompactDesktopHeader ? 'p-2' : 'p-2.5'} rounded-full border shadow-sm transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900'} backdrop-blur-md shrink-0`}
                                aria-label="Collapse Details"
                                title="Hide Details"
                            >
                                <PanelRightClose className={`${isCompactDesktopHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                            </button>
                        )}
                    </div>
                )}

                                {showDockedSidebar && sidebarBody}

            </aside>

            {/* Mobile Sticky Bottom Payment Bar */}
            {!isEmbedded && !isLandscapeSplit && !isMobileInfoOpen && !isMobilePaymentOpen && isLocked && !isPendingVerification && (
                <div className={`
                    fixed bottom-0 left-0 right-0 z-40 lg:hidden animate-fade-in
                    ${isDarkMode ? 'bg-[#23232e]/98 border-white/10' : 'bg-white/98 border-slate-200'}
                    border-t backdrop-blur-xl
                    border-t backdrop-blur-xl
                    py-3 pl-6 pr-5
                `} style={{
                    paddingBottom: paddingBottom ? `max(12px, ${paddingBottom})` : 'max(12px, env(safe-area-inset-bottom))',
                    paddingLeft: 'max(24px, env(safe-area-inset-left))',
                    paddingRight: 'max(20px, env(safe-area-inset-right))',
                }}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Total Due</p>
                            <p className={`text-xl font-serif font-bold ${textPrimary} leading-tight`} style={{ textShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.4)' : 'none' }}>${project.amount.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => { playClick(); openMobileDetails(); }}
                                className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Details
                            </button>
                            <button
                                onClick={() => { playClick(); setIsMobilePaymentOpen(true); }}
                                className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${isDarkMode ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                                <CreditCard className="w-3.5 h-3.5" /> Pay Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Sticky Bottom Bar - Pending Verification */}
            {!isEmbedded && !isLandscapeSplit && !isMobileInfoOpen && isPendingVerification && (
                <div className={`
                    fixed bottom-0 left-0 right-0 z-40 lg:hidden animate-fade-in
                    ${isDarkMode ? 'bg-[#23232e]/98 border-white/10' : 'bg-white/98 border-slate-200'}
                    border-t backdrop-blur-xl
                    px-4 py-4
                `} style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                    <div className="flex items-center justify-center gap-3 text-amber-500">
                        <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                        <span className="text-xs font-bold uppercase tracking-widest">Verification Pending</span>
                    </div>
                </div>
            )}

            {/* Mobile Payment Bottom Sheet */}
            {!isEmbedded && isMobilePaymentOpen && (
                <div className={`
                    fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-sheet-up
                    max-h-[85vh] rounded-t-[2rem] overflow-hidden
                    shadow-[0_-20px_60px_rgba(0,0,0,0.4)]
                    ${isDarkMode ? 'bg-[#23232e]' : 'bg-[#f1f5f9]'}
                `}>
                    <div className="flex justify-center pt-3 pb-1">
                        <div className={`w-10 h-1.5 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-slate-300'}`} />
                    </div>
                    <div className="flex items-center justify-between px-6 py-3">
                        <h3 className={`font-serif text-lg font-medium ${textPrimary}`}>Payment</h3>
                        <button
                            onClick={() => setIsMobilePaymentOpen(false)}
                            className={`p-2.5 rounded-full ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-colors`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-y-auto px-6 pb-8" style={{ maxHeight: 'calc(85vh - 80px)', paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
                            <PaymentTerminal
                                project={project}
                                isDarkMode={isDarkMode}
                                isEmbedded={isEmbedded}
                                isLandscapeCompact={isLandscapeSplit && isPhoneLike}
                                creatorName={creatorName}
                                onPaymentComplete={() => { setIsMobilePaymentOpen(false); onPaymentComplete(); }}
                                onMockVerify={() => { setIsMobilePaymentOpen(false); onPaymentComplete(); }}
                            />
                    </div>
                </div>
            )}

                <div className={`flex-1 relative flex flex-col overflow-hidden bg-transparent min-w-0 min-h-0 transition-opacity duration-150 ease-out ${motionReady ? 'opacity-100' : 'opacity-0'}`}>
                    {pattern && pattern !== 'none' && <div className="absolute inset-0 pointer-events-none z-0"><div className={`w-full h-full transition-all duration-500 ${patternColorClass} ${patternOpacityClass}`} style={{ maskImage: maskImage, WebkitMaskImage: maskImage, maskSize: maskSize, WebkitMaskSize: maskSize, maskRepeat: maskRepeat, WebkitMaskRepeat: maskRepeat }} /></div>}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-100/50 dark:bg-white/[0.02] rounded-full blur-[100px] -z-10 pointer-events-none" />

                    {/* Desktop-only: when the docked sidebar is collapsed, use minimal controls (no glass header). */}
                    {isActualDesktopViewport && isDockedSidebarCollapsed && (!isEmbedded || allowSidebarCollapse) && (
                        <div className="hidden lg:flex absolute top-8 left-8 right-8 z-40 items-center justify-between pointer-events-none">
                            <div className="flex items-center gap-2 pointer-events-auto">
                                {!isEmbedded ? (
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); onBack(); }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                                        aria-label="Back"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                ) : reserveCollapsedHeaderBackSlot > 0 ? (
                                    <div className="flex-shrink-0 flex items-center gap-2" aria-hidden="true">
                                        {Array.from({ length: reserveCollapsedHeaderBackSlot }, (_, i) => (
                                            <div key={i} className="w-10 h-10" />
                                        ))}
                                    </div>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => { playClick(); setIsSplitSidebarCollapsed(false); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${isDarkMode ? 'bg-white/10 border border-white/10 text-white/80 hover:bg-white/15' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    aria-label="Show Details"
                                    title="Show Details"
                                >
                                    <PanelRightOpen className="w-3.5 h-3.5" />
                                    <span>Details</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-3 pointer-events-auto">
                                {!isEmbedded && !project.clientViewedAt && (
                                    <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-100 border-amber-200 text-amber-700'}`}>
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Creator Preview</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <main ref={mainScrollRef} onScroll={handleMainScroll} className={`flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 ${isActualDesktopViewport && isDockedSidebarCollapsed && (!isEmbedded || allowSidebarCollapse) ? 'lg:pt-24' : ''} scroll-smooth relative z-10 w-full ${!isEmbedded && isLocked && !isPaid ? (isLandscapeSplit ? 'pb-8' : 'pb-24 lg:pb-8') : ''}`}>

                        {/* Collapsed Docked Sidebar Controls (Landscape split + Desktop) */}
                        {!isEmbedded && isDockedSidebarCollapsed && !isTrueDesktop && (
                            <div
                                className={`sticky top-0 z-40 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 mb-4 ${isTrueDesktop ? '-mt-3 sm:-mt-4 md:-mt-6 lg:-mt-8' : ''}`}
                                // Sticky positioning is relative to the scrollport (padding box). On desktop the scroll
                                // container has `lg:p-8`, so we offset the sticky top by that padding to truly flush.
                                style={{ top: isTrueDesktop ? '-32px' : '0px' }}
                            >
                                <div
                                    className={`border-b backdrop-blur-md ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white/70 border-slate-200'}`}
                                    style={{ paddingTop: hasMockStatusBar ? headerChromePadTop : (isRealTabletViewport ? '12px' : '0px') }}
                                >
                                    {isTrueDesktop && (
                                        <style>{`
                                            @keyframes thDesktopFlushInContent {
                                                from { opacity: 0; transform: translateY(10px); }
                                                to { opacity: 1; transform: translateY(0); }
                                            }
                                            .th-desktop-flush-content {
                                                animation: thDesktopFlushInContent 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
                                                will-change: transform, opacity;
                                            }
                                        `}</style>
                                    )}
                                    {/* Desktop-only: keep the glass background flush to the top, but align the controls
                                        to the same y-level as the expanded desktop sidebar header (which sits below 32px padding). */}
                                    {isTrueDesktop && <div aria-hidden className="h-[22px]" />}
                        <div className={`flex items-center justify-between gap-3 px-4 sm:px-5 md:px-6 lg:px-8 ${isTrueDesktop ? 'th-desktop-flush-content py-2.5' : 'pb-2'}`}>
                                        {isTrueDesktop ? (
                                            <>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => { playClick(); onBack(); }}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                                                        aria-label="Back"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { playClick(); setIsSplitSidebarCollapsed(false); }}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${isDarkMode ? 'bg-white/10 border border-white/10 text-white/80 hover:bg-white/15' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                        aria-label="Show Details"
                                                        title="Show Details"
                                                    >
                                                        <PanelRightOpen className="w-3.5 h-3.5" />
                                                        <span>Details</span>
                                                    </button>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-bold ${textPrimary} truncate`}>
                                                        {project.name}
                                                        <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>{project.files.length} Assets</span>
                                                    </p>
                                                </div>

                                                {!project.clientViewedAt && (
                                                    <div className={`hidden md:flex px-3 py-1.5 rounded-full items-center gap-2 text-[10px] font-bold uppercase tracking-widest border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-100 border-amber-200 text-amber-700'}`}>
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Creator Preview</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => { playClick(); onBack(); }}
                                                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                                                    aria-label="Back"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>

                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-xs font-bold ${textPrimary} truncate leading-tight`}>{project.name}</p>
                                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} truncate`}>{project.files.length} Assets{isLocked ? ` · $${project.amount.toLocaleString()}` : ''}</p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => { playClick(); setIsSplitSidebarCollapsed(false); }}
                                                    className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${isDarkMode ? 'bg-white/10 border border-white/10 text-white/80 hover:bg-white/15' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                    aria-label="Show Details"
                                                    title="Show Details"
                                                >
                                                    <PanelRightOpen className="w-3.5 h-3.5" />
                                                    <span>Details</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Inline Details Panel (Stacked Portrait) */}
                        {showInlineSidebar && (
                            <section className={`lg:hidden relative overflow-hidden rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.45)] border ${isDarkMode ? 'bg-[#23232e] border-white/10' : 'bg-[#f1f5f9] border-slate-200'} mb-4 h-[66vh] md:h-[70vh] animate-sheet-up`}>
                                {/* 85% height vs prior "full" portrait details sheet so the gallery remains discoverable behind it. */}
                                <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
                                    {theme.wallpaper ? (
                                        <img src={theme.wallpaper} className={`w-full h-full object-cover transition-all duration-700 ${isDarkMode ? 'opacity-60 grayscale-[20%]' : 'opacity-100 grayscale-0'}`} alt="Background" />
                                    ) : (
                                        <div className={`w-full h-full ${isDarkMode ? 'bg-[radial-gradient(circle_at_top_right,_#2d2d3a_0%,_#23232e_100%)]' : 'bg-[radial-gradient(circle_at_top_left,_#f8fafc_0%,_#e2e8f0_100%)]'}`} />
                                )}
                            </div>

                            {theme.showGrain && (
                                <div
                                    className={`absolute inset-0 z-0 pointer-events-none ${isDarkMode ? 'opacity-85 mix-blend-overlay' : 'opacity-80 mix-blend-overlay'}`}
                                    style={{ backgroundImage: NOISE_SVG, filter: 'contrast(450%) brightness(110%)' }}
                                />
                            )}

                            <div className={`absolute inset-0 z-10 bg-gradient-to-b ${sidebarOverlay} backdrop-blur-[1px]`} />
                            <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)]" />

                            {sidebarBody}
                        </section>
                    )}

                    {/* Inline back/details row — appears when mobile header hides, scrolls with content */}
                    {!isEmbedded && !isLandscapeSplit && isMobileHeaderHidden && !isMobileInfoOpen && (
                        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between mb-3 py-2 animate-fade-in">
                            <button
                                onClick={onBack}
                                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl transition-all active:scale-90 ${isDarkMode ? 'bg-white/10 border border-white/10 text-white hover:bg-white/15' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => { playClick(); openMobileDetails(); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-xl transition-all active:scale-95 ${isDarkMode ? 'bg-white/10 border border-white/10 text-white/80 hover:bg-white/15' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                            >
                                <Info className="w-3.5 h-3.5" />
                                <span>Details</span>
                            </button>
                        </div>
                    )}
                    <div className={`max-w-[98%] 2xl:max-w-[2000px] mx-auto`}>
                        {paymentError && (
                            <InlineErrorBanner
                                message={paymentError}
                                onDismiss={onDismissPaymentError}
                                className="mb-6"
                            />
                        )}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8 lg:mb-12">
                            <div className="hidden lg:block">
                                <div className="flex items-center gap-2 mb-3"><LayoutGrid className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Vault Contents</span></div>
                                <h2 className={`text-4xl md:text-5xl font-serif font-medium ${textPrimary} tracking-tight`}>{libraryEnabled && contentView === 'library' ? 'Client Library' : 'Asset Gallery'}</h2>
                            </div>

                            {/* Mobile/Tablet Title (When sidebar is collapsed, main title is hidden in sidebar, so we show simple controls here) */}
                            <div className="lg:hidden mb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <LayoutGrid className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{libraryEnabled && contentView === 'library' ? `Library (${availableLibraryProjects.length})` : `Vault Contents (${filteredFiles.length})`}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                                {libraryEnabled && <div className={`flex p-1 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} rounded-lg border shrink-0`}>
                                    <button
                                        onClick={() => { playClick(); setContentView('delivery'); }}
                                        className={`px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${contentView === 'delivery' ? (isDarkMode ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
                                    >
                                        Current
                                    </button>
                                    <button
                                        onClick={() => { playClick(); setContentView('library'); }}
                                        className={`px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${contentView === 'library' ? (isDarkMode ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
                                    >
                                        Library
                                    </button>
                                </div>}
                                {contentView === 'delivery' && <div className={`flex p-1 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} rounded-lg border shrink-0`}>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? (isDarkMode ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <GridIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>}
                                {contentView === 'delivery' && <div className={`h-8 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'} shrink-0`} />}
                                <div className={`flex p-1 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} rounded-lg border shrink-0`}>
                                    <ThemeModeDropdown
                                        themeMode={themeMode || 'system'}
                                        onChange={(mode) => {
                                            playClick();
                                            if (onSetThemeMode) onSetThemeMode(mode);
                                            else onToggleTheme();
                                        }}
                                        isDarkMode={isDarkMode}
                                        compact
                                        buttonClassName={`p-2 rounded-md transition-all shadow-sm hover:shadow-md flex items-center ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-white text-slate-500'}`}
                                    />
                                </div>
                                {contentView === 'delivery' && <div className={`h-8 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'} shrink-0`} />}
                                {contentView === 'delivery' && <div className="flex gap-2 shrink-0">
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'image', label: 'Image' },
                                        { id: 'doc', label: 'Doc' },
                                        { id: 'video', label: 'Video' },
                                        { id: 'audio', label: 'Audio' },
                                        { id: 'archive', label: 'Archive' },
                                    ].map(({ id, label }) => (
                                        <button
                                            key={id}
                                            onClick={() => setActiveFilter(id as any)}
                                            title={label}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeFilter === id
                                                ? (isDarkMode ? 'bg-white text-black shadow-lg' : 'bg-slate-900 text-white shadow-lg')
                                                : (isDarkMode ? 'text-slate-500 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100')}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>}
                            </div>
                        </div>

                        {libraryEnabled && contentView === 'library' ? (
                            <ClientLibraryView projects={availableLibraryProjects} isDarkMode={isDarkMode} />
                        ) : filteredFiles.length === 0 ? (
                            <div className={`mt-10 rounded-3xl border p-10 text-center ${isDarkMode ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white/80 border-slate-200 text-slate-600'} backdrop-blur-md`}>
                                <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white/10 bg-black/10">
                                    <Filter className={`w-6 h-6 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`} />
                                </div>
                                <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {activeFilter === 'all'
                                        ? 'No files available yet'
                                        : `No ${activeFilter} files available`}
                                </div>
                                <div className="text-xs mt-2 opacity-70">
                                    {activeFilter === 'all' ? 'Files will appear here once they are added to this project.' : 'Try another file type or switch back to all files.'}
                                </div>
                                {project.files.length > 0 && activeFilter !== 'all' && (
                                    <div className="mt-6 flex items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { playClick(); setActiveFilter('all'); }}
                                            className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 border ${isDarkMode ? 'bg-white/10 border-white/10 text-white/80 hover:bg-white/15' : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'}`}
                                        >
                                            Show All Files
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : viewMode === 'grid' ? (
                            <VisualAssetGrid
                                files={filteredFiles}
                                isLocked={isLocked}
                                isDarkMode={isDarkMode}
                                isEmbedded={isEmbedded}
                                revisions={revisions}
                                isPhoneLike={isPhoneLike}
                                onAssetClick={(index: number) => { playClick(); setLightboxIndex(index); }}
                                onRequestCorrection={handleRequestCorrection}
                                onRename={isEmbedded && !isCanvasSim ? onRenameAsset : undefined}
                                onResize={isEmbedded && !isCanvasSim ? onResizeAsset : undefined}
                                onRemove={isEmbedded && !isCanvasSim ? onRemoveAsset : undefined}
                            />
                        ) : (
                            <VisualAssetList
                                files={filteredFiles}
                                isLocked={isLocked}
                                isDarkMode={isDarkMode}
                                isEmbedded={isEmbedded}
                                revisions={revisions}
                                onAssetClick={(index: number) => { playClick(); setLightboxIndex(index); }}
                                onRequestCorrection={handleRequestCorrection}
                                onRename={isEmbedded && !isCanvasSim ? onRenameAsset : undefined}
                                onResize={isEmbedded && !isCanvasSim ? onResizeAsset : undefined}
                                onRemove={isEmbedded && !isCanvasSim ? onRemoveAsset : undefined}
                            />
                        )}

                        <div className="flex flex-col items-center justify-center pb-20 pt-10 text-center space-y-8">
                            <button
                                className="group cursor-pointer bg-transparent border-none p-0 w-auto"
                                onClick={() => {
                                    playClick();
                                    if (isCanvasSim) setIsLearnMoreOpen(true);
                                    else navigate('/');
                                }}
                            >
                                <div className={`flex items-center gap-5 px-6 py-3 rounded-full transition-all duration-300 backdrop-blur-md border ${isDarkMode ? 'bg-[#2a2a35] border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-white/5' : 'bg-slate-50 border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]'} hover:scale-[1.02] hover:-translate-y-1`}>
                                    <EditorialIcon className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-slate-900'} group-hover:rotate-12 transition-transform duration-500`} /><div className={`h-8 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-900/10'}`} />
                                    <div className="flex flex-col items-start text-left">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-0.5`}>
                                            {isCanvasSim ? 'Learn more' : 'Impress your clients like this.'}
                                        </span>
                                        <div className="flex items-center gap-1.5 group-hover:gap-2 transition-all">
                                            <span className={`font-serif font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                {isCanvasSim ? 'About TrueHandover' : 'Try TrueHandover'}
                                            </span>
                                            <ArrowRight className={`w-4 h-4 ${isDarkMode ? 'text-lime-400' : 'text-lime-600'}`} />
                                        </div>
                                    </div>
                                </div>
                            </button>
                            <div className="opacity-30 hover:opacity-100 transition-opacity duration-300 max-w-md space-y-3 cursor-default">
                                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    <ShieldCheck className="w-3 h-3" />
                                    Secure Delivery Vault
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                    Your files stay protected until payment is confirmed. Once it is, you can download the originals instantly, and every view/download is logged for transparency.
                                </p>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            {/* Canvas simulation: Learn More modal must overlay BOTH the docked sidebar and the gallery (landscape too). */}
            {isCanvasSim && isLearnMoreOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-5 sm:p-6" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" onClick={() => setIsLearnMoreOpen(false)} />
                    <div className={`relative w-full max-w-lg max-h-[85vh] rounded-[2rem] border shadow-2xl overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#181822]/95 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
                        <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Preview Mode</p>
                                    <h3 className="font-serif text-xl font-bold truncate">About TrueHandover</h3>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <a
                                        href="https://truehandover.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-white/10 border-white/10 text-white hover:bg-white/15' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                                        title="Opens in a new tab (exits simulation)"
                                    >
                                        <span>truehandover.com</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setIsLearnMoreOpen(false)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 ${isDarkMode ? 'bg-white/10 border-white/10 hover:bg-white/15 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'}`}
                                        aria-label="Close"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-6 space-y-4 overflow-y-auto">
                            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                You're viewing a simulated client preview. This environment helps you sanity-check layout, navigation,
                                and how your deliverables feel across devices.
                            </p>
                            <div className={`rounded-2xl px-4 py-3 border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                <p className="text-[11px] leading-relaxed">
                                    Visiting <span className={`${isDarkMode ? 'text-white' : 'text-slate-900'} font-bold`}>truehandover.com</span> opens the product website in a new tab.
                                    It is not your client portal domain (whitelabel/custom domains are separate).
                                </p>
                                <a
                                    href="https://truehandover.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`mt-3 inline-flex sm:hidden items-center gap-2 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${isDarkMode ? 'bg-white/10 border-white/10 text-white hover:bg-white/15' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <span>truehandover.com</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <p className={`mt-2 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Opens in new tab (exits simulation)
                                </p>
                            </div>
                            <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Tip</p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    Use the toolbar above to switch devices or exit back to the regular preview.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 pt-1 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setIsLearnMoreOpen(false)}
                                className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-[#bef264] hover:bg-[#a3e635] text-black' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                            >
                                Continue Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPreviewPage;
