"use client";

type Column = { key: string; label: string };

export function ExportCsvButton({
  data,
  columns,
  filename,
  className,
}: {
  data: Record<string, unknown>[];
  columns: Column[];
  filename: string;
  className?: string;
}) {
  function handleExport() {
    const header = columns.map((c) => `"${c.label}"`).join(",");
    const rows = data.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key] ?? "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csv = "﻿" + [header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:py-2 sm:text-sm"
      }
    >
      Export CSV
    </button>
  );
}
