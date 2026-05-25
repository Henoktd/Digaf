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
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-6 lg:block">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            SVH Governance
          </p>
          <h1 className="mt-2 text-xl font-bold leading-tight">
            Shareholder Platform
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

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Internal Governance Admin Portal
              </p>
              <p className="text-xs text-slate-400">
                Final v3 — No Dataverse
              </p>
            </div>

            <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              MVP Prototype
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
