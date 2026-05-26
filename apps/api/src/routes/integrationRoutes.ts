import { Router } from "express";
import {
  powerAutomateConfig,
  powerBiConfig,
  sharePointConfig,
} from "../config/integrations";

export const integrationRoutes = Router();

integrationRoutes.get("/status", (_req, res) => {
  const sharePoint = sharePointConfig();
  const powerAutomate = powerAutomateConfig();
  const powerBi = powerBiConfig();

  const sharePointStatus = {
    configured: Boolean(sharePoint.siteUrl && sharePoint.documentLibrary),
    siteUrlPresent: Boolean(sharePoint.siteUrl),
    documentLibraryPresent: Boolean(sharePoint.documentLibrary),
  };

  const powerAutomateStatus = {
    configured: Boolean(powerAutomate.notificationWebhookUrl),
    notificationWebhookPresent: Boolean(
      powerAutomate.notificationWebhookUrl
    ),
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
