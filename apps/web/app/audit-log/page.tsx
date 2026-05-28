import { fetchAuditLogs } from "@/src/lib/api";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type AuditLog = {
  id: string;
  entity_id: string;
  entity_name: string;
  actor_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_value_json: JsonValue | null;
  new_value_json: JsonValue | null;
  timestamp_utc: string;
  source_ip: string | null;
};

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function summarizeJson(value: JsonValue | null) {
  if (value === null) {
    return "None";
  }

  const summary = JSON.stringify(value);

  if (!summary) {
    return "None";
  }

  return summary.length > 180 ? `${summary.slice(0, 177)}...` : summary;
}

export default async function AuditLogPage() {
  const response = await fetchAuditLogs();
  const auditLogs: AuditLog[] = response.data;
  const latestLog = auditLogs[0] ?? null;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Audit Log"
          description="Trace system activity, actors, actions, timestamps, and before and after values from the governance ledger."
          badge={
            <div className="max-w-full break-words rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">
              Read-only evidence
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Total Logs"
            value={auditLogs.length}
            detail="Audit records"
          />
          <KpiCard
            label="Latest Actor"
            value={latestLog?.actor_id || "No activity"}
            detail={latestLog ? formatDate(latestLog.timestamp_utc) : "Not set"}
          />
          <KpiCard
            label="Latest Action"
            value={latestLog ? formatLabel(latestLog.action) : "No activity"}
            detail={latestLog?.table_name || "Not set"}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          {auditLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
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
                      Record ID
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Timestamp
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Old Value
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      New Value
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="border-b border-slate-100 px-4 py-3 font-medium">
                        {log.actor_id}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">
                        {formatLabel(log.action)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {log.table_name}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs">
                        {log.record_id || "Not set"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDate(log.timestamp_utc)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <code className="block max-w-sm whitespace-pre-wrap break-words rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                          {summarizeJson(log.old_value_json)}
                        </code>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <code className="block max-w-sm whitespace-pre-wrap break-words rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                          {summarizeJson(log.new_value_json)}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState title="No audit records found" />
            </div>
          )}
        </div>
        </section>
      </div>
    </PageContainer>
  );
}
