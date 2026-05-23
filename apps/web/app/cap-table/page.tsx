import { fetchCapTable } from "@/src/lib/api";

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

export default async function CapTablePage() {
  const response = await fetchCapTable();
  const rows: CapTableRow[] = response.data;

  const totalShares = rows[0]?.total_entity_shares || "0";

  return (
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cap Table</h1>
            <p className="mt-2 text-slate-600">
              View ownership, share classes, concentration, pledged shares,
              encumbered shares, and historical snapshots.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Total Shares: {totalShares}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {rows.slice(0, 3).map((row) => (
            <div
              key={row.shareholder_id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-sm text-slate-500">Shareholder</p>
              <h2 className="mt-1 text-lg font-semibold">
                {row.shareholder_name}
              </h2>
              <p className="mt-3 text-3xl font-bold">
                {row.ownership_percentage}%
              </p>
              <p className="text-sm text-slate-500">Ownership</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3">
                  Shareholder
                </th>
                <th className="border-b border-slate-200 px-4 py-3">Type</th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Share Class
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Quantity
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Ownership %
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Pledged
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Encumbered
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.shareholder_id}>
                  <td className="border-b border-slate-100 px-4 py-3 font-medium">
                    {row.shareholder_name}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {row.shareholder_type}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {row.share_class}
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
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}