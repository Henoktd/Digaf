import { verifyCertificate } from "@/src/lib/api";
import { EmptyState } from "@/src/components/EmptyState";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";

type VerificationResult = {
  serial_number: string;
  issuing_company: string;
  share_class: string;
  quantity: string;
  issue_date: string | null;
  status: string;
  revocation_status: string | null;
  hash_algorithm: string | null;
  hash_generated_at: string | null;
  hash_verification_result: string;
  verification_timestamp: string;
};

type QrVerificationPageProps = {
  searchParams?: Promise<{
    serialNumber?: string;
  }>;
};

type VerificationResponse = {
  data?: VerificationResult;
  error?: {
    code: string;
    message: string;
    details?: {
      verificationTimestamp?: string;
    };
  };
};

function getPublicStatus(result: VerificationResult | null) {
  if (!result) return "not_found";

  if (
    result.status === "tampered" ||
    result.hash_verification_result === "tamper_detected"
  ) {
    return "tampered";
  }

  if (result.status === "revoked" || result.revocation_status === "revoked") {
    return "revoked";
  }

  return "valid";
}

function formatPublicStatus(status: string) {
  if (status === "not_found") return "not found";
  return status;
}

function getPublicStatusDescription(status: string) {
  if (status === "valid") {
    return "The certificate serial number exists and its hash evidence matches.";
  }

  if (status === "revoked") {
    return "The certificate exists, but it is marked as revoked.";
  }

  if (status === "tampered") {
    return "The certificate exists, but hash verification detected a mismatch.";
  }

  return "The serial number was not found in the certificate registry.";
}

export default async function QrVerificationPage({
  searchParams,
}: QrVerificationPageProps) {
  const params = searchParams ? await searchParams : {};
  const serialNumber = params.serialNumber || "DIGAF-CERT-2026-000001";
  const response: VerificationResponse = await verifyCertificate(serialNumber);
  const result = response.data ?? null;
  const publicStatus = getPublicStatus(result);

  return (
    <main className="p-8">
      <div className="space-y-6">
        <PageHeader
          title="Public QR Verification"
          description="Verify certificate authenticity, status, serial number, share class, issue date, and hash verification result without exposing personal data."
          notice="Privacy notice: public verification does not expose shareholder name, contact information, KYC records, beneficial ownership, actor IDs, or internal approval details."
        />

        <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">
                Verification status
              </p>
              <h2 className="mt-1 text-3xl font-bold">
                {formatPublicStatus(publicStatus)}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Serial checked: {serialNumber}
              </p>
              <p className="mt-2 max-w-2xl text-sm text-slate-700">
                {getPublicStatusDescription(publicStatus)}
              </p>
            </div>

            <StatusBadge
              status={publicStatus}
              label={formatPublicStatus(publicStatus)}
            />
          </div>

          {result ? (
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Serial Number</dt>
                <dd className="font-semibold">{result.serial_number}</dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">Issuing Company</dt>
                <dd className="font-semibold">{result.issuing_company}</dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">Share Class</dt>
                <dd className="font-semibold">{result.share_class}</dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">Number of Shares</dt>
                <dd className="font-semibold">{result.quantity}</dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">Issue Date</dt>
                <dd className="font-semibold">
                  {result.issue_date || "Not set"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">Hash Algorithm</dt>
                <dd className="font-semibold">
                  {result.hash_algorithm || "Not generated"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">Revocation Status</dt>
                <dd className="font-semibold">
                  {result.revocation_status || "None"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">
                  Verification Timestamp
                </dt>
                <dd className="font-semibold">
                  {result.verification_timestamp}
                </dd>
              </div>
            </dl>
          ) : (
            <EmptyState
              title="Certificate not found"
              description="The serial number was not found in the certificate registry."
              className="bg-white"
            />
          )}

          <div className="mt-6 rounded-xl bg-white p-4 text-sm text-slate-600">
            Privacy notice: public verification is intentionally limited to
            certificate status, share class, quantity, issuance, revocation, and
            hash evidence. It does not show shareholder name, contact details,
            KYC records, beneficial ownership, actor IDs, or approval internals.
          </div>
        </div>
        </section>
      </div>
    </main>
  );
}
