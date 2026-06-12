import Link from "next/link";
import { fetchDividends } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { EmptyState } from "@/src/components/EmptyState";
import { CreateDividendForm } from "@/src/components/CreateDividendForm";
import { fetchShareClasses } from "@/src/lib/api";

type Declaration = {
  id: string;
  share_class_name: string | null;
  declared_date: string;
  record_date: string;
  payment_date: string | null;
  amount_per_share: string;
  total_declared_amount: string;
  withholding_tax_rate: string;
  status: string;
  board_resolution_ref: string | null;
  entitlement_count: number;
  total_net_amount: string;
};

function fmt(value: string | number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

export default async function DividendsPage() {
  const token = await getToken();
  const [dividendsResponse, shareClassesResponse] = await Promise.all([
    fetchDividends(token ?? undefined),
    fetchShareClasses(token ?? undefined),
  ]);
  const declarations: Declaration[] = dividendsResponse.data ?? [];
  const shareClasses = (shareClassesResponse.data ?? []) as { share_class_id: string; class_name: string }[];

  const totalDeclared = declarations.reduce((s, d) => s + Number(d.total_declared_amount || 0), 0);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Dividend Register"
          description="Declare dividends, auto-compute per-shareholder entitlements from issued certificates, and track payment status."
          badge={
            <div className="flex flex-wrap items-center gap-2">
              <div className="max-w-full break-words rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">
                {declarations.length} Declarations
              </div>
              <div className="max-w-full break-words rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 sm:px-4 sm:py-2 sm:text-sm">
                ETB {fmt(totalDeclared)} Total Declared
              </div>
            </div>
          }
        />

        {/* Create form */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Declare New Dividend</h2>
          <CreateDividendForm shareClasses={shareClasses} />
        </section>

        {/* List */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">All Declarations</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {declarations.length > 0 ? (
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">Record Date</th>
                    <th className="border-b border-slate-200 px-4 py-3">Share Class</th>
                    <th className="border-b border-slate-200 px-4 py-3">Per Share (ETB)</th>
                    <th className="border-b border-slate-200 px-4 py-3">Total Declared (ETB)</th>
                    <th className="border-b border-slate-200 px-4 py-3">WHT Rate</th>
                    <th className="border-b border-slate-200 px-4 py-3">Shareholders</th>
                    <th className="border-b border-slate-200 px-4 py-3">Payment Date</th>
                    <th className="border-b border-slate-200 px-4 py-3">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {declarations.map((d) => (
                    <tr key={d.id}>
                      <td className="border-b border-slate-100 px-4 py-3 font-medium">{fmtDate(d.record_date)}</td>
                      <td className="border-b border-slate-100 px-4 py-3">{d.share_class_name ?? "All classes"}</td>
                      <td className="border-b border-slate-100 px-4 py-3 font-mono">{fmt(d.amount_per_share)}</td>
                      <td className="border-b border-slate-100 px-4 py-3 font-semibold font-mono">{fmt(d.total_declared_amount)}</td>
                      <td className="border-b border-slate-100 px-4 py-3">{(Number(d.withholding_tax_rate) * 100).toFixed(0)}%</td>
                      <td className="border-b border-slate-100 px-4 py-3">{d.entitlement_count}</td>
                      <td className="border-b border-slate-100 px-4 py-3">{fmtDate(d.payment_date)}</td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <Link
                          href={`/dividends/${d.id}`}
                          className="text-xs font-semibold text-slate-700 underline hover:text-slate-900"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                <EmptyState title="No dividend declarations yet" />
              </div>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
