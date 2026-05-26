import { verifyCertificate } from "@/src/lib/api";

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

function getStatusStyles(status: string) {
  if (status === "valid") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "revoked") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "tampered") {
    return "bg-red-100 text-red-800";
  }

  return "bg-slate-200 text-slate-700";
}

function formatPublicStatus(status: string) {
  if (status === "not_found") return "Not found";
  return status.charAt(0).toUpperCase() + status.slice(1);
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
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Public QR Verification</h1>
          <p className="mt-2 text-slate-600">
            Verify certificate authenticity, status, serial number, share class,
            issue date, and hash verification result without exposing personal
            data.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Public Verification Result
              </p>
              <h2 className="mt-1 text-3xl font-bold capitalize">
                {formatPublicStatus(publicStatus)}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Serial checked: {serialNumber}
              </p>
            </div>

            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyles(
                publicStatus
              )}`}
            >
              {result?.hash_verification_result || "not_found"}
            </div>
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
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-semibold text-slate-900">
                Certificate not found.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                The serial number was not found in the certificate registry.
              </p>
            </div>
          )}

          <div className="mt-6 rounded-xl bg-white p-4 text-sm text-slate-600">
            Privacy notice: public verification does not expose shareholder
            name, contact information, KYC records, beneficial ownership,
            actor IDs, or internal approval details.
          </div>
        </div>
      </section>
    </main>
  );
}
