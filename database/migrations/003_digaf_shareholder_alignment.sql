CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Stage 66B: Digaf shareholder alignment.
-- This migration is intentionally additive. It does not remove or rename
-- existing MVP columns and keeps new fields nullable until Digaf validation
-- and frontend/API rollout are completed.

ALTER TABLE shareholder
  ADD COLUMN IF NOT EXISTS shareholder_code TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS tin_number TEXT,
  ADD COLUMN IF NOT EXISTS primary_id_number TEXT,
  ADD COLUMN IF NOT EXISTS mobile_number TEXT,
  ADD COLUMN IF NOT EXISTS email_address TEXT,
  ADD COLUMN IF NOT EXISTS physical_address TEXT,
  ADD COLUMN IF NOT EXISTS source_of_funds_declaration TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN shareholder.shareholder_code IS 'Digaf-facing shareholder identifier. Based on the Excel registration template Shareholder ID field; UUID remains the system key.';
COMMENT ON COLUMN shareholder.gender IS 'Excel-confirmed Digaf shareholder registration field. Nullable during pilot alignment.';
COMMENT ON COLUMN shareholder.date_of_birth IS 'Excel-confirmed Digaf shareholder registration field. Nullable during pilot alignment.';
COMMENT ON COLUMN shareholder.nationality IS 'Excel-confirmed Digaf shareholder registration field. Nullable during pilot alignment.';
COMMENT ON COLUMN shareholder.occupation IS 'Excel-confirmed Digaf shareholder registration field. Nullable during pilot alignment.';
COMMENT ON COLUMN shareholder.tin_number IS 'Excel-confirmed Digaf shareholder registration field. Nullable during pilot alignment.';
COMMENT ON COLUMN shareholder.primary_id_number IS 'Excel-confirmed National ID / Passport Number summary field. Detailed identity document metadata is stored in shareholder_identity_documents.';
COMMENT ON COLUMN shareholder.mobile_number IS 'Excel-confirmed Mobile Number field. Backfilled from contact_details->phone for MVP compatibility.';
COMMENT ON COLUMN shareholder.email_address IS 'Excel-confirmed Email Address field. Backfilled from contact_details->email for MVP compatibility.';
COMMENT ON COLUMN shareholder.physical_address IS 'Excel-confirmed Physical Address field. Detailed normalized address fields remain pending Digaf validation.';
COMMENT ON COLUMN shareholder.source_of_funds_declaration IS 'Excel-confirmed Source of Funds Declaration summary. Detailed source categories remain pending Digaf validation.';
COMMENT ON COLUMN shareholder.updated_at IS 'Additive timestamp for future profile update workflows. Existing MVP routes do not update this field yet.';

UPDATE shareholder
SET
  mobile_number = COALESCE(mobile_number, NULLIF(contact_details->>'phone', '')),
  email_address = COALESCE(email_address, NULLIF(contact_details->>'email', ''))
