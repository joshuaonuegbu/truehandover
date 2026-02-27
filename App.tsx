import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams, Outlet, Link } from 'react-router-dom';
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
    Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar, Cell, Legend, ReferenceLine, YAxis, Pie, PieChart as RePieChart } from 'recharts';
import { playClick, playSuccess } from './utils/sound';
import LandingPage from './components/LandingPage';
import SignInPage from './components/SignInPage';
import CreatorPage from './components/CreatorPage';
import ClientPreviewBiz from './components/ClientPreviewBiz';
import TrashPage from './components/TrashPage';
import HelpPage from './components/HelpPage';
import SettingsPage from './components/SettingsPage';
import ReportsView from './components/ReportsView';
import ActivityView from './components/ActivityView';
import { Card, Badge, GRADIENT_TEXT } from './components/Shared';
import ThemeModeDropdown from './components/ThemeModeDropdown';
import DesignShowcase from './components/DesignShowcaseHiFi';
import { supabase } from './services/supabaseClient';
import { Project, UserProfile, ViewState, FileAsset } from './types';
import { StoreProvider, useStore } from './context/StoreContext';

// --- CONSTANTS ---
// OPTIMIZED: High-Fidelity Fine Grain SVG
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

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

const StatusRibbon = () => {
    return (
        <div className="flex flex-wrap items-center gap-4 md:gap-8 p-4 bg-white/50 dark:bg-[#23232e] border border-slate-200 dark:border-white/5 rounded-2xl mb-8 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Stripe Connect: <span className="text-lime-600 dark:text-[#bef264]">Active</span></span>
            </div>

            <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-white/10" />

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Banknote className="w-3.5 h-3.5" />
                <span>Next Payout: <span className="text-slate-900 dark:text-white">17:00 EST</span></span>
            </div>

            <div className="ml-auto flex items-center gap-4">
                {/* REVAMPED STORAGE WIDGET: Bigger, bolder, new design */}
                <div className="flex items-center gap-4 pl-2 pr-6 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:shadow-md group">
                    <div className="p-2.5 rounded-xl bg-lime-50 dark:bg-[#bef264]/10 text-lime-600 dark:text-[#bef264] group-hover:scale-105 transition-transform">
                        <HardDrive className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <div className="flex justify-between items-center leading-none">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Storage Usage</span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">2.4GB <span className="opacity-50">/ 30GB</span></span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-lime-600 dark:bg-[#bef264] w-[8%] rounded-full shadow-[0_0_12px_rgba(132,204,22,0.6)]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Timeline = () => {
    // ... Timeline implementation ...
    const activities = [
        { date: 'Today', title: 'Payment Received', subtitle: 'Brand Identity', icon: CreditCardIcon, color: 'lime' },
        { date: 'Yesterday', title: 'File Uploaded', subtitle: 'logo_final.png', icon: Upload, color: 'white' },
        { date: '28.09', title: 'Client Viewed', subtitle: 'Website Redesign', icon: Eye, color: 'orange' },
        { date: '27.09', title: 'Invoice Sent', subtitle: '#INV-2023-001', icon: FileText, color: 'white' },
        { date: '26.09', title: 'Project Created', subtitle: 'Q4 Report', icon: Plus, color: 'lime' },
        { date: '25.09', title: 'Vault Locked', subtitle: '3 Files', icon: Lock, color: 'white' },
        { date: '24.09', title: 'New Client', subtitle: 'Vertex Corp', icon: User, color: 'orange' },
        { date: '22.09', title: 'Project Created', subtitle: 'App Design', icon: Plus, color: 'white' },
        { date: '20.09', title: 'File Uploaded', subtitle: 'mockup.fig', icon: Upload, color: 'white' },
        { date: '18.09', title: 'Contract Signed', subtitle: 'Vertex Corp', icon: FileText, color: 'lime' },
        { date: '17.09', title: 'Client Viewed', subtitle: 'Brand Identity', icon: Eye, color: 'orange' },
        { date: '15.09', title: 'Project Started', subtitle: 'Brand Identity', icon: Plus, color: 'lime' },
    ];

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


const CyclingWidget = () => {
    const [cycleIndex, setCycleIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const duration = 10000; // 10 seconds per slide
    const interval = 50; // Update frequency

    useEffect(() => {
        let timer: any;
        if (!isPaused && !isReplying) {
            timer = setInterval(() => {
                setProgress((prev) => {
                    const next = prev + (interval / duration) * 100;
                    if (next >= 100) {
                        setCycleIndex((idx) => (idx + 1) % 5); // Updated to 5 slides
                        return 0;
                    }
                    return next;
                });
            }, interval);
        }
        return () => clearInterval(timer);
    }, [isPaused, isReplying]);

    // Reset progress when manually changing slides
    const manualChange = (index: number) => {
        setCycleIndex(index);
        setProgress(0);
        setIsReplying(false);
    };

    const slides = [
        {
            id: 'revenue',
            render: () => (
                <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between h-full bg-white dark:bg-[#23232e] rounded-3xl transition-all duration-700 ease-in-out">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Revenue (Oct)</span>
                            <div className="flex items-center gap-1 text-lime-600 dark:text-[#bef264] font-bold text-[10px] bg-lime-50 dark:bg-[#bef264]/10 px-2 py-1 rounded-full border border-lime-100 dark:border-[#bef264]/20">
                                <ArrowUpRight className="w-3 h-3" /> 12.5%
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 mb-6">
                            <PrivacyBlur strength="strong" className={`font-serif text-5xl md:text-6xl tracking-tighter ${GRADIENT_TEXT}`}>$24,500.00</PrivacyBlur>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300"><PrivacyBlur>$4,200.00</PrivacyBlur> Pending</span>
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
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">85% Used</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <div className="flex items-baseline gap-2">
                            <span className="font-serif text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight">25.5</span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">GB / 30 GB</span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="w-full h-2.5 flex rounded-full overflow-hidden gap-0.5 bg-slate-100 dark:bg-white/5">
                                <div className="h-full bg-indigo-500 w-[45%]" />
                                <div className="h-full bg-sky-400 w-[25%]" />
                                <div className="h-full bg-lime-400 w-[15%]" />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Video (13GB)</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Images (7GB)</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-lime-400" /> Docs (5GB)</span>
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
    const [projectTab, setProjectTab] = useState<'pending' | 'draft' | 'paid'>('pending');

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

    const liveClients = [
        { id: 1, name: 'John Smith', project: 'Brand Identity', status: 'viewing', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=JohnSmith&backgroundColor=18181b&shape1Color=3b82f6&shape2Color=93c5fd&shape3Color=1e3a8a' },
        { id: 2, name: 'Sarah Chen', project: 'Website Redesign', status: 'idle', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=SarahChen&backgroundColor=0f172a&shape1Color=f472b6&shape2Color=fbcfe8&shape3Color=831843' },
        { id: 3, name: 'Mike Ross', project: 'Mobile App', status: 'offline', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=MikeRoss&backgroundColor=27272a&shape1Color=a78bfa&shape2Color=ddd6fe&shape3Color=5b21b6' },
    ];

    const alerts = [
        { id: 1, type: 'critical', message: 'Signature Required: Vertex Contract', icon: FileWarning },
        { id: 2, type: 'warning', message: 'Vault Link Expiring: 2h remaining', icon: Clock },
        { id: 3, type: 'info', message: 'Payment Verified: $2,500.00', icon: Verified },
    ];

    return (
        <div className="space-y-6 animate-slide-up relative z-10 pb-12">
            <div className="flex flex-col gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h1 className="font-serif text-3xl md:text-5xl text-slate-900 dark:text-white leading-tight mb-2">
                            <span className={GRADIENT_TEXT}>{getGreeting()}</span>, <span className="italic text-lime-600 dark:text-[#bef264]">{user.name.split(' ')[0]}.</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Here's your project overview for today.</p>
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

            {/* Status Ribbon - Now part of dashboard logic */}
            <StatusRibbon />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12">
                <div className="xl:col-span-8 flex flex-col gap-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* CYCLING WIDGET COMPONENT */}
                        <CyclingWidget />

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-1 pt-1">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Siren className="w-3.5 h-3.5 text-red-500" /> Action Center
                                </h3>
                                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-lg shadow-red-500/30">3 Alerts</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                                {alerts.map((alert) => (
                                    <div key={alert.id} className="bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer group shadow-sm flex-1">
                                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${alert.type === 'critical' ? 'bg-red-500/10 text-red-500' : alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            <alert.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{alert.type === 'critical' ? 'Urgent' : 'Notice'}</p>
                                                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Dismiss</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{alert.message}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
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
                                <div className="py-20 flex flex-col items-center justify-center opacity-40">
                                    <Briefcase className="w-12 h-12 mb-4 stroke-1" />
                                    <p className="font-serif text-xl italic">No active projects in this ledger.</p>
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
                                                <img src={p.client.avatar} className="w-12 h-12 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" />
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
                        <button onClick={() => navigate('/vault')} className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 group transition-colors">
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
                            <Timeline />
                        </div>
                        <button className="w-full mt-6 py-4 rounded-xl border border-dashed border-slate-300 dark:border-white/20 text-xs font-bold uppercase text-slate-400 hover:text-slate-600 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/40 transition-all flex items-center justify-center gap-2 flex-shrink-0">
                            Load Previous Days
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VaultView = ({ projects }: { projects: Project[] }) => {
    // ... same as before
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [vaultFilter, setVaultFilter] = useState<'all' | 'active' | 'paid' | 'archived'>('all');

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
                    <button className="p-3 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/5 transition-colors"><LayoutGrid className="w-5 h-5" /></button>
                    <button className="p-3 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/5 transition-colors"><ListIcon className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:gap-12">
                {visibleProjects.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center opacity-50">
                        <Search className="w-10 h-10 mb-4 stroke-1" />
                        <p className="font-serif text-xl italic">No projects matched your search.</p>
                    </div>
                )}
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
                                        <button onClick={() => { playClick(); navigate(`/editor/${project.id}`); }} className="flex-shrink-0 w-40 h-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-lime-600 dark:hover:border-[#bef264] hover:bg-lime-50 dark:hover:bg-[#bef264]/5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group/add">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover/add:bg-lime-600 dark:group-hover/add:bg-[#bef264] transition-colors">
                                                <Plus className="w-5 h-5 text-slate-400 group-hover/add:text-white dark:group-hover/add:text-black" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover/add:text-lime-700 dark:group-hover/add:text-[#bef264]">Add Asset</span>
                                        </button>
                                        {project.files.map(f => (
                                            <div key={f.id} className="flex-shrink-0 w-28 h-36 sm:w-32 sm:h-40 lg:w-40 lg:h-48 bg-slate-50 dark:bg-[#1c1c21] rounded-xl lg:rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden group/file relative hover:scale-110 hover:z-50 hover:shadow-2xl transition-all duration-300 ease-out origin-center">
                                                <div className="h-20 sm:h-24 lg:h-32 w-full bg-slate-200 dark:bg-white/5 relative overflow-hidden">
                                                    {f.previewUrl ? <img src={f.previewUrl} className="w-full h-full object-cover transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">{getFileIcon(f.type)}</div>}
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
                                        <div className="hidden lg:block h-6 w-px bg-slate-300 dark:bg-white/10 mx-1" />
                                        <button onClick={() => navigate(`/editor/${project.id}`)} className="h-9 lg:h-10 w-9 lg:w-auto lg:px-4 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-lime-50 dark:hover:bg-[#bef264]/10 hover:border-lime-200 dark:hover:border-[#bef264]/30 transition-all flex items-center justify-center gap-2"><Pencil className="w-3.5 h-3.5" /><span className="hidden lg:inline"> Edit</span></button>
                                        <button className="h-9 lg:h-10 w-9 lg:w-10 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
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

const AppLayout = ({ user, projects, isDarkMode, themeMode, onSetThemeMode, togglePrivacyMode, privacyMode }: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false); // NEW State
    const [showDesignLab, setShowDesignLab] = useState(false);

    // Determine current view state based on pathname for active highlighting
    const currentPath = location.pathname.split('/')[1] || 'dashboard';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'vault', label: 'Vault', icon: LockKeyhole },
        { id: 'activity', label: 'Activity', icon: ActivityIcon },
        { id: 'reports', label: 'Reports', icon: PieChartIcon },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

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
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
                setIsProfileOpen(false);
            }
        }
        document.addEventListener('keydown', handleDown);
        return () => document.removeEventListener('keydown', handleDown);
    }, []);

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

        const routeItems = useMemo(() => ([
            { id: 'route-dashboard', title: 'Dashboard', subtitle: 'View your overview', icon: LayoutDashboard, action: () => navigate('/dashboard') },
            { id: 'route-vault', title: 'Vault', subtitle: 'Project and file ledger', icon: LockKeyhole, action: () => navigate('/vault') },
            { id: 'route-activity', title: 'Activity', subtitle: 'Recent actions and logs', icon: ActivityIcon, action: () => navigate('/activity') },
            { id: 'route-reports', title: 'Reports', subtitle: 'Revenue and metrics', icon: PieChartIcon, action: () => navigate('/reports') },
            { id: 'route-settings', title: 'Settings', subtitle: 'Profile and integrations', icon: Settings, action: () => navigate('/settings') },
        ]), [navigate]);

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

        const results = [...routeResults, ...projectResults].slice(0, 12);
        const topResult = results[0];

        const executeResult = (action: () => void) => {
            playClick();
            action();
            onClose();
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4">
                <div className="absolute inset-0 bg-slate-900/20 dark:bg-black/40 transition-colors duration-300" onClick={onClose} />
                <div className="relative w-full max-w-2xl bg-white dark:bg-[#1a1a23] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-slide-up ring-1 ring-black/5">
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-white/5">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && topResult) {
                                    e.preventDefault();
                                    executeResult(topResult.action);
                                }
                            }}
                            placeholder="Search projects, files, clients, or routes..."
                            className="flex-1 bg-transparent outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                        />
                        <div className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-white/10">ESC</div>
                    </div>
                    <div className="p-2 max-h-[420px] overflow-y-auto">
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {query.trim() ? 'Results' : 'Quick Access'}
                        </div>
                        {results.length === 0 && (
                            <div className="px-4 py-8 text-sm text-slate-500 dark:text-slate-400">No matches found. Try another keyword.</div>
                        )}
                        {results.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => executeResult(result.action)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left group"
                            >
                                <result.icon className="w-4 h-4 text-slate-400 group-hover:text-lime-600 dark:group-hover:text-[#bef264]" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{result.title}</span>
                                    <span className="text-xs text-slate-400 block truncate">{result.subtitle}</span>
                                </div>
                                <span className="ml-auto text-xs text-slate-400">{result.kind}</span>
                            </button>
                        ))}
                    </div>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] text-slate-400">
                        <span><strong>Enter</strong> to open top result</span>
                        <span><strong>Esc</strong> to close</span>
                    </div>
                </div>
            </div>
        );
    };

    const ProfileMenu = () => (
        <div className="absolute top-16 right-0 w-80 bg-white/90 dark:bg-[#1a1a23]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 animate-fade-in z-50 origin-top-right">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
                <div className="relative">
                    <img src={user?.avatar || 'https://api.dicebear.com/9.x/shapes/svg?seed=User&backgroundColor=0a0a0a&shape1Color=bef264&shape2Color=ffffff&shape3Color=52525b'} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="Profile" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-lime-500 rounded-full border-2 border-white dark:border-[#1a1a23] flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{user.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{user.email}</p>
                    <span className="text-[10px] font-bold uppercase text-lime-600 dark:text-[#bef264] tracking-wider mt-1 block">Pro Plan</span>
                </div>
            </div>

            {/* Notifications */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Recent Activity</span>
                    <button className="text-[10px] font-bold text-lime-600 dark:text-[#bef264] hover:underline">Mark all read</button>
                </div>
                <div className="space-y-1">
                    <div className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-lime-600 dark:group-hover:text-[#bef264] transition-colors">Payment Received</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Vertex Corp paid $2,500.00</p>
                        </div>
                        <span className="ml-auto text-[9px] text-slate-400 font-mono">2m</span>
                    </div>
                    <div className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-lime-600 dark:group-hover:text-[#bef264] transition-colors">File Downloaded</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Sarah viewed 'Brand_Final.zip'</p>
                        </div>
                        <span className="ml-auto text-[9px] text-slate-400 font-mono">1h</span>
                    </div>
                </div>
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

            <button onClick={() => { setIsProfileOpen(false); navigate('/signin'); }} className="w-full mt-4 py-2 text-[10px] font-bold uppercase text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                <LogOut className="w-3 h-3" /> Sign Out
            </button>
        </div>
    );

    return (
        <div className="min-h-screen font-sans bg-[#f0f2f5] dark:bg-cosmic text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden relative">
            {/* AMBIENT BACKGROUND EFFECTS */}
            <BackgroundOrbs />
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-grain mix-blend-overlay dark:block hidden"></div>

            {/* FIXED HEADER STACK - UPDATED DESIGN (NO TICKER) */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#f0f2f5]/90 dark:bg-cosmic/90 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 transition-colors duration-500">
                <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Content */}
                    <div className="flex flex-row items-center justify-between h-20 gap-4">

                        {/* Left: Brand - UPDATED: Clean Design (No Island) */}
                        <div className="flex items-center gap-3 cursor-pointer group flex-shrink-0 scale-[1.05] origin-left" onClick={() => { playClick(); navigate('/'); }}>
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
                        <div className="flex items-center justify-end gap-3 flex-shrink-0">

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

                            {/* Design Lab Button */}
                            <button
                                onClick={() => { playClick(); setShowDesignLab(true); }}
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-lime-100 dark:hover:bg-[#bef264]/10 hover:text-lime-700 dark:hover:text-[#bef264] transition-all"
                                title="Design Lab — Preview UI variants"
                            >
                                <Sparkles className="w-5 h-5" />
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
                                        <img src={user?.avatar || 'https://api.dicebear.com/9.x/shapes/svg?seed=User&backgroundColor=0a0a0a&shape1Color=bef264&shape2Color=ffffff&shape3Color=52525b'} className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 shadow-sm object-cover" alt="Profile" />
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

            {/* MAIN CONTENT GRID (Padded top to clear fixed header - reduced since ticker is gone) */}
            <main className={`w-full max-w-[99%] mx-auto px-3 md:px-5 lg:px-7 pb-24 lg:pb-16 pt-[100px] min-h-[500px] relative z-10 transition-all duration-300 font-sans`}>
                <Outlet context={{ privacyMode }} />
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

            {/* Design Lab Overlay */}
            {showDesignLab && (
                <DesignShowcase
                    isDarkMode={isDarkMode}
                    onClose={() => setShowDesignLab(false)}
                />
            )}
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

const AppContent = () => {
    const [privacyMode, setPrivacyMode] = useState(false);
    // Read theme from URL hash query params (for iframe sync)
    const getInitialTheme = (): 'light' | 'dark' | 'system' => {
        try {
            const hash = window.location.hash;
            const qIndex = hash.indexOf('?');
            if (qIndex !== -1) {
                const params = new URLSearchParams(hash.substring(qIndex));
                const t = params.get('theme');
                if (t === 'light' || t === 'dark' || t === 'system') return t;
            }
        } catch { }
        return 'system';
    };
    const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(getInitialTheme());
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstVisitThemeNotice, setFirstVisitThemeNotice] = useState<string | null>(null);

    // -- STATE MANAGEMENT via Store --
    const { projects, user, saveProject, updateUser } = useStore();

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
            const isPreviewRoute = window.location.hash.startsWith('#/preview/') || window.location.hash.startsWith('#/c/');
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

    return (
        <PrivacyContext.Provider value={{ privacyMode, togglePrivacyMode }}>
            <HashRouter>
                <div className={`font-sans min-h-screen ${isDarkMode ? 'dark' : ''}`}>
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
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <LandingPage
                                    onGetStarted={() => window.location.hash = '#/dashboard'}
                                    currentTheme={themeMode}
                                    onSetThemeMode={setThemeMode}
                                    toggleTheme={cycleTheme}
                                />
                            }
                        />
                        <Route path="/signin" element={<SignInPage themeMode={themeMode} toggleTheme={cycleTheme} />} />
                        <Route path="/c/:token" element={<ClientLinkWrapper isDarkMode={isDarkMode} themeMode={themeMode} onToggleTheme={cycleTheme} onSetThemeMode={setThemeMode} />} />
                        <Route element={<AppLayout
                            user={user}
                            projects={projects}
                            isDarkMode={isDarkMode}
                            themeMode={themeMode}
                            onSetThemeMode={setThemeMode}
                            setIsDarkMode={setIsDarkMode} // Kept for legacy prop compatibility if needed
                            togglePrivacyMode={togglePrivacyMode}
                            privacyMode={privacyMode}
                        />}>
                            <Route path="/dashboard" element={<DashboardView projects={projects} user={user} />} />
                            <Route path="/activity" element={<ActivityView />} />
                            <Route path="/vault" element={<VaultView projects={projects} />} />
                            <Route path="/reports" element={<ReportsView />} />
                            {/* @ts-ignore - Prop will be added in next step */}
                            <Route path="/settings" element={<SettingsPage user={user} onUpdateUser={updateUser} />} />
                            <Route path="/trash" element={<TrashPage onBack={() => window.history.back()} />} />
                            <Route path="/help" element={<HelpPage onBack={() => window.history.back()} />} />
                        </Route>
                        <Route path="/create" element={<CreatorWrapper projects={projects} onSave={saveProject} user={user} />} />

                        {/* Dynamic Route Handlers */}
                        <Route path="/editor/:id" element={<EditorWrapper projects={projects} onSave={saveProject} user={user} />} />
                        {/* Updated Route: Passing dynamic user prop */}
                        <Route path="/preview/:id" element={<PreviewWrapper projects={projects} user={user} isDarkMode={isDarkMode} themeMode={themeMode} onToggleTheme={cycleTheme} onSetThemeMode={setThemeMode} />} />
                    </Routes>
                </div>
            </HashRouter>
        </PrivacyContext.Provider>
    );
};

export default function App() {
    return (
        <StoreProvider>
            <AppContent />
        </StoreProvider>
    );
}
