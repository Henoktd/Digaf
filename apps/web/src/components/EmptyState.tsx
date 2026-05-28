type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 ${className}`}
    >
      <p className="font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1">{description}</p> : null}
    </div>
  );
}
