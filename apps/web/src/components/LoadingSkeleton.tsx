export function SkeletonLine({
  width = "w-full",
  height = "h-4",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 ${height} ${width} ${className}`}
    />
  );
}

export function SkeletonCard({
  rows = 3,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm space-y-3 ${className}`}>
      <SkeletonLine width="w-1/3" height="h-6" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i % 2 === 0 ? "w-full" : "w-3/4"} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="space-y-3 pb-2">
        <SkeletonLine width="w-48" height="h-7" />
        <SkeletonLine width="w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <SkeletonLine width="w-24" height="h-3" />
            <SkeletonLine width="w-16" height="h-8" />
          </div>
        ))}
      </div>
      <SkeletonCard rows={5} />
      <SkeletonCard rows={4} />
    </div>
  );
}
