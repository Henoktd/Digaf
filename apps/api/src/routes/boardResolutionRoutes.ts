import { Router } from "express";
import { pool } from "../db/pool";
import {
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendServerError,
} from "../utils/apiError";
import { requireRole } from "../utils/roles";
import { requireNonEmptyString, requireUuid } from "../utils/validation";

export const boardResolutionRoutes = Router();

boardResolutionRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM board_resolution_ref
      ORDER BY resolution_date DESC
      LIMIT 200
    `);
    res.json({ data: result.rows });
  } catch (error) {
    return sendServerError(res, "Failed to fetch board resolutions", error);
  }
});

boardResolutionRoutes.post("/", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  let resolutionNumber = "";
  let resolutionDate = "";
  let description = "";
  let approvedAction: string | null = null;
  let sharepointDocumentUrl: string | null = null;

  try {
    resolutionNumber = requireNonEmptyString(req.body?.resolutionNumber, "resolutionNumber");
    resolutionDate = requireNonEmptyString(req.body?.resolutionDate, "resolutionDate");
    description = requireNonEmptyString(req.body?.description, "description");
    approvedAction = req.body?.approvedAction ? String(req.body.approvedAction).trim() || null : null;
    sharepointDocumentUrl = req.body?.sharepointDocumentUrl ? String(req.body.sharepointDocumentUrl).trim() || null : null;
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid request body");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(resolutionDate)) {
    return sendBadRequest(res, "resolutionDate must be YYYY-MM-DD");
  }

  try {
    const result = await pool.query(
      `INSERT INTO board_resolution_ref
        (resolution_number, resolution_date, description, approved_action, sharepoint_document_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [resolutionNumber, resolutionDate, description, approvedAction, sharepointDocumentUrl]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to create board resolution", error);
  }
});

boardResolutionRoutes.get("/:resolutionId", async (req, res) => {
  let resolutionId = "";
  try {
    resolutionId = requireUuid(req.params.resolutionId, "resolutionId");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid resolutionId");
  }

  try {
    const result = await pool.query(
      `SELECT * FROM board_resolution_ref WHERE id = $1`,
      [resolutionId]
    );
    if (result.rowCount === 0) return sendNotFound(res, "Board resolution not found");
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to fetch board resolution", error);
  }
});
