import Link from "next/link";
import {
  DashboardSummary,
  fetchDashboardSummary,
} from "@/src/lib/api";
import { getSession, getToken } from "@/src/lib/dal";
import { EmptyState } from "@/src/components/EmptyState";
import { KpiCard } from "@/src/components/KpiCard";
import { PageContainer } from "@/src/components/PageContainer";
import { RefreshButton } from "@/src/components/RefreshButton";
import { StackedBar } from "@/src/components/StackedBar";
import { StatusBadge } from "@/src/components/StatusBadge";
import { buttonClasses } from "@/src/components/ui/Button";

type DashboardSummaryResponse = {
  data: DashboardSummary;
  generated_at: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const ADDIS_TZ = "Africa/Addis_Ababa";

function greetingForNow(now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: ADDIS_TZ,
    }).format(now)
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function overviewDateLine(now: Date) {
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ADDIS_TZ,
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ADDIS_TZ,
  }).format(now);
  return `Registry overview as of ${date} · ${time} EAT`;
}

// Activity feed icon tint by audit action type
function actionTone(action: string | null): { bg: string; text: string; glyph: string } {
  const a = (action ?? "").toLowerCase();
  if (a.includes("insert") || a.includes("create") || a.includes("approve") || a.includes("issue")) {
    return { bg: "bg-emerald-50", text: "text-emerald-700", glyph: "+" };
  }
  if (a.includes("delete") || a.includes("revoke") || a.includes("reject")) {
    return { bg: "bg-rose-50", text: "text-rose-700", glyph: "−" };
  }
  if (a.includes("update") || a.includes("edit") || a.includes("change")) {
    return { bg: "bg-sky-50", text: "text-sky-700", glyph: "±" };
  }
  return { bg: "bg-slate-100", text: "text-slate-600", glyph: "·" };
}

