
import React, { useState, useRef } from 'react';
import {
    Fingerprint, CreditCard, Crown, Cloud,
    ShieldCheck, Mail, Globe, ArrowRight, Wallet, DollarSign,
    Banknote, Lock, Server, Verified, Database, HardDrive, CheckCircle,
    Box, Key, ExternalLink, AlertTriangle, Unlink,
    Smartphone, Camera, ChevronRight, LogOut,
    User, Layers, Bell, Shield, Zap, CircleDollarSign, Eye,
    FlaskConical, RefreshCw, Volume2
} from 'lucide-react';
import { canToggleMockMode, isMockMode, setMockMode } from '../config/mockMode';
import { UserProfile, StorageSettings } from '../types';
import { playClick, playSuccess } from '../utils/sound';
import { Card, Badge, InlineErrorBanner } from './Shared';
import { StripeConnectService } from '../services/stripeService';

// --- VISUAL CONSTANTS ---
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

interface SettingsPageProps {
    user: UserProfile;
    onUpdateUser: (updates: Partial<UserProfile>) => void;
    onSignOut: () => void;
}

const InputField = ({ label, value, onChange, placeholder, type = "text", icon: Icon, className = "" }: any) => (
    <div className={`group space-y-1.5 ${className}`}>
        {label && <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-1">{label}</label>}
        <div className="relative flex items-center">
            {Icon && <Icon className="absolute left-4 w-4 h-4 text-slate-400 group-focus-within:text-lime-600 dark:group-focus-within:text-[#bef264] transition-colors" />}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full h-12 ${Icon ? 'pl-11 pr-4' : 'px-4'} bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-white/10`}
            />
        </div>
    </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser, onSignOut }) => {
    // State
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        subdomain: user.subdomain || '',
        website: '',
        venmo: user.paymentMethods?.venmo || '',
        cashapp: user.paymentMethods?.cashapp || '',
        zelle: user.paymentMethods?.zelle || '',
        bankInfo: user.paymentMethods?.bankInfo || '',
        emailAlerts: user.profilePreferences?.emailAlerts ?? true,
        pushNotifs: user.profilePreferences?.pushNotifs ?? false,
        twoFactor: user.profilePreferences?.twoFactor ?? true,
        biometric: user.profilePreferences?.biometric ?? true,
        soundEffects: user.profilePreferences?.soundEffects ?? true,
    });

    // Avatar Upload State
    const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Agency Settings State
    const [agencySettings, setAgencySettings] = useState(user.agencySettings || {
        cname: '',
        cnameVerified: false,
        customSmtp: false,
        removeBranding: false,
        dataRetentionDays: 30,
        supportEmail: ''
    });

    // Storage Settings State (links-only BYOS; no secrets stored client-side)
    const [storageSettings, setStorageSettings] = useState<StorageSettings>(user.storageSettings || { mode: 'platform' });

    // Shared error surface (used by payments + storage messaging)
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [driveValidationUrl, setDriveValidationUrl] = useState('');

    // Stripe Connect State
    const [stripeConnected, setStripeConnected] = useState(user.stripeConnect?.connected || false);
    const [stripeConnecting, setStripeConnecting] = useState(false);
    const [stripeAccountId, setStripeAccountId] = useState(user.stripeConnect?.accountId || '');

    const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'agency' | 'storage' | 'developer'>('profile');
    const [demoMode, setDemoMode] = useState(isMockMode());
    const [isSaving, setIsSaving] = useState(false);
    const showDeveloperTools = canToggleMockMode();

    // Handlers
    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAgencyChange = (field: string, value: any) => {
        setAgencySettings(prev => ({ ...prev, [field]: value }));
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        handleChange('name', val);
        const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        handleChange('subdomain', slug);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setAvatarPreview(url);
            playSuccess();
        }
    };

    const handleSave = () => {
        playClick();
        setIsSaving(true);

        // Prepare updates for the global user state
        const updates: Partial<UserProfile> = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            subdomain: formData.subdomain,
            avatar: avatarPreview,
            profilePreferences: {
                emailAlerts: formData.emailAlerts,
                pushNotifs: formData.pushNotifs,
                twoFactor: formData.twoFactor,
                biometric: formData.biometric,
                soundEffects: formData.soundEffects,
            },
            paymentMethods: {
                venmo: formData.venmo,
                cashapp: formData.cashapp,
                zelle: formData.zelle,
                bankInfo: formData.bankInfo,
                paypal: ''
            },
            agencySettings: agencySettings,
            storageSettings,
        };

        // Call the prop function to update App state
        onUpdateUser(updates);

        setTimeout(() => {
            setIsSaving(false);
            playSuccess();
        }, 1500);
    }

    const Toggle = ({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label?: string }) => (
        <button
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => { playClick(); onChange(!checked); }}
            className={`w-10 h-6 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 ${checked ? 'bg-lime-600 dark:bg-[#bef264]' : 'bg-slate-200 dark:bg-white/10'}`}
        >
            <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${checked ? 'translate-x-4' : ''} ${
                    checked ? 'bg-white dark:bg-zinc-950' : 'bg-white dark:bg-zinc-500'
                }`}
            />
        </button>
    );

    const NavButton = ({ id, label, icon: Icon, desc }: any) => (
        <button
            onClick={() => { playClick(); setActiveTab(id); }}
            className={`
                w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-4 group
                ${activeTab === id
                    ? 'bg-white dark:bg-white/10 shadow-sm ring-1 ring-slate-200 dark:ring-white/5'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5'
                }
            `}
        >
            <div className={`
                w-10 h-10 rounded-2xl flex items-center justify-center transition-colors
                ${activeTab === id
                    ? 'bg-lime-600 dark:bg-[#bef264] text-white dark:text-zinc-950'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                }
            `}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className={`text-sm font-bold ${activeTab === id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    {label}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {desc}
                </div>
            </div>
            {activeTab === id && (
                <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
            )}
        </button>
    );

    return (
        <div className="space-y-8 animate-slide-up relative z-10 pb-12 w-full">

            {/* Page Header - Matches App.tsx style (Full Width, Big Type) */}
            <div className="flex flex-col gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-sans tracking-tight font-medium tracking-tight text-slate-900 dark:text-white">
                            Your Settings
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-base mt-1">
                            Manage your profile, billing, and system preferences.
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={handleSave}
                                className={`
                                h-12 px-8 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 shadow-lg
                                ${isSaving
                                    ? 'bg-slate-100 dark:bg-white/10 text-slate-400 cursor-wait'
                                    : 'bg-slate-800 text-white dark:bg-white dark:text-zinc-950 hover:bg-slate-900 dark:hover:bg-slate-200'
                                }
                            `}
                        >
                            {isSaving ? 'Saving...' : <>Save Changes <CheckCircle className="w-4 h-4" /></>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Layout Container - Wider Margins (gap-12) and Full Width */}
            <div className="flex flex-col lg:flex-row gap-12">

                {/* --- LEFT SIDEBAR (NAVIGATION) --- */}
                <div className="lg:w-80 shrink-0 flex flex-col gap-6">

                    {/* Profile "Passport" Card */}
                    <div className="p-6 bg-white dark:bg-charcoal border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: NOISE_SVG }}></div>
                        <div className="absolute top-0 right-0 p-6 opacity-50">
                            <Verified className="w-24 h-24 text-slate-100 dark:text-white/5 -rotate-12" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="w-20 h-20 rounded-full p-1 bg-white dark:bg-charcoal border border-slate-200 dark:border-white/10 shadow-lg">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} className="w-full h-full rounded-full object-cover" alt="Profile" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-slate-800 dark:bg-slate-900 text-white flex items-center justify-center text-lg font-semibold">
                                            {(formData.name || 'U').trim()[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-1.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-110 transition-transform"
                                >
                                    <Camera className="w-3 h-3" />
                                </button>
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <h3 className="font-sans tracking-tight text-xl font-bold text-slate-900 dark:text-white">{formData.name}</h3>
                            <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold">{formData.role || ' '}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">{formData.email}</p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ecfccb] dark:bg-[#bef264]/16 border border-[#bef264] dark:border-[#bef264]/45 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#65a30d] dark:text-[#bef264]">
                                <Crown className="w-3 h-3 text-[#65a30d] dark:text-[#bef264]" /> Pro Plan
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu — horizontal sticky on mobile, vertical on desktop */}
                    <div className="lg:hidden sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/95 dark:bg-[#0f0f15]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {([
                                { id: 'profile', label: 'Profile', icon: Fingerprint },
                                { id: 'payments', label: 'Payments', icon: Wallet },
                                { id: 'agency', label: 'Agency', icon: Layers },
                                { id: 'storage', label: 'Storage', icon: HardDrive },
                                ...(showDeveloperTools ? [{ id: 'developer', label: 'Developer', icon: FlaskConical }] : []),
                            ] as any[]).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { playClick(); setActiveTab(tab.id); }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0
                                        ${activeTab === tab.id
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-sm'
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-col gap-1">
                        <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">System</h3>
                        <NavButton id="profile" label="Profile" desc="Personal & Public Info" icon={Fingerprint} />
                        <NavButton id="payments" label="Payments" desc="Stripe & Wallets" icon={Wallet} />
                        <NavButton id="agency" label="Agency Node" desc="Branding & Domain" icon={Layers} />
                        <NavButton id="storage" label="Storage" desc="Uploads & deliveries" icon={HardDrive} />
                        {showDeveloperTools && <NavButton id="developer" label="Developer" desc="Demo mode & tooling" icon={FlaskConical} />}
                    </div>

                    {/* Quick Toggles */}
                    <div className="p-4 bg-white dark:bg-charcoal border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                <Shield className="w-4 h-4" />
                                <span className="text-xs font-bold">2-Factor Auth</span>
                            </div>
                            <Toggle checked={formData.twoFactor} onChange={(v) => handleChange('twoFactor', v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                <Bell className="w-4 h-4" />
                                <span className="text-xs font-bold">Email Alerts</span>
                            </div>
                            <Toggle checked={formData.emailAlerts} onChange={(v) => handleChange('emailAlerts', v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                <Volume2 className="w-4 h-4" />
                                <span className="text-xs font-bold">Sound Effects</span>
                            </div>
                            <Toggle checked={formData.soundEffects} onChange={(v) => { handleChange('soundEffects', v); localStorage.setItem('th_sound_effects', v ? 'true' : 'false'); }} />
                        </div>
                    </div>

                    <button
                        onClick={() => { playClick(); onSignOut(); }}
                        className="flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors mt-auto"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>

                {/* --- RIGHT CONTENT PANEL --- */}
                <div className="flex-1 min-w-0">

                    {/* Inner Header Title - Updates based on Tab */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-sans tracking-tight font-medium tracking-tight text-slate-900 dark:text-white">
                            {activeTab === 'profile' && 'Profile Settings'}
                            {activeTab === 'payments' && 'Financial Stack'}
                            {activeTab === 'agency' && 'Agency Configuration'}
                            {activeTab === 'storage' && 'Storage'}
                            {activeTab === 'developer' && 'Developer Tools'}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                            {activeTab === 'profile' && 'Update your public profile and personal details.'}
                            {activeTab === 'payments' && 'Manage payout methods and Stripe integration.'}
                            {activeTab === 'agency' && 'Configure white-labeling and domain settings.'}
                            {activeTab === 'storage' && 'Platform-managed presigned storage and link imports.'}
                            {activeTab === 'developer' && 'Toggle demo mode and inspect runtime state.'}
                        </p>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-fade-in space-y-6">

                        {/* --- PROFILE TAB --- */}
                        {activeTab === 'profile' && (
                            <>
                                <Card>
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                        <User className="w-5 h-5 text-lime-600 dark:text-[#bef264]" />
                                        <h3 className="font-sans tracking-tight text-lg text-slate-900 dark:text-white">Basic Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <InputField
                                            label="Full Name"
                                            value={formData.name}
                                            onChange={handleNameChange}
                                            placeholder="e.g. Alex Smith"
                                            icon={User}
                                        />
                                        <InputField
                                            label="Email"
                                            value={formData.email}
                                            onChange={(e: any) => handleChange('email', e.target.value)}
                                            placeholder="e.g. alex@studio.com"
                                            type="email"
                                            icon={Mail}
                                        />
                                        <InputField
                                            label="Role / Title"
                                            value={formData.role}
                                            onChange={(e: any) => handleChange('role', e.target.value)}
                                            placeholder="e.g. Senior Product Designer"
                                            icon={Fingerprint}
                                        />
                                    </div>
                                </Card>

                                <Card className="hf-no-glow group relative overflow-hidden !bg-[#12131b] border-none shadow-[0_20px_60px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_24px_70px_-26px_rgba(0,0,0,0.65)]" noPadding>
                                    <div className="absolute inset-0 z-0">
                                        <img
                                            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=60"
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70"
                                            alt="Office"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#081018]/55 via-[#0d111a]/30 to-[#112311]/20" />
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(190,242,100,0.18)_0%,_rgba(190,242,100,0)_38%)]" />
                                        <div className="absolute inset-0 opacity-[0.1] pointer-events-none mix-blend-soft-light" style={{ backgroundImage: NOISE_SVG }}></div>
                                    </div>

                                    <div className="p-6 relative z-10">
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Globe className="w-4 h-4 text-[#bef264]" />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d9f99d]">Public Portal</span>
                                                </div>
                                                <h3 className="font-sans tracking-tight text-xl text-white">Client Gateway</h3>
                                                <p className="text-[11px] text-slate-200/85 mt-1 leading-relaxed max-w-lg">
                                                    This is the link your clients visit to view their project vault, preview deliverables, and complete payment. Share this URL after creating a project.
                                                </p>
                                            </div>
                                            <button aria-label="Open Public Portal" className="p-2 bg-[#bef264]/20 rounded-xl hover:bg-[#bef264]/28 transition-colors text-[#d9f99d] border border-[#d9f99d]/45 shadow-[0_0_0_1px_rgba(190,242,100,0.08)]" title="Preview your client portal">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Portal Subdomain</label>
                                                <div className="flex items-center rounded-2xl px-4 py-1 bg-white/12 border border-white/18 backdrop-blur-xl shadow-[0_18px_40px_-28px_rgba(0,0,0,0.6)] focus-within:border-[#d9f99d]/55 focus-within:bg-white/16 transition-all">
                                                    <span className="text-sm font-mono text-slate-300/70 mr-1">https://</span>
                                                    <input
                                                        value={formData.subdomain}
                                                        onChange={(e) => handleChange('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                        className="bg-transparent flex-1 text-white font-semibold outline-none placeholder:text-slate-400/55 h-10"
                                                        placeholder="brand"
                                                    />
                                                    <div className="pl-2 text-xs font-mono text-slate-300/70 border-l border-white/12 ml-2 py-1">
                                                        .heartifact.com
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-300/60 pl-1">Your clients will access deliverables at this address</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Exit Redirect URL</label>
                                                <div className="flex items-center rounded-2xl px-4 py-1 bg-white/12 border border-white/18 backdrop-blur-xl shadow-[0_18px_40px_-28px_rgba(0,0,0,0.6)] focus-within:border-[#d9f99d]/55 focus-within:bg-white/16 transition-all">
                                                    <input
                                                        value={formData.website}
                                                        onChange={(e) => handleChange('website', e.target.value)}
                                                        className="bg-transparent flex-1 text-white text-sm font-medium outline-none placeholder:text-slate-400/55 h-10"
                                                        placeholder="https://yourportfolio.com"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-300/60 pl-1">Where clients go when they leave the vault (e.g. your website)</p>
                                            </div>
                                        </div>

                                        {/* Visual flow hint */}
                                        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-6 text-[10px] text-slate-300/70 uppercase tracking-wider font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded bg-white/12 flex items-center justify-center text-[#bef264]"><Globe className="w-3 h-3" /></div>
                                                <span>Client opens link</span>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-[#bef264]/60" />
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded bg-white/12 flex items-center justify-center text-[#bef264]"><Eye className="w-3 h-3" /></div>
                                                <span>Reviews vault</span>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-[#bef264]/60" />
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded bg-white/12 flex items-center justify-center text-[#bef264]"><CreditCard className="w-3 h-3" /></div>
                                                <span>Pays & unlocks</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        )}

                        {/* --- PAYMENTS TAB --- */}
                        {activeTab === 'payments' && (
                            <>
                                {/* Stripe Connect Card — compact */}
                                <Card className="!p-0 overflow-hidden !bg-[#635BFF] text-white border-none shadow-md shadow-[#635BFF]/15 relative">
                                    <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: NOISE_SVG }}></div>
                                    <div className="p-6 relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                                    <CreditCard className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-sans tracking-tight text-lg font-bold">Stripe Connect</h3>
                                                    <p className="text-[11px] text-white/60 mt-0.5">Clients pay you directly — we just route the funds.</p>
                                                </div>
                                            </div>
                                            {stripeConnected && (
                                                <div className="px-3 py-1 bg-lime-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-lime-600 dark:text-[#bef264] border border-lime-400/20 flex items-center gap-1.5">
                                                    <div className="w-2 h-2 bg-lime-500 rounded-full animate-pulse" />
                                                    Connected
                                                </div>
                                            )}
                                        </div>

                                        {!stripeConnected ? (
                                            /* --- NOT CONNECTED STATE --- */
                                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                                                <div className="flex items-center gap-5">
                                                    <div className="shrink-0">
                                                        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                                                            <Zap className="w-5 h-5 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-white mb-1">Connect Your Stripe Account</h4>
                                                        <p className="text-[11px] text-white/60 leading-relaxed">
                                                            Link in one click. Clients see <strong className="text-white/90">your business name</strong> on their statement.
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0">
                                                        <button
                                                            onClick={async () => {
                                                                playClick();
                                                                setConnectionError(null);
                                                                setStripeConnecting(true);
                                                                try {
                                                                    const onboarding = await StripeConnectService.getOnboardingUrl({
                                                                        returnUrl: window.location.href,
                                                                        refreshUrl: window.location.href,
                                                                    });

                                                                    if (!onboarding.success) {
                                                                        const errorMessage = 'error' in onboarding ? onboarding.error : 'Could not start Stripe onboarding.';
                                                                        setConnectionError(errorMessage || 'Could not start Stripe onboarding.');
                                                                        setStripeConnecting(false);
                                                                        return;
                                                                    }

                                                                    const nextAccountId = onboarding.data.accountId || stripeAccountId;
                                                                    setStripeConnected(true);
                                                                    setStripeAccountId(nextAccountId || '');
                                                                    onUpdateUser({
                                                                        stripeConnect: {
                                                                            accountId: nextAccountId || '',
                                                                            connected: true,
                                                                            displayName: formData.name,
                                                                            chargesEnabled: true,
                                                                            payoutsEnabled: true,
                                                                        },
                                                                    });
                                                                    playSuccess();
                                                                    window.location.href = onboarding.data.url;
                                                                } catch (error) {
                                                                    setConnectionError(error instanceof Error ? error.message : 'Could not connect Stripe account.');
                                                                    setStripeConnecting(false);
                                                                }
                                                            }}
                                                            disabled={stripeConnecting}
                                                            className={`px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${stripeConnecting
                                                                ? 'bg-white/20 text-white/50 cursor-wait'
                                                                : 'bg-white text-[#635BFF] hover:bg-slate-100 hover:scale-[1.03] shadow-md shadow-white/15'
                                                                }`}
                                                        >
                                                            {stripeConnecting ? (
                                                                <span className="flex items-center gap-2">
                                                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                    Connecting...
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1.5">
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                    Connect
                                                                </span>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* How it works — inline compact */}
                                                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-white/70 shrink-0">1.</span>
                                                        <p className="text-[10px] text-white/50 leading-snug">Log into Stripe</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-white/70 shrink-0">2.</span>
                                                        <p className="text-[10px] text-white/50 leading-snug">Account linked securely</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-white/70 shrink-0">3.</span>
                                                        <p className="text-[10px] text-white/50 leading-snug">Payments route to you</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* --- CONNECTED STATE (compact) --- */
                                            <div className="space-y-3">
                                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                                                <CircleDollarSign className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm text-white">{formData.name || 'Your Business'}</h4>
                                                                <p className="text-[11px] text-white/50 font-mono mt-0.5">{stripeAccountId || 'Connected account'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5 text-[10px] text-lime-400 font-bold uppercase tracking-wider">
                                                                <CheckCircle className="w-3.5 h-3.5" /> Charges
                                                            </div>
                                                            <span className="text-white/20">·</span>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-lime-400 font-bold uppercase tracking-wider">
                                                                <CheckCircle className="w-3.5 h-3.5" /> Payouts
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    playClick();
                                                                    setStripeConnected(false);
                                                                    setStripeAccountId('');
                                                                    onUpdateUser({
                                                                        stripeConnect: {
                                                                            accountId: '',
                                                                            connected: false,
                                                                            displayName: '',
                                                                            chargesEnabled: false,
                                                                            payoutsEnabled: false
                                                                        }
                                                                    });
                                                                }}
                                                                className="ml-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-lime-500/20 text-white/70 hover:text-lime-300 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/10 hover:border-lime-400/30"
                                                            >
                                                                <Unlink className="w-3 h-3" />
                                                                Disconnect
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-white/40">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    <span className="uppercase tracking-wider font-bold">API keys managed by Stripe — never stored here</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Digital Handshake / Fallback Methods */}
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Digital Handshake (Manual Fallback)</span>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/5" />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Wallet className="w-5 h-5" /></div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">P2P Apps</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <InputField
                                                label="Venmo Handle"
                                                value={formData.venmo}
                                                onChange={(e: any) => handleChange('venmo', e.target.value)}
                                                placeholder="@username"
                                                icon={Smartphone}
                                            />
                                            <InputField
                                                label="CashApp Tag"
                                                value={formData.cashapp}
                                                onChange={(e: any) => handleChange('cashapp', e.target.value)}
                                                placeholder="$cashtag"
                                                icon={DollarSign}
                                            />
                                        </div>
                                    </Card>

                                    <Card>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><Banknote className="w-5 h-5" /></div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">Bank Wire</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-1">Routing & Account Details</label>
                                            <textarea
                                                value={formData.bankInfo}
                                                onChange={(e) => handleChange('bankInfo', e.target.value)}
                                                placeholder="Bank Name, SWIFT, IBAN..."
                                                className="w-full p-4 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[140px] resize-none hover:border-slate-300 dark:hover:border-white/10"
                                            />
                                        </div>
                                    </Card>
                                </div>
                            </>
                        )}

                        {/* --- AGENCY TAB --- */}
                        {activeTab === 'agency' && (
                            <>
                                <Card className="!p-6 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: NOISE_SVG }}></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <div className="flex items-center gap-2.5 mb-1">
                                                    <div className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg"><Crown className="w-4 h-4 text-slate-500" /></div>
                                                    <h3 className="font-sans tracking-tight text-lg text-slate-900 dark:text-white">Whitelabel Domain</h3>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 pl-[34px]">
                                                    Replace the default Heartifact URL with your own custom domain. Clients will see your brand only.
                                                </p>
                                            </div>
                                            <Badge color="lime">Agency</Badge>
                                        </div>

                                        {/* Domain input + verify */}
                                        <div className="flex gap-3 mb-5">
                                            <div className="flex-1">
                                                <InputField
                                                    label="Custom Domain"
                                                    value={agencySettings.cname}
                                                    onChange={(e: any) => handleAgencyChange('cname', e.target.value)}
                                                    placeholder="portal.youragency.com"
                                                    icon={Globe}
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button className="h-12 px-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-zinc-950 font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-opacity">
                                                    Verify
                                                </button>
                                            </div>
                                        </div>

                                        {/* DNS instructions — collapsible detail */}
                                        <details className="group/dns">
                                            <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors select-none">
                                                <ChevronRight className="w-3.5 h-3.5 transition-transform group-open/dns:rotate-90" />
                                                DNS Setup Instructions
                                            </summary>
                                            <div className="mt-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl p-4 border border-slate-100 dark:border-white/[0.06] font-mono text-xs">
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 font-sans">Add this CNAME record in your domain registrar&apos;s DNS settings:</p>
                                                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-slate-600 dark:text-slate-300">
                                                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-sans">Host</span>
                                                    <span className="text-slate-900 dark:text-white font-bold">portal</span>
                                                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-sans">Value</span>
                                                    <span className="text-lime-600 dark:text-[#bef264]">cname.heartifact.com</span>
                                                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-sans">Type</span>
                                                    <span>CNAME</span>
                                                </div>
                                            </div>
                                        </details>

                                        {/* What this does — visual hint */}
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                                            <Shield className="w-4 h-4 shrink-0" />
                                            <span className="leading-relaxed">Instead of <span className="font-mono text-slate-500 dark:text-slate-400">brand.heartifact.com</span>, your clients see <span className="font-mono font-bold text-slate-700 dark:text-white">{agencySettings.cname || 'portal.youragency.com'}</span></span>
                                        </div>
                                    </div>
                                </Card>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-6">Email Branding</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500"><Mail className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900 dark:text-white">Custom SMTP</p>
                                                        <p className="text-[10px] text-slate-500">Send from your email</p>
                                                    </div>
                                                </div>
                                                <Toggle label="Toggle Custom SMTP" checked={agencySettings.customSmtp} onChange={(v) => handleAgencyChange('customSmtp', v)} />
                                            </div>
                                        </div>
                                    </Card>
                                    <Card>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-6">Portal Branding</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-lime-600/10 text-lime-600 dark:bg-[#bef264]/10 dark:text-[#bef264] flex items-center justify-center"><Verified className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900 dark:text-white">Remove Logo</p>
                                                        <p className="text-[10px] text-slate-500">Hide "Powered By"</p>
                                                    </div>
                                                </div>
                                                <Toggle label="Toggle Portal Branding" checked={agencySettings.removeBranding} onChange={(v) => handleAgencyChange('removeBranding', v)} />
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </>
                        )}

                        {/* --- DEVELOPER TAB --- */}
                        {activeTab === 'developer' && (
                            <>
                                <Card className="!p-8 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-lg">
                                                <FlaskConical className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-sans tracking-tight text-xl text-slate-900 dark:text-white">Demo Mode</h3>
                                                <p className="text-xs text-slate-500">Controls whether the app uses pre-populated mock data or your real Supabase backend.</p>
                                            </div>
                                        </div>

                                        <div className="hf-surface p-6 bg-white dark:bg-charcoal rounded-[2rem] border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md overflow-hidden space-y-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Demo / Mock Mode</p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                                        When <strong>ON</strong>, the app loads pre-populated demo projects and uses mock services for file processing. Ideal for UI development and demos.
                                                        <br />When <strong>OFF</strong>, the app connects exclusively to your Supabase backend and real services.
                                                    </p>
                                                </div>
                                                <Toggle
                                                    label="Toggle Demo Mode"
                                                    checked={demoMode}
                                                    onChange={(v) => {
                                                        setDemoMode(v);
                                                        setMockMode(v);
                                                    }}
                                                />
                                            </div>

                                            <div className={`p-3 rounded-xl flex items-start gap-3 border ${demoMode ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' : 'bg-lime-50 dark:bg-lime-500/10 border-lime-200 dark:border-lime-500/20'}`}>
                                                <FlaskConical className={`w-4 h-4 mt-0.5 shrink-0 ${demoMode ? 'text-amber-600 dark:text-amber-400' : 'text-lime-600 dark:text-[#bef264]'}`} />
                                                <p className={`text-[11px] leading-relaxed font-medium ${demoMode ? 'text-amber-800 dark:text-amber-200' : 'text-lime-800 dark:text-[#bef264]'}`}>
                                                    {demoMode
                                                        ? 'Demo mode is active. Pre-populated mock data and mock backend services are in use. File uploads and payments are simulated.'
                                                        : 'Live mode is active. The app is connected to your real Supabase backend. Sign in to load your projects.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="hf-surface mt-6 p-4 bg-white dark:bg-charcoal rounded-[2rem] border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md overflow-hidden">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Runtime Info</p>
                                            <div className="space-y-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                <div className="flex justify-between"><span>Mode</span><span className={demoMode ? 'text-amber-500' : 'text-lime-600 dark:text-[#bef264]'}>{demoMode ? 'DEMO' : 'LIVE'}</span></div>
                                                <div className="flex justify-between"><span>VITE_DEMO_MODE</span><span>{import.meta.env.VITE_DEMO_MODE ?? '(not set)'}</span></div>
                                                <div className="flex justify-between"><span>Environment</span><span>{import.meta.env.MODE}</span></div>
                                                <div className="flex justify-between"><span>Supabase</span><span>{import.meta.env.VITE_SUPABASE_URL ? '✓ configured' : '✗ missing'}</span></div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => window.location.reload()}
                                            className="mt-4 flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-xl hover:border-slate-300 dark:hover:border-white/20 transition-all"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" /> Reload App
                                        </button>
                                    </div>
                                </Card>
                            </>
                        )}
                        {/* --- STORAGE TAB --- */}
                        {activeTab === 'storage' && (
                            <>
                                <Card className="!p-8 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                            <HardDrive className="w-5 h-5 text-lime-600 dark:text-[#bef264]" />
                                            <div>
                                                <h3 className="font-sans tracking-tight text-xl text-slate-900 dark:text-white">Storage</h3>
                                                <p className="text-xs text-slate-500">Choose platform vault storage, or configure links-only imports.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {connectionError && <InlineErrorBanner message={connectionError} onDismiss={() => setConnectionError(null)} />}

                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    onClick={() => { playClick(); setConnectionError(null); setStorageSettings(prev => ({ ...prev, mode: 'platform' })); }}
                                                    className={`px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${storageSettings.mode === 'platform' ? 'bg-lime-600 text-white dark:bg-[#bef264] dark:text-zinc-950 shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                                >
                                                    Platform Vault
                                                </button>
                                                <button
                                                    onClick={() => { playClick(); setConnectionError(null); setStorageSettings(prev => ({ ...prev, mode: 'drive' })); }}
                                                    className={`px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${storageSettings.mode === 'drive' ? 'bg-lime-600 text-white dark:bg-[#bef264] dark:text-zinc-950 shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                                >
                                                    Cloud Drive
                                                </button>
                                                <button
                                                    onClick={() => { playClick(); setConnectionError(null); setStorageSettings(prev => ({ ...prev, mode: 's3' })); }}
                                                    className={`px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${storageSettings.mode === 's3' ? 'bg-lime-600 text-white dark:bg-[#bef264] dark:text-zinc-950 shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                                >
                                                    S3 / R2 Bucket
                                                </button>
                                            </div>

                                            {storageSettings.mode === 'platform' && (
                                                <>
                                                    <div className="hf-surface p-5 bg-white dark:bg-charcoal rounded-[2rem] border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md overflow-hidden">
                                                        <div className="flex items-start gap-3">
                                                            <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Platform Vault</p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                                                                    Heartifact uses server-issued presigned URLs for uploads and downloads. No S3/R2 secret keys or cloud OAuth tokens are stored in the browser or in your profile.
                                                                </p>
                                                                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                                    <span className="px-2 py-1 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">Mode</span>
                                                                    <span className="text-slate-600 dark:text-slate-300">PLATFORM</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="hf-surface p-5 bg-white dark:bg-charcoal rounded-[2rem] border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md overflow-hidden">
                                                        <div className="flex items-start gap-3">
                                                            <ExternalLink className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Imports (Links)</p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                                                                    Paste share links from Google Drive, Dropbox, OneDrive, or a public S3/R2 URL directly into a project. This is links-only: no OAuth tokens and no secret keys are stored in the browser.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {storageSettings.mode === 'drive' && (
                                                <div className="hf-surface p-5 bg-white dark:bg-charcoal rounded-[2rem] border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md overflow-hidden">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <Cloud className="w-4 h-4 text-slate-500" />
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Cloud Drive</p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Store labels only (no OAuth). Use share links inside projects.</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                playClick();
                                                                const raw = driveValidationUrl.trim();
                                                                if (!raw) {
                                                                    setConnectionError('Paste a share link URL to validate (e.g. Drive/Dropbox/OneDrive).');
                                                                    return;
                                                                }
                                                                let url: URL;
                                                                try {
                                                                    url = new URL(raw);
                                                                } catch {
                                                                    setConnectionError('That does not look like a valid URL.');
                                                                    return;
                                                                }
                                                                const host = url.hostname.toLowerCase();
                                                                const provider = storageSettings.byosDriveProvider;
                                                                const hostOk =
                                                                    host.includes('drive.google.com') ||
                                                                    host.includes('docs.google.com') ||
                                                                    host.includes('dropbox.com') ||
                                                                    host.includes('1drv.ms') ||
                                                                    host.includes('onedrive.live.com') ||
                                                                    host.includes('sharepoint.com');
                                                                if (!hostOk) {
                                                                    setConnectionError('Unsupported host. Use a Google Drive, Dropbox, or OneDrive share link.');
                                                                    return;
                                                                }
                                                                if (provider === 'google' && !(host.includes('drive.google.com') || host.includes('docs.google.com'))) {
                                                                    setConnectionError('This link does not look like a Google Drive share link.');
                                                                    return;
                                                                }
                                                                if (provider === 'dropbox' && !host.includes('dropbox.com')) {
                                                                    setConnectionError('This link does not look like a Dropbox share link.');
                                                                    return;
                                                                }
                                                                if (provider === 'onedrive' && !(host.includes('1drv.ms') || host.includes('onedrive.live.com') || host.includes('sharepoint.com'))) {
                                                                    setConnectionError('This link does not look like a OneDrive share link.');
                                                                    return;
                                                                }
                                                                setConnectionError(null);
                                                                playSuccess();
                                                            }}
                                                            className="h-10 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                                                        >
                                                            Validate
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-1">Provider</label>
                                                            <div className="h-12 px-4 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl flex items-center">
                                                                <select
                                                                    value={storageSettings.byosDriveProvider || ''}
                                                                    onChange={(e) => setStorageSettings(prev => ({ ...prev, byosDriveProvider: e.target.value as any }))}
                                                                    className="w-full bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-white"
                                                                >
                                                                    <option value="" disabled>Select provider</option>
                                                                    <option value="google">Google Drive</option>
                                                                    <option value="dropbox">Dropbox</option>
                                                                    <option value="onedrive">OneDrive</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <InputField
                                                            label="Account label"
                                                            value={storageSettings.byosDriveAccountLabel || ''}
                                                            onChange={(e: any) => setStorageSettings(prev => ({ ...prev, byosDriveAccountLabel: e.target.value }))}
                                                            placeholder="e.g. Studio Drive"
                                                            icon={HardDrive}
                                                        />
                                                        <InputField
                                                            label="Share link URL"
                                                            value={driveValidationUrl}
                                                            onChange={(e: any) => setDriveValidationUrl(e.target.value)}
                                                            placeholder="https://drive.google.com/..."
                                                            icon={ExternalLink}
                                                        />
                                                    </div>
                                                    <p className="mt-4 text-[10px] text-slate-500 dark:text-slate-400">
                                                        Paste Drive/Dropbox/OneDrive share links into projects. We don&apos;t store OAuth tokens in your browser.
                                                    </p>
                                                </div>
                                            )}

                                            {storageSettings.mode === 's3' && (
                                                <div className="hf-surface p-5 bg-white dark:bg-charcoal rounded-[2rem] border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md overflow-hidden">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <Server className="w-4 h-4 text-slate-500" />
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">S3 / R2 (Links)</p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Metadata only. Use public URLs or share links inside projects.</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                playClick();
                                                                if (!storageSettings.s3Bucket?.trim()) {
                                                                    setConnectionError('Please add a bucket name (or switch back to Platform Vault).');
                                                                    return;
                                                                }
                                                                setConnectionError(null);
                                                                playSuccess();
                                                            }}
                                                            className="h-10 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                                                        >
                                                            Validate
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-1">Provider</label>
                                                            <div className="h-12 px-4 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl flex items-center">
                                                                <select
                                                                    value={storageSettings.s3Provider || 'r2'}
                                                                    onChange={(e) => setStorageSettings(prev => ({ ...prev, s3Provider: e.target.value as any }))}
                                                                    className="w-full bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-white"
                                                                >
                                                                    <option value="r2">Cloudflare R2</option>
                                                                    <option value="aws">AWS S3</option>
                                                                    <option value="custom">Custom S3</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <InputField
                                                            label="Bucket name"
                                                            value={storageSettings.s3Bucket || ''}
                                                            onChange={(e: any) => setStorageSettings(prev => ({ ...prev, s3Bucket: e.target.value }))}
                                                            placeholder="e.g. heartifact-vault"
                                                            icon={Database}
                                                        />
                                                        <InputField
                                                            label="Region (optional)"
                                                            value={storageSettings.s3Region || ''}
                                                            onChange={(e: any) => setStorageSettings(prev => ({ ...prev, s3Region: e.target.value }))}
                                                            placeholder="e.g. us-east-1"
                                                            icon={Globe}
                                                        />
                                                        <InputField
                                                            label="Endpoint (optional)"
                                                            value={storageSettings.s3Endpoint || ''}
                                                            onChange={(e: any) => setStorageSettings(prev => ({ ...prev, s3Endpoint: e.target.value }))}
                                                            placeholder="e.g. https://<account>.r2.cloudflarestorage.com"
                                                            icon={Server}
                                                        />
                                                    </div>
                                                    <div className="mt-4">
                                                        <InputField
                                                            label="Public base URL (optional)"
                                                            value={storageSettings.s3PublicBaseUrl || ''}
                                                            onChange={(e: any) => setStorageSettings(prev => ({ ...prev, s3PublicBaseUrl: e.target.value }))}
                                                            placeholder="e.g. https://cdn.yourdomain.com/"
                                                            icon={ExternalLink}
                                                        />
                                                        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                                                            This is used for display + link generation only. No credentials are stored.
                                                        </p>
                                                    </div>
                                                    <p className="mt-4 text-[10px] text-slate-500 dark:text-slate-400">
                                                        Paste public S3/R2 URLs into projects. If you need private buckets, keep Platform Vault selected.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
