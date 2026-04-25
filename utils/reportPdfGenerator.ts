import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

// --- Design tokens -------------------------------------------------------------
const C = {
  ink:         rgb(0.07,  0.07,  0.10),
  inkSub:      rgb(0.24,  0.26,  0.30),
  accentBrand: rgb(0.745, 0.949, 0.392),  // #bef264 � UI brand lime
  accent:      rgb(0.38,  0.58,  0.06),   // darker accessible lime for rules/text
  accentSoft:  rgb(0.91,  0.97,  0.83),
  slate:       rgb(0.46,  0.50,  0.56),
  slateMid:    rgb(0.64,  0.67,  0.72),
  line:        rgb(0.87,  0.90,  0.93),
  panel:       rgb(0.965, 0.970, 0.976),
  rowAlt:      rgb(0.982, 0.984, 0.988),
  white:       rgb(1,     1,     1    ),
  success:     rgb(0.11,  0.47,  0.22),
  successBg:   rgb(0.91,  0.97,  0.92),
  warning:     rgb(0.68,  0.40,  0.04),
  warningBg:   rgb(0.98,  0.95,  0.86),
  danger:      rgb(0.73,  0.18,  0.18),
  dangerBg:    rgb(0.98,  0.91,  0.91),
  accentBg:    rgb(0.90,  0.97,  0.83),
  neutralBg:   rgb(0.955, 0.958, 0.964),
};

type FontKey = 'reg' | 'bold' | 'italic' | 'mono' | 'serifBold';

interface Fonts {
  reg:       PDFFont;
  bold:      PDFFont;
  italic:    PDFFont;
  mono:      PDFFont;
  serifBold: PDFFont;
}

interface PdfCtx {
  doc:        PDFDocument;
  fonts:      Fonts;
  pages:      PDFPage[];
  page:       PDFPage;
  pageWidth:  number;
  pageHeight: number;
  margin:     number;
  y:          number;
}

interface MetricCard {
  label: string;
  value: string;
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}

interface TableColumn<T> {
  key:     keyof T | string;
  header:  string;
  width:   number;
  align?:  'left' | 'right';
  render?: (row: T) => string;
  mono?:   boolean;
  noClip?: boolean;
}

// --- Exported input types ------------------------------------------------------
export interface AuditTrailPdfInput {
  projectName:  string;
  projectId:    string;
  evidenceId:   string;
  creatorName:  string;
  creatorEmail: string;
  clientName:   string;
  clientEmail?: string;
  status:       string;
  amountUsd:    number;
  createdAt?:   string;
  dueDate?:     string;
  viewedAt?:    string;
  files: Array<{ name: string; type: string; size: string; hash?: string; locked?: boolean }>;
  timeline: Array<{ timestamp: string; title: string; detail: string }>;
}

export interface RightsCertificatePdfInput {
  certificateId: string;
  projectName:   string;
  projectId:     string;
  creatorName:   string;
  creatorEmail:  string;
  clientName:    string;
  clientEmail?:  string;
  amountUsd:     number;
  issuedAt:      string;
  effectiveAt:   string;
  status:        string;
  scope:         string[];
}

export interface StatementPdfRow {
  issuedOn:    string;
  projectId:   string;
  projectName: string;
  clientName:  string;
  status:      string;
  amountUsd:   number;
  dueDate?:    string;
}

export interface StatementPdfInput {
  statementLabel: string;
  creatorName:    string;
  creatorEmail:   string;
  rows:           StatementPdfRow[];
}

export interface PortfolioOverviewPdfInput {
  rangeLabel:         string;
  creatorName:        string;
  creatorEmail:       string;
  totalVolumeUsd:     number;
  securedVolumeUsd:   number;
  lockedVolumeUsd:    number;
  unlockRate:         number;
  topClientName:      string;
  topClientAmountUsd: number;
  topClientSharePct:  number;
  projects: Array<{ name: string; clientName: string; status: string; amountUsd: number; createdAt: string }>;
}

export interface QuotePdfLine {
  description: string;
  qty: number;
  rate: number;
}

export interface QuotePdfInput {
  quoteNumber: string;
  quoteTitle: string;
  freelancerName?: string;
  freelancerEmail?: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  issueDate: string;
  validUntil: string;
  lines: QuotePdfLine[];
  taxRatePercent: number;
  notes: string;
}

