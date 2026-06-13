import { Suspense } from "react";
import { getToken } from "@/src/lib/dal";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { PageSkeleton } from "@/src/components/LoadingSkeleton";
import { formatDate } from "@/src/lib/dateUtils";
import { CreateShareClassForm } from "@/src/components/CreateShareClassForm";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function ShareClassesContent() {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/share-classes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = res.ok ? await res.json() : { data: [] };
  const shareClasses: any[] = json.data ?? [];

  return (
    <div className="space-y-6">
      <CreateShareClassForm />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {shareClasses.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No share classes defined yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Class Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Par Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Voting</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Votes/Share</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shareClasses.map((sc: any) => (
                <tr key={sc.share_class_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{sc.class_name}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{sc.par_value}</td>
                  <td className="px-4 py-3 text-slate-600">{sc.voting_rights ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{sc.votes_per_share ?? 1}</td>
                  <td className="px-4 py-3 text-slate-500">{sc.voting_class_tier ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={sc.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{sc.notes ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(sc.created_at, { style: "date" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function ShareClassesPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          variant="page"
          eyebrow="Share Classes"
          title="Share Class Management"
          description="Define and manage share classes for the entity."
        />
        <Suspense fallback={<PageSkeleton />}>
          <ShareClassesContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}
