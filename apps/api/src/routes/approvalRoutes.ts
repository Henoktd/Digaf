import { Router } from "express";
import { pool } from "../db/pool";
import {
  sendBadRequest,
  sendConflict,
  sendNotFound,
  sendServerError,
} from "../utils/apiError";
import {
  normalizeActorId,
  requireNonEmptyString,
  requireUuid,
} from "../utils/validation";

export const approvalRoutes = Router();

const checker2ApproverId = "senior.governance.local_dev";

async function getApprovalActionSummary(client: any, approvalId: string) {
  const summaryResult = await client.query(
    `
      SELECT
        ar.id AS approval_id,
        ar.stage,
        ar.status AS approval_status,
        ar.checker1_id,
        ar.checker2_id,
        st.id AS transfer_id,
        st.status AS transfer_status
      FROM approval_request ar
      LEFT JOIN share_transfer st
        ON ar.request_type = 'share_transfer'
        AND st.id = ar.reference_id
      WHERE ar.id = $1
    `,
    [approvalId]
  );

  const summary = summaryResult.rows[0];

  return {
    approval: {
      id: summary.approval_id,
      stage: summary.stage,
      status: summary.approval_status,
      checker1_id: summary.checker1_id,
      checker2_id: summary.checker2_id,
    },
    transfer: {
      id: summary.transfer_id,
      status: summary.transfer_status,
    },
  };
}

function buildApprovalActionResponse(summary: any, extraData = {}) {
  return {
    id: summary.approval.id,
    stage: summary.approval.stage,
    status: summary.approval.status,
    checker1_id: summary.approval.checker1_id,
    checker2_id: summary.approval.checker2_id,
    transfer_id: summary.transfer.id,
    transfer_status: summary.transfer.status,
    approval: summary.approval,
    transfer: summary.transfer,
    ...extraData,
  };
}

function sendAlreadyCompletedConflict(res: any, approval: any) {
  return sendConflict(res, "Approval request is already completed", {
    approval: {
      id: approval.id,
      stage: approval.stage,
      status: approval.status,
      checker1_id: approval.checker1_id,
      checker2_id: approval.checker2_id,
    },
    transfer: {
      id: approval.reference_id,
    },
  });
}

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
  let approvalId = "";
  let actorId = "";
  let decisionNotes = "";

  try {
    approvalId = requireUuid(req.params.approvalId, "approvalId");
    actorId = normalizeActorId(req.body?.actorId);
    decisionNotes = requireNonEmptyString(
      req.body?.decisionNotes,
      "decisionNotes"
    );
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid approval request"
    );
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
          checker1_id,
          checker2_id
        FROM approval_request
        WHERE id = $1
        FOR UPDATE
      `,
      [approvalId]
    );

    const approval = approvalResult.rows[0];

    if (!approval) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Approval request not found");
    }

    if (approval.request_type !== "share_transfer") {
      await client.query("ROLLBACK");
      return sendConflict(
        res,
        "Approval request is not for a share transfer"
      );
    }

    if (approval.status === "approved" || approval.stage === "completed") {
      await client.query("ROLLBACK");
      return sendAlreadyCompletedConflict(res, approval);
    }

    if (approval.status !== "pending") {
      await client.query("ROLLBACK");
      return sendConflict(res, "Approval request is not pending");
    }

    if (approval.stage !== "checker_1_review") {
      await client.query("ROLLBACK");
      return sendConflict(
        res,
        "Approval request is not at Checker 1 review"
      );
    }

    if (actorId === approval.maker_id) {
      await client.query("ROLLBACK");
      return sendConflict(res, "Maker cannot approve their own request");
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
        RETURNING id, status
      `,
      [approval.reference_id, actorId]
    );

    if (transferResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Linked share transfer not found");
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

    const summary = await getApprovalActionSummary(client, approvalId);

    await client.query("COMMIT");

    return res.json({
      data: buildApprovalActionResponse(summary),
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to approve Checker 1", error);
  } finally {
    client.release();
  }
});

