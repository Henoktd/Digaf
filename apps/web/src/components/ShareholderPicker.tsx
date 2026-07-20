"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { searchShareholders, type ShareholderSearchHit } from "@/src/lib/api";

export function ShareholderPicker({
  value,
  onChange,
}: {
  value: ShareholderSearchHit | null;
  onChange: (hit: ShareholderSearchHit | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShareholderSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        const res = await searchShareholders(q, session.session?.access_token);
        setResults(res.data);
      } catch {
        setResults([]);
      }
    }, 250);
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
        <span className="font-medium text-slate-900">{value.legal_name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search by name, ID, or phone…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((r) => (
            <button
              key={r.shareholder_id}
              type="button"
              onMouseDown={() => {
                onChange(r);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{r.legal_name}</span>
              <span className="ml-2 text-xs text-slate-400">
                {r.primary_id_number ?? r.shareholder_code ?? ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
