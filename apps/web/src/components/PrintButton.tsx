"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:py-2 sm:text-sm print:hidden"
    >
      Print / Save PDF
    </button>
  );
}
