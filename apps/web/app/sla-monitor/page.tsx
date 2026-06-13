import { fetchSlaMonitor } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";

type SlaStatus = "completed" | "overdue" | "due_soon" | "on_track";

type SlaItem = {
  id: string;
  entity_id: string;
  entity_name: string;
  request_type: string;
  reference_id: string | null;
  stage: string;
  status: string;
  current_approver_id: string | null;
  maker_id: string | null;
  checker1_id: string | null;
  checker2_id: string | null;
  sla_due_date: string | null;
  escalation_level: number;
  escalation_triggered_at: string | null;
  escalation_recipient: string | null;
  created_at: string;
  transferor_name: string | null;
  transferee_name: string | null;
  transfer_shares: string | null;
  transfer_status: string | null;
  computed_sla_status: SlaStatus;
  days_remaining: number | null;
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

function formatShares(value: string | null) {
  if (!value) {
    return "-";
  }

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatDaysRemaining(value: number | null) {
  if (value === null) {
    return "Not set";
  }

  return `${value} day${Math.abs(value) === 1 ? "" : "s"}`;
}

export default async function SlaMonitorPage() {
  const token = await getToken();
  const response = await fetchSlaMonitor(token ?? undefined);
  const slaItems: SlaItem[] = response.data;

  const overdueCount = slaItems.filter(
    (item) => item.computed_sla_status === "overdue"
  ).length;
  const dueSoonCount = slaItems.filter(
    (item) => item.computed_sla_status === "due_soon"
  ).length;
  const completedCount = slaItems.filter(
    (item) => item.computed_sla_status === "completed"
  ).length;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="SLA Monitor"
          description="Track governance SLA targets, breaches, escalation history, and approval process performance."
          badge={
            <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Read-only
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <KpiCard
            label="Total Tracked"
            value={slaItems.length}
            detail="Approval requests"
          />
          <KpiCard
            label="Overdue"
            value={overdueCount}
            detail="Past SLA target"
            tone={overdueCount > 0 ? "danger" : "neutral"}
          />
          <KpiCard
            label="Due Soon"
            value={dueSoonCount}
            detail="Within two days"
            tone="warning"
          />
          <KpiCard
            label="Completed"
            value={completedCount}
            detail="Approved items"
            tone="success"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          {slaItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Request Type</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">SLA</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Days</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Approver</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Transfer</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shares</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Escalation</th>
                  </tr>
                </thead>

                <tbody>
                  {slaItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-slate-100 px-4 py-3 font-medium capitalize">
                        {formatLabel(item.request_type)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">
                        {formatLabel(item.stage)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge status={item.computed_sla_status} />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {formatDaysRemaining(item.days_remaining)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Due: {formatDate(item.sla_due_date)}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {item.current_approver_id || "Not assigned"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {item.transferor_name && item.transferee_name
                          ? `${item.transferor_name} -> ${item.transferee_name}`
                          : "Not linked"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatShares(item.transfer_shares)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <div>Level {item.escalation_level}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.escalation_recipient || "No recipient"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState title="No SLA-tracked approval requests found" />
            </div>
          )}
        </div>
        </section>
      </div>
    </PageContainer>
  );
}
