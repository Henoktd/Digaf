import { fetchCertificateEvents, fetchCertificates } from "@/src/lib/api";

type Certificate = {
  certificate_id: string;
  serial_number: string;
  shareholder_name: string;
  share_class: string;
  quantity: string;
  issue_date: string | null;
  status: string;
  hash_algorithm: string | null;
  hash_generated_at: string | null;
  revocation_status: string | null;
};

type CertificateEvent = {
  id: string;
  certificate_id: string;
  event_type: string;
  actor_id: string;
  timestamp_utc: string;
  notes: string | null;
};

export default async function CertificatesPage() {
  const response = await fetchCertificates();
  const certificates: Certificate[] = response.data;
  const firstCertificate = certificates[0];
  const eventResponse = firstCertificate
    ? await fetchCertificateEvents(firstCertificate.certificate_id)
    : { data: [] };
  const events: CertificateEvent[] = eventResponse.data;

  return (
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Certificate Management</h1>
            <p className="mt-2 text-slate-600">
              Manage certificate requests, approvals, serial numbers, QR
              verification, hashes, issuance, revocation, and reissue history.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            {certificates.length} Certificates
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3">
                  Serial Number
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Shareholder
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Share Class
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Quantity
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Status
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Hash
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Revocation
                </th>
              </tr>
            </thead>

            <tbody>
              {certificates.map((certificate) => (
                <tr key={certificate.certificate_id}>
                  <td className="border-b border-slate-100 px-4 py-3 font-medium">
                    {certificate.serial_number}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {certificate.shareholder_name}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {certificate.share_class}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {certificate.quantity}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {certificate.status}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {certificate.hash_algorithm || "Not generated"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {certificate.revocation_status || "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Event Timeline</h2>
            <p className="mt-1 text-sm text-slate-600">
              {firstCertificate
                ? firstCertificate.serial_number
                : "No certificate selected"}
            </p>
          </div>

          {events.length > 0 ? (
            <ol className="space-y-4">
              {events.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div className="mt-1 h-3 w-3 rounded-full bg-slate-900" />
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-semibold capitalize text-slate-900">
                        {event.event_type.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {event.timestamp_utc}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Actor: {event.actor_id}
                    </p>
                    {event.notes ? (
                      <p className="mt-1 text-sm text-slate-700">
                        {event.notes}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-600">
              No certificate events found.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
