import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchDividend } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { PageContainer } from "@/src/components/PageContainer";
import { StatusBadge } from "@/src/components/StatusBadge";
import { MarkDividendPaidButton } from "@/src/components/MarkDividendPaidButton";

type Entitlement = {
  id: string;
  shareholder_id: string;
  shareholder_name: string;
  shares_at_record_date: string;
  gross_amount: string;
  withholding_tax_amount: string;
  net_amount: string;
  payment_status: string;
};

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
  notes: string | null;
  declared_by: string | null;
};

function fmt(value: string | number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

type PageProps = { params: Promise<{ id: string }> };

export default async function DividendDetailPage({ params }: PageProps) {
  const { id } = await params;
  const token = await getToken();

  let declaration: Declaration;
  let entitlements: Entitlement[];
  try {
    const response = await fetchDividend(id, token ?? undefined);
    declaration = response.data.declaration;
    entitlements = response.data.entitlements;
  } catch {
    notFound();
  }

  const totalNet = entitlements.reduce((s, e) => s + Number(e.net_amount), 0);
  const totalTax = entitlements.reduce((s, e) => s + Number(e.withholding_tax_amount), 0);
  const paidCount = entitlements.filter((e) => e.payment_status === "paid").length;

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              <Link href="/dividends" className="hover:underline">Dividend Register</Link>
              {" / "}
              <span className="font-mono text-xs">{id}</span>
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Dividend — Record Date {fmtDate(declaration.record_date)}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {declaration.share_class_name ?? "All share classes"} ·{" "}
              ETB {fmt(declaration.amount_per_share)} per share ·{" "}
              WHT {(Number(declaration.withholding_tax_rate) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={declaration.status} />
            {declaration.status === "declared" && (
              <MarkDividendPaidButton dividendId={declaration.id} />
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total Gross (ETB)", fmt(declaration.total_declared_amount)],
            ["Total WHT (ETB)", fmt(totalTax)],
            ["Total Net (ETB)", fmt(totalNet)],
            ["Shareholders", `${paidCount} / ${entitlements.length} paid`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Meta */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Declaration Details</h2>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Declared Date", fmtDate(declaration.declared_date)],
              ["Record Date", fmtDate(declaration.record_date)],
              ["Payment Date", fmtDate(declaration.payment_date)],
              ["Board Resolution", declaration.board_resolution_ref ?? "—"],
              ["Declared By", declaration.declared_by ?? "—"],
              ["Notes", declaration.notes ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Entitlements table */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Shareholder Entitlements ({entitlements.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">Shareholder</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Shares</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Gross (ETB)</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">WHT (ETB)</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Net (ETB)</th>
                  <th className="border-b border-slate-200 px-4 py-3">Payment</th>
                </tr>
              </thead>
              <tbody>
                {entitlements.map((e) => (
                  <tr key={e.id}>
                    <td className="border-b border-slate-100 px-4 py-3 font-medium">{e.shareholder_name}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-right font-mono">{fmt(e.shares_at_record_date)}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-right font-mono">{fmt(e.gross_amount)}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-right font-mono text-amber-700">{fmt(e.withholding_tax_amount)}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-right font-mono font-semibold">{fmt(e.net_amount)}</td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <StatusBadge status={e.payment_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right font-mono font-bold">{fmt(declaration.total_declared_amount)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">{fmt(totalTax)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{fmt(totalNet)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
