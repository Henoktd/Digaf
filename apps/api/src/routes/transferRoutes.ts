import { Router } from "express";
import { pool } from "../db/pool";

export const transferRoutes = Router();

transferRoutes.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        st.id AS transfer_id,
        e.legal_name AS entity_name,
        transferor.legal_name AS transferor_name,
        transferee.legal_name AS transferee_name,
        st.shares,
        st.status,
        st.maker_id,
        st.checker1_id,
        st.checker2_id,
        st.board_approval_required,
        st.board_approval_ref,
        st.encumbrance_check_status,
        st.kyc_check_status,
        st.bo_reverification_required,
        st.freeze_reference,
        st.supporting_documents,
        st.effective_date,
        st.created_at,
        ar.id AS approval_request_id,
        ar.stage AS approval_stage,
        ar.current_approver_id AS current_approver,
        ar.sla_due_date,
        ar.escalation_level
      FROM share_transfer st
      JOIN entity e ON e.entity_id = st.entity_id
      JOIN shareholder transferor ON transferor.shareholder_id = st.transferor_id
      JOIN shareholder transferee ON transferee.shareholder_id = st.transferee_id
      LEFT JOIN LATERAL (
        SELECT
          id,
          stage,
          current_approver_id,
          sla_due_date,
          escalation_level
        FROM approval_request
        WHERE request_type = 'share_transfer'
          AND reference_id = st.id
        ORDER BY created_at DESC
        LIMIT 1
      ) ar ON true
      ORDER BY st.created_at DESC
    `);

    res.json({
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch transfers",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
