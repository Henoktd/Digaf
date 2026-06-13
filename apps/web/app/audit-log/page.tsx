import { fetchAuditLogs } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { AuditLogTable } from "@/src/components/AuditLogTable";
import { PaginationBar } from "@/src/components/PaginationBar";

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

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const token = await getToken();
  const response = await fetchAuditLogs(token ?? undefined, page, 50);
  const auditLogs: AuditLog[] = response.data;
  const total: number = response.total ?? auditLogs.length;
  const latestLog = auditLogs[0] ?? null;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="Audit Log"
          description="Trace system activity, actors, actions, timestamps, and before and after values from the governance ledger."
          badge={
            <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Read-only
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Total Logs"
            value={total}
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

        <AuditLogTable logs={auditLogs} />
        <PaginationBar page={page} total={total} limit={50} baseHref="/audit-log" />
        </section>
      </div>
    </PageContainer>
  );
}
