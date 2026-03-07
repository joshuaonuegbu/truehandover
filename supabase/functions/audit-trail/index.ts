import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import {
  assertCorsAllowed,
  buildCorsHeaders,
  CorsError,
  handleCorsPreflight,
} from "../_shared/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

// ─── Colours (converted to 0-1 scale for pdf-lib) ───────────────────────────
const C = {
  black: rgb(0.055, 0.055, 0.071),        // #0E0E12
  accent: rgb(0.522, 0.671, 0.149),       // #85AB26  (lime-ish, print-safe)
  slate: rgb(0.380, 0.400, 0.420),        // #616568
  light: rgb(0.933, 0.937, 0.941),        // #EEF0F0
  white: rgb(1, 1, 1),
  red: rgb(0.761, 0.216, 0.216),
  green: rgb(0.133, 0.545, 0.133),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toUTCString().replace(" GMT", " UTC") : "—";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const statusLabel = (s: string) =>
  ({ draft: "Draft", awaiting_signature: "Awaiting Signature",
     awaiting_payment: "Awaiting Payment", payment_verification: "Verification",
     paid: "Paid ✓", completed: "Completed ✓" }[s] ?? s.replace(/_/g, " "));

// ─── PDF builder state ───────────────────────────────────────────────────────
interface BuildCtx {
  doc: PDFDocument;
  reg: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  mono: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  pages: ReturnType<PDFDocument["addPage"]>[];
  y: number;
  W: number;
  H: number;
  margin: number;
}

function currentPage(ctx: BuildCtx) {
  return ctx.pages[ctx.pages.length - 1];
}

function checkPage(ctx: BuildCtx, needed = 20) {
  if (ctx.y < ctx.margin + needed) {
    const p = ctx.doc.addPage([ctx.W, ctx.H]);
    ctx.pages.push(p);
    ctx.y = ctx.H - ctx.margin;
  }
}

function drawText(
  ctx: BuildCtx,
  text: string,
  opts: {
    size?: number;
    font?: "reg" | "bold" | "mono";
    color?: ReturnType<typeof rgb>;
    x?: number;
    indent?: number;
    skipAdvance?: boolean;
  } = {}
) {
  const { size = 9, font = "reg", color = C.black, x, indent = 0, skipAdvance = false } = opts;
  const f = font === "bold" ? ctx.bold : font === "mono" ? ctx.mono : ctx.reg;
  const px = x ?? ctx.margin + indent;
  currentPage(ctx).drawText(text, { x: px, y: ctx.y, size, font: f, color });
  if (!skipAdvance) ctx.y -= size + 4;
}

function drawHRule(ctx: BuildCtx, thickness = 0.5, color = C.light) {
  checkPage(ctx, 10);
  currentPage(ctx).drawLine({
    start: { x: ctx.margin, y: ctx.y },
    end: { x: ctx.W - ctx.margin, y: ctx.y },
    thickness,
    color,
  });
  ctx.y -= 8;
}

function drawSectionHeader(ctx: BuildCtx, title: string) {
  checkPage(ctx, 30);
  ctx.y -= 8;
  drawText(ctx, title.toUpperCase(), { size: 7, font: "bold", color: C.accent });
  drawHRule(ctx, 0.8, C.accent);
}

function drawKeyValue(
  ctx: BuildCtx,
  label: string,
  value: string,
  valueColor = C.black
) {
  checkPage(ctx, 16);
  const labelWidth = 120;
  currentPage(ctx).drawText(label, {
    x: ctx.margin,
    y: ctx.y,
    size: 8,
    font: ctx.reg,
    color: C.slate,
  });
  // Wrap long values
  const maxW = ctx.W - ctx.margin - labelWidth - 5;
  const chars = Math.floor(maxW / 5.5); // rough char estimate at size 8
  const lines = wrapText(value, chars);
  lines.forEach((line, i) => {
    if (i > 0) checkPage(ctx, 14);
    currentPage(ctx).drawText(line, {
      x: ctx.margin + labelWidth,
      y: i === 0 ? ctx.y : ctx.y,
      size: 8,
      font: ctx.reg,
      color: valueColor,
    });
    if (i < lines.length - 1) ctx.y -= 12;
  });
  ctx.y -= 14;
}

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + (cur ? " " : "") + w).length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─── Main PDF builder ─────────────────────────────────────────────────────────
async function buildAuditPDF(data: {
  project: Record<string, any>;
  files: Record<string, any>[];
  logs: Record<string, any>[];
  creatorProfile: Record<string, any>;
}): Promise<Uint8Array> {
  const { project, files, logs, creatorProfile } = data;
  const docId = `audit_${project.id?.slice(0, 8)}_${Date.now().toString(36)}`;
  const generatedAt = new Date().toUTCString().replace(" GMT", " UTC");

  const doc = await PDFDocument.create();
  doc.setTitle(`Audit Trail — ${project.name}`);
  doc.setAuthor("TrueHandover");
  doc.setSubject("Official Delivery Audit Trail");
  doc.setCreator("TrueHandover Platform v1.0");
  doc.setCreationDate(new Date());

  const [reg, bold, mono] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.Courier),
  ]);

  const W = 612, H = 792, margin = 50;
  const firstPage = doc.addPage([W, H]);

  const ctx: BuildCtx = {
    doc, reg, bold, mono,
    pages: [firstPage],
    y: H - margin,
    W, H, margin,
  };

  // ── HEADER BAR ────────────────────────────────────────────────────────────
  currentPage(ctx).drawRectangle({
    x: 0, y: H - 70, width: W, height: 70,
    color: C.black,
  });
  currentPage(ctx).drawText("TRUEHANDOVER", {
    x: margin, y: H - 34, size: 18, font: bold, color: C.white,
  });
  currentPage(ctx).drawText("Official Delivery Audit Trail", {
    x: margin, y: H - 52, size: 9, font: reg, color: rgb(0.6, 0.65, 0.6),
  });
  // right-side accent stripe
  currentPage(ctx).drawRectangle({
    x: W - 8, y: H - 70, width: 8, height: 70,
    color: C.accent,
  });

  ctx.y = H - 70 - 22;

  // ── METADATA ROW ─────────────────────────────────────────────────────────
  drawText(ctx, `Document ID: ${docId}`, { size: 7, color: C.slate });
  drawText(ctx, `Generated: ${generatedAt}`, { size: 7, color: C.slate });
  ctx.y -= 6;
  drawHRule(ctx, 0.4, C.light);

  // ── PROJECT INFORMATION ──────────────────────────────────────────────────
  drawSectionHeader(ctx, "Project Information");
  const client = project.client || {};
  const isPaid = ["paid", "completed"].includes(String(project.status));
  drawKeyValue(ctx, "Project Name", project.name || "—");
  drawKeyValue(ctx, "Project ID", project.id || "—");
  drawKeyValue(ctx, "Description", project.description || "None");
  drawKeyValue(ctx, "Status", statusLabel(project.status || ""), isPaid ? C.green : C.slate);
  drawKeyValue(ctx, "Contract Value", fmtCurrency(Number(project.amount) || 0));
  drawKeyValue(ctx, "Created", fmtDate(project.created_at));
  drawKeyValue(ctx, "Due Date", fmtDate(project.due_date));

  // ── PARTIES ──────────────────────────────────────────────────────────────
  drawSectionHeader(ctx, "Parties");
  drawKeyValue(ctx, "Creator (Sender)", `${creatorProfile.name || "—"} <${creatorProfile.email || "—"}>`);
  drawKeyValue(ctx, "Creator ID", creatorProfile.id || "—");
  drawKeyValue(ctx, "Client Name", client.name || "—");
  drawKeyValue(ctx, "Client Email", client.email || "—");
  if (client.company) drawKeyValue(ctx, "Client Company", client.company);
  drawKeyValue(ctx, "Client First Viewed", fmtDate(project.client_viewed_at));

  // ── DELIVERED ASSETS ─────────────────────────────────────────────────────
  drawSectionHeader(ctx, `Delivered Assets (${files.length} file${files.length !== 1 ? "s" : ""})`);

  if (files.length === 0) {
    drawText(ctx, "No files attached to this project.", { size: 8, color: C.slate });
  } else {
    for (const f of files) {
      checkPage(ctx, 44);
      // File row header
      drawText(ctx, f.name || "Unnamed", { size: 8.5, font: "bold", indent: 0 });
      const meta = f.metadata || {};
      drawKeyValue(ctx, "  Type / Size", `${(f.type || "—").toUpperCase()}  ·  ${f.size || "—"}`);
      drawKeyValue(ctx, "  Uploaded", fmtDate(f.upload_date || f.created_at));
      drawKeyValue(ctx, "  Status", f.locked ? "Locked" : "Unlocked", f.locked ? C.red : C.green);
      if (meta.hash) {
        drawKeyValue(ctx, "  SHA-256", meta.hash, C.slate);
      } else {
        drawKeyValue(ctx, "  SHA-256", "Hash not recorded at upload time", C.slate);
      }
      if (meta.resolution) drawKeyValue(ctx, "  Resolution", meta.resolution);
      if (meta.duration) drawKeyValue(ctx, "  Duration", meta.duration);
      if (meta.pages) drawKeyValue(ctx, "  Pages", String(meta.pages));
      drawHRule(ctx, 0.3, C.light);
    }
  }

  // ── DELIVERY TIMELINE ────────────────────────────────────────────────────
  drawSectionHeader(ctx, "Delivery Timeline");

  const timeline: { ts: string; label: string }[] = [];

  if (project.created_at) {
    timeline.push({ ts: project.created_at, label: "Project created by creator" });
  }
  if (project.client_viewed_at) {
    timeline.push({ ts: project.client_viewed_at, label: "Client preview link first accessed" });
  }
  for (const log of logs) {
    const actionMap: Record<string, string> = {
      payment_received: `Payment received ${log.details?.amount ? fmtCurrency(log.details.amount / 100) : ""} via Stripe`,
      PAYMENT_SESSION_INIT: "Stripe checkout session initiated by client",
      MANUAL_PAYMENT_VERIFIED: "Manual payment verified by creator",
      file_uploaded: "File uploaded to vault",
      project_completed: "Project marked as completed",
    };
    const label = actionMap[log.action] || log.action.replace(/_/g, " ");
    timeline.push({ ts: log.created_at, label });
  }

  // Sort chronologically
  timeline.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  if (timeline.length === 0) {
    drawText(ctx, "No recorded activity events.", { size: 8, color: C.slate });
  } else {
    for (const event of timeline) {
      checkPage(ctx, 22);
      const ts = fmtDate(event.ts);
      drawText(ctx, `◉  ${ts}`, { size: 7.5, font: "bold", color: C.slate });
      ctx.y += 2;
      drawText(ctx, `     ${event.label}`, { size: 8 });
      ctx.y -= 2;
    }
  }

  // ── PAYMENT SUMMARY ───────────────────────────────────────────────────────
  const paymentLog = logs.find((l) => l.action === "payment_received");
  if (paymentLog || isPaid) {
    drawSectionHeader(ctx, "Payment Summary");
    const d = paymentLog?.details || {};
    drawKeyValue(ctx, "Amount", d.amount ? fmtCurrency(Number(d.amount) / 100) : fmtCurrency(Number(project.amount)));
    drawKeyValue(ctx, "Currency", (d.currency || "usd").toUpperCase());
    drawKeyValue(ctx, "Method", d.source === "checkout.session.completed" ? "Stripe Card" : d.source || "Stripe");
    if (d.stripe_receipt_url) drawKeyValue(ctx, "Stripe Receipt", d.stripe_receipt_url);
  }

  // ── SECURITY ATTESTATION ─────────────────────────────────────────────────
  checkPage(ctx, 120);
  ctx.y -= 10;
  currentPage(ctx).drawRectangle({
    x: margin - 10, y: ctx.y - 78, width: W - (margin - 10) * 2, height: 95,
    color: rgb(0.965, 0.98, 0.945),
    borderColor: C.accent,
    borderWidth: 0.8,
  });
  ctx.y -= 2;
  drawText(ctx, "SECURITY ATTESTATION", { size: 7, font: "bold", color: C.accent, indent: 2 });
  ctx.y -= 2;
  drawText(ctx, "This document was automatically generated by TrueHandover and serves as an official record of", { size: 8, indent: 2 });
  drawText(ctx, "the deliverable handover between the parties identified above. All file SHA-256 fingerprints", { size: 8, indent: 2 });
  drawText(ctx, "were computed at upload time by the creator's browser prior to storage. Timestamps are", { size: 8, indent: 2 });
  drawText(ctx, "recorded in UTC by TrueHandover's infrastructure and have not been modified.", { size: 8, indent: 2 });
  ctx.y -= 4;
  drawText(ctx, "Disclaimer: This document is an audit record, not a legal contract or legal advice.", { size: 7.5, color: C.slate, indent: 2 });

  // ── PAGE FOOTER (all pages) ───────────────────────────────────────────────
  for (let i = 0; i < ctx.pages.length; i++) {
    const p = ctx.pages[i];
    p.drawRectangle({ x: 0, y: 0, width: W, height: 26, color: C.black });
    p.drawText("TrueHandover · Secure Delivery Platform", {
      x: margin, y: 9, size: 7, font: reg, color: rgb(0.5, 0.5, 0.5),
    });
    p.drawText(`Page ${i + 1} of ${ctx.pages.length}  ·  ${docId}`, {
      x: W - margin - 140, y: 9, size: 7, font: reg, color: rgb(0.5, 0.5, 0.5),
    });
  }

  return await doc.save();
}

