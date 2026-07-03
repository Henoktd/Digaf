"use client";

import { useState } from "react";
import { StatusBadge } from "@/src/components/StatusBadge";
import { TransferActions } from "@/src/components/TransferActions";
import { ConfirmModal } from "@/src/components/ConfirmModal";
import { EmptyState } from "@/src/components/EmptyState";
import { useToast } from "@/src/components/Toast";
import { fieldClass } from "@/src/components/ui/field";
import { cancelTransfer } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";

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
  approval_stage: string | null;
  approval_status: string | null;
  current_approver: string | null;
  sla_due_date: string | null;
  escalation_level: number | null;
};

function formatShares(value: string) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "—";
}

export function TransfersTable({ transfers }: { transfers: Transfer[] }) {
  const [searchQ, setSearchQ] = useState("");
  const [cancelModal, setCancelModal] = useState<{ open: boolean; transferId: string }>({ open: false, transferId: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const filtered = transfers.filter(
    (t) =>
      !searchQ ||
      t.transferor_name.toLowerCase().includes(searchQ.toLowerCase()) ||
      t.transferee_name.toLowerCase().includes(searchQ.toLowerCase())
  );

  async function handleCancel(reason?: string) {
    setCancelModal({ open: false, transferId: "" });
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      await cancelTransfer(cancelModal.transferId, reason ?? "", token);
      toast("Transfer cancelled", "info");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to cancel transfer", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by transferor or transferee name…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          aria-label="Search transfers"
          className={`max-w-sm ${fieldClass}`}
        />
        <span className="text-xs text-slate-500">
          {filtered.length} of {transfers.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        {filtered.length > 0 ? (
          <table className="min-w-[1280px] w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Transferor</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Transferee</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shares</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">SLA Due</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Maker</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Checker 1</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Checker 2</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((transfer) => (
                <tr key={transfer.transfer_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{transfer.transferor_name}</td>
                  <td className="px-4 py-3 text-slate-700">{transfer.transferee_name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatShares(transfer.shares)}</td>
                  <td className="px-4 py-3"><StatusBadge status={transfer.status} /></td>
                  <td className="px-4 py-3 capitalize text-slate-600">{formatLabel(transfer.approval_stage)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(transfer.sla_due_date)}</td>
                  <td className="px-4 py-3 text-slate-500">{transfer.maker_id ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{transfer.checker1_id ?? "Pending"}</td>
                  <td className="px-4 py-3 text-slate-500">{transfer.checker2_id ?? "Pending"}</td>
                  <td className="px-4 py-3">
                    <TransferActions
                      transferId={transfer.transfer_id}
                      status={transfer.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4">
            <EmptyState
              title={transfers.length === 0 ? "No transfers found" : "No transfers match your search"}
              description={
                transfers.length === 0
                  ? "Transfers appear here once they are created."
                  : "Try a different transferor or transferee name."
              }
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={cancelModal.open}
        title="Cancel Transfer"
        message="This will cancel the transfer request. Please provide a reason."
        confirmLabel="Cancel Transfer"
        variant="danger"
        requireReason
        onConfirm={handleCancel}
        onCancel={() => setCancelModal({ open: false, transferId: "" })}
      />
    </div>
  );
}