function cardClass() {
  return "rounded-xl border border-slate-200 bg-white shadow-sm";
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[12.5px] text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export default async function Home() {
  const [token, session] = await Promise.all([getToken(), getSession()]);

  let summary: DashboardSummary;
  let loadFailed = false;
  try {
    const response: DashboardSummaryResponse = await fetchDashboardSummary(token);
    summary = response.data;
  } catch {
    loadFailed = true;
    summary = {
      entity_count: 0,
      shareholder_count: 0,
      active_shareholder_count: 0,
      total_shares: 0,
      certificate_count: 0,
      issued_certificate_count: 0,
      revoked_certificate_count: 0,
      transfer_count: 0,
      pending_transfer_count: 0,
      completed_transfer_count: 0,
      pending_approval_count: 0,
      approved_approval_count: 0,
      overdue_approval_count: 0,
      active_legal_hold_count: 0,
      active_transfer_freeze_count: 0,
      document_reference_count: 0,
      audit_log_count: 0,
      communication_count: 0,
      kyc_verified_count: 0,
      kyc_expired_count: 0,
      kyc_expiring_soon_count: 0,
      dividend_count: 0,
      total_dividends_declared: 0,
      top_ownership_rows: [],
      recent_audit_actions: [],
      sla_snapshot: [],
    };
  }

  const now = new Date();
  const email = session?.user.email ?? "";
  const firstName = email
    ? email.split("@")[0].split(/[._-]/)[0].replace(/^./, (c) => c.toUpperCase())
    : "";

  const kycTone =
    (summary.kyc_expired_count ?? 0) > 0
      ? ("danger" as const)
      : (summary.kyc_expiring_soon_count ?? 0) > 0
        ? ("warning" as const)
        : undefined;

  const kpis: {
    label: string;
    value: number;
    detail: string;
    tone?: "success" | "warning" | "danger";
  }[] = [
    {
      label: "Shareholders",
      value: summary.shareholder_count,
      detail: `${formatNumber(summary.active_shareholder_count)} active`,
    },
    {
      label: "KYC Verified",
      value: summary.kyc_verified_count ?? 0,
      detail: `${formatNumber(summary.kyc_expired_count ?? 0)} expired · ${formatNumber(summary.kyc_expiring_soon_count ?? 0)} expiring`,
      tone: kycTone,
    },
    {
      label: "Certificates",
      value: summary.certificate_count,
      detail: `${formatNumber(summary.issued_certificate_count)} issued · ${formatNumber(
        summary.revoked_certificate_count
      )} revoked`,
    },
    {
      label: "Dividends",
      value: summary.dividend_count ?? 0,
      detail: `ETB ${formatNumber(summary.total_dividends_declared ?? 0)} declared`,
    },
    {
      label: "Pending Approvals",
      value: summary.pending_approval_count,
      detail: `${formatNumber(summary.overdue_approval_count)} overdue`,
      tone: (summary.overdue_approval_count ?? 0) > 0 ? "danger" : undefined,
    },
    {
      label: "Legal Holds",
      value: summary.active_legal_hold_count,
      detail: `${formatNumber(summary.active_transfer_freeze_count)} active freezes`,
    },
  ];

  const workflowStats: { label: string; value: number; tone?: "success" | "danger" }[] = [
    { label: "Transfers pending", value: summary.pending_transfer_count },
    { label: "Transfers completed", value: summary.completed_transfer_count, tone: "success" },
    { label: "Approvals pending", value: summary.pending_approval_count },
    { label: "Approvals approved", value: summary.approved_approval_count, tone: "success" },
    {
      label: "Overdue approvals",
      value: summary.overdue_approval_count,
      tone: summary.overdue_approval_count > 0 ? "danger" : undefined,
    },
  ];

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Greeting header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[21px] font-semibold tracking-tight text-slate-900">
              {firstName ? `${greetingForNow(now)}, ${firstName}` : greetingForNow(now)}
            </h1>
            <p className="mt-1 text-[13.5px] text-slate-500">{overviewDateLine(now)}</p>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <Link href="/reports" className={buttonClasses("secondary")}>
              Reports
            </Link>
            <Link href="/shareholders" className={buttonClasses("primary")}>
              View registry
            </Link>
          </div>
        </div>

        {loadFailed && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <p className="text-sm font-medium text-rose-800">
              Dashboard data could not be loaded — the values below are empty, not real figures.
            </p>
            <RefreshButton label="Retry" />
          </div>
        )}

        {/* KPI row */}
        <section className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={formatNumber(kpi.value)}
              detail={kpi.detail}
              tone={kpi.tone}
            />
          ))}
        </section>

        {/* Main grid */}
        <section className="grid items-start gap-5 xl:grid-cols-[1.7fr_1fr]">
          {/* Left column */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Registry health */}
            <article className={cardClass()}>
              <CardHeader
                title="Registry health"
                subtitle="KYC, certificate and approval coverage across the register"
              />
              <div className="flex flex-col gap-5 px-5 py-5">
                <StackedBar
                  title="KYC compliance"
                  subtitle={`${formatNumber(summary.kyc_verified_count ?? 0)} verified of ${formatNumber(summary.shareholder_count)}`}
                  segments={[
                    { label: "Verified", value: summary.kyc_verified_count ?? 0, colorClass: "bg-emerald-500" },
                    { label: "Expiring", value: summary.kyc_expiring_soon_count ?? 0, colorClass: "bg-amber-400" },
                    { label: "Expired", value: summary.kyc_expired_count ?? 0, colorClass: "bg-rose-500" },
                    {
                      label: "No KYC",
                      value: Math.max(
                        0,
                        summary.shareholder_count -
                          (summary.kyc_verified_count ?? 0) -
                          (summary.kyc_expiring_soon_count ?? 0) -
                          (summary.kyc_expired_count ?? 0)
                      ),
                      colorClass: "bg-slate-200",
                    },
                  ]}
                />
                <StackedBar
                  title="Certificate pipeline"
                  subtitle={`${formatNumber(summary.issued_certificate_count)} issued of ${formatNumber(summary.certificate_count)}`}
                  segments={[
                    { label: "Issued", value: summary.issued_certificate_count, colorClass: "bg-emerald-500" },
                    {
                      label: "Draft",
                      value: Math.max(
                        0,
                        summary.certificate_count -
                          summary.issued_certificate_count -
                          summary.revoked_certificate_count
                      ),
                      colorClass: "bg-sky-400",
                    },
                    { label: "Revoked", value: summary.revoked_certificate_count, colorClass: "bg-rose-500" },
                  ]}
                />
                <StackedBar
                  title="Approval pipeline"
                  subtitle={`${formatNumber(summary.pending_approval_count)} pending · ${formatNumber(summary.overdue_approval_count)} overdue`}
                  segments={[
                    { label: "Approved", value: summary.approved_approval_count, colorClass: "bg-emerald-500" },
                    { label: "Pending", value: summary.pending_approval_count, colorClass: "bg-amber-400" },
                    { label: "Overdue", value: summary.overdue_approval_count, colorClass: "bg-rose-500" },
                  ]}
                />
              </div>
            </article>

            {/* Top ownership */}
            <article className={`${cardClass()} overflow-hidden`}>
              <CardHeader
                title="Top ownership"
                action={
                  <Link
                    href="/cap-table"
                    className="text-[12.5px] font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    View cap table →
                  </Link>
                }
              />
              {summary.top_ownership_rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="bg-slate-50 text-[11.5px] uppercase tracking-[0.05em] text-slate-500">
                        <th className="border-b border-slate-100 px-5 py-2.5 font-semibold">
                          Shareholder
                        </th>
                        <th className="border-b border-slate-100 px-4 py-2.5 text-right font-semibold">
                          Shares
                        </th>
                        <th className="border-b border-slate-100 px-5 py-2.5 text-right font-semibold">
                          Ownership
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.top_ownership_rows.map((row) => (
                        <tr key={row.shareholder_name} className="transition-colors hover:bg-slate-50">
                          <td className="border-b border-slate-100 px-5 py-3 font-medium text-slate-900">
                            {row.shareholder_name}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-600 tabular-nums">
                            {formatNumber(row.quantity)}
                          </td>
                          <td className="border-b border-slate-100 px-5 py-3 text-right font-medium text-slate-900 tabular-nums">
                            {formatNumber(row.ownership_percentage)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5">
                  <EmptyState title="No active ownership rows found" />
                </div>
              )}
            </article>

            {/* SLA snapshot */}
            <article className={`${cardClass()} overflow-hidden`}>
              <CardHeader
                title="SLA snapshot"
                subtitle="Approval workflow timing status"
              />
              {summary.sla_snapshot.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="bg-slate-50 text-[11.5px] uppercase tracking-[0.05em] text-slate-500">
                        <th className="border-b border-slate-100 px-5 py-2.5 font-semibold">Request</th>
                        <th className="border-b border-slate-100 px-4 py-2.5 font-semibold">Stage</th>
                        <th className="border-b border-slate-100 px-4 py-2.5 font-semibold">Due</th>
                        <th className="border-b border-slate-100 px-5 py-2.5 font-semibold">SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.sla_snapshot.map((item, index) => (
                        <tr
                          key={`${item.request_type}-${item.stage}-${index}`}
                          className="transition-colors hover:bg-slate-50"
                        >
                          <td className="border-b border-slate-100 px-5 py-3 capitalize text-slate-900">
                            {formatLabel(item.request_type)}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 capitalize text-slate-600">
                            {formatLabel(item.stage)}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                            {formatDate(item.sla_due_date)}
                          </td>
                          <td className="border-b border-slate-100 px-5 py-3">
                            <StatusBadge status={item.computed_sla_status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5">
                  <EmptyState title="No SLA items found" />
                </div>
              )}
            </article>
          </div>

          {/* Right column */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Recent activity feed */}
            <article className={cardClass()}>
              <CardHeader
                title="Recent activity"
                action={
                  <Link
                    href="/audit-log"
                    className="text-[12.5px] font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Audit log →
                  </Link>
                }
              />
              <div className="px-5 pb-4 pt-1">
                {summary.recent_audit_actions.length > 0 ? (
                  summary.recent_audit_actions.map((action) => {
                    const tone = actionTone(action.action);
                    return (
                      <div
                        key={`${action.actor_id}-${action.action}-${action.timestamp_utc}`}
                        className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0"
                      >
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-semibold ${tone.bg} ${tone.text}`}
                          aria-hidden="true"
                        >
                          {tone.glyph}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] leading-snug text-slate-900">
                            <span className="capitalize">{formatLabel(action.action)}</span>{" "}
                            <span className="font-semibold">{action.table_name}</span>
                          </p>
                          <p className="mt-0.5 truncate text-[11.5px] text-slate-500">
                            {action.actor_id} · {formatDate(action.timestamp_utc)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4">
                    <EmptyState title="No audit records found" />
                  </div>
                )}
              </div>
            </article>

            {/* Workflow summary */}
            <article className={cardClass()}>
              <CardHeader
                title="Workflow summary"
                subtitle="Transfers and approvals in the pipeline"
              />
              <div className="flex flex-col px-5 py-2">
                {workflowStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-b-0"
                  >
                    <span className="text-[13px] text-slate-500">{stat.label}</span>
                    <span
                      className={`text-[13px] font-semibold tabular-nums ${
                        stat.tone === "danger"
                          ? "text-rose-700"
                          : stat.tone === "success"
                            ? "text-emerald-700"
                            : "text-slate-900"
                      }`}
                    >
                      {formatNumber(stat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
