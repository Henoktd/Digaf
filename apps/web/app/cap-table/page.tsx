import { fetchCapTable } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";

type CapTableRow = {
  shareholder_id: string;
  shareholder_name: string;
  shareholder_type: string;
  quantity: string;
  pledged_quantity: string;
  encumbered_quantity: string;
  total_entity_shares: string;
  ownership_percentage: string;
  status: string;
};

export default async function CapTablePage() {
  const token = await getToken();
  const response = await fetchCapTable(token ?? undefined);
  const rows: CapTableRow[] = response.data;

  const totalShares = rows[0]?.total_entity_shares || "0";

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="Cap Table"
          description="View ownership, concentration, pledged shares, encumbered shares, and historical snapshots."
          badge={
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              {totalShares} Total Shares
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {rows.slice(0, 3).map((row) => (
            <KpiCard
              key={row.shareholder_id}
              label={row.shareholder_name}
              value={`${row.ownership_percentage}%`}
              detail="Ownership"
            />
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          {rows.length > 0 ? (
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shareholder</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ownership %</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Pledged</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Encumbered</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.shareholder_id} className="transition-colors hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-4 py-3 font-medium">
                      {row.shareholder_name}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 capitalize">
                      {row.shareholder_type}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {row.quantity}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 font-semibold">
                      {row.ownership_percentage}%
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {row.pledged_quantity}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {row.encumbered_quantity}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4">
              <EmptyState title="No cap table rows found" />
            </div>
          )}
        </div>
        </section>
      </div>
    </PageContainer>
  );
}
