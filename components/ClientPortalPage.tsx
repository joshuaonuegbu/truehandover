import React from 'react';
import { ExternalLink, Clock, CheckCircle, Lock, FileText } from 'lucide-react';

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const statusBadge = (status: string) => {
    if (status === 'paid' || status === 'completed') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status === 'awaiting_payment') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-zinc-100 text-zinc-600 border-zinc-200';
};

const statusLabel = (status: string) => ({
    draft: 'Draft',
    awaiting_signature: 'Awaiting Signature',
    awaiting_payment: 'Awaiting Payment',
    payment_verification: 'Payment Verification',
    paid: 'Paid',
    completed: 'Completed',
}[status] || status);

const ClientPortalPage = ({
    portal,
    loading,
    error,
}: {
    portal: any | null;
    loading: boolean;
    error: string | null;
}) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center">
                <div className="text-sm font-bold tracking-wider uppercase text-zinc-500">Loading client portal…</div>
            </div>
        );
    }

    if (error || !portal) {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center px-5">
                <div className="max-w-md w-full rounded-2xl border border-zinc-200/50 bg-white p-6 text-center">
                    <h1 className="font-sans tracking-tight text-2xl mb-2">Portal unavailable</h1>
                    <p className="text-sm text-zinc-500">{error || 'This portal link may be invalid.'}</p>
                </div>
            </div>
        );
    }

    const totalPaid = (portal.projects || []).filter((p: any) => p.status === 'paid' || p.status === 'completed').length;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="max-w-5xl mx-auto px-5 py-10">
                <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 md:p-8 mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">HeartFlair Client Portal</p>
                            <h1 className="font-sans tracking-tight text-4xl leading-tight">{portal.client?.name || 'Client'}</h1>
                            <p className="text-sm text-zinc-500 mt-2">All projects and delivery status in one place.</p>
                        </div>
                        {portal.client?.avatar ? (
                            <img src={portal.client.avatar} alt={portal.client.name} className="w-14 h-14 rounded-xl border border-zinc-200/50 object-cover" />
                        ) : null}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        <div className="rounded-xl border border-zinc-200/50 p-3 bg-zinc-50">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Projects</p>
                            <p className="font-sans tracking-tight text-2xl">{portal.totalProjects || 0}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200/50 p-3 bg-zinc-50">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Value</p>
                            <p className="font-sans tracking-tight text-2xl">{fmtCurrency(portal.totalValue || 0)}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200/50 p-3 bg-zinc-50">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Paid</p>
                            <p className="font-sans tracking-tight text-2xl">{totalPaid}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200/50 p-3 bg-zinc-50">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email</p>
                            <p className="text-xs font-bold mt-2 truncate">{portal.client?.email || '—'}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200/50 bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-200/50 flex items-center justify-between">
                        <h2 className="font-sans tracking-tight text-2xl">Projects</h2>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Persistent Hub</span>
                    </div>
                    <div className="divide-y divide-zinc-100">
                        {(portal.projects || []).map((p: any) => (
                            <div key={p.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 sm:justify-between">
                                <div className="min-w-0">
                                    <p className="font-bold truncate">{p.name}</p>
                                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3 flex-wrap">
                                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Created {fmtDate(p.createdAt)}</span>
                                        <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Due {fmtDate(p.dueDate)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge(p.status)}`}>
                                        {statusLabel(p.status)}
                                    </span>
                                    <span className="font-sans tracking-tight text-lg min-w-[84px] text-right">{fmtCurrency(p.amount || 0)}</span>
                                    <a
                                        href={`/c/${p.clientLink}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200/50 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold uppercase tracking-wider"
                                    >
                                        Open Vault <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-4 text-[11px] text-zinc-400 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    This portal is read-only and does not expose creator admin controls.
                </div>
            </div>
        </div>
    );
};

export default ClientPortalPage;
