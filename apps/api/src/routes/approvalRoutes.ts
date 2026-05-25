import { Router } from "express";
import { pool } from "../db/pool";

export const approvalRoutes = Router();

const checker2ApproverId = "senior.governance.local_dev";

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

approvalRoutes.post("/:approvalId/approve-checker-1", async (req, res) => {
  const { approvalId } = req.params;
  const actorId =
    typeof req.body?.actorId === "string" ? req.body.actorId.trim() : "";
  const decisionNotes =
    typeof req.body?.decisionNotes === "string"
      ? req.body.decisionNotes.trim()
      : "";

  if (!actorId) {
    return res.status(400).json({
      error: "actorId is required",
    });
  }

  if (!decisionNotes) {
    return res.status(400).json({
      error: "decisionNotes is required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const approvalResult = await client.query(
      `
        SELECT
          id,
          entity_id,
          request_type,
          reference_id,
          stage,
          current_approver_id,
          status,
          maker_id,
          checker1_id
        FROM approval_request
        WHERE id = $1
        FOR UPDATE
      `,
      [approvalId]
    );

    const approval = approvalResult.rows[0];

    if (!approval) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Approval request not found",
      });
    }

    if (approval.request_type !== "share_transfer") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Approval request is not for a share transfer",
      });
    }

    if (approval.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Approval request is not pending",
      });
    }

    if (approval.stage !== "checker_1_review") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Approval request is not at Checker 1 review",
      });
    }

    if (actorId === approval.maker_id) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Maker cannot approve their own request",
      });
    }

    const oldValue = {
      stage: approval.stage,
      status: approval.status,
      current_approver_id: approval.current_approver_id,
      checker1_id: approval.checker1_id,
    };

    const newValue = {
      stage: "checker_2_review",
      status: "pending",
      current_approver_id: checker2ApproverId,
      checker1_id: actorId,
      decisionNotes,
    };

    await client.query(
      `
        UPDATE approval_request
        SET
          checker1_id = $2,
          stage = 'checker_2_review',
          current_approver_id = $3,
          decision_notes = $4,
          status = 'pending'
        WHERE id = $1
      `,
      [approvalId, actorId, checker2ApproverId, decisionNotes]
    );

    const transferResult = await client.query(
      `
        UPDATE share_transfer
        SET
          checker1_id = $2,
          status = 'pending_checker_2'
        WHERE id = $1
        RETURNING status
      `,
      [approval.reference_id, actorId]
    );

    if (transferResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Linked share transfer not found",
      });
    }

    await client.query(
      `
        INSERT INTO audit_log (
          entity_id,
          actor_id,
          action,
          table_name,
          record_id,
          old_value_json,
          new_value_json,
          source_ip
        )
        VALUES (
          $1,
          $2,
          'share_transfer_checker_1_approved',
          'approval_request',
          $3,
          $4::jsonb,
          $5::jsonb,
          $6
        )
      `,
      [
        approval.entity_id,
        actorId,
        approvalId,
        JSON.stringify(oldValue),
        JSON.stringify(newValue),
        req.ip ?? null,
      ]
    );

    const updatedResult = await client.query(
      `
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
          st.status AS transfer_status
        FROM approval_request ar
        JOIN entity e ON e.entity_id = ar.entity_id
        LEFT JOIN share_transfer st
          ON ar.request_type = 'share_transfer'
          AND st.id = ar.reference_id
        WHERE ar.id = $1
      `,
      [approvalId]
    );

    await client.query("COMMIT");

    return res.json({
      data: updatedResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return res.status(500).json({
      error: "Failed to approve Checker 1",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    client.release();
  }
});
