"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SideNavLinks, type NavItem } from "@/src/components/NavLinks";

export function MobileNavDrawer({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close when the route changes (user tapped a link)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes; body scroll locks while open
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        {/* Hamburger icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0E1F19] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#17A673] to-[#0D6B4F] text-sm font-bold text-white">
                  D
                </span>
                <p className="text-sm font-semibold text-white">Digaf</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-1.5 text-[#9DB3A8] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17A673]"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <SideNavLinks items={items} />
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
