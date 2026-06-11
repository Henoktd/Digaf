"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { approveChecker1, approveChecker2, rejectApproval } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

const checker1DecisionNotes = "Checker 1 approved";
const checker2DecisionNotes = "Checker 2 approved and transfer completed";
const rejectionDecisionNotes = "Rejected";

type ApprovalActionsProps = {
  approvalId: string;
  stage: string;
  status: string;
};

const actionConfig = {
  checker_1: {
    decisionNotes: checker1DecisionNotes,
    defaultError: "Failed to approve Checker 1",
    idleLabel: "Approve Checker 1",
    pendingLabel: "Approving...",
    submit: approveChecker1,
  },
  checker_2: {
    decisionNotes: checker2DecisionNotes,
    defaultError: "Failed to approve Checker 2",
    idleLabel: "Approve Checker 2",
    pendingLabel: "Completing...",
    submit: approveChecker2,
  },
};

export function ApprovalActions({
  approvalId,
  stage,
  status,
}: ApprovalActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const actionType =
    status === "pending" && stage === "checker_1_review"
      ? "checker_1"
      : status === "pending" && stage === "checker_2_review"
        ? "checker_2"
        : null;
  const config = actionType ? actionConfig[actionType] : null;

  if (!config) {
    return (
      <span className="inline-flex whitespace-nowrap text-xs text-slate-500">
        No action available
      </span>
    );
  }

  const activeConfig = config;
  const isSubmitting = pendingAction !== null;

  async function getAccessToken(): Promise<string> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Not authenticated");
    return data.session.access_token;
  }

  async function handleApprove() {
    setPendingAction("approve");
    setError(null);

    try {
      const token = await getAccessToken();
      await activeConfig.submit(approvalId, activeConfig.decisionNotes, token);
      router.refresh();
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : activeConfig.defaultError
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReject() {
    setPendingAction("reject");
    setError(null);

    try {
      const token = await getAccessToken();
      await rejectApproval(approvalId, rejectionDecisionNotes, token);
      router.refresh();
    } catch (rejectionError) {
      setError(
        rejectionError instanceof Error
          ? rejectionError.message
          : "Failed to reject approval"
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="w-full min-w-44 max-w-52 space-y-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {pendingAction === "approve"
          ? activeConfig.pendingLabel
          : activeConfig.idleLabel}
      </button>

      <button
        type="button"
        onClick={handleReject}
        disabled={isSubmitting}
        className="w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
      >
        {pendingAction === "reject" ? "Rejecting..." : "Reject"}
      </button>

      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
