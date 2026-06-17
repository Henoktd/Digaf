"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useRole } from "@/src/lib/useRole";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";

const ROLE_LABELS: Record<string, string> = {
  governance_admin: "Governance Admin",
  maker: "Maker",
  checker_1: "Checker 1",
  checker_2: "Checker 2",
  compliance_officer: "Compliance Officer",
  viewer: "Viewer",
};

export default function SettingsPage() {
  const { role, isLoading } = useRole();

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) { showToast("Passwords do not match", false); return; }
    if (newPass.length < 8) { showToast("Password must be at least 8 characters", false); return; }

    setLoading(true);
    try {
      const supabase = createClient();

      // Re-authenticate with current password to verify identity before changing
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email) throw new Error("No active session");

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInError) throw new Error("Current password is incorrect");

      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;

      showToast("Password changed successfully.", true);
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to change password", false);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="Account Settings"
          description="Manage your own account credentials and view your assigned role."
        />

        {toast && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {toast.msg}
          </div>
        )}

        {/* Role info */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Your Role</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {role?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {role ? (ROLE_LABELS[role] ?? role.replace(/_/g, " ")) : "No role assigned"}
              </p>
              <p className="text-xs text-slate-400">Contact a Governance Admin to change your role.</p>
            </div>
          </div>
        </section>

        {/* Change password */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Change Password</h2>
          <p className="mb-5 text-xs text-slate-400">Your new password must be at least 8 characters.</p>

          <form onSubmit={handleChangePassword} className="max-w-sm space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Current password</label>
              <input
                type="password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}
