import {
  fetchCertificateEvents,
  fetchCertificateRenderData,
  fetchCertificates,
  getCertificatePrintPreviewUrl,
  getCertificateQrSvgUrl,
} from "@/src/lib/api";
import { EmptyState } from "@/src/components/EmptyState";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";

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

type CertificateRenderData = {
  certificate_id: string;
  serial_number: string;
  issuing_company: string;
  shareholder_name: string;
  share_class: string;
  quantity: string;
  issue_date: string | null;
  status: string;
  revocation_status: string | null;
  certificate_hash: string | null;
  hash_algorithm: string | null;
  hash_generated_at: string | null;
  qr_token: string | null;
  qr_svg_url: string;
  public_verification_url: string;
  render_metadata: {
    certificate_title: string;
    template_version: string;
    generated_at: string;
    disclaimer: string;
  };
};

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getPublicVerificationPageUrl(serialNumber: string) {
  return `/qr?serialNumber=${encodeURIComponent(serialNumber)}`;
}

export default async function CertificatesPage() {
  const response = await fetchCertificates();
  const certificates: Certificate[] = response.data;
  const firstCertificate = certificates[0];
  const [eventResponse, renderDataResponse] = firstCertificate
    ? await Promise.all([
        fetchCertificateEvents(firstCertificate.certificate_id),
        fetchCertificateRenderData(firstCertificate.certificate_id),
      ])
    : [{ data: [] }, { data: null }];
  const events: CertificateEvent[] = eventResponse.data;
  const renderData: CertificateRenderData | null = renderDataResponse.data;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Certificate Management"
          description="Manage certificate requests, approvals, serial numbers, QR verification, hashes, issuance, revocation, and reissue history."
          notice="Demo certificate template — official Digaf template pending."
          badge={
            <div className="max-w-full break-words rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">
              {certificates.length} Certificates
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {certificates.length > 0 ? (
              <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
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
                    <th className="border-b border-slate-200 px-4 py-3">
                      QR Verification
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Demo Certificate
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
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge status={certificate.status} />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {certificate.hash_algorithm || "Not generated"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge
                          status={certificate.revocation_status}
                          label={certificate.revocation_status || "None"}
                        />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <div className="flex min-w-[210px] items-center gap-3">
                          <img
                            src={getCertificateQrSvgUrl(
                              certificate.certificate_id
                            )}
                            alt={`QR code for ${certificate.serial_number}`}
                            className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 bg-white p-1"
                          />
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-900">
                              QR opens public verification page.
                            </p>
                            <a
                              href={getPublicVerificationPageUrl(
                                certificate.serial_number
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Open Verification Page
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <a
                          href={getCertificatePrintPreviewUrl(
                            certificate.certificate_id
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          Open Demo Certificate
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <EmptyState title="No certificates found" />
              </div>
            )}
          </div>

          {renderData ? (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase text-slate-500">
                    Certificate Render Preview
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    {renderData.render_metadata.certificate_title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">
                    Demo certificate template — official Digaf template
                    pending. Browser print-to-PDF is available from the
                    certificate action in the table above.
                  </p>
                </div>

                <div className="max-w-full break-words rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">
                  {renderData.render_metadata.template_version}
                </div>
              </div>

              <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-white p-4">
                  <dt className="text-sm text-slate-500">Serial Number</dt>
                  <dd className="mt-1 break-words font-semibold">
                    {renderData.serial_number}
                  </dd>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <dt className="text-sm text-slate-500">Issuing Company</dt>
                  <dd className="mt-1 break-words font-semibold">
                    {renderData.issuing_company}
                  </dd>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <dt className="text-sm text-slate-500">Shareholder</dt>
                  <dd className="mt-1 break-words font-semibold">
                    {renderData.shareholder_name}
                  </dd>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <dt className="text-sm text-slate-500">Share Class</dt>
                  <dd className="mt-1 font-semibold">
                    {renderData.share_class}
                  </dd>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <dt className="text-sm text-slate-500">Quantity</dt>
                  <dd className="mt-1 font-semibold">{renderData.quantity}</dd>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <dt className="text-sm text-slate-500">Issue Date</dt>
                  <dd className="mt-1 font-semibold">
                    {formatDate(renderData.issue_date)}
                  </dd>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={renderData.status} />
                  </dd>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <dt className="text-sm text-slate-500">Hash Algorithm</dt>
                  <dd className="mt-1 font-semibold">
                    {renderData.hash_algorithm || "Not generated"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">
                  Public Verification URL
                </p>
                <p className="mt-1 break-all font-mono text-sm text-slate-900">
                  {renderData.public_verification_url}
                </p>
              </div>

              <div className="mt-4 grid gap-4 rounded-xl bg-white p-4 md:grid-cols-[auto_1fr] md:items-center">
                <img
                  src={getCertificateQrSvgUrl(renderData.certificate_id)}
                  alt={`QR code for ${renderData.serial_number}`}
                  className="h-36 w-36 max-w-full justify-self-center rounded-xl border border-slate-200 bg-white p-2 md:justify-self-start"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    QR opens public verification page.
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-slate-700">
                    {renderData.public_verification_url}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={renderData.public_verification_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 sm:w-auto"
                    >
                      Open Verification Page
                    </a>
                    <a
                      href={getCertificatePrintPreviewUrl(
                        renderData.certificate_id
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                    >
                      Open Demo Certificate
                    </a>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                {renderData.render_metadata.disclaimer}
              </p>
            </div>
          ) : null}

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
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
                    <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-slate-900" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-semibold capitalize text-slate-900">
                          {event.event_type.replaceAll("_", " ")}
                        </p>
                        <p className="break-words text-xs text-slate-500">
                          {event.timestamp_utc}
                        </p>
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-600">
                        Actor: {event.actor_id}
                      </p>
                      {event.notes ? (
                        <p className="mt-1 break-words text-sm text-slate-700">
                          {event.notes}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="No certificate events found" />
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
