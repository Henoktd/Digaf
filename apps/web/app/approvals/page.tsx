import { fetchApprovals } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { ApprovalsTable } from "@/src/components/ApprovalsTable";

type Approval = {
  id: string;
  entity_name: string;
  request_type: string;
  reference_id: string | null;
  stage: string;
  current_approver_id: string | null;
  status: string;
  maker_id: string | null;
  checker1_id: string | null;
  checker2_id: string | null;
  sla_due_date: string | null;
  escalation_level: number;
  transferor_name: string | null;
  transferee_name: string | null;
  transfer_shares: string | null;
  transfer_status: string | null;
  kyc_check_status: string | null;
  encumbrance_check_status: string | null;
  board_approval_required: boolean | null;
};

type ApprovalResponse = {
  data: Approval[];
  generated_at: string;
};


export default async function ApprovalsPage() {
  const token = await getToken();
  const response: ApprovalResponse = await fetchApprovals(token ?? undefined);
  const approvals: Approval[] = response.data;
  const generatedAt = Date.parse(response.generated_at);

  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "pending"
  );

  const overdueApprovals = approvals.filter((approval) => {
    if (!approval.sla_due_date || approval.status !== "pending") return false;
    return Date.parse(approval.sla_due_date) < generatedAt;
  });

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Approval Queue"
          description="Review pending governance approvals, SLA due dates, escalation status, and decision notes."
          badge={
            <div className="max-w-full break-words rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">
              {approvals.length} Approval Requests
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard label="Total Approvals" value={approvals.length} />
          <KpiCard label="Pending" value={pendingApprovals.length} tone="warning" />
          <KpiCard
            label="Overdue"
            value={overdueApprovals.length}
            tone={overdueApprovals.length > 0 ? "danger" : "neutral"}
          />
        </div>

        <div className="mt-6">
          {approvals.length === 0 ? (
            <EmptyState title="No approvals found" />
          ) : (
            <ApprovalsTable approvals={approvals} />
          )}
        </div>
        </section>
      </div>
    </PageContainer>
  );
}
