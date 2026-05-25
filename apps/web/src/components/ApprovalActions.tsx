"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { approveChecker1 } from "@/src/lib/api";

const checker1ActorId = "henok.local_dev";
const checker1DecisionNotes = "Checker 1 approved in local prototype";

type ApprovalActionsProps = {
  approvalId: string;
};

export function ApprovalActions({ approvalId }: ApprovalActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApproveChecker1() {
    setIsSubmitting(true);
    setError(null);

    try {
      await approveChecker1(
        approvalId,
        checker1ActorId,
        checker1DecisionNotes
      );
      router.refresh();
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : "Failed to approve Checker 1"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleApproveChecker1}
        disabled={isSubmitting}
        className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Approving..." : "Approve Checker 1"}
      </button>

      {error ? <p className="max-w-48 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
