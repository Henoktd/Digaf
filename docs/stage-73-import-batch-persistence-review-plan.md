# Stage 73: Excel Import Batch Persistence and Review Plan

## Purpose

Stage 73 defines how Digaf shareholder Excel import batches, parsed rows, validation messages, and review decisions should be persisted in a future implementation stage.

This stage is planning-only. It does not create database tables, migrations, API routes, frontend pages, package changes, seed data, or production import behavior.

## Source References

- `docs/stage-67-excel-import-preparation.md`
- `docs/stage-71-implementation-backlog-and-sequencing.md`
- `docs/stage-72-summary.md`
- `docs/digaf-field-mapping.md`
- `docs/digaf-assumptions-register.md`

## Stage 72 Baseline

Stage 72 added a dry-run validator:

```text
POST /api/imports/shareholders/dry-run
```

The route validates demo/sample row objects and returns structured errors and warnings without writing to the database.

Stage 73 extends the design from "validate request payload and return result" to "persist an import batch and review its validation state", while still avoiding real shareholder record creation.

## Persistence Principle

Persisting import batches should not mean committing shareholder records.

The import persistence model should store:

- The fact that an import batch was submitted.
- The mapping version used.
- Parsed row payloads.
- Normalized row payloads.
- Validation messages.
- Review decisions.
- Batch status history.

It should not create or update:

- `shareholder`
- `shareholder_identity_documents`
- `shareholder_kyc_profiles`
- `shareholder_payment_profiles`
- `share_ownership`
- `share_certificate`
- `approval_request` commit records

until a later import commit stage is explicitly approved.

## Proposed Tables

The following table names are proposed for a future additive migration.

### `shareholder_import_batches`

Purpose: one row per uploaded or submitted import batch.

| Column | Proposed type | Notes |
| --- | --- | --- |
| `id` | `UUID PRIMARY KEY` | System batch ID. |
| `entity_id` | `UUID REFERENCES entity(entity_id)` | Required if import is entity-specific. |
| `source_filename` | `TEXT` | Original file name or manual payload name. |
| `source_document_reference_id` | `UUID REFERENCES document_reference(id)` | Optional SharePoint/document reference when file upload is implemented. |
| `mapping_version` | `TEXT` | Example: `digaf-shareholder-registration-v1`. |
| `batch_status` | `TEXT` | Current batch workflow status. |
| `dry_run_only` | `BOOLEAN` | True until commit workflow is implemented. |
| `submitted_by` | `TEXT` | Actor ID from authenticated context in production. |
| `submitted_role` | `TEXT` | Prototype role until Entra role mapping is implemented. |
| `submitted_at` | `TIMESTAMPTZ` | Batch submission timestamp. |
| `validated_at` | `TIMESTAMPTZ` | Last validation timestamp. |
| `summary_json` | `JSONB` | Validation summary counts. |
| `review_status` | `TEXT` | Review outcome summary. |
| `reviewed_by` | `TEXT` | Reviewer actor ID. |
| `reviewed_at` | `TIMESTAMPTZ` | Review timestamp. |
| `review_notes` | `TEXT` | Review notes, not used for production approval by itself. |
| `created_at` | `TIMESTAMPTZ` | Audit timestamp. |
| `updated_at` | `TIMESTAMPTZ` | Audit timestamp. |

Recommended indexes:

- `entity_id`
- `batch_status`
- `submitted_at`
- `submitted_by`
- `mapping_version`

### `shareholder_import_rows`

Purpose: one row per parsed shareholder source row.

| Column | Proposed type | Notes |
| --- | --- | --- |
| `id` | `UUID PRIMARY KEY` | System row ID. |
| `batch_id` | `UUID REFERENCES shareholder_import_batches(id)` | Parent batch. |
| `source_row_number` | `INTEGER` | Excel row number. |
| `source_payload_json` | `JSONB` | Raw row fields as parsed from source. |
| `normalized_payload_json` | `JSONB` | Stage 72 normalized shape. |
| `row_status` | `TEXT` | `ready`, `ready_with_warnings`, `blocked`, etc. |
| `error_count` | `INTEGER` | Denormalized for list views. |
| `warning_count` | `INTEGER` | Denormalized for list views. |
| `duplicate_candidate_count` | `INTEGER` | Denormalized for review queue. |
| `review_decision` | `TEXT` | Optional row-level review outcome. |
| `reviewed_by` | `TEXT` | Optional reviewer actor ID. |
| `reviewed_at` | `TIMESTAMPTZ` | Optional row review timestamp. |
| `created_shareholder_id` | `UUID REFERENCES shareholder(shareholder_id)` | Null until a later commit stage. |
| `created_at` | `TIMESTAMPTZ` | Audit timestamp. |
| `updated_at` | `TIMESTAMPTZ` | Audit timestamp. |

