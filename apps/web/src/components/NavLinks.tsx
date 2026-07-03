"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem =
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
            className="px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-widest text-slate-500 first:pt-0"
          >
            {item.label}
          </p>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg py-2 text-sm font-medium transition-colors ${
              item.indent ? "pl-7 pr-3" : "px-3"
            } ${
              isActive(item.href, pathname)
                ? "bg-indigo-50 font-semibold text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {item.indent ? `↳ ${item.label}` : item.label}
          </Link>
        )
      )}
    </>
  );
}
