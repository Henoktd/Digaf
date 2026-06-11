import Link from "next/link";
import { CreateShareholderForm } from "@/src/components/CreateShareholderForm";
import { EmptyState } from "@/src/components/EmptyState";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { PaginationBar } from "@/src/components/PaginationBar";
import { fetchEntities, fetchShareholders } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";

type Shareholder = {
  shareholder_id: string;
  legal_name: string;
  type: string;
  status: string;
  kyc_status: string;
  kyc_expiry: string | null;
  risk_classification: string | null;
  proxy_eligible: boolean;
  shareholder_code: string | null;
  mobile_number: string | null;
  email_address: string | null;
  tin_number: string | null;
};

type Entity = {
  entity_id: string;
};

export default async function ShareholdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const token = await getToken();
  const [shareholderResponse, entityResponse] = await Promise.all([
    fetchShareholders(token ?? undefined, page, 50),
    fetchEntities(token ?? undefined),
  ]);
  const shareholders: Shareholder[] = shareholderResponse.data;
  const total: number = shareholderResponse.total ?? shareholders.length;
  const entities: Entity[] = entityResponse.data;
  const entityId = entities[0]?.entity_id ?? null;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Shareholder Registry"
          description="Manage shareholder master records, KYC status, beneficial ownership references, and profile history."
          badge={
            <div className="max-w-full break-words rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">
              {total} Shareholders
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <CreateShareholderForm entityId={entityId} />

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {shareholders.length > 0 ? (
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">Name</th>
                    <th className="border-b border-slate-200 px-4 py-3">Code</th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Contact
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">TIN</th>
                    <th className="border-b border-slate-200 px-4 py-3">Type</th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Status
                    </th>
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
                      <td className="break-words border-b border-slate-100 px-4 py-3">
                        {shareholder.shareholder_code || "Not set"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <div className="space-y-1">
                          <p className="break-words">
                            {shareholder.mobile_number || "No mobile"}
                          </p>
                          <p className="break-words text-xs text-slate-500">
                            {shareholder.email_address || "No email"}
                          </p>
                        </div>
                      </td>
                      <td className="break-words border-b border-slate-100 px-4 py-3">
                        {shareholder.tin_number || "Not set"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">
                        {shareholder.type}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge status={shareholder.status} />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <StatusBadge status={shareholder.kyc_status} />
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
            ) : (
              <div className="p-4">
                <EmptyState title="No shareholders found" />
              </div>
            )}
          </div>
          <PaginationBar page={page} total={total} limit={50} baseHref="/shareholders" />
        </section>
      </div>
    </PageContainer>
  );
}
