CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Stage 74: shareholder import batch persistence.
-- This migration is intentionally additive. It creates storage for import
-- batches, parsed rows, validation messages, and batch events only.
-- It does not create shareholder records, commit import data, parse Excel
-- files, or approve real production data migration.

CREATE TABLE IF NOT EXISTS shareholder_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entity(entity_id),
  source_filename TEXT,
  source_document_reference_id UUID REFERENCES document_reference(id),
  mapping_version TEXT NOT NULL DEFAULT 'digaf-shareholder-registration-v1',
  batch_status TEXT NOT NULL DEFAULT 'draft',
  dry_run_only BOOLEAN NOT NULL DEFAULT true,
  submitted_by TEXT,
  submitted_role TEXT,
  submitted_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_status TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shareholder_import_batches IS 'Stage 74 import batch persistence for Digaf shareholder Excel import preparation. Persisting a batch does not create or update shareholder records.';
COMMENT ON COLUMN shareholder_import_batches.entity_id IS 'Optional during early dry-run and required once Digaf confirms entity-scoped import behavior.';
COMMENT ON COLUMN shareholder_import_batches.source_filename IS 'Original file name or manual payload label. Do not store raw production Excel files in source control.';
COMMENT ON COLUMN shareholder_import_batches.source_document_reference_id IS 'Optional future SharePoint/document reference for uploaded source file. File upload is not implemented in Stage 74.';
COMMENT ON COLUMN shareholder_import_batches.mapping_version IS 'Import mapping version used for validation. Initial value aligns to Stage 72 dry-run validator.';
COMMENT ON COLUMN shareholder_import_batches.batch_status IS 'Provisional workflow status such as draft, validated, blocked, compliance_review, finance_review, rejected, or cancelled. Final statuses pending Digaf validation.';
COMMENT ON COLUMN shareholder_import_batches.dry_run_only IS 'True until an explicit future import commit workflow is approved and implemented.';
COMMENT ON COLUMN shareholder_import_batches.summary_json IS 'Validation summary counts and metadata. Should not contain full raw production row payloads.';
COMMENT ON COLUMN shareholder_import_batches.review_status IS 'Provisional review outcome summary. Does not constitute final production import approval.';
COMMENT ON COLUMN shareholder_import_batches.updated_at IS 'Application code should update this when persisted batch state changes.';

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batches_entity_id
  ON shareholder_import_batches(entity_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batches_batch_status
  ON shareholder_import_batches(batch_status);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batches_submitted_at
  ON shareholder_import_batches(submitted_at);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batches_submitted_by
  ON shareholder_import_batches(submitted_by)
  WHERE submitted_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batches_mapping_version
  ON shareholder_import_batches(mapping_version);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batches_document_ref
  ON shareholder_import_batches(source_document_reference_id)
  WHERE source_document_reference_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS shareholder_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES shareholder_import_batches(id),
  source_row_number INTEGER NOT NULL,
  source_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_status TEXT NOT NULL DEFAULT 'blocked',
  error_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  duplicate_candidate_count INTEGER NOT NULL DEFAULT 0,
  review_decision TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_shareholder_id UUID REFERENCES shareholder(shareholder_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT shareholder_import_rows_source_row_positive
    CHECK (source_row_number > 0),
  CONSTRAINT shareholder_import_rows_error_count_nonnegative
    CHECK (error_count >= 0),
  CONSTRAINT shareholder_import_rows_warning_count_nonnegative
    CHECK (warning_count >= 0),
  CONSTRAINT shareholder_import_rows_duplicate_count_nonnegative
    CHECK (duplicate_candidate_count >= 0)
);

COMMENT ON TABLE shareholder_import_rows IS 'Parsed and normalized shareholder import rows for review. Rows are staging evidence only until a future commit workflow is approved.';
COMMENT ON COLUMN shareholder_import_rows.batch_id IS 'Parent import batch.';
COMMENT ON COLUMN shareholder_import_rows.source_row_number IS 'Original Excel/source row number for reviewer traceability.';
COMMENT ON COLUMN shareholder_import_rows.source_payload_json IS 'Raw parsed row payload. Treat as sensitive and avoid exposing broadly.';
COMMENT ON COLUMN shareholder_import_rows.normalized_payload_json IS 'Normalized Stage 72 validator payload used for validation and review.';
COMMENT ON COLUMN shareholder_import_rows.row_status IS 'Provisional row status such as ready, ready_with_warnings, blocked, resolved, excluded, or accepted_with_warning.';
COMMENT ON COLUMN shareholder_import_rows.review_decision IS 'Optional reviewer decision. Final decision vocabulary remains pending Digaf validation.';
COMMENT ON COLUMN shareholder_import_rows.created_shareholder_id IS 'Nullable future link to a created shareholder. Stage 74 does not create shareholder records.';
COMMENT ON COLUMN shareholder_import_rows.updated_at IS 'Application code should update this when persisted row state changes.';

CREATE INDEX IF NOT EXISTS idx_shareholder_import_rows_batch_id
  ON shareholder_import_rows(batch_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_rows_batch_source_row
  ON shareholder_import_rows(batch_id, source_row_number);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_rows_row_status
  ON shareholder_import_rows(row_status);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_rows_review_decision
  ON shareholder_import_rows(review_decision)
  WHERE review_decision IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_import_rows_created_shareholder_id
  ON shareholder_import_rows(created_shareholder_id)
  WHERE created_shareholder_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS shareholder_import_validation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES shareholder_import_batches(id),
  row_id UUID NOT NULL REFERENCES shareholder_import_rows(id),
  source_row_number INTEGER NOT NULL,
  field_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  suggested_action TEXT,
  responsible_role TEXT,
  resolution_status TEXT NOT NULL DEFAULT 'open',
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT shareholder_import_validation_source_row_positive
    CHECK (source_row_number > 0)
);

COMMENT ON TABLE shareholder_import_validation_messages IS 'Persisted import validation errors and warnings for row-level review. Messages do not approve or commit shareholder data.';
COMMENT ON COLUMN shareholder_import_validation_messages.field_name IS 'Normalized import field name from the Stage 72 validator.';
COMMENT ON COLUMN shareholder_import_validation_messages.severity IS 'Expected provisional values are error or warning. Not constrained until final validation vocabulary is approved.';
COMMENT ON COLUMN shareholder_import_validation_messages.code IS 'Machine-readable validation code.';
COMMENT ON COLUMN shareholder_import_validation_messages.suggested_action IS 'Recommended correction or review action.';
COMMENT ON COLUMN shareholder_import_validation_messages.responsible_role IS 'Provisional owner such as Maker, Compliance, Finance, or Governance.';
COMMENT ON COLUMN shareholder_import_validation_messages.resolution_status IS 'Provisional values include open, accepted, resolved, waived, or rejected pending Digaf validation.';
COMMENT ON COLUMN shareholder_import_validation_messages.resolution_notes IS 'Reviewer notes for accepted, waived, resolved, or rejected messages.';

CREATE INDEX IF NOT EXISTS idx_shareholder_import_messages_batch_id
  ON shareholder_import_validation_messages(batch_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_messages_row_id
  ON shareholder_import_validation_messages(row_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_messages_severity
  ON shareholder_import_validation_messages(severity);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_messages_code
  ON shareholder_import_validation_messages(code);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_messages_responsible_role
  ON shareholder_import_validation_messages(responsible_role)
  WHERE responsible_role IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_import_messages_resolution_status
  ON shareholder_import_validation_messages(resolution_status);

CREATE TABLE IF NOT EXISTS shareholder_import_batch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES shareholder_import_batches(id),
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role TEXT,
  event_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shareholder_import_batch_events IS 'Append-style event history for import batch lifecycle evidence. Supplements audit_log and does not replace regulated workflow audit requirements.';
COMMENT ON COLUMN shareholder_import_batch_events.event_type IS 'Expected values include import_batch_created, import_batch_validated, import_message_resolved, import_row_excluded, and import_batch_cancelled. Final vocabulary pending Digaf validation.';
COMMENT ON COLUMN shareholder_import_batch_events.actor_id IS 'Actor that triggered the batch lifecycle event. In production this should come from trusted identity claims.';
COMMENT ON COLUMN shareholder_import_batch_events.actor_role IS 'Prototype role at time of event until Entra group mapping is implemented.';
COMMENT ON COLUMN shareholder_import_batch_events.event_payload_json IS 'Event summary payload. Avoid storing unnecessary sensitive raw row data.';

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batch_events_batch_id
  ON shareholder_import_batch_events(batch_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batch_events_event_type
  ON shareholder_import_batch_events(event_type);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batch_events_actor_id
  ON shareholder_import_batch_events(actor_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_import_batch_events_created_at
  ON shareholder_import_batch_events(created_at);
