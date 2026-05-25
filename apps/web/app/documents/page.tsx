import { fetchDocuments } from "@/src/lib/api";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type DocumentReference = {
  id: string;
  entity_id: string;
  entity_name: string;
  file_url: string;
  library: string;
  document_type: string;
  metadata_json: JsonValue;
  retention_category: string | null;
  legal_hold_id: string | null;
  legal_hold_status: string | null;
  authority_reference: string | null;
  related_entity: string | null;
  related_id: string | null;
  created_at: string;
};

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function legalHoldClass(status: string | null) {
  if (status === "active") {
    return "bg-rose-100 text-rose-800";
  }

  if (status === "lifted") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-200 text-slate-700";
}

function isSharePointReady(fileUrl: string) {
  return fileUrl.toLowerCase().startsWith("https://sharepoint.");
}

export default async function DocumentsPage() {
  const response = await fetchDocuments();
  const documents: DocumentReference[] = response.data;
  const legalHoldProtectedCount = documents.filter(
    (document) => document.legal_hold_id !== null
  ).length;
  const sharePointReadyCount = documents.filter((document) =>
    isSharePointReady(document.file_url)
  ).length;

  return (
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Document References</h1>
            <p className="mt-2 text-slate-600">
              Review SharePoint-ready evidence references, retention categories,
              legal hold protection, and related governance records.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Read-only repository
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Total Documents
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {documents.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">Evidence references</p>
          </article>

          <article className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">
              Legal Hold Protected
            </p>
            <p className="mt-3 text-3xl font-bold text-rose-900">
              {legalHoldProtectedCount}
            </p>
            <p className="mt-1 text-sm text-rose-800">Linked to hold records</p>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-700">
              SharePoint-Ready
            </p>
            <p className="mt-3 text-3xl font-bold text-emerald-900">
              {sharePointReadyCount}
            </p>
            <p className="mt-1 text-sm text-emerald-800">Placeholder URLs</p>
          </article>
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Evidence Summary</h2>
              <p className="mt-1 text-sm text-slate-600">
                Recent document references mapped to governance records.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {documents.length} references
            </span>
          </div>

          {documents.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {documents.slice(0, 3).map((document) => (
                <article
                  key={document.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        {document.library}
                      </p>
                      <h3 className="mt-1 text-lg font-bold capitalize text-slate-900">
                        {formatLabel(document.document_type)}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${legalHoldClass(
                        document.legal_hold_status
                      )}`}
                    >
                      {document.legal_hold_status
                        ? formatLabel(document.legal_hold_status)
                        : "Standard"}
                    </span>
                  </div>

                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Retention</dt>
                      <dd className="font-semibold capitalize text-slate-900">
                        {formatLabel(document.retention_category)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Related Entity</dt>
                      <dd className="font-semibold capitalize text-slate-900">
                        {formatLabel(document.related_entity)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Created</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatDate(document.created_at)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              No document references found.
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Document Type
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Library
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Retention Category
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Related Entity
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Legal Hold Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Created At
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      File URL
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
                      <td className="border-b border-slate-100 px-4 py-3 capitalize">
                        {formatLabel(document.related_entity)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${legalHoldClass(
                            document.legal_hold_status
                          )}`}
                        >
                          {document.legal_hold_status
                            ? formatLabel(document.legal_hold_status)
                            : "Not protected"}
                        </span>
                        {document.authority_reference ? (
                          <div className="mt-1 text-xs text-slate-500">
                            {document.authority_reference}
                          </div>
                        ) : null}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDate(document.created_at)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <a
                          href={document.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block max-w-sm break-words text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-slate-600"
                        >
                          {document.file_url}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="bg-slate-50 p-6 text-sm text-slate-600">
              No document references found.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
