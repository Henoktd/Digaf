import {
  fetchCertificateEvents,
  fetchCertificateRenderData,
  fetchCertificates,
  fetchShareholders,
  getCertificateQrSvgUrl,
} from "@/src/lib/api";
import { CreateCertificateForm } from "@/src/components/CreateCertificateForm";
import { getToken } from "@/src/lib/dal";
import { BrandLogo } from "@/src/components/BrandLogo";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { CertificatesTable } from "@/src/components/CertificatesTable";
import { PaginationBar } from "@/src/components/PaginationBar";
import { CertificatePrintButton } from "@/src/components/CertificatePrintButton";
import { EmptyState } from "@/src/components/EmptyState";

type Certificate = {
  certificate_id: string;
  serial_number: string;
  shareholder_name: string;
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

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const token = await getToken();
  const [response, shareholdersResponse] = await Promise.all([
    fetchCertificates(token ?? undefined, page, 50),
    fetchShareholders(token ?? undefined),
  ]);
  const certificates: Certificate[] = response.data;
  const total: number = response.total ?? certificates.length;
  const shareholders = (shareholdersResponse.data ?? []) as { shareholder_id: string; legal_name: string }[];
  const firstCertificate = certificates[0];
  const [eventResponse, renderDataResponse] = firstCertificate
    ? await Promise.all([
        fetchCertificateEvents(firstCertificate.certificate_id, token ?? undefined),
        fetchCertificateRenderData(firstCertificate.certificate_id, token ?? undefined),
      ])
    : [{ data: [] }, { data: null }];
  const events: CertificateEvent[] = eventResponse.data;
  const renderData: CertificateRenderData | null = renderDataResponse.data;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="Certificate Management"
          description="Manage certificate requests, approvals, serial numbers, QR verification, hashes, issuance, revocation, and reissue history."
          badge={
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              {total} Certificates
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Create New Certificate</h2>
            <CreateCertificateForm shareholders={shareholders} />
          </div>

          <CertificatesTable certificates={certificates} />
          <PaginationBar page={page} total={total} limit={50} baseHref="/certificates" />

          {renderData ? (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <BrandLogo
                    className="mb-4 max-w-full"
                    imageClassName="h-12 w-auto max-w-full"
                    fallbackClassName="block max-w-full break-words text-lg font-bold leading-tight text-slate-900"
                  />
                  <p className="text-sm font-semibold uppercase text-slate-500">
                    Certificate Render Preview
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    {renderData.render_metadata.certificate_title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">
                    Official Digaf Microcredit Provider share certificate. Use
                    browser Print → Save as PDF to generate the final document.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
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
                      className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto"
                    >
                      Open Verification Page
                    </a>
                    <CertificatePrintButton
                      certificateId={renderData.certificate_id}
                      label="Open Certificate"
                      className="inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto disabled:opacity-50"
                    />
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
                    <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-indigo-500" />
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
