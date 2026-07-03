type Segment = {
  label: string;
  value: number;
  colorClass: string; // full literal Tailwind class, e.g. "bg-emerald-500"
};

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

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
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      <div className="mt-4 flex h-2.5 gap-px overflow-hidden rounded-full bg-slate-100">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`h-full ${s.colorClass}`}
            style={{ width: `${pct(s.value, total)}%` }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${s.colorClass}`} />
            <span className="text-xs text-slate-500">{s.label}</span>
            <span className="ml-auto text-xs font-semibold text-slate-700">{s.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
