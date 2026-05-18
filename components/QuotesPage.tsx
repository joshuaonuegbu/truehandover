import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Copy,
    FileDigit,
    FileText,
    Plus,
    Receipt,
    Save,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { playClick, playSuccess } from '../utils/sound';
import {
    type QuoteLine,
    makeQuoteLine,
    quoteCurrency,
    calcQuoteSubtotal,
    calcQuoteTaxAmount,
    buildQuotePlainText,
} from '../utils/quoteBuilderCore';
import { createQuotePdf } from '../utils/reportPdfGenerator';
import { SelectField } from './SelectField';

const currency = quoteCurrency;

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function QuotesPage() {
    const navigate = useNavigate();
    const { projects, user } = useStore();
    const [clientTemplateId, setClientTemplateId] = useState('');

    const [quoteNumber] = useState(() => {
        const day = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const suffix = Math.floor(Math.random() * 900 + 100);
        return `Q-${day}-${suffix}`;
    });

    const [quoteTitle, setQuoteTitle] = useState('Creative Services Quote');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [issueDate, setIssueDate] = useState(todayIso());
    const [validDays, setValidDays] = useState(14);
    const [taxRate, setTaxRate] = useState(0);
    const [notes, setNotes] = useState('Timeline starts after quote approval and first payment confirmation.');
    const [lines, setLines] = useState<QuoteLine[]>([makeQuoteLine()]);
    const [pdfBusy, setPdfBusy] = useState(false);

    const clientTemplates = useMemo(() => {
        const mapped = projects
            .filter((p) => p.client?.name)
            .map((p) => ({
                id: p.id,
                label: `${p.client.name}${p.client.company ? ` (${p.client.company})` : ''}`,
                clientName: p.client.name,
                clientEmail: p.client.email || '',
                clientCompany: p.client.company || '',
                projectName: p.name,
                amount: p.amount || 0,
            }));

        const byLabel = new Map<string, (typeof mapped)[number]>();
        mapped.forEach((item) => {
            if (!byLabel.has(item.label)) byLabel.set(item.label, item);
        });
        return Array.from(byLabel.values());
    }, [projects]);

    const subtotal = useMemo(() => calcQuoteSubtotal(lines), [lines]);
    const taxAmount = useMemo(() => calcQuoteTaxAmount(subtotal, taxRate), [subtotal, taxRate]);
    const total = subtotal + taxAmount;

    const updateLine = (id: string, patch: Partial<QuoteLine>) => {
        setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
    };

    const addLine = () => setLines((prev) => [...prev, makeQuoteLine()]);

    const removeLine = (id: string) => {
        setLines((prev) => {
            if (prev.length === 1) return prev;
            return prev.filter((line) => line.id !== id);
        });
    };

    const formattedExpiry = useMemo(() => {
        const base = new Date(issueDate || todayIso());
        base.setDate(base.getDate() + Math.max(1, Number(validDays) || 1));
        return base.toISOString().slice(0, 10);
    }, [issueDate, validDays]);

    const buildQuoteText = () =>
        buildQuotePlainText({
            quoteNumber,
            quoteTitle,
            freelancerName: user?.name,
            freelancerEmail: user?.email,
            clientName,
            clientEmail,
            clientCompany,
            issueDate,
            validUntil: formattedExpiry,
            lines,
            taxRatePercent: taxRate,
            notes,
        });

    const downloadQuote = () => {
        playSuccess();
        const content = buildQuoteText();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `Sendational_${quoteNumber}.txt`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const downloadQuotePdf = async () => {
        if (pdfBusy) return;
        setPdfBusy(true);
        try {
            const blob = await createQuotePdf({
                quoteNumber,
                quoteTitle,
                freelancerName: user?.name,
                freelancerEmail: user?.email,
                clientName,
                clientEmail,
                clientCompany,
                issueDate,
                validUntil: formattedExpiry,
                lines: lines.map(({ description, qty, rate }) => ({ description, qty, rate })),
                taxRatePercent: taxRate,
                notes,
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `Sendational_${quoteNumber}.pdf`;
            anchor.click();
            URL.revokeObjectURL(url);
            playSuccess();
        } catch {
            playClick();
        } finally {
            setPdfBusy(false);
        }
    };

    const copyQuote = async () => {
        playClick();
        try {
            await navigator.clipboard.writeText(buildQuoteText());
        } catch {
            // Clipboard may be unavailable in constrained browser contexts.
        }
    };

    return (
        <div className="space-y-6 animate-slide-up relative z-10 pb-16 lg:pb-10 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() => { playClick(); navigate(-1); }}
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors mb-2.5"
                        title="Back"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-3xl sm:text-4xl font-sans tracking-tight font-medium text-zinc-900 dark:text-white">Quote Builder</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                        Line items, tax, and notes — copy plain text, download a .txt file, or export a branded PDF.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                        type="button"
                        onClick={copyQuote}
                        title="Copy the full quote as plain text (same as the .txt export)"
                        className="h-10 px-4 rounded-xl border border-zinc-200/70 dark:border-white/10 bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/20 text-[10px] font-bold uppercase tracking-[0.14em] flex items-center gap-2"
                    >
                        <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                    <button
                        type="button"
                        onClick={downloadQuote}
                        title="Download quote as a plain .txt file"
                        className="h-10 px-4 rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/10 text-[10px] font-bold uppercase tracking-[0.14em] flex items-center gap-2"
                    >
                        <Save className="w-3.5 h-3.5" /> Text
                    </button>
                    <button
                        type="button"
                        onClick={downloadQuotePdf}
                        disabled={pdfBusy}
                        title="Download quote as PDF"
                        className="h-10 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-black dark:hover:bg-zinc-200 disabled:opacity-50 text-[10px] font-bold uppercase tracking-[0.14em] flex items-center gap-2"
                    >
                        <FileText className="w-3.5 h-3.5" /> {pdfBusy ? 'PDF…' : 'PDF'}
                    </button>
                </div>
            </div>

            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] 2xl:grid-cols-[1.25fr_0.75fr] gap-4">
                <div className="rounded-[2rem] border border-zinc-200/55 dark:border-white/[0.08] bg-white dark:bg-charcoal shadow-sm p-5 sm:p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Quote Number</span>
                            <input value={quoteNumber} disabled className="w-full h-11 rounded-xl bg-zinc-100 dark:bg-white/10 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-700 dark:text-zinc-300" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Quote Title</span>
                            <input value={quoteTitle} onChange={(e) => setQuoteTitle(e.target.value)} className="w-full h-11 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white" />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="space-y-1 md:col-span-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Load existing client</span>
                            <SelectField
                                tone="charcoal"
                                value={clientTemplateId}
                                placeholder="Select client template"
                                onChange={(id) => {
                                    setClientTemplateId(id);
                                    if (!id) return;
                                    const selected = clientTemplates.find((item) => item.id === id);
                                    if (!selected) return;
                                    setClientName(selected.clientName);
                                    setClientEmail(selected.clientEmail);
                                    setClientCompany(selected.clientCompany);
                                    if (selected.projectName) {
                                        setQuoteTitle(`${selected.projectName} Quote`);
                                    }
                                    if (selected.amount > 0) {
                                        setLines([{ id: crypto.randomUUID(), description: selected.projectName, qty: 1, rate: selected.amount }]);
                                    }
                                }}
                                options={[
                                    { value: '', label: 'Select client template' },
                                    ...clientTemplates.map((item) => ({ value: item.id, label: item.label })),
                                ]}
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Client Name</span>
                            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full h-11 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Client Email</span>
                            <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full h-11 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white" />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Client Company</span>
                            <input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className="w-full h-11 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white" />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Issue Date</span>
                            <input
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                className="w-full h-11 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 [&::-webkit-calendar-picker-indicator]:brightness-0 dark:[&::-webkit-calendar-picker-indicator]:brightness-0 dark:[&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Valid Days</span>
                            <input type="number" min={1} value={validDays} onChange={(e) => setValidDays(Math.max(1, Number(e.target.value) || 1))} className="w-full h-11 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Tax Rate %</span>
                            <input type="number" min={0} step="0.1" value={taxRate} onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value) || 0))} className="w-full h-11 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white" />
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-sans tracking-tight font-medium text-zinc-900 dark:text-white">Line Items</h3>
                            <button onClick={addLine} className="h-9 px-3 rounded-lg bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            {lines.map((line) => {
                                const lineTotal = (Number(line.qty) || 0) * (Number(line.rate) || 0);
                                return (
                                    <div key={line.id} className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,0.75fr)_minmax(0,auto)] gap-2 p-3 rounded-xl bg-zinc-100/70 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10">
                                        <input
                                            value={line.description}
                                            onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                            placeholder="Description"
                                            className="h-10 min-w-0 w-full rounded-lg bg-white dark:bg-white/10 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            value={line.qty}
                                            onChange={(e) => updateLine(line.id, { qty: Math.max(0, Number(e.target.value) || 0) })}
                                            className="h-10 min-w-0 w-full rounded-lg bg-white dark:bg-white/10 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={line.rate}
                                            onChange={(e) => updateLine(line.id, { rate: Math.max(0, Number(e.target.value) || 0) })}
                                            className="h-10 min-w-0 w-full rounded-lg bg-white dark:bg-white/10 border border-zinc-200/70 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-white"
                                        />
                                        <div className="flex min-w-0 items-center gap-1 justify-end">
                                            <div className="h-10 min-w-0 flex-1 md:flex-none md:max-w-[100px] px-3 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold tabular-nums flex items-center justify-end overflow-hidden">
                                                <span className="truncate">{currency.format(lineTotal)}</span>
                                            </div>
                                            <button
                                                onClick={() => removeLine(line.id)}
                                                className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200/70 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-500/12 text-zinc-500 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-300 flex items-center justify-center"
                                                title="Remove line"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <label className="space-y-1 block">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Notes</span>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl bg-white dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 px-3 py-2 text-sm text-zinc-900 dark:text-white resize-y"
                        />
                    </label>
                </div>

                <aside className="min-w-0 rounded-[2rem] border border-zinc-200/55 dark:border-white/[0.08] bg-white dark:bg-charcoal shadow-sm p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-sans tracking-tight font-medium text-zinc-900 dark:text-white">Quote Summary</h3>
                        <FileDigit className="w-5 h-5 text-zinc-500 dark:text-zinc-300" />
                    </div>

                    <div className="rounded-2xl bg-zinc-100/70 dark:bg-white/8 border border-zinc-200/70 dark:border-white/10 p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                            <span>Quote</span>
                            <span className="font-semibold text-zinc-900 dark:text-white">{quoteNumber}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                            <span>Issue Date</span>
                            <span className="font-semibold text-zinc-900 dark:text-white">{issueDate}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                            <span>Expires</span>
                            <span className="font-semibold text-zinc-900 dark:text-white">{formattedExpiry}</span>
                        </div>
                        <div className="h-px bg-zinc-200/80 dark:bg-white/10" />
                        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                            <span>Subtotal</span>
                            <span className="font-semibold text-zinc-900 dark:text-white">{currency.format(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                            <span>Tax</span>
                            <span className="font-semibold text-zinc-900 dark:text-white">{currency.format(taxAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-base text-zinc-900 dark:text-white font-semibold">
                            <span>Total</span>
                            <span>{currency.format(total)}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-100/70 dark:bg-white/8 border border-zinc-200/70 dark:border-white/10 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mb-2">Use Case</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Create a quote before you finalize the project delivery, then convert approved line items into invoice milestones.
                        </p>
                    </div>

                    <button
                        onClick={downloadQuote}
                        className="w-full h-11 rounded-xl bg-[#a3e635]/35 hover:bg-[#a3e635]/50 dark:bg-[#bef264] dark:hover:bg-[#d4f58f] text-zinc-900 dark:text-zinc-950 text-[10px] font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-2"
                    >
                        <Receipt className="w-3.5 h-3.5" /> Export Quote
                    </button>
                    <button
                        onClick={copyQuote}
                        className="w-full h-11 rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-3.5 h-3.5" /> Copy Shareable Draft
                    </button>
                </aside>
            </section>
        </div>
    );
}
