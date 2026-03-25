import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  assertCorsAllowed,
  buildCorsHeaders,
  CorsError,
  handleCorsPreflight,
} from "../_shared/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const NUDGE_COOLDOWN_DAYS = 3;

function buildNudgeEmailHtml(opts: {
  creatorName: string;
  clientName: string;
  projectName: string;
  amount: number;
  previewUrl: string;
  dueDate?: string | null;
}): string {
  const { creatorName, clientName, projectName, amount, previewUrl, dueDate } = opts;
  const amountStr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
  const dueLine = dueDate
    ? `<p style="color:#555;font-size:14px;margin:0 0 12px 0;">
        Payment was due on <strong>${new Date(dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.
       </p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Reminder — ${projectName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0e0e12;padding:28px 36px;">
              <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px;">Heartflair</span>
              <span style="display:block;font-size:11px;color:#84ab26;margin-top:2px;letter-spacing:0.5px;text-transform:uppercase;">Secure Delivery Platform</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              <p style="font-size:22px;font-weight:700;color:#0e0e12;margin:0 0 18px 0;">
                Friendly Payment Reminder
              </p>
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 14px 0;">
                Hi ${clientName || "there"},
              </p>
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 14px 0;">
                ${creatorName} has completed the work on <strong>"${projectName}"</strong> and it's ready for your review. The files are securely held in your Heartflair vault, awaiting your payment to unlock access.
              </p>
              ${dueLine}
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
                The outstanding balance is <strong style="color:#0e0e12;">${amountStr}</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="background:#84ab26;border-radius:8px;">
                    <a href="${previewUrl}"
                       style="display:inline-block;padding:14px 32px;color:#0e0e12;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.1px;">
                      Review &amp; Pay Now →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#777;font-size:13px;line-height:1.6;margin:0;">
                Once payment is confirmed, your files will be immediately unlocked and available for download. If you have questions, please reply directly to ${creatorName}.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 36px;"><hr style="border:none;border-top:1px solid #eee;margin:0;" /></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 24px 36px;background:#fafafa;">
              <p style="color:#aaa;font-size:12px;margin:0;line-height:1.5;">
                This reminder was sent securely via <a href="https://heartflair.com" style="color:#84ab26;text-decoration:none;">Heartflair</a>.
                To stop receiving reminders, please complete your payment or contact ${creatorName} directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildNudgeEmailText(opts: {
  creatorName: string;
  clientName: string;
  projectName: string;
  amount: number;
  previewUrl: string;
}): string {
  const { creatorName, clientName, projectName, amount, previewUrl } = opts;
  const amountStr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
  return `Hi ${clientName || "there"},

${creatorName} has completed work on "${projectName}" and it's ready for your review.

Outstanding balance: ${amountStr}

To review your files and complete payment, visit:
${previewUrl}

Your files are securely held and will be unlocked immediately upon payment confirmation.

— Heartflair`;
}

async function sendNudgeEmail(opts: {
  to: string;
  creatorName: string;
  clientName: string;
  projectName: string;
  amount: number;
  previewUrl: string;
  dueDate?: string | null;
  resendApiKey: string;
  fromEmail: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { resendApiKey, fromEmail, to, ...emailOpts } = opts;

  const payload = {
    from: `${opts.creatorName} via Heartflair <${fromEmail}>`,
    to: [to],
    subject: `Payment reminder: "${opts.projectName}" is ready for review`,
    html: buildNudgeEmailHtml(emailOpts),
    text: buildNudgeEmailText(emailOpts),
  };

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    return { success: false, error: `Resend API error: ${err}` };
  }

  const json = await res.json().catch(() => ({}));
  return { success: true, messageId: json?.id };
}

// ─── Handler ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req, corsHeaders);
  if (preflight) return preflight;

  try {
    assertCorsAllowed(req);
    enforceRateLimit(req, { name: "nudge-sender", limit: 30, windowMs: 60_000 });

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const fromEmail = Deno.env.get("NUDGE_FROM_EMAIL") ?? "reminders@heartflair.com";
    const appBaseUrl = Deno.env.get("APP_BASE_URL") ?? "https://heartflair.com";
    const cronSecret = Deno.env.get("CRON_SECRET");

    const body: { projectId?: string } = await req.json().catch(() => ({}));
    const admin = createServiceClient();

    // ── CRON MODE: process ALL eligible projects ───────────────────────────
    const incomingCronSecret = req.headers.get("x-cron-secret");
    const isCron = cronSecret && incomingCronSecret === cronSecret;

    let projectsToNudge: Record<string, any>[] = [];

    if (isCron) {
      // Fetch all projects awaiting payment that haven't been nudged in 3 days
      const cutoff = new Date(
        Date.now() - NUDGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await admin
        .from("projects")
        .select("*")
        .eq("status", "awaiting_payment")
        .or(`last_nudge_sent_at.is.null,last_nudge_sent_at.lte.${cutoff}`);

      if (error) throw new Error(`DB error: ${error.message}`);
      projectsToNudge = data ?? [];
    } else {
      // MANUAL MODE: creator JWT + specific projectId
      const userClient = createUserClient(req);
      const {
        data: { user },
        error: userError,
      } = await userClient.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!body.projectId) throw new Error("Missing projectId for manual mode");

      const { data: project, error: pErr } = await admin
        .from("projects")
        .select("*")
        .eq("id", body.projectId)
        .eq("user_id", user.id)
        .single();

      if (pErr || !project) {
        return new Response(
          JSON.stringify({ error: "Project not found or access denied" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (project.status !== "awaiting_payment") {
        return new Response(
          JSON.stringify({
            error: "Cannot send nudge: project is not in 'awaiting_payment' status",
            status: project.status,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Enforce 3-day cooldown even for manual sends
      if (project.last_nudge_sent_at) {
        const last = new Date(project.last_nudge_sent_at).getTime();
        const msSince = Date.now() - last;
        const daysSince = msSince / (1000 * 60 * 60 * 24);
        if (daysSince < NUDGE_COOLDOWN_DAYS) {
          const nextAllowed = new Date(
            last + NUDGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
          ).toISOString();
          return new Response(
            JSON.stringify({
              error: `A reminder was already sent recently. Next reminder allowed after ${nextAllowed}`,
              next_allowed_at: nextAllowed,
            }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      projectsToNudge = [project];
    }

    // ── PROCESS EACH PROJECT ───────────────────────────────────────────────
    const results: Array<{
      projectId: string;
      projectName: string;
      clientEmail: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    for (const project of projectsToNudge) {
      const client = project.client || {};
      const clientEmail = client.email;

      if (!clientEmail) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          clientEmail: "",
          success: false,
          error: "No client email on record",
        });
        continue;
      }

      // Fetch creator profile
      const { data: creatorProfile } = await admin
        .from("profiles")
        .select("name, email")
        .eq("id", project.user_id)
        .single();

      const creatorName = creatorProfile?.name || "Your service provider";
      const previewUrl = `${appBaseUrl}/c/${project.client_link}`;

      const emailResult = await sendNudgeEmail({
        to: clientEmail,
        creatorName,
        clientName: client.name || "",
        projectName: project.name || "Your Project",
        amount: Number(project.amount) || 0,
        previewUrl,
        dueDate: project.due_date,
        resendApiKey,
        fromEmail,
      });

      if (emailResult.success) {
        // Update last_nudge_sent_at
        await admin
          .from("projects")
          .update({ last_nudge_sent_at: new Date().toISOString() })
          .eq("id", project.id);

        // Log in activity_logs
        await admin.from("activity_logs").insert({
          user_id: project.user_id,
          project_id: project.id,
          action: "nudge_sent",
          details: {
            to: clientEmail,
            messageId: emailResult.messageId,
            sent_by: isCron ? "cron" : "creator",
          },
        }).catch(() => {});
      }

      results.push({
        projectId: project.id,
        projectName: project.name,
        clientEmail,
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
      });
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        ok: true,
        mode: isCron ? "cron" : "manual",
        sent,
        failed,
        total: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    const status =
      err instanceof CorsError ? 403 : err instanceof RateLimitError ? 429 : 400;
    const retryAfter =
      err instanceof RateLimitError
        ? String(err.retryAfterSeconds)
        : undefined;
    return new Response(
      JSON.stringify({ error: err?.message || "Server error" }),
      {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          ...(retryAfter ? { "Retry-After": retryAfter } : {}),
        },
      }
    );
  }
});
