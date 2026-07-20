-- Adds real maker-checker workflows for two controls explicitly required in
-- governance direction but previously data-only: (1) registering/releasing a
-- lien or pledge against shares, (2) imposing/lifting a legal hold. Both
-- require a distinct proposer and a distinct governance_admin approver.

ALTER TABLE legal_hold
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS release_requested_by TEXT,
  ADD COLUMN IF NOT EXISTS release_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decision_notes TEXT;

-- Existing rows (if any) predate the approval workflow — treat them as
-- already-approved so historical/seeded holds don't get stuck mid-flow.
UPDATE legal_hold
SET approved_by = imposed_by, approved_at = imposed_at
WHERE status = 'active' AND approved_by IS NULL;

CREATE TABLE IF NOT EXISTS share_lien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  share_ownership_id UUID NOT NULL REFERENCES share_ownership(id),
  lien_type TEXT NOT NULL, -- 'pledge' | 'encumbrance'
  quantity NUMERIC(18, 2) NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  authority_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  release_requested_by TEXT,
  release_requested_at TIMESTAMPTZ,
  released_by TEXT,
  released_at TIMESTAMPTZ,
  decision_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_lien_ownership_id ON share_lien(share_ownership_id);
CREATE INDEX IF NOT EXISTS idx_share_lien_status ON share_lien(status);
