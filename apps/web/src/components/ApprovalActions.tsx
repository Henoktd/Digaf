"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { approveChecker1, approveChecker2 } from "@/src/lib/api";

const checker1ActorId = "checker1.local_dev";
const checker1DecisionNotes = "Checker 1 approved in local prototype";
const checker2ActorId = "checker2.local_dev";
const checker2DecisionNotes =
  "Checker 2 approved and transfer completed in local prototype";

type ApprovalActionsProps = {
  approvalId: string;
  stage: string;
  status: string;
};

const actionConfig = {
  checker_1: {
    actorId: checker1ActorId,
    decisionNotes: checker1DecisionNotes,
    defaultError: "Failed to approve Checker 1",
    idleLabel: "Approve Checker 1",
    pendingLabel: "Approving...",
    submit: approveChecker1,
  },
  checker_2: {
    actorId: checker2ActorId,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actionType =
    status === "pending" && stage === "checker_1_review"
      ? "checker_1"
      : status === "pending" && stage === "checker_2_review"
        ? "checker_2"
        : null;
  const config = actionType ? actionConfig[actionType] : null;

  if (!config) {
    return <span className="text-xs text-slate-500">No action available</span>;
  }

  const activeConfig = config;

  async function handleApprove() {
    setIsSubmitting(true);
    setError(null);

    try {
      await activeConfig.submit(
        approvalId,
        activeConfig.actorId,
        activeConfig.decisionNotes
      );
      router.refresh();
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : activeConfig.defaultError
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-44 space-y-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? activeConfig.pendingLabel : activeConfig.idleLabel}
      </button>

      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
