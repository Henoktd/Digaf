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

// Small tile of the Digaf "D" mark, used as a repeating security-paper
// watermark pattern across the certificate border, matching the official
// Digaf template's repeating diamond/logo texture.
function buildDigafIconWatermarkDataUri() {
  const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="86" viewBox="58 124 112 88">
    <g fill="#771bfa" fill-opacity="0.028">
      <path d="M130.4,133.2c-.1,0-.2,0-.3,0h0s-13.4,0-13.4,0v23.2h13.4c.1,0,.2,0,.3,0,6.4,0,11.6,5.2,11.6,11.6s-5.2,11.6-11.6,11.6-.2,0-.3,0h0s-13.4,0-13.4,0v-23.2h-23.2v46.4h36.6c.1,0,.2,0,.3,0,19.2,0,34.8-15.6,34.8-34.8s-15.6-34.8-34.8-34.8Z"/>
      <rect x="64.7" y="179.6" width="23.2" height="23.2"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(tileSvg).toString("base64")}`;
}

// A more visible, smaller tile of the same mark used to form a literal
// ring of tiny repeated logos framing the certificate border, matching
// the decorative edge of the official Digaf template.
function buildDigafIconBorderTileDataUri() {
  const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="20" viewBox="58 124 112 88">
    <g fill="#771bfa" fill-opacity="0.4">
      <path d="M130.4,133.2c-.1,0-.2,0-.3,0h0s-13.4,0-13.4,0v23.2h13.4c.1,0,.2,0,.3,0,6.4,0,11.6,5.2,11.6,11.6s-5.2,11.6-11.6,11.6-.2,0-.3,0h0s-13.4,0-13.4,0v-23.2h-23.2v46.4h36.6c.1,0,.2,0,.3,0,19.2,0,34.8-15.6,34.8-34.8s-15.6-34.8-34.8-34.8Z"/>
      <rect x="64.7" y="179.6" width="23.2" height="23.2"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(tileSvg).toString("base64")}`;
}

