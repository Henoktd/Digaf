import { Suspense } from "react";
import { getToken } from "@/src/lib/dal";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { PageSkeleton } from "@/src/components/LoadingSkeleton";
import { CreateShareClassForm } from "@/src/components/CreateShareClassForm";
import { ShareClassesTable } from "@/src/components/ShareClassesTable";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function ShareClassesContent() {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/share-classes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = res.ok ? await res.json() : { data: [] };
  const shareClasses: any[] = json.data ?? [];

  return (
    <div className="space-y-6">
      <CreateShareClassForm />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ShareClassesTable shareClasses={shareClasses} />
      </div>
    </div>
  );
}

export default function ShareClassesPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          variant="page"
          eyebrow="Share Classes"
          title="Share Class Management"
          description="Define and manage share classes for the entity."
        />
        <Suspense fallback={<PageSkeleton />}>
          <ShareClassesContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}
