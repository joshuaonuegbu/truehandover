import React, { useMemo } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import {
    type QuoteLine,
    calcQuoteSubtotal,
    makeQuoteLine,
    quoteCurrency,
    buildQuickQuoteSnippet,
} from '../utils/quoteBuilderCore';
import { playClick, playSuccess } from '../utils/sound';
import { accentButtonClass } from '../utils/themeTokens';

const MAX_LINES = 5;

type DeliveryQuickQuoteProps = {
    isDarkMode: boolean;
    projectTitle: string;
    clientName: string;
    clientEmail: string;
    lines: QuoteLine[];
    onLinesChange: (lines: QuoteLine[]) => void;
    onApplyToPayment: (total: number) => void;
    onOpenFullBuilder: () => void;
    panelSurfaceCls: string;
    /** Extra classes on the outer wrapper */
    className?: string;
    /** Renders below the primary actions (e.g. switch-to-project hint), fixed with the footer */
    footerExtra?: React.ReactNode;
};

export default function DeliveryQuickQuote({
    isDarkMode,
    projectTitle,
    clientName,
    clientEmail,
    lines,
    onLinesChange,
    onApplyToPayment,
    onOpenFullBuilder,
    panelSurfaceCls,
    className = '',
    footerExtra,
}: DeliveryQuickQuoteProps) {
    const subtotal = useMemo(() => calcQuoteSubtotal(lines), [lines]);
    const accentButton = accentButtonClass(isDarkMode);

    const updateLine = (id: string, patch: Partial<QuoteLine>) => {
        onLinesChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
    };

    const addLine = () => {
        if (lines.length >= MAX_LINES) return;
        playClick();
        onLinesChange([...lines, makeQuoteLine()]);
    };

    const removeLine = (id: string) => {
        if (lines.length <= 1) return;
        playClick();
        onLinesChange(lines.filter((line) => line.id !== id));
    };

    const handleApply = () => {
        playSuccess();
        onApplyToPayment(subtotal);
    };

    const handleCopy = async () => {
        playClick();
        const text = buildQuickQuoteSnippet({
            projectTitle,
            clientName,
            clientEmail,
            lines,
            subtotal,
        });
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            /* ignore */
        }
    };

    const lineInputExtra = isDarkMode
        ? 'bg-white/6 border-white/10 text-zinc-100 placeholder:text-zinc-500'
        : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400';

    const footerBorder = isDarkMode ? 'border-white/10' : 'border-zinc-200';

    return (
        <div className={`flex flex-col flex-1 min-h-0 ${className}`}>
            <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
                <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 flex-1">
                    Line items add up to your total — apply to sync the payment amount when you switch to{' '}
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">Create project</span>.
                </p>
                {subtotal > 0 && (
                    <span className="text-xs font-bold tabular-nums text-zinc-900 dark:text-white shrink-0">
                        {quoteCurrency.format(subtotal)}
                    </span>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 briefing-scroll">
                <div className="space-y-2 pr-0.5">
                {lines.map((line) => {
                    const lineTotal = (Number(line.qty) || 0) * (Number(line.rate) || 0);
                    return (
                        <div
                            key={line.id}
                            className={`rounded-xl border p-2.5 space-y-2 ${panelSurfaceCls} ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}
                        >
                            <input
                                value={line.description}
                                onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                placeholder="Description"
                                className={`w-full h-9 rounded-lg px-2.5 text-xs border outline-none transition-colors ${lineInputExtra}`}
                            />
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    min={0}
                                    value={line.qty}
                                    onChange={(e) => updateLine(line.id, { qty: Math.max(0, Number(e.target.value) || 0) })}
                                    className={`w-14 h-9 rounded-lg px-1.5 text-xs border text-center ${lineInputExtra}`}
                                    title="Qty"
                                />
                                <span className="text-zinc-400 text-xs">×</span>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={line.rate}
                                    onChange={(e) => updateLine(line.id, { rate: Math.max(0, Number(e.target.value) || 0) })}
                                    placeholder="0"
                                    className={`flex-1 min-w-0 h-9 rounded-lg px-2 text-xs border ${lineInputExtra}`}
                                    title="Rate"
                                />
                                <div
                                    className={`shrink-0 h-9 px-2 rounded-lg text-[11px] font-semibold tabular-nums flex items-center ${
                                        isDarkMode ? 'bg-white/10 text-white' : 'bg-zinc-900 text-white'
                                    }`}
                                >
                                    {quoteCurrency.format(lineTotal)}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeLine(line.id)}
                                    className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Remove line"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>

            <div className={`shrink-0 pt-3 mt-1 space-y-2 border-t ${footerBorder}`}>
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={addLine}
                    disabled={lines.length >= MAX_LINES}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors disabled:opacity-40 ${
                        isDarkMode ? 'border-white/10 text-zinc-300 hover:bg-white/10' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                >
                    <Plus className="w-3.5 h-3.5" />
                    Line
                </button>
                <div className="text-xs font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                    Subtotal {quoteCurrency.format(subtotal)}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={handleApply}
                    className={`h-10 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 ${accentButton}`}
                >
                    Apply to payment
                </button>
                <button
                    type="button"
                    onClick={handleCopy}
                    className={`h-10 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-colors ${
                        isDarkMode ? 'border-white/10 text-zinc-200 hover:bg-white/10' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                </button>
            </div>

            <button
                type="button"
                onClick={() => {
                    playClick();
                    onOpenFullBuilder();
                }}
                className="w-full text-[10px] font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 hover:underline pt-0.5"
            >
                Open full quote builder
            </button>
            {footerExtra}
            </div>
        </div>
    );
}
