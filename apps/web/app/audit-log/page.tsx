import { fetchAuditLogs } from "@/src/lib/api";

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
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="mt-2 text-slate-600">
              Trace system activity, actors, actions, timestamps, and before
              and after values from the governance ledger.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Read-only evidence
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">Total Logs</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {auditLogs.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">Audit records</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">Latest Actor</p>
            <p className="mt-3 break-all text-lg font-bold text-slate-900">
              {latestLog?.actor_id || "No activity"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {latestLog ? formatDate(latestLog.timestamp_utc) : "Not set"}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">Latest Action</p>
            <p className="mt-3 text-lg font-bold capitalize text-slate-900">
              {latestLog ? formatLabel(latestLog.action) : "No activity"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {latestLog?.table_name || "Not set"}
            </p>
          </article>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
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
            <p className="bg-slate-50 p-6 text-sm text-slate-600">
              No audit log records found.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