// --- Page constants ------------------------------------------------------------
const PAGE_W  = 612;
const PAGE_H  = 792;
const MARGIN  = 48;
const CONTENT = PAGE_W - MARGIN * 2; // 516 � all table column widths must sum to this

// --- Helpers -------------------------------------------------------------------
const fmt$ = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (v?: string, short = false) => {
  if (!v) return '�';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return short
    ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
};

const toneMain = (tone?: MetricCard['tone']) => {
  if (tone === 'success') return C.success;
  if (tone === 'warning') return C.warning;
  if (tone === 'danger')  return C.danger;
  if (tone === 'accent')  return C.accent;
  return C.inkSub;
};

const toneBg = (tone?: MetricCard['tone']) => {
  if (tone === 'success') return C.successBg;
  if (tone === 'warning') return C.warningBg;
  if (tone === 'danger')  return C.dangerBg;
  if (tone === 'accent')  return C.accentBg;
  return C.neutralBg;
};

const statusTone = (s: string): MetricCard['tone'] => {
  const n = s.toLowerCase();
  if (n.includes('paid') || n.includes('secured') || n.includes('completed')) return 'success';
  if (n.includes('awaiting') || n.includes('locked') || n.includes('pending')) return 'warning';
  if (n.includes('failed')) return 'danger';
  return 'accent';
};

/** Convert snake_case status to Title Case. e.g. awaiting_payment ? Awaiting Payment */
const fmtStatus = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Clip text to maxWidth using actual font metrics, appending ellipsis when clipped. */
const clip = (text: string, maxWidth: number, font: PDFFont, size: number): string => {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && font.widthOfTextAtSize(s + '�', size) > maxWidth) s = s.slice(0, -1);
  return s + '�';
};

/** Word-wrap text to maxWidth using actual font metrics. */
const wrap = (text: string, maxWidth: number, font: PDFFont, size: number): string[] => {
  const t = (text || '').trim();
  if (!t) return ['�'];
  const words = t.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
};

// --- Page context factory ------------------------------------------------------
const HEADER_H = 92;

const createCtx = async (title: string, subtitle: string): Promise<PdfCtx> => {
  const doc = await PDFDocument.create();
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fonts: Fonts = {
    reg:       await doc.embedFont(StandardFonts.Helvetica),
    bold:      await doc.embedFont(StandardFonts.HelveticaBold),
    italic:    await doc.embedFont(StandardFonts.HelveticaOblique),
    mono:      await doc.embedFont(StandardFonts.Courier),
    serifBold,
  };
  const page = doc.addPage([PAGE_W, PAGE_H]);

  // Dark header background
  page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: C.ink });
  // Lime right accent bar (full height)
  page.drawRectangle({ x: PAGE_W - 6, y: PAGE_H - HEADER_H, width: 6, height: HEADER_H, color: C.accentBrand });
  // Lime hairline at very top
  page.drawRectangle({ x: 0, y: PAGE_H - 2, width: PAGE_W - 6, height: 2, color: C.accent });
  // Mid-header horizontal rule separating brand row from document rows
  page.drawLine({
    start: { x: MARGIN, y: PAGE_H - 52 }, end: { x: PAGE_W - MARGIN - 10, y: PAGE_H - 52 },
    thickness: 0.5, color: rgb(0.18, 0.20, 0.24),
  });

  // EditorialIcon � SVG paths from App.tsx, viewBox 0 0 32 32 scaled to 20pt
  const iScale = 20 / 32;
  const iX = MARGIN;
  const iY = PAGE_H - 12; // SVG viewport anchor in PDF coords

  page.drawSvgPath('M4 15C4 10.6 9.4 7 16 7C22.6 7 28 10.6 28 15', {
    x: iX, y: iY, scale: iScale, borderColor: C.white, borderWidth: 1.5,
  });
  page.drawSvgPath('M 12,22 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0', {
    x: iX, y: iY, scale: iScale, borderColor: C.white, borderWidth: 1.5,
  });
  page.drawSvgPath('M 20,22 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0', {
    x: iX, y: iY, scale: iScale, color: C.accentBrand, borderColor: C.white, borderWidth: 1.5,
  });

  // Brand name � serif bold, matches UI font-serif header
  page.drawText('Heartifact', { x: MARGIN + 28, y: PAGE_H - 30, size: 16, font: serifBold, color: C.white });

  // "OFFICIAL DOCUMENT" badge � top-right
  const badgeText = 'OPERATIONAL RECORD';
  page.drawText(badgeText, {
    x: PAGE_W - MARGIN - fonts.bold.widthOfTextAtSize(badgeText, 6.5) - 10,
    y: PAGE_H - 22, size: 6.5, font: fonts.bold, color: rgb(0.38, 0.42, 0.48),
  });

  // Document title + subtitle � lower band of header
  page.drawText(title,    { x: MARGIN, y: PAGE_H - 68, size: 11,  font: fonts.bold, color: C.white });
  page.drawText(subtitle, { x: MARGIN, y: PAGE_H - 83, size: 7.5, font: fonts.reg,  color: rgb(0.55, 0.60, 0.66) });

  return {
    doc, fonts, pages: [page], page,
    pageWidth: PAGE_W, pageHeight: PAGE_H, margin: MARGIN,
    y: PAGE_H - HEADER_H - 18,
  };
};

