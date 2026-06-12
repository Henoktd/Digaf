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
  requireUuid,
} from "../utils/validation";
import {
  type ExistingShareholderImportIndex,
  type ShareholderImportDryRunResult,
  validateShareholderImportDryRun,
} from "../services/shareholderImportDryRun";

export const importRoutes = Router();

type Queryable = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;
};

function createEmptyImportIndex(): ExistingShareholderImportIndex {
  return {
    shareholderCodes: new Set(),
    tinNumbers: new Set(),
    primaryIdNumbers: new Set(),
    emailAddresses: new Set(),
    mobileNumbers: new Set(),
    certificateNumbers: new Set(),
  };
}

function addIndexValue(index: Set<string>, value: unknown) {
  if (typeof value !== "string") {
    return;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue) {
    index.add(normalizedValue);
  }
}

async function fetchExistingImportIndex() {
  const existingIndex = createEmptyImportIndex();

  const [shareholderResult, certificateResult] = await Promise.all([
    pool.query(`
      SELECT
        shareholder_code,
        tin_number,
        primary_id_number,
        email_address,
        mobile_number
      FROM shareholder
    `),
    pool.query(`
      SELECT serial_number
      FROM share_certificate
    `),
  ]);

  for (const row of shareholderResult.rows) {
    addIndexValue(existingIndex.shareholderCodes, row.shareholder_code);
    addIndexValue(existingIndex.tinNumbers, row.tin_number);
    addIndexValue(existingIndex.primaryIdNumbers, row.primary_id_number);
    addIndexValue(existingIndex.emailAddresses, row.email_address);
    addIndexValue(existingIndex.mobileNumbers, row.mobile_number);
  }

  for (const row of certificateResult.rows) {
    addIndexValue(existingIndex.certificateNumbers, row.serial_number);
  }

  return existingIndex;
}

function normalizeDryRunRows(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error("rows must be an array of shareholder import row objects");
  }

  if (value.length === 0) {
    throw new Error("rows must include at least one shareholder import row");
  }

  if (value.length > 100) {
    throw new Error("Stage 72 dry-run accepts at most 100 rows per request");
  }

  return value.map((row, index) => {
    if (
      row === null ||
      typeof row !== "object" ||
      Array.isArray(row)
    ) {
      throw new Error(`rows[${index}] must be an object`);
    }

    return row as Record<string, unknown>;
  });
}

function deriveBatchStatus(result: ShareholderImportDryRunResult) {
  if (result.summary.blockedRows > 0) {
    return "blocked";
  }

  if (result.summary.warningRows > 0 || result.summary.warningCount > 0) {
    return "validated_with_warnings";
  }

  return "validated";
}

function countMessages(
  messages: { severity: "error" | "warning"; code: string }[],
  severity: "error" | "warning"
) {
  return messages.filter((message) => message.severity === severity).length;
}

function countDuplicateMessages(messages: { code: string }[]) {
  return messages.filter((message) => message.code.includes("duplicate")).length;
}

async function insertImportBatchEvent(
  client: Queryable,
  input: {
    batchId: string;
    eventType: string;
    actorId: string;
    actorRole: string;
    eventPayload: unknown;
  }
) {
  await client.query(
    `
    INSERT INTO shareholder_import_batch_events (
      batch_id,
      event_type,
      actor_id,
      actor_role,
      event_payload_json
    )
    VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [
      input.batchId,
      input.eventType,
      input.actorId,
      input.actorRole,
      JSON.stringify(input.eventPayload),
    ]
  );
}

async function persistImportRowsAndMessages(
  client: Queryable,
  input: {
    batchId: string;
    sourceRows: Record<string, unknown>[];
    result: ShareholderImportDryRunResult;
  }
) {
  for (const [index, row] of input.result.rows.entries()) {
    const sourcePayload = input.sourceRows[index] ?? {};
    const insertRowResult = await client.query(
      `
      INSERT INTO shareholder_import_rows (
        batch_id,
        source_row_number,
        source_payload_json,
        normalized_payload_json,
        row_status,
        error_count,
        warning_count,
        duplicate_candidate_count
      )
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8)
      RETURNING id
      `,
      [
        input.batchId,
        row.rowNumber,
        JSON.stringify(sourcePayload),
        JSON.stringify(row.normalized),
        row.status,
        countMessages(row.messages, "error"),
        countMessages(row.messages, "warning"),
        countDuplicateMessages(row.messages),
      ]
    );

    const rowId = insertRowResult.rows[0].id;

    for (const message of row.messages) {
      await client.query(
        `
        INSERT INTO shareholder_import_validation_messages (
          batch_id,
          row_id,
          source_row_number,
          field_name,
          severity,
          code,
          message,
          suggested_action,
          responsible_role
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          input.batchId,
          rowId,
          message.rowNumber,
          message.field,
          message.severity,
          message.code,
          message.message,
          message.suggestedAction,
          message.responsibleRole,
        ]
      );
    }
  }
}

