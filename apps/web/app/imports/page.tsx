import Link from "next/link";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { ShareholderImportPanel } from "@/src/components/ShareholderImportPanel";
import { fetchShareClasses } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";

export default async function ImportsPage() {
  const token = await getToken();
  const shareClassResponse = await fetchShareClasses(token ?? undefined).catch(() => ({ data: [] }));
  const activeShareClasses = ((shareClassResponse as { data: { status: string }[] }).data ?? []).filter(
    (sc) => sc.status === "active"
  );
  const hasShareClass = activeShareClasses.length > 0;

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          variant="page"
          eyebrow="Import Batch"
          title="Shareholder Import"
          description="Upload an Excel file to validate and import shareholder records. Share purchases in the file are recorded automatically."
        />

        {!hasShareClass && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <p className="font-semibold">No active share class found.</p>
            <p className="mt-1">
              Shareholders will be imported but their share purchases will not be recorded in the cap table.{" "}
              <Link href="/share-classes" className="font-semibold underline hover:text-amber-900">
                Create a share class first →
              </Link>
            </p>
          </div>
        )}

        <ShareholderImportPanel />
      </div>
    </PageContainer>
  );
}
