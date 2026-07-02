"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      // 1. Already logged in
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) { setReady(true); return; }

      // 2. PKCE code in query params — modern Supabase appends ?code=xxx
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.history.replaceState(null, "", window.location.pathname);
          setReady(true);
          return;
        }
      }

      // 3. Hash tokens — legacy/implicit flow appends #access_token=xxx&refresh_token=xxx
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) {
          window.history.replaceState(null, "", window.location.pathname);
          setReady(true);
          return;
        }
      }

      // 4. Nothing worked — link expired or already used
      router.replace("/login?error=link-expired");
    }

    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) { setError("Passwords do not match"); return; }
    if (newPass.length < 8) { setError("Password must be at least 8 characters"); return; }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.replace("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Verifying your link…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl bg-white px-8 py-10 shadow-sm text-center">
          <p className="text-2xl font-bold text-slate-900">Password updated</p>
          <p className="mt-2 text-sm text-slate-500">Redirecting you to the dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
          <p className="mt-2 text-sm text-slate-500">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
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
              placeholder="Repeat your password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
