import { fetchCertificates } from "@/src/lib/api";

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

export default async function CertificatesPage() {
  const response = await fetchCertificates();
  const certificates: Certificate[] = response.data;

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
      </section>
    </main>
  );
}