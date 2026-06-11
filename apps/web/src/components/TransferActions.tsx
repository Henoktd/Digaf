"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelTransfer } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

const cancellationReason = "Cancelled by maker";

type TransferActionsProps = {
  transferId: string;
  status: string;
};

export function TransferActions({ transferId, status }: TransferActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCancel =
    status === "pending_checker_1" || status === "pending_checker_2";

  if (!canCancel) {
    return (
      <span className="inline-flex whitespace-nowrap text-xs text-slate-500">
        No action available
      </span>
    );
  }

  async function getAccessToken(): Promise<string> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Not authenticated");
    return data.session.access_token;
  }

  async function handleCancel() {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getAccessToken();
      await cancelTransfer(transferId, cancellationReason, token);
      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel transfer"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full min-w-32 max-w-36 space-y-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isSubmitting}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
      >
        {isSubmitting ? "Cancelling..." : "Cancel"}
      </button>

      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
