"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { approveChecker1, approveChecker2 } from "@/src/lib/api";

const checker1ActorId = "henok.local_dev";
const checker1DecisionNotes = "Checker 1 approved in local prototype";
const checker2ActorId = "checker2.local_dev";
const checker2DecisionNotes =
  "Checker 2 approved and transfer completed in local prototype";

type ApprovalActionType = "checker_1" | "checker_2";

type ApprovalActionsProps = {
  actionType: ApprovalActionType;
  approvalId: string;
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
  actionType,
  approvalId,
}: ApprovalActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = actionConfig[actionType];

  async function handleApprove() {
    setIsSubmitting(true);
    setError(null);

    try {
      await config.submit(approvalId, config.actorId, config.decisionNotes);
      router.refresh();
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : config.defaultError
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={isSubmitting}
        className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? config.pendingLabel : config.idleLabel}
      </button>

      {error ? <p className="max-w-48 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
