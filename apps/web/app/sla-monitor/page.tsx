import { fetchSlaMonitor } from "@/src/lib/api";

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

function statusClass(status: SlaStatus) {
  if (status === "overdue") {
    return "bg-rose-100 text-rose-800";
  }

  if (status === "due_soon") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "completed") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-200 text-slate-700";
}

export default async function SlaMonitorPage() {
  const response = await fetchSlaMonitor();
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
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">SLA Monitor</h1>
            <p className="mt-2 text-slate-600">
              Track governance SLA targets, breaches, escalation history, and
              approval process performance.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Read-only monitor
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Total Tracked
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {slaItems.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">Approval requests</p>
          </article>

          <article className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">Overdue</p>
            <p className="mt-3 text-3xl font-bold text-rose-900">
              {overdueCount}
            </p>
            <p className="mt-1 text-sm text-rose-800">Past SLA target</p>
          </article>

          <article className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-700">Due Soon</p>
            <p className="mt-3 text-3xl font-bold text-amber-900">
              {dueSoonCount}
            </p>
            <p className="mt-1 text-sm text-amber-800">Within two days</p>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-700">Completed</p>
            <p className="mt-3 text-3xl font-bold text-emerald-900">
              {completedCount}
            </p>
            <p className="mt-1 text-sm text-emerald-800">Approved items</p>
          </article>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          {slaItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Request Type
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Stage
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      SLA Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Days Remaining
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Current Approver
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Transfer
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Shares
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Escalation
                    </th>
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
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">
                        {formatLabel(item.status)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                            item.computed_sla_status
                          )}`}
                        >
                          {formatLabel(item.computed_sla_status)}
                        </span>
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
            <p className="bg-slate-50 p-6 text-sm text-slate-600">
              No SLA-tracked approval requests found.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