approvalRoutes.post("/:approvalId/approve-checker-2", async (req, res) => {
  let approvalId = "";
  let actorId = "";
  let decisionNotes = "";

  try {
    approvalId = requireUuid(req.params.approvalId, "approvalId");
    actorId = normalizeActorId(req.body?.actorId);
    decisionNotes = requireNonEmptyString(
      req.body?.decisionNotes,
      "decisionNotes"
    );
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid approval request"
    );
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
          checker1_id,
          checker2_id
        FROM approval_request
        WHERE id = $1
        FOR UPDATE
      `,
      [approvalId]
    );

    const approval = approvalResult.rows[0];

    if (!approval) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Approval request not found");
    }

    if (approval.request_type !== "share_transfer") {
      await client.query("ROLLBACK");
      return sendConflict(
        res,
        "Approval request is not for a share transfer"
      );
    }

    if (approval.status === "approved" || approval.stage === "completed") {
      await client.query("ROLLBACK");
      return sendAlreadyCompletedConflict(res, approval);
    }

    if (approval.status !== "pending") {
      await client.query("ROLLBACK");
      return sendConflict(res, "Approval request is not pending");
    }

    if (approval.stage !== "checker_2_review") {
      await client.query("ROLLBACK");
      return sendConflict(
        res,
        "Approval request is not at Checker 2 review"
      );
    }

    if (actorId === approval.maker_id) {
      await client.query("ROLLBACK");
      return sendConflict(res, "Maker cannot approve their own request");
    }

    if (actorId === approval.checker1_id) {
      await client.query("ROLLBACK");
      return sendConflict(res, "Checker 1 cannot approve as Checker 2");
    }

    if (!approval.checker1_id) {
      await client.query("ROLLBACK");
      return sendConflict(res, "Checker 1 approval is required first");
    }

    const transferResult = await client.query(
      `
        SELECT
          id,
          entity_id,
          transferor_id,
          transferee_id,
          shares,
          status,
          checker1_id,
          checker2_id,
          board_approval_required,
          board_approval_ref,
          encumbrance_check_status,
          kyc_check_status,
          freeze_reference
        FROM share_transfer
        WHERE id = $1
        FOR UPDATE
      `,
      [approval.reference_id]
    );

    const transfer = transferResult.rows[0];

    if (!transfer) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Linked share transfer not found");
    }

    if (transfer.status !== "pending_checker_2") {
      await client.query("ROLLBACK");
      return sendConflict(res, "Share transfer is not pending Checker 2");
    }

    if (transfer.kyc_check_status !== "passed") {
      await client.query("ROLLBACK");
      return sendConflict(res, "KYC check has not passed");
    }

    if (transfer.encumbrance_check_status !== "passed") {
      await client.query("ROLLBACK");
      return sendConflict(res, "Encumbrance check has not passed");
    }

    if (transfer.freeze_reference !== null) {
      await client.query("ROLLBACK");
      return sendConflict(
        res,
        "Share transfer is blocked by a freeze reference"
      );
    }

    if (transfer.board_approval_required && !transfer.board_approval_ref) {
      await client.query("ROLLBACK");
      return sendConflict(res, "Board approval reference is required");
    }

    const transferorOwnershipResult = await client.query(
      `
        SELECT
          id,
          share_class_id,
          quantity,
          pledged_quantity,
          encumbered_quantity,
          quantity - pledged_quantity - encumbered_quantity AS available_shares
        FROM share_ownership
        WHERE shareholder_id = $1
          AND status = 'active'
          AND quantity - pledged_quantity - encumbered_quantity >= $2::numeric
        ORDER BY effective_date ASC, created_at ASC
        LIMIT 1
        FOR UPDATE
      `,
      [transfer.transferor_id, transfer.shares]
    );

    const transferorOwnership = transferorOwnershipResult.rows[0];

    if (!transferorOwnership) {
      await client.query("ROLLBACK");
      return sendConflict(
        res,
        "Transferor does not have enough available shares"
      );
    }

    const transferorUpdateResult = await client.query(
      `
        UPDATE share_ownership
        SET quantity = quantity - $2::numeric
        WHERE id = $1
        RETURNING quantity
      `,
      [transferorOwnership.id, transfer.shares]
    );

    const transfereeOwnershipResult = await client.query(
      `
        SELECT
          id,
          quantity
        FROM share_ownership
        WHERE shareholder_id = $1
          AND share_class_id = $2
          AND status = 'active'
        ORDER BY effective_date ASC, created_at ASC
        LIMIT 1
        FOR UPDATE
      `,
      [transfer.transferee_id, transferorOwnership.share_class_id]
    );

    const transfereeOwnership = transfereeOwnershipResult.rows[0];
    let transfereeAfterQuantity = "";

    if (transfereeOwnership) {
      const transfereeUpdateResult = await client.query(
        `
          UPDATE share_ownership
          SET quantity = quantity + $2::numeric
          WHERE id = $1
          RETURNING quantity
        `,
        [transfereeOwnership.id, transfer.shares]
      );
      transfereeAfterQuantity = transfereeUpdateResult.rows[0].quantity;
    } else {
      const transfereeInsertResult = await client.query(
        `
          INSERT INTO share_ownership (
            shareholder_id,
            share_class_id,
            quantity,
            pledged_quantity,
            encumbered_quantity,
            effective_date,
            status
          )
          VALUES (
            $1,
            $2,
            $3::numeric,
            0,
            0,
            CURRENT_DATE,
            'active'
          )
          RETURNING quantity
        `,
        [transfer.transferee_id, transferorOwnership.share_class_id, transfer.shares]
      );
      transfereeAfterQuantity = transfereeInsertResult.rows[0].quantity;
    }

    const transferorBeforeQuantity = transferorOwnership.quantity;
    const transferorAfterQuantity = transferorUpdateResult.rows[0].quantity;
    const transfereeBeforeQuantity = transfereeOwnership
      ? transfereeOwnership.quantity
      : "0";

    await client.query(
      `
        INSERT INTO ownership_transaction (
          entity_id,
          type,
          shareholder_id,
          share_class_id,
          board_approval_ref,
          before_qty,
          after_qty
        )
        VALUES
          ($1, 'transfer_out', $2, $3, $4, $5::numeric, $6::numeric),
          ($1, 'transfer_in', $7, $3, $4, $8::numeric, $9::numeric)
      `,
      [
        transfer.entity_id,
        transfer.transferor_id,
        transferorOwnership.share_class_id,
        transfer.board_approval_ref,
        transferorBeforeQuantity,
        transferorAfterQuantity,
        transfer.transferee_id,
        transfereeBeforeQuantity,
        transfereeAfterQuantity,
      ]
    );

    const oldValue = {
      approval: {
        stage: approval.stage,
        status: approval.status,
        current_approver_id: approval.current_approver_id,
        checker2_id: approval.checker2_id,
      },
      transfer: {
        status: transfer.status,
        checker2_id: transfer.checker2_id,
      },
    };

    const newValue = {
      approval: {
        stage: "completed",
        status: "approved",
        current_approver_id: null,
        checker2_id: actorId,
        decisionNotes,
      },
      transfer: {
        status: "completed",
        checker2_id: actorId,
        effective_date: "CURRENT_DATE",
      },
    };

    await client.query(
      `
        UPDATE approval_request
        SET
          checker2_id = $2,
          stage = 'completed',
          current_approver_id = null,
          status = 'approved',
          decision_notes = $3
        WHERE id = $1
      `,
      [approvalId, actorId, decisionNotes]
    );

    await client.query(
      `
        UPDATE share_transfer
        SET
          checker2_id = $2,
          status = 'completed',
          effective_date = CURRENT_DATE
        WHERE id = $1
      `,
      [transfer.id, actorId]
    );

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
          'share_transfer_checker_2_approved_completed',
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

    const summaryResult = await client.query(
      `
        SELECT
          ar.id AS approval_id,
          ar.entity_id,
          e.legal_name AS entity_name,
          ar.request_type,
          ar.reference_id,
          ar.stage,
          ar.current_approver_id,
          ar.status AS approval_status,
          ar.maker_id,
          ar.checker1_id,
          ar.checker2_id,
          ar.decision_notes,
          st.id AS transfer_id,
          st.status AS transfer_status,
          st.shares AS transfer_shares,
          st.effective_date,
          st.kyc_check_status,
          st.encumbrance_check_status,
          transferor.legal_name AS transferor_name,
          transferee.legal_name AS transferee_name
        FROM approval_request ar
        JOIN entity e ON e.entity_id = ar.entity_id
        JOIN share_transfer st ON st.id = ar.reference_id
        JOIN shareholder transferor
          ON transferor.shareholder_id = st.transferor_id
        JOIN shareholder transferee
          ON transferee.shareholder_id = st.transferee_id
        WHERE ar.id = $1
      `,
      [approvalId]
    );

    await client.query("COMMIT");

    const summary = {
      approval: {
        id: summaryResult.rows[0].approval_id,
        stage: summaryResult.rows[0].stage,
        status: summaryResult.rows[0].approval_status,
        checker1_id: summaryResult.rows[0].checker1_id,
        checker2_id: summaryResult.rows[0].checker2_id,
      },
      transfer: {
        id: summaryResult.rows[0].transfer_id,
        status: summaryResult.rows[0].transfer_status,
      },
    };

    return res.json({
      data: buildApprovalActionResponse(summary, {
        approval: {
          id: summaryResult.rows[0].approval_id,
          entity_id: summaryResult.rows[0].entity_id,
          entity_name: summaryResult.rows[0].entity_name,
          request_type: summaryResult.rows[0].request_type,
          reference_id: summaryResult.rows[0].reference_id,
          stage: summaryResult.rows[0].stage,
          current_approver_id: summaryResult.rows[0].current_approver_id,
          status: summaryResult.rows[0].approval_status,
          maker_id: summaryResult.rows[0].maker_id,
          checker1_id: summaryResult.rows[0].checker1_id,
          checker2_id: summaryResult.rows[0].checker2_id,
          decision_notes: summaryResult.rows[0].decision_notes,
        },
        transfer: {
          id: summaryResult.rows[0].transfer_id,
          status: summaryResult.rows[0].transfer_status,
          shares: summaryResult.rows[0].transfer_shares,
          effective_date: summaryResult.rows[0].effective_date,
          kyc_check_status: summaryResult.rows[0].kyc_check_status,
          encumbrance_check_status: summaryResult.rows[0].encumbrance_check_status,
          transferor_name: summaryResult.rows[0].transferor_name,
          transferee_name: summaryResult.rows[0].transferee_name,
        },
        ownership: {
          share_class_id: transferorOwnership.share_class_id,
          transferor_before_qty: transferorBeforeQuantity,
          transferor_after_qty: transferorAfterQuantity,
          transferee_before_qty: transfereeBeforeQuantity,
          transferee_after_qty: transfereeAfterQuantity,
        },
      }),
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to approve Checker 2", error);
  } finally {
    client.release();
  }
});
