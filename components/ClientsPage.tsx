import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, TrendingUp, ArrowUpRight, ChevronRight,
    ArrowRight, Search, SortAsc, Briefcase,
    Clock, CheckCircle, AlertCircle, Star,
    DollarSign, Calendar, Mail, Phone, Building2,
    LayoutGrid, List as ListIcon, ChevronDown, ChevronUp, Link as LinkIcon, Copy, Palette,
} from 'lucide-react';
import { GRADIENT_TEXT } from './Shared';
import { useStore } from '../context/StoreContext';
import { DB } from '../services/supabaseClient';
import { Project } from '../types';
import { playClick } from '../utils/sound';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Per-client summary ───────────────────────────────────────────────────────
interface ClientSummary {
    email: string;
    name: string;
    company?: string;
    phone?: string;
    avatar?: string;
    projects: Project[];
    ltv: number;                  // paid + completed
    pendingValue: number;         // awaiting_payment
    totalProjects: number;
    paidProjects: number;
    activeProjects: number;
    avgDeal: number;
    lastProjectDate: string;      // ISO of most recent project
    needsNudge: boolean;          // any awaiting_payment project
}

function buildClientSummaries(projects: Project[]): ClientSummary[] {
    const map = new Map<string, Project[]>();

    for (const p of projects) {
        const key = (p.client.email || p.client.name || 'unknown').toLowerCase().trim();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
    }

    return Array.from(map.entries()).map(([, clientProjects]) => {
        const ref = clientProjects[0].client;
        const paid = clientProjects.filter(p => p.status === 'paid' || p.status === 'completed');
        const pending = clientProjects.filter(p => p.status === 'awaiting_payment');
        const active = clientProjects.filter(p =>
            !['paid', 'completed'].includes(p.status));
        const ltv = paid.reduce((sum, p) => sum + p.amount, 0);
        const pendingValue = pending.reduce((sum, p) => sum + p.amount, 0);
        const sorted = [...clientProjects].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return {
            email: ref.email || '',
            name: ref.name || 'Unknown',
            company: ref.company,
            phone: ref.phone,
            avatar: ref.avatar,
            projects: sorted,
            ltv,
            pendingValue,
            totalProjects: clientProjects.length,
            paidProjects: paid.length,
            activeProjects: active.length,
            avgDeal: clientProjects.length > 0 ? Math.round((ltv + pendingValue) / clientProjects.length) : 0,
            lastProjectDate: sorted[0]?.createdAt ?? '',
            needsNudge: pending.length > 0,
        };
    });
}

// ─── Tier badge ───────────────────────────────────────────────────────────────
function ClientTier({ ltv }: { ltv: number }) {
    if (ltv >= 10000) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30">
            <Star className="w-2.5 h-2.5" /> Platinum
        </span>
    );
    if (ltv >= 5000) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white border border-slate-300 dark:border-white/10">
            <Star className="w-2.5 h-2.5" /> Gold
        </span>
    );
    if (ltv >= 1000) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400 border border-lime-200 dark:border-lime-700/30">
            <Star className="w-2.5 h-2.5" /> Silver
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/10">
            New
        </span>
    );
}

