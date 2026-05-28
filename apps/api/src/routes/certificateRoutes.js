"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateRoutes = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
const certificateCrypto_1 = require("../services/certificateCrypto");
const apiError_1 = require("../utils/apiError");
const validation_1 = require("../utils/validation");
exports.certificateRoutes = (0, express_1.Router)();
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function formatCertificateDate(value) {
    if (!value)
        return "Not set";
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    return value;
}
function formatWrappedToken(value) {
    if (!value)
        return "Not generated";
    return value.match(/.{1,16}/g)?.join(" ") ?? value;
}
function buildPublicVerificationResponse(certificate) {
    let hashVerificationResult = "hash_missing";
    if (certificate.certificate_hash && certificate.issue_date) {
        const canonicalString = (0, certificateCrypto_1.buildCanonicalCertificateString)({
            entityId: certificate.entity_id,
            serialNumber: certificate.serial_number,
            shareholderId: certificate.shareholder_id,
            shareClassId: certificate.share_class_id,
            quantity: certificate.quantity,
            issueDate: certificate.issue_date.toISOString().slice(0, 10),
            issuingAuthority: certificate.issuing_company,
        });
        const recomputedHash = (0, certificateCrypto_1.generateCertificateHash)(canonicalString);
        const recomputedSignatureToken = (0, certificateCrypto_1.generateSignatureToken)(recomputedHash);
        const hashMatches = recomputedHash === certificate.certificate_hash;
        const tokenMatches = recomputedSignatureToken === certificate.signature_token;
        if (hashMatches && tokenMatches) {
            hashVerificationResult = "valid";
        }
        else {
            hashVerificationResult = "tamper_detected";
        }
    }
    return {
        serial_number: certificate.serial_number,
        issuing_company: certificate.issuing_company,
        share_class: certificate.share_class,
        quantity: certificate.quantity,
        issue_date: certificate.issue_date,
        status: hashVerificationResult === "tamper_detected"
            ? "tampered"
            : certificate.status,
        revocation_status: certificate.revocation_status,
        hash_algorithm: certificate.hash_algorithm,
        hash_generated_at: certificate.hash_generated_at,
        hash_verification_result: hashVerificationResult,
        verification_timestamp: certificate.verification_timestamp,
    };
}
async function fetchPublicVerificationCertificate(whereClause, value) {
    const result = await pool_1.pool.query(`
    SELECT
      c.certificate_id,
      c.entity_id,
      c.serial_number,
      c.shareholder_id,
      c.share_class_id,
      c.quantity,
      c.issue_date,
      c.status,
      c.revocation_status,
      c.certificate_hash,
      c.hash_algorithm,
      c.hash_generated_at,
      c.signature_token,
      e.legal_name AS issuing_company,
      sc.class_name AS share_class,
      now() AS verification_timestamp
    FROM share_certificate c
    JOIN entity e ON e.entity_id = c.entity_id
    JOIN share_class sc ON sc.share_class_id = c.share_class_id
    WHERE ${whereClause}
    LIMIT 1
    `, [value]);
    return result.rows[0];
}
exports.certificateRoutes.get("/", async (_req, res) => {
    try {
        const result = await pool_1.pool.query(`
      SELECT
        c.certificate_id,
        c.entity_id,
        e.legal_name AS entity_name,
        c.serial_number,
        c.shareholder_id,
        s.legal_name AS shareholder_name,
        c.share_class_id,
        sc.class_name AS share_class,
        c.quantity,
        c.issue_date,
        c.status,
        c.qr_token,
        c.certificate_hash,
        c.hash_algorithm,
        c.hash_generated_at,
        c.revocation_status,
        c.reissue_reference,
        c.created_at
      FROM share_certificate c
      JOIN entity e ON e.entity_id = c.entity_id
      JOIN shareholder s ON s.shareholder_id = c.shareholder_id
      JOIN share_class sc ON sc.share_class_id = c.share_class_id
      ORDER BY c.created_at DESC
    `);
        res.json({
            data: result.rows,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch certificates",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.certificateRoutes.get("/:certificateId/render-data", async (req, res) => {
    try {
        const certificateId = (0, validation_1.requireUuid)(req.params.certificateId, "certificateId");
        const result = await pool_1.pool.query(`
      SELECT
        c.certificate_id,
        c.serial_number,
        e.legal_name AS issuing_company,
        s.legal_name AS shareholder_name,
        sc.class_name AS share_class,
        c.quantity,
        c.issue_date,
        c.status,
        c.revocation_status,
        c.certificate_hash,
        c.hash_algorithm,
        c.hash_generated_at,
        c.qr_token
      FROM share_certificate c
      JOIN entity e ON e.entity_id = c.entity_id
      JOIN shareholder s ON s.shareholder_id = c.shareholder_id
      JOIN share_class sc ON sc.share_class_id = c.share_class_id
      WHERE c.certificate_id = $1
      LIMIT 1
      `, [certificateId]);
        if (result.rowCount === 0) {
            return (0, apiError_1.sendNotFound)(res, "Certificate not found");
        }
        const certificate = result.rows[0];
        const generatedAt = new Date().toISOString();
        void pool_1.pool
            .query(`
        INSERT INTO certificate_event (
          certificate_id,
          event_type,
          actor_id,
          notes
        )
        VALUES (
          $1,
          'render_data_accessed',
          'system.render_preview',
          'Certificate render data accessed for PDF preview'
        )
        `, [certificateId])
            .catch(() => undefined);
        res.json({
            data: {
                certificate_id: certificate.certificate_id,
                serial_number: certificate.serial_number,
                issuing_company: certificate.issuing_company,
                shareholder_name: certificate.shareholder_name,
                share_class: certificate.share_class,
                quantity: certificate.quantity,
                issue_date: certificate.issue_date,
                status: certificate.status,
                revocation_status: certificate.revocation_status,
                certificate_hash: certificate.certificate_hash,
                hash_algorithm: certificate.hash_algorithm,
                hash_generated_at: certificate.hash_generated_at,
                qr_token: certificate.qr_token,
                public_verification_url: `/qr?serialNumber=${encodeURIComponent(certificate.serial_number)}`,
                render_metadata: {
                    certificate_title: "Share Certificate",
                    template_version: "pdf-preview-v1",
                    generated_at: generatedAt,
                    disclaimer: "PDF generation is not implemented yet. This payload is certificate-safe render data for future PDF template generation.",
                },
            },
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("certificateId")) {
            return (0, apiError_1.sendBadRequest)(res, error.message);
        }
        return (0, apiError_1.sendServerError)(res, "Failed to fetch certificate render data", error);
    }
});
exports.certificateRoutes.get("/:certificateId/print-preview", async (req, res) => {
    try {
        const certificateId = (0, validation_1.requireUuid)(req.params.certificateId, "certificateId");
        const result = await pool_1.pool.query(`
      SELECT
        c.certificate_id,
        c.serial_number,
        e.legal_name AS issuing_company,
        s.legal_name AS shareholder_name,
        sc.class_name AS share_class,
        c.quantity,
        c.issue_date,
        c.status,
        c.revocation_status,
        c.certificate_hash,
        c.hash_algorithm,
        c.qr_token,
        c.signature_token
      FROM share_certificate c
      JOIN entity e ON e.entity_id = c.entity_id
      JOIN shareholder s ON s.shareholder_id = c.shareholder_id
      JOIN share_class sc ON sc.share_class_id = c.share_class_id
      WHERE c.certificate_id = $1
      LIMIT 1
      `, [certificateId]);
        if (result.rowCount === 0) {
            return (0, apiError_1.sendNotFound)(res, "Certificate not found");
        }
        const certificate = result.rows[0];
        const verificationUrl = `https://<digaf-governance-demo-url>/qr?serialNumber=${encodeURIComponent(certificate.serial_number)}`;
        const verificationToken = certificate.qr_token || certificate.signature_token || null;
        void pool_1.pool
            .query(`
        INSERT INTO certificate_event (
          certificate_id,
          event_type,
          actor_id,
          notes
        )
        VALUES (
          $1,
          'print_preview_accessed',
          'system.print_preview',
          'Certificate print preview accessed'
        )
        `, [certificateId])
            .catch(() => undefined);
        const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Share Certificate ${escapeHtml(certificate.serial_number)}</title>
  <style>
    :root {
      color: #0f172a;
      background: #e2e8f0;
      font-family: "Inter", "Segoe UI", Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 32px;
      background: #e2e8f0;
    }

    .certificate {
      max-width: 960px;
      min-height: 680px;
      margin: 0 auto;
      padding: 48px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
    }

    .topline {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 3px solid #0f172a;
      padding-bottom: 24px;
    }

    .issuer {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0;
    }

    .subtitle {
      margin: 8px 0 0;
      color: #475569;
      font-size: 13px;
      text-transform: uppercase;
    }

    .serial {
      text-align: right;
      font-size: 13px;
      color: #475569;
    }

    .serial strong {
      display: block;
      margin-top: 6px;
      color: #0f172a;
      font-size: 16px;
    }

    h1 {
      margin: 52px 0 8px;
      text-align: center;
      font-size: 42px;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .certifies {
      max-width: 720px;
      margin: 0 auto 40px;
      text-align: center;
      color: #475569;
      line-height: 1.6;
    }

    .shareholder {
      margin: 12px 0;
      color: #0f172a;
      font-size: 28px;
      font-weight: 800;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin: 32px 0;
    }

    .field {
      border: 1px solid #e2e8f0;
      padding: 16px;
      min-height: 84px;
    }

    .label {
      margin: 0 0 8px;
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .value {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .evidence {
      margin-top: 28px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 18px;
    }

    .evidence .value {
      font-family: "Cascadia Mono", Consolas, monospace;
      font-size: 12px;
      line-height: 1.7;
      word-break: break-word;
    }

    .disclaimer {
      margin-top: 28px;
      border-top: 1px solid #cbd5e1;
      padding-top: 16px;
      color: #475569;
      font-size: 13px;
      line-height: 1.6;
    }

    .print-note {
      max-width: 960px;
      margin: 16px auto 0;
      color: #475569;
      font-size: 13px;
      text-align: center;
    }

    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }

      .certificate {
        max-width: none;
        min-height: auto;
        border: 0;
        box-shadow: none;
        page-break-inside: avoid;
      }

      .print-note {
        display: none;
      }
    }

    @page {
      margin: 16mm;
      size: A4;
    }
  </style>
</head>
<body>
  <article class="certificate" aria-label="Demo share certificate">
    <header class="topline">
      <div>
        <p class="issuer">Digaf Microcredit Provider SC</p>
        <p class="subtitle">Registered issuer: ${escapeHtml(certificate.issuing_company)}</p>
      </div>
      <div class="serial">
        Certificate serial number
        <strong>${escapeHtml(certificate.serial_number)}</strong>
      </div>
    </header>

    <h1>Share Certificate</h1>

    <section class="certifies">
      <p>This certifies that the shareholder below is recorded in the demo shareholder register as holding the stated shares.</p>
      <p class="shareholder">${escapeHtml(certificate.shareholder_name)}</p>
    </section>

    <section class="grid" aria-label="Certificate details">
      <div class="field">
        <p class="label">Shareholder name</p>
        <p class="value">${escapeHtml(certificate.shareholder_name)}</p>
      </div>
      <div class="field">
        <p class="label">Share class</p>
        <p class="value">${escapeHtml(certificate.share_class)}</p>
      </div>
      <div class="field">
        <p class="label">Quantity</p>
        <p class="value">${escapeHtml(certificate.quantity)}</p>
      </div>
      <div class="field">
        <p class="label">Issue date</p>
        <p class="value">${escapeHtml(formatCertificateDate(certificate.issue_date))}</p>
      </div>
      <div class="field">
        <p class="label">Status</p>
        <p class="value">${escapeHtml(certificate.status)}</p>
      </div>
      <div class="field">
        <p class="label">Revocation status</p>
        <p class="value">${escapeHtml(certificate.revocation_status || "None")}</p>
      </div>
    </section>

    <section class="evidence" aria-label="Verification evidence">
      <p class="label">Hash algorithm</p>
      <p class="value">${escapeHtml(certificate.hash_algorithm || "Not generated")}</p>
      <p class="label">Certificate hash</p>
      <p class="value">${escapeHtml(formatWrappedToken(certificate.certificate_hash))}</p>
      <p class="label">Public verification URL placeholder</p>
      <p class="value">${escapeHtml(verificationUrl)}</p>
      <p class="label">QR token / verification token</p>
      <p class="value">${escapeHtml(formatWrappedToken(verificationToken))}</p>
    </section>

    <p class="disclaimer">Demo template for MVP review. Official certificate template pending Digaf confirmation.</p>
  </article>
  <p class="print-note">Use browser Print, then Save as PDF, for demo certificate output.</p>
</body>
</html>`;
        res.setHeader("X-Robots-Tag", "noindex");
        return res.type("html").send(html);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("certificateId")) {
            return (0, apiError_1.sendBadRequest)(res, error.message);
        }
        return (0, apiError_1.sendServerError)(res, "Failed to build certificate print preview", error);
    }
});
exports.certificateRoutes.get("/:certificateId/events", async (req, res) => {
    try {
        const certificateId = (0, validation_1.requireUuid)(req.params.certificateId, "certificateId");
        const result = await pool_1.pool.query(`
      SELECT
        id,
        certificate_id,
        event_type,
        actor_id,
        timestamp_utc,
        notes
      FROM certificate_event
      WHERE certificate_id = $1
      ORDER BY timestamp_utc ASC
      `, [certificateId]);
        res.json({
            data: result.rows,
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("certificateId")) {
            return (0, apiError_1.sendBadRequest)(res, error.message);
        }
        return (0, apiError_1.sendServerError)(res, "Failed to fetch certificate events", error);
    }
});
exports.certificateRoutes.post("/:certificateId/revoke", async (req, res) => {
    let certificateId = "";
    let actorId = "";
    let reason = "";
    try {
        certificateId = (0, validation_1.requireUuid)(req.params.certificateId, "certificateId");
        actorId = (0, validation_1.normalizeActorId)(req.body?.actorId);
        reason = (0, validation_1.requireNonEmptyString)(req.body?.reason, "reason");
    }
    catch (error) {
        return (0, apiError_1.sendBadRequest)(res, error instanceof Error ? error.message : "Invalid certificate revoke request");
    }
    const client = await pool_1.pool.connect();
    try {
        await client.query("BEGIN");
        const certificateResult = await client.query(`
      SELECT
        certificate_id,
        entity_id,
        status,
        revocation_status
      FROM share_certificate
      WHERE certificate_id = $1
      FOR UPDATE
      `, [certificateId]);
        if (certificateResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return (0, apiError_1.sendNotFound)(res, "Certificate not found");
        }
        const certificate = certificateResult.rows[0];
        if (certificate.status === "revoked" ||
            certificate.revocation_status === "revoked") {
            await client.query("ROLLBACK");
            return (0, apiError_1.sendConflict)(res, "Certificate is already revoked");
        }
        const updateResult = await client.query(`
      UPDATE share_certificate
      SET
        status = 'revoked',
        revocation_status = 'revoked'
      WHERE certificate_id = $1
      RETURNING
        certificate_id,
        entity_id,
        serial_number,
        status,
        revocation_status
      `, [certificateId]);
        await client.query(`
      INSERT INTO certificate_event (
        certificate_id,
        event_type,
        actor_id,
        notes
      )
      VALUES ($1, 'revoked', $2, $3)
      `, [certificateId, actorId, reason]);
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
      VALUES ($1, $2, 'certificate_revoked', 'share_certificate', $3, $4::jsonb, $5::jsonb, $6)
      `, [
            certificate.entity_id,
            actorId,
            certificateId,
            JSON.stringify({
                status: certificate.status,
                revocation_status: certificate.revocation_status,
            }),
            JSON.stringify({
                status: "revoked",
                revocation_status: "revoked",
                reason,
            }),
            req.ip,
        ]);
        await client.query("COMMIT");
        res.json({
            data: updateResult.rows[0],
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        return (0, apiError_1.sendServerError)(res, "Failed to revoke certificate", error);
    }
    finally {
        client.release();
    }
});
exports.certificateRoutes.post("/:certificateId/generate-hash", async (req, res) => {
    let certificateId = "";
    try {
        certificateId = (0, validation_1.requireUuid)(req.params.certificateId, "certificateId");
    }
    catch (error) {
        return (0, apiError_1.sendBadRequest)(res, error instanceof Error ? error.message : "Invalid certificate hash request");
    }
    const client = await pool_1.pool.connect();
    try {
        await client.query("BEGIN");
        const certificateResult = await client.query(`
      SELECT
        c.certificate_id,
        c.entity_id,
        c.serial_number,
        c.shareholder_id,
        c.share_class_id,
        c.quantity,
        c.issue_date,
        e.legal_name AS issuing_authority
      FROM share_certificate c
      JOIN entity e ON e.entity_id = c.entity_id
      WHERE c.certificate_id = $1
      FOR UPDATE
      `, [certificateId]);
        if (certificateResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return (0, apiError_1.sendNotFound)(res, "Certificate not found");
        }
        const certificate = certificateResult.rows[0];
        if (!certificate.issue_date) {
            await client.query("ROLLBACK");
            return (0, apiError_1.sendBadRequest)(res, "Certificate issue_date is required before hash generation");
        }
        const canonicalString = (0, certificateCrypto_1.buildCanonicalCertificateString)({
            entityId: certificate.entity_id,
            serialNumber: certificate.serial_number,
            shareholderId: certificate.shareholder_id,
            shareClassId: certificate.share_class_id,
            quantity: certificate.quantity,
            issueDate: certificate.issue_date.toISOString().slice(0, 10),
            issuingAuthority: certificate.issuing_authority,
        });
        const certificateHash = (0, certificateCrypto_1.generateCertificateHash)(canonicalString);
        const signatureToken = (0, certificateCrypto_1.generateSignatureToken)(certificateHash);
        const updateResult = await client.query(`
      UPDATE share_certificate
      SET
        certificate_hash = $1,
        hash_algorithm = 'SHA-256',
        hash_generated_at = now(),
        signature_token = $2,
        qr_token = $2
      WHERE certificate_id = $3
      RETURNING
        certificate_id,
        serial_number,
        certificate_hash,
        hash_algorithm,
        hash_generated_at,
        signature_token
      `, [certificateHash, signatureToken, certificateId]);
        await client.query(`
      INSERT INTO certificate_event (
        certificate_id,
        event_type,
        actor_id,
        notes
      )
      VALUES ($1, 'hash_generated', 'system.local_dev', 'SHA-256 hash and HMAC signature generated')
      `, [certificateId]);
        await client.query("COMMIT");
        res.json({
            data: updateResult.rows[0],
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        return (0, apiError_1.sendServerError)(res, "Failed to generate certificate hash", error);
    }
    finally {
        client.release();
    }
});
exports.certificateRoutes.get("/verify/:serialNumber", async (req, res) => {
    try {
        const { serialNumber } = req.params;
        const certificate = await fetchPublicVerificationCertificate("c.serial_number = $1", serialNumber);
        if (!certificate) {
            return (0, apiError_1.sendNotFound)(res, "Certificate not found", {
                verificationTimestamp: new Date().toISOString(),
            });
        }
        res.json({
            data: buildPublicVerificationResponse(certificate),
        });
    }
    catch (error) {
        return (0, apiError_1.sendServerError)(res, "Failed to verify certificate", error);
    }
});
exports.certificateRoutes.get("/verify/by-token/:qrToken", async (req, res) => {
    try {
        const { qrToken } = req.params;
        const certificate = await fetchPublicVerificationCertificate("(c.qr_token = $1 OR c.signature_token = $1)", qrToken);
        if (!certificate) {
            return (0, apiError_1.sendNotFound)(res, "Certificate not found", {
                verificationTimestamp: new Date().toISOString(),
            });
        }
        res.json({
            data: buildPublicVerificationResponse(certificate),
        });
    }
    catch (error) {
        return (0, apiError_1.sendServerError)(res, "Failed to verify certificate token", error);
    }
});
//# sourceMappingURL=certificateRoutes.js.map