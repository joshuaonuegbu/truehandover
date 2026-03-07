import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    TrendingUp, Download, Lock, CheckCircle,
    Activity as ActivityIcon, PieChart, ArrowUpRight,
    FileText, Calendar, ArrowRight, Wallet, ShieldCheck,
    AlertTriangle, FileCheck, FileDigit, Landmark, Clock,
    ChevronDown, Briefcase, FileClock, Filter, Layers,
    Info, Scale
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart as RePieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { GRADIENT_TEXT, Card } from './Shared';
import { useStore } from '../context/StoreContext';
import { DB } from '../services/supabaseClient';
import { playClick } from '../utils/sound';
import { isMockMode } from '../config/mockMode';

// Local constant for noise texture
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

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

const ReportsView = () => {
    const { projects } = useStore();
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('ALL');
    const [excludeOneOffs, setExcludeOneOffs] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
    const [downloadingRights, setDownloadingRights] = useState<string | null>(null);
    const [sendingNudge, setSendingNudge] = useState<string | null>(null);
    const [nudgeMsg, setNudgeMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

    const handleDownloadAuditTrail = async (projectId: string, projectName: string) => {
        if (downloadingPdf) return;
        setDownloadingPdf(projectId);
        try {
            const { blob, error } = await DB.downloadAuditTrail(projectId);
            if (error || !blob) { alert(`Could not generate PDF: ${error ?? 'Unknown error'}`); return; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TrueHandover_AuditTrail_${projectName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } finally { setDownloadingPdf(null); }
    };

    const handleSendNudge = async (projectId: string) => {
        if (sendingNudge) return;
        setSendingNudge(projectId);
        setNudgeMsg(null);
        try {
            const result = await DB.sendNudge(projectId);
            setNudgeMsg({
                id: projectId,
                ok: result.ok,
                text: result.ok ? 'Reminder sent!' : (result.error ?? 'Failed to send'),
            });
            setTimeout(() => setNudgeMsg(null), 4000);
        } finally { setSendingNudge(null); }
    };

    const handleDownloadRightsTransfer = async (projectId: string, projectName: string) => {
        if (downloadingRights) return;
        setDownloadingRights(projectId);
        try {
            const { blob, error } = await DB.downloadRightsTransfer(projectId);
            if (error || !blob) { alert(`Could not generate rights certificate: ${error ?? 'Unknown error'}`); return; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TrueHandover_RightsTransfer_${projectName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setDownloadingRights(null);
        }
    };

    const handleDownloadICS = () => {
        const fmtIcsDate = (iso: string) =>
            new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const escIcs = (s: string) =>
            (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TrueHandover//Delivery Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:TrueHandover Projects',
            'X-WR-CALDESC:Project due dates and payment deadlines from TrueHandover',
        ];

        projects.forEach(p => {
            if (!p.dueDate) return;
            const uid = `truehandover-${p.id}@truehandover.com`;
            const statusLabel = {
                draft: 'Draft',
                awaiting_signature: 'Awaiting Signature',
                awaiting_payment: 'Awaiting Payment',
                payment_verification: 'Payment Verification',
                paid: 'Paid',
                completed: 'Completed',
            }[p.status] ?? p.status;

            lines.push(
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTAMP:${fmtIcsDate(new Date().toISOString())}`,
                `DTSTART;VALUE=DATE:${new Date(p.dueDate).toISOString().slice(0, 10).replace(/-/g, '')}`,
                `DTEND;VALUE=DATE:${new Date(p.dueDate).toISOString().slice(0, 10).replace(/-/g, '')}`,
                `SUMMARY:${escIcs(`${p.name} — ${statusLabel}`)}`,
                `DESCRIPTION:${escIcs(`Client: ${p.client.name}\nValue: $${p.amount.toLocaleString()}\nStatus: ${statusLabel}\nProject ID: ${p.id}`)}`,
                `CATEGORIES:TrueHandover`,
                `STATUS:${['paid', 'completed'].includes(p.status) ? 'COMPLETED' : 'CONFIRMED'}`,
                'END:VEVENT',
            );
        });

        lines.push('END:VCALENDAR');

        const icsContent = lines.join('\r\n');
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TrueHandover_Calendar_${new Date().toISOString().slice(0, 10)}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- DATA PROCESSING ---

    // 1. Chart Data (Capital Flow)
    const processChartData = () => {
        const monthMap = new Map();
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('default', { month: 'short' });
            monthMap.set(key, { name: key, liquid: 0, frozen: 0, total: 0 });
        }
        projects.forEach(p => {
            const date = new Date(p.createdAt);
            const key = date.toLocaleString('default', { month: 'short' });
            if (monthMap.has(key)) {
                const entry = monthMap.get(key);
                const isPaid = p.status === 'paid' || p.status === 'completed';
                if (isPaid) entry.liquid += p.amount;
                else entry.frozen += p.amount;
                entry.total += p.amount;
            }
        });
        return Array.from(monthMap.values());
    };
    const chartData = processChartData();

    // 2. Metrics
    const totalVolume = projects.reduce((sum, p) => sum + p.amount, 0);
    const lockedVolume = projects.filter(p => p.status !== 'paid' && p.status !== 'completed').reduce((sum, p) => sum + p.amount, 0);
    const securedVolume = totalVolume - lockedVolume;
    const unlockRate = totalVolume > 0 ? Math.round((securedVolume / totalVolume) * 100) : 0;

    const potentialProjects = projects.filter(p => p.status === 'draft' || p.status === 'awaiting_signature');
    const potentialValue = potentialProjects.reduce((sum, p) => sum + p.amount, 0);

    // 3. Client Concentration (Revenue Intelligence)
    const clientRevenue: Record<string, number> = {};
    let totalRevenue = 0;

    // Optional filter: treat projects under $500 as one-offs
    const relevantProjects = excludeOneOffs
        ? projects.filter(p => p.amount > 500)
        : projects;

    relevantProjects.forEach(p => {
        const clientName = p.client.name || 'Unknown';
        clientRevenue[clientName] = (clientRevenue[clientName] || 0) + p.amount;
        totalRevenue += p.amount;
    });

    const topClientEntry = Object.entries(clientRevenue).sort(([, a], [, b]) => b - a)[0];
    const topClientName = topClientEntry ? topClientEntry[0] : 'None';
    const topClientAmount = topClientEntry ? topClientEntry[1] : 0;
    const concentrationPct = totalRevenue > 0 ? Math.round((topClientAmount / totalRevenue) * 100) : 0;

    // Calculate Diversity Score (Simple inverse of concentration, clamped)
    // 100% concentration = 0 Diversity. 20% concentration = 80 Diversity (Excellent).
    const diversityScore = Math.max(0, Math.min(100, 100 - (concentrationPct - 20))); // Normalize

    const pieData = Object.entries(clientRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const latestLiquid = chartData[chartData.length - 1]?.liquid || 0;
    const previousLiquid = chartData[chartData.length - 2]?.liquid || 0;
    const trendPct = previousLiquid > 0
        ? ((latestLiquid - previousLiquid) / previousLiquid) * 100
        : (latestLiquid > 0 ? 100 : 0);
    const trendLabel = `${trendPct >= 0 ? '+' : ''}${trendPct.toFixed(1)}%`;
    const trendIsPositive = trendPct >= 0;
    const statementMonths = Array.from({ length: 3 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    });

    const COLORS = ['#bef264', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

    // 4. Evidence Locker Data (Recent Transactions)
    const mappedProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        client: p.client.name,
        date: new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        status: p.status === 'paid' ? 'Secured' : 'Locked',
        originalStatus: p.status,
        amount: p.amount,
        hash: 'e3b0...' + p.id.substring(0, 4),
        isReal: true,
    }));

    // Keep extra demo-only rows only when mock mode is enabled.
    const mockLogs = isMockMode() ? [
        { id: 'm1', name: 'Legacy Archive 2022', client: 'Acme Corp', date: 'Oct 12', status: 'Secured', amount: 12500, hash: 'a1b2...9988' },
        { id: 'm2', name: 'Q3 Asset Bundle', client: 'Stark Ind', date: 'Sep 28', status: 'Secured', amount: 8400, hash: 'c3d4...7766' },
        { id: 'm3', name: 'Preliminary Sketches', client: 'Wayne Ent', date: 'Sep 15', status: 'Locked', amount: 3200, hash: 'e5f6...5544' },
        { id: 'm4', name: 'Consultation Record', client: 'Cyberdyne', date: 'Aug 30', status: 'Secured', amount: 1500, hash: 'g7h8...3322' },
        { id: 'm5', name: 'System Audit Log', client: 'Internal', date: 'Aug 12', status: 'Secured', amount: 0, hash: 'i9j0...1100' },
        { id: 'm6', name: 'Beta Access Keys', client: 'Tyrell Corp', date: 'Jul 22', status: 'Locked', amount: 5000, hash: 'k1l2...3344' },
    ] : [];

    const evidenceProjects = [...mappedProjects, ...mockLogs];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-2xl min-w-[200px]">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-bold text-slate-700 dark:text-white capitalize">
                                    {entry.name === 'liquid' ? 'Cash Flow' : entry.name === 'frozen' ? 'Vault Locked' : entry.name}
                                </span>
                            </div>
                            <span className="font-mono text-xs font-bold text-obsidian dark:text-white">
                                ${entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="animate-slide-up relative z-10 pb-24 w-full">

            {/* Header Area */}
            <div className="flex flex-col gap-6 border-b border-slate-200 dark:border-white/5 pb-8 mb-12">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h2 className={`text-4xl font-serif font-medium tracking-tight ${GRADIENT_TEXT}`}>
                            Financial <span className="text-lime-600 dark:text-brand">Reports</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
                            Fiscal performance, pipeline analysis, and compliance records.
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-1 bg-slate-200 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                            {['6M', 'YTD', 'ALL'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => { playClick(); setTimeRange(range); }}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${timeRange === range ? 'bg-white dark:bg-white/10 shadow-sm text-obsidian dark:text-white' : 'text-slate-500 hover:text-obsidian dark:hover:text-white'}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                        <button className="px-5 py-2.5 rounded-xl bg-obsidian dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2">
                            <Download className="w-3.5 h-3.5" /> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* --- SECTION 1: THE SUMMARY (Hero Stats — Redesigned) --- */}
            <div className="relative p-6 lg:p-10 rounded-[2rem] bg-white dark:bg-charcoal border border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-md overflow-hidden">
                {/* Subtle grain texture */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-lime-300/10 dark:bg-brand/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative z-10">
                    <div className="flex flex-col justify-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 block border-l-2 border-lime-500 dark:border-brand pl-3">Net Revenue (Secured)</span>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-2xl lg:text-4xl font-serif text-slate-400 dark:text-slate-500 self-start mt-2">$</span>
                            <PrivacyBlur strength="strong" className="text-7xl lg:text-9xl font-serif font-medium text-obsidian dark:text-white tracking-tighter leading-[0.85]">
                                {securedVolume.toLocaleString()}
                            </PrivacyBlur>
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${trendIsPositive ? 'text-lime-600 dark:text-brand bg-lime-100 dark:bg-brand/10' : 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20'}`}>
                                <ArrowUpRight className={`w-3 h-3 ${trendIsPositive ? '' : 'rotate-90'}`} /> {trendLabel}
                            </span>
                            <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">vs Previous Month</span>
                        </div>
                    </div>

                    {/* Mini Stats - Action Center Widget Style */}
                    <div className="grid grid-cols-2 gap-3 self-end">
                        <div className="bg-editorial dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] p-6 lg:p-8 rounded-2xl flex flex-col justify-between h-40 group hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Pending</span>
                                <div className="p-2 rounded-xl bg-amber-500/10">
                                    <Lock className="w-4 h-4 text-amber-500" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-serif text-obsidian dark:text-white mb-1"><PrivacyBlur>${lockedVolume.toLocaleString()}</PrivacyBlur></div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Locked in Vault</div>
                            </div>
                        </div>
                        <div className="bg-editorial dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] p-6 lg:p-8 rounded-2xl flex flex-col justify-between h-40 group hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Liquidity</span>
                                <div className="p-2 rounded-xl bg-slate-200 dark:bg-white/5">
                                    <ActivityIcon className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-serif text-obsidian dark:text-white mb-1">{unlockRate}%</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Conversion Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-slate-200 dark:bg-white/5 mb-16" />

            {/* --- SECTION 2: FORWARD LOOKING STATEMENTS (Capital Flow & Risk) --- */}
            <div className="mb-24">
                <div className="flex items-end justify-between mb-8">
                    <h3 className={`font-serif text-3xl tracking-tight ${GRADIENT_TEXT}`}>Analysis & Projections</h3>
                    <div className="hidden md:flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-lime-600 dark:bg-brand rounded-full" /> Liquid (Paid)</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full" /> Frozen (Locked)</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Capital Flow Engine (Area Chart) */}
                    <div className="lg:col-span-2">
                        <div className="h-[400px] w-full bg-white dark:bg-charcoal border border-slate-200 dark:border-white/5 rounded-none lg:rounded-[2rem] p-6 relative overflow-hidden group mb-8 shadow-sm dark:shadow-md">
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: NOISE_SVG }}></div>

                            {/* Header within Graph for Context */}
                            <div className="absolute top-6 left-6 z-10">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Capital Flow Engine</h4>
                                <p className="text-[10px] text-slate-400">Cumulative liquidity trend over 6 months.</p>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 60, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLiquid" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#bef264" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#bef264" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorFrozen" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                                        tickFormatter={(val) => val.toString().toUpperCase()}
                                        dy={10}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="liquid"
                                        stackId="1"
                                        stroke="#bef264"
                                        strokeWidth={3}
                                        fill="url(#colorLiquid)"
                                        animationDuration={1500}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="frozen"
                                        stackId="1"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        fill="url(#colorFrozen)"
                                        strokeDasharray="4 4"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Forecast / Pipeline Card */}
                        <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-editorial dark:bg-white/[0.03] rounded-xl border border-dashed border-slate-200 dark:border-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: NOISE_SVG }}></div>

                            <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 shrink-0">
                                <Briefcase className="w-6 h-6 text-slate-400" />
                            </div>

                            <div className="flex-1">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Projected Pipeline</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-serif font-bold text-obsidian dark:text-white">
                                        <PrivacyBlur>${potentialValue.toLocaleString()}</PrivacyBlur>
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">in negotiation (Drafts)</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-lg">
                                    Contracts currently in draft or awaiting signature. These represent potential future capital not yet reflected in the chart above.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Intelligence Column */}
                    <div className="lg:col-span-1 border-l border-slate-200 dark:border-white/5 pl-0 lg:pl-12 py-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-slate-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Revenue Intelligence</span>
                                </div>
                                <button
                                    onClick={() => setExcludeOneOffs(!excludeOneOffs)}
                                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${excludeOneOffs ? 'bg-lime-600 text-white dark:bg-brand dark:text-black' : 'bg-slate-200 text-slate-500 dark:bg-white/10'}`}
                                    title="Toggle to exclude projects under $500"
                                >
                                    {excludeOneOffs ? 'Recurring Only' : 'All Sources'}
                                </button>
                            </div>

                            {/* Diversity Score Meter */}
                            <div className="mb-8">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Portfolio Diversity</span>
                                    <span className={`text-lg font-bold ${diversityScore > 70 ? 'text-lime-600 dark:text-brand' : diversityScore > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {diversityScore}/100
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out ${diversityScore > 70 ? 'bg-lime-500' : diversityScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${diversityScore}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                    {diversityScore > 75
                                        ? "Excellent balance. You are not dependent on any single client."
                                        : diversityScore > 40
                                            ? "Moderate risk. One client makes up a significant portion of revenue."
                                            : "High risk. Revenue is heavily concentrated on a single source."}
                                </p>
                            </div>

                            {/* Stock Ticker Style List */}
                            <div className="space-y-4">
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10 pb-2">
                                    <span>Source</span>
                                    <span>Share</span>
                                </div>
                                {pieData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className="text-[10px] font-mono text-slate-300 w-3">{i + 1}</div>
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                            <span className="text-sm font-bold text-obsidian dark:text-white group-hover:text-lime-600 dark:group-hover:text-brand transition-colors">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono font-medium text-slate-500">${item.value.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded min-w-[36px] text-center">
                                                {Math.round((item.value / totalRevenue) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legal Disclaimer for Intelligence */}
                        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-white/5">
                            <div className="flex items-start gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-help">
                                <Info className="w-3 h-3 text-slate-400 mt-0.5" />
                                <p className="text-[9px] text-slate-400 leading-relaxed">
                                    Calculations are estimates based on active project values. This data is for informational purposes only and does not constitute financial or investment advice.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: AUDIT LOG & EVIDENCE --- */}
            <div className="mb-24">
                <div className="flex items-end justify-between mb-8 border-b border-slate-200 dark:border-white/5 pb-4">
                    <div className="flex flex-col gap-1">
                        <h3 className={`font-serif text-3xl tracking-tight ${GRADIENT_TEXT}`}>Audit Log</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Immutable transaction records for dispute resolution and evidence.</p>
                    </div>
                    <button className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-obsidian dark:hover:text-white transition-colors flex items-center gap-2 group">
                        View Full Ledger <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md overflow-hidden bg-white dark:bg-charcoal">
                    <div className="overflow-y-auto max-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-editorial dark:bg-charcoal shadow-sm">
                                <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-obsidian dark:text-white">
                                    <th className="py-4 pl-6 pr-4 w-32 bg-editorial dark:bg-charcoal">Date</th>
                                    <th className="py-4 px-4 w-1/4 bg-editorial dark:bg-charcoal">Project</th>
                                    <th className="py-4 px-4 bg-editorial dark:bg-charcoal">Client</th>
                                    <th className="py-4 px-4 bg-editorial dark:bg-charcoal">Status</th>
                                    <th className="py-4 px-4 hidden md:table-cell bg-editorial dark:bg-charcoal">Cryptographic Hash</th>
                                    <th className="py-4 px-4 text-right bg-editorial dark:bg-charcoal">Amount</th>
                                    <th className="py-4 pl-4 pr-6 text-right w-40 bg-editorial dark:bg-charcoal">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm font-medium">
                                {evidenceProjects.map((item, i) => (
                                    <tr key={item.id} className="group hover:bg-editorial dark:hover:bg-white/5 transition-colors">
                                        <td className="py-5 pl-6 pr-4 font-mono text-xs text-slate-500">{item.date}</td>
                                        <td className="py-5 px-4 font-bold text-obsidian dark:text-white">{item.name}</td>
                                        <td className="py-5 px-4 text-slate-600 dark:text-slate-300">{item.client}</td>
                                        <td className="py-5 px-4">
                                            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Secured' ? 'bg-lime-100 text-lime-600 dark:bg-brand/10 dark:text-brand' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                {item.status === 'Secured' ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                                {item.status}
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 hidden md:table-cell font-mono text-[10px] text-slate-400">{item.hash}</td>
                                        <td className="py-5 px-4 text-right font-serif text-base text-obsidian dark:text-white">
                                            <PrivacyBlur>${item.amount.toLocaleString()}</PrivacyBlur>
                                        </td>
                                        <td className="py-5 pl-4 text-right pr-6">
                                            <div className="flex flex-col gap-1.5">
                                                {(item as any).isReal ? (
                                                    <button
                                                        title="Download Audit Trail PDF"
                                                        disabled={downloadingPdf === item.id}
                                                        onClick={() => handleDownloadAuditTrail(item.id, item.name)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-editorial dark:hover:bg-white/10 hover:text-obsidian dark:hover:text-white transition-colors shadow-sm group/btn w-full justify-center disabled:opacity-50 disabled:cursor-wait"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-obsidian dark:group-hover/btn:text-white" />
                                                        {downloadingPdf === item.id ? 'Generating…' : 'Audit Trail PDF'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        title="Demo row — no PDF"
                                                        disabled
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-colors shadow-sm group/btn w-full justify-center opacity-40 cursor-not-allowed"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        Demo Row
                                                    </button>
                                                )}
                                                {(item as any).isReal && (item as any).originalStatus === 'awaiting_payment' && (
                                                    <button
                                                        title="Send payment reminder to client"
                                                        disabled={sendingNudge === item.id}
                                                        onClick={() => handleSendNudge(item.id)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm group/btn w-full justify-center disabled:opacity-50 disabled:cursor-wait bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                                    >
                                                        {sendingNudge === item.id ? 'Sending…' : nudgeMsg?.id === item.id ? (nudgeMsg.ok ? '✓ Sent!' : '✗ Failed') : 'Send Reminder'}
                                                    </button>
                                                )}
                                                {(item as any).isReal && ((item as any).originalStatus === 'paid' || (item as any).originalStatus === 'completed') && (
                                                    <button
                                                        title="Download Rights Transfer Certificate"
                                                        disabled={downloadingRights === item.id}
                                                        onClick={() => handleDownloadRightsTransfer(item.id, item.name)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm group/btn w-full justify-center disabled:opacity-50 disabled:cursor-wait bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-700/30 text-lime-700 dark:text-lime-400 hover:bg-lime-100 dark:hover:bg-lime-900/40"
                                                    >
                                                        <FileCheck className="w-3.5 h-3.5" />
                                                        {downloadingRights === item.id ? 'Generating…' : 'Rights Certificate'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chain of Custody Note */}
                <div className="mt-4 p-4 bg-editorial dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 flex items-start gap-3">
                    <Scale className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Chain of Custody</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl">
                            Evidence Packs contain immutable access logs including IP addresses, timestamps, and file hash verifications.
                            While TrueHandover provides this data to support dispute resolution, we do not guarantee its admissibility in legal proceedings.
                            Consult with a legal professional regarding specific jurisdiction requirements.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- SECTION 4: FILINGS & EXPORTS (The "Documents" Tab) --- */}
            <div>
                <h3 className={`font-serif text-3xl mb-8 tracking-tight ${GRADIENT_TEXT}`}>Filings & Exports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Monthly Statements */}
                    <div className="p-8 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm dark:shadow-md flex flex-col justify-between bg-white dark:bg-charcoal relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-50"><FileDigit className="w-12 h-12 text-slate-100 dark:text-white/5 -rotate-12" /></div>
                        <div className="relative z-10">
                            <h4 className="font-serif text-xl font-bold text-obsidian dark:text-white mb-2">Monthly Statement</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Consolidated earnings report for accounting and reconciliation purposes.</p>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <select className="w-full appearance-none bg-editorial dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold px-4 py-3 outline-none text-obsidian dark:text-white cursor-pointer hover:border-slate-200 transition-colors">
                                        {statementMonths.map((label) => (
                                            <option key={label} className="bg-white dark:bg-charcoal text-obsidian dark:text-white">{label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <button className="flex items-center gap-2 px-5 py-3 bg-obsidian dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg">
                                    Download <Download className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tax Ledger */}
                    <div className="p-8 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm dark:shadow-md flex flex-col justify-between bg-white dark:bg-charcoal relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-50"><Landmark className="w-12 h-12 text-slate-100 dark:text-white/5 -rotate-12" /></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-serif text-xl font-bold text-obsidian dark:text-white mb-2">Tax Ledger (FY {new Date().getFullYear()})</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Fiscal year transaction export formatted for tax filing software.</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase bg-slate-200 dark:bg-white/10 text-slate-500 px-2 py-1 rounded">CSV</span>
                            </div>
                            <button className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-editorial dark:hover:bg-white/5 transition-colors group/btn">
                                Export Annual Ledger <Download className="w-3.5 h-3.5 group-hover/btn:translate-y-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Feed */}
                    <div className="p-8 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm dark:shadow-md flex flex-col justify-between bg-white dark:bg-charcoal relative overflow-hidden group col-span-full md:col-span-1">
                        <div className="absolute top-0 right-0 p-6 opacity-50"><Calendar className="w-12 h-12 text-slate-100 dark:text-white/5 -rotate-12" /></div>
                        <div className="relative z-10">
                            <h4 className="font-serif text-xl font-bold text-obsidian dark:text-white mb-2">Calendar Feed</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                                Download an .ics file of all project due dates. Import into Google Calendar, Apple Calendar, or Outlook.
                            </p>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-lime-500" />
                                    {projects.filter(p => p.dueDate).length} events
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadICS}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-obsidian dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg group/btn"
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                Download .ics File
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Note */}
            <div className="mt-24 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400">
                <div className="flex items-center gap-2 font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" />
                    Generated by TrueHandover Financial Engine
                </div>
                <div className="max-w-md text-right opacity-60">
                    <p className="leading-tight">
                        TrueHandover Inc. acts as a technical intermediary and does not provide legal, tax, or financial advice.
                        Users are responsible for their own tax compliance and contract enforcement.
                    </p>
                </div>
            </div>

        </div>
    );
};

export default ReportsView;
