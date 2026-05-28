import { verifyCertificate } from "@/src/lib/api";

type QrPageProps = {
  searchParams?: Promise<{
    serialNumber?: string;
  }>;
};

type VerificationData = {
  serial_number?: string;
  issuing_company?: string;
  share_class?: string;
  quantity?: string;
  issue_date?: string | null;
  status?: string | null;
  revocation_status?: string | null;
  hash_algorithm?: string | null;
  hash_generated_at?: string | null;
  hash_verification_result?: string | null;
  verification_timestamp?: string | null;
};

function label(value: string | null | undefined) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ");
}

function getResultTitle(data?: VerificationData) {
  if (!data) return "Verification Error";

  if (data.hash_verification_result === "tamper_detected") {
    return "Tamper Detected";
  }

  if (data.status === "revoked" || data.revocation_status === "revoked") {
    return "Revoked Certificate";
  }

  if (data.hash_verification_result === "valid") {
    return "Valid Certificate";
  }

  if (data.hash_verification_result === "hash_missing") {
    return "Hash Missing";
  }

  return "Verification Result";
}

function getResultDescription(data?: VerificationData) {
  if (!data) {
    return "The certificate could not be verified at this time.";
  }

  if (data.hash_verification_result === "tamper_detected") {
    return "The certificate integrity check failed. This record should be reviewed by governance staff.";
  }

  if (data.status === "revoked" || data.revocation_status === "revoked") {
    return "The certificate hash is valid, but the certificate has been revoked in the governance ledger.";
  }

  if (data.hash_verification_result === "valid") {
    return "The certificate record matched the governance ledger and passed the integrity check.";
  }

  if (data.hash_verification_result === "hash_missing") {
    return "The certificate has not yet been prepared for cryptographic verification.";
  }

  return "The verification response was received, but the status requires review.";
}

export default async function QrVerifyPage({ searchParams }: QrPageProps) {
  const params = searchParams ? await searchParams : {};
  const serialNumber = params?.serialNumber || "DIGAF-CERT-2026-000001";

  let data: VerificationData | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await verifyCertificate(serialNumber);
    data = response.data;
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to verify certificate.";
  }

  const resultTitle = getResultTitle(data || undefined);
  const resultDescription = getResultDescription(data || undefined);

  return (
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Public Verification
          </p>
          <h1 className="mt-2 text-3xl font-bold">Certificate QR Verification</h1>
          <p className="mt-2 text-slate-600">
            This page verifies certificate integrity against the Digaf governance
            ledger without exposing private shareholder profile, KYC, contact,
            or approval information.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-500">Serial Number</p>
          <p className="mt-1 text-xl font-semibold">{serialNumber}</p>

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <h2 className="text-lg font-semibold text-red-700">
                Verification Error
              </h2>
              <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-2xl font-bold">{resultTitle}</h2>
              <p className="mt-2 text-slate-600">{resultDescription}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Issuing Company</p>
                  <p className="font-semibold">
                    {data?.issuing_company || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Share Class</p>
                  <p className="font-semibold">
                    {data?.share_class || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Quantity</p>
                  <p className="font-semibold">{data?.quantity || "Not set"}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Issue Date</p>
                  <p className="font-semibold">
                    {data?.issue_date
                      ? new Date(data.issue_date).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Certificate Status</p>
                  <p className="font-semibold capitalize">
                    {label(data?.status)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Revocation Status</p>
                  <p className="font-semibold capitalize">
                    {label(data?.revocation_status)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Hash Algorithm</p>
                  <p className="font-semibold">
                    {data?.hash_algorithm || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Integrity Result</p>
                  <p className="font-semibold capitalize">
                    {label(data?.hash_verification_result)}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-xs text-slate-500">
                Verification timestamp:{" "}
                {data?.verification_timestamp
                  ? new Date(data.verification_timestamp).toLocaleString()
                  : "Not available"}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}