import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HardDrive, Cloud, Server, Database, Globe, ExternalLink,
    ShieldCheck, ChevronLeft, CheckCircle, AlertTriangle, Trash2,
    FolderOpen, Archive, RefreshCw, Zap, TrendingUp, Clock,
    FileArchive, Image, Film, FileText, Music, File, Download,
    Upload, Lock, Unlock, Eye, EyeOff, Settings, BarChart3,
    Activity, Layers, Package, Boxes, FolderSync, CloudOff,
    Cpu, Monitor, Wifi, WifiOff, AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { UserProfile, StorageSettings, Project } from '../types';
import { playClick, playSuccess } from '../utils/sound';
import { Card, InlineErrorBanner } from './Shared';
import { SelectField } from './SelectField';
import { isMockMode } from '../config/mockMode';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

const HERO_NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

interface StorageManagementPageProps {
    user: UserProfile;
    onUpdateUser: (updates: Partial<UserProfile>) => void;
    projects?: Project[];
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const parseSizeToBytes = (size?: string): number => {
    if (!size) return 0;
    const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
    return value * (multipliers[unit] || 0);
};

const StorageManagementPage: React.FC<StorageManagementPageProps> = ({ user, onUpdateUser, projects = [] }) => {
    const navigate = useNavigate();
    const [storageSettings, setStorageSettings] = useState<StorageSettings>(user.storageSettings || { mode: 'platform' });
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [driveValidationUrl, setDriveValidationUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'configuration' | 'analytics' | 'cleanup'>('overview');

    const demoMode = isMockMode();
    const nativeStorageCapacityBytes = 30 * 1024 ** 3; // 30GB
    const demoRemainingNativeStorageBytes = 10 * 1024 ** 3; // keep in sync with dashboard widgets
    const demoUsedNativeStorageBytes = nativeStorageCapacityBytes - demoRemainingNativeStorageBytes;

    const totalBytes = projects.reduce((sum, p) => sum + (p.files || []).reduce((s, f) => s + parseSizeToBytes(f.size), 0), 0);
    const totalFiles = projects.reduce((sum, p) => sum + (p.files || []).length, 0);
    const usedBytesRaw = demoMode ? demoUsedNativeStorageBytes : totalBytes;
    const usedBytes = Math.max(0, Math.min(nativeStorageCapacityBytes, usedBytesRaw));
    const usagePercent = Math.round((usedBytes / nativeStorageCapacityBytes) * 100);

    const storageBreakdown = demoMode
        ? [
            { type: 'Videos', bytes: 10 * 1024 ** 3, color: 'bg-indigo-500', files: 23 },
            { type: 'Images', bytes: 6 * 1024 ** 3, color: 'bg-sky-400', files: 142 },
            { type: 'Documents', bytes: 4 * 1024 ** 3, color: 'bg-lime-300', files: 67 },
        ]
        : (() => {
            const acc = projects.reduce<Record<string, { bytes: number; files: number }>>((map, p) => {
                (p.files || []).forEach((f) => {
                    const bucket = f.type === 'video' ? 'Videos' : f.type === 'image' ? 'Images' : 'Documents';
                    if (!map[bucket]) map[bucket] = { bytes: 0, files: 0 };
                    map[bucket].bytes += parseSizeToBytes(f.size);
                    map[bucket].files += 1;
                });
                return map;
            }, {});
            return [
                { type: 'Videos', bytes: acc.Videos?.bytes || 0, color: 'bg-indigo-500', files: acc.Videos?.files || 0 },
                { type: 'Images', bytes: acc.Images?.bytes || 0, color: 'bg-sky-400', files: acc.Images?.files || 0 },
                { type: 'Documents', bytes: acc.Documents?.bytes || 0, color: 'bg-lime-300', files: acc.Documents?.files || 0 },
            ].filter(item => item.bytes > 0 || item.files > 0);
        })();

    const recentActivity = [
        { action: 'Upload', file: 'Brand_Guidelines_v2.pdf', size: '2.4 MB', time: '2 minutes ago', icon: Upload },
        { action: 'Delete', file: 'old_logo_concepts.zip', size: '15.2 MB', time: '1 hour ago', icon: Trash2 },
        { action: 'Archive', file: 'Q3_Campaign_Assets', size: '124 MB', time: '3 hours ago', icon: Archive },
        { action: 'Sync', file: 'Client_Feedback_Round2.mov', size: '89 MB', time: '5 hours ago', icon: RefreshCw },
    ];

    const handleSave = () => {
        playClick();
        setIsSaving(true);
        onUpdateUser({ storageSettings });
        setTimeout(() => {
            setIsSaving(false);
            playSuccess();
        }, 1500);
    };

    const TabButton = ({ id, label, icon: Icon }: { id: string, label: string, icon: React.ElementType }) => (
        <button
            onClick={() => { playClick(); setActiveTab(id as any); }}
        className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id
                ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/70 dark:border-white/12'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
            }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );

    return (
        <div className="space-y-6 animate-slide-up relative z-10 pb-12 w-full">
            {/* Page Header - Matches Trash Page Style */}
            <div className="flex flex-col gap-4 border-b border-zinc-200/50 dark:border-white/[0.06] pb-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <button
                            onClick={() => { playClick(); navigate(-1); }}
                            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors mb-3"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <h2 className="text-3xl lg:text-4xl font-sans tracking-tight text-zinc-900 dark:text-white">
                            Storage Management
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                            Monitor usage and configure your storage infrastructure.
                        </p>
                    </div>
                </div>

                {/* Merged Storage Usage Bar */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Storage Usage</span>
                        <span className={`text-xs font-medium ${
                            usagePercent > 80 ? 'text-red-600 dark:text-red-400' :
                            usagePercent > 60 ? 'text-amber-600 dark:text-amber-400' :
                            'text-green-600 dark:text-green-400'
                        }`}>
                            {usagePercent}% Used
                        </span>
                    </div>
                    <div className="h-2 bg-zinc-200/50 dark:bg-white/[0.08] rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-1000 dark:from-blue-500 dark:to-sky-400"
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{formatBytes(usedBytes)} of {formatBytes(nativeStorageCapacityBytes)}</span>
                        <span>{totalFiles} files • {formatBytes(Math.max(nativeStorageCapacityBytes - usedBytes, 0))} free</span>
                    </div>
                </div>

                {/* Storage Breakdown - Merged from Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    {(storageBreakdown.length > 0 ? storageBreakdown : [{ type: 'No files', bytes: 0, color: 'bg-zinc-400', files: 0 }]).map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-2 ${item.color} rounded-full`} />
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">{item.type}</span>
                            </div>
                            <div className="text-sm text-zinc-900 dark:text-white">{formatBytes(item.bytes)}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.files} files</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2">
                <TabButton id="overview" label="Overview" icon={BarChart3} />
                <TabButton id="configuration" label="Configuration" icon={Settings} />
                <TabButton id="analytics" label="Analytics" icon={TrendingUp} />
                <TabButton id="cleanup" label="Cleanup" icon={Trash2} />
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2">
                        <Card className="p-6">
                            <h3 className="text-sm text-zinc-900 dark:text-white mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {recentActivity.map((activity, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                        <div className={`p-2 rounded-lg ${
                                            activity.action === 'Upload' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                            activity.action === 'Delete' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                            activity.action === 'Archive' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-lime-400'
                                        }`}>
                                            <activity.icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-zinc-900 dark:text-white truncate">{activity.file}</div>
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{activity.action} • {activity.size}</div>
                                        </div>
                                        <div className="text-xs text-zinc-400">{activity.time}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <Card className="p-6">
                            <h3 className="text-sm text-zinc-900 dark:text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full p-3 rounded-lg border border-zinc-200 dark:border-white/10 hover:border-lime-400/50 dark:hover:border-lime-400/50 transition-all text-left group">
                                    <div className="flex items-center gap-3">
                                        <Archive className="w-4 h-4 text-blue-600 dark:text-lime-400" />
                                        <div>
                                            <div className="text-xs text-zinc-900 dark:text-white">Archive Old Files</div>
                                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Free up 2.3 GB</div>
                                        </div>
                                    </div>
                                </button>
                                
                                <button className="w-full p-3 rounded-lg border border-zinc-200 dark:border-white/10 hover:border-green-500/50 dark:hover:border-green-500/50 transition-all text-left group">
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <div>
                                            <div className="text-xs text-zinc-900 dark:text-white">Sync Cloud Storage</div>
                                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Last sync: 2h ago</div>
                                        </div>
                                    </div>
                                </button>
                                
                                <button className="w-full p-3 rounded-lg border border-zinc-200 dark:border-white/10 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all text-left group">
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <div>
                                            <div className="text-xs text-zinc-900 dark:text-white">Optimize Storage</div>
                                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Run optimization</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'configuration' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg text-slate-900 dark:text-white mb-6">Storage Configuration</h3>
                        
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => { playClick(); setStorageSettings(prev => ({ ...prev, mode: 'platform' })); }}
                                    className={`h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        storageSettings.mode === 'platform' 
                                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10'
                                    }`}
                                >
                                    Platform
                                </button>
                                <button
                                    onClick={() => { playClick(); setStorageSettings(prev => ({ ...prev, mode: 'drive' })); }}
                                    className={`h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        storageSettings.mode === 'drive' 
                                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10'
                                    }`}
                                >
                                    Cloud Drive
                                </button>
                                <button
                                    onClick={() => { playClick(); setStorageSettings(prev => ({ ...prev, mode: 's3' })); }}
                                    className={`h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        storageSettings.mode === 's3' 
                                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10'
                                    }`}
                                >
                                    S3 / R2
                                </button>
                            </div>

                            {connectionError && <InlineErrorBanner message={connectionError} onDismiss={() => setConnectionError(null)} />}

                            {/* Configuration details based on selected mode */}
                            {storageSettings.mode === 'platform' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                                        <div className="flex items-start gap-4">
                                            <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
                                            <div>
                                                <h4 className="text-sm text-slate-900 dark:text-white mb-2">Secure Platform Storage</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    Enterprise-grade storage with automatic backups, encryption at rest, and global CDN distribution.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                                        <div className="flex items-start gap-4">
                                            <Zap className="w-6 h-6 text-blue-600 dark:text-lime-400 mt-1" />
                                            <div>
                                                <h4 className="text-sm text-slate-900 dark:text-white mb-2">High Performance</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    Optimized for fast uploads and downloads with intelligent caching and compression.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {storageSettings.mode === 'drive' && (
                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl border border-blue-200 dark:border-lime-400/20 bg-blue-50 dark:bg-lime-400/5">
                                        <div className="flex items-start gap-4">
                                            <Cloud className="w-6 h-6 text-blue-600 dark:text-lime-400 mt-1" />
                                            <div>
                                                <h4 className="text-sm text-slate-900 dark:text-white mb-2">Cloud Drive Integration</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    Connect your Google Drive, Dropbox, or OneDrive for seamless file synchronization and backup.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="block text-sm text-slate-700 dark:text-slate-300">Drive provider</label>
                                            <SelectField
                                                value={storageSettings.byosDriveProvider || 'google'}
                                                onChange={(value) =>
                                                    setStorageSettings((prev) => ({
                                                        ...prev,
                                                        byosDriveProvider: value as NonNullable<StorageSettings['byosDriveProvider']>,
                                                    }))
                                                }
                                                options={[
                                                    { value: 'google', label: 'Google Drive' },
                                                    { value: 'dropbox', label: 'Dropbox' },
                                                    { value: 'onedrive', label: 'OneDrive' },
                                                ]}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-sm text-slate-700 dark:text-slate-300">Account label</label>
                                            <input
                                                type="text"
                                                value={storageSettings.byosDriveAccountLabel || ''}
                                                onChange={(e) =>
                                                    setStorageSettings((prev) => ({ ...prev, byosDriveAccountLabel: e.target.value }))
                                                }
                                                placeholder="e.g. studio.drive@gmail.com"
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-lime-400 dark:focus:border-lime-300 outline-none transition-colors"
                                            />
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Non-sensitive label only — OAuth tokens are not stored in the browser.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {storageSettings.mode === 's3' && (
                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/5">
                                        <div className="flex items-start gap-4">
                                            <Server className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-1" />
                                            <div>
                                                <h4 className="text-sm text-slate-900 dark:text-white mb-2">S3-Compatible Storage</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    Connect to AWS S3, Cloudflare R2, or any S3-compatible storage provider for maximum control and scalability.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="block text-sm text-slate-700 dark:text-slate-300">Provider</label>
                                            <SelectField
                                                value={storageSettings.s3Provider || 'aws'}
                                                onChange={(value) =>
                                                    setStorageSettings((prev) => ({
                                                        ...prev,
                                                        s3Provider: value as NonNullable<StorageSettings['s3Provider']>,
                                                    }))
                                                }
                                                options={[
                                                    { value: 'aws', label: 'Amazon S3' },
                                                    { value: 'r2', label: 'Cloudflare R2' },
                                                    { value: 'custom', label: 'Custom S3 endpoint' },
                                                ]}
                                            />
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <label className="block text-sm text-slate-700 dark:text-slate-300">Region</label>
                                            <input
                                                type="text"
                                                value={storageSettings.s3Region || 'us-east-1'}
                                                onChange={(e) => setStorageSettings(prev => ({ ...prev, s3Region: e.target.value }))}
                                                placeholder="us-east-1"
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-lime-400 dark:focus:border-lime-300 outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-sm text-slate-700 dark:text-slate-300">Bucket Name</label>
                                        <input
                                            type="text"
                                            value={storageSettings.s3Bucket || ''}
                                            onChange={(e) => setStorageSettings(prev => ({ ...prev, s3Bucket: e.target.value }))}
                                            placeholder="my-Sendational-bucket"
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-lime-400 dark:focus:border-lime-300 outline-none transition-colors"
                                        />
                                    </div>

                                    {storageSettings.s3Provider === 'custom' && (
                                        <div className="space-y-4">
                                            <label className="block text-sm text-slate-700 dark:text-slate-300">Custom Endpoint</label>
                                            <input
                                                type="url"
                                                value={storageSettings.s3Endpoint || ''}
                                                onChange={(e) => setStorageSettings(prev => ({ ...prev, s3Endpoint: e.target.value }))}
                                                placeholder="https://s3.example.com"
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-lime-400 dark:focus:border-lime-300 outline-none transition-colors"
                                            />
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
                                        Secret keys and OAuth tokens are not stored client-side. Sendational uses server-issued presigned URLs for BYOS; configure credentials in your deployment environment.
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end mt-8">
                            <button
                                onClick={handleSave}
                                className={`h-12 px-8 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                                    isSaving
                                        ? 'bg-zinc-100 dark:bg-white/10 text-zinc-400 cursor-wait'
                                        : 'bg-lime-400 text-zinc-950 hover:opacity-95 shadow-lg'
                                }`}
                            >
                                {isSaving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="text-sm text-zinc-900 dark:text-white mb-4">Storage Trends (Last 30 Days)</h3>
                        <div className="h-64 bg-zinc-50 dark:bg-white/[0.02] rounded-xl flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[
                                    { day: 'Day 1', usage: 8 },
                                    { day: 'Day 5', usage: 10 },
                                    { day: 'Day 10', usage: 12 },
                                    { day: 'Day 15', usage: 14 },
                                    { day: 'Day 20', usage: 16 },
                                    { day: 'Day 25', usage: 18 },
                                    { day: 'Day 30', usage: 20 },
                                ]}>
                                    <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Line type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    
                    <Card className="p-6">
                        <h3 className="text-sm text-zinc-900 dark:text-white mb-4">Performance Metrics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-50 dark:bg-white/[0.02]">
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">Upload Speed</span>
                                <span className="text-sm text-zinc-900 dark:text-white">45.2 MB/s</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-50 dark:bg-white/[0.02]">
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">Download Speed</span>
                                <span className="text-sm text-zinc-900 dark:text-white">78.9 MB/s</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-50 dark:bg-white/[0.02]">
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">Uptime</span>
                                <span className="text-sm text-green-600 dark:text-green-400">99.97%</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-50 dark:bg-white/[0.02]">
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">Total Requests</span>
                                <span className="text-sm text-zinc-900 dark:text-white">1,247,892</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-50 dark:bg-white/[0.02]">
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">Avg Response Time</span>
                                <span className="text-sm text-zinc-900 dark:text-white">124ms</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'cleanup' && (
                <div className="space-y-6">
                    <Card className="relative overflow-hidden p-6 md:p-7 border border-zinc-200/60 dark:border-white/[0.08] bg-white dark:bg-charcoal shadow-sm dark:shadow-md">
                        <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{ backgroundImage: HERO_NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-2">Cleanup Studio</p>
                                <h3 className="font-sans tracking-tight text-2xl md:text-3xl text-zinc-900 dark:text-white">Reclaim space without risking active delivery.</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
                                    Review impact before every action. Suggestions are prioritized by recoverable size and confidence.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 md:min-w-[280px]">
                                <div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/80 dark:bg-white/5 p-3">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Potential Recovery</p>
                                    <p className="font-sans tracking-tight text-lg text-zinc-900 dark:text-white">9.3 GB</p>
                                </div>
                                <div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/80 dark:bg-white/5 p-3">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Items Scanned</p>
                                    <p className="font-sans tracking-tight text-lg text-zinc-900 dark:text-white">{totalFiles}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="relative overflow-hidden p-6 border border-zinc-200/60 dark:border-white/[0.08] bg-white dark:bg-charcoal shadow-sm dark:shadow-md">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 border border-red-200/60 dark:border-red-500/25">High impact</div>
                                    <h4 className="text-base font-semibold text-zinc-900 dark:text-white mt-3">Delete Duplicates</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Identify repeated assets across projects and remove redundant copies.</p>
                                </div>
                                <div className="h-10 w-10 rounded-xl border border-red-200/60 dark:border-red-500/25 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 flex items-center justify-center">
                                    <FileArchive className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/90 dark:bg-white/5 p-3 space-y-2 mb-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 dark:text-zinc-400">Recoverable</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">~2.3 GB</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 dark:text-zinc-400">Confidence</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">92%</span>
                                </div>
                            </div>
                            <button className="w-full h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                                Scan & Review
                            </button>
                        </Card>

                        <Card className="relative overflow-hidden p-6 border border-zinc-200/60 dark:border-white/[0.08] bg-white dark:bg-charcoal shadow-sm dark:shadow-md">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/25">Safest first</div>
                                    <h4 className="text-base font-semibold text-zinc-900 dark:text-white mt-3">Archive Old Files</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Move dormant assets to cold storage while keeping retrieval available.</p>
                                </div>
                                <div className="h-10 w-10 rounded-xl border border-amber-200/60 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                                    <Archive className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/90 dark:bg-white/5 p-3 space-y-2 mb-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 dark:text-zinc-400">Archivable</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">~4.7 GB</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 dark:text-zinc-400">Age Rule</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">6+ months</span>
                                </div>
                            </div>
                            <button className="w-full h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                                Create Archive Plan
                            </button>
                        </Card>

                        <Card className="relative overflow-hidden p-6 border border-zinc-200/60 dark:border-white/[0.08] bg-white dark:bg-charcoal shadow-sm dark:shadow-md">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-lime-400/15 dark:text-blue-300 border border-blue-200/60 dark:border-lime-400/25">Lossless</div>
                                    <h4 className="text-base font-semibold text-zinc-900 dark:text-white mt-3">Compress Files</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Optimize oversized media and documents while preserving quality.</p>
                                </div>
                                <div className="h-10 w-10 rounded-xl border border-blue-200/60 dark:border-lime-400/25 bg-blue-50 dark:bg-lime-400/10 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                                    <Zap className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/90 dark:bg-white/5 p-3 space-y-2 mb-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 dark:text-zinc-400">Savings</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">~1.8 GB</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 dark:text-zinc-400">Estimated Time</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">~14 min</span>
                                </div>
                            </div>
                            <button className="w-full h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                                Start Optimization
                            </button>
                        </Card>

                        <Card className="relative overflow-hidden p-6 border border-zinc-200/60 dark:border-white/[0.08] bg-white dark:bg-charcoal shadow-sm dark:shadow-md">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/15">Manual</div>
                                    <h4 className="text-base font-semibold text-zinc-900 dark:text-white mt-3">Empty Trash</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Permanently remove items currently in trash. This action cannot be undone.</p>
                                </div>
                                <div className="h-10 w-10 rounded-xl border border-zinc-200/60 dark:border-white/15 bg-zinc-50 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/90 dark:bg-white/5 p-3 space-y-2 mb-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 dark:text-zinc-400">In Trash</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">0.5 GB</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 dark:text-zinc-400">Retention</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">30 days</span>
                                </div>
                            </div>
                            <button className="w-full h-10 rounded-xl border border-zinc-300 dark:border-white/20 bg-transparent text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                                Review Trash First
                            </button>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorageManagementPage;