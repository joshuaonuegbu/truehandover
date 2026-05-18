
import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import {
    ArrowRight, Shield, Zap, Globe,
    Lock, Check, Eye, FileText, Smartphone,
    HardDrive, CheckCircle, ShieldCheck,
    CreditCard, DollarSign, Box,
    Upload, Server,
    Image as ImageIcon,
    Crown,
    Palette,
    FileCheck,
    PlayCircle,
    X,
    Mail,
    Link as LinkIcon,
    AlertCircle,
    Cloud,
    Disc,
    Clock,
    Unlock,
    Plus,
    PenTool,
    Minus,
    Gem,
    Coins,
    Banknote,
    BarChart3,
    Menu,
    LifeBuoy,
    Youtube,
    LayoutGrid,
    FolderOpen,
    Save,
    Calendar
} from 'lucide-react';
import { playClick, playSuccess } from '../utils/sound';
import ThemeModeDropdown from './ThemeModeDropdown';
import BrandLogo from './BrandLogo';
import DeliveryQuickQuote from './DeliveryQuickQuote';
import { type QuoteLine, makeQuoteLine, calcQuoteSubtotal } from '../utils/quoteBuilderCore';

// --- VISUAL PRIMITIVES ---

// OPTIMIZED: Granular Film Grain SVG (Synced with App.tsx Vault Style)
// baseFrequency=0.98 provides the "Ultra High Res" digital film look.
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

function subscribeDocDarkClass(onStoreChange: () => void) {
    if (typeof document === 'undefined') return () => {};
    const mo = new MutationObserver(onStoreChange);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', onStoreChange);
    return () => {
        mo.disconnect();
        mq.removeEventListener('change', onStoreChange);
    };
}
function getDocDarkClassSnapshot() {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}
const Logo = ({ className = "w-8 h-8" }) => (
    <BrandLogo className={className} />
);

const BrandXIcon = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18.901 1.153h3.68l-8.04 9.19 9.46 12.504H16.6l-5.795-7.57-6.627 7.57H.499l8.6-9.83L0 1.154h7.59l5.243 6.932L18.901 1.153Zm-1.291 19.492h2.039L6.482 3.24H4.295L17.61 20.645Z" />
    </svg>
);

const BrandDiscordIcon = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20.317 4.369A19.791 19.791 0 0 0 15.885 3c-.191.34-.404.79-.553 1.149a18.27 18.27 0 0 0-6.664 0A11.78 11.78 0 0 0 8.113 3a19.736 19.736 0 0 0-4.432 1.369C.533 9.131-.32 13.775.099 18.359A19.9 19.9 0 0 0 5.993 21c.48-.649.907-1.334 1.27-2.053a12.99 12.99 0 0 1-2.004-.974c.168-.122.332-.249.49-.38 3.869 1.818 8.061 1.818 11.884 0 .16.132.323.259.49.38-.637.38-1.306.709-2.006.975.363.718.79 1.403 1.271 2.052a19.867 19.867 0 0 0 5.896-2.642c.492-5.316-.84-9.918-3.067-13.989ZM8.02 15.331c-1.157 0-2.104-1.06-2.104-2.362 0-1.302.928-2.362 2.104-2.362 1.184 0 2.123 1.07 2.104 2.362 0 1.302-.928 2.362-2.104 2.362Zm7.96 0c-1.157 0-2.104-1.06-2.104-2.362 0-1.302.928-2.362 2.104-2.362 1.184 0 2.123 1.07 2.104 2.362 0 1.302-.919 2.362-2.104 2.362Z" />
    </svg>
);