const addPage = (ctx: PdfCtx) => {
  const page = ctx.doc.addPage([ctx.pageWidth, ctx.pageHeight]);
  ctx.pages.push(page);
  ctx.page = page;
  ctx.y = ctx.pageHeight - ctx.margin;
};

const ensureSpace = (ctx: PdfCtx, h: number) => {
  if (ctx.y - h < ctx.margin + 30) addPage(ctx);
};

// --- Drawing primitives --------------------------------------------------------
const drawText = (
  ctx: PdfCtx,
  text: string,
  opts?: { x?: number; size?: number; font?: FontKey; color?: ReturnType<typeof rgb> },
) => {
  const size = opts?.size ?? 9;
  const x    = opts?.x ?? ctx.margin;
  const font = ctx.fonts[opts?.font ?? 'reg'];
  ctx.page.drawText(text, { x, y: ctx.y, size, font, color: opts?.color ?? C.ink });
  ctx.y -= size + 5;
};

const drawRule = (ctx: PdfCtx, color = C.line) => {
  ensureSpace(ctx, 14);
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.y }, end: { x: ctx.pageWidth - ctx.margin, y: ctx.y },
    thickness: 0.75, color,
  });
  ctx.y -= 10;
};

// --- Section heading with 3 pt left accent bar --------------------------------
const drawSection = (ctx: PdfCtx, title: string, subtitle?: string) => {
  ensureSpace(ctx, 46);
  ctx.y -= 10;
  const barH = subtitle ? 30 : 17;
  ctx.page.drawRectangle({ x: ctx.margin, y: ctx.y - barH + 12, width: 3, height: barH, color: C.accentBrand });
  ctx.page.drawText(title.toUpperCase(), {
    x: ctx.margin + 10, y: ctx.y, size: 7.5, font: ctx.fonts.bold, color: C.ink,
  });
  ctx.y -= 12;
  if (subtitle) {
    ctx.page.drawText(subtitle, {
      x: ctx.margin + 10, y: ctx.y, size: 7, font: ctx.fonts.reg, color: C.slate,
    });
    ctx.y -= 10;
  }
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.y }, end: { x: ctx.pageWidth - ctx.margin, y: ctx.y },
    thickness: 0.6, color: C.line,
  });
  ctx.y -= 10;
};

// --- Key-value row -------------------------------------------------------------
const KV_LABEL_W = 144;

const drawKeyValue = (
  ctx: PdfCtx,
  label: string,
  value: string,
  opts?: { color?: ReturnType<typeof rgb>; mono?: boolean },
) => {
  ensureSpace(ctx, 20);
  const valueX  = ctx.margin + KV_LABEL_W;
  const valFont = opts?.mono ? ctx.fonts.mono : ctx.fonts.reg;
  const valSize = opts?.mono ? 7.5 : 8.5;
  const valW    = ctx.pageWidth - ctx.margin - KV_LABEL_W - ctx.margin;

  ctx.page.drawText(label, { x: ctx.margin, y: ctx.y, size: 7.5, font: ctx.fonts.reg, color: C.slate });
  const lines = wrap(value, valW, valFont, valSize);
  for (const line of lines) {
    ctx.page.drawText(line, { x: valueX, y: ctx.y, size: valSize, font: valFont, color: opts?.color ?? C.ink });
    ctx.y -= 13;
    ensureSpace(ctx, 20);
  }
  ctx.y -= 3;
};

