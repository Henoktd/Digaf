type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  info: "bg-sky-50 text-sky-700",
};

const dotClasses: Record<StatusTone, string> = {
  neutral: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  danger: "bg-rose-500",
  info: "bg-sky-500",
};

const statusToneMap: Record<string, StatusTone> = {
  active: "success",
  approved: "success",
  completed: "success",
  configured: "success",
  issued: "success",
  on_track: "success",
  passed: "success",
  present: "success",
  sent: "success",
  valid: "success",
  verified: "success",
  due_soon: "warning",
  pending: "warning",
  warning: "warning",
  expired: "danger",
  failed: "danger",
  overdue: "danger",
  rejected: "danger",
  revoked: "danger",
  tampered: "danger",
  cancelled: "neutral",
  draft: "neutral",
  lifted: "neutral",
  missing: "neutral",
  not_configured: "neutral",
};

type StatusBadgeProps = {
  status: string | null | undefined;
  label?: string;
  prefix?: string;
  tone?: StatusTone;
  className?: string;
};

export function formatStatusLabel(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

export function StatusBadge({
  status,
  label,
  prefix,
  tone,
  className = "",
}: StatusBadgeProps) {
  const normalized = status?.trim().toLowerCase() || "not_set";
  const resolvedTone = tone ?? statusToneMap[normalized] ?? "neutral";
  const displayLabel = label ?? formatStatusLabel(status);

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-[3px] text-xs font-medium capitalize ${toneClasses[resolvedTone]} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[resolvedTone]}`}
        aria-hidden="true"
      />
      <span className="truncate">
        {prefix ? `${prefix}: ` : ""}
        {displayLabel}
      </span>
    </span>
  );
}
