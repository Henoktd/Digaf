import { Router } from "express";
import { pool } from "../db/pool";
import * as QRCode from "qrcode";
import fs from "fs";
import path from "path";
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

// Logo assets loaded once at module init. apps/api/vercel.json's
// `includeFiles` config ensures these binary files ship with the
// serverless bundle in production, not just locally.
const digafLogoDataUri = `data:image/png;base64,${fs
  .readFileSync(path.join(__dirname, "../assets/digaf-logo.png"))
  .toString("base64")}`;
const digafLogoTinyDataUri = `data:image/png;base64,${fs
  .readFileSync(path.join(__dirname, "../assets/digaf-logo-tiny.png"))
  .toString("base64")}`;

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

function formatBirr(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const {
    shareholder_id,
    quantity,
    serial_number,
    authorized_capital,
    subscribed_capital,
    paid_up_capital,
    par_value,
  } = req.body ?? {};

  if (!shareholder_id || !quantity || !serial_number) {
    return sendBadRequest(res, "shareholder_id, quantity, and serial_number are required");
  }
  if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
    return sendBadRequest(res, "quantity must be a positive number");
  }
  for (const [label, value] of [
    ["authorized_capital", authorized_capital],
    ["subscribed_capital", subscribed_capital],
    ["paid_up_capital", paid_up_capital],
    ["par_value", par_value],
  ] as const) {
    if (value !== undefined && value !== null && value !== "" && (isNaN(Number(value)) || Number(value) < 0)) {
      return sendBadRequest(res, `${label} must be a non-negative number`);
    }
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
        (entity_id, shareholder_id, quantity, serial_number, status, authorized_capital, subscribed_capital, paid_up_capital, par_value)
       VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8)
       RETURNING certificate_id, serial_number, status, created_at`,
      [
        entity_id,
        shareholder_id,
        Number(quantity),
        serial_number,
        authorized_capital || null,
        subscribed_capital || null,
        paid_up_capital || null,
        par_value || null,
      ]
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
          $2,
          'Certificate render data accessed for PDF preview'
        )
        `,
        [certificateId, req.auth?.actorId ?? null]
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
        e.head_office_city,
        e.head_office_wereda,
        e.head_office_kk,
        e.head_office_house_no,
        e.head_office_po_box,
        e.trade_registration_number,
        e.license_number,
        e.proclamation_reference,
        s.legal_name AS shareholder_name,
        s.address_city,
        s.wereda_kk,
        s.kebele,
        s.house_no,
        s.mobile_number,
        c.quantity,
        c.issue_date,
        c.status,
        c.revocation_status,
        c.certificate_hash,
        c.hash_algorithm,
        c.qr_token,
        c.signature_token,
        c.authorized_capital,
        c.subscribed_capital,
        c.paid_up_capital,
        c.par_value
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
          $2,
          'Certificate print preview accessed'
        )
        `,
        [certificateId, req.auth?.actorId ?? null]
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
    const watermarkColor = isRevoked ? "rgba(185,28,28,0.12)" : "rgba(100,116,139,0.10)";
    const watermarkStroke = isRevoked ? "#b91c1c" : "#64748b";

    const html = `<!doctype html>
