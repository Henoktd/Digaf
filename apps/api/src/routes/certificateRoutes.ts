import { Router } from "express";
import { pool } from "../db/pool";
import * as QRCode from "qrcode";
import {
  buildCanonicalCertificateString,
  generateCertificateHash,
  generateSignatureToken,
} from "../services/certificateCrypto";
import {
  sendBadRequest,
  sendConflict,
  sendForbidden,
  sendNotFound,
  sendServerError,
} from "../utils/apiError";
import { requireRole } from "../utils/roles";
import {
  requireNonEmptyString,
  requireUuid,
} from "../utils/validation";

export const certificateRoutes = Router();

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCertificateDate(value: Date | string | null) {
  if (!value) return "Not set";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

function formatWrappedToken(value: string | null) {
  if (!value) return "Not generated";

  return value.match(/.{1,16}/g)?.join(" ") ?? value;
}

function getFrontendBaseUrl() {
  return (
    process.env.FRONTEND_PUBLIC_BASE_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function buildPublicVerificationUrl(serialNumber: string) {
  return `${getFrontendBaseUrl()}/qr?serialNumber=${encodeURIComponent(
    serialNumber
  )}`;
}

function buildPublicVerificationResponse(certificate: any) {
  let hashVerificationResult = "hash_missing";

  if (certificate.certificate_hash && certificate.issue_date) {
    const issueDate =
      certificate.issue_date instanceof Date
        ? certificate.issue_date.toISOString().slice(0, 10)
        : new Date(certificate.issue_date).toISOString().slice(0, 10);

    const canonicalString = buildCanonicalCertificateString({
      entityId: certificate.entity_id,
      serialNumber: certificate.serial_number,
      shareholderId: certificate.shareholder_id,
      quantity: certificate.quantity,
      issueDate,
      issuingAuthority: certificate.issuing_company,
    });

    const recomputedHash = generateCertificateHash(canonicalString);
    const recomputedSignatureToken = generateSignatureToken(recomputedHash);

    const hashMatches = recomputedHash === certificate.certificate_hash;
    const tokenMatches =
      recomputedSignatureToken === certificate.signature_token;

    if (hashMatches && tokenMatches) {
      hashVerificationResult = "valid";
    } else {
      hashVerificationResult = "tamper_detected";
    }
  }

  return {
    serial_number: certificate.serial_number,
    issuing_company: certificate.issuing_company,
    quantity: certificate.quantity,
    issue_date: certificate.issue_date,
    status:
      hashVerificationResult === "tamper_detected"
        ? "tampered"
        : certificate.status,
    revocation_status: certificate.revocation_status,
    hash_algorithm: certificate.hash_algorithm,
    hash_generated_at: certificate.hash_generated_at,
    hash_verification_result: hashVerificationResult,
    verification_timestamp: certificate.verification_timestamp,
  };
}

async function fetchPublicVerificationCertificate(
  whereClause: string,
  value: string
) {
  const result = await pool.query(
    `
    SELECT
      c.certificate_id,
      c.entity_id,
      c.serial_number,
      c.shareholder_id,
      c.quantity,
      c.issue_date,
      c.status,
      c.revocation_status,
      c.certificate_hash,
      c.hash_algorithm,
      c.hash_generated_at,
      c.signature_token,
      e.legal_name AS issuing_company,
      now() AS verification_timestamp
    FROM share_certificate c
    JOIN entity e ON e.entity_id = c.entity_id
    WHERE ${whereClause}
    LIMIT 1
    `,
    [value]
  );

  return result.rows[0];
}

certificateRoutes.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT
          c.certificate_id,
          c.entity_id,
          e.legal_name AS entity_name,
          c.serial_number,
          c.shareholder_id,
          s.legal_name AS shareholder_name,
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
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM share_certificate`),
    ]);

    res.json({
      data: dataResult.rows,
      total: countResult.rows[0]?.total ?? 0,
      page,
      limit,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch certificates", error);
  }
});

certificateRoutes.post("/", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["maker", "governance_admin"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const { shareholder_id, quantity, serial_number } = req.body ?? {};

  if (!shareholder_id || !quantity || !serial_number) {
    return sendBadRequest(res, "shareholder_id, quantity, and serial_number are required");
  }
  if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
    return sendBadRequest(res, "quantity must be a positive number");
  }

  try {
    const dupCheck = await pool.query(
      `SELECT certificate_id FROM share_certificate WHERE serial_number = $1`,
      [serial_number]
    );
    if ((dupCheck.rowCount ?? 0) > 0) {
      return sendConflict(res, `Serial number '${serial_number}' is already in use`);
    }

    const shareholderResult = await pool.query(
      `SELECT shareholder_id, entity_id FROM shareholder WHERE shareholder_id = $1 LIMIT 1`,
      [shareholder_id]
    );
    if (shareholderResult.rowCount === 0) {
      return sendNotFound(res, "Shareholder not found");
    }
    const entity_id = shareholderResult.rows[0].entity_id;

    const result = await pool.query(
      `INSERT INTO share_certificate
        (entity_id, shareholder_id, quantity, serial_number, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING certificate_id, serial_number, status, created_at`,
      [entity_id, shareholder_id, Number(quantity), serial_number]
    );

    await pool.query(
      `INSERT INTO certificate_event (certificate_id, event_type, actor_id, notes)
       VALUES ($1, 'created', $2, 'Certificate created via governance portal')`,
      [result.rows[0].certificate_id, req.auth.actorId]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Failed to create certificate", error);
  }
});

certificateRoutes.get("/verify/by-token/:qrToken", async (req, res) => {
  try {
    const { qrToken } = req.params;

    const certificate = await fetchPublicVerificationCertificate(
      "(c.qr_token = $1 OR c.signature_token = $1)",
      qrToken
    );

    if (!certificate) {
      return sendNotFound(res, "Certificate not found", {
        verificationTimestamp: new Date().toISOString(),
      });
    }

    res.json({
      data: buildPublicVerificationResponse(certificate),
    });
  } catch (error) {
    return sendServerError(res, "Failed to verify certificate token", error);
  }
});

certificateRoutes.get("/verify/:serialNumber", async (req, res) => {
  try {
    const { serialNumber } = req.params;

    const certificate = await fetchPublicVerificationCertificate(
      "c.serial_number = $1",
      serialNumber
    );

    if (!certificate) {
      return sendNotFound(res, "Certificate not found", {
        verificationTimestamp: new Date().toISOString(),
      });
    }

    res.json({
      data: buildPublicVerificationResponse(certificate),
    });
  } catch (error) {
    return sendServerError(res, "Failed to verify certificate", error);
  }
});

certificateRoutes.get("/:certificateId/qr.svg", async (req, res) => {
  let certificateId = "";

  try {
    certificateId = requireUuid(req.params.certificateId, "certificateId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid certificate QR request"
    );
  }

  try {
    const result = await pool.query(
      `
      SELECT
        certificate_id,
        serial_number
      FROM share_certificate
      WHERE certificate_id = $1
      LIMIT 1
      `,
      [certificateId]
    );

    if (result.rowCount === 0) {
      return sendNotFound(res, "Certificate not found");
    }

    const certificate = result.rows[0];
    const verificationUrl = buildPublicVerificationUrl(
      certificate.serial_number
    );

    const svg = await QRCode.toString(verificationUrl, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
      width: 240,
    });

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-store");
    return res.send(svg);
  } catch (error) {
    return sendServerError(res, "Failed to generate certificate QR SVG", error);
  }
});

certificateRoutes.get("/:certificateId/render-data", async (req, res) => {
  try {
    const certificateId = requireUuid(req.params.certificateId, "certificateId");

    const result = await pool.query(
      `
      SELECT
        c.certificate_id,
        c.serial_number,
        e.legal_name AS issuing_company,
        s.legal_name AS shareholder_name,
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
      WHERE c.certificate_id = $1
      LIMIT 1
      `,
      [certificateId]
    );

    if (result.rowCount === 0) {
      return sendNotFound(res, "Certificate not found");
    }

    const certificate = result.rows[0];
    const generatedAt = new Date().toISOString();

    void pool
      .query(
        `
        INSERT INTO certificate_event (
          certificate_id,
          event_type,
          actor_id,
          notes
        )
        VALUES (
          $1,
          'render_data_accessed',
          req.auth.actorId,
          'Certificate render data accessed for PDF preview'
        )
        `,
        [certificateId]
      )
      .catch(() => undefined);

    res.json({
      data: {
        certificate_id: certificate.certificate_id,
        serial_number: certificate.serial_number,
        issuing_company: certificate.issuing_company,
        shareholder_name: certificate.shareholder_name,
        quantity: certificate.quantity,
        issue_date: certificate.issue_date,
        status: certificate.status,
        revocation_status: certificate.revocation_status,
        certificate_hash: certificate.certificate_hash,
        hash_algorithm: certificate.hash_algorithm,
        hash_generated_at: certificate.hash_generated_at,
        qr_token: certificate.qr_token,
        public_verification_url: buildPublicVerificationUrl(
          certificate.serial_number
        ),
        qr_svg_url: `/api/certificates/${certificate.certificate_id}/qr.svg`,
        render_metadata: {
          certificate_title: "Digaf Microcredit Provider — Share Certificate",
          template_version: "v1.0",
          generated_at: generatedAt,
          disclaimer:
            "Official Digaf Microcredit Provider share certificate. Transfer of shares is subject to Board approval and applicable Ethiopian Commercial Code provisions.",
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("certificateId")) {
      return sendBadRequest(res, error.message);
    }

    return sendServerError(res, "Failed to fetch certificate render data", error);
  }
});

certificateRoutes.get("/:certificateId/print-preview", async (req, res) => {
  try {
    const certificateId = requireUuid(req.params.certificateId, "certificateId");

    const result = await pool.query(
      `
      SELECT
        c.certificate_id,
        c.serial_number,
        e.legal_name AS issuing_company,
        s.legal_name AS shareholder_name,
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
      WHERE c.certificate_id = $1
      LIMIT 1
      `,
      [certificateId]
    );

    if (result.rowCount === 0) {
      return sendNotFound(res, "Certificate not found");
    }

    const certificate = result.rows[0];
    const verificationUrl = buildPublicVerificationUrl(
      certificate.serial_number
    );
    const verificationToken =
      certificate.qr_token || certificate.signature_token || null;

    void pool
      .query(
        `
        INSERT INTO certificate_event (
          certificate_id,
          event_type,
          actor_id,
          notes
        )
        VALUES (
          $1,
          'print_preview_accessed',
          req.auth.actorId,
          'Certificate print preview accessed'
        )
        `,
        [certificateId]
      )
      .catch(() => undefined);

    const qrSvg = await QRCode.toString(verificationUrl, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
      width: 240,
    });
    const qrDataUri = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`;

    const isRevoked = certificate.status === "revoked" || certificate.revocation_status === "revoked";
    const isDraft = certificate.status === "draft";
    const watermarkText = isRevoked ? "VOID" : isDraft ? "DRAFT" : null;
    const watermarkColor = isRevoked ? "rgba(185,28,28,0.13)" : "rgba(100,116,139,0.10)";
    const watermarkStroke = isRevoked ? "#b91c1c" : "#64748b";

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Share Certificate — ${escapeHtml(certificate.serial_number)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #c8c5bd;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      padding: 20px 16px 32px;
      color: #1a1a2e;
    }

    .page {
      width: 190mm;
      margin: 0 auto;
      background: #fffef9;
      box-shadow: 0 24px 72px rgba(0,0,0,0.26);
      position: relative;
      overflow: hidden;
    }

    .border-outer {
      margin: 10px;
      border: 2px solid #b8973a;
      padding: 8px;
      position: relative;
    }
    .border-outer::before { content: '◆'; position: absolute; top: -6px; left: -6px; color: #b8973a; font-size: 9px; line-height: 1; }
    .border-outer::after  { content: '◆'; position: absolute; bottom: -6px; right: -6px; color: #b8973a; font-size: 9px; line-height: 1; }

    .border-inner {
      border: 0.75px solid #b8973a;
      padding: 18px 24px 16px;
      position: relative;
    }
    .border-inner::before { content: '◆'; position: absolute; top: -6px; left: -6px; color: #b8973a; font-size: 9px; line-height: 1; }
    .border-inner::after  { content: '◆'; position: absolute; bottom: -6px; right: -6px; color: #b8973a; font-size: 9px; line-height: 1; }

    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 90px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: ${watermarkColor};
      -webkit-text-stroke: 2px ${watermarkStroke};
      opacity: 0.5;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
      z-index: 2;
    }

    /* Digaf logo SVG inline styles — prefixed to avoid conflicts */
    .dg-c1 { fill: url(#dg-lg1); }
    .dg-c1, .dg-c2, .dg-c3 { stroke-width: 0px; }
    .dg-c2 { fill: #04072a; }
    .dg-c3 { fill: url(#dg-lg2); }

    .cert-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 10px;
      border-bottom: 1.5px solid #1a2e4a;
    }

    .org-logo { height: 36px; width: auto; display: block; flex-shrink: 0; }

    .org-sub {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-top: 2px;
    }

    .cert-number-block { text-align: right; flex-shrink: 0; }
    .cert-number-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
    .cert-number-value { font-family: 'EB Garamond', Georgia, serif; font-size: 16px; font-weight: 700; color: #1a2e4a; margin-top: 2px; }

    .title-block {
      text-align: center;
      padding: 10px 0 8px;
      border-bottom: 0.75px solid #e2d8c0;
    }
    .cert-title {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #1a2e4a;
      line-height: 1;
    }
    .cert-subtitle {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #b8973a;
      margin-top: 4px;
    }

    .certifies-block { text-align: center; padding: 10px 16px 6px; }
    .certifies-intro { font-size: 11px; color: #475569; font-style: italic; }
    .shareholder-name {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 24px;
      font-weight: 700;
      color: #1a2e4a;
      margin: 5px 0 3px;
      line-height: 1.15;
    }
    .certifies-body {
      font-size: 10.5px;
      color: #475569;
      line-height: 1.55;
      max-width: 480px;
      margin: 0 auto;
      font-style: italic;
    }

    .ornament { text-align: center; color: #b8973a; font-size: 13px; letter-spacing: 0.4em; margin: 5px 0 2px; }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      margin: 8px 0;
      border: 0.75px solid #ddd6c0;
    }
    .field {
      padding: 7px 10px;
      border-right: 0.75px solid #ddd6c0;
      border-bottom: 0.75px solid #ddd6c0;
    }
    .field:nth-child(4n) { border-right: none; }
    .field:nth-last-child(-n+4) { border-bottom: none; }
    .field-label { font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.1em; color: #92836a; font-weight: 700; margin-bottom: 3px; }
    .field-value { font-size: 12px; font-weight: 700; color: #1a2e4a; line-height: 1.2; overflow-wrap: anywhere; }
    .status-issued  { color: #166534; }
    .status-draft   { color: #92400e; }
    .status-revoked { color: #991b1b; }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 0.75px solid #e2d8c0;
    }
    .sig-block { text-align: center; }
    .sig-line { border-bottom: 0.75px solid #1a2e4a; height: 26px; margin-bottom: 4px; }
    .sig-label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
    .sig-title { font-size: 9px; color: #1a2e4a; font-weight: 600; margin-top: 1px; }

    .verification-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 10px;
      padding: 8px 10px;
      background: #f8f6f0;
      border: 0.75px solid #e2d8c0;
    }
    .qr-img { width: 64px; height: 64px; flex-shrink: 0; border: 1.5px solid #ddd6c0; background: #fff; padding: 2px; }
    .verify-text { flex: 1; min-width: 0; }
    .verify-label { font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.08em; color: #92836a; font-weight: 700; margin-bottom: 2px; }
    .verify-url { font-family: 'Courier New', Courier, monospace; font-size: 9px; color: #1a2e4a; word-break: break-all; }
    .verify-hash { margin-top: 4px; }
    .verify-hash-val { font-family: 'Courier New', Courier, monospace; font-size: 8px; color: #64748b; word-break: break-all; line-height: 1.4; }

    .cert-footer {
      margin-top: 8px;
      padding-top: 7px;
      border-top: 0.75px solid #e2d8c0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 10px;
    }
    .footer-legal { font-size: 7.5px; color: #92836a; line-height: 1.5; max-width: 420px; }
    .footer-reg { text-align: right; font-size: 7.5px; color: #92836a; flex-shrink: 0; line-height: 1.5; }

    .print-hint {
      width: 190mm;
      margin: 10px auto 0;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }

    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; width: 100%; }
      .print-hint { display: none; }
    }

    @page { margin: 8mm; size: A4 portrait; }
  </style>
</head>
<body>
  <div class="page">
    <div class="border-outer">
      <div class="border-inner">

        ${watermarkText ? `<div class="watermark">${watermarkText}</div>` : ""}

        <!-- Header -->
        <header class="cert-header">
          <div>
            <svg class="org-logo" viewBox="0 0 448 336" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <defs>
                <linearGradient id="dg-lg1" x1="56.9" y1="247.7" x2="163.9" y2="131.3" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#771bfa"/>
                  <stop offset="1" stop-color="#faf3ee"/>
                </linearGradient>
                <linearGradient id="dg-lg2" x1="39.2" y1="231.5" x2="146.3" y2="115" xlink:href="#dg-lg1"/>
              </defs>
              <g>
                <path class="dg-c2" d="M199.9,192.7v-50h21.8c13.3,0,23.9,11.4,23.9,25.1s-10.7,24.9-23.9,24.9h-21.8ZM208.7,183.8h12.3c8.9,0,15.8-7.3,15.8-16.1s-6.8-16.2-15.3-16.2h-12.8v32.3Z"/>
                <path class="dg-c2" d="M248.6,148.2c0-3.2,2.3-5.5,5.5-5.5s5.5,2.3,5.5,5.5-2.3,5.5-5.5,5.5-5.5-2.3-5.5-5.5ZM249.9,192.7v-35h8.8v35h-8.8Z"/>
                <path class="dg-c2" d="M304,175.1c0-9.9,7.6-18.2,17.7-18.2s7.6,1.3,9.9,3.9v-3.2h8.8v35h-8.8v-3.3c-1.9,2.2-5.5,4-9.9,4-10.1,0-17.7-7.7-17.7-18.3ZM331.3,175.3c0-4.9-4-9.6-9.6-9.6s-9,4.6-9,9.4,3.8,9.4,9,9.5c5.3.1,9.6-3.6,9.6-9.3Z"/>
                <path class="dg-c2" d="M290.9,157.7v3.5c-2.2-2.4-5.7-4.2-9.8-4.2-10.1,0-17.8,8.5-17.8,18.1s7.7,18.3,17.8,18.3,7-1.3,9.6-3.8v1.7c0,4.9-4.6,7.6-9.8,7.6,0,0,0,0,0,0v8.9s0,0,.1,0c10.7,0,18.7-7.2,18.7-18.6v-31.5h-8.8ZM281.1,184.6c-5.2,0-9.1-4.1-9.1-9.5s3.9-9.4,9.1-9.4,9.8,4,9.8,9.1-4,9.8-9.8,9.8Z"/>
                <path class="dg-c2" d="M362.1,142.7s-5.2-.3-8.6,3.1c-3.4,3.4-3.6,8.7-3.6,8.7h0c0,.5,0,1.1,0,1.7v1.5h-4.4v8.5h4.4l-.3,26.5h8.9l.3-26.5h7.9v-8.5h-7.9v-1.5c0-1.3.4-2.4,1.3-3.3.8-.8,2-1.2,3.2-1.3h3.4v-8.8h-4.6Z"/>
              </g>
              <g>
                <path class="dg-c1" d="M130.4,133.2c-.1,0-.2,0-.3,0h0s-13.4,0-13.4,0v23.2h13.4c.1,0,.2,0,.3,0,6.4,0,11.6,5.2,11.6,11.6s-5.2,11.6-11.6,11.6-.2,0-.3,0h0s-13.4,0-13.4,0v-23.2h-23.2v46.4h36.6c.1,0,.2,0,.3,0,19.2,0,34.8-15.6,34.8-34.8s-15.6-34.8-34.8-34.8Z"/>
                <rect class="dg-c3" x="64.7" y="179.6" width="23.2" height="23.2"/>
              </g>
            </svg>
            <p class="org-sub">Addis Ababa, Ethiopia &nbsp;·&nbsp; Authorised Under NBE Directive</p>
          </div>
          <div class="cert-number-block">
            <p class="cert-number-label">Certificate No.</p>
            <p class="cert-number-value">${escapeHtml(certificate.serial_number)}</p>
          </div>
        </header>

        <!-- Title -->
        <div class="title-block">
          <p class="cert-title">Share Certificate</p>
          <p class="cert-subtitle">Digaf Microcredit Provider Share Company</p>
        </div>

        <!-- Certifying text -->
        <div class="certifies-block">
          <p class="certifies-intro">This is to certify that</p>
          <p class="shareholder-name">${escapeHtml(certificate.shareholder_name)}</p>
          <p class="certifies-body">
            is the registered holder of the shares described below in
            <strong>Digaf Microcredit Provider Share Company</strong>,
            subject to the Memorandum and Articles of Association of the Company
            and the conditions endorsed hereon.
          </p>
        </div>

        <div class="ornament">— ◆ —</div>

        <!-- Fields: 4-column grid, 1 row -->
        <div class="fields-grid">
          <div class="field">
            <p class="field-label">Shareholder Name</p>
            <p class="field-value">${escapeHtml(certificate.shareholder_name)}</p>
          </div>
          <div class="field">
            <p class="field-label">Number of Shares</p>
            <p class="field-value">${escapeHtml(Number(certificate.quantity).toLocaleString("en-US"))}</p>
          </div>
          <div class="field">
            <p class="field-label">Issue Date</p>
            <p class="field-value">${escapeHtml(formatCertificateDate(certificate.issue_date))}</p>
          </div>
          <div class="field">
            <p class="field-label">Certificate Status</p>
            <p class="field-value status-${escapeHtml(certificate.status)}">${escapeHtml(certificate.status.toUpperCase())}</p>
          </div>
        </div>

        <!-- Signature blocks -->
        <div class="signatures">
          <div class="sig-block">
            <div class="sig-line"></div>
            <p class="sig-label">Authorised Signature</p>
            <p class="sig-title">Chief Executive Officer</p>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <p class="sig-label">Authorised Signature</p>
            <p class="sig-title">Board Secretary</p>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <p class="sig-label">Date of Issue</p>
            <p class="sig-title">${escapeHtml(formatCertificateDate(certificate.issue_date))}</p>
          </div>
        </div>

        <!-- QR + Verification -->
        <div class="verification-row">
          <img class="qr-img" src="${qrDataUri}" alt="Certificate verification QR code" />
          <div class="verify-text">
            <p class="verify-label">Digital Verification</p>
            <p class="verify-url">${escapeHtml(verificationUrl)}</p>
            ${certificate.certificate_hash ? `
            <div class="verify-hash">
              <p class="verify-label">Integrity Hash (${escapeHtml(certificate.hash_algorithm || "SHA-256")})</p>
              <p class="verify-hash-val">${escapeHtml(formatWrappedToken(certificate.certificate_hash))}</p>
            </div>` : ""}
          </div>
        </div>

        <!-- Footer -->
        <div class="cert-footer">
          <p class="footer-legal">
            This certificate is issued pursuant to the Articles of Association of Digaf Microcredit Provider Share Company.
            Transfer of shares is subject to approval under the Company's share transfer policy and applicable Ethiopian Commercial Code provisions.
            Retain in a safe place — loss must be reported to the Company Secretary immediately.
          </p>
          <div class="footer-reg">
            <p>Registered: Addis Ababa, Ethiopia</p>
            <p>Supervised by: National Bank of Ethiopia</p>
          </div>
        </div>

      </div>
    </div>
  </div>

  <p class="print-hint">Use <strong>File → Print → Save as PDF</strong> to generate a printable certificate.</p>
</body>
</html>`;

    res.setHeader("X-Robots-Tag", "noindex");
    return res.type("html").send(html);
  } catch (error) {
    if (error instanceof Error && error.message.includes("certificateId")) {
      return sendBadRequest(res, error.message);
    }

    return sendServerError(res, "Failed to build certificate print preview", error);
  }
});

certificateRoutes.get("/:certificateId/events", async (req, res) => {
  try {
    const certificateId = requireUuid(req.params.certificateId, "certificateId");

    const result = await pool.query(
      `
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
      `,
      [certificateId]
    );

    res.json({
      data: result.rows,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("certificateId")) {
      return sendBadRequest(res, error.message);
    }

    return sendServerError(res, "Failed to fetch certificate events", error);
  }
});

certificateRoutes.post("/:certificateId/revoke", async (req, res) => {
  let certificateId = "";
  let reason = "";

  try {
    certificateId = requireUuid(req.params.certificateId, "certificateId");
    reason = requireNonEmptyString(req.body?.reason, "reason");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid certificate revoke request"
    );
  }

  const actorId = req.auth.actorId;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const certificateResult = await client.query(
      `
      SELECT
        certificate_id,
        entity_id,
        status,
        revocation_status
      FROM share_certificate
      WHERE certificate_id = $1
      FOR UPDATE
      `,
      [certificateId]
    );

    if (certificateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Certificate not found");
    }

    const certificate = certificateResult.rows[0];

    if (
      certificate.status === "revoked" ||
      certificate.revocation_status === "revoked"
    ) {
      await client.query("ROLLBACK");
      return sendConflict(res, "Certificate is already revoked");
    }

    const updateResult = await client.query(
      `
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
      `,
      [certificateId]
    );

    await client.query(
      `
      INSERT INTO certificate_event (
        certificate_id,
        event_type,
        actor_id,
        notes
      )
      VALUES ($1, 'revoked', $2, $3)
      `,
      [certificateId, actorId, reason]
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
      VALUES ($1, $2, 'certificate_revoked', 'share_certificate', $3, $4::jsonb, $5::jsonb, $6)
      `,
      [
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
      ]
    );

    await client.query("COMMIT");

    res.json({
      data: updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to revoke certificate", error);
  } finally {
    client.release();
  }
});

certificateRoutes.post("/:certificateId/generate-hash", async (req, res) => {
  let certificateId = "";

  try {
    certificateId = requireUuid(req.params.certificateId, "certificateId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid certificate hash request"
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const certificateResult = await client.query(
      `
      SELECT
        c.certificate_id,
        c.entity_id,
        c.serial_number,
        c.shareholder_id,
        c.quantity,
        c.issue_date,
        e.legal_name AS issuing_authority
      FROM share_certificate c
      JOIN entity e ON e.entity_id = c.entity_id
      WHERE c.certificate_id = $1
      FOR UPDATE
      `,
      [certificateId]
    );

    if (certificateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Certificate not found");
    }

    const certificate = certificateResult.rows[0];

    if (!certificate.issue_date) {
      await client.query("ROLLBACK");
      return sendBadRequest(
        res,
        "Certificate issue_date is required before hash generation"
      );
    }

    const issueDate =
      certificate.issue_date instanceof Date
        ? certificate.issue_date.toISOString().slice(0, 10)
        : new Date(certificate.issue_date).toISOString().slice(0, 10);

    const canonicalString = buildCanonicalCertificateString({
      entityId: certificate.entity_id,
      serialNumber: certificate.serial_number,
      shareholderId: certificate.shareholder_id,
      quantity: certificate.quantity,
      issueDate,
      issuingAuthority: certificate.issuing_authority,
    });

    const certificateHash = generateCertificateHash(canonicalString);
    const signatureToken = generateSignatureToken(certificateHash);

    const updateResult = await client.query(
      `
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
      `,
      [certificateHash, signatureToken, certificateId]
    );

    await client.query(
      `
      INSERT INTO certificate_event (
        certificate_id,
        event_type,
        actor_id,
        notes
      )
      VALUES ($1, 'hash_generated', $2, 'SHA-256 hash and HMAC signature generated')
      `,
      [certificateId, req.auth.actorId]
    );

    await client.query("COMMIT");

    res.json({
      data: updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to generate certificate hash", error);
  } finally {
    client.release();
  }
});

certificateRoutes.post("/:certificateId/issue", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["maker", "governance_admin"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  let certificateId = "";
  try {
    certificateId = requireUuid(req.params.certificateId, "certificateId");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid certificateId");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const certResult = await client.query(
      `SELECT c.*, e.legal_name AS issuing_authority
       FROM share_certificate c
       JOIN entity e ON e.entity_id = c.entity_id
       WHERE c.certificate_id = $1 FOR UPDATE`,
      [certificateId]
    );
    if (certResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Certificate not found");
    }
    const cert = certResult.rows[0];
    if (cert.status !== "draft") {
      await client.query("ROLLBACK");
      return sendBadRequest(res, `Cannot issue a certificate with status: ${cert.status}`);
    }

    const issueDate = new Date().toISOString().slice(0, 10);
    const canonicalString = buildCanonicalCertificateString({
      entityId: cert.entity_id,
      serialNumber: cert.serial_number,
      shareholderId: cert.shareholder_id,
      quantity: cert.quantity,
      issueDate,
      issuingAuthority: cert.issuing_authority,
    });
    const certificateHash = generateCertificateHash(canonicalString);
    const signatureToken = generateSignatureToken(certificateHash);

    const updateResult = await client.query(
      `UPDATE share_certificate
       SET status = 'issued',
           issue_date = $2::date,
           certificate_hash = $3,
           hash_algorithm = 'SHA-256',
           hash_generated_at = now(),
           signature_token = $4,
           qr_token = $4
       WHERE certificate_id = $1 RETURNING *`,
      [certificateId, issueDate, certificateHash, signatureToken]
    );
    await client.query(
      `INSERT INTO certificate_event (certificate_id, event_type, actor_id, notes)
       VALUES ($1, 'issued', $2, 'Certificate issued and hash generated')`,
      [certificateId, req.auth.actorId]
    );
    await client.query("COMMIT");
    res.json({ data: updateResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(res, "Failed to issue certificate", error);
  } finally {
    client.release();
  }
});

certificateRoutes.post("/:certificateId/revoke", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["checker_2", "governance_admin"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  let certificateId = "";
  let reason = "";
  try {
    certificateId = requireUuid(req.params.certificateId, "certificateId");
    reason = requireNonEmptyString(req.body?.reason, "reason");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid request");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const certResult = await client.query(
      `SELECT * FROM share_certificate WHERE certificate_id = $1 FOR UPDATE`,
      [certificateId]
    );
    if (certResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Certificate not found");
    }
    if (certResult.rows[0].status !== "issued") {
      await client.query("ROLLBACK");
      return sendBadRequest(res, `Cannot revoke a certificate with status: ${certResult.rows[0].status}`);
    }
    const updateResult = await client.query(
      `UPDATE share_certificate
       SET status = 'revoked', revocation_status = 'revoked', updated_at = now()
       WHERE certificate_id = $1 RETURNING *`,
      [certificateId]
    );
    await client.query(
      `INSERT INTO certificate_event (certificate_id, event_type, actor_id, notes)
       VALUES ($1, 'revoked', $2, $3)`,
      [certificateId, req.auth.actorId, reason]
    );
    await client.query("COMMIT");
    res.json({ data: updateResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(res, "Failed to revoke certificate", error);
  } finally {
    client.release();
  }
});

certificateRoutes.post("/:certificateId/reissue", async (req, res) => {
  const roleResult = requireRole(req.auth?.actorRole, ["governance_admin"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  let certificateId = "";
  let newSerialNumber = "";
  try {
    certificateId = requireUuid(req.params.certificateId, "certificateId");
    newSerialNumber = requireNonEmptyString(req.body?.newSerialNumber, "newSerialNumber");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid request");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const certResult = await client.query(
      `SELECT * FROM share_certificate WHERE certificate_id = $1 FOR UPDATE`,
      [certificateId]
    );
    if (certResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Certificate not found");
    }
    if (certResult.rows[0].status !== "revoked") {
      await client.query("ROLLBACK");
      return sendBadRequest(res, `Cannot reissue a certificate with status: ${certResult.rows[0].status}`);
    }
    const dupCheck = await client.query(
      `SELECT certificate_id FROM share_certificate WHERE serial_number = $1`,
      [newSerialNumber]
    );
    if ((dupCheck.rowCount ?? 0) > 0) {
      await client.query("ROLLBACK");
      return sendConflict(res, `Serial number '${newSerialNumber}' is already in use`);
    }
    const old = certResult.rows[0];
    const newCert = await client.query(
      `INSERT INTO share_certificate
        (entity_id, shareholder_id, share_class_id, quantity, serial_number, status, reissue_reference)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6) RETURNING *`,
      [old.entity_id, old.shareholder_id, old.share_class_id, old.quantity, newSerialNumber, certificateId]
    );
    await client.query(
      `INSERT INTO certificate_event (certificate_id, event_type, actor_id, notes)
       VALUES ($1, 'reissued', $2, $3)`,
      [certificateId, req.auth.actorId, `Reissued as ${newSerialNumber}`]
    );
    await client.query("COMMIT");
    res.status(201).json({ data: newCert.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(res, "Failed to reissue certificate", error);
  } finally {
    client.release();
  }
});
