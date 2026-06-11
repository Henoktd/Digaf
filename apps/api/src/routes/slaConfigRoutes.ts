import { Router } from "express";
import { pool } from "../db/pool";
import {
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendServerError,
} from "../utils/apiError";
import { requireRole } from "../utils/roles";
import { requireUuid } from "../utils/validation";

export const slaConfigRoutes = Router();

slaConfigRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM sla_config
      ORDER BY process_type ASC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    return sendServerError(res, "Failed to fetch SLA config", error);
  }
});

slaConfigRoutes.put("/:slaConfigId", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  let slaConfigId = "";
  try {
    slaConfigId = requireUuid(req.params.slaConfigId, "slaConfigId");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid slaConfigId");
  }

  const { targetDays, escalationDay1, escalationDay2, escalationRecipientRole, uptimeTarget } = req.body ?? {};

  if (targetDays === undefined || targetDays === null) {
    return sendBadRequest(res, "targetDays is required");
  }
  const targetDaysInt = parseInt(String(targetDays), 10);
  if (isNaN(targetDaysInt) || targetDaysInt < 1) {
    return sendBadRequest(res, "targetDays must be a positive integer");
  }

  try {
    const existing = await pool.query(`SELECT id FROM sla_config WHERE id = $1`, [slaConfigId]);
    if (existing.rowCount === 0) return sendNotFound(res, "SLA config not found");

    const result = await pool.query(
      `UPDATE sla_config
       SET target_days = $2,
           escalation_day1 = $3,
           escalation_day2 = $4,
           escalation_recipient_role = $5,
           uptime_target = $6,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        slaConfigId,
        targetDaysInt,
        escalationDay1 != null ? parseInt(String(escalationDay1), 10) : null,
        escalationDay2 != null ? parseInt(String(escalationDay2), 10) : null,
        escalationRecipientRole ? String(escalationRecipientRole).trim() || null : null,
        uptimeTarget != null ? parseFloat(String(uptimeTarget)) : null,
      ]
    );
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to update SLA config", error);
  }
});
