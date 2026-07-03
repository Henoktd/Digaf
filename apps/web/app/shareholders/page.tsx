import Link from "next/link";
import { CreateShareholderForm } from "@/src/components/CreateShareholderForm";
import { EmptyState } from "@/src/components/EmptyState";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { PaginationBar } from "@/src/components/PaginationBar";
import { ExportCsvButton } from "@/src/components/ExportCsvButton";
import { ExportExcelButton } from "@/src/components/ExportExcelButton";
import { fetchEntities, fetchShareClasses, fetchShareholders } from "@/src/lib/api";
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

type ShareClass = {
  share_class_id: string;
  class_name: string;
  par_value: number | null;
};

export default async function ShareholdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const token = await getToken();
  const [shareholderResponse, entityResponse, shareClassResponse] = await Promise.all([
    fetchShareholders(token ?? undefined, page, 50),
    fetchEntities(token ?? undefined),
    fetchShareClasses(token ?? undefined).catch(() => ({ data: [] })),
  ]);
  const shareholders: Shareholder[] = shareholderResponse.data;
  const total: number = shareholderResponse.total ?? shareholders.length;
  const entities: Entity[] = entityResponse.data;
  const entityId = entities[0]?.entity_id ?? null;
  const allShareClasses: (ShareClass & { status?: string })[] = (shareClassResponse as { data: (ShareClass & { status?: string })[] }).data ?? [];
  const shareClasses: ShareClass[] = allShareClasses.filter((sc) => !sc.status || sc.status === "active");

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="Shareholder Registry"
          description="Manage shareholder master records, KYC status, beneficial ownership references, and profile history."
          badge={
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                {total} Shareholders
              </div>
              <Link
                href="/imports"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Import →
              </Link>
              <ExportCsvButton
                data={shareholders as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "legal_name", label: "Name" },
                  { key: "shareholder_code", label: "Code" },
                  { key: "type", label: "Type" },
                  { key: "status", label: "Status" },
                  { key: "kyc_status", label: "KYC Status" },
                  { key: "kyc_expiry", label: "KYC Expiry" },
                  { key: "tin_number", label: "TIN" },
                  { key: "mobile_number", label: "Mobile" },
                  { key: "email_address", label: "Email" },
                  { key: "risk_classification", label: "Risk" },
                ]}
                filename="shareholders-registry.csv"
              />
              <ExportExcelButton />
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <CreateShareholderForm entityId={entityId} shareClasses={shareClasses} />

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {shareholders.length > 0 ? (
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Code</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">TIN</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">KYC</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">KYC Expiry</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Proxy</th>
                  </tr>
                </thead>

                <tbody>
                  {shareholders.map((shareholder) => (
                    <tr key={shareholder.shareholder_id} className="transition-colors hover:bg-slate-50">
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
                        {shareholder.kyc_expiry ? shareholder.kyc_expiry.slice(0, 10) : "Not set"}
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
