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

export default async function QrVerificationPage() {
  const response = await verifyCertificate("DIGAF-CERT-2026-000001");
  const result: VerificationResult = response.data;

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
              <p className="text-sm text-slate-500">Certificate Status</p>
              <h2 className="mt-1 text-3xl font-bold capitalize">
                {result.status}
              </h2>
            </div>

            <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
              {result.hash_verification_result}
            </div>
          </div>

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
              <dd className="font-semibold">{result.issue_date || "Not set"}</dd>
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
              <dt className="text-sm text-slate-500">Verification Timestamp</dt>
              <dd className="font-semibold">{result.verification_timestamp}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-xl bg-white p-4 text-sm text-slate-600">
            Public verification does not expose shareholder name, contact
            information, KYC records, beneficial ownership, or internal approval
            details.
          </div>
        </div>
      </section>
    </main>
  );
}