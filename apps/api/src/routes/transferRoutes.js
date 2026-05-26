"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferRoutes = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
const apiError_1 = require("../utils/apiError");
const validation_1 = require("../utils/validation");
exports.transferRoutes = (0, express_1.Router)();
const checker1ApproverId = "governance.officer.local_dev";
function normalizePositiveShares(value) {
    const shares = typeof value === "number"
        ? value
        : typeof value === "string"
            ? Number(value)
            : Number.NaN;
    if (!Number.isFinite(shares) || shares <= 0) {
        throw new Error("shares must be a positive number");
    }
    return shares;
}
function normalizeSupportingDocuments(value) {
    if (value === undefined || value === null) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error("supportingDocuments must be an array");
    }
    return value;
}
function parseTransferRequestBody(body) {
    const entityId = (0, validation_1.requireUuid)(body?.entityId, "entityId");
    const transferorId = (0, validation_1.requireUuid)(body?.transferorId, "transferorId");
    const transfereeId = (0, validation_1.requireUuid)(body?.transfereeId, "transfereeId");
    const shares = normalizePositiveShares(body?.shares);
    const actorId = (0, validation_1.normalizeActorId)(body?.actorId);
    if (transferorId === transfereeId) {
        throw new Error("transferorId and transfereeId must not be the same");
    }
    return {
        entityId,
        transferorId,
        transfereeId,
        shares,
        actorId,
    };
}
async function buildTransferEligibility(client, input) {
    const blockingReasons = [];
    const warnings = [];
    const shareholderResult = await client.query(`
    SELECT
      shareholder_id,
      legal_name,
      kyc_status,
      kyc_expiry,
      kyc_status = 'expired'
        OR (kyc_expiry IS NOT NULL AND kyc_expiry < CURRENT_DATE) AS kyc_expired
    FROM shareholder
    WHERE entity_id = $1
      AND shareholder_id IN ($2, $3)
    `, [input.entityId, input.transferorId, input.transfereeId]);
    const shareholdersById = new Map(shareholderResult.rows.map((row) => [
        row.shareholder_id,
        row,
    ]));
    const transferor = shareholdersById.get(input.transferorId);
    const transferee = shareholdersById.get(input.transfereeId);
    if (!transferor) {
        blockingReasons.push("transferor_not_found_for_entity");
    }
    if (!transferee) {
        blockingReasons.push("transferee_not_found_for_entity");
    }
    if (transferor) {
        if (transferor.kyc_status !== "verified") {
            blockingReasons.push("transferor_kyc_not_verified");
        }
        if (transferor.kyc_expired) {
            blockingReasons.push("transferor_kyc_expired");
        }
    }
    if (transferee) {
        if (transferee.kyc_status !== "verified") {
            blockingReasons.push("transferee_kyc_not_verified");
        }
        if (transferee.kyc_expired) {
            blockingReasons.push("transferee_kyc_expired");
        }
    }
    const freezeResult = await client.query(`
    SELECT shareholder_id, COUNT(*)::int AS active_count
    FROM transfer_freeze
    WHERE entity_id = $1
      AND shareholder_id IN ($2, $3)
      AND status = 'active'
    GROUP BY shareholder_id
    `, [input.entityId, input.transferorId, input.transfereeId]);
    const freezeCounts = new Map(freezeResult.rows.map((row) => [row.shareholder_id, row.active_count]));
    const transferorFreezeActive = Number(freezeCounts.get(input.transferorId) ?? 0) > 0;
    const transfereeFreezeActive = Number(freezeCounts.get(input.transfereeId) ?? 0) > 0;
    if (transferorFreezeActive) {
        blockingReasons.push("transferor_transfer_freeze_active");
    }
    if (transfereeFreezeActive) {
        blockingReasons.push("transferee_transfer_freeze_active");
    }
    const legalHoldResult = await client.query(`
    SELECT related_record_id AS shareholder_id, COUNT(*)::int AS active_count
    FROM legal_hold
    WHERE entity_id = $1
      AND related_record_type = 'shareholder'
      AND related_record_id IN ($2, $3)
      AND status = 'active'
    GROUP BY related_record_id
    `, [input.entityId, input.transferorId, input.transfereeId]);
    const legalHoldCounts = new Map(legalHoldResult.rows.map((row) => [
        row.shareholder_id,
        row.active_count,
    ]));
    const transferorLegalHoldActive = Number(legalHoldCounts.get(input.transferorId) ?? 0) > 0;
    const transfereeLegalHoldActive = Number(legalHoldCounts.get(input.transfereeId) ?? 0) > 0;
    if (transferorLegalHoldActive) {
        blockingReasons.push("transferor_legal_hold_active");
    }
    if (transfereeLegalHoldActive) {
        blockingReasons.push("transferee_legal_hold_active");
    }
    const ownershipResult = await client.query(`
    SELECT
      COUNT(*)::int AS active_ownership_count,
      COALESCE(SUM(quantity - pledged_quantity - encumbered_quantity), 0) AS available_shares,
      COALESCE(SUM(pledged_quantity), 0) AS pledged_quantity,
      COALESCE(SUM(encumbered_quantity), 0) AS encumbered_quantity
    FROM share_ownership
    WHERE shareholder_id = $1
      AND status = 'active'
    `, [input.transferorId]);
    const ownership = ownershipResult.rows[0];
    const availableSharesNumber = Number(ownership.available_shares);
    if (Number(ownership.active_ownership_count) === 0) {
        blockingReasons.push("transferor_has_no_active_share_ownership");
    }
    if (input.shares > availableSharesNumber) {
        blockingReasons.push("insufficient_available_shares");
    }
    if (Number(ownership.pledged_quantity) > 0) {
        warnings.push("transferor_has_pledged_shares");
    }
    if (Number(ownership.encumbered_quantity) > 0) {
        warnings.push("transferor_has_encumbered_shares");
    }
    return {
        eligible: blockingReasons.length === 0,
        blockingReasons,
        warnings,
        availableShares: String(ownership.available_shares),
        transferorKycStatus: transferor?.kyc_status ?? "not_found",
        transfereeKycStatus: transferee?.kyc_status ?? "not_found",
        transferorFreezeActive,
        transfereeFreezeActive,
        transferorLegalHoldActive,
        transfereeLegalHoldActive,
    };
}
exports.transferRoutes.get("/", async (_req, res) => {
    try {
        const result = await pool_1.pool.query(`
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
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch transfers",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.transferRoutes.post("/eligibility-check", async (req, res) => {
    let input;
    try {
        input = parseTransferRequestBody(req.body);
    }
    catch (error) {
        return (0, apiError_1.sendBadRequest)(res, error instanceof Error
            ? error.message
            : "Invalid transfer eligibility request");
    }
    try {
        const eligibility = await buildTransferEligibility(pool_1.pool, input);
        return res.json({
            data: eligibility,
        });
    }
    catch (error) {
        return (0, apiError_1.sendServerError)(res, "Failed to check transfer eligibility", error);
    }
});
exports.transferRoutes.post("/", async (req, res) => {
    let input;
    let supportingDocuments = [];
    try {
        input = parseTransferRequestBody(req.body);
        supportingDocuments = normalizeSupportingDocuments(req.body?.supportingDocuments);
    }
    catch (error) {
        return (0, apiError_1.sendBadRequest)(res, error instanceof Error ? error.message : "Invalid transfer create request");
    }
    const client = await pool_1.pool.connect();
    try {
        await client.query("BEGIN");
        const eligibility = await buildTransferEligibility(client, input);
        if (!eligibility.eligible) {
            await client.query("ROLLBACK");
            return (0, apiError_1.sendBadRequest)(res, "Transfer is not eligible", {
                blockingReasons: eligibility.blockingReasons,
            });
        }
        const encumbranceCheckStatus = eligibility.warnings.length > 0 ? "warning" : "passed";
        const transferResult = await client.query(`
      INSERT INTO share_transfer (
        entity_id,
        transferor_id,
        transferee_id,
        shares,
        status,
        maker_id,
        board_approval_required,
        encumbrance_check_status,
        kyc_check_status,
        bo_reverification_required,
        supporting_documents
      )
      VALUES (
        $1,
        $2,
        $3,
        $4::numeric,
        'pending_checker_1',
        $5,
        false,
        $6,
        'passed',
        false,
        $7::jsonb
      )
      RETURNING
        id,
        entity_id,
        transferor_id,
        transferee_id,
        shares,
        status,
        maker_id,
        board_approval_required,
        encumbrance_check_status,
        kyc_check_status,
        bo_reverification_required,
        supporting_documents,
        created_at
      `, [
            input.entityId,
            input.transferorId,
            input.transfereeId,
            input.shares,
            input.actorId,
            encumbranceCheckStatus,
            JSON.stringify(supportingDocuments),
        ]);
        const transfer = transferResult.rows[0];
        const approvalResult = await client.query(`
      INSERT INTO approval_request (
        entity_id,
        request_type,
        reference_id,
        stage,
        current_approver_id,
        status,
        maker_id,
        sla_due_date
      )
      VALUES (
        $1,
        'share_transfer',
        $2,
        'checker_1_review',
        $3,
        'pending',
        $4,
        now() + interval '5 days'
      )
      RETURNING
        id,
        entity_id,
        request_type,
        reference_id,
        stage,
        current_approver_id,
        status,
        maker_id,
        sla_due_date,
        created_at
      `, [input.entityId, transfer.id, checker1ApproverId, input.actorId]);
        const approvalRequest = approvalResult.rows[0];
        await client.query(`
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
        'share_transfer_created',
        'share_transfer',
        $3,
        null,
        $4::jsonb,
        $5
      )
      `, [
            input.entityId,
            input.actorId,
            transfer.id,
            JSON.stringify({
                transfer,
                approval_request_id: approvalRequest.id,
                eligibility,
            }),
            req.ip ?? null,
        ]);
        await client.query("COMMIT");
        return res.status(201).json({
            data: {
                transfer,
                approval_request: approvalRequest,
            },
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        return (0, apiError_1.sendServerError)(res, "Failed to create share transfer", error);
    }
    finally {
        client.release();
    }
});
//# sourceMappingURL=transferRoutes.js.map