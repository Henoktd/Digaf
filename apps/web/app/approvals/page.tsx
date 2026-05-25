import { fetchApprovals } from "@/src/lib/api";

type Approval = {
  id: string;
  entity_name: string;
  request_type: string;
  reference_id: string;
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

function formatLabel(value: string | null) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ");
}

export default async function ApprovalsPage() {
  const response = await fetchApprovals();
  const approvals: Approval[] = response.data;

  const now = new Date();

  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "pending"
  );

  const overdueApprovals = approvals.filter((approval) => {
    if (!approval.sla_due_date || approval.status !== "pending") return false;
    return new Date(approval.sla_due_date) < now;
  });

  return (
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Approval Queue</h1>
            <p className="mt-2 text-slate-600">
              Review pending governance approvals, SLA due dates, escalation
              status, and decision notes.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            {approvals.length} Approval Requests
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Total Approvals</p>
            <p className="mt-2 text-3xl font-bold">{approvals.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-2 text-3xl font-bold">
              {pendingApprovals.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Overdue</p>
            <p className="mt-2 text-3xl font-bold">
              {overdueApprovals.length}
            </p>
          </div>
        </div>

        {approvals.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
            No approval requests found.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
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
                      {approval.sla_due_date
                        ? new Date(approval.sla_due_date).toLocaleString()
                        : "Not set"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 capitalize">
                      {formatLabel(approval.status)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}