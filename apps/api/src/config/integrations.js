"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharePointConfig = sharePointConfig;
exports.powerAutomateConfig = powerAutomateConfig;
exports.powerBiConfig = powerBiConfig;
function readOptionalEnv(name) {
    const value = process.env[name]?.trim();
    return value ? value : undefined;
}
function sharePointConfig() {
    return {
        siteUrl: readOptionalEnv("SHAREPOINT_SITE_URL"),
        documentLibrary: readOptionalEnv("SHAREPOINT_DOCUMENT_LIBRARY"),
    };
}
function powerAutomateConfig() {
    return {
        notificationWebhookUrl: readOptionalEnv("POWER_AUTOMATE_NOTIFICATION_WEBHOOK_URL"),
    };
}
function powerBiConfig() {
    return {
        workspaceId: readOptionalEnv("POWER_BI_WORKSPACE_ID"),
        reportId: readOptionalEnv("POWER_BI_REPORT_ID"),
    };
}
//# sourceMappingURL=integrations.js.map