import Link from "next/link";

interface Props {
  page: number;
  total: number;
  limit: number;
  baseHref: string;
}

export function PaginationBar({ page, total, limit, baseHref }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  function pageHref(p: number) {
    const url = new URL(baseHref, "http://x");
    url.searchParams.set("page", String(p));
    return `${url.pathname}${url.search}`;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>
        {start}–{end} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        {prevPage ? (
          <Link
            href={pageHref(prevPage)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
            Previous
          </span>
        )}
        <span className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </span>
        {nextPage ? (
          <Link
            href={pageHref(nextPage)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
