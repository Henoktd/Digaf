import Link from "next/link";
import { BrandLogo } from "@/src/components/BrandLogo";
import { SessionWatcher } from "@/src/components/SessionWatcher";
import { SideNavLinks, MobileNavLinks } from "@/src/components/NavLinks";
import { getSession } from "@/src/lib/dal";
import { logout } from "@/app/auth/actions";

const ORG_NAME = "Digaf Microcredit Provider SC";
const ORG_TAGLINE = "Shareholder Registry & Compliance";

type NavItem =
  | { type: "link"; href: string; label: string; indent?: boolean }
  | { type: "section"; label: string };

function buildNavItems(role: string | undefined): NavItem[] {
  const isAdmin = role === "governance_admin";
  return [
    { type: "link", href: "/", label: "Dashboard" },

    { type: "section", label: "Shareholders" },
    { type: "link", href: "/shareholders", label: "Registry" },
    { type: "link", href: "/imports", label: "Import Prep", indent: true },
    { type: "link", href: "/kyc", label: "KYC Compliance", indent: true },
    { type: "link", href: "/cap-table", label: "Cap Table" },

    { type: "section", label: "Governance" },
    { type: "link", href: "/share-classes", label: "Share Classes" },
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
    { type: "link", href: "/sla-config", label: "SLA Config" },
    { type: "link", href: "/qr", label: "QR Verify" },
    ...(isAdmin
      ? [{ type: "link" as const, href: "/users", label: "User Management" }]
      : []),

    { type: "section", label: "Account" },
    { type: "link", href: "/settings", label: "Settings" },
  ];
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    return <>{children}</>;
  }

  const userEmail = session.user.email ?? "Unknown";
  const assignedRole = session.user.app_metadata?.role as string | undefined;
  const userRole = assignedRole ?? "No role assigned";
  const hasRole = Boolean(assignedRole);
  const navItems = buildNavItems(assignedRole);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white lg:flex">
        {/* Brand */}
        <div className="flex-shrink-0 px-5 pt-6 pb-4">
          <Link href="/" className="inline-flex max-w-full">
            <BrandLogo
              imageClassName="h-12 w-auto max-w-full"
              fallbackClassName="block max-w-full break-words text-base font-bold leading-tight text-slate-900"
            />
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Internal Governance Portal
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <SideNavLinks items={navItems} />
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 border-t border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-700">{userEmail}</p>
              <p className={`text-[11px] capitalize ${hasRole ? "text-slate-500" : "font-semibold text-rose-500"}`}>
                {userRole.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/settings"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            >
              Settings
            </Link>
            <form action={logout} className="flex-1">
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="min-w-0 lg:pl-64">
        {/* Top bar — mobile + desktop context header */}
        <header className="sticky top-0 z-10 max-w-full border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link href="/" className="shrink-0 lg:hidden">
                <BrandLogo
                  imageClassName="h-9 w-auto max-w-[8rem]"
                  fallbackClassName="block max-w-[10rem] break-words text-sm font-bold leading-tight text-slate-900"
                />
              </Link>
              <div className="hidden min-w-0 lg:block">
                <p className="text-sm font-semibold text-slate-700">{ORG_NAME}</p>
                <p className="text-xs text-slate-500">{ORG_TAGLINE}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-[14rem] truncate text-xs font-medium text-slate-700">
                  {userEmail}
                </p>
                <p className={`text-[11px] capitalize ${hasRole ? "text-slate-500" : "font-semibold text-rose-500"}`}>
                  {userRole.replace(/_/g, " ")}
                </p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          {/* Mobile nav pills */}
          <nav className="-mx-4 mt-3 flex max-w-[100vw] gap-1.5 overflow-x-auto px-4 pb-1 lg:hidden">
            <MobileNavLinks items={navItems} />
          </nav>
        </header>

        {children}
      </div>
      <SessionWatcher />
    </div>
  );
}
