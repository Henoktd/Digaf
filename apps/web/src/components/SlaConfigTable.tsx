"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useToast } from "@/src/components/Toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type SlaConfig = {
  id: string;
  process_type: string;
  target_days: number;
  escalation_day1: number | null;
  escalation_day2: number | null;
  escalation_recipient_role: string | null;
  uptime_target: number | null;
};

function EditRow({
  config,
  onDone,
}: {
  config: SlaConfig;
  onDone: () => void;
}) {
  const [targetDays, setTargetDays] = useState(String(config.target_days));
  const [escalationDay1, setEscalationDay1] = useState(
    config.escalation_day1 != null ? String(config.escalation_day1) : ""
  );
  const [escalationDay2, setEscalationDay2] = useState(
    config.escalation_day2 != null ? String(config.escalation_day2) : ""
  );
  const [escalationRole, setEscalationRole] = useState(
    config.escalation_recipient_role ?? ""
  );
  const [uptimeTarget, setUptimeTarget] = useState(
    config.uptime_target != null ? String(config.uptime_target) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      const resp = await fetch(`${API_BASE_URL}/api/sla-config/${config.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetDays: parseInt(targetDays, 10),
          escalationDay1: escalationDay1 ? parseInt(escalationDay1, 10) : undefined,
          escalationDay2: escalationDay2 ? parseInt(escalationDay2, 10) : undefined,
          escalationRecipientRole: escalationRole.trim() || undefined,
          uptimeTarget: uptimeTarget ? parseFloat(uptimeTarget) : undefined,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to update SLA config");
      }
      onDone();
      toast("SLA config updated", "success");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <tr className="bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900" colSpan={7}>
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Editing: {config.process_type}
          </p>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Target Days *
              </label>
              <input
                type="number"
                min="1"
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Escalation Day 1
              </label>
              <input
                type="number"
                min="1"
                value={escalationDay1}
                onChange={(e) => setEscalationDay1(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Escalation Day 2
              </label>
              <input
                type="number"
                min="1"
                value={escalationDay2}
                onChange={(e) => setEscalationDay2(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Escalation Role
              </label>
              <input
                value={escalationRole}
                onChange={(e) => setEscalationRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Uptime Target %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={uptimeTarget}
                onChange={(e) => setUptimeTarget(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function SlaConfigTable({ configs }: { configs: SlaConfig[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {configs.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-slate-500">
          No SLA configuration found.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Process Type</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Target Days</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Escalation Day 1</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Escalation Day 2</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Escalation Role</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Uptime %</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {configs.map((cfg) =>
              editingId === cfg.id ? (
                <EditRow
                  key={cfg.id}
                  config={cfg}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <tr key={cfg.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {cfg.process_type}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {cfg.target_days}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {cfg.escalation_day1 ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {cfg.escalation_day2 ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {cfg.escalation_recipient_role ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {cfg.uptime_target != null ? `${cfg.uptime_target}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(cfg.id)}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
