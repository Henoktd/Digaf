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
  relationship_start_date
)
SELECT
  entity_id,
  'Abebe Kebede',
  'individual',
  'active',
  '{"email":"abebe.kebede@example.com","phone":"+251900000001"}',
  'verified',
  '2027-12-31',
  'low',
  true,
  '2026-01-01'
FROM entity
WHERE legal_name = 'Digaf Microcredit Provider SC';

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
  relationship_start_date
)
SELECT
  entity_id,
  'Hana Tesfaye',
  'individual',
  'active',
  '{"email":"hana.tesfaye@example.com","phone":"+251900000002"}',
  'verified',
  '2027-10-15',
  'medium',
  true,
  '2026-01-01'
FROM entity
WHERE legal_name = 'Digaf Microcredit Provider SC';

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
  relationship_start_date
)
SELECT
  entity_id,
  'SVH Strategic Holdings',
  'institution',
  'active',
  '{"email":"governance@svh.example.com","phone":"+251900000003"}',
  'verified',
  '2027-09-30',
  'low',
  false,
  '2026-01-01'
FROM entity
WHERE legal_name = 'Digaf Microcredit Provider SC';