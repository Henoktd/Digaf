type Segment = {
  label: string;
  value: number;
  colorClass: string; // full literal Tailwind class, e.g. "bg-emerald-500"
};

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

// A single health row: label + detail, thin segmented track, compact legend.
// Designed to stack inside a card section (see dashboard "Registry health").
export function StackedBar({
  title,
  subtitle,
  segments,
}: {
  title: string;
  subtitle: string;
  segments: Segment[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 tabular-nums">{subtitle}</p>
      </div>
      <div className="flex h-[7px] gap-px overflow-hidden rounded-full bg-slate-100">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`h-full ${s.colorClass}`}
            style={{ width: `${pct(s.value, total)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${s.colorClass}`} />
            {s.label}
            <span className="font-medium text-slate-700 tabular-nums">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