WHERE contact_details IS NOT NULL
  AND (
    mobile_number IS NULL
    OR email_address IS NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_shareholder_shareholder_code
  ON shareholder(shareholder_code)
  WHERE shareholder_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_tin_number
  ON shareholder(tin_number)
  WHERE tin_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_primary_id_number
  ON shareholder(primary_id_number)
  WHERE primary_id_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_email_address_lower
  ON shareholder(lower(email_address))
  WHERE email_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_mobile_number
  ON shareholder(mobile_number)
  WHERE mobile_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS shareholder_identity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  entity_id UUID REFERENCES entity(entity_id),
  document_role TEXT,
  id_type TEXT,
  id_number TEXT,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  country_of_issue TEXT,
  document_reference_id UUID REFERENCES document_reference(id),
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shareholder_identity_documents IS 'Structured identity document metadata for Digaf shareholder alignment. Primary National ID / Passport Number is Excel-confirmed; detailed metadata is based on the proposed KYC draft and remains pending Digaf validation.';
COMMENT ON COLUMN shareholder_identity_documents.document_role IS 'Assumed values such as primary or secondary, pending Digaf validation.';
COMMENT ON COLUMN shareholder_identity_documents.id_type IS 'Draft KYC field, pending Digaf validation. Proposed examples include national_id, passport, driver_license, voter_card, and other.';
COMMENT ON COLUMN shareholder_identity_documents.issuing_authority IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_identity_documents.issue_date IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_identity_documents.expiry_date IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_identity_documents.country_of_issue IS 'Draft KYC field, pending Digaf validation.';

CREATE INDEX IF NOT EXISTS idx_shareholder_identity_documents_shareholder_id
  ON shareholder_identity_documents(shareholder_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_identity_documents_entity_id
  ON shareholder_identity_documents(entity_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_identity_documents_id_number
  ON shareholder_identity_documents(id_number)
  WHERE id_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_identity_documents_document_ref
  ON shareholder_identity_documents(document_reference_id)
  WHERE document_reference_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS shareholder_kyc_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  entity_id UUID REFERENCES entity(entity_id),
  kyc_record_id UUID REFERENCES kyc_record(id),
  cdd_completed BOOLEAN,
  cdd_completed_at TIMESTAMPTZ,
  cdd_completed_by TEXT,
  pep_status TEXT,
  pep_family_or_associate BOOLEAN,
  pep_position_role TEXT,
  pep_country_or_organization TEXT,
  sanction_screening_result TEXT,
  sanction_screened_at TIMESTAMPTZ,
  sanction_screened_by TEXT,
  adverse_media_screening_result TEXT,
  adverse_media_screened_at TIMESTAMPTZ,
  adverse_media_screened_by TEXT,
  risk_rating TEXT,
  aml_officer_approval_status TEXT,
  aml_officer_id TEXT,
  aml_approval_date DATE,
  aml_approval_notes TEXT,
  source_of_funds_summary TEXT,
  source_of_funds_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  annual_income_range TEXT,
  employment_status TEXT,
  employer_business_name TEXT,
  employer_address TEXT,
  business_sector TEXT,
  years_at_current_job NUMERIC(6, 2),
  international_sanctions_declared BOOLEAN,
  financial_crime_declared BOOLEAN,
  regulatory_investigation_declared BOOLEAN,
  other_financial_institution_shareholding BOOLEAN,
  conflict_of_interest_declared BOOLEAN,
  declaration_notes TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shareholder_kyc_profiles IS 'Expanded KYC/AML/CFT profile for Digaf shareholder alignment. Excel-confirmed screening fields are included; draft KYC declarations remain nullable pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.cdd_completed IS 'Excel-confirmed Customer Due Diligence Completed field.';
COMMENT ON COLUMN shareholder_kyc_profiles.pep_status IS 'Excel-confirmed PEP status field. Detailed PEP fields are draft KYC assumptions pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.sanction_screening_result IS 'Excel-confirmed Sanction Screening Result field. Screening integration/source remains pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.adverse_media_screening_result IS 'Excel-confirmed Adverse Media Screening Result field. Screening integration/source remains pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.risk_rating IS 'Excel-confirmed Risk Rating field. Risk scoring method remains pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.aml_officer_approval_status IS 'Excel-confirmed AML Officer Approval field. Final role mapping is pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.source_of_funds_categories IS 'Draft KYC field, pending Digaf validation. Stored as JSONB to avoid premature enum locking.';
COMMENT ON COLUMN shareholder_kyc_profiles.annual_income_range IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.employment_status IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.international_sanctions_declared IS 'Draft KYC self-declaration, pending Digaf validation. Does not replace independent screening.';
COMMENT ON COLUMN shareholder_kyc_profiles.financial_crime_declared IS 'Draft KYC self-declaration, pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.regulatory_investigation_declared IS 'Draft KYC self-declaration, pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.other_financial_institution_shareholding IS 'Draft KYC self-declaration, pending Digaf validation.';
COMMENT ON COLUMN shareholder_kyc_profiles.conflict_of_interest_declared IS 'Recommended in the Excel gap section, pending Digaf validation.';

CREATE INDEX IF NOT EXISTS idx_shareholder_kyc_profiles_shareholder_id
  ON shareholder_kyc_profiles(shareholder_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_kyc_profiles_entity_id
  ON shareholder_kyc_profiles(entity_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_kyc_profiles_kyc_record_id
  ON shareholder_kyc_profiles(kyc_record_id)
  WHERE kyc_record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_kyc_profiles_risk_rating
  ON shareholder_kyc_profiles(risk_rating)
  WHERE risk_rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_kyc_profiles_pep_status
  ON shareholder_kyc_profiles(pep_status)
  WHERE pep_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_kyc_profiles_review_status
  ON shareholder_kyc_profiles(review_status);

CREATE TABLE IF NOT EXISTS shareholder_beneficial_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  entity_id UUID REFERENCES entity(entity_id),
  is_ultimate_beneficial_owner BOOLEAN,
  beneficial_owner_full_name TEXT,
  relationship_to_shareholder TEXT,
  beneficial_owner_id_type TEXT,
  beneficial_owner_id_number TEXT,
  beneficial_owner_tin TEXT,
  beneficial_owner_country_of_residence TEXT,
  percentage_reference NUMERIC(7, 4),
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verification_method TEXT,
  verification_notes TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  document_reference_id UUID REFERENCES document_reference(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shareholder_beneficial_owners IS 'Digaf-aligned beneficial owner details. Existing beneficial_ownership table is preserved for MVP compatibility; this table supports the Stage 65 field mapping.';
COMMENT ON COLUMN shareholder_beneficial_owners.is_ultimate_beneficial_owner IS 'Draft KYC beneficial ownership confirmation, pending Digaf validation.';
COMMENT ON COLUMN shareholder_beneficial_owners.beneficial_owner_full_name IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_beneficial_owners.relationship_to_shareholder IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_beneficial_owners.beneficial_owner_id_type IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_beneficial_owners.beneficial_owner_id_number IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_beneficial_owners.beneficial_owner_tin IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_beneficial_owners.beneficial_owner_country_of_residence IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_beneficial_owners.verification_status IS 'Beneficial ownership verification is recommended in the Excel gap section and remains pending Digaf validation.';

CREATE INDEX IF NOT EXISTS idx_shareholder_beneficial_owners_shareholder_id
  ON shareholder_beneficial_owners(shareholder_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_beneficial_owners_entity_id
  ON shareholder_beneficial_owners(entity_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_beneficial_owners_name
  ON shareholder_beneficial_owners(beneficial_owner_full_name)
  WHERE beneficial_owner_full_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_beneficial_owners_id_number
  ON shareholder_beneficial_owners(beneficial_owner_id_number)
  WHERE beneficial_owner_id_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shareholder_beneficial_owners_verification_status
  ON shareholder_beneficial_owners(verification_status);

CREATE TABLE IF NOT EXISTS shareholder_next_of_kin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  entity_id UUID REFERENCES entity(entity_id),
  full_name TEXT,
  relationship TEXT,
  phone_number TEXT,
  email_address TEXT,
  residential_address TEXT,
  city_country TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shareholder_next_of_kin IS 'Next of kin / emergency contact fields from the proposed KYC draft. All fields are nullable pending Digaf validation.';
COMMENT ON COLUMN shareholder_next_of_kin.full_name IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_next_of_kin.relationship IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_next_of_kin.phone_number IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_next_of_kin.email_address IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_next_of_kin.residential_address IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_next_of_kin.city_country IS 'Draft KYC field, pending Digaf validation.';

CREATE INDEX IF NOT EXISTS idx_shareholder_next_of_kin_shareholder_id
  ON shareholder_next_of_kin(shareholder_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_next_of_kin_entity_id
  ON shareholder_next_of_kin(entity_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_next_of_kin_phone_number
  ON shareholder_next_of_kin(phone_number)
  WHERE phone_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS shareholder_document_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  entity_id UUID REFERENCES entity(entity_id),
  document_type TEXT NOT NULL,
  requirement_status TEXT NOT NULL DEFAULT 'required',
  checklist_status TEXT NOT NULL DEFAULT 'pending',
  source_basis TEXT,
  document_reference_id UUID REFERENCES document_reference(id),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shareholder_document_checklist IS 'Tracks required, conditional, attached, waived, rejected, or pending document checklist items without adding one boolean column per document.';
COMMENT ON COLUMN shareholder_document_checklist.document_type IS 'Document type from Excel-confirmed checklist or proposed KYC draft checklist.';
COMMENT ON COLUMN shareholder_document_checklist.requirement_status IS 'Assumed workflow values such as required, conditional, optional, waived, or not_required; pending Digaf validation.';
COMMENT ON COLUMN shareholder_document_checklist.checklist_status IS 'Assumed workflow values such as pending, attached, accepted, rejected, waived, or expired; pending Digaf validation.';
COMMENT ON COLUMN shareholder_document_checklist.source_basis IS 'Expected values include excel_template, draft_kyc_form, or digaf_validation. Draft KYC-based items remain pending Digaf validation.';

CREATE INDEX IF NOT EXISTS idx_shareholder_document_checklist_shareholder_id
  ON shareholder_document_checklist(shareholder_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_document_checklist_entity_id
  ON shareholder_document_checklist(entity_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_document_checklist_document_type
  ON shareholder_document_checklist(document_type);

CREATE INDEX IF NOT EXISTS idx_shareholder_document_checklist_status
  ON shareholder_document_checklist(checklist_status);

CREATE INDEX IF NOT EXISTS idx_shareholder_document_checklist_document_ref
  ON shareholder_document_checklist(document_reference_id)
  WHERE document_reference_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS shareholder_payment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_id UUID NOT NULL REFERENCES shareholder(shareholder_id),
  entity_id UUID REFERENCES entity(entity_id),
  payment_profile_type TEXT NOT NULL DEFAULT 'dividend',
  bank_name TEXT,
  branch_name_code TEXT,
  account_name TEXT,
  account_number TEXT,
  account_type TEXT,
  swift_bic_code TEXT,
  iban TEXT,
  mobile_wallet_identifier TEXT,
  dividend_payment_preference TEXT,
  payment_method TEXT,
  total_investment_amount NUMERIC(18, 2),
  payment_verification_status TEXT NOT NULL DEFAULT 'pending',
  payment_verified_by TEXT,
  payment_verified_at TIMESTAMPTZ,
  document_reference_id UUID REFERENCES document_reference(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shareholder_payment_profiles IS 'Payment, banking, and dividend instruction support. Bank/dividend details are from the proposed KYC draft and remain pending Digaf validation; payment method and investment amount align to Excel registration fields.';
COMMENT ON COLUMN shareholder_payment_profiles.payment_profile_type IS 'Assumed values such as dividend, subscription_payment, refund, or other. Pending Digaf validation.';
COMMENT ON COLUMN shareholder_payment_profiles.bank_name IS 'Draft KYC banking field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_payment_profiles.branch_name_code IS 'Draft KYC banking field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_payment_profiles.account_name IS 'Draft KYC banking field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_payment_profiles.account_number IS 'Draft KYC banking field, pending Digaf validation. Treat as sensitive.';
COMMENT ON COLUMN shareholder_payment_profiles.account_type IS 'Draft KYC banking field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_payment_profiles.swift_bic_code IS 'Draft KYC banking field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_payment_profiles.iban IS 'Draft KYC banking field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_payment_profiles.dividend_payment_preference IS 'Draft KYC field, pending Digaf validation.';
COMMENT ON COLUMN shareholder_payment_profiles.payment_method IS 'Excel-confirmed Payment Method field for share purchase/subscription support.';
COMMENT ON COLUMN shareholder_payment_profiles.total_investment_amount IS 'Excel-confirmed Total Investment Amount field for share purchase/subscription support.';
COMMENT ON COLUMN shareholder_payment_profiles.payment_verification_status IS 'Finance/payment verification workflow assumption pending Digaf validation.';

CREATE INDEX IF NOT EXISTS idx_shareholder_payment_profiles_shareholder_id
  ON shareholder_payment_profiles(shareholder_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_payment_profiles_entity_id
  ON shareholder_payment_profiles(entity_id);

CREATE INDEX IF NOT EXISTS idx_shareholder_payment_profiles_verification_status
  ON shareholder_payment_profiles(payment_verification_status);

CREATE INDEX IF NOT EXISTS idx_shareholder_payment_profiles_document_ref
  ON shareholder_payment_profiles(document_reference_id)
  WHERE document_reference_id IS NOT NULL;

