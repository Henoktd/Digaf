import Link from "next/link";
import { BrandLogo } from "@/src/components/BrandLogo";
import { SessionWatcher } from "@/src/components/SessionWatcher";
import { getSession } from "@/src/lib/dal";
import { logout } from "@/app/auth/actions";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/shareholders", label: "Shareholders" },
  { href: "/imports", label: "Import Prep" },
  { href: "/cap-table", label: "Cap Table" },
  { href: "/certificates", label: "Certificates" },
  { href: "/transfers", label: "Transfers" },
  { href: "/approvals", label: "Approvals" },
  { href: "/legal-holds", label: "Legal Holds" },
  { href: "/communications", label: "Communications" },
  { href: "/documents", label: "Documents" },
  { href: "/sla-monitor", label: "SLA Monitor" },
  { href: "/audit-log", label: "Audit Log" },
  { href: "/share-classes", label: "Share Classes" },
  { href: "/board-resolutions", label: "Board Resolutions" },
  { href: "/sla-config", label: "SLA Config" },
  { href: "/qr", label: "QR Verify" },
  { href: "/integrations", label: "Integrations" },
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

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                {item.label}
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
