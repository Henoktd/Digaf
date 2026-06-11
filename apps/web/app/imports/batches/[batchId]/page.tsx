import { notFound } from "next/navigation";
import { fetchShareholderImportBatch } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { ImportBatchActions } from "@/src/components/ImportBatchActions";
import { ImportMessageResolveForm } from "@/src/components/ImportMessageResolveForm";
import { ImportRowExcludeButton } from "@/src/components/ImportRowExcludeButton";
import { PageContainer } from "@/src/components/PageContainer";
import { StatusBadge } from "@/src/components/StatusBadge";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "—";
}

function severityTone(severity: string) {
  return severity === "error" ? "danger" : "warning";
}

function rowTone(status: string) {
  if (status === "excluded") return undefined;
  if (status === "ready") return "success";
  if (status === "blocked") return "danger";
  return "warning";
}

type PageProps = {
  params: Promise<{ batchId: string }>;
};

export default async function BatchDetailPage({ params }: PageProps) {
  const { batchId } = await params;
  const token = await getToken();
  let detail;

  try {
    const response = await fetchShareholderImportBatch(
      batchId,
      token ?? undefined
    );
    detail = response.data;
  } catch {
    notFound();
  }

  const { batch, rows, messages, events } = detail;

  const openMessages = messages.filter((m) => m.resolution_status === "open");
  const resolvedMessages = messages.filter(
    (m) => m.resolution_status !== "open"
  );

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              <a href="/imports" className="hover:underline">
                Import Prep
              </a>
              {" / "}
              <span className="font-mono text-xs">{batchId}</span>
            </p>
            <h1 className="mt-1 break-words text-2xl font-bold text-slate-900">
              {batch.source_filename ?? "Unnamed batch"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Mapping: {batch.mapping_version} · Submitted by{" "}
              {batch.submitted_by ?? "—"} ({batch.submitted_role ?? "—"}) ·{" "}
              {formatDate(batch.submitted_at)}
            </p>
          </div>
          <StatusBadge status={batch.batch_status} />
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Rows", rows.length],
            ["Open messages", openMessages.length],
            ["Events", events.length],
            ["Dry-run only", batch.dry_run_only ? "Yes" : "No"],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Batch actions */}
        <ImportBatchActions
          batchId={batch.id}
          batchStatus={batch.batch_status}
        />

        {/* Rows table */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Rows ({rows.length})
          </h2>
          {rows.length > 0 ? (
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">#</th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Shareholder
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Errors
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Warnings
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Review
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const normalized = row.normalized_payload_json as Record<
                      string,
                      unknown
                    >;
                    return (
                      <tr key={row.id}>
                        <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-700">
                          {row.source_row_number}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <p className="break-words font-medium text-slate-900">
                            {String(normalized.legalName ?? "—")}
                          </p>
                          <p className="break-words font-mono text-xs text-slate-500">
                            {String(normalized.shareholderCode ?? "no code")}
                          </p>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <StatusBadge
                            status={row.row_status}
                            tone={rowTone(row.row_status)}
                          />
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {row.error_count}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {row.warning_count}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 capitalize text-slate-500">
                          {formatLabel(row.review_decision)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {row.row_status !== "excluded" ? (
                            <ImportRowExcludeButton rowId={row.id} />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No rows in this batch.</p>
          )}
        </section>

        {/* Open validation messages */}
        {openMessages.length > 0 ? (
          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Open Messages ({openMessages.length})
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Resolve, waive, or accept each message before submitting for review.
            </p>
            <div className="mt-5 space-y-3">
              {openMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl p-4 ring-1 ${
                    msg.severity === "error"
                      ? "bg-rose-50 ring-rose-200"
                      : "bg-amber-50 ring-amber-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          status={msg.severity}
                          tone={severityTone(msg.severity)}
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Row {msg.source_row_number} · {msg.field_name}
                        </span>
                        {msg.responsible_role ? (
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            {msg.responsible_role}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 break-words text-sm text-slate-800">
                        {msg.message}
                      </p>
                      {msg.suggested_action ? (
                        <p className="mt-1 text-xs text-slate-600">
                          {msg.suggested_action}
                        </p>
                      ) : null}
                    </div>
                    <ImportMessageResolveForm
                      messageId={msg.id}
                      severity={msg.severity}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Resolved messages */}
        {resolvedMessages.length > 0 ? (
          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Resolved Messages ({resolvedMessages.length})
            </h2>
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">Row</th>
                    <th className="border-b border-slate-200 px-4 py-3">Field</th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Severity
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Resolution
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Resolved by
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">At</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedMessages.map((msg) => (
                    <tr key={msg.id}>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {msg.source_row_number}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs">
                        {msg.field_name}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge
                          status={msg.severity}
                          tone={severityTone(msg.severity)}
                        />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">
                        {formatLabel(msg.resolution_status)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs">
                        {msg.resolved_by ?? "—"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDate(msg.resolved_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Event timeline */}
        {events.length > 0 ? (
          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Event History ({events.length})
            </h2>
            <div className="mt-5 space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-xs font-semibold text-slate-700">
                      {event.event_type}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {event.actor_id}
                    {event.actor_role ? ` (${event.actor_role})` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageContainer>
  );
}
