import { Suspense } from "react";
import { getToken } from "@/src/lib/dal";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { PageSkeleton } from "@/src/components/LoadingSkeleton";
import { formatDate } from "@/src/lib/dateUtils";
import { CreateBoardResolutionForm } from "@/src/components/CreateBoardResolutionForm";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function BoardResolutionsContent() {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/board-resolutions`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = res.ok ? await res.json() : { data: [] };
  const resolutions: any[] = json.data ?? [];

  return (
    <div className="space-y-6">
      <CreateBoardResolutionForm />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {resolutions.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No board resolutions recorded yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Resolution No.</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Approved Action</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">SharePoint</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {resolutions.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.resolution_number}</td>
                  <td className="px-4 py-3 text-slate-600">{r.resolution_date}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{r.description}</td>
                  <td className="px-4 py-3 text-slate-500">{r.approved_action ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.sharepoint_document_url ? (
                      <a
                        href={r.sharepoint_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(r.created_at, { style: "date" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function BoardResolutionsPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Governance"
          title="Board Resolutions"
          description="Record and track board resolutions that authorise governance actions."
        />
        <Suspense fallback={<PageSkeleton />}>
          <BoardResolutionsContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}