Recommended indexes:

- `batch_id`
- `source_row_number`
- `row_status`
- `review_decision`
- `created_shareholder_id`

### `shareholder_import_validation_messages`

Purpose: persist errors and warnings returned by the validator.

| Column | Proposed type | Notes |
| --- | --- | --- |
| `id` | `UUID PRIMARY KEY` | System message ID. |
| `batch_id` | `UUID REFERENCES shareholder_import_batches(id)` | Parent batch. |
| `row_id` | `UUID REFERENCES shareholder_import_rows(id)` | Parent row. |
| `source_row_number` | `INTEGER` | Useful for direct Excel reference. |
| `field_name` | `TEXT` | Normalized field name. |
| `severity` | `TEXT` | `error` or `warning`. |
| `code` | `TEXT` | Machine-readable validation code. |
| `message` | `TEXT` | User-facing message. |
| `suggested_action` | `TEXT` | Recommended correction. |
| `responsible_role` | `TEXT` | Maker, Compliance, Finance, or Governance. |
| `resolution_status` | `TEXT` | `open`, `accepted`, `resolved`, `waived`, `rejected`. |
| `resolved_by` | `TEXT` | Reviewer actor ID. |
| `resolved_at` | `TIMESTAMPTZ` | Resolution timestamp. |
| `resolution_notes` | `TEXT` | Notes for accepted/waived messages. |
| `created_at` | `TIMESTAMPTZ` | Audit timestamp. |

Recommended indexes:

- `batch_id`
- `row_id`
- `severity`
- `code`
- `responsible_role`
- `resolution_status`

### `shareholder_import_batch_events`

Purpose: append-only event history for batch lifecycle evidence.

| Column | Proposed type | Notes |
| --- | --- | --- |
| `id` | `UUID PRIMARY KEY` | System event ID. |
| `batch_id` | `UUID REFERENCES shareholder_import_batches(id)` | Parent batch. |
| `event_type` | `TEXT` | Example: `batch_created`, `validation_completed`, `review_started`. |
| `actor_id` | `TEXT` | Actor who triggered the event. |
| `actor_role` | `TEXT` | Role at time of event. |
| `event_payload_json` | `JSONB` | Summary payload. |
| `created_at` | `TIMESTAMPTZ` | Event timestamp. |

This table should supplement, not replace, the platform-wide `audit_log`.

## Proposed Batch Status Model

| Status | Meaning |
| --- | --- |
| `draft` | Batch created but not validated. |
| `validated` | Validation completed with no blocking errors. |
| `validated_with_warnings` | Validation completed with warnings only. |
| `blocked` | One or more rows have errors. |
| `maker_revision_required` | Maker must correct/re-upload/revise source data. |
| `ready_for_compliance_review` | Batch can be reviewed by Compliance. |
| `compliance_review` | Compliance review in progress. |
| `finance_review` | Finance review in progress. |
| `ready_for_final_review` | Batch is ready for final review before a future commit. |
| `approved_for_commit` | Approved in principle, but no shareholder records created until commit stage exists. |
| `rejected` | Batch rejected. |
| `cancelled` | Batch cancelled by authorized user. |

## Proposed Row Status Model

| Status | Meaning |
| --- | --- |
| `ready` | No validation messages. |
| `ready_with_warnings` | No errors, but warnings require review. |
| `blocked` | One or more errors block commit. |
| `accepted_with_warning` | Reviewer accepts warning without source correction. |
| `resolved` | Error/warning corrected through revised row data or revalidation. |
| `excluded` | Row should not be included in future commit. |

## Review Model

### Maker Review

Maker responsibilities:

- Upload or submit source rows.
- Review validation errors.
- Correct source data or re-run validation.
- Add explanation for warnings where appropriate.
- Submit the batch for Compliance review.

### Compliance Review

Compliance responsibilities:

- Review KYC, AML, CFT, PEP, sanctions, adverse media, source-of-funds, and duplicate-candidate warnings.
- Accept, reject, or request correction for compliance-related warnings.
- Confirm that draft KYC-only items remain pending Digaf validation unless officially approved.

### Finance Review

Finance responsibilities:

- Review payment method.
- Review total investment amount.
- Review quantity, par value, and total value reconciliation.
- Confirm whether variance is acceptable due to share premium, discount, or source correction.