<html lang="am">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Share Certificate — ${escapeHtml(certificate.serial_number)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');

    @page {
      size: A4 landscape;
      margin: 9mm;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 18px;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #2a2a3a;
      background: #d7d4cd;
    }

    .am { font-family: 'Noto Sans Ethiopic', 'Inter', sans-serif; }
    .serif { font-family: 'EB Garamond', Georgia, serif; }

    .page {
      width: 280mm;
      margin: 0 auto;
      background: #fffef9;
      box-shadow: 0 22px 64px rgba(0,0,0,0.24);
      position: relative;
    }

    .border-outer {
      margin: 10px;
      border: 3px solid #4a2c73;
      padding: 8px;
      position: relative;
    }

    .border-inner {
      border: 1px solid #b39ce6;
      padding: 16px 26px 18px;
      position: relative;
      overflow: hidden;
    }

    .icon-watermark-pattern {
      position: absolute;
      inset: 0;
      background-image: url('${digafLogoTinyDataUri}');
      background-repeat: repeat;
      background-size: 230px 150px;
      opacity: 0.4;
      z-index: 0;
      pointer-events: none;
    }

    .cert-content { position: relative; z-index: 1; }

    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 84px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: ${watermarkColor};
      -webkit-text-stroke: 2px ${watermarkStroke};
      opacity: 0.55;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
      z-index: 5;
    }

    .gold-rule { border: none; border-top: 1.5px solid #c9a25a; margin: 9px 0; }

    /* Header: big logo top-left, title centered, entity name top-right */
    .cert-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .header-logo-block { flex-shrink: 0; }
    .org-logo-img { height: 64px; width: auto; display: block; }

    .header-title-block { flex: 1; text-align: center; padding-top: 8px; }
    .title-am-big { font-size: 24px; font-weight: 700; color: #1a1a2e; }
    .title-en-big { font-family: 'EB Garamond', Georgia, serif; font-size: 15px; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; color: #771bfa; margin-top: 3px; }

    .header-entity-block { flex-shrink: 0; text-align: right; padding-top: 8px; max-width: 260px; }
    .entity-am { font-size: 12px; font-weight: 700; color: #4a2c73; white-space: nowrap; }
    .entity-en { font-size: 11px; font-weight: 700; color: #1a1a2e; white-space: nowrap; margin-top: 2px; }

    /* Meta row: plain English, single line */
    .meta-row {
      display: flex; justify-content: space-between; align-items: baseline;
      gap: 18px; font-size: 11px; font-weight: 600; color: #1a1a2e; flex-wrap: wrap;
    }
    .meta-row .value { font-weight: 700; }
    .meta-row .certno-value { color: #b03a3a; }

    .legal-paragraph {
      margin: 9px 0; padding: 9px 14px; background: #f2eef7; border-radius: 4px; text-align: left;
    }
    .legal-paragraph .am { font-size: 8.5px; color: #1a1a2e; line-height: 1.5; }
    .legal-paragraph .en { font-size: 8px; color: #44425a; line-height: 1.45; margin-top: 5px; }

    .two-col-flow { display: flex; gap: 30px; margin: 9px 0; }
    .flow-col { flex: 1; min-width: 0; }

    .section-title-am { font-size: 10.5px; font-weight: 700; color: #4a2c73; }
    .section-title-en { font-size: 9px; font-weight: 700; color: #4a2c73; }
    .section-subtitle { font-size: 7.5px; color: #6b6b80; margin-top: 1px; }

    .flow-line { font-size: 9px; color: #1a1a2e; margin-top: 7px; }
    .flow-line .field { margin-right: 22px; white-space: nowrap; }
    .flow-line .label-am { font-weight: 600; }
    .flow-line .label-en { color: #6b6b80; }
    .flow-line .value { font-weight: 700; }

    .status-banner { text-align: center; margin: 6px 0; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    .status-issued  { color: #166534; }
    .status-draft   { color: #92400e; }
    .status-revoked { color: #991b1b; }

    .shareholder-name-inline { font-family: 'EB Garamond', Georgia, serif; font-size: 14px; font-weight: 700; color: #1a1a2e; }

    .transfer-note {
      margin: 9px 0; padding: 7px 0 7px 12px; border-left: 3px solid #4a2c73; text-align: left;
    }
    .transfer-note .am { font-size: 8px; color: #2a2a3a; line-height: 1.5; }
    .transfer-note .en { font-size: 7.5px; color: #5a5a6e; line-height: 1.4; margin-top: 3px; }

    .bottom-footer {
      display: flex; gap: 30px; align-items: flex-end; margin-top: 16px;
    }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; flex: 1; }
    .sig-block { text-align: center; }
    .sig-line { border-top: 1px solid #4a2c73; padding-top: 5px; margin-top: 34px; }
    .sig-label-am { font-size: 10px; color: #1a1a2e; font-weight: 600; }
    .sig-label-en { font-size: 8px; color: #6b6b80; margin-top: 1px; }

    .verify-block { flex-shrink: 0; text-align: center; }
    .qr-img { width: 46px; height: 46px; border: 1px solid #ddd6c0; background: #fff; padding: 2px; }

    .print-hint { width: 280mm; margin: 10px auto 0; text-align: center; font-size: 11px; color: #64748b; }

    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; width: 100%; }
      .print-hint { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="border-outer">
      <div class="border-inner">

        <div class="icon-watermark-pattern"></div>
        ${watermarkText ? `<div class="watermark">${watermarkText}</div>` : ""}

        <div class="cert-content">

        <!-- Header: big logo top-left, title centered, entity name top-right -->
        <header class="cert-header">
          <div class="header-logo-block">
            <img class="org-logo-img" src="${digafLogoDataUri}" alt="Digaf MFI" />
          </div>

          <div class="header-title-block">
            <p class="title-am-big am">የአክሲዮን ሠርተፌኬት</p>
            <p class="title-en-big">Share Certificate</p>
          </div>

          <div class="header-entity-block">
            <p class="entity-am am">ድጋፍ አነስተኛ ብድር አቅራቢ አ/ማ</p>
            <p class="entity-en">DIGAF MICRO CREDIT PROVIDER S.Co.</p>
          </div>
        </header>

        <hr class="gold-rule" />

        <!-- Meta row: plain English, single line -->
        <div class="meta-row">
          <span>No. of Registered Shares: <span class="value">${escapeHtml(Number(certificate.quantity).toLocaleString("en-US"))}</span></span>
          <span>Date of Registration: <span class="value">${escapeHtml(formatCertificateDate(certificate.issue_date))}</span></span>
          <span>Certificate No.: <span class="value certno-value">${escapeHtml(certificate.serial_number)}</span></span>
        </div>

        <!-- Legal Declaration -->
        <div class="legal-paragraph">
          <p class="am">
            ድጋፍ አነስተኛ ብድር አቅራቢ አ/ማ በአነስተኛ የፋይናንስ ስራ አዋጅ ቁጥር ${escapeHtml(certificate.proclamation_reference ?? "40/96")} መሠረት
            በኢ.ብ.ባ. ፈቃድ ቁጥር ${escapeHtml(certificate.license_number ?? "MFI/027/2005")} እና በንግድ ም.ቁጥር
            ${escapeHtml(certificate.trade_registration_number ?? "10/2/5481/97")} በ28/07/2005 እ.ኤ.አ. ጀምሮ ስራ ላይ ያለ የአነስተኛ ፋይናንስ ተቋም ነው።
          </p>
          <p class="en">
            Digaf Micro Credit Provider S.Co. was established &amp; operating as per Micro Finance Proclamation # ${escapeHtml(certificate.proclamation_reference ?? "40/96")}
            and licensed by NBE ${escapeHtml(certificate.license_number ?? "MFI/027/2005")} registered under Trade Registration #
            ${escapeHtml(certificate.trade_registration_number ?? "10/2/5481/97")} on 28/07/2005 GC.
          </p>
        </div>

        <!-- Head Office Address + Capital Details -->
        <div class="two-col-flow">
          <div class="flow-col">
            <p class="section-title-am am">የዋና መሥሪያ ቤት አድራሻ</p>
            <p class="section-title-en">Head Office Address</p>
            <p class="flow-line">
              <span class="field"><span class="label-am am">ከተማ</span> <span class="label-en">/ City:</span> <span class="value">${escapeHtml(certificate.head_office_city ?? "—")}</span></span>
              <span class="field"><span class="label-am am">ክፍለ ከተማ</span> <span class="label-en">/ K.K:</span> <span class="value">${escapeHtml(certificate.head_office_kk ?? "—")}</span></span>
            </p>
            <p class="flow-line">
              <span class="field"><span class="label-am am">ወረዳ</span> <span class="label-en">/ Wereda:</span> <span class="value">${escapeHtml(certificate.head_office_wereda ?? "—")}</span></span>
              <span class="field"><span class="label-am am">የቤት ቁጥር</span> <span class="label-en">/ House No:</span> <span class="value">${escapeHtml(certificate.head_office_house_no ?? "—")}</span></span>
            </p>
            <p class="flow-line">
              <span class="field"><span class="label-am am">ፖ.ሣ.ቁ</span> <span class="label-en">/ P.O.Box:</span> <span class="value">${escapeHtml(certificate.head_office_po_box ?? "—")}</span></span>
            </p>
          </div>
          <div class="flow-col">
            <p class="section-title-am am">የካፒታል ዝርዝር</p>
            <p class="section-title-en">Capital Details</p>
            <p class="section-subtitle"><span class="am">ይህ ሠርተፌኬት በተሰጠበት ቀን</span> / As of the date of issuance:</p>
            <p class="flow-line">
              <span class="field"><span class="label-am am">የተፈቀደለት ካፒታል</span> <span class="label-en">/ Authorized Capital:</span> <span class="value">${escapeHtml(formatBirr(certificate.authorized_capital))} ብር/Birr</span></span>
            </p>
            <p class="flow-line">
              <span class="field"><span class="label-am am">የተፈረመ ካፒታል</span> <span class="label-en">/ Subscribed Capital:</span> <span class="value">${escapeHtml(formatBirr(certificate.subscribed_capital))} ብር/Birr</span></span>
            </p>
            <p class="flow-line">
              <span class="field"><span class="label-am am">የተከፈለ ካፒታል</span> <span class="label-en">/ Paid up Capital:</span> <span class="value">${escapeHtml(formatBirr(certificate.paid_up_capital))} ብር/Birr</span></span>
            </p>
          </div>
        </div>

        <hr class="gold-rule" />

        <!-- Shareholder Information -->
        <p class="section-title-am am">የባለአክሲዮኑ መረጃ</p>
        <p class="section-title-en">Shareholder Information</p>

        <p class="flow-line">
          <span class="label-am am">ይህ ሰርተፊኬት ለ (አቶ/ወ/ሮ/ወ/ት/ድርጅት)</span> <span class="label-en">/ This is to certify that (Ato/W/ro/W/t/M/s):</span>
          <span class="shareholder-name-inline">${escapeHtml(certificate.shareholder_name)}</span>
        </p>

        <p class="flow-line">
          <span class="field"><span class="label-am am">እያንዳንዱ ዋጋ/ፐር ሻር/ ብር</span> <span class="label-en">/ Each par value of Birr:</span> <span class="value">${escapeHtml(formatBirr(certificate.par_value))}</span></span>
          <span class="field"><span class="label-am am">የሆኑ አክሲዮኖች ባለ ይዞታ</span> <span class="label-en">/ Each:</span> <span class="value">${escapeHtml(Number(certificate.quantity).toLocaleString("en-US"))}</span></span>
        </p>

        <p class="flow-line">
          <span class="field"><span class="label-am am">አድራሻ ከተማ</span> <span class="label-en">/ Address City:</span> <span class="value">${escapeHtml(certificate.address_city ?? "—")}</span></span>
          <span class="field"><span class="label-am am">ወረዳ</span> <span class="label-en">/ Wereda/K.K:</span> <span class="value">${escapeHtml(certificate.wereda_kk ?? "—")}</span></span>
          <span class="field"><span class="label-am am">ቀበሌ</span> <span class="label-en">/ Kebele:</span> <span class="value">${escapeHtml(certificate.kebele ?? "—")}</span></span>
        </p>

        <p class="flow-line">
          <span class="field"><span class="label-am am">የቤት ቁጥር</span> <span class="label-en">/ House No.:</span> <span class="value">${escapeHtml(certificate.house_no ?? "—")}</span></span>
          <span class="field"><span class="label-am am">የስልክ ቁጥር</span> <span class="label-en">/ Tel. No.:</span> <span class="value">${escapeHtml(certificate.mobile_number ?? "—")}</span></span>
        </p>

        ${certificate.status !== "issued" ? `
        <div class="status-banner status-${escapeHtml(certificate.status)}">${escapeHtml(certificate.status.toUpperCase())}</div>
        ` : ""}

        <!-- Transfer restriction note -->
        <div class="transfer-note">
          <p class="am">
            ማሳሰቢያ: ይህንን ሰርተፊኬት በመመለስና የተዘጋጀውን ቅጽ በመሙላት እነዚህን አክሲዮኖች ለኢትዮጵያዊ ዜግነት ላለው ማንኛውም ሰው በሙሉ ወይም በከፊል ማስተላለፍ ይቻላል።
          </p>
          <p class="en">
            Share may be transferred to any Ethiopian national upon surrender of this certificate. No share may be transferred to foreigners.
          </p>
        </div>

        <!-- Signatures + Verification -->
        <div class="bottom-footer">
          <div class="signatures">
            <div class="sig-block">
              <div class="sig-line">
                <p class="sig-label-am am">ዋና ስራ አስፈፃሚ</p>
                <p class="sig-label-en">CEO / Signature</p>
              </div>
            </div>
            <div class="sig-block">
              <div class="sig-line">
                <p class="sig-label-am am">የቦርድ ሊቀመንበር</p>
                <p class="sig-label-en">Board Chairman / Signature</p>
              </div>
            </div>
          </div>
          <div class="verify-block">
            <img class="qr-img" src="${qrDataUri}" alt="Certificate verification QR code" />
          </div>
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
