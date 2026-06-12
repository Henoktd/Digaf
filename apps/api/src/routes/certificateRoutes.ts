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
      shareClassId: certificate.share_class_id,
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
    share_class: certificate.share_class,
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

  const { shareholder_id, share_class_id, quantity, serial_number } = req.body ?? {};

  if (!shareholder_id || !share_class_id || !quantity || !serial_number) {
    return sendBadRequest(res, "shareholder_id, share_class_id, quantity, and serial_number are required");
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

    const shareClassResult = await pool.query(
      `SELECT share_class_id FROM share_class WHERE share_class_id = $1 LIMIT 1`,
      [share_class_id]
    );
    if (shareClassResult.rowCount === 0) {
      return sendNotFound(res, "Share class not found");
    }

    const result = await pool.query(
      `INSERT INTO share_certificate
        (entity_id, shareholder_id, share_class_id, quantity, serial_number, status)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING certificate_id, serial_number, status, created_at`,
      [entity_id, shareholder_id, share_class_id, Number(quantity), serial_number]
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
        share_class: certificate.share_class,
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

    *{ box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #d1cfc8;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      padding: 32px 24px 48px;
      color: #1a1a2e;
    }

    /* ── Outer envelope ── */
    .page {
      max-width: 820px;
      margin: 0 auto;
      background: #fffef9;
      box-shadow: 0 32px 96px rgba(0,0,0,0.28);
      position: relative;
      overflow: hidden;
    }

    /* Decorative corner ornaments via pseudo-element border trick */
    .border-outer {
      margin: 18px;
      border: 2.5px solid #b8973a;
      padding: 14px;
    }

    .border-inner {
      border: 1px solid #b8973a;
      padding: 36px 40px 32px;
      position: relative;
    }

    /* Corner diamonds */
    .border-outer::before,
    .border-outer::after,
    .border-inner::before,
    .border-inner::after {
      content: '◆';
      position: absolute;
      color: #b8973a;
      font-size: 10px;
      line-height: 1;
    }
    .border-outer::before { top: -7px; left: -7px; }
    .border-outer::after  { bottom: -7px; right: -7px; }
    .border-inner::before { top: -7px; left: -7px; }
    .border-inner::after  { bottom: -7px; right: -7px; }

    /* ── Watermark ── */
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 110px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: ${watermarkColor};
      -webkit-text-stroke: 3px ${watermarkStroke};
      text-stroke: 3px ${watermarkStroke};
      opacity: 0.55;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
      z-index: 2;
    }

    /* ── Header ── */
    .cert-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1a2e4a;
    }

    .org-block {}

    .org-emblem {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .emblem-circle {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: #1a2e4a;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .emblem-circle svg { display: block; }

    .org-name {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: #1a2e4a;
      line-height: 1.2;
    }

    .org-sub {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 4px;
    }

    .cert-number-block {
      text-align: right;
      flex-shrink: 0;
    }

    .cert-number-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
    }

    .cert-number-value {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #1a2e4a;
      margin-top: 3px;
    }

    /* ── Title block ── */
    .title-block {
      text-align: center;
      padding: 24px 0 18px;
      border-bottom: 1px solid #e2d8c0;
    }

    .cert-title {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 38px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #1a2e4a;
      line-height: 1;
    }

    .cert-subtitle {
      font-size: 12px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #b8973a;
      margin-top: 7px;
    }

    /* ── Certifying text ── */
    .certifies-block {
      text-align: center;
      padding: 22px 20px 10px;
    }

    .certifies-intro {
      font-size: 13px;
      color: #475569;
      line-height: 1.7;
      font-style: italic;
    }

    .shareholder-name {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 30px;
      font-weight: 700;
      color: #1a2e4a;
      margin: 10px 0 4px;
      line-height: 1.2;
    }

    .certifies-body {
      font-size: 13px;
      color: #475569;
      line-height: 1.7;
      max-width: 560px;
      margin: 0 auto;
      font-style: italic;
    }

    /* ── Data fields ── */
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      margin: 20px 0;
      border: 1px solid #ddd6c0;
    }

    .field {
      padding: 13px 16px;
      border-right: 1px solid #ddd6c0;
      border-bottom: 1px solid #ddd6c0;
    }

    .field:nth-child(3n) { border-right: none; }
    .field:nth-last-child(-n+3) { border-bottom: none; }

    .field-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #92836a;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .field-value {
      font-size: 14px;
      font-weight: 700;
      color: #1a2e4a;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }

    .field-value.mono {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: 400;
      word-break: break-all;
    }

    .status-issued   { color: #166534; }
    .status-draft    { color: #92400e; }
    .status-revoked  { color: #991b1b; }

    /* ── Divider ornament ── */
    .ornament {
      text-align: center;
      color: #b8973a;
      font-size: 18px;
      letter-spacing: 0.4em;
      margin: 4px 0;
    }

    /* ── Signatures ── */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 22px;
      padding-top: 20px;
      border-top: 1px solid #e2d8c0;
    }

    .sig-block { text-align: center; }

    .sig-line {
      border-bottom: 1px solid #1a2e4a;
      height: 36px;
      margin-bottom: 6px;
    }

    .sig-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .sig-title {
      font-size: 11px;
      color: #1a2e4a;
      font-weight: 600;
      margin-top: 2px;
    }

    /* ── QR + Verification ── */
    .verification-row {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-top: 20px;
      padding: 16px;
      background: #f8f6f0;
      border: 1px solid #e2d8c0;
    }

    .qr-img {
      width: 88px; height: 88px;
      flex-shrink: 0;
      border: 2px solid #ddd6c0;
      background: #fff;
      padding: 3px;
    }

    .verify-text { flex: 1; min-width: 0; }

    .verify-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #92836a;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .verify-url {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #1a2e4a;
      word-break: break-all;
    }

    .verify-hash {
      margin-top: 6px;
    }

    .verify-hash-val {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px;
      color: #64748b;
      word-break: break-all;
      line-height: 1.5;
    }

    /* ── Footer ── */
    .cert-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e2d8c0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
    }

    .footer-legal {
      font-size: 9.5px;
      color: #92836a;
      line-height: 1.6;
      max-width: 480px;
    }

    .footer-reg {
      text-align: right;
      font-size: 9.5px;
      color: #92836a;
      flex-shrink: 0;
    }

    /* ── Print ── */
    .print-hint {
      max-width: 820px;
      margin: 14px auto 0;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }

    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; }
      .print-hint { display: none; }
    }

    @page { margin: 10mm; size: A4; }
  </style>
