import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { ShareholderImportPanel } from "@/src/components/ShareholderImportPanel";

export default function ImportsPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          variant="page"
          eyebrow="Import Batch"
          title="Shareholder Import"
          description="Upload an Excel or CSV file to validate and persist shareholder import batches. Persisting a batch does not create shareholder records — it stages the rows for compliance review."
        />

        <ShareholderImportPanel />
      </div>
    </PageContainer>
  );
}
