
import React, { useState, useRef } from 'react';
import {
    Fingerprint, CreditCard, Crown, Cloud,
    ShieldCheck, Mail, Globe, ArrowRight, Wallet, DollarSign,
    Banknote, Lock, Server, Verified, Database, HardDrive, CheckCircle,
    Box, Key, ExternalLink, AlertTriangle, Unlink,
    Smartphone, Camera, ChevronRight, LogOut,
    User, Layers, Bell, Shield, Zap, CircleDollarSign, Eye,
    FlaskConical, RefreshCw
} from 'lucide-react';
import { isMockMode, setMockMode } from '../config/mockMode';
import { UserProfile, StorageSettings } from '../types';
import { playClick, playSuccess } from '../utils/sound';
import { Card, Badge, GRADIENT_TEXT, InlineErrorBanner } from './Shared';
import { StripeConnectService } from '../services/stripeService';
import { R2Service } from '../services/r2';
import { connectByosProvider, type ByosOAuthProvider } from '../services/byosOAuth';

// --- VISUAL CONSTANTS ---
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

interface SettingsPageProps {
    user: UserProfile;
    onUpdateUser: (updates: Partial<UserProfile>) => void;
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
                className={`w-full h-12 ${Icon ? 'pl-11 pr-4' : 'px-4'} bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-white/20`}
            />
        </div>
    </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser }) => {
    // State
    const [formData, setFormData] = useState({
        name: user.name || '',
        role: user.role || '',
        subdomain: user.subdomain || '',
        website: '',
        venmo: user.paymentMethods?.venmo || '',
        cashapp: user.paymentMethods?.cashapp || '',
        zelle: user.paymentMethods?.zelle || '',
        bankInfo: user.paymentMethods?.bankInfo || '',
        emailAlerts: true,
        pushNotifs: false,
        twoFactor: true,
        biometric: true
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

    // Storage Settings State - Initialize from user profile or default to R2 preset
    const [storageConfig, setStorageConfig] = useState<StorageSettings>(user.storageSettings || {
        provider: 'r2',
        endpoint: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com',
        bucket: '',
        accessKey: '',
        secretKey: '',
        accountId: ''
    });

    // UX State for Storage
    const [storageMode, setStorageMode] = useState<'drive' | 's3' | null>(user.storageSettings ? 's3' : null);
    const [isDriveConnectingByProvider, setIsDriveConnectingByProvider] = useState<Record<ByosOAuthProvider, boolean>>({
        google: false,
        dropbox: false,
        onedrive: false
    });

    // Shared error surface (used by payments + storage messaging)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Stripe Connect State
    const [stripeConnected, setStripeConnected] = useState(user.stripeConnect?.connected || false);
    const [stripeConnecting, setStripeConnecting] = useState(false);
    const [stripeAccountId, setStripeAccountId] = useState(user.stripeConnect?.accountId || '');

    const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'agency' | 'storage' | 'developer'>('profile');
    const [demoMode, setDemoMode] = useState(isMockMode());
    const [isSaving, setIsSaving] = useState(false);

    // Handlers
    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAgencyChange = (field: string, value: any) => {
        setAgencySettings(prev => ({ ...prev, [field]: value }));
    };

    const handleStorageChange = (field: string, value: any) => {
        setStorageConfig(prev => ({ ...prev, [field]: value }));
        if (connectionStatus !== 'idle') setConnectionStatus('idle');
        if (connectionError) setConnectionError(null);
    };

    const applyStoragePreset = (provider: string) => {
        let endpoint = '';
        if (provider === 'aws') endpoint = 'https://s3.amazonaws.com';
        if (provider === 'r2') endpoint = 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com';
        if (provider === 'wasabi') endpoint = 'https://s3.wasabisys.com';
        if (provider === 'spaces') endpoint = 'https://nyc3.digitaloceanspaces.com';
        setStorageConfig(prev => ({ ...prev, provider: provider as any, endpoint }));
    };

    const handleTestConnection = async () => {
        playClick();
        const requiredFields: Array<keyof StorageSettings> = ['endpoint', 'bucket', 'accessKey', 'secretKey'];
        const hasMissingRequired = requiredFields.some((field) => !(storageConfig[field] || '').toString().trim());
        if (hasMissingRequired) {
            setConnectionStatus('error');
            setConnectionError('Please fill endpoint, bucket, access key, and secret key before testing connection.');
            return;
        }
        setConnectionError(null);
        setConnectionStatus('checking');
        try {
            await R2Service.testConnection(storageConfig);
            setConnectionStatus('connected');
            playSuccess();
        } catch (e) {
            console.error(e);
            setConnectionStatus('error');
            setConnectionError(e instanceof Error ? e.message : 'Connection test failed. Please verify your credentials and endpoint.');
        }
    };

    const getDriveToken = (provider: ByosOAuthProvider) => {
        if (provider === 'google') return storageConfig.byosGoogleToken;
        if (provider === 'dropbox') return storageConfig.byosDropboxToken;
        return storageConfig.byosOneDriveToken;
    };

    const getDriveLabel = (provider: ByosOAuthProvider) => {
        if (provider === 'google') return storageConfig.byosGoogleAccountLabel;
        if (provider === 'dropbox') return storageConfig.byosDropboxAccountLabel;
        return storageConfig.byosOneDriveAccountLabel;
    };

    const handleTestDriveConnection = (provider: ByosOAuthProvider) => {
        playClick();
        const credential = getDriveToken(provider);
        if (!credential || !credential.trim()) {
            setConnectionStatus('error');
            setConnectionError(`Please connect your ${provider === 'google' ? 'Google Drive' : provider === 'dropbox' ? 'Dropbox' : 'OneDrive'} account first.`);
            return;
        }
        setConnectionError(null);
        setConnectionStatus('connected');
        playSuccess();
    };

    const handleConnectDrive = async (provider: ByosOAuthProvider) => {
        try {
            setIsDriveConnectingByProvider(prev => ({ ...prev, [provider]: true }));
            setConnectionError(null);
            setConnectionStatus('checking');
            playClick();

            const result = await connectByosProvider(provider);
            const updates: Partial<StorageSettings> = { byosDriveProvider: provider };

            if (provider === 'google') {
                updates.byosGoogleToken = result.accessToken;
                updates.byosGoogleAccountLabel = result.accountLabel;
            }
            if (provider === 'dropbox') {
                updates.byosDropboxToken = result.accessToken;
                updates.byosDropboxAccountLabel = result.accountLabel;
            }
            if (provider === 'onedrive') {
                updates.byosOneDriveToken = result.accessToken;
                updates.byosOneDriveAccountLabel = result.accountLabel;
            }

            setStorageConfig(prev => ({ ...prev, ...updates }));
            setConnectionStatus('connected');
            playSuccess();
        } catch (error) {
            setConnectionStatus('error');
            setConnectionError(error instanceof Error ? error.message : 'Drive authorization failed.');
        } finally {
            setIsDriveConnectingByProvider(prev => ({ ...prev, [provider]: false }));
        }
    };

    const handleDisconnectDrive = (provider: ByosOAuthProvider) => {
        playClick();
        if (provider === 'google') {
            setStorageConfig(prev => ({ ...prev, byosGoogleToken: '', byosGoogleAccountLabel: '' }));
        }
        if (provider === 'dropbox') {
            setStorageConfig(prev => ({ ...prev, byosDropboxToken: '', byosDropboxAccountLabel: '' }));
        }
        if (provider === 'onedrive') {
            setStorageConfig(prev => ({ ...prev, byosOneDriveToken: '', byosOneDriveAccountLabel: '' }));
        }
        setConnectionStatus('idle');
        setConnectionError(null);
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
            role: formData.role,
            subdomain: formData.subdomain,
            avatar: avatarPreview,
            paymentMethods: {
                venmo: formData.venmo,
                cashapp: formData.cashapp,
                zelle: formData.zelle,
                bankInfo: formData.bankInfo,
                paypal: ''
            },
            agencySettings: agencySettings,
            storageSettings: storageConfig
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
            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm transition-all duration-300 bg-white dark:bg-black ${checked ? 'translate-x-4' : ''}`} />
        </button>
    );

    const NavButton = ({ id, label, icon: Icon, desc }: any) => (
        <button
            onClick={() => { playClick(); setActiveTab(id); }}
            className={`
                w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-4 group
                ${activeTab === id
                    ? 'bg-white dark:bg-white/10 shadow-sm ring-1 ring-slate-200 dark:ring-white/5'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5'
                }
            `}
        >
            <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                ${activeTab === id
                    ? 'bg-lime-600 dark:bg-[#bef264] text-white dark:text-black'
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
                        <h2 className={`text-4xl font-serif font-medium tracking-tight ${GRADIENT_TEXT}`}>
                            Your <span className="text-lime-600 dark:text-[#bef264]">Settings</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
                            Manage your profile, billing, and system preferences.
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={handleSave}
                            className={`
                                h-12 px-8 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 shadow-lg
                                ${isSaving
                                    ? 'bg-slate-100 dark:bg-white/10 text-slate-400 cursor-wait'
                                    : 'bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-slate-200'
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
                    <div className="p-6 bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: NOISE_SVG }}></div>
                        <div className="absolute top-0 right-0 p-6 opacity-50">
                            <Verified className="w-24 h-24 text-slate-100 dark:text-white/5 -rotate-12" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="w-20 h-20 rounded-full p-1 bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/10 shadow-lg">
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
                            <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">{formData.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">{user.email}</p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime-50 dark:bg-[#bef264]/10 border border-lime-100 dark:border-[#bef264]/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-lime-700 dark:text-[#bef264]">
                                <Crown className="w-3 h-3" /> Pro Plan
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
                                { id: 'developer', label: 'Developer', icon: FlaskConical },
                            ] as const).map(tab => (
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
                        <NavButton id="storage" label="Storage" desc="R2 / S3 Configuration" icon={HardDrive} />
                        <NavButton id="developer" label="Developer" desc="Demo mode & tooling" icon={FlaskConical} />
                    </div>

                    {/* Quick Toggles */}
                    <div className="p-4 bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-4">
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
                    </div>

                    <button className="flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors mt-auto">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>

                {/* --- RIGHT CONTENT PANEL --- */}
                <div className="flex-1 min-w-0">

                    {/* Inner Header Title - Updates based on Tab */}
                    <div className="mb-8">
                        <h3 className={`text-2xl font-serif font-medium tracking-tight ${GRADIENT_TEXT}`}>
                            {activeTab === 'profile' && 'Profile Settings'}
                            {activeTab === 'payments' && 'Financial Stack'}
                            {activeTab === 'agency' && 'Agency Configuration'}
                            {activeTab === 'storage' && 'Storage Pipeline'}
                            {activeTab === 'developer' && 'Developer Tools'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            {activeTab === 'profile' && 'Update your public profile and personal details.'}
                            {activeTab === 'payments' && 'Manage payout methods and Stripe integration.'}
                            {activeTab === 'agency' && 'Configure white-labeling and domain settings.'}
                            {activeTab === 'storage' && 'Connect your own S3/R2 storage buckets.'}
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
                                        <h3 className="font-serif text-lg text-slate-900 dark:text-white">Basic Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Full Name"
                                            value={formData.name}
                                            onChange={handleNameChange}
                                            placeholder="e.g. Alex Smith"
                                        />
                                        <InputField
                                            label="Role / Title"
                                            value={formData.role}
                                            onChange={(e: any) => handleChange('role', e.target.value)}
                                            placeholder="e.g. Senior Product Designer"
                                        />
                                    </div>
                                </Card>

                                <Card className="group relative overflow-hidden !bg-slate-900 dark:!bg-[#0f0f15] border-none" noPadding>
                                    <div className="absolute inset-0 z-0">
                                        <img
                                            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=60"
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale opacity-40 mix-blend-overlay"
                                            alt="Office"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent dark:from-black dark:via-black/90" />
                                        <div className="absolute inset-0 opacity-[0.1] pointer-events-none mix-blend-overlay" style={{ backgroundImage: NOISE_SVG }}></div>
                                    </div>

                                    <div className="p-6 relative z-10">
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Globe className="w-4 h-4 text-lime-400" />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-400">Public Portal</span>
                                                </div>
                                                <h3 className="font-serif text-xl text-white">Client Gateway</h3>
                                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-lg">
                                                    This is the link your clients visit to view their project vault, preview deliverables, and complete payment. Share this URL after creating a project.
                                                </p>
                                            </div>
                                            <button aria-label="Open Public Portal" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white" title="Preview your client portal">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Portal Subdomain</label>
                                                <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-1 focus-within:border-lime-500/50 transition-colors">
                                                    <span className="text-sm font-mono text-slate-500 mr-1">https://</span>
                                                    <input
                                                        value={formData.subdomain}
                                                        onChange={(e) => handleChange('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                        className="bg-transparent flex-1 text-white font-bold outline-none placeholder:text-slate-600 h-10"
                                                        placeholder="brand"
                                                    />
                                                    <div className="pl-2 text-xs font-mono text-slate-500 border-l border-white/10 ml-2 py-1">
                                                        .truehandover.com
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-500 pl-1">Your clients will access deliverables at this address</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Exit Redirect URL</label>
                                                <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-1 focus-within:border-lime-500/50 transition-colors">
                                                    <input
                                                        value={formData.website}
                                                        onChange={(e) => handleChange('website', e.target.value)}
                                                        className="bg-transparent flex-1 text-white text-sm outline-none placeholder:text-slate-600 h-10"
                                                        placeholder="https://yourportfolio.com"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-500 pl-1">Where clients go when they leave the vault (e.g. your website)</p>
                                            </div>
                                        </div>

                                        {/* Visual flow hint */}
                                        <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-6 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-lime-400"><Globe className="w-3 h-3" /></div>
                                                <span>Client opens link</span>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-white/20" />
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-white/60"><Eye className="w-3 h-3" /></div>
                                                <span>Reviews vault</span>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-white/20" />
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-white/60"><CreditCard className="w-3 h-3" /></div>
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
                                                    <h3 className="font-serif text-lg font-bold">Stripe Connect</h3>
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
                                                            className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${stripeConnecting
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
                                                                className="ml-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
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
                                            <div className="p-2 rounded-lg bg-lime-500/10 text-lime-600 dark:text-[#bef264]"><Banknote className="w-5 h-5" /></div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">Bank Wire</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-1">Routing & Account Details</label>
                                            <textarea
                                                value={formData.bankInfo}
                                                onChange={(e) => handleChange('bankInfo', e.target.value)}
                                                placeholder="Bank Name, SWIFT, IBAN..."
                                                className="w-full p-4 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl focus:border-lime-600 dark:focus:border-[#bef264] outline-none transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[140px] resize-none hover:border-slate-300 dark:hover:border-white/20"
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
                                                    <h3 className="font-serif text-lg text-slate-900 dark:text-white">Whitelabel Domain</h3>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 pl-[34px]">
                                                    Replace the default TrueHandover URL with your own custom domain. Clients will see your brand only.
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
                                                <button className="h-12 px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-opacity">
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
                                            <div className="mt-3 bg-slate-50 dark:bg-[#18181b] rounded-xl p-4 border border-slate-100 dark:border-white/5 font-mono text-xs">
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 font-sans">Add this CNAME record in your domain registrar&apos;s DNS settings:</p>
                                                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-slate-600 dark:text-slate-300">
                                                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-sans">Host</span>
                                                    <span className="text-slate-900 dark:text-white font-bold">portal</span>
                                                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-sans">Value</span>
                                                    <span className="text-lime-600 dark:text-[#bef264]">cname.truehandover.com</span>
                                                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-sans">Type</span>
                                                    <span>CNAME</span>
                                                </div>
                                            </div>
                                        </details>

                                        {/* What this does — visual hint */}
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                                            <Shield className="w-4 h-4 shrink-0" />
                                            <span className="leading-relaxed">Instead of <span className="font-mono text-slate-500 dark:text-slate-400">brand.truehandover.com</span>, your clients see <span className="font-mono font-bold text-slate-700 dark:text-white">{agencySettings.cname || 'portal.youragency.com'}</span></span>
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
                                                <h3 className="font-serif text-xl text-slate-900 dark:text-white">Demo Mode</h3>
                                                <p className="text-xs text-slate-500">Controls whether the app uses pre-populated mock data or your real Supabase backend.</p>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-slate-100 dark:border-white/5 space-y-6">
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
                                                <p className={`text-[11px] leading-relaxed font-medium ${demoMode ? 'text-amber-800 dark:text-amber-200' : 'text-lime-800 dark:text-lime-200'}`}>
                                                    {demoMode
                                                        ? 'Demo mode is active. Pre-populated mock data and mock backend services are in use. File uploads and payments are simulated.'
                                                        : 'Live mode is active. The app is connected to your real Supabase backend. Sign in to load your projects.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 p-4 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-slate-100 dark:border-white/5">
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
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg"><Database className="w-5 h-5 text-slate-500" /></div>
                                                <div>
                                                    <h3 className="font-serif text-xl text-slate-900 dark:text-white">Storage Pipeline</h3>
                                                    <p className="text-xs text-slate-500">Bypass limits with your own cloud.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setStorageMode('s3')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${storageMode === 's3' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>S3 / R2 Bucket</button>
                                                <button onClick={() => setStorageMode('drive')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${storageMode === 'drive' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>Cloud Drive</button>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-slate-100 dark:border-white/5">
                                            {storageMode === null && (
                                                <div className="text-center py-8">
                                                    <Cloud className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                    <p className="text-sm font-medium text-slate-500">Select a provider type above to configure external storage.</p>
                                                </div>
                                            )}

                                            {storageMode === 'drive' && (
                                                <div className="animate-slide-up">
                                                    {connectionError && (
                                                        <InlineErrorBanner
                                                            message={connectionError}
                                                            onDismiss={() => setConnectionError(null)}
                                                            className="mb-4"
                                                        />
                                                    )}
                                                    <div className="space-y-4">
                                                        {([
                                                            {
                                                                provider: 'google' as const,
                                                                name: 'Google Drive',
                                                                icon: HardDrive,
                                                                connectedClasses: 'bg-blue-50 dark:bg-blue-500/10 border-blue-500',
                                                                iconWrapConnectedClasses: 'bg-blue-500/15',
                                                                iconConnectedClasses: 'text-blue-500',
                                                                connected: !!storageConfig.byosGoogleToken
                                                            },
                                                            {
                                                                provider: 'dropbox' as const,
                                                                name: 'Dropbox',
                                                                icon: Box,
                                                                connectedClasses: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500',
                                                                iconWrapConnectedClasses: 'bg-indigo-500/15',
                                                                iconConnectedClasses: 'text-indigo-500',
                                                                connected: !!storageConfig.byosDropboxToken
                                                            },
                                                            {
                                                                provider: 'onedrive' as const,
                                                                name: 'OneDrive',
                                                                icon: Cloud,
                                                                connectedClasses: 'bg-sky-50 dark:bg-sky-500/10 border-sky-500',
                                                                iconWrapConnectedClasses: 'bg-sky-500/15',
                                                                iconConnectedClasses: 'text-sky-500',
                                                                connected: !!storageConfig.byosOneDriveToken
                                                            }
                                                        ] as const).map((item) => {
                                                            const Icon = item.icon;
                                                            const isConnecting = isDriveConnectingByProvider[item.provider];
                                                            const accountLabel = getDriveLabel(item.provider);

                                                            return (
                                                                <div
                                                                    key={item.provider}
                                                                    className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${item.connected ? item.connectedClasses : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#111116]'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.connected ? item.iconWrapConnectedClasses : 'bg-slate-100 dark:bg-white/10'}`}>
                                                                            <Icon className={`w-4 h-4 ${item.connected ? item.iconConnectedClasses : 'text-slate-400'}`} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">{item.name}</p>
                                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                                                                {item.connected
                                                                                    ? accountLabel ? `Connected: ${accountLabel}` : 'Connected'
                                                                                    : `Connect your ${item.name} account for folder import.`}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleConnectDrive(item.provider)}
                                                                            disabled={isConnecting}
                                                                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-60 disabled:cursor-wait cursor-pointer"
                                                                        >
                                                                            {isConnecting ? 'Connecting...' : item.connected ? 'Reconnect' : 'Connect'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDisconnectDrive(item.provider)}
                                                                            disabled={!item.connected}
                                                                            className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                                        >
                                                                            Disconnect
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleTestDriveConnection(item.provider)}
                                                                            disabled={!item.connected}
                                                                            className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                                        >
                                                                            Validate
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                            Connect any combination of providers. TrueHandover will use the right connected account based on each pasted folder link.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {storageMode === 's3' && (
                                                <div className="space-y-6 animate-slide-up">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-xs font-bold uppercase text-slate-500">Provider Preset</span>
                                                        <select
                                                            onChange={(e) => applyStoragePreset(e.target.value)}
                                                            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-orange-500 text-slate-900 dark:text-white cursor-pointer"
                                                            value={storageConfig.provider}
                                                        >
                                                            <option value="r2">Cloudflare R2</option>
                                                            <option value="aws">AWS S3</option>
                                                            <option value="wasabi">Wasabi</option>
                                                            <option value="spaces">DigitalOcean Spaces</option>
                                                            <option value="custom">Custom S3...</option>
                                                        </select>
                                                    </div>

                                                    {storageConfig.provider === 'r2' && (
                                                        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
                                                            <Cloud className="w-5 h-5 text-orange-500 mt-0.5" />
                                                            <div>
                                                                <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400">R2 Configuration</h4>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                                                    Use your Cloudflare Account ID in the endpoint URL. R2 offers zero egress fees, making it ideal for high-bandwidth deliveries.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {connectionError && (
                                                        <InlineErrorBanner
                                                            message={connectionError}
                                                            onDismiss={() => setConnectionError(null)}
                                                            className="mb-2"
                                                        />
                                                    )}

                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <InputField
                                                            label="Endpoint URL"
                                                            value={storageConfig.endpoint}
                                                            onChange={(e: any) => handleStorageChange('endpoint', e.target.value)}
                                                            placeholder="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
                                                            icon={Server}
                                                        />
                                                        <InputField
                                                            label="Bucket Name"
                                                            value={storageConfig.bucket}
                                                            onChange={(e: any) => handleStorageChange('bucket', e.target.value)}
                                                            placeholder="my-vault-bucket"
                                                            icon={Database}
                                                        />
                                                        <InputField
                                                            label="Access Key ID"
                                                            value={storageConfig.accessKey}
                                                            onChange={(e: any) => handleStorageChange('accessKey', e.target.value)}
                                                            type="password"
                                                            placeholder="AKIA..."
                                                            icon={Key}
                                                        />
                                                        <InputField
                                                            label="Secret Access Key"
                                                            value={storageConfig.secretKey || ''}
                                                            onChange={(e: any) => handleStorageChange('secretKey', e.target.value)}
                                                            type="password"
                                                            placeholder="wJalr..."
                                                            icon={Lock}
                                                        />
                                                    </div>

                                                    <div className="pt-4 flex justify-end items-center gap-3 border-t border-slate-200 dark:border-white/5">
                                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                                            {connectionStatus === 'idle' && 'Status: Unknown'}
                                                            {connectionStatus === 'checking' && 'Pinging Bucket...'}
                                                            {connectionStatus === 'connected' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Connected</span>}
                                                            {connectionStatus === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Connection Failed</span>}
                                                        </span>
                                                        <button
                                                            onClick={handleTestConnection}
                                                            disabled={connectionStatus === 'checking'}
                                                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${connectionStatus === 'checking' ? 'bg-slate-100 dark:bg-white/10 text-slate-400 cursor-wait' : 'bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200'}`}
                                                        >
                                                            Test Connection
                                                        </button>
                                                    </div>
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
