import { Router } from "express";
import { pool } from "../db/pool";
import {
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendServerError,
} from "../utils/apiError";
import { requireRole } from "../utils/roles";
import {
  requireNonEmptyString,
  requireString,
  requireUuid,
} from "../utils/validation";

export const shareholderRoutes = Router();

const shareholderTypes = new Set(["individual", "institution"]);
const kycStatuses = new Set(["not_started", "pending", "verified", "expired"]);
const riskClassifications = new Set(["low", "medium", "high"]);

function normalizeOptionalString(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return null;
  }

  const stringValue = requireString(value, fieldName).trim();

  return stringValue || null;
}

function normalizeOptionalDateString(value: unknown, fieldName: string) {
  const dateString = normalizeOptionalString(value, fieldName);

  if (!dateString) {
    return null;
  }

  const parsedDate = new Date(`${dateString}T00:00:00.000Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== dateString
  ) {
    throw new Error(`${fieldName} must be a valid date string`);
  }

  return dateString;
}

function normalizeOptionalBoolean(
  value: unknown,
  fieldName: string,
  defaultValue: boolean
) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be a boolean`);
  }

  return value;
}

function normalizeNullableBoolean(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be a boolean`);
  }

  return value;
}

function normalizeOptionalUuid(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return requireUuid(value, fieldName);
}

function normalizeOptionalNumber(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    throw new Error(`${fieldName} must be a number`);
  }

  return numericValue;
}

function normalizeOptionalTimestampString(value: unknown, fieldName: string) {
  const timestampString = normalizeOptionalString(value, fieldName);

  if (!timestampString) {
    return null;
  }

  const parsedDate = new Date(timestampString);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${fieldName} must be a valid timestamp string`);
  }

  return parsedDate.toISOString();
}

function normalizeOptionalJsonArray(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }

  return value;
}

function normalizeOptionalJsonArrayOrNull(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return null;
  }

  return normalizeOptionalJsonArray(value, fieldName);
}

function requireObject(value: unknown, fieldName: string) {
  if (
    value === undefined ||
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(`${fieldName} must be an object`);
  }

  return value as Record<string, unknown>;
}

const shareholderCoreSelect = `
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
  s.shareholder_code,
  s.gender,
  s.date_of_birth,
  s.nationality,
  s.occupation,
  s.tin_number,
  s.primary_id_number,
  s.mobile_number,
  s.email_address,
  s.physical_address,
  s.address_city,
  s.wereda_kk,
  s.kebele,
  s.house_no,
  s.source_of_funds_declaration,
  s.created_at,
  s.updated_at
`;

async function fetchShareholderContext(
  client: any,
  shareholderId: string,
  lockForUpdate = false
) {
  const result = await client.query(
    `
    SELECT shareholder_id, entity_id, legal_name
    FROM shareholder
    WHERE shareholder_id = $1
    ${lockForUpdate ? "FOR UPDATE" : ""}
    `,
    [shareholderId]
  );

  return result.rows[0] ?? null;
}

async function insertShareholderAudit(
  client: any,
  input: {
    entityId: string;
    actorId: string;
    action: string;
    tableName: string;
    recordId: string;
    oldValue: unknown;
    newValue: unknown;
    sourceIp: string | null | undefined;
  }
) {
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
      $3,
      $4,
      $5,
      $6::jsonb,
      $7::jsonb,
      $8
    )
    `,
    [
      input.entityId,
      input.actorId,
      input.action,
      input.tableName,
      input.recordId,
      JSON.stringify(input.oldValue),
      JSON.stringify(input.newValue),
      input.sourceIp ?? null,
    ]
  );
}

shareholderRoutes.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT
          s.shareholder_id,
          s.entity_id,
          s.legal_name,
          s.type,
          s.status,
          s.contact_details,
          s.kyc_status,
          s.kyc_expiry,
          s.risk_classification,
          s.proxy_eligible,
          s.relationship_start_date,
          s.shareholder_code,
          s.gender,
          s.date_of_birth,
          s.nationality,
          s.occupation,
          s.tin_number,
          s.primary_id_number,
          s.mobile_number,
          s.email_address,
          s.physical_address,
          s.address_city,
          s.wereda_kk,
          s.kebele,
          s.house_no,
          s.source_of_funds_declaration,
          s.created_at,
          s.updated_at
        FROM shareholder s
        ORDER BY s.legal_name ASC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM shareholder`),
    ]);

    res.json({
      data: dataResult.rows,
      total: countResult.rows[0]?.total ?? 0,
      page,
      limit,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch shareholders",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

shareholderRoutes.get("/export", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.shareholder_id,
        s.shareholder_code,
        s.legal_name,
        s.type,
        s.gender,
        s.date_of_birth,
        s.nationality,
        s.occupation,
        s.tin_number,
        s.primary_id_number,
        s.mobile_number,
        s.email_address,
        s.physical_address,
        s.source_of_funds_declaration,
        s.kyc_status,
        s.risk_classification,
        s.status,
        so.quantity AS number_of_shares_purchased,
        sc.par_value AS par_value_per_share,
        so.effective_date AS date_of_purchase,
        sc.class_name AS share_class_name
      FROM shareholder s
      LEFT JOIN share_ownership so ON so.shareholder_id = s.shareholder_id AND so.status = 'active'
      LEFT JOIN share_class sc ON sc.share_class_id = so.share_class_id
      ORDER BY s.legal_name ASC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    return sendServerError(res, "Failed to export shareholders", error);
  }
});

