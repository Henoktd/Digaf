"use client";

import { useEffect } from "react";
import { buttonClasses } from "@/src/components/ui/Button";

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
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 p-8">
      <div className="max-w-md text-center">
        <span className="mb-3 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
          {isAuth ? "Session Error" : "Load Error"}
        </span>
        <h2 className="mb-2 text-base font-bold text-rose-900">{title}</h2>
        <p className="mb-5 text-sm text-rose-700">
          {isAuth
            ? "Your session may have expired. Please sign in again."
            : error.message || "An unexpected error occurred."}
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={reset} className={buttonClasses("danger", "sm")}>
            Try again
          </button>
          {isAuth && (
            <a href="/login" className={buttonClasses("secondary", "sm")}>
              Sign in
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
