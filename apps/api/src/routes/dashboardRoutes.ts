import { Router } from "express";
import { pool } from "../db/pool";

export const dashboardRoutes = Router();

dashboardRoutes.get("/summary", async (_req, res) => {
  try {
    const [
      summaryResult,
      topOwnershipResult,
      recentAuditResult,
      slaSnapshotResult,
    ] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM entity) AS entity_count,
          (SELECT COUNT(*)::int FROM shareholder) AS shareholder_count,
          (
            SELECT COUNT(*)::int
            FROM shareholder
            WHERE status = 'active'
          ) AS active_shareholder_count,
          (
            SELECT COALESCE(SUM(quantity), 0)::float
            FROM share_ownership
            WHERE status = 'active'
          ) AS total_shares,
          (SELECT COUNT(*)::int FROM share_certificate) AS certificate_count,
          (
            SELECT COUNT(*)::int
            FROM share_certificate
            WHERE status = 'issued'
          ) AS issued_certificate_count,
          (
            SELECT COUNT(*)::int
            FROM share_certificate
            WHERE status = 'revoked'
              OR revocation_status = 'revoked'
          ) AS revoked_certificate_count,
          (SELECT COUNT(*)::int FROM share_transfer) AS transfer_count,
          (
            SELECT COUNT(*)::int
            FROM share_transfer
            WHERE status IN ('pending', 'pending_checker_1', 'pending_checker_2')
          ) AS pending_transfer_count,
          (
            SELECT COUNT(*)::int
            FROM share_transfer
            WHERE status = 'completed'
          ) AS completed_transfer_count,
          (
            SELECT COUNT(*)::int
            FROM approval_request
            WHERE status = 'pending'
          ) AS pending_approval_count,
          (
            SELECT COUNT(*)::int
            FROM approval_request
            WHERE status = 'approved'
          ) AS approved_approval_count,
          (
            SELECT COUNT(*)::int
            FROM approval_request
            WHERE status = 'pending'
              AND sla_due_date IS NOT NULL
              AND sla_due_date < now()
          ) AS overdue_approval_count,
          (
            SELECT COUNT(*)::int
            FROM legal_hold
            WHERE status = 'active'
          ) AS active_legal_hold_count,
          (
            SELECT COUNT(*)::int
            FROM transfer_freeze
            WHERE status = 'active'
          ) AS active_transfer_freeze_count,
          (SELECT COUNT(*)::int FROM audit_log) AS audit_log_count,
          (SELECT COUNT(*)::int FROM document_reference) AS document_reference_count,
          (SELECT COUNT(*)::int FROM communication_log) AS communication_count,
          (
            SELECT COUNT(*)::int FROM shareholder
            WHERE kyc_status = 'verified'
          ) AS kyc_verified_count,
          (
            SELECT COUNT(*)::int FROM shareholder
            WHERE kyc_expiry IS NOT NULL AND kyc_expiry < CURRENT_DATE
          ) AS kyc_expired_count,
          (
            SELECT COUNT(*)::int FROM shareholder
            WHERE kyc_expiry IS NOT NULL
              AND kyc_expiry >= CURRENT_DATE
              AND kyc_expiry <= CURRENT_DATE + interval '30 days'
          ) AS kyc_expiring_soon_count,
          (
            SELECT COUNT(*)::int FROM dividend_declaration
          ) AS dividend_count,
          (
            SELECT COALESCE(SUM(total_declared_amount), 0)::float
            FROM dividend_declaration WHERE status != 'cancelled'
          ) AS total_dividends_declared
      `),
      pool.query(`
        WITH shareholder_ownership AS (
          SELECT
            s.shareholder_id,
            s.legal_name AS shareholder_name,
            SUM(so.quantity) AS quantity
          FROM share_ownership so
          JOIN shareholder s ON s.shareholder_id = so.shareholder_id
          WHERE so.status = 'active'
          GROUP BY s.shareholder_id, s.legal_name
        ),
        total AS (
          SELECT COALESCE(SUM(quantity), 0) AS total_shares
          FROM shareholder_ownership
        )
        SELECT
          shareholder_name,
          quantity::float AS quantity,
          COALESCE(
            ROUND((quantity / NULLIF(total.total_shares, 0)) * 100, 2),
            0
          )::float AS ownership_percentage
        FROM shareholder_ownership, total
        ORDER BY quantity DESC, shareholder_name ASC
        LIMIT 5
      `),
      pool.query(`
        SELECT
          actor_id,
          action,
          table_name,
          timestamp_utc
        FROM audit_log
        ORDER BY timestamp_utc DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT
          request_type,
          stage,
          status,
          sla_due_date,
          CASE
            WHEN status = 'approved' OR stage = 'completed' THEN 'completed'
            WHEN status = 'pending'
              AND sla_due_date IS NOT NULL
              AND sla_due_date < now()
              THEN 'overdue'
            WHEN status = 'pending'
              AND sla_due_date IS NOT NULL
              AND sla_due_date <= now() + interval '2 days'
              THEN 'due_soon'
            WHEN status = 'pending' THEN 'on_track'
            ELSE status
          END AS computed_sla_status
        FROM approval_request
        ORDER BY
          CASE
            WHEN status = 'pending'
              AND sla_due_date IS NOT NULL
              AND sla_due_date < now()
              THEN 0
            WHEN status = 'pending'
              AND sla_due_date IS NOT NULL
              AND sla_due_date <= now() + interval '2 days'
              THEN 1
            WHEN status = 'pending' THEN 2
            ELSE 3
          END,
          sla_due_date ASC NULLS LAST,
          created_at DESC
        LIMIT 8
      `),
    ]);

    res.json({
      data: {
        ...summaryResult.rows[0],
        top_ownership_rows: topOwnershipResult.rows,
        recent_audit_actions: recentAuditResult.rows,
        sla_snapshot: slaSnapshotResult.rows,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch dashboard summary",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