shareholderRoutes.post("/", async (req, res) => {
  let entityId = "";
  let legalName = "";
  let type = "";
  let status = "";
  let email: string | null = null;
  let phone: string | null = null;
  let kycStatus = "";
  let kycExpiry: string | null = null;
  let riskClassification: string | null = null;
  let proxyEligible = false;
  let relationshipStartDate: string | null = null;
  let shareholderCode: string | null = null;
  let gender: string | null = null;
  let dateOfBirth: string | null = null;
  let nationality: string | null = null;
  let occupation: string | null = null;
  let tinNumber: string | null = null;
  let primaryIdNumber: string | null = null;
  let mobileNumber: string | null = null;
  let emailAddress: string | null = null;
  let physicalAddress: string | null = null;
  let addressCity: string | null = null;
  let weredaKk: string | null = null;
  let kebele: string | null = null;
  let houseNo: string | null = null;
  let sourceOfFundsDeclaration: string | null = null;
  let shareClassId: string | null = null;
  let initialShares: number | null = null;
  let purchaseDate: string | null = null;

  try {
    entityId = requireUuid(req.body?.entityId, "entityId");
    legalName = requireNonEmptyString(req.body?.legalName, "legalName");
    type = requireNonEmptyString(req.body?.type, "type");

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
      throw new Error(
        "kycStatus must be one of: not_started, pending, verified, expired"
      );
    }

    kycExpiry = normalizeOptionalDateString(req.body?.kycExpiry, "kycExpiry");
    riskClassification = normalizeOptionalString(
      req.body?.riskClassification,
      "riskClassification"
    );

    if (
      riskClassification !== null &&
      !riskClassifications.has(riskClassification)
    ) {
      throw new Error("riskClassification must be one of: low, medium, high");
    }

    proxyEligible = normalizeOptionalBoolean(
      req.body?.proxyEligible,
      "proxyEligible",
      false
    );
    relationshipStartDate = normalizeOptionalDateString(
      req.body?.relationshipStartDate,
      "relationshipStartDate"
    );
    shareholderCode = normalizeOptionalString(
      req.body?.shareholderCode,
      "shareholderCode"
    );
    gender = normalizeOptionalString(req.body?.gender, "gender");
    dateOfBirth = normalizeOptionalDateString(
      req.body?.dateOfBirth,
      "dateOfBirth"
    );
    nationality = normalizeOptionalString(
      req.body?.nationality,
      "nationality"
    );
    occupation = normalizeOptionalString(req.body?.occupation, "occupation");
    tinNumber = normalizeOptionalString(req.body?.tinNumber, "tinNumber");
    primaryIdNumber = normalizeOptionalString(
      req.body?.primaryIdNumber,
      "primaryIdNumber"
    );
    mobileNumber =
      normalizeOptionalString(req.body?.mobileNumber, "mobileNumber") ?? phone;
    emailAddress =
      normalizeOptionalString(req.body?.emailAddress, "emailAddress") ?? email;
    physicalAddress = normalizeOptionalString(
      req.body?.physicalAddress,
      "physicalAddress"
    );
    addressCity = normalizeOptionalString(req.body?.addressCity, "addressCity");
    weredaKk = normalizeOptionalString(req.body?.weredaKk, "weredaKk");
    kebele = normalizeOptionalString(req.body?.kebele, "kebele");
    houseNo = normalizeOptionalString(req.body?.houseNo, "houseNo");
    sourceOfFundsDeclaration = normalizeOptionalString(
      req.body?.sourceOfFundsDeclaration,
      "sourceOfFundsDeclaration"
    );
    shareClassId = normalizeOptionalUuid(req.body?.shareClassId, "shareClassId");
    initialShares = normalizeOptionalNumber(req.body?.initialShares, "initialShares");
    purchaseDate = normalizeOptionalDateString(req.body?.purchaseDate, "purchaseDate");

    if (shareClassId !== null && (initialShares === null || initialShares <= 0)) {
      throw new Error("initialShares must be a positive number when shareClassId is provided");
    }
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid shareholder create request"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "maker",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const entityResult = await client.query(
      `
      SELECT entity_id
      FROM entity
      WHERE entity_id = $1
      LIMIT 1
      `,
      [entityId]
    );

    if (entityResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Entity not found");
    }

    // Auto-generate a sequential shareholder code if not provided
    if (!shareholderCode) {
      const countResult = await client.query(
        `SELECT COUNT(*) AS cnt FROM shareholder WHERE entity_id = $1`,
        [entityId]
      );
      const nextNum = parseInt(countResult.rows[0].cnt, 10) + 1;
      shareholderCode = `DIGAF-${String(nextNum).padStart(3, "0")}`;
    }

    const contactDetails = {
      email: emailAddress,
      phone: mobileNumber,
    };

    const insertResult = await client.query(
      `
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
        relationship_start_date,
        shareholder_code,
        gender,
        date_of_birth,
        nationality,
        occupation,
        tin_number,
        primary_id_number,
        mobile_number,
        email_address,
        physical_address,
        address_city,
        wereda_kk,
        kebele,
        house_no,
        source_of_funds_declaration
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
        $10::date,
        $11,
        $12,
        $13::date,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20,
        $21,
        $22,
        $23,
        $24,
        $25
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
        shareholder_code,
        gender,
        date_of_birth,
        nationality,
        occupation,
        tin_number,
        primary_id_number,
        mobile_number,
        email_address,
        physical_address,
        address_city,
        wereda_kk,
        kebele,
        house_no,
        source_of_funds_declaration,
        created_at,
        updated_at
      `,
      [
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
        shareholderCode,
        gender,
        dateOfBirth,
        nationality,
        occupation,
        tinNumber,
        primaryIdNumber,
        mobileNumber,
        emailAddress,
        physicalAddress,
        addressCity,
        weredaKk,
        kebele,
        houseNo,
        sourceOfFundsDeclaration,
      ]
    );

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
      shareholder_code: shareholder.shareholder_code,
      gender: shareholder.gender,
      date_of_birth: shareholder.date_of_birth,
      nationality: shareholder.nationality,
      occupation: shareholder.occupation,
      tin_number: shareholder.tin_number,
      primary_id_number: shareholder.primary_id_number,
      mobile_number: shareholder.mobile_number,
      email_address: shareholder.email_address,
      physical_address: shareholder.physical_address,
      address_city: shareholder.address_city,
      wereda_kk: shareholder.wereda_kk,
      kebele: shareholder.kebele,
      house_no: shareholder.house_no,
      source_of_funds_declaration: shareholder.source_of_funds_declaration,
    };

    if (shareClassId !== null && initialShares !== null && initialShares > 0) {
      const scResult = await client.query(
        `SELECT share_class_id FROM share_class WHERE share_class_id = $1 AND entity_id = $2 AND status = 'active' LIMIT 1`,
        [shareClassId, entityId]
      );

      if (scResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return sendBadRequest(res, "Share class not found or does not belong to this entity");
      }

      const ownershipResult = await client.query(
        `
        INSERT INTO share_ownership (shareholder_id, share_class_id, quantity, effective_date, status)
        VALUES ($1, $2, $3, $4::date, 'active')
        RETURNING id
        `,
        [shareholder.shareholder_id, shareClassId, initialShares, purchaseDate ?? null]
      );

      await client.query(
        `
        INSERT INTO audit_log (entity_id, actor_id, action, table_name, record_id, old_value_json, new_value_json, source_ip)
        VALUES ($1, $2, 'share_ownership_created', 'share_ownership', $3, null, $4::jsonb, $5)
        `,
        [
          entityId,
          actorId,
          ownershipResult.rows[0].id,
          JSON.stringify({ shareholder_id: shareholder.shareholder_id, share_class_id: shareClassId, quantity: initialShares, purchase_date: purchaseDate }),
          req.ip ?? null,
        ]
      );
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
        'shareholder_created',
        'shareholder',
        $3,
        null,
        $4::jsonb,
        $5
      )
      `,
      [
        entityId,
        actorId,
        shareholder.shareholder_id,
        JSON.stringify(shareholderSummary),
        req.ip ?? null,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      data: shareholder,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to create shareholder", error);
  } finally {
    client.release();
  }
});

shareholderRoutes.patch("/:shareholderId/kyc", async (req, res) => {
  let shareholderId = "";
  let kycStatus = "";
  let kycExpiry: string | null = null;
  let riskClassification = "";
  let decisionNotes = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
    kycStatus = requireNonEmptyString(req.body?.kycStatus, "kycStatus");

    if (!kycStatuses.has(kycStatus)) {
      throw new Error(
        "kycStatus must be one of: not_started, pending, verified, expired"
      );
    }

    kycExpiry = normalizeOptionalDateString(req.body?.kycExpiry, "kycExpiry");
    riskClassification = requireNonEmptyString(
      req.body?.riskClassification,
      "riskClassification"
    );

    if (!riskClassifications.has(riskClassification)) {
      throw new Error("riskClassification must be one of: low, medium, high");
    }

    decisionNotes = requireNonEmptyString(
      req.body?.decisionNotes,
      "decisionNotes"
    );
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid shareholder KYC request"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "compliance_officer",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shareholderResult = await client.query(
      `
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
      `,
      [shareholderId]
    );

    if (shareholderResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Shareholder not found");
    }

    const shareholder = shareholderResult.rows[0];
    const oldValue = {
      kyc_status: shareholder.kyc_status,
      kyc_expiry: shareholder.kyc_expiry,
      risk_classification: shareholder.risk_classification,
    };

    const updateResult = await client.query(
      `
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
      `,
      [shareholderId, kycStatus, kycExpiry, riskClassification]
    );

    const kycRecordResult = await client.query(
      `
      SELECT id
      FROM kyc_record
      WHERE shareholder_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [shareholderId]
    );

    let kycRecord;

    if (kycRecordResult.rowCount === 0) {
      const insertKycResult = await client.query(
        `
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
        `,
        [shareholderId, kycStatus, kycExpiry, actorId]
      );

      kycRecord = insertKycResult.rows[0];
    } else {
      const updateKycResult = await client.query(
        `
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
        `,
        [kycRecordResult.rows[0].id, kycStatus, kycExpiry, actorId]
      );

      kycRecord = updateKycResult.rows[0];
    }

    const updatedShareholder = updateResult.rows[0];
    const newValue = {
      kyc_status: updatedShareholder.kyc_status,
      kyc_expiry: updatedShareholder.kyc_expiry,
      risk_classification: updatedShareholder.risk_classification,
      decisionNotes,
    };

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
        'shareholder_kyc_updated',
        'shareholder',
        $3,
        $4::jsonb,
        $5::jsonb,
        $6
      )
      `,
      [
        updatedShareholder.entity_id,
        actorId,
        shareholderId,
        JSON.stringify(oldValue),
        JSON.stringify(newValue),
        req.ip ?? null,
      ]
    );

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
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to update shareholder KYC", error);
  } finally {
    client.release();
  }
});

shareholderRoutes.get("/:shareholderId/profile-details", async (req, res) => {
  let shareholderId = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid shareholder request"
    );
  }

  try {
    const profileResult = await pool.query(
      `
      SELECT
        ${shareholderCoreSelect}
      FROM shareholder s
      JOIN entity e ON e.entity_id = s.entity_id
      WHERE s.shareholder_id = $1
      LIMIT 1
      `,
      [shareholderId]
    );

    if (profileResult.rowCount === 0) {
      return sendNotFound(res, "Shareholder not found");
    }

    const [
      identityDocumentsResult,
      kycProfileResult,
      beneficialOwnersResult,
      nextOfKinResult,
      documentChecklistResult,
      paymentProfilesResult,
    ] = await Promise.all([
      pool.query(
        `
        SELECT *
        FROM shareholder_identity_documents
        WHERE shareholder_id = $1
        ORDER BY
          CASE WHEN document_role = 'primary' THEN 0 ELSE 1 END,
          created_at DESC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT *
        FROM shareholder_kyc_profiles
        WHERE shareholder_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT *
        FROM shareholder_beneficial_owners
        WHERE shareholder_id = $1
        ORDER BY created_at DESC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT *
        FROM shareholder_next_of_kin
        WHERE shareholder_id = $1
        ORDER BY is_primary DESC, created_at DESC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT *
        FROM shareholder_document_checklist
        WHERE shareholder_id = $1
        ORDER BY document_type ASC, created_at DESC
        `,
        [shareholderId]
      ),
      pool.query(
        `
        SELECT *
        FROM shareholder_payment_profiles
        WHERE shareholder_id = $1
        ORDER BY created_at DESC
        `,
        [shareholderId]
      ),
    ]);

    return res.json({
      data: {
        core: profileResult.rows[0],
        identity_documents: identityDocumentsResult.rows,
        kyc_profile: kycProfileResult.rows[0] ?? null,
        beneficial_owners: beneficialOwnersResult.rows,
        next_of_kin: nextOfKinResult.rows,
        document_checklist: documentChecklistResult.rows,
        payment_profiles: paymentProfilesResult.rows,
      },
    });
  } catch (error) {
    return sendServerError(
      res,
      "Failed to fetch shareholder profile details",
      error
    );
  }
});

shareholderRoutes.put("/:shareholderId/core-details", async (req, res) => {
  let shareholderId = "";
  let shareholderCode: string | null = null;
  let gender: string | null = null;
  let dateOfBirth: string | null = null;
  let nationality: string | null = null;
  let occupation: string | null = null;
  let tinNumber: string | null = null;
  let nationalIdFayda: string | null = null;
  let primaryIdNumber: string | null = null;
  let mobileNumber: string | null = null;
  let emailAddress: string | null = null;
  let physicalAddress: string | null = null;
  let addressCity: string | null = null;
  let weredaKk: string | null = null;
  let kebele: string | null = null;
  let houseNo: string | null = null;
  let sourceOfFundsDeclaration: string | null = null;

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
    shareholderCode = normalizeOptionalString(
      req.body?.shareholderCode,
      "shareholderCode"
    );
    gender = normalizeOptionalString(req.body?.gender, "gender");
    dateOfBirth = normalizeOptionalDateString(
      req.body?.dateOfBirth,
      "dateOfBirth"
    );
    nationality = normalizeOptionalString(
      req.body?.nationality,
      "nationality"
    );
    occupation = normalizeOptionalString(req.body?.occupation, "occupation");
    tinNumber = normalizeOptionalString(req.body?.tinNumber, "tinNumber");
    nationalIdFayda = normalizeOptionalString(req.body?.nationalIdFayda, "nationalIdFayda");
    primaryIdNumber = normalizeOptionalString(
      req.body?.primaryIdNumber,
      "primaryIdNumber"
    );
    mobileNumber =
      normalizeOptionalString(req.body?.mobileNumber, "mobileNumber") ??
      normalizeOptionalString(req.body?.phone, "phone");
    emailAddress =
      normalizeOptionalString(req.body?.emailAddress, "emailAddress") ??
      normalizeOptionalString(req.body?.email, "email");
    physicalAddress = normalizeOptionalString(
      req.body?.physicalAddress,
      "physicalAddress"
    );
    addressCity = normalizeOptionalString(req.body?.addressCity, "addressCity");
    weredaKk = normalizeOptionalString(req.body?.weredaKk, "weredaKk");
    kebele = normalizeOptionalString(req.body?.kebele, "kebele");
    houseNo = normalizeOptionalString(req.body?.houseNo, "houseNo");
    sourceOfFundsDeclaration = normalizeOptionalString(
      req.body?.sourceOfFundsDeclaration,
      "sourceOfFundsDeclaration"
    );
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid shareholder core details"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "maker",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shareholder = await fetchShareholderContext(client, shareholderId, true);

    if (!shareholder) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Shareholder not found");
    }

    const oldResult = await client.query(
      `
      SELECT *
      FROM shareholder
      WHERE shareholder_id = $1
      LIMIT 1
      `,
      [shareholderId]
    );

    const updateResult = await client.query(
      `
      UPDATE shareholder
      SET
        shareholder_code = COALESCE($2, shareholder_code),
        gender = COALESCE($3, gender),
        date_of_birth = COALESCE($4::date, date_of_birth),
        nationality = COALESCE($5, nationality),
        occupation = COALESCE($6, occupation),
        tin_number = COALESCE($7, tin_number),
        national_id_fayda = COALESCE($8, national_id_fayda),
        primary_id_number = COALESCE($9, primary_id_number),
        mobile_number = COALESCE($10, mobile_number),
        email_address = COALESCE($11, email_address),
        physical_address = COALESCE($12, physical_address),
        address_city = COALESCE($14, address_city),
        wereda_kk = COALESCE($15, wereda_kk),
        kebele = COALESCE($16, kebele),
        house_no = COALESCE($17, house_no),
        source_of_funds_declaration = COALESCE($13, source_of_funds_declaration),
        contact_details = COALESCE(contact_details, '{}'::jsonb) || jsonb_strip_nulls(
          jsonb_build_object(
            'phone', COALESCE($9, mobile_number, contact_details->>'phone'),
            'email', COALESCE($10, email_address, contact_details->>'email')
          )
        ),
        updated_at = now()
      WHERE shareholder_id = $1
      RETURNING *
      `,
      [
        shareholderId,
        shareholderCode,
        gender,
        dateOfBirth,
        nationality,
        occupation,
        tinNumber,
        nationalIdFayda,
        primaryIdNumber,
        mobileNumber,
        emailAddress,
        physicalAddress,
        sourceOfFundsDeclaration,
        addressCity,
        weredaKk,
        kebele,
        houseNo,
      ]
    );

    await insertShareholderAudit(client, {
      entityId: shareholder.entity_id,
      actorId,
      action: "shareholder_core_details_updated",
      tableName: "shareholder",
      recordId: shareholderId,
      oldValue: oldResult.rows[0],
      newValue: updateResult.rows[0],
      sourceIp: req.ip,
    });

    await client.query("COMMIT");

    return res.json({
      data: updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to update shareholder core details", error);
  } finally {
    client.release();
  }
});

shareholderRoutes.get("/:shareholderId/identity-documents", async (req, res) => {
  let shareholderId = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid identity documents request"
    );
  }

  try {
    const shareholder = await fetchShareholderContext(pool, shareholderId);

    if (!shareholder) {
      return sendNotFound(res, "Shareholder not found");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM shareholder_identity_documents
      WHERE shareholder_id = $1
      ORDER BY
        CASE WHEN document_role = 'primary' THEN 0 ELSE 1 END,
        created_at DESC
      `,
      [shareholderId]
    );

    return res.json({
      data: result.rows,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch identity documents", error);
  }
});

