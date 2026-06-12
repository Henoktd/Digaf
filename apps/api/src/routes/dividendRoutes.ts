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

export const dividendRoutes = Router();

// List all declarations
dividendRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.id,
        d.entity_id,
        d.share_class_id,
        sc.class_name AS share_class_name,
        d.declared_date,
        d.record_date,
        d.payment_date,
        d.amount_per_share,
        d.total_declared_amount,
        d.withholding_tax_rate,
        d.status,
        d.board_resolution_ref,
        d.notes,
        d.declared_by,
        d.created_at,
        COUNT(de.id)::int AS entitlement_count,
        COALESCE(SUM(de.net_amount), 0)::numeric AS total_net_amount
      FROM dividend_declaration d
      LEFT JOIN share_class sc ON sc.share_class_id = d.share_class_id
      LEFT JOIN dividend_entitlement de ON de.dividend_id = d.id
      GROUP BY d.id, sc.class_name
      ORDER BY d.declared_date DESC, d.created_at DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    return sendServerError(res, "Failed to fetch dividend declarations", error);
  }
});

// Get declaration detail with entitlements
dividendRoutes.get("/:id", async (req, res) => {
  let id = "";
  try {
    id = requireUuid(req.params.id, "id");
  } catch {
    return sendBadRequest(res, "Invalid dividend id");
  }

  try {
    const [declResult, entResult] = await Promise.all([
      pool.query(
        `SELECT d.*, sc.class_name AS share_class_name
         FROM dividend_declaration d
         LEFT JOIN share_class sc ON sc.share_class_id = d.share_class_id
         WHERE d.id = $1`,
        [id]
      ),
      pool.query(
        `SELECT de.*
         FROM dividend_entitlement de
         WHERE de.dividend_id = $1
         ORDER BY de.net_amount DESC`,
        [id]
      ),
    ]);
    if (declResult.rowCount === 0) return sendNotFound(res, "Dividend declaration not found");
    res.json({ data: { declaration: declResult.rows[0], entitlements: entResult.rows } });
  } catch (error) {
    return sendServerError(res, "Failed to fetch dividend detail", error);
  }
});

// Create declaration + auto-compute entitlements from issued certificates
dividendRoutes.post("/", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["governance_admin", "maker"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const {
    share_class_id,
    record_date,
    payment_date,
    amount_per_share,
    withholding_tax_rate,
    board_resolution_ref,
    notes,
  } = req.body ?? {};

  if (!record_date) return sendBadRequest(res, "record_date is required");
  if (!amount_per_share || isNaN(Number(amount_per_share)) || Number(amount_per_share) <= 0)
    return sendBadRequest(res, "amount_per_share must be a positive number");

  const perShare = Number(amount_per_share);
  const taxRate = Math.min(1, Math.max(0, Number(withholding_tax_rate) || 0));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const entityResult = await client.query(`SELECT entity_id FROM entity LIMIT 1`);
    if (entityResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendBadRequest(res, "No entity configured in the system");
    }
    const entityId = entityResult.rows[0].entity_id;

    // Compute share holdings as of record_date from issued certificates
    const sharesParams: unknown[] = [record_date];
    let sharesQuery = `
      SELECT
        s.shareholder_id,
        s.legal_name AS shareholder_name,
        SUM(c.quantity)::numeric AS shares
      FROM share_certificate c
      JOIN shareholder s ON s.shareholder_id = c.shareholder_id
      WHERE c.status = 'issued'
        AND c.issue_date IS NOT NULL
        AND c.issue_date <= $1::date
    `;
    if (share_class_id) {
      sharesQuery += ` AND c.share_class_id = $2`;
      sharesParams.push(share_class_id);
    }
    sharesQuery += ` GROUP BY s.shareholder_id, s.legal_name HAVING SUM(c.quantity) > 0`;

    const sharesResult = await client.query(sharesQuery, sharesParams);

    const totalDeclared = sharesResult.rows.reduce(
      (sum: number, row: { shares: string }) => sum + Number(row.shares) * perShare,
      0
    );

    const declResult = await client.query(
      `INSERT INTO dividend_declaration (
         entity_id, share_class_id, record_date, payment_date,
         amount_per_share, total_declared_amount, withholding_tax_rate,
         status, board_resolution_ref, notes, declared_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,'declared',$8,$9,$10)
       RETURNING *`,
      [
        entityId,
        share_class_id || null,
        record_date,
        payment_date || null,
        perShare,
        totalDeclared.toFixed(2),
        taxRate,
        board_resolution_ref || null,
        notes || null,
        req.auth.actorId,
      ]
    );
    const declaration = declResult.rows[0];

    for (const row of sharesResult.rows as { shareholder_id: string; shareholder_name: string; shares: string }[]) {
      const gross = Number(row.shares) * perShare;
      const tax = gross * taxRate;
      const net = gross - tax;
      await client.query(
        `INSERT INTO dividend_entitlement (
           dividend_id, shareholder_id, shareholder_name,
           shares_at_record_date, gross_amount, withholding_tax_amount, net_amount
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          declaration.id,
          row.shareholder_id,
          row.shareholder_name,
          row.shares,
          gross.toFixed(2),
          tax.toFixed(2),
          net.toFixed(2),
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ data: declaration, entitlement_count: sharesResult.rows.length });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(res, "Failed to create dividend declaration", error);
  } finally {
    client.release();
  }
});

// Mark all entitlements as paid
dividendRoutes.patch("/:id/mark-paid", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  let id = "";
  try {
    id = requireUuid(req.params.id, "id");
  } catch {
    return sendBadRequest(res, "Invalid dividend id");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE dividend_entitlement SET payment_status = 'paid', paid_at = now(), updated_at = now()
       WHERE dividend_id = $1 AND payment_status = 'pending'`,
      [id]
    );
    await client.query(
      `UPDATE dividend_declaration SET status = 'paid', updated_at = now() WHERE id = $1`,
      [id]
    );
    await client.query("COMMIT");
    res.json({ data: { id, status: "paid" } });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(res, "Failed to mark dividend as paid", error);
  } finally {
    client.release();
  }
});
