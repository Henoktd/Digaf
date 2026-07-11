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

// Styled for the dark-green sidebar (#0E1F19). Used by the desktop
// sidebar and the mobile drawer, which share the same surface.
export function SideNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) =>
        item.type === "section" ? (
          <p
            key={i}
            className="px-2.5 pb-1.5 pt-5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#52685D] first:pt-1"
          >
            {item.label}
          </p>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg py-[7px] text-[13px] transition-colors ${
              item.indent ? "pl-7 pr-2.5" : "px-2.5"
            } ${
              isActive(item.href, pathname)
                ? "bg-[#17A673]/20 font-semibold text-white"
                : "font-medium text-[#9DB3A8] hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        )
      )}
    </div>
  );
}
