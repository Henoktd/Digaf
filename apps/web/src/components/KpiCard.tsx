type KpiTone = "neutral" | "success" | "warning" | "danger";

const accentClasses: Record<KpiTone, string> = {
  neutral: "bg-slate-300",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-rose-500",
};

const labelClasses: Record<KpiTone, string> = {
  neutral: "text-slate-400",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger:  "text-rose-600",
};

const valueClasses: Record<KpiTone, string> = {
  neutral: "text-slate-900",
  success: "text-emerald-900",
  warning: "text-amber-900",
  danger:  "text-rose-900",
};

const detailClasses: Record<KpiTone, string> = {
  neutral: "text-slate-500",
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger:  "text-rose-700",
};

type KpiCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: KpiTone;
};

export function KpiCard({ label, value, detail, tone = "neutral" }: KpiCardProps) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`absolute inset-y-0 left-0 w-1 ${accentClasses[tone]}`} />
      <p className={`text-xs font-semibold uppercase tracking-wide ${labelClasses[tone]}`}>
        {label}
      </p>
      <p className={`mt-2 break-words text-3xl font-bold leading-none ${valueClasses[tone]}`}>
        {value}
      </p>
      {detail ? (
        <p className={`mt-1.5 break-words text-sm ${detailClasses[tone]}`}>{detail}</p>
      ) : null}
    </article>
  );
}
