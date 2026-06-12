"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { createDividend } from "@/src/lib/api";
import { useToast } from "@/src/components/Toast";

type ShareClass = { share_class_id: string; class_name: string };

export function CreateDividendForm({ shareClasses }: { shareClasses: ShareClass[] }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    record_date: "",
    payment_date: "",
    amount_per_share: "",
    share_class_id: "",
    withholding_tax_rate: "10",
    board_resolution_ref: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.record_date || !form.amount_per_share) {
      setError("Record date and amount per share are required.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      await createDividend(
        {
          record_date: form.record_date,
          payment_date: form.payment_date || undefined,
          amount_per_share: Number(form.amount_per_share),
          share_class_id: form.share_class_id || undefined,
          withholding_tax_rate: Number(form.withholding_tax_rate) / 100,
          board_resolution_ref: form.board_resolution_ref || undefined,
          notes: form.notes || undefined,
        },
        token
      );
      toast("Dividend declared and entitlements computed", "success");
      router.refresh();
      setForm({
        record_date: "",
        payment_date: "",
        amount_per_share: "",
        share_class_id: "",
        withholding_tax_rate: "10",
        board_resolution_ref: "",
        notes: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create dividend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Record Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={form.record_date}
            onChange={(e) => set("record_date", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">Shareholders holding shares on this date receive the dividend.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Amount per Share (ETB) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0.000001"
            step="0.01"
            value={form.amount_per_share}
            onChange={(e) => set("amount_per_share", e.target.value)}
            placeholder="e.g. 5.00"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Withholding Tax Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.withholding_tax_rate}
            onChange={(e) => set("withholding_tax_rate", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">Ethiopian dividend WHT is typically 10%.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Share Class</label>
          <select
            value={form.share_class_id}
            onChange={(e) => set("share_class_id", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">All share classes</option>
            {shareClasses.map((sc) => (
              <option key={sc.share_class_id} value={sc.share_class_id}>
                {sc.class_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Payment Date</label>
          <input
            type="date"
            value={form.payment_date}
            onChange={(e) => set("payment_date", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Board Resolution Ref</label>
          <input
            type="text"
            value={form.board_resolution_ref}
            onChange={(e) => set("board_resolution_ref", e.target.value)}
            placeholder="e.g. BR-2026-004"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Optional notes about this dividend declaration"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Computing entitlements…" : "Declare Dividend"}
        </button>
      </div>
    </form>
  );
}
