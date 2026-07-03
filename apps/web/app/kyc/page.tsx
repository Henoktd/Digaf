import Link from "next/link";
import { fetchShareholders } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { EmptyState } from "@/src/components/EmptyState";

type Shareholder = {
  shareholder_id: string;
  legal_name: string;
  type: string;
  status: string;
  kyc_status: string;
  kyc_expiry: string | null;
  mobile_number: string | null;
  email_address: string | null;
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(v));
}

export default async function KycCompliancePage() {
  const token = await getToken();
  const response = await fetchShareholders(token ?? undefined, 1, 1000);
  const all = (response.data ?? []) as Shareholder[];

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const in90 = new Date(now.getTime() + 90 * 86400000);

  const expired = all.filter((s) => s.kyc_expiry && new Date(s.kyc_expiry) < now);
  const expiring30 = all.filter((s) => {
    if (!s.kyc_expiry) return false;
    const d = new Date(s.kyc_expiry);
    return d >= now && d <= in30;
  });
  const expiring90 = all.filter((s) => {
    if (!s.kyc_expiry) return false;
    const d = new Date(s.kyc_expiry);
    return d > in30 && d <= in90;
  });
  const noExpiry = all.filter((s) => !s.kyc_expiry && s.kyc_status !== "verified");
  const verified = all.filter((s) => s.kyc_status === "verified" && (!s.kyc_expiry || new Date(s.kyc_expiry) >= now));

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="KYC Compliance Monitor"
          description="Track KYC verification status, expiry alerts, and renewal requirements across all shareholders."
          badge={
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                {all.length} Shareholders
              </div>
              {expired.length > 0 && (
                <div className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white">
                  {expired.length} Expired
                </div>
              )}
            </div>
          }
        />

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Verified", value: verified.length, tone: "border-emerald-200 bg-emerald-50 text-emerald-900", labelColor: "text-emerald-700" },
            { label: "Expired", value: expired.length, tone: "border-red-200 bg-red-50 text-red-900", labelColor: "text-red-700" },
            { label: "Expiring (30 days)", value: expiring30.length, tone: "border-amber-200 bg-amber-50 text-amber-900", labelColor: "text-amber-700" },
            { label: "Expiring (90 days)", value: expiring90.length, tone: "border-orange-200 bg-orange-50 text-orange-900", labelColor: "text-orange-700" },
            { label: "No Expiry Set", value: noExpiry.length, tone: "border-slate-200 bg-slate-50 text-slate-900", labelColor: "text-slate-500" },
          ].map(({ label, value, tone, labelColor }) => (
            <div key={label} className={`rounded-xl border p-4 ${tone}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${labelColor}`}>{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Expired */}
        <KycSection
          title="Expired KYC"
          tone="red"
          description="These shareholders cannot participate in transfers until KYC is renewed."
          shareholders={expired}
          showDays
        />

        {/* Expiring in 30 days */}
        <KycSection
          title="Expiring Within 30 Days"
          tone="amber"
          description="Initiate KYC renewal now to avoid disruption to transfer eligibility."
          shareholders={expiring30}
          showDays
        />

        {/* Expiring in 90 days */}
        <KycSection
          title="Expiring Within 90 Days"
          tone="orange"
          description="Schedule KYC renewal to maintain continuous compliance."
          shareholders={expiring90}
          showDays
        />

        {/* No expiry set */}
        {noExpiry.length > 0 && (
          <KycSection
            title="No Expiry Date Set"
            tone="slate"
            description="These shareholders have KYC on record but no expiry date — review and update as needed."
            shareholders={noExpiry}
            showDays={false}
          />
        )}

        {/* All good */}
        {expired.length === 0 && expiring30.length === 0 && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">✓</div>
              <div>
                <p className="font-bold text-emerald-800">No urgent KYC issues</p>
                <p className="text-sm text-slate-500">{verified.length} shareholders are verified with valid KYC.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}

function KycSection({
  title,
  tone,
  description,
  shareholders,
  showDays,
}: {
  title: string;
  tone: "red" | "amber" | "orange" | "slate";
  description: string;
  shareholders: Shareholder[];
  showDays: boolean;
}) {
  if (shareholders.length === 0) return null;

  const toneMap = {
    red: "border-red-200 bg-red-50",
    amber: "border-amber-200 bg-amber-50",
    orange: "border-orange-200 bg-orange-50",
    slate: "border-slate-200 bg-slate-50",
  };
  const titleMap = {
    red: "text-red-800",
    amber: "text-amber-800",
    orange: "text-orange-800",
    slate: "text-slate-800",
  };

  return (
    <section className={`rounded-2xl border p-4 shadow-sm sm:p-6 ${toneMap[tone]}`}>
      <h2 className={`text-lg font-bold ${titleMap[tone]}`}>
        {title} ({shareholders.length})
      </h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-white bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shareholder</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">KYC Status</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry Date</th>
              {showDays && <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Days</th>}
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {shareholders.map((s) => {
              const days = s.kyc_expiry ? daysUntil(s.kyc_expiry) : null;
              return (
                <tr key={s.shareholder_id} className="transition-colors hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">
                    {s.legal_name}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize text-slate-600">
                    {s.type}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    <StatusBadge status={s.kyc_status} />
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {fmtDate(s.kyc_expiry)}
                  </td>
                  {showDays && (
                    <td className={`border-b border-slate-100 px-4 py-3 font-semibold ${days !== null && days < 0 ? "text-red-600" : days !== null && days <= 30 ? "text-amber-600" : "text-slate-600"}`}>
                      {days !== null ? (days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`) : "—"}
                    </td>
                  )}
                  <td className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
                    {s.email_address || s.mobile_number || "—"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    <Link
                      href={`/shareholders/${s.shareholder_id}`}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Update KYC →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