</head>
<body>
  <div class="page">
    <div class="border-outer">
      <div class="border-inner">

        ${watermarkText ? `<div class="watermark">${watermarkText}</div>` : ""}

        <!-- Header -->
        <header class="cert-header">
          <div class="org-block">
            <div class="org-emblem">
              <div class="emblem-circle">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="15" r="13" stroke="#b8973a" stroke-width="1.5" fill="none"/>
                  <path d="M9 15 L15 8 L21 15 L15 22 Z" fill="#b8973a" opacity="0.9"/>
                  <circle cx="15" cy="15" r="3" fill="#fffef9"/>
                </svg>
              </div>
              <div>
                <p class="org-name">Digaf Microcredit Provider SC</p>
                <p class="org-sub">Addis Ababa, Ethiopia &nbsp;·&nbsp; Authorised Under NBE Directive</p>
              </div>
            </div>
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

        <!-- Fields -->
        <div class="fields-grid">
          <div class="field">
            <p class="field-label">Shareholder Name</p>
            <p class="field-value">${escapeHtml(certificate.shareholder_name)}</p>
          </div>
          <div class="field">
            <p class="field-label">Share Class</p>
            <p class="field-value">${escapeHtml(certificate.share_class)}</p>
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
          <div class="field">
            <p class="field-label">Issuing Entity</p>
            <p class="field-value">${escapeHtml(certificate.issuing_company)}</p>
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
          <img
            class="qr-img"
            src="${qrDataUri}"
            alt="Certificate verification QR code"
          />
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
            This document should be retained in a safe place. Loss must be reported to the Company Secretary immediately.
          </p>
          <div class="footer-reg">
            <p>Registered: Addis Ababa, Ethiopia</p>
            <p>Supervised by: National Bank of Ethiopia</p>
          </div>
        </div>

      </div><!-- border-inner -->
    </div><!-- border-outer -->
  </div><!-- page -->

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
        c.share_class_id,
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
      shareClassId: certificate.share_class_id,
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
      shareClassId: cert.share_class_id,
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
           qr_token = $4,
           updated_at = now()
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
