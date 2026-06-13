"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem =
  | { type: "link"; href: string; label: string; indent?: boolean }
  | { type: "section"; label: string };

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SideNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item, i) =>
        item.type === "section" ? (
          <p
            key={i}
            className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 first:pt-0"
          >
            {item.label}
          </p>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-xl py-2.5 text-sm font-medium transition-colors ${
              item.indent ? "pl-8 pr-4" : "px-4"
            } ${
              isActive(item.href, pathname)
                ? "bg-slate-900 font-semibold text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {item.indent ? `↳ ${item.label}` : item.label}
          </Link>
        )
      )}
    </>
  );
}

export function MobileNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items
        .filter((item): item is Extract<NavItem, { type: "link" }> => item.type === "link")
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
              isActive(item.href, pathname)
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </Link>
        ))}
    </>
  );
}
