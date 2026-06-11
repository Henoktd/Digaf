"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resolveShareholderImportMessage } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Not authenticated");
  return data.session.access_token;
}

type ImportMessageResolveFormProps = {
  messageId: string;
  severity: string;
};

export function ImportMessageResolveForm({
  messageId,
  severity,
}: ImportMessageResolveFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState(
    severity === "warning" ? "accepted" : "resolved"
  );
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve() {
    setIsPending(true);
    setError(null);
    try {
      const token = await getAccessToken();
      await resolveShareholderImportMessage(
        messageId,
        {
          resolutionStatus,
          resolutionNotes: resolutionNotes.trim() || undefined,
        },
        token
      );
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve message");
    } finally {
      setIsPending(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
      >
        Resolve
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <select
        value={resolutionStatus}
        onChange={(e) => setResolutionStatus(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900"
      >
        <option value="accepted">Accepted</option>
        <option value="resolved">Resolved</option>
        <option value="waived">Waived</option>
        <option value="rejected">Rejected</option>
      </select>
      <textarea
        value={resolutionNotes}
        onChange={(e) => setResolutionNotes(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900"
        placeholder="Notes (optional)"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleResolve}
          disabled={isPending}
          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:bg-slate-300"
        >
          {isPending ? "Saving..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
      {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
