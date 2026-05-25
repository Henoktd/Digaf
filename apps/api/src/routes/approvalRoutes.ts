import { Router } from "express";
import { pool } from "../db/pool";

export const approvalRoutes = Router();

approvalRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ar.id,
        ar.entity_id,
        e.legal_name AS entity_name,
        ar.request_type,
        ar.reference_id,
        ar.stage,
        ar.current_approver_id,
        ar.status,
        ar.maker_id,
        ar.checker1_id,
        ar.checker2_id,
        ar.sla_due_date,
        ar.escalation_level,
        ar.escalation_triggered_at,
        ar.escalation_recipient,
        ar.decision_notes,
        ar.board_resolution_ref,
        ar.created_at,
        transferor.legal_name AS transferor_name,
        transferee.legal_name AS transferee_name,
        st.shares AS transfer_shares,
        st.status AS transfer_status,
        st.kyc_check_status,
        st.encumbrance_check_status,
        st.board_approval_required
      FROM approval_request ar
      JOIN entity e ON e.entity_id = ar.entity_id
      LEFT JOIN share_transfer st
        ON ar.request_type = 'share_transfer'
        AND st.id = ar.reference_id
      LEFT JOIN shareholder transferor
        ON transferor.shareholder_id = st.transferor_id
      LEFT JOIN shareholder transferee
        ON transferee.shareholder_id = st.transferee_id
      ORDER BY
        CASE WHEN ar.status = 'pending' THEN 0 ELSE 1 END,
        ar.sla_due_date ASC NULLS LAST,
        ar.created_at DESC
    `);

    res.json({
      data: result.rows,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch approvals",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