// --- Metric cards (taller, left-border + tinted background) -------------------
const drawMetricCards = (ctx: PdfCtx, cards: MetricCard[]) => {
  const gap = 10;
  const n   = cards.length;
  const cW  = (CONTENT - gap * (n - 1)) / n;
  const cH  = 72;
  ensureSpace(ctx, cH + 20);
  ctx.y -= 8;

  cards.forEach((card, i) => {
    const x   = ctx.margin + i * (cW + gap);
    const y   = ctx.y - cH + 8;
    const col = toneMain(card.tone);
    const bg  = toneBg(card.tone);

    ctx.page.drawRectangle({ x, y, width: cW, height: cH, color: bg, borderColor: C.line, borderWidth: 0.75 });
    ctx.page.drawRectangle({ x, y, width: 4, height: cH, color: col });
    ctx.page.drawText(card.label.toUpperCase(), {
      x: x + 14, y: y + cH - 18, size: 6.5, font: ctx.fonts.bold, color: C.slate,
    });
    const valText = clip(card.value, cW - 28, ctx.fonts.bold, 17);
    ctx.page.drawText(valText, {
      x: x + 14, y: y + cH - 46, size: 17, font: ctx.fonts.bold, color: col,
    });
  });

  ctx.y -= cH + 12;
};

// --- Table (column widths MUST sum to CONTENT = 516) --------------------------
const ROW_H = 20;

const drawTable = <T extends object>(
  ctx: PdfCtx,
  columns: Array<TableColumn<T>>,
  rows: T[],
) => {
  const drawHeader = () => {
    ensureSpace(ctx, 30);
    ctx.page.drawRectangle({
      x: ctx.margin, y: ctx.y - 6, width: CONTENT, height: ROW_H,
      color: C.panel, borderColor: C.line, borderWidth: 0.75,
    });
    ctx.page.drawRectangle({ x: ctx.margin, y: ctx.y - 6, width: 3, height: ROW_H, color: C.accentBrand });
    let x = ctx.margin;
    for (const col of columns) {
      ctx.page.drawText(col.header.toUpperCase(), {
        x: x + 9, y: ctx.y + 2, size: 6.5, font: ctx.fonts.bold, color: C.slate,
      });
      x += col.width;
    }
    ctx.y -= ROW_H + 2;
  };

  drawHeader();

  rows.forEach((row, ri) => {
    ensureSpace(ctx, ROW_H + 4);
    if (ri > 0 && ctx.y < ctx.margin + ROW_H + 24) {
      addPage(ctx);
      drawHeader();
    }
    ctx.page.drawRectangle({
      x: ctx.margin, y: ctx.y - 6, width: CONTENT, height: ROW_H,
      color: ri % 2 === 0 ? C.white : C.rowAlt,
    });
    let x = ctx.margin;
    for (const col of columns) {
      const raw   = col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? '');
      const font  = col.mono ? ctx.fonts.mono : ctx.fonts.reg;
      const size  = col.mono ? 7 : 8;
      const avail = col.width - 18;
      const text  = col.noClip ? raw : clip(raw, avail, font, size);
      const tw    = font.widthOfTextAtSize(text, size);
      const textX = col.align === 'right' ? x + col.width - tw - 9 : x + 9;
      ctx.page.drawText(text, { x: textX, y: ctx.y, size, font, color: C.ink });
      x += col.width;
    }
    ctx.page.drawLine({
      start: { x: ctx.margin, y: ctx.y - 6 }, end: { x: ctx.margin + CONTENT, y: ctx.y - 6 },
      thickness: 0.5, color: C.line,
    });
    ctx.y -= ROW_H;
  });

  ctx.y -= 8;
};

