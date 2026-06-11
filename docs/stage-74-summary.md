# Stage 74 Summary: Additive Import Batch Persistence Migration

## Stage Objective

Stage 74 implements the additive database migration for Digaf shareholder import batch persistence.

This stage creates storage for import batches, parsed rows, validation messages, and import batch events. It does not implement Excel upload, Excel parsing, import commit, shareholder record creation, approval routing, SharePoint storage, Power Automate notifications, or Power BI reporting.

## Source References

- `docs/stage-73-import-batch-persistence-review-plan.md`
- `docs/stage-72-summary.md`
- `docs/stage-67-excel-import-preparation.md`
- `docs/digaf-field-mapping.md`
- `docs/digaf-assumptions-register.md`

## Migration Created

- `database/migrations/004_shareholder_import_persistence.sql`

## Tables Added

### `shareholder_import_batches`

Stores one import batch record, including:

- Entity reference.
- Source filename.
- Optional document reference for future SharePoint/source-file storage.
- Mapping version.
- Batch status.
- Dry-run-only flag.
- Submitter and reviewer metadata.
- Validation summary JSON.
- Created/updated timestamps.

### `shareholder_import_rows`

Stores one parsed source row per import batch, including:

- Source row number.
- Raw parsed payload JSON.
- Normalized payload JSON.
- Row status.
- Error, warning, and duplicate-candidate counts.
- Optional row review decision.
- Nullable future `created_shareholder_id` link.

The nullable shareholder link is for a later commit workflow only. Stage 74 does not create shareholders.

### `shareholder_import_validation_messages`

Stores row-level validation messages, including:

- Field name.
- Severity.
- Validation code.
- Message.
- Suggested action.
- Responsible role.
- Resolution status and notes.

### `shareholder_import_batch_events`

Stores append-style lifecycle events for import batch evidence, including:

- Event type.
- Actor ID and role.
- Event payload JSON.
- Created timestamp.

This supplements the platform-wide audit log and does not replace regulated workflow audit requirements.

## Indexes Added

Indexes were added for:

- Batch entity, status, submitter, submitted timestamp, mapping version, and source document reference.
- Row batch, source row number, row status, review decision, and future created shareholder link.
- Validation message batch, row, severity, code, responsible role, and resolution status.
- Batch event batch, event type, actor ID, and event timestamp.

## Compatibility Notes

- The migration is additive only.
- Existing MVP tables and columns are not removed or renamed.
- Existing Stage 72 dry-run route remains dry-run only.
- No import commit route is added.
- No production shareholder data is inserted.
- Status values remain text with explanatory comments because Digaf workflow vocabulary is still pending validation.
- Raw and normalized payload columns are JSONB so later parser changes do not require immediate schema churn.

## Assumptions Made

- Import batch persistence can be prepared before final import commit approval.
- Persisted batches must remain clearly separate from committed shareholder records.
- `dry_run_only` defaults to `true` until a future approved commit stage exists.
- Source files will later be referenced through `document_reference` when SharePoint/source-file storage is implemented.
- Import batch event history should supplement `audit_log`.
- Entra-backed identity is not yet implemented, so actor fields remain text placeholders consistent with current MVP patterns.

## Out of Scope

- Real Excel upload.
- Real Excel parsing.
- Import batch API persistence routes.
- Frontend import batch list/detail screens.
- Import approval workflow.
- Import commit.
- Shareholder creation from import rows.
- Real production shareholder data.
- SharePoint, Power Automate, or Power BI integration.

## Build / Check Results

Build checks are run after this document is created and reported in the stage closeout.

## Recommended Next Stage

Recommended next stage: **Stage 75 - Import Batch API Persistence Routes**.

Stage 75 should add API support to create/list/fetch persisted dry-run batches and their validation messages. It should still avoid import commit and real production data migration.
