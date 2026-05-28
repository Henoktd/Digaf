type KpiTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<KpiTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
};

const labelClasses: Record<KpiTone, string> = {
  neutral: "text-slate-500",
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-rose-700",
};

const detailClasses: Record<KpiTone, string> = {
  neutral: "text-slate-600",
  success: "text-emerald-800",
  warning: "text-amber-800",
  danger: "text-rose-800",
};

type KpiCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: KpiTone;
};

export function KpiCard({
  label,
  value,
  detail,
  tone = "neutral",
}: KpiCardProps) {
  return (
    <article className={`min-w-0 rounded-xl border p-4 sm:p-5 ${toneClasses[tone]}`}>
      <p className={`text-sm font-semibold ${labelClasses[tone]}`}>{label}</p>
      <p className="mt-3 break-words text-2xl font-bold sm:text-3xl">{value}</p>
      {detail ? (
        <p className={`mt-1 break-words text-sm ${detailClasses[tone]}`}>
          {detail}
        </p>
      ) : null}
    </article>
  );
}
