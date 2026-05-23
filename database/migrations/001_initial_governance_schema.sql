CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS entity (
  entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  branding_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  certificate_template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  workflow_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sla_config_id UUID,
  entra_tenant_id TEXT,
  sharepoint_site_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shareholder (
  shareholder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  legal_name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  contact_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  kyc_status TEXT NOT NULL DEFAULT 'not_started',
  kyc_expiry DATE,
  risk_classification TEXT,
  proxy_eligible BOOLEAN NOT NULL DEFAULT false,
  relationship_start_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS share_class (
  share_class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  class_name TEXT NOT NULL,
  voting_rights BOOLEAN NOT NULL DEFAULT true,
  votes_per_share INTEGER NOT NULL DEFAULT 1,
  voting_class_tier INTEGER NOT NULL DEFAULT 1,
  par_value NUMERIC(18, 2),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS share_certificate (
  certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  serial_number TEXT NOT NULL UNIQUE,
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  share_class_id UUID NOT NULL REFERENCES share_class(share_class_id),
  quantity NUMERIC(18, 2) NOT NULL,
  issue_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  qr_token TEXT,
  certificate_hash TEXT,
  hash_algorithm TEXT,
  hash_generated_at TIMESTAMPTZ,
  signature_token TEXT,
  revocation_status TEXT,
  reissue_reference UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  request_type TEXT NOT NULL,
  reference_id UUID,
  stage TEXT NOT NULL DEFAULT 'draft',
  current_approver_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  maker_id TEXT,
  checker1_id TEXT,
  checker2_id TEXT,
  sla_due_date TIMESTAMPTZ,
  escalation_level INTEGER NOT NULL DEFAULT 0,
  escalation_triggered_at TIMESTAMPTZ,
  escalation_recipient TEXT,
  decision_notes TEXT,
  board_resolution_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certificate_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES share_certificate(certificate_id),
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_value_json JSONB,
  new_value_json JSONB,
  timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_shareholder_entity_id ON shareholder(entity_id);
CREATE INDEX IF NOT EXISTS idx_share_class_entity_id ON share_class(entity_id);
CREATE INDEX IF NOT EXISTS idx_share_certificate_entity_id ON share_certificate(entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_request_entity_id ON approval_request(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log(entity_id);