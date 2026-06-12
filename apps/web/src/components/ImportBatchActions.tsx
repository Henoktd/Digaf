"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  cancelShareholderImportBatch,
  commitShareholderImportBatch,
  rejectShareholderImportBatch,
  revalidateShareholderImportBatch,
  submitShareholderImportBatchForReview,
} from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Not authenticated");
  return data.session.access_token;
}

const TERMINAL_STATUSES = ["cancelled", "rejected"];
const COMMITTABLE_STATUSES = ["validated", "validated_with_warnings", "approved_for_commit", "ready_for_compliance_review"];
const SUBMITTABLE_STATUSES = ["validated", "validated_with_warnings"];

type ImportBatchActionsProps = {
  batchId: string;
  batchStatus: string;
};

export function ImportBatchActions({
  batchId,
  batchStatus,
}: ImportBatchActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const isTerminal = TERMINAL_STATUSES.includes(batchStatus);
  const canCommit = COMMITTABLE_STATUSES.includes(batchStatus);
  const canSubmit = SUBMITTABLE_STATUSES.includes(batchStatus);
  const canRevalidate = !isTerminal && !canCommit;
  const canCancel = !isTerminal;
  const canReject = !isTerminal;

  async function handleCommit() {
    setPending("commit");
    setError(null);
    try {
      const token = await getAccessToken();
      await commitShareholderImportBatch(batchId, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to commit batch");
    } finally {
      setPending(null);
    }
  }

  async function handleSubmitReview() {
    setPending("submit");
    setError(null);
    try {
      const token = await getAccessToken();
      await submitShareholderImportBatchForReview(batchId, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit for review");
    } finally {
      setPending(null);
    }
  }

  async function handleRevalidate() {
    setPending("revalidate");
    setError(null);
    try {
      const token = await getAccessToken();
      await revalidateShareholderImportBatch(batchId, { confirmNoProductionData: true }, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revalidate batch");
    } finally {
      setPending(null);
    }
  }

  async function handleCancel() {
    setPending("cancel");
    setError(null);
    try {
      const token = await getAccessToken();
      await cancelShareholderImportBatch(batchId, {}, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel batch");
    } finally {
      setPending(null);
    }
  }

  async function handleReject() {
    setPending("reject");
    setError(null);
    try {
      const token = await getAccessToken();
      await rejectShareholderImportBatch(
        batchId,
        { reviewNotes: rejectNotes.trim() || undefined },
        token
      );
      setRejectNotes("");
      setShowRejectForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject batch");
    } finally {
      setPending(null);
    }
  }

  if (isTerminal) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-700">Batch actions</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {canCommit ? (
          <button
            type="button"
            onClick={handleCommit}
            disabled={pending !== null}
            className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {pending === "commit" ? "Committing..." : "Commit Batch → Create Shareholders"}
          </button>
        ) : null}

        {canSubmit && !canCommit ? (
          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={pending !== null}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {pending === "submit" ? "Submitting..." : "Submit for review"}
          </button>
        ) : null}

        {canRevalidate ? (
          <button
            type="button"
            onClick={handleRevalidate}
            disabled={pending !== null}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {pending === "revalidate" ? "Revalidating..." : "Revalidate"}
          </button>
        ) : null}

        {canReject && !showRejectForm ? (
          <button
            type="button"
            onClick={() => setShowRejectForm(true)}
            disabled={pending !== null}
            className="rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
          >
            Reject batch
          </button>
        ) : null}

        {canCancel ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={pending !== null}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            {pending === "cancel" ? "Cancelling..." : "Cancel batch"}
          </button>
        ) : null}
      </div>

      {showRejectForm ? (
        <div className="mt-4 space-y-3">
          <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
            Rejection notes (optional)
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              placeholder="Reason for rejection"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={pending !== null}
              className="rounded-full bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {pending === "reject" ? "Rejecting..." : "Confirm reject"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRejectForm(false);
                setRejectNotes("");
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs font-semibold text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
