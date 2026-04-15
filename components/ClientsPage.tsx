import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    ArrowRight, Search,
    Clock, AlertCircle, Star,
    Mail, Phone, Building2,
    ChevronDown, ChevronUp, Link as LinkIcon, Copy,     Palette,
} from 'lucide-react';
import { GRADIENT_TEXT, Card } from './Shared';
import { useStore } from '../context/StoreContext';
import { DB } from '../services/supabaseClient';
import { Project } from '../types';
import { playClick } from '../utils/sound';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// â”€â”€â”€ Per-client summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Tier badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ClientTier({ ltv }: { ltv: number }) {
    if (ltv >= 10000) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30">
            <Star className="w-2.5 h-2.5" /> Platinum
        </span>
    );
    if (ltv >= 5000) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-white border border-zinc-200/50 dark:border-white/10">
            <Star className="w-2.5 h-2.5" /> Gold
        </span>
    );
    if (ltv >= 1000) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700/30">
            <Star className="w-2.5 h-2.5" /> Silver
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/10">
            New
        </span>
    );
}

// â”€â”€â”€ Project row inside expanded card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProjectRow({ project, onNavigate, onNudge, isNudging }: {
    project: Project;
    onNavigate: (id: string) => void;
    onNudge: (id: string) => void;
    isNudging: boolean;
}) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        draft: { label: 'Draft', className: 'text-zinc-500 bg-zinc-100 dark:bg-white/5 dark:text-zinc-400' },
        awaiting_signature: { label: 'Awaiting Sig.', className: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' },
        awaiting_payment: { label: 'Awaiting Payment', className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
        payment_verification: { label: 'Verifying', className: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
        paid: { label: 'Paid', className: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
        completed: { label: 'Completed', className: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
    };
    const cfg = statusConfig[project.status] || statusConfig.draft;

    return (
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-white/5 last:border-0 group/row">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex flex-col min-w-0">
                    <button
                        onClick={() => onNavigate(project.id)}
                        className="text-sm font-bold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left truncate transition-colors"
                    >
                        {project.name}
                    </button>
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {fmtDate(project.createdAt)}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.className}`}>
                    {cfg.label}
                </span>
                <span className="font-sans tracking-tight text-sm font-medium text-zinc-900 dark:text-white hidden sm:block min-w-[70px] text-right">
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
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
            </div>
        </div>
    );
}

// â”€â”€â”€ Client Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ClientCard({
    client,
    brandKit,
    onSaveBrandKit,
    className = '',
}: {
    client: ClientSummary;
    brandKit?: { primaryColor?: string; accentColor?: string; logoUrl?: string; notes?: string };
    onSaveBrandKit: (email: string, kit: { primaryColor?: string; accentColor?: string; logoUrl?: string; notes?: string }) => Promise<void>;
    className?: string;
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
        primaryColor: brandKit?.primaryColor || '#65a30d',
        accentColor: brandKit?.accentColor || '#0f172a',
        logoUrl: brandKit?.logoUrl || '',
        notes: brandKit?.notes || '',
    });

    useEffect(() => {
        setKitDraft({
            primaryColor: brandKit?.primaryColor || '#65a30d',
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
        <Card noPadding className={className}>
            {/* Main row */}
            <div className="p-6">
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="shrink-0">
                        {client.avatar ? (
                            <img
                                src={client.avatar}
                                alt={client.name}
                                className="w-12 h-12 rounded-xl object-cover border border-zinc-200/50 dark:border-white/10"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-white/10 dark:to-white/5 flex items-center justify-center font-sans tracking-tight text-lg font-bold text-zinc-600 dark:text-zinc-300">
                                {initials}
                            </div>
                        )}
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-tight">
                                {client.name}
                            </h3>
                            <ClientTier ltv={client.ltv} />
                            {client.needsNudge && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30 animate-pulse">
                                    <AlertCircle className="w-2.5 h-2.5" /> Payment Due
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {client.company && (
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3" /> {client.company}
                                </span>
                            )}
                            {client.email && (
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" />
                                    <a href={`mailto:${client.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={e => e.stopPropagation()}>
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
                        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Lifetime Value</div>
                        <div className={`font-sans tracking-tight text-2xl font-medium tracking-tight ${GRADIENT_TEXT}`}>
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
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-zinc-100 dark:border-white/5">
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Projects</div>
                        <div className="text-xl font-sans tracking-tight font-medium text-zinc-900 dark:text-white">{client.totalProjects}</div>
                    </div>
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Paid</div>
                        <div className="text-xl font-sans tracking-tight font-medium text-blue-600 dark:text-blue-400">{client.paidProjects}</div>
                    </div>
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Avg. Deal</div>
                        <div className="text-xl font-sans tracking-tight font-medium text-zinc-900 dark:text-white">{fmtCurrency(client.avgDeal)}</div>
                    </div>
                    <div className="hidden sm:block">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Last Active</div>
                        <div className="text-sm font-mono text-zinc-600 dark:text-zinc-300">
                            {client.lastProjectDate ? fmtDate(client.lastProjectDate) : '—'}
                        </div>
                    </div>
                </div>

                {/* Expand toggle */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => { playClick(); setExpanded(e => !e); }}
                        className="flex-1 min-w-[170px] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors group/toggle px-3 py-2 rounded-lg border border-zinc-200/50 dark:border-white/10"
                    >
                        <span>{expanded ? 'Hide' : 'View'} {client.totalProjects} Project{client.totalProjects !== 1 ? 's' : ''}</span>
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 group-hover/toggle:translate-y-0.5 transition-transform" />}
                    </button>

                    <button
                        onClick={copyPortalUrl}
                        disabled={portalBusy || !client.email}
                        className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-40"
                        title="Copy client portal link"
                    >
                        <Copy className="w-3.5 h-3.5 inline mr-1" /> {portalBusy ? '...' : 'Portal'}
                    </button>

                    <button
                        onClick={openPortal}
                        disabled={portalBusy || !client.email}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${client.email ? 'border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5' : 'border-zinc-200/50 text-zinc-400 opacity-40'} disabled:opacity-40`}
                        title="Open client portal"
                    >
                        <LinkIcon className="w-3.5 h-3.5 inline mr-1" /> Open
                    </button>

                    <button
                        onClick={handleCreateRetainer}
                        disabled={retainerBusy || !client.email}
                        className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-300 dark:border-blue-600/40 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
                        title="Generate recurring Stripe retainer link"
                    >
                        {retainerBusy ? 'Generating…' : 'Retainer Link'}
                    </button>

                    <button
                        onClick={() => setShowBrandKit(v => !v)}
                        className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
                        title="Save reusable brand kit for this client"
                    >
                        <Palette className="w-3.5 h-3.5 inline mr-1" /> Brand Kit
                    </button>
                </div>

                {retainerMsg && (
                    <div className="mt-3 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{retainerMsg}</div>
                )}

                {showBrandKit && (
                    <div className="mt-3 p-3 rounded-xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Primary Hex</label>
                                <input
                                    value={kitDraft.primaryColor}
                                    onChange={(e) => setKitDraft({ ...kitDraft, primaryColor: e.target.value })}
                                    className="mt-1 w-full h-9 px-3 rounded-lg border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-white/5 text-xs"
                                    placeholder="#65a30d"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Accent Hex</label>
                                <input
                                    value={kitDraft.accentColor}
                                    onChange={(e) => setKitDraft({ ...kitDraft, accentColor: e.target.value })}
                                    className="mt-1 w-full h-9 px-3 rounded-lg border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-white/5 text-xs"
                                    placeholder="#0f172a"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Logo URL (optional)</label>
                            <input
                                value={kitDraft.logoUrl}
                                onChange={(e) => setKitDraft({ ...kitDraft, logoUrl: e.target.value })}
                                className="mt-1 w-full h-9 px-3 rounded-lg border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-white/5 text-xs"
                                placeholder="https://.../logo.png"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowBrandKit(false)}
                                className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-zinc-200/50 dark:border-white/10"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => onSaveBrandKit(client.email, kitDraft)}
                                disabled={!client.email}
                                className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-zinc-950 dark:bg-blue-500 dark:text-zinc-950 border border-blue-600"
                            >
                                Save Kit
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Expanded projects list */}
            {expanded && (
                <div className="border-t border-zinc-100 dark:border-white/5 px-6 pb-4 pt-2 bg-zinc-50/50 dark:bg-white/[0.02]">
                    {nudgeResult && (
                        <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-bold ${nudgeResult.ok ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
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
        </Card>
    );
}

// â”€â”€â”€ Shared logic extracted so both the old page and the embedded view can use it â”€
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

// â”€â”€â”€ Embeddable content — used inside the Dashboard toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ClientRolodexContent: React.FC = () => {
    const navigate = useNavigate();
    const { clients, totalLTV, totalPending, topClient, nudgeCount, filtered, search, setSearch, sortBy, setSortBy, saveBrandKit, user } = useClientRolodexState();
    const silverPlus = clients.filter(c => c.ltv >= 1000).length;

    return (
        <div className="space-y-6 animate-fade-in pb-16">
            <div className="relative overflow-hidden hf-surface bg-white dark:bg-charcoal rounded-[2rem] border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md bg-gradient-to-br from-white via-white to-zinc-50/95 dark:from-charcoal dark:via-charcoal dark:to-[#18181f]">
                <div className="absolute left-0 top-5 bottom-5 w-1 rounded-full bg-gradient-to-b from-lime-500 to-brand dark:from-[#bef264] dark:to-[#84cc16] opacity-90" aria-hidden />
                <div className="px-6 py-7 sm:px-9 sm:py-8 pl-8 sm:pl-10">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-lime-500 dark:bg-[#bef264] shadow-[0_0_10px_rgba(101,163,13,0.45)] dark:shadow-[0_0_12px_rgba(190,242,100,0.35)]" />
                            Directory
                        </span>
                        {clients.length > 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-100/90 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-white/[0.08]">
                                {clients.length} contact{clients.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <h2 className="font-serif tracking-tight text-3xl md:text-4xl font-medium text-zinc-900 dark:text-white">
                        Client roster
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                        Lifetime value, open invoices, and portal tools — one row per contact. Search below, then sort by LTV, name, projects, or recency. Expand a row for reminders and per-client brand kits.
                    </p>
                </div>
            </div>

            <div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] rounded-[2rem] shadow-sm dark:shadow-md grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-zinc-200 dark:divide-white/[0.06] lg:divide-x overflow-hidden">
                <div className="p-5 sm:p-6 bg-lime-500/[0.06] dark:bg-[#bef264]/[0.06]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-lime-700 dark:text-[#bef264] mb-1">Portfolio LTV</p>
                    <p className={`font-sans tracking-tight text-2xl font-medium ${GRADIENT_TEXT}`}>{fmtCurrency(totalLTV)}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Paid & completed work</p>
                </div>
                <div className="p-5 sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Contacts</p>
                    <p className="font-sans tracking-tight text-2xl font-medium text-zinc-900 dark:text-white">{clients.length}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{silverPlus} silver+ tier</p>
                </div>
                <div className="p-5 sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Top relationship</p>
                    <p className="font-sans tracking-tight text-xl font-medium text-zinc-900 dark:text-white truncate">{topClient ? fmtCurrency(topClient.ltv) : '—'}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">{topClient?.name || 'Add projects to rank clients'}</p>
                </div>
                <div className="p-5 sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Needs nudge</p>
                    <p className="font-sans tracking-tight text-2xl font-medium text-zinc-900 dark:text-white">{nudgeCount}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{nudgeCount > 0 ? 'Awaiting payment' : 'All clear'}</p>
                </div>
            </div>

            {totalPending > 0 && (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl border border-amber-200/80 dark:border-amber-600/25 bg-amber-50/90 dark:bg-amber-950/20 text-sm">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                        {fmtCurrency(totalPending)} open
                    </span>
                    <span className="text-amber-800/90 dark:text-amber-300/90">across {nudgeCount} client{nudgeCount !== 1 ? 's' : ''} — expand a row to send a reminder.</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between bg-white dark:bg-charcoal p-2 rounded-[2rem] border border-zinc-200 dark:border-white/[0.06]">
                <div className="relative w-full sm:flex-1 group min-w-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search name, email, or company…"
                        className="w-full h-12 pl-11 pr-4 rounded-3xl bg-transparent text-sm outline-none transition-all placeholder:text-zinc-500 focus:bg-white dark:focus:bg-white/5"
                    />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 pl-1 pr-2 sm:shrink-0">
                    {(['ltv', 'name', 'projects', 'recent'] as const).map(key => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => { playClick(); setSortBy(key); }}
                            className={`px-4 py-2.5 rounded-3xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${sortBy === key ? 'bg-white dark:bg-white/10 shadow-sm text-zinc-900 dark:text-white ring-1 ring-lime-500/25 dark:ring-[#bef264]/35' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5'}`}
                        >
                            {key === 'ltv' ? 'LTV' : key === 'recent' ? 'Recent' : key === 'projects' ? 'Projects' : 'Name'}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-20 px-6 text-center bg-white dark:bg-charcoal">
                    {search ? (
                        <>
                            <Search className="w-10 h-10 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                            <p className="font-sans tracking-tight text-lg text-zinc-900 dark:text-white">No matches for &ldquo;{search}&rdquo;</p>
                            <p className="text-sm text-zinc-500 mt-2">Try a shorter query or clear filters.</p>
                            <button type="button" onClick={() => { playClick(); setSearch(''); }} className="mt-6 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline">
                                Clear search
                            </button>
                        </>
                    ) : (
                        <>
                            <Users className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                            <p className="font-sans tracking-tight text-lg text-zinc-900 dark:text-white">No clients yet</p>
                            <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">When you create projects with client details, they consolidate here automatically.</p>
                            <button type="button" onClick={() => { playClick(); navigate('/create'); }} className="mt-8 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-blue-500 text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider">
                                Create project
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map(client => (
                        <ClientCard
                            key={client.email || client.name}
                            className="!rounded-[2rem] shadow-sm"
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
