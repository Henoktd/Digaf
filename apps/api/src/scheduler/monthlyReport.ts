import { pool } from "../db/pool";
import { sendMail } from "../utils/email";

// Monthly registry summary emailed to REPORT_RECIPIENTS (comma-separated).
// Scheduled from server.ts on the 1st of each month at 08:00 EAT.

type SummaryRow = {
  shareholder_count: number;
  active_shareholder_count: number;
  kyc_verified: number;
  kyc_expired: number;
  kyc_expiring: number;
  certificate_count: number;
  issued_certificates: number;
  pending_approvals: number;
  overdue_approvals: number;
  transfers_last_month: number;
  dividend_count: number;
};

async function collectSummary(): Promise<SummaryRow> {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM shareholder) AS shareholder_count,
      (SELECT COUNT(*)::int FROM shareholder WHERE status = 'active') AS active_shareholder_count,
      (SELECT COUNT(*)::int FROM shareholder WHERE kyc_status = 'verified') AS kyc_verified,
      (SELECT COUNT(*)::int FROM shareholder WHERE kyc_expiry < now()) AS kyc_expired,
      (SELECT COUNT(*)::int FROM shareholder WHERE kyc_expiry >= now() AND kyc_expiry < now() + interval '60 days') AS kyc_expiring,
      (SELECT COUNT(*)::int FROM certificate) AS certificate_count,
      (SELECT COUNT(*)::int FROM certificate WHERE status = 'issued') AS issued_certificates,
      (SELECT COUNT(*)::int FROM approval_request WHERE status = 'pending') AS pending_approvals,
      (SELECT COUNT(*)::int FROM approval_request WHERE status = 'pending' AND sla_due_date < now()) AS overdue_approvals,
      (SELECT COUNT(*)::int FROM share_transfer WHERE created_at >= date_trunc('month', now()) - interval '1 month' AND created_at < date_trunc('month', now())) AS transfers_last_month,
      (SELECT COUNT(*)::int FROM dividend_declaration) AS dividend_count
  `);
  return result.rows[0];
}

function row(label: string, value: string | number, warn = false) {
  const color = warn ? "#A83226" : "#1B211E";
  return `<tr>
    <td style="padding:8px 0;color:#6B7671;font-size:13px;border-bottom:1px solid #F1F3F1">${label}</td>
    <td style="padding:8px 0;color:${color};font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #F1F3F1">${value}</td>
  </tr>`;
}

export async function sendMonthlyReport(): Promise<boolean> {
  const recipients = (process.env.REPORT_RECIPIENTS ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  if (recipients.length === 0) return false;

  const s = await collectSummary();
  const monthName = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date(Date.now() - 15 * 24 * 3600 * 1000)); // previous month

  const text = `
Digaf Registry — Monthly Summary (${monthName})

Shareholders: ${s.shareholder_count} (${s.active_shareholder_count} active)
KYC: ${s.kyc_verified} verified · ${s.kyc_expired} expired · ${s.kyc_expiring} expiring within 60 days
Certificates: ${s.certificate_count} total · ${s.issued_certificates} issued
Approvals: ${s.pending_approvals} pending · ${s.overdue_approvals} overdue
Transfers last month: ${s.transfers_last_month}
Dividend declarations: ${s.dividend_count}
  `.trim();

  const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#F6F7F5">
  <div style="background:#fff;border:1px solid #E6E9E6;border-radius:12px;padding:28px">
    <h2 style="color:#1B211E;margin:0 0 4px;font-size:18px">Digaf Registry — Monthly Summary</h2>
    <p style="color:#6B7671;margin:0 0 20px;font-size:13px">${monthName}</p>
    <table style="width:100%;border-collapse:collapse">
      ${row("Shareholders", `${s.shareholder_count} (${s.active_shareholder_count} active)`)}
      ${row("KYC verified", s.kyc_verified)}
      ${row("KYC expired", s.kyc_expired, s.kyc_expired > 0)}
      ${row("KYC expiring (60 days)", s.kyc_expiring, s.kyc_expiring > 0)}
      ${row("Certificates issued", `${s.issued_certificates} of ${s.certificate_count}`)}
      ${row("Approvals pending", s.pending_approvals)}
      ${row("Approvals overdue", s.overdue_approvals, s.overdue_approvals > 0)}
      ${row("Transfers last month", s.transfers_last_month)}
      ${row("Dividend declarations", s.dividend_count)}
    </table>
    <p style="margin:20px 0 0;font-size:12px;color:#8A948E">
      Automated report from the Digaf Shareholder Registry Platform.
    </p>
  </div>
</div>
  `.trim();

  await sendMail({
    to: recipients,
    subject: `Digaf Registry — Monthly Summary (${monthName})`,
    text,
    html,
  });
  return true;
}

// Minimal scheduler: checks hourly whether it's the 1st, 08:00–08:59 EAT,
// and sends once per month (guarded by a marker in the DB).
export function startMonthlyReportScheduler() {
  const CHECK_INTERVAL_MS = 60 * 60 * 1000;

  async function tick() {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        hour: "numeric",
        hour12: false,
        timeZone: "Africa/Addis_Ababa",
      }).formatToParts(new Date());
      const day = Number(parts.find((p) => p.type === "day")?.value);
      const hour = Number(parts.find((p) => p.type === "hour")?.value);
      if (day !== 1 || hour !== 8) return;

      // Once-per-month guard persisted in the DB so container restarts are safe
      const marker = `monthly_report_${new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Africa/Addis_Ababa" }).format(new Date())}`;
      const existing = await pool.query(
        `SELECT 1 FROM communication_log WHERE subject = $1 LIMIT 1`,
        [marker]
      );
      if ((existing.rowCount ?? 0) > 0) return;

      const sent = await sendMonthlyReport();
      if (sent) {
        await pool.query(
          `INSERT INTO communication_log (entity_id, type, channel, subject, delivery_status, sent_at)
           SELECT entity_id, 'scheduled_report', 'email', $1, 'sent', now() FROM entity LIMIT 1`,
          [marker]
        );
        console.log(`Monthly report sent (${marker})`);
      }
    } catch (error) {
      console.error("Monthly report scheduler error:", error);
    }
  }

  setInterval(tick, CHECK_INTERVAL_MS);
  tick();
}
