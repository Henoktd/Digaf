"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { proposeLegalHold, type ShareholderSearchHit } from "@/src/lib/api";
import { Modal } from "@/src/components/ui/Modal";
import { buttonClasses } from "@/src/components/ui/Button";
import { ShareholderPicker } from "@/src/components/ShareholderPicker";

const HOLD_TYPES = [
  { value: "court_order", label: "Court Order" },
  { value: "probate", label: "Probate Matter" },
  { value: "regulatory_freeze", label: "Regulatory Freeze" },
  { value: "dispute", label: "Ownership Dispute" },
  { value: "other", label: "Other Legal Restriction" },
];

export function ImposeLegalHoldModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [shareholder, setShareholder] = useState<ShareholderSearchHit | null>(null);
  const [holdType, setHoldType] = useState(HOLD_TYPES[0].value);
  const [reason, setReason] = useState("");
  const [authorityReference, setAuthorityReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!shareholder) { setErr("Select a shareholder"); return; }
    if (!reason.trim()) { setErr("Reason is required"); return; }
    setLoading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      await proposeLegalHold(
        {
          shareholderId: shareholder.shareholder_id,
          holdType,
          reason: reason.trim(),
          authorityReference: authorityReference.trim() || undefined,
        },
        token
      );
      onClose();
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to propose legal hold");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Impose Legal Hold" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Shareholder</label>
          <ShareholderPicker value={shareholder} onChange={setShareholder} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Hold type</label>
          <select
            value={holdType}
            onChange={(e) => setHoldType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {HOLD_TYPES.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Authority reference</label>
          <input
            type="text"
            value={authorityReference}
            onChange={(e) => setAuthorityReference(e.target.value)}
            placeholder="Court case no., regulator ref., etc. (optional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
        <p className="text-xs text-slate-400">
          This creates a pending request. A Governance Admin other than yourself must approve it before the hold takes effect.
        </p>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className={buttonClasses("secondary")}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={buttonClasses("primary")}>
            {loading ? "Submitting…" : "Submit for Approval"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
