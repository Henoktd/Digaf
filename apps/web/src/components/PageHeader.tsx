import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  brand?: ReactNode;
  badge?: ReactNode;
  notice?: string;
  variant?: "light" | "dark";
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
  const isDark = variant === "dark";

  return (
    <section
      className={`rounded-2xl p-4 shadow-sm sm:p-6 ${
        isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {brand ? <div className="mb-5 max-w-full">{brand}</div> : null}

          {eyebrow ? (
            <p
              className={`text-sm font-semibold uppercase ${
                isDark ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {eyebrow}
            </p>
          ) : null}

          <h1
            className={`${
              eyebrow ? "mt-3" : ""
            } break-words text-2xl font-bold leading-tight sm:text-3xl`}
          >
            {title}
          </h1>

          <p
            className={`mt-2 max-w-3xl break-words text-sm sm:text-base ${
              isDark ? "text-slate-300" : "text-slate-600"
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
