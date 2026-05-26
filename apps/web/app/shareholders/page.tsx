import Link from "next/link";
import { CreateShareholderForm } from "@/src/components/CreateShareholderForm";
import { fetchEntities, fetchShareholders } from "@/src/lib/api";

type Shareholder = {
  shareholder_id: string;
  legal_name: string;
  type: string;
  status: string;
  kyc_status: string;
  kyc_expiry: string | null;
  risk_classification: string | null;
  proxy_eligible: boolean;
};

type Entity = {
  entity_id: string;
};

export default async function ShareholdersPage() {
  const [shareholderResponse, entityResponse] = await Promise.all([
    fetchShareholders(),
    fetchEntities(),
  ]);
  const shareholders: Shareholder[] = shareholderResponse.data;
  const entities: Entity[] = entityResponse.data;
  const entityId = entities[0]?.entity_id ?? null;

  return (
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shareholder Registry</h1>
            <p className="mt-2 text-slate-600">
              Manage shareholder master records, KYC status, beneficial
              ownership references, and profile history.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            {shareholders.length} Shareholders
          </div>
        </div>

        <CreateShareholderForm entityId={entityId} />

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3">Name</th>
                <th className="border-b border-slate-200 px-4 py-3">Type</th>
                <th className="border-b border-slate-200 px-4 py-3">Status</th>
                <th className="border-b border-slate-200 px-4 py-3">
                  KYC Status
                </th>
                <th className="border-b border-slate-200 px-4 py-3">
                  KYC Expiry
                </th>
                <th className="border-b border-slate-200 px-4 py-3">Risk</th>
                <th className="border-b border-slate-200 px-4 py-3">
                  Proxy Eligible
                </th>
              </tr>
            </thead>

            <tbody>
              {shareholders.map((shareholder) => (
                <tr key={shareholder.shareholder_id}>
                  <td className="border-b border-slate-100 px-4 py-3 font-medium">
                    <Link
                      href={`/shareholders/${shareholder.shareholder_id}`}
                      className="text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-slate-600"
                    >
                      {shareholder.legal_name}
                    </Link>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {shareholder.type}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {shareholder.status}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {shareholder.kyc_status}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {shareholder.kyc_expiry || "Not set"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {shareholder.risk_classification || "Not set"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {shareholder.proxy_eligible ? "Yes" : "No"}
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
