"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareholderRoutes = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
const apiError_1 = require("../utils/apiError");
const validation_1 = require("../utils/validation");
exports.shareholderRoutes = (0, express_1.Router)();
const shareholderTypes = new Set(["individual", "institution"]);
const kycStatuses = new Set(["not_started", "pending", "verified", "expired"]);
const riskClassifications = new Set(["low", "medium", "high"]);
function normalizeOptionalString(value, fieldName) {
    if (value === undefined || value === null) {
        return null;
    }
    const stringValue = (0, validation_1.requireString)(value, fieldName).trim();
    return stringValue || null;
}
function normalizeOptionalDateString(value, fieldName) {
    const dateString = normalizeOptionalString(value, fieldName);
    if (!dateString) {
        return null;
    }
    const parsedDate = new Date(`${dateString}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== dateString) {
        throw new Error(`${fieldName} must be a valid date string`);
    }
    return dateString;
}
function normalizeOptionalBoolean(value, fieldName, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    if (typeof value !== "boolean") {
        throw new Error(`${fieldName} must be a boolean`);
    }
    return value;
}
exports.shareholderRoutes.get("/", async (_req, res) => {
    try {
        const result = await pool_1.pool.query(`
      SELECT
        shareholder_id,
        entity_id,
        legal_name,
        type,
        status,
        contact_details,
        kyc_status,
        kyc_expiry,
        risk_classification,
        proxy_eligible,
        relationship_start_date,
        created_at
      FROM shareholder
      ORDER BY legal_name ASC
    `);
        res.json({
            data: result.rows,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch shareholders",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.shareholderRoutes.post("/", async (req, res) => {
    let entityId = "";
    let legalName = "";
    let type = "";
    let status = "";
    let email = null;
    let phone = null;
    let kycStatus = "";
    let kycExpiry = null;
    let riskClassification = null;
    let proxyEligible = false;
    let relationshipStartDate = null;
    let actorId = "";
    try {
        entityId = (0, validation_1.requireUuid)(req.body?.entityId, "entityId");
        legalName = (0, validation_1.requireNonEmptyString)(req.body?.legalName, "legalName");
        type = (0, validation_1.requireNonEmptyString)(req.body?.type, "type");
        if (!shareholderTypes.has(type)) {
            throw new Error("type must be one of: individual, institution");
        }
        status = normalizeOptionalString(req.body?.status, "status") ?? "active";
        email = normalizeOptionalString(req.body?.email, "email");
        phone = normalizeOptionalString(req.body?.phone, "phone");
        kycStatus =
            normalizeOptionalString(req.body?.kycStatus, "kycStatus") ??
                "not_started";
        if (!kycStatuses.has(kycStatus)) {
            throw new Error("kycStatus must be one of: not_started, pending, verified, expired");
        }
        kycExpiry = normalizeOptionalDateString(req.body?.kycExpiry, "kycExpiry");
        riskClassification = normalizeOptionalString(req.body?.riskClassification, "riskClassification");
        if (riskClassification !== null &&
            !riskClassifications.has(riskClassification)) {
            throw new Error("riskClassification must be one of: low, medium, high");
        }
        proxyEligible = normalizeOptionalBoolean(req.body?.proxyEligible, "proxyEligible", false);
        relationshipStartDate = normalizeOptionalDateString(req.body?.relationshipStartDate, "relationshipStartDate");
        actorId = (0, validation_1.normalizeActorId)(req.body?.actorId);
    }
    catch (error) {
        return (0, apiError_1.sendBadRequest)(res, error instanceof Error ? error.message : "Invalid shareholder create request");
    }
    const client = await pool_1.pool.connect();
    try {
        await client.query("BEGIN");
        const entityResult = await client.query(`
      SELECT entity_id
      FROM entity
      WHERE entity_id = $1
      LIMIT 1
      `, [entityId]);
        if (entityResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return (0, apiError_1.sendNotFound)(res, "Entity not found");
        }
        const contactDetails = {
            email,
            phone,
        };
        const insertResult = await client.query(`
      INSERT INTO shareholder (
        entity_id,
        legal_name,
        type,
        status,
        contact_details,
        kyc_status,
        kyc_expiry,
        risk_classification,
        proxy_eligible,
        relationship_start_date
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5::jsonb,
        $6,
        $7::date,
        $8,
        $9,
        $10::date
      )
      RETURNING
        shareholder_id,
        entity_id,
        legal_name,
        type,
        status,
        contact_details,
        kyc_status,
        kyc_expiry,
        risk_classification,
        proxy_eligible,
        relationship_start_date,
        created_at
      `, [
            entityId,
            legalName,
            type,
            status,
            JSON.stringify(contactDetails),
            kycStatus,
            kycExpiry,
            riskClassification,
            proxyEligible,
            relationshipStartDate,
        ]);
        const shareholder = insertResult.rows[0];
        const shareholderSummary = {
            shareholder_id: shareholder.shareholder_id,
            entity_id: shareholder.entity_id,
            legal_name: shareholder.legal_name,
            type: shareholder.type,
            status: shareholder.status,
            contact_details: shareholder.contact_details,
            kyc_status: shareholder.kyc_status,
            kyc_expiry: shareholder.kyc_expiry,
            risk_classification: shareholder.risk_classification,
            proxy_eligible: shareholder.proxy_eligible,
            relationship_start_date: shareholder.relationship_start_date,
        };
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
        'shareholder_created',
        'shareholder',
        $3,
        null,
        $4::jsonb,
        $5
      )
      `, [
            entityId,
            actorId,
            shareholder.shareholder_id,
            JSON.stringify(shareholderSummary),
            req.ip ?? null,
        ]);
        await client.query("COMMIT");
        return res.status(201).json({
            data: shareholder,
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        return (0, apiError_1.sendServerError)(res, "Failed to create shareholder", error);
    }
    finally {
        client.release();
    }
});
exports.shareholderRoutes.patch("/:shareholderId/kyc", async (req, res) => {
    let shareholderId = "";
    let kycStatus = "";
    let kycExpiry = null;
    let riskClassification = "";
    let actorId = "";
    let decisionNotes = "";
    try {
        shareholderId = (0, validation_1.requireUuid)(req.params.shareholderId, "shareholderId");
        kycStatus = (0, validation_1.requireNonEmptyString)(req.body?.kycStatus, "kycStatus");
        if (!kycStatuses.has(kycStatus)) {
            throw new Error("kycStatus must be one of: not_started, pending, verified, expired");
        }
        kycExpiry = normalizeOptionalDateString(req.body?.kycExpiry, "kycExpiry");
        riskClassification = (0, validation_1.requireNonEmptyString)(req.body?.riskClassification, "riskClassification");
        if (!riskClassifications.has(riskClassification)) {
            throw new Error("riskClassification must be one of: low, medium, high");
        }
        actorId = (0, validation_1.normalizeActorId)(req.body?.actorId);
        decisionNotes = (0, validation_1.requireNonEmptyString)(req.body?.decisionNotes, "decisionNotes");
    }
    catch (error) {
        return (0, apiError_1.sendBadRequest)(res, error instanceof Error ? error.message : "Invalid shareholder KYC request");
    }
    const client = await pool_1.pool.connect();
    try {
        await client.query("BEGIN");
        const shareholderResult = await client.query(`
      SELECT
        shareholder_id,
        entity_id,
        legal_name,
        kyc_status,
        kyc_expiry,
        risk_classification
      FROM shareholder
      WHERE shareholder_id = $1
      FOR UPDATE
      `, [shareholderId]);
        if (shareholderResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return (0, apiError_1.sendNotFound)(res, "Shareholder not found");
        }
        const shareholder = shareholderResult.rows[0];
        const oldValue = {
            kyc_status: shareholder.kyc_status,
            kyc_expiry: shareholder.kyc_expiry,
            risk_classification: shareholder.risk_classification,
        };
        const updateResult = await client.query(`
      UPDATE shareholder
      SET
        kyc_status = $2,
        kyc_expiry = $3::date,
        risk_classification = $4
      WHERE shareholder_id = $1
      RETURNING
        shareholder_id,
        entity_id,
        legal_name,
        kyc_status,
        kyc_expiry,
        risk_classification
      `, [shareholderId, kycStatus, kycExpiry, riskClassification]);
        const kycRecordResult = await client.query(`
      SELECT id
      FROM kyc_record
      WHERE shareholder_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
      `, [shareholderId]);
        let kycRecord;
        if (kycRecordResult.rowCount === 0) {
            const insertKycResult = await client.query(`
        INSERT INTO kyc_record (
          shareholder_id,
          kyc_status,
          expiry_date,
          reviewer_id,
          approval_date,
          last_review_date
        )
        VALUES (
          $1,
          $2,
          $3::date,
          $4,
          CASE WHEN $2 = 'verified' THEN CURRENT_DATE ELSE null END,
          CURRENT_DATE
        )
        RETURNING
          id,
          kyc_status,
          expiry_date,
          reviewer_id,
          approval_date,
          last_review_date
        `, [shareholderId, kycStatus, kycExpiry, actorId]);
            kycRecord = insertKycResult.rows[0];
        }
        else {
            const updateKycResult = await client.query(`
        UPDATE kyc_record
        SET
          kyc_status = $2,
          expiry_date = $3::date,
          reviewer_id = $4,
          approval_date = CASE
            WHEN $2 = 'verified' THEN CURRENT_DATE
            ELSE null
          END,
          last_review_date = CURRENT_DATE
        WHERE id = $1
        RETURNING
          id,
          kyc_status,
          expiry_date,
          reviewer_id,
          approval_date,
          last_review_date
        `, [kycRecordResult.rows[0].id, kycStatus, kycExpiry, actorId]);
            kycRecord = updateKycResult.rows[0];
        }
        const updatedShareholder = updateResult.rows[0];
        const newValue = {
            kyc_status: updatedShareholder.kyc_status,
            kyc_expiry: updatedShareholder.kyc_expiry,
            risk_classification: updatedShareholder.risk_classification,
            decisionNotes,
        };
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
        'shareholder_kyc_updated',
        'shareholder',
        $3,
        $4::jsonb,
        $5::jsonb,
        $6
      )
      `, [
            updatedShareholder.entity_id,
            actorId,
            shareholderId,
            JSON.stringify(oldValue),
            JSON.stringify(newValue),
            req.ip ?? null,
        ]);
        await client.query("COMMIT");
        return res.json({
            data: {
                shareholder_id: updatedShareholder.shareholder_id,
                entity_id: updatedShareholder.entity_id,
                legal_name: updatedShareholder.legal_name,
                kyc_status: updatedShareholder.kyc_status,
                kyc_expiry: updatedShareholder.kyc_expiry,
                risk_classification: updatedShareholder.risk_classification,
                kyc_record_id: kycRecord.id,
                reviewer_id: kycRecord.reviewer_id,
                approval_date: kycRecord.approval_date,
                last_review_date: kycRecord.last_review_date,
            },
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        return (0, apiError_1.sendServerError)(res, "Failed to update shareholder KYC", error);
    }
    finally {
        client.release();
    }
});
exports.shareholderRoutes.get("/:shareholderId", async (req, res) => {
    let shareholderId = "";
    try {
        shareholderId = (0, validation_1.requireUuid)(req.params.shareholderId, "shareholderId");
    }
    catch (error) {
        return (0, apiError_1.sendBadRequest)(res, error instanceof Error ? error.message : "Invalid shareholder request");
    }
    try {
        const profileResult = await pool_1.pool.query(`
      SELECT
        s.shareholder_id,
        s.entity_id,
        e.legal_name AS entity_name,
        s.legal_name,
        s.type,
        s.status,
        s.contact_details,
        s.kyc_status,
        s.kyc_expiry,
        s.risk_classification,
        s.proxy_eligible,
        s.relationship_start_date,
        s.created_at
      FROM shareholder s
      JOIN entity e ON e.entity_id = s.entity_id
      WHERE s.shareholder_id = $1
      LIMIT 1
      `, [shareholderId]);
        if (profileResult.rowCount === 0) {
            return (0, apiError_1.sendNotFound)(res, "Shareholder not found");
        }
        const [ownershipResult, certificatesResult, outgoingTransfersResult, incomingTransfersResult, legalHoldsResult, documentsResult, communicationsResult,] = await Promise.all([
            pool_1.pool.query(`
        SELECT
          sc.class_name AS share_class,
          so.quantity,
          so.pledged_quantity,
          so.encumbered_quantity,
          so.effective_date,
          so.status
        FROM share_ownership so
        JOIN share_class sc ON sc.share_class_id = so.share_class_id
        WHERE so.shareholder_id = $1
        ORDER BY
          CASE WHEN so.status = 'active' THEN 0 ELSE 1 END,
          so.effective_date DESC,
          sc.class_name ASC
        `, [shareholderId]),
            pool_1.pool.query(`
        SELECT
          c.certificate_id,
          c.serial_number,
          sc.class_name AS share_class,
          c.quantity,
          c.issue_date,
          c.status,
          c.hash_algorithm,
          c.revocation_status
        FROM share_certificate c
        JOIN share_class sc ON sc.share_class_id = c.share_class_id
        WHERE c.shareholder_id = $1
        ORDER BY c.created_at DESC
        `, [shareholderId]),
            pool_1.pool.query(`
        SELECT
          st.id,
          transferee.legal_name AS transferee_name,
          st.shares,
          st.status,
          st.kyc_check_status,
          st.encumbrance_check_status,
          st.effective_date,
          st.created_at
        FROM share_transfer st
        JOIN shareholder transferee
          ON transferee.shareholder_id = st.transferee_id
        WHERE st.transferor_id = $1
        ORDER BY st.created_at DESC
        `, [shareholderId]),
            pool_1.pool.query(`
        SELECT
          st.id,
          transferor.legal_name AS transferor_name,
          st.shares,
          st.status,
          st.kyc_check_status,
          st.encumbrance_check_status,
          st.effective_date,
          st.created_at
        FROM share_transfer st
        JOIN shareholder transferor
          ON transferor.shareholder_id = st.transferor_id
        WHERE st.transferee_id = $1
        ORDER BY st.created_at DESC
        `, [shareholderId]),
            pool_1.pool.query(`
        SELECT
          lh.id,
          lh.hold_type,
          lh.reason,
          lh.status,
          lh.authority_reference,
          lh.imposed_by,
          lh.imposed_at
        FROM legal_hold lh
        WHERE lh.related_record_type = 'shareholder'
          AND lh.related_record_id = $1
        ORDER BY
          CASE WHEN lh.status = 'active' THEN 0 ELSE 1 END,
          lh.imposed_at DESC
        `, [shareholderId]),
            pool_1.pool.query(`
        WITH shareholder_records AS (
          SELECT $1::uuid AS related_id
          UNION
          SELECT c.certificate_id
          FROM share_certificate c
          WHERE c.shareholder_id = $1
          UNION
          SELECT st.id
          FROM share_transfer st
          WHERE st.transferor_id = $1
             OR st.transferee_id = $1
          UNION
          SELECT lh.id
          FROM legal_hold lh
          WHERE lh.related_record_type = 'shareholder'
            AND lh.related_record_id = $1
        )
        SELECT
          dr.id,
          dr.document_type,
          dr.library,
          dr.retention_category,
          dr.file_url,
          dr.legal_hold_id,
          dr.created_at
        FROM document_reference dr
        WHERE dr.related_id IN (SELECT related_id FROM shareholder_records)
           OR dr.legal_hold_id IN (
             SELECT lh.id
             FROM legal_hold lh
             WHERE lh.related_record_type = 'shareholder'
               AND lh.related_record_id = $1
           )
        ORDER BY dr.created_at DESC
        `, [shareholderId]),
            pool_1.pool.query(`
        SELECT
          cl.id,
          cl.type,
          cl.channel,
          cl.subject,
          cl.delivery_status,
          cl.sent_at,
          cl.created_at
        FROM communication_log cl
        WHERE cl.recipient_id = $1
        ORDER BY cl.created_at DESC
        `, [shareholderId]),
        ]);
        res.json({
            data: {
                profile: profileResult.rows[0],
                ownership: ownershipResult.rows,
                certificates: certificatesResult.rows,
                outgoing_transfers: outgoingTransfersResult.rows,
                incoming_transfers: incomingTransfersResult.rows,
                legal_holds: legalHoldsResult.rows,
                documents: documentsResult.rows,
                communications: communicationsResult.rows,
            },
        });
    }
    catch (error) {
        return (0, apiError_1.sendServerError)(res, "Failed to fetch shareholder profile", error);
    }
});
//# sourceMappingURL=shareholderRoutes.js.map