import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { assertCorsAllowed, buildCorsHeaders, CorsError, handleCorsPreflight } from "../_shared/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toUTCString().replace(" GMT", " UTC") : "—");
const fmtMoney = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

async function buildCertificate(input: {
  project: Record<string, any>;
  creator: Record<string, any>;
}) {
  const { project, creator } = input;
  const client = project.client || {};
  const nowIso = new Date().toISOString();
  const certId = `rt_${String(project.id).slice(0, 8)}_${Date.now().toString(36)}`;

  const doc = await PDFDocument.create();
  doc.setTitle(`Rights Transfer Certificate — ${project.name}`);
  doc.setAuthor("Heartifact");
  doc.setSubject("Official Rights Transfer Certificate");
  doc.setCreator("Heartifact Platform");
  doc.setCreationDate(new Date());

  const [reg, bold, italic] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.HelveticaOblique),
  ]);

  const page = doc.addPage([612, 792]);
  const W = 612;
  const H = 792;
  const margin = 54;

  const C = {
    black: rgb(0.08, 0.08, 0.11),
    slate: rgb(0.35, 0.38, 0.42),
    accent: rgb(0.55, 0.72, 0.15),
    line: rgb(0.88, 0.9, 0.92),
    white: rgb(1, 1, 1),
  };

  page.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: C.black });
  page.drawRectangle({ x: W - 8, y: H - 80, width: 8, height: 80, color: C.accent });
  page.drawText("Heartifact", { x: margin, y: H - 40, size: 18, font: bold, color: C.white });
  page.drawText("Official Rights Transfer Certificate", { x: margin, y: H - 60, size: 9, font: reg, color: rgb(0.72, 0.76, 0.79) });

  let y = H - 120;
  const drawLine = () => {
    page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 0.8, color: C.line });
    y -= 14;
  };
  const drawKV = (k: string, v: string) => {
    page.drawText(k, { x: margin, y, size: 9, font: reg, color: C.slate });
    page.drawText(v, { x: margin + 170, y, size: 9, font: reg, color: C.black });
    y -= 16;
  };

  page.drawText(`Certificate ID: ${certId}`, { x: margin, y, size: 8, font: reg, color: C.slate });
  y -= 13;
  page.drawText(`Generated: ${fmtDate(nowIso)}`, { x: margin, y, size: 8, font: reg, color: C.slate });
  y -= 20;
  drawLine();

  page.drawText("PARTIES", { x: margin, y, size: 8, font: bold, color: C.accent });
  y -= 14;
  drawLine();
  drawKV("Transferor (Creator)", `${creator.name || "Unknown"} <${creator.email || "—"}>`);
  drawKV("Transferee (Client)", `${client.name || "Unknown"} <${client.email || "—"}>`);

  y -= 6;
  page.drawText("PROJECT", { x: margin, y, size: 8, font: bold, color: C.accent });
  y -= 14;
  drawLine();
  drawKV("Project Name", String(project.name || "—"));
  drawKV("Project ID", String(project.id || "—"));
  drawKV("Contract Value", fmtMoney(Number(project.amount || 0)));
  drawKV("Status", String(project.status || "—"));
  drawKV("Date of Transfer", fmtDate(nowIso));

  y -= 10;
  page.drawText("DECLARATION", { x: margin, y, size: 8, font: bold, color: C.accent });
  y -= 14;
  drawLine();

  const paragraph = [
    "This certificate records that payment for the above project has been received through",
    "the Heartifact workflow, and rights in the delivered work product are transferred",
    "from the creator to the client in accordance with the parties' agreement.",
    "This document is an operational record and not legal advice.",
  ];

  for (const line of paragraph) {
    page.drawText(line, { x: margin, y, size: 10, font: reg, color: C.black });
    y -= 16;
  }

  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 220, y }, thickness: 0.8, color: C.line });
  page.drawLine({ start: { x: W - margin - 220, y }, end: { x: W - margin, y }, thickness: 0.8, color: C.line });
  y -= 14;
  page.drawText("Creator Signature (digital)", { x: margin, y, size: 8, font: reg, color: C.slate });
  page.drawText("Client Acceptance (digital)", { x: W - margin - 220, y, size: 8, font: reg, color: C.slate });

  y -= 42;
  page.drawText("Certified by Heartifact", { x: margin, y, size: 10, font: italic, color: C.slate });

  page.drawText(certId, { x: margin, y: 24, size: 7, font: reg, color: C.slate });
  page.drawText("Page 1 of 1", { x: W - margin - 45, y: 24, size: 7, font: reg, color: C.slate });

  return await doc.save();
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    enforceRateLimit(req, { name: "rights-transfer", limit: 30, windowMs: 60_000 });

    if (req.method !== "POST") throw new Error("Method not allowed");

    const userClient = createUserClient(req);
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId } = await req.json();
    if (!projectId) throw new Error("Missing projectId");

    const admin = createServiceClient();

    const { data: project, error: projectErr } = await admin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectErr || !project) throw new Error("Project not found");
    if (!["paid", "completed"].includes(String(project.status))) {
      throw new Error("Rights transfer certificate is only available for paid/completed projects.");
    }

    const { data: creator } = await admin
      .from("profiles")
      .select("id, name, email")
      .eq("id", user.id)
      .single();

    const bytes = await buildCertificate({ project, creator: creator || {} });

    await admin.from("activity_logs").insert({
      user_id: user.id,
      project_id: project.id,
      action: "rights_transfer_generated",
      details: {
        project_name: project.name,
        generated_at: new Date().toISOString(),
      },
    });

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=rights_transfer_${project.id}.pdf`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    const status =
      err instanceof CorsError ? 403 :
      err instanceof RateLimitError ? 429 :
      400;
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