// --- Asset table + full-width hash fingerprint block --------------------------
// The assets table deliberately omits the hash column; hashes are shown below
// in monospace at full width with no truncation.
const drawAssetTable = (ctx: PdfCtx, files: AuditTrailPdfInput['files']) => {
  // 4 columns: ASSET 250 + TYPE 74 + SIZE 96 + STATE 96 = 516
  drawTable(ctx, [
    { key: 'name',   header: 'Asset', width: 250 },
    { key: 'type',   header: 'Type',  width: 74  },
    { key: 'size',   header: 'Size',  width: 96 },
    {
      key: 'locked', header: 'State', width: 96,
      render: (r) => (r as { locked?: boolean }).locked ? 'Locked' : 'Unlocked',
    },
  ], files as unknown as object[]);

  const filesWithHashes = files.filter((f) => f.hash);
  if (filesWithHashes.length === 0) return;

  ctx.y -= 2;
  ctx.page.drawLine({ start: { x: ctx.margin, y: ctx.y }, end: { x: ctx.margin + CONTENT, y: ctx.y }, thickness: 0.5, color: C.line });
  ctx.y -= 10;

  ctx.page.drawText('ASSET FINGERPRINTS', {
    x: ctx.margin, y: ctx.y, size: 6.5, font: ctx.fonts.bold, color: C.slate,
  });
  ctx.y -= 16;

  for (const f of filesWithHashes) {
    ensureSpace(ctx, 36);
    const metaText = `  �  ${f.type}  �  ${f.size}  �  ${(f as { locked?: boolean }).locked ? 'Locked' : 'Unlocked'}`;
    ctx.page.drawText(f.name, { x: ctx.margin, y: ctx.y, size: 8, font: ctx.fonts.bold, color: C.inkSub });
    ctx.page.drawText(metaText, {
      x: ctx.margin + ctx.fonts.bold.widthOfTextAtSize(f.name, 8),
      y: ctx.y, size: 7.5, font: ctx.fonts.reg, color: C.slate,
    });
    ctx.y -= 13;
    // Full hash � panel background, full width, no truncation
    ctx.page.drawRectangle({ x: ctx.margin, y: ctx.y - 5, width: CONTENT, height: 16, color: C.panel });
    ctx.page.drawText(`SHA-256  ${f.hash}`, {
      x: ctx.margin + 9, y: ctx.y, size: 7, font: ctx.fonts.mono, color: C.inkSub,
    });
    ctx.y -= 22;
  }
};

// --- Footer on all pages -------------------------------------------------------
const stampFooters = (ctx: PdfCtx, docLabel: string) => {
  ctx.pages.forEach((page, i) => {
    page.drawLine({ start: { x: MARGIN, y: 40 }, end: { x: PAGE_W - MARGIN, y: 40 }, thickness: 0.75, color: C.line });
    page.drawText(docLabel, { x: MARGIN, y: 24, size: 6.5, font: ctx.fonts.mono, color: C.slate });
    const brand = 'Heartifact';
    page.drawText(brand, {
      x: PAGE_W / 2 - ctx.fonts.serifBold.widthOfTextAtSize(brand, 7) / 2,
      y: 24, size: 7, font: ctx.fonts.serifBold, color: C.slateMid,
    });
    const pLabel = `Page ${i + 1} of ${ctx.pages.length}`;
    page.drawText(pLabel, {
      x: PAGE_W - MARGIN - ctx.fonts.reg.widthOfTextAtSize(pLabel, 7),
      y: 24, size: 7, font: ctx.fonts.reg, color: C.slate,
    });
  });
};

const toBlob = async (ctx: PdfCtx, docLabel: string) => {
  stampFooters(ctx, docLabel);
  return new Blob([await ctx.doc.save()], { type: 'application/pdf' });
};

// --- Document generators -------------------------------------------------------

export const createAuditTrailPdf = async (input: AuditTrailPdfInput) => {
  const ctx = await createCtx(
    'Official Delivery Audit Trail',
    'Mock populated report � layout and hierarchy preview',
  );
  drawText(ctx, `Document ID: ${input.evidenceId}`, { size: 7, font: 'mono', color: C.slate });
  drawText(ctx, `Generated: ${fmtDate(new Date().toISOString())}`, { size: 7, color: C.slate });
  ctx.y -= 4;
  drawRule(ctx);

  drawMetricCards(ctx, [
    { label: 'Status',         value: fmtStatus(input.status),    tone: statusTone(input.status) },
    { label: 'Contract Value', value: fmt$(input.amountUsd),      tone: 'accent' },
    { label: 'Assets',         value: String(input.files.length), tone: 'neutral' },
  ]);

  drawSection(ctx, 'Project Snapshot');
  drawKeyValue(ctx, 'Project Name',      input.projectName);
  drawKeyValue(ctx, 'Project ID',        input.projectId,   { mono: true });
  drawKeyValue(ctx, 'Evidence ID',       input.evidenceId,  { mono: true });
  drawKeyValue(ctx, 'Created',           fmtDate(input.createdAt));
  drawKeyValue(ctx, 'Due Date',          fmtDate(input.dueDate));
  drawKeyValue(ctx, 'First Client View', fmtDate(input.viewedAt));

  drawSection(ctx, 'Parties');
  drawKeyValue(ctx, 'Creator', `${input.creatorName} <${input.creatorEmail}>`);
  drawKeyValue(ctx, 'Client',  `${input.clientName}${input.clientEmail ? ` <${input.clientEmail}>` : ''}`);

  drawSection(ctx, 'Delivered Assets', 'Immutable asset inventory captured at document generation time');
  drawAssetTable(ctx, input.files);

  drawSection(ctx, 'Chain Of Events', 'Key project actions and custody milestones');
  // TIMESTAMP 148 + EVENT 144 + DETAIL 224 = 516
  drawTable(ctx, [
    { key: 'timestamp', header: 'Timestamp', width: 148, render: (r) => fmtDate((r as { timestamp: string }).timestamp, true) },
    { key: 'title',     header: 'Event',     width: 144 },
    { key: 'detail',    header: 'Detail',    width: 224 },
  ], input.timeline as unknown as object[]);

  ctx.y -= 6;
  drawSection(ctx, 'Verification Note');
  drawText(ctx, 'This document is a preview export to validate layout, hierarchy, and presentation before the live audit pack is finalised.', { size: 8, color: C.slate });

  return toBlob(ctx, input.evidenceId);
};

