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

export const legalHoldRoutes = Router();

const PROPOSE_ROLES = ["maker", "compliance_officer", "governance_admin"] as const;
const APPROVE_ROLES = ["governance_admin"] as const;

async function insertAuditLog(
  entityId: string,
  actorId: string,
  action: string,
  recordId: string,
  oldValue: unknown,
  newValue: unknown
) {
  await pool.query(
    `INSERT INTO audit_log (entity_id, actor_id, action, table_name, record_id, old_value_json, new_value_json)
     VALUES ($1, $2, $3, 'legal_hold', $4, $5::jsonb, $6::jsonb)`,
    [entityId, actorId, action, recordId, JSON.stringify(oldValue), JSON.stringify(newValue)]
  );
}

legalHoldRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        lh.id,
        lh.entity_id,
        e.legal_name AS entity_name,
        lh.hold_type,
        lh.related_record_type,
        lh.related_record_id,
        s.legal_name AS related_shareholder_name,
        lh.imposed_by,
        lh.imposed_at,
        lh.reason,
        lh.status,
        lh.approved_by,
        lh.approved_at,
        lh.release_requested_by,
        lh.release_requested_at,
        lh.lifted_by,
        lh.lifted_at,
        lh.decision_notes,
        lh.authority_reference,
        tf.id AS transfer_freeze_id,
        tf.freeze_type,
        tf.status AS freeze_status,
        tf.reason AS freeze_reason,
        tf.imposed_at AS freeze_imposed_at
      FROM legal_hold lh
      JOIN entity e ON e.entity_id = lh.entity_id
      LEFT JOIN shareholder s
        ON lh.related_record_type = 'shareholder'
        AND s.shareholder_id = lh.related_record_id
      LEFT JOIN LATERAL (
        SELECT id, freeze_type, status, reason, imposed_at
        FROM transfer_freeze
        WHERE shareholder_id = s.shareholder_id AND status = 'active'
        ORDER BY imposed_at DESC
        LIMIT 1
      ) tf ON true
      ORDER BY
        CASE lh.status
          WHEN 'pending_approval' THEN 0
          WHEN 'pending_lift' THEN 1
          WHEN 'active' THEN 2
          ELSE 3
        END,
        lh.imposed_at DESC
    `);

    res.json({ data: result.rows });
  } catch (error) {
    return sendServerError(res, "Failed to fetch legal holds", error);
  }
});

// POST / — propose imposing a legal hold on a shareholder record.
// Requires governance_admin approval before it takes effect.
legalHoldRoutes.post("/", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...PROPOSE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  const { shareholderId, holdType, reason, authorityReference } = req.body ?? {};

  let validShareholderId: string;
  let validHoldType: string;
  let validReason: string;
  try {
    validShareholderId = requireUuid(shareholderId, "shareholderId");
    validHoldType = requireNonEmptyString(holdType, "holdType");
    validReason = requireNonEmptyString(reason, "reason");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid request");
  }

  try {
    const shareholderResult = await pool.query(
      `SELECT entity_id FROM shareholder WHERE shareholder_id = $1`,
      [validShareholderId]
    );
    if (shareholderResult.rowCount === 0) return sendNotFound(res, "Shareholder not found");
    const entityId = shareholderResult.rows[0].entity_id;

    const result = await pool.query(
      `INSERT INTO legal_hold (
        entity_id, hold_type, related_record_type, related_record_id,
        imposed_by, reason, status, authority_reference
      ) VALUES ($1, $2, 'shareholder', $3, $4, $5, 'pending_approval', $6)
      RETURNING *`,
      [entityId, validHoldType, validShareholderId, actorId, validReason, authorityReference ?? null]
    );
    const hold = result.rows[0];

    await insertAuditLog(entityId, actorId, "legal_hold_proposed", hold.id, null, hold);
    res.json({ data: hold });
  } catch (error) {
    return sendServerError(res, "Failed to propose legal hold", error);
  }
});

// POST /:id/approve — governance_admin approval activates the hold.
legalHoldRoutes.post("/:id/approve", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...APPROVE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let holdId: string;
  try {
    holdId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }

  try {
    const existing = await pool.query(`SELECT * FROM legal_hold WHERE id = $1`, [holdId]);
    if (existing.rowCount === 0) return sendNotFound(res, "Legal hold not found");
    const hold = existing.rows[0];

    if (hold.status !== "pending_approval") {
      return sendBadRequest(res, `Cannot approve a hold with status '${hold.status}'`);
    }
    if (hold.imposed_by === actorId) {
      return sendForbidden(res, "The proposer cannot approve their own request");
    }

    const result = await pool.query(
      `UPDATE legal_hold
       SET status = 'active', approved_by = $2, approved_at = now()
       WHERE id = $1
       RETURNING *`,
      [holdId, actorId]
    );
    await insertAuditLog(hold.entity_id, actorId, "legal_hold_approved", holdId, hold, result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to approve legal hold", error);
  }
});

// POST /:id/reject — governance_admin rejects a proposed hold.
legalHoldRoutes.post("/:id/reject", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...APPROVE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let holdId: string;
  try {
    holdId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }
  const notes = typeof req.body?.decisionNotes === "string" ? req.body.decisionNotes : null;

  try {
    const existing = await pool.query(`SELECT * FROM legal_hold WHERE id = $1`, [holdId]);
    if (existing.rowCount === 0) return sendNotFound(res, "Legal hold not found");
    const hold = existing.rows[0];

    if (hold.status !== "pending_approval") {
      return sendBadRequest(res, `Cannot reject a hold with status '${hold.status}'`);
    }

    const result = await pool.query(
      `UPDATE legal_hold
       SET status = 'rejected', approved_by = $2, approved_at = now(), decision_notes = $3
       WHERE id = $1
       RETURNING *`,
      [holdId, actorId, notes]
    );
    await insertAuditLog(hold.entity_id, actorId, "legal_hold_rejected", holdId, hold, result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to reject legal hold", error);
  }
});

// POST /:id/request-lift — propose lifting an active hold.
legalHoldRoutes.post("/:id/request-lift", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...PROPOSE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let holdId: string;
  try {
    holdId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }

  try {
    const existing = await pool.query(`SELECT * FROM legal_hold WHERE id = $1`, [holdId]);
    if (existing.rowCount === 0) return sendNotFound(res, "Legal hold not found");
    const hold = existing.rows[0];

    if (hold.status !== "active") {
      return sendBadRequest(res, `Cannot request lift on a hold with status '${hold.status}'`);
    }

    const result = await pool.query(
      `UPDATE legal_hold
       SET status = 'pending_lift', release_requested_by = $2, release_requested_at = now()
       WHERE id = $1
       RETURNING *`,
      [holdId, actorId]
    );
    await insertAuditLog(hold.entity_id, actorId, "legal_hold_lift_requested", holdId, hold, result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to request lift", error);
  }
});

// POST /:id/approve-lift — governance_admin approves the lift.
legalHoldRoutes.post("/:id/approve-lift", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...APPROVE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let holdId: string;
  try {
    holdId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }

  try {
    const existing = await pool.query(`SELECT * FROM legal_hold WHERE id = $1`, [holdId]);
    if (existing.rowCount === 0) return sendNotFound(res, "Legal hold not found");
    const hold = existing.rows[0];

    if (hold.status !== "pending_lift") {
      return sendBadRequest(res, `Cannot approve lift on a hold with status '${hold.status}'`);
    }
    if (hold.release_requested_by === actorId) {
      return sendForbidden(res, "The requester cannot approve their own lift request");
    }

    const result = await pool.query(
      `UPDATE legal_hold
       SET status = 'lifted', lifted_by = $2, lifted_at = now()
       WHERE id = $1
       RETURNING *`,
      [holdId, actorId]
    );
    await insertAuditLog(hold.entity_id, actorId, "legal_hold_lifted", holdId, hold, result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to approve lift", error);
  }
});

// POST /:id/reject-lift — governance_admin rejects the lift request, reverting to active.
legalHoldRoutes.post("/:id/reject-lift", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...APPROVE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let holdId: string;
  try {
    holdId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }
  const notes = typeof req.body?.decisionNotes === "string" ? req.body.decisionNotes : null;

  try {
    const existing = await pool.query(`SELECT * FROM legal_hold WHERE id = $1`, [holdId]);
    if (existing.rowCount === 0) return sendNotFound(res, "Legal hold not found");
    const hold = existing.rows[0];

    if (hold.status !== "pending_lift") {
      return sendBadRequest(res, `Cannot reject lift on a hold with status '${hold.status}'`);
    }

    const result = await pool.query(
      `UPDATE legal_hold
       SET status = 'active', decision_notes = $2
       WHERE id = $1
       RETURNING *`,
      [holdId, notes]
    );
    await insertAuditLog(hold.entity_id, actorId, "legal_hold_lift_rejected", holdId, hold, result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to reject lift", error);
  }
});
