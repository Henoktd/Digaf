"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slaRoutes = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
exports.slaRoutes = (0, express_1.Router)();
exports.slaRoutes.get("/", async (_req, res) => {
    try {
        const result = await pool_1.pool.query(`
      WITH sla_items AS (
        SELECT
          ar.id,
          ar.entity_id,
          e.legal_name AS entity_name,
          ar.request_type,
          ar.reference_id,
          ar.stage,
          ar.status,
          ar.current_approver_id,
          ar.maker_id,
          ar.checker1_id,
          ar.checker2_id,
          ar.sla_due_date,
          ar.escalation_level,
          ar.escalation_triggered_at,
          ar.escalation_recipient,
          ar.created_at,
          transferor.legal_name AS transferor_name,
          transferee.legal_name AS transferee_name,
          st.shares AS transfer_shares,
          st.status AS transfer_status,
          CASE
            WHEN ar.status = 'approved' THEN 'completed'
            WHEN ar.status = 'pending' AND ar.sla_due_date < now() THEN 'overdue'
            WHEN ar.status = 'pending'
              AND ar.sla_due_date <= now() + interval '2 days'
              THEN 'due_soon'
            ELSE 'on_track'
          END AS computed_sla_status,
          CASE
            WHEN ar.sla_due_date IS NULL THEN null
            ELSE CEIL(
              EXTRACT(EPOCH FROM (ar.sla_due_date - now())) / 86400.0
            )::integer
          END AS days_remaining
        FROM approval_request ar
        JOIN entity e ON e.entity_id = ar.entity_id
        LEFT JOIN share_transfer st
          ON ar.request_type = 'share_transfer'
          AND st.id = ar.reference_id
        LEFT JOIN shareholder transferor
          ON transferor.shareholder_id = st.transferor_id
        LEFT JOIN shareholder transferee
          ON transferee.shareholder_id = st.transferee_id
      )
      SELECT
        id,
        entity_id,
        entity_name,
        request_type,
        reference_id,
        stage,
        status,
        current_approver_id,
        maker_id,
        checker1_id,
        checker2_id,
        sla_due_date,
        escalation_level,
        escalation_triggered_at,
        escalation_recipient,
        created_at,
        transferor_name,
        transferee_name,
        transfer_shares,
        transfer_status,
        computed_sla_status,
        days_remaining
      FROM sla_items
      ORDER BY
        CASE computed_sla_status
          WHEN 'overdue' THEN 0
          WHEN 'due_soon' THEN 1
          WHEN 'on_track' THEN 2
          ELSE 3
        END,
        sla_due_date ASC NULLS LAST,
        created_at DESC
    `);
        res.json({
            data: result.rows,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch SLA monitor",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
//# sourceMappingURL=slaRoutes.js.map