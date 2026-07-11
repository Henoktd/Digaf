"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { searchShareholders, type ShareholderSearchHit } from "@/src/lib/api";
import type { NavItem } from "@/src/components/NavLinks";

type PageHit = { href: string; label: string; section: string };

export function CommandPalette({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [shareholders, setShareholders] = useState<ShareholderSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flatten nav links with their section for page results
  const pages: PageHit[] = [];
  let section = "General";
  for (const item of items) {
    if (item.type === "section") section = item.label;
    else pages.push({ href: item.href, label: item.label, section });
  }

  const pageHits = query.trim()
    ? pages.filter((p) =>
        p.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : [];

  const results: { kind: "page" | "shareholder"; key: string }[] = [
    ...pageHits.map((p) => ({ kind: "page" as const, key: p.href })),
    ...shareholders.map((s) => ({ kind: "shareholder" as const, key: s.shareholder_id })),
  ];

  // Ctrl+K / Cmd+K opens; Escape closes
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setShareholders([]);
      setHighlighted(0);
      // focus after the dialog paints
      setTimeout(() => inputRef.current?.focus(), 10);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Debounced shareholder search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setShareholders([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const res = await searchShareholders(q, token);
        setShareholders(res.data);
      } catch {
        setShareholders([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && results[highlighted]) {
      const r = results[highlighted];
      if (r.kind === "page") go(r.key);
      else go(`/shareholders/${r.key}`);
    }
  }

  return (
    <>
      {/* Top bar trigger — mockup-style search box */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-500 md:flex md:w-56"
        aria-label="Search registry"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
        <span className="flex-1 text-left">Search registry…</span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
          Ctrl K
        </kbd>
      </button>
      {/* Mobile trigger — icon only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
        aria-label="Search registry"
      >
        <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-4">
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-slate-400" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search shareholders by name, ID, phone — or jump to a page…"
                className="w-full bg-transparent py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {pageHits.length > 0 && (
                <>
                  <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Pages
                  </p>
                  {pageHits.map((p, i) => (
                    <button
                      key={p.href}
                      type="button"
                      onClick={() => go(p.href)}
                      onMouseEnter={() => setHighlighted(i)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] ${
                        highlighted === i ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                      }`}
                    >
                      <span className="font-medium">{p.label}</span>
                      <span className="text-[11px] text-slate-400">{p.section}</span>
                    </button>
                  ))}
                </>
              )}

              {(shareholders.length > 0 || searching) && (
                <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  Shareholders{searching ? " — searching…" : ""}
                </p>
              )}
              {shareholders.map((s, idx) => {
                const i = pageHits.length + idx;
                return (
                  <button
                    key={s.shareholder_id}
                    type="button"
                    onClick={() => go(`/shareholders/${s.shareholder_id}`)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ${
                      highlighted === i ? "bg-indigo-50" : ""
                    }`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                      {s.legal_name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w.charAt(0))
                        .join("")
                        .toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] font-medium ${highlighted === i ? "text-indigo-700" : "text-slate-900"}`}>
                        {s.legal_name}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-slate-400">
                        {[s.primary_id_number, s.mobile_number].filter(Boolean).join(" · ") || s.shareholder_code || "—"}
                      </span>
                    </span>
                  </button>
                );
              })}

              {query.trim().length >= 2 && !searching && results.length === 0 && (
                <p className="px-2.5 py-6 text-center text-[13px] text-slate-400">
                  No results for “{query.trim()}”
                </p>
              )}
              {query.trim().length < 2 && (
                <p className="px-2.5 py-6 text-center text-[13px] text-slate-400">
                  Type at least 2 characters to search the registry
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
