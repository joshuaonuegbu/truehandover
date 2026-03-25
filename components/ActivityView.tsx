import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Banknote, Unlock, DollarSign, Eye, Upload, FileText, Link as LinkIcon,
    List as ListIcon, Server, Clock, CheckCircle, FolderLock, Search,
    Download, Receipt, ChevronRight
} from 'lucide-react';
import { Card } from './Shared';
import { useStore } from '../context/StoreContext';
import { isMockMode } from '../config/mockMode';

// --- UTILS ---
const PrivacyBlur = ({ children, className = "", strength = 'normal' }: { children?: React.ReactNode, className?: string, strength?: 'normal' | 'strong' }) => {
    const context = useOutletContext<{ privacyMode: boolean }>();
    const privacyMode = context?.privacyMode || false;

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
        const chars = '0123456789$Â£â‚¬%&@#';
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
            className={`inline-block font-sans tracking-tight ${className}`}
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

const ActivityView = () => {
    const { projects } = useStore();
    const [filter, setFilter] = useState<'all' | 'financial' | 'access' | 'system'>('all');
    const [search, setSearch] = useState('');

    const formatGroupDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const diffDays = Math.floor((startOfNow - startOfD) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const activityFeed = useMemo(() => {
        const rows: Array<{
            id: string;
            dateIso: string;
            type: 'financial' | 'access' | 'system';
            title: string;
            project: string;
            client: string;
            amount?: string;
            desc?: string;
            icon: any;
            status: 'cleared' | 'pending' | 'success' | 'info';
        }> = [];

        projects.forEach((p) => {
            const baseDate = p.createdAt || new Date().toISOString();
            const client = p.client?.company || p.client?.name || 'Client';
            const fileCount = (p.files || []).length;

            rows.push({
                id: `project-created-${p.id}`,
                dateIso: baseDate,
                type: 'system',
                title: 'Project Created',
                project: p.name,
                client,
                desc: `${p.type || 'General'} vault initialized`,
                icon: Server,
                status: 'success',
            });

            if (fileCount > 0) {
                rows.push({
                    id: `files-${p.id}`,
                    dateIso: baseDate,
                    type: 'system',
                    title: 'Files Uploaded',
                    project: p.name,
                    client,
                    desc: `${fileCount} asset${fileCount === 1 ? '' : 's'} uploaded`,
                    icon: Upload,
                    status: 'info',
                });
            }

            if (p.clientViewedAt) {
                rows.push({
                    id: `view-${p.id}`,
                    dateIso: p.clientViewedAt,
                    type: 'access',
                    title: 'Client Viewed',
                    project: p.name,
                    client,
                    desc: 'Vault viewed by client',
                    icon: Eye,
                    status: 'info',
                });
            }

            if (p.status === 'paid' || p.status === 'completed') {
                rows.push({
                    id: `paid-${p.id}`,
                    dateIso: p.clientViewedAt || p.dueDate || baseDate,
                    type: 'financial',
                    title: 'Payment Settled',
                    project: p.name,
                    client,
                    amount: `+$${p.amount.toLocaleString()}`,
                    icon: DollarSign,
                    status: 'cleared',
                });
                rows.push({
                    id: `unlock-${p.id}`,
                    dateIso: p.clientViewedAt || p.dueDate || baseDate,
                    type: 'system',
                    title: 'Vault Unlocked',
                    project: p.name,
                    client,
                    desc: 'Assets released to client',
                    icon: Unlock,
                    status: 'success',
                });
            } else if (p.status === 'awaiting_payment') {
                rows.push({
                    id: `invoice-${p.id}`,
                    dateIso: p.dueDate || baseDate,
                    type: 'financial',
                    title: 'Invoice Pending',
                    project: p.name,
                    client,
                    amount: `+$${p.amount.toLocaleString()}`,
                    icon: Receipt,
                    status: 'pending',
                });
            } else if (p.status === 'awaiting_signature') {
                rows.push({
                    id: `signature-${p.id}`,
                    dateIso: p.dueDate || baseDate,
                    type: 'access',
                    title: 'Awaiting Signature',
                    project: p.name,
                    client,
                    desc: 'Contract sent for e-signature',
                    icon: FileText,
                    status: 'pending',
                });
            }
        });

        // Keep a tiny demo fallback when mock mode is enabled and there is no project data.
        if (rows.length === 0 && isMockMode()) {
            rows.push({
                id: 'demo-1',
                dateIso: new Date().toISOString(),
                type: 'access',
                title: 'Link Generated',
                project: 'Demo Project',
                client: 'Demo Client',
                desc: 'Secure access token created',
                icon: LinkIcon,
                status: 'info',
            });
        }

        const grouped = rows
            .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
            .reduce((acc, row) => {
                const key = formatGroupDate(row.dateIso);
                if (!acc[key]) acc[key] = [];
                acc[key].push(row);
                return acc;
            }, {} as Record<string, typeof rows>);

        return Object.entries(grouped).map(([date, events]) => ({
            date,
            total: events
                .filter(e => e.type === 'financial' && e.amount)
                .reduce((sum, e) => sum + Number((e.amount || '').replace(/[^0-9.-]/g, '')), 0),
            events,
        })).map(group => ({
            ...group,
            total: group.total > 0 ? `+$${group.total.toLocaleString()}` : null,
        }));
    }, [projects]);

    const filteredGroups = activityFeed.map(group => ({
        ...group,
        events: group.events.filter(e => {
            const matchesFilter = filter === 'all' || e.type === filter;
            const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                e.client.toLowerCase().includes(search.toLowerCase()) ||
                e.project.toLowerCase().includes(search.toLowerCase());
            return matchesFilter && matchesSearch;
        })
    })).filter(group => group.events.length > 0);

    const pendingRevenue = projects
        .filter(p => p.status === 'awaiting_payment' || p.status === 'awaiting_signature' || p.status === 'payment_verification')
        .reduce((sum, p) => sum + p.amount, 0);
    const clearedMtd = projects
        .filter(p => (p.status === 'paid' || p.status === 'completed') && new Date(p.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + p.amount, 0);
    const activeVaults = projects.filter(p => p.status !== 'completed').length;
    const awaitingAction = projects.filter(p => p.status === 'awaiting_payment' || p.status === 'awaiting_signature').length;

    return (
        <div className="lg:h-[calc(100vh-140px)] h-auto flex flex-col gap-6 animate-slide-up relative z-10 pb-0">
            {/* Header */}
            <div className="shrink-0 flex flex-col gap-4 border-b border-zinc-200/50 dark:border-white/5 pb-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-sans tracking-tight font-medium text-obsidian dark:text-white">
                            Activity & <span className="text-blue-600 dark:text-brand">Timeline</span>
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-base mt-1">
                            Operational ledger and financial events.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:bg-editorial dark:hover:bg-white/10 transition-colors">
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Layout - Flex Row for Fixed Sidebar + Fluid Content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:overflow-hidden">

                {/* Left: Filters & Metrics Sidebar - Scrollable independently if needed */}
                <div className="lg:w-80 shrink-0 flex flex-col gap-8 lg:overflow-y-auto no-scrollbar pr-2 pb-6">
                    {/* Filters */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">Ledger Filters</h3>
                        <div className="flex flex-col gap-1">
                            {[
                                { id: 'all', label: 'All Activity', icon: ListIcon },
                                { id: 'financial', label: 'Financial', icon: Banknote },
                                { id: 'access', label: 'Client Access', icon: Eye },
                                { id: 'system', label: 'System', icon: Server },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setFilter(item.id as any)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left
                                        ${filter === item.id
                                            ? 'bg-obsidian text-white dark:bg-white dark:text-black shadow-md'
                                            : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-4 h-4 ${filter === item.id ? 'text-blue-400 dark:text-black' : 'text-zinc-400'}`} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Metrics Widgets - Stacked vertically under filters */}
                    <div className="flex flex-col gap-4">
                        {/* Pending Revenue */}
                        <div className="relative p-5 rounded-2xl bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/5 shadow-sm group overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pending Revenue</span>
                                <Clock className="w-4 h-4 text-amber-500" />
                            </div>
                            <PrivacyBlur className="text-2xl font-sans tracking-tight font-medium text-obsidian dark:text-white tracking-tight">${pendingRevenue.toLocaleString()}</PrivacyBlur>
                            <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 font-bold">Locked in active vaults</p>
                        </div>

                        {/* Cleared MTD */}
                        <div className="relative p-5 rounded-2xl bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/5 shadow-sm group overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cleared (MTD)</span>
                                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-brand" />
                            </div>
                            <PrivacyBlur className="text-2xl font-sans tracking-tight font-medium text-obsidian dark:text-white tracking-tight">${clearedMtd.toLocaleString()}</PrivacyBlur>
                            <p className="text-[10px] text-blue-600 dark:text-brand mt-1 font-bold">+12% from last month</p>
                        </div>

                        {/* Active Vaults */}
                        <div className="relative p-5 rounded-2xl bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/5 shadow-sm group overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Vaults</span>
                                <FolderLock className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-sans tracking-tight font-medium text-obsidian dark:text-white tracking-tight">{activeVaults}</div>
                            <p className="text-[10px] text-zinc-500 mt-1 font-bold">{awaitingAction} awaiting client action</p>
                        </div>
                    </div>
                </div>

                {/* Right: Timeline Feed - Fills remaining space, Scrollable internally */}
                <div className="flex-1 h-full min-h-0">
                    <Card hoverEffect={false} className="h-full flex flex-col !p-0 overflow-hidden shadow-sm border border-zinc-200/50 dark:border-white/5">
                        <div className="shrink-0 p-6 border-b border-zinc-200/50 dark:border-white/5 bg-editorial/50 dark:bg-white/[0.02]">
                            <div className="flex justify-between items-center gap-4">
                                <h3 className="font-sans tracking-tight text-lg text-obsidian dark:text-white shrink-0">Transaction Log</h3>

                                {/* SEARCH BAR */}
                                <div className="flex-1 max-w-md relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-brand transition-colors" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search transactions..."
                                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-black/20 border border-zinc-200/50 dark:border-white/10 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-400 placeholder:font-medium"
                                    />
                                </div>

                                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-obsidian dark:hover:text-white transition-colors group">
                                    <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                                    Download Report
                                </button>
                            </div>
                        </div>

                        {/* VISUAL FIX: Added `my-1 mr-1 rounded-2xl` to float the scrollbar inside */}
                        <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none p-6 pr-6 space-y-10 custom-scrollbar relative my-1 mr-1 rounded-2xl">
                            {filteredGroups.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-40">
                                    <Search className="w-12 h-12 mb-4 text-zinc-300" />
                                    <p className="font-medium text-zinc-500">No transactions found</p>
                                </div>
                            ) : (
                                filteredGroups.map((group, groupIdx) => (
                                    <div key={groupIdx}>
                                        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-white/95 dark:bg-charcoal/95 backdrop-blur-md py-2 z-20 -mt-2">
                                            <div className="flex items-baseline gap-2">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">{group.date}</h4>
                                                {group.total && (
                                                    <span className="text-[10px] font-bold text-blue-600 dark:text-brand bg-blue-50 dark:bg-brand/10 px-1.5 py-0.5 rounded border border-blue-100 dark:border-brand/20">
                                                        {group.total}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="h-px bg-zinc-200 dark:bg-white/5 flex-1" />
                                        </div>

                                        <div className="space-y-6">
                                            {group.events.map((event, eventIdx) => (
                                                <div key={event.id} className="flex group">
                                                    <div className="flex flex-col items-center mr-6 relative">
                                                        <div className={`
                                                            w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 border-white dark:border-[#23232e] shadow-sm transition-colors
                                                            ${event.type === 'financial' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-editorial text-zinc-500 dark:bg-white/5 dark:text-zinc-400'}
                                                        `}>
                                                            <event.icon className="w-4 h-4" />
                                                        </div>
                                                        {/* Connector Line */}
                                                        {eventIdx !== group.events.length - 1 && (
                                                            <div className="w-px bg-zinc-200 dark:bg-white/10 absolute top-10 bottom-[-24px]" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 pb-1">
                                                        <div className="flex justify-between items-start p-4 rounded-xl hover:bg-editorial dark:hover:bg-white/5 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/5 transition-all cursor-pointer">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h5 className="font-bold text-obsidian dark:text-white text-sm">{event.title}</h5>
                                                                    {event.status === 'cleared' && <span className="text-[9px] font-bold uppercase bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Cleared</span>}
                                                                    {event.status === 'pending' && <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Pending</span>}
                                                                </div>
                                                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{event.desc || `${event.project} • ${event.client}`}</p>
                                                                <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">{event.client}</p>
                                                            </div>

                                                            {event.amount ? (
                                                                <div className="text-right">
                                                                    <span className={`font-sans tracking-tight text-lg font-medium ${event.amount.startsWith('+') ? 'text-blue-600 dark:text-brand' : 'text-obsidian dark:text-white'}`}>
                                                                        <PrivacyBlur>{event.amount}</PrivacyBlur>
                                                                    </span>
                                                                    <div className="flex justify-end mt-1">
                                                                        <button className="text-[10px] font-bold uppercase text-zinc-400 hover:text-zinc-600 dark:hover:text-white flex items-center gap-1 transition-colors">
                                                                            <Receipt className="w-3 h-3" /> Receipt
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center h-full">
                                                                    <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-brand transition-colors" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ActivityView;

