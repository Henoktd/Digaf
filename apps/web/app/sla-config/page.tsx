import { Suspense } from "react";
import { getToken } from "@/src/lib/dal";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { PageSkeleton } from "@/src/components/LoadingSkeleton";
import { SlaConfigTable } from "@/src/components/SlaConfigTable";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function SlaConfigContent() {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/sla-config`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = res.ok ? await res.json() : { data: [] };
  const configs: any[] = json.data ?? [];

  return <SlaConfigTable configs={configs} />;
}

export default function SlaConfigPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          variant="page"
          eyebrow="Configuration"
          title="SLA Configuration"
          description="Set target days and escalation rules for each governance process type."
        />
        <Suspense fallback={<PageSkeleton />}>
          <SlaConfigContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}