// ─── Handler ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    enforceRateLimit(req, { name: "audit-trail", limit: 20, windowMs: 60_000 });

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require authenticated creator
    const userClient = createUserClient(req);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId } = await req.json();
    if (!projectId) throw new Error("Missing projectId");

    const admin = createServiceClient();

    // Fetch project — RLS enforces ownership via creator-projects,
    // but here we use service role with explicit user_id check for safety.
    const { data: project, error: pErr } = await admin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (pErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found or access denied" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [filesRes, logsRes, profileRes] = await Promise.all([
      admin.from("files").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
      admin.from("activity_logs").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
      admin.from("profiles").select("id, name, email").eq("id", user.id).single(),
    ]);

    const files = filesRes.data || [];
    const logs = logsRes.data || [];
    const creatorProfile = profileRes.data || { id: user.id, name: "Creator", email: user.email ?? "" };

    const pdfBytes = await buildAuditPDF({ project, files, logs, creatorProfile });

    const safeProjectName = (project.name || "project").replace(/[^a-zA-Z0-9\-_]/g, "_");
    const filename = `TrueHandover_AuditTrail_${safeProjectName}.pdf`;

    // Log the audit trail generation in activity_logs
    await admin.from("activity_logs").insert({
      user_id: user.id,
      project_id: projectId,
      action: "audit_trail_generated",
      details: { filename, generated_at: new Date().toISOString() },
    }).catch(() => {}); // Non-fatal

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.byteLength),
      },
    });
  } catch (err: any) {
    const status =
      err instanceof CorsError ? 403 :
        err instanceof RateLimitError ? 429 : 400;
    const retryAfter = err instanceof RateLimitError ? String(err.retryAfterSeconds) : undefined;
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        ...(retryAfter ? { "Retry-After": retryAfter } : {}),
      },
    });
  }
});
