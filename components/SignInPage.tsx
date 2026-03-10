
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowRight, Loader2, Sun, Moon, Monitor,
    ArrowLeft, Lock, Activity, ShieldCheck
} from 'lucide-react';
import { playClick, playSuccess } from '../utils/sound';
import { InlineErrorBanner } from './Shared';
import { supabase } from '../services/supabaseClient';
import { setMockModeAndNavigate } from '../config/mockMode';

const EditorialIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 15C4 10.6 9.4 7 16 7C22.6 7 28 10.6 28 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="22" r="6" fill="#bef264" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

// --- SECURE HANDOVER CARD (TrueHandover Identity) ---
const EnhancedMonolith = ({ focusedField, email, password }: { focusedField: string | null, email: string, password: string }) => {
    const totalInputLength = email.length + password.length;
    const energyLevel = Math.min(1, totalInputLength / 28);
    const progressWidth = Math.max(18, Math.round(18 + energyLevel * 76));
    const pulseScale = 1 + energyLevel * 0.08;
    const statusLabel = password.length > 0
        ? 'Cipher warming'
        : email.length > 0
            ? 'Identity sync'
            : 'Awaiting input';
    const signalBars = [0, 1, 2, 3, 4].map((idx) => {
        const base = 18 + idx * 5;
        const lift = Math.min(26, Math.round(totalInputLength * (idx + 1) * 0.45));
        return Math.min(42, base + lift);
    });

    return (
        <div className="relative w-full h-full flex items-center justify-center perspective-[2000px] overflow-visible">
            {/* Ambient Background Blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-400/20 dark:bg-lime-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

            {/* FOCAL TEXTURE VIGNETTE - SUBTLE TECH GRID */}
            <div className="absolute inset-[-50%] pointer-events-none z-50 hidden dark:block"
                style={{
                    backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                    maskImage: 'radial-gradient(closest-side at center, black 0%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(closest-side at center, black 0%, transparent 100%)',
                    opacity: 0.03
                }}
            />

            {/* The Card Structure */}
            <div className="relative z-10 w-80 h-[28rem] transform-style-3d animate-elegant-float group">

                {/* Back Plate - Structural Foundation */}
                <div className={`absolute inset-0 w-full h-full bg-slate-200/50 dark:bg-[#1c1c1f]/80 rounded-[3rem] shadow-2xl transform transition-all duration-1000 ease-out border-[0.5px] border-black/5 dark:border-white/10 overflow-hidden ${focusedField ? 'rotate-3 scale-[1.02] shadow-[0_30px_60px_-15px_rgba(132,204,22,0.3)]' : 'rotate-6 group-hover:rotate-3'}`} style={{ transform: focusedField ? `rotate(3deg) scale(${pulseScale.toFixed(3)})` : undefined }}>
                    {/* Blurred preview grid */}
                    <div className="absolute inset-0 grid grid-cols-2 gap-1 p-4 opacity-30 dark:opacity-20">
                        <div className="rounded-xl bg-slate-300 dark:bg-white/10" />
                        <div className="rounded-xl bg-slate-300 dark:bg-white/10" />
                        <div className="rounded-xl bg-slate-300 dark:bg-white/10" />
                        <div className="rounded-xl bg-slate-300 dark:bg-white/10" />
                    </div>
                    <div className="absolute inset-0 backdrop-blur-md" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-slate-400/50 dark:text-white/10" />
                    </div>
                </div>

                {/* Middle Glass Facet — shows auth context */}
                <div className={`absolute top-4 left-4 w-full h-full bg-white/20 dark:bg-[#232328]/40 backdrop-blur-xl rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] transform transition-all duration-1000 ease-out border-[0.5px] border-black/5 dark:border-white/10 flex flex-col justify-center overflow-hidden px-8 ${focusedField ? '-rotate-1 scale-[1.01]' : '-rotate-3 group-hover:-rotate-1'}`}>
                    {/* Mini auth field indicators */}
                    <div className="space-y-4 opacity-60">
                        <div className={`h-8 rounded-lg border transition-all duration-500 flex items-center px-3 gap-2 ${focusedField === 'email' ? 'border-lime-500 dark:border-[#bef264] bg-lime-50/50 dark:bg-[#bef264]/5 scale-[1.02]' : 'border-slate-200/50 dark:border-white/10'}`}>
                            <div className={`w-1 h-4 rounded-full transition-colors duration-300 ${focusedField === 'email' ? 'bg-lime-500 dark:bg-[#bef264] animate-pulse' : 'bg-slate-300 dark:bg-white/20'}`} />
                            <span className={`text-[8px] font-mono tracking-wider truncate ${focusedField === 'email' ? 'text-lime-700 dark:text-[#bef264]' : 'text-slate-400'}`}>
                                {email || 'email@example.com'}
                            </span>
                        </div>
                        <div className={`h-8 rounded-lg border transition-all duration-500 flex items-center px-3 gap-2 ${focusedField === 'password' ? 'border-lime-500 dark:border-[#bef264] bg-lime-50/50 dark:bg-[#bef264]/5 scale-[1.02]' : 'border-slate-200/50 dark:border-white/10'}`}>
                            <div className={`w-1 h-4 rounded-full transition-colors duration-300 ${focusedField === 'password' ? 'bg-lime-500 dark:bg-[#bef264] animate-pulse' : 'bg-slate-300 dark:bg-white/20'}`} />
                            <span className={`text-[8px] font-mono tracking-wider ${focusedField === 'password' ? 'text-lime-700 dark:text-[#bef264]' : 'text-slate-400'}`}>
                                {password ? '•'.repeat(Math.min(password.length, 16)) : '••••••••'}
                            </span>
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent" />
                </div>

                {/* Front Card — Secure Handover Dashboard */}
                <div className="absolute top-8 left-0 w-full h-full bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border-[0.5px] border-white dark:border-white/10 transform transition-all duration-1000 ease-out group-hover:-translate-y-2 flex flex-col relative overflow-hidden">
                    {/* Premium Light Sweep */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

                    <div className="flex-1 p-10 flex flex-col justify-between relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-[#bef264] flex items-center justify-center shadow-[0_10px_30px_rgba(190,242,100,0.3)]">
                                <EditorialIcon className="w-7 h-7 text-black" />
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                                Protected Access
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* File count + encryption */}
                            <div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Secure Vault</div>
                                <div className="text-3xl font-serif text-slate-900 dark:text-white tracking-tight leading-none">8 Assets</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono tracking-wider">AES-256 · End-to-End</div>
                            </div>

                            {/* Milestone Progress */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Progress</span>
                                    <span className="text-[9px] font-bold text-lime-600 dark:text-[#bef264]">2 of 3</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200/50 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-lime-500 to-[#bef264] rounded-full transition-all duration-700" style={{ width: `${progressWidth}%` }} />
                                </div>
                                <div className="mt-3 flex items-end gap-1.5 h-11">
                                    {signalBars.map((height, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2 rounded-full transition-all duration-500 ${focusedField ? 'bg-lime-500/80 dark:bg-[#bef264]/80' : 'bg-slate-300 dark:bg-white/20'}`}
                                            style={{ height: `${height}%` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="h-[0.5px] w-full bg-slate-200 dark:bg-white/10" />
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-lime-600 dark:bg-[#bef264] animate-pulse shadow-[0_0_8px_rgba(101,163,13,0.5)] dark:shadow-[0_0_8px_rgba(190,242,100,0.4)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{statusLabel}</span>
                                </div>
                                <Activity className="w-7 h-7 text-lime-600 dark:text-[#bef264]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Badge: Payment Verified */}
                <div className="absolute -right-10 top-1/4 px-4 py-3 bg-white dark:bg-[#2a2a2e] rounded-2xl shadow-2xl border-[0.5px] border-slate-100 dark:border-white/5 animate-float-delayed z-20 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#bef264] flex items-center justify-center">
                        <ShieldCheck className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap">Verified</span>
                </div>
            </div>
        </div>
    );
};

interface SignInPageProps {
    themeMode?: 'light' | 'dark' | 'system';
    toggleTheme?: () => void;
}

export default function SignInPage({ themeMode = 'light', toggleTheme }: SignInPageProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const searchParams = new URLSearchParams(location.search);
    const signInSource = searchParams.get('from');
    const rawReturnTo = searchParams.get('returnTo');
    const returnTo = rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
        ? rawReturnTo
        : '/dashboard';
    const showBackButton = signInSource === 'landing' || signInSource === 'mode-switch';

    const handleBack = () => {
        playClick();

        if (signInSource === 'mode-switch') {
            setMockModeAndNavigate(true, returnTo);
            return;
        }

        navigate('/', { replace: true });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedEmail = email.trim();
        if (!normalizedEmail || !password.trim()) {
            setFormError('Enter both email and password to continue.');
            return;
        }
        if (!supabase) {
            setFormError("Supabase connection missing. Check .env configuration.");
            return;
        }

        playClick();
        setFormError(null);
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password: password,
                    options: { data: { name: normalizedEmail.split('@')[0] } }
                });
                if (error) throw error;
                // Wait for session sync or assume signed in:
                playSuccess();
                navigate(returnTo, { replace: true });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password: password,
                });
                if (error) throw error;
                playSuccess();
                navigate(returnTo, { replace: true });
            }
        } catch (err: any) {
            setFormError(err.message || "Failed to authenticate.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#FDFDFB] dark:bg-[#121214] text-[#1a1a1a] dark:text-white transition-colors duration-1000 font-sans selection:bg-lime-200 dark:selection:bg-lime-900 overflow-hidden relative">

            {/* Crisp film grain — visible in both modes */}
            <div className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply dark:mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundSize: '250px 250px',
                    filter: 'contrast(1700%) brightness(102%)',
                    opacity: 0.05
                }}
            />
            <div className="absolute inset-0 pointer-events-none z-0 hidden dark:block mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundSize: '250px 250px',
                    filter: 'contrast(2100%) brightness(102%)',
                    opacity: 0.56
                }}
            />

            {/* Left Column: Sign In Interface */}
            <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-8 md:px-16 lg:px-20 xl:px-24 relative z-10 bg-white/50 dark:bg-transparent">

                {/* Back Button */}
                {showBackButton && (
                    <button
                        onClick={handleBack}
                        className="absolute top-8 left-4 md:left-8 lg:left-12 p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group z-50 flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    </button>
                )}

                {/* Brand Logo */}
                <div
                    onClick={() => navigate('/')}
                    className="absolute top-8 left-8 md:left-16 lg:left-20 cursor-pointer group flex items-center gap-3"
                >
                    <EditorialIcon className="w-8 h-8 text-black dark:text-white group-hover:rotate-12 transition-transform duration-500" />
                    <span className="font-serif font-bold text-xl tracking-tight hidden md:block text-black dark:text-white">TrueHandover</span>
                </div>

                {/* Theme Toggle */}
                {toggleTheme && (
                    <button
                        onClick={() => { playClick(); toggleTheme(); }}
                        className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all shadow-sm"
                    >
                        {themeMode === 'light' && <Sun className="w-4 h-4" />}
                        {themeMode === 'dark' && <Moon className="w-4 h-4" />}
                        {themeMode === 'system' && <Monitor className="w-4 h-4" />}
                    </button>
                )}

                <div className="max-w-md w-full mx-auto pt-20 lg:pt-0 animate-slide-up">
                    <header className="mb-12">
                        <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-tight mb-4 text-slate-900 dark:text-white leading-[0.9]">
                            {isSignUp ? "Create" : "Welcome"} <span className="italic text-lime-600 dark:text-[#bef264]">{isSignUp ? "Account." : "Back."}</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium tracking-tight">
                            Access your secure professional workspace.
                        </p>
                    </header>

                    <form onSubmit={handleLogin} className="space-y-10">
                        {formError && (
                            <InlineErrorBanner
                                message={formError}
                                onDismiss={() => setFormError(null)}
                            />
                        )}
                        <div className="space-y-8">
                            <div className="group relative">
                                <label className={`absolute left-0 transition-all duration-300 pointer-events-none ${focusedField === 'email' || email ? '-top-6 text-[9px] font-black uppercase tracking-[0.3em] text-lime-600 dark:text-[#bef264]' : 'top-3 text-lg text-slate-400 font-medium'}`}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); if (formError) setFormError(null); }}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full py-3 bg-transparent border-b border-slate-200 dark:border-white/10 focus:border-black dark:focus:border-white outline-none transition-all text-xl font-medium text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="group relative">
                                <label className={`absolute left-0 transition-all duration-300 pointer-events-none ${focusedField === 'password' || password ? '-top-6 text-[9px] font-black uppercase tracking-[0.3em] text-lime-600 dark:text-[#bef264]' : 'top-3 text-lg text-slate-400 font-medium'}`}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); if (formError) setFormError(null); }}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full py-3 bg-transparent border-b border-slate-200 dark:border-white/10 focus:border-black dark:focus:border-white outline-none transition-all text-xl font-medium text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-8">
                            <button type="button" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black dark:hover:text-white transition-colors underline underline-offset-8 decoration-slate-200 dark:decoration-white/10">
                                Reset Password
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group/btn h-14 px-10 bg-black dark:bg-[#bef264] text-white dark:text-black rounded-full font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-2xl shadow-black/20 dark:shadow-lime-500/10"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-16 text-center pt-8 border-t border-slate-50 dark:border-white/5">
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {isSignUp ? "Already have an account?" : "Don't have an account?"} <button type="button" onClick={() => { playClick(); setIsSignUp(!isSignUp); setFormError(null); }} className="font-bold text-black dark:text-white hover:underline decoration-[#bef264] decoration-2 underline-offset-4 transition-all">{isSignUp ? "Sign In!" : "Create one!"}</button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column: Visual Sculpture Side */}
            <div className="hidden lg:flex flex-1 items-center justify-center relative p-24 overflow-visible bg-slate-50/50 dark:bg-transparent">

                {/* Replacement for Grid: Soft Spotlight/Gallery Floor Effect */}
                <div className="absolute inset-[-50%] bg-[radial-gradient(closest-side_at_center,_var(--tw-gradient-stops))] from-slate-200/40 via-slate-50/0 to-transparent dark:from-white/5 dark:via-white/0 pointer-events-none" />

                <EnhancedMonolith focusedField={focusedField} email={email} password={password} />

                {/* Footer text in illustration area */}
                <div className="absolute bottom-12 left-0 right-0 text-center z-20 pointer-events-none">
                    <p className="font-serif italic text-slate-400 dark:text-slate-600 text-xl tracking-wide">
                        "Creative delivery, finally done right."
                    </p>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
                .transform-style-3d { transform-style: preserve-3d; }
                
                @keyframes elegant-float {
                    0% { transform: translateY(0px) rotateX(2deg) rotateY(0deg); }
                    50% { transform: translateY(-20px) rotateX(-2deg) rotateY(5deg); }
                    100% { transform: translateY(0px) rotateX(2deg) rotateY(0deg); }
                }
                .animate-elegant-float { animation: elegant-float 20s ease-in-out infinite; }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                .animate-float { animation: float 10s ease-in-out infinite; }

                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite 1s; }

                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
