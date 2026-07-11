type KpiTone = "neutral" | "success" | "warning" | "danger";

const dotClasses: Record<KpiTone, string> = {
  neutral: "bg-slate-300",
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  danger: "bg-rose-500",
};

const detailClasses: Record<KpiTone, string> = {
  neutral: "text-slate-500",
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-rose-700",
};

type KpiCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: KpiTone;
};

export function KpiCard({ label, value, detail, tone = "neutral" }: KpiCardProps) {
  return (
    <article className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[tone]}`} aria-hidden="true" />
      </div>
      <p className="break-words text-2xl font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {detail ? (
        <p className={`break-words text-[11.5px] font-medium leading-snug ${detailClasses[tone]}`}>
          {detail}
        </p>
      ) : null}
    </article>
  );
}
