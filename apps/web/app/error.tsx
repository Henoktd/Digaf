"use client";

import { useEffect } from "react";

const ROLE_SQL = `UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"governance_admin"}'::jsonb
WHERE email = 'your-email@example.com';`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isRoleError = error.message?.includes("governance role");
  const isAuthError =
    error.message?.includes("Authorization") ||
    error.message?.includes("authentication token") ||
    error.message?.includes("expired");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 mb-4">
          {isRoleError ? "Permission Error" : isAuthError ? "Auth Error" : "Page Error"}
        </span>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {isRoleError
            ? "No governance role assigned"
            : isAuthError
            ? "Session expired"
            : "Something went wrong"}
        </h1>

        <p className="text-sm text-gray-600 mb-4">{error.message}</p>

        {isRoleError && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 mb-4">
            <p className="font-semibold mb-2">To fix — run this in Supabase SQL Editor:</p>
            <pre className="font-mono text-xs bg-white border border-amber-200 rounded p-2 whitespace-pre-wrap break-all">
              {ROLE_SQL}
            </pre>
            <p className="mt-2">Then log out and sign back in so the new role is included in your JWT.</p>
          </div>
        )}

        {isAuthError && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 mb-4">
            Your session may have expired. Log out and sign in again.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700"
          >
            Try again
          </button>
          <a
            href="/login"
            className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Go to login
          </a>
        </div>
      </div>
    </div>
  );
}
