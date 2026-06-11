import Link from "next/link";
import { getToken } from "@/src/lib/dal";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { formatDate } from "@/src/lib/dateUtils";
import { ShareholderImportBatch } from "@/src/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function fetchBatches(token: string): Promise<ShareholderImportBatch[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/imports/shareholders/batches`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default async function ImportBatchesPage() {
  const token = await getToken();
  const batches = await fetchBatches(token);

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="text-sm text-slate-500">
          <Link href="/imports" className="hover:underline">
            Import Prep
          </Link>
          {" / "}
          <span className="text-slate-700 font-medium">All Batches</span>
        </div>

        <PageHeader
          eyebrow="Import Batches"
          title="All Import Batches"
          description="All shareholder import batches submitted across the platform."
        />

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {batches.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No import batches yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    File
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">
                    Rows
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">
                    Errors
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">
                    Warnings
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Submitted By
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/imports/batches/${batch.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {batch.source_filename || batch.id.slice(0, 8) + "…"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={batch.batch_status} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {batch.row_count ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {batch.error_count ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {batch.warning_count ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {batch.submitted_by ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(batch.created_at, { style: "date" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
