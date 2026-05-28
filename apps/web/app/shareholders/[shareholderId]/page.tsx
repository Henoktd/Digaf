import Link from "next/link";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { UpdateKycForm } from "@/src/components/UpdateKycForm";
import { fetchShareholderProfile } from "@/src/lib/api";

type ContactDetails = Record<string, string | number | boolean | null>;
type KycStatus = "not_started" | "pending" | "verified" | "expired";
type RiskClassification = "low" | "medium" | "high";

type ShareholderProfile = {
  shareholder_id: string;
  entity_id: string;
  entity_name: string;
  legal_name: string;
  type: string;
  status: string;
  contact_details: ContactDetails;
  kyc_status: KycStatus;
  kyc_expiry: string | null;
  risk_classification: RiskClassification | null;
  proxy_eligible: boolean;
  relationship_start_date: string | null;
  created_at: string;
};

type OwnershipRow = {
  share_class: string;
  quantity: string;
  pledged_quantity: string;
  encumbered_quantity: string;
  effective_date: string;
  status: string;
};

type CertificateRow = {
  certificate_id: string;
  serial_number: string;
  share_class: string;
  quantity: string;
  issue_date: string | null;
  status: string;
  hash_algorithm: string | null;
  revocation_status: string | null;
};

type OutgoingTransferRow = {
  id: string;
  transferee_name: string;
  shares: string;
  status: string;
  kyc_check_status: string;
  encumbrance_check_status: string;
  effective_date: string | null;
  created_at: string;
};

type IncomingTransferRow = {
  id: string;
  transferor_name: string;
  shares: string;
  status: string;
  kyc_check_status: string;
  encumbrance_check_status: string;
  effective_date: string | null;
  created_at: string;
};

type LegalHoldRow = {
  id: string;
  hold_type: string;
  reason: string;
  status: string;
  authority_reference: string | null;
  imposed_by: string;
  imposed_at: string;
};

type DocumentRow = {
  id: string;
  document_type: string;
  library: string;
  retention_category: string | null;
  file_url: string;
  legal_hold_id: string | null;
  created_at: string;
};

type CommunicationRow = {
  id: string;
  type: string;
  channel: string;
  subject: string;
  delivery_status: string;
  sent_at: string | null;
  created_at: string;
};

