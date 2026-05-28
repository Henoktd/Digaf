import {
  DashboardSummary,
  fetchDashboardSummary,
} from "@/src/lib/api";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";

type DashboardSummaryResponse = {
  data: DashboardSummary;
  generated_at: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function Home() {
  const response: DashboardSummaryResponse = await fetchDashboardSummary();
  const summary = response.data;

  const kpis = [
    {
      label: "Shareholders",
      value: summary.shareholder_count,
      detail: `${formatNumber(summary.active_shareholder_count)} active`,
    },
    {
      label: "Total Shares",
      value: summary.total_shares,
      detail: "Active ownership ledger",
    },
    {
      label: "Certificates",
      value: summary.certificate_count,
      detail: `${formatNumber(summary.issued_certificate_count)} issued, ${formatNumber(
        summary.revoked_certificate_count
      )} revoked`,
    },
    {
      label: "Pending Approvals",
      value: summary.pending_approval_count,
      detail: `${formatNumber(summary.overdue_approval_count)} overdue`,
    },
    {
      label: "Active Legal Holds",
      value: summary.active_legal_hold_count,
      detail: `${formatNumber(summary.active_transfer_freeze_count)} active freezes`,
    },
    {
      label: "Documents",
      value: summary.document_reference_count,
      detail: "SharePoint-ready references",
    },
  ];

  const architecture = [
    ["Frontend", "Next.js"],
    ["Backend", "Express API"],
    ["Database", "PostgreSQL"],
    ["Documents", "SharePoint-ready references"],
    ["Identity", "local RBAC prototype, Entra planned"],
  ];

  return (
    <main className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          eyebrow="Digaf Governance Portal"
          title="Digaf Shareholder Governance Platform"
          description="Board-ready dashboard for shareholder governance, transfer controls, certificates, audit evidence, and SLA visibility."
          notice="Prototype demo environment — local RBAC and demo data are used."
          variant="dark"
          badge={
            <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              {formatNumber(summary.entity_count)} Entity
            </div>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={formatNumber(kpi.value)}
              detail={kpi.detail}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Workflow Summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Transfer and approval status across the governance workflow.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <KpiCard
                label="Transfers Pending"
                value={formatNumber(summary.pending_transfer_count)}
              />
              <KpiCard
                label="Transfers Completed"
                value={formatNumber(summary.completed_transfer_count)}
                tone="success"
              />
              <KpiCard
                label="Approvals Pending"
                value={formatNumber(summary.pending_approval_count)}
              />
              <KpiCard
                label="Approvals Approved"
                value={formatNumber(summary.approved_approval_count)}
                tone="success"
              />
            </div>

            <div className="mt-4">
              <KpiCard
                label="Overdue Approvals"
                value={formatNumber(summary.overdue_approval_count)}
                tone={summary.overdue_approval_count > 0 ? "warning" : "neutral"}
              />
            </div>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Top Ownership</h2>
              <p className="mt-1 text-sm text-slate-500">
                Largest active ownership positions by shareholder.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Shareholder
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Quantity
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Ownership
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {summary.top_ownership_rows.length > 0 ? (
                    summary.top_ownership_rows.map((row) => (
                      <tr key={row.shareholder_name}>
                        <td className="border-b border-slate-100 px-4 py-3 font-medium">
                          {row.shareholder_name}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {formatNumber(row.quantity)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 font-semibold">
                          {formatNumber(row.ownership_percentage)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4">
                        <EmptyState title="No active ownership rows found" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Recent Audit Activity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest governance actions written to the audit ledger.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Actor
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Action
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Table
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {summary.recent_audit_actions.length > 0 ? (
                    summary.recent_audit_actions.map((action) => (
                      <tr key={`${action.actor_id}-${action.action}-${action.timestamp_utc}`}>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {action.actor_id}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 capitalize">
                          {formatLabel(action.action)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {action.table_name}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {formatDate(action.timestamp_utc)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4">
                        <EmptyState title="No audit records found" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">SLA Snapshot</h2>
              <p className="mt-1 text-sm text-slate-500">
                Active and completed approval workflow timing status.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Request
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Stage
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Due
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      SLA
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {summary.sla_snapshot.length > 0 ? (
                    summary.sla_snapshot.map((item, index) => (
                      <tr key={`${item.request_type}-${item.stage}-${index}`}>
                        <td className="border-b border-slate-100 px-4 py-3 capitalize">
                          {formatLabel(item.request_type)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 capitalize">
                          {formatLabel(item.stage)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {formatDate(item.sla_due_date)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <StatusBadge status={item.computed_sla_status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4">
                        <EmptyState title="No SLA items found" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">System Architecture</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current MVP architecture and integration posture.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {architecture.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-sm text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
