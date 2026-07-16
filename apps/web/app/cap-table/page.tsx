import { fetchCapTable } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { CapTableTreemap, type TreemapRow } from "@/src/components/CapTableTreemap";

type CapTableRow = {
  shareholder_id: string;
  shareholder_name: string;
  shareholder_type: string;
  share_class: string;
  quantity: string;
  pledged_quantity: string;
  encumbered_quantity: string;
  total_entity_shares: string;
  ownership_percentage: string;
  status: string;
};

function formatNumber(value: number | string) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    Number(value || 0)
  );
}

export default async function CapTablePage() {
  const token = await getToken();
  const response = await fetchCapTable(token ?? undefined);
  const rows: CapTableRow[] = response.data;

  const totalShares = Number(rows[0]?.total_entity_shares || 0);

  // Aggregate per shareholder for concentration analytics
  const byHolder = new Map<string, number>();
  for (const r of rows) {
    byHolder.set(
      r.shareholder_id,
      (byHolder.get(r.shareholder_id) ?? 0) + Number(r.ownership_percentage)
    );
  }
  const pcts = [...byHolder.values()].sort((a, b) => b - a);
  const topN = (n: number) =>
    pcts.slice(0, n).reduce((a, b) => a + b, 0);
  // Herfindahl–Hirschman Index on 0–10,000 scale; > 2,500 = highly concentrated
  const hhi = Math.round(pcts.reduce((sum, p) => sum + p * p, 0));
  const hhiLabel =
    hhi > 2500 ? "highly concentrated" : hhi > 1500 ? "moderately concentrated" : "unconcentrated";

  const treemapRows: TreemapRow[] = rows.map((r) => ({
    shareholder_id: r.shareholder_id,
    shareholder_name: r.shareholder_name,
    shareholder_type: r.shareholder_type,
    share_class: r.share_class,
    quantity: Number(r.quantity),
    pledged_quantity: Number(r.pledged_quantity),
    ownership_percentage: Number(r.ownership_percentage),
  }));

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          variant="page"
          title="Cap Table"
          description="Ownership structure, concentration, pledged and encumbered shares."
          badge={
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              {formatNumber(totalShares)} Total Shares
            </div>
          }
        />

        {rows.length > 0 ? (
          <>
            {/* Concentration analytics */}
            <section className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
              <KpiCard
                label="Largest Shareholder"
                value={`${topN(1).toFixed(1)}%`}
                detail={`${byHolder.size} shareholders total`}
              />
              <KpiCard
                label="Top 5 Combined"
                value={`${Math.min(100, topN(5)).toFixed(1)}%`}
                detail="of issued shares"
              />
              <KpiCard
                label="Top 10 Combined"
                value={`${Math.min(100, topN(10)).toFixed(1)}%`}
                detail="of issued shares"
              />
              <KpiCard
                label="Concentration (HHI)"
                value={formatNumber(hhi)}
                detail={hhiLabel}
                tone={hhi > 2500 ? "warning" : "neutral"}
              />
            </section>

            {/* Ownership map */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-slate-900">Ownership map</h2>
                <p className="mt-0.5 text-[12.5px] text-slate-500">
                  Every shareholder&apos;s stake at a glance — colored by share class.
                </p>
              </div>
              <CapTableTreemap rows={treemapRows} />
            </section>

            {/* Detail table */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-[15px] font-semibold text-slate-900">All positions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="bg-slate-50 text-[11.5px] uppercase tracking-[0.05em] text-slate-500">
                      <th className="border-b border-slate-100 px-5 py-2.5 font-semibold">Shareholder</th>
                      <th className="border-b border-slate-100 px-4 py-2.5 font-semibold">Type</th>
                      <th className="border-b border-slate-100 px-4 py-2.5 font-semibold">Class</th>
                      <th className="border-b border-slate-100 px-4 py-2.5 text-right font-semibold">Quantity</th>
                      <th className="border-b border-slate-100 px-4 py-2.5 text-right font-semibold">Ownership</th>
                      <th className="border-b border-slate-100 px-4 py-2.5 text-right font-semibold">Pledged</th>
                      <th className="border-b border-slate-100 px-4 py-2.5 text-right font-semibold">Encumbered</th>
                      <th className="border-b border-slate-100 px-5 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={`${row.shareholder_id}-${row.share_class}-${i}`}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="border-b border-slate-100 px-5 py-3 font-medium text-slate-900">
                          {row.shareholder_name}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 capitalize text-slate-600">
                          {row.shareholder_type}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {row.share_class}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-600 tabular-nums">
                          {formatNumber(row.quantity)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                          {row.ownership_percentage}%
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-600 tabular-nums">
                          {formatNumber(row.pledged_quantity)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-600 tabular-nums">
                          {formatNumber(row.encumbered_quantity)}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <EmptyState
              title="No cap table data yet"
              description="Add shareholders and allocate shares — the ownership map will build itself."
            />
          </section>
        )}
      </div>
    </PageContainer>
  );
}
