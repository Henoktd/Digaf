"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { login } from "../auth/actions";

const initialState = { error: null as string | null };

function DiafLogo() {
  const [imgOk, setImgOk] = useState(true);
  if (imgOk) {
    return (
      <Image
        src="/logos/digaf-logo.svg"
        alt="Digaf"
        width={160}
        height={48}
        className="h-12 w-auto"
        onError={() => setImgOk(false)}
      />
    );
  }
  return <p className="text-xl font-bold text-slate-900">Digaf</p>;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  // Supabase redirects invite/reset links to the Site URL (/login) with hash tokens.
  // Detect this and forward to the set-password page with the hash intact.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const type = params.get("type");
    if (accessToken && (type === "invite" || type === "recovery")) {
      window.location.href = `/auth/update-password${window.location.hash}`;
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <DiafLogo />
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-indigo-600 py-2.5 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
