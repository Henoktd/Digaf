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
const digafMarkDataUri = `data:image/png;base64,${fs
  .readFileSync(path.join(__dirname, "../assets/digaf-mark.png"))
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

    const statusBannerHtml = certificate.status !== "issued"
      ? `<div style="text-align:center;margin-top:6px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${certificate.status === "revoked" ? "#991b1b" : "#92400e"}">${escapeHtml(certificate.status.toUpperCase())}</div>`
      : "";

    const html = `<!doctype html>
<html lang="am">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Share Certificate — ${escapeHtml(certificate.serial_number)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Noto+Sans+Ethiopic:wght@400;500;600;700&family=Noto+Serif+Ethiopic:wght@500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #cfcbc2;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 24px;
    }

    @page { size: A4 landscape; margin: 0; }

    @media print {
      html, body { width: 297mm; height: 210mm; margin: 0; padding: 0; background: #fff; overflow: hidden; }
      .print-hint { display: none; }
    }

    .am { font-family: 'Noto Sans Ethiopic', 'Archivo', sans-serif; }
    .am-serif { font-family: 'Noto Serif Ethiopic', 'Cormorant Garamond', serif; }
    .serif { font-family: 'Cormorant Garamond', 'Noto Serif Ethiopic', serif; }

    .sheet {
      position: relative;
      width: 1123px;
      height: 794px;
      background: #fbfaf6;
      overflow: hidden;
      font-family: 'Archivo', 'Noto Sans Ethiopic', sans-serif;
      color: #15122e;
      box-shadow: 0 18px 50px rgba(21,18,46,.22);
    }

    .guilloche {
      position: absolute; inset: 0; pointer-events: none; opacity: .55;
      background-image:
        repeating-radial-gradient(circle at 18% 22%, transparent 0 7px, rgba(109,84,173,.05) 7px 8px),
        repeating-radial-gradient(circle at 82% 78%, transparent 0 7px, rgba(109,84,173,.05) 7px 8px),
        repeating-linear-gradient(46deg, rgba(168,130,63,.045) 0 2px, transparent 2px 7px),
        repeating-linear-gradient(-46deg, rgba(168,130,63,.045) 0 2px, transparent 2px 7px);
    }

    .mark-watermark {
      position: absolute; top: 50%; left: 50%; width: 520px; height: 430px;
      transform: translate(-50%,-46%);
      background: url('${digafMarkDataUri}') center/contain no-repeat;
      opacity: .045; pointer-events: none;
    }

    .status-watermark {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-family: 'Cormorant Garamond', serif;
      font-size: 84px; font-weight: 700; letter-spacing: 0.1em;
      color: ${watermarkColor};
      -webkit-text-stroke: 2px ${watermarkStroke};
      opacity: 0.55; pointer-events: none; user-select: none; white-space: nowrap; z-index: 6;
    }

    .frame-outer { position: absolute; inset: 16px; border: 1.5px solid #a8823f; border-radius: 2px; pointer-events: none; }
    .frame-inner { position: absolute; inset: 23px; border: 0.75px solid rgba(109,84,173,.4); border-radius: 1px; pointer-events: none; }
    .corner { position: absolute; width: 12px; height: 12px; background: #a8823f; transform: rotate(45deg); }
    .corner-tl { top: 10px; left: 10px; } .corner-tr { top: 10px; right: 10px; }
    .corner-bl { bottom: 10px; left: 10px; } .corner-br { bottom: 10px; right: 10px; }

    .content { position: relative; height: 100%; padding: 16px 50px 14px; display: flex; flex-direction: column; z-index: 1; }

    .cert-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .org-logo-img { height: 44px; width: auto; display: block; }
    .entity-block { text-align: right; padding-top: 2px; }
    .entity-am { font-family: 'Cormorant Garamond', 'Noto Serif Ethiopic', serif; font-weight: 600; font-size: 17px; color: #15122e; line-height: 1.1; }
    .entity-en { font-size: 10.5px; letter-spacing: .14em; color: #6d54ad; font-weight: 600; margin-top: 4px; }

    .title-block { text-align: center; margin-top: 5px; }
    .title-am { font-family: 'Cormorant Garamond', 'Noto Serif Ethiopic', serif; font-size: 19px; color: #6d54ad; font-weight: 600; letter-spacing: .02em; }
    .title-en-row { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 4px; }
    .title-rule { height: 1px; width: 120px; }
    .title-rule-l { background: linear-gradient(90deg, transparent, #a8823f); }
    .title-rule-r { background: linear-gradient(90deg, #a8823f, transparent); }
    .title-diamond { width: 6px; height: 6px; background: #a8823f; transform: rotate(45deg); flex: none; }
    .title-en { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 27px; letter-spacing: .14em; color: #15122e; text-transform: uppercase; }

    .meta-strip { display: flex; border-top: 1px solid rgba(21,18,46,.16); border-bottom: 1px solid rgba(21,18,46,.16); margin-top: 10px; }
    .meta-cell { flex: 1; padding: 4px 16px; }
    .meta-cell + .meta-cell { border-left: 1px solid rgba(21,18,46,.12); }
    .meta-cell.wide { flex: 1.2; }
    .meta-label { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: #8a8499; font-weight: 600; }
    .meta-value { font-size: 14px; font-weight: 600; color: #15122e; margin-top: 1px; }
    .meta-value.certno { font-family: 'Archivo'; font-size: 15px; font-weight: 700; letter-spacing: .04em; color: #a8823f; margin-top: 3px; }

    .legal { text-align: center; margin: 4px auto 0; max-width: 900px; }
    .legal-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 10px; line-height: 1.35; color: #3f3a55; }
    .legal-en { font-size: 9.5px; line-height: 1.3; color: #6b6685; margin-top: 3px; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 46px; margin-top: 5px; }
    .col-head { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(21,18,46,.14); padding-bottom: 3px; margin-bottom: 2px; }
    .col-diamond { width: 7px; height: 7px; background: #a8823f; transform: rotate(45deg); flex: none; }
    .col-title-am { font-family: 'Cormorant Garamond', 'Noto Serif Ethiopic', serif; font-size: 15px; font-weight: 600; color: #6d54ad; }
    .col-title-en { font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: #a8823f; font-weight: 600; margin-left: auto; }
    .col-subtitle { font-size: 9.5px; color: #8a8499; font-style: italic; margin: 2px 0 4px; }
    .kv-row { display: flex; align-items: baseline; padding: 1.5px 0; border-bottom: 1px dotted rgba(21,18,46,.16); }
    .kv-row:last-child { border-bottom: none; }
    .kv-label { flex: 1; font-size: 11px; color: #6b6685; }
    .kv-value { font-size: 13px; font-weight: 600; }
    .kv-value.muted { color: #9a95a8; }
    .kv-unit { color: #6d54ad; font-weight: 500; }

    .shareholder-panel {
      margin-top: 4px; background: rgba(109,84,173,.045); border: 1px solid rgba(109,84,173,.18);
      border-left: 3px solid #a8823f; border-radius: 2px; padding: 5px 20px;
    }
    .shareholder-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .shareholder-title-am { font-family: 'Cormorant Garamond', 'Noto Serif Ethiopic', serif; font-size: 15px; font-weight: 600; color: #6d54ad; }
    .shareholder-title-en { font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: #a8823f; font-weight: 600; }
    .certify-row { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
    .certify-label { font-size: 11px; color: #6b6685; padding-bottom: 6px; }
    .shareholder-name { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 23px; font-weight: 600; color: #15122e; line-height: 1; border-bottom: 1.5px solid #a8823f; padding: 0 14px 3px; }
    .shareholder-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 26px; margin-top: 7px; }
    .shareholder-grid .kv-row { padding: 3px 0; }
    .shareholder-grid .kv-label { font-size: 10.5px; }

    .transfer-note { text-align: center; margin-top: 4px; }
    .transfer-am { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 9.5px; color: #6b6685; font-style: italic; }
    .transfer-en { font-size: 9.5px; color: #8a8499; font-style: italic; margin-top: 1px; }

    .status-line { text-align: center; margin-top: 8px; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }

    .bottom-block { margin-top: auto; }
    .footer-row { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 8px; }
    .sig-col { text-align: center; width: 230px; }
    .sig-gap { height: 30px; }
    .sig-line { border-top: 1.2px solid #15122e; padding-top: 5px; }
    .sig-label-am { font-family: 'Noto Serif Ethiopic', serif; font-size: 11px; font-weight: 600; color: #15122e; }
    .sig-label-en { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: #8a8499; margin-top: 1px; }

    .verify-col { display: flex; align-items: center; gap: 16px; padding-bottom: 2px; text-align: center; }
    .qr-img { width: 62px; height: 62px; padding: 4px; background: #fff; border: 1px solid rgba(21,18,46,.18); display: block; }
    .verify-caption { font-size: 6.5px; letter-spacing: .1em; text-transform: uppercase; color: #8a8499; margin-top: 3px; font-weight: 600; }

    .print-hint { width: 1123px; margin: 10px auto 0; text-align: center; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="guilloche"></div>
    <div class="mark-watermark"></div>
    ${watermarkText ? `<div class="status-watermark">${watermarkText}</div>` : ""}

    <div class="frame-outer"></div>
    <div class="frame-inner"></div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <div class="content">

      <!-- Header -->
      <div class="cert-header">
        <img class="org-logo-img" src="${digafLogoDataUri}" alt="Digaf MFI" />
        <div class="entity-block">
          <div class="entity-am am-serif">ድጋፍ አነስተኛ ብድር አቅራቢ አ/ማ</div>
          <div class="entity-en">DIGAF MICRO CREDIT PROVIDER S.Co.</div>
        </div>
      </div>

      <!-- Title -->
      <div class="title-block">
        <div class="title-am am-serif">የአክሲዮን ሰርተፊኬት</div>
        <div class="title-en-row">
          <span class="title-rule title-rule-l"></span>
          <span class="title-diamond"></span>
          <span class="title-en">Share Certificate</span>
          <span class="title-diamond"></span>
          <span class="title-rule title-rule-r"></span>
        </div>
      </div>

      <!-- Meta strip -->
      <div class="meta-strip">
        <div class="meta-cell">
          <div class="meta-label">No. of Registered Shares</div>
          <div class="meta-value">${escapeHtml(Number(certificate.quantity).toLocaleString("en-US"))}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Date of Registration</div>
          <div class="meta-value">${escapeHtml(formatCertificateDate(certificate.issue_date))}</div>
        </div>
        <div class="meta-cell wide">
          <div class="meta-label">Certificate No.</div>
          <div class="meta-value certno">${escapeHtml(certificate.serial_number)}</div>
        </div>
      </div>

      <!-- Legal -->
      <div class="legal">
        <div class="legal-am am">
          ድጋፍ አነስተኛ ብድር አቅራቢ አ.ማ በአነስተኛ የፋይናንስ ስራ አዋጅ ቁጥር ${escapeHtml(certificate.proclamation_reference ?? "40/96")} መሰረት ተቋቁሞ ፈቃድ ቁጥር
          ${escapeHtml(certificate.license_number ?? "MFI/027/2005")} በብሔራዊ ባንክ ተሰጥቶት፣ በንግድ ምዝገባ ቁጥር ${escapeHtml(certificate.trade_registration_number ?? "10/2/5481/97")}
          በ28/07/2005 ዓ.ም የተመዘገበ ተቋም ነው።
        </div>
        <div class="legal-en">
          Digaf Micro Credit Provider S.Co. was established &amp; operating as per Micro Finance Proclamation #${escapeHtml(certificate.proclamation_reference ?? "40/96")}
          and licensed by NBE ${escapeHtml(certificate.license_number ?? "MFI/027/2005")}, registered under Trade Registration #${escapeHtml(certificate.trade_registration_number ?? "10/2/5481/97")}
          on 28/07/2005 GC.
        </div>
      </div>

      <!-- Two columns -->
      <div class="two-col">
        <div>
          <div class="col-head">
            <span class="col-diamond"></span>
            <span class="col-title-am am-serif">የዋና መሥሪያ ቤት አድራሻ</span>
            <span class="col-title-en">Head Office Address</span>
          </div>
          <div class="kv-row"><span class="kv-label">ከተማ / City</span><span class="kv-value">${escapeHtml(certificate.head_office_city ?? "—")}</span></div>
          <div class="kv-row"><span class="kv-label">ክፍለ ከተማ / K.K.</span><span class="kv-value">${escapeHtml(certificate.head_office_kk ?? "—")}</span></div>
          <div class="kv-row"><span class="kv-label">ወረዳ / Wereda</span><span class="kv-value">${escapeHtml(certificate.head_office_wereda ?? "—")}</span></div>
          <div class="kv-row"><span class="kv-label">የቤት ቁጥር / House No.</span><span class="kv-value">${escapeHtml(certificate.head_office_house_no ?? "—")}</span></div>
          <div class="kv-row"><span class="kv-label">ፖ.ሣ.ቁ / P.O.Box</span><span class="kv-value">${escapeHtml(certificate.head_office_po_box ?? "—")}</span></div>
        </div>
        <div>
          <div class="col-head">
            <span class="col-diamond"></span>
            <span class="col-title-am am-serif">የካፒታል ዝርዝር</span>
            <span class="col-title-en">Capital Details</span>
          </div>
          <div class="col-subtitle">ሰርተፊኬቱ እስከ ተሰጠበት ቀን ድረስ / As of the date of issuance</div>
          <div class="kv-row"><span class="kv-label">የተፈቀደ ካፒታል / Authorized Capital</span><span class="kv-value">${escapeHtml(formatBirr(certificate.authorized_capital))} <span class="kv-unit">ብር/Birr</span></span></div>
          <div class="kv-row"><span class="kv-label">የተፈረመ ካፒታል / Subscribed Capital</span><span class="kv-value">${escapeHtml(formatBirr(certificate.subscribed_capital))} <span class="kv-unit">ብር/Birr</span></span></div>
          <div class="kv-row"><span class="kv-label">የተከፈለ ካፒታል / Paid-up Capital</span><span class="kv-value">${escapeHtml(formatBirr(certificate.paid_up_capital))} <span class="kv-unit">ብር/Birr</span></span></div>
        </div>
      </div>

      <!-- Shareholder panel -->
      <div class="shareholder-panel">
        <div class="shareholder-head">
          <span class="shareholder-title-am am-serif">የባለአክሲዮን መረጃ</span>
          <span class="shareholder-title-en">Shareholder Information</span>
        </div>
        <div class="certify-row">
          <span class="certify-label">ይህ የምስክር ወረቀት የሚረጋግጠው (አቶ/ወ/ሮ/ወ/ት) / This is to certify that (Ato/Wcro/Wt/Mr/s)</span>
          <span class="shareholder-name">${escapeHtml(certificate.shareholder_name)}</span>
        </div>
        <div class="shareholder-grid">
          <div class="kv-row"><span class="kv-label">እያንዳንዱ የብር ዋጋ / Par value (Birr)</span><span class="kv-value">${escapeHtml(formatBirr(certificate.par_value))}</span></div>
          <div class="kv-row"><span class="kv-label">የአክሲዮን ብዛት / No. of Shares</span><span class="kv-value">${escapeHtml(Number(certificate.quantity).toLocaleString("en-US"))}</span></div>
          <div class="kv-row"><span class="kv-label">ስልክ ቁጥር / Tel. No.</span><span class="kv-value">${escapeHtml(certificate.mobile_number ?? "—")}</span></div>
          <div class="kv-row"><span class="kv-label">አድራሻ / Address</span><span class="kv-value${certificate.address_city ? "" : " muted"}">${escapeHtml(certificate.address_city ?? "—")}</span></div>
          <div class="kv-row"><span class="kv-label">ወረዳ / Wereda · K.K.</span><span class="kv-value${certificate.wereda_kk ? "" : " muted"}">${escapeHtml(certificate.wereda_kk ?? "—")}</span></div>
          <div class="kv-row"><span class="kv-label">ቀበሌ / Kebele</span><span class="kv-value${certificate.kebele ? "" : " muted"}">${escapeHtml(certificate.kebele ?? "—")}</span></div>
        </div>
      </div>

      ${statusBannerHtml}

      <div class="bottom-block">
      <!-- Transfer note -->
      <div class="transfer-note">
        <div class="transfer-am am">ይህ አክሲዮን ለማንኛውም ኢትዮጵያዊ ዜጋ ይህን ሰርተፊኬት በማስረከብ ሊተላለፍ ይችላል፤ ለውጭ ዜጋ ሊተላለፍ አይችልም።</div>
        <div class="transfer-en">Share may be transferred to any Ethiopian national upon surrender of this certificate. No share may be transferred to foreigners.</div>
      </div>

      <!-- Footer -->
      <div class="footer-row">
        <div class="sig-col">
          <div class="sig-gap"></div>
          <div class="sig-line">
            <div class="sig-label-am am-serif">ዋና ሥራ አስኪያጅ</div>
            <div class="sig-label-en">Chief Executive Officer</div>
          </div>
        </div>

        <div class="verify-col">
          <div>
            <img class="qr-img" src="${qrDataUri}" alt="Certificate verification QR code" />
            <div class="verify-caption">Scan to verify</div>
          </div>
        </div>

        <div class="sig-col">
          <div class="sig-gap"></div>
          <div class="sig-line">
            <div class="sig-label-am am-serif">የቦርድ ሊቀመንበር</div>
            <div class="sig-label-en">Chairman of the Board</div>
          </div>
        </div>
      </div>
      </div><!-- /.bottom-block -->

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