export const createRightsCertificatePdf = async (input: RightsCertificatePdfInput) => {
  const ctx = await createCtx('Delivery Receipt (Rights Notation)', 'Mock populated certificate for visual review');
  drawText(ctx, `Certificate ID: ${input.certificateId}`, { size: 7, font: 'mono', color: C.slate });
  drawText(ctx, `Issued: ${fmtDate(input.issuedAt)}`, { size: 7, color: C.slate });
  ctx.y -= 4;
  drawRule(ctx);

  drawMetricCards(ctx, [
    { label: 'Project Value', value: fmt$(input.amountUsd),            tone: 'accent' },
    { label: 'Status',        value: fmtStatus(input.status),           tone: statusTone(input.status) },
    { label: 'Effective',     value: fmtDate(input.effectiveAt, true), tone: 'success' },
  ]);

  drawSection(ctx, 'Transfer Summary');
  drawKeyValue(ctx, 'Project Name',   input.projectName);
  drawKeyValue(ctx, 'Project ID',     input.projectId, { mono: true });
  drawKeyValue(ctx, 'Transferor',     `${input.creatorName} <${input.creatorEmail}>`);
  drawKeyValue(ctx, 'Transferee',     `${input.clientName}${input.clientEmail ? ` <${input.clientEmail}>` : ''}`);
  drawKeyValue(ctx, 'Effective Date', fmtDate(input.effectiveAt));

  drawSection(ctx, 'Scope Of Rights');
  input.scope.forEach((item) => drawText(ctx, `� ${item}`, { size: 9, x: ctx.margin + 12 }));

  ctx.y -= 10;
  drawSection(ctx, 'Declaration');
  const decl = wrap(
    'This certificate records that consideration for the above work has been satisfied through the Heartifact workflow and that the accompanying rights transfer has been acknowledged for operational record-keeping purposes.',
    CONTENT, ctx.fonts.reg, 9,
  );
  decl.forEach((line) => drawText(ctx, line, { size: 9 }));

  ctx.y -= 14;
  ensureSpace(ctx, 80);
  const sigW = 200;
  ctx.page.drawLine({ start: { x: ctx.margin, y: ctx.y }, end: { x: ctx.margin + sigW, y: ctx.y }, thickness: 0.8, color: C.line });
  ctx.page.drawLine({ start: { x: ctx.pageWidth - ctx.margin - sigW, y: ctx.y }, end: { x: ctx.pageWidth - ctx.margin, y: ctx.y }, thickness: 0.8, color: C.line });
  ctx.page.drawText('Creator acknowledgment', { x: ctx.margin, y: ctx.y - 14, size: 8, font: ctx.fonts.reg, color: C.slate });
  ctx.page.drawText('Client acknowledgment',  { x: ctx.pageWidth - ctx.margin - sigW, y: ctx.y - 14, size: 8, font: ctx.fonts.reg, color: C.slate });
  ctx.y -= 60;

  return toBlob(ctx, input.certificateId);
};