// ─── Project row inside expanded card ────────────────────────────────────────
function ProjectRow({ project, onNavigate, onNudge, isNudging }: {
    project: Project;
    onNavigate: (id: string) => void;
    onNudge: (id: string) => void;
    isNudging: boolean;
}) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        draft: { label: 'Draft', className: 'text-slate-500 bg-slate-100 dark:bg-white/5 dark:text-slate-400' },
        awaiting_signature: { label: 'Awaiting Sig.', className: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' },
        awaiting_payment: { label: 'Awaiting Payment', className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
        payment_verification: { label: 'Verifying', className: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
        paid: { label: 'Paid', className: 'text-lime-700 bg-lime-50 dark:bg-lime-900/20 dark:text-lime-400' },
        completed: { label: 'Completed', className: 'text-lime-700 bg-lime-50 dark:bg-lime-900/20 dark:text-lime-400' },
    };
    const cfg = statusConfig[project.status] || statusConfig.draft;

    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5 last:border-0 group/row">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex flex-col min-w-0">
                    <button
                        onClick={() => onNavigate(project.id)}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-lime-600 dark:hover:text-lime-400 text-left truncate transition-colors"
                    >
                        {project.name}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {fmtDate(project.createdAt)}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.className}`}>
                    {cfg.label}
                </span>
                <span className="font-serif text-sm font-medium text-slate-900 dark:text-white hidden sm:block min-w-[70px] text-right">
                    {fmtCurrency(project.amount)}
                </span>
                {project.status === 'awaiting_payment' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onNudge(project.id); }}
                        disabled={isNudging}
                        title="Send payment reminder"
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 shrink-0"
                    >
                        {isNudging ? '…' : 'Nudge'}
                    </button>
                )}
                <button
                    onClick={() => onNavigate(project.id)}
                    className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1"
                >
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
            </div>
        </div>
    );
}

// ─── Client Card ─────────────────────────────────────────────────────────────
function ClientCard({
    client,
    brandKit,
    onSaveBrandKit,
}: {
    client: ClientSummary;
    brandKit?: { primaryColor?: string; accentColor?: string; logoUrl?: string; notes?: string };
    onSaveBrandKit: (email: string, kit: { primaryColor?: string; accentColor?: string; logoUrl?: string; notes?: string }) => Promise<void>;
}) {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const [nudgingId, setNudgingId] = useState<string | null>(null);
    const [nudgeResult, setNudgeResult] = useState<{ id: string; ok: boolean } | null>(null);
    const [showBrandKit, setShowBrandKit] = useState(false);
    const [retainerBusy, setRetainerBusy] = useState(false);
    const [retainerMsg, setRetainerMsg] = useState<string | null>(null);
    const [portalBusy, setPortalBusy] = useState(false);
    const [portalUrl, setPortalUrl] = useState<string>('');
    const [kitDraft, setKitDraft] = useState({
        primaryColor: brandKit?.primaryColor || '#84cc16',
        accentColor: brandKit?.accentColor || '#0f172a',
        logoUrl: brandKit?.logoUrl || '',
        notes: brandKit?.notes || '',
    });

    useEffect(() => {
        setKitDraft({
            primaryColor: brandKit?.primaryColor || '#84cc16',
            accentColor: brandKit?.accentColor || '#0f172a',
            logoUrl: brandKit?.logoUrl || '',
            notes: brandKit?.notes || '',
        });
    }, [brandKit?.primaryColor, brandKit?.accentColor, brandKit?.logoUrl, brandKit?.notes]);

    const handleNudge = async (projectId: string) => {
        if (nudgingId) return;
        setNudgingId(projectId);
        const result = await DB.sendNudge(projectId);
        setNudgeResult({ id: projectId, ok: result.ok });
        setTimeout(() => setNudgeResult(null), 3000);
        setNudgingId(null);
    };

    const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const handleCreateRetainer = async () => {
        if (!client.email || retainerBusy) return;
        const amountInput = window.prompt('Monthly retainer amount (USD):', String(Math.max(100, Math.round(client.avgDeal || 500))));
        if (!amountInput) return;
        const amount = Number(amountInput);
        if (!Number.isFinite(amount) || amount <= 0) {
            setRetainerMsg('Invalid amount.');
            return;
        }

        const intervalInput = (window.prompt('Billing interval (week / month / year):', 'month') || 'month').toLowerCase();
        const interval = (intervalInput === 'week' || intervalInput === 'year') ? intervalInput : 'month';

        setRetainerBusy(true);
        setRetainerMsg(null);
        const result = await DB.createRetainerLink({
            clientName: client.name,
            clientEmail: client.email,
            amount,
            interval: interval as 'week' | 'month' | 'year',
        });
        setRetainerBusy(false);
        if (!result.ok || !result.url) {
            setRetainerMsg(result.error || 'Could not generate link.');
            return;
        }
        try { await navigator.clipboard.writeText(result.url); } catch { }
        window.open(result.url, '_blank', 'noopener,noreferrer');
        setRetainerMsg('Retainer link created and copied.');
    };

    const ensurePortalUrl = async () => {
        if (portalUrl) return portalUrl;
        if (!client.email || portalBusy) return '';

        setPortalBusy(true);
        setRetainerMsg(null);
        const result = await DB.createClientPortalToken(client.email, 365);
        setPortalBusy(false);

        if (!result.ok || !result.token) {
            setRetainerMsg(result.error || 'Could not generate portal link.');
            return '';
        }

        const url = `${window.location.origin}/portal/${result.token}`;
        setPortalUrl(url);
        return url;
    };

    const copyPortalUrl = async () => {
        const url = await ensurePortalUrl();
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setRetainerMsg('Portal link copied.');
        } catch {
            setRetainerMsg('Could not copy link.');
        }
    };

    const openPortal = async () => {
        const url = await ensurePortalUrl();
        if (!url) return;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="bg-white dark:bg-charcoal border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden hover:border-slate-300 dark:hover:border-white/10 transition-all hover:shadow-lg group">
            {/* Main row */}
            <div className="p-6">
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="shrink-0">
                        {client.avatar ? (
                            <img
                                src={client.avatar}
                                alt={client.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-white/10 dark:to-white/5 flex items-center justify-center font-serif text-lg font-bold text-slate-600 dark:text-slate-300">
                                {initials}
                            </div>
                        )}
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                                {client.name}
                            </h3>
                            <ClientTier ltv={client.ltv} />
                            {client.needsNudge && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30 animate-pulse">
                                    <AlertCircle className="w-2.5 h-2.5" /> Payment Due
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            {client.company && (
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3" /> {client.company}
                                </span>
                            )}
                            {client.email && (
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" />
                                    <a href={`mailto:${client.email}`} className="hover:text-lime-600 dark:hover:text-lime-400 transition-colors" onClick={e => e.stopPropagation()}>
                                        {client.email}
                                    </a>
                                </span>
                            )}
                            {client.phone && (
                                <span className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3" /> {client.phone}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* LTV */}
                    <div className="shrink-0 text-right hidden sm:block">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Lifetime Value</div>
                        <div className={`font-serif text-2xl font-medium tracking-tight ${GRADIENT_TEXT}`}>
                            {fmtCurrency(client.ltv)}
                        </div>
                        {client.pendingValue > 0 && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                +{fmtCurrency(client.pendingValue)} pending
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-white/5">
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Projects</div>
                        <div className="text-xl font-serif font-medium text-slate-900 dark:text-white">{client.totalProjects}</div>
                    </div>
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Paid</div>
                        <div className="text-xl font-serif font-medium text-lime-600 dark:text-lime-400">{client.paidProjects}</div>
                    </div>
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Avg. Deal</div>
                        <div className="text-xl font-serif font-medium text-slate-900 dark:text-white">{fmtCurrency(client.avgDeal)}</div>
                    </div>
                    <div className="hidden sm:block">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Last Active</div>
                        <div className="text-sm font-mono text-slate-600 dark:text-slate-300">
                            {client.lastProjectDate ? fmtDate(client.lastProjectDate) : '—'}
                        </div>
                    </div>
                </div>

                {/* Expand toggle */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => { playClick(); setExpanded(e => !e); }}
                        className="flex-1 min-w-[170px] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors group/toggle px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10"
                    >
                        <span>{expanded ? 'Hide' : 'View'} {client.totalProjects} Project{client.totalProjects !== 1 ? 's' : ''}</span>
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 group-hover/toggle:translate-y-0.5 transition-transform" />}
                    </button>

                    <button
                        onClick={copyPortalUrl}
                        disabled={portalBusy || !client.email}
                        className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40"
                        title="Copy client portal link"
                    >
                        <Copy className="w-3.5 h-3.5 inline mr-1" /> {portalBusy ? '...' : 'Portal'}
                    </button>

                    <button
                        onClick={openPortal}
                        disabled={portalBusy || !client.email}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${client.email ? 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5' : 'border-slate-200 text-slate-400 opacity-40'} disabled:opacity-40`}
                        title="Open client portal"
                    >
                        <LinkIcon className="w-3.5 h-3.5 inline mr-1" /> Open
                    </button>

                    <button
                        onClick={handleCreateRetainer}
                        disabled={retainerBusy || !client.email}
                        className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-lime-300 dark:border-lime-600/40 text-lime-700 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 disabled:opacity-50"
                        title="Generate recurring Stripe retainer link"
                    >
                        {retainerBusy ? 'Generating…' : 'Retainer Link'}
                    </button>

                    <button
                        onClick={() => setShowBrandKit(v => !v)}
                        className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                        title="Save reusable brand kit for this client"
                    >
                        <Palette className="w-3.5 h-3.5 inline mr-1" /> Brand Kit
                    </button>
                </div>

                {retainerMsg && (
                    <div className="mt-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">{retainerMsg}</div>
                )}

                {showBrandKit && (
                    <div className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Hex</label>
                                <input
                                    value={kitDraft.primaryColor}
                                    onChange={(e) => setKitDraft({ ...kitDraft, primaryColor: e.target.value })}
                                    className="mt-1 w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs"
                                    placeholder="#84cc16"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accent Hex</label>
                                <input
                                    value={kitDraft.accentColor}
                                    onChange={(e) => setKitDraft({ ...kitDraft, accentColor: e.target.value })}
                                    className="mt-1 w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs"
                                    placeholder="#0f172a"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logo URL (optional)</label>
                            <input
                                value={kitDraft.logoUrl}
                                onChange={(e) => setKitDraft({ ...kitDraft, logoUrl: e.target.value })}
                                className="mt-1 w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs"
                                placeholder="https://.../logo.png"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowBrandKit(false)}
                                className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/10"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => onSaveBrandKit(client.email, kitDraft)}
                                disabled={!client.email}
                                className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-lime-600 text-white dark:bg-lime-500 border border-lime-600"
                            >
                                Save Kit
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Expanded projects list */}
            {expanded && (
                <div className="border-t border-slate-100 dark:border-white/5 px-6 pb-4 pt-2 bg-slate-50/50 dark:bg-white/[0.02]">
                    {nudgeResult && (
                        <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-bold ${nudgeResult.ok ? 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                            {nudgeResult.ok ? '✓ Reminder sent successfully.' : '✗ Could not send reminder — check Resend API key.'}
                        </div>
                    )}
                    {client.projects.map(p => (
                        <ProjectRow
                            key={p.id}
                            project={p}
                            onNavigate={(id) => navigate(`/preview/${id}`)}
                            onNudge={handleNudge}
                            isNudging={nudgingId === p.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Summary stat card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'lime' }: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    color?: 'lime' | 'amber' | 'blue' | 'slate';
}) {
    const colorMap = {
        lime: 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        slate: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400',
    };
    return (
        <div className="bg-white dark:bg-charcoal border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md rounded-[2rem] p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</div>
                <div className="font-serif text-2xl font-medium text-slate-900 dark:text-white leading-none">{value}</div>
                {sub && <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{sub}</div>}
            </div>
        </div>
    );
}

// ─── Shared logic extracted so both the old page and the embedded view can use it ─
function useClientRolodexState() {
    const { projects, user, updateUser } = useStore();
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'ltv' | 'name' | 'projects' | 'recent'>('ltv');

    const clients = useMemo(() => buildClientSummaries(projects), [projects]);
    const totalLTV = clients.reduce((s, c) => s + c.ltv, 0);
    const totalPending = clients.reduce((s, c) => s + c.pendingValue, 0);
    const topClient = [...clients].sort((a, b) => b.ltv - a.ltv)[0];
    const nudgeCount = clients.filter(c => c.needsNudge).length;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return clients
            .filter(c =>
                !q ||
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                (c.company?.toLowerCase().includes(q) ?? false)
            )
            .sort((a, b) => {
                if (sortBy === 'ltv') return b.ltv - a.ltv;
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'projects') return b.totalProjects - a.totalProjects;
                if (sortBy === 'recent') return new Date(b.lastProjectDate).getTime() - new Date(a.lastProjectDate).getTime();
                return 0;
            });
    }, [clients, search, sortBy]);

    const saveBrandKit = async (email: string, kit: { primaryColor?: string; accentColor?: string; logoUrl?: string; notes?: string }) => {
        const normalizedEmail = (email || '').trim().toLowerCase();
        if (!normalizedEmail) return;
        const nextAgencySettings = {
            ...(user.agencySettings || {
                cname: '',
                cnameVerified: false,
                customSmtp: false,
                removeBranding: false,
                dataRetentionDays: 30,
                supportEmail: user.email,
            }),
            brandKits: {
                ...(user.agencySettings?.brandKits || {}),
                [normalizedEmail]: {
                    ...(user.agencySettings?.brandKits?.[normalizedEmail] || {}),
                    ...kit,
                    updatedAt: new Date().toISOString(),
                },
            },
        };
        await updateUser({ agencySettings: nextAgencySettings as any });
    };

    return { clients, totalLTV, totalPending, topClient, nudgeCount, filtered, search, setSearch, sortBy, setSortBy, saveBrandKit, user };
}

// ─── Embeddable content — used inside the Dashboard toggle ───────────────────
export const ClientRolodexContent: React.FC = () => {
    const navigate = useNavigate();
    const { clients, totalLTV, totalPending, topClient, nudgeCount, filtered, search, setSearch, sortBy, setSortBy, saveBrandKit, user } = useClientRolodexState();

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={DollarSign} label="Total LTV" value={fmtCurrency(totalLTV)} sub="Across all paid projects" color="lime" />
                <StatCard icon={Users} label="Total Clients" value={String(clients.length)} sub={`${clients.filter(c => c.ltv >= 1000).length} Silver tier or above`} color="blue" />
                <StatCard icon={TrendingUp} label="Top Client" value={topClient ? fmtCurrency(topClient.ltv) : '—'} sub={topClient?.name} color="amber" />
                <StatCard icon={AlertCircle} label="Need Attention" value={String(nudgeCount)} sub={nudgeCount > 0 ? 'Awaiting payment' : 'All clients up to date'} color={nudgeCount > 0 ? 'amber' : 'slate'} />
            </div>

            {/* Pending callout */}
            {totalPending > 0 && (
                <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-2xl">
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                            {fmtCurrency(totalPending)} outstanding across {nudgeCount} client{nudgeCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                            Expand a client card below to send a payment reminder.
                        </p>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative w-full sm:max-w-xs group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-lime-600 dark:group-focus-within:text-lime-400 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search clients…"
                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-white dark:bg-[#1a1a20] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-lime-500 dark:focus:border-lime-400 transition-colors placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:block">Sort:</span>
                    {(['ltv', 'name', 'projects', 'recent'] as const).map(key => (
                        <button key={key} onClick={() => setSortBy(key)} className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${sortBy === key ? 'bg-lime-600 text-white dark:bg-lime-500 shadow-sm' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'}`}>
                            {key === 'ltv' ? 'LTV' : key === 'recent' ? 'Recent' : key === 'projects' ? '# Projects' : 'Name'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Client list */}
            {filtered.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center opacity-50">
                    {search ? (
                        <>
                            <Search className="w-10 h-10 mb-4 stroke-1" />
                            <p className="font-serif text-xl italic">No clients matched "{search}"</p>
                        </>
                    ) : (
                        <>
                            <Users className="w-12 h-12 mb-4 stroke-1" />
                            <p className="font-serif text-xl italic">No clients yet.</p>
                            <p className="text-sm text-slate-500 mt-2">Create your first project to see clients here.</p>
                            <button onClick={() => navigate('/create')} className="mt-6 px-6 py-3 rounded-xl bg-lime-600 text-white dark:bg-lime-500 font-bold text-sm uppercase tracking-wider hover:scale-105 transition-transform">
                                Create Project
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filtered.map(client => (
                        <ClientCard
                            key={client.email || client.name}
                            client={client}
                            brandKit={user.agencySettings?.brandKits?.[(client.email || '').toLowerCase()]}
                            onSaveBrandKit={saveBrandKit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