shareholderRoutes.post("/:shareholderId/identity-documents", async (req, res) => {
  let shareholderId = "";
  let documentRole: string | null = null;
  let idType: string | null = null;
  let idNumber: string | null = null;
  let issuingAuthority: string | null = null;
  let issueDate: string | null = null;
  let expiryDate: string | null = null;
  let countryOfIssue: string | null = null;
  let documentReferenceId: string | null = null;
  let verificationStatus = "pending";
  let verifiedBy: string | null = null;
  let verifiedAt: string | null = null;
  let notes: string | null = null;

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
    documentRole = normalizeOptionalString(req.body?.documentRole, "documentRole");
    idType = normalizeOptionalString(req.body?.idType, "idType");
    idNumber = normalizeOptionalString(req.body?.idNumber, "idNumber");
    issuingAuthority = normalizeOptionalString(
      req.body?.issuingAuthority,
      "issuingAuthority"
    );
    issueDate = normalizeOptionalDateString(req.body?.issueDate, "issueDate");
    expiryDate = normalizeOptionalDateString(req.body?.expiryDate, "expiryDate");
    countryOfIssue = normalizeOptionalString(
      req.body?.countryOfIssue,
      "countryOfIssue"
    );
    documentReferenceId = normalizeOptionalUuid(
      req.body?.documentReferenceId,
      "documentReferenceId"
    );
    verificationStatus =
      normalizeOptionalString(
        req.body?.verificationStatus,
        "verificationStatus"
      ) ?? "pending";
    verifiedBy = normalizeOptionalString(req.body?.verifiedBy, "verifiedBy");
    verifiedAt = normalizeOptionalTimestampString(
      req.body?.verifiedAt,
      "verifiedAt"
    );
    notes = normalizeOptionalString(req.body?.notes, "notes");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid identity document request"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "maker",
    "compliance_officer",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shareholder = await fetchShareholderContext(client, shareholderId);

    if (!shareholder) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Shareholder not found");
    }

    const insertResult = await client.query(
      `
      INSERT INTO shareholder_identity_documents (
        shareholder_id,
        entity_id,
        document_role,
        id_type,
        id_number,
        issuing_authority,
        issue_date,
        expiry_date,
        country_of_issue,
        document_reference_id,
        verification_status,
        verified_by,
        verified_at,
        notes
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::date,
        $8::date,
        $9,
        $10,
        $11,
        $12,
        $13::timestamptz,
        $14
      )
      RETURNING *
      `,
      [
        shareholderId,
        shareholder.entity_id,
        documentRole,
        idType,
        idNumber,
        issuingAuthority,
        issueDate,
        expiryDate,
        countryOfIssue,
        documentReferenceId,
        verificationStatus,
        verifiedBy,
        verifiedAt,
        notes,
      ]
    );

    await insertShareholderAudit(client, {
      entityId: shareholder.entity_id,
      actorId,
      action: "shareholder_identity_document_created",
      tableName: "shareholder_identity_documents",
      recordId: insertResult.rows[0].id,
      oldValue: null,
      newValue: insertResult.rows[0],
      sourceIp: req.ip,
    });

    await client.query("COMMIT");

    return res.status(201).json({
      data: insertResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to create identity document", error);
  } finally {
    client.release();
  }
});

