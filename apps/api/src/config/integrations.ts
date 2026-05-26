function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function sharePointConfig() {
  return {
    siteUrl: readOptionalEnv("SHAREPOINT_SITE_URL"),
    documentLibrary: readOptionalEnv("SHAREPOINT_DOCUMENT_LIBRARY"),
  };
}

export function powerAutomateConfig() {
  return {
    notificationWebhookUrl: readOptionalEnv(
      "POWER_AUTOMATE_NOTIFICATION_WEBHOOK_URL"
    ),
  };
}

export function powerBiConfig() {
  return {
    workspaceId: readOptionalEnv("POWER_BI_WORKSPACE_ID"),
    reportId: readOptionalEnv("POWER_BI_REPORT_ID"),
  };
}