async function fetchImportBatchDetail(queryable: Queryable, batchId: string) {
  const batchResult = await queryable.query(
    `
    SELECT *
    FROM shareholder_import_batches
    WHERE id = $1
    LIMIT 1
    `,
    [batchId]
  );

  const batch = batchResult.rows[0] ?? null;

  if (!batch) {
    return null;
  }

  const [rowsResult, messagesResult, eventsResult] = await Promise.all([
    queryable.query(
      `
      SELECT *
      FROM shareholder_import_rows
      WHERE batch_id = $1
      ORDER BY source_row_number ASC, created_at ASC
      `,
      [batchId]
    ),
    queryable.query(
      `
      SELECT *
      FROM shareholder_import_validation_messages
      WHERE batch_id = $1
      ORDER BY source_row_number ASC, severity ASC, field_name ASC, created_at ASC
      `,
      [batchId]
    ),
    queryable.query(
      `
      SELECT *
      FROM shareholder_import_batch_events
      WHERE batch_id = $1
      ORDER BY created_at ASC
      `,
      [batchId]
    ),
  ]);

  return {
    batch,
    rows: rowsResult.rows,
    messages: messagesResult.rows,
    events: eventsResult.rows,
  };
}

function requireNoProductionDataConfirmation(value: unknown) {
  if (value !== true) {
    throw new Error(
      "confirmNoProductionData must be true before persisting an import batch"
    );
  }
}

