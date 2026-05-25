import { fetchLegalHolds } from "@/src/lib/api";

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

function statusClass(status: string | null) {
  if (status === "active") {
    return "bg-rose-100 text-rose-800";
  }

  if (status === "lifted") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-200 text-slate-700";
}

export default async function LegalHoldsPage() {
  const response = await fetchLegalHolds();
  const legalHolds: LegalHold[] = response.data;
  const activeHolds = legalHolds.filter((hold) => hold.status === "active");
  const activeFreezeCount = new Set(
    legalHolds
      .filter((hold) => hold.freeze_status === "active")
      .map((hold) => hold.transfer_freeze_id)
      .filter(Boolean)
  ).size;

  return (
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Legal Hold Management</h1>
            <p className="mt-2 text-slate-600">
              Track legal holds, regulatory review freezes, and preservation
              controls for shareholder governance records.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Read-only holds
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">Total Holds</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {legalHolds.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">Legal hold records</p>
          </article>

          <article className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">Active Holds</p>
            <p className="mt-3 text-3xl font-bold text-rose-900">
              {activeHolds.length}
            </p>
            <p className="mt-1 text-sm text-rose-800">Preservation active</p>
          </article>

          <article className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-700">
              Active Freezes
            </p>
            <p className="mt-3 text-3xl font-bold text-amber-900">
              {activeFreezeCount}
            </p>
            <p className="mt-1 text-sm text-amber-800">Transfer blocks</p>
          </article>
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

                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                      Active
                    </span>
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
                      <dd className="text-slate-900">{hold.reason}</dd>
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
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              No active legal holds found.
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          {legalHolds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Hold Type
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Related Shareholder
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Reason
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Authority Ref
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Imposed By
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Imposed At
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Freeze Status
                    </th>
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
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                            hold.status
                          )}`}
                        >
                          {formatLabel(hold.status)}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {hold.authority_reference || "Not set"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {hold.imposed_by}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDate(hold.imposed_at)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <div className="capitalize">
                          {formatLabel(hold.freeze_status)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {hold.freeze_reason || "No active freeze"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="bg-slate-50 p-6 text-sm text-slate-600">
              No legal hold records found.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