type ShareholderProfileResponse = {
  data: {
    profile: ShareholderProfile;
    ownership: OwnershipRow[];
    certificates: CertificateRow[];
    outgoing_transfers: OutgoingTransferRow[];
    incoming_transfers: IncomingTransferRow[];
    legal_holds: LegalHoldRow[];
    documents: DocumentRow[];
    communications: CommunicationRow[];
  };
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
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShares(value: string | number) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function sumShares(rows: OwnershipRow[], field: keyof OwnershipRow) {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

export default async function ShareholderProfilePage({
  params,
}: {
  params: Promise<{ shareholderId: string }>;
}) {
  const { shareholderId } = await params;
  const response: ShareholderProfileResponse =
    await fetchShareholderProfile(shareholderId);
  const {
    profile,
    ownership,
    certificates,
    outgoing_transfers: outgoingTransfers,
    incoming_transfers: incomingTransfers,
    legal_holds: legalHolds,
    documents,
    communications,
  } = response.data;

  const contactEntries = Object.entries(profile.contact_details || {});
  const totalShares = sumShares(ownership, "quantity");
  const pledgedShares = sumShares(ownership, "pledged_quantity");
  const encumberedShares = sumShares(ownership, "encumbered_quantity");
  const activeLegalHolds = legalHolds.filter(
    (legalHold) => legalHold.status === "active"
  ).length;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/shareholders"
          className="inline-flex text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
        >
          Back to shareholder registry
        </Link>

        <PageHeader
          eyebrow={profile.entity_name}
          title={profile.legal_name}
          description={`${formatLabel(profile.type)} shareholder profile with KYC, ownership, certificate, transfer, legal hold, document, and communication history.`}
          badge={
            <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Read-only profile
            </div>
          }
        />

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={profile.status} />
          <StatusBadge status={profile.kyc_status} prefix="KYC" />
          <StatusBadge
            status={profile.risk_classification}
            label={`Risk: ${formatLabel(profile.risk_classification)}`}
          />
        </div>

        <section className="grid gap-4 md:grid-cols-5">
          {[
            ["Total Shares", formatShares(totalShares)],
            ["Pledged Shares", formatShares(pledgedShares)],
            ["Encumbered Shares", formatShares(encumberedShares)],
            ["Certificates", certificates.length.toString()],
            ["Active Legal Holds", activeLegalHolds.toString()],
          ].map(([label, value]) => (
            <KpiCard
              key={label}
              label={label}
              value={value}
              tone={label === "Active Legal Holds" && value !== "0" ? "danger" : "neutral"}
            />
          ))}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Profile & KYC</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-slate-500">KYC Expiry</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(profile.kyc_expiry)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Proxy Eligible</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile.proxy_eligible ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Relationship Start</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(profile.relationship_start_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Created At</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDateTime(profile.created_at)}
              </p>
            </div>
          </div>

          <UpdateKycForm
            shareholderId={profile.shareholder_id}
            currentKycStatus={profile.kyc_status}
            currentKycExpiry={profile.kyc_expiry}
            currentRiskClassification={profile.risk_classification}
          />

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Contact Details
            </h3>
            {contactEntries.length > 0 ? (
              <dl className="mt-3 grid gap-3 md:grid-cols-2">
                {contactEntries.map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-slate-50 p-4">
                    <dt className="text-sm capitalize text-slate-500">
                      {formatLabel(key)}
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {String(value ?? "Not set")}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <EmptyState title="No contact details recorded" />
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Ownership</h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            {ownership.length > 0 ? (
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Share Class
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Quantity
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Pledged
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Encumbered
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Effective Date
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ownership.map((row) => (
                    <tr
                      key={`${row.share_class}-${row.effective_date}-${row.status}`}
                    >
                      <td className="border-b border-slate-100 px-4 py-3 font-medium">
                        {row.share_class}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatShares(row.quantity)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatShares(row.pledged_quantity)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatShares(row.encumbered_quantity)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDate(row.effective_date)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <EmptyState title="No ownership records found" />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Certificates</h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            {certificates.length > 0 ? (
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Serial Number
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Share Class
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Quantity
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Issue Date
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
                        {certificate.share_class}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatShares(certificate.quantity)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDate(certificate.issue_date)}
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
                          label={formatLabel(certificate.revocation_status)}
                        />
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
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Transfer History</h2>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Outgoing Transfers
              </h3>
              {outgoingTransfers.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="border-b border-slate-200 px-4 py-3">
                          Transferee
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3">
                          Shares
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3">
                          Status
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3">
                          Checks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {outgoingTransfers.map((transfer) => (
                        <tr key={transfer.id}>
                          <td className="border-b border-slate-100 px-4 py-3 font-medium">
                            {transfer.transferee_name}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            {formatShares(transfer.shares)}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            <StatusBadge status={transfer.status} />
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 capitalize">
                            KYC {formatLabel(transfer.kyc_check_status)},
                            Encumbrance{" "}
                            {formatLabel(transfer.encumbrance_check_status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No outgoing transfers found" />
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Incoming Transfers
              </h3>
              {incomingTransfers.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="border-b border-slate-200 px-4 py-3">
                          Transferor
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3">
                          Shares
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3">
                          Status
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3">
                          Checks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomingTransfers.map((transfer) => (
                        <tr key={transfer.id}>
                          <td className="border-b border-slate-100 px-4 py-3 font-medium">
                            {transfer.transferor_name}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            {formatShares(transfer.shares)}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            <StatusBadge status={transfer.status} />
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 capitalize">
                            KYC {formatLabel(transfer.kyc_check_status)},
                            Encumbrance{" "}
                            {formatLabel(transfer.encumbrance_check_status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No incoming transfers found" />
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Legal Holds</h2>
          <div className="mt-5 space-y-3">
            {legalHolds.length > 0 ? (
              legalHolds.map((legalHold) => (
                <article
                  key={legalHold.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold capitalize text-slate-900">
                        {formatLabel(legalHold.hold_type)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {legalHold.reason}
                      </p>
                    </div>
                    <StatusBadge status={legalHold.status} tone="danger" />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Authority: {legalHold.authority_reference || "Not set"} |
                    Imposed by {legalHold.imposed_by} on{" "}
                    {formatDateTime(legalHold.imposed_at)}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState title="No legal holds found" />
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Documents</h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            {documents.length > 0 ? (
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Type
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Library
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Retention
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Created
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      File
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td className="border-b border-slate-100 px-4 py-3 font-medium capitalize">
                        {formatLabel(document.document_type)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {document.library}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">
                        {formatLabel(document.retention_category)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDateTime(document.created_at)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <a
                          href={document.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block max-w-md break-words underline decoration-slate-300 underline-offset-4 hover:text-slate-600"
                        >
                          {document.file_url}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <EmptyState title="No documents found" />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Communications</h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            {communications.length > 0 ? (
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Type
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Channel
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Subject
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Delivery
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Sent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {communications.map((communication) => (
                    <tr key={communication.id}>
                      <td className="border-b border-slate-100 px-4 py-3 font-medium capitalize">
                        {formatLabel(communication.type)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">
                        {formatLabel(communication.channel)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {communication.subject}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge status={communication.delivery_status} />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDateTime(communication.sent_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <EmptyState title="No communications found" />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
