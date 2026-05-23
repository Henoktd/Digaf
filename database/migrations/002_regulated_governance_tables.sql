CREATE TABLE IF NOT EXISTS beneficial_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  beneficial_owner_name TEXT NOT NULL,
  relationship_type TEXT,
  percentage_reference NUMERIC(7, 4),
  verification_status TEXT NOT NULL DEFAULT 'pending',
  last_verified_date DATE,
  document_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kyc_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  kyc_status TEXT NOT NULL DEFAULT 'not_started',
  expiry_date DATE,
  document_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewer_id TEXT,
  approval_date DATE,
  last_review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS share_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  share_class_id UUID NOT NULL REFERENCES share_class(share_class_id),
  quantity NUMERIC(18, 2) NOT NULL DEFAULT 0,
  pledged_quantity NUMERIC(18, 2) NOT NULL DEFAULT 0,
  encumbered_quantity NUMERIC(18, 2) NOT NULL DEFAULT 0,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  source_transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ownership_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  type TEXT NOT NULL,
  shareholder_id UUID REFERENCES shareholder(shareholder_id),
  share_class_id UUID REFERENCES share_class(share_class_id),
  board_approval_ref TEXT,
  before_qty NUMERIC(18, 2),
  after_qty NUMERIC(18, 2),
  audit_reference UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cap_table_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_shares NUMERIC(18, 2) NOT NULL DEFAULT 0,
  ownership_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  concentration_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS share_transfer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  transferor_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  transferee_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  shares NUMERIC(18, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  maker_id TEXT,
  checker1_id TEXT,
  checker2_id TEXT,
  board_approval_required BOOLEAN NOT NULL DEFAULT false,
  board_approval_ref TEXT,
  encumbrance_check_status TEXT NOT NULL DEFAULT 'pending',
  kyc_check_status TEXT NOT NULL DEFAULT 'pending',
  bo_reverification_required BOOLEAN NOT NULL DEFAULT false,
  freeze_reference UUID,
  supporting_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  effective_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transfer_freeze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  shareholder_id UUID REFERENCES shareholder(shareholder_id),
  freeze_type TEXT NOT NULL,
  imposed_by TEXT NOT NULL,
  imposed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  lifted_by TEXT,
  lifted_at TIMESTAMPTZ,
  audit_reference UUID
);

CREATE TABLE IF NOT EXISTS document_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  file_url TEXT NOT NULL,
  library TEXT NOT NULL,
  document_type TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  retention_category TEXT,
  legal_hold_id UUID,
  related_entity TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_hold (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  hold_type TEXT NOT NULL,
  related_record_type TEXT NOT NULL,
  related_record_id UUID NOT NULL,
  imposed_by TEXT NOT NULL,
  imposed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  lifted_by TEXT,
  lifted_at TIMESTAMPTZ,
  authority_reference TEXT
);

ALTER TABLE document_reference
  ADD CONSTRAINT fk_document_reference_legal_hold
  FOREIGN KEY (legal_hold_id)
  REFERENCES legal_hold(id);

CREATE TABLE IF NOT EXISTS sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  process_type TEXT NOT NULL,
  target_days INTEGER NOT NULL,
  escalation_day1 INTEGER,
  escalation_day2 INTEGER,
  escalation_recipient_role TEXT,
  uptime_target NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  type TEXT NOT NULL,
  recipient_id UUID,
  channel TEXT NOT NULL,
  subject TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  related_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS board_resolution_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  resolution_number TEXT NOT NULL,
  resolution_date DATE NOT NULL,
  description TEXT,
  sharepoint_document_url TEXT,
  approved_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beneficial_ownership_entity_id ON beneficial_ownership(entity_id);
CREATE INDEX IF NOT EXISTS idx_kyc_record_shareholder_id ON kyc_record(shareholder_id);
CREATE INDEX IF NOT EXISTS idx_share_ownership_shareholder_id ON share_ownership(shareholder_id);
CREATE INDEX IF NOT EXISTS idx_ownership_transaction_entity_id ON ownership_transaction(entity_id);
CREATE INDEX IF NOT EXISTS idx_cap_table_snapshot_entity_id ON cap_table_snapshot(entity_id);
CREATE INDEX IF NOT EXISTS idx_share_transfer_entity_id ON share_transfer(entity_id);
CREATE INDEX IF NOT EXISTS idx_transfer_freeze_entity_id ON transfer_freeze(entity_id);
CREATE INDEX IF NOT EXISTS idx_document_reference_entity_id ON document_reference(entity_id);
CREATE INDEX IF NOT EXISTS idx_legal_hold_entity_id ON legal_hold(entity_id);
CREATE INDEX IF NOT EXISTS idx_sla_config_entity_id ON sla_config(entity_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_entity_id ON communication_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_board_resolution_ref_entity_id ON board_resolution_ref(entity_id);