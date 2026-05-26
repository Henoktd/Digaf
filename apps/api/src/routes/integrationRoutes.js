"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationRoutes = void 0;
const express_1 = require("express");
const integrations_1 = require("../config/integrations");
exports.integrationRoutes = (0, express_1.Router)();
exports.integrationRoutes.get("/status", (_req, res) => {
    const sharePoint = (0, integrations_1.sharePointConfig)();
    const powerAutomate = (0, integrations_1.powerAutomateConfig)();
    const powerBi = (0, integrations_1.powerBiConfig)();
    const sharePointStatus = {
        configured: Boolean(sharePoint.siteUrl && sharePoint.documentLibrary),
        siteUrlPresent: Boolean(sharePoint.siteUrl),
        documentLibraryPresent: Boolean(sharePoint.documentLibrary),
    };
    const powerAutomateStatus = {
        configured: Boolean(powerAutomate.notificationWebhookUrl),
        notificationWebhookPresent: Boolean(powerAutomate.notificationWebhookUrl),
    };
    const powerBiStatus = {
        configured: Boolean(powerBi.workspaceId && powerBi.reportId),
        workspaceIdPresent: Boolean(powerBi.workspaceId),
        reportIdPresent: Boolean(powerBi.reportId),
    };
    res.json({
        data: {
            sharePoint: sharePointStatus,
            powerAutomate: powerAutomateStatus,
            powerBi: powerBiStatus,
        },
    });
});
//# sourceMappingURL=integrationRoutes.js.map