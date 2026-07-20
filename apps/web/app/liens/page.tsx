import { fetchLiens } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { RegisterLienButton } from "@/src/components/RegisterLienButton";
import { LienActions } from "@/src/components/LienActions";

type Lien = {
  id: string;
  entity_id: string;
  share_ownership_id: string;
  shareholder_id: string;
  shareholder_name: string;
  share_class_name: string;
  position_quantity: string;
  lien_type: string;
  quantity: string;
  reason: string;
  authority_reference: string | null;
  status: string;
  requested_by: string;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  release_requested_by: string | null;
  release_requested_at: string | null;
  released_by: string | null;
  released_at: string | null;
  decision_notes: string | null;
};

const STATUS_TONE: Record<string, "danger" | "warning" | "neutral" | "success" | undefined> = {
  active: "danger",
  pending_approval: "warning",
  pending_release: "warning",
  rejected: "neutral",
  released: "success",
};

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function LiensPage() {
  const token = await getToken();
  const response = await fetchLiens(token ?? undefined);
  const liens: Lien[] = response.data;

  const activeLiens = liens.filter((l) => l.status === "active");
  const pendingCount = liens.filter((l) => l.status === "pending_approval" || l.status === "pending_release").length;
  const totalPledged = liens
    .filter((l) => l.status === "active" && l.lien_type === "pledge")
    .reduce((sum, l) => sum + Number(l.quantity), 0);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="Liens & Pledges"
          description="Register and release pledges, security interests, and other legal encumbrances over shares."
          badge={<RegisterLienButton />}
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <KpiCard label="Total Records" value={liens.length} detail="Lien / pledge records" />
            <KpiCard
              label="Active Encumbrances"
              value={activeLiens.length}
              detail={`${totalPledged.toLocaleString()} shares pledged`}
              tone={activeLiens.length > 0 ? "warning" : "neutral"}
            />
            <KpiCard
              label="Pending Action"
              value={pendingCount}
              detail="Awaiting approval"
              tone={pendingCount > 0 ? "warning" : "neutral"}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {liens.length > 0 ? (
              <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shareholder</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Share Class</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Requested By</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Requested At</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liens.map((lien) => (
                    <tr key={lien.id} className="transition-colors hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-4 py-3 font-medium">{lien.shareholder_name}</td>
                      <td className="border-b border-slate-100 px-4 py-3">{lien.share_class_name}</td>
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">{formatLabel(lien.lien_type)}</td>
                      <td className="border-b border-slate-100 px-4 py-3">{lien.quantity}</td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <span className="break-words">{lien.reason}</span>
                        {lien.authority_reference && (
                          <span className="mt-0.5 block text-xs text-slate-400">Ref: {lien.authority_reference}</span>
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge status={lien.status} tone={STATUS_TONE[lien.status]} />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">{lien.requested_by}</td>
                      <td className="border-b border-slate-100 px-4 py-3">{formatDate(lien.requested_at)}</td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <LienActions
                          lienId={lien.id}
                          status={lien.status}
                          requestedBy={lien.requested_by}
                          releaseRequestedBy={lien.release_requested_by}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No liens or pledges recorded"
                  description="Register a lien or pledge using the button above."
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
