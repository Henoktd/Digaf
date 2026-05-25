import { fetchCommunications } from "@/src/lib/api";

type Communication = {
  id: string;
  entity_id: string;
  entity_name: string;
  type: string;
  recipient_id: string | null;
  recipient_name: string | null;
  channel: string;
  subject: string;
  delivery_status: string;
  sent_at: string | null;
  related_event_id: string | null;
  created_at: string;
};

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not sent";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "sent") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "failed") {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-slate-200 text-slate-700";
}

export default async function CommunicationsPage() {
  const response = await fetchCommunications();
  const communications: Communication[] = response.data;
  const sentCount = communications.filter(
    (communication) => communication.delivery_status === "sent"
  ).length;
  const latestCommunication = communications[0] ?? null;

  return (
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Communication Log</h1>
            <p className="mt-2 text-slate-600">
              Review shareholder notifications and delivery evidence generated
              by governance events.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Read-only log
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Total Communications
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {communications.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">Logged notifications</p>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-700">Sent</p>
            <p className="mt-3 text-3xl font-bold text-emerald-900">
              {sentCount}
            </p>
            <p className="mt-1 text-sm text-emerald-800">Delivered records</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Latest Channel
            </p>
            <p className="mt-3 text-lg font-bold capitalize text-slate-900">
              {latestCommunication
                ? formatLabel(latestCommunication.channel)
                : "No activity"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {latestCommunication
                ? formatDate(latestCommunication.sent_at)
                : "Not sent"}
            </p>
          </article>
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Recent Notifications</h2>
              <p className="mt-1 text-sm text-slate-600">
                Latest outbound communication records from backend governance
                events.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {communications.length} records
            </span>
          </div>

          {communications.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {communications.slice(0, 3).map((communication) => (
                <article
                  key={communication.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        {communication.entity_name}
                      </p>
                      <h3 className="mt-1 text-lg font-bold capitalize text-slate-900">
                        {formatLabel(communication.type)}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                        communication.delivery_status
                      )}`}
                    >
                      {formatLabel(communication.delivery_status)}
                    </span>
                  </div>

                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Recipient</dt>
                      <dd className="font-semibold text-slate-900">
                        {communication.recipient_name || "Not linked"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Subject</dt>
                      <dd className="text-slate-900">
                        {communication.subject}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Sent At</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatDate(communication.sent_at)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              No communication records found.
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          {communications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Type
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Recipient
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Channel
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Subject
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Delivery Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Sent At
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {communications.map((communication) => (
                    <tr key={communication.id}>
                      <td className="border-b border-slate-100 px-4 py-3 font-medium capitalize">
                        {formatLabel(communication.type)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {communication.recipient_name || "Not linked"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">
                        {formatLabel(communication.channel)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {communication.subject}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                            communication.delivery_status
                          )}`}
                        >
                          {formatLabel(communication.delivery_status)}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDate(communication.sent_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="bg-slate-50 p-6 text-sm text-slate-600">
              No communication records found.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
