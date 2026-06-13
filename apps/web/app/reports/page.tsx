import { fetchDashboardSummary, fetchShareholders, fetchCertificates, fetchDividends } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { PrintButton } from "@/src/components/PrintButton";

function fmt(v: number | string | null) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v || 0));
}
function fmtInt(v: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(Number(v || 0));
}
function today() {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
}

export default async function ReportsPage() {
  const token = await getToken();
  const [summaryRes, shareholdersRes, certsRes, dividendsRes] = await Promise.all([
    fetchDashboardSummary(token ?? undefined),
    fetchShareholders(token ?? undefined, 1, 1000),
    fetchCertificates(token ?? undefined, 1, 1000),
    fetchDividends(token ?? undefined),
  ]);

  const summary = summaryRes.data ?? summaryRes;
  const shareholders = (shareholdersRes.data ?? []) as {
    type: string; status: string; kyc_status: string; kyc_expiry: string | null;
  }[];
  const certs = (certsRes.data ?? []) as { status: string; share_class: string; quantity: string }[];
  const dividends = (dividendsRes.data ?? []) as { total_declared_amount: string; status: string; entitlement_count: number }[];

  const byType: Record<string, number> = {};
  const byKyc: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const s of shareholders) {
    byType[s.type] = (byType[s.type] || 0) + 1;
    byKyc[s.kyc_status] = (byKyc[s.kyc_status] || 0) + 1;
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  }
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const kycExpired = shareholders.filter((s) => s.kyc_expiry && new Date(s.kyc_expiry) < now).length;
  const kycExpiring = shareholders.filter((s) => {
    if (!s.kyc_expiry) return false;
    const d = new Date(s.kyc_expiry);
    return d >= now && d <= in30;
  }).length;

  const certsByClass: Record<string, number> = {};
  for (const c of certs) {
    if (c.status === "issued") certsByClass[c.share_class] = (certsByClass[c.share_class] || 0) + Number(c.quantity);
  }

  const totalDividendsDeclared = dividends.reduce((s, d) => s + Number(d.total_declared_amount || 0), 0);
  const totalEntitlements = dividends.reduce((s, d) => s + (d.entitlement_count || 0), 0);
  const dividendByStatus: Record<string, number> = {};
  for (const d of dividends) {
    dividendByStatus[d.status] = (dividendByStatus[d.status] || 0) + 1;
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-5xl space-y-6 print:max-w-none">
        <PageHeader
          variant="page"
          title="Regulatory Summary Report"
          description={`Generated ${today()} — for internal governance and regulatory filing reference.`}
          badge={<PrintButton />}
        />

        {/* 1. Shareholder Registry */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-bold uppercase tracking-wide text-slate-500">1. Shareholder Registry</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatBox label="Total Shareholders" value={fmtInt(shareholders.length)} />
            <StatBox label="Active" value={fmtInt(byStatus["active"])} tone="green" />
            <StatBox label="Pending / Suspended" value={fmtInt((byStatus["pending"] || 0) + (byStatus["suspended"] || 0))} />
          </div>
          <ReportTable
            className="mt-4"
            headers={["Shareholder Type", "Count"]}
            rows={Object.entries(byType).map(([type, count]) => [
              <span key={type} className="capitalize">{type}</span>,
              fmtInt(count),
            ])}
          />
        </section>

        {/* 2. KYC Compliance */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-bold uppercase tracking-wide text-slate-500">2. KYC Compliance</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatBox label="Verified" value={fmtInt(byKyc["verified"])} tone="green" />
            <StatBox label="Pending" value={fmtInt(byKyc["pending"])} />
            <StatBox label="Expired" value={fmtInt(kycExpired)} tone={kycExpired > 0 ? "red" : "neutral"} />
            <StatBox label="Expiring (30 days)" value={fmtInt(kycExpiring)} tone={kycExpiring > 0 ? "amber" : "neutral"} />
          </div>
          <ReportTable
            className="mt-4"
            headers={["KYC Status", "Count", "% of Total"]}
            rows={Object.entries(byKyc).map(([status, count]) => [
              <span key={status} className="capitalize">{status.replace(/_/g, " ")}</span>,
              fmtInt(count),
              shareholders.length > 0 ? `${((count / shareholders.length) * 100).toFixed(1)}%` : "—",
            ])}
          />
        </section>

        {/* 3. Capital Structure */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-bold uppercase tracking-wide text-slate-500">3. Capital Structure (Issued Certificates)</h2>
          <ReportTable
            headers={["Share Class", "Issued Shares"]}
            rows={
              Object.keys(certsByClass).length > 0
                ? Object.entries(certsByClass).map(([cls, qty]) => [cls, fmt(qty)])
                : [["No issued certificates", "0"]]
            }
          />
        </section>

        {/* 4. Certificates */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-bold uppercase tracking-wide text-slate-500">4. Certificate Issuance</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatBox label="Total Certificates" value={fmtInt(summary.certificate_count)} />
            <StatBox label="Issued" value={fmtInt(summary.issued_certificate_count)} tone="green" />
            <StatBox label="Revoked" value={fmtInt(summary.revoked_certificate_count)} tone={summary.revoked_certificate_count > 0 ? "red" : "neutral"} />
          </div>
        </section>

        {/* 5. Dividend Register */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-bold uppercase tracking-wide text-slate-500">5. Dividend Register</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatBox label="Declarations" value={fmtInt(dividends.length)} />
            <StatBox label="Total Declared (ETB)" value={fmt(totalDividendsDeclared)} />
            <StatBox label="Total Entitlements" value={fmtInt(totalEntitlements)} />
          </div>
          {dividends.length > 0 && (
            <ReportTable
              className="mt-4"
              headers={["Status", "Count"]}
              rows={Object.entries(dividendByStatus).map(([status, count]) => [
                <span key={status} className="capitalize">{status}</span>,
                fmtInt(count),
              ])}
            />
          )}
        </section>

        {/* 6. Governance Activity */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-bold uppercase tracking-wide text-slate-500">6. Governance Activity</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Total Transfers" value={fmtInt(summary.transfer_count)} />
            <StatBox label="Pending Approvals" value={fmtInt(summary.pending_approval_count)} tone={summary.pending_approval_count > 0 ? "amber" : "neutral"} />
            <StatBox label="Active Legal Holds" value={fmtInt(summary.active_legal_hold_count)} />
            <StatBox label="Audit Log Entries" value={fmtInt(summary.audit_log_count)} />
          </div>
        </section>

        <p className="pb-6 text-center text-xs text-slate-400">
          Digaf Microcredit Provider SC — Internal Governance Report — {today()}
        </p>
      </div>
    </PageContainer>
  );
}

type Tone = "green" | "red" | "amber" | "neutral";
const toneMap: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-900",
  red: "bg-red-50 text-red-900",
  amber: "bg-amber-50 text-amber-900",
  neutral: "bg-slate-50 text-slate-900",
};

function StatBox({ label, value, tone = "neutral" }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className={`rounded-xl p-4 ${toneMap[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ReportTable({
  headers,
  rows,
  className = "",
}: {
  headers: string[];
  rows: (string | React.JSX.Element)[][];
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 ${className}`}>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="border-b border-slate-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border-b border-slate-100 px-4 py-2.5 text-sm text-slate-800">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
