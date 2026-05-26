import {
  DashboardSummary,
  fetchDashboardSummary,
} from "@/src/lib/api";

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
        <section className="rounded-2xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase text-slate-300">
                Digaf Governance Portal
              </p>

              <h1 className="mt-3 text-4xl font-bold">
                Digaf Shareholder Governance Platform
              </h1>

              <p className="mt-4 max-w-3xl text-slate-300">
                Board-ready dashboard for shareholder governance, transfer
                controls, certificates, audit evidence, and SLA visibility.
              </p>
            </div>

            <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              {formatNumber(summary.entity_count)} Entity
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kpis.map((kpi) => (
            <article
              key={kpi.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-500">
                {kpi.label}
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {formatNumber(kpi.value)}
              </p>
              <p className="mt-2 text-sm text-slate-600">{kpi.detail}</p>
            </article>
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Transfers Pending</p>
                <p className="mt-2 text-3xl font-bold">
                  {formatNumber(summary.pending_transfer_count)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Transfers Completed</p>
                <p className="mt-2 text-3xl font-bold">
                  {formatNumber(summary.completed_transfer_count)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Approvals Pending</p>
                <p className="mt-2 text-3xl font-bold">
                  {formatNumber(summary.pending_approval_count)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Approvals Approved</p>
                <p className="mt-2 text-3xl font-bold">
                  {formatNumber(summary.approved_approval_count)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-900">
                Overdue Approvals
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-950">
                {formatNumber(summary.overdue_approval_count)}
              </p>
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
                      <td
                        colSpan={3}
                        className="border-b border-slate-100 px-4 py-6 text-slate-500"
                      >
                        No active ownership rows found.
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
                      <td
                        colSpan={4}
                        className="border-b border-slate-100 px-4 py-6 text-slate-500"
                      >
                        No recent audit actions found.
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
                        <td className="border-b border-slate-100 px-4 py-3 capitalize">
                          {formatLabel(item.computed_sla_status)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="border-b border-slate-100 px-4 py-6 text-slate-500"
                      >
                        No SLA items found.
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
