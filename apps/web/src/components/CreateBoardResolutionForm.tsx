"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useToast } from "@/src/components/Toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function CreateBoardResolutionForm() {
  const [open, setOpen] = useState(false);
  const [resolutionNumber, setResolutionNumber] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [description, setDescription] = useState("");
  const [approvedAction, setApprovedAction] = useState("");
  const [sharepointDocumentUrl, setSharepointDocumentUrl] = useState("");
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
      const resp = await fetch(`${API_BASE_URL}/api/board-resolutions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resolutionNumber,
          resolutionDate,
          description,
          approvedAction: approvedAction.trim() || undefined,
          sharepointDocumentUrl: sharepointDocumentUrl.trim() || undefined,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to create board resolution");
      }
      setOpen(false);
      setResolutionNumber("");
      setResolutionDate("");
      setDescription("");
      setApprovedAction("");
      setSharepointDocumentUrl("");
      toast("Board resolution recorded", "success");
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
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Record Resolution
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm space-y-4"
    >
      <h2 className="text-base font-bold text-slate-900">Record Board Resolution</h2>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Resolution Number *
          </label>
          <input
            required
            value={resolutionNumber}
            onChange={(e) => setResolutionNumber(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Resolution Date *
          </label>
          <input
            required
            type="date"
            value={resolutionDate}
            onChange={(e) => setResolutionDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Description *
        </label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Approved Action
          </label>
          <input
            value={approvedAction}
            onChange={(e) => setApprovedAction(e.target.value)}
            placeholder="e.g. Share transfer approved"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            SharePoint Document URL
          </label>
          <input
            type="url"
            value={sharepointDocumentUrl}
            onChange={(e) => setSharepointDocumentUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
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
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Record"}
        </button>
      </div>
    </form>
  );
}
