/**
 * DesignShowcase.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * A fully self-contained design playground. 5 premium layout variants, each
 * covering Dashboard / Projects / Activity / Reports / Settings.
 *
 * Uses Sendational's own lime accent + dark-mode tokens — only layout, spacing
 * and UI chrome varies between variants.
 *
 * To remove: delete this file, remove the /design-showcase route from App.tsx
 * and the DesignShowcaseButton from the header.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
    X, LayoutDashboard, LockKeyhole, Activity as ActivityIcon,
    PieChart, Settings, ArrowUpRight, ArrowDownRight,
    CreditCard, Upload, Eye, Lock, Plus, Check, ChevronRight,
    Sparkles, HardDrive, Bell, Search, User, FileText, Banknote,
    TrendingUp, TrendingDown, Circle, MoreHorizontal, Filter,
    ShieldCheck, DollarSign, Clock, Zap, BarChart3, Download,
    Folder, FolderLock, Crown, AlertCircle, CheckCircle,
    Send, Globe, Mail, Key, Palette, MessageSquare, Users
} from 'lucide-react';
import { Project, UserProfile } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
type Variant = 'sidebar-classic' | 'bold-dark' | 'focus-flow' | 'command-center' | 'analytics-hub';
type Section = 'dashboard' | 'vault' | 'activity' | 'reports' | 'settings';

interface ShowcaseProps {
    isDarkMode: boolean;
    user: UserProfile;
    projects: Project[];
    onClose: () => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_REVENUE = [14, 22, 18, 31, 26, 40, 34, 52, 44, 60, 54, 72];
const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MOCK_PROJECTS = [
    { name: 'Brand Identity', client: 'Vertex Corp', amount: 4500, status: 'pending', due: 'Mar 12' },
    { name: 'Website Redesign', client: 'Sarah Chen', amount: 8200, status: 'active', due: 'Mar 20' },
    { name: 'Mobile App UI', client: 'Mike Ross', amount: 12000, status: 'paid', due: 'Feb 28' },
    { name: 'Q4 Campaign', client: 'Axis Media', amount: 3200, status: 'draft', due: 'Apr 5' },
    { name: 'Logo Suite', client: 'TrendCo', amount: 1800, status: 'paid', due: 'Feb 15' },
];
const MOCK_ACTIVITY = [
    { icon: CreditCard, label: 'Payment Received', detail: 'Vertex Corp · $4,500', time: '2m ago', color: 'lime' },
    { icon: Eye, label: 'Client Viewed', detail: 'Sarah Chen · Website Redesign', time: '14m ago', color: 'blue' },
    { icon: Upload, label: 'File Uploaded', detail: 'Brand_Final.zip · 47MB', time: '1h ago', color: 'slate' },
    { icon: Lock, label: 'Assets locked', detail: 'Mobile App UI · 3 files', time: '3h ago', color: 'amber' },
    { icon: Send, label: 'Invoice Sent', detail: '#INV-2024-018 · Axis Media', time: '5h ago', color: 'slate' },
    { icon: CheckCircle, label: 'Project Completed', detail: 'Logo Suite · TrendCo', time: 'Yesterday', color: 'lime' },
    { icon: Eye, label: 'Client Viewed', detail: 'Mike Ross · Mobile App UI', time: 'Yesterday', color: 'blue' },
    { icon: CreditCard, label: 'Payment Received', detail: 'TrendCo · $1,800', time: '2d ago', color: 'lime' },
];

// ─── Micro chart (inline sparkline SVG) ───────────────────────────────────────
const Sparkline = ({ data, color = '#a3e635', height = 40, width = 120 }: { data: number[]; color?: string; height?: number; width?: number }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
            <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

// ─── Bar chart (mini) ─────────────────────────────────────────────────────────
const MiniBarChart = ({ data, accent }: { data: number[]; accent: string }) => {
    const max = Math.max(...data);
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((v, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all"
                    style={{ height: `${(v / max) * 100}%`, background: i === data.length - 1 ? accent : 'rgba(100,116,139,0.2)' }} />
            ))}
        </div>
    );
};

// ─── Status pill ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
        active: 'bg-blue-100 text-blue-700 dark:bg-lime-400/15 dark:text-lime-400',
        paid: 'bg-blue-100 text-lime-400 dark:bg-lime-400/15 dark:text-lime-400',
        draft: 'bg-zinc-200 text-zinc-500 dark:bg-white/5 dark:text-zinc-400',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] || map.draft}`}>
            {status}
        </span>
    );
};

// ─── VARIANT META ─────────────────────────────────────────────────────────────
const VARIANTS: { id: Variant; label: string; desc: string; ref: string }[] = [
    { id: 'sidebar-classic', label: 'Sidebar Classic', desc: 'Fixed left sidebar', ref: '① Payflow' },
    { id: 'bold-dark', label: 'Bold Dynamic', desc: 'Dark sidebar, bold KPIs', ref: '② Flux' },
    { id: 'focus-flow', label: 'Focus Flow', desc: 'Floating pill nav, minimal chrome', ref: '③ Clean' },
    { id: 'command-center', label: 'Command Center', desc: 'Multi-pane, dense info', ref: '④ Celoxis' },
    { id: 'analytics-hub', label: 'Analytics Hub', desc: 'Top tabs, modular grid', ref: '⑤ Syncdesk' },
];

const SECTIONS: { id: Section; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'Projects', icon: LockKeyhole },
    { id: 'activity', label: 'Activity', icon: ActivityIcon },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
];

// ══════════════════════════════════════════════════════════════════════════════
// VARIANT 1 — SIDEBAR CLASSIC  (Payflow / image 1)
// ══════════════════════════════════════════════════════════════════════════════
const SidebarClassicContent = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const accentText = isDark ? 'text-lime-400' : 'text-lime-400';
    const accentBg = isDark ? 'bg-lime-400 text-black' : 'bg-lime-400 text-white';
    const cardBg = isDark ? 'bg-[#1e1e28] border-white/10' : 'glass-panel';
    const subText = isDark ? 'text-zinc-400' : 'text-zinc-500';
    const hrCol = isDark ? 'border-white/10' : 'border-zinc-200';

    if (section === 'dashboard') return (
        <div className="space-y-6">
            <h1 className={`font-sans tracking-tight text-3xl font-bold ${isDark ? 'text-white' : 'text-obsidian'}`}>
                Good afternoon, <span className={accentText}>Joshua.</span>
            </h1>
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Net Revenue', value: '$29,450', change: '+12.5%', up: true },
                    { label: 'Active Projects', value: '8', change: '+2 this week', up: true },
                    { label: 'Pending Payments', value: '$6,200', change: '2 invoices', up: false },
                    { label: 'Completed', value: '24', change: 'All time', up: true },
                ].map(k => (
                    <div key={k.label} className={`${cardBg} border rounded-2xl p-5`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${subText} mb-2`}>{k.label}</p>
                        <p className={`font-sans tracking-wide text-2xl font-bold ${isDark ? 'text-white' : 'text-obsidian'}`}>{k.value}</p>
                        <p className={`text-xs mt-1 flex items-center gap-1 ${k.up ? accentText : 'text-amber-500'}`}>
                            {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {k.change}
                        </p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className={`${cardBg} border rounded-2xl p-5 col-span-2`}>
                    <div className="flex justify-between items-center mb-4">
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-800'}`}>Revenue Trend</p>
                        <span className={`text-[10px] font-bold uppercase ${subText}`}>Last 12 mo</span>
                    </div>
                    <div className="flex items-end gap-2 h-24">
                        {MOCK_REVENUE.map((v, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full rounded-sm transition-all"
                                    style={{ height: `${(v / 72) * 80}px`, background: i === 11 ? (isDark ? '#a3e635' : '#a3e635') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)') }} />
                                <span className={`text-[9px] ${subText}`}>{MONTH_LABELS[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`${cardBg} border rounded-2xl p-5 flex flex-col gap-3`}>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-800'} mb-1`}>Recent Clients</p>
                    {['Vertex Corp', 'Sarah Chen', 'Mike Ross'].map(n => (
                        <div key={n} className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-editorial'} cursor-pointer`}>
                            <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-white/10' : 'bg-zinc-200'} flex items-center justify-center ${accentText} text-xs font-bold`}>{n[0]}</div>
                            <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>{n}</span>
                            <ChevronRight className={`w-3 h-3 ml-auto ${subText}`} />
                        </div>
                    ))}
                </div>
            </div>
            <div className={`${cardBg} border rounded-2xl`}>
                <div className="flex items-center justify-between p-5 pb-3">
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-800'}`}>Active Projects</p>
                    <button className={`text-xs ${accentText} font-bold`}>View all</button>
                </div>
                <div className={`border-t ${hrCol}`}>
                    {MOCK_PROJECTS.slice(0, 4).map((p, i) => (
                        <div key={i} className={`flex items-center justify-between px-5 py-3 border-b ${hrCol} last:border-0 ${isDark ? 'hover:bg-white/5' : 'hover:bg-editorial'} transition-colors`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-white/10' : 'bg-zinc-200'} flex items-center justify-center text-xs font-bold ${accentText}`}>{p.name[0]}</div>
                                <div>
                                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-obsidian'}`}>{p.name}</p>
                                    <p className={`text-[10px] ${subText}`}>{p.client}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className={`font-mono text-sm font-bold tracking-wide ${isDark ? 'text-white' : 'text-obsidian'}`}>${p.amount.toLocaleString()}</p>
                                <StatusBadge status={p.status} />
                                <span className={`text-[10px] ${subText} font-mono`}>{p.due}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (section === 'vault') return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h1 className={`font-sans tracking-tight text-2xl font-bold ${isDark ? 'text-white' : 'text-obsidian'}`}>Projects</h1>
                <button className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${accentBg} flex items-center gap-2`}><Plus className="w-3 h-3" />New Project</button>
            </div>
            <div className="grid grid-cols-5 gap-3">
                {MOCK_PROJECTS.map((p, i) => (
                    <div key={i} className={`${cardBg} border rounded-2xl p-4 hover:border-lime-400/50 transition-all cursor-pointer group`}>
                        <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${isDark ? 'bg-lime-400/10' : 'bg-blue-50'} ${accentText}`}><FolderLock className="w-5 h-5" /></div>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-obsidian'} mb-0.5`}>{p.name}</p>
                        <p className={`text-[10px] ${subText}`}>{p.client}</p>
                        <div className="mt-3 pt-3 border-t border-dashed ${hrCol} flex justify-between items-center">
                            <StatusBadge status={p.status} />
                            <span className={`font-mono text-xs font-bold ${accentText}`}>${p.amount.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (section === 'activity') return (
        <div className="space-y-5">
            <h1 className={`font-sans tracking-tight text-2xl font-bold ${isDark ? 'text-white' : 'text-obsidian'}`}>Activity Log</h1>
            <div className={`${cardBg} border rounded-2xl divide-y ${isDark ? 'divide-white/5' : 'divide-zinc-100'}`}>
                {MOCK_ACTIVITY.map((a, i) => {
                    const dotColor = a.color === 'lime' ? 'bg-lime-400' : a.color === 'blue' ? 'bg-lime-400' : a.color === 'amber' ? 'bg-amber-500' : 'bg-zinc-400';
                    return (
                        <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${isDark ? 'hover:bg-white/5' : 'hover:bg-editorial'} transition-colors`}>
                            <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-white/5' : 'bg-zinc-200'} flex items-center justify-center`}><a.icon className={`w-4 h-4 ${subText}`} /></div>
                            <div className="flex-1">
                                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-obsidian'}`}>{a.label}</p>
                                <p className={`text-xs ${subText}`}>{a.detail}</p>
                            </div>
                            <span className={`text-[10px] font-mono ${subText}`}>{a.time}</span>
                            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (section === 'reports') return (
        <div className="space-y-5">
            <h1 className={`font-sans tracking-tight text-2xl font-bold ${isDark ? 'text-white' : 'text-obsidian'}`}>Reports</h1>
            <div className="grid grid-cols-2 gap-4">
                {[{ label: 'Total Revenue', value: '$48,200', sub: '+18% vs last quarter' }, { label: 'Total Payments', value: '24', sub: '3 pending verification' }].map(k => (
                    <div key={k.label} className={`${cardBg} border rounded-2xl p-6`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${subText} mb-2`}>{k.label}</p>
                        <p className={`font-sans tracking-tight text-4xl font-bold ${isDark ? 'text-white' : 'text-obsidian'} mb-1`}>{k.value}</p>
                        <p className={`text-xs ${accentText} font-bold`}>{k.sub}</p>
                        <div className="mt-4"><MiniBarChart data={MOCK_REVENUE} accent={isDark ? '#a3e635' : '#a3e635'} /></div>
                    </div>
                ))}
            </div>
            <div className={`${cardBg} border rounded-2xl p-5`}>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-800'} mb-4`}>Revenue by Project</p>
                {MOCK_PROJECTS.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                        <span className={`text-xs font-bold w-32 truncate ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{p.name}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden bg-zinc-200 dark:bg-white/5">
                            <div className="h-full rounded-full" style={{ width: `${(p.amount / 12000) * 100}%`, background: isDark ? '#a3e635' : '#a3e635' }} />
                        </div>
                        <span className={`text-xs font-mono font-bold ${accentText} w-16 text-right`}>${p.amount.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            <h1 className={`font-sans tracking-tight text-2xl font-bold ${isDark ? 'text-white' : 'text-obsidian'}`}>Settings</h1>
            {[{ label: 'Profile', icon: User, items: ['Display Name', 'Email Address', 'Avatar'] }, { label: 'Payments', icon: CreditCard, items: ['Stripe Connect', 'Bank Account', 'Payout Schedule'] }, { label: 'Security', icon: ShieldCheck, items: ['Password', '2FA', 'Active Sessions'] }].map(g => (
                <div key={g.label} className={`${cardBg} border rounded-2xl`}>
                    <div className={`flex items-center gap-3 p-5 pb-3`}>
                        <g.icon className={`w-5 h-5 ${accentText}`} /><p className={`font-bold ${isDark ? 'text-white' : 'text-obsidian'}`}>{g.label}</p>
                    </div>
                    {g.items.map((item, i) => (
                        <div key={i} className={`flex items-center justify-between px-5 py-3.5 border-t ${hrCol} ${isDark ? 'hover:bg-white/5' : 'hover:bg-editorial'} cursor-pointer`}>
                            <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{item}</span>
                            <ChevronRight className={`w-4 h-4 ${subText}`} />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

const SidebarClassicLayout = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const bg = isDark ? 'bg-black' : 'bg-[#f4f5f7]';
    const sidebarBg = isDark ? 'bg-[#111118] border-white/10' : 'glass-panel';
    const activeItem = isDark ? 'bg-lime-400/10 text-lime-400' : 'bg-blue-50 text-lime-400';
    const inactiveItem = isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-obsidian hover:bg-editorial';

    return (
        <div className={`flex h-full w-full ${bg}`}>
            {/* Sidebar */}
            <div className={`w-52 shrink-0 ${sidebarBg} border-r flex flex-col py-6`}>
                <div className="px-5 mb-8 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-lime-400 dark:bg-lime-400 flex items-center justify-center"><Zap className="w-4 h-4 text-white dark:text-black" /></div>
                    <span className={`font-sans tracking-tight font-bold text-base ${isDark ? 'text-white' : 'text-obsidian'}`}>Sendational</span>
                </div>
                <nav className="flex-1 px-3 space-y-1">
                    {SECTIONS.map(s => (
                        <div key={s.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${s.id === section ? activeItem : inactiveItem}`}>
                            <s.icon className="w-4 h-4 shrink-0" />{s.label}
                        </div>
                    ))}
                </nav>
                <div className={`mx-3 mt-4 p-3 rounded-xl ${isDark ? 'bg-lime-400/10 border border-lime-400/20' : 'bg-blue-50 border border-blue-100'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-lime-400' : 'text-lime-400'}`}>Storage</p>
                    <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-blue-100'} overflow-hidden`}>
                        <div className="h-full w-[8%] rounded-full bg-lime-400" />
                    </div>
                    <p className={`text-[9px] mt-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>2.4 GB of 30 GB used</p>
                </div>
            </div>
            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className={`h-14 px-6 flex items-center justify-between border-b ${isDark ? 'bg-[#111118] border-white/10' : 'glass-panel'}`}>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/5 text-zinc-400' : 'bg-zinc-200 text-zinc-400'} text-sm`}>
                        <Search className="w-4 h-4" /><span className="text-xs">Search…</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Bell className={`w-5 h-5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                        <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center text-white text-xs font-bold">J</div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6"><SidebarClassicContent section={section} isDark={isDark} /></div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// VARIANT 2 — BOLD DARK  (Flux Health / image 2)
// ══════════════════════════════════════════════════════════════════════════════
const BoldDarkContent = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const acc = '#a3e635';
    const card = isDark ? 'bg-[#1a1a22] border-white/8' : 'glass-panel';
    const sub = isDark ? 'text-zinc-400' : 'text-zinc-500';

    if (section === 'dashboard') return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="text-4xl font-semibold text-white">Overview</h1><p className="text-zinc-400 text-sm mt-0.5">All projects · Feb 2026</p></div>
                <button className="px-4 py-2 rounded-2xl text-xs font-semibold uppercase tracking-wider" style={{ background: acc, color: '#000' }}><Plus className="w-3.5 h-3.5 inline mr-1" />NEW PROJECT</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[{ l: 'Revenue', v: '$29,450', d: '+12.5%', g: [20, 35, 28, 44, 36, 55, 48, 68] }, { l: 'Projects', v: '8 Active', d: '+2 this week', g: [3, 5, 4, 7, 5, 8, 7, 8] }, { l: 'Pending', v: '$6,200', d: '2 invoices', g: [8, 12, 9, 14, 10, 16, 12, 18] }].map(k => (
                    <div key={k.l} className={`${card} border rounded-3xl p-5`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-widest ${sub} mb-3`}>{k.l}</p>
                        <p className={`text-3xl font-semibold text-white mb-1`}>{k.v}</p>
                        <p className="text-xs font-bold mb-4" style={{ color: acc }}>{k.d}</p>
                        <Sparkline data={k.g} color={acc} width={160} height={48} />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-5 gap-4">
                <div className={`${card} border rounded-3xl p-5 col-span-3`}>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-semibold text-white">Performance</p>
                        <span className={`text-[10px] font-semibold uppercase ${sub}`}>Monthly</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-28">
                        {MOCK_REVENUE.map((v, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full rounded-lg transition-all"
                                    style={{ height: `${(v / 72) * 100}px`, background: i >= 10 ? acc : 'rgba(255,255,255,0.07)' }} />
                                <span className="text-[8px] text-zinc-600 font-bold">{MONTH_LABELS[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`${card} border rounded-3xl p-5 col-span-2 flex flex-col`}>
                    <p className="text-sm font-semibold text-white mb-4">Top Clients</p>
                    <div className="space-y-3 flex-1">
                        {MOCK_PROJECTS.slice(0, 3).map((p, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-semibold text-sm" style={{ background: acc + '20', color: acc }}>{p.client[0]}</div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white leading-tight">{p.client}</p>
                                    <p className={`text-[10px] ${sub}`}>{p.name}</p>
                                </div>
                                <span className="text-sm font-semibold" style={{ color: acc }}>${(p.amount / 1000).toFixed(1)}k</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (section === 'vault') return (
        <div className="space-y-5">
            <h1 className="text-3xl font-semibold text-white">Projects</h1>
            <div className="grid grid-cols-5 gap-3">
                {MOCK_PROJECTS.map((p, i) => (
                    <div key={i} className={`${card} border rounded-3xl p-4 cursor-pointer transition-all hover:border-lime-400/40`} style={{ borderColor: i === 0 ? acc + '40' : undefined }}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 text-black font-semibold text-sm" style={{ background: acc }}>{p.name[0]}</div>
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <p className={`text-[10px] ${sub} mt-0.5`}>{p.client}</p>
                        <div className="mt-3 flex justify-between items-center">
                            <StatusBadge status={p.status} />
                            <span className="text-xs font-semibold" style={{ color: acc }}>${p.amount.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (section === 'activity') return (
        <div className="space-y-5">
            <h1 className="text-3xl font-semibold text-white">Activity</h1>
            <div className={`${card} border rounded-3xl overflow-hidden`}>
                {MOCK_ACTIVITY.map((a, i) => {
                    const c = a.color === 'lime' ? acc : a.color === 'blue' ? '#60a5fa' : a.color === 'amber' ? '#fbbf24' : '#64748b';
                    return (
                        <div key={i} className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: c + '15' }}><a.icon className="w-4 h-4" style={{ color: c }} /></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">{a.label}</p>
                                <p className={`text-xs ${sub}`}>{a.detail}</p>
                            </div>
                            <span className={`text-[10px] font-mono ${sub}`}>{a.time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (section === 'reports') return (
        <div className="space-y-5">
            <h1 className="text-3xl font-semibold text-white">Reports</h1>
            <div className="grid grid-cols-2 gap-4">
                {[{ l: 'Total Revenue', v: '$48,200' }, { l: 'Total Disbursed', v: '$41,600' }].map(k => (
                    <div key={k.l} className={`${card} border rounded-3xl p-6`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-widest ${sub} mb-2`}>{k.l}</p>
                        <p className="text-5xl font-semibold text-white">{k.v}</p>
                        <div className="mt-5"><MiniBarChart data={MOCK_REVENUE} accent={acc} /></div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            <h1 className="text-3xl font-semibold text-white">Settings</h1>
            {[{ l: 'Profile', icon: User }, { l: 'Billing', icon: CreditCard }, { l: 'Security', icon: ShieldCheck }].map(g => (
                <div key={g.l} className={`${card} border rounded-3xl p-5`}>
                    <div className="flex items-center gap-3 mb-4"><g.icon className="w-5 h-5" style={{ color: acc }} /><p className="text-base font-semibold text-white">{g.l}</p></div>
                    <div className="space-y-2">
                        {['Primary setting', 'Secondary setting', 'Advanced options'].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 cursor-pointer">
                                <span className={`text-sm ${sub}`}>{item}</span><ChevronRight className={`w-4 h-4 ${sub}`} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const BoldDarkLayout = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const acc = '#a3e635';
    return (
        <div className="flex h-full w-full" style={{ background: isDark ? '#0a0a10' : '#0f0f18' }}>
            {/* Always-dark sidebar */}
            <div className="w-52 shrink-0 border-r border-white/5 flex flex-col py-6" style={{ background: '#111119' }}>
                <div className="px-5 mb-8 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-2xl flex items-center justify-center" style={{ background: acc }}><Zap className="w-4 h-4 text-black" /></div>
                    <span className="font-semibold text-white text-base">Sendational</span>
                </div>
                <nav className="flex-1 px-3 space-y-1">
                    {SECTIONS.map(s => (
                        <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold cursor-pointer transition-all"
                            style={s.id === section ? { background: acc + '15', color: acc } : { color: '#64748b' }}>
                            <s.icon className="w-4 h-4 shrink-0" />{s.label}
                            {s.id === section && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: acc }} />}
                        </div>
                    ))}
                </nav>
                {/* Upgrade card */}
                <div className="mx-3 p-4 rounded-3xl" style={{ background: 'linear-gradient(135deg,#a3e635 0%,#a3e635 100%)' }}>
                    <Crown className="w-5 h-5 text-black mb-2" />
                    <p className="text-black font-semibold text-sm leading-snug">Upgrade to Pro</p>
                    <p className="text-black/70 text-[10px] mt-1 mb-3">Unlock unlimited projects</p>
                    <div className="w-full py-1.5 rounded-xl bg-black text-white text-center text-[10px] font-semibold uppercase tracking-wider cursor-pointer">Upgrade Now</div>
                </div>
            </div>
            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-6 flex items-center justify-between border-b border-white/5" style={{ background: '#111119' }}>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-zinc-400 text-sm">
                        <Search className="w-4 h-4" /><span className="text-xs">Search…</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-zinc-400" />
                        <div className="w-8 h-8 rounded-2xl flex items-center justify-center font-semibold text-black text-xs" style={{ background: acc }}>J</div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6"><BoldDarkContent section={section} isDark={true} /></div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// VARIANT 3 — FOCUS FLOW  (Car rental / image 3)
// ══════════════════════════════════════════════════════════════════════════════
const FocusFlowContent = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const acc = isDark ? '#a3e635' : '#a3e635';
    const bgCard = isDark ? 'bg-[#1c1c28] border-white/8' : 'glass-panel/70';
    const sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
    const mainText = isDark ? 'text-white' : 'text-obsidian';

    if (section === 'dashboard') return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className={`text-5xl font-bold tracking-tight mb-1 ${mainText}`}>Dashboard</h1>
                <p className={`${sub} text-sm`}>Your creative business at a glance</p>
            </div>
            <div className="grid grid-cols-3 gap-5">
                {[{ l: 'Net Revenue', v: '$29,450', d: '↑ 12.5% vs last month' }, { l: 'Active Projects', v: '8', d: '+2 new this week' }, { l: 'Pending', v: '$6,200', d: '2 awaiting payment' }].map(k => (
                    <div key={k.l} className={`${bgCard} border rounded-[2rem] p-6 shadow-sm`}>
                        <p className={`text-[10px] uppercase font-bold tracking-widest ${sub} mb-3`}>{k.l}</p>
                        <p className={`text-4xl font-bold ${mainText} mb-1`}>{k.v}</p>
                        <p className="text-xs font-semibold" style={{ color: acc }}>{k.d}</p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-5">
                <div className={`${bgCard} border rounded-[2rem] p-6 shadow-sm`}>
                    <p className={`text-sm font-bold ${mainText} mb-4`}>Revenue · Last 12 months</p>
                    <div className="flex items-end gap-2 h-28">
                        {MOCK_REVENUE.map((v, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                <div className="w-full rounded-lg" style={{ height: `${(v / 72) * 108}px`, background: i === 11 ? acc : (isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9') }} />
                                <span className={`text-[9px] ${sub}`}>{MONTH_LABELS[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`${bgCard} border rounded-[2rem] p-6 shadow-sm`}>
                    <p className={`text-sm font-bold ${mainText} mb-4`}>Recent Projects</p>
                    {MOCK_PROJECTS.slice(0, 4).map((p, i) => (
                        <div key={i} className={`flex items-center justify-between py-2 border-b last:border-0 ${isDark ? 'border-white/5' : 'border-editorial'}`}>
                            <div>
                                <p className={`text-sm font-semibold ${mainText}`}>{p.name}</p>
                                <p className={`text-xs ${sub}`}>{p.client}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={p.status} />
                                <span className="text-xs font-bold font-mono" style={{ color: acc }}>${p.amount.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const genericContent = ['vault', 'activity', 'reports', 'settings'].includes(section);
    return (
        <div className="space-y-5 max-w-5xl mx-auto">
            <h1 className={`text-4xl font-bold tracking-tight ${mainText} capitalize`}>{section}</h1>
            {section === 'vault' && (
                <div className="grid grid-cols-4 gap-4">
                    {MOCK_PROJECTS.map((p, i) => (
                        <div key={i} className={`${bgCard} border rounded-[2rem] p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}>
                            <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center" style={{ background: acc + '18' }}>
                                <FolderLock className="w-6 h-6" style={{ color: acc }} />
                            </div>
                            <p className={`text-sm font-bold ${mainText}`}>{p.name}</p>
                            <p className={`text-xs ${sub} mt-1 mb-3`}>{p.client}</p>
                            <StatusBadge status={p.status} />
                        </div>
                    ))}
                </div>
            )}
            {section === 'activity' && (
                <div className={`${bgCard} border rounded-[2rem] p-6 shadow-sm divide-y ${isDark ? 'divide-white/5' : 'divide-zinc-50'}`}>
                    {MOCK_ACTIVITY.map((a, i) => (
                        <div key={i} className="flex items-center gap-4 py-3">
                            <a.icon className="w-4 h-4" style={{ color: acc }} />
                            <div className="flex-1"><p className={`text-sm font-semibold ${mainText}`}>{a.label}</p><p className={`text-xs ${sub}`}>{a.detail}</p></div>
                            <span className={`text-[10px] font-mono ${sub}`}>{a.time}</span>
                        </div>
                    ))}
                </div>
            )}
            {section === 'reports' && (
                <div className="grid grid-cols-2 gap-5">
                    {[{ l: 'Total Revenue', v: '$48,200' }, { l: 'Total Clients', v: '12' }].map(k => (
                        <div key={k.l} className={`${bgCard} border rounded-[2rem] p-7 shadow-sm`}>
                            <p className={`text-xs uppercase font-bold tracking-widest ${sub} mb-3`}>{k.l}</p>
                            <p className={`text-5xl font-bold ${mainText}`}>{k.v}</p>
                            <div className="mt-5"><MiniBarChart data={MOCK_REVENUE} accent={acc} /></div>
                        </div>
                    ))}
                </div>
            )}
            {section === 'settings' && (
                <div className="space-y-4">
                    {['Profile', 'Payments', 'Security', 'Integrations'].map(g => (
                        <div key={g} className={`${bgCard} border rounded-[2rem] p-5 shadow-sm flex items-center justify-between cursor-pointer hover:border-lime-400/30 transition-colors`}>
                            <p className={`font-semibold ${mainText}`}>{g}</p><ChevronRight className={`w-5 h-5 ${sub}`} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FocusFlowLayout = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const bg = isDark ? 'bg-[#0d0d14]' : 'bg-[#f7f7f8]';
    const pillBg = isDark ? 'bg-[#1c1c28] border-white/10 text-white' : 'glass-panel text-obsidian';
    const acc = isDark ? '#a3e635' : '#a3e635';
    return (
        <div className={`${bg} h-full w-full flex flex-col`}>
            {/* Floating pill nav */}
            <div className="flex justify-center pt-5 pb-2 px-6 shrink-0">
                <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full border shadow-lg ${pillBg}`}>
                    <div className="flex items-center gap-2 px-3 py-1 mr-3">
                        <Zap className="w-4 h-4" style={{ color: acc }} />
                        <span className="font-bold text-sm">Sendational</span>
                    </div>
                    {SECTIONS.map(s => (
                        <button key={s.id} className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={s.id === section ? { background: acc, color: '#000' } : { color: isDark ? '#94a3b8' : '#64748b' }}>
                            {s.label}
                        </button>
                    ))}
                    <div className="ml-3 flex items-center gap-2">
                        <Bell className="w-4 h-4" style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-black" style={{ background: acc }}>J</div>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <FocusFlowContent section={section} isDark={isDark} />
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// VARIANT 4 — COMMAND CENTER  (Celoxis / image 4)
// ══════════════════════════════════════════════════════════════════════════════
const CommandCenterContent = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const acc = isDark ? '#a3e635' : '#a3e635';
    const card = isDark ? 'bg-[#18181f] border-white/8' : 'glass-panel/80';
    const sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
    const mainText = isDark ? 'text-white' : 'text-obsidian';

    return (
        <div className="h-full flex gap-4">
            {/* Left context panel */}
            <div className="w-52 shrink-0 flex flex-col gap-3">
                <div className={`${card} border rounded-2xl p-4`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${sub} mb-3`}>AI Insights</p>
                    <p className={`text-xs ${mainText} leading-relaxed`}>Revenue up <strong>27.1% → 31.2%</strong> this quarter. 3 projects near deadline.</p>
                    <ChevronRight className={`w-4 h-4 mt-2 ${sub}`} />
                </div>
                <div className={`${card} border rounded-2xl flex-1 p-4`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${sub} mb-3`}>Folders</p>
                    {['Invoices', 'Contracts', 'Reporting', 'Analysis', 'Overview'].map((f, i) => (
                        <div key={f} className={`flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-editorial'} ${i === 1 ? (isDark ? 'bg-white/5' : 'bg-editorial') : ''}`}>
                            <div className="flex items-center gap-2"><Folder className={`w-4 h-4 ${sub}`} /><span className={`text-xs font-semibold ${i === 1 ? mainText : sub}`}>{f}</span></div>
                            <ChevronRight className={`w-3 h-3 ${sub}`} />
                        </div>
                    ))}
                </div>
            </div>
            {/* Main content */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
                <h1 className={`text-2xl font-bold ${mainText} mb-1 capitalize`}>{section === 'dashboard' ? 'Management Overview' : section}</h1>
                {section === 'dashboard' && (
                    <>
                        <div className="grid grid-cols-3 gap-3">
                            {[{ l: 'Project Alerts', vals: ['49 High', '146 Medium', '27 Low'] }, { l: 'Cost & Revenue', vals: ['$1.1M Cost (62%)', '$1.4M Revenue (89%)'] }, { l: 'Processed', vals: ['57% / 100', '34-2024 Medium'] }].map(k => (
                                <div key={k.l} className={`${card} border rounded-2xl p-4`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${sub} mb-3`}>{k.l}</p>
                                    {k.vals.map(v => <p key={v} className={`text-xs font-bold ${mainText} mb-1`}>{v}</p>)}
                                </div>
                            ))}
                        </div>
                        <div className={`${card} border rounded-2xl flex-1 overflow-hidden`}>
                            <div className={`px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-zinc-200'} flex items-center justify-between`}>
                                <p className={`text-sm font-bold ${mainText}`}>Projects Pipeline</p>
                                <Filter className={`w-4 h-4 ${sub}`} />
                            </div>
                            {MOCK_PROJECTS.map((p, i) => (
                                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 border-b ${isDark ? 'border-white/5' : 'border-editorial'} last:border-0 text-xs`}>
                                    <span className={`w-32 truncate font-semibold ${mainText}`}>{p.name}</span>
                                    <StatusBadge status={p.status} />
                                    <span className={`${sub} ml-auto`}>{p.due}</span>
                                    <span className={`font-mono font-bold`} style={{ color: acc }}>${p.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {section !== 'dashboard' && (
                    <div className={`${card} border rounded-2xl flex-1 p-5`}>
                        <p className={`text-sm font-bold ${mainText} mb-4`}>{section.charAt(0).toUpperCase() + section.slice(1)} Overview</p>
                        {section === 'activity' && MOCK_ACTIVITY.slice(0, 6).map((a, i) => (
                            <div key={i} className={`flex items-center gap-3 py-2 border-b ${isDark ? 'border-white/5' : 'border-editorial'} last:border-0`}>
                                <a.icon className="w-4 h-4" style={{ color: acc }} />
                                <p className={`text-xs flex-1 ${sub}`}>{a.label} · {a.detail}</p>
                                <span className={`text-[10px] font-mono ${sub}`}>{a.time}</span>
                            </div>
                        ))}
                        {section === 'vault' && MOCK_PROJECTS.map((p, i) => (
                            <div key={i} className={`flex items-center gap-4 py-2.5 border-b ${isDark ? 'border-white/5' : 'border-editorial'} last:border-0`}>
                                <FolderLock className="w-4 h-4" style={{ color: acc }} />
                                <p className={`text-xs font-semibold flex-1 ${mainText}`}>{p.name}</p>
                                <StatusBadge status={p.status} />
                                <span className="text-xs font-mono font-bold" style={{ color: acc }}>${p.amount.toLocaleString()}</span>
                            </div>
                        ))}
                        {section === 'reports' && <div className="mt-2"><MiniBarChart data={MOCK_REVENUE} accent={acc} /></div>}
                        {section === 'settings' && ['Profile', 'Payments', 'Security', 'Notifications', 'Integrations'].map((s, i) => (
                            <div key={i} className={`flex items-center justify-between py-2.5 border-b ${isDark ? 'border-white/5' : 'border-editorial'} last:border-0 cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-editorial'} px-2 rounded-lg`}>
                                <span className={`text-sm ${sub}`}>{s}</span><ChevronRight className={`w-4 h-4 ${sub}`} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Right info panel */}
            <div className="w-44 shrink-0 flex flex-col gap-3">
                <div className={`${card} border rounded-2xl p-4 text-center`}>
                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-black text-sm" style={{ background: acc }}>J</div>
                    <p className={`text-xs font-bold ${mainText}`}>Joshua</p>
                    <p className={`text-[10px] ${sub}`}>Pro Plan</p>
                </div>
                <div className={`${card} border rounded-2xl p-4 flex-1`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${sub} mb-3`}>Quick Stats</p>
                    {[{ l: 'Revenue', v: '$29k' }, { l: 'Projects', v: '8' }, { l: 'Clients', v: '12' }].map(k => (
                        <div key={k.l} className="flex justify-between items-center py-1.5">
                            <span className={`text-[10px] ${sub}`}>{k.l}</span>
                            <span className={`text-[10px] font-bold`} style={{ color: acc }}>{k.v}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CommandCenterLayout = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const bg = isDark ? 'bg-[#0e0e14]' : 'bg-[#f2f3f5]';
    const sidebarBg = isDark ? 'bg-[#111117] border-white/8' : 'glass-panel';
    const menuItem = isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-obsidian hover:bg-editorial';
    const activeItem = isDark ? 'bg-lime-400/10 text-lime-400' : 'bg-blue-50 text-lime-400';
    return (
        <div className={`flex h-full w-full ${bg}`}>
            <div className={`w-44 shrink-0 ${sidebarBg} border-r flex flex-col py-5`}>
                <div className="px-4 mb-6 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-lime-400 flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-obsidian'}`}>Sendational</span>
                </div>
                <nav className="flex-1 px-2 space-y-0.5">
                    {SECTIONS.map(s => (
                        <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${s.id === section ? activeItem : menuItem}`}>
                            <s.icon className="w-3.5 h-3.5 shrink-0" />{s.label}
                        </div>
                    ))}
                    <div className={`h-px mx-2 my-3 ${isDark ? 'bg-white/5' : 'bg-zinc-200'}`} />
                    {['Notifications', 'Account'].map(item => (
                        <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${menuItem}`}>
                            <Circle className="w-3 h-3 shrink-0" />{item}
                        </div>
                    ))}
                </nav>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className={`h-12 px-5 flex items-center justify-between border-b ${isDark ? 'bg-[#111117] border-white/5' : 'glass-panel'}`}>
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs ${isDark ? 'bg-white/5 text-zinc-400' : 'bg-zinc-200 text-zinc-400'}`}>
                        <Search className="w-3 h-3" /><span>Search on files…</span>
                    </div>
                    <Bell className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                </div>
                <div className="flex-1 overflow-y-auto p-4"><CommandCenterContent section={section} isDark={isDark} /></div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// VARIANT 5 — ANALYTICS HUB  (Syncdesk / image 5)
// ══════════════════════════════════════════════════════════════════════════════
const AnalyticsHubContent = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const acc = isDark ? '#a3e635' : '#a3e635';
    const card = isDark ? 'bg-[#1a1a24] border-white/8' : 'glass-panel/80';
    const sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
    const mainText = isDark ? 'text-white' : 'text-obsidian';

    return (
        <div className="flex gap-5 h-full">
            <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
                <div>
                    <p className={`text-xs ${sub} mb-1`}>Data Based on All Clients</p>
                    <h1 className={`text-4xl font-bold tracking-tight ${mainText} capitalize`}>{section === 'dashboard' ? 'Overview Panel' : section}</h1>
                </div>
                {section === 'dashboard' && (
                    <>
                        <div className="grid grid-cols-3 gap-3">
                            {[{ l: 'Net Revenue', v: '$29,450', sub: '↑ 12.5%', sub2: 'vs last period' }, { l: 'Completed Projects', v: '24', sub: '74 verified', sub2: '5 pending check' }, { l: 'Active Clients', v: '12', sub: '1.1k retained', sub2: '2 new this week' }].map(k => (
                                <div key={k.l} className={`${card} border rounded-2xl p-4`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${sub} mb-2`}>{k.l}</p>
                                    <p className={`text-3xl font-bold ${mainText} mb-1`}>{k.v}</p>
                                    <div className="flex gap-3">
                                        <span className="text-[10px] font-bold" style={{ color: acc }}>{k.sub}</span>
                                        <span className={`text-[10px] ${sub}`}>{k.sub2}</span>
                                    </div>
                                    <div className="mt-3"><Sparkline data={MOCK_REVENUE.slice(-8)} color={acc} width={120} height={32} /></div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`${card} border rounded-2xl p-4`}>
                                <div className="flex justify-between items-center mb-3">
                                    <p className={`text-sm font-bold ${mainText}`}>Revenue Timeline</p>
                                    <ArrowUpRight className={`w-4 h-4 ${sub}`} />
                                </div>
                                <MiniBarChart data={MOCK_REVENUE} accent={acc} />
                                <div className="flex gap-3 mt-3">
                                    {['Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'].map(m => (
                                        <span key={m} className={`flex-1 text-center text-[9px] ${sub}`}>{m}</span>
                                    ))}
                                </div>
                            </div>
                            <div className={`${card} border rounded-2xl p-4`}>
                                <p className={`text-sm font-bold ${mainText} mb-3`}>Active Projects</p>
                                {MOCK_PROJECTS.slice(0, 4).map((p, i) => (
                                    <div key={i} className={`flex items-center gap-2 py-1.5 border-b ${isDark ? 'border-white/5' : 'border-editorial'} last:border-0`}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: acc }} />
                                        <p className={`text-xs font-semibold flex-1 ${mainText}`}>{p.name}</p>
                                        <span className="text-xs font-mono font-bold" style={{ color: acc }}>${p.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                {section === 'vault' && (
                    <div className="grid grid-cols-4 gap-3">
                        {MOCK_PROJECTS.map((p, i) => (
                            <div key={i} className={`${card} border rounded-2xl p-4 cursor-pointer hover:border-lime-400/30 transition-colors`}>
                                <FolderLock className="w-6 h-6 mb-3" style={{ color: acc }} />
                                <p className={`text-sm font-bold ${mainText}`}>{p.name}</p>
                                <p className={`text-xs ${sub} mb-3`}>{p.client}</p>
                                <div className="flex items-center justify-between">
                                    <StatusBadge status={p.status} />
                                    <span className="text-xs font-bold font-mono" style={{ color: acc }}>${p.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {section === 'activity' && (
                    <div className={`${card} border rounded-2xl divide-y ${isDark ? 'divide-white/5' : 'divide-zinc-50'}`}>
                        {MOCK_ACTIVITY.map((a, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3">
                                <a.icon className="w-4 h-4" style={{ color: acc }} />
                                <div className="flex-1"><p className={`text-sm font-semibold ${mainText}`}>{a.label}</p><p className={`text-xs ${sub}`}>{a.detail}</p></div>
                                <span className={`text-[10px] font-mono ${sub}`}>{a.time}</span>
                            </div>
                        ))}
                    </div>
                )}
                {section === 'reports' && (
                    <div className="grid grid-cols-2 gap-3">
                        {[{ l: 'Utilization', v: '56.1%', s: '65% syncs · 82% fetches' }, { l: 'Timely Closures', v: '82.6%', s: '84 done · 24 active' }].map(k => (
                            <div key={k.l} className={`${card} border rounded-2xl p-5`}>
                                <p className={`text-xs font-bold uppercase tracking-widest ${sub} mb-2 flex items-center gap-1`}><ArrowUpRight className="w-3 h-3" />{k.l}</p>
                                <p className={`text-4xl font-bold ${mainText}`}>{k.v}</p>
                                <p className={`text-xs ${sub} mt-1 mb-4`}>{k.s}</p>
                                <Sparkline data={MOCK_REVENUE.slice(-8)} color={acc} width={200} height={40} />
                            </div>
                        ))}
                    </div>
                )}
                {section === 'settings' && (
                    <div className="grid grid-cols-2 gap-3">
                        {[{ l: 'Profile', icon: User }, { l: 'Billing', icon: CreditCard }, { l: 'Security', icon: ShieldCheck }, { l: 'Integrations', icon: Globe }].map(g => (
                            <div key={g.l} className={`${card} border rounded-2xl p-5 cursor-pointer hover:border-lime-400/30 transition-colors flex items-center gap-3`}>
                                <g.icon className="w-5 h-5" style={{ color: acc }} />
                                <p className={`font-semibold ${mainText}`}>{g.l}</p>
                                <ChevronRight className={`w-4 h-4 ml-auto ${sub}`} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Right panel — AI assistant */}
            <div className="w-60 shrink-0 flex flex-col gap-3 overflow-y-auto">
                <div className={`${card} border rounded-2xl flex-1 flex flex-col`}>
                    <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-zinc-200'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${sub} mb-3`}>AI Assistant</p>
                        <div className="space-y-3">
                            {[{ speaker: 'Joshua', msg: 'Can you check discrepancies in revenue vs. projected values?', time: '10:12' }, { speaker: 'TH AI', msg: 'Main deviations: July $18.9K · August $21.7K · September $11.9K', time: '10:13' }].map((m, i) => (
                                <div key={i} className={`flex gap-2 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${i === 0 ? 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-white' : 'text-black'}`} style={i === 1 ? { background: '#a3e635' } : undefined}>{m.speaker[0]}</div>
                                    <div className={`rounded-2xl px-3 py-2 text-[10px] leading-relaxed ${i === 0 ? (isDark ? 'bg-white/5 text-zinc-200' : 'bg-zinc-200 text-zinc-700') : 'text-black'}`} style={i === 1 ? { background: '#a3e635' } : undefined}>{m.msg}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-3 mt-auto">
                        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDark ? 'bg-white/5 border border-white/8' : 'bg-editorial border border-zinc-200'}`}>
                            <input readOnly placeholder="Enter your AI request" className="flex-1 bg-transparent text-[10px] outline-none placeholder:text-zinc-400" />
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-black cursor-pointer" style={{ background: '#a3e635' }}><Send className="w-3 h-3" /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnalyticsHubLayout = ({ section, isDark }: { section: Section; isDark: boolean }) => {
    const bg = isDark ? 'bg-[#0d0d13]' : 'bg-[#f4f5f7]';
    const topbarBg = isDark ? 'bg-[#111119] border-white/8' : 'glass-panel';
    const activeTab = isDark ? 'border-b-2 border-lime-400 text-white font-bold' : 'border-b-2 border-lime-400 text-obsidian font-bold';
    const inactiveTab = isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-obsidian';
    return (
        <div className={`${bg} h-full w-full flex flex-col`}>
            <div className={`${topbarBg} border-b px-6 flex items-center gap-6 h-14 shrink-0`}>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-lime-400 dark:bg-lime-400 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white dark:text-black" /></div>
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-obsidian'}`}>Sendational</span>
                </div>
                <div className="flex gap-0.5 h-full ml-4">
                    {SECTIONS.map(s => (
                        <button key={s.id} className={`px-4 text-sm transition-all ${s.id === section ? activeTab : inactiveTab}`}>{s.label}</button>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-white/5 text-zinc-400' : 'bg-zinc-200 text-zinc-400'}`}><Search className="w-3.5 h-3.5" />Type Client Name or ID</div>
                    <Bell className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                    <div className="w-8 h-8 rounded-full bg-lime-400 dark:bg-lime-400 flex items-center justify-center font-bold text-white dark:text-black text-xs">J</div>
                </div>
            </div>
            <div className="flex-1 overflow-hidden px-5 py-4"><AnalyticsHubContent section={section} isDark={isDark} /></div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SHOWCASE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export const DesignShowcase: React.FC<ShowcaseProps> = ({ isDarkMode, onClose }) => {
    const [activeVariant, setActiveVariant] = useState<Variant>('sidebar-classic');
    const [activeSection, setActiveSection] = useState<Section>('dashboard');

    const renderVariant = () => {
        const props = { section: activeSection, isDark: isDarkMode };
        switch (activeVariant) {
            case 'sidebar-classic': return <SidebarClassicLayout {...props} />;
            case 'bold-dark': return <BoldDarkLayout {...props} />;
            case 'focus-flow': return <FocusFlowLayout {...props} />;
            case 'command-center': return <CommandCenterLayout {...props} />;
            case 'analytics-hub': return <AnalyticsHubLayout {...props} />;
        }
    };

    return (
        <div className={`fixed inset-0 z-[300] flex flex-col ${isDarkMode ? 'dark bg-[#0a0a10]' : 'bg-[#e8eaed]'}`}>
            {/* Showcase chrome */}
            <div className={`shrink-0 flex items-center gap-3 px-4 py-2 border-b ${isDarkMode ? 'bg-[#0f0f18] border-white/10' : 'glass-panel'} shadow-sm`}>
                {/* Brand badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isDarkMode ? 'bg-lime-400/10 border-lime-400/20 text-lime-400' : 'bg-blue-50 border-blue-200 text-lime-400'} text-[10px] font-semibold uppercase tracking-widest`}>
                    <Sparkles className="w-3 h-3" /> Design Lab
                </div>
                <div className={`hidden md:block h-5 w-px ${isDarkMode ? 'bg-white/10' : 'bg-zinc-200'}`} />
                {/* Variant pills */}
                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar">
                    {VARIANTS.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setActiveVariant(v.id)}
                            className={`shrink-0 flex flex-col items-start px-3 py-1.5 rounded-xl border text-left transition-all ${activeVariant === v.id
                                ? (isDarkMode ? 'bg-lime-400/15 border-lime-400/30 text-lime-400' : 'bg-blue-50 border-blue-300 text-lime-400')
                                : (isDarkMode ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10' : 'bg-editorial border-zinc-200/50 text-zinc-500 hover:text-zinc-700 hover:bg-white')
                            }`}
                        >
                            <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">{v.label}</span>
                            <span className="text-[9px] font-medium opacity-60 mt-0.5 leading-none hidden lg:block">{v.ref}</span>
                        </button>
                    ))}
                </div>
                {/* Section tabs */}
                <div className={`hidden md:flex items-center gap-1 h-8 px-1 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-200 border-zinc-200'}`}>
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`h-6 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeSection === s.id
                                ? (isDarkMode ? 'bg-lime-400 text-black' : 'bg-lime-400 text-white')
                                : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800')
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                {/* Close */}
                <button
                    onClick={onClose}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30' : 'bg-zinc-200 border-zinc-200/50 text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}
                >
                    <X className="w-3.5 h-3.5" /> Exit Lab
                </button>
            </div>

            {/* Mobile section switcher */}
            <div className={`md:hidden flex gap-1 px-3 py-2 overflow-x-auto no-scrollbar shrink-0 border-b ${isDarkMode ? 'bg-[#0f0f18] border-white/10' : 'glass-panel'}`}>
                {SECTIONS.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeSection === s.id ? (isDarkMode ? 'bg-lime-400 text-black' : 'bg-lime-400 text-white') : (isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}`}>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Rendered variant — fills remaining height */}
            <div className="flex-1 overflow-hidden">
                {renderVariant()}
            </div>
        </div>
    );
};

export default DesignShowcase;