shareholderRoutes.get("/:shareholderId/kyc-profile", async (req, res) => {
  let shareholderId = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid KYC profile request"
    );
  }

  try {
    const shareholder = await fetchShareholderContext(pool, shareholderId);

    if (!shareholder) {
      return sendNotFound(res, "Shareholder not found");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM shareholder_kyc_profiles
      WHERE shareholder_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [shareholderId]
    );

    return res.json({
      data: result.rows[0] ?? null,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch KYC profile", error);
  }
});

shareholderRoutes.put("/:shareholderId/kyc-profile", async (req, res) => {
  let shareholderId = "";
  let kycRecordId: string | null = null;
  let cddCompleted: boolean | null = null;
  let cddCompletedAt: string | null = null;
  let cddCompletedBy: string | null = null;
  let pepStatus: string | null = null;
  let pepFamilyOrAssociate: boolean | null = null;
  let pepPositionRole: string | null = null;
  let pepCountryOrOrganization: string | null = null;
  let sanctionScreeningResult: string | null = null;
  let sanctionScreenedAt: string | null = null;
  let sanctionScreenedBy: string | null = null;
  let adverseMediaScreeningResult: string | null = null;
  let adverseMediaScreenedAt: string | null = null;
  let adverseMediaScreenedBy: string | null = null;
  let riskRating: string | null = null;
  let amlOfficerApprovalStatus: string | null = null;
  let amlOfficerId: string | null = null;
  let amlApprovalDate: string | null = null;
  let amlApprovalNotes: string | null = null;
  let sourceOfFundsSummary: string | null = null;
  let sourceOfFundsCategories: unknown[] | null = null;
  let annualIncomeRange: string | null = null;
  let employmentStatus: string | null = null;
  let employerBusinessName: string | null = null;
  let employerAddress: string | null = null;
  let businessSector: string | null = null;
  let yearsAtCurrentJob: number | null = null;
  let internationalSanctionsDeclared: boolean | null = null;
  let financialCrimeDeclared: boolean | null = null;
  let regulatoryInvestigationDeclared: boolean | null = null;
  let otherFinancialInstitutionShareholding: boolean | null = null;
  let conflictOfInterestDeclared: boolean | null = null;
  let declarationNotes: string | null = null;
  let reviewStatus = "draft";
  let reviewedBy: string | null = null;
  let reviewedAt: string | null = null;

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
    kycRecordId = normalizeOptionalUuid(req.body?.kycRecordId, "kycRecordId");
    cddCompleted = normalizeNullableBoolean(
      req.body?.cddCompleted,
      "cddCompleted"
    );
    cddCompletedAt = normalizeOptionalTimestampString(
      req.body?.cddCompletedAt,
      "cddCompletedAt"
    );
    cddCompletedBy = normalizeOptionalString(
      req.body?.cddCompletedBy,
      "cddCompletedBy"
    );
    pepStatus = normalizeOptionalString(req.body?.pepStatus, "pepStatus");
    pepFamilyOrAssociate = normalizeNullableBoolean(
      req.body?.pepFamilyOrAssociate,
      "pepFamilyOrAssociate"
    );
    pepPositionRole = normalizeOptionalString(
      req.body?.pepPositionRole,
      "pepPositionRole"
    );
    pepCountryOrOrganization = normalizeOptionalString(
      req.body?.pepCountryOrOrganization,
      "pepCountryOrOrganization"
    );
    sanctionScreeningResult = normalizeOptionalString(
      req.body?.sanctionScreeningResult,
      "sanctionScreeningResult"
    );
    sanctionScreenedAt = normalizeOptionalTimestampString(
      req.body?.sanctionScreenedAt,
      "sanctionScreenedAt"
    );
    sanctionScreenedBy = normalizeOptionalString(
      req.body?.sanctionScreenedBy,
      "sanctionScreenedBy"
    );
    adverseMediaScreeningResult = normalizeOptionalString(
      req.body?.adverseMediaScreeningResult,
      "adverseMediaScreeningResult"
    );
    adverseMediaScreenedAt = normalizeOptionalTimestampString(
      req.body?.adverseMediaScreenedAt,
      "adverseMediaScreenedAt"
    );
    adverseMediaScreenedBy = normalizeOptionalString(
      req.body?.adverseMediaScreenedBy,
      "adverseMediaScreenedBy"
    );
    riskRating = normalizeOptionalString(req.body?.riskRating, "riskRating");
    amlOfficerApprovalStatus = normalizeOptionalString(
      req.body?.amlOfficerApprovalStatus,
      "amlOfficerApprovalStatus"
    );
    amlOfficerId = normalizeOptionalString(
      req.body?.amlOfficerId,
      "amlOfficerId"
    );
    amlApprovalDate = normalizeOptionalDateString(
      req.body?.amlApprovalDate,
      "amlApprovalDate"
    );
    amlApprovalNotes = normalizeOptionalString(
      req.body?.amlApprovalNotes,
      "amlApprovalNotes"
    );
    sourceOfFundsSummary = normalizeOptionalString(
      req.body?.sourceOfFundsSummary,
      "sourceOfFundsSummary"
    );
    sourceOfFundsCategories = normalizeOptionalJsonArrayOrNull(
      req.body?.sourceOfFundsCategories,
      "sourceOfFundsCategories"
    );
    annualIncomeRange = normalizeOptionalString(
      req.body?.annualIncomeRange,
      "annualIncomeRange"
    );
    employmentStatus = normalizeOptionalString(
      req.body?.employmentStatus,
      "employmentStatus"
    );
    employerBusinessName = normalizeOptionalString(
      req.body?.employerBusinessName,
      "employerBusinessName"
    );
    employerAddress = normalizeOptionalString(
      req.body?.employerAddress,
      "employerAddress"
    );
    businessSector = normalizeOptionalString(
      req.body?.businessSector,
      "businessSector"
    );
    yearsAtCurrentJob = normalizeOptionalNumber(
      req.body?.yearsAtCurrentJob,
      "yearsAtCurrentJob"
    );
    internationalSanctionsDeclared = normalizeNullableBoolean(
      req.body?.internationalSanctionsDeclared,
      "internationalSanctionsDeclared"
    );
    financialCrimeDeclared = normalizeNullableBoolean(
      req.body?.financialCrimeDeclared,
      "financialCrimeDeclared"
    );
    regulatoryInvestigationDeclared = normalizeNullableBoolean(
      req.body?.regulatoryInvestigationDeclared,
      "regulatoryInvestigationDeclared"
    );
    otherFinancialInstitutionShareholding = normalizeNullableBoolean(
      req.body?.otherFinancialInstitutionShareholding,
      "otherFinancialInstitutionShareholding"
    );
    conflictOfInterestDeclared = normalizeNullableBoolean(
      req.body?.conflictOfInterestDeclared,
      "conflictOfInterestDeclared"
    );
    declarationNotes = normalizeOptionalString(
      req.body?.declarationNotes,
      "declarationNotes"
    );
    reviewStatus =
      normalizeOptionalString(req.body?.reviewStatus, "reviewStatus") ??
      "draft";
    reviewedBy = normalizeOptionalString(req.body?.reviewedBy, "reviewedBy");
    reviewedAt = normalizeOptionalTimestampString(
      req.body?.reviewedAt,
      "reviewedAt"
    );
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid KYC profile request"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "compliance_officer",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shareholder = await fetchShareholderContext(client, shareholderId, true);

    if (!shareholder) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Shareholder not found");
    }

    const existingResult = await client.query(
      `
      SELECT *
      FROM shareholder_kyc_profiles
      WHERE shareholder_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [shareholderId]
    );

    const profileValues = [
      kycRecordId,
      cddCompleted,
      cddCompletedAt,
      cddCompletedBy,
      pepStatus,
      pepFamilyOrAssociate,
      pepPositionRole,
      pepCountryOrOrganization,
      sanctionScreeningResult,
      sanctionScreenedAt,
      sanctionScreenedBy,
      adverseMediaScreeningResult,
      adverseMediaScreenedAt,
      adverseMediaScreenedBy,
      riskRating,
      amlOfficerApprovalStatus,
      amlOfficerId,
      amlApprovalDate,
      amlApprovalNotes,
      sourceOfFundsSummary,
      JSON.stringify(sourceOfFundsCategories ?? []),
      annualIncomeRange,
      employmentStatus,
      employerBusinessName,
      employerAddress,
      businessSector,
      yearsAtCurrentJob,
      internationalSanctionsDeclared,
      financialCrimeDeclared,
      regulatoryInvestigationDeclared,
      otherFinancialInstitutionShareholding,
      conflictOfInterestDeclared,
      declarationNotes,
      reviewStatus,
      reviewedBy,
      reviewedAt,
    ];

    let upsertResult;

    if (existingResult.rowCount === 0) {
      upsertResult = await client.query(
        `
        INSERT INTO shareholder_kyc_profiles (
          shareholder_id,
          entity_id,
          kyc_record_id,
          cdd_completed,
          cdd_completed_at,
          cdd_completed_by,
          pep_status,
          pep_family_or_associate,
          pep_position_role,
          pep_country_or_organization,
          sanction_screening_result,
          sanction_screened_at,
          sanction_screened_by,
          adverse_media_screening_result,
          adverse_media_screened_at,
          adverse_media_screened_by,
          risk_rating,
          aml_officer_approval_status,
          aml_officer_id,
          aml_approval_date,
          aml_approval_notes,
          source_of_funds_summary,
          source_of_funds_categories,
          annual_income_range,
          employment_status,
          employer_business_name,
          employer_address,
          business_sector,
          years_at_current_job,
          international_sanctions_declared,
          financial_crime_declared,
          regulatory_investigation_declared,
          other_financial_institution_shareholding,
          conflict_of_interest_declared,
          declaration_notes,
          review_status,
          reviewed_by,
          reviewed_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5::timestamptz,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12::timestamptz,
          $13,
          $14,
          $15::timestamptz,
          $16,
          $17,
          $18,
          $19,
          $20::date,
          $21,
          $22,
          $23::jsonb,
          $24,
          $25,
          $26,
          $27,
          $28,
          $29,
          $30,
          $31,
          $32,
          $33,
          $34,
          $35,
          $36,
          $37,
          $38::timestamptz
        )
        RETURNING *
        `,
        [shareholderId, shareholder.entity_id, ...profileValues]
      );
    } else {
      upsertResult = await client.query(
        `
        UPDATE shareholder_kyc_profiles
        SET
          kyc_record_id = $2,
          cdd_completed = $3,
          cdd_completed_at = $4::timestamptz,
          cdd_completed_by = $5,
          pep_status = $6,
          pep_family_or_associate = $7,
          pep_position_role = $8,
          pep_country_or_organization = $9,
          sanction_screening_result = $10,
          sanction_screened_at = $11::timestamptz,
          sanction_screened_by = $12,
          adverse_media_screening_result = $13,
          adverse_media_screened_at = $14::timestamptz,
          adverse_media_screened_by = $15,
          risk_rating = $16,
          aml_officer_approval_status = $17,
          aml_officer_id = $18,
          aml_approval_date = $19::date,
          aml_approval_notes = $20,
          source_of_funds_summary = $21,
          source_of_funds_categories = $22::jsonb,
          annual_income_range = $23,
          employment_status = $24,
          employer_business_name = $25,
          employer_address = $26,
          business_sector = $27,
          years_at_current_job = $28,
          international_sanctions_declared = $29,
          financial_crime_declared = $30,
          regulatory_investigation_declared = $31,
          other_financial_institution_shareholding = $32,
          conflict_of_interest_declared = $33,
          declaration_notes = $34,
          review_status = $35,
          reviewed_by = $36,
          reviewed_at = $37::timestamptz,
          updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [existingResult.rows[0].id, ...profileValues]
      );
    }

    await insertShareholderAudit(client, {
      entityId: shareholder.entity_id,
      actorId,
      action: "shareholder_kyc_profile_upserted",
      tableName: "shareholder_kyc_profiles",
      recordId: upsertResult.rows[0].id,
      oldValue: existingResult.rows[0] ?? null,
      newValue: upsertResult.rows[0],
      sourceIp: req.ip,
    });

    await client.query("COMMIT");

    return res.json({
      data: upsertResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to update KYC profile", error);
  } finally {
    client.release();
  }
});