export const createMonthlyStatementPdf = async (input: StatementPdfInput) => {
  const paid    = input.rows.filter((r) => /paid|completed/i.test(r.status));
  const pending = input.rows.filter((r) => !/paid|completed/i.test(r.status));
  const gross   = input.rows.reduce((s, r) => s + r.amountUsd, 0);
  const secured = paid.reduce((s, r) => s + r.amountUsd, 0);
  const pendAmt = pending.reduce((s, r) => s + r.amountUsd, 0);

  const ctx = await createCtx('Monthly Statement', `Statement period: ${input.statementLabel}`);
  drawText(ctx, `Prepared for ${input.creatorName} <${input.creatorEmail}>`, { size: 8, color: C.slate });
  ctx.y -= 4;
  drawRule(ctx);

  drawMetricCards(ctx, [
    { label: 'Gross Volume', value: fmt$(gross),   tone: 'accent'  },
    { label: 'Secured',      value: fmt$(secured), tone: 'success' },
    { label: 'Pending',      value: fmt$(pendAmt), tone: 'warning' },
  ]);

  drawSection(ctx, 'Statement Entries');
  // ISSUED 72 + PROJECT 164 + CLIENT 120 + STATUS 92 + AMOUNT 68 = 516
  drawTable(ctx, [
    { key: 'issuedOn',    header: 'Issued',   width: 72,  render: (r) => fmtDate((r as StatementPdfRow).issuedOn, true) },
    { key: 'projectName', header: 'Project',  width: 164 },
    { key: 'clientName',  header: 'Client',   width: 120 },
    { key: 'status',      header: 'Status',   width: 92,  render: (r) => fmtStatus((r as StatementPdfRow).status) },
    { key: 'amountUsd',   header: 'Amount',   width: 68, align: 'right', render: (r) => fmt$((r as StatementPdfRow).amountUsd) },
  ], input.rows as unknown as object[]);

  return toBlob(ctx, `statement_${input.statementLabel.replace(/\s+/g, '_')}`);
};

export const createTaxLedgerPdf = async (input: StatementPdfInput) => {
  const total = input.rows.reduce((s, r) => s + r.amountUsd, 0);

  const ctx = await createCtx('Annual Ledger Summary', `Fiscal reporting sample for ${input.statementLabel}`);
  drawText(ctx, `Prepared for ${input.creatorName} <${input.creatorEmail}>`, { size: 8, color: C.slate });
  ctx.y -= 4;
  drawRule(ctx);

  drawMetricCards(ctx, [
    { label: 'Recorded Entries', value: String(input.rows.length), tone: 'accent'  },
    { label: 'Gross Volume',     value: fmt$(total),               tone: 'success' },
    { label: 'Fiscal Year',      value: input.statementLabel,      tone: 'neutral' },
  ]);

  drawSection(ctx, 'Ledger Rows');
  // PROJECT ID 80 + PROJECT 174 + CLIENT 120 + RECORDED 82 + AMOUNT 60 = 516
  drawTable(ctx, [
    { key: 'projectId',   header: 'Project ID', width: 80, mono: true },
    { key: 'projectName', header: 'Project',    width: 174 },
    { key: 'clientName',  header: 'Client',     width: 120 },
    { key: 'issuedOn',    header: 'Recorded',   width: 82, render: (r) => fmtDate((r as StatementPdfRow).issuedOn, true) },
    { key: 'amountUsd',   header: 'Amount',     width: 60, align: 'right', render: (r) => fmt$((r as StatementPdfRow).amountUsd) },
  ], input.rows as unknown as object[]);

  return toBlob(ctx, `tax_${input.statementLabel.replace(/\s+/g, '_')}`);
};