importRoutes.post("/shareholders/dry-run", async (req, res) => {
  let rows: Record<string, unknown>[] = [];

  try {
    rows = normalizeDryRunRows(req.body?.rows);
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error
        ? error.message
        : "Invalid shareholder import dry-run request"
    );
  }

  const roleResult = requireRole(req.auth.actorRole, [
    "maker",
    "compliance_officer",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  try {
    const existingIndex = await fetchExistingImportIndex();
    const result = validateShareholderImportDryRun(rows, existingIndex);

    return res.json({
      data: {
        ...result,
        requestedBy: {
          actorId: req.auth.actorId,
          actorRole: req.auth.actorRole,
        },
      },
    });
  } catch (error) {
    return sendServerError(
      res,
      "Failed to run shareholder import dry-run validation",
      error
    );
  }
});

importRoutes.post("/shareholders/batches", async (req, res) => {
  console.log("[BATCH] received body keys:", Object.keys(req.body ?? {}));
  console.log("[BATCH] rows count:", Array.isArray(req.body?.rows) ? req.body.rows.length : "not array");
  let rows: Record<string, unknown>[] = [];
  let entityId: string | null = null;
  let sourceFilename: string | null = null;

  try {
    requireNoProductionDataConfirmation(req.body?.confirmNoProductionData);
    rows = normalizeDryRunRows(req.body?.rows);
    entityId =
      req.body?.entityId === undefined || req.body?.entityId === null || req.body?.entityId === ""
        ? null
        : requireUuid(req.body.entityId, "entityId");
    sourceFilename =
      req.body?.sourceFilename === undefined || req.body?.sourceFilename === null
        ? null
        : requireNonEmptyString(req.body.sourceFilename, "sourceFilename");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error
        ? error.message
        : "Invalid persisted shareholder import batch request"
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
    console.log("[BATCH] fetching existing index...");
    const existingIndex = await fetchExistingImportIndex();
    console.log("[BATCH] validating rows...");
    const result = validateShareholderImportDryRun(rows, existingIndex);
    console.log("[BATCH] mappingVersion:", result.mappingVersion, "batchStatus will be:", deriveBatchStatus(result));
    const batchStatus = deriveBatchStatus(result);

    await client.query("BEGIN");

    if (entityId) {
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
    }

    const batchInsertResult = await client.query(
      `
      INSERT INTO shareholder_import_batches (
        entity_id,
        source_filename,
        mapping_version,
        batch_status,
        dry_run_only,
        submitted_by,
        submitted_role,
        submitted_at,
        validated_at,
        summary_json
      )
      VALUES ($1, $2, $3, $4, true, $5, $6, now(), now(), $7::jsonb)
      RETURNING id
      `,
      [
        entityId,
        sourceFilename ?? "stage-75-demo-payload.json",
        result.mappingVersion,
        batchStatus,
        actorId,
        roleResult.role,
        JSON.stringify(result.summary),
      ]
    );

    const batchId = batchInsertResult.rows[0].id;

    await persistImportRowsAndMessages(client, {
      batchId,
      sourceRows: rows,
      result,
    });

    await insertImportBatchEvent(client, {
      batchId,
      eventType: "import_batch_created",
      actorId,
      actorRole: roleResult.role,
      eventPayload: {
        sourceFilename,
        mappingVersion: result.mappingVersion,
        dryRunOnly: true,
      },
    });

    await insertImportBatchEvent(client, {
      batchId,
      eventType: "import_batch_validated",
      actorId,
      actorRole: roleResult.role,
      eventPayload: {
        batchStatus,
        summary: result.summary,
      },
    });

    await client.query("COMMIT");

    const detail = await fetchImportBatchDetail(pool, batchId);

    return res.status(201).json({
      data: detail,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(
      res,
      "Failed to create shareholder import batch",
      error
    );
  } finally {
    client.release();
  }
});

importRoutes.get("/shareholders/batches", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.*,
        COUNT(r.id)::integer AS row_count,
        COALESCE(SUM(r.error_count), 0)::integer AS error_count,
        COALESCE(SUM(r.warning_count), 0)::integer AS warning_count,
        COALESCE(SUM(r.duplicate_candidate_count), 0)::integer AS duplicate_candidate_count
      FROM shareholder_import_batches b
      LEFT JOIN shareholder_import_rows r
        ON r.batch_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT 50
    `);

    return res.json({
      data: result.rows,
    });
  } catch (error) {
    return sendServerError(
      res,
      "Failed to fetch shareholder import batches",
      error
    );
  }
});

importRoutes.get("/shareholders/batches/:batchId", async (req, res) => {
  let batchId = "";

  try {
    batchId = requireUuid(req.params.batchId, "batchId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid import batch request"
    );
  }

  try {
    const detail = await fetchImportBatchDetail(pool, batchId);

    if (!detail) {
      return sendNotFound(res, "Import batch not found");
    }

    return res.json({
      data: detail,
    });
  } catch (error) {
    return sendServerError(
      res,
      "Failed to fetch shareholder import batch",
      error
    );
  }
});

importRoutes.post("/shareholders/batches/:batchId/revalidate", async (req, res) => {
  let batchId = "";

  try {
    batchId = requireUuid(req.params.batchId, "batchId");
    requireNoProductionDataConfirmation(req.body?.confirmNoProductionData);
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error
        ? error.message
        : "Invalid import batch revalidation request"
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

    const batchResult = await client.query(
      `
      SELECT *
      FROM shareholder_import_batches
      WHERE id = $1
      FOR UPDATE
      `,
      [batchId]
    );

    if (batchResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Import batch not found");
    }

    const sourceRowsResult = await client.query(
      `
      SELECT source_payload_json
      FROM shareholder_import_rows
      WHERE batch_id = $1
      ORDER BY source_row_number ASC, created_at ASC
      `,
      [batchId]
    );

    const sourceRows = sourceRowsResult.rows.map(
      (row: { source_payload_json: Record<string, unknown> }) =>
        row.source_payload_json
    );

    if (sourceRows.length === 0) {
      await client.query("ROLLBACK");
      return sendBadRequest(res, "Import batch has no rows to revalidate");
    }

    const existingIndex = await fetchExistingImportIndex();
    const result = validateShareholderImportDryRun(sourceRows, existingIndex);
    const batchStatus = deriveBatchStatus(result);

    await client.query(
      `
      DELETE FROM shareholder_import_validation_messages
      WHERE batch_id = $1
      `,
      [batchId]
    );

    await client.query(
      `
      DELETE FROM shareholder_import_rows
      WHERE batch_id = $1
      `,
      [batchId]
    );

    await persistImportRowsAndMessages(client, {
      batchId,
      sourceRows,
      result,
    });

    await client.query(
      `
      UPDATE shareholder_import_batches
      SET
        batch_status = $2,
        validated_at = now(),
        summary_json = $3::jsonb,
        updated_at = now()
      WHERE id = $1
      `,
      [batchId, batchStatus, JSON.stringify(result.summary)]
    );

    await insertImportBatchEvent(client, {
      batchId,
      eventType: "import_batch_revalidated",
      actorId,
      actorRole: roleResult.role,
      eventPayload: {
        batchStatus,
        summary: result.summary,
      },
    });

    await client.query("COMMIT");

    const detail = await fetchImportBatchDetail(pool, batchId);

    return res.json({
      data: detail,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(
      res,
      "Failed to revalidate shareholder import batch",
      error
    );
  } finally {
    client.release();
  }
});

importRoutes.post("/shareholders/batches/:batchId/submit-review", async (req, res) => {
  let batchId = "";

  try {
    batchId = requireUuid(req.params.batchId, "batchId");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error
        ? error.message
        : "Invalid import batch review submission request"
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

    const batchResult = await client.query(
      `
      SELECT *
      FROM shareholder_import_batches
      WHERE id = $1
      FOR UPDATE
      `,
      [batchId]
    );

    if (batchResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Import batch not found");
    }

    const errorResult = await client.query(
      `
      SELECT COALESCE(SUM(error_count), 0)::integer AS error_count
      FROM shareholder_import_rows
      WHERE batch_id = $1
      `,
      [batchId]
    );

    if ((errorResult.rows[0]?.error_count ?? 0) > 0) {
      await client.query("ROLLBACK");
      return sendBadRequest(
        res,
        "Import batch cannot be submitted for review while validation errors remain"
      );
    }

    await client.query(
      `
      UPDATE shareholder_import_batches
      SET
        batch_status = 'ready_for_compliance_review',
        review_status = 'submitted_for_review',
        updated_at = now()
      WHERE id = $1
      `,
      [batchId]
    );

    await insertImportBatchEvent(client, {
      batchId,
      eventType: "import_batch_submitted_for_review",
      actorId,
      actorRole: roleResult.role,
      eventPayload: {
        nextStatus: "ready_for_compliance_review",
      },
    });

    await client.query("COMMIT");

    const detail = await fetchImportBatchDetail(pool, batchId);

    return res.json({
      data: detail,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(
      res,
      "Failed to submit shareholder import batch for review",
      error
    );
  } finally {
    client.release();
  }
});

importRoutes.post("/shareholders/messages/:messageId/resolve", async (req, res) => {
  let messageId = "";
  let resolutionStatus = "";
  let resolutionNotes: string | null = null;

  try {
    messageId = requireUuid(req.params.messageId, "messageId");
    resolutionStatus = requireNonEmptyString(
      req.body?.resolutionStatus,
      "resolutionStatus"
    );
    resolutionNotes =
      req.body?.resolutionNotes === undefined ||
      req.body?.resolutionNotes === null ||
      req.body?.resolutionNotes === ""
        ? null
        : requireNonEmptyString(req.body.resolutionNotes, "resolutionNotes");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error
        ? error.message
        : "Invalid import validation message resolution request"
    );
  }

  if (!["accepted", "resolved", "waived", "rejected"].includes(resolutionStatus)) {
    return sendBadRequest(
      res,
      "resolutionStatus must be one of: accepted, resolved, waived, rejected"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "maker",
    "checker_2",
    "compliance_officer",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const messageResult = await client.query(
      `
      SELECT *
      FROM shareholder_import_validation_messages
      WHERE id = $1
      FOR UPDATE
      `,
      [messageId]
    );

    if (messageResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Import validation message not found");
    }

    const message = messageResult.rows[0];

    await client.query(
      `
      UPDATE shareholder_import_validation_messages
      SET
        resolution_status = $2,
        resolved_by = $3,
        resolved_at = now(),
        resolution_notes = $4
      WHERE id = $1
      `,
      [messageId, resolutionStatus, actorId, resolutionNotes]
    );

    await insertImportBatchEvent(client, {
      batchId: message.batch_id,
      eventType:
        resolutionStatus === "waived"
          ? "import_message_waived"
          : "import_message_resolved",
      actorId,
      actorRole: roleResult.role,
      eventPayload: {
        messageId,
        rowId: message.row_id,
        fieldName: message.field_name,
        severity: message.severity,
        resolutionStatus,
      },
    });

    await client.query("COMMIT");

    const detail = await fetchImportBatchDetail(pool, message.batch_id);

    return res.json({
      data: detail,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(
      res,
      "Failed to resolve shareholder import validation message",
      error
    );
  } finally {
    client.release();
  }
});

importRoutes.post("/shareholders/batches/:batchId/commit", async (req, res) => {
  let batchId = "";
  try {
    batchId = requireUuid(req.params.batchId, "batchId");
  } catch (error) {
    return sendBadRequest(res, error instanceof Error ? error.message : "Invalid batchId");
  }

  const actorId = req.auth.actorId;
  const roleResult = requireRole(req.auth.actorRole, ["governance_admin", "compliance_officer"]);
  if (!roleResult.ok) return sendForbidden(res, roleResult.message);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const batchResult = await client.query(
      `SELECT * FROM shareholder_import_batches WHERE id = $1 FOR UPDATE`,
      [batchId]
    );
    if (batchResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Import batch not found");
    }

    const batch = batchResult.rows[0];
    const committableStatuses = ["validated", "validated_with_warnings", "ready_for_compliance_review"];
    if (!committableStatuses.includes(batch.batch_status)) {
      await client.query("ROLLBACK");
      return sendBadRequest(res, `Batch is not ready to commit (current status: ${batch.batch_status})`);
    }

    const rowsResult = await client.query(
      `SELECT * FROM shareholder_import_rows
       WHERE batch_id = $1
         AND row_status NOT IN ('excluded', 'blocked')`,
      [batchId]
    );

    const rows = rowsResult.rows;
    const createdIds: string[] = [];

    for (const row of rows) {
      const n = row.normalized_payload_json ?? {};
      const insertResult = await client.query(
        `INSERT INTO shareholder (
          entity_id, legal_name, type, status, kyc_status, gender, date_of_birth,
          nationality, occupation, tin_number, primary_id_number, mobile_number,
          email_address, physical_address, source_of_funds_declaration,
          risk_classification, shareholder_code, relationship_start_date
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,CURRENT_DATE
        ) RETURNING shareholder_id`,
        [
          batch.entity_id ?? null,
          n.legalName || "Unknown",
          n.type || "individual",
          n.status || "pending",
          "pending",
          n.gender ?? null,
          n.dateOfBirth ?? null,
          n.nationality ?? null,
          n.occupation ?? null,
          n.tinNumber ?? null,
          n.primaryIdNumber ?? null,
          n.mobileNumber ?? null,
          n.emailAddress ?? null,
          n.physicalAddress ?? null,
          n.sourceOfFundsDeclaration ?? null,
          n.riskRating ?? null,
          n.shareholderCode ?? null,
        ]
      );
      const newId = insertResult.rows[0].shareholder_id;
      createdIds.push(newId);
      await client.query(
        `UPDATE shareholder_import_rows SET created_shareholder_id = $2 WHERE id = $1`,
        [row.id, newId]
      );
    }

    await client.query(
      `UPDATE shareholder_import_batches
       SET batch_status = 'approved_for_commit', dry_run_only = false, updated_at = now()
       WHERE id = $1`,
      [batchId]
    );

    await insertImportBatchEvent(client, {
      batchId,
      eventType: "import_batch_committed",
      actorId,
      actorRole: roleResult.role,
      eventPayload: { committedCount: createdIds.length, skippedCount: 0 },
    });

    await client.query("COMMIT");

    return res.json({
      data: { batchId, committedCount: createdIds.length, createdShareholderIds: createdIds },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(res, "Failed to commit shareholder import batch", error);
  } finally {
    client.release();
  }
});

importRoutes.post("/shareholders/batches/:batchId/cancel", async (req, res) => {
  let batchId = "";
  let reason: string | null = null;

  try {
    batchId = requireUuid(req.params.batchId, "batchId");
    reason =
      req.body?.reason === undefined ||
      req.body?.reason === null ||
      req.body?.reason === ""
        ? null
        : requireNonEmptyString(req.body.reason, "reason");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid cancel request"
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

    const batchResult = await client.query(
      `SELECT * FROM shareholder_import_batches WHERE id = $1 FOR UPDATE`,
      [batchId]
    );

    if (batchResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Import batch not found");
    }

    const batch = batchResult.rows[0];
    const nonCancellable = ["cancelled", "rejected", "approved_for_commit"];

    if (nonCancellable.includes(batch.batch_status)) {
      await client.query("ROLLBACK");
      return sendBadRequest(
        res,
        `Cannot cancel a batch with status: ${batch.batch_status}`
      );
    }

    await client.query(
      `
      UPDATE shareholder_import_batches
      SET batch_status = 'cancelled',
          review_notes = $2,
          updated_at = now()
      WHERE id = $1
      `,
      [batchId, reason]
    );

    await insertImportBatchEvent(client, {
      batchId,
      eventType: "import_batch_cancelled",
      actorId,
      actorRole: roleResult.role,
      eventPayload: { reason },
    });

    await client.query("COMMIT");

    const detail = await fetchImportBatchDetail(pool, batchId);
    return res.json({ data: detail });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(
      res,
      "Failed to cancel shareholder import batch",
      error
    );
  } finally {
    client.release();
  }
});

importRoutes.post("/shareholders/batches/:batchId/reject", async (req, res) => {
  let batchId = "";
  let reviewNotes: string | null = null;

  try {
    batchId = requireUuid(req.params.batchId, "batchId");
    reviewNotes =
      req.body?.reviewNotes === undefined ||
      req.body?.reviewNotes === null ||
      req.body?.reviewNotes === ""
        ? null
        : requireNonEmptyString(req.body.reviewNotes, "reviewNotes");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error ? error.message : "Invalid reject request"
    );
  }

  const actorId = req.auth.actorId;

  const roleResult = requireRole(req.auth.actorRole, [
    "compliance_officer",
    "checker_2",
    "governance_admin",
  ]);

  if (!roleResult.ok) {
    return sendForbidden(res, roleResult.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const batchResult = await client.query(
      `SELECT * FROM shareholder_import_batches WHERE id = $1 FOR UPDATE`,
      [batchId]
    );

    if (batchResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Import batch not found");
    }

    const batch = batchResult.rows[0];
    const nonRejectable = ["rejected", "cancelled", "approved_for_commit"];

    if (nonRejectable.includes(batch.batch_status)) {
      await client.query("ROLLBACK");
      return sendBadRequest(
        res,
        `Cannot reject a batch with status: ${batch.batch_status}`
      );
    }

    await client.query(
      `
      UPDATE shareholder_import_batches
      SET batch_status = 'rejected',
          review_status = 'rejected',
          reviewed_by = $2,
          reviewed_at = now(),
          review_notes = $3,
          updated_at = now()
      WHERE id = $1
      `,
      [batchId, actorId, reviewNotes]
    );

    await insertImportBatchEvent(client, {
      batchId,
      eventType: "import_batch_rejected",
      actorId,
      actorRole: roleResult.role,
      eventPayload: { reviewNotes },
    });

    await client.query("COMMIT");

    const detail = await fetchImportBatchDetail(pool, batchId);
    return res.json({ data: detail });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendServerError(
      res,
      "Failed to reject shareholder import batch",
      error
    );
  } finally {
    client.release();
  }
});

importRoutes.post("/shareholders/rows/:rowId/exclude", async (req, res) => {
  let rowId = "";
  let reviewNotes: string | null = null;

  try {
    rowId = requireUuid(req.params.rowId, "rowId");
    reviewNotes =
      req.body?.reviewNotes === undefined ||
      req.body?.reviewNotes === null ||
      req.body?.reviewNotes === ""
        ? null
        : requireNonEmptyString(req.body.reviewNotes, "reviewNotes");
  } catch (error) {
    return sendBadRequest(
      res,
      error instanceof Error
        ? error.message
        : "Invalid import row exclusion request"
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

    const rowResult = await client.query(
      `
      SELECT *
      FROM shareholder_import_rows
      WHERE id = $1
      FOR UPDATE
      `,
      [rowId]
    );

    if (rowResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendNotFound(res, "Import row not found");
    }

    const row = rowResult.rows[0];

    await client.query(
      `
      UPDATE shareholder_import_rows
      SET
        row_status = 'excluded',
        review_decision = 'excluded',
        reviewed_by = $2,
        reviewed_at = now(),
        updated_at = now()
      WHERE id = $1
      `,
      [rowId, actorId]
    );

    await insertImportBatchEvent(client, {
      batchId: row.batch_id,
      eventType: "import_row_excluded",
      actorId,
      actorRole: roleResult.role,
      eventPayload: {
        rowId,
        sourceRowNumber: row.source_row_number,
        reviewNotes,
      },
    });

    await client.query("COMMIT");

    const detail = await fetchImportBatchDetail(pool, row.batch_id);

    return res.json({
      data: detail,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return sendServerError(res, "Failed to exclude shareholder import row", error);
  } finally {
    client.release();
  }
});
