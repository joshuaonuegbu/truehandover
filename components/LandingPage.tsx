
import React, { useState, useEffect, useRef } from 'react';
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
    Menu,
    LifeBuoy,
    Youtube,
    LayoutGrid
} from 'lucide-react';
import { playClick } from '../utils/sound';
import ThemeModeDropdown from './ThemeModeDropdown';
import BrandLogo from './BrandLogo';

// --- VISUAL PRIMITIVES ---

// OPTIMIZED: Granular Film Grain SVG (Synced with App.tsx Vault Style)
// baseFrequency=0.98 provides the "Ultra High Res" digital film look.
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;
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
                        title="TrueHandover Film"
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
                        className="px-8 py-4 bg-brand text-black rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_30px_rgba(190, 242, 100,0.4)] transition-all shadow-lg flex items-center gap-3"
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
                className={`relative z-10 w-full max-w-2xl transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-[0.98] opacity-0 translate-y-6'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="get-started-title"
            >
                <div className="rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.1] bg-white dark:bg-charcoal shadow-2xl overflow-hidden">
                    <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-slate-200/60 dark:border-white/[0.06] flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-2">TrueHandover</p>
                            <h2 id="get-started-title" className="font-serif text-2xl sm:text-3xl text-black dark:text-white tracking-tight">
                                How would you like to begin?
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                                Start in the workspace right away, or load deliverables first — your choice.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { playClick(); handleClose(); }}
                            className="shrink-0 p-2.5 rounded-full border border-slate-200 dark:border-white/15 text-slate-500 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 sm:p-10 space-y-4">
                        <button
                            type="button"
                            onClick={() => {
                                playClick();
                                handleClose();
                                setTimeout(onStartFresh, 200);
                            }}
                            className="w-full text-left rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-slate-50/80 dark:bg-white/[0.04] hover:border-brand/60 dark:hover:border-brand/40 hover:bg-white dark:hover:bg-white/[0.07] transition-all p-5 sm:p-6 group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-xl bg-brand/15 dark:bg-brand/20 flex items-center justify-center text-zinc-900 dark:text-brand shrink-0 group-hover:scale-105 transition-transform">
                                    <LayoutGrid className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm uppercase tracking-widest text-black dark:text-white mb-1 flex items-center gap-2">
                                        Open the workspace
                                        <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Jump in and explore Quick delivery, vault, and settings. Add files whenever you&apos;re ready.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {filesPathAvailable && (
                            <div className="rounded-2xl border border-dashed border-slate-300/90 dark:border-white/15 bg-white dark:bg-[#2a2a38]/50 p-5 sm:p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-11 h-11 rounded-xl bg-slate-200/80 dark:bg-white/10 flex items-center justify-center text-zinc-800 dark:text-white shrink-0">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm uppercase tracking-widest text-black dark:text-white mb-1">
                                            Bring files first
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                            We&apos;ll place them in Quick delivery so you can add the client, publish, and share the vault in a few steps.
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
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-zinc-950 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                                >
                                    Choose files
                                </button>
                            </div>
                        )}

                        {filesPathAvailable && (
                            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 pt-2">
                                Tip: you can also <span className="text-slate-700 dark:text-slate-300 font-medium">drag files from your desktop</span> onto this page anytime.
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
            <span className="inline-block py-1.5 px-4 rounded-full bg-black dark:bg-white/10 font-mono text-xs text-brand uppercase tracking-widest mb-6 border border-white/10 shadow-lg">
                {badge}
            </span>
        )}
        <h2 className="font-serif text-4xl md:text-6xl mb-6 text-black dark:text-white transition-colors duration-500 leading-tight tracking-wide">
            {title}
        </h2>
        {subtitle && <p className="text-slate-600 dark:text-slate-200 text-lg max-w-xl transition-colors duration-500 leading-relaxed">
            {subtitle}
        </p>}
    </div>
);

const BentoCard = ({ children, className = "", title, subtitle, icon: Icon }: { children?: React.ReactNode, className?: string, title?: string, subtitle?: string, icon?: any }) => (
    <NetRevenueStylePanel
        className={`group flex flex-col transition-all duration-500 hover:border-zinc-300/80 dark:hover:border-white/10 ${className}`}
    >
        {(title || Icon) && (
            <div className="p-8 pb-4 shrink-0">
                <div className="flex items-center gap-3 mb-3">
                    {Icon && (
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/50 dark:border-white/[0.06] flex items-center justify-center text-black dark:text-brand">
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        {title && <h3 className="font-serif text-xl text-black dark:text-white leading-none mb-1 tracking-wide">{title}</h3>}
                        {subtitle && <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
                    </div>
                </div>
            </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </NetRevenueStylePanel>
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
            <div className="max-w-[1200px] mx-auto bg-white/80 dark:bg-[#323242]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl relative z-50">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <Logo className="w-6 h-6 text-black dark:text-white group-hover:rotate-12 transition-transform duration-500" />
                    <span className="font-serif text-lg sm:text-xl tracking-tight text-black dark:text-white">TrueHandover</span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <button onClick={() => scrollTo('comparison')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors">Why Us</button>
                    <button onClick={() => scrollTo('how-it-works')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors">Process</button>
                    <button onClick={() => scrollTo('pricing')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors">Pricing</button>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <button
                        onClick={() => { playClick(); window.location.href = '/signin?from=landing'; }}
                        className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors px-3 py-2"
                    >
                        Sign In
                    </button>

                    <button
                        onClick={onStart}
                        className="px-6 py-2.5 bg-black dark:bg-brand text-white dark:text-zinc-950 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_20px_rgba(190, 242, 100,0.5)] transition-all shadow-lg border border-transparent dark:border-brand"
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
                        <button onClick={() => scrollTo('comparison')} className="text-lg font-serif text-obsidian dark:text-white text-left px-2">Why Us</button>
                        <button onClick={() => scrollTo('how-it-works')} className="text-lg font-serif text-obsidian dark:text-white text-left px-2">Process</button>
                        <button onClick={() => scrollTo('pricing')} className="text-lg font-serif text-obsidian dark:text-white text-left px-2">Pricing</button>
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
                            className="w-full py-4 rounded-2xl bg-black dark:bg-brand text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-widest shadow-lg"
                        >
                            Start for Free
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const Hero = ({ onStart, onWatchVideo }: { onStart: () => void, onWatchVideo: () => void }) => {
    // ... [Same implementation as before] ...
    const [isHoveringCTA, setIsHoveringCTA] = useState(false);

    return (
        <section className="relative min-h-[100vh] flex flex-col items-center px-6 pt-32 pb-12 overflow-hidden bg-editorial dark:bg-cosmic text-black dark:text-white transition-colors duration-700">
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

            <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 w-full">
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
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${isHoveringCTA ? 'bg-brand text-black' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                                {isHoveringCTA ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                            </div>
                            <div className="w-20 h-2 bg-slate-200 dark:bg-white/10 rounded-full mb-2" />
                            <div className="w-12 h-2 bg-slate-200 dark:bg-white/10 rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="mb-10 animate-fade-in relative z-10 flex flex-col md:flex-row items-center gap-4">
                    <a
                        href="https://www.producthunt.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg hover:scale-105 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FF6154] text-white">
                            <span className="font-bold text-[10px] pb-0.5">P</span>
                        </div>
                        <span className="text-xs font-bold text-obsidian dark:text-white uppercase tracking-wider group-hover:text-[#FF6154] transition-colors">
                            Featured on Product Hunt
                        </span>
                    </a>

                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm shadow-sm transition-all hover:bg-white dark:hover:bg-white/10 cursor-default">
                        <div className="w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_8px_#bef264]"></div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-none uppercase tracking-wider">
                            Now available in public beta
                        </span>
                    </div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto text-center mb-16">
                    <h1 className="font-serif text-5xl md:text-8xl lg:text-9xl font-medium tracking-tight leading-[0.95] mb-10 animate-slide-up">
                        <span className="text-red-600 dark:text-red-500 drop-shadow-sm">Stop Chasing.</span> <br />
                        <span className="text-black dark:text-white">Start <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#bef264] to-[#bef264]">Delivering.</span></span>
                    </h1>

                    <div className="max-w-4xl mx-auto leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <p className="font-serif italic text-xl md:text-3xl text-obsidian dark:text-white mb-6 tracking-wide">
                            The end of the "You send first" standoff.
                        </p>
                        <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-200 font-light leading-relaxed">
                            TrueHandover ensures your assets are <span className="border-b-2 border-brand text-black dark:text-white font-medium">securely handed over</span> only when payment clears.
                            We generate watermarked previews automatically, so your client reviews the excellence while you retain the master files.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={() => { onStart(); }}
                            onMouseEnter={() => setIsHoveringCTA(true)}
                            onMouseLeave={() => setIsHoveringCTA(false)}
                            className="group relative h-16 px-10 bg-brand text-zinc-950 rounded-2xl font-bold text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(190, 242, 100,0.6)] shadow-xl"
                        >
                            <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-cta-sheen" />
                            </span>
                            <span className="relative z-10 flex items-center gap-3">
                                Start for Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>

                        <button
                            onClick={() => { playClick(); onWatchVideo(); }}
                            className="group h-16 px-10 rounded-2xl border border-slate-200 dark:border-white/20 text-black dark:text-white font-bold text-sm uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all backdrop-blur-sm flex items-center gap-3 hover:shadow-lg"
                        >
                            <PlayCircle className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" /> Watch the Film
                        </button>
                    </div>

                </div>

            </div>

            <div className="w-full max-w-[1200px] border-t border-slate-200 dark:border-white/5 pt-8 mt-auto animate-slide-up relative z-20" style={{ animationDelay: '0.4s' }}>
                <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-8">
                    Built to integrate seamlessly with your stack
                </p>
                <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                    <div className="flex items-center gap-2 text-xl font-bold font-serif text-slate-500 dark:text-slate-400"><Server className="w-5 h-5" /> AWS S3</div>
                    <div className="flex items-center gap-2 text-xl font-bold font-serif text-slate-500 dark:text-slate-400"><DollarSign className="w-5 h-5" /> Stripe Connect</div>
                    <div className="flex items-center gap-2 text-xl font-bold font-serif text-slate-500 dark:text-slate-400"><Globe className="w-5 h-5" /> Cloudflare R2</div>
                    <div className="flex items-center gap-2 text-xl font-bold font-serif text-slate-500 dark:text-slate-400"><Disc className="w-5 h-5" /> Google Drive</div>
                    <div className="flex items-center gap-2 text-xl font-bold font-serif text-slate-500 dark:text-slate-400"><Box className="w-5 h-5" /> Dropbox</div>
                    <div className="flex items-center gap-2 text-xl font-bold font-serif text-slate-500 dark:text-slate-400"><Smartphone className="w-5 h-5" /> Zelle</div>
                    <div className="flex items-center gap-2 text-xl font-bold font-serif text-slate-500 dark:text-slate-400"><Cloud className="w-5 h-5" /> OneDrive</div>
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
        { icon: Banknote, title: "Keep 100% of Revenue*", desc: "Zero transaction fees on paid plans. Just a flat monthly subscription." }
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
            <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="max-w-[1200px] mx-auto relative z-10">
                <SectionHeading
                    badge="The Upgrade"
                    title={
                        <span>
                            Stop the <span className="line-through decoration-red-500 decoration-4 text-slate-400 dark:text-slate-500">"Send-then-Chase"</span> cycle.
                        </span>
                    }
                    subtitle="Built for professionals who value their time, talent, and creative leverage."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                    {/* The Old Way */}
                    <div
                        onMouseEnter={() => setHoveredCard('old')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={`p-10 rounded-[2.5rem] bg-white/60 dark:bg-[#2D2E45]/60 backdrop-blur-sm border border-dashed border-slate-300/80 dark:border-white/15 relative group transition-all duration-500 shadow-sm dark:shadow-md hover:bg-white/80 dark:hover:bg-[#2D2E45]/80 hover:border-slate-400/80 dark:hover:border-white/20 ${hoveredCard !== 'old' ? 'animate-old-way-breathe' : ''}`}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <X className="w-32 h-32 text-red-500 rotate-12" />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 font-bold shadow-sm">
                                <X className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-serif text-slate-500 dark:text-slate-300 tracking-wide">The Old Way</h3>
                        </div>

                        <div className="space-y-8 relative z-10">
                            {oldWayItems.map((item, i) => {
                                const isHighlighted = hoveredCard === 'old' || autoFocusIndex === i;
                                return (
                                    <div key={i} className={`flex gap-5 transition-all duration-500 ${isHighlighted ? 'opacity-100 translate-x-1' : 'opacity-60 translate-x-0'}`}>
                                        <item.icon className={`w-6 h-6 shrink-0 mt-1 transition-all duration-500 ${isHighlighted ? 'text-slate-600 dark:text-slate-100 scale-110' : 'text-slate-400 dark:text-slate-400 scale-100'}`} />
                                        <div>
                                            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-lg">{item.title}</h4>
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

                    {/* The TrueHandover Way */}
                    <div
                        onMouseEnter={() => setHoveredCard('new')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="relative p-10 rounded-[2.5rem] bg-brand text-black shadow-2xl shadow-black/25 transform md:-translate-y-4 transition-transform hover:-translate-y-6 duration-500 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Check className="w-32 h-32 text-black -rotate-12" />
                        </div>

                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-black text-brand flex items-center justify-center font-bold shadow-xl">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-serif font-medium text-black tracking-wide">The New Standard</h3>
                        </div>

                        <div className="space-y-8 relative z-10">
                            {newWayItems.map((item, i) => (
                                <div key={i} className={`flex gap-5 transition-all duration-500 ${hoveredCard === 'new' ? 'translate-x-1' : 'translate-x-0'}`} style={{ transitionDelay: `${i * 35}ms` }}>
                                    <div className="p-1 rounded-full bg-black/5 h-fit">
                                        <item.icon className={`w-5 h-5 text-black shrink-0 transition-transform duration-500 ${hoveredCard === 'new' ? 'scale-110' : 'scale-100'}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-black text-lg">{item.title}</h4>
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

const BentoGrid = () => {
    // ... [Same implementation as before] ...
    const [isCustom, setIsCustom] = useState(false);
    const [accentColor, setAccentColor] = useState('#bef264');

    const brandConfigs = [
        { name: 'Default', color: '#bef264', domain: 'portal.truehandover.com' },
        { name: 'Onyx', color: '#334155', domain: 'vault.agency.com' },
        { name: 'Cobalt', color: '#3b82f6', domain: 'files.studio.io' }
    ];

    const currentBrand = brandConfigs.find(b => b.color === accentColor) || brandConfigs[0];

    return (
        <section id="how-it-works" className="py-32 px-6 bg-editorial dark:bg-cosmic text-black dark:text-white border-t border-slate-200 dark:border-white/10 transition-colors duration-700">
            <div className="max-w-[1200px] mx-auto">
                <SectionHeading
                    badge="The Mechanism"
                    title={<span>A structured workflow <br /><span className="italic text-slate-400 dark:text-slate-500">for peace of mind.</span></span>}
                    subtitle="Replace scattered tools with a single, professional delivery pipeline."
                />

                <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
                    {/* 1. Smart Previews */}
                    <BentoCard className="md:col-span-3 lg:col-span-4 min-h-[400px]" title="Smart Preview" subtitle="Lossy samples for assessment" icon={Eye}>
                        <div className="p-8 pt-0 h-full flex flex-col relative">
                            <p className="text-slate-700 dark:text-slate-100 text-sm leading-relaxed mb-8">
                                Creators upload final files. We automatically generate secure, watermarked previews.
                                Clients review the work without accessing the master files.
                            </p>
                            <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group-hover:border-brand/30 transition-colors">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?w=500&q=50')] bg-cover bg-center opacity-40 blur-[2px]" />
                                <div className="absolute inset-0 bg-black/10 dark:bg-[#323242]/40" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-5xl font-black text-black/35 dark:text-white/30 -rotate-12 select-none pointer-events-none tracking-widest">PREVIEW</div>
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
                    <BentoCard className="md:col-span-3 lg:col-span-4 min-h-[400px]" title="Activity Logs" subtitle="Dispute Shield" icon={ShieldCheck}>
                        <div className="p-8 pt-0 h-full flex flex-col relative">
                            <p className="text-slate-600 dark:text-slate-200 text-sm leading-relaxed mb-6">
                                We designed this to stop arguments before they start. Since files only unlock after payment,
                                you never have to chase a client. But just in case, we keep a tidy history log for you.
                            </p>
                            <div className="flex-1 bg-white dark:bg-[#3a3b56] rounded-xl border border-slate-200 dark:border-white/10 p-4 font-mono text-[10px] text-slate-500 dark:text-slate-300 overflow-hidden relative shadow-sm">
                                <div className="space-y-3 opacity-80">
                                    <div className="flex gap-2">
                                        <span className="text-brand">GET</span>
                                        <span className="text-slate-500 dark:text-slate-600">/v/preview</span>
                                        <span className="ml-auto text-slate-500 dark:text-slate-700">200 OK</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-brand">LOG</span>
                                        <span className="text-slate-400 dark:text-slate-300">Client Viewing</span>
                                        <span className="ml-auto text-slate-600 dark:text-slate-200">Active</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-brand">LCK</span>
                                        <span className="text-slate-400 dark:text-slate-300">Asset Download</span>
                                        <span className="ml-auto text-slate-600 dark:text-slate-200">Blocked</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4">
                                    <div className="px-3 py-1 bg-brand/10 border border-brand/20 rounded text-brand text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <FileCheck className="w-3 h-3" /> Tracking Active
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* 3. Direct Payments */}
                    <BentoCard className="md:col-span-6 lg:col-span-4 min-h-[400px]" title="Direct Payouts" subtitle="Seamless Transfers" icon={DollarSign}>
                        <div className="p-8 pt-0 h-full flex flex-col justify-between relative">
                            <div className="space-y-4">
                                <p className="text-slate-600 dark:text-slate-200 text-sm leading-relaxed">
                                    A seamless financial bridge. Connect your Stripe account once, and payments flow directly to you.
                                    We facilitate the instant unlocking of assets without holding or delaying your funds.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs font-bold text-black dark:text-white">
                                        <Check className="w-3 h-3 text-brand" /> Instant Availability
                                    </li>
                                    <li className="flex items-center gap-2 text-xs font-bold text-black dark:text-white">
                                        <Check className="w-3 h-3 text-brand" /> Automated Receipts
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
                                <div className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-bold uppercase rounded">Paid</div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* 4. BRAND ORCHESTRATOR */}
                    <BentoCard className="md:col-span-6 lg:col-span-8 !p-0 min-h-[540px]">
                        <div className="flex flex-col md:flex-row h-full w-full">
                            {/* LEFT: Control Panel */}
                            <div className="w-full md:w-[340px] p-8 border-b md:border-b-0 md:border-r border-zinc-200/50 dark:border-white/[0.06] flex flex-col bg-zinc-50/90 dark:bg-white/[0.03]">
                                <div>
                                    <div className="mb-8">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-serif text-2xl text-black dark:text-white tracking-wide">Your Brand</h3>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Custom Portal</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/50 dark:border-white/[0.06] flex items-center justify-center text-black dark:text-brand">
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
                                                    {accentColor === brand.color && <div className="w-2 h-2 rounded-full bg-brand" />}
                                                </div>

                                                <div className="flex-1 text-left">
                                                    <div className={`text-sm font-bold ${accentColor === brand.color ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                        {brand.name}
                                                    </div>
                                                    <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{brand.domain}</div>
                                                </div>

                                                {accentColor === brand.color && (
                                                    <Check className="w-4 h-4 text-brand" />
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
                                                    color: '#fff' // Better contrast for dark onyx
                                                }}
                                            >
                                                Unlock Files
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* 5 & 6. VERTICAL STACK: STORAGE FREEDOM & SMART CONTRACTS */}
                    <div className="md:col-span-6 lg:col-span-4 flex flex-col gap-6 min-h-[540px]">

                        {/* 5. STORAGE FREEDOM (Compressed) */}
                        <BentoCard className="min-h-[258px]" title="Storage Freedom" subtitle="BYOS (Bring Your Own Storage)" icon={HardDrive}>
                            <div className="p-6 pt-0 flex flex-col justify-between gap-4">
                                <p className="text-slate-600 dark:text-slate-200 text-xs leading-relaxed mb-4">
                                    All paid plans support BYOS links (Bring Your Own Storage). Paste your own S3/Drive/Dropbox share links so you keep full custody of the originals. (Connectors coming soon.)
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
                                                className="bg-brand h-full shadow-[0_0_10px_#bef264]"
                                                style={{ width: '34%' }}
                                            />
                                        </div>
                                    </div>
                                    {/* Options - Smaller */}
                                    <div className="flex gap-3">
                                        <div className="flex-1 p-2 rounded bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-2">
                                            <Server className="w-3 h-3 text-brand" />
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
                        <BentoCard className="min-h-[258px]" title="Formal Sign-off" subtitle="Integrated Signatures" icon={PenTool}>
                            <div className="p-6 pt-0 h-full flex flex-col">
                                <p className="text-slate-600 dark:text-slate-200 text-xs leading-relaxed mb-4">
                                    Require a digital signature approval before assets are unlocked.
                                </p>
                                <div className="flex-1 bg-zinc-50 dark:bg-white/[0.04] rounded-xl border border-zinc-200/50 dark:border-white/[0.06] p-3 relative flex flex-col justify-center items-center">
                                    <div className="w-full max-w-[140px] space-y-2">
                                        <div className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full" />
                                        <div className="h-1 w-2/3 bg-slate-200 dark:bg-white/10 rounded-full" />
                                        <div className="h-8 border-b border-slate-200 dark:border-white/20 mt-2 flex items-end">
                                            <span className="font-serif italic text-lg text-black dark:text-white opacity-80">Alex Smith</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[8px] text-slate-400 uppercase">Signed</span>
                                            <div className="w-3 h-3 bg-brand rounded-full flex items-center justify-center">
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
        <section id="pricing" className="py-32 px-6 bg-white dark:bg-cosmic text-black dark:text-white border-t border-slate-200 dark:border-white/10 transition-colors duration-700">
            <div className="max-w-[1200px] mx-auto">
                <div className="text-center mb-12">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-black dark:bg-white/10 font-mono text-xs text-brand uppercase tracking-widest mb-6 border border-white/10 shadow-lg">
                        Plans
                    </span>
                    <h2 className="font-serif text-5xl md:text-6xl mb-6">
                        Start free. <span className="italic text-brand dark:text-brand">Scale as you succeed.</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-300 text-lg max-w-2xl mx-auto">
                        Simple pricing. Professional features.
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
                        <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-black dark:text-white' : 'text-slate-500'}`}>Yearly <span className="text-brand text-[10px] ml-1 uppercase tracking-wider">Save 18%</span></span>
                    </div>
                </div>

                {/* RESPONSIVE GRID FIX: Using lg:grid-cols-3 instead of md:grid-cols-3 to prevent squishing on tablets */}
                <div className={`grid grid-cols-1 ${billingCycle === 'yearly' ? 'lg:grid-cols-2 max-w-4xl mx-auto' : 'lg:grid-cols-3'} gap-8 items-start`}>

                    {/* Starter - Only visible in Monthly - ENHANCED BORDER */}
                    {billingCycle === 'monthly' && (
                        <NetRevenueStylePanel className="flex flex-col h-full animate-fade-in hover:border-zinc-300/80 dark:hover:border-white/10 transition-colors duration-300">
                            <div className="p-8 flex flex-col flex-1 min-h-0">
                            <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-6">Starter</div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-serif font-bold">$0</span>
                                <span className="text-sm text-slate-500">/mo</span>
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-300 mb-8 min-h-[40px]">Perfect for your first secure handover.</div>

                            <button onClick={onStart} className="w-full py-4 rounded-2xl border border-slate-200 dark:border-white/20 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 font-bold text-xs uppercase tracking-widest transition-all mb-8">
                                Start Free
                            </button>

                            <div className="space-y-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/5 pb-2">Includes</p>
                                <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                    <li className="flex gap-3 items-center font-bold text-black dark:text-white"><Check className="w-4 h-4 text-brand shrink-0" /> 2.5% Platform Fee + Processing*</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> 5 Active Projects</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> 10GB Total Native Storage</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> Standard Watermarking</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> Stripe Payments Only</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-black dark:text-white shrink-0" /> Basic Audit Logs</li>
                                </ul>
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-200/50 dark:border-white/[0.06] pb-2 pt-4">Limits</p>
                                <ul className="space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
                                    <li className="flex gap-3 items-center"><Minus className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" /> No BYOS Storage Links</li>
                                    <li className="flex gap-3 items-center"><Minus className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" /> 7-Day Link Expiry</li>
                                    <li className="flex gap-3 items-center"><Minus className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" /> "Powered by" Branding</li>
                                    <li className="flex gap-3 items-center"><Minus className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" /> No Manual Payments</li>
                                </ul>
                            </div>
                            </div>
                        </NetRevenueStylePanel>
                    )}

                    {/* Studio - SOLID DEFAULT BORDER + HOVER ANIMATION & SHIFT */}
                    <div className="relative group z-10 h-full">
                        {/* The Card Container - Handling the solid border and positioning */}
                        <div className="
                        relative h-full rounded-[2rem] p-[2px]
                        bg-brand /* Default Solid Border */
                        transform transition-all duration-300 ease-out
                        lg:-translate-y-4 /* Default 'Sweet Spot' Lift only on desktop */
                        group-hover:-translate-y-2 lg:group-hover:-translate-y-6 group-hover:shadow-[0_20px_40px_-10px_rgba(190, 242, 100,0.4)] /* Hover Lift + Glow */
                    ">
                            {/* The Animated Gradient Border Layer - Only visible on hover */}
                            <div className="
                            absolute inset-0 rounded-[2rem]
                            bg-gradient-to-r from-[#bef264] via-emerald-400 to-[#bef264]
                            bg-[length:200%_auto]
                            opacity-0 group-hover:opacity-100
                            group-hover:animate-border-flow
                            transition-opacity duration-300
                        " />

                            {/* The Inner Content — clean panel inside brand ring; no grain or gradient wash */}
                            <div className="relative h-full rounded-[1.9rem] overflow-hidden flex flex-col bg-white dark:bg-charcoal">
                                <div className="relative z-10 p-8 flex flex-col flex-1 min-h-0">
                                <div className="absolute top-0 right-0 p-6">
                                    <div className="px-3 py-1 bg-brand text-black text-[10px] font-bold uppercase tracking-widest rounded-full">Sweet Spot</div>
                                </div>

                                <div className="mb-6">
                                    <span className="inline-block py-1.5 px-4 rounded-full bg-black dark:bg-white/10 font-mono text-xs text-brand uppercase tracking-widest border border-black/10 dark:border-white/10 shadow-lg">
                                        Studio
                                    </span>
                                </div>

                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-5xl font-serif font-bold text-black dark:text-white">
                                        {billingCycle === 'monthly' ? '$11.99' : '$119'}
                                    </span>
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 min-h-[40px]">For consistent delivery & branding.</div>

                                <button onClick={onStart} className="w-full py-4 rounded-2xl bg-brand text-zinc-950 hover:bg-black hover:text-brand dark:hover:bg-white dark:hover:text-zinc-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg mb-8">
                                    Get Studio
                                </button>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/50 dark:border-white/[0.06] pb-2">Everything in Starter, plus</p>
                                    <ul className="space-y-4 text-sm font-medium text-black dark:text-white">
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> <span className="font-bold">0% Platform Fees (Standard Processing Only*)</span></li>
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> <span className="font-bold">Unlimited</span> Projects</li>
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> 150GB Total Native Storage</li>
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> <span className="font-bold">10 Active BYOS Storage Links (S3/Drive)</span></li>
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> Custom Branding (Logo/Colors)</li>
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> Client Library (Recurring Clients)</li>
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> Remove "Powered By" Badge</li>
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> Manual Payments (Zelle/Wire)</li>
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> Contract Signatures</li>
                                        <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-brand shrink-0" /> Permanent Links (No Expiry)</li>
                                    </ul>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Business - Premium Dark Card - UPDATED COLOR (Lighter Slate Indigo) */}
                    <div className="relative p-1 rounded-[2rem] bg-[#45455e] border border-[#565675] shadow-2xl h-full animate-fade-in group overflow-hidden transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                        {/* Background Color - Layer 0 */}
                        <div className="absolute inset-0 bg-[#45455e] rounded-[1.9rem]"></div>

                        <div className="relative z-10 p-8 h-full flex flex-col text-white rounded-[1.9rem]">

                            <div className="absolute top-0 right-0 p-6">
                                <div className="px-3 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2 shadow-sm backdrop-blur-md">
                                    <Gem className="w-3 h-3" /> Power User
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/20 font-mono text-xs text-white uppercase tracking-widest shadow-lg backdrop-blur-md">
                                    Business
                                </span>
                            </div>

                            {/* UNIFIED GLASS TEXT: Bold price + suffix in one gradient block */}
                            <div className="font-serif font-bold text-white filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] mb-2">
                                <span className="text-5xl">
                                    {billingCycle === 'monthly' ? '$39.99' : '$390'}
                                </span>
                                <span className="text-2xl ml-1 font-normal text-indigo-200/80">
                                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                </span>
                            </div>

                            <div className="text-sm text-indigo-200/80 mb-8 min-h-[40px]">High volume infrastructure for elites.</div>

                            {/* Glassmorphism Button */}
                            <button onClick={onStart} className="w-full py-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 text-white hover:bg-white/15 hover:border-white/30 font-bold text-xs uppercase tracking-widest transition-all mb-8 shadow-lg group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                Go Business
                            </button>

                            <div className="space-y-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 border-b border-white/10 pb-2">Everything in Studio, plus</p>
                                <ul className="space-y-4 text-sm text-indigo-50">
                                    <li className="flex gap-3 items-center font-bold"><Check className="w-4 h-4 text-white shrink-0" /> 0% Platform Fees (Standard Processing Only*)</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-white shrink-0" /> 1TB Total Native Storage</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-white shrink-0" /> Unlimited BYOS Storage Links</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-white shrink-0" /> Custom Domain (CNAME)</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-white shrink-0" /> Whitelabel Emails (SMTP)</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-white shrink-0" /> Dispute Evidence Packs</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-white shrink-0" /> Priority Support</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-white shrink-0" /> Advanced Client Library Controls</li>
                                    <li className="flex gap-3 items-center"><Check className="w-4 h-4 text-white shrink-0" /> Client Portal Analytics</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 dark:text-white/40 mt-12 text-center max-w-2xl mx-auto">
                    * Processing fees refer to standard Stripe credit card processing charges (typically 2.9% + 30¢), which are deducted automatically by the payment processor.
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
                <span className="text-lg font-serif text-zinc-900 dark:text-white group-hover:text-brand dark:group-hover:text-brand transition-colors pr-8 tracking-wide">
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
    <section className="py-32 px-6 bg-editorial dark:bg-cosmic transition-colors duration-700">
        <div className="max-w-[800px] mx-auto">
            <div className="text-center mb-16">
                <span className="inline-block py-1.5 px-4 rounded-full bg-black dark:bg-white/10 font-mono text-xs text-brand uppercase tracking-widest mb-6 border border-white/10 shadow-lg">
                    Support
                </span>
                <h2 className="font-serif text-4xl md:text-5xl text-obsidian dark:text-white mb-6 tracking-wide">Common Questions</h2>
            </div>

            <NetRevenueStylePanel roundedClass="rounded-[2rem]">
                <div className="p-8 md:p-12">
                <FAQItem
                    question="What is TrueHandover?"
                    answer="TrueHandover is a secure asset gateway designed for the creative economy. Think of it as a 'vending machine' for your business. It automates the final exchange of work for payment. You upload deliverables to a protected portal where clients can review watermarked previews. The high-resolution files are secured and instantly released only after payment is verified."
                />
                <FAQItem
                    question="Is TrueHandover an escrow platform?"
                    answer="No. TrueHandover is a technical delivery protocol, not a financial escrow service. We facilitate payments using Stripe Connect. We do not take custody of your funds. The payment is processed by Stripe and routed to your connected account immediately. This reduces liability and keeps you in control."
                />
                <FAQItem
                    question="How do I get paid?"
                    answer="We integrate with Stripe Connect to handle payouts instantly. We also support a 'Digital Handshake' for manual payments. If a client prefers Zelle, Venmo, or Wire Transfer, they can mark the invoice as 'Paid' manually. The files remain locked in a 'Verification Pending' state until you, the creator, confirm receipt of funds in your banking app. Once confirmed, the vault unlocks automatically."
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
                    answer="It can be! We offer secure native storage where we hold the files for you. However, for Agency plans, we also offer 'BYOS' (Bring Your Own Storage). In BYOS mode, files remain in your own S3 bucket or Drive account—we simply gate access to the download links, meaning we never take custody of your actual files."
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
        <div className="max-w-[1200px] mx-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#2D2E45]/95 backdrop-blur-xl shadow-2xl p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="pr-2">
                    <p className="text-sm font-bold text-obsidian dark:text-white">Cookie settings</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        We use essential cookies to keep TrueHandover secure and working. Optional cookies help us improve performance and product analytics.
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
                        className="px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest bg-black dark:bg-brand text-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
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
                    <span className="font-serif text-xl tracking-tight">TrueHandover</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-serif italic text-lg tracking-wide">Creative delivery, finally done right.</p>

                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                    <a href="https://youtube.com/@truehandover" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full hover:text-black dark:hover:text-white transition-colors" aria-label="YouTube">
                        <Youtube className="w-4 h-4" />
                    </a>
                    <a href="https://x.com/TrueHandover" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full hover:text-black dark:hover:text-white transition-colors" aria-label="X (Twitter)">
                        <BrandXIcon className="w-4 h-4" />
                    </a>
                    <a href="https://discord.gg/TrueHandover" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full hover:text-black dark:hover:text-white transition-colors" aria-label="Discord">
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
                © 2026 TrueHandover Ltd.
            </div>
        </div>
    </footer>
);

export default function LandingPage({ onGetStarted, onQuickStartWithFiles, currentTheme, onSetThemeMode, toggleTheme }: { onGetStarted: () => void, onQuickStartWithFiles?: (files: File[]) => void, currentTheme: 'light' | 'dark' | 'system', onSetThemeMode: (mode: 'light' | 'dark' | 'system') => void, toggleTheme?: () => void }) {

    // Removed internal state management for theme to rely on parent App state
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
    const [isDropActive, setIsDropActive] = useState(false);
    const quickUploadInputRef = useRef<HTMLInputElement | null>(null);
    const dragCounterRef = useRef(0);
    const [cookieConsent, setCookieConsent] = useState<CookieConsentChoice>(() => {
        if (typeof window === 'undefined') return 'unknown';
        const saved = window.localStorage.getItem('th_cookie_consent');
        if (saved === 'essential' || saved === 'all') return saved;
        return 'unknown';
    });

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

    return (
        <div
            className="min-h-screen bg-editorial dark:bg-cosmic text-black dark:text-white font-sans selection:bg-brand selection:text-black transition-colors duration-700"
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

            {isDropActive && (
                <div className="fixed inset-0 z-[1200] pointer-events-none bg-black/40 dark:bg-[#323242]/60 backdrop-blur-[2px]">
                    <div className="absolute inset-0 flex items-center justify-center px-6">
                        <div className="rounded-3xl border border-white/20 bg-white/90 dark:bg-[#2D2E45]/90 shadow-2xl px-8 py-10 text-left max-w-lg w-full">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Quick start</p>
                            <h3 className="font-serif text-3xl sm:text-4xl text-zinc-900 dark:text-white mb-4">Drop to deliver</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-5 leading-relaxed">
                                We&apos;ll load your files into <strong className="text-zinc-800 dark:text-white">Quick delivery</strong>. Next you&apos;ll add client details, choose a link or email, publish, then share the vault.
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

            {/* Floating Theme Toggle — desktop only, aligned to the right edge of the nav pill */}
            <div
                className="fixed left-0 right-0 z-[999] hidden md:flex pointer-events-none px-6"
                style={{ paddingTop: 'max(32px, calc(env(safe-area-inset-top, 0px) + 18px))' }}
            >
                <div className="max-w-[1200px] mx-auto w-full flex justify-end pointer-events-none">
                    <div className="translate-x-14 py-3 pointer-events-auto">
                        <ThemeModeDropdown
                            themeMode={currentTheme}
                            onChange={onSetThemeMode || (() => toggleTheme?.())}
                            isDarkMode={currentTheme === 'dark'}
                            align="right"
                            buttonClassName="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 hover:text-black dark:text-slate-300 dark:hover:text-white bg-white/80 dark:bg-[#323242]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 shadow-2xl transition-all hover:scale-105"
                        />
                    </div>
                </div>
            </div>
            {/* Nav receives isHidden prop to create cinema mode */}
            <Nav onStart={openGetStartedModal} currentTheme={currentTheme} onSetThemeMode={onSetThemeMode || (() => toggleTheme?.())} isHidden={isVideoOpen} />
            <main>
                <Hero onStart={openGetStartedModal} onWatchVideo={() => setIsVideoOpen(true)} />
                <ComparisonSection />
                <BentoGrid />
                <Pricing onStart={openGetStartedModal} />
                <FAQSection />
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
