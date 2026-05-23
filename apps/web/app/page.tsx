import { fetchEntities, fetchShareClasses } from "@/src/lib/api";

type Entity = {
  entity_id: string;
  legal_name: string;
  type: string;
  status: string;
  created_at: string;
};

type ShareClass = {
  share_class_id: string;
  entity_id: string;
  class_name: string;
  voting_rights: boolean;
  votes_per_share: number;
  par_value: string;
  status: string;
};

export default async function Home() {
  const entitiesResponse = await fetchEntities();
  const shareClassesResponse = await fetchShareClasses();

  const entities: Entity[] = entitiesResponse.data;
  const shareClasses: ShareClass[] = shareClassesResponse.data;

  const primaryEntity = entities[0];

  return (
    <main className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            SVH Governance Platform
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Shareholder Governance & Engagement Platform
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Final v3 implementation foundation: React/Next.js frontend,
            backend API, PostgreSQL governance ledger, SharePoint document
            repository, Entra ID identity, Power Automate notifications only,
            and Power BI reporting. No Dataverse.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Deployment Entity</p>
            <h2 className="mt-2 text-xl font-semibold">
              {primaryEntity?.legal_name || "No entity found"}
            </h2>
            <p className="mt-2 text-sm capitalize text-slate-600">
              {primaryEntity?.type || "Not configured"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Entity Status</p>
            <h2 className="mt-2 text-xl font-semibold capitalize">
              {primaryEntity?.status || "Unknown"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              PostgreSQL-backed entity configuration
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Share Classes</p>
            <h2 className="mt-2 text-xl font-semibold">
              {shareClasses.length}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Loaded from backend API
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Share Classes</h2>
            <p className="text-sm text-slate-500">
              Initial governance data loaded from PostgreSQL through the backend
              API.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Class Name
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Voting Rights
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Votes / Share
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Par Value
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {shareClasses.map((shareClass) => (
                  <tr key={shareClass.share_class_id}>
                    <td className="border-b border-slate-100 px-4 py-3 font-medium">
                      {shareClass.class_name}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {shareClass.voting_rights ? "Yes" : "No"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {shareClass.votes_per_share}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {shareClass.par_value}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 capitalize">
                      {shareClass.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}