shareholderRoutes.get("/:shareholderId/beneficial-owners", async (req, res) => {
  let shareholderId = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid beneficial owners request"
    );
  }

  try {
    const shareholder = await fetchShareholderContext(pool, shareholderId);

    if (!shareholder) {
      return sendNotFound(res, "Shareholder not found");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM shareholder_beneficial_owners
      WHERE shareholder_id = $1
      ORDER BY created_at DESC
      `,
      [shareholderId]
    );

    return res.json({
      data: result.rows,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch beneficial owners", error);
  }
});

shareholderRoutes.post("/:shareholderId/beneficial-owners", async (req, res) => {
  let shareholderId = "";
  let isUltimateBeneficialOwner: boolean | null = null;
  let beneficialOwnerFullName: string | null = null;
  let relationshipToShareholder: string | null = null;
  let beneficialOwnerIdType: string | null = null;
  let beneficialOwnerIdNumber: string | null = null;
  let beneficialOwnerTin: string | null = null;
  let beneficialOwnerCountryOfResidence: string | null = null;
  let percentageReference: number | null = null;
  let verificationStatus = "pending";
  let verificationMethod: string | null = null;
  let verificationNotes: string | null = null;
  let verifiedBy: string | null = null;
  let verifiedAt: string | null = null;
  let documentReferenceId: string | null = null;

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
    isUltimateBeneficialOwner = normalizeNullableBoolean(
      req.body?.isUltimateBeneficialOwner,
      "isUltimateBeneficialOwner"
    );
    beneficialOwnerFullName = normalizeOptionalString(
      req.body?.beneficialOwnerFullName,
      "beneficialOwnerFullName"
    );
    relationshipToShareholder = normalizeOptionalString(
      req.body?.relationshipToShareholder,
      "relationshipToShareholder"
    );
    beneficialOwnerIdType = normalizeOptionalString(
      req.body?.beneficialOwnerIdType,
      "beneficialOwnerIdType"
    );
    beneficialOwnerIdNumber = normalizeOptionalString(
      req.body?.beneficialOwnerIdNumber,
      "beneficialOwnerIdNumber"
    );
    beneficialOwnerTin = normalizeOptionalString(
      req.body?.beneficialOwnerTin,
      "beneficialOwnerTin"
    );
    beneficialOwnerCountryOfResidence = normalizeOptionalString(
      req.body?.beneficialOwnerCountryOfResidence,
      "beneficialOwnerCountryOfResidence"
    );
    percentageReference = normalizeOptionalNumber(
      req.body?.percentageReference,
      "percentageReference"
    );
    verificationStatus =
      normalizeOptionalString(
        req.body?.verificationStatus,
        "verificationStatus"
      ) ?? "pending";
    verificationMethod = normalizeOptionalString(
      req.body?.verificationMethod,
      "verificationMethod"
    );
    verificationNotes = normalizeOptionalString(
      req.body?.verificationNotes,
      "verificationNotes"
    );
    verifiedBy = normalizeOptionalString(req.body?.verifiedBy, "verifiedBy");
    verifiedAt = normalizeOptionalTimestampString(
      req.body?.verifiedAt,
      "verifiedAt"
    );
    documentReferenceId = normalizeOptionalUuid(
      req.body?.documentReferenceId,
      "documentReferenceId"
    );
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid beneficial owner request"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "maker",
    "compliance_officer",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shareholder = await fetchShareholderContext(client, shareholderId);

    if (!shareholder) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Shareholder not found");
    }

    const boCountResult = await client.query(
      `SELECT COUNT(*)::int AS bo_count FROM shareholder_beneficial_owners WHERE shareholder_id = $1`,
      [shareholderId]
    );
    if ((boCountResult.rows[0]?.bo_count ?? 0) >= 10) {
      await client.query("ROLLBACK");
      return sendBadRequest(res, "Maximum of 10 beneficial owners allowed per shareholder");
    }

    const insertResult = await client.query(
      `
      INSERT INTO shareholder_beneficial_owners (
        shareholder_id,
        entity_id,
        is_ultimate_beneficial_owner,
        beneficial_owner_full_name,
        relationship_to_shareholder,
        beneficial_owner_id_type,
        beneficial_owner_id_number,
        beneficial_owner_tin,
        beneficial_owner_country_of_residence,
        percentage_reference,
        verification_status,
        verification_method,
        verification_notes,
        verified_by,
        verified_at,
        document_reference_id
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15::timestamptz,
        $16
      )
      RETURNING *
      `,
      [
        shareholderId,
        shareholder.entity_id,
        isUltimateBeneficialOwner,
        beneficialOwnerFullName,
        relationshipToShareholder,
        beneficialOwnerIdType,
        beneficialOwnerIdNumber,
        beneficialOwnerTin,
        beneficialOwnerCountryOfResidence,
        percentageReference,
        verificationStatus,
        verificationMethod,
        verificationNotes,
        verifiedBy,
        verifiedAt,
        documentReferenceId,
      ]
    );

    await insertShareholderAudit(client, {
      entityId: shareholder.entity_id,
      actorId,
      action: "shareholder_beneficial_owner_created",
      tableName: "shareholder_beneficial_owners",
      recordId: insertResult.rows[0].id,
      oldValue: null,
      newValue: insertResult.rows[0],
      sourceIp: req.ip,
    });

    await client.query("COMMIT");

    return res.status(201).json({
      data: insertResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to create beneficial owner", error);
  } finally {
    client.release();
  }
});

shareholderRoutes.get("/:shareholderId/next-of-kin", async (req, res) => {
  let shareholderId = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid next of kin request"
    );
  }

  try {
    const shareholder = await fetchShareholderContext(pool, shareholderId);

    if (!shareholder) {
      return sendNotFound(res, "Shareholder not found");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM shareholder_next_of_kin
      WHERE shareholder_id = $1
      ORDER BY is_primary DESC, created_at DESC
      `,
      [shareholderId]
    );

    return res.json({
      data: result.rows,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch next of kin", error);
  }
});

