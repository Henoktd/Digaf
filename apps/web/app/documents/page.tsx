import { fetchDocuments } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { DocumentsTable } from "@/src/components/DocumentsTable";

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

function isSharePointReady(fileUrl: string) {
  return fileUrl.toLowerCase().startsWith("https://sharepoint.");
}

export default async function DocumentsPage() {
  const token = await getToken();
  const response = await fetchDocuments(token ?? undefined);
  const documents: DocumentReference[] = response.data;
  const legalHoldProtectedCount = documents.filter(
    (document) => document.legal_hold_id !== null
  ).length;
  const sharePointReadyCount = documents.filter((document) =>
    isSharePointReady(document.file_url)
  ).length;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Document References"
          description="Review SharePoint-ready evidence references, retention categories, legal hold protection, and related governance records."
          badge={
            <div className="max-w-full break-words rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">
              Read-only repository
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Total Documents"
            value={documents.length}
            detail="Evidence references"
          />
          <KpiCard
            label="Legal Hold Protected"
            value={legalHoldProtectedCount}
            detail="Linked to hold records"
            tone={legalHoldProtectedCount > 0 ? "danger" : "neutral"}
          />
          <KpiCard
            label="SharePoint-Ready"
            value={sharePointReadyCount}
            detail="Placeholder URLs"
            tone="success"
          />
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

                    <StatusBadge
                      status={document.legal_hold_status}
                      label={
                        document.legal_hold_status
                          ? formatLabel(document.legal_hold_status)
                          : "Standard"
                      }
                      tone={
                        document.legal_hold_status === "active"
                          ? "danger"
                          : undefined
                      }
                    />
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
            <EmptyState title="No documents found" className="bg-white" />
          )}
        </div>

        <DocumentsTable documents={documents} />
        </section>
      </div>
    </PageContainer>
  );
}
