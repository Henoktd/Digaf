CREATE TABLE IF NOT EXISTS dividend_declaration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(entity_id),
  share_class_id UUID REFERENCES share_class(share_class_id),
  declared_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_date DATE NOT NULL,
  payment_date DATE,
  amount_per_share NUMERIC(18, 6) NOT NULL,
  total_declared_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  withholding_tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'declared',
  board_resolution_ref TEXT,
  notes TEXT,
  declared_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dividend_entitlement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dividend_id UUID NOT NULL REFERENCES dividend_declaration(id),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  shareholder_name TEXT,
  shares_at_record_date NUMERIC(18, 2) NOT NULL DEFAULT 0,
  gross_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  withholding_tax_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dividend_declaration_entity_id ON dividend_declaration(entity_id);
CREATE INDEX IF NOT EXISTS idx_dividend_entitlement_dividend_id ON dividend_entitlement(dividend_id);
CREATE INDEX IF NOT EXISTS idx_dividend_entitlement_shareholder_id ON dividend_entitlement(shareholder_id);
