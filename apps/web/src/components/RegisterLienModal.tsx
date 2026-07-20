"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import {
  fetchShareholderOwnershipPositions,
  proposeLien,
  type ShareholderSearchHit,
} from "@/src/lib/api";
import { Modal } from "@/src/components/ui/Modal";
import { buttonClasses } from "@/src/components/ui/Button";
import { ShareholderPicker } from "@/src/components/ShareholderPicker";

type Position = {
  share_ownership_id: string;
  share_class_id: string;
  share_class_name: string;
  quantity: string;
  pledged_quantity: string;
  encumbered_quantity: string;
  available_quantity: string;
};

const LIEN_TYPES = [
  { value: "pledge", label: "Pledge" },
  { value: "encumbrance", label: "Other Encumbrance" },
];

export function RegisterLienModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [shareholder, setShareholder] = useState<ShareholderSearchHit | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [shareOwnershipId, setShareOwnershipId] = useState("");
  const [lienType, setLienType] = useState(LIEN_TYPES[0].value);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [authorityReference, setAuthorityReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!shareholder) {
      setPositions([]);
      setShareOwnershipId("");
      return;
    }
    setPositionsLoading(true);
    (async () => {
      try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        const res = await fetchShareholderOwnershipPositions(
          shareholder.shareholder_id,
          session.session?.access_token
        );
        setPositions(res.data);
        setShareOwnershipId(res.data[0]?.share_ownership_id ?? "");
      } catch {
        setPositions([]);
      } finally {
        setPositionsLoading(false);
      }
    })();
  }, [shareholder]);

  const selectedPosition = positions.find((p) => p.share_ownership_id === shareOwnershipId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!shareOwnershipId) { setErr("Select a share position"); return; }
    if (!reason.trim()) { setErr("Reason is required"); return; }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) { setErr("Quantity must be a positive number"); return; }
    setLoading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      await proposeLien(
        {
          shareOwnershipId,
          lienType,
          quantity: qty,
          reason: reason.trim(),
          authorityReference: authorityReference.trim() || undefined,
        },
        token
      );
      onClose();
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to register lien");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Register Lien / Pledge" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Shareholder</label>
          <ShareholderPicker value={shareholder} onChange={setShareholder} />
        </div>

        {shareholder && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Share position</label>
            {positionsLoading ? (
              <p className="text-sm text-slate-400">Loading positions…</p>
            ) : positions.length === 0 ? (
              <p className="text-sm text-rose-600">This shareholder has no active share positions.</p>
            ) : (
              <select
                value={shareOwnershipId}
                onChange={(e) => setShareOwnershipId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {positions.map((p) => (
                  <option key={p.share_ownership_id} value={p.share_ownership_id}>
                    {p.share_class_name} — {p.available_quantity} available of {p.quantity}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
          <select
            value={lienType}
            onChange={(e) => setLienType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {LIEN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Quantity</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={selectedPosition ? `Up to ${selectedPosition.available_quantity}` : "0"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Authority reference</label>
          <input
            type="text"
            value={authorityReference}
            onChange={(e) => setAuthorityReference(e.target.value)}
            placeholder="Lender name, court ref., etc. (optional)"
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
          This creates a pending request. A Governance Admin other than yourself must approve it before the shares are marked encumbered.
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