shareholderRoutes.put("/:shareholderId/next-of-kin", async (req, res) => {
  let shareholderId = "";
  let contacts: Array<{
    fullName: string | null;
    relationship: string | null;
    phoneNumber: string | null;
    emailAddress: string | null;
    residentialAddress: string | null;
    cityCountry: string | null;
    isPrimary: boolean;
    notes: string | null;
  }> = [];

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");

    const rawContacts = req.body?.contacts;
    let contactInputs: Record<string, unknown>[];

    if (rawContacts !== undefined) {
      if (!Array.isArray(rawContacts)) {
        throw new Error("contacts must be an array");
      }

      contactInputs = rawContacts.map((contact, index) =>
        requireObject(contact, `contacts[${index}]`)
      );
    } else {
      const contactInput = requireObject(req.body, "nextOfKin");
      const hasContactFields = [
        "fullName",
        "relationship",
        "phoneNumber",
        "emailAddress",
        "residentialAddress",
        "cityCountry",
        "isPrimary",
        "notes",
      ].some((fieldName) => contactInput[fieldName] !== undefined);

      if (!hasContactFields) {
        throw new Error("contacts is required");
      }

      contactInputs = [contactInput];
    }

    contacts = contactInputs.map((contact, index) => ({
      fullName: normalizeOptionalString(
        contact.fullName,
        `contacts[${index}].fullName`
      ),
      relationship: normalizeOptionalString(
        contact.relationship,
        `contacts[${index}].relationship`
      ),
      phoneNumber: normalizeOptionalString(
        contact.phoneNumber,
        `contacts[${index}].phoneNumber`
      ),
      emailAddress: normalizeOptionalString(
        contact.emailAddress,
        `contacts[${index}].emailAddress`
      ),
      residentialAddress: normalizeOptionalString(
        contact.residentialAddress,
        `contacts[${index}].residentialAddress`
      ),
      cityCountry: normalizeOptionalString(
        contact.cityCountry,
        `contacts[${index}].cityCountry`
      ),
      isPrimary: normalizeOptionalBoolean(
        contact.isPrimary,
        `contacts[${index}].isPrimary`,
        false
      ),
      notes: normalizeOptionalString(contact.notes, `contacts[${index}].notes`),
    }));
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid next of kin request"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "maker",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shareholder = await fetchShareholderContext(client, shareholderId, true);

    if (!shareholder) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Shareholder not found");
    }

    const oldResult = await client.query(
      `
      SELECT *
      FROM shareholder_next_of_kin
      WHERE shareholder_id = $1
      ORDER BY is_primary DESC, created_at DESC
      `,
      [shareholderId]
    );

    await client.query(
      `
      DELETE FROM shareholder_next_of_kin
      WHERE shareholder_id = $1
      `,
      [shareholderId]
    );

    const newRows = [];

    for (const contact of contacts) {
      const insertResult = await client.query(
        `
        INSERT INTO shareholder_next_of_kin (
          shareholder_id,
          entity_id,
          full_name,
          relationship,
          phone_number,
          email_address,
          residential_address,
          city_country,
          is_primary,
          notes
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10
        )
        RETURNING *
        `,
        [
          shareholderId,
          shareholder.entity_id,
          contact.fullName,
          contact.relationship,
          contact.phoneNumber,
          contact.emailAddress,
          contact.residentialAddress,
          contact.cityCountry,
          contact.isPrimary,
          contact.notes,
        ]
      );

      newRows.push(insertResult.rows[0]);
    }

    await insertShareholderAudit(client, {
      entityId: shareholder.entity_id,
      actorId,
      action: "shareholder_next_of_kin_replaced",
      tableName: "shareholder_next_of_kin",
      recordId: shareholderId,
      oldValue: oldResult.rows,
      newValue: newRows,
      sourceIp: req.ip,
    });

    await client.query("COMMIT");

    return res.json({
      data: newRows,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to update next of kin", error);
  } finally {
    client.release();
  }
});

