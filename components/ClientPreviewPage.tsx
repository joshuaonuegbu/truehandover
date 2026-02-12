
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Lock, Unlock, Download, ShieldCheck,
    Play, Image as ImageIcon, FileText,
    ChevronLeft, MessageSquare,
    Clock, Search, Filter,
    Sun, Moon, LayoutGrid, Eye,
    Check, Monitor,
    DollarSign, Banknote, Loader2, MessageSquarePlus, X, Send, CreditCard, RefreshCw,
    Maximize2, Grid as GridIcon, Minimize2, ArrowLeft, ArrowRight, ArrowUp, Flame,
    PenTool, Coins, AlertTriangle, Trash2, PanelRightClose, PanelRightOpen,
    FileCode, CheckCircle, Info, ExternalLink, Menu, Key, Copy, EyeOff, List
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Project, FileAsset, UserProfile } from '../types';
import { playClick, playSuccess } from '../utils/sound';
import { PaymentTerminal } from './PaymentTerminal';

// --- PROPS INTERFACE ---
interface ClientPreviewPageProps {
    project: Project;
    user?: UserProfile;
    isDarkMode: boolean;
    themeMode: 'light' | 'dark' | 'system';
    onToggleTheme: () => void;
    onBack: () => void;
    isEmbedded?: boolean;
    isLocked: boolean;
    lightboxIndex: number | null;
    setLightboxIndex: (index: number | null) => void;
    revisions: Record<string, any[]>;
    onPaymentComplete: () => void;
    handleSubmitRevision: (text: string) => void;
    handleDeleteRevision: (index: number) => void;
    activeFilter: string;
    setActiveFilter: (filter: 'all' | 'image' | 'doc') => void;
    theme: any;
    filteredFiles: FileAsset[];
    handleRequestCorrection: (index: number) => void;
    accessDenied: boolean;
    refreshAccess: () => void;
}

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
                                        {revealedIds.has(cred.id) ? cred.password : '••••••••••••••••'}
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
const VisualAssetGrid = ({ files, isLocked, isDarkMode, isEmbedded, revisions, onAssetClick, onRequestCorrection, isPhoneLike }: any) => {
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const brandGreenBg = isDarkMode ? 'bg-[#bef264]' : 'bg-lime-600';
    const brandGreenShadow = isDarkMode ? 'shadow-[0_0_10px_#bef264]' : 'shadow-[0_0_10px_rgba(101,163,13,0.5)]';
    const borderColor = isDarkMode ? 'border-white/5' : 'border-slate-200';
    const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 ${!isEmbedded ? 'xl:grid-cols-3' : ''} gap-3 sm:gap-4 lg:gap-6 pb-24`}>
            {files.map((file: FileAsset, index: number) => {
                const isRevisionSent = !!(revisions[file.id]?.length);
                return (
                    <div
                        key={file.id}
                        className={`group relative ${isDarkMode ? 'bg-[#23232e] border-white/5 hover:shadow-white/5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]'} rounded-[1.5rem] border overflow-hidden transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-[1.01]`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <button
                            type="button"
                            onClick={() => onAssetClick(index)}
                            className={`aspect-[16/10] w-full ${isDarkMode ? 'bg-[#0f0f15]' : 'bg-slate-50'} relative overflow-hidden rounded-t-[1.5rem] isolate flex items-center justify-center cursor-pointer border-none p-0`}
                            aria-label={`View details for ${file.name}`}
                        >
                            {file.previewUrl ? (
                                <img src={file.previewUrl} alt={file.name} className={`w-full h-full object-cover rounded-t-[1.5rem] transition-all duration-700 ${file.locked && isLocked ? 'scale-105 blur-[8px] opacity-80' : 'group-hover:scale-105'}`} />
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
                                    <h3 className={`font-bold text-sm md:text-lg ${textPrimary} mb-1 transition-colors truncate`}>{file.name}</h3>
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-400">
                                        <span>{file.size}</span><span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" /><span className="uppercase tracking-wider">Version {file.version}.0</span>
                                    </div>
                                </div>
                                <div className={`w-2.5 h-2.5 shrink-0 rounded-full mt-1.5 ${file.locked && isLocked ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : `${brandGreenBg} ${brandGreenShadow}`}`} />
                            </div>
                            <div className={`${expandedSpecs.has(file.id) ? 'block' : (isPhoneLike ? 'hidden' : 'hidden md:block')} mb-4 md:mb-6 p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold uppercase text-slate-500">Technical Specs</span><ShieldCheck className="w-3 h-3 text-slate-400" /></div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-mono"><div>Res: {file.metadata?.resolution || 'N/A'}</div><div>Fmt: {file.metadata?.colorProfile || 'STD'}</div><div className="col-span-2 truncate opacity-70">SHA: {file.metadata?.hash || 'e3b0c44298fc...'}</div></div>
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
    );
};
// --- SUB-COMPONENT: VISUAL ASSET LIST (PREMIUM) ---
const VisualAssetList = ({ files, isLocked, isDarkMode, isEmbedded, onAssetClick, onRequestCorrection, revisions }: any) => {
    const borderColor = isDarkMode ? 'border-white/5' : 'border-slate-200';
    const brandGreenBg = isDarkMode ? 'bg-[#bef264]' : 'bg-lime-600';

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
                                            <h3 className={`font-bold text-sm sm:text-base truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{file.name}</h3>
                                            {isFileLocked ? (
                                                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Locked</span>
                                            ) : (
                                                <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isDarkMode ? 'text-[#bef264] bg-[#bef264]/10 border-[#bef264]/20' : 'text-lime-700 bg-lime-50 border-lime-200'}`}>Open</span>
                                            )}
                                        </div>

                                        <div className="mt-2 flex items-center gap-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono">
                                            <span className="uppercase tracking-wider">{file.type}</span>
                                            <span className={`w-px h-3 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                                            <span>{file.size}</span>
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
const VisualLightbox = ({ file, allFiles, currentIndex, isLocked, isDarkMode, themeMode, revisions, onClose, onNext, onPrev, onSelect, onToggleTheme, onSubmitRevision, onDeleteRevision }: any) => {
    // START CLOSED to allow for animation sequence
    const [showSidebar, setShowSidebar] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [slideDirection, setSlideDirection] = useState<0 | 1 | -1>(0);
    const [currentRevisionText, setCurrentRevisionText] = useState('');
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
    const [searchParams] = useSearchParams();
    const pt = searchParams.get('pt');
    const paddingTop = pt ? `${pt}px` : undefined;

    const headerPaddingTop = paddingTop
        ? `max(24px, ${paddingTop})`
        : 'max(24px, calc(16px + env(safe-area-inset-top)))';

    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') { setSlideDirection(1); onNext(); }
            if (e.key === 'ArrowLeft') { setSlideDirection(-1); onPrev(); }
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
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 grid grid-cols-3 items-start gap-3 z-50 pointer-events-none" style={{ paddingTop: headerPaddingTop }}>
                    <div className="pointer-events-auto justify-self-start"><button aria-label="Close Lightbox" onClick={handleClose} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'}`}><X className="w-5 h-5 md:w-6 md:h-6" /></button></div>
                    <div className="pointer-events-auto justify-self-center"><div className={`px-4 py-2 rounded-full font-mono text-xs font-bold shadow-sm flex items-center gap-2 ${isDarkMode ? 'bg-white/10 text-white backdrop-blur-md' : 'bg-white text-slate-700'}`}><span>{currentIndex + 1}</span><span className="opacity-30">/</span><span>{allFiles.length}</span></div></div>
                    <div className="pointer-events-auto justify-self-end"><button aria-label="Toggle Sidebar" onClick={() => { playClick(); setShowSidebar(!showSidebar); }} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'}`}>{showSidebar ? <PanelRightClose className="w-5 h-5 md:w-6 md:h-6" /> : <PanelRightOpen className="w-5 h-5 md:w-6 md:h-6" />}</button></div>
                </div>

                {/* Image Area - Centers and Fits Content. Added pt-24 for Mobile so image isn't hidden by header controls */}
                <div className="flex-1 flex items-center justify-center p-4 pt-24 md:p-12 relative overflow-hidden z-10">
                    <button aria-label="Previous Image" onClick={() => { setSlideDirection(-1); onPrev(); }} className={`absolute left-2 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all z-40 group ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'}`}><ArrowLeft className="w-6 h-6 md:w-7 md:h-7 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} /></button>
                    <button aria-label="Next Image" onClick={() => { setSlideDirection(1); onNext(); }} className={`absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all z-40 group ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'}`}><ArrowRight className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} /></button>

                    <div key={file.id} className={`relative w-full h-full max-w-full max-h-full flex items-center justify-center ${slideDirection === 1 ? 'animate-slide-right' : slideDirection === -1 ? 'animate-slide-left' : 'animate-fade-in'}`}>
                        {file.previewUrl ? (
                            <div className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl transition-all z-20 ${isDarkMode ? 'bg-[#23232e] border border-white/5' : 'bg-white border border-slate-200'}`} style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}>
                                {!isImageLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-white/5 z-10">
                                        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                                    </div>
                                )}
                                <img
                                    src={file.previewUrl}
                                    alt={file.name}
                                    onLoad={() => setIsImageLoaded(true)}
                                    className={`block max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                />
                                {file.locked && isLocked && (
                                    <>
                                        <div className="absolute inset-0 z-20 pointer-events-none select-none opacity-100" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-weight='900' font-size='24' fill='${isDarkMode ? 'white' : 'black'}' fill-opacity='0.03' transform='rotate(-45 150 150)' text-anchor='middle' dominant-baseline='middle' letter-spacing='4'%3ETRUEHANDOVER PREVIEW%3C/text%3E%3C/svg%3E")`, backgroundRepeat: 'repeat' }} />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                            <div className={`p-6 md:p-8 rounded-3xl border backdrop-blur-md flex flex-col items-center shadow-2xl ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white/60 border-slate-200 text-slate-900'}`}><EditorialIcon className={`w-10 h-10 md:w-14 md:h-14 mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} /><span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Protected Preview</span></div>
                                        </div>
                                    </>
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
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-[90%]"><div className={`flex items-center gap-2 p-2 rounded-2xl border backdrop-blur-md shadow-xl overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-[#18181b]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>{allFiles.map((f: FileAsset, idx: number) => (
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
                        <button onClick={() => setShowThumbnails(false)} className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg text-[10px] font-bold uppercase tracking-widest transition-all z-30 ${isDarkMode ? 'bg-[#18181b] text-slate-400 hover:text-white border border-white/10' : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'}`}><Minimize2 className="w-3.5 h-3.5" /> Hide Dock</button>
                    </>
                ) : (
                    <button onClick={() => setShowThumbnails(true)} className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg text-[10px] font-bold uppercase tracking-widest transition-all z-50 ${isDarkMode ? 'bg-[#18181b] text-slate-400 hover:text-white border border-white/10' : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'}`}><GridIcon className="w-3.5 h-3.5" /> Show Files</button>
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
                    <button aria-label="Close Sidebar" onClick={() => setShowSidebar(false)} className="lg:hidden absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200"><X className="w-6 h-6" /></button>

                    <div className="w-full lg:w-[350px] xl:w-[400px] flex flex-col h-full" style={{ paddingTop: paddingTop }}>
                        <div className={`p-6 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${revisions.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>Requests ({revisions.length})</div>
                                <div className="flex items-center gap-3"><button aria-label="Toggle Theme" onClick={() => { playClick(); onToggleTheme(); }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>{(!themeMode || themeMode === 'light') && <Sun className="w-3.5 h-3.5" />}{themeMode === 'dark' && <Moon className="w-3.5 h-3.5" />}{themeMode === 'system' && <Monitor className="w-3.5 h-3.5" />}</button>{file.locked && isLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className={`w-4 h-4 ${isDarkMode ? 'text-[#bef264]' : 'text-lime-600'}`} />}</div>
                            </div>
                            <h3 className={`font-bold text-lg leading-tight ${textPrimary} truncate`}>{file.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 font-mono">{file.size} • {file.type.toUpperCase()}</p>
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
    project, user, isDarkMode, themeMode, onToggleTheme, onBack, isEmbedded = false,
    isLocked, lightboxIndex, setLightboxIndex, revisions, onPaymentComplete,
    handleSubmitRevision, handleDeleteRevision, activeFilter, setActiveFilter, theme,
    filteredFiles, handleRequestCorrection, accessDenied, refreshAccess
}) => {
    const navigate = useNavigate();
    const creatorName = user?.name || "Creator";
    const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false);
    const [isMobilePaymentOpen, setIsMobilePaymentOpen] = useState(false);
    const [isMobileHeaderHidden, setIsMobileHeaderHidden] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isSplitSidebarCollapsed, setIsSplitSidebarCollapsed] = useState(false);

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
    const isPhoneLike = Math.min(viewport.width, viewport.height) < 500;

    // Enable a true split layout for any landscape device inside the simulator, and for real devices
    // below `lg` (this includes phone landscape, where the sidebar can be collapsed).
    const isLandscapeSplit = !isEmbedded && isLandscape && (deviceType ? true : isBelowLg);
    // Docked sidebar collapse is supported for:
    // - Split landscape (mobile/tablet/foldable)
    // - Desktop (lg+) where the sidebar is docked
    const canCollapseDockedSidebar = !isEmbedded && (isLandscapeSplit || !isBelowLg);
    // Sidebar placement:
    // - Docked in split-landscape + desktop
    // - Inline in the main scroll for stacked (portrait) small screens so users can scroll past it to the asset gallery.
    const showDockedSidebar = isEmbedded || isLandscapeSplit || !isBelowLg;
    const showInlineSidebar = !isEmbedded && !isLandscapeSplit && isBelowLg && isMobileInfoOpen;
    const isDockedSidebarCollapsed = canCollapseDockedSidebar && isSplitSidebarCollapsed;
    // Extra top breathing room below the (mock) status bar:
    // - Mobile portrait can afford slightly more
    // - Everything else sits a touch closer for tighter, more premium spacing.
    const headerExtraTopPx = deviceType === 'mobile' && !isLandscape ? 8 : 4;
    const headerChromePadTop = `calc(${headerSafeTop} + ${headerExtraTopPx}px)`;
    const hasMockStatusBar = Boolean(deviceType);
    const isTrueDesktop = !isEmbedded && !deviceType && !isBelowLg;

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
    const sidebarOverlay = isDarkMode ? 'from-[#1a1a24]/80 via-[#1a1a24]/60 to-[#1a1a24]/30' : 'from-[#f1f5f9]/85 via-[#f1f5f9]/75 to-[#f1f5f9]/50';
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
                            {project.message && (
                                <div className={`relative ${glassPanelClass} rounded-xl backdrop-blur-md overflow-hidden`}>
                                    <button onClick={() => toggleSection('message')} className={`w-full flex items-center justify-between p-4`}>
                                        <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Creator Message</span>
                                        <ChevronLeft className={`w-4 h-4 ${textSecondary} transition-transform duration-300 ${expandedSections.has('message') ? '-rotate-90' : 'rotate-180'}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.has('message') ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-4 pb-4">
                                            <div className={`pl-4 border-l-2 ${isDarkMode ? 'border-[#bef264]/40' : 'border-lime-500/40'}`}>
                                                <p className={`text-sm ${textSecondary} font-medium leading-relaxed italic`}>"{project.message}"</p>
                                                <div className="mt-4 flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold ${textSecondary} uppercase tracking-widest`}>Creator Signature</span>
                                                    <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'} mx-2`} />
                                                    <span className={`font-serif italic ${textPrimary}`}>{creatorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                creatorName={creatorName}
                                onPaymentComplete={onPaymentComplete}
                                onMockVerify={onPaymentComplete}
                            />
                        </div>
                    )}
                </div>
    );

    return (
        <div className={`flex ${isLandscapeSplit ? 'flex-row' : 'flex-col'} lg:flex-row ${isEmbedded ? 'h-full w-full' : 'min-h-screen h-[100dvh]'} ${isDarkMode ? 'bg-cosmic text-slate-100' : 'bg-[#FDFDFD] text-slate-900'} font-sans overflow-hidden transition-colors duration-500 relative`}>
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
                    onSubmitRevision={handleSubmitRevision}
                    onDeleteRevision={handleDeleteRevision}
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
                flex-shrink-0 z-30 transition-all duration-500 ease-in-out
                ${isLandscapeSplit
                    ? (isDockedSidebarCollapsed
                         ? 'w-0 opacity-0 -translate-x-2 pointer-events-none shadow-none border-r-0 h-full'
                         : `${isPhoneLike ? 'w-[300px]' : 'w-[clamp(300px,35vw,380px)]'} h-full`
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
            `}>
                <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
                    {theme.wallpaper ? (
                        // ADJUSTED: Opacity adjusted per user request — Light boosted to full, Dark: 60%
                        <img src={theme.wallpaper} className={`w-full h-full object-cover transition-all duration-700 ${isDarkMode ? 'opacity-60 grayscale-[20%]' : 'opacity-100 grayscale-0'}`} alt="Background" />
                    ) : (
                        // GOLDILOCKS STYLE: If no wallpaper, show a subtle radial gradient to create "nice" depth without being overwhelming
                        <div className={`w-full h-full ${isDarkMode ? 'bg-[radial-gradient(circle_at_top_right,_#2d2d3a_0%,_#23232e_100%)]' : 'bg-[radial-gradient(circle_at_top_left,_#f8fafc_0%,_#e2e8f0_100%)]'}`} />
                    )}
                </div>

                {/* CRANKED GRAIN: Boosted contrast significantly (300%) for extreme film texture */}
                {theme.showGrain && (
                    <div
                        className={`absolute inset-0 z-0 pointer-events-none ${isDarkMode ? 'opacity-60 mix-blend-overlay' : 'opacity-40 mix-blend-multiply'}`}
                        style={{ backgroundImage: NOISE_SVG, filter: 'contrast(300%) brightness(100%)' }}
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
                        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3 px-5 pb-2">
                            <button
                                onClick={onBack}
                                className={`p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                                aria-label="Back"
                            >
                                <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
                            </button>

                            <div className="min-w-0">
                                <h1 className={`font-serif ${isMobileInfoOpen ? 'text-base' : 'text-lg'} font-medium ${textPrimary} truncate leading-none`}>{project.name}</h1>
                                <p className={`text-[10px] ${textSecondary} mt-0.5 font-bold uppercase tracking-wider`}>{project.files.length} Assets{isLocked && !isMobileInfoOpen ? ` · $${project.amount.toLocaleString()}` : ''}</p>
                            </div>

                            {isMobileInfoOpen ? (
                                <button
                                    onClick={() => { setIsMobileInfoOpen(false); showMobileHeader(); }}
                                    className={`p-2.5 rounded-full ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-colors`}
                                    aria-label="Close Details"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => { playClick(); openMobileDetails(); }}
                                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-colors`}
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
                        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3 px-4 pb-2">
                            <button
                                onClick={() => { playClick(); onBack(); }}
                                className={`p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                                aria-label="Back"
                            >
                                <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
                            </button>

                            <div className="min-w-0 flex items-center gap-2">
                                <button
                                    onClick={() => { playClick(); setIsSplitSidebarCollapsed(true); }}
                                    className={`p-2.5 rounded-full ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-colors`}
                                    aria-label="Collapse Details"
                                    title="Hide Details"
                                >
                                    <PanelRightClose className="w-4 h-4" />
                                </button>

                                <div className="min-w-0">
                                    <p className={`text-xs font-bold ${textPrimary} truncate leading-tight`}>{project.name}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} truncate`}>{project.files.length} Assets</p>
                                </div>
                            </div>

                            <div />
                        </div>
                    </div>
                )}

                {/* Desktop Back Button Area (with Creator Preview Badge) */}
                {!isEmbedded && (
                    <div className="hidden lg:flex relative z-20 px-8 pt-8 pb-2 justify-between items-center" style={{ paddingTop: paddingTop ? `max(32px, ${paddingTop})` : '32px' }}>
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className={`group flex items-center gap-2 px-4 py-2 rounded-full ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900'} backdrop-blur-md border shadow-sm transition-all duration-300 hover:scale-105`}>
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                            </button>
                            {/* Creator Preview Disclaimer — moved here */}
                            {!project.clientViewedAt && (
                                <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Creator Preview</span>
                                </div>
                            )}
                            {canCollapseDockedSidebar && !isDockedSidebarCollapsed && (
                                <button
                                    type="button"
                                    onClick={() => { playClick(); setIsSplitSidebarCollapsed(true); }}
                                    className={`p-2.5 rounded-full border shadow-sm transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900'} backdrop-blur-md`}
                                    aria-label="Collapse Details"
                                    title="Hide Details"
                                >
                                    <PanelRightClose className="w-4 h-4" />
                                </button>
                            )}
                        </div>
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
                            creatorName={creatorName}
                            onPaymentComplete={(method) => { setIsMobilePaymentOpen(false); onPaymentComplete(method); }}
                            onMockVerify={() => { setIsMobilePaymentOpen(false); onPaymentComplete(); }}
                        />
                    </div>
                </div>
            )}

                <div className="flex-1 relative flex flex-col overflow-hidden bg-transparent min-w-0 min-h-0">
                    {pattern && pattern !== 'none' && <div className="absolute inset-0 pointer-events-none z-0"><div className={`w-full h-full transition-all duration-500 ${patternColorClass} ${patternOpacityClass}`} style={{ maskImage: maskImage, WebkitMaskImage: maskImage, maskSize: maskSize, WebkitMaskSize: maskSize, maskRepeat: maskRepeat, WebkitMaskRepeat: maskRepeat }} /></div>}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-100/50 dark:bg-white/[0.02] rounded-full blur-[100px] -z-10 pointer-events-none" />

                    <main ref={mainScrollRef} onScroll={handleMainScroll} className={`flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 scroll-smooth relative z-10 w-full ${!isEmbedded && isLocked && !isPaid ? (isLandscapeSplit ? 'pb-8' : 'pb-24 lg:pb-8') : ''}`}>

                        {/* Collapsed Docked Sidebar Controls (Landscape split + Desktop) */}
                        {!isEmbedded && isDockedSidebarCollapsed && (
                            <div
                                className={`sticky top-0 z-40 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 mb-4 ${isTrueDesktop ? '-mt-3 sm:-mt-4 md:-mt-6 lg:-mt-8' : ''}`}
                                // Sticky positioning is relative to the scrollport (padding box). On desktop the scroll
                                // container has `lg:p-8`, so we offset the sticky top by that padding to truly flush.
                                style={{ top: isTrueDesktop ? '-32px' : '0px' }}
                            >
                                <div
                                    className={`border-b backdrop-blur-md ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white/70 border-slate-200'}`}
                                    style={{ paddingTop: hasMockStatusBar ? headerChromePadTop : '0px' }}
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
                                    <div className={`flex items-center justify-between gap-3 px-4 sm:px-5 md:px-6 lg:px-8 ${isTrueDesktop ? 'th-desktop-flush-content py-2.5' : 'pb-3'}`}>
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
                                            {isTrueDesktop ? (
                                                <p className={`text-sm font-bold ${textPrimary} truncate`}>
                                                    {project.name}
                                                    <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>{project.files.length} Assets</span>
                                                </p>
                                            ) : (
                                                <>
                                                    <p className={`text-xs font-bold ${textPrimary} truncate leading-tight`}>{project.name}</p>
                                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} truncate`}>{project.files.length} Assets</p>
                                                </>
                                            )}
                                        </div>

                                        {!project.clientViewedAt && (
                                            <div className={`hidden md:flex px-3 py-1.5 rounded-full items-center gap-2 text-[10px] font-bold uppercase tracking-widest border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Creator Preview</span>
                                            </div>
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
                                    className={`absolute inset-0 z-0 pointer-events-none ${isDarkMode ? 'opacity-60 mix-blend-overlay' : 'opacity-40 mix-blend-multiply'}`}
                                    style={{ backgroundImage: NOISE_SVG, filter: 'contrast(300%) brightness(100%)' }}
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
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8 lg:mb-12">
                            <div className="hidden lg:block">
                                <div className="flex items-center gap-2 mb-3"><LayoutGrid className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Vault Contents</span></div>
                                <h2 className={`text-4xl md:text-5xl font-serif font-medium ${textPrimary} tracking-tight`}>Asset Gallery</h2>
                            </div>

                            {/* Mobile/Tablet Title (When sidebar is collapsed, main title is hidden in sidebar, so we show simple controls here) */}
                            <div className="lg:hidden mb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <LayoutGrid className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Vault Contents ({filteredFiles.length})</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                                <div className={`flex p-1 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} rounded-lg border shrink-0`}>
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
                                </div>
                                <div className={`h-8 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'} shrink-0`} />
                                <div className={`flex p-1 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} rounded-lg border shrink-0`}><button aria-label="Toggle Theme" onClick={onToggleTheme} className={`p-2 rounded-md transition-all shadow-sm hover:shadow-md ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-white text-slate-500'}`} title={`Theme: ${themeMode ? themeMode.charAt(0).toUpperCase() + themeMode.slice(1) : 'Toggle'}`}>{(!themeMode || themeMode === 'light') && <Sun className="w-4 h-4" />}{themeMode === 'dark' && <Moon className="w-4 h-4" />}{themeMode === 'system' && <Monitor className="w-4 h-4" />}</button></div>
                                <div className={`h-8 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'} shrink-0`} />
                                <div className="flex gap-2 shrink-0">{['all', 'image', 'doc'].map((filter) => (<button key={filter} onClick={() => setActiveFilter(filter as any)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeFilter === filter ? (isDarkMode ? 'bg-white text-black shadow-lg' : 'bg-slate-900 text-white shadow-lg') : (isDarkMode ? 'text-slate-500 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100')}`}>{filter}</button>))}</div>
                            </div>
                        </div>

                        {viewMode === 'grid' ? (
                            <VisualAssetGrid
                                files={filteredFiles}
                                isLocked={isLocked}
                                isDarkMode={isDarkMode}
                                isEmbedded={isEmbedded}
                                revisions={revisions}
                                isPhoneLike={isPhoneLike}
                                onAssetClick={(index: number) => { playClick(); setLightboxIndex(index); }}
                                onRequestCorrection={handleRequestCorrection}
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
                            />
                        )}

                        <div className="flex flex-col items-center justify-center pb-20 pt-10 text-center space-y-8">
                            <button className="group cursor-pointer bg-transparent border-none p-0 w-auto" onClick={() => { playClick(); navigate('/'); }}>
                                <div className={`flex items-center gap-5 px-6 py-3 rounded-full transition-all duration-300 backdrop-blur-md border ${isDarkMode ? 'bg-[#2a2a35] border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-white/5' : 'bg-slate-50 border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]'} hover:scale-[1.02] hover:-translate-y-1`}>
                                    <EditorialIcon className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} /><div className={`h-8 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-900/10'}`} />
                                    <div className="flex flex-col items-start text-left"><span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-0.5`}>Impress your clients like this.</span><div className="flex items-center gap-1.5 group-hover:gap-2 transition-all"><span className={`font-serif font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Try TrueHandover</span><ArrowRight className={`w-4 h-4 ${isDarkMode ? 'text-lime-400' : 'text-lime-600'}`} /></div></div>
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
        </div>
    );
};

export default ClientPreviewPage;
