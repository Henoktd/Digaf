type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-slate-200 text-slate-700 ring-slate-200",
  success: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-100 text-amber-800 ring-amber-200",
  danger: "bg-rose-100 text-rose-800 ring-rose-200",
  info: "bg-sky-100 text-sky-800 ring-sky-200",
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
      className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${toneClasses[resolvedTone]} ${className}`}
    >
      <span className="truncate">
        {prefix ? `${prefix}: ` : ""}
        {displayLabel}
      </span>
    </span>
  );
}
