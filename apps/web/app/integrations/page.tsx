import {
  fetchIntegrationStatus,
  IntegrationStatus,
} from "@/src/lib/api";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusBadge } from "@/src/components/StatusBadge";

type IntegrationStatusResponse = {
  data: IntegrationStatus;
};

type StatusCardProps = {
  title: string;
  description: string;
  configured: boolean;
  checks: {
    label: string;
    present: boolean;
  }[];
};

function StatusCard({
  title,
  description,
  configured,
  checks,
}: StatusCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>

        <StatusBadge
          status={configured ? "configured" : "not_configured"}
          label={configured ? "Configured" : "Not configured"}
          tone={configured ? "success" : "warning"}
        />
      </div>

      <div className="mt-6 space-y-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-700">
              {check.label}
            </span>
            <StatusBadge
              status={check.present ? "present" : "missing"}
              label={check.present ? "Present" : "Missing"}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

export default async function IntegrationsPage() {
  const response: IntegrationStatusResponse = await fetchIntegrationStatus();
  const status = response.data;

  const checklist = [
    {
      name: "SHAREPOINT_SITE_URL",
      present: status.sharePoint.siteUrlPresent,
    },
    {
      name: "SHAREPOINT_DOCUMENT_LIBRARY",
      present: status.sharePoint.documentLibraryPresent,
    },
    {
      name: "POWER_AUTOMATE_NOTIFICATION_WEBHOOK_URL",
      present: status.powerAutomate.notificationWebhookPresent,
    },
    {
      name: "POWER_BI_WORKSPACE_ID",
      present: status.powerBi.workspaceIdPresent,
    },
    {
      name: "POWER_BI_REPORT_ID",
      present: status.powerBi.reportIdPresent,
    },
  ];

  return (
    <main className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          eyebrow="Microsoft 365 Integration Preparation"
          title="Integration Readiness"
          description="Environment readiness for SharePoint document references, Power Automate notifications, and Power BI reporting. This page checks configuration presence only."
          badge={
            <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Prep only
            </div>
          }
        />

        <section className="grid gap-6 xl:grid-cols-3">
          <StatusCard
            title="SharePoint"
            description="Planned document repository for governance evidence and shareholder records."
            configured={status.sharePoint.configured}
            checks={[
              {
                label: "Site URL",
                present: status.sharePoint.siteUrlPresent,
              },
              {
                label: "Document Library",
                present: status.sharePoint.documentLibraryPresent,
              },
            ]}
          />

          <StatusCard
            title="Power Automate"
            description="Planned notification-only workflow endpoint for governance events."
            configured={status.powerAutomate.configured}
            checks={[
              {
                label: "Notification Webhook",
                present: status.powerAutomate.notificationWebhookPresent,
              },
            ]}
          />

          <StatusCard
            title="Power BI"
            description="Planned dashboard and reporting surface over governed PostgreSQL data."
            configured={status.powerBi.configured}
            checks={[
              {
                label: "Workspace ID",
                present: status.powerBi.workspaceIdPresent,
              },
              {
                label: "Report ID",
                present: status.powerBi.reportIdPresent,
              },
            ]}
          />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Environment Variable Checklist
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              These variables are optional during the preparation stage and can
              be added later per environment.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Variable
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {checklist.map((item) => (
                  <tr key={item.name}>
                    <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs">
                      {item.name}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <StatusBadge
                        status={item.present ? "present" : "missing"}
                        label={item.present ? "Present" : "Missing"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">SharePoint Role</h2>
            <p className="mt-3 text-sm text-slate-600">
              SharePoint is planned as the document repository. The application
              will continue to store structured governance metadata in
              PostgreSQL and reference SharePoint files through document
              records.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Power Automate Role</h2>
            <p className="mt-3 text-sm text-slate-600">
              Power Automate is planned for notifications only. It should not
              own approval state, shareholder records, transfer logic, or audit
              decisions.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Power BI Role</h2>
            <p className="mt-3 text-sm text-slate-600">
              Power BI is planned for dashboards and reporting over governed
              datasets. Operational writes and regulated workflow decisions
              remain in the API and PostgreSQL ledger.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
