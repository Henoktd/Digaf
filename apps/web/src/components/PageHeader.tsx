import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  brand?: ReactNode;
  badge?: ReactNode;
  notice?: string;
  variant?: "light" | "dark" | "page";
};

export function PageHeader({
  title,
  description,
  eyebrow,
  brand,
  badge,
  notice,
  variant = "light",
}: PageHeaderProps) {
  // Inline page heading — no card, no shadow. Used on all inner pages.
  if (variant === "page") {
    return (
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-500">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="break-words text-2xl font-bold text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl break-words text-sm text-slate-500">
            {description}
          </p>
          {notice ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
              {notice}
            </p>
          ) : null}
        </div>
        {badge ? (
          <div className="max-w-full shrink-0">{badge}</div>
        ) : null}
      </div>
    );
  }

  const isDark = variant === "dark";

  return (
    <section
      className={`rounded-2xl p-5 shadow-sm sm:p-7 ${
        isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {brand ? <div className="mb-5 max-w-full">{brand}</div> : null}

          {eyebrow ? (
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${
                isDark ? "text-indigo-300" : "text-indigo-500"
              }`}
            >
              {eyebrow}
            </p>
          ) : null}

          <h1
            className={`${eyebrow ? "mt-3" : ""} break-words text-2xl font-bold leading-tight sm:text-3xl`}
          >
            {title}
          </h1>

          <p
            className={`mt-2 max-w-3xl break-words text-sm sm:text-base ${
              isDark ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {description}
          </p>

          {notice ? (
            <p
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                isDark
                  ? "bg-white/10 text-slate-100"
                  : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
              }`}
            >
              {notice}
            </p>
          ) : null}
        </div>

        {badge ? (
          <div className="max-w-full shrink-0 text-sm sm:w-auto">{badge}</div>
        ) : null}
      </div>
    </section>
  );
}
