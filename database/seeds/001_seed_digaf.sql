INSERT INTO entity (
  legal_name,
  type,
  status,
  branding_config,
  certificate_template_config,
  workflow_config,
  entra_tenant_id,
  sharepoint_site_url
)
VALUES (
  'Digaf Microcredit Provider SC',
  'microfinance',
  'active',
  '{"primaryColor":"#1f2937","entityCode":"DIGAF"}',
  '{"serialPrefix":"DIGAF-CERT","certificateTitle":"Share Certificate"}',
  '{"certificateApproval":"maker-checker","transferApproval":"maker-checker-checker"}',
  null,
  null
)
ON CONFLICT DO NOTHING;

INSERT INTO sla_config (
  entity_id,
  process_type,
  target_days,
  escalation_day1,
  escalation_day2,
  escalation_recipient_role,
  uptime_target
)
SELECT
  entity_id,
  'certificate_issuance',
  2,
  1,
  2,
  'governance_officer',
  null
FROM entity
WHERE legal_name = 'Digaf Microcredit Provider SC';

INSERT INTO sla_config (
  entity_id,
  process_type,
  target_days,
  escalation_day1,
  escalation_day2,
  escalation_recipient_role,
  uptime_target
)
SELECT
  entity_id,
  'share_transfer',
  5,
  2,
  3,
  'senior_governance_officer',
  null
FROM entity
WHERE legal_name = 'Digaf Microcredit Provider SC';

INSERT INTO share_class (
  entity_id,
  class_name,
  voting_rights,
  votes_per_share,
  voting_class_tier,
  par_value,
  status,
  notes
)
SELECT
  entity_id,
  'Ordinary Shares',
  true,
  1,
  1,
  100.00,
  'active',
  'Initial ordinary share class for Digaf prototype'
FROM entity
WHERE legal_name = 'Digaf Microcredit Provider SC';