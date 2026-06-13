"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/src/components/StatusBadge";
import { ConfirmModal } from "@/src/components/ConfirmModal";
import { useToast } from "@/src/components/Toast";
import { useRole, canApproveChecker1, canApproveChecker2, canReject } from "@/src/lib/useRole";
import { approveChecker1, approveChecker2, rejectApproval } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

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
};

function formatLabel(value: string | null) {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

function formatActor(id: string | null): string {
  if (!id) return "—";
  // UUID pattern: 8-4-4-4-12 hex chars
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)) return `${id.slice(0, 8)}…`;
  return id;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

async function getToken(): Promise<string | undefined> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export function ApprovalsTable({ approvals }: { approvals: Approval[] }) {
  const { role } = useRole();
  const router = useRouter();
  const toast = useToast();

  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [rejectModal, setRejectModal] = useState<{ open: boolean; approvalId: string }>({ open: false, approvalId: "" });
  const [bulkModal, setBulkModal] = useState(false);

  const filtered = approvals.filter((a) => {
    const matchesSearch =
      !searchQ ||
      (a.transferor_name ?? "").toLowerCase().includes(searchQ.toLowerCase()) ||
      (a.transferee_name ?? "").toLowerCase().includes(searchQ.toLowerCase()) ||
      a.request_type.toLowerCase().includes(searchQ.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingFiltered = filtered.filter((a) => a.status === "pending");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === pendingFiltered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingFiltered.map((a) => a.id)));
    }
  }

  async function handleApproveC1(approvalId: string) {
    setLoadingId(approvalId);
    try {
      const token = await getToken();
      if (!token) return;
      await approveChecker1(approvalId, "Approved by Checker 1", token);
      toast("Approved (Checker 1)", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Approval failed", "error");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleApproveC2(approvalId: string) {
    setLoadingId(approvalId);
    try {
      const token = await getToken();
      if (!token) return;
      await approveChecker2(approvalId, "Approved by Checker 2", token);
      toast("Approved (Checker 2)", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Approval failed", "error");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(approvalId: string, reason: string) {
    setRejectModal({ open: false, approvalId: "" });
    setLoadingId(approvalId);
    try {
      const token = await getToken();
      if (!token) return;
      await rejectApproval(approvalId, reason, token);
      toast("Approval rejected", "info");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Rejection failed", "error");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleBulkApproveC1(reason?: string) {
    setBulkModal(false);
    setBulkLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      for (const id of Array.from(selected)) {
        await approveChecker1(id, reason || "Approved by Checker 1", token);
      }
      setSelected(new Set());
      toast(`${selected.size} items approved`, "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Bulk approve failed", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or type…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {selected.size > 0 && canApproveChecker1(role) && (
          <button
            type="button"
            onClick={() => setBulkModal(true)}
            disabled={bulkLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {bulkLoading ? "Approving…" : `Approve selected (${selected.size}) — C1`}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b border-slate-200 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {pendingFiltered.length > 0 && (
                  <input
                    type="checkbox"
                    checked={selected.size === pendingFiltered.length && pendingFiltered.length > 0}
                    onChange={toggleAll}
                    className="h-4 w-4"
                  />
                )}
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Transfer</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shares</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">SLA Due</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Maker</th>
              <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  No approvals match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((approval) => (
                <tr key={approval.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-3">
                    {approval.status === "pending" && (
                      <input
                        type="checkbox"
                        checked={selected.has(approval.id)}
                        onChange={() => toggleSelect(approval.id)}
                        className="h-4 w-4"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">
                    {formatLabel(approval.request_type)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatLabel(approval.stage)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {approval.transferor_name && approval.transferee_name
                      ? `${approval.transferor_name} → ${approval.transferee_name}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {approval.transfer_shares ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(approval.sla_due_date)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={approval.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {formatActor(approval.maker_id)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {approval.status === "pending" &&
                        approval.stage === "checker_1_review" &&
                        canApproveChecker1(role) && (
                          <button
                            type="button"
                            onClick={() => handleApproveC1(approval.id)}
                            disabled={loadingId === approval.id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Approve C1
                          </button>
                        )}
                      {approval.status === "pending" &&
                        approval.stage === "checker_2_review" &&
                        canApproveChecker2(role) && (
                          <button
                            type="button"
                            onClick={() => handleApproveC2(approval.id)}
                            disabled={loadingId === approval.id}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Approve C2
                          </button>
                        )}
                      {approval.status === "pending" && canReject(role) && (
                        <button
                          type="button"
                          onClick={() =>
                            setRejectModal({ open: true, approvalId: approval.id })
                          }
                          disabled={loadingId === approval.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject modal */}
      <ConfirmModal
        isOpen={rejectModal.open}
        title="Reject Approval"
        message="This will reject the approval request. Please provide a reason."
        confirmLabel="Reject"
        variant="danger"
        requireReason
        onConfirm={(reason) => handleReject(rejectModal.approvalId, reason ?? "")}
        onCancel={() => setRejectModal({ open: false, approvalId: "" })}
      />

      {/* Bulk approve modal */}
      <ConfirmModal
        isOpen={bulkModal}
        title={`Bulk Approve ${selected.size} Request${selected.size !== 1 ? "s" : ""} (Checker 1)`}
        message="This will approve all selected requests at Checker 1 stage."
        confirmLabel="Approve All"
        variant="warning"
        onConfirm={handleBulkApproveC1}
        onCancel={() => setBulkModal(false)}
      />
    </div>
  );
}
