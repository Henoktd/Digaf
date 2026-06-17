"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { fetchUsers, updateUserRole } from "@/src/lib/api";
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

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
        No role
      </span>
    );
  }
  const colours: Record<string, string> = {
    governance_admin: "bg-indigo-100 text-indigo-700",
    maker: "bg-blue-100 text-blue-700",
    checker_1: "bg-cyan-100 text-cyan-700",
    checker_2: "bg-teal-100 text-teal-700",
    compliance_officer: "bg-amber-100 text-amber-700",
    viewer: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${colours[role] ?? "bg-slate-100 text-slate-600"}`}
    >
      {ROLE_LABELS[role] ?? role.replace(/_/g, " ")}
    </span>
  );
}

function UserRow({
  user,
  saving,
  onRoleChange,
}: {
  user: User;
  saving: boolean;
  onRoleChange: (userId: string, role: string) => void;
}) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">
        {user.email ?? "—"}
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
          <option value="" disabled>
            Assign role…
          </option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {formatDate(user.last_sign_in_at)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">
        {formatDate(user.created_at)}
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const { role, isLoading: roleLoading } = useRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
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
    setToast(null);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      await updateUserRole(userId, newRole, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setToast({ msg: "Role updated. User must log out and back in for it to take effect.", ok: true });
    } catch (err) {
      setToast({
        msg: err instanceof Error ? err.message : "Failed to update role",
        ok: false,
      });
    } finally {
      setSaving(false);
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
          description="Assign and change governance roles for all platform users. Role changes take effect on next login."
          badge={
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              {users.length} Users
            </div>
          }
        />

        {toast && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              toast.ok
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {toast.msg}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}{" "}
            <button
              onClick={loadUsers}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <EmptyState title="No users found" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Current Role
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Change Role
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Last Sign In
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      saving={saving}
                      onRoleChange={handleRoleChange}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">
            Role changes update immediately in Supabase but only take effect for the user on their next login session.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
