import { fetchApprovals } from "@/src/lib/api";
import { ApprovalActions } from "@/src/components/ApprovalActions";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";

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

function formatLabel(value: string | null) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ApprovalsPage() {
  const response: ApprovalResponse = await fetchApprovals();
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

        {approvals.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No approvals found" />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Request Type
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Stage
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Current Approver
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    SLA Due
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Status
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Transfer
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Shares
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Maker
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Checker 1
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Checker 2
                  </th>
                  <th className="sticky right-0 z-10 min-w-52 border-b border-l border-slate-200 bg-slate-50 px-4 py-3">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="border-b border-slate-100 px-4 py-3 capitalize">
                      {formatLabel(approval.request_type)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 capitalize">
                      {formatLabel(approval.stage)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {approval.current_approver_id || "Not assigned"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {formatDate(approval.sla_due_date)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <StatusBadge status={approval.status} />
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {approval.transferor_name && approval.transferee_name
                        ? `${approval.transferor_name} → ${approval.transferee_name}`
                        : "Not linked"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {approval.transfer_shares || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {approval.maker_id || "Not set"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {approval.checker1_id || "Pending"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {approval.checker2_id || "Pending"}
                    </td>
                    <td className="sticky right-0 min-w-52 border-b border-l border-slate-100 bg-white px-4 py-3">
                      <ApprovalActions
                        approvalId={approval.id}
                        stage={approval.stage}
                        status={approval.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </section>
      </div>
    </PageContainer>
  );
}
