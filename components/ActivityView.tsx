import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Banknote, Unlock, DollarSign, Eye, Upload, FileText, Link as LinkIcon,
    List as ListIcon, Server, Clock, CheckCircle, FolderLock, Search,
    Download, Receipt, ChevronRight
} from 'lucide-react';
import { Card, GRADIENT_TEXT } from './Shared';

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

const ActivityView = () => {
    const [filter, setFilter] = useState<'all' | 'financial' | 'access' | 'system'>('all');
    const [search, setSearch] = useState('');

    // Grouped by Date for "Editorial" Feel
    const activityFeed = [
        {
            date: 'Today',
            total: '+$2,500.00',
            events: [
                { id: 'ev_1', type: 'financial', title: 'Payment Settled', project: 'Brand Identity', client: 'Vertex Corp', amount: '+$2,500.00', icon: DollarSign, status: 'cleared' },
                { id: 'ev_2', type: 'system', title: 'Vault Unlocked', project: 'Brand Identity', client: 'Vertex Corp', desc: 'Assets released to client', icon: Unlock, status: 'success' },
            ]
        },
        {
            date: 'Yesterday',
            total: null,
            events: [
                { id: 'ev_3', type: 'access', title: 'Client Viewed', project: 'Website Redesign', client: 'Mono', desc: 'Viewed 4 items in vault', icon: Eye, status: 'info' },
                { id: 'ev_4', type: 'system', title: 'File Uploaded', project: 'Q4 Report', client: 'Corp', desc: 'Secure upload (240MB)', icon: Upload, status: 'info' },
            ]
        },
        {
            date: 'Oct 24',
            total: '+$4,200.00',
            events: [
                { id: 'ev_5', type: 'financial', title: 'Invoice Sent', project: 'Website Redesign', client: 'Mono', desc: 'Invoice #1024 delivered', icon: FileText, status: 'pending' },
                { id: 'ev_6', type: 'access', title: 'Link Generated', project: 'Mobile App', client: 'Pearson', desc: 'Secure access token created', icon: LinkIcon, status: 'info' },
            ]
        }
    ];

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

    return (
        <div className="lg:h-[calc(100vh-140px)] h-auto flex flex-col gap-6 animate-slide-up relative z-10 pb-0">
            {/* Header */}
            <div className="shrink-0 flex flex-col gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className={`text-4xl font-serif font-medium tracking-tight ${GRADIENT_TEXT}`}>
                            Activity & <span className="text-lime-600 dark:text-[#bef264]">Timeline</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
                            Operational ledger and financial events.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Layout - Flex Row for Fixed Sidebar + Fluid Content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:overflow-hidden">

                {/* Left: Filters & Metrics Sidebar - Scrollable independently if needed */}
                <div className="lg:w-80 flex-shrink-0 flex flex-col gap-8 lg:overflow-y-auto no-scrollbar pr-2 pb-6">
                    {/* Filters */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-1">Ledger Filters</h3>
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
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md'
                                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-4 h-4 ${filter === item.id ? 'text-lime-400 dark:text-black' : 'text-slate-400'}`} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Metrics Widgets - Stacked vertically under filters */}
                    <div className="flex flex-col gap-4">
                        {/* Pending Revenue */}
                        <div className="relative p-5 rounded-2xl bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 shadow-sm group overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pending Revenue</span>
                                <Clock className="w-4 h-4 text-amber-500" />
                            </div>
                            <PrivacyBlur className="text-2xl font-serif font-medium text-slate-900 dark:text-white tracking-tight">$4,200.00</PrivacyBlur>
                            <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 font-bold">Locked in active vaults</p>
                        </div>

                        {/* Cleared MTD */}
                        <div className="relative p-5 rounded-2xl bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 shadow-sm group overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cleared (MTD)</span>
                                <CheckCircle className="w-4 h-4 text-lime-600 dark:text-[#bef264]" />
                            </div>
                            <PrivacyBlur className="text-2xl font-serif font-medium text-slate-900 dark:text-white tracking-tight">$12,450.00</PrivacyBlur>
                            <p className="text-[10px] text-lime-600 dark:text-[#bef264] mt-1 font-bold">+12% from last month</p>
                        </div>

                        {/* Active Vaults */}
                        <div className="relative p-5 rounded-2xl bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 shadow-sm group overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Vaults</span>
                                <FolderLock className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-serif font-medium text-slate-900 dark:text-white tracking-tight">8</div>
                            <p className="text-[10px] text-slate-500 mt-1 font-bold">3 awaiting client action</p>
                        </div>
                    </div>
                </div>

                {/* Right: Timeline Feed - Fills remaining space, Scrollable internally */}
                <div className="flex-1 h-full min-h-0">
                    <Card hoverEffect={false} className="h-full flex flex-col !p-0 overflow-hidden shadow-sm border border-slate-200 dark:border-white/5">
                        <div className="shrink-0 p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                            <div className="flex justify-between items-center gap-4">
                                <h3 className="font-serif text-lg text-slate-900 dark:text-white shrink-0">Transaction Log</h3>

                                {/* SEARCH BAR */}
                                <div className="flex-1 max-w-md relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-lime-600 dark:group-focus-within:text-[#bef264] transition-colors" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search transactions..."
                                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-lime-500/50 transition-all placeholder:text-slate-400 placeholder:font-medium"
                                    />
                                </div>

                                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group">
                                    <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                                    Download Report
                                </button>
                            </div>
                        </div>

                        {/* VISUAL FIX: Added `my-1 mr-1 rounded-2xl` to float the scrollbar inside */}
                        <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none p-6 pr-6 space-y-10 custom-scrollbar relative my-1 mr-1 rounded-2xl">
                            {filteredGroups.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-40">
                                    <Search className="w-12 h-12 mb-4 text-slate-300" />
                                    <p className="font-medium text-slate-500">No transactions found</p>
                                </div>
                            ) : (
                                filteredGroups.map((group, groupIdx) => (
                                    <div key={groupIdx}>
                                        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-white/95 dark:bg-[#23232e]/95 backdrop-blur-md py-2 z-20 -mt-2">
                                            <div className="flex items-baseline gap-2">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{group.date}</h4>
                                                {group.total && (
                                                    <span className="text-[10px] font-bold text-lime-600 dark:text-[#bef264] bg-lime-50 dark:bg-[#bef264]/10 px-1.5 py-0.5 rounded border border-lime-100 dark:border-[#bef264]/20">
                                                        {group.total}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="h-px bg-slate-100 dark:bg-white/5 flex-1" />
                                        </div>

                                        <div className="space-y-6">
                                            {group.events.map((event, eventIdx) => (
                                                <div key={event.id} className="flex group">
                                                    <div className="flex flex-col items-center mr-6 relative">
                                                        <div className={`
                                                            w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 border-white dark:border-[#23232e] shadow-sm transition-colors
                                                            ${event.type === 'financial' ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400' : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}
                                                        `}>
                                                            <event.icon className="w-4 h-4" />
                                                        </div>
                                                        {/* Connector Line */}
                                                        {eventIdx !== group.events.length - 1 && (
                                                            <div className="w-px bg-slate-200 dark:bg-white/10 absolute top-10 bottom-[-24px]" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 pb-1">
                                                        <div className="flex justify-between items-start p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all cursor-pointer">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h5 className="font-bold text-slate-900 dark:text-white text-sm">{event.title}</h5>
                                                                    {event.status === 'cleared' && <span className="text-[9px] font-bold uppercase bg-lime-100 text-lime-700 px-1.5 py-0.5 rounded">Cleared</span>}
                                                                    {event.status === 'pending' && <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Pending</span>}
                                                                </div>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{event.desc || `${event.project} • ${event.client}`}</p>
                                                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{event.client}</p>
                                                            </div>

                                                            {event.amount ? (
                                                                <div className="text-right">
                                                                    <span className={`font-serif text-lg font-medium ${event.amount.startsWith('+') ? 'text-lime-600 dark:text-[#bef264]' : 'text-slate-900 dark:text-white'}`}>
                                                                        <PrivacyBlur>{event.amount}</PrivacyBlur>
                                                                    </span>
                                                                    <div className="flex justify-end mt-1">
                                                                        <button className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 transition-colors">
                                                                            <Receipt className="w-3 h-3" /> Receipt
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center h-full">
                                                                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-lime-600 dark:group-hover:text-[#bef264] transition-colors" />
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