shareholderRoutes.get("/:shareholderId/document-checklist", async (req, res) => {
  let shareholderId = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error
        ? error.message
        : "Invalid document checklist request"
    );
  }

  try {
    const shareholder = await fetchShareholderContext(pool, shareholderId);

    if (!shareholder) {
      return sendNotFound(res, "Shareholder not found");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM shareholder_document_checklist
      WHERE shareholder_id = $1
      ORDER BY document_type ASC, created_at DESC
      `,
      [shareholderId]
    );

    return res.json({
      data: result.rows,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch document checklist", error);
  }
});

shareholderRoutes.put("/:shareholderId/document-checklist", async (req, res) => {
  let shareholderId = "";
  let items: Array<{
    documentType: string;
    requirementStatus: string;
    checklistStatus: string;
    sourceBasis: string | null;
    documentReferenceId: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    notes: string | null;
  }> = [];

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");

    const rawItems = req.body?.items;

    if (!Array.isArray(rawItems)) {
      throw new Error("items must be an array");
    }

    items = rawItems.map((item, index) => {
      const itemInput = requireObject(item, `items[${index}]`);

      return {
        documentType: requireNonEmptyString(
          itemInput.documentType,
          `items[${index}].documentType`
        ),
        requirementStatus:
          normalizeOptionalString(
            itemInput.requirementStatus,
            `items[${index}].requirementStatus`
          ) ?? "required",
        checklistStatus:
          normalizeOptionalString(
            itemInput.checklistStatus,
            `items[${index}].checklistStatus`
          ) ?? "pending",
        sourceBasis: normalizeOptionalString(
          itemInput.sourceBasis,
          `items[${index}].sourceBasis`
        ),
        documentReferenceId: normalizeOptionalUuid(
          itemInput.documentReferenceId,
          `items[${index}].documentReferenceId`
        ),
        reviewedBy: normalizeOptionalString(
          itemInput.reviewedBy,
          `items[${index}].reviewedBy`
        ),
        reviewedAt: normalizeOptionalTimestampString(
          itemInput.reviewedAt,
          `items[${index}].reviewedAt`
        ),
        notes: normalizeOptionalString(itemInput.notes, `items[${index}].notes`),
      };
    });
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid document checklist request"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "maker",
    "compliance_officer",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shareholder = await fetchShareholderContext(client, shareholderId, true);

    if (!shareholder) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Shareholder not found");
    }

    const oldResult = await client.query(
      `
      SELECT *
      FROM shareholder_document_checklist
      WHERE shareholder_id = $1
      ORDER BY document_type ASC, created_at DESC
      `,
      [shareholderId]
    );

    await client.query(
      `
      DELETE FROM shareholder_document_checklist
      WHERE shareholder_id = $1
      `,
      [shareholderId]
    );

    const newRows = [];

    for (const item of items) {
      const insertResult = await client.query(
        `
        INSERT INTO shareholder_document_checklist (
          shareholder_id,
          entity_id,
          document_type,
          requirement_status,
          checklist_status,
          source_basis,
          document_reference_id,
          reviewed_by,
          reviewed_at,
          notes
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9::timestamptz,
          $10
        )
        RETURNING *
        `,
        [
          shareholderId,
          shareholder.entity_id,
          item.documentType,
          item.requirementStatus,
          item.checklistStatus,
          item.sourceBasis,
          item.documentReferenceId,
          item.reviewedBy,
          item.reviewedAt,
          item.notes,
        ]
      );

      newRows.push(insertResult.rows[0]);
    }

    await insertShareholderAudit(client, {
      entityId: shareholder.entity_id,
      actorId,
      action: "shareholder_document_checklist_replaced",
      tableName: "shareholder_document_checklist",
      recordId: shareholderId,
      oldValue: oldResult.rows,
      newValue: newRows,
      sourceIp: req.ip,
    });

    await client.query("COMMIT");

    return res.json({
      data: newRows,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to update document checklist", error);
  } finally {
    client.release();
  }
});

shareholderRoutes.get("/:shareholderId/payment-profile", async (req, res) => {
  let shareholderId = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid payment profile request"
    );
  }

  try {
    const shareholder = await fetchShareholderContext(pool, shareholderId);

    if (!shareholder) {
      return sendNotFound(res, "Shareholder not found");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM shareholder_payment_profiles
      WHERE shareholder_id = $1
      ORDER BY created_at DESC
      `,
      [shareholderId]
    );

    return res.json({
      data: result.rows,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch payment profile", error);
  }
});

