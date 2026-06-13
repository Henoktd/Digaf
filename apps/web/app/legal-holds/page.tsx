import { fetchLegalHolds } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";

type LegalHold = {
  id: string;
  entity_id: string;
  entity_name: string;
  hold_type: string;
  related_record_type: string;
  related_record_id: string;
  related_shareholder_name: string | null;
  imposed_by: string;
  imposed_at: string;
  reason: string;
  status: string;
  lifted_by: string | null;
  lifted_at: string | null;
  authority_reference: string | null;
  transfer_freeze_id: string | null;
  freeze_type: string | null;
  freeze_status: string | null;
  freeze_reason: string | null;
  freeze_imposed_at: string | null;
};

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function LegalHoldsPage() {
  const token = await getToken();
  const response = await fetchLegalHolds(token ?? undefined);
  const legalHolds: LegalHold[] = response.data;
  const activeHolds = legalHolds.filter((hold) => hold.status === "active");
  const activeFreezeCount = new Set(
    legalHolds
      .filter((hold) => hold.freeze_status === "active")
      .map((hold) => hold.transfer_freeze_id)
      .filter(Boolean)
  ).size;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="Legal Hold Management"
          description="Track legal holds, regulatory review freezes, and preservation controls for shareholder governance records."
          badge={
            <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Read-only
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Total Holds"
            value={legalHolds.length}
            detail="Legal hold records"
          />
          <KpiCard
            label="Active Holds"
            value={activeHolds.length}
            detail="Preservation active"
            tone={activeHolds.length > 0 ? "danger" : "neutral"}
          />
          <KpiCard
            label="Active Freezes"
            value={activeFreezeCount}
            detail="Transfer blocks"
            tone={activeFreezeCount > 0 ? "warning" : "neutral"}
          />
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Active Holds</h2>
              <p className="mt-1 text-sm text-slate-600">
                Current preservation controls and linked transfer freezes.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {activeHolds.length} active
            </span>
          </div>

          {activeHolds.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {activeHolds.map((hold) => (
                <article
                  key={hold.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        {hold.entity_name}
                      </p>
                      <h3 className="mt-1 text-lg font-bold capitalize text-slate-900">
                        {formatLabel(hold.hold_type)}
                      </h3>
                    </div>

                    <StatusBadge status="active" tone="danger" />
                  </div>

                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Shareholder</dt>
                      <dd className="font-semibold text-slate-900">
                        {hold.related_shareholder_name || "Not linked"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Reason</dt>
                      <dd className="break-words text-slate-900">
                        {hold.reason}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Freeze</dt>
                      <dd className="font-semibold capitalize text-slate-900">
                        {formatLabel(hold.freeze_status)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active legal holds found"
              className="bg-white"
            />
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          {legalHolds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Hold Type</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shareholder</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Authority Ref</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Imposed By</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Imposed At</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Freeze</th>
                  </tr>
                </thead>

                <tbody>
                  {legalHolds.map((hold) => (
                    <tr key={hold.id}>
                      <td className="border-b border-slate-100 px-4 py-3 font-medium capitalize">
                        {formatLabel(hold.hold_type)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {hold.related_shareholder_name || "Not linked"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {hold.reason}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge
                          status={hold.status}
                          tone={hold.status === "active" ? "danger" : undefined}
                        />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <span className="break-words">
                          {hold.authority_reference || "Not set"}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {hold.imposed_by}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDate(hold.imposed_at)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <div className="capitalize">
                          <StatusBadge
                            status={hold.freeze_status}
                            label={formatLabel(hold.freeze_status)}
                            tone={
                              hold.freeze_status === "active"
                                ? "warning"
                                : undefined
                            }
                          />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          <span className="break-words">
                            {hold.freeze_reason || "No active freeze"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState title="No legal holds found" />
            </div>
          )}
        </div>
        </section>
      </div>
    </PageContainer>
  );
}