export const createPortfolioOverviewPdf = async (input: PortfolioOverviewPdfInput) => {
  const ctx = await createCtx('Portfolio Overview', `Scope: ${input.rangeLabel}`);
  drawText(ctx, `Prepared for ${input.creatorName} <${input.creatorEmail}>`, { size: 8, color: C.slate });
  ctx.y -= 4;
  drawRule(ctx);

  drawMetricCards(ctx, [
    { label: 'Total Volume', value: fmt$(input.totalVolumeUsd),   tone: 'accent'  },
    { label: 'Secured',      value: fmt$(input.securedVolumeUsd), tone: 'success' },
    { label: 'Unlock Rate',  value: `${input.unlockRate}%`,       tone: input.unlockRate >= 70 ? 'success' : 'warning' },
  ]);

  drawSection(ctx, 'Commercial Snapshot');
  drawKeyValue(ctx, 'Top Client',        input.topClientName);
  drawKeyValue(ctx, 'Top Client Volume', fmt$(input.topClientAmountUsd), { color: C.success });
  drawKeyValue(ctx, 'Top Client Share',  `${input.topClientSharePct}%`);
  drawKeyValue(ctx, 'Locked Pipeline',   fmt$(input.lockedVolumeUsd));

  drawSection(ctx, 'Recent Projects');
  // CREATED 80 + PROJECT 172 + CLIENT 112 + STATUS 92 + AMOUNT 60 = 516
  drawTable(ctx, [
    { key: 'createdAt',  header: 'Created', width: 80,  render: (r) => fmtDate((r as { createdAt: string }).createdAt, true) },
    { key: 'name',       header: 'Project', width: 172 },
    { key: 'clientName', header: 'Client',  width: 112 },
    { key: 'status',     header: 'Status',  width: 92,  render: (r) => fmtStatus((r as { status: string }).status) },
    { key: 'amountUsd',  header: 'Amount',  width: 60, align: 'right', render: (r) => fmt$((r as { amountUsd: number }).amountUsd) },
  ], input.projects as unknown as object[]);

  return toBlob(ctx, `portfolio_${input.rangeLabel.replace(/\s+/g, '_')}`);
};

export const createQuotePdf = async (input: QuotePdfInput) => {
  const subtotal = input.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0);
  const taxRate = Number(input.taxRatePercent) || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const ctx = await createCtx('Client Quote', input.quoteNumber);
  drawText(ctx, input.quoteTitle || 'Quote', { size: 10, font: 'bold' });
  ctx.y -= 2;
  drawText(ctx, `Issued ${fmtDate(input.issueDate, true)}  —  Valid through ${fmtDate(input.validUntil, true)}`, {
    size: 7.5,
    color: C.slate,
  });
  ctx.y -= 4;
  drawRule(ctx);

  drawSection(ctx, 'From');
  drawKeyValue(ctx, 'Name', input.freelancerName?.trim() || '—');
  drawKeyValue(ctx, 'Email', input.freelancerEmail?.trim() || '—');

  drawSection(ctx, 'Bill To');
  drawKeyValue(ctx, 'Client', input.clientName?.trim() || '—');
  drawKeyValue(ctx, 'Email', input.clientEmail?.trim() || '—');
  drawKeyValue(ctx, 'Company', input.clientCompany?.trim() || '—');

  drawSection(ctx, 'Line Items');
  type LineRow = { idx: string; desc: string; qty: string; rate: string; lineTotal: string };
  const rows: LineRow[] = input.lines.map((l, i) => ({
    idx: String(i + 1),
    desc: l.description?.trim() || 'Line item',
    qty: String(Number(l.qty) || 0),
    rate: fmt$(Number(l.rate) || 0),
    lineTotal: fmt$((Number(l.qty) || 0) * (Number(l.rate) || 0)),
  }));
  // # 36 + Description 220 + Qty 80 + Rate 90 + Total 90 = 516
  drawTable(ctx, [
    { key: 'idx', header: '#', width: 36, mono: true },
    { key: 'desc', header: 'Description', width: 220 },
    { key: 'qty', header: 'Qty', width: 80, align: 'right' },
    { key: 'rate', header: 'Rate', width: 90, align: 'right', mono: true },
    { key: 'lineTotal', header: 'Total', width: 90, align: 'right', mono: true },
  ], rows as unknown as object[]);

  drawMetricCards(ctx, [
    { label: 'Subtotal', value: fmt$(subtotal), tone: 'neutral' },
    { label: taxRate > 0 ? `Tax (${taxRate}%)` : 'Tax', value: fmt$(tax), tone: 'neutral' },
    { label: 'Total Due', value: fmt$(total), tone: 'accent' },
  ]);

  const notes = (input.notes || '').trim();
  if (notes) {
    drawSection(ctx, 'Notes');
    for (const line of wrap(notes, CONTENT, ctx.fonts.reg, 8)) {
      ensureSpace(ctx, 14);
      ctx.page.drawText(line, { x: ctx.margin, y: ctx.y, size: 8, font: ctx.fonts.reg, color: C.ink });
      ctx.y -= 12;
    }
    ctx.y -= 4;
  }

  const safeId = input.quoteNumber.replace(/[^\w.-]+/g, '_');
  return toBlob(ctx, `Heartifact_${safeId}`);
};
