/**
 * DesignShowcaseHiFi.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Reference-grade UI implementations of 5 premium dashboards.
 * High-fidelity replicas including specific colors, gradients, and shadows.
 * ──────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import {
    Layout, Search, Bell, Settings, Plus, ArrowUpRight, ArrowDownRight,
    Users, MessageSquare, PieChart, BarChart3, Grip, ChevronRight, Check,
    MoreHorizontal, Filter, Download, Upload, Zap, Activity, Euro, DollarSign,
    CreditCard, LayoutDashboard, FileText, Folder, Shield, Lock, Power,
    LogOut, User, Command, Mic, Send, Globe, MapPin, Calendar, Smartphone,
    ChevronDown, X, Sparkles, TrendingUp, TrendingDown, Clock, Eye, Sliders,
    LayoutGrid, Box, Copy, ArrowLeftRight, Monitor, Sun, Cloud, Video,
    Briefcase, Wallet, Share2
} from 'lucide-react';

// ─── Shared Utilities ─────────────────────────────────────────────────────────

const Avatar = ({ src, alt, fallback, size = "md", className = "" }: any) => {
    const s = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-sm" : "w-10 h-10 text-xs";
    return (
        <div className={`${s} rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shrink-0 ${className}`}>
            {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : <span className="font-bold text-slate-500">{fallback}</span>}
        </div>
    );
};

const IconButton = ({ icon: Icon, className = "" }: any) => (
    <button className={`p-2 rounded-full hover:bg-black/5 transition-colors ${className}`}>
        <Icon className="w-5 h-5" />
    </button>
);

// ─── 1. PAYFLOW (Finance Dashboard) ───────────────────────────────────────────
// Style: Sharp B&W contrast, clean lines, minimalist
// Ref: Image 4
const PayflowVariant = ({ activeSection }: { activeSection: string }) => {
    const { projects, user } = useStore();

    // ── Derived data from real store ──
    const paidProjects = useMemo(() => projects.filter(p => p.status === 'paid'), [projects]);
    const totalBalance = useMemo(() => projects.reduce((s, p) => s + (p.amount || 0), 0), [projects]);
    const totalIncome = useMemo(() => paidProjects.reduce((s, p) => s + (p.amount || 0), 0), [paidProjects]);
    const totalAwaiting = useMemo(() => projects.filter(p => p.status === 'awaiting_payment').reduce((s, p) => s + (p.amount || 0), 0), [projects]);

    // Map projects → transaction rows
    const transactions = useMemo(() => projects.slice(0, 6).map(p => ({
        n: p.name,
        id: `#${p.id.toUpperCase()}`,
        d: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
        s: p.status === 'paid' ? 'Received' : p.status === 'awaiting_payment' ? 'Payment' : 'Pending',
        a: p.status === 'paid' ? `+ $${p.amount?.toLocaleString()}` : `~ $${p.amount?.toLocaleString()}`,
        img: p.client?.avatar || undefined,
        icon: p.client?.name?.[0]?.toUpperCase() || '?',
        c: p.status === 'paid' ? 'text-green-600 bg-green-50' : p.status === 'awaiting_payment' ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50',
        clientName: p.client?.name || 'Unknown',
    })), [projects]);

    // Bar chart buckets: distribute projects by amount into 6 bars
    const incomeBarData = useMemo(() => {
        const max = Math.max(...paidProjects.map(p => p.amount || 0), 1);
        const buckets = [0, 0, 0, 0, 0, 0];
        paidProjects.forEach((p, i) => { buckets[i % 6] += p.amount || 0; });
        return buckets.map(v => Math.max(10, Math.round((v / max) * 85)));
    }, [paidProjects]);

    const expenseBarData = useMemo(() => {
        const pending = projects.filter(p => p.status !== 'paid');
        const max = Math.max(...pending.map(p => p.amount || 0), 1);
        const buckets = [0, 0, 0, 0, 0, 0];
        pending.forEach((p, i) => { buckets[i % 6] += p.amount || 0; });
        return buckets.map(v => Math.max(10, Math.round((v / max) * 80)));
    }, [projects]);

    // Colors
    const bgMain = "#F6F6F6";
    const bgSidebar = "#111111";
    const cardBlack = "#1A1A1A";

    const NavItem = ({ icon: Icon, label, active }: any) => (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? "bg-[#252525] text-white" : "text-[#777] hover:text-white hover:bg-[#252525]"}`}>
            <Icon className="w-5 h-5" />
            <span className="font-medium text-sm">{label}</span>
        </div>
    );

    return (
        <div className="flex w-full h-full font-sans text-[#111] overflow-hidden rounded-[24px]" style={{ background: bgMain }}>
            {/* Sidebar */}
            <div className="w-[260px] shrink-0 flex flex-col p-6 text-white" style={{ background: bgSidebar }}>
                <div className="flex items-center gap-2 mb-10 px-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">
                        <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">payflow</span>
                    <MoreHorizontal className="w-5 h-5 text-[#555] ml-auto" />
                </div>

                <div className="space-y-1">
                    <NavItem icon={LayoutDashboard} label="Dashboard" active={true} />
                    <NavItem icon={CreditCard} label="Cards" />
                    <NavItem icon={FileText} label="Receipts" />
                    <NavItem icon={Settings} label="Manage" />
                    <NavItem icon={Clock} label="History" />
                </div>

                <div className="mt-8 px-4">
                    <button className="flex items-center gap-2 text-[#777] hover:text-white text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" /> Add a section
                    </button>
                </div>

                <div className="mt-auto bg-[#1A1A1A] rounded-2xl p-5 relative overflow-hidden group cursor-pointer mb-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative w-10 h-10 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="16" stroke="#333" strokeWidth="3" fill="none" />
                                <circle cx="20" cy="20" r="16" stroke="white" strokeWidth="3" fill="none" strokeDasharray="100" strokeDashoffset="60" strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">40%</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm">Complete profile</p>
                            <p className="text-[10px] text-[#777] leading-tight mt-0.5">Unlock all features</p>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-white text-black rounded-lg text-xs font-bold mt-2 hover:bg-gray-100 transition-colors">Verif identity</button>
                </div>

                <div className="flex items-center gap-3 mt-auto px-2">
                    <Avatar src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} fallback={user.name?.[0] || 'U'} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{user.name}</p>
                        <p className="text-xs text-[#777] truncate">{user.email}</p>
                    </div>
                    <Settings className="w-4 h-4 text-[#777]" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 p-8 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-6 mb-8 shrink-0">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search anything..." className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 shadow-sm" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500">⌘ F</span>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow transition-shadow"><Bell className="w-4 h-4" /></button>
                        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow transition-shadow"><MessageSquare className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="flex gap-6 h-full overflow-hidden">
                    {/* Left Column */}
                    <div className="w-[340px] flex flex-col gap-6 shrink-0 overflow-y-auto pr-2 no-scrollbar">
                        {/* Total Balance Card */}
                        <div className="rounded-[32px] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-xl" style={{ background: cardBlack }}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-gray-400 text-sm font-medium mb-1">Total Balance</p>
                                    <p className="text-[10px] text-gray-500">Available for use</p>
                                </div>
                                <button className="flex items-center gap-1 bg-[#333] pl-3 pr-2 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:bg-[#444] transition-colors">
                                    🇺🇸 USD <ChevronDown className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="mb-8">
                                <p className="text-sm text-gray-400 mb-2">Total Portfolio</p>
                                <h2 className="text-5xl font-medium tracking-tighter">${Math.floor(totalBalance).toLocaleString()}<span className="text-gray-500 text-3xl">.00</span></h2>
                            </div>
                            <div className="flex gap-3 mt-auto">
                                <button className="flex-1 py-4 border border-white/10 bg-white/5 rounded-2xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <ArrowUpRight className="w-4 h-4" /> Send
                                </button>
                                <button className="flex-1 py-4 border border-white/10 bg-white/5 rounded-2xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <ArrowDownRight className="w-4 h-4" /> Request
                                </button>
                            </div>
                        </div>

                        {/* Recent Contacts */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold">Recent Contacts</h3>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 mb-6 font-medium">Your active clients &amp; contacts</p>
                            <div className="flex justify-between items-center mb-6 px-1">
                                {projects.slice(0, 5).map((p, i) => (
                                    <div key={p.id} className="flex flex-col items-center gap-2 cursor-pointer hover:scale-110 transition-transform" title={p.client?.name}>
                                        <Avatar src={p.client?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.client?.name}`} className="border-2 border-white shadow-md w-10 h-10" />
                                        <span className="text-[9px] font-bold text-gray-400 truncate w-10 text-center">{p.client?.name?.split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-black/20 hover:bg-black transition-colors">
                                    <Plus className="w-4 h-4" /> Add new
                                </button>
                                <button className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors text-gray-600">
                                    Manage
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column */}
                    <div className="flex-1 bg-white rounded-[32px] p-8 flex flex-col min-w-0 overflow-hidden shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <div>
                                <h2 className="font-bold text-xl tracking-tight">Transactions</h2>
                                <p className="text-sm text-gray-500 mt-1 font-medium">You can view your transaction history</p>
                            </div>
                            <div className="flex gap-2">
                                <IconButton icon={Search} className="border border-gray-100" />
                                <IconButton icon={Filter} className="border border-gray-100" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                            <table className="w-full text-left border-collapse">
                                <thead className="text-xs text-gray-400 font-bold border-b border-dashed border-gray-200 uppercase tracking-wider">
                                    <tr>
                                        <th className="pb-4 font-medium pl-2">Name</th>
                                        <th className="pb-4 font-medium">Date</th>
                                        <th className="pb-4 font-medium">Status</th>
                                        <th className="pb-4 font-medium text-right pr-2">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((t, i) => (
                                        <tr key={i} className="group hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0">
                                            <td className="py-4 pl-2 rounded-l-xl">
                                                <div className="flex items-center gap-4">
                                                    {t.img ? (
                                                        <Avatar src={t.img} size="md" className="shadow-sm" />
                                                    ) : (
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${t.c}`}>{t.icon}</div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-sm text-[#111] truncate max-w-[140px]">{t.n}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t.id} · {t.clientName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-xs font-medium text-gray-500">{t.d}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${t.s === 'Received' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : t.s === 'Payment' ? 'bg-amber-400' : 'bg-blue-500'}`} />
                                                    <span className="text-xs font-bold text-[#111]">{t.s}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right pr-2 rounded-r-xl font-bold text-sm text-[#111]">{t.a}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-6 text-center">
                                <button className="text-xs font-bold text-[#111] hover:underline flex items-center gap-1 mx-auto">View all transactions <ArrowDownRight className="w-3 h-3" /></button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-[300px] flex flex-col gap-6 shrink-0 overflow-y-auto pr-2 no-scrollbar">
                        {/* Expenses Chart */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-sm">Total Expenses</h3>
                                <button className="text-gray-300 hover:text-black"><MoreHorizontal className="w-4 h-4" /></button>
                            </div>
                            <div className="flex flex-col gap-1 mb-6">
                                <span className="text-3xl font-bold tracking-tight">${Math.floor(totalAwaiting).toLocaleString()}<span className="text-gray-400 text-xl">.00</span></span>
                                <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-1 rounded-lg self-start flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" /> Awaiting payment
                                </span>
                            </div>

                            {/* Dynamic Bar Chart */}
                            <div className="h-28 flex items-end justify-between gap-2 px-1">
                                {expenseBarData.map((h, i) => (
                                    <div key={i} className="flex-1 bg-[#FFF8ED] rounded-t-lg relative group hover:bg-[#FFECC7] transition-all cursor-pointer" style={{ height: `${h}%` }}>
                                        {i === 3 && (
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl z-10 whitespace-nowrap">
                                                $12,243
                                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-bold px-1">
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                            </div>
                        </div>

                        {/* Income Chart */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-sm">Total Income</h3>
                                <button className="text-gray-300 hover:text-black"><MoreHorizontal className="w-4 h-4" /></button>
                            </div>
                            <div className="flex flex-col gap-1 mb-6">
                                <span className="text-3xl font-bold tracking-tight">${Math.floor(totalIncome).toLocaleString()}<span className="text-gray-400 text-xl">.00</span></span>
                                <span className="text-[10px] bg-green-50 text-green-500 font-bold px-2 py-1 rounded-lg self-start flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> {paidProjects.length} paid project{paidProjects.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Dynamic Bar Chart */}
                            <div className="h-28 flex items-end justify-between gap-2 px-1">
                                {incomeBarData.map((h, i) => (
                                    <div key={i} className={`flex-1 rounded-t-lg relative transition-all ${i === 3 ? 'bg-gradient-to-t from-[#111] to-[#444] shadow-lg' : 'bg-[#F2F2F2] hover:bg-gray-300'}`} style={{ height: `${h}%` }}>
                                        {i === 3 && (
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl z-10 whitespace-nowrap">
                                                $48,243
                                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-bold px-1">
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                            </div>
                        </div>

                        {/* Exchange */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-sm">Exchange</h3>
                                <MoreHorizontal className="w-4 h-4 text-gray-300" />
                            </div>
                            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-2xl border border-transparent focus-within:border-black/5 focus-within:bg-white transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px]">🇺🇸</div>
                                    <span className="text-sm font-bold">USD</span>
                                </div>
                                <input type="text" value="300" className="w-20 text-right font-bold text-sm outline-none bg-transparent" readOnly />
                            </div>
                            <div className="relative h-2 flex items-center justify-center my-2">
                                <div className="absolute bg-white border shadow-md rounded-full p-2 cursor-pointer hover:bg-gray-50 z-10 transition-transform active:scale-95">
                                    <ArrowDownRight className="w-4 h-4 text-black" />
                                </div>
                                <div className="w-full h-px bg-gray-100" />
                            </div>
                            <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-2xl border border-transparent focus-within:border-black/5 focus-within:bg-white transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px]">🇪🇺</div>
                                    <span className="text-sm font-bold">EUR</span>
                                </div>
                                <input type="text" value="275.68" className="w-20 text-right font-bold text-sm outline-none bg-transparent text-gray-500" readOnly />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 mb-6 font-medium px-2">
                                <span>1.00 USD ≈ 0.92 Euro</span>
                                <span>Exchange Fee: $12.44</span>
                            </div>
                            <button className="w-full py-3.5 bg-[#111] text-white rounded-xl text-sm font-bold hover:bg-black hover:shadow-lg transition-all active:scale-[0.98]">Exchange Money</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── 2. FLUX HEALTH (Dark Wellness) ───────────────────────────────────────────
// Style: Bold colors on dark background, rounded shapes, "Squircle" cards
// Ref: Image 5
const FluxVariant = ({ activeSection }: { activeSection: string }) => {
    const { projects, user } = useStore();
    const paidCount = useMemo(() => projects.filter(p => p.status === 'paid').length, [projects]);
    const awaitingCount = useMemo(() => projects.filter(p => p.status === 'awaiting_payment').length, [projects]);
    const activeCount = useMemo(() => projects.filter(p => p.status === 'completed').length, [projects]);
    const totalCount = projects.length || 1;
    const wellnessIndex = useMemo(() => Math.min(100, Math.round((paidCount / totalCount) * 100)), [paidCount, totalCount]);
    const energyKcal = useMemo(() => (totalCount * 1.1).toFixed(1), [totalCount]);
    const activityKm = useMemo(() => (activeCount + awaitingCount + paidCount * 0.5).toFixed(1), [activeCount, awaitingCount, paidCount]);
    const heartBpm = useMemo(() => 40 + awaitingCount * 8 + paidCount * 4, [awaitingCount, paidCount]);
    const runPct = useMemo(() => Math.min(95, Math.round((paidCount / totalCount) * 100)), [paidCount, totalCount]);
    const workoutPct = useMemo(() => Math.min(95, Math.round((awaitingCount / totalCount) * 100) || 10), [awaitingCount, totalCount]);
    const walkPct = useMemo(() => Math.max(5, 100 - runPct - workoutPct), [runPct, workoutPct]);
    const bgMain = "#111111"; // Main dark bg
    const bgCard = "#1A1A1A"; // Card bg
    const accentLime = "#bef264"; // Lime green
    const accentPurple = "#C4B5FD"; // Light purple

    const NavItem = ({ icon: Icon, label, count, active }: any) => (
        <div className={`flex items-center gap-4 px-4 py-3 cursor-pointer group rounded-[20px] transition-all mb-1 ${active ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-400 font-medium hover:bg-[#2A2A2A] hover:text-white'}`}>
            <Icon className="w-5 h-5" />
            <span className="flex-1">{label}</span>
            {count && <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${active ? 'bg-black text-white' : 'bg-[#bef264] text-black shadow-[0_0_10px_rgba(190, 242, 100,0.4)]'}`}>{count}</span>}
        </div>
    );

    return (
        <div className="flex w-full h-full font-sans overflow-hidden rounded-[24px]" style={{ background: bgMain }}>
            {/* Dark Sidebar */}
            <div className="w-[280px] shrink-0 p-6 flex flex-col rounded-r-[40px] border-r border-white/5 bg-[#161616]">
                <div className="flex items-center gap-3 mb-12 px-2">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-white text-2xl font-bold tracking-tight">flux.</span>
                </div>

                <div className="space-y-1 flex-1">
                    <NavItem icon={LayoutDashboard} label="Dashboard" count={3} active={true} />
                    <NavItem icon={Activity} label="Home" />
                    <NavItem icon={Zap} label="Nutrition" />
                    <NavItem icon={BarChart3} label="Reports" count={1} />
                    <NavItem icon={Users} label="Users" />
                    <NavItem icon={MessageSquare} label="Messages" />
                </div>

                {/* Upgrade Card */}
                <div className="mt-8 bg-[#bef264] rounded-[32px] p-6 relative overflow-hidden group cursor-pointer hover:shadow-[0_0_20px_rgba(190, 242, 100,0.3)] transition-shadow">
                    <div className="absolute -right-4 top-12 w-24 h-24 bg-[#65a30d] rounded-full blur-2xl opacity-60" />
                    <p className="font-bold text-lg text-black mb-1 relative z-10">Upgrade to Pro</p>
                    <p className="text-xs text-black/70 mb-4 leading-tight relative z-10 pr-4">Upgrade your account for a fuller experience.</p>
                    <button className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl text-xs font-bold hover:scale-[1.02] transition-transform relative z-10 shadow-lg">Upgrade Now</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-10 overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="relative">
                            <Avatar src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-14 h-14 bg-gray-200 border-2 border-[#1A1A1A] group-hover:border-[#bef264] transition-colors" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#111]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-white flex items-center gap-2 group-hover:text-[#bef264] transition-colors">{user.name} <ChevronDown className="w-4 h-4" /></h2>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input type="text" placeholder="Search..." className="pl-10 pr-4 py-3.5 bg-[#1A1A1A] rounded-full text-sm w-72 shadow-inner text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#bef264] transition-all" />
                        </div>
                        <button className="bg-[#1A1A1A] w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-[#2A2A2A] hover:text-[#bef264] transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-5xl font-bold tracking-tight mb-2 text-white">Health Overview</h1>
                        <p className="text-gray-500 font-medium">Take control of your health today!</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-500">12 July, 2024</span>
                        <button className="bg-[#1A1A1A] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg border border-white/5 flex items-center gap-2 hover:bg-[#252525]">Today <ChevronDown className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Card 1: Energy Used */}
                    <div className="bg-[#1A1A1A] rounded-[48px] p-8 shadow-2xl col-span-1 min-h-[340px] flex flex-col relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-6 z-10">
                            <div className="flex items-center gap-2 text-white">
                                <div className="p-2 bg-white/5 rounded-full"><Zap className="w-4 h-4 text-[#bef264] fill-current" /></div>
                                <span className="font-bold text-sm">Energy Used</span>
                            </div>
                            <MoreHorizontal className="w-5 h-5 text-gray-600 cursor-pointer hover:text-white" />
                        </div>
                        <div className="flex items-baseline gap-2 mb-8 z-10 text-white">
                            <span className="text-5xl font-bold tracking-tighter">{energyKcal}k</span>
                            <span className="text-sm text-gray-500 font-bold">projects active</span>
                        </div>
                        <div className="absolute top-24 right-8 bg-[#bef264] text-black text-[10px] font-bold px-3 py-1.5 rounded-full z-20 shadow-[0_0_15px_rgba(190, 242, 100,0.5)]">+5%</div>

                        {/* Abstract Bubble Chart */}
                        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-full h-[220px]">
                            <div className="absolute top-0 right-10 w-40 h-40 rounded-full bg-[#C4B5FD] flex items-center justify-center flex-col z-0 shadow-[0_0_50px_rgba(196,181,253,0.2)] animate-pulse hover:scale-105 transition-transform cursor-pointer">
                                <span className="font-bold text-2xl text-black">2.6k</span>
                                <span className="text-[10px] uppercase font-bold text-black/60">kcal</span>
                            </div>
                            <div className="absolute top-10 left-4 w-28 h-28 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-col z-10 text-white border-4 border-[#111] shadow-2xl hover:scale-105 transition-transform cursor-pointer">
                                <span className="font-bold text-xl">1.2k</span>
                                <span className="text-[10px] uppercase font-bold text-white/50">kcal</span>
                            </div>
                            <div className="absolute top-36 left-28 w-24 h-24 rounded-full bg-[#bef264] flex items-center justify-center flex-col z-20 border-4 border-[#111] shadow-lg hover:scale-105 transition-transform cursor-pointer">
                                <span className="font-bold text-lg text-black">500</span>
                                <span className="text-[10px] uppercase font-bold text-black/50">kcal</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column Block */}
                    <div className="col-span-1 grid grid-rows-2 gap-6">
                        {/* Heart Rate */}
                        <div className="bg-white rounded-[40px] p-7 shadow-lg flex flex-col justify-between group hover:shadow-2xl hover:shadow-white/5 transition-all">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-full"><Activity className="w-5 h-5 text-red-500 animate-pulse" /></div>
                                    <span className="font-bold text-sm text-black">Heart Rate</span>
                                </div>
                                <MoreHorizontal className="w-5 h-5 text-gray-300" />
                            </div>
                            <div className="flex items-end justify-between">
                                <div className="flex items-baseline gap-1 text-black">
                                    <span className="text-5xl font-bold tracking-tighter">{heartBpm}</span>
                                    <span className="text-sm text-gray-400 font-bold mb-1">score</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-gray-900 block">{awaitingCount} pending</span>
                                    <span className="text-xs text-gray-500 font-medium">{paidCount} paid</span>
                                </div>
                            </div>
                            <div className="h-10 w-full mt-2 flex items-end gap-1 overflow-hidden opacity-50">
                                {[3, 5, 4, 7, 4, 6, 3, 5, 8, 4, 3, 5, 6, 3, 4, 6].map((h, i) => <div key={i} className="w-full bg-red-500 rounded-t-sm" style={{ height: h * 6 + '%' }} />)}
                            </div>
                        </div>
                        {/* Activity */}
                        <div className="bg-[#1A1A1A] rounded-[40px] p-7 shadow-lg flex flex-col justify-between border border-white/5">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-full"><Zap className="w-5 h-5 text-[#bef264] fill-current" /></div>
                                    <span className="font-bold text-sm text-white">Activity</span>
                                </div>
                                <MoreHorizontal className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex items-end justify-between">
                                <div className="flex items-baseline gap-1 text-white">
                                    <span className="text-5xl font-bold tracking-tighter">{activityKm}</span>
                                    <span className="text-sm text-gray-500 font-bold mb-1">active</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-white block">{activeCount} done</span>
                                    <span className="text-xs text-gray-500 font-medium">{totalCount} total</span>
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                <div className="w-[65%] h-full bg-gradient-to-r from-[#bef264] to-[#65a30d] shadow-[0_0_10px_#bef264]" />
                            </div>
                        </div>
                    </div>

                    {/* Wellness Index */}
                    <div className="bg-[#1A1A1A] rounded-[48px] p-8 shadow-2xl col-span-1 relative flex flex-col justify-between border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <span className="font-bold bg-[#333] w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white shadow-inner">%</span>
                                <span className="font-bold text-sm text-white">Wellness Index</span>
                            </div>
                            <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-6xl font-bold text-white tracking-tighter">{wellnessIndex}</span>
                            <span className="text-xl text-gray-600 font-bold">%</span>
                            <span className="ml-2 bg-[#bef264] text-black px-2.5 py-1 rounded-lg text-[10px] font-bold">{paidCount}/{totalCount} paid</span>
                        </div>

                        {/* Dot Matrix Chart */}
                        <div className="grid grid-cols-8 gap-y-2 gap-x-3 h-32 items-end pb-2">
                            {[2, 4, 5, 3, 4, 6, 7, 5].map((h, i) => (
                                <div key={i} className="flex flex-col gap-1.5 items-center">
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <div key={j} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${8 - j <= h ? 'bg-[#C4B5FD] shadow-[0_0_5px_#C4B5FD]' : 'bg-[#2A2A2A]'}`} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                    <div className="col-span-1 bg-white rounded-[48px] p-8 shadow-lg flex flex-col justify-between min-h-[200px]">
                        {/* Progress Indicators */}
                        {[['Paid', runPct, 'bg-[#C4B5FD] shadow-[0_0_10px_#C4B5FD]'], ['Pending', workoutPct, 'bg-black'], ['Draft', walkPct, 'bg-[#bef264] shadow-[0_0_10px_#bef264]']].map(([l, pct, cls], i) => (
                            <div key={i} className="mb-4 last:mb-0 group cursor-pointer">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-4xl font-bold text-black tracking-tight group-hover:scale-105 transition-transform origin-left">{pct}<span className="text-lg text-gray-300 ml-1">%</span></span>
                                    <span className="text-xs font-bold flex items-center gap-2 text-black bg-gray-50 px-3 py-1 rounded-full uppercase tracking-wider">{l} <div className={`w-2 h-2 rounded-full ${['bg-[#C4B5FD]', 'bg-black', 'bg-[#bef264]'][i]}`} /></span>
                                </div>
                                <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden box-content border border-gray-100/50">
                                    <div className={`h-full rounded-full ${cls as string}`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Dark Sleep Analysis */}
                    <div className="col-span-2 bg-[#1A1A1A] rounded-[48px] p-10 text-white relative flex flex-col border border-white/5 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/20 blur-3xl rounded-full pointer-events-none" />

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"><ChevronDown className="w-5 h-5" /></div>
                                <span className="font-bold text-lg">Sleep Analysis</span>
                            </div>
                            <div className="px-5 py-2.5 border border-gray-700 rounded-full text-xs font-bold flex gap-2 items-center hover:bg-white/5 cursor-pointer transition-colors">Monthly <ChevronDown className="w-3 h-3 text-gray-400" /></div>
                        </div>

                        <div className="flex gap-16 mb-8 relative z-10">
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#bef264] to-white drop-shadow-sm">85</h3>
                                    <span className="text-lg font-bold text-gray-500">%</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">Sleep Efficiency</p>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#C4B5FD] to-white drop-shadow-sm">7h 15m</h3>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">Sleep Duration</p>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="flex-1 flex items-end justify-between gap-6 h-40 relative z-10">
                            {[40, 55, 30, 45, 80, 25, 35, 40].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
                                    <div className={`w-full rounded-t-xl transition-all duration-300 ${i === 4 ? 'bg-gradient-to-t from-[#bef264] to-[#efffcc] shadow-[0_0_20px_rgba(190, 242, 100,0.3)] scale-y-105' : 'bg-[#252525] border-t border-white/5 hover:bg-[#333]'}`} style={{ height: `${h}%` }}>
                                        {i === 4 && <div className="absolute w-full h-full left-4 bg-[#C4B5FD] rounded-t-xl -z-10 opacity-30 blur-sm" />}
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${i === 4 ? 'text-white' : 'text-gray-600'}`}>{['Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── 3. CAR RENTAL (Focus Flow / Electric Lime) ───────────────────────────────
// Style: High key, neon accents, floating navigation pill, detailed lists
// Ref: Image 3
const CarRentalVariant = ({ activeSection }: { activeSection: string }) => {
    // Colors
    const neonLime = "#CFF005";
    const bgMain = "#F2F2F2";

    return (
        <div className="w-full h-full font-sans overflow-y-auto rounded-[24px]" style={{ background: bgMain }}>
            {/* Floating Header Pill */}
            <div className="sticky top-6 z-50 flex justify-center mb-8 px-4">
                <div className="bg-[#CFF005] pl-1.5 pr-1.5 py-1.5 rounded-full shadow-2xl flex items-center gap-1 max-w-2xl w-full mx-auto backdrop-blur-sm bg-opacity-90 ring-4 ring-black/5">
                    <div className="flex font-bold text-sm bg-white/20 rounded-full p-1">
                        <button className="bg-black text-[#CFF005] px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-lg">Rent</button>
                        <button className="px-6 py-2.5 text-black/60 hover:text-black transition-colors rounded-full hover:bg-black/5">Buy</button>
                        <button className="px-6 py-2.5 text-black/60 hover:text-black transition-colors rounded-full hover:bg-black/5">Sell</button>
                    </div>

                    <div className="flex-1 flex items-center justify-center gap-1.5 ml-4 mr-4 bg-white/40 h-10 rounded-full px-4 border border-white/50 shadow-inner">
                        <MapPin className="w-3.5 h-3.5 text-black/70" />
                        <span className="text-xs text-black/60 font-medium">Location:</span>
                        <span className="text-xs font-bold underline decoration-black/30">Los Angeles</span>
                    </div>

                    <div className="flex items-center gap-2 pl-2">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white cursor-pointer transition-colors shadow-sm text-black"><Bell className="w-4 h-4" /></div>
                        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Brad" className="w-10 h-10 border-2 border-white shadow-sm" />
                    </div>
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-10 pb-10 flex gap-10">
                {/* Left Column */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-6 mb-10">
                        {/* Back button */}
                        <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.05)] cursor-pointer hover:scale-110 transition-transform group border border-white">
                            <ArrowUpRight className="rotate-180 w-6 h-6 text-black group-hover:text-[#CFF005] transition-colors" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black leading-[0.9] tracking-tight text-black">Let's find a suitable <br /> car for you!</h1>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex gap-3 mb-8">
                        <div className="flex-1 bg-white rounded-[24px] p-2 flex items-center gap-4 px-6 shadow-sm border border-transparent focus-within:border-black/10 focus-within:shadow-md transition-all h-16">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input className="w-full outline-none text-base font-bold text-black placeholder:text-gray-300" value="Volvo" readOnly />
                            <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-500">ESC</span>
                        </div>
                        <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-sm cursor-pointer hover:bg-black hover:text-[#CFF005] transition-colors border border-transparent hover:border-black"><Filter className="w-6 h-6" /></div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3 mb-10 overflow-x-auto no-scrollbar pb-2">
                        {['Crossover', 'Sedan', 'Wagon', 'SUV', 'Electric', 'Convertible'].map(f => (
                            <button key={f} className={`px-6 py-3 rounded-2xl border text-sm font-bold transition-all shadow-sm ${f === 'Crossover' ? 'bg-black text-[#CFF005] border-black shadow-lg hover:bg-gray-900' : 'bg-white border-transparent text-gray-500 hover:bg-white hover:text-black hover:shadow'}`}>{f}</button>
                        ))}
                    </div>

                    {/* Hero Car Card */}
                    <div className="bg-white rounded-[48px] p-8 shadow-xl shadow-black/5 mb-8 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all">
                        {/* Background blobs */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#F1FABE] to-[#EADE78] rounded-bl-full opacity-30 -z-10 group-hover:opacity-40 transition-opacity" />

                        <div className="flex justify-between items-start mb-8 relative z-20">
                            <div>
                                <h2 className="text-3xl font-black uppercase italic tracking-wide">Volvo EX30</h2>
                                <p className="text-sm text-gray-400 font-bold mt-1 bg-gray-50 px-2 py-1 rounded-lg inline-block">Fully electric crossover</p>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-gray-100 bg-white flex items-center justify-center cursor-pointer hover:bg-black hover:text-white transition-colors shadow-sm"><MoreHorizontal /></div>
                        </div>

                        {/* Fake Car Illustration */}
                        <div className="h-64 relative flex items-center justify-center mb-8 z-10 group-hover:scale-105 transition-transform duration-500">
                            <div className="relative w-full max-w-sm">
                                {/* Body */}
                                <div className="h-32 bg-[#e8e6d9] rounded-[40px] relative shadow-inner overflow-hidden border border-black/5">
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-200 to-white opacity-80" />
                                    {/* Window */}
                                    <div className="absolute top-4 left-8 right-16 h-12 bg-[#222] rounded-t-3xl rounded-b-lg border-2 border-white/20" />
                                </div>
                                {/* Wheels */}
                                <div className="absolute -bottom-8 left-8 w-16 h-16 bg-[#222] rounded-full border-4 border-gray-300 shadow-2xl flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-white/20" />
                                </div>
                                <div className="absolute -bottom-8 right-8 w-16 h-16 bg-[#222] rounded-full border-4 border-gray-300 shadow-2xl flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-white/20" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between relative z-20">
                            <div className="flex gap-4">
                                <button className="w-14 h-14 bg-black rounded-[20px] flex items-center justify-center text-[#CFF005] shadow-lg hover:scale-110 transition-transform"><Zap className="w-6 h-6 fill-current" /></button>
                                <button className="w-14 h-14 bg-gray-100 rounded-[20px] flex items-center justify-center hover:bg-gray-200 transition-colors text-black"><ArrowDownRight className="w-6 h-6" /></button>
                            </div>
                            <div className="flex gap-8 items-center bg-gray-50 px-6 py-3 rounded-2xl">
                                <div className="text-center">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Deals</span>
                                    <span className="text-xl font-bold">64</span>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div className="text-center">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Rate</span>
                                    <span className="text-xl font-bold flex items-center gap-1">4.8 <span className="text-orange-400 text-sm">★</span></span>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div className="text-center">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Seats</span>
                                    <span className="text-xl font-bold">5</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Prompt */}
                    <div className="bg-white rounded-[36px] p-3 shadow-md border border-white">
                        <div className="flex gap-1 mb-2 px-3 pt-2">
                            {['Chat GPT', 'Gemini', 'Claude'].map((a, i) => (
                                <div key={a} className={`px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-colors ${i === 0 ? 'bg-black text-[#CFF005] shadow-md' : 'text-gray-400 hover:bg-gray-100 hover:text-black'}`}>
                                    <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-[#CFF005]' : 'bg-gray-300'}`} /> {a}
                                </div>
                            ))}
                            <div className="ml-auto flex gap-2">
                                <div className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"><Plus className="w-4 h-4" /></div>
                                <div className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"><MessageSquare className="w-4 h-4" /></div>
                            </div>
                        </div>
                        <div className="bg-[#F8F9FA] rounded-[28px] p-6 border border-gray-100">
                            <p className="text-xs font-bold mb-4 text-black">How can I help you?</p>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-white rounded-2xl p-4 text-xs font-medium text-gray-800 shadow-sm border border-black/5 leading-relaxed">
                                    Arrange to rent this car for 8am this Monday for me and my two little daughters
                                </div>
                                <button className="w-14 h-auto bg-black rounded-2xl flex items-center justify-center text-[#CFF005] shadow-xl hover:scale-105 transition-transform"><Send className="w-5 h-5 ml-1" /></button>
                                <button className="w-14 h-auto bg-white rounded-2xl flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-black shadow-sm"><Mic className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Summary) */}
                <div className="w-[400px] bg-white rounded-[48px] p-8 shrink-0 shadow-lg relative overflow-hidden h-fit border border-gray-100">
                    {/* Decorative top dots */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-20">
                        {[1, 2, 3, 4].map(d => <div key={d} className="w-1.5 h-1.5 bg-black rounded-full" />)}
                    </div>

                    <div className="flex justify-between items-center mt-6 mb-10">
                        <h2 className="text-2xl font-bold">Rent Summary</h2>
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">Powered by <span className="text-black font-extrabold">GPT-4</span></span>
                    </div>

                    {/* Timeline Steps */}
                    <div className="relative space-y-4 pl-4">
                        <div className="absolute left-[34px] top-8 bottom-8 w-px bg-gray-200 border-l border-dashed border-gray-300" />

                        {/* Card 1 */}
                        <div className="bg-[#FAFAFA] p-6 rounded-[32px] relative border border-transparent hover:border-black/5 hover:shadow-md transition-all group">
                            <div className="absolute -left-[42px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black z-10 box-content border-4 border-white shadow-sm transition-transform group-hover:scale-125" />
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                    <MapPin className="w-3 h-3" /> My Station
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center cursor-pointer hover:bg-black hover:text-[#CFF005] transition-colors"><ArrowUpRight className="w-3 h-3" /></div>
                            </div>
                            <p className="font-bold text-base text-gray-900">Vermont Square</p>
                            <p className="text-xs text-gray-500 mb-4 font-medium">Los Angeles, CA</p>
                            <div className="flex gap-2 flex-wrap">
                                <span className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gray-100 shadow-sm text-gray-600">three person</span>
                                <span className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gray-100 shadow-sm text-gray-600">2 little children</span>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-[#FAFAFA] p-6 rounded-[32px] relative group hover:shadow-md transition-shadow">
                            <div className="absolute -left-[42px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black z-10 box-content border-4 border-white shadow-sm transition-transform group-hover:scale-125" />
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                    <Calendar className="w-3 h-3" /> My Dates
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center cursor-pointer hover:bg-black hover:text-[#CFF005] transition-colors"><ArrowUpRight className="w-3 h-3" /></div>
                            </div>
                            <p className="font-bold text-base text-gray-900 mb-4">Monday morning</p>
                            <div className="flex gap-3 items-center">
                                <span className="bg-white px-4 py-3 rounded-2xl text-xs font-bold shadow-sm border border-gray-100 flex-1 text-center text-black">15.06.2024</span>
                                <span className="bg-white px-4 py-3 rounded-2xl text-xs font-bold shadow-sm border border-gray-100 flex-1 text-center text-black">8 am</span>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-[#FAFAFA] p-6 rounded-[32px] relative group hover:shadow-md transition-shadow">
                            <div className="absolute -left-[42px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black z-10 box-content border-4 border-white shadow-sm transition-transform group-hover:scale-125" />
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                    <Zap className="w-3 h-3" /> My Car
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center cursor-pointer hover:bg-black hover:text-[#CFF005] transition-colors"><ArrowUpRight className="w-3 h-3" /></div>
                            </div>
                            <p className="font-bold text-base text-gray-900">Volvo EX30</p>
                            <p className="text-xs text-gray-500 mb-4 font-medium">Fully electric crossover</p>
                            <div className="flex gap-2 text-[10px] font-bold">
                                <span className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 shadow-sm">49.0 kWh</span>
                                <span className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 shadow-sm">286.5 Wh/mi</span>
                            </div>
                        </div>
                    </div>

                    {/* Sticky footer player */}
                    <div className="mt-8 bg-[#333]/90 backdrop-blur-xl rounded-[28px] p-3 flex items-center gap-4 text-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 opacity-100" />
                        <div className="relative z-10 flex w-full items-center gap-4 pr-2">
                            <button className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 group-hover:border-[#CFF005] transition-colors"><span className="text-[#CFF005] font-black text-xs tracking-widest">||</span></button>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wide">Reservation</span>
                                    <span className="text-[10px] font-bold text-[#CFF005]">67%</span>
                                </div>
                                {/* Audio wave viz */}
                                <div className="flex items-end gap-[3px] h-5 opacity-80">
                                    {Array.from({ length: 30 }).map((_, i) => (
                                        <div key={i} className={`w-1 rounded-full ${i < 20 ? 'bg-[#CFF005] shadow-[0_0_5px_#CFF005]' : 'bg-white/20'}`} style={{ height: Math.max(4, Math.random() * 20) + 'px' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// ─── 4. CELOXIS (Command Center) ──────────────────────────────────────────────
// Style: Dense information, soft gray background, glassmorphism cards, pastel tags
// Ref: Image 2
const CeloxisVariant = ({ activeSection }: { activeSection: string }) => {
    const bgMain = "#EBECEC";

    // Sidebar items
    const SidebarItem = ({ icon: Icon, label, selected }: any) => (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${selected ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-black' : 'hover:bg-black/5 text-gray-600'}`}>
            <Icon className={`w-4 h-4 ${selected ? 'text-black' : 'text-gray-500'}`} />
            <span className={`text-sm ${selected ? 'font-bold' : 'font-medium'}`}>{label}</span>
            {selected && <div className="ml-auto w-1.5 h-1.5 bg-yellow-400 rounded-full" />}
        </div>
    );

    return (
        <div className="flex w-full h-full font-sans text-[#333] rounded-[24px] overflow-hidden" style={{ background: bgMain }}>
            {/* Sidebar (Glassmorphism Stack) */}
            <div className="w-[280px] p-6 flex flex-col h-full bg-[#FAFAFA]/80 backdrop-blur-md border-r border-white shadow-xl z-20 relative">
                <div className="flex items-center gap-3 mb-10 pl-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg shadow-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-black rounded-full" />
                    </div>
                    <span className="font-bold text-xl text-gray-800 tracking-tight">celoxis</span>
                </div>

                <div className="mb-8">
                    <div className="flex items-center gap-3 text-gray-400 bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-2 hover:border-blue-200 transition-colors cursor-text">
                        <Search className="w-4 h-4" />
                        <span className="text-xs font-medium">Search system...</span>
                        <span className="ml-auto text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border">/</span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <SidebarItem icon={LayoutDashboard} label="Main Dashboard" />
                    <SidebarItem icon={Folder} label="Files Managment" selected={true} />
                    <SidebarItem icon={Shield} label="Company Portfolio" />

                    <div className="pt-6 pb-2 pl-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workspace</div>
                    <div className="flex items-center justify-between px-4 py-2.5 text-gray-600 text-sm hover:bg-white hover:rounded-xl hover:shadow-sm cursor-pointer group transition-all">
                        <div className="flex items-center gap-3"><Check className="w-4 h-4 text-gray-400" /> Managing tasks</div>
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 text-gray-600 text-sm hover:bg-white hover:rounded-xl hover:shadow-sm cursor-pointer group transition-all">
                        <div className="flex items-center gap-3"><Settings className="w-4 h-4 text-gray-400" /> Task Distribution</div>
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 text-gray-600 text-sm hover:bg-white hover:rounded-xl hover:shadow-sm cursor-pointer group transition-all">
                        <div className="flex items-center gap-3"><BarChart3 className="w-4 h-4 text-gray-400" /> Company Indicators</div>
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-gray-400" />
                    </div>
                </div>

                <div className="mt-auto space-y-2 pt-6 border-t border-gray-200/50">
                    <div className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-gray-500 cursor-pointer hover:text-black hover:bg-white hover:rounded-lg hover:shadow-sm transition-all">
                        <Bell className="w-4 h-4" /> Notifications <span className="ml-auto bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">3</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-gray-500 cursor-pointer hover:text-black hover:bg-white hover:rounded-lg hover:shadow-sm transition-all">
                        <User className="w-4 h-4" /> Account
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-10 overflow-y-auto relative bg-gradient-to-br from-gray-100 to-gray-200">
                {/* Top Nav */}
                <div className="flex justify-between items-center mb-10 sticky top-0 z-30 pt-4 -mt-4 pb-4 backdrop-blur-sm">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center hover:bg-white cursor-pointer transition-colors"><ArrowUpRight className="rotate-180 w-4 h-4" /></div>
                            <h1 className="text-3xl font-bold text-gray-800">Management Overview</h1>
                        </div>
                    </div>
                </div>

                {/* Glass Tab Navigation */}
                <div className="mb-8">
                    <div className="bg-white/40 backdrop-blur-xl p-1.5 rounded-full inline-flex gap-2 shadow-sm border border-white/60">
                        {['Overview', 'Teams', 'Tasks', 'Files'].map((t, i) => (
                            <button key={t} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${i === 0 ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-black hover:bg-white/50'}`}>
                                {t}
                            </button>
                        ))}
                        <div className="w-px h-6 bg-gray-300 mx-2 self-center" />
                        <div className="flex items-center gap-2 px-4 text-sm text-gray-500 cursor-pointer hover:text-black">
                            <Search className="w-4 h-4" /> Search <span className="hidden xl:inline">on Files</span>...
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid - 3 Columns */}
                <div className="flex gap-8 h-[calc(100%-140px)] min-h-[600px]">
                    {/* Column 1: Small Widgets */}
                    <div className="w-[300px] shrink-0 flex flex-col gap-6">
                        {/* AI Insights */}
                        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[32px] shadow-sm border border-white hover:shadow-lg transition-shadow">
                            <div className="flex justify-between mb-4">
                                <span className="bg-gradient-to-r from-pink-50 to-pink-100 text-pink-600 text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide border border-pink-200">AI INSIGHTS</span>
                                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer"><ChevronRight className="w-3 h-3 text-gray-400" /></div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
                                The Company's profitability for the third quarter <span className="bg-yellow-100 px-1 rounded text-black font-bold border-b-2 border-yellow-300">increased by 27.1%</span>
                            </p>
                            <div className="h-28 bg-gray-50 rounded-2xl relative overflow-hidden flex items-end justify-center pb-0 border border-gray-100 px-4">
                                <div className="flex gap-2 items-end h-20 w-full justify-between px-2">
                                    {[2, 4, 5, 4, 7, 8, 6].map((h, i) => <div key={i} className={`flex-1 rounded-t-sm transition-all duration-500 hover:bg-yellow-500 ${i === 5 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-gray-200'}`} style={{ height: h * 10 + '%' }} />)}
                                </div>
                            </div>
                        </div>

                        {/* File Categories */}
                        <div className="bg-gradient-to-b from-white/60 to-white/30 p-2 rounded-[32px] shadow-sm border border-white space-y-2 backdrop-blur-md">
                            {[
                                { l: 'Invoices', f: '193 files', c: 'bg-white shadow-sm' },
                                { l: 'Reporting', f: '271 files', c: 'bg-white/50 hover:bg-white' },
                                { l: 'Analysis', f: '295 files', c: 'bg-white/50 hover:bg-white' },
                                { l: 'Overview', f: '421 files', c: 'bg-white/50 hover:bg-white' },
                            ].map((cat, i) => (
                                <div key={i} className={`${cat.c} p-4 rounded-[24px] flex justify-between items-center cursor-pointer transition-all border border-transparent hover:border-white/50`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                            {i === 0 ? <FileText className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{cat.l}</p>
                                            <p className="text-xs text-gray-400 font-medium">{cat.f}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Main Data */}
                    <div className="flex-1 flex flex-col gap-6 min-w-0">
                        {/* Status Cards */}
                        <div className="flex gap-6">
                            <div className="flex-1 bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-sm border border-white hover:shadow-md transition-shadow">
                                <div className="flex justify-between mb-8">
                                    <span className="font-bold text-base text-gray-800">Project Alerts</span>
                                    <MoreHorizontal className="w-5 h-5 text-gray-300 cursor-pointer hover:text-black" />
                                </div>
                                <div className="flex justify-between items-end relative">
                                    {/* Lines connecting dots - purely visual */}
                                    <div className="absolute top-3 left-2 right-2 h-px bg-gray-100 -z-10" />

                                    <div className="text-center bg-white/80 p-2 rounded-xl backdrop-blur-sm">
                                        <span className="text-red-500 font-black text-2xl">• 49</span>
                                        <p className="text-[10px] text-red-400 uppercase font-bold mt-1 tracking-wider">Critical</p>
                                    </div>
                                    <div className="text-center bg-white/80 p-2 rounded-xl backdrop-blur-sm">
                                        <span className="text-orange-400 font-black text-2xl">• 146</span>
                                        <p className="text-[10px] text-orange-400 uppercase font-bold mt-1 tracking-wider">Medium</p>
                                    </div>
                                    <div className="text-center bg-white/80 p-2 rounded-xl backdrop-blur-sm">
                                        <span className="text-yellow-400 font-black text-2xl">• 27</span>
                                        <p className="text-[10px] text-yellow-500 uppercase font-bold mt-1 tracking-wider">Low</p>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-gray-100/50 rounded-full mt-8 flex overflow-hidden">
                                    <div className="bg-red-400 w-[20%] shadow-[0_0_10px_rgba(248,113,113,0.5)]" />
                                    <div className="bg-orange-300 w-[60%]" />
                                    <div className="bg-yellow-300 w-[20%]" />
                                </div>
                                <div className="flex justify-between text-[9px] text-gray-400 mt-3 font-mono">
                                    <span>DEC 18</span><span>DEC 24</span>
                                </div>
                            </div>

                            <div className="flex-1 bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-sm border border-white hover:shadow-md transition-shadow">
                                <div className="flex justify-between mb-6">
                                    <span className="font-bold text-base text-gray-800">Cost & Revenue</span>
                                    <MoreHorizontal className="w-5 h-5 text-gray-300 cursor-pointer hover:text-black" />
                                </div>
                                <div className="space-y-8 mt-6">
                                    <div className="group">
                                        <div className="flex justify-between text-sm font-bold mb-2">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800">$1.1M</span>
                                            <span className="text-gray-400">(Cost / 62%)</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                            <div className="bg-gray-800 w-[62%] h-full rounded-full group-hover:bg-black transition-colors" />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <div className="flex justify-between text-sm font-bold mb-2">
                                            <span className="bg-yellow-100 px-2 py-0.5 rounded text-yellow-800">$1.4M</span>
                                            <span className="text-gray-400">(Revenue / 89%)</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                            <div className="bg-yellow-400 w-[89%] h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.4)]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pipeline Table */}
                        <div className="flex-1 bg-white/60 backdrop-blur-md rounded-[32px] p-8 shadow-sm border border-white/50 overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-bold text-lg text-gray-800">My Projects Pipeline</h3>
                                <div className="flex gap-3">
                                    <button className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm transition-all"><Filter className="w-4 h-4 text-gray-500" /></button>
                                    <button className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white hover:bg-gray-800 shadow-md transition-all"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4 px-4">
                                <span className="col-span-2">Job Description</span>
                                <span className="text-center">Schedule</span>
                                <span className="text-center">Budget</span>
                                <span className="text-right">Deadline / Client</span>
                            </div>

                            <div className="space-y-3 overflow-y-auto pr-2">
                                {[
                                    { n: "Ali transport deployment", s: "Off Track", b: "On Track", d: "17-Jul-2020", c: "Rolex", bg: "bg-transparent hover:bg-white/40" },
                                    { n: "Salesforce Integration", s: "On Track", b: "On Track", d: "21-Aug-2020", c: "Apple", bg: "bg-white shadow-lg scale-[1.01] ring-1 ring-black/5" },
                                    { n: "Website redesign", s: "Delayed", b: "Off Track", d: "10-Sep-2020", c: "Google", bg: "bg-transparent hover:bg-white/40" },
                                    { n: "Mobile app update", s: "Delayed", b: "Delayed", d: "15-Oct-2020", c: "Microsoft", bg: "bg-transparent hover:bg-white/40" },
                                    { n: "Cloud Migration", s: "On Track", b: "On Track", d: "01-Nov-2020", c: "Amazon", bg: "bg-transparent hover:bg-white/40" },
                                ].map((row, i) => (
                                    <div key={i} className={`grid grid-cols-5 items-center p-4 rounded-2xl transition-all cursor-pointer group ${row.bg}`}>
                                        <span className="col-span-2 text-sm font-bold text-gray-800 pl-2 border-l-4 border-transparent group-hover:border-yellow-400 transition-colors">{row.n}</span>

                                        <div className="flex items-center justify-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${row.s === 'On Track' ? 'bg-green-400 shadow-[0_0_5px_limegreen]' : row.s === 'Delayed' ? 'bg-red-400' : 'bg-orange-400'}`} />
                                            <span className="text-xs font-medium text-gray-600 hidden xl:inline">{row.s}</span>
                                        </div>

                                        <div className="flex items-center justify-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${row.b === 'On Track' ? 'bg-green-400 shadow-[0_0_5px_limegreen]' : row.b === 'Delayed' ? 'bg-red-400' : 'bg-orange-400'}`} />
                                            <span className="text-xs font-medium text-gray-600 hidden xl:inline">{row.b}</span>
                                        </div>

                                        <div className="flex justify-between items-center pl-4">
                                            <div className="flex flex-col text-right w-full pr-4">
                                                <span className="text-xs font-bold text-gray-800">{row.d}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{row.c}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── 5. SYNCDESK (Analytics Hub) ──────────────────────────────────────────────
// Style: Data-heavy, clean white cards with subtle shadows, lime green gradients
// Ref: Image 1
const SyncdeskVariant = ({ activeSection }: { activeSection: string }) => {
    const bgMain = "#F4F5F6";
    // Using a more vibrant lime to match the "Syncdesk" branding in Image 1
    const accentLime = "#DBF350";

    return (
        <div className="w-full h-full font-sans flex flex-col rounded-[24px] overflow-hidden" style={{ background: bgMain }}>
            {/* Header */}
            <div className="h-20 bg-white/80 backdrop-blur-md shrink-0 flex items-center px-8 justify-between border-b border-gray-200 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-[#DBF350] shadow-lg shadow-lime-400/50 hover:scale-105 transition-transform cursor-pointer">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <span className="font-bold text-xl tracking-tight hidden md:block">syncdesk</span>
                </div>

                <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200 shadow-inner">
                    {['Overview', 'Analytics', 'Companies', 'Documents'].map((l, i) => (
                        <button key={l} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${i === 0 ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black hover:bg-white'}`}>
                            {l}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                        <input className="bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold w-64 placeholder:text-gray-400 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black/5 transition-all outline-none shadow-sm" placeholder="Type Client Name or ID" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 border border-gray-200 px-1.5 py-0.5 rounded">/</div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[#DBF350] hover:bg-gray-800 cursor-pointer shadow-md transition-colors relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-400 cursor-pointer transition-colors shadow-sm"><Settings className="w-4 h-4" /></div>
                    </div>
                    <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" className="border-2 border-white shadow-sm" />
                        <div className="hidden xl:block">
                            <p className="text-sm font-bold text-black">Jordan Lee</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Manager</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main scroll area */}
            <div className="flex-1 overflow-y-auto p-8 relative">
                {/* Intro Section */}
                <div className="flex items-end justify-between mb-8 relative z-20">
                    <div>
                        <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Data Based on All Clients</p>
                        <h1 className="text-5xl font-extrabold tracking-tight text-black">Overview Panel</h1>
                    </div>

                    {/* Floating Glass Cards effect (Visual flair from image) */}
                    <div className="absolute top-0 right-10 w-[600px] h-[200px] pointer-events-none hidden 2xl:block">
                        <div className="absolute right-40 top-0 w-72 h-44 bg-gradient-to-br from-[#DBF350] to-[#b3cc2d] rounded-2xl shadow-[0_20px_40px_rgba(219,243,80,0.3)] p-6 text-black z-20 transform -rotate-2 hover:rotate-0 transition-transform duration-500 border border-white/20">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-black/10 rounded-lg"><Zap className="w-5 h-5" /></div>
                                <ArrowUpRight className="w-5 h-5 opacity-50" />
                            </div>
                            <p className="font-bold text-xl leading-tight">Last month, automation boosted your time savings to <span className="bg-black/10 px-1 rounded">48.3 hours</span></p>
                        </div>
                        <div className="absolute right-10 -top-4 w-72 h-44 bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-xl z-10 rotate-6" />
                    </div>

                    {/* Date Picker */}
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200/60 mt-4 md:mt-0">
                        <button className="px-4 py-2 rounded-xl hover:bg-gray-50 text-xs font-bold flex items-center gap-2 text-gray-700 transition-colors"><Calendar className="w-4 h-4 text-gray-400" /> Dec 01, 2023</button>
                        <span className="text-gray-200">|</span>
                        <button className="px-4 py-2 rounded-xl hover:bg-gray-50 text-xs font-bold flex items-center gap-2 text-gray-400 transition-colors">Dec 01, 2024</button>
                        <button className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold flex items-center gap-2 shadow-lg ml-2 hover:bg-gray-800 transition-colors">All Partners <ChevronDown className="w-3 h-3" /></button>
                    </div>
                </div>

                <div className="flex gap-8 relative z-10">
                    {/* Left Column (Main Stats) */}
                    <div className="flex-1 flex flex-col gap-6 min-w-0">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Processed Items */}
                            <div className="bg-white p-6 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-lg transition-shadow group">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-white transition-colors"><Folder className="w-5 h-5" /></div>
                                    <span className="font-bold text-sm text-gray-600 group-hover:text-black">Processed Items</span>
                                </div>
                                <div className="flex flex-col items-center py-4">
                                    <div className="flex items-baseline">
                                        <span className="text-5xl font-black tracking-tighter">97,22</span><span className="text-xl text-gray-400 font-bold ml-1">%</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[11px] text-gray-500 font-bold mb-3 mt-2 px-1">
                                    <span>14.9k<br /><span className="font-medium text-gray-400">Auto-Processed</span></span>
                                    <span className="text-right">18k<br /><span className="font-medium text-gray-400">Pending</span></span>
                                </div>
                                <div className="w-full h-8 bg-gray-100 rounded-lg relative overflow-hidden flex p-1">
                                    <div className="w-1.5 h-full bg-black rounded-sm shadow-sm" />
                                    <div className="flex-1 mx-1 bg-white rounded-sm border border-gray-200" />
                                    <div className="w-[20%] h-full bg-green-500/10 border border-green-500 border-dashed rounded-sm" />
                                </div>
                            </div>

                            {/* Synced Records (Gauge) */}
                            <div className="bg-white p-6 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-2 relative z-10">
                                    <div className="p-2 bg-gray-50 rounded-xl"><Globe className="w-5 h-5" /></div>
                                    <span className="font-bold text-sm text-gray-600">Synced Records</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mb-8 font-bold px-1 relative z-10">
                                    <span>174<br /><span className="font-medium text-gray-300">Verified</span></span>
                                    <span className="text-right">31<br /><span className="font-medium text-gray-300">Pending</span></span>
                                </div>
                                <div className="relative h-28 flex items-end justify-center z-10">
                                    {/* Background Arch */}
                                    <div className="w-48 h-24 border-[12px] border-gray-100 rounded-t-full border-b-0 absolute top-0" />
                                    {/* Foreground Arch */}
                                    <div className="w-48 h-24 border-[12px] border-black rounded-t-full border-b-0 absolute top-0 z-10 shadow-xl" style={{ clipPath: 'polygon(0 0, 72% 0, 72% 100%, 0 100%)' }} />

                                    {/* Indicator Dot */}
                                    <div className="absolute top-2 left-[70%] w-5 h-5 bg-[#DBF350] rounded-full shadow-[0_0_10px_#DBF350] border-2 border-white z-20" />

                                    <span className="text-4xl font-black mb-2 tracking-tight">71,74<span className="text-base text-gray-400 font-bold ml-1">%</span></span>
                                </div>
                            </div>

                            {/* Anomalies */}
                            <div className="bg-white p-6 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-lg transition-shadow group">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors"><AlertCircle className="w-5 h-5" /></div>
                                    <span className="font-bold text-sm text-gray-600 group-hover:text-red-500">Anomalies</span>
                                </div>
                                <div className="flex flex-col items-end py-4">
                                    <div className="flex items-baseline">
                                        <span className="text-5xl font-black tracking-tighter text-red-500">10,12</span><span className="text-xl text-red-200 font-bold ml-1">%</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[11px] text-gray-500 font-bold mb-3 mt-2 px-1">
                                    <span>1.62k<br /><span className="font-medium text-gray-400">Detected</span></span>
                                    <span className="text-right">13.7k<br /><span className="font-medium text-gray-400">Total Items</span></span>
                                </div>
                                <div className="w-full h-8 bg-gray-100 rounded-lg relative overflow-hidden flex p-1">
                                    <div className="w-[15%] h-full bg-[#DBF350] rounded-sm shadow-sm" />
                                    <div className="flex-1 mx-1 bg-white rounded-sm border border-gray-200" />
                                    <div className="w-1.5 h-full bg-black rounded-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Row 2 - Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Utilization */}
                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                <div className="flex justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-black text-white rounded-lg"><Database className="w-4 h-4" /></div>
                                        <span className="font-bold text-base">Utilization</span>
                                    </div>
                                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><ArrowUpRight className="w-4 h-4" /></button>
                                </div>
                                <div className="flex justify-between items-end mb-8">
                                    <div className="text-xs font-bold space-y-3">
                                        <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-black rounded-full" /> 65% <span className="text-gray-400 font-medium">Syncs</span></p>
                                        <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-300 rounded-full" /> 82% <span className="text-gray-400 font-medium">Fetches</span></p>
                                    </div>
                                    <div className="text-center absolute left-1/2 -translate-x-1/2">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Avg Account Stats</p>
                                        <p className="text-5xl font-black">56,1<span className="text-lg text-gray-300 align-top">%</span></p>
                                    </div>
                                    <div className="text-xs font-bold space-y-3 text-right">
                                        <p><span className="text-gray-400 font-medium">Manuals</span> 34% <span className="w-1.5 h-1.5 bg-[#DBF350] rounded-full inline-block ml-1" /></p>
                                        <p><span className="text-gray-400 font-medium">Autosync</span> 12% <span className="w-1.5 h-1.5 bg-gray-200 rounded-full inline-block ml-1" /></p>
                                    </div>
                                </div>
                                {/* Bar chart viz */}
                                <div className="h-24 flex items-end gap-1.5 border-b border-gray-100 pb-2">
                                    {Array.from({ length: 34 }).map((_, i) => (
                                        <div key={i} className={`flex-1 rounded-t-sm transition-all duration-300 hover:scale-y-110 origin-bottom ${i === 15 || i === 16 || i === 17 ? 'bg-[#DBF350] shadow-[0_0_10px_#DBF350]' : i === 28 ? 'bg-black' : 'bg-gray-100'}`} style={{ height: Math.max(10, Math.random() * 90) + '%' }} />
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-2 uppercase font-black tracking-widest">
                                    <span>June 01</span><span>July 01</span>
                                </div>
                            </div>

                            {/* Timely Closures */}
                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden">
                                {/* Decorative grid */}
                                <div className="absolute inset-x-8 bottom-20 top-32 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none -z-0" />

                                <div className="flex justify-between mb-8 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 text-black rounded-lg"><ShieldCheck className="w-4 h-4" /></div>
                                        <span className="font-bold text-base">Timely Closures</span>
                                    </div>
                                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><ArrowUpRight className="w-4 h-4" /></button>
                                </div>
                                <div className="flex justify-between items-end mb-8 relative z-10">
                                    <div className="text-xs font-bold space-y-3">
                                        <p>84 <span className="text-gray-400 font-medium">Done</span></p>
                                        <p>24% <span className="text-gray-400 font-medium">Active</span></p>
                                    </div>
                                    <div className="text-center absolute left-1/2 -translate-x-1/2">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Avg Account Stats</p>
                                        <p className="text-5xl font-black">82,6<span className="text-lg text-gray-300 align-top">%</span></p>
                                    </div>
                                    <div className="text-xs font-bold space-y-3 text-right">
                                        <p>84/0% <span className="text-gray-400 font-medium">OnTime</span></p>
                                        <p>19/5 <span className="text-gray-400 font-medium">Timely</span></p>
                                    </div>
                                </div>
                                {/* Bar chart viz */}
                                <div className="h-24 flex items-end gap-1.5 border-b border-gray-100 pb-2 relative z-10">
                                    {Array.from({ length: 34 }).map((_, i) => (
                                        <div key={i} className={`flex-1 rounded-t-sm transition-all duration-300 ${i > 20 && i < 30 ? 'bg-black' : 'border border-gray-200 bg-transparent'}`} style={{ height: Math.max(15, Math.random() * 80) + '%' }} />
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-2 uppercase font-black tracking-widest relative z-10">
                                    <span>June 01</span><span>July 01</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row - Users */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['Eva Robinson', 'Helena Crims', 'Anna Morris'].map((n) => (
                                <div key={n} className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:border-black/10 hover:shadow-md transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="font-bold text-lg text-gray-300 group-hover:text-[#DBF350] transition-colors"><Grip className="w-5 h-5" /></div>
                                        <div>
                                            <p className="font-bold text-sm text-black">{n}</p>
                                            <p className="text-[11px] text-gray-400 lowercase font-medium mt-0.5">{n.split(' ')[0]}@sync.co</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                        <ArrowUpRight className="w-3 h-3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column (AI Assistant) */}
                    <div className="w-[380px] shrink-0 bg-white rounded-[40px] p-6 shadow-xl shadow-black/5 border border-gray-100 flex flex-col h-auto max-h-[900px]">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
                                <span className="w-2 h-2 rounded-full bg-[#DBF350] shadow-[0_0_10px_#DBF350]" /> AI Assistant
                            </div>
                            <div className="flex gap-2">
                                <IconButton icon={MoreHorizontal} />
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 space-y-8 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                            {/* User Msg */}
                            <div className="flex gap-4 flex-row-reverse">
                                <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" size="sm" className="shadow-md" />
                                <div className="flex flex-col items-end max-w-[80%]">
                                    <p className="text-[10px] font-bold text-gray-400 mb-1 mr-1">Jordan</p>
                                    <div className="bg-black text-white rounded-2xl rounded-tr-sm p-4 text-xs font-medium leading-relaxed shadow-lg">
                                        Hey Daxa, Can you check for discrepancies in revenue vs. projected values?
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <FileText className="w-3 h-3 text-gray-400" />
                                        <p className="text-[10px] font-mono text-gray-500 font-bold">Ref: #6287439</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bot Msg */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[#DBF350] shadow-xl shrink-0 border-2 border-white"><Zap className="w-5 h-5 fill-current" /></div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 mb-1 ml-1">Daxa AI</p>
                                    <div className="bg-gray-50 p-5 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
                                        <div className="text-xs font-bold mb-3 text-gray-800">Here are the main deviations I found:</div>
                                        <div className="space-y-3 mb-5">
                                            {['July - $18.9K', 'August - $21.7K', 'September - $11.9K'].map((l, idx) => (
                                                <div key={l} className="flex items-center gap-3 text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                                    <div className={`w-2 h-2 rounded-full ${idx === 1 ? 'bg-red-500' : 'bg-[#DBF350]'}`} />
                                                    <span className="font-medium">{l.split(' - ')[0]}</span>
                                                    <span className="font-black ml-auto">{l.split(' - ')[1]}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Small bar viz */}
                                        <div className="flex items-center gap-1 h-8 px-2 bg-white rounded-lg border border-gray-100">
                                            <div className="w-8 h-4/5 bg-[#DBF350] rounded-sm" />
                                            <div className="flex-1 h-4/5 bg-gray-100 rounded-sm relative overflow-hidden">
                                                <div className="absolute top-0 left-0 h-full w-1/2 bg-gray-200" />
                                            </div>
                                            <div className="w-px h-full border-l border-dashed border-red-300 mx-1" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-300 mt-2 font-bold ml-1">Just now</p>
                                </div>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="bg-white pt-4 border-t border-gray-100">
                            <div className="flex gap-2 mb-4">
                                {['Files', 'Images', 'Audio'].map(b => (
                                    <button key={b} className="px-3 py-1.5 bg-gray-50 rounded-lg text-[10px] font-bold border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-all flex items-center gap-1.5 hover:shadow-sm">
                                        {b === 'Files' && <FileText className="w-3 h-3" />}
                                        {b === 'Images' && <Image className="w-3 h-3" />}
                                        {b === 'Audio' && <Mic className="w-3 h-3" />}
                                        {b}
                                    </button>
                                ))}
                            </div>
                            <div className="bg-gray-50 p-2 rounded-[20px] flex items-center gap-2 border border-gray-200 focus-within:border-black/30 focus-within:shadow-md transition-all">
                                <input className="bg-transparent flex-1 text-xs px-3 py-2 outline-none font-bold text-gray-800 placeholder:text-gray-400" placeholder="Ask AI Assistant..." />
                                <button className="w-9 h-9 rounded-xl hover:bg-white flex items-center justify-center transition-colors"><Plus className="w-4 h-4 text-gray-500" /></button>
                                <button className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-[#DBF350] hover:scale-105 transition-transform"><Send className="w-4 h-4 fill-current ml-0.5" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── 6. CALL AI (Glassmorphism Contact) ───────────────────────────────────────
// Style: Frosted glass, soft gradients (lime/yellow), sentiment analysis
// Ref: Image 1
const CallAIVariant = ({ activeSection }: { activeSection: string }) => {
    return (
        <div className="w-full h-full font-sans text-gray-800 bg-[#E0E0E0] p-6 overflow-hidden flex relative">
            {/* Background Blur Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-100/30 rounded-full blur-[120px] pointer-events-none" />

            {/* Sidebar (Glass) */}
            <div className="w-20 bg-white/40 backdrop-blur-xl rounded-[32px] flex flex-col items-center py-8 gap-8 border border-white/50 shadow-lg z-20 shrink-0 mr-6">
                <div className="w-10 h-10 bg-[#bef264] rounded-xl flex items-center justify-center text-black font-bold shadow-lg shadow-lime-400/40">C</div>
                <div className="flex flex-col gap-6 w-full px-2">
                    {[LayoutGrid, MessageSquare, User, Activity, Box].map((I, i) => (
                        <div key={i} className={`h-12 w-12 mx-auto rounded-2xl flex items-center justify-center cursor-pointer transition-all ${i === 1 ? 'bg-white shadow-md text-black scale-105' : 'text-gray-500 hover:bg-white/50 hover:text-black'}`}>
                            <I className="w-5 h-5" />
                        </div>
                    ))}
                </div>
                <div className="mt-auto">
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica" className="w-10 h-10 border-2 border-white shadow-md" />
                </div>
            </div>

            {/* Main Board */}
            <div className="flex-1 flex flex-col min-w-0 z-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 shadow-sm">
                        {['Number', 'Call History', 'Dialer', 'Contacts', 'Internal Contacts'].map((t, i) => (
                            <button key={t} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${i === 1 ? 'bg-black/40 text-white shadow-lg' : 'text-gray-600 hover:bg-white/50'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    <button className="bg-[#EAFF8C] hover:bg-[#D4FF3F] text-black px-6 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-lime-400/30 transition-colors flex items-center gap-2">
                        New Chat <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-12 grid-rows-2 gap-6 h-full pb-4">
                    {/* Hero Card (Recording) */}
                    <div className="col-span-4 row-span-2 bg-gradient-to-br from-[#E3F8A6] via-[#B8E2F3] to-[#C9CBCA] rounded-[40px] p-8 shadow-xl relative overflow-hidden text-[#333] border border-white/40 flex flex-col mx-0">
                         {/* Frosted Overlay */}
                         <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                         
                         <div className="relative z-10 flex justify-between items-start mb-8">
                            <span className="font-bold text-lg">Recording a call</span>
                            <span className="bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono border border-white/40 shadow-sm">No. 4158571521 <Copy className="w-3 h-3 inline ml-1 opacity-50"/></span>
                         </div>

                         {/* Profile */}
                         <div className="relative z-10 flex flex-col items-center flex-1 justify-center">
                            <div className="w-48 h-48 relative mb-6 group">
                                <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Tom" size="xl" className="w-full h-full border-4 border-white/50 shadow-2xl relative z-10" />
                                <div className="absolute top-[-10px] left-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] border border-white/30 rounded-full animate-pulse z-0" />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">Tom Huts's activity</h2>
                            <p className="text-xs text-center text-gray-500 font-medium">Recorded on May 27, 2024, 2:05 PM</p>
                         </div>

                         {/* Audio Waveform */}
                         <div className="relative z-10 bg-white/20 backdrop-blur-xl rounded-[24px] p-4 mt-8 border border-white/30 shadow-inner">
                            <div className="flex gap-1 items-center h-12 mb-4 px-2 opacity-60">
                                {Array.from({length:40}).map((_,i) => (
                                    <div key={i} className="flex-1 bg-black rounded-full transition-all hover:bg-white hover:scale-y-125" style={{height: Math.max(10, Math.random()*100)+'%'}} />
                                ))}
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 px-2 mb-4">
                                <span>00:00 m</span><span>04:00 m</span><span>08:00 m</span><span>12:00 m</span><span>16:00 m</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-2">
                                    <button className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-md transition-all"><ArrowLeftRight className="w-4 h-4 rotate-180" /></button>
                                    <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform"><span className="border-l-2 border-r-2 border-black h-3 w-2 block" /></button>
                                    <button className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-md transition-all"><ArrowLeftRight className="w-4 h-4" /></button>
                                </div>
                                <div className="flex-1 h-1 bg-black/10 rounded-full relative ml-4">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-1 bg-black rounded-full" />
                                    <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full shadow-lg cursor-pointer hover:scale-125 transition-transform" />
                                </div>
                            </div>
                         </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="col-span-8 row-span-2 flex flex-col gap-6">
                        {/* Top row */}
                        <div className="grid grid-cols-3 gap-6 h-40">
                             {[
                                 {l:'Total Calls', v:'2.270', c:'Calls: +12%', g:'bg-lime-400'},
                                 {l:'AVG. Duration', v:'1:09', s:'min.', c:'Duration: -8%', g:'bg-gray-300'},
                                 {l:'AVG. Waiting', v:'00:07', s:'s.', c:'Waiting: +12%', g:'bg-lime-400'}
                             ].map((stat, i) => (
                                 <div key={stat.l} className="bg-white/60 backdrop-blur-md rounded-[32px] p-6 shadow-sm border border-white/60 flex flex-col justify-between hover:shadow-lg transition-shadow">
                                     <div className="flex justify-between">
                                         <p className="font-bold text-gray-500 text-sm">{stat.l}</p>
                                         <ArrowUpRight className="w-4 h-4 text-gray-400" />
                                     </div>
                                     <div>
                                         <p className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-2">
                                             <span className={`w-2 h-2 rounded-full ${stat.g}`} /> {stat.c}
                                         </p>
                                         <p className="text-4xl font-black tracking-tight text-gray-800">{stat.v}<span className="text-xl text-gray-400 ml-1">{stat.s}</span></p>
                                     </div>
                                 </div>
                             ))}
                        </div>

                        {/* Mid Row */}
                        <div className="grid grid-cols-3 gap-6 h-64">
                             <div className="col-span-2 bg-white/60 backdrop-blur-md rounded-[32px] p-8 shadow-sm border border-white/60">
                                 <div className="flex justify-between mb-8">
                                     <span className="font-bold text-gray-800">Talk / Listen Ratio</span>
                                     <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
                                 </div>
                                 <div className="relative pt-10">
                                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 px-1">
                                        <span>75%</span><span>25%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full flex items-center relative">
                                        <div className="absolute left-[70%] top-1/2 -translate-y-1/2 w-4 h-[40px] bg-gradient-to-b from-[#EAFF8C] to-[#C8E850] rounded-lg shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center">
                                            <div className="w-1 h-4 bg-white/50 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-4">
                                        <span>Talk: +10%</span><span>Listen: -4%</span>
                                    </div>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center">
                                        <div className="text-4xl font-black text-gray-800">124</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Calls</div>
                                    </div>
                                 </div>
                             </div>

                             <div className="col-span-1 bg-white/60 backdrop-blur-md rounded-[32px] p-6 shadow-sm border border-white/60 relative overflow-hidden flex flex-col items-center justify-center text-center">
                                 <div className="absolute top-4 right-4"><ArrowUpRight className="w-4 h-4 text-gray-400" /></div>
                                 <div className="relative w-40 h-24 mb-4">
                                     <div className="w-40 h-40 rounded-full border-[12px] border-gray-200 border-b-0 absolute top-0 left-0" />
                                     <div className="w-40 h-40 rounded-full border-[12px] border-[#EAFF8C] border-b-0 border-l-0 border-r-transparent absolute top-0 left-0 rotate-45" />
                                 </div>
                                 <div className="mt-[-40px]">
                                     <p className="text-[10px] text-gray-400 font-bold mb-1">Duration: +12%</p>
                                     <p className="text-3xl font-black text-gray-800">12:11</p>
                                 </div>
                             </div>
                        </div>

                        {/* Bottom Row (Sentiment) */}
                        <div className="flex-1 bg-white/60 backdrop-blur-md rounded-[32px] p-8 shadow-sm border border-white/60 flex flex-col justify-end relative">
                             <div className="absolute top-8 left-8 font-bold text-gray-800">Sentiment</div>
                             <div className="absolute top-8 right-8"><Filter className="w-4 h-4 text-gray-400" /></div>
                             
                             <div className="flex items-end gap-1 h-32 w-full mt-auto">
                                 {[20, 25, 40, 35, 75, 60, 45, 15, 20].map((h, i) => (
                                     <div key={i} className={`flex-1 rounded-t-lg transition-all hover:opacity-80 ${h > 60 ? 'bg-gray-200' : 'bg-gradient-to-t from-[#F1FABE] to-[#EAFF8C]'}`} style={{height: h + '%'}}>
                                        {i === 4 && (
                                            <div className="relative -top-12 text-center w-full">
                                                <div className="text-[10px] font-bold text-gray-400">Negative: 10%</div>
                                                <div className="text-3xl font-black text-gray-800">{h}%</div>
                                            </div>
                                        )}
                                        {i === 1 && (
                                            <div className="relative -top-12 text-center w-full">
                                                <div className="text-[10px] font-bold text-gray-400 leading-tight">Positive</div>
                                                <div className="text-xl font-black text-gray-800">20%</div>
                                            </div>
                                        )}
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── 7. NODUS (Clean Audit Log) ──────────────────────────────────────────────
// Style: Stark white, crisp typography, purple accent waves
// Ref: Image 2
const NodusVariant = ({ activeSection }: { activeSection: string }) => {
    return (
        <div className="w-full h-full font-sans bg-[#F9FAFB] text-[#111] flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shadow-sm shrink-0 z-20">
                <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
                    <div className="grid grid-cols-2 gap-0.5">
                        <div className="w-2 h-2 bg-black rounded-tl-sm"/>
                        <div className="w-2 h-2 bg-black/50 rounded-tr-sm"/>
                        <div className="w-2 h-2 bg-black/50 rounded-bl-sm"/>
                        <div className="w-2 h-2 bg-black rounded-br-sm"/>
                    </div>
                    Nodus
                </div>
                <div className="flex items-center gap-8 text-sm font-bold text-gray-500">
                    {['Summary', 'Auditlog', 'Requests', 'Inventory', 'Reports', 'Docs', 'Support'].map((t,i) => (
                        <button key={t} className={`transition-colors hover:text-black ${i === 1 ? 'bg-black text-white px-4 py-2 rounded-full shadow-lg' : ''}`}>{t}</button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                     <div className="bg-gray-100 px-4 py-2 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-2 border border-gray-200">
                         <Lock className="w-3 h-3" /> Endpoint Privilege Management <ChevronDown className="w-3 h-3 ml-2"/>
                     </div>
                     <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" className="w-8 h-8" />
                     <div className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer"><Settings className="w-4 h-4" /></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
                <div className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-light mb-2">Auditlog Overview</h1>
                        <p className="text-gray-400 text-sm font-medium">This page shows recent administrator activity</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] text-gray-400 w-40 text-right mb-2 leading-tight">You can also view these data using the mobile app.</p>
                        <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ArrowUpRight className="w-3 h-3" /></button>
                    </div>
                </div>

                {/* Big Stats + Chart */}
                <div className="bg-white rounded-[24px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100 mb-8 relative overflow-hidden">
                    <div className="flex gap-16 mb-12 relative z-10 px-4">
                        {[
                            {l: 'Authorized', v: '1,395', b: '+33%', c: 'bg-lime-400'},
                            {l: 'Protected', v: '1,258', b: '+15%', c: 'bg-lime-400'},
                            {l: 'Alerts', v: '62', b: '-22%', c: 'bg-purple-500 text-white'},
                        ].map((s) => (
                            <div key={s.l}>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{s.l}</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-medium tracking-tight">{s.v}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.c}`}>{s.b}</span>
                                </div>
                            </div>
                        ))}
                        <div className="ml-auto flex flex-col items-center">
                            <span className="text-6xl font-light tracking-tighter">1,395</span>
                            <span className="text-xs text-gray-400 font-bold mt-1">April 2025</span>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-64 relative w-full">
                        {/* Fake SVG Chart */}
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                             {/* Gradient Fill */}
                             <defs>
                                <linearGradient id="purpleGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#A855F7" stopOpacity="0.1"/>
                                    <stop offset="100%" stopColor="#A855F7" stopOpacity="0"/>
                                </linearGradient>
                             </defs>
                             {/* Line */}
                             <path d="M0,150 C100,200 200,50 300,100 C400,150 500,180 600,120 C700,60 800,100 900,80 C1000,60 1100,140 1200,140 L1200,250 L0,250 Z" fill="url(#purpleGradient)" />
                             <path d="M0,150 C100,200 200,50 300,100 C400,150 500,180 600,120 C700,60 800,100 900,80 C1000,60 1100,140 1200,140" fill="none" stroke="#A855F7" strokeWidth="2" />
                             
                             {/* Points */}
                             <circle cx="300" cy="100" r="4" fill="#111" stroke="white" strokeWidth="2" />
                             <circle cx="600" cy="120" r="16" fill="#111" />
                             <path d="M600,115 L600,125 M595,120 L605,120" stroke="white" strokeWidth="2" /> {/* Plus sign */}
                             
                             {/* Tooltip */}
                             <g transform="translate(900, 80)">
                                 <circle cx="0" cy="0" r="4" fill="#A855F7" stroke="white" strokeWidth="2" />
                                 <rect x="-60" y="-70" width="120" height="50" rx="12" fill="white" filter="drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))" />
                                 <text x="0" y="-45" textAnchor="middle" fontSize="14" fontWeight="bold">1,395</text>
                                 <text x="0" y="-28" textAnchor="middle" fontSize="10" fill="gray">Increased this month</text>
                             </g>
                        </svg>

                        {/* Histogram Bars Overlay (Subtle) */}
                        <div className="absolute inset-0 flex items-end justify-between px-8 pb-0 opacity-20 pointer-events-none">
                            {Array.from({length:60}).map((_, i) => (
                                <div key={i} className="w-1 bg-gray-400 rounded-t-full" style={{height: Math.random()*80 + '%'}} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters & Table */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-1 bg-white rounded-full px-6 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input className="w-full outline-none text-sm font-medium" placeholder="Search by computer name, user name, account..." />
                    </div>
                    <div className="flex gap-2">
                        {['Filters', 'Export CSV', 'Page size 15'].map(b => (
                            <button key={b} className="px-5 py-3 bg-white rounded-full text-xs font-bold border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors text-gray-600 flex items-center gap-2">
                                {b} <ChevronDown className="w-3 h-3 opacity-50"/>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-gray-400 uppercase font-bold tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-4 w-32">Status</th>
                                <th className="px-4 py-4">Application</th>
                                <th className="px-4 py-4">User</th>
                                <th className="px-4 py-4">Computer</th>
                                <th className="px-4 py-4">Time</th>
                                <th className="px-4 py-4 text-right">Duration</th>
                                <th className="px-4 py-4 text-center">Activity</th>
                                <th className="px-8 py-4 text-right">OS</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-gray-700">
                            {[1,2,3,4,5].map((i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-lime-400 flex items-center justify-center text-white"><Check className="w-2 h-2" /></div>
                                            <span className="font-medium">Finished</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 font-mono text-gray-500">Windows Command Processor</td>
                                    <td className="px-4 py-5 text-gray-800">Greg B / Admin</td>
                                    <td className="px-4 py-5 font-mono uppercase text-gray-500">WINDEV2407EVAL</td>
                                    <td className="px-4 py-5 text-gray-500">03-12-2024 13:18:20</td>
                                    <td className="px-4 py-5 text-right font-mono">12:54:55</td>
                                    <td className="px-4 py-5">
                                        <div className="flex justify-center -space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px]">0</div>
                                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px]">2</div>
                                            <div className="w-6 h-6 rounded-full bg-black text-white border-2 border-white flex items-center justify-center text-[9px]">18</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right"><Monitor className="w-4 h-4 ml-auto text-gray-400" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── 8. SANTORINI (Travel Planner) ───────────────────────────────────────────
// Style: Large hero image, floating translucent cards, map integration
// Ref: Image 3
const SantoriniVariant = ({ activeSection }: { activeSection: string }) => {
    return (
        <div className="w-full h-full font-sans bg-[#F4F4F5] p-6 overflow-hidden flex flex-col">
            {/* Nav */}
            <div className="flex items-center gap-6 mb-6 px-2">
                <div className="w-10 h-10 bg-[#EAFF8C] rounded-full flex items-center justify-center font-black text-xl shadow-md">•</div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm text-sm font-bold w-64">
                    Travel planning <X className="w-3 h-3 ml-auto text-gray-400 cursor-pointer hover:text-red-500" />
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm font-bold hover:bg-white px-4 py-2 rounded-xl cursor-pointer transition-colors">
                    <Plus className="w-4 h-4" /> New chat
                </div>
                <div className="ml-auto flex gap-3">
                    <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ArrowUpRight className="w-4 h-4 text-gray-500" /></button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Slim Toolbar */}
                <div className="w-12 bg-white rounded-full py-4 flex flex-col items-center gap-6 shadow-sm h-fit">
                    {[LayoutGrid, MessageSquare, User, Settings, Database].map((I,i) => (
                        <div key={i} className={`p-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors ${i===1?'text-black':'text-gray-400'}`}>
                            <I className="w-5 h-5" />
                        </div>
                    ))}
                     <div className="mt-8 pt-4 border-t w-full flex flex-col items-center gap-4 border-gray-100 pb-2">
                        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Annie" size="sm" />
                     </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 no-scrollbar relative min-h-0">
                    {/* Hero Section */}
                    <div className="w-full h-[500px] rounded-[40px] relative overflow-hidden shadow-xl mb-6 group">
                        <img src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2938&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Santorini" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                        
                        {/* Hero Overlay UI */}
                        <div className="absolute top-8 left-8 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold text-sm flex items-center gap-2 hover:bg-white/30 cursor-pointer transition-colors border border-white/20">
                            <MapPin className="w-4 h-4" /> Greece
                        </div>

                        <div className="absolute top-8 right-8 flex gap-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                    <img src={`https://source.unsplash.com/random/100x100?greece&sig=${i}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="w-12 h-12 bg-[#2D3F43] rounded-lg flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg backdrop-blur-md">+5</div>
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center pointer-events-none">
                            <h1 className="text-7xl font-light mb-4 tracking-tight drop-shadow-md">Santorini</h1>
                            <p className="max-w-md text-sm text-white/80 font-medium leading-relaxed drop-shadow-sm">Santorini is a beautiful city located in the Aegean Sea, in Greece. It is known for its stunning views of the sea, white-washed buildings, and blue-domed churches.</p>
                        </div>
                        
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 rounded-2xl flex gap-1 pointer-events-auto">
                            {['Overview', 'Hotels', 'Itinerary', 'Flights'].map((t, i) => (
                                <button key={t} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${i === 0 ? 'bg-white/90 text-black shadow-lg' : 'text-white hover:bg-white/20'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>

                         {/* Floating Assistant Card */}
                         <div className="absolute bottom-8 left-8 w-[380px] bg-[#EEF5A6]/90 backdrop-blur-xl p-8 rounded-[32px] shadow-2xl border border-white/40 text-[#2D3F43] group-hover:translate-y-[-10px] transition-transform duration-500 pointer-events-auto cursor-default">
                             <div className="flex justify-between items-start mb-8">
                                 <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                                     <div className="bg-black text-[#EEF5A6] p-1 rounded-full"><Zap className="w-3 h-3 fill-current" /></div>
                                     Assistant
                                 </div>
                                 <ArrowUpRight className="w-4 h-4 cursor-pointer hover:rotate-45 transition-transform" />
                             </div>
                             <p className="text-2xl font-medium leading-snug mb-8">Ready to dive into some <br/> <span className="font-bold underline decoration-2 decoration-black/20">hotel options</span> or maybe <span className="font-bold underline decoration-2 decoration-black/20">an itinerary?</span></p>
                             <div className="flex gap-2 mb-8">
                                 {['Sea views', 'A pool', 'All'].map(t => (
                                     <span key={t} className="bg-[#DFE88C] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-black/10 transition-colors uppercase tracking-wide">{t}</span>
                                 ))}
                             </div>
                             <div className="flex justify-between items-center">
                                 <div className="p-3 hover:bg-black/5 rounded-xl transition-colors cursor-pointer"><LayoutGrid className="w-5 h-5 opacity-50" /></div>
                                 <div className="w-14 h-14 bg-black rounded-[20px] flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform"><Mic className="w-6 h-6" /></div>
                                 <div className="p-3 hover:bg-black/5 rounded-xl transition-colors cursor-pointer"><MessageSquare className="w-5 h-5 opacity-50" /></div>
                             </div>
                         </div>
                    </div>

                    {/* Widgets Row */}
                    <div className="flex gap-6 h-64">
                         {/* Weather */}
                         <div className="flex-1 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                             <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white"><Sun className="w-4 h-4" /></div>
                             <div className="mt-4 text-center">
                                 <span className="text-6xl font-black text-gray-800">28<span className="text-2xl align-top text-gray-400">°C</span></span>
                                 <p className="text-sm font-bold text-gray-400 mt-2">For your dates</p>
                             </div>
                         </div>

                         {/* Costs */}
                         <div className="flex-1 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
                             <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white"><DollarSign className="w-4 h-4" /></div>
                             <div className="text-center">
                                 <p className="text-2xl font-bold mb-4">$ 1,581 - $ 3,162</p>
                                 <div className="flex gap-1 h-8 items-end justify-center px-4 opacity-80">
                                     {Array.from({length:20}).map((_,i) => <div key={i} className="w-1.5 bg-[#009E83] rounded-full" style={{height: Math.random()*100+'%'}} />)}
                                 </div>
                                 <p className="text-xs font-bold text-gray-400 mt-3">One week trip</p>
                             </div>
                         </div>
                         
                         {/* Map Preview */}
                         <div className="flex-[1.5] bg-gray-100 rounded-[32px] relative overflow-hidden group shadow-inner border border-white">
                             <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/25.431,36.393,12,0/800x600?access_token=pk.eyJ1IjoiZ2hvc3QiLCJhIjoiY2w4Z2hvc3QifQ.gh0st')] bg-cover bg-center opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
                             <div className="absolute top-6 right-6 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer hover:bg-black hover:text-white transition-colors"><ArrowUpRight className="w-4 h-4" /></div>
                             <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-white via-white/80 to-transparent">
                                 <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-4">
                                     <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0 overflow-hidden"><img src="https://source.unsplash.com/random/100x100?ruins" className="w-full h-full object-cover" /></div>
                                     <div>
                                         <p className="font-bold text-sm">Ancient Thera</p>
                                         <p className="text-xs text-green-500 font-bold">●●●●● <span className="text-gray-400">4.8</span></p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── 9. JOBFLOW (Scheduler) ──────────────────────────────────────────────────
// Style: Clean, soft 3D blob, timeline header, card-based grid
// Ref: Image 4
const JobFlowVariant = ({ activeSection }: { activeSection: string }) => {
    return (
        <div className="w-full h-full font-sans bg-[#F8F9FE] p-8 flex flex-col relative overflow-hidden">
            {/* Soft 3D Blob Decoration */}
            <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute top-40 right-60 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

            {/* Header / Timeline */}
            <div className="flex justify-between items-center mb-12 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-black rounded-[18px] flex items-center justify-center text-white"><Cloud className="w-6 h-6" /></div>
                    <div className="w-px h-8 bg-gray-200" />
                    <Search className="w-5 h-5 text-gray-400" />
                </div>

                <div className="bg-white p-1.5 pr-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-4 max-w-2xl w-full mx-auto backdrop-blur-md bg-opacity-80">
                     <span className="text-xs font-bold pl-4 text-gray-500">Your Schedule</span>
                     <div className="flex-1 h-12 bg-gradient-to-r from-blue-50 via-green-50 to-yellow-50 rounded-full relative flex items-center px-2 overflow-hidden">
                         <div className="flex items-center gap-2 absolute left-4">
                             <Avatar size="sm" src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" />
                             <span className="text-[9px] font-bold text-gray-400 hidden lg:inline">36 min</span>
                         </div>
                         <div className="absolute left-[40%] h-full w-px bg-black/5 border-l border-dashed border-gray-400" />
                         <div className="absolute left-[40%] -top-3 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-b-md font-bold shadow-sm">09:15 AM</div>
                         
                         <div className="flex items-center gap-2 absolute right-4">
                             <span className="text-[9px] font-bold text-gray-400 hidden lg:inline">10:00 AM</span>
                             <div className="flex -space-x-2">
                                <Avatar size="sm" src="https://api.dicebear.com/7.x/avataaars/svg?seed=2" />
                                <Avatar size="sm" src="https://api.dicebear.com/7.x/avataaars/svg?seed=3" />
                             </div>
                         </div>
                     </div>
                     <button className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50"><ArrowUpRight className="w-4 h-4 text-gray-400" /></button>
                </div>

                <div className="flex gap-4">
                    <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50"><Settings className="w-4 h-4 text-gray-500" /></button>
                </div>
            </div>

            {/* Welcome Area */}
            <div className="flex justify-between items-end mb-12 relative z-10 px-4">
                <div>
                    <h1 className="text-5xl font-medium tracking-tight text-gray-900 mb-2">Welcome Marty, here's how <br/>things stand today!</h1>
                    <p className="text-gray-400 font-bold text-sm">Today is 22 April 2025</p>
                </div>
                
                {/* 3D Graphic Placeholder */}
                <div className="relative w-64 h-32 hidden xl:block">
                     <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl transform rotate-12 shadow-2xl opacity-90 backdrop-blur-sm z-10 border border-white/20" />
                     <div className="absolute right-12 bottom-4 w-24 h-24 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-2xl transform -rotate-12 shadow-lg opacity-80" />
                     
                     <div className="absolute bottom-4 -left-20 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white flex items-center gap-3 w-64 z-20">
                         <div className="relative">
                             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Check className="w-5 h-5" /></div>
                             <div className="absolute -top-6 left-1/2 w-px h-6 bg-black border-l border-dashed border-gray-400" />
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-bold">25%</div>
                         </div>
                         <div>
                             <p className="font-bold text-sm">UX/UI Designer</p>
                             <p className="text-[10px] text-gray-500 font-bold">General Info</p>
                         </div>
                     </div>
                </div>
            </div>

            <div className="flex gap-4 mb-8 px-4">
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all">View today's tasks</button>
                <button className="px-6 py-2.5 bg-white text-gray-500 rounded-full text-sm font-bold shadow-sm hover:text-black hover:bg-gray-50 transition-colors">Schedule</button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-3 gap-8 flex-1 min-h-0 relative z-10">
                {/* 1. Interviews */}
                <div className="bg-white rounded-[40px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col hover:translate-y-[-4px] transition-transform duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-lg">Interviews (12)</h3>
                        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-xs font-bold text-gray-500">All</button>
                    </div>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {[
                            {n: 'Ted Company', t: '09:00 AM', c: 'bg-blue-600'},
                            {n: 'Modira Ink', t: '10:00 AM', c: 'bg-blue-600'},
                            {n: 'Nike Company', t: '10:30 AM', c: 'bg-indigo-600'},
                            {n: 'Linear B', t: '11:30 AM', c: 'bg-purple-600'},
                        ].map((j, i) => (
                            <div key={i} className="flex items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                                <div className="w-10 h-10 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                    <Video className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900">Google Meet Call</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${j.n}`} /></div>
                                        <p className="text-[10px] text-gray-500 font-bold">{j.n}</p>
                                    </div>
                                </div>
                                <div className={`ml-auto ${j.c} text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-md`}>{j.t}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Job Apps */}
                <div className="bg-white rounded-[40px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col hover:translate-y-[-4px] transition-transform duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-lg">Job Applications</h3>
                        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-xs font-bold text-gray-500">All</button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-[32px] p-6 mb-8 flex items-center justify-between group cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 group-hover:text-blue-600 transition-colors"><Briefcase className="w-5 h-5"/></div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900">33</h1>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Applications Sent</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center bg-white group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><ArrowUpRight className="w-4 h-4" /></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center mb-8">
                        {[
                            {l:'Applications', v:'18'},
                            {l:'In Review', v:'12'},
                            {l:'Interviews', v:'3'},
                        ].map(s => (
                            <div key={s.l}>
                                <p className="text-2xl font-bold text-gray-800">{s.v}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">{s.l}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto h-12 bg-gray-100 rounded-xl overflow-hidden flex items-end px-1 gap-1">
                        {Array.from({length:30}).map((_,i) => (
                            <div key={i} className="flex-1 bg-gray-300 rounded-t-sm" style={{height: Math.random()*100+'%', opacity: 0.3}} />
                        ))}
                        <div className="absolute bottom-8 left-8 w-[40%] h-12 bg-gradient-to-t from-blue-100 to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* 3. Payments */}
                <div className="bg-white rounded-[40px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col hover:translate-y-[-4px] transition-transform duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-lg">Payments</h3>
                        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-xs font-bold text-gray-500">All</button>
                    </div>

                     <div className="bg-gray-50 rounded-[32px] p-6 mb-8 flex items-center justify-between group cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 group-hover:text-green-600 transition-colors"><Wallet className="w-5 h-5"/></div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900">2.1k</h1>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Current Earnings, $</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center bg-white group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm"><ArrowUpRight className="w-4 h-4" /></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center mt-auto">
                        {[
                            {l:'Last Payment', v:'$2.1k'},
                            {l:'Available', v:'$900'},
                            {l:'Waiting', v:'$300'},
                        ].map(s => (
                            <div key={s.l}>
                                <p className="text-xl font-bold text-gray-800">{s.v}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">{s.l}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── 10. EMISSION (Sankey Flow) ──────────────────────────────────────────────
// Style: Wide flow diagram, complex data viz representation, light neutral
// Ref: Image 5
const EmissionVariant = ({ activeSection }: { activeSection: string }) => {
    return (
        <div className="w-full h-full font-sans bg-[#F0F0F0] overflow-hidden flex flex-col items-center p-8">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button className="w-8 h-8 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"><ArrowLeftRight className="w-4 h-4" /></button>
                    <h1 className="text-2xl font-normal text-gray-800 tracking-tight">CO2 Emission Distribution</h1>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex bg-gray-200 p-1 rounded-lg">
                         <button className="px-4 py-1.5 bg-black text-white text-xs font-bold rounded-md shadow-sm">Calculation Overview</button>
                         <button className="px-4 py-1.5 text-gray-600 text-xs font-bold hover:bg-white/50 rounded-md transition-colors">Calculation Quality</button>
                     </div>
                     <div className="flex gap-2">
                         {[Heart, Download, Share2, Settings].map((I, i) => ( // Using Heart as shim for "Like"
                             <button key={i} className="w-8 h-8 border border-gray-200 hover:bg-white rounded-md flex items-center justify-center text-gray-500 transition-colors"><I className="w-4 h-4" /></button>
                         ))}
                     </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="w-full flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                {['File', 'Export', 'Share', 'Chat', 'Get Insights', 'Subscribe', 'Edit'].map(t => (
                    <button key={t} className="px-4 py-2 bg-transparent hover:bg-white rounded-lg text-xs font-bold text-gray-600 flex items-center gap-2 border border-transparent hover:border-gray-200 transition-all">
                        {t === 'File' && <FileText className="w-3 h-3" />}
                        {t}
                    </button>
                ))}
            </div>

            {/* Main Diagram Area */}
            <div className="flex-1 w-full bg-[#EAEAEA] rounded-[4px] relative overflow-hidden p-8 flex gap-20 items-center justify-center shadow-inner">
                
                {/* Columns */}
                <div className="flex flex-col gap-12 text-xs font-bold text-gray-500 w-40 z-10">
                     <div className="flex items-center gap-2 mb-4"><Lock className="w-3 h-3" /> Transport Mode</div>
                     
                     <div className="relative group">
                         <div className="flex justify-between items-center p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-black/10 transition-all cursor-pointer">
                             <span>Air</span> <span className="font-mono text-gray-400">47.56</span>
                         </div>
                         {/* Flow Line */}
                         <svg className="absolute top-1/2 left-full w-20 h-24 pointer-events-none z-0 overflow-visible">
                             <path d="M0,0 C40,0 40,80 80,80" fill="none" stroke="#D1D5DB" strokeWidth="24" className="group-hover:stroke-gray-400 transition-colors opacity-40" />
                         </svg>
                     </div>

                     <div className="relative group">
                         <div className="flex justify-between items-center p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-black/10 transition-all cursor-pointer">
                             <span>Truck</span> <span className="font-mono text-gray-400">22.95</span>
                         </div>
                     </div>

                     <div className="relative group">
                         <div className="flex justify-between items-center p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-black/10 transition-all cursor-pointer">
                             <span>Seaship</span> <span className="font-mono text-gray-400">1.46</span>
                         </div>
                     </div>
                </div>

                {/* Middle Column */}
                <div className="flex flex-col gap-16 text-xs font-bold text-gray-500 w-40 mt-12 z-10">
                    <div className="flex items-center gap-2 mb-4"><Lock className="w-3 h-3" /> Category</div>
                    
                    <div className="relative group">
                        <div className="flex justify-between items-center p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-black/10 transition-all cursor-pointer">
                            <span>Dairy</span> <span className="font-mono text-gray-400">8.39</span>
                        </div>
                         {/* Flow Line */}
                         <svg className="absolute top-1/2 left-full w-20 h-10 pointer-events-none z-0 overflow-visible">
                             <path d="M0,0 C40,0 40,-20 80,-20" fill="none" stroke="#D1D5DB" strokeWidth="18" className="group-hover:stroke-gray-400 transition-colors opacity-40" />
                         </svg>
                    </div>

                    <div className="relative group">
                        <div className="flex justify-between items-center p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-black/10 transition-all cursor-pointer">
                            <span>Water</span> <span className="font-mono text-gray-400">7.72</span>
                        </div>
                    </div>

                    <div className="relative group">
                         <div className="flex justify-between items-center p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-black/10 transition-all cursor-pointer">
                            <span>Cosmetics</span> <span className="font-mono text-gray-400">7.62</span>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-16 text-xs font-bold text-gray-500 w-40 mt-6 z-10">
                    <div className="flex items-center gap-2 mb-4"><Lock className="w-3 h-3" /> Lane</div>
                     <div className="flex justify-between items-center p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-black/10 transition-all cursor-pointer">
                         <span>Germany-Italy</span> <span className="font-mono text-gray-400">1.21</span>
                     </div>
                     <div className="flex justify-between items-center p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-black/10 transition-all cursor-pointer">
                         <span>Switz-Italy</span> <span className="font-mono text-gray-400">0.70</span>
                     </div>
                     <div className="flex justify-between items-center p-2 bg-white/50 hover:bg-white rounded border border-transparent hover:border-black/10 transition-all cursor-pointer">
                         <span>Scotland-Fra</span> <span className="font-mono text-gray-400">0.66</span>
                     </div>
                </div>

                {/* Floating "Insight" Card Overlay */}
                <div className="absolute top-[35%] left-[25%] bg-gradient-to-br from-[#E25538] to-[#913054] text-white p-6 rounded-[24px] w-64 shadow-2xl z-30 transform hover:scale-105 transition-transform cursor-pointer">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-80 mb-4">
                        <TrendingUp className="w-3 h-3" /> Insights
                    </div>
                    <div className="text-[10px] opacity-80 font-bold mb-1">Potential growth</div>
                    <div className="text-4xl font-bold mb-4">+32%</div>
                    <p className="font-bold text-sm mb-2">Review strategy</p>
                    <p className="text-[10px] leading-relaxed opacity-80 mb-6">Updating your strategy might improve your CO2 emission distribution.</p>
                    <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-white/20 rounded-lg text-xs font-bold hover:bg-white/30 transition-colors">Later</button>
                        <button className="flex-1 py-2 bg-white text-[#913054] rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-lg">Review</button>
                    </div>
                </div>

                {/* Right Sidebar Overlay */}
                <div className="absolute top-4 right-4 bottom-4 w-64 bg-white/60 backdrop-blur-xl rounded-[24px] p-6 shadow-xl border border-white flex flex-col z-40">
                    <div className="flex justify-between items-center mb-6">
                        <span className="font-bold text-sm text-gray-800">Filters</span>
                        <X className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                    
                    <div className="space-y-6 overflow-y-auto pr-2">
                        {['Region from', 'Region to', 'Category'].map(cat => (
                            <div key={cat}>
                                <div className="flex items-center gap-2 font-bold text-xs text-black mb-3 cursor-pointer">
                                    <ChevronDown className="w-3 h-3" /> {cat}
                                </div>
                                <div className="space-y-2 pl-2">
                                    {['Eastern Europe', 'Northern Europe', 'Southern Europe', 'Western Europe'].slice(0, cat === 'Category' ? 2 : 4).map(sub => (
                                        <div key={sub} className="flex items-center gap-2 group cursor-pointer">
                                            <div className="w-3 h-3 border border-gray-300 rounded-sm group-hover:border-black transition-colors" />
                                            <span className="text-[10px] font-bold text-gray-500 group-hover:text-black transition-colors">{cat === 'Category' ? (sub === 'Eastern Europe' ? 'Dairy' : 'Cosmetics') : sub}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Bottom Stats Row */}
            <div className="h-40 w-full mt-8 grid grid-cols-4 gap-6 shrink-0">
                {[
                    {l: 'CO2 [kg]', v: '73.1k', t: '+42%'},
                    {l: 'Tonne-km', v: '601.7k', t: '+37%'},
                    {l: 'Avg distance [km]', v: '1.1k', t: '+14%'},
                    {l: 'Total weight [t]', v: '124k', t: '+21%'},
                ].map(s => (
                    <div key={s.l} className="bg-white rounded-[16px] p-5 shadow-sm border border-gray-100 hover:border-black/5 transition-all cursor-pointer flex flex-col justify-between group">
                         <div className="flex justify-between">
                             <span className="text-xs font-bold text-gray-900">{s.l}</span>
                             <span className="bg-gray-100 text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-600 group-hover:bg-green-100 group-hover:text-green-700 transition-colors">{s.t}</span>
                         </div>
                         <div>
                             <p className="text-[10px] text-gray-400 font-bold mb-1">Amount</p>
                             <p className="text-3xl font-medium text-gray-800 tracking-tight">{s.v}</p>
                         </div>
                         <div className="flex justify-between items-end">
                             <span className="text-[10px] font-bold text-gray-400">Tendency</span>
                             <svg width="40" height="16" viewBox="0 0 40 16" className="text-gray-300 group-hover:text-green-500 transition-colors">
                                 <path d="M0,15 C10,15 10,5 20,5 C30,5 30,12 40,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                             </svg>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── 11. ED TECH (Cream Education) ───────────────────────────────────────────
// Style: Cream background, serif/sans mix, friendly visuals, bar charts
// Ref: Image 6
const EdTechVariant = ({ activeSection }: { activeSection: string }) => {
    const { projects, user } = useStore();
    const paidProjects = useMemo(() => projects.filter(p => p.status === 'paid'), [projects]);
    const gpa = useMemo(() => projects.length ? Math.round((paidProjects.length / projects.length) * 100) : 0, [paidProjects, projects]);
    const scheduleItems = useMemo(() => projects.slice(0, 6).map(p => ({
        t: p.dueDate ? new Date(p.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD',
        s: p.name,
        bold: p.status === 'completed',
    })), [projects]);
    const contacts = useMemo(() => projects.slice(0, 3).map(p => ({
        n: p.client?.name || 'Unknown Client',
        r: p.description || p.type || 'Project',
        p: p.client?.email || '—',
        seed: p.client?.name || 'default',
        avatar: p.client?.avatar,
    })), [projects]);
    const barData = useMemo(() => {
        const max = Math.max(...projects.map(p => p.amount || 0), 1);
        return projects.slice(0, 5).map((p, i) => ({
            d: p.name.slice(0, 6),
            v: Math.round(((p.amount || 0) / max) * 95) || 10,
            t: i % 2 === 0 ? 'hatch' : 'solid',
        }));
    }, [projects]);
    return (
        <div className="w-full h-full font-sans bg-[#F5F5EF] p-10 overflow-hidden flex flex-col text-[#1A1A1A]">
            {/* Header */}
            <div className="flex items-center justify-between mb-16">
                 <div className="font-black text-xl tracking-tight">EdTech</div>
                 <div className="hidden md:flex gap-8 text-sm font-bold text-gray-400">
                     {['Dashboard', 'Activity', 'Teachers', 'Events', 'Payments', "Parent's Guide"].map((t,i) => (
                         <span key={t} className={`cursor-pointer transition-colors hover:text-black ${i===0 ? 'text-black' : ''}`}>{t}</span>
                     ))}
                 </div>
                 <div className="flex items-center gap-4">
                     <div className="relative cursor-pointer hover:bg-white p-2 rounded-full transition-colors">
                         <Bell className="w-5 h-5" />
                         <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#F5F5EF]" />
                     </div>
                     <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
                         <Avatar src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} size="md" className="border border-gray-300" />
                         <div className="text-sm font-bold">{user.name} <ChevronDown className="w-3 h-3 inline ml-1"/></div>
                     </div>
                 </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0 overflow-y-auto pr-2 no-scrollbar">
                
                {/* GPA Section - Col 8 */}
                <div className="col-span-8 bg-[#F5F5EF] flex flex-col">
                    <div className="mb-12">
                        <h1 className="text-5xl font-medium text-[#1A1A1A] mb-2 leading-tight">Keep Your <br/><span className="font-bold">Children's Success</span></h1>
                    </div>

                    <div className="flex gap-12 items-end mb-16">
                         <div>
                             <p className="text-xs font-bold text-gray-400 mb-2">Project completion rate</p>
                             <div className="text-8xl font-light tracking-tighter flex items-center">
                                 {gpa}<span className="text-4xl align-top text-gray-900">%</span>
                             </div>
                             <p className="text-xs font-bold text-gray-400 mt-2 bg-white px-3 py-1 rounded-full inline-block border border-gray-200">{paidProjects.length} of {projects.length} projects paid</p>
                         </div>
                         
                         {/* Bar Chart Area */}
                         <div className="flex-1 h-48 flex items-end justify-between px-8 gap-6 border-l border-gray-200 pl-12">
                             {barData.map((b, i) => (
                                 <div key={i} className="flex flex-col items-center gap-3 w-8 group cursor-pointer">
                                     {b.t === 'solid' ? (
                                         <div className="w-full bg-[#1A1A1A] rounded-t-lg transition-all group-hover:bg-black relative" style={{height: b.v + '%'}}>
                                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{b.v}% GPA</div>
                                         </div>
                                     ) : (
                                         <div className="w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqRQHdHGwAoiE0QVAhQA22Q3t5Kz2fAAAAABJRU5ErkJggg==')] rounded-t-lg opacity-30 border border-black" style={{height: b.v + '%'}} />
                                     )}
                                     <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{b.d}</span>
                                 </div>
                             ))}
                         </div>
                    </div>

                    {/* Bottom Split */}
                    <div className="grid grid-cols-2 gap-12 border-t border-gray-200 pt-12">
                         {/* Upcoming Tests */}
                         <div>
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="font-medium text-xl">Upcoming Tests</h3>
                                 <div className="text-xs font-bold text-gray-400 flex items-center gap-2 cursor-pointer hover:text-black hover:bg-white px-2 py-1 rounded transition-colors"><span className="w-2 h-2 bg-black rounded-full" /> Test Day <Calendar className="w-4 h-4" /></div>
                             </div>
                             
                             <div className="grid grid-cols-3 gap-3">
                                 {[
                                    {d: 22, m: 'Monday', s: '', active: false},
                                    {d: 23, m: 'Tuesday', s: 'Math', active: true},
                                    {d: 24, m: 'Wednesday', s: 'Art', active: true},
                                    {d: 25, m: 'Thursday', s: '', active: false},
                                    {d: 26, m: 'Friday', s: '', active: false},
                                    {d: 27, m: 'Sat', s: 'Sun', active: false, type: 'visual'},
                                 ].map((c, i) => (
                                     <div key={i} className={`aspect-square rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer hover:scale-105 ${c.active ? 'bg-[#1A1A1A] text-white shadow-xl' : 'bg-white text-gray-400'}`}>
                                         {c.type === 'visual' ? (
                                             <div className="w-full h-full flex items-center justify-center opacity-20"><Sun className="w-10 h-10 animate-spin-slow" /></div>
                                         ) : (
                                             <>
                                                <span className={`text-2xl font-medium ${c.active ? 'text-white' : 'text-black'}`}>{c.d}</span>
                                                {c.s && <span className="text-xs font-bold">{c.s}</span>}
                                                <span className="text-[10px] font-bold mt-auto">{c.m}</span>
                                             </>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         </div>

                         {/* Schedule List */}
                         <div>
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="font-medium text-xl">Today's Schedule</h3>
                             </div>
                             <div className="space-y-6">
                                 {(scheduleItems.length ? scheduleItems : [{t:'TBD',s:'No projects yet',bold:false}]).map((r, i) => (
                                     <div key={i} className="flex justify-between items-center text-sm group cursor-pointer hover:translate-x-2 transition-transform">
                                         <span className="text-gray-400 font-medium text-xs">{r.t}</span>
                                         <span className={`font-bold ${r.bold ? 'text-black' : 'text-gray-600 group-hover:text-black'}`}>{r.s}</span>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    </div>
                </div>

                {/* Right Column - Col 4 */}
                <div className="col-span-4 pl-8 border-l border-gray-200">
                     <div className="mb-12">
                         <div className="flex justify-between items-center mb-6">
                             <h3 className="font-medium text-xl">Parents' Contacts</h3>
                         </div>
                         <p className="text-xs text-gray-400 font-bold mb-6">Here you can see parents and their contacts.</p>
                         
                         <div className="space-y-6">
                             {contacts.map((p, i) => (
                                 <div key={i} className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                                     <Avatar src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`} className="w-12 h-12 rounded-full border border-gray-200" />
                                     <div className="flex-1">
                                         <p className="font-bold text-sm text-[#1A1A1A]">{p.n}</p>
                                         <p className="text-xs text-gray-400 truncate max-w-[100px]">{p.r}</p>
                                     </div>
                                     <span className="text-[10px] font-bold text-gray-400 group-hover:text-black transition-colors truncate max-w-[100px]">{p.p}</span>
                                 </div>
                             ))}
                             <button className="bg-[#EAEAE5] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#d6d6cf] transition-colors">Show all</button>
                         </div>
                     </div>
                     
                     {/* Recent Events Card */}
                     <div>
                         <div className="flex justify-between items-center mb-6">
                             <h3 className="font-medium text-xl">Recent Events</h3>
                             <button className="bg-[#EAEAE5] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#d6d6cf] transition-colors">Show all</button>
                         </div>
                         
                         <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-transform hover:-translate-y-1">
                             <div className="flex items-center gap-3 mb-4">
                                 <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Connor" />
                                 <div>
                                     <p className="font-bold text-sm">Connor Elington</p>
                                     <p className="text-[10px] text-gray-400 font-bold">Teacher Coordinator</p>
                                 </div>
                             </div>
                             <div className="bg-[#F5F5EF] p-4 rounded-xl mb-4">
                                 <p className="font-bold text-sm mb-1">Book Fair</p>
                                 <p className="text-xs text-gray-600 leading-relaxed">Join us on March 15 for our Book Fair! Explore captivating reads for the entire family, seize the opportunity to enrich...</p>
                             </div>
                             <div className="flex justify-between items-center">
                                 <div className="flex gap-4">
                                     <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">👍 7</span>
                                     <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">😍 3</span>
                                     <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">⚡ 5</span>
                                 </div>
                                 <span className="text-[9px] font-bold text-gray-300">January 27, 1:43 PM</span>
                             </div>
                             <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                 <div className="flex -space-x-2">
                                     {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />)}
                                 </div>
                                 <div className="flex gap-2">
                                     <span className="text-[10px] font-bold text-gray-400 self-center">29 comments</span>
                                     <button className="bg-[#EAEAE5] text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#d6d6cf] transition-colors"><Plus className="w-3 h-3" /> Add to calendar</button>
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

// ─── 12. ZARSS (Sales Beige) ─────────────────────────────────────────────────
// Style: Dark sidebar, warm beige background, rounded colorful widgets
// Ref: Image 7
const ZarssVariant = ({ activeSection }: { activeSection: string }) => {
    return (
        <div className="w-full h-full font-sans bg-[#F4F1EA] flex overflow-hidden">
            {/* Dark Sidebar */}
            <div className="w-64 bg-[#212121] text-white flex flex-col py-8 px-6 shrink-0 h-full">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="bg-white/10 p-1.5 rounded-lg"><Box className="w-4 h-4 text-white" /></div>
                    <span className="font-bold text-lg tracking-wide">Zarss</span>
                </div>
                
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="p-1 border border-dashed border-gray-600 rounded-full mb-3">
                        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mark" size="lg" className="w-16 h-16 bg-gray-800" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium mb-1">Welcome Back,</p>
                    <p className="text-sm font-bold">Mark Johnson</p>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
                    {['Dashboard', 'Statistics', 'Payment', 'Transactions', 'Products', 'Customer', 'Messages', 'Settings'].map((t, i) => (
                        <div key={t} className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-colors ${i===0 ? 'text-[#8B9AF9]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                            {i===0 ? <PieChart className="w-5 h-5" /> : i===6 ? <MessageSquare className="w-5 h-5" /> : <div className="w-5 h-5 rounded bg-gray-600/30" />}
                            <span className="text-sm font-medium">{t}</span>
                            {i===6 && <span className="ml-auto w-5 h-5 bg-[#8B9AF9] text-black text-[9px] font-bold rounded-full flex items-center justify-center">5</span>}
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                    <button className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white text-sm font-medium">
                        <LogOut className="w-5 h-5" /> Log Out
                    </button>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 p-8 overflow-y-auto flex gap-8">
                {/* Center Column */}
                <div className="flex-[2] flex flex-col gap-8 min-w-0">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                            <p className="text-gray-400 text-xs font-bold mt-1">Payments Updates</p>
                        </div>
                        <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 w-64 shadow-sm border border-transparent focus-within:border-gray-200 transition-all">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input className="outline-none text-sm placeholder:text-gray-300 w-full font-medium" placeholder="Search" />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Balance */}
                        <div className="bg-[#D3E0D0] rounded-[32px] p-6 flex flex-col justify-between h-48 shadow-sm hover:translate-y-[-4px] transition-transform cursor-pointer relative overflow-hidden">
                             <div className="flex justify-between items-start mb-4 relative z-10">
                                 <span className="flex items-center gap-2 text-xs font-bold text-[#4A6347]"><DollarSign className="w-3 h-3"/> Balance</span>
                                 <span className="bg-white/40 px-2 py-1 rounded-lg text-[10px] font-bold text-[#4A6347]">+ 17%</span>
                             </div>
                             <div className="relative z-10">
                                 <span className="text-3xl font-black text-[#2A3F28] tracking-tight">$ 56,874</span>
                             </div>
                             {/* Line Chart Sparkline */}
                             <svg className="absolute bottom-4 left-0 w-full h-16 pointer-events-none" preserveAspectRatio="none">
                                 <path d="M0,50 Q30,20 60,40 T120,30 T180,50 T240,10" fill="none" stroke="#6F8C6C" strokeWidth="2" opacity="0.6" />
                             </svg>
                        </div>
                        
                        {/* Sales */}
                        <div className="bg-[#FAE5A8] rounded-[32px] p-6 flex flex-col justify-between h-48 shadow-sm hover:translate-y-[-4px] transition-transform cursor-pointer relative overflow-hidden">
                             <div className="flex justify-between items-start mb-4 relative z-10">
                                 <span className="flex items-center gap-2 text-xs font-bold text-[#7A6935]"><Percent className="w-3 h-3"/> Sales</span>
                                 <span className="bg-white/40 px-2 py-1 rounded-lg text-[10px] font-bold text-[#7A6935]">+ 23%</span>
                             </div>
                             <div className="relative z-10">
                                 <span className="text-3xl font-black text-[#4F4118] tracking-tight">$ 24,575</span>
                             </div>
                             <svg className="absolute bottom-4 left-0 w-full h-16 pointer-events-none" preserveAspectRatio="none">
                                 <path d="M0,50 Q30,60 60,30 T120,40 T180,20 T240,40" fill="none" stroke="#A8944E" strokeWidth="2" opacity="0.6" />
                             </svg>
                        </div>

                        {/* Upgrade CTA */}
                        <div className="bg-[#9BA7F9] rounded-[32px] p-6 flex flex-col justify-between h-48 shadow-sm hover:shadow-lg transition-transform text-center items-center cursor-pointer text-white">
                             <h3 className="font-bold text-lg">Upgrade</h3>
                             <p className="text-xs text-white/80 px-2">Get more information and opportunities</p>
                             <button className="bg-[#7988EB] border border-white/20 w-full py-3 rounded-2xl text-xs font-bold shadow-lg hover:bg-[#6876D6] transition-colors">Go Pro</button>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-[#FBFBF9] rounded-[40px] p-8 shadow-sm border border-white flex-1 min-h-[400px]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="font-bold text-base text-gray-800">User in The Last Week</h3>
                                <p className="text-3xl font-black text-gray-900 mt-2">+ 3,2%</p>
                            </div>
                            <span className="text-xs font-bold text-gray-400 cursor-pointer hover:text-black mt-2">See statistics for all time</span>
                        </div>
                        
                        {/* Bar Chart */}
                        <div className="flex items-end justify-between h-64 gap-4 px-4 pb-2">
                             {[
                                {d: 'Mon', v: 40}, {d: 'Tue', v: 65, l: '$33,567'}, {d: 'Wed', v: 85}, {d: 'Thu', v: 35}, {d: 'Fri', v: 25}, {d: 'Sat', v: 45}, {d: 'Sun', v: 50}
                             ].map((b, i) => (
                                 <div key={b.d} className="flex flex-col items-center gap-3 flex-1 h-full justify-end group cursor-pointer relative">
                                     {b.l && (
                                         <div className="absolute top-[5%] -translate-y-full mb-2 bg-white px-3 py-1.5 rounded-lg shadow-lg text-[10px] font-bold border border-gray-100 whitespace-nowrap z-10 animate-fade-in-up">
                                             {b.l}
                                             <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-gray-100" />
                                         </div>
                                     )}
                                     
                                     {/* Bar container */}
                                     <div className="w-full bg-[#F0EFEC] rounded-[16px] overflow-hidden relative" style={{height: '100%'}}>
                                         <div className="absolute bottom-0 w-full bg-[#212121] rounded-[16px] transition-all duration-500 group-hover:bg-black" style={{height: b.v + '%'}} />
                                         {b.l && <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l border-white border-dashed opacity-30 h-full z-20 pointer-events-none" />}
                                     </div>
                                     <span className="text-xs font-bold text-gray-400">{b.d}</span>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div>
                         <div className="flex justify-between items-center mb-6 px-2">
                             <h3 className="font-bold text-lg text-gray-800">Last Orders</h3>
                             <div className="flex gap-4 text-xs font-bold text-gray-400">
                                 <span className="bg-white border px-3 py-1 rounded-lg">Data Updates Every 3 Hours</span>
                                 <span className="hidden cursor-pointer hover:text-black xl:inline pt-1">View All Orders</span>
                             </div>
                         </div>
                         <div className="space-y-3">
                             {[
                                 {n: 'David Astee', p: '$1,456', s: 'Chargeback', d: '11 Sep 2022', c: 'text-[#8B9AF9]'},
                                 {n: 'Maria Hulama', p: '$42,4378', s: 'Completed', d: '11 Sep 2022', c: 'text-gray-400', bg: 'bg-white shadow-xl scale-[1.02]'},
                                 {n: 'Arnold Swarz', p: '$3,412', s: 'Completed', d: '11 Sep 2022', c: 'text-gray-400'},
                             ].map((r, i) => (
                                 <div key={i} className={`flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-white hover:shadow-md cursor-pointer ${r.bg || ''}`}>
                                    <div className="flex items-center gap-3 w-1/4">
                                        <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.n}`} size="sm" />
                                        <span className="text-sm font-bold text-gray-800">{r.n}</span>
                                    </div>
                                    <div className="w-1/4 font-bold text-sm text-gray-800">{r.p}</div>
                                    <div className="w-1/4 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-sm ${r.s === 'Chargeback' ? 'bg-[#8B9AF9]' : 'bg-gray-300'}`} />
                                        <span className="text-xs font-bold text-gray-500">{r.s}</span>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 text-right w-1/4">{r.d}</div>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="w-80 shrink-0 flex flex-col gap-8">
                     {/* Monthly Profits */}
                     <div className="bg-[#FBFBF9] rounded-[40px] p-8 shadow-sm border border-white h-auto">
                         <div className="flex justify-between mb-2">
                             <h3 className="font-bold text-base text-gray-800">Monthly Profits</h3>
                             <MoreHorizontal className="w-5 h-5 text-gray-300" />
                         </div>
                         <p className="text-xs text-gray-400 font-bold mb-8">Total Profit Growth of 26%</p>
                         
                         <div className="flex gap-4">
                             {/* Donut Chart */}
                             <div className="w-32 h-32 relative shrink-0">
                                 <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                                     <circle cx="18" cy="18" r="15.9" fill="none" stroke="#FAE5A8" strokeWidth="3.8" strokeDasharray="100 0" />
                                     <circle cx="18" cy="18" r="15.9" fill="none" stroke="#D3E0D0" strokeWidth="3.8" strokeDasharray="60 40" strokeDashoffset="0" />
                                     <circle cx="18" cy="18" r="15.9" fill="none" stroke="#9BA7F9" strokeWidth="3.8" strokeDasharray="35 65" strokeDashoffset="0" />
                                 </svg>
                                   <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                     <span className="text-[9px] font-bold text-gray-400">Total</span>
                                     <span className="text-xs font-black text-gray-800">$76,356</span>
                                 </div>
                             </div>
                             
                             {/* Legend */}
                             <div className="flex flex-col justify-center gap-3">
                                 <div>
                                     <p className="text-[10px] font-bold text-gray-400">Giveaway</p>
                                     <p className="text-sm font-black text-[#9BA7F9]">60%</p>
                                 </div>
                                 <div>
                                     <p className="text-[10px] font-bold text-gray-400">Affiliate</p>
                                     <p className="text-sm font-black text-[#D3E0D0]">24%</p>
                                 </div>
                                  <div>
                                     <p className="text-[10px] font-bold text-gray-400">Offline Sales</p>
                                     <p className="text-sm font-black text-[#FAE5A8]">16%</p>
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* Recent Sales List */}
                     <div className="bg-[#FBFBF9] rounded-[40px] p-8 shadow-sm border border-white flex-1 relative overflow-hidden">
                         <div className="flex justify-between items-center mb-8 relative z-10">
                             <h3 className="font-bold text-base text-gray-800">Recent Sales</h3>
                             <span className="text-xs font-bold text-gray-400 cursor-pointer hover:text-black">See All</span>
                         </div>
                         
                         <div className="space-y-4 relative z-10">
                             {[
                                 {n: 'Steven Summer', t: '02 Minutes Ago', a: '+$52.00'},
                                 {n: 'Jordan Maizee', t: '02 Minutes Ago', a: '+$83.00'},
                                 {n: 'Jessica Alba', t: '05 Minutes Ago', a: '+$61.60'},
                                 {n: 'Anna Armas', t: '05 Minutes Ago', a: '+$2351.00', hl: true},
                                 {n: 'Angelina Boo', t: '10 Minutes Ago', a: '+$152.00'},
                                 {n: 'Anastasia Koss', t: '12 Minutes Ago', a: '+$542.00'},
                             ].map((s, i) => (
                                 <div key={i} className="flex items-center justify-between group cursor-pointer">
                                     <div className="flex items-center gap-3">
                                         <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.n}`} className="w-10 h-10 shadow-sm" />
                                         <div>
                                             <p className="font-bold text-xs text-gray-900">{s.n}</p>
                                             <p className="text-[10px] text-gray-400">{s.t}</p>
                                         </div>
                                     </div>
                                     <div className={`font-black text-xs ${s.hl ? 'text-green-600 bg-green-50 px-2 py-1 rounded' : 'text-gray-800'}`}>{s.a}</div>
                                 </div>
                             ))}
                         </div>
                         
                         <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FBFBF9] to-transparent z-20 pointer-events-none" />
                     </div>
                </div>
            </div>
        </div>
    );
};

// ─── 13. CHECK BOX (Dark Neon Monitor) ───────────────────────────────────────
// Style: Pure black background, neon green/orange accents, timeline, cards
// Ref: Image 8
const CheckBoxVariant = ({ activeSection }: { activeSection: string }) => {
    return (
        <div className="w-full h-full font-sans bg-[#050505] text-white p-6 overflow-hidden flex flex-col relative box-border">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 px-2 shrink-0">
                <div className="flex items-center gap-8">
                     <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-black text-xl">N</div>
                     <div className="flex gap-2">
                         {['Check Box', 'Monitoring', 'Support'].map((t, i) => (
                             <button key={t} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${i===0 ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>
                                 {i===1 && <BarChart3 className="w-3 h-3" />}
                                 {i===2 && <MessageSquare className="w-3 h-3" />}
                                 {i===0 && <Box className="w-3 h-3" />}
                                 {t}
                             </button>
                         ))}
                         <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10"><Search className="w-3 h-3" /></button>
                     </div>
                </div>
                
                <div className="flex items-center gap-4">
                     <div className="text-right hidden md:block">
                         <p className="text-xs font-bold">Bogdan Nikitin</p>
                         <p className="text-[10px] text-gray-500">@Nixtio</p>
                     </div>
                     <div className="relative">
                        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bogdan" className="w-10 h-10 border border-white/10" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold border-2 border-black">2</div>
                     </div>
                </div>
            </div>

            {/* Sidebar + Main Grid */}
            <div className="flex flex-1 gap-6 min-h-0">
                {/* Mini Sidebar */}
                <div className="w-14 flex flex-col gap-6 items-center shrink-0 pt-4">
                    {[Heart, Calendar, Grip, Settings, Plus].map((I, i) => (
                        <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${i===4 ? 'mt-auto bg-[#1A1A1A] text-white hover:bg-white hover:text-black hover:rotate-90' : 'bg-[#121212] text-gray-500 hover:text-white hover:bg-[#222]'}`}>
                            <I className="w-5 h-5" />
                        </div>
                    ))}
                </div>

                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Title + Filters Row */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-black uppercase tracking-wider">Check Box</h1>
                        <div className="flex gap-3">
                             {['Date: Now', 'Product: All', 'Profile: Bogdan'].map(f => (
                                 <button key={f} className="px-4 py-2 bg-[#121212] rounded-full text-[10px] font-bold border border-white/5 hover:border-white/20 transition-colors flex items-center gap-2">
                                     {f} <ChevronDown className="w-3 h-3 text-gray-500" />
                                 </button>
                             ))}
                             <button className="w-8 h-8 rounded-full bg-[#121212] flex items-center justify-center border border-white/5 hover:bg-white/10"><Sliders className="w-3 h-3" /></button>
                        </div>
                    </div>

                    {/* Top Cards Row */}
                    <div className="grid grid-cols-2 gap-6 h-64 shrink-0">
                         {/* Customer Card */}
                         <div className="bg-[#121212] rounded-[32px] p-8 relative overflow-hidden group border border-white/5 hover:border-white/10 transition-colors">
                             <div className="flex justify-between mb-8">
                                 <span className="text-xs font-bold uppercase text-white tracking-widest">Customer</span>
                                 <MoreHorizontal className="w-4 h-4 text-gray-500" />
                             </div>
                             <div className="flex gap-12 mb-6">
                                 <div>
                                     <div className="text-[10px] mb-1 text-[#bef264] flex items-center gap-1">▲ </div>
                                     <div className="text-4xl font-light tracking-tighter text-white">2,4%</div>
                                     <div className="text-[10px] font-bold text-gray-500 mt-1">Web Surfing</div>
                                 </div>
                                  <div>
                                     <div className="text-[10px] mb-1 text-orange-400 flex items-center gap-1">▼ </div>
                                     <div className="text-4xl font-light tracking-tighter text-white">1,1%</div>
                                     <div className="text-[10px] font-bold text-gray-500 mt-1">Radio Station</div>
                                 </div>
                             </div>
                             {/* Neon Lines Chart */}
                             <div className="absolute bottom-6 left-6 right-6 h-16">
                                 <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                     <path d="M0,40 L30,45 L60,20 L90,50 L120,45 L150,30 L180,40 L210,35" stroke="#bef264" fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                     <path d="M0,50 L30,60 L60,40 L90,60 L120,55 L150,45 L180,50" stroke="#FB923C" fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                 </svg>
                             </div>
                         </div>

                         {/* Product Card (Dot Matrix) */}
                         <div className="bg-[#121212] rounded-[32px] p-8 relative overflow-hidden group border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex justify-between mb-8">
                                 <span className="text-xs font-bold uppercase text-white tracking-widest">Product</span>
                                 <MoreHorizontal className="w-4 h-4 text-gray-500" />
                             </div>
                             <div className="flex gap-12 mb-6">
                                 <div>
                                     <div className="text-[10px] mb-1 text-[#bef264] flex items-center gap-1">▲ </div>
                                     <div className="text-4xl font-light tracking-tighter text-white">2,8%</div>
                                     <div className="text-[10px] font-bold text-gray-500 mt-1">Partners</div>
                                 </div>
                                  <div>
                                     <div className="text-[10px] mb-1 text-orange-400 flex items-center gap-1">▼ </div>
                                     <div className="text-4xl font-light tracking-tighter text-white">3,2%</div>
                                     <div className="text-[10px] font-bold text-gray-500 mt-1">Owners</div>
                                 </div>
                             </div>
                             {/* Dot Matrix */}
                             <div className="absolute bottom-8 left-8 right-8 flex justify-between">
                                 {Array.from({length: 16}).map((_, col) => (
                                     <div key={col} className="flex flex-col gap-1.5 justify-end h-16">
                                         {Array.from({length: 4}).map((_, row) => {
                                             const active = Math.random() > 0.5;
                                             const color = Math.random() > 0.7 ? 'bg-orange-400' : 'bg-[#bef264]';
                                             return (
                                                <div key={row} className={`w-1.5 h-1.5 rounded-full ${active ? color : 'bg-[#222]'}`} />
                                             )
                                         })}
                                     </div>
                                 ))}
                             </div>
                         </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex gap-6 h-[400px]">
                         {/* Product Capsule Chart */}
                         <div className="flex-1 bg-[#121212] rounded-[32px] p-8 border border-white/5 relative flex flex-col">
                             <div className="flex justify-between mb-4">
                                 <span className="text-xs font-bold uppercase text-white tracking-widest">Product</span>
                                 <MoreHorizontal className="w-4 h-4 text-gray-500" />
                             </div>
                             
                             <div className="flex-1 flex items-end justify-between gap-2 pb-8">
                                 {[
                                     {h: 40, c: 'bg-white', val: 52, b: 'bg-orange-400', bv: 81},
                                     {h: 60, c: 'bg-[#bef264]', val: 96, b: 'bg-orange-400', bv: 25},
                                     {h: 50, c: 'bg-[#bef264]', val: 48, b: 'bg-white', bv: 51},
                                     {h: 70, c: 'bg-[#bef264]', val: 80, b: 'bg-orange-400', bv: 49},
                                     {h: 30, c: 'bg-orange-400', val: 34, b: 'bg-[#bef264]', bv: 67},
                                     {h: 80, c: 'bg-[#bef264]', val: 92, b: 'bg-white', bv: 28},
                                     {h: 45, c: 'bg-[#bef264]', val: 58, b: 'bg-orange-400', bv: 20},
                                     {h: 65, c: 'bg-orange-400', val: 84, b: 'bg-[#bef264]', bv: 39},
                                     {h: 35, c: 'bg-white', val: 36, b: 'bg-orange-400', bv: 72},
                                 ].map((col, i) => (
                                     <div key={i} className="flex flex-col gap-2 items-center h-full justify-end group cursor-pointer hover:opacity-80 transition-opacity">
                                         <div className={`${col.c} w-8 rounded-full flex items-center justify-center text-[9px] font-bold text-black transition-all`} style={{height: col.h + '%'}}>
                                             {col.val}
                                         </div>
                                         <div className="w-1.5 h-1.5 rounded-full bg-[#333] group-hover:bg-white transition-colors my-1" />
                                         <div className={`${col.b} w-8 rounded-full flex items-center justify-center text-[9px] font-bold text-black transition-all`} style={{height: (100-col.h)*0.5 + '%'}}>
                                             {col.bv}
                                         </div>
                                     </div>
                                 ))}
                             </div>

                             <div className="flex items-center gap-6 mt-auto pt-4 border-t border-white/5 text-[10px] font-bold text-gray-500">
                                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-white" /> Resources</div>
                                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#bef264]" /> Valid</div>
                                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-400" /> Invalid</div>
                                 <div className="ml-auto text-white">Total: 1,012</div>
                             </div>
                         </div>

                          {/* Projects Timeline (Gantt) */}
                         <div className="w-[400px] bg-[#121212] rounded-[32px] p-8 border border-white/5 relative flex flex-col">
                             <div className="flex justify-between mb-8">
                                 <span className="text-xs font-bold uppercase text-white tracking-widest">Projects Timeline</span>
                                 <MoreHorizontal className="w-4 h-4 text-gray-500" />
                             </div>
                             
                             <div className="flex-1 relative">
                                 {/* Grid Lines */}
                                 <div className="absolute inset-0 flex justify-between pointer-events-none">
                                     {[0, 1, 2, 3, 4, 5, 6].map(l => <div key={l} className="w-px h-full bg-white/5 border-l border-dashed border-gray-800" />)}
                                 </div>

                                 {/* Bars */}
                                 <div className="relative space-y-6 pt-2">
                                     {/* Row 1 */}
                                     <div className="flex items-center">
                                         <span className="w-12 text-[10px] font-bold text-gray-500 shrink-0">30.09</span>
                                         <div className="ml-4 w-40 h-8 bg-[#bef264] rounded-full flex items-center px-2 justify-between cursor-pointer hover:scale-105 transition-transform text-black">
                                             <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center"><Zap className="w-3 h-3 text-blue-500" /></div>
                                             <span className="text-[9px] font-bold mr-2">16</span>
                                         </div>
                                     </div>
                                      {/* Row 2 */}
                                     <div className="flex items-center">
                                         <span className="w-12 text-[10px] font-bold text-gray-500 shrink-0">29.09</span>
                                         <div className="ml-32 w-32 h-8 bg-orange-400 rounded-full flex items-center px-2 justify-between cursor-pointer hover:scale-105 transition-transform text-black">
                                             <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>
                                             <span className="text-[9px] font-bold mr-2">29</span>
                                         </div>
                                     </div>
                                     {/* Row 3 */}
                                     <div className="flex items-center">
                                         <span className="w-12 text-[10px] font-bold text-gray-500 shrink-0">28.09</span>
                                         <div className="ml-16 w-36 h-8 bg-white rounded-full flex items-center px-2 justify-between cursor-pointer hover:scale-105 transition-transform text-black">
                                              <div className="flex -space-x-2">
                                                 <Avatar size="sm" src="https://api.dicebear.com/7.x/avataaars/svg?seed=A" className="w-6 h-6 border border-white" />
                                                 <Avatar size="sm" src="https://api.dicebear.com/7.x/avataaars/svg?seed=B" className="w-6 h-6 border border-white" />
                                              </div>
                                             <span className="text-[9px] font-bold mr-2">15</span>
                                         </div>
                                     </div>

                                      {/* Row 4 */}
                                     <div className="flex items-center pt-8">
                                         <span className="w-12 text-[10px] font-bold text-gray-500 shrink-0">25.09</span>
                                         <div className="ml-24 w-56 h-8 bg-[#bef264] rounded-full flex items-center px-2 justify-between cursor-pointer hover:scale-105 transition-transform text-black">
                                              <div className="flex -space-x-2 pl-1">
                                                 <Avatar size="sm" src="https://api.dicebear.com/7.x/avataaars/svg?seed=C" className="w-6 h-6 border border-[#bef264] bg-white ring-1 ring-black" />
                                                 <Avatar size="sm" src="https://api.dicebear.com/7.x/avataaars/svg?seed=D" className="w-6 h-6 border border-[#bef264] bg-white ring-1 ring-black" />
                                                  <Avatar size="sm" src="https://api.dicebear.com/7.x/avataaars/svg?seed=E" className="w-6 h-6 border border-[#bef264] bg-white ring-1 ring-black" />
                                              </div>
                                             <span className="text-[9px] font-bold mr-2">19</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider relative z-10 px-4">
                                 <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
                             </div>

                              <div className="flex items-center gap-6 pt-4 text-[10px] font-bold text-gray-500">
                                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-[#bef264]" /> Customer</div>
                                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-orange-400" /> Product</div>
                                 <div className="ml-auto text-white">Total: 284</div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Missing Icons Shim ───────────────────────────────────────────────────────
function Percent(props: any) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>}
function Heart(props: any) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>}


function AlertCircle(props: any) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> }
function ShieldCheck(props: any) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg> }
function Database(props: any) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg> }
function Image(props: any) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg> }


// ─── Main Controller ──────────────────────────────────────────────────────────

export const DesignShowcase = ({ onClose, isDarkMode }: { onClose: () => void, isDarkMode: boolean }) => {
    const [activeVariant, setActiveVariant] = useState<number>(0);
    const [activeSection, setActiveSection] = useState<string>('dashboard');

    const Variants = [
        { id: 'syncdesk', label: 'Analytics Hub', component: SyncdeskVariant },
        { id: 'payflow', label: 'Finance Dark', component: PayflowVariant },
        { id: 'flux', label: 'Bold Wellness', component: FluxVariant },
        { id: 'celoxis', label: 'Command Center', component: CeloxisVariant },
        { id: 'rental', label: 'Focus Flow', component: CarRentalVariant },
        { id: 'callai', label: 'Glass Contact', component: CallAIVariant },
        { id: 'nodus', label: 'Clean Audit', component: NodusVariant },
        { id: 'santorini', label: 'Travel Plan', component: SantoriniVariant },
        { id: 'jobflow', label: 'Soft Scheduler', component: JobFlowVariant },
        { id: 'emission', label: 'Data Sankey', component: EmissionVariant },
        { id: 'edtech', label: 'Cream EdTech', component: EdTechVariant },
        { id: 'zarss', label: 'Beige Sales', component: ZarssVariant },
        { id: 'checkbox', label: 'Neon Monitor', component: CheckBoxVariant },
    ];

    const ActiveComponent = Variants[activeVariant].component;

    return (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="w-full h-full max-w-[1920px] bg-[#000] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/10 ring-1 ring-white/10 relative">

                {/* Master Toolbar */}
                <div className="h-16 bg-[#111] border-b border-white/10 flex items-center justify-between px-8 shrink-0 relative z-50">
                    <div className="flex items-center gap-6 overflow-hidden">
                        <div className="flex items-center gap-2 text-white font-black tracking-tight text-lg shrink-0">
                            <Sparkles className="w-5 h-5 text-purple-400 fill-current" />
                            DESIGN<span className="text-purple-400">LAB</span>
                        </div>

                        <div className="h-6 w-px bg-white/10 shrink-0" />

                        {/* Scrollable Navigation */}
                        <div className="flex gap-1 bg-black/50 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar mask-linear-fade">
                            {Variants.map((v, i) => (
                                <button
                                    key={v.id}
                                    onClick={() => setActiveVariant(i)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeVariant === i ? 'bg-[#333] text-white shadow-inner border border-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-[#222]'}`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-white/5 ml-4">
                        <div className="text-[10px] text-gray-500 font-mono hidden xl:block bg-[#1A1A1A] px-3 py-1.5 rounded-lg border border-white/5">
                            RES: 1920x1080 • SCALE: 100% • MODE: HIFI
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Viewport */}
                <div className="flex-1 overflow-hidden relative bg-[#050505] p-2">
                    <div className="w-full h-full rounded-[24px] overflow-hidden bg-black shadow-2xl ring-1 ring-white/5 relative">
                         <div className="absolute inset-0 overflow-hidden">
                            <ActiveComponent activeSection={activeSection} />
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignShowcase;

