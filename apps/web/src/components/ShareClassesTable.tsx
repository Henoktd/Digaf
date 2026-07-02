"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useToast } from "@/src/components/Toast";
import { StatusBadge } from "@/src/components/StatusBadge";
import { formatDate } from "@/src/lib/dateUtils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type ShareClass = {
  share_class_id: string;
  class_name: string;
  par_value: number;
  voting_rights: boolean;
  votes_per_share: number;
  voting_class_tier: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

async function getToken(): Promise<string | undefined> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export function ShareClassesTable({ shareClasses }: { shareClasses: ShareClass[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Partial<ShareClass>>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function startEdit(sc: ShareClass) {
    setEditingId(sc.share_class_id);
    setEditState({
      class_name: sc.class_name,
      par_value: sc.par_value,
      voting_rights: sc.voting_rights,
      votes_per_share: sc.votes_per_share,
      voting_class_tier: sc.voting_class_tier ?? "",
      status: sc.status,
      notes: sc.notes ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState({});
  }

  async function saveEdit(shareClassId: string) {
    setSaving(true);
    try {
      const token = await getToken();
      const resp = await fetch(`${API_BASE_URL}/api/share-classes/${shareClassId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          className: editState.class_name,
          parValue: editState.par_value,
          votingRights: editState.voting_rights,
          votesPerShare: editState.votes_per_share,
          votingClassTier: editState.voting_class_tier || null,
          status: editState.status,
          notes: editState.notes || null,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error?.message || "Failed to update share class");
      }
      toast("Share class updated", "success");
      setEditingId(null);
      setEditState({});
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(sc: ShareClass) {
    if (!confirm(`Deactivate "${sc.class_name}"? It will no longer appear in dropdowns but existing ownership records are kept.`)) return;
    setSaving(true);
    try {
      const token = await getToken();
      const resp = await fetch(`${API_BASE_URL}/api/share-classes/${sc.share_class_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          className: sc.class_name,
          parValue: sc.par_value,
          votingRights: sc.voting_rights,
          votesPerShare: sc.votes_per_share,
          votingClassTier: sc.voting_class_tier || null,
          status: "inactive",
          notes: sc.notes || null,
        }),
      });
      if (!resp.ok) throw new Error("Failed to deactivate");
      toast("Share class deactivated", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

  if (shareClasses.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-sm text-slate-500">
        No share classes defined yet.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-b border-slate-100 bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Class Name</th>
          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Par Value</th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Voting</th>
          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Votes/Share</th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tier</th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {shareClasses.map((sc) =>
          editingId === sc.share_class_id ? (
            <tr key={sc.share_class_id} className="bg-indigo-50">
              <td className="px-4 py-2">
                <input
                  value={editState.class_name ?? ""}
                  onChange={(e) => setEditState((s) => ({ ...s, class_name: e.target.value }))}
                  className={inputClass}
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editState.par_value ?? ""}
                  onChange={(e) => setEditState((s) => ({ ...s, par_value: parseFloat(e.target.value) }))}
                  className={`${inputClass} text-right`}
                />
              </td>
              <td className="px-4 py-2">
                <select
                  value={editState.voting_rights ? "yes" : "no"}
                  onChange={(e) => setEditState((s) => ({ ...s, voting_rights: e.target.value === "yes" }))}
                  className={inputClass}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  min="0"
                  value={editState.votes_per_share ?? ""}
                  onChange={(e) => setEditState((s) => ({ ...s, votes_per_share: parseInt(e.target.value, 10) }))}
                  className={`${inputClass} text-right`}
                />
              </td>
              <td className="px-4 py-2">
                <input
                  value={editState.voting_class_tier ?? ""}
                  onChange={(e) => setEditState((s) => ({ ...s, voting_class_tier: e.target.value }))}
                  className={inputClass}
                  placeholder="—"
                />
              </td>
              <td className="px-4 py-2">
                <select
                  value={editState.status ?? "active"}
                  onChange={(e) => setEditState((s) => ({ ...s, status: e.target.value }))}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </td>
              <td className="px-4 py-2">
                <input
                  value={editState.notes ?? ""}
                  onChange={(e) => setEditState((s) => ({ ...s, notes: e.target.value }))}
                  className={inputClass}
                  placeholder="—"
                />
              </td>
              <td className="px-4 py-2 text-slate-500 text-xs">
                {formatDate(sc.created_at, { style: "date" })}
              </td>
              <td className="px-4 py-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(sc.share_class_id)}
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={sc.share_class_id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{sc.class_name}</td>
              <td className="px-4 py-3 text-right text-slate-600">{sc.par_value}</td>
              <td className="px-4 py-3 text-slate-600">{sc.voting_rights ? "Yes" : "No"}</td>
              <td className="px-4 py-3 text-right text-slate-600">{sc.votes_per_share ?? 1}</td>
              <td className="px-4 py-3 text-slate-500">{sc.voting_class_tier ?? "—"}</td>
              <td className="px-4 py-3"><StatusBadge status={sc.status} /></td>
              <td className="px-4 py-3 text-slate-500">{sc.notes ?? "—"}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(sc.created_at, { style: "date" })}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(sc)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  {sc.status === "active" && (
                    <button
                      type="button"
                      onClick={() => deactivate(sc)}
                      disabled={saving}
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