function formatBirr(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    const iconWatermarkDataUri = buildDigafIconWatermarkDataUri();
    const iconBorderTileDataUri = buildDigafIconBorderTileDataUri();

    const isRevoked = certificate.status === "revoked" || certificate.revocation_status === "revoked";
    const isDraft = certificate.status === "draft";
    const watermarkText = isRevoked ? "VOID" : isDraft ? "DRAFT" : null;
    const watermarkColor = isRevoked ? "rgba(185,28,28,0.13)" : "rgba(100,116,139,0.10)";
    const watermarkStroke = isRevoked ? "#b91c1c" : "#64748b";

    const html = `<!doctype html>
<html lang="am">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Share Certificate — ${escapeHtml(certificate.serial_number)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #c8c5bd;
      font-family: 'Inter', 'Noto Sans Ethiopic', 'Segoe UI', Arial, sans-serif;
      padding: 20px 16px 32px;
      color: #1a1a2e;
    }

    .am { font-family: 'Noto Sans Ethiopic', 'Inter', sans-serif; display: block; }

    .page {
      width: 277mm;
      margin: 0 auto;
      background: #fffef9;
      box-shadow: 0 24px 72px rgba(0,0,0,0.26);
      position: relative;
      overflow: hidden;
    }

    .frame-band {
      padding: 13px;
      background-image: url('${iconBorderTileDataUri}');
      background-repeat: repeat;
      background-size: 26px 20px;
    }

    .border-outer {
      margin: 0;
      border: 2.5px solid #6d28d9;
      padding: 7px;
      position: relative;
      background: #fffef9;
    }
    .border-outer::before { content: '◆'; position: absolute; top: -7px; left: -7px; color: #771bfa; font-size: 11px; line-height: 1; }
    .border-outer::after  { content: '◆'; position: absolute; bottom: -7px; right: -7px; color: #771bfa; font-size: 11px; line-height: 1; }

    .border-inner {
      border: 0.75px solid #b39ce6;
      padding: 16px 26px 16px;
      position: relative;
      overflow: hidden;
    }
    .border-inner::before { content: '◆'; position: absolute; top: -7px; left: -7px; color: #771bfa; font-size: 11px; line-height: 1; z-index: 3; }
    .border-inner::after  { content: '◆'; position: absolute; bottom: -7px; right: -7px; color: #771bfa; font-size: 11px; line-height: 1; z-index: 3; }

    .icon-watermark-pattern {
      position: absolute;
      inset: 0;
      background-image: url('${iconWatermarkDataUri}');
      background-repeat: repeat;
      background-size: 110px 86px;
      z-index: 0;
      pointer-events: none;
    }

    .cert-content {
      position: relative;
      z-index: 1;
    }

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

    .cert-header { text-align: center; padding-bottom: 4px; }
    .org-logo { height: 62px; width: auto; display: block; margin: 0 auto; }
    .org-sub-am { font-size: 10px; color: #475569; margin-top: 8px; }
    .org-sub-en { font-size: 8.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }

    .two-col-layout {
      display: flex;
      gap: 28px;
      align-items: flex-start;
      margin-top: 6px;
    }
    .col-left { flex: 1.05; min-width: 0; }
    .col-right { flex: 1; min-width: 0; }

    .title-block {
      text-align: center;
      padding: 10px 0 8px;
      margin-top: 8px;
      border-top: 1px solid #e5dff5;
      border-bottom: 1px solid #e5dff5;
    }
    .title-am-big { font-size: 26px; font-weight: 700; color: #1a2e4a; line-height: 1.25; }
    .title-en-big { font-size: 13px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #771bfa; margin-top: 5px; }
    .entity-am-sub { font-size: 11px; font-weight: 600; color: #1a2e4a; margin-top: 10px; }
    .entity-en-sub { font-size: 9px; font-weight: 600; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }

    .ornament { text-align: center; color: #771bfa; font-size: 13px; letter-spacing: 0.45em; margin: 10px 0; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0;
      margin: 0 0 8px;
      border: 0.75px solid #e0d5f5;
      border-radius: 2px;
    }
    .info-field {
      padding: 7px 10px;
      border-right: 0.75px solid #e0d5f5;
      border-bottom: 0.75px solid #e0d5f5;
      text-align: center;
    }
    .info-field:nth-child(2n) { border-right: none; }
    .info-field:nth-last-child(-n+2) { border-bottom: none; }
    .info-field:last-child { border-right: none; }
    .info-field-label-am { font-size: 8.5px; color: #475569; font-weight: 600; }
    .info-field-label-en { font-size: 7px; text-transform: uppercase; letter-spacing: 0.08em; color: #9381c4; font-weight: 700; margin-top: 1px; }
    .info-field-value { font-family: 'EB Garamond', Georgia, serif; font-size: 15px; font-weight: 700; color: #1a2e4a; margin-top: 4px; overflow-wrap: anywhere; }

    .license-paragraph {
      margin: 0 0 8px;
      padding: 9px 14px;
      background: #faf8ff;
      border: 0.75px solid #e5dff5;
      border-radius: 2px;
      text-align: center;
    }
    .license-paragraph .am { font-size: 9px; color: #1a2e4a; line-height: 1.5; }
    .license-paragraph .en { font-size: 8px; color: #64748b; line-height: 1.45; margin-top: 6px; font-style: italic; }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      margin: 0 0 8px;
      border: 0.75px solid #e0d5f5;
    }
    .details-col { padding: 8px 12px; }
    .details-col:first-child { border-right: 0.75px solid #e0d5f5; }
    .details-col-title-am { font-size: 9px; font-weight: 700; color: #1a2e4a; }
    .details-col-title-en { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #771bfa; margin-top: 1px; margin-bottom: 5px; }
    .details-col-note-am { font-size: 7px; color: #94a3b8; font-style: italic; margin-bottom: 4px; }
    .details-col-note-en { font-size: 6.5px; color: #b8aedb; font-style: italic; margin-bottom: 4px; margin-top: -2px; }

    .section-label-am { font-size: 9.5px; font-weight: 700; color: #1a2e4a; margin: 6px 0 0; }
    .section-label-en { font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #771bfa; margin-bottom: 4px; }

    .detail-row { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; padding: 2.5px 0; border-bottom: 0.5px dotted #e5dff5; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row-label-am { font-size: 8.5px; color: #475569; }
    .detail-row-label-en { font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
    .detail-row-value { font-weight: 700; color: #1a2e4a; text-align: right; white-space: nowrap; font-size: 9.5px; flex-shrink: 0; }

    .par-value-row {
      margin: 0 0 8px;
      padding: 7px 14px;
      border: 0.75px solid #e0d5f5;
      background: #faf8ff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .par-value-label-am { font-size: 9px; color: #1a2e4a; font-weight: 600; }
    .par-value-label-en { font-size: 7px; color: #771bfa; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }
    .par-value-value { font-family: 'EB Garamond', Georgia, serif; font-weight: 700; color: #1a2e4a; font-size: 15px; }

    .certifies-block { text-align: center; padding: 12px 12px 4px; }
    .certifies-intro-am { font-size: 10.5px; color: #475569; }
    .certifies-intro-en { font-size: 9px; color: #94a3b8; font-style: italic; margin-top: 2px; }
    .shareholder-name {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 25px;
      font-weight: 700;
      color: #1a2e4a;
      margin: 7px 0 3px;
      line-height: 1.15;
    }

    .address-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0;
      margin: 0 0 8px;
      border: 0.75px solid #e0d5f5;
    }
    .addr-field {
      padding: 6px 5px;
      border-right: 0.75px solid #e0d5f5;
      text-align: center;
    }
    .addr-field:last-child { border-right: none; }
    .addr-field-label-am { font-size: 7.5px; color: #475569; font-weight: 600; }
    .addr-field-label-en { font-size: 6px; text-transform: uppercase; letter-spacing: 0.03em; color: #9381c4; font-weight: 700; margin-top: 1px; }
    .addr-field-value { font-size: 10px; font-weight: 700; color: #1a2e4a; margin-top: 3px; overflow-wrap: anywhere; }

    .transfer-note {
      margin: 0 0 8px;
      padding: 7px 14px;
      background: #fdf5f5;
      border: 0.75px solid #f3dada;
      border-radius: 2px;
      text-align: center;
    }
    .transfer-note .am { font-size: 8px; color: #7f1d1d; line-height: 1.5; }
    .transfer-note .en { font-size: 7px; color: #b45959; line-height: 1.45; margin-top: 3px; font-style: italic; }

    .status-banner {
      text-align: center;
      margin: 8px 0;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .status-issued  { color: #166534; }
    .status-draft   { color: #92400e; }
    .status-revoked { color: #991b1b; }

    .bottom-footer {
      display: flex;
      gap: 28px;
      align-items: stretch;
      margin-top: 10px;
      padding-top: 12px;
      border-top: 0.75px solid #e5dff5;
    }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      flex: 1.1;
    }
    .sig-block { text-align: center; align-self: end; }
    .sig-line { border-bottom: 0.75px solid #1a2e4a; height: 28px; margin-bottom: 6px; }
    .sig-label-am { font-size: 9.5px; color: #1a2e4a; font-weight: 600; }
    .sig-label-en { font-size: 7.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

    .verification-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      padding: 9px 11px;
      background: #f8f6f0;
      border: 0.75px solid #e2d8c0;
    }
    .qr-img { width: 50px; height: 50px; flex-shrink: 0; border: 1.5px solid #ddd6c0; background: #fff; padding: 2px; }
    .verify-text { flex: 1; min-width: 0; }
    .verify-label { font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #92836a; font-weight: 700; margin-bottom: 2px; }
    .verify-url { font-family: 'Courier New', Courier, monospace; font-size: 8.5px; color: #1a2e4a; word-break: break-all; }
    .verify-hash { margin-top: 4px; }
    .verify-hash-val { font-family: 'Courier New', Courier, monospace; font-size: 7.5px; color: #64748b; word-break: break-all; line-height: 1.4; }

    .print-hint {
      width: 277mm;
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

    @page { margin: 8mm; size: A4 landscape; }
  </style>
</head>
<body>
  <div class="page">
    <div class="border-outer">
      <div class="border-inner">

        <div class="icon-watermark-pattern"></div>
        ${watermarkText ? `<div class="watermark">${watermarkText}</div>` : ""}

        <div class="cert-content">

        <!-- Header -->
        <header class="cert-header">
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
          <p class="org-sub-am am">ድጋፍ አነስተኛ የብድር አክሲዮን ማህበር አ/ማ</p>
          <p class="org-sub-en">Digaf Micro Credit Provider S.Co</p>
        </header>

        <div class="two-col-layout">
        <div class="col-left">

        <!-- Title block -->
        <div class="title-block">
          <p class="title-am-big am">የአክሲዮን ሠርተፌኬት</p>
          <p class="title-en-big">Share Certificate</p>
        </div>

        <div class="ornament">— ◆ —</div>

        <!-- Certifying text -->
        <div class="certifies-block">
          <p class="certifies-intro-am am">ይህ ሰርተፊኬት ለ (አቶ/ወ/ሮ/ወ/ት/ድርጅት)</p>
          <p class="certifies-intro-en">This is to certify that (Ato/W/ro W/t M/s)</p>
          <p class="shareholder-name">${escapeHtml(certificate.shareholder_name)}</p>
        </div>

        <!-- Shareholder Information -->
        <p class="section-label-am am">የባለአክሲዮኑ መረጃ</p>
        <p class="section-label-en">Shareholder Information</p>
        <div class="address-grid">
          <div class="addr-field">
            <p class="addr-field-label-am am">አድራሻ ከተማ</p>
            <p class="addr-field-label-en">Address City</p>
            <p class="addr-field-value">${escapeHtml(certificate.address_city ?? "—")}</p>
          </div>
          <div class="addr-field">
            <p class="addr-field-label-am am">ወረዳ ክፍለ ከተማ</p>
            <p class="addr-field-label-en">Wereda K.K</p>
            <p class="addr-field-value">${escapeHtml(certificate.wereda_kk ?? "—")}</p>
          </div>
          <div class="addr-field">
            <p class="addr-field-label-am am">ቀበሌ</p>
            <p class="addr-field-label-en">Kebele</p>
            <p class="addr-field-value">${escapeHtml(certificate.kebele ?? "—")}</p>
          </div>
          <div class="addr-field">
            <p class="addr-field-label-am am">የቤት ቁጥር</p>
            <p class="addr-field-label-en">House No.</p>
            <p class="addr-field-value">${escapeHtml(certificate.house_no ?? "—")}</p>
          </div>
          <div class="addr-field">
            <p class="addr-field-label-am am">የስልክ ቁጥር</p>
            <p class="addr-field-label-en">Tel.No.</p>
            <p class="addr-field-value">${escapeHtml(certificate.mobile_number ?? "—")}</p>
          </div>
        </div>

        <!-- Transfer restriction note -->
        <div class="transfer-note">
          <p class="am">
            ማሳሰቢያ: ይህንን ሰርተፊኬት በመመለስና የተዘጋጀውን ቅጽ በመሙላት እነዚህን አክሲዮኖች ለኢትዮጵያዊ ዜግነት ላለው ማንኛውም ሰው በሙሉ ወይም
            በከፊል ማስተላለፍ ይቻላል። ሆኖም ህጉ በስተቀር ይህንን አክሲዮን ለውጭ ሀገር ዜጋ ማስተላለፍ አይቻልም።
          </p>
          <p class="en">
            Note: Shares may be transferred to any Ethiopian national upon surrender of this certificate and completion
            of the prescribed forms of transfer. No shares may be transferred to foreigners.
          </p>
        </div>

        </div>
        <div class="col-right">

        <!-- Certificate identity grid -->
        <div class="info-grid">
          <div class="info-field">
            <p class="info-field-label-am am">የሠርተፌኬት ቁጥር</p>
            <p class="info-field-label-en">Certificate No.</p>
            <p class="info-field-value">${escapeHtml(certificate.serial_number)}</p>
          </div>
          <div class="info-field">
            <p class="info-field-label-am am">የአክሲዮን ይዞታ መጠን</p>
            <p class="info-field-label-en">No. of Registered Shares</p>
            <p class="info-field-value">${escapeHtml(Number(certificate.quantity).toLocaleString("en-US"))}</p>
          </div>
          <div class="info-field">
            <p class="info-field-label-am am">የተመዘገበበት ቀን</p>
            <p class="info-field-label-en">Date of Registered</p>
            <p class="info-field-value">${escapeHtml(formatCertificateDate(certificate.issue_date))}</p>
          </div>
          <div class="info-field">
            <p class="info-field-label-am am">ሁኔታ</p>
            <p class="info-field-label-en">Status</p>
            <p class="info-field-value status-${escapeHtml(certificate.status)}">${escapeHtml(certificate.status.toUpperCase())}</p>
          </div>
        </div>

        <!-- Legal Declaration -->
        <p class="section-label-am am">ህጋዊ መግለጫ</p>
        <p class="section-label-en">Legal Declaration</p>
        <div class="license-paragraph">
          <p class="am">
            ድጋፍ አነስተኛ ብድር አቅራቢ አ/ማ በአነስተኛ የፋይናንስ ስራ አዋጅ ቁጥር ${escapeHtml(certificate.proclamation_reference ?? "40/96")} መሠረት
            በኢ.ብ.ባ. ፈቃድ ቁጥር ${escapeHtml(certificate.license_number ?? "MFI/027/2005")} እና በንግድ ም.ቁጥር
            ${escapeHtml(certificate.trade_registration_number ?? "10/2/5481/97")} በ28/07/2005 እ.ኤ.አ. ጀምሮ ስራ ላይ ያለ የአነስተኛ ፋይናንስ ተቋም ነው።
          </p>
          <p class="en">
            Digaf Micro Credit Provider S.Co. was established &amp; operating as per Micro Finance Proclamation
            # ${escapeHtml(certificate.proclamation_reference ?? "40/96")} and licensed by National Bank of Ethiopia
            ${escapeHtml(certificate.license_number ?? "MFI/027/2005")}, registered under Trade Registration
            # ${escapeHtml(certificate.trade_registration_number ?? "10/2/5481/97")} on 28/07/2005 GC.
          </p>
        </div>

        <!-- Head office + Capital details -->
        <div class="details-grid">
          <div class="details-col">
            <p class="details-col-title-am am">የዋናው መሥሪያ ቤት አድራሻ</p>
            <p class="details-col-title-en">Head Office Address</p>
            <div class="detail-row">
              <span><span class="detail-row-label-am am">ከተማ</span><span class="detail-row-label-en">City</span></span>
              <span class="detail-row-value">${escapeHtml(certificate.head_office_city ?? "—")}</span>
            </div>
            <div class="detail-row">
              <span><span class="detail-row-label-am am">ክፍለ ከተማ</span><span class="detail-row-label-en">K.K</span></span>
              <span class="detail-row-value">${escapeHtml(certificate.head_office_kk ?? "—")}</span>
            </div>
            <div class="detail-row">
              <span><span class="detail-row-label-am am">ወረዳ</span><span class="detail-row-label-en">Wereda</span></span>
              <span class="detail-row-value">${escapeHtml(certificate.head_office_wereda ?? "—")}</span>
            </div>
            <div class="detail-row">
              <span><span class="detail-row-label-am am">የቤት ቁጥር</span><span class="detail-row-label-en">House No.</span></span>
              <span class="detail-row-value">${escapeHtml(certificate.head_office_house_no ?? "—")}</span>
            </div>
            <div class="detail-row">
              <span><span class="detail-row-label-am am">ፖ.ሣ.ቁ</span><span class="detail-row-label-en">P.O.Box</span></span>
              <span class="detail-row-value">${escapeHtml(certificate.head_office_po_box ?? "—")}</span>
            </div>
          </div>
          <div class="details-col">
            <p class="details-col-title-am am">የካፒታል ዝርዝር</p>
            <p class="details-col-title-en">Capital Details</p>
            <p class="details-col-note-am am">ይህ ሠርተፌኬት በተሰጠበት ቀን</p>
            <p class="details-col-note-en">As of the date of issuance of this certificate</p>
            <div class="detail-row">
              <span><span class="detail-row-label-am am">የተፈቀደለት ካፒታል</span><span class="detail-row-label-en">Authorized Capital</span></span>
              <span class="detail-row-value">${escapeHtml(formatBirr(certificate.authorized_capital))}</span>
            </div>
            <div class="detail-row">
              <span><span class="detail-row-label-am am">የተፈረመ ካፒታል</span><span class="detail-row-label-en">Subscribed Capital</span></span>
              <span class="detail-row-value">${escapeHtml(formatBirr(certificate.subscribed_capital))}</span>
            </div>
            <div class="detail-row">
              <span><span class="detail-row-label-am am">የተከፈለ ካፒታል</span><span class="detail-row-label-en">Paid up Capital</span></span>
              <span class="detail-row-value">${escapeHtml(formatBirr(certificate.paid_up_capital))}</span>
            </div>
          </div>
        </div>

        <!-- Par value -->
        <div class="par-value-row">
          <span>
            <span class="par-value-label-am am">እያንዳንዱ ዋጋ/ፐር ሻር/ ብር</span>
            <span class="par-value-label-en">Each Per Value of Birr</span>
          </span>
          <span class="par-value-value">${escapeHtml(formatBirr(certificate.par_value))}</span>
        </div>

        ${certificate.status !== "issued" ? `
        <div class="status-banner status-${escapeHtml(certificate.status)}">${escapeHtml(certificate.status.toUpperCase())}</div>
        ` : ""}

        </div>
        </div>

        <!-- Bottom footer: signatures + verification side by side -->
        <div class="bottom-footer">
          <div class="signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <p class="sig-label-am am">ዋና ስራ አስፈፃሚ</p>
              <p class="sig-label-en">CEO</p>
              <p class="sig-label-am am" style="margin-top:3px;">ፊርማ</p>
              <p class="sig-label-en">Signature</p>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <p class="sig-label-am am">የቦርድ ሊቀመንበር</p>
              <p class="sig-label-en">Board Chairman</p>
              <p class="sig-label-am am" style="margin-top:3px;">ፊርማ</p>
              <p class="sig-label-en">Signature</p>
            </div>
          </div>

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
