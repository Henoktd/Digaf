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

export const shareClassRoutes = Router();

shareClassRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        share_class_id,
        entity_id,
        class_name,
        voting_rights,
        votes_per_share,
        voting_class_tier,
        par_value,
        status,
        notes,
        created_at
      FROM share_class
      ORDER BY created_at ASC
    `);

    res.json({ data: result.rows });
  } catch (error) {
    return sendServerError(res, "Failed to fetch share classes", error);
  }
});

shareClassRoutes.post("/", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  let className = "";
  let entityId: string | null = null;
  const { parValue, votingRights, votesPerShare, votingClassTier, status, notes } = req.body ?? {};

  try {
    className = requireNonEmptyString(req.body?.className, "className");
    entityId = req.body?.entityId ? requireUuid(req.body.entityId, "entityId") : null;
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid request body");
  }

  const parValueNum = parValue != null ? parseFloat(String(parValue)) : NaN;
  if (isNaN(parValueNum) || parValueNum <= 0) {
    return sendBadRequest(res, "parValue must be a positive number");
  }

  // Resolve entity: use provided entityId or fall back to the single tenant entity
  let resolvedEntityId = entityId;
  if (!resolvedEntityId) {
    try {
      const entityRow = await pool.query(`SELECT entity_id FROM entity LIMIT 1`);
      if (!entityRow.rowCount) return sendBadRequest(res, "No entity found in the system");
      resolvedEntityId = entityRow.rows[0].entity_id;
    } catch (error) {
      return sendServerError(res, "Failed to resolve entity", error);
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO share_class
        (entity_id, class_name, voting_rights, votes_per_share, voting_class_tier, par_value, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        resolvedEntityId,
        className,
        votingRights === true || votingRights === "true",
        votesPerShare != null ? parseInt(String(votesPerShare), 10) : 1,
        votingClassTier ? String(votingClassTier).trim() || null : null,
        parValueNum,
        status ? String(status).trim() : "active",
        notes ? String(notes).trim() || null : null,
      ]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to create share class", error);
  }
});

shareClassRoutes.put("/:shareClassId", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  let shareClassId = "";
  try {
    shareClassId = requireUuid(req.params.shareClassId, "shareClassId");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid shareClassId");
  }

  try {
    const existing = await pool.query(
      `SELECT share_class_id FROM share_class WHERE share_class_id = $1`,
      [shareClassId]
    );
    if (existing.rowCount === 0) return sendNotFound(res, "Share class not found");
  } catch (error) {
    return sendServerError(res, "Failed to fetch share class", error);
  }

  const fields: string[] = [];
  const values: unknown[] = [shareClassId];

  const { className, votingRights, votesPerShare, votingClassTier, parValue, status, notes } = req.body ?? {};

  if (className !== undefined) {
    try { requireNonEmptyString(className, "className"); } catch (e) { return sendBadRequest(res, e instanceof Error ? e.message : "Invalid className"); }
    fields.push(`class_name = $${values.length + 1}`); values.push(String(className).trim());
  }
  if (votingRights !== undefined) {
    fields.push(`voting_rights = $${values.length + 1}`); values.push(votingRights === true || votingRights === "true");
  }
  if (votesPerShare !== undefined) {
    fields.push(`votes_per_share = $${values.length + 1}`); values.push(parseInt(String(votesPerShare), 10));
  }
  if (votingClassTier !== undefined) {
    fields.push(`voting_class_tier = $${values.length + 1}`); values.push(String(votingClassTier).trim() || null);
  }
  if (parValue !== undefined) {
    const p = parseFloat(String(parValue));
    if (isNaN(p) || p <= 0) return sendBadRequest(res, "parValue must be a positive number");
    fields.push(`par_value = $${values.length + 1}`); values.push(p);
  }
  if (status !== undefined) {
    fields.push(`status = $${values.length + 1}`); values.push(String(status).trim());
  }
  if (notes !== undefined) {
    fields.push(`notes = $${values.length + 1}`); values.push(String(notes).trim() || null);
  }

  if (fields.length === 0) return sendBadRequest(res, "No fields to update");

  try {
    const result = await pool.query(
      `UPDATE share_class SET ${fields.join(", ")} WHERE share_class_id = $1 RETURNING *`,
      values
    );
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to update share class", error);
  }
});