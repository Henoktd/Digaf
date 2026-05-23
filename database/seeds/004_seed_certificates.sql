WITH digaf AS (
  SELECT entity_id
  FROM entity
  WHERE legal_name = 'Digaf Microcredit Provider SC'
),
ordinary AS (
  SELECT share_class_id
  FROM share_class
  WHERE entity_id = (SELECT entity_id FROM digaf)
    AND class_name = 'Ordinary Shares'
),
target_shareholder AS (
  SELECT shareholder_id
  FROM shareholder
  WHERE entity_id = (SELECT entity_id FROM digaf)
    AND legal_name = 'SVH Strategic Holdings'
)
INSERT INTO share_certificate (
  entity_id,
  serial_number,
  shareholder_id,
  share_class_id,
  quantity,
  issue_date,
  status,
  qr_token,
  certificate_hash,
  hash_algorithm,
  hash_generated_at,
  signature_token,
  revocation_status
)
SELECT
  d.entity_id,
  'DIGAF-CERT-2026-000001',
  ts.shareholder_id,
  o.share_class_id,
  6000,
  CURRENT_DATE,
  'issued',
  'qr_demo_token_000001',
  'demo_sha256_hash_pending_real_generation',
  'SHA-256',
  now(),
  'demo_hmac_signature_token_000001',
  null
FROM digaf d
CROSS JOIN ordinary o
CROSS JOIN target_shareholder ts
WHERE NOT EXISTS (
  SELECT 1
  FROM share_certificate
  WHERE serial_number = 'DIGAF-CERT-2026-000001'
);

INSERT INTO certificate_event (
  certificate_id,
  event_type,
  actor_id,
  notes
)
SELECT
  certificate_id,
  'issued',
  'system.seed',
  'Initial demo certificate issued for prototype'
FROM share_certificate
WHERE serial_number = 'DIGAF-CERT-2026-000001'
  AND NOT EXISTS (
    SELECT 1
    FROM certificate_event ce
    WHERE ce.certificate_id = share_certificate.certificate_id
      AND ce.event_type = 'issued'
  );