"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  fetchUsers,
  updateUserRole,
  sendUserPasswordReset,
  inviteUser,
  adminSetUserPassword,
  deleteUser,
} from "@/src/lib/api";
import { useRole } from "@/src/lib/useRole";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { EmptyState } from "@/src/components/EmptyState";

type User = {
  id: string;
  email: string | null;
  role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

const ROLES = [
  "governance_admin",
  "maker",
  "checker_1",
  "checker_2",
  "compliance_officer",
  "viewer",
] as const;

const ROLE_LABELS: Record<string, string> = {
  governance_admin: "Governance Admin",
  maker: "Maker",
  checker_1: "Checker 1",
  checker_2: "Checker 2",
  compliance_officer: "Compliance Officer",
  viewer: "Viewer",
};

const ROLE_COLOURS: Record<string, string> = {
  governance_admin: "bg-indigo-100 text-indigo-700",
  maker: "bg-blue-100 text-blue-700",
  checker_1: "bg-cyan-100 text-cyan-700",
  checker_2: "bg-teal-100 text-teal-700",
  compliance_officer: "bg-amber-100 text-amber-700",
  viewer: "bg-slate-100 text-slate-600",
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
        No role
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLOURS[role] ?? "bg-slate-100 text-slate-600"}`}>
      {ROLE_LABELS[role] ?? role.replace(/_/g, " ")}
    </span>
  );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Invite user modal ────────────────────────────────────────────────────────

function InviteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (user: User) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await inviteUser(email.trim(), role, token) as { data: { id: string; email: string | null; role: string } };
      onSuccess({ ...res.data, last_sign_in_at: null, created_at: new Date().toISOString() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to invite user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Invite New User" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@digaf.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <p className="text-xs text-slate-400">
          An invitation email will be sent. The user sets their own password via the link.
        </p>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Sending invite…" : "Send Invite"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Set password modal ───────────────────────────────────────────────────────

function SetPasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setErr("Passwords do not match"); return; }
    if (password.length < 8) { setErr("Password must be at least 8 characters"); return; }
    setLoading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      await adminSetUserPassword(user.id, password, token);
      onSuccess();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Set Password — ${user.email}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <p className="text-xs text-slate-400">
          Share the new password with the user securely. They can change it themselves in Settings.
        </p>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Setting password…" : "Set Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: (userId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      await deleteUser(user.id, token);
      onSuccess(user.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Remove User" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          Are you sure you want to permanently remove{" "}
          <span className="font-semibold">{user.email}</span>? This cannot be undone.
          All their session data in Supabase Auth will be deleted.
        </p>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Removing…" : "Remove User"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  currentUserId,
  saving,
  resetting,
  onRoleChange,
  onResetPassword,
  onSetPassword,
  onDelete,
}: {
  user: User;
  currentUserId: string | undefined;
  saving: boolean;
  resetting: string | null;
  onRoleChange: (userId: string, role: string) => void;
  onResetPassword: (userId: string, email: string) => void;
  onSetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  const isSelf = user.id === currentUserId;
  const isSendingReset = resetting === user.id;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-900">{user.email ?? "—"}</p>
          {isSelf && (
            <p className="text-xs text-indigo-500 font-medium">You</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <select
          defaultValue={user.role ?? ""}
          disabled={saving}
          onChange={(e) => onRoleChange(user.id, e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
        >
          <option value="" disabled>Assign role…</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(user.last_sign_in_at)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            disabled={!user.email || isSendingReset}
            onClick={() => user.email && onResetPassword(user.id, user.email)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSendingReset ? "Sending…" : "Send Reset"}
          </button>
          <button
            onClick={() => onSetPassword(user)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            Set Password
          </button>
          {!isSelf && (
            <button
              onClick={() => onDelete(user)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { role, isLoading: roleLoading } = useRole();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Modals
  const [showInvite, setShowInvite] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      setCurrentUserId(sessionData.session?.user?.id);
      const res = await fetchUsers(token);
      setUsers(
        [...res.data].sort((a: User, b: User) =>
          (a.email ?? "").localeCompare(b.email ?? "")
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!roleLoading && role === "governance_admin") {
      loadUsers();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [role, roleLoading, loadUsers]);

  async function handleRoleChange(userId: string, newRole: string) {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      await updateUserRole(userId, newRole, token);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      showToast("Role updated. Takes effect on next login.", true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update role", false);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(userId: string, email: string) {
    setResetting(userId);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      await sendUserPasswordReset(userId, email, token);
      showToast(`Password reset email sent to ${email}.`, true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send reset email", false);
    } finally {
      setResetting(null);
    }
  }

  if (roleLoading) {
    return (
      <PageContainer>
        <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
      </PageContainer>
    );
  }

  if (role !== "governance_admin") {
    return (
      <PageContainer>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          Access restricted. Only Governance Admins can manage users.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="User Management"
          description="Invite users, assign governance roles, and manage credentials. Role changes take effect on next login."
          badge={
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                {users.length} Users
              </div>
              <button
                onClick={() => setShowInvite(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                + Invite User
              </button>
            </div>
          }
        />

        {toast && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {toast.msg}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}{" "}
            <button onClick={loadUsers} className="ml-2 underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading users…</div>
          ) : users.length === 0 && !error ? (
            <EmptyState
              title="No users yet"
              description="Invite the first user using the button above."
            />
          ) : !error ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Current Role</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Change Role</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Last Sign In</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      currentUserId={currentUserId}
                      saving={saving}
                      resetting={resetting}
                      onRoleChange={handleRoleChange}
                      onResetPassword={handleResetPassword}
                      onSetPassword={setPasswordTarget}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <p className="mt-4 text-xs text-slate-400">
            Role changes update immediately in Supabase but only take effect for the user on their next login.
            Users can change their own password at any time in Settings.
          </p>
        </section>
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={(newUser) => {
            setUsers((prev) => [...prev, newUser].sort((a, b) => (a.email ?? "").localeCompare(b.email ?? "")));
            setShowInvite(false);
            showToast(`Invite sent to ${newUser.email}.`, true);
          }}
        />
      )}

      {passwordTarget && (
        <SetPasswordModal
          user={passwordTarget}
          onClose={() => setPasswordTarget(null)}
          onSuccess={() => {
            showToast(`Password updated for ${passwordTarget.email}.`, true);
            setPasswordTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={(userId) => {
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            showToast(`${deleteTarget.email} has been removed.`, true);
            setDeleteTarget(null);
          }}
        />
      )}
    </PageContainer>
  );
}