### Governance / Final Review

Governance responsibilities:

- Confirm shareholder code conflicts.
- Confirm certificate number conflicts.
- Confirm batch status and exception resolution before any future commit workflow.

## Proposed API Plan

Future additive API routes could include:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/imports/shareholders/batches` | `POST` | Create a dry-run persisted batch from parsed row objects. |
| `/api/imports/shareholders/batches` | `GET` | List import batches with summary status. |
| `/api/imports/shareholders/batches/:batchId` | `GET` | Fetch batch summary, rows, and messages. |
| `/api/imports/shareholders/batches/:batchId/revalidate` | `POST` | Re-run validation and replace row/message state. |
| `/api/imports/shareholders/batches/:batchId/submit-review` | `POST` | Move batch to review queue. |
| `/api/imports/shareholders/messages/:messageId/resolve` | `POST` | Resolve, accept, or waive a validation message. |
| `/api/imports/shareholders/rows/:rowId/exclude` | `POST` | Exclude one row from future commit consideration. |

Do not add a commit route until Digaf approves import commit workflow, approval controls, and production data migration rules.

## Proposed Frontend Plan

Future UI should include:

- Import batch list page.
- Batch detail page with summary counts.
- Row table with status filters.
- Message review panel grouped by responsible role.
- Row-level normalized payload view.
- Revalidation action.
- Submit for review action.
- Message resolution action.

The existing `/imports` Stage 72 dry-run page can remain as a demo utility or evolve into the batch creation screen.

## Security and Data Protection

Future persistence must treat import data as sensitive.

Controls needed:

- No raw production Excel files in source control.
- Store uploaded files only in approved SharePoint or secure storage.
- Persist only necessary parsed row values.
- Mask or restrict sensitive fields in logs.
- Restrict import batch access by role and entity.
- Audit every batch status change and review decision.
- Do not expose raw row payloads on public routes.
- Do not send full sensitive row payloads through Power Automate notifications.

## Audit and Evidence

Each persisted batch should produce evidence for:

- Who submitted it.
- Which mapping version was used.
- Which rows were blocked.
- Which warnings were accepted or resolved.
- Which role reviewed each exception.
- Whether a batch was rejected, cancelled, or approved for a future commit stage.

Recommended event types:

- `import_batch_created`
- `import_batch_validated`
- `import_batch_revalidated`
- `import_batch_submitted_for_review`
- `import_message_resolved`
- `import_message_waived`
- `import_row_excluded`
- `import_batch_rejected`
- `import_batch_cancelled`
- `import_batch_approved_for_commit`

## Migration Approach for Later Implementation

Recommended next implementation stage:

**Stage 74: Additive Import Batch Persistence Migration**

Stage 74 should:

- Add the proposed import batch tables.
- Keep all commit-related fields nullable.
- Add foreign keys where safe.
- Add indexes for batch and review queues.
- Avoid inserting real production data.
- Include comments explaining that import commit is not implemented yet.

## Implementation Risks

| Risk | Mitigation |
| --- | --- |
| Persisting import data may be mistaken for production import approval | Keep statuses and UI labels clear: persisted batch does not equal committed records. |
| Raw row payloads may contain sensitive data | Restrict access and avoid logging raw payloads. |
| Review workflow may drift from Digaf DOA | Keep review states provisional until Digaf validates DOA. |
| Duplicate warnings may be accepted incorrectly | Require Compliance/Governance review evidence before future commit. |
| Future commit logic could bypass normal onboarding controls | Commit must reuse normal shareholder/KYC/payment/certificate controls. |

## Assumptions Pending Digaf Validation

- Import batch persistence is acceptable before final production migration approval.
- Maker can create and revalidate import batches.
- Compliance can resolve or reject KYC/duplicate warnings.
- Finance can resolve or reject payment/investment warnings.
- Governance can resolve shareholder code and certificate conflicts.
- Final commit workflow will require additional approval and should not be implemented in Stage 73 or Stage 74.

## Out of Scope for Stage 73

- Creating migrations.
- Creating database tables.
- Persisting import batches.
- Uploading Excel files.
- Parsing real Excel files.
- Import commit workflow.
- Shareholder record creation from import.
- SharePoint file storage.
- Power Automate notifications.
- Power BI reporting.

## Recommended Next Stage

Recommended next stage: **Stage 74 - Additive Import Batch Persistence Migration**.

Stage 74 should implement only the persistence schema for import batches, rows, validation messages, and batch events. It should not implement import commit or real production data migration.
