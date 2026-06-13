import { CreateTransferForm } from "@/src/components/CreateTransferForm";
import { EmptyState } from "@/src/components/EmptyState";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { TransfersTable } from "@/src/components/TransfersTable";
import { PaginationBar } from "@/src/components/PaginationBar";
import { fetchShareholders, fetchTransfers } from "@/src/lib/api";
import { getToken } from "@/src/lib/dal";

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

function formatShares(value: string) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

export default async function TransfersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const token = await getToken();
  const [transferResponse, shareholderResponse] = await Promise.all([
    fetchTransfers(token ?? undefined, page, 50),
    fetchShareholders(token ?? undefined),
  ]);
  const transfers: Transfer[] = transferResponse.data;
  const total: number = transferResponse.total ?? transfers.length;
  const shareholders: Shareholder[] = shareholderResponse.data;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="Share Transfers"
          description="Manage transfer requests, maker-checker-checker approvals, KYC checks, freeze checks, and encumbrance checks."
          badge={
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              {total} Transfers
            </div>
          }
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <CreateTransferForm shareholders={shareholders} />

        {transfers.length > 0 ? (
          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            {transfers.map((transfer) => (
              <article
                key={transfer.transfer_id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      {transfer.entity_name}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {formatShares(transfer.shares)} shares
                    </h2>
                  </div>
                  <StatusBadge status={transfer.status} />
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

                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge
                    status={transfer.kyc_check_status}
                    prefix="KYC"
                  />
                  <StatusBadge
                    status={transfer.encumbrance_check_status}
                    prefix="Encumbrance"
                  />
                  <StatusBadge
                    status={
                      transfer.board_approval_required
                        ? "pending"
                        : "not_required"
                    }
                    label={
                      transfer.board_approval_required
                        ? "Required"
                        : "Not required"
                    }
                    prefix="Board"
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <EmptyState title="No transfers found" />
          </div>
        )}

        <TransfersTable transfers={transfers} />
        <PaginationBar page={page} total={total} limit={50} baseHref="/transfers" />
        </section>
      </div>
    </PageContainer>
  );
}
