"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useToast } from "@/src/components/Toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function CreateShareClassForm() {
  const [open, setOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [parValue, setParValue] = useState("");
  const [votingRights, setVotingRights] = useState(false);
  const [votesPerShare, setVotesPerShare] = useState("1");
  const [votingClassTier, setVotingClassTier] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      const resp = await fetch(`${API_BASE_URL}/api/share-classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          className,
          parValue: parseFloat(parValue),
          votingRights,
          votesPerShare: parseInt(votesPerShare || "1", 10),
          votingClassTier: votingClassTier.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to create share class");
      }
      setOpen(false);
      setClassName("");
      setParValue("");
      setVotingRights(false);
      setVotesPerShare("1");
      setVotingClassTier("");
      setNotes("");
      toast("Share class created", "success");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          + Create Share Class
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm space-y-4"
    >
      <h2 className="text-base font-bold text-slate-900">New Share Class</h2>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Class Name *
          </label>
          <input
            required
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Par Value *
          </label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={parValue}
            onChange={(e) => setParValue(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Votes Per Share
          </label>
          <input
            type="number"
            min="0"
            value={votesPerShare}
            onChange={(e) => setVotesPerShare(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Voting Class Tier
          </label>
          <input
            value={votingClassTier}
            onChange={(e) => setVotingClassTier(e.target.value)}
            placeholder="e.g. A, B, Preferred"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            id="votingRights"
            type="checkbox"
            checked={votingRights}
            onChange={(e) => setVotingRights(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="votingRights" className="text-sm text-slate-700">
            Has voting rights
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Create"}
        </button>
      </div>
    </form>
  );
}
