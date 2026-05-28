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
    AND legal_name = 'Hana Tesfaye'
),
inserted_certificate AS (
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
    'DIGAF-CERT-2026-000002',
    ts.shareholder_id,
    o.share_class_id,
    1000,
    CURRENT_DATE,
    'issued',
    null,
    null,
    null,
    null,
    null,
    null
  FROM digaf d
  CROSS JOIN ordinary o
  CROSS JOIN target_shareholder ts
  WHERE NOT EXISTS (
    SELECT 1
    FROM share_certificate
    WHERE serial_number = 'DIGAF-CERT-2026-000002'
  )
  RETURNING certificate_id
),
target_certificate AS (
  SELECT certificate_id
  FROM inserted_certificate

  UNION ALL

  SELECT certificate_id
  FROM share_certificate
  WHERE serial_number = 'DIGAF-CERT-2026-000002'
    AND NOT EXISTS (SELECT 1 FROM inserted_certificate)
)
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
  'Active demo certificate issued for MVP review'
FROM target_certificate
WHERE NOT EXISTS (
  SELECT 1
  FROM certificate_event ce
  WHERE ce.certificate_id = target_certificate.certificate_id
    AND ce.event_type = 'issued'
);