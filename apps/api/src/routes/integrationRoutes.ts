import { Router } from "express";
import {
  powerAutomateConfig,
  powerBiConfig,
  sharePointConfig,
} from "../config/integrations";
import { sendBadRequest, sendServerError } from "../utils/apiError";

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

integrationRoutes.post("/power-automate/test", async (req, res) => {
  const cfg = powerAutomateConfig();
  if (!cfg.notificationWebhookUrl) {
    return sendBadRequest(res, "POWER_AUTOMATE_NOTIFICATION_WEBHOOK_URL is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(cfg.notificationWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "webhook_test", source: "digaf-governance-platform" }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    res.json({ success: true, statusCode: response.status });
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({ success: false, error: message });
  }
});
