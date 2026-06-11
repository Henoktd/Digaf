"use client";

import { useEffect } from "react";

export function SectionError({
  error,
  reset,
  title = "Failed to load this section",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isAuth =
    error.message?.includes("Authorization") ||
    error.message?.includes("authentication token") ||
    error.message?.includes("expired") ||
    error.message?.includes("Unauthorized");

  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-red-100 bg-red-50 p-8">
      <div className="max-w-md text-center">
        <span className="mb-3 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          {isAuth ? "Session Error" : "Load Error"}
        </span>
        <h2 className="mb-2 text-base font-bold text-red-900">{title}</h2>
        <p className="mb-5 text-sm text-red-700">
          {isAuth
            ? "Your session may have expired. Please sign in again."
            : error.message || "An unexpected error occurred."}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
          >
            Try again
          </button>
          {isAuth && (
            <a
              href="/login"
              className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
