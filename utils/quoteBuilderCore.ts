/** Shared quote line model — used by Quotes page and delivery widget quick builder. */

export interface QuoteLine {
    id: string;
    description: string;
    qty: number;
    rate: number;
}

export const makeQuoteLine = (): QuoteLine => ({
    id: crypto.randomUUID(),
    description: '',
    qty: 1,
    rate: 0,
});

export const quoteCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

export function calcQuoteSubtotal(lines: QuoteLine[]): number {
    return lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.rate) || 0), 0);
}

export function calcQuoteTaxAmount(subtotal: number, taxRatePercent: number): number {
    return subtotal * ((Number(taxRatePercent) || 0) / 100);
}

export type BuildQuotePlainTextInput = {
    quoteNumber: string;
    quoteTitle: string;
    freelancerName?: string;
    freelancerEmail?: string;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    issueDate: string;
    validUntil: string;
    lines: QuoteLine[];
    taxRatePercent: number;
    notes: string;
};

export function buildQuotePlainText(input: BuildQuotePlainTextInput): string {
    const subtotal = calcQuoteSubtotal(input.lines);
    const taxAmount = calcQuoteTaxAmount(subtotal, input.taxRatePercent);
    const total = subtotal + taxAmount;
    const fmt = quoteCurrency.format.bind(quoteCurrency);

    const lineText = input.lines
        .map((line, idx) => {
            const lineTotal = (Number(line.qty) || 0) * (Number(line.rate) || 0);
            return `${idx + 1}. ${line.description || 'Line item'} | Qty ${line.qty} | Rate ${fmt(line.rate || 0)} | Total ${fmt(lineTotal)}`;
        })
        .join('\n');

    return [
        `Heartifact Quote ${input.quoteNumber}`,
        `${input.quoteTitle}`,
        '',
        `From: ${input.freelancerName || 'Freelancer'}`,
        `Email: ${input.freelancerEmail || '-'}`,
        '',
        `Client: ${input.clientName || '-'}`,
        `Client Email: ${input.clientEmail || '-'}`,
        `Client Company: ${input.clientCompany || '-'}`,
        '',
        `Issued: ${input.issueDate}`,
        `Valid Until: ${input.validUntil}`,
        '',
        'Line Items',
        lineText,
        '',
        `Subtotal: ${fmt(subtotal)}`,
        `Tax (${input.taxRatePercent}%): ${fmt(taxAmount)}`,
        `Total: ${fmt(total)}`,
        '',
        'Notes',
        input.notes || '-',
    ].join('\n');
}

/** Minimal export for quick widget (no tax line). */
export function buildQuickQuoteSnippet(opts: {
    projectTitle: string;
    clientName: string;
    clientEmail: string;
    lines: QuoteLine[];
    subtotal: number;
}): string {
    const fmt = quoteCurrency.format.bind(quoteCurrency);
    const lines = opts.lines
        .filter((l) => l.description.trim() || (Number(l.rate) || 0) > 0)
        .map((line, idx) => {
            const t = (Number(line.qty) || 0) * (Number(line.rate) || 0);
            return `${idx + 1}. ${line.description || 'Item'} — ${fmt(t)}`;
        })
        .join('\n');

    return [
        `Quick quote — ${opts.projectTitle || 'Project'}`,
        `Client: ${opts.clientName || '-'}${opts.clientEmail ? ` <${opts.clientEmail}>` : ''}`,
        '',
        lines || '(no line items)',
        '',
        `Total: ${fmt(opts.subtotal)}`,
    ].join('\n');
}