const VideoModal = ({ isOpen, onClose, onStart }: { isOpen: boolean; onClose: () => void, onStart: () => void }) => {
    const [render, setRender] = useState(false);
    const [visible, setVisible] = useState(false);

    // Reliable Abstract Video (Apple-style)
    const videoId = "M7fi_R23Qv8";

    // Stage 1: Mount/Unmount
    useEffect(() => {
        if (isOpen) {
            setRender(true);
        } else {
            setVisible(false);
            const timer = setTimeout(() => setRender(false), 500); // Wait for exit animation
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Stage 2: Animate In (Triggered after Mount)
    useEffect(() => {
        if (render) {
            // Force a small delay to ensure the browser paints the 'initial' state before transitioning to 'visible'
            // Using requestAnimationFrame for smoother entry
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
        }
    }, [render]);

    const handleClose = () => {
        setVisible(false);
        // Delay calling actual onClose until animation finishes
        setTimeout(() => {
            onClose();
        }, 500);
    };

    if (!render) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Cinematic Backdrop with Original Blur Style */}
            <div
                className={`
                    absolute inset-0 bg-[#323242]/40 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                    ${visible ? 'opacity-100' : 'opacity-0'}
                `}
                onClick={handleClose}
            />

            {/* Content Wrapper */}
            <div
                className={`
                    relative w-full max-w-6xl flex flex-col gap-8 z-10 items-center transform transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                    ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}
                `}
            >

                {/* Video Container */}
                <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 z-20 p-3 rounded-full transition-all backdrop-blur-md border group bg-slate-200/50 hover:bg-slate-200/50 border-slate-200 text-obsidian dark:bg-[#323242]/60 dark:hover:bg-white/20 dark:border-white/10 dark:text-white"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=0&loop=1&playlist=${videoId}`}
                        title="Sendational Film"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full pointer-events-none scale-110"
                    />
                </div>

                {/* CTA Actions - Staggered fade in */}
                <div
                    className={`
                        flex flex-col sm:flex-row items-center gap-6 transition-all duration-700 delay-100
                        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                >
                    <button
                        onClick={() => { handleClose(); setTimeout(onStart, 300); }}
                        className="px-8 py-4 bg-lime-400 text-black rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_30px_rgba(190, 242, 100,0.4)] transition-all shadow-lg flex items-center gap-3"
                    >
                        Start for Free <ArrowRight className="w-4 h-4" />
                    </button>

                    <span className="text-white/40 hidden sm:block">|</span>

                    {/* Sign In Button - Black in Light Mode, White in Dark Mode */}
                    <button
                        onClick={() => { playClick(); handleClose(); window.location.href = '/signin?from=landing'; }}
                        className="px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-lg hover:scale-105 bg-black text-white hover:bg-obsidian dark:bg-white dark:text-black dark:hover:bg-slate-200"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Chooses how to enter the app — avoids jumping straight into a raw OS file picker from primary CTAs.
 * Full-page drag-and-drop still works for returning visitors who already know the shortcut.
 */
const GetStartedModal = ({
    isOpen,
    onClose,
    onStartFresh,
    onChooseFiles,
    filesPathAvailable,
}: {
    isOpen: boolean;
    onClose: () => void;
    onStartFresh: () => void;
    onChooseFiles: () => void;
    filesPathAvailable: boolean;
}) => {
    const [render, setRender] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
        } else {
            setVisible(false);
            const timer = setTimeout(() => setRender(false), 450);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (render) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
        }
    }, [render]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => onClose(), 450);
    };

    if (!render) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex flex-col items-center justify-center p-4 sm:p-8">
            <div
                className={`absolute inset-0 bg-[#323242]/50 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
                aria-hidden
            />
            <div
                className={`relative z-10 w-full max-w-lg transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:max-w-xl ${visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-[0.98] opacity-0'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="get-started-title"
            >
                <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/40 bg-white/90 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.2)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-[#14141a]/85 dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)]">
                    <div className="relative px-6 pb-5 pt-7 sm:px-9 sm:pb-6 sm:pt-8">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300/80 to-transparent dark:via-white/20" />
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 space-y-2 pr-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">Sendational</p>
                                <h2 id="get-started-title" className="font-sans font-medium tracking-tight text-2xl leading-[1.15]  text-zinc-950 dark:text-white sm:text-[1.65rem]">
                                    How would you like to begin?
                                </h2>
                                <p className="max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    Open the workspace now, or add files first — both paths land in Quick delivery.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { playClick(); handleClose(); }}
                                className="shrink-0 rounded-full border border-zinc-200/80 p-2 text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/15 dark:hover:bg-white/10 dark:hover:text-white"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 px-6 pb-7 sm:space-y-4 sm:px-9 sm:pb-9">
                        <button
                            type="button"
                            onClick={() => {
                                playClick();
                                handleClose();
                                setTimeout(onStartFresh, 200);
                            }}
                            className="group w-full rounded-2xl border border-zinc-200/70 bg-zinc-50/50 p-5 text-left transition-all hover:border-zinc-300 hover:bg-white hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.06] sm:p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/60 bg-white text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-lime-400">
                                    <LayoutGrid className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-900 dark:text-white">
                                        Open the workspace
                                        <ArrowRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                                    </p>
                                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        Jump in and explore Quick delivery, projects, and settings. Add files whenever you&apos;re ready.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {filesPathAvailable && (
                            <div className="rounded-2xl border border-dashed border-zinc-300/70 bg-white/60 p-5 dark:border-white/12 dark:bg-white/[0.02] sm:p-6">
                                <div className="mb-4 flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/60 bg-zinc-100/80 text-zinc-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-900 dark:text-white">
                                            Bring files first
                                        </p>
                                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            We&apos;ll place them in Quick delivery so you can add the client, publish, and share the project link in a few steps.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        playClick();
                                        handleClose();
                                        setTimeout(onChooseFiles, 200);
                                    }}
                                    className="w-full rounded-xl bg-zinc-950 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-950 sm:w-auto"
                                >
                                    Choose files
                                </button>
                            </div>
                        )}

                        {filesPathAvailable && (
                            <p className="pt-1 text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                                You can also{' '}
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">drag files from your desktop</span> onto this page anytime.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Clean panel surface (Reports-style): charcoal/white, zinc borders, soft shadow — no grain or gradient wash */
const NetRevenueStylePanel = ({
    children,
    className = '',
    roundedClass = 'rounded-[2rem]',
}: {
    children: React.ReactNode;
    className?: string;
    roundedClass?: string;
}) => (
    <div
        className={`relative overflow-hidden bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md flex flex-col min-h-0 ${roundedClass} ${className}`}
    >
        <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full">{children}</div>
    </div>
);

const SectionHeading = ({ badge, title, subtitle, className = "" }: any) => (
    <div className={`mb-20 ${className}`}>
        {badge && (
            <span className="inline-block py-1.5 px-4 rounded-full bg-black dark:bg-white/10 font-mono text-xs text-lime-400 uppercase tracking-widest mb-6 border border-white/10 shadow-lg">
                {badge}
            </span>
        )}
        <h2 className="font-sans font-medium tracking-tight text-4xl md:text-6xl mb-6 text-black dark:text-white transition-colors duration-500 leading-tight ">
            {title}
        </h2>
        {subtitle && <p className="text-slate-600 dark:text-slate-200 text-lg max-w-xl transition-colors duration-500 leading-relaxed">
            {subtitle}
        </p>}
    </div>
);

const BentoCard = ({ children, className = "", title, subtitle, icon: Icon }: { children?: React.ReactNode, className?: string, title?: string, subtitle?: string, icon?: any }) => (
    <div
        className={`group relative flex flex-col transition-all duration-500 overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#323242]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-zinc-300/80 dark:hover:border-white/15 ${className}`}
    >
        {(title || Icon) && (
            <div className="p-8 pb-4 shrink-0">
                <div className="flex items-center gap-3 mb-3">
                    {Icon && (
                        <div className="w-10 h-10 rounded-xl bg-white/60 dark:bg-white/[0.06] border border-zinc-200/60 dark:border-white/[0.08] flex items-center justify-center text-black dark:text-lime-400 backdrop-blur-sm">
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        {title && <h3 className="font-sans font-medium tracking-tight text-xl text-black dark:text-white leading-none mb-1 ">{title}</h3>}
                        {subtitle && <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
                    </div>
                </div>
            </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </div>
);

// --- SECTIONS ---

const Nav = ({ onStart, currentTheme, onSetThemeMode, isHidden }: { onStart: () => void, currentTheme: 'light' | 'dark' | 'system', onSetThemeMode: (mode: 'light' | 'dark' | 'system') => void, isHidden: boolean }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const scrollTo = (id: string) => {
        setIsMenuOpen(false);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 px-6 pb-6 transition-all duration-500 ${isHidden ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}
            style={{ paddingTop: 'max(32px, calc(env(safe-area-inset-top, 0px) + 18px))' }}
        >
            {/* On xl+ screens, offset the nav pill to the right of the floating widget (w-80 = 20rem + left-6 + gap ≈ 22rem) */}
            <div>
            <div className="max-w-[760px] md:max-w-[900px] xl:max-w-[1080px] 2xl:max-w-[1200px] mx-auto bg-white/80 dark:bg-[#323242]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full px-4 sm:px-5 lg:px-6 py-3 flex items-center justify-between shadow-2xl relative z-50">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <Logo className="w-6 h-6 text-black dark:text-white group-hover:rotate-12 transition-transform duration-500" />
                    <span className="font-sans font-medium tracking-tight text-lg sm:text-xl  text-black dark:text-white">Sendational</span>
                </div>

                <div className="hidden md:flex items-center gap-4 lg:gap-6">
                    <button onClick={() => scrollTo('proof')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors">Proof</button>
                    <button onClick={() => scrollTo('flow')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors">Flow</button>
                    <button onClick={() => scrollTo('control')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors">Control</button>
                    <button onClick={() => scrollTo('pricing')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors">Pricing</button>
                </div>

                <div className="hidden md:flex items-center gap-2 lg:gap-3">
                    <ThemeModeDropdown
                        themeMode={currentTheme}
                        onChange={(mode) => { playClick(); onSetThemeMode(mode); }}
                        isDarkMode={currentTheme === 'dark'}
                        align="right"
                        buttonClassName="p-2 rounded-full text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 transition-all"
                    />
                    <button
                        onClick={() => { playClick(); window.location.href = '/signin?from=landing'; }}
                        className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors px-3 py-2"
                    >
                        Sign In
                    </button>

                    <button
                        onClick={onStart}
                        className="px-6 py-2.5 bg-black dark:bg-lime-400 text-white dark:text-zinc-950 rounded-full font-bold text-xs uppercase tracking-[0.15em] hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_20px_rgba(190, 242, 100,0.5)] transition-all shadow-lg border border-transparent dark:border-lime-400"
                    >
                        Start for Free
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden items-center gap-3">
                    <button
                        onClick={() => { playClick(); setIsMenuOpen(!isMenuOpen); }}
                        className="p-2 rounded-full text-obsidian dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all duration-300"
                        aria-label="Toggle menu"
                    >
                        <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </div>
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className={`
                absolute top-[80px] left-0 right-0 px-6 pb-6 md:hidden z-40
                transition-all duration-300 ease-in-out origin-top transform
                ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}
            `}>
                <div className="bg-white/95 dark:bg-[#2D2E45]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <button onClick={() => scrollTo('proof')} className="text-lg font-sans font-medium tracking-tight text-obsidian dark:text-white text-left px-2">Proof</button>
                        <button onClick={() => scrollTo('flow')} className="text-lg font-sans font-medium tracking-tight text-obsidian dark:text-white text-left px-2">Flow</button>
                        <button onClick={() => scrollTo('control')} className="text-lg font-sans font-medium tracking-tight text-obsidian dark:text-white text-left px-2">Control</button>
                        <button onClick={() => scrollTo('pricing')} className="text-lg font-sans font-medium tracking-tight text-obsidian dark:text-white text-left px-2">Pricing</button>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-white/10 w-full" />
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Theme</span>
                        <ThemeModeDropdown
                            themeMode={currentTheme}
                            onChange={(mode) => { playClick(); onSetThemeMode(mode); }}
                            isDarkMode={currentTheme === 'dark'}
                            align="right"
                            buttonClassName="p-2.5 rounded-full text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 transition-all"
                        />
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-white/10 w-full" />
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => { setIsMenuOpen(false); window.location.href = '/signin?from=landing'; }}
                            className="w-full py-4 rounded-2xl border border-slate-200 dark:border-white/10 text-obsidian dark:text-white font-bold text-xs uppercase tracking-widest"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setIsMenuOpen(false); onStart(); }}
                            className="w-full py-4 rounded-2xl bg-black dark:bg-lime-400 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-widest shadow-lg"
                        >
                            Start for Free
                        </button>
                    </div>
                </div>
            </div>
            </div>{/* end xl:pl-[22rem] wrapper */}
        </nav>
    );
};

const Hero = ({ onStart, onWatchVideo, viewMode, setViewMode }: { onStart: () => void, onWatchVideo: () => void, viewMode: 'creatives' | 'clients', setViewMode: (mode: 'creatives' | 'clients') => void }) => {
    const [isHoveringCTA, setIsHoveringCTA] = useState(false);

    return (
        <section id="landing-hero" className="relative flex flex-col items-center px-6 pt-32 pb-16 overflow-hidden bg-editorial dark:bg-cosmic text-black dark:text-white transition-colors duration-700">
            {/* Film grain — light mode: subtle, dark mode: prominent */}
            <div
                className="absolute inset-0 opacity-[0.06] dark:opacity-0 mix-blend-multiply pointer-events-none z-0"
                style={{
                    backgroundImage: NOISE_SVG,
                    backgroundSize: '250px 250px',
                    filter: 'contrast(2200%) brightness(102%)'
                }}
            ></div>
            <div
                className="absolute inset-0 opacity-0 dark:opacity-82 mix-blend-overlay pointer-events-none z-0"
                style={{
                    backgroundImage: NOISE_SVG,
                    backgroundSize: '250px 250px',
                    filter: 'contrast(2700%) brightness(102%)'
                }}
            ></div>

            <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 w-full mb-16">
                
                {/* The Split Toggle */}
                <div className="mb-12 relative z-20 flex flex-col items-center animate-fade-in">
                    <nav className="flex items-center bg-slate-100/80 dark:bg-black/20 p-1.5 rounded-full border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-inner" role="tablist">
                        <button 
                            onClick={() => setViewMode('creatives')}
                            className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${viewMode === 'creatives' ? 'bg-white dark:bg-[#323242] text-black dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}
                        >
                            Creative
                        </button>

                        <button 
                            onClick={() => setViewMode('clients')}
                            className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${viewMode === 'clients' ? 'bg-white dark:bg-[#323242] text-black dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}
                        >
                            Client
                        </button>
                    </nav>
                </div>

                {viewMode === 'creatives' ? (
                    <>
                        {/* Creative Hero — Decorative background glow */}
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-lime-400/8 rounded-full blur-[120px] pointer-events-none z-0" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-full pointer-events-none overflow-hidden z-0">
                            <div className={`
                            absolute top-[20%] right-[5%] md:right-[15%] w-48 h-64 bg-white dark:bg-[#2D2E45] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl rotate-12 transition-all duration-700 ease-out overflow-hidden
                            ${isHoveringCTA ? 'translate-y-[-20px] scale-110 shadow-[0_20px_50px_rgba(190, 242, 100,0.2)]' : 'translate-y-0 opacity-40'}
                        `}>
                                <div
                                    className="absolute inset-0 opacity-0 dark:opacity-40 mix-blend-multiply dark:mix-blend-overlay pointer-events-none z-0"
                                    style={{
                                        backgroundImage: NOISE_SVG,
                                        backgroundSize: '150px 150px',
                                        filter: 'contrast(1500%) brightness(102%)'
                                    }}
                                ></div>

                                <div className="p-4 h-full flex flex-col items-center justify-center relative z-10">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${isHoveringCTA ? 'bg-lime-400 text-black' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                                        {isHoveringCTA ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                    </div>
                                    <div className="w-20 h-2 bg-slate-200 dark:bg-white/10 rounded-full mb-2" />
                                    <div className="w-12 h-2 bg-slate-200 dark:bg-white/10 rounded-full" />
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 max-w-5xl mx-auto text-center mb-12">
                            <h1 className="font-sans font-medium tracking-tight text-5xl md:text-8xl lg:text-9xl font-medium  leading-[0.95] mb-10 animate-slide-up">
                                <span className="text-black dark:text-white"><span className="line-through decoration-red-500 decoration-[6px] md:decoration-[8px]">Stop Chasing.</span></span> <br />
                                <span className="text-black dark:text-white">Start <span className="italic text-lime-500 dark:text-lime-400">Delivering.</span></span>
                            </h1>

                            <div className="max-w-4xl mx-auto leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                <p className="font-sans font-medium tracking-tight italic text-xl md:text-3xl text-obsidian dark:text-white mb-6 ">
                                    The end of the "You send first" standoff.
                                </p>
                                <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-200 font-light leading-relaxed">
                                    Sendational ensures your assets are <span className="border-b-2 border-lime-400 text-black dark:text-white font-medium">securely handed over</span> only when payment clears.
                                    We generate watermarked previews automatically, so your client reviews the excellence while you retain the master files.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <button
                                    onClick={() => { onStart(); }}
                                    onMouseEnter={() => setIsHoveringCTA(true)}
                                    onMouseLeave={() => setIsHoveringCTA(false)}
                                    className="group relative h-16 px-10 bg-lime-400 text-zinc-950 rounded-full font-bold text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(190, 242, 100,0.6)] shadow-xl"
                                >
                                    <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-cta-sheen" />
                                    </span>
                                    <span className="relative z-10 flex items-center gap-3">
                                        Start for Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="relative z-10 max-w-5xl mx-auto text-center mb-12">
                            {/* Client Hero — Decorative background glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-lime-400/8 rounded-full blur-[120px] pointer-events-none -z-10" />

                            <h1 className="font-sans font-medium tracking-tight text-5xl md:text-8xl lg:text-9xl font-medium leading-[0.95] mb-10 animate-slide-up flex flex-col items-center">
                                <span className="text-black dark:text-white block">The ultimate</span>
                                <span className="text-lime-500 dark:text-lime-400 block italic">digital handshake.</span>
                            </h1>

                            <div className="max-w-4xl mx-auto leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                <p className="font-sans font-medium tracking-tight italic text-xl md:text-3xl text-obsidian dark:text-white mb-6 ">
                                    One link. Preview, approve, pay, and download.
                                </p>
                                <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-200 font-light leading-relaxed">
                                    Your creative sends you a private portal—not a random ZIP link.
                                    Browse <span className="border-b-2 border-lime-400 text-black dark:text-white font-medium">watermarked previews</span>, pay the final balance inline, and your full-resolution files unlock instantly.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <button
                                    onClick={onStart}
                                    className="group relative h-16 px-10 bg-lime-400 text-zinc-950 rounded-full font-bold text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(190,242,100,0.6)] shadow-xl"
                                >
                                    <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-cta-sheen" />
                                    </span>
                                    <span className="relative z-10 flex items-center gap-3">
                                        Start for Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Video Carousel — Positioned Higher in Hero */}
                <div className="w-full max-w-[1066px] mx-auto px-4 relative z-20 animate-slide-up mb-12" style={{ animationDelay: '0.35s' }}>
                    <div className="rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_24px_50px_rgba(0,0,0,0.6)] overflow-hidden bg-white dark:bg-[#323242]">
                        <div className="flex h-10 w-full items-center gap-2 bg-slate-100 dark:bg-[#1C1C26] px-4 border-b border-slate-200 dark:border-white/10">
                            <span className="h-3 w-3 rounded-full bg-red-400"></span>
                            <span className="h-3 w-3 rounded-full bg-amber-400"></span>
                            <span className="h-3 w-3 rounded-full bg-lime-400"></span>
                        </div>
                        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                            <video 
                                src="https://www.w3schools.com/html/mov_bbb.mp4" 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-[1200px] border-t border-slate-200 dark:border-white/5 pt-8 animate-slide-up relative z-20" style={{ animationDelay: '0.4s' }}>
                    <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-8">
                        Built to integrate seamlessly with your stack
                    </p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                        <div className="flex items-center gap-2 text-xl font-sans font-medium tracking-tight text-slate-500 dark:text-slate-400"><Server className="w-5 h-5" /> AWS S3</div>
                        <div className="flex items-center gap-2 text-xl font-sans font-medium tracking-tight text-slate-500 dark:text-slate-400"><DollarSign className="w-5 h-5" /> Stripe Connect</div>
                        <div className="flex items-center gap-2 text-xl font-sans font-medium tracking-tight text-slate-500 dark:text-slate-400"><Globe className="w-5 h-5" /> Cloudflare R2</div>
                        <div className="flex items-center gap-2 text-xl font-sans font-medium tracking-tight text-slate-500 dark:text-slate-400"><Disc className="w-5 h-5" /> Google Drive</div>
                        <div className="flex items-center gap-2 text-xl font-sans font-medium tracking-tight text-slate-500 dark:text-slate-400"><Box className="w-5 h-5" /> Dropbox</div>
                        <div className="flex items-center gap-2 text-xl font-sans font-medium tracking-tight text-slate-500 dark:text-slate-400"><Smartphone className="w-5 h-5" /> Zelle</div>
                        <div className="flex items-center gap-2 text-xl font-sans font-medium tracking-tight text-slate-500 dark:text-slate-400"><Cloud className="w-5 h-5" /> OneDrive</div>
                    </div>
                </div>
            </div>



        </section>
    );
};

const SendationalArcStyles = () => (
    <style>{`
        @keyframes sendational-arc-drift {
            0%, 100% { transform: translateY(0) rotate(var(--card-rotate)); }
            50% { transform: translateY(-14px) rotate(calc(var(--card-rotate) + 1deg)); }
        }
        @keyframes sendational-track {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }
        .sendational-arc-card {
            --card-rotate: 0deg;
            animation: sendational-arc-drift 7s ease-in-out infinite;
            animation-delay: var(--card-delay, 0ms);
        }
        .sendational-trust-track {
            animation: sendational-track 28s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
            .sendational-arc-card,
            .sendational-trust-track {
                animation: none;
            }
        }
    `}</style>
);

const SendationalArcHero = ({ onStart, onWatchVideo }: { onStart: () => void, onWatchVideo: () => void }) => {
    const arcCards = [
        { icon: Eye, title: 'Watermark the gallery', text: 'Preview-ready files in seconds', rotate: '-15deg', y: '58px', delay: '0ms' },
        { icon: Lock, title: 'Lock master files', text: 'Originals stay protected', rotate: '-8deg', y: '18px', delay: '160ms' },
        { icon: CreditCard, title: 'Collect the balance', text: 'Stripe checkout in the portal', rotate: '0deg', y: '0px', delay: '320ms' },
        { icon: Unlock, title: 'Unlock on payment', text: 'Client gets the final delivery', rotate: '8deg', y: '18px', delay: '480ms' },
        { icon: FileCheck, title: 'Close the handoff', text: 'Receipt, audit trail, done', rotate: '15deg', y: '58px', delay: '640ms' },
    ];

    return (
        <section id="landing-hero" className="relative overflow-hidden bg-[#e4edf1] text-zinc-950 transition-colors duration-700 dark:bg-[#171720] dark:text-white">
            <SendationalArcStyles />
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply dark:opacity-[0.22] dark:mix-blend-overlay"
                style={{ backgroundImage: NOISE_SVG, backgroundSize: '240px 240px' }}
            />
            <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-6 pt-16 pb-24 sm:px-8 lg:px-10">
                <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center text-center">
                    <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-zinc-900/10 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
                        <img src="/icon-192.png" alt="" className="h-7 w-7 rounded-lg object-cover" />
                        <span className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-200">Sendational theme system</span>
                        <span className="hidden h-1.5 w-1.5 rounded-full bg-lime-400 sm:block" />
                        <span className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:inline">Payment-gated delivery, rebuilt for attention</span>
                    </div>

                    <h1 className="max-w-6xl font-sans text-[clamp(3.5rem,10vw,8.8rem)] font-medium leading-[0.9] text-zinc-950 dark:text-white">
                        Sendational delivery portals
                    </h1>
                    <p className="mt-8 max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-200 sm:text-2xl">
                        Turn every handoff into a branded, cinematic client moment: preview the work, approve the scope, pay the balance, then unlock the originals instantly.
                    </p>

                    <div className="mt-9 flex w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-white/70 bg-white/[0.82] shadow-[0_24px_70px_rgba(23,23,32,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
                        <div className="flex items-center gap-3 border-b border-zinc-200/70 px-4 py-3 dark:border-white/10">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-black">
                                <Zap className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">Build a protected delivery for a brand campaign</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">watermark previews, collect $4,800, unlock source files</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { playClick(); onStart(); }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white transition-transform hover:scale-105 dark:bg-lime-400 dark:text-black"
                                aria-label="Start delivery"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid gap-px bg-zinc-200/70 text-left dark:bg-white/10 sm:grid-cols-3">
                            {['Preview gallery', 'Payment gate', 'Instant unlock'].map((label, i) => (
                                <div key={label} className="bg-white/[0.88] px-4 py-3 dark:bg-[#20202c]/[0.92]">
                                    <p className="text-[10px] font-bold uppercase text-zinc-400">0{i + 1}</p>
                                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <button
                            onClick={() => { playClick(); onStart(); }}
                            className="group flex h-14 items-center gap-3 rounded-full bg-lime-400 px-8 text-sm font-bold uppercase text-zinc-950 shadow-xl shadow-lime-400/20 transition-all hover:scale-105 hover:bg-lime-300"
                        >
                            Start a delivery <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        <button
                            onClick={() => { playClick(); onWatchVideo(); }}
                            className="flex h-14 items-center gap-3 rounded-full border border-zinc-900/10 bg-white/60 px-7 text-sm font-bold uppercase text-zinc-900 backdrop-blur-xl transition-all hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.10]"
                        >
                            <PlayCircle className="h-4 w-4" /> Watch the handoff
                        </button>
                    </div>
                </div>

                <div className="relative mt-10 hidden h-[245px] w-full lg:block" aria-hidden="true">
                    <div className="absolute left-1/2 top-8 h-[520px] w-[1320px] -translate-x-1/2 rounded-[50%] border border-zinc-950/10 dark:border-white/10" />
                    <div className="absolute left-1/2 top-0 flex w-[1180px] -translate-x-1/2 justify-between">
                        {arcCards.map((card) => (
                            <div
                                key={card.title}
                                className="sendational-arc-card w-[214px] rounded-lg border border-white/70 bg-white/[0.84] p-4 text-left shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#252535]/[0.88]"
                                style={{ '--card-rotate': card.rotate, '--card-delay': card.delay, marginTop: card.y } as React.CSSProperties}
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-lime-300 dark:bg-lime-400 dark:text-black">
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <p className="text-base font-semibold text-zinc-950 dark:text-white">{card.title}</p>
                                <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{card.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pb-6 text-center text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                    Preview the proof below
                </div>
            </div>
        </section>
    );
};

const SendationalProofBand = () => {
    const proof = [
        { icon: ShieldCheck, title: 'Trust shows up first', text: 'A branded portal says this handoff is official before a client clicks a file.' },
        { icon: CreditCard, title: 'Payment is part of the flow', text: 'No awkward reminder chain. The balance gate sits exactly where the final files are.' },
        { icon: FileCheck, title: 'Delivery feels finished', text: 'Previews, approvals, receipts, and unlocks live in one polished client path.' },
    ];
    const trust = ['Watermarked previews', 'Stripe checkout', 'BYO storage', 'Custom portals', 'Audit timeline', 'Instant unlock', 'Client approvals', 'Secure downloads'];
    const track = [...trust, ...trust];

    return (
        <section id="proof" className="overflow-hidden bg-white py-16 text-zinc-950 dark:bg-[#20202c] dark:text-white">
            <div className="mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-3">
                {proof.map((item) => (
                    <article key={item.title} className="rounded-lg border border-zinc-200 bg-[#f8f4f1] p-6 dark:border-white/10 dark:bg-white/[0.04]">
                        <item.icon className="h-7 w-7 text-lime-500 dark:text-lime-300" />
                        <h2 className="mt-5 text-2xl font-medium">{item.title}</h2>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.text}</p>
                    </article>
                ))}
            </div>
            <div className="mt-14 flex overflow-hidden border-y border-zinc-200 bg-[#e4edf1]/70 py-5 dark:border-white/10 dark:bg-black/20">
                <div className="sendational-trust-track flex min-w-max items-center gap-10 px-5">
                    {track.map((label, index) => (
                        <div key={`${label}-${index}`} className="flex items-center gap-3 text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                            <CheckCircle className="h-5 w-5 text-lime-500 dark:text-lime-300" />
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const SendationalWorkflowTheater = () => {
    const scenes = [
        {
            label: 'Launch the portal',
            title: 'One place to preview, approve, pay, and unlock',
            text: 'Build the delivery from files, a quote, and a client email. Sendational turns it into a focused portal that feels more like a product launch than a shared folder.',
            metric: '4 steps',
            items: ['Upload or connect storage', 'Generate watermarked previews', 'Add quote and client details', 'Publish a secure link'],
        },
        {
            label: 'Gate the originals',
            title: 'Let clients inspect the work while the master files stay safe',
            text: 'Clients can scan proofs, confirm scope, and pay from the same surface. Originals stay locked until the gate conditions are met.',
            metric: '0 leaks',
            items: ['Preview only', 'Payment required', 'Terms accepted', 'Unlock logged'],
        },
        {
            label: 'Finish cleanly',
            title: 'The moment payment clears, the handoff completes itself',
            text: 'Receipts, download access, and timeline events land automatically so the project closes without another follow-up email.',
            metric: 'instant',
            items: ['Payment received', 'Files unlocked', 'Client notified', 'Audit trail saved'],
        },
    ];
    const [active, setActive] = useState(0);

    useEffect(() => {
        const id = window.setInterval(() => setActive((value) => (value + 1) % scenes.length), 4200);
        return () => window.clearInterval(id);
    }, [scenes.length]);

    const scene = scenes[active];

    return (
        <section id="flow" className="bg-[#e4edf1] py-24 text-zinc-950 dark:bg-charcoal dark:text-white transition-colors duration-700">
            <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                <div>
                    <p className="text-sm font-bold uppercase text-lime-700 dark:text-lime-300">The Sendational flow</p>
                    <h2 className="mt-4 max-w-xl text-5xl font-medium leading-[0.98] sm:text-6xl">A landing-page moment inside your delivery.</h2>
                    <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
                        Move from intent to execution in one sweep: assemble the delivery, let the client review the work, collect the balance, and release the originals.
                    </p>
                    <div className="mt-8 flex flex-col gap-3">
                        {scenes.map((item, index) => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => { playClick(); setActive(index); }}
                                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                                    active === index
                                        ? 'border-zinc-950 bg-white shadow-lg dark:border-lime-300 dark:bg-white/[0.09]'
                                        : 'border-zinc-200 bg-white/50 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
                                }`}
                            >
                                <span className="text-sm font-semibold">{item.label}</span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.metric}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <div className="rounded-lg border border-white/70 bg-white/[0.78] p-3 shadow-[0_28px_80px_rgba(23,23,32,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
                        <div className="rounded-lg border border-zinc-200 bg-[#f8f4f1] dark:border-white/10 dark:bg-[#222231]">
                            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
                                </div>
                                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-300">
                                    <Lock className="h-3 w-3" /> sendational.link/project
                                </div>
                            </div>
                            <div className="grid gap-px bg-zinc-200 dark:bg-white/10 md:grid-cols-[1fr_0.8fr]">
                                <div className="min-h-[430px] bg-white p-5 dark:bg-[#1c1c26]">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase text-zinc-400">{scene.label}</p>
                                            <h3 className="mt-2 max-w-xl text-3xl font-medium leading-tight">{scene.title}</h3>
                                        </div>
                                        <BrandLogo className="h-11 w-11" accentColor="var(--color-brand)" />
                                    </div>
                                    <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{scene.text}</p>
                                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                        {scene.items.map((item, index) => (
                                            <div key={item} className="rounded-lg border border-zinc-200 bg-[#e4edf1]/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                                <p className="text-[10px] font-bold uppercase text-zinc-400">Step {index + 1}</p>
                                                <p className="mt-2 text-sm font-semibold">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <aside className="bg-[#f8f4f1] p-5 dark:bg-[#252535]">
                                    <div className="rounded-lg bg-zinc-950 p-5 text-white dark:bg-lime-400 dark:text-black">
                                        <p className="text-xs font-bold uppercase opacity-70">Balance due</p>
                                        <p className="mt-2 text-4xl font-medium">$4,800</p>
                                        <div className="mt-5 h-2 rounded-full bg-white/20">
                                            <div className="h-full w-[72%] rounded-full bg-lime-400 dark:bg-black" />
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {['Preview gallery viewed', 'Terms accepted', 'Payment pending'].map((item, index) => (
                                            <div key={item} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm dark:bg-white/[0.06]">
                                                <span>{item}</span>
                                                {index < 2 ? <Check className="h-4 w-4 text-lime-500" /> : <Clock className="h-4 w-4 text-zinc-400" />}
                                            </div>
                                        ))}
                                    </div>
                                </aside>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const SendationalPromptBuilder = ({ onStart }: { onStart: () => void }) => {
    const categories = [
        { name: 'Popular', prompts: ['Send a photo gallery', 'Deliver source files', 'Collect final balance'] },
        { name: 'Creative', prompts: ['Launch a brand kit', 'Hand off video exports', 'Package design assets'] },
        { name: 'Agency', prompts: ['Approve campaign files', 'Ship a client portal', 'Close a retainer milestone'] },
        { name: 'Secure', prompts: ['Use BYO storage', 'Protect originals', 'Log the unlock trail'] },
    ];
    const [active, setActive] = useState(0);
    const [prompt, setPrompt] = useState('Build a protected delivery for a brand campaign with $4,800 due before unlock.');

    return (
        <section id="builder" className="bg-gradient-to-b from-[#f8f4f1] via-white to-[#e4edf1] py-24 text-zinc-950 dark:from-[#20202c] dark:via-[#171720] dark:to-[#20202c] dark:text-white">
            <div className="mx-auto max-w-5xl px-6 text-center">
                <p className="text-sm font-bold uppercase text-lime-700 dark:text-lime-300">Prompt-to-portal energy</p>
                <h2 className="mt-4 text-5xl font-medium leading-none sm:text-6xl">Ask Sendational to shape the handoff.</h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
                    Start with the outcome you want, then turn it into a polished delivery with previews, payment, and unlock terms already in motion.
                </p>

                <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-2xl dark:border-white/10 dark:bg-white/[0.06]">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[128px] w-full resize-none bg-transparent p-5 text-lg outline-none placeholder:text-zinc-400 dark:text-white"
                        placeholder="Describe what you want to deliver..."
                    />
                    <div className="flex flex-col gap-4 border-t border-zinc-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category, index) => (
                                <button
                                    key={category.name}
                                    type="button"
                                    onClick={() => { playClick(); setActive(index); setPrompt(category.prompts[0]); }}
                                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase transition-all ${
                                        active === index
                                            ? 'bg-zinc-950 text-white dark:bg-lime-400 dark:text-black'
                                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/[0.08] dark:text-zinc-300'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => { playSuccess(); onStart(); }}
                            className="flex h-11 items-center justify-center gap-2 rounded-full bg-lime-400 px-5 text-sm font-bold uppercase text-black transition-all hover:scale-105 hover:bg-lime-300"
                        >
                            Generate portal <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="mt-7 flex flex-wrap justify-center gap-3">
                    {categories[active].prompts.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => { playClick(); setPrompt(item); }}
                            className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-lime-400 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

const SendationalControlBand = () => {
    const controls = [
        { icon: HardDrive, title: 'Bring your own storage links', text: 'Keep originals in the stack you already trust, then let Sendational coordinate access.' },
        { icon: Shield, title: 'Set the unlock terms', text: 'Payment, approval, and terms can all become gates before the final files open.' },
        { icon: BarChart3, title: 'Read the delivery room', text: 'See views, approvals, payments, and download activity in a timeline your team can trust.' },
    ];

    return (
        <section id="control" className="bg-[#f8f4f1] py-24 text-zinc-950 dark:bg-[#20202c] dark:text-white">
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                    <div>
                        <p className="text-sm font-bold uppercase text-lime-700 dark:text-lime-300">Your web, your control</p>
                        <h2 className="mt-4 text-5xl font-medium leading-none sm:text-6xl">Make the delivery dramatic without making it risky.</h2>
                    </div>
                    <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
                        Give clients a high-trust path while you keep control of storage, payment rules, access, and every event in the handoff timeline.
                    </p>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {controls.map((item) => (
                        <article key={item.title} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-950 text-lime-300 dark:bg-lime-400 dark:text-black">
                                <item.icon className="h-5 w-5" />
                            </div>
                            <h3 className="mt-5 text-2xl font-medium">{item.title}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.text}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};



const SendationalReviews = () => {
    const reviews = [
        {
            quote: "I need clients to see the work, approve it, and pay the balance without me sounding like a collections department.",
            author: "Commercial photographers",
            title: "Large files, final balances, tight timelines"
        },
        {
            quote: "A Dropbox link gets the job done. A branded portal makes the handoff feel like the final chapter of a premium project.",
            author: "Design studios",
            title: "Brand systems, decks, source files"
        },
        {
            quote: "The client should be able to review previews on mobile, pay on the spot, and get the originals instantly.",
            author: "Video teams",
            title: "Exports, selects, revisions, approvals"
        },
        {
            quote: "When the delivery is clean, the project feels more expensive. That matters when referrals are built on the last impression.",
            author: "Agencies and consultants",
            title: "Reports, strategy assets, recurring clients"
        }
    ];

    return (
        <section className="overflow-hidden py-20 sm:py-32 bg-editorial dark:bg-cosmic transition-colors duration-700 relative">
            <div className="max-w-[1200px] mx-auto px-6 mb-16">
                <h2 className="font-sans font-medium tracking-tight text-4xl md:text-5xl lg:text-[64px] lg:leading-[72px] text-center md:text-left text-black dark:text-white">
                    The final handoff is where <br className="hidden md:block" /> your brand either lands or leaks.
                </h2>
                <p className="mt-5 max-w-2xl text-center text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-left">
                    Sendational turns that moment into a controlled, polished exchange: preview first, payment next, originals released on cue.
                </p>
            </div>
            
            <div className="relative flex overflow-x-hidden group pb-8">
                <div className="animate-marquee whitespace-nowrap flex gap-6 px-6 items-stretch">
                    {[...reviews, ...reviews, ...reviews].map((rev, i) => (
                        <div key={i} className="relative h-[440px] w-[300px] sm:w-[340px] shrink-0 rounded-2xl p-8 overflow-hidden bg-white dark:bg-[#323242] border border-slate-200 dark:border-white/10 shadow-xl flex flex-col justify-end whitespace-normal transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_24px_45px_-20px_rgba(15,23,42,0.4)] dark:hover:shadow-[0_24px_45px_-20px_rgba(0,0,0,0.7)]">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/80 dark:from-black/20 dark:to-black/90 z-0" />
                            <div className="absolute inset-0 bg-slate-800 -z-10" />
                            
                            <div className="relative z-10 text-white">
                                <svg fill="none" height="24" viewBox="0 0 26 20" width="24" className="mb-6 opacity-80 text-lime-400">
                                    <path d="M5.876 19.072C7.668 19.072 8.97467 18.736 9.796 18.064C10.6173 17.3546 11.028 16.1413 11.028 14.424C11.028 12.632 10.6733 11.456 9.964 10.896C9.292 10.336 8.116 10.056 6.436 10.056C6.13733 10.056 5.85733 10.0746 5.596 10.112C5.33467 10.1493 5.092 10.2053 4.868 10.28C5.05467 8.63732 5.57733 7.40531 6.436 6.58398C7.332 5.72531 8.65733 5.05331 10.412 4.56798L9.404 0.927979C6.45467 1.52531 4.23333 2.81332 2.74 4.79198C1.24667 6.77065 0.5 9.34665 0.5 12.52C0.5 14.9466 0.910667 16.6453 1.732 17.616C2.55333 18.5866 3.93467 19.072 5.876 19.072ZM20.388 19.072C22.18 19.072 23.4867 18.736 24.308 18.064C25.1293 17.3546 25.54 16.1413 25.54 14.424C25.54 12.632 25.1853 11.456 24.476 10.896C23.804 10.336 22.628 10.056 20.948 10.056C20.6493 10.056 20.3693 10.0746 20.108 10.112C19.8467 10.1493 19.604 10.2053 19.38 10.28C19.5667 8.63732 20.0893 7.40531 20.948 6.58398C21.844 5.72531 23.1693 5.05331 24.924 4.56798L23.916 0.927979C20.9667 1.52531 18.7453 2.81332 17.252 4.79198C15.7587 6.77065 15.012 9.34665 15.012 12.52C15.012 14.9466 15.4227 16.6453 16.244 17.616C17.0653 18.5866 18.4467 19.072 20.388 19.072Z" fill="currentColor"></path>
                                </svg>
                                <p className="font-sans text-lg md:text-xl leading-snug mb-8">&ldquo;{rev.quote}&rdquo;</p>
                                <h4 className="text-lime-400 font-bold text-sm tracking-wider uppercase">{rev.author}</h4>
                                <h5 className="font-sans italic text-sm text-white/60 mt-1">{rev.title}</h5>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ComparisonSection = () => {
    // ... [Same implementation as before] ...
    const [hoveredCard, setHoveredCard] = useState<null | 'old' | 'new'>(null);
    const [autoFocusIndex, setAutoFocusIndex] = useState(0);

    const oldWayItems = [
        { icon: Mail, title: "Chaotic Email Threads", desc: "\"Did you get the file?\" \"Can you resend?\" \"Check spam.\"" },
        { icon: LinkIcon, title: "Generic Links", desc: "Temporary links dying after 7 days. Creating new links endlessly." },
        { icon: DollarSign, title: "Chasing Invoices", desc: "Sending the work, then praying they pay the remaining 50%." },
        { icon: AlertCircle, title: "The \"Ghosting\" Risk", desc: "Sending the files, then silence. They have the work, you have nothing." },
        { icon: Coins, title: "Platform Taxes", desc: "Losing 10-20% of your revenue to marketplace fees." }
    ];

    const newWayItems = [
        { icon: Globe, title: "Professional Portal", desc: "A persistent, branded home for your delivery. No more loose links." },
        { icon: Eye, title: "Smart Previews", desc: "We watermark and compress automatically. They look, but can't touch." },
        { icon: Lock, title: "Pay to Unlock", desc: "Payment clears, files unlock. Instant, automated, secure." },
        { icon: ShieldCheck, title: "Zero-Risk Leverage", desc: "Atomic transactions. Money in, files out. No awkward follow-ups." },
        { icon: Banknote, title: "Margin-Focused Pricing", desc: "3.75% Stripe card fees on Pro. Manual is a 0% Pro payment option. No marketplace tax." }
    ];

    useEffect(() => {
        if (hoveredCard === 'old') return;
        const timer = window.setInterval(() => {
            setAutoFocusIndex(prev => (prev + 1) % oldWayItems.length);
        }, 1700);
        return () => window.clearInterval(timer);
    }, [hoveredCard, oldWayItems.length]);

    return (
        <section id="comparison" className="py-32 px-6 bg-editorial dark:bg-cosmic transition-colors duration-700 relative overflow-hidden">
            <div
                className={`absolute top-1/2 left-0 w-[500px] h-[500px] bg-red-600 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700 ease-in-out
                ${hoveredCard === 'old' ? 'opacity-25 scale-110' : 'opacity-8 scale-100'}
                `}
            />
            <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-lime-400/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="max-w-[1200px] mx-auto relative z-10">
                <SectionHeading
                    badge="The Upgrade"
                    title={
                        <span>
                            Stop the <span className="line-through decoration-red-500 decoration-4 text-slate-400 dark:text-slate-500">"Send-then-Chase"</span> cycle.
                        </span>
                    }
                    subtitle="The Sendational way: preview first, payment next, originals released on cue."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                    {/* The Old Way */}
                    <div
                        onMouseEnter={() => setHoveredCard('old')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={`p-10 rounded-[2.5rem] bg-white/80 dark:bg-[#323242]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 relative group transition-all duration-500 shadow-2xl hover:bg-white/80 dark:hover:bg-[#323242]/80 ${hoveredCard !== 'old' ? 'animate-old-way-breathe' : ''}`}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <X className="w-32 h-32 text-red-500 rotate-12" />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 font-bold shadow-sm">
                                <X className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-sans font-medium tracking-tight text-slate-500 dark:text-slate-300 ">The Old Way</h3>
                        </div>

                        <div className="space-y-8 relative z-10">
                            {oldWayItems.map((item, i) => {
                                const isHighlighted = hoveredCard === 'old' || autoFocusIndex === i;
                                return (
                                    <div key={i} className={`flex gap-5 transition-all duration-500 ${isHighlighted ? 'opacity-100 translate-x-1' : 'opacity-60 translate-x-0'}`}>
                                        <item.icon className={`w-6 h-6 shrink-0 mt-1 transition-all duration-500 ${isHighlighted ? 'text-slate-600 dark:text-slate-100 scale-110' : 'text-slate-400 dark:text-slate-400 scale-100'}`} />
                                        <div>
                                            <h4 className="font-sans font-medium text-slate-700 dark:text-slate-200 text-lg">{item.title}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                )
                            })}
                            {hoveredCard !== 'old' && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 pt-2 animate-auto-cue-pulse">
                                    Auto-highlighting common friction points
                                </p>
                            )}
                        </div>
                    </div>

                    {/* The Sendational Way */}
                    <div
                        onMouseEnter={() => setHoveredCard('new')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="relative p-10 rounded-[2.5rem] bg-lime-400 text-black shadow-2xl shadow-black/25 transform md:-translate-y-4 transition-transform hover:-translate-y-6 duration-500 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Check className="w-32 h-32 text-black -rotate-12" />
                        </div>

                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-black text-lime-400 flex items-center justify-center font-bold shadow-xl">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-sans font-medium tracking-tight font-medium text-black ">The New Standard</h3>
                        </div>

                        <div className="space-y-8 relative z-10">
                            {newWayItems.map((item, i) => (
                                <div key={i} className={`flex gap-5 transition-all duration-500 ${hoveredCard === 'new' ? 'translate-x-1' : 'translate-x-0'}`} style={{ transitionDelay: `${i * 35}ms` }}>
                                    <div className="p-1 rounded-full bg-black/5 h-fit">
                                        <item.icon className={`w-5 h-5 text-black shrink-0 transition-transform duration-500 ${hoveredCard === 'new' ? 'scale-110' : 'scale-100'}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-sans font-medium text-black text-lg">{item.title}</h4>
                                        <p className="text-sm text-black/70 mt-1 font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="relative z-10 mt-8 pt-6 border-t border-black/10">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/60">
                                * Starter plan includes a 2.5% transaction fee.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const SendationalFeatureGrid = () => (
    <section className="relative overflow-hidden py-28 px-6 bg-zinc-50/90 dark:bg-white/[0.03] text-black dark:text-white border-t border-slate-200 dark:border-white/10 transition-colors duration-700">
        <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-[6%] h-56 w-56 rounded-full bg-lime-400/12 blur-[110px]" />
            <div className="absolute bottom-[-25%] right-[8%] h-72 w-72 rounded-full bg-lime-400/12 blur-[140px]" />
        </div>
        <div className="max-w-[1200px] mx-auto relative z-10">
            <SectionHeading
                badge="Sendational Suite"
                title={<span>Payments, branding, and signals in one clean send.</span>}
                subtitle="Everything the client touches is connected to the moment you get paid."
                className="motion-safe:animate-fade-in"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white/80 dark:bg-[#323242]/60 dark:border-white/10 backdrop-blur-xl p-6 transition-transform hover:-translate-y-1 hover:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.35)] dark:hover:shadow-[0_20px_45px_-25px_rgba(0,0,0,0.6)]">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/15 text-lime-600 dark:text-lime-400">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Payments</p>
                            <h3 className="font-sans font-medium tracking-tight text-xl text-zinc-900 dark:text-white">Unlock on payment</h3>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                        Charge by card or verify manual transfers, then release final files instantly.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lime-400" /> Pay-to-unlock checkout</li>
                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lime-400" /> Manual payment verification</li>
                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lime-400" /> Instant delivery release</li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/80 dark:bg-[#323242]/60 dark:border-white/10 backdrop-blur-xl p-6 transition-transform hover:-translate-y-1 hover:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.35)] dark:hover:shadow-[0_20px_45px_-25px_rgba(0,0,0,0.6)]">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/15 text-lime-600 dark:text-lime-400">
                            <Palette className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Branding</p>
                            <h3 className="font-sans font-medium tracking-tight text-xl text-zinc-900 dark:text-white">Your studio, everywhere</h3>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                        Deliver under your domain with custom colors, logos, and client-ready portals.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lime-600" /> Custom domains + emails</li>
                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lime-600" /> Branded client portals</li>
                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-lime-600" /> Portfolio-safe previews</li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/80 dark:bg-[#323242]/60 dark:border-white/10 backdrop-blur-xl p-6 transition-transform hover:-translate-y-1 hover:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.35)] dark:hover:shadow-[0_20px_45px_-25px_rgba(0,0,0,0.6)]">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-500 dark:text-amber-400">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Analytics</p>
                            <h3 className="font-sans font-medium tracking-tight text-xl text-zinc-900 dark:text-white">Signals, not guesses</h3>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                        Track views, approvals, and payout milestones to move at the right moment.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-amber-500" /> View + approval timeline</li>
                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-amber-500" /> Audit-ready activity logs</li>
                        <li className="flex items-center gap-2"><Check className="h-3 w-3 text-amber-500" /> Client portal insights</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
);

const BentoGrid = () => {
    // ... [Same implementation as before] ...
    const [isCustom, setIsCustom] = useState(false);
    const [accentColor, setAccentColor] = useState('#bef264');

    const brandConfigs = [
        { name: 'Default', color: '#bef264', domain: 'portal.Sendational.com' },
        { name: 'Onyx', color: '#334155', domain: 'delivery.agency.com' },
        { name: 'Cobalt', color: '#3b82f6', domain: 'files.studio.io' }
    ];

    const currentBrand = brandConfigs.find(b => b.color === accentColor) || brandConfigs[0];

    return (
        <section id="how-it-works" className="py-32 px-6 bg-editorial dark:bg-cosmic text-black dark:text-white border-t border-slate-200 dark:border-white/10 transition-colors duration-700">
            <div className="max-w-[1200px] mx-auto">
                <SectionHeading
                    badge="The Mechanism"
                    title={<span>A structured workflow <br /><span className="italic text-slate-400 dark:text-slate-500">for peace of mind.</span></span>}
                    subtitle="Replace scattered tools with a delivery pipeline that keeps control intact."
                />

                <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
                    {/* 1. Smart Previews */}
                    <BentoCard className="md:col-span-3 lg:col-span-4 min-h-[400px] shadow-sm dark:shadow-md" title="Smart Preview" subtitle="Lossy samples for assessment" icon={Eye}>
                        <div className="p-8 pt-0 h-full flex flex-col relative">
                            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-8">
                                Creators upload final files. We automatically generate secure, watermarked previews.
                                Clients review the work without accessing the master files.
                            </p>
                            <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group-hover:border-lime-400/30 transition-colors">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?w=500&q=50')] bg-cover bg-center opacity-40 blur-[2px]" />
                                <div className="absolute inset-0 bg-black/10 dark:bg-[#323242]/40" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-5xl font-semibold text-black/35 dark:text-white/30 -rotate-12 select-none pointer-events-none tracking-widest">PREVIEW</div>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-[#2D2E45]/85 backdrop-blur-md p-3 rounded-lg border border-slate-200/80 dark:border-white/20 shadow-lg">
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-100">
                                        <Lock className="w-3 h-3 text-amber-500" />
                                        <span>Download Locked</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* 2. Dispute Evidence */}
                    <BentoCard className="md:col-span-3 lg:col-span-4 min-h-[400px] shadow-sm dark:shadow-md" title="Activity Logs" subtitle="Dispute Shield" icon={ShieldCheck}>
                        <div className="p-8 pt-0 h-full flex flex-col relative">
                            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-6">
                                We designed this to stop arguments before they start. Since files only unlock after payment,
                                you never have to chase a client. But just in case, we keep a tidy history log for you.
                            </p>
                            <div className="flex-1 bg-white dark:bg-charcoal rounded-xl border border-zinc-200/50 dark:border-white/[0.06] p-4 font-mono text-[10px] text-zinc-500 dark:text-zinc-300 overflow-hidden relative shadow-sm">
                                <div className="space-y-3 opacity-80">
                                    <div className="flex gap-2">
                                        <span className="text-[#4d7c0f] dark:text-lime-400">GET</span>
                                        <span className="text-slate-500 dark:text-slate-600">/v/preview</span>
                                        <span className="ml-auto text-slate-500 dark:text-slate-700">200 OK</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[#4d7c0f] dark:text-lime-400">LOG</span>
                                        <span className="text-slate-400 dark:text-slate-300">Client Viewing</span>
                                        <span className="ml-auto text-slate-600 dark:text-slate-200">Active</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[#4d7c0f] dark:text-lime-400">LCK</span>
                                        <span className="text-slate-400 dark:text-slate-300">Asset Download</span>
                                        <span className="ml-auto text-slate-600 dark:text-slate-200">Blocked</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4">
                                    <div className="px-3 py-1 bg-[#a3e635]/15 border border-[#a3e635]/35 rounded text-[#4d7c0f] dark:text-lime-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <FileCheck className="w-3 h-3" /> Tracking Active
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* 3. Direct Payments */}
                    <BentoCard className="md:col-span-6 lg:col-span-4 min-h-[400px] shadow-sm dark:shadow-md" title="Direct Payouts" subtitle="Seamless Transfers" icon={DollarSign}>
                        <div className="p-8 pt-0 h-full flex flex-col justify-between relative">
                            <div className="space-y-4">
                                <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                                    A seamless financial bridge. Connect your Stripe account once, and payments flow directly to you.
                                    We facilitate the instant unlocking of assets without holding or delaying your funds.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs font-bold text-black dark:text-white">
                                        <Check className="w-3 h-3 text-lime-400" /> Instant Availability
                                    </li>
                                    <li className="flex items-center gap-2 text-xs font-bold text-black dark:text-white">
                                        <Check className="w-3 h-3 text-lime-400" /> Automated Receipts
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-8 bg-white rounded-xl p-4 flex items-center justify-between shadow-lg border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#635BFF] rounded-lg flex items-center justify-center text-white">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Balance</div>
                                        <div className="text-black font-bold text-lg">$2,450.00</div>
                                    </div>
                                </div>
                                <div className="px-2 py-1 bg-[#a3e635]/15 text-[#4d7c0f] text-[9px] font-bold uppercase rounded">Paid</div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* 4. BRAND ORCHESTRATOR — uses own panel base to preserve internal layout */}
                    <NetRevenueStylePanel className={`md:col-span-6 lg:col-span-8 !p-0 min-h-[540px] group transition-all duration-500`}>
                        <div className="flex flex-col md:flex-row h-full w-full">
                            {/* LEFT: Control Panel */}
                            <div className="w-full md:w-[340px] p-8 border-b md:border-b-0 md:border-r border-zinc-200/50 dark:border-white/[0.06] flex flex-col bg-zinc-50/90 dark:bg-white/[0.03]">
                                <div>
                                    <div className="mb-8">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-sans font-medium tracking-tight text-2xl text-black dark:text-white ">Your Brand</h3>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Custom Portal</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/50 dark:border-white/[0.06] flex items-center justify-center text-black dark:text-lime-400">
                                                <Palette className="w-5 h-5" />
                                            </div>
                                        </div>

                                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                            Make it yours. Swap the logo, pick your colors, and use your domain.
                                            Clients see your brand, not ours.
                                        </p>
                                    </div>

                                    {/* Brand Selection */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">Choose Identity</p>
                                        {brandConfigs.map((brand, i) => (
                                            <button
                                                key={brand.name}
                                                onClick={() => {
                                                    playClick();
                                                    setIsCustom(i > 0);
                                                    setAccentColor(brand.color);
                                                }}
                                                className={`
                                                    w-full p-4 rounded-xl border flex items-center gap-4 transition-all group
                                                    ${accentColor === brand.color
                                                        ? 'bg-white dark:bg-white/[0.06] border-zinc-200/50 dark:border-white/[0.12] shadow-sm'
                                                        : 'bg-transparent border-zinc-200/50 dark:border-white/[0.06] hover:bg-white/70 dark:hover:bg-white/[0.04]'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-4 h-4 rounded-full border flex items-center justify-center
                                                    ${accentColor === brand.color ? 'border-zinc-900 dark:border-white' : 'border-zinc-400 dark:border-zinc-500'}
                                                `}>
                                                    {accentColor === brand.color && <div className="w-2 h-2 rounded-full bg-lime-400" />}
                                                </div>

                                                <div className="flex-1 text-left">
                                                    <div className={`text-sm font-bold ${accentColor === brand.color ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                        {brand.name}
                                                    </div>
                                                    <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{brand.domain}</div>
                                                </div>

                                                {accentColor === brand.color && (
                                                    <Check className="w-4 h-4 text-lime-400" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-zinc-200/50 dark:border-white/[0.06]">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>Business Plan Feature</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Live Preview — flat panel, no accent wash or dot noise */}
                            <div className="flex-1 relative bg-zinc-100 dark:bg-black/25 p-8 flex items-center justify-center overflow-hidden border-t md:border-t-0 border-zinc-200/50 dark:border-white/[0.06]">
                                {/* Domain Badge */}
                                <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] flex items-center gap-2 z-20 shadow-sm">
                                    <Globe className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 transition-all duration-500">
                                        {currentBrand.domain}
                                    </span>
                                </div>

                                {/* Portal Preview Card */}
                                <div className="relative w-full max-w-[340px] transition-all duration-700 z-10">
                                    <div className="bg-white dark:bg-charcoal rounded-2xl border border-zinc-200/50 dark:border-white/[0.06] overflow-hidden shadow-sm dark:shadow-md">
                                        {/* Header */}
                                        <div className="p-6 border-b border-zinc-200/50 dark:border-white/[0.06] flex items-center justify-between">
                                            <div className="relative w-10 h-10">
                                                <div className={`absolute inset-0 transition-all duration-500 ${isCustom ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
                                                    <Logo className="w-10 h-10 text-black dark:text-white hover:rotate-12 transition-transform duration-500" />
                                                </div>
                                                <div
                                                    className={`absolute inset-0 transition-all duration-500 ${isCustom ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                                                    style={{ color: accentColor }}
                                                >
                                                    <Crown className="w-10 h-10" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                                <Lock className="w-3 h-3" />
                                                <span className="font-mono">Secure</span>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div className="p-6 space-y-4">
                                            <div className="aspect-video bg-zinc-100 dark:bg-white/[0.04] rounded-lg border border-zinc-200/50 dark:border-white/[0.06]" />
                                            <div className="space-y-2">
                                                <div className="h-2 bg-zinc-100 dark:bg-white/[0.06] rounded-full w-3/4" />
                                                <div className="h-2 bg-zinc-100 dark:bg-white/[0.06] rounded-full w-full" />
                                                <div className="h-2 bg-zinc-100 dark:bg-white/[0.06] rounded-full w-5/6" />
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="p-6 pt-0">
                                            <div
                                                className="w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-center transition-all duration-700 shadow-lg"
                                                style={{
                                                    backgroundColor: accentColor,
                                                    color: accentColor === '#bef264' ? '#000' : '#fff' // Black text for lime (light mode), white for others
                                                }}
                                            >
                                                Unlock Files
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </NetRevenueStylePanel>

                    {/* 5 & 6. VERTICAL STACK: STORAGE FREEDOM & SMART CONTRACTS */}
                    <div className="md:col-span-6 lg:col-span-4 flex flex-col gap-6 min-h-[540px]">

                        {/* 5. STORAGE FREEDOM (Compressed) */}
                        <BentoCard className="min-h-[258px] shadow-sm dark:shadow-md" title="Storage Freedom" subtitle="Bring Your Own Storage Links" icon={HardDrive}>
                            <div className="p-6 pt-0 flex flex-col justify-between gap-4">
                                <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed mb-4">
                                    All plans support bring your own storage links. Paste your own S3/Drive/Dropbox share links so you keep full custody of the originals. (Connectors coming soon.)
                                </p>
                                <div className="space-y-4">
                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-[10px] text-slate-500 mb-2">
                                            <span>Native Cloud</span>
                                            <span>34%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-lime-400 h-full shadow-[0_0_10px_#bef264]"
                                                style={{ width: '34%' }}
                                            />
                                        </div>
                                    </div>
                                    {/* Options - Smaller */}
                                    <div className="flex gap-3">
                                        <div className="flex-1 p-2 rounded bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-2">
                                            <Server className="w-3 h-3 text-lime-400" />
                                            <span className="text-[10px] font-bold text-black dark:text-white">Native</span>
                                        </div>
                                        <div className="flex-1 p-2 rounded bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-2">
                                            <Box className="w-3 h-3 text-slate-500" />
                                            <span className="text-[10px] font-bold text-slate-500">S3</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>

                        {/* 6. SMART CONTRACTS (New) */}
                        <BentoCard className="min-h-[258px] shadow-sm dark:shadow-md" title="Formal Sign-off" subtitle="Integrated Signatures" icon={PenTool}>
                            <div className="p-6 pt-0 h-full flex flex-col">
                                <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed mb-4">
                                    Require a digital signature approval before assets are unlocked.
                                </p>
                                <div className="flex-1 bg-zinc-50 dark:bg-white/[0.04] rounded-xl border border-zinc-200/50 dark:border-white/[0.06] p-3 relative flex flex-col justify-center items-center">
                                    <div className="w-full max-w-[140px] space-y-2">
                                        <div className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full" />
                                        <div className="h-1 w-2/3 bg-slate-200 dark:bg-white/10 rounded-full" />
                                        <div className="h-8 border-b border-slate-200 dark:border-white/20 mt-2 flex items-end">
                                            <span className="font-sans font-medium tracking-tight italic text-lg text-black dark:text-white opacity-80">Alex Smith</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[8px] text-slate-400 uppercase">Signed</span>
                                            <div className="w-3 h-3 bg-lime-400 rounded-full flex items-center justify-center">
                                                <Check className="w-2 h-2 text-black" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>
                    </div>
                </div>
            </div>

            {/* Custom Animation CSS */}
            <style>{`
                html {
                    scroll-behavior: smooth;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                .animate-float {
                    animation: float 8s ease-in-out infinite;
                }
                
                .animate-float-delayed {
                    animation: float-delayed 6s ease-in-out infinite 2s;
                }
                
                .perspective-1000 {
                    perspective: 1000px;
                }
                
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                /* Border Flow Animation */
                @keyframes border-flow {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                .group:hover .animate-border-flow {
                    animation: border-flow 2s linear infinite;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
                
                .animate-slide-up {
                    animation: slide-up 0.8s ease-out forwards;
                    opacity: 0;
                }

                @keyframes old-way-breathe {
                    0%, 100% { opacity: 0.92; }
                    50% { opacity: 1; }
                }

                .animate-old-way-breathe {
                    animation: old-way-breathe 3.2s ease-in-out infinite;
                }

                @keyframes auto-cue-pulse {
                    0%, 100% { opacity: 0.45; }
                    50% { opacity: 0.9; }
                }

                .animate-auto-cue-pulse {
                    animation: auto-cue-pulse 2s ease-in-out infinite;
                }

                @keyframes cta-sheen {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(420%); }
                }

                .animate-cta-sheen {
                    animation: cta-sheen 950ms cubic-bezier(0.25, 0.8, 0.25, 1);
                }
            `}</style>
        </section>
    );
};

const Pricing = ({ onStart }: { onStart: () => void }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <section id="pricing" className="py-32 px-6 bg-zinc-50/90 dark:bg-white/[0.03] text-black dark:text-white border-t border-slate-200 dark:border-white/10 transition-colors duration-700">
            <div className="max-w-[1200px] mx-auto">
                <div className="text-center mb-12">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-black dark:bg-white/10 font-mono text-xs text-lime-400 uppercase tracking-widest mb-6 border border-white/10 shadow-lg">
                        Plans
                    </span>
                    <h2 className="font-sans font-medium tracking-tight text-5xl md:text-6xl mb-6">
                        Start free. <span className="italic text-lime-500 dark:text-lime-400">Scale as you succeed.</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-300 text-lg max-w-2xl mx-auto">
                        Premium delivery workflows. Margin-focused infrastructure.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-black dark:text-white' : 'text-slate-500'}`}>Monthly</span>
                        <button
                            onClick={() => { playClick(); setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly'); }}
                            className="w-14 h-8 bg-slate-200 dark:bg-white/10 rounded-full relative transition-colors p-1"
                        >
                            <div className={`w-6 h-6 rounded-full shadow-md transition-transform duration-300 bg-white dark:bg-zinc-950 ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`} />
                        </button>
                        <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-black dark:text-white' : 'text-slate-500'}`}>Yearly <span className="text-lime-400 text-[10px] ml-1 uppercase tracking-wider">Save 20%</span></span>
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto`}>

                    {/* Free - Bring Your Own Storage */}
                    <div className="relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#323242]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-zinc-300/80 dark:hover:border-white/15 flex flex-col h-full animate-fade-in transition-all duration-300 shadow-sm dark:shadow-md">
                        <div className="p-8 flex flex-col flex-1 min-h-0">
                        <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-6">Free Forever</div>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-4xl font-sans font-medium tracking-tight font-bold">$0</span>
                            <span className="text-sm text-slate-500">/mo</span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-300 mb-8 min-h-[40px]">Perfect for freelancers starting out. Bring your own storage or use native storage.</div>

                        <button onClick={onStart} className="w-full py-4 rounded-2xl border border-slate-200 dark:border-white/20 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 font-bold text-xs uppercase tracking-widest transition-all mb-8">
                            Start Free
                        </button>

                        <div className="space-y-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/5 pb-2">Includes</p>
                            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                <li className="flex gap-3 items-center font-bold text-black dark:text-white"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Bring Your Own Storage Links (BYOS)</li>
                                <li className="flex gap-3 items-center font-bold text-black dark:text-white"><Check className="w-4 h-4 text-lime-400 shrink-0" /> 5GB Native Storage Included</li>
                                <li className="flex gap-3 items-center font-bold text-black dark:text-white"><Check className="w-4 h-4 text-lime-400 shrink-0" /> 4.5% Transaction Fee Total*</li>
                                <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> Unlimited Projects</li>
                                <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> Watermarked Previews</li>
                                <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> Stripe Payments</li>
                                <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> Audit Logs</li>
                                <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> Email Notifications</li>
                            </ul>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-200/50 dark:border-white/[0.06] pb-2 pt-4">Limits</p>
                            <ul className="space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
                                <li className="flex gap-3 items-center"><Minus className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" /> "Powered by Sendational" Branding</li>
                                <li className="flex gap-3 items-center"><Minus className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" /> No Manual Payments (Stripe only)</li>
                                <li className="flex gap-3 items-center"><Minus className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" /> No Custom Domain</li>
                            </ul>
                        </div>
                        </div>
                    </div>

                    {/* Pro - Professional Tier */}
                    <div className="relative p-1 rounded-[2rem] bg-[#45455e] border border-[#565675] shadow-2xl h-full animate-fade-in group overflow-hidden transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-[#45455e] rounded-[1.9rem]"></div>
                        <div className="relative z-10 p-8 h-full flex flex-col text-white rounded-[1.9rem]">
                            <div className="absolute top-0 right-0 p-6">
                                <div className="px-3 py-1 bg-lime-400 border border-lime-400 text-black text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2 shadow-sm backdrop-blur-md">
                                    <Gem className="w-3 h-3" /> Most Popular
                                </div>
                            </div>
                            <div className="mb-6">
                                <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/20 font-mono text-xs text-white uppercase tracking-widest shadow-lg backdrop-blur-md">
                                    Pro
                                </span>
                            </div>
                            <div className="font-sans font-medium tracking-tight font-bold text-white filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] mb-2 flex items-baseline">
                                <span className="text-5xl">
                                    {billingCycle === 'monthly' ? '$29' : '$290'}
                                </span>
                                <span className="text-2xl ml-1 font-normal text-indigo-200/80">
                                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                </span>
                            </div>
                            <div className="text-sm text-indigo-200/80 mb-8 min-h-[40px]">For creators and agencies scaling high-ticket deliveries. Includes ACH Direct Debit at 1.5%.</div>
                            <button onClick={onStart} className="w-full py-4 rounded-2xl bg-lime-400 text-zinc-950 hover:bg-white hover:text-black font-bold text-xs uppercase tracking-widest transition-all mb-8 shadow-lg group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                Go Pro
                            </button>
                            <div className="space-y-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 border-b border-white/10 pb-2">Everything in Free, plus</p>
                                <ul className="space-y-4 text-sm text-indigo-50">
                                    <li className="flex gap-3 items-center font-bold"><Check className="w-4 h-4 text-lime-400 shrink-0" /> 250GB Native Storage Included</li>
                                    <li className="flex gap-3 items-center font-bold"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Stripe Card: 3.75% | ACH: 1.5%*</li>
                                    <li className="flex gap-3 items-center font-bold"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Manual Payments: 0%</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> White-Label / Custom Domain</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Remove "Powered By" Badge</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Custom Branding (Logo/Colors)</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Analytics & Reporting</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Unlimited Bring Your Own Storage Links</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Client Portal Analytics</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Approval Workflows</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Dispute Evidence Packs & Risk Monitoring</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> ACH Settlement Protection</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-lime-400 shrink-0" /> Priority Support</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Storage Expansion Add-ons */}
                <div className="mt-16 pt-16 border-t border-slate-200 dark:border-white/10">
                    <h3 className="text-center text-2xl font-sans font-medium tracking-tight text-black dark:text-white mb-12">Storage Expansion Add-ons</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        {/* +100GB */}
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:border-zinc-300/80 dark:hover:border-white/20 transition-all">
                            <div className="text-xl font-sans font-bold text-black dark:text-white mb-2">+100GB</div>
                            <div className="text-2xl font-sans font-medium text-black dark:text-white mb-4">
                                {billingCycle === 'monthly' ? '$2.99' : '$29'}
                                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">One-time add-on or recurring</p>
                        </div>

                        {/* +500GB */}
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:border-zinc-300/80 dark:hover:border-white/20 transition-all ring-2 ring-lime-400">
                            <div className="inline-block mb-3 px-2 py-1 rounded bg-lime-400 text-black text-[10px] font-bold uppercase">Best Value</div>
                            <div className="text-xl font-sans font-bold text-black dark:text-white mb-2">+500GB</div>
                            <div className="text-2xl font-sans font-medium text-black dark:text-white mb-4">
                                {billingCycle === 'monthly' ? '$9.99' : '$100'}
                                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">For video creators & agencies</p>
                        </div>

                        {/* +1TB */}
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:border-zinc-300/80 dark:hover:border-white/20 transition-all">
                            <div className="text-xl font-sans font-bold text-black dark:text-white mb-2">+1TB</div>
                            <div className="text-2xl font-sans font-medium text-black dark:text-white mb-4">
                                {billingCycle === 'monthly' ? '$17.99' : '$180'}
                                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">Enterprise-scale storage</p>
                        </div>
                    </div>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 dark:text-white/40 mt-12 text-center max-w-2xl mx-auto">
                    * Stripe Card (Pro): 3.75% total. ACH Direct Debit: 1.5% total. ACH settles in 2–5 business days. Manual payments (0%) include Zelle, Wire, Bank Transfer, PayPal. All payments processed through Sendational for security, audit, and dispute protection.
                </p>
            </div>
        </section>
    );
};

// ... (FAQItem, FAQSection, Footer, LandingPage export)
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-zinc-200/50 dark:border-white/[0.06] last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group"
            >
                <span className="text-lg font-sans font-medium tracking-tight text-zinc-900 dark:text-white group-hover:font-bold transition-all pr-8 ">
                    {question}
                </span>
                <div className={`shrink-0 w-8 h-8 rounded-full border border-zinc-200/50 dark:border-white/[0.06] flex items-center justify-center transition-all ${isOpen ? 'bg-obsidian text-white dark:bg-white dark:text-black rotate-45' : 'bg-transparent text-zinc-400'}`}>
                    <Plus className="w-4 h-4" />
                </div>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <p className="text-zinc-500 dark:text-zinc-300 leading-relaxed max-w-2xl">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
};

const FAQSection = () => (
    <section id="faq" className="py-32 px-6 bg-zinc-50/90 dark:bg-white/[0.03] transition-colors duration-700">
        <div className="max-w-[800px] mx-auto">
            <div className="text-center mb-16">
                <span className="inline-block py-1.5 px-4 rounded-full bg-black dark:bg-white/10 font-mono text-xs text-lime-400 uppercase tracking-widest mb-6 border border-white/10 shadow-lg">
                    Support
                </span>
                <h2 className="font-sans font-medium tracking-tight text-4xl md:text-5xl text-obsidian dark:text-white mb-6 ">Common questions</h2>
            </div>

            <NetRevenueStylePanel roundedClass="rounded-[2rem]">
                <div className="p-8 md:p-12">
                <FAQItem
                    question="What is Sendational?"
                    answer="Sendational is a secure asset gateway designed for the creative economy. Think of it as a 'vending machine' for your business. It automates the final exchange of work for payment. You upload deliverables to a protected portal where clients can review watermarked previews. The high-resolution files are secured and instantly released only after payment is verified."
                />
                <FAQItem
                    question="Is Sendational an escrow platform?"
                    answer="No. Sendational is a technical delivery protocol, not a financial escrow service. We facilitate payments using Stripe Connect. We do not take custody of your funds. The payment is processed by Stripe and routed to your connected account immediately. This reduces liability and keeps you in control."
                />
                <FAQItem
                    question="How do I get paid?"
                    answer="We integrate with Stripe Connect to handle payouts instantly. Pro users also support a 'Digital Handshake' for manual payments (Zelle, Wire, Bank Transfer, PayPal). Your client can mark the invoice as 'Paid' and the files remain locked in 'Verification Pending' until you confirm receipt of funds in your banking app. Once confirmed, the delivery unlocks automatically. Manual payments are 0% and part of Pro payment options."
                />
                <FAQItem
                    question="Can I accept Zelle or Venmo?"
                    answer="Yes. Using our 'Digital Handshake' feature, you can provide your Zelle/Venmo details in the payment terminal. The system handles the asset security workflow while you handle the money transfer directly with the client."
                />
                <FAQItem
                    question="Are there platform fees?"
                    answer="The Starter plan has a 2.5% platform fee per transaction. The Studio and Business plans have 0% platform fees. Please note that standard payment processing fees (charged by Stripe) apply to all transactions regardless of your plan."
                />
                <FAQItem
                    question="Do my clients need to create an account?"
                    answer="No. Simplicity is our core value. Clients receive a secure, unique link to view their portal. They can review assets and make payments as a guest, ensuring zero friction for them."
                />
                <FAQItem
                    question="What file types are supported?"
                    answer="We support all major file types. Images (JPG, PNG) and PDFs get instant watermarked previews. Video files get short clip previews. Other file types (ZIP, specialized formats) are secured in the storage gateway and only downloadable after payment."
                />
                <FAQItem
                    question="Is this a replacement for Dropbox/Drive?"
                    answer="It can be. We offer secure native storage where we hold the files for you. On paid plans, BYOS (Bring Your Own Storage) lets files remain in your own S3 bucket or Drive account. We gate access to the download links, so you keep custody of your actual files."
                />
                <FAQItem
                    question="How do you handle disputes?"
                    answer="Ideally, we prevent them entirely! Since the client can't access the final files until they pay, the power dynamic is balanced from the start. You stay in control. If things do get tricky, though, we provide a clean 'Evidence Pack' showing exactly who viewed what, and when."
                />
                </div>
            </NetRevenueStylePanel>
        </div>
    </section>
);

type CookieConsentChoice = 'unknown' | 'essential' | 'all';

const CookieConsentBanner = ({ onChoose }: { onChoose: (choice: Exclude<CookieConsentChoice, 'unknown'>) => void }) => (
    <div className="fixed bottom-4 left-4 right-4 z-[70] md:left-6 md:right-6">
        <div className="max-w-[1200px] mx-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#323242]/80 backdrop-blur-xl shadow-2xl p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="pr-2">
                    <p className="text-sm font-bold text-obsidian dark:text-white">Cookie settings</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        We use essential cookies to keep Sendational secure and working. Optional cookies help us improve performance and product analytics.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onChoose('essential')}
                        className="px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                    >
                        Essential Only
                    </button>
                    <button
                        onClick={() => onChoose('all')}
                        className="px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest bg-black dark:bg-lime-400 text-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const Footer = () => (
    <footer className="bg-white dark:bg-cosmic text-black dark:text-white py-20 px-6 border-t border-slate-200 dark:border-white/10 transition-colors duration-700">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <Logo className="w-6 h-6 text-black dark:text-white group-hover:rotate-12 transition-transform duration-500" />
                    <span className="font-sans font-medium tracking-tight text-xl ">Sendational</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-sans font-medium tracking-tight italic text-lg ">Turn every delivery into an experience.</p>

                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                    <a href="https://youtube.com/@Sendational" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full hover:text-black dark:hover:text-white transition-colors" aria-label="YouTube">
                        <Youtube className="w-4 h-4" />
                    </a>
                    <a href="https://x.com/Sendational" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full hover:text-black dark:hover:text-white transition-colors" aria-label="X (Twitter)">
                        <BrandXIcon className="w-4 h-4" />
                    </a>
                    <a href="https://discord.gg/Sendational" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full hover:text-black dark:hover:text-white transition-colors" aria-label="Discord">
                        <BrandDiscordIcon className="w-4 h-4" />
                    </a>
                </div>
            </div>

            <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-500">
                <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Manifesto</a>
                <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Legal</a>
                <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Contact</a>
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
                © 2026 Sendational Ltd.
            </div>
        </div>
    </footer>
);

const SendationalFeaturesShowcase = () => (
    <section className="py-32 px-6 bg-white dark:bg-charcoal transition-colors duration-700 overflow-hidden border-t border-slate-200 dark:border-white/10">
        <div className="max-w-[1200px] mx-auto space-y-32">
            
            {/* Feature 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                <div className="w-full lg:w-1/2 order-2 lg:order-1 relative group">
                    {/* Mockup Container */}
                    <div className="relative aspect-[4/3] rounded-[2rem] bg-slate-100 dark:bg-[#2D2E45] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-8 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-700">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-lime-400/20 to-transparent blur-[80px]" />
                        
                        <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#1A1A24] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                            <div className="h-12 border-b border-slate-100 dark:border-white/10 flex items-center px-4 bg-slate-50 dark:bg-white/5">
                                <span className="text-xs font-bold uppercase text-slate-400">client_preview_v2.jpg</span>
                            </div>
                            <div className="p-8 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800')] bg-cover bg-center opacity-50 blur-[2px] grayscale" />
                                <div className="relative z-10 px-6 py-3 bg-white/20 backdrop-blur-md border border-white/40 rounded-full text-black font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Watermarked
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-1/2 order-1 lg:order-2">
                    <span className="inline-block py-1 px-3 rounded-full bg-lime-400/10 text-lime-600 dark:text-lime-400 font-bold text-[10px] uppercase tracking-widest mb-6">Smart Previews</span>
                    <h2 className="font-sans font-medium tracking-tight text-4xl md:text-5xl lg:text-6xl text-black dark:text-white leading-[1.1] mb-6">
                        Look, but don't touch.
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                        Upload your pristine high-resolution files. We instantly generate beautiful, lower-res watermarked previews for your client to review. They see the quality without getting the source.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-black dark:text-white font-medium"><CheckCircle className="w-5 h-5 text-lime-400" /> Auto-compression & Watermarking</li>
                        <li className="flex items-center gap-3 text-black dark:text-white font-medium"><CheckCircle className="w-5 h-5 text-lime-400" /> Prevent unauthorized downloads</li>
                        <li className="flex items-center gap-3 text-black dark:text-white font-medium"><CheckCircle className="w-5 h-5 text-lime-400" /> Beautiful client gallery UI</li>
                    </ul>
                </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                <div className="w-full lg:w-1/2">
                    <span className="inline-block py-1 px-3 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-widest mb-6">Atomic Escrow</span>
                    <h2 className="font-sans font-medium tracking-tight text-4xl md:text-5xl lg:text-6xl text-black dark:text-white leading-[1.1] mb-6">
                        No pay? <br />No files.
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                        Connect your Stripe or bank details. When the client is happy with the previews, they pay the outstanding balance directly on the delivery page. The high-res files unlock instantly upon payment success.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-black dark:text-white font-medium"><CheckCircle className="w-5 h-5 text-red-500" /> Secure payment gateways</li>
                        <li className="flex items-center gap-3 text-black dark:text-white font-medium"><CheckCircle className="w-5 h-5 text-red-500" /> Instant automated asset release</li>
                        <li className="flex items-center gap-3 text-black dark:text-white font-medium"><CheckCircle className="w-5 h-5 text-red-500" /> Eliminates invoice chasing</li>
                    </ul>
                </div>
                <div className="w-full lg:w-1/2 relative group">
                    <div className="relative aspect-[4/3] rounded-[2rem] bg-slate-100 dark:bg-[#2D2E45] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-8 flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-700">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-red-500/20 to-transparent blur-[80px]" />
                        
                        <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#1A1A24] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
                            <div className="p-6 text-center border-b border-slate-100 dark:border-white/10">
                                <p className="text-sm font-bold uppercase text-slate-400 mb-1">Final Invoice</p>
                                <p className="text-4xl font-sans tracking-tighter text-black dark:text-white">$2,500.00</p>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-white/5 flex flex-col gap-3">
                                <button className="w-full py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-sm flex justify-center items-center gap-2">
                                    <CreditCard className="w-5 h-5" /> Pay to Unlock
                                </button>
                                <button className="w-full py-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-sm flex justify-center items-center gap-2">
                                    <Globe className="w-5 h-5" /> Bank Transfer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                <div className="w-full lg:w-1/2 order-2 lg:order-1 relative group">
                    <div className="relative aspect-[4/3] rounded-[2rem] bg-slate-100 dark:bg-[#2D2E45] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-8 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-700">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-500/20 to-transparent blur-[80px]" />
                        
                        <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#1A1A24] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden p-8 flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black font-bold text-xl">S</div>
                                <div>
                                    <p className="font-sans font-medium text-lg text-black dark:text-white leading-tight">Studio Branding</p>
                                    <p className="text-sm text-slate-500">delivery.yourdomain.com</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-lime-400 shadow-sm border border-black/10" />
                                <div className="w-8 h-8 rounded-full bg-slate-900 shadow-sm border border-black/10" />
                                <div className="w-8 h-8 rounded-full bg-lime-400 shadow-sm border border-black/10" />
                            </div>
                            <div className="h-px w-full bg-slate-100 dark:bg-white/10" />
                            <div className="w-full h-8 bg-slate-100 dark:bg-white/5 rounded-md" />
                            <div className="w-2/3 h-8 bg-slate-100 dark:bg-white/5 rounded-md" />
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-1/2 order-1 lg:order-2">
                    <span className="inline-block py-1 px-3 rounded-full bg-lime-400/10 text-[#65a30d] dark:text-lime-400 font-bold text-[10px] uppercase tracking-widest mb-6">White Label</span>
                    <h2 className="font-sans font-medium tracking-tight text-4xl md:text-5xl lg:text-6xl text-black dark:text-white leading-[1.1] mb-6">
                        Your brand.<br />Front and center.
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                        Sendational operates in the background. Your clients see your logo, your colors, and your custom domain. It's an enterprise-grade experience that commands premium pricing.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-black dark:text-white font-medium"><CheckCircle className="w-5 h-5 text-lime-600" /> Custom subdomains</li>
                        <li className="flex items-center gap-3 text-black dark:text-white font-medium"><CheckCircle className="w-5 h-5 text-lime-600" /> Branded email notifications</li>
                        <li className="flex items-center gap-3 text-black dark:text-white font-medium"><CheckCircle className="w-5 h-5 text-lime-600" /> Custom color palettes</li>
                    </ul>
                </div>
            </div>

        </div>
    </section>
);

const SendationalToolkit = () => (
    <section className="relative overflow-hidden py-32 px-6 bg-editorial dark:bg-cosmic text-black dark:text-white border-t border-slate-200 dark:border-white/10 transition-colors duration-700">
        <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-24 h-64 w-64 rounded-full bg-lime-400/15 blur-[110px] motion-safe:animate-float" />
            <div className="absolute -bottom-24 right-[-10%] h-72 w-72 rounded-full bg-lime-400/10 blur-[140px] motion-safe:animate-float-delayed" />
            <div className="absolute top-10 right-[35%] h-24 w-24 rounded-full border border-lime-400/30 opacity-60 motion-safe:animate-spin" style={{ animationDuration: '18s' }} />
        </div>
        <div className="max-w-[1200px] mx-auto relative z-10">
            <SectionHeading
                badge="Sendational Stack"
                title={<span>Everything to send with confidence.</span>}
                subtitle="From preview security to payment release, every step is designed to feel effortless."
                className="motion-safe:animate-fade-in"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <BentoCard className="min-h-[260px] transition-transform hover:-translate-y-2 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.45)] dark:hover:shadow-[0_24px_50px_-28px_rgba(0,0,0,0.7)]" title="Preview Control" subtitle="Watermarked by default" icon={Eye}>
                    <div className="p-8 pt-0">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-lime-400/90 to-transparent mb-5" />
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Auto-generate previews so clients can review the work without grabbing the master files.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                            <Check className="w-3 h-3 text-lime-400" /> Auto watermarking
                        </div>
                    </div>
                </BentoCard>

                <BentoCard className="min-h-[260px] transition-transform hover:-translate-y-2 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.45)] dark:hover:shadow-[0_24px_50px_-28px_rgba(0,0,0,0.7)]" title="Instant Unlock" subtitle="Payment gated" icon={Zap}>
                    <div className="p-8 pt-0">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-lime-400/90 to-transparent mb-5" />
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Clients pay on the delivery page and the originals unlock immediately, no follow-ups.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                            <Lock className="w-3 h-3 text-lime-400" /> Money in, files out
                        </div>
                    </div>
                </BentoCard>

                <BentoCard className="min-h-[260px] transition-transform hover:-translate-y-2 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.45)] dark:hover:shadow-[0_24px_50px_-28px_rgba(0,0,0,0.7)]" title="Branded Portals" subtitle="Your look" icon={Globe}>
                    <div className="p-8 pt-0">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-lime-400/90 to-transparent mb-5" />
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Deliver under your logo, colors, and domain for a polished client experience.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                            <Palette className="w-3 h-3 text-lime-400" /> Custom identity
                        </div>
                    </div>
                </BentoCard>

                <BentoCard className="min-h-[260px] transition-transform hover:-translate-y-2 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.45)] dark:hover:shadow-[0_24px_50px_-28px_rgba(0,0,0,0.7)]" title="Client Signals" subtitle="Know the moment" icon={Mail}>
                    <div className="p-8 pt-0">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-lime-400/90 to-transparent mb-5" />
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            See when clients review, approve, or pay so you can move at the right moment.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                            <Clock className="w-3 h-3 text-lime-400" /> Review timeline
                        </div>
                    </div>
                </BentoCard>

                <BentoCard className="min-h-[260px] transition-transform hover:-translate-y-2 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.45)] dark:hover:shadow-[0_24px_50px_-28px_rgba(0,0,0,0.7)]" title="Audit Trail" subtitle="Dispute ready" icon={ShieldCheck}>
                    <div className="p-8 pt-0">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-lime-400/90 to-transparent mb-5" />
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Every view, approval, and unlock is tracked in a clean log you can export anytime.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                            <FileCheck className="w-3 h-3 text-lime-400" /> Evidence packs
                        </div>
                    </div>
                </BentoCard>

                <BentoCard className="min-h-[260px] transition-transform hover:-translate-y-2 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.45)] dark:hover:shadow-[0_24px_50px_-28px_rgba(0,0,0,0.7)]" title="Storage Freedom" subtitle="BYOS ready" icon={HardDrive}>
                    <div className="p-8 pt-0">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-lime-400/90 to-transparent mb-5" />
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Keep files in your own cloud and let Sendational gate the delivery link.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                            <Cloud className="w-3 h-3 text-lime-400" /> S3, Drive, Dropbox
                        </div>
                    </div>
                </BentoCard>
            </div>
        </div>
    </section>
);

const SendationalUseCases = () => {
    const lanes = [
        [
            { label: 'Wedding photography', icon: ImageIcon },
            { label: 'Brand identity', icon: Palette },
            { label: 'Video production', icon: PlayCircle },
            { label: 'Web design', icon: LayoutGrid },
            { label: 'Consulting reports', icon: FileText },
        ],
        [
            { label: 'Course assets', icon: Crown },
            { label: 'Music masters', icon: Disc },
            { label: 'Event media', icon: Calendar },
            { label: 'Creative retainers', icon: Clock },
            { label: 'Agency handoffs', icon: FolderOpen },
        ],
    ];

    return (
        <section className="overflow-hidden border-t border-slate-200 bg-editorial py-24 text-center text-black transition-colors duration-700 dark:border-white/10 dark:bg-cosmic dark:text-white">
            <div className="mx-auto mb-12 max-w-[900px] px-6">
                <span className="inline-block rounded-full border border-slate-200 bg-white px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-lime-600 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-lime-400">
                    Built For The Send
                </span>
                <h2 className="mt-6 font-sans text-4xl font-medium tracking-tight md:text-6xl">
                    Any work that should be previewed before it is released.
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                    If the final files matter, the final moment matters. Sendational gives that moment a branded portal, a clear balance, and a clean unlock.
                </p>
            </div>

            <div className="space-y-4">
                {lanes.map((lane, laneIndex) => (
                    <div key={laneIndex} className="relative flex overflow-hidden">
                        <div className={`flex min-w-max gap-4 px-4 ${laneIndex === 0 ? 'animate-marquee' : 'animate-marquee2'}`}>
                            {[...lane, ...lane, ...lane].map((item, index) => (
                                <div
                                    key={`${item.label}-${laneIndex}-${index}`}
                                    className="flex h-16 items-center gap-4 rounded-full border border-slate-200 bg-white px-6 text-lg font-semibold shadow-sm transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.06]"
                                >
                                    <item.icon className="h-5 w-5 text-lime-500 dark:text-lime-400" />
                                    <span className="whitespace-nowrap">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

const CompetitiveMatrix = () => {
    type CellValue = 'yes' | 'partial' | 'no';
    const columns = [
        { label: 'Sendational', highlight: true, note: 'Built for delivery' },
        { label: 'Marketplaces', highlight: false, note: 'Fees + rules' },
        { label: 'Generic Links', highlight: false, note: 'No payment gate' },
        { label: 'Legacy CRMs', highlight: false, note: 'Sales first' }
    ];
    const rows: { label: string; desc: string; values: CellValue[] }[] = [
        { label: 'Payment gating', desc: 'Files unlock only after payment clears.', values: ['yes', 'partial', 'no', 'partial'] },
        { label: 'Preview security', desc: 'Automatic watermarking and compression.', values: ['yes', 'no', 'partial', 'no'] },
        { label: 'Client portal', desc: 'Branded delivery space for every project.', values: ['yes', 'partial', 'no', 'partial'] },
        { label: 'Audit trail', desc: 'Proof of views, approvals, and releases.', values: ['yes', 'no', 'no', 'partial'] },
        { label: 'BYOS storage', desc: 'Keep files in your own cloud.', values: ['yes', 'no', 'partial', 'no'] },
        { label: 'Zero awkward chase', desc: 'No "send then chase" follow-ups.', values: ['yes', 'no', 'no', 'partial'] }
    ];

    const renderCell = (value: CellValue) => {
        if (value === 'yes') return <Check className="w-4 h-4 text-lime-400" />;
        if (value === 'partial') return <Minus className="w-4 h-4 text-amber-500" />;
        return <X className="w-4 h-4 text-red-500" />;
    };

    return (
        <section id="comparison-table" className="relative overflow-hidden py-32 px-6 bg-zinc-50/90 dark:bg-white/[0.03] text-black dark:text-white border-t border-slate-200 dark:border-white/10 transition-colors duration-700">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-[8%] h-64 w-64 rounded-full bg-lime-400/12 blur-[130px] motion-safe:animate-float" />
                <div className="absolute bottom-[-25%] right-[6%] h-72 w-72 rounded-full bg-sky-400/12 blur-[140px] motion-safe:animate-float-delayed" />
            </div>
            <div className="max-w-[1200px] mx-auto relative z-10">
                <SectionHeading
                    badge="Matrix"
                    title={<span>Ahead of the usual options.</span>}
                    subtitle="A plain-language look at what you actually get when it is time to deliver."
                    className="motion-safe:animate-fade-in"
                />

                <div className="mt-12 overflow-x-auto motion-safe:animate-fade-in" style={{ animationDelay: '0.05s' }}>
                    <div className="relative min-w-[900px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#323242]/50 backdrop-blur-xl overflow-hidden">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-lime-400/10 via-transparent to-blue-500/10 opacity-60" />
                        <div className="grid grid-cols-[240px_repeat(4,minmax(150px,1fr))] gap-4 px-6 py-4 border-b border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            <div>Capability</div>
                            {columns.map((col) => (
                                <div
                                    key={col.label}
                                    className={`rounded-xl px-3 py-2 text-center transition-shadow ${col.highlight ? 'bg-lime-400/20 text-black dark:text-white ring-1 ring-lime-400/30 shadow-[0_0_22px_rgba(190,242,100,0.2)]' : 'bg-slate-50 dark:bg-white/[0.03]'}`}
                                >
                                    <div className="text-[11px] font-bold text-black dark:text-white">{col.label}</div>
                                    <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{col.note}</div>
                                </div>
                            ))}
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-white/10">
                            {rows.map((row) => (
                                <div key={row.label} className="grid grid-cols-[240px_repeat(4,minmax(150px,1fr))] gap-4 px-6 py-4 items-center rounded-xl transition-colors duration-300 hover:bg-lime-400/10 dark:hover:bg-white/[0.04]">
                                    <div>
                                        <p className="text-sm font-semibold text-black dark:text-white">{row.label}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{row.desc}</p>
                                    </div>
                                    {row.values.map((value, index) => (
                                        <div
                                            key={`${row.label}-${index}`}
                                            className={`flex items-center justify-center rounded-xl py-3 transition-transform duration-300 ${columns[index].highlight ? 'bg-lime-400/15' : 'bg-slate-50 dark:bg-white/[0.03]'} hover:-translate-y-0.5`}
                                            aria-label={`${columns[index].label} ${row.label} ${value}`}
                                        >
                                            {renderCell(value)}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Partial means available with manual steps or limited control.
                </p>
            </div>
        </section>
    );
};

const SendationalFinalCTA = ({ onStart, viewMode }: { onStart: () => void, viewMode: 'creatives' | 'clients' }) => (
    <section className="py-32 px-6 bg-lime-400 text-black relative overflow-hidden">
        <div className="absolute -top-[50%] -right-[10%] w-[60%] h-[150%] bg-white/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1000px] mx-auto relative z-10 text-center">
            <h2 className="font-sans font-medium tracking-tight text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-8">
                {viewMode === 'creatives' ? (
                    <>
                        Deliver your work, <br />
                        <span className="italic font-light">Send-sationally.</span>
                    </>
                ) : (
                    <>
                        A delivery experience that feels <br />
                        <span className="italic font-light">Send-sational.</span>
                    </>
                )}
            </h2>
            <p className="text-xl md:text-2xl text-black/70 mb-12 max-w-3xl mx-auto font-medium">
                {viewMode === 'creatives' ? 
                    "Delivering to clients shouldn't feel like a risky chore. Stop chasing payments and start looking like the professional you are. Make every send sensational." :
                    "Review files, approve the scope, and unlock the final deliverables instantly. No more messy ZIP files or payment delays."
                }
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                    onClick={onStart}
                    className="group h-16 px-12 bg-black text-white rounded-full font-bold text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 shadow-2xl flex items-center gap-3"
                >
                    Start for Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-sm font-bold uppercase tracking-widest text-black/50">
                    No credit card required
                </p>
            </div>
        </div>
    </section>
);

const SendationalWorkflow = () => (
    <section className="py-32 px-6 bg-editorial dark:bg-cosmic transition-colors duration-700 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="text-center mb-24">
                <span className="inline-block py-1 px-3 rounded-full bg-lime-400/10 text-lime-600 dark:text-lime-400 font-bold text-[10px] uppercase tracking-widest mb-6">Workflow Simplified</span>
                <h2 className="font-sans font-medium tracking-tight text-5xl md:text-7xl text-black dark:text-white mb-6">
                    Handover in <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-lime-400">3 simple steps.</span>
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                    We've distilled the entire delivery process down to a few clicks. You focus on the creative work; we handle the business end.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-[48px] left-[15%] w-[70%] h-0.5 bg-gradient-to-r from-lime-400 via-blue-500 to-red-500 opacity-20" />
                
                {/* Step 1 */}
                <div className="relative z-10 flex flex-col items-center text-center group">
                    <div className="w-24 h-24 rounded-full bg-white dark:bg-[#2D2E45] border-2 border-lime-400 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(190,242,100,0.2)] group-hover:scale-110 transition-transform">
                        <span className="text-4xl font-bold font-sans text-lime-400">1</span>
                    </div>
                    <h3 className="text-2xl font-bold text-black dark:text-white mb-4">Upload Master Files</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                        Drag and drop your high-resolution assets into Sendational. We automatically generate compressed, watermarked previews in seconds.
                    </p>
                </div>

                {/* Step 2 */}
                <div className="relative z-10 flex flex-col items-center text-center group">
                    <div className="w-24 h-24 rounded-full bg-white dark:bg-[#2D2E45] border-2 border-lime-400 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform">
                        <span className="text-4xl font-bold font-sans text-lime-600">2</span>
                    </div>
                    <h3 className="text-2xl font-bold text-black dark:text-white mb-4">Client Reviews</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                        Share a beautiful, branded link. The client previews the work exactly as intended, but cannot download the source files.
                    </p>
                </div>

                {/* Step 3 */}
                <div className="relative z-10 flex flex-col items-center text-center group">
                    <div className="w-24 h-24 rounded-full bg-white dark:bg-[#2D2E45] border-2 border-red-500 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(239,68,68,0.2)] group-hover:scale-110 transition-transform">
                        <span className="text-4xl font-bold font-sans text-red-500">3</span>
                    </div>
                    <h3 className="text-2xl font-bold text-black dark:text-white mb-4">Get Paid & Release</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                        The client hits "Pay Now". The funds hit your account instantly, and Sendational automatically releases the high-res files.
                    </p>
                </div>
            </div>
        </div>
    </section>
);

export default function LandingPage({ onGetStarted, onQuickStartWithFiles, currentTheme, onSetThemeMode, toggleTheme }: { onGetStarted: () => void, onQuickStartWithFiles?: (files: File[]) => void, currentTheme: 'light' | 'dark' | 'system', onSetThemeMode: (mode: 'light' | 'dark' | 'system') => void, toggleTheme?: () => void }) {

    // Removed internal state management for theme to rely on parent App state
    const [viewMode, setViewMode] = useState<'creatives' | 'clients'>('creatives');
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
    const [isDropActive, setIsDropActive] = useState(false);
    const [isWidgetOpen, setIsWidgetOpen] = useState(false);
    const quickUploadInputRef = useRef<HTMLInputElement | null>(null);
    const dragCounterRef = useRef(0);
    const [cookieConsent, setCookieConsent] = useState<CookieConsentChoice>(() => {
        if (typeof window === 'undefined') return 'unknown';
        const saved = window.localStorage.getItem('th_cookie_consent');
        if (saved === 'essential' || saved === 'all') return saved;
        return 'unknown';
    });

    // Floating widget state
    const [widgetLines, setWidgetLines] = useState<QuoteLine[]>([makeQuoteLine()]);
    const [widgetProjectTitle, setWidgetProjectTitle] = useState('');
    const [widgetClientName, setWidgetClientName] = useState('');
    const [widgetClientEmail, setWidgetClientEmail] = useState('');
    const [widgetStorageType, setWidgetStorageType] = useState<'cloud' | 'local'>('local');
    const [widgetFiles, setWidgetFiles] = useState<File[]>([]);
    const [widgetCloudProvider, setWidgetCloudProvider] = useState<'gdrive' | 'dropbox' | null>(null);
    const widgetFileInputRef = useRef<HTMLInputElement | null>(null);
    const widgetSubtotal = calcQuoteSubtotal(widgetLines);
    const widgetHasFiles = widgetStorageType === 'local' ? widgetFiles.length > 0 : Boolean(widgetCloudProvider);
    const widgetHasDetails = Boolean(widgetProjectTitle.trim()) || Boolean(widgetClientName.trim()) || Boolean(widgetClientEmail.trim());
    const widgetSteps = [
        { id: 'files', label: 'Files', complete: widgetHasFiles },
        { id: 'details', label: 'Client', complete: widgetHasDetails },
        { id: 'quote', label: 'Quote', complete: widgetSubtotal > 0 },
    ];
    const widgetCompletedCount = widgetSteps.filter((step) => step.complete).length;
    const widgetProgressPercent = Math.round((widgetCompletedCount / widgetSteps.length) * 100);
    const widgetNextStep = widgetSteps.find((step) => !step.complete)?.label;

    const handleCookieChoice = (choice: Exclude<CookieConsentChoice, 'unknown'>) => {
        setCookieConsent(choice);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('th_cookie_consent', choice);
            window.localStorage.setItem('th_cookie_consent_at', new Date().toISOString());
        }
    };

    const openGetStartedModal = () => {
        playClick();
        setIsGetStartedOpen(true);
    };

    const handleQuickStartFiles = (incoming: FileList | File[] | null) => {
        if (!onQuickStartWithFiles || !incoming || incoming.length === 0) return;
        const files = Array.from(incoming);
        onQuickStartWithFiles(files);
    };

    const triggerQuickFilePicker = () => {
        quickUploadInputRef.current?.click();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        if (!onQuickStartWithFiles || !e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        dragCounterRef.current += 1;
        setIsDropActive(true);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!onQuickStartWithFiles || !e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDropActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!onQuickStartWithFiles || !e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
        if (dragCounterRef.current === 0) setIsDropActive(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        if (!onQuickStartWithFiles) return;
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsDropActive(false);
        handleQuickStartFiles(e.dataTransfer.files);
    };

    const handleWidgetFilesChange = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setWidgetFiles(Array.from(files));
        playSuccess();
    };

    const handleWidgetSignUp = () => {
        playSuccess();
        // Show the get started modal with the widget data pre-filled
        setIsGetStartedOpen(true);
    };

    const isDarkEffective = useSyncExternalStore(subscribeDocDarkClass, getDocDarkClassSnapshot, () => false);

    const widgetNestedSurface = isDarkEffective ? 'bg-white/[0.06]' : 'bg-white';

    return (
        <div
            className="min-h-screen bg-editorial dark:bg-cosmic text-black dark:text-white font-sans selection:bg-lime-400 selection:text-black transition-colors duration-700"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                ref={quickUploadInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    handleQuickStartFiles(e.target.files);
                    e.currentTarget.value = '';
                }}
            />

            <input
                ref={widgetFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    handleWidgetFilesChange(e.target.files);
                    e.currentTarget.value = '';
                }}
            />

            {/* Floating Delivery Widget — Bottom-left pop-up (xl+ only) */}
            <div className="fixed bottom-6 left-6 z-40 hidden xl:block">
                {/* Expanded panel */}
                {isWidgetOpen && (
                    <div
                        className="mb-3 flex flex-col overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/[0.78] dark:border-white/[0.09] dark:bg-[#323242]/80 shadow-2xl backdrop-blur-xl"
                        style={{ width: '20rem', maxHeight: 'calc(100vh - 8rem)' }}
                    >
                        <div
                            className="pointer-events-none absolute inset-0 z-0 rounded-[2rem] opacity-[0.03] mix-blend-multiply dark:opacity-[0.10] dark:mix-blend-overlay"
                            style={{ backgroundImage: NOISE_SVG, backgroundSize: '220px 220px' }}
                        />
                        {/* Panel header */}
                        <div className="relative z-20 flex shrink-0 items-center justify-between border-b border-zinc-200/60 px-5 py-3.5 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-400/15 dark:bg-lime-400/20">
                                    <FileCheck className="h-3.5 w-3.5 text-lime-600 dark:text-lime-400" />
                                </div>
                                <div>
                                    <h3 className="font-sans font-medium tracking-tight text-sm leading-none text-black dark:text-white">Try it now</h3>
                                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Quick delivery · free</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => { playClick(); setIsWidgetOpen(false); }}
                                className="relative z-30 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-200 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/20 dark:hover:text-white"
                                aria-label="Close widget"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        {/* Scrollable body */}
                        <div
                            className="relative z-10 flex-1 overflow-y-auto p-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                            style={{ minHeight: 0 }}
                        >
                        <div className="flex flex-col gap-3.5">
                            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-200">
                                Build a real delivery. Sign up to keep it.
                            </p>
                            <div className="rounded-xl border border-zinc-200/60 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                    <span>Delivery progress</span>
                                    <span>{widgetProgressPercent}%</span>
                                </div>
                                <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200/70 dark:bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full bg-lime-400 transition-all"
                                        style={{ width: `${widgetProgressPercent}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {widgetSteps.map((step) => (
                                        <span
                                            key={step.id}
                                            className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
                                                step.complete
                                                    ? 'bg-lime-400/20 text-zinc-900 dark:text-lime-200'
                                                    : 'bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400'
                                            }`}
                                        >
                                            {step.label}
                                        </span>
                                    ))}
                                </div>
                                <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                                    {widgetNextStep ? `Next up: ${widgetNextStep}.` : 'All set. Open the full builder to publish.'}
                                </p>
                            </div>
                            {/* Storage Type Selector */}
                            <div className="shrink-0">
                                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-300">
                                    File source
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); setWidgetStorageType('local'); }}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-all ${
                                            widgetStorageType === 'local'
                                                ? 'border-zinc-950 bg-zinc-950 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-black'
                                                : 'border-zinc-200 bg-white/90 text-zinc-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <HardDrive className="h-3 w-3 shrink-0" />
                                        Local
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); setWidgetStorageType('cloud'); }}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-all ${
                                            widgetStorageType === 'cloud'
                                                ? 'border-zinc-950 bg-zinc-950 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-black'
                                                : 'border-zinc-200 bg-white/90 text-zinc-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <Cloud className="h-3 w-3 shrink-0" />
                                        Cloud
                                    </button>
                                </div>
                            </div>

                            {widgetStorageType === 'local' ? (
                                <div className="shrink-0" style={{ minHeight: '7.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => widgetFileInputRef.current?.click()}
                                        className="group w-full h-full rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/60 px-3 py-3 transition-all hover:border-lime-400 hover:bg-lime-50 dark:border-white/15 dark:bg-white/[0.04] dark:hover:border-lime-400 dark:hover:bg-lime-400/10"
                                    >
                                        <Upload className="mx-auto mb-1 h-4 w-4 text-zinc-400 transition-colors group-hover:text-lime-600 dark:text-zinc-400 dark:group-hover:text-lime-400" />
                                        <p className="text-[11px] font-medium text-zinc-600 transition-colors group-hover:text-lime-700 dark:text-zinc-100 dark:group-hover:text-lime-400">
                                            {widgetFiles.length > 0
                                                ? `${widgetFiles.length} file${widgetFiles.length > 1 ? 's' : ''} ready`
                                                : 'Choose from device'}
                                        </p>
                                        {widgetFiles.length > 0 && (
                                            <p className="mt-0.5 truncate px-2 text-[9px] text-zinc-400 dark:text-zinc-300">
                                                {widgetFiles.map((f) => f.name).join(', ')}
                                            </p>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="shrink-0 space-y-1.5" style={{ minHeight: '7.5rem' }}>
                                    <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-300">Connect cloud drive</p>
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); setWidgetCloudProvider('gdrive'); }}
                                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                                            widgetCloudProvider === 'gdrive'
                                                ? 'border-lime-300/60 bg-blue-50 dark:bg-lime-400/10'
                                                : 'border-zinc-200 bg-white/90 dark:border-white/10 dark:bg-white/[0.05] dark:hover:border-white/20'
                                        }`}
                                    >
                                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                                        </svg>
                                        <div className="flex-1 text-left">
                                            <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Google Drive</p>
                                            <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Docs, Sheets, any file</p>
                                        </div>
                                        {widgetCloudProvider === 'gdrive' && <Check className="h-3.5 w-3.5 shrink-0 text-lime-600" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { playClick(); setWidgetCloudProvider('dropbox'); }}
                                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                                            widgetCloudProvider === 'dropbox'
                                                ? 'border-[#0061FF]/50 bg-blue-50 dark:bg-[#0061FF]/10'
                                                : 'border-zinc-200 bg-white/90 dark:border-white/10 dark:bg-white/[0.05] dark:hover:border-white/20'
                                        }`}
                                    >
                                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#0061FF" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <path d="M6 2L0 6l6 4-6 4 6 4 6-4-6-4 6-4L6 2zm12 0l-6 4 6 4-6 4 6 4 6-4-6-4 6-4-6-4zM6 18.5L12 22l6-3.5-6-4-6 4z"/>
                                        </svg>
                                        <div className="flex-1 text-left">
                                            <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Dropbox</p>
                                            <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Photos, videos, folders</p>
                                        </div>
                                        {widgetCloudProvider === 'dropbox' && <Check className="h-3.5 w-3.5 shrink-0 text-[#0061FF]" />}
                                    </button>
                                    {widgetCloudProvider && (
                                        <button
                                            type="button"
                                            onClick={() => { playClick(); }}
                                            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-all hover:opacity-90 dark:bg-lime-400 dark:text-black"
                                        >
                                            <FolderOpen className="h-3.5 w-3.5" />
                                            Browse {widgetCloudProvider === 'gdrive' ? 'Drive' : 'Dropbox'}
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="shrink-0 space-y-1.5">
                                <input
                                    type="text"
                                    placeholder="Project title"
                                    value={widgetProjectTitle}
                                    onChange={(e) => setWidgetProjectTitle(e.target.value)}
                                    className={`h-8 w-full rounded-lg border px-3 text-xs outline-none transition-colors ${
                                        isDarkEffective
                                            ? 'border-white/10 bg-white/[0.07] text-zinc-100 placeholder:text-zinc-500'
                                            : 'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400'
                                    }`}
                                />
                                <input
                                    type="text"
                                    placeholder="Client name"
                                    value={widgetClientName}
                                    onChange={(e) => setWidgetClientName(e.target.value)}
                                    className={`h-8 w-full rounded-lg border px-3 text-xs outline-none transition-colors ${
                                        isDarkEffective
                                            ? 'border-white/10 bg-white/[0.07] text-zinc-100 placeholder:text-zinc-500'
                                            : 'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400'
                                    }`}
                                />
                                <input
                                    type="email"
                                    placeholder="Client email"
                                    value={widgetClientEmail}
                                    onChange={(e) => setWidgetClientEmail(e.target.value)}
                                    className={`h-8 w-full rounded-lg border px-3 text-xs outline-none transition-colors ${
                                        isDarkEffective
                                            ? 'border-white/10 bg-white/[0.07] text-zinc-100 placeholder:text-zinc-500'
                                            : 'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400'
                                    }`}
                                />
                            </div>

                            <DeliveryQuickQuote
                                className="shrink-0"
                                isDarkMode={isDarkEffective}
                                projectTitle={widgetProjectTitle}
                                clientName={widgetClientName}
                                clientEmail={widgetClientEmail}
                                lines={widgetLines}
                                onLinesChange={setWidgetLines}
                                onApplyToPayment={() => {}}
                                onOpenFullBuilder={handleWidgetSignUp}
                                panelSurfaceCls={widgetNestedSurface}
                                footerSlot={(
                                    <div className="mt-2 pt-2 border-t border-zinc-200/50 dark:border-white/10">
                                        <button
                                            type="button"
                                            onClick={handleWidgetSignUp}
                                            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 text-[11px] font-bold uppercase tracking-wider text-black shadow-md transition-all hover:scale-[1.02] hover:bg-lime-300 hover:shadow-lg"
                                        >
                                            <Save className="h-3.5 w-3.5" />
                                            Sign up to keep it
                                        </button>
                                        <p className="mt-2 text-center text-[9px] text-zinc-400 dark:text-zinc-500">
                                            Free to start · No card required
                                        </p>
                                    </div>
                                )}
                            />
                        </div>
                        </div>
                    </div>
                )}

                {/* Floating trigger pill */}
                <button
                    type="button"
                    onClick={() => { playClick(); setIsWidgetOpen(prev => !prev); }}
                    className="flex items-center gap-2.5 rounded-2xl bg-lime-400 px-5 py-3.5 text-black shadow-2xl shadow-lime-400/25 transition-all hover:scale-105 hover:bg-lime-300 hover:shadow-lime-400/40 active:scale-95"
                    aria-label={isWidgetOpen ? 'Close quick delivery' : 'Open quick delivery'}
                >
                    <FileCheck className="h-4 w-4 shrink-0" />
                    <span className="text-[12px] font-bold uppercase tracking-widest">
                        {isWidgetOpen ? 'Close' : 'Try a delivery'}
                    </span>
                </button>
            </div>

            {isDropActive && (
                <div className="fixed inset-0 z-[1200] pointer-events-none bg-black/40 dark:bg-[#323242]/60 backdrop-blur-[2px]">
                    <div className="absolute inset-0 flex items-center justify-center px-6">
                        <div className="rounded-3xl border border-white/20 bg-white/90 dark:bg-[#2D2E45]/90 shadow-2xl px-8 py-10 text-left max-w-lg w-full">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Quick start</p>
                            <h3 className="font-sans font-medium tracking-tight text-3xl sm:text-4xl text-zinc-900 dark:text-white mb-4">Drop to deliver</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-5 leading-relaxed">
                                We&apos;ll load your files into <strong className="text-zinc-800 dark:text-white">Quick delivery</strong>. Next you&apos;ll add client details, choose a link or email, publish, then share the project.
                            </p>
                            <ol className="text-xs text-zinc-500 dark:text-zinc-400 space-y-2 list-decimal list-inside border-t border-zinc-200/60 dark:border-white/10 pt-4">
                                <li>Files land in the left delivery panel (dock layout).</li>
                                <li>Create link <span className="text-zinc-400">or</span> send email → Publish.</li>
                                <li>Copy the client link or send from the success screen.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}


            {/* Nav receives isHidden prop to create cinema mode */}
            <Nav onStart={openGetStartedModal} currentTheme={currentTheme} onSetThemeMode={onSetThemeMode || (() => toggleTheme?.())} isHidden={isVideoOpen} />
            <main>
                <Hero onStart={openGetStartedModal} onWatchVideo={() => setIsVideoOpen(true)} viewMode={viewMode} setViewMode={setViewMode} />
                <SendationalWorkflowTheater />
                <ComparisonSection />
                <SendationalFeaturesShowcase />
                <CompetitiveMatrix />
                <Pricing onStart={openGetStartedModal} />
                <FAQSection />
                <SendationalFinalCTA onStart={openGetStartedModal} viewMode={viewMode} />
            </main>
            <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} onStart={openGetStartedModal} />
            <GetStartedModal
                isOpen={isGetStartedOpen}
                onClose={() => setIsGetStartedOpen(false)}
                onStartFresh={onGetStarted}
                onChooseFiles={triggerQuickFilePicker}
                filesPathAvailable={Boolean(onQuickStartWithFiles)}
            />
            <Footer />
            {cookieConsent === 'unknown' && <CookieConsentBanner onChoose={handleCookieChoice} />}
        </div>
    );
}
