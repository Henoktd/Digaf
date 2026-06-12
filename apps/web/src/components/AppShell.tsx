import Link from "next/link";
import { BrandLogo } from "@/src/components/BrandLogo";
import { SessionWatcher } from "@/src/components/SessionWatcher";
import { getSession } from "@/src/lib/dal";
import { logout } from "@/app/auth/actions";

type NavItem =
  | { type: "link"; href: string; label: string; indent?: boolean }
  | { type: "section"; label: string };

const navItems: NavItem[] = [
  { type: "link", href: "/", label: "Dashboard" },

  { type: "section", label: "Shareholders" },
  { type: "link", href: "/shareholders", label: "Registry" },
  { type: "link", href: "/imports", label: "Import Prep", indent: true },
  { type: "link", href: "/cap-table", label: "Cap Table" },

  { type: "section", label: "Governance" },
  { type: "link", href: "/certificates", label: "Certificates" },
  { type: "link", href: "/transfers", label: "Transfers" },
  { type: "link", href: "/dividends", label: "Dividend Register" },
  { type: "link", href: "/approvals", label: "Approvals" },
  { type: "link", href: "/legal-holds", label: "Legal Holds" },
  { type: "link", href: "/board-resolutions", label: "Board Resolutions" },

  { type: "section", label: "Operations" },
  { type: "link", href: "/reports", label: "Regulatory Reports" },
  { type: "link", href: "/communications", label: "Communications" },
  { type: "link", href: "/documents", label: "Documents" },
  { type: "link", href: "/sla-monitor", label: "SLA Monitor" },

  { type: "section", label: "System" },
  { type: "link", href: "/audit-log", label: "Audit Log" },
  { type: "link", href: "/share-classes", label: "Share Classes" },
  { type: "link", href: "/sla-config", label: "SLA Config" },
  { type: "link", href: "/qr", label: "QR Verify" },
  { type: "link", href: "/integrations", label: "Integrations" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    return <>{children}</>;
  }

  const userEmail = session.user.email ?? "Unknown";
  const userRole =
    (session.user.app_metadata?.role as string | undefined) ?? "viewer";

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-y-auto border-r border-slate-200 bg-white p-6 lg:block">
        <div className="min-w-0">
          <Link href="/" className="inline-flex max-w-full">
            <BrandLogo
              imageClassName="h-14 w-auto max-w-full"
              fallbackClassName="block max-w-full break-words text-lg font-bold leading-tight text-slate-900"
            />
          </Link>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Internal Governance Admin Portal
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Digaf Microcredit Provider SC
          </p>
        </div>

        <nav className="mt-8 space-y-0.5">
          {navItems.map((item, i) =>
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
                className={`block rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 ${item.indent ? "pl-8 pr-4" : "px-4"}`}
              >
                {item.indent ? `↳ ${item.label}` : item.label}
              </Link>
            )
          )}
        </nav>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          <p className="text-xs font-medium text-slate-400 mt-0.5 capitalize">
            {userRole.replace(/_/g, " ")}
          </p>
          <form action={logout} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 text-left transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-10 max-w-full border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link href="/" className="shrink-0">
                <BrandLogo
                  imageClassName="h-10 w-auto max-w-[9rem]"
                  fallbackClassName="block max-w-[12rem] break-words text-sm font-bold leading-tight text-slate-900 sm:max-w-xs"
                />
              </Link>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">
                  Internal Governance Admin Portal
                </p>
                <p className="text-xs text-slate-400">
                  Digaf Microcredit Provider SC
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-slate-700 truncate max-w-[14rem]">
                  {userEmail}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {userRole.replace(/_/g, " ")}
                </p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <nav className="-mx-4 mt-3 flex max-w-[100vw] gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
            {navItems.filter((item) => item.type === "link").map((item) => (
              <Link
                key={(item as { href: string }).href}
                href={(item as { href: string }).href}
                className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                {(item as { label: string }).label}
              </Link>
            ))}
          </nav>
        </header>

        {children}
      </div>
      <SessionWatcher />
    </div>
  );
}
