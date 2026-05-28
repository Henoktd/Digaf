import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/shareholders", label: "Shareholders" },
  { href: "/cap-table", label: "Cap Table" },
  { href: "/certificates", label: "Certificates" },
  { href: "/transfers", label: "Transfers" },
  { href: "/approvals", label: "Approvals" },
  { href: "/legal-holds", label: "Legal Holds" },
  { href: "/communications", label: "Communications" },
  { href: "/documents", label: "Documents" },
  { href: "/sla-monitor", label: "SLA Monitor" },
  { href: "/audit-log", label: "Audit Log" },
  { href: "/qr", label: "QR Verify" },
  { href: "/integrations", label: "Integrations" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-y-auto border-r border-slate-200 bg-white p-6 lg:block">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Digaf Governance Portal
          </p>
          <h1 className="mt-2 text-xl font-bold leading-tight">
            Shareholder Governance Platform
          </h1>
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
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-10 max-w-full border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-700 lg:hidden">
                Digaf Governance Portal
              </p>
              <p className="text-sm font-semibold text-slate-500">
                Internal Governance Admin Portal
              </p>
              <p className="text-xs text-slate-400">
                Final v3 — No Dataverse
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Local RBAC prototype: maker, checker, compliance, admin
              </p>
            </div>

            <div className="shrink-0 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">
              MVP Prototype
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
    </div>
  );
}