shareholderRoutes.put("/:shareholderId/payment-profile", async (req, res) => {
  let shareholderId = "";
  let paymentProfileType = "dividend";
  let bankName: string | null = null;
  let branchNameCode: string | null = null;
  let accountName: string | null = null;
  let accountNumber: string | null = null;
  let accountType: string | null = null;
  let swiftBicCode: string | null = null;
  let iban: string | null = null;
  let mobileWalletIdentifier: string | null = null;
  let dividendPaymentPreference: string | null = null;
  let paymentMethod: string | null = null;
  let totalInvestmentAmount: number | null = null;
  let paymentVerificationStatus = "pending";
  let paymentVerifiedBy: string | null = null;
  let paymentVerifiedAt: string | null = null;
  let documentReferenceId: string | null = null;
  let notes: string | null = null;

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
    paymentProfileType =
      normalizeOptionalString(
        req.body?.paymentProfileType,
        "paymentProfileType"
      ) ?? "dividend";
    bankName = normalizeOptionalString(req.body?.bankName, "bankName");
    branchNameCode = normalizeOptionalString(
      req.body?.branchNameCode,
      "branchNameCode"
    );
    accountName = normalizeOptionalString(
      req.body?.accountName,
      "accountName"
    );
    accountNumber = normalizeOptionalString(
      req.body?.accountNumber,
      "accountNumber"
    );
    accountType = normalizeOptionalString(
      req.body?.accountType,
      "accountType"
    );
    swiftBicCode = normalizeOptionalString(
      req.body?.swiftBicCode,
      "swiftBicCode"
    );
    iban = normalizeOptionalString(req.body?.iban, "iban");
    mobileWalletIdentifier = normalizeOptionalString(
      req.body?.mobileWalletIdentifier,
      "mobileWalletIdentifier"
    );
    dividendPaymentPreference = normalizeOptionalString(
      req.body?.dividendPaymentPreference,
      "dividendPaymentPreference"
    );
    paymentMethod = normalizeOptionalString(
      req.body?.paymentMethod,
      "paymentMethod"
    );
    totalInvestmentAmount = normalizeOptionalNumber(
      req.body?.totalInvestmentAmount,
      "totalInvestmentAmount"
    );
    paymentVerificationStatus =
      normalizeOptionalString(
        req.body?.paymentVerificationStatus,
        "paymentVerificationStatus"
      ) ?? "pending";
    paymentVerifiedBy = normalizeOptionalString(
      req.body?.paymentVerifiedBy,
      "paymentVerifiedBy"
    );
    paymentVerifiedAt = normalizeOptionalTimestampString(
      req.body?.paymentVerifiedAt,
      "paymentVerifiedAt"
    );
    documentReferenceId = normalizeOptionalUuid(
      req.body?.documentReferenceId,
      "documentReferenceId"
    );
    notes = normalizeOptionalString(req.body?.notes, "notes");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid payment profile request"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "checker_2",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shareholder = await fetchShareholderContext(client, shareholderId, true);

    if (!shareholder) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Shareholder not found");
    }

    const existingResult = await client.query(
      `
      SELECT *
      FROM shareholder_payment_profiles
      WHERE shareholder_id = $1
        AND payment_profile_type = $2
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [shareholderId, paymentProfileType]
    );

    let upsertResult;

    if (existingResult.rowCount === 0) {
      upsertResult = await client.query(
        `
        INSERT INTO shareholder_payment_profiles (
          shareholder_id,
          entity_id,
          payment_profile_type,
          bank_name,
          branch_name_code,
          account_name,
          account_number,
          account_type,
          swift_bic_code,
          iban,
          mobile_wallet_identifier,
          dividend_payment_preference,
          payment_method,
          total_investment_amount,
          payment_verification_status,
          payment_verified_by,
          payment_verified_at,
          document_reference_id,
          notes
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17::timestamptz,
          $18,
          $19
        )
        RETURNING *
        `,
        [
          shareholderId,
          shareholder.entity_id,
          paymentProfileType,
          bankName,
          branchNameCode,
          accountName,
          accountNumber,
          accountType,
          swiftBicCode,
          iban,
          mobileWalletIdentifier,
          dividendPaymentPreference,
          paymentMethod,
          totalInvestmentAmount,
          paymentVerificationStatus,
          paymentVerifiedBy,
          paymentVerifiedAt,
          documentReferenceId,
          notes,
        ]
      );
    } else {
      upsertResult = await client.query(
        `
        UPDATE shareholder_payment_profiles
        SET
          bank_name = $2,
          branch_name_code = $3,
          account_name = $4,
          account_number = $5,
          account_type = $6,
          swift_bic_code = $7,
          iban = $8,
          mobile_wallet_identifier = $9,
          dividend_payment_preference = $10,
          payment_method = $11,
          total_investment_amount = $12,
          payment_verification_status = $13,
          payment_verified_by = $14,
          payment_verified_at = $15::timestamptz,
          document_reference_id = $16,
          notes = $17,
          updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
          existingResult.rows[0].id,
          bankName,
          branchNameCode,
          accountName,
          accountNumber,
          accountType,
          swiftBicCode,
          iban,
          mobileWalletIdentifier,
          dividendPaymentPreference,
          paymentMethod,
          totalInvestmentAmount,
          paymentVerificationStatus,
          paymentVerifiedBy,
          paymentVerifiedAt,
          documentReferenceId,
          notes,
        ]
      );
    }

    await insertShareholderAudit(client, {
      entityId: shareholder.entity_id,
      actorId,
      action: "shareholder_payment_profile_upserted",
      tableName: "shareholder_payment_profiles",
      recordId: upsertResult.rows[0].id,
      oldValue: existingResult.rows[0] ?? null,
      newValue: upsertResult.rows[0],
      sourceIp: req.ip,
    });

    await client.query("COMMIT");

    return res.json({
      data: upsertResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to update payment profile", error);
  } finally {
    client.release();
  }
});

shareholderRoutes.get("/:shareholderId/certificate-defaults", async (req, res) => {
  try {
    const shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
    const result = await pool.query(
      `SELECT
        COALESCE(SUM(so.quantity), 0) AS quantity,
        MAX(sc.par_value) AS par_value
      FROM share_ownership so
      JOIN share_class sc ON sc.share_class_id = so.share_class_id
      WHERE so.shareholder_id = $1 AND so.status = 'active'`,
      [shareholderId]
    );
    res.json({ data: result.rows[0] ?? { quantity: 0, par_value: null } });
  } catch (error) {
    return sendServerError(res, "Failed to fetch certificate defaults", error);
  }
});

shareholderRoutes.get("/:shareholderId", async (req, res) => {
  let shareholderId = "";

  try {
    shareholderId = requireUuid(req.params.shareholderId, "shareholderId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid shareholder request"
    );
  }

  try {
    const profileResult = await pool.query(
      `
      SELECT
        ${shareholderCoreSelect}
      FROM shareholder s
      JOIN entity e ON e.entity_id = s.entity_id
      WHERE s.shareholder_id = $1
      LIMIT 1
      `,
      [shareholderId]
    );

    if (profileResult.rowCount === 0) {
      return sendNotFound(res, "Shareholder not found");
    }

    const [
      ownershipResult,
      certificatesResult,
      outgoingTransfersResult,
      incomingTransfersResult,
      legalHoldsResult,
      documentsResult,
      communicationsResult,
    ] = await Promise.all([
      pool.query(
        `
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
        `,
        [shareholderId]
      ),
      pool.query(
        `
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
        `,
        [shareholderId]
      ),
      pool.query(
        `
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
        `,
        [shareholderId]
      ),
      pool.query(
        `
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
        `,
        [shareholderId]
      ),
      pool.query(
        `
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
        `,
        [shareholderId]
      ),
      pool.query(
        `
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
        `,
        [shareholderId]
      ),
      pool.query(
        `
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
        `,
        [shareholderId]
      ),
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
  } catch (error) {
    return sendServerError(res, "Failed to fetch shareholder profile", error);
  }
});
