import { CreateTransferForm } from "@/src/components/CreateTransferForm";
import { TransferActions } from "@/src/components/TransferActions";
import { fetchShareholders, fetchTransfers } from "@/src/lib/api";

type Transfer = {
  transfer_id: string;
  entity_name: string;
  transferor_name: string;
  transferee_name: string;
  shares: string;
  status: string;
  maker_id: string | null;
  checker1_id: string | null;
  checker2_id: string | null;
  board_approval_required: boolean;
  board_approval_ref: string | null;
  encumbrance_check_status: string;
  kyc_check_status: string;
  bo_reverification_required: boolean;
  freeze_reference: string | null;
  supporting_documents: unknown[];
  effective_date: string | null;
  created_at: string;
  approval_request_id: string | null;
  approval_stage: string | null;
  approval_status: string | null;
  current_approver: string | null;
  approval_decision_notes: string | null;
  sla_due_date: string | null;
  escalation_level: number | null;
};

type Shareholder = {
  shareholder_id: string;
  entity_id: string;
  legal_name: string;
  kyc_status: string;
  risk_classification: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function formatShares(value: string) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function statusBadgeClass(status: string) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold capitalize";

  if (status === "completed") {
    return `${base} bg-emerald-100 text-emerald-800`;
  }

  if (status === "rejected") {
    return `${base} bg-rose-100 text-rose-800`;
  }

  if (status === "cancelled") {
    return `${base} bg-slate-200 text-slate-700`;
  }

  return `${base} bg-amber-100 text-amber-800`;
}

export default async function TransfersPage() {
  const [transferResponse, shareholderResponse] = await Promise.all([
    fetchTransfers(),
    fetchShareholders(),
  ]);
  const transfers: Transfer[] = transferResponse.data;
  const shareholders: Shareholder[] = shareholderResponse.data;

  return (
    <main className="p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Share Transfers</h1>
            <p className="mt-2 text-slate-600">
              Manage transfer requests, maker-checker-checker approvals, KYC
              checks, freeze checks, and encumbrance checks.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            {transfers.length} Transfer Requests
          </div>
        </div>

        <CreateTransferForm shareholders={shareholders} />

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          {transfers.map((transfer) => (
            <article
              key={transfer.transfer_id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{transfer.entity_name}</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {formatShares(transfer.shares)} shares
                  </h2>
                </div>
                <span className={statusBadgeClass(transfer.status)}>
                  {formatLabel(transfer.status)}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Transferor</p>
                  <p className="font-semibold text-slate-900">
                    {transfer.transferor_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Transferee</p>
                  <p className="font-semibold text-slate-900">
                    {transfer.transferee_name}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2 text-xs font-semibold sm:grid-cols-3">
                <span className="rounded-full bg-emerald-100 px-3 py-2 capitalize text-emerald-800">
                  KYC: {formatLabel(transfer.kyc_check_status)}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-2 capitalize text-emerald-800">
                  Encumbrance: {formatLabel(transfer.encumbrance_check_status)}
                </span>
                <span className="rounded-full bg-slate-200 px-3 py-2 text-slate-700">
                  Board: {transfer.board_approval_required ? "Required" : "Not required"}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1280px] w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3">Transferor</th>
                <th className="border-b border-slate-200 px-4 py-3">Transferee</th>
                <th className="border-b border-slate-200 px-4 py-3">Shares</th>
                <th className="border-b border-slate-200 px-4 py-3">Stage</th>
                <th className="border-b border-slate-200 px-4 py-3">Current Approver</th>
                <th className="border-b border-slate-200 px-4 py-3">SLA Due</th>
                <th className="border-b border-slate-200 px-4 py-3">Maker</th>
                <th className="border-b border-slate-200 px-4 py-3">Checker 1</th>
                <th className="border-b border-slate-200 px-4 py-3">Checker 2</th>
                <th className="border-b border-slate-200 px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr key={transfer.transfer_id}>
                  <td className="border-b border-slate-100 px-4 py-3 font-medium">
                    {transfer.transferor_name}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {transfer.transferee_name}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {formatShares(transfer.shares)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {formatLabel(transfer.approval_stage)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {transfer.current_approver || "Not assigned"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {formatDate(transfer.sla_due_date)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {transfer.maker_id || "Not assigned"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {transfer.checker1_id || "Pending"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {transfer.checker2_id || "Pending"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    <TransferActions
                      transferId={transfer.transfer_id}
                      status={transfer.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
