-- Seed default SLA configuration for every entity.
-- The sla_config table was created in 002 but never populated, so the
-- SLA Configuration page always showed empty. Idempotent: skips process
-- types that already have a row for the entity.

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
  e.entity_id,
  p.process_type,
  p.target_days,
  p.escalation_day1,
  p.escalation_day2,
  p.escalation_recipient_role,
  99.50
FROM entity e
CROSS JOIN (
  VALUES
    ('share_transfer',           5,  3,  5,  'governance_admin'),
    ('certificate_issuance',     3,  2,  3,  'governance_admin'),
    ('kyc_review',               7,  5,  7,  'compliance_officer'),
    ('dividend_distribution',   10,  7, 10,  'governance_admin'),
    ('shareholder_registration', 2,  1,  2,  'governance_admin')
) AS p(process_type, target_days, escalation_day1, escalation_day2, escalation_recipient_role)
WHERE NOT EXISTS (
  SELECT 1
  FROM sla_config sc
  WHERE sc.entity_id = e.entity_id
    AND sc.process_type = p.process_type
);
