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

export const lienRoutes = Router();

const PROPOSE_ROLES = ["maker", "compliance_officer", "governance_admin"] as const;
const APPROVE_ROLES = ["governance_admin"] as const;
const LIEN_TYPES = new Set(["pledge", "encumbrance"]);

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
     VALUES ($1, $2, $3, 'share_lien', $4, $5::jsonb, $6::jsonb)`,
    [entityId, actorId, action, recordId, JSON.stringify(oldValue), JSON.stringify(newValue)]
  );
}

const LIEN_SELECT = `
  SELECT
    sl.*,
    s.shareholder_id,
    s.legal_name AS shareholder_name,
    sc.class_name AS share_class_name,
    so.quantity AS position_quantity
  FROM share_lien sl
  JOIN share_ownership so ON so.id = sl.share_ownership_id
  JOIN shareholder s ON s.shareholder_id = so.shareholder_id
  JOIN share_class sc ON sc.share_class_id = so.share_class_id
`;

lienRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      ${LIEN_SELECT}
      ORDER BY
        CASE sl.status
          WHEN 'pending_approval' THEN 0
          WHEN 'pending_release' THEN 1
          WHEN 'active' THEN 2
          ELSE 3
        END,
        sl.requested_at DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    return sendServerError(res, "Failed to fetch liens", error);
  }
});

// POST / — propose registering a lien/pledge against a share position.
// Requires governance_admin approval before it affects the position.
lienRoutes.post("/", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...PROPOSE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  const { shareOwnershipId, lienType, quantity, reason, authorityReference } = req.body ?? {};

  let validOwnershipId: string;
  let validReason: string;
  try {
    validOwnershipId = requireUuid(shareOwnershipId, "shareOwnershipId");
    validReason = requireNonEmptyString(reason, "reason");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid request");
  }
  if (typeof lienType !== "string" || !LIEN_TYPES.has(lienType)) {
    return sendBadRequest(res, "lienType must be 'pledge' or 'encumbrance'");
  }
  const quantityNum = Number(quantity);
  if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
    return sendBadRequest(res, "quantity must be a positive number");
  }

  try {
    const ownershipResult = await pool.query(
      `SELECT so.id, so.quantity, so.pledged_quantity, so.encumbered_quantity, s.entity_id
       FROM share_ownership so
       JOIN shareholder s ON s.shareholder_id = so.shareholder_id
       WHERE so.id = $1 AND so.status = 'active'`,
      [validOwnershipId]
    );
    if (ownershipResult.rowCount === 0) return sendNotFound(res, "Share ownership position not found");
    const position = ownershipResult.rows[0];

    const available =
      Number(position.quantity) - Number(position.pledged_quantity) - Number(position.encumbered_quantity);
    if (quantityNum > available) {
      return sendBadRequest(
        res,
        `Requested quantity (${quantityNum}) exceeds the available unencumbered balance (${available})`
      );
    }

    const result = await pool.query(
      `INSERT INTO share_lien (
        entity_id, share_ownership_id, lien_type, quantity, reason, authority_reference,
        status, requested_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending_approval', $7)
      RETURNING *`,
      [position.entity_id, validOwnershipId, lienType, quantityNum, validReason, authorityReference ?? null, actorId]
    );
    const lien = result.rows[0];

    await insertAuditLog(position.entity_id, actorId, "lien_proposed", lien.id, null, lien);
    res.json({ data: lien });
  } catch (error) {
    return sendServerError(res, "Failed to propose lien", error);
  }
});

// POST /:id/approve — governance_admin approval activates the lien and
// increments the share position's pledged/encumbered balance.
lienRoutes.post("/:id/approve", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...APPROVE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let lienId: string;
  try {
    lienId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(`SELECT * FROM share_lien WHERE id = $1 FOR UPDATE`, [lienId]);
    if (existing.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Lien not found");
    }
    const lien = existing.rows[0];

    if (lien.status !== "pending_approval") {
      await client.query("ROLLBACK");
      return sendBadRequest(res, `Cannot approve a lien with status '${lien.status}'`);
    }
    if (lien.requested_by === actorId) {
      await client.query("ROLLBACK");
      return sendForbidden(res, "The proposer cannot approve their own request");
    }

    const column = lien.lien_type === "pledge" ? "pledged_quantity" : "encumbered_quantity";
    await client.query(
      `UPDATE share_ownership SET ${column} = ${column} + $2 WHERE id = $1`,
      [lien.share_ownership_id, lien.quantity]
    );

    const updated = await client.query(
      `UPDATE share_lien
       SET status = 'active', approved_by = $2, approved_at = now()
       WHERE id = $1
       RETURNING *`,
      [lienId, actorId]
    );

    await insertAuditLog(lien.entity_id, actorId, "lien_approved", lienId, lien, updated.rows[0]);
    await client.query("COMMIT");
    res.json({ data: updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(res, "Failed to approve lien", error);
  } finally {
    client.release();
  }
});

// POST /:id/reject — governance_admin rejects a proposed lien.
lienRoutes.post("/:id/reject", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...APPROVE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let lienId: string;
  try {
    lienId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }
  const notes = typeof req.body?.decisionNotes === "string" ? req.body.decisionNotes : null;

  try {
    const existing = await pool.query(`SELECT * FROM share_lien WHERE id = $1`, [lienId]);
    if (existing.rowCount === 0) return sendNotFound(res, "Lien not found");
    const lien = existing.rows[0];

    if (lien.status !== "pending_approval") {
      return sendBadRequest(res, `Cannot reject a lien with status '${lien.status}'`);
    }

    const result = await pool.query(
      `UPDATE share_lien
       SET status = 'rejected', approved_by = $2, approved_at = now(), decision_notes = $3
       WHERE id = $1
       RETURNING *`,
      [lienId, actorId, notes]
    );
    await insertAuditLog(lien.entity_id, actorId, "lien_rejected", lienId, lien, result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to reject lien", error);
  }
});

// POST /:id/request-release — propose releasing an active lien/pledge.
lienRoutes.post("/:id/request-release", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...PROPOSE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let lienId: string;
  try {
    lienId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }

  try {
    const existing = await pool.query(`SELECT * FROM share_lien WHERE id = $1`, [lienId]);
    if (existing.rowCount === 0) return sendNotFound(res, "Lien not found");
    const lien = existing.rows[0];

    if (lien.status !== "active") {
      return sendBadRequest(res, `Cannot request release on a lien with status '${lien.status}'`);
    }

    const result = await pool.query(
      `UPDATE share_lien
       SET status = 'pending_release', release_requested_by = $2, release_requested_at = now()
       WHERE id = $1
       RETURNING *`,
      [lienId, actorId]
    );
    await insertAuditLog(lien.entity_id, actorId, "lien_release_requested", lienId, lien, result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to request lien release", error);
  }
});

// POST /:id/approve-release — governance_admin approves the release and
// decrements the share position's pledged/encumbered balance.
lienRoutes.post("/:id/approve-release", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...APPROVE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let lienId: string;
  try {
    lienId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(`SELECT * FROM share_lien WHERE id = $1 FOR UPDATE`, [lienId]);
    if (existing.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Lien not found");
    }
    const lien = existing.rows[0];

    if (lien.status !== "pending_release") {
      await client.query("ROLLBACK");
      return sendBadRequest(res, `Cannot approve release on a lien with status '${lien.status}'`);
    }
    if (lien.release_requested_by === actorId) {
      await client.query("ROLLBACK");
      return sendForbidden(res, "The requester cannot approve their own release request");
    }

    const column = lien.lien_type === "pledge" ? "pledged_quantity" : "encumbered_quantity";
    await client.query(
      `UPDATE share_ownership SET ${column} = GREATEST(0, ${column} - $2) WHERE id = $1`,
      [lien.share_ownership_id, lien.quantity]
    );

    const updated = await client.query(
      `UPDATE share_lien
       SET status = 'released', released_by = $2, released_at = now()
       WHERE id = $1
       RETURNING *`,
      [lienId, actorId]
    );

    await insertAuditLog(lien.entity_id, actorId, "lien_released", lienId, lien, updated.rows[0]);
    await client.query("COMMIT");
    res.json({ data: updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(res, "Failed to approve lien release", error);
  } finally {
    client.release();
  }
});

// POST /:id/reject-release — governance_admin rejects the release request, reverting to active.
lienRoutes.post("/:id/reject-release", async (req, res) => {
  const roleResult = requireRole(req.auth.actorRole, [...APPROVE_ROLES]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const actorId = req.auth.actorId;
  let lienId: string;
  try {
    lienId = requireUuid(req.params.id, "id");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid id");
  }
  const notes = typeof req.body?.decisionNotes === "string" ? req.body.decisionNotes : null;

  try {
    const existing = await pool.query(`SELECT * FROM share_lien WHERE id = $1`, [lienId]);
    if (existing.rowCount === 0) return sendNotFound(res, "Lien not found");
    const lien = existing.rows[0];

    if (lien.status !== "pending_release") {
      return sendBadRequest(res, `Cannot reject release on a lien with status '${lien.status}'`);
    }

    const result = await pool.query(
      `UPDATE share_lien
       SET status = 'active', decision_notes = $2
       WHERE id = $1
       RETURNING *`,
      [lienId, notes]
    );
    await insertAuditLog(lien.entity_id, actorId, "lien_release_rejected", lienId, lien, result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to reject lien release", error);
  }
});
