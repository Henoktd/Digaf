import Link from "next/link";
import { SessionWatcher } from "@/src/components/SessionWatcher";
import { SideNavLinks, type NavItem } from "@/src/components/NavLinks";
import { MobileNavDrawer } from "@/src/components/MobileNavDrawer";
import { CommandPalette } from "@/src/components/CommandPalette";
import { fetchPendingApprovalCount } from "@/src/lib/api";
import { getSession } from "@/src/lib/dal";
import { logout } from "@/app/auth/actions";

const ORG_NAME = "Digaf Microcredit Provider SC";
const ORG_TAGLINE = "Shareholder Registry & Compliance";

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
    { type: "link", href: "/liens", label: "Liens & Pledges" },
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

  let pendingApprovals = 0;
  let overdueApprovals = 0;
  try {
    const counts = await fetchPendingApprovalCount(session.access_token);
    pendingApprovals = counts.data.pending ?? 0;
    overdueApprovals = counts.data.overdue ?? 0;
  } catch {
    // Badge is best-effort; never block the shell on it
  }

  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      {/* Desktop sidebar — dark green */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto bg-[#0E1F19] lg:flex">
        {/* Brand */}
        <div className="flex-shrink-0 px-5 pb-4 pt-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#17A673] to-[#0D6B4F] text-[15px] font-bold text-white">
              D
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold tracking-tight text-[#F2F5F3]">
                Digaf
              </span>
              <span className="block text-[10.5px] uppercase tracking-[0.08em] text-[#5F7A6E]">
                Share Registry
              </span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <SideNavLinks items={navItems} />
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 border-t border-white/10 px-4 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1C3A2E] text-xs font-semibold text-[#7BC4A4]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-[#E5EBE8]">{userEmail}</p>
              <p className={`truncate text-[11px] capitalize ${hasRole ? "text-[#5F7A6E]" : "font-semibold text-rose-400"}`}>
                {userRole.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/settings"
              className="flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-center text-xs font-medium text-[#9DB3A8] transition-colors hover:bg-white/5 hover:text-white"
            >
              Settings
            </Link>
            <form action={logout} className="flex-1">
              <button
                type="submit"
                className="w-full rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-[#9DB3A8] transition-colors hover:bg-white/5 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="min-w-0 lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 max-w-full items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-7">
          <MobileNavDrawer items={navItems} />
          <Link href="/" className="flex shrink-0 items-center gap-2 lg:hidden">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#17A673] to-[#0D6B4F] text-[13px] font-bold text-white">
              D
            </span>
            <span className="text-sm font-semibold text-slate-900">Digaf</span>
          </Link>
          <div className="hidden min-w-0 items-center gap-2 text-[13px] text-slate-500 lg:flex">
            <span className="truncate">{ORG_NAME}</span>
            <span className="text-slate-300">/</span>
            <span className="truncate font-medium text-slate-900">{ORG_TAGLINE}</span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <CommandPalette items={navItems} />
            <Link
              href="/approvals"
              aria-label={`Approvals: ${pendingApprovals} pending${overdueApprovals ? `, ${overdueApprovals} overdue` : ""}`}
              className="relative grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M8 2a4 4 0 0 0-4 4c0 3-1.2 4-1.2 4h10.4S12 9 12 6a4 4 0 0 0-4-4z" />
                <path d="M6.8 13.5a1.3 1.3 0 0 0 2.4 0" />
              </svg>
              {pendingApprovals > 0 && (
                <span
                  className={`absolute -right-1.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-semibold text-white ${
                    overdueApprovals > 0 ? "bg-rose-500" : "bg-indigo-500"
                  }`}
                >
                  {pendingApprovals > 99 ? "99+" : pendingApprovals}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 sm:pl-4">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-[12.5px] font-semibold text-white">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="max-w-[14rem] truncate text-[13px] font-semibold leading-tight text-slate-900">
                  {userEmail}
                </p>
                <p className={`truncate text-[11.5px] capitalize leading-tight ${hasRole ? "text-slate-500" : "font-semibold text-rose-600"}`}>
                  {userRole.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {children}
      </div>
      <SessionWatcher />
    </div>
  );
}
