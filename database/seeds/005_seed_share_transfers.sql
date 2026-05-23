WITH digaf AS (
  SELECT entity_id
  FROM entity
  WHERE legal_name = 'Digaf Microcredit Provider SC'
),
transferor AS (
  SELECT shareholder_id
  FROM shareholder
  WHERE entity_id = (SELECT entity_id FROM digaf)
    AND legal_name = 'Abebe Kebede'
),
transferee AS (
  SELECT shareholder_id
  FROM shareholder
  WHERE entity_id = (SELECT entity_id FROM digaf)
    AND legal_name = 'Hana Tesfaye'
),
inserted_transfer AS (
  INSERT INTO share_transfer (
    entity_id,
    transferor_id,
    transferee_id,
    shares,
    status,
    maker_id,
    board_approval_required,
    encumbrance_check_status,
    kyc_check_status,
    bo_reverification_required,
    supporting_documents
  )
  SELECT
    d.entity_id,
    tr.shareholder_id,
    te.shareholder_id,
    250,
    'pending_checker_1',
    'henok.local_dev',
    false,
    'passed',
    'passed',
    false,
    '[]'::jsonb
  FROM digaf d
  CROSS JOIN transferor tr
  CROSS JOIN transferee te
  WHERE NOT EXISTS (
    SELECT 1
    FROM share_transfer st
    WHERE st.entity_id = d.entity_id
      AND st.transferor_id = tr.shareholder_id
      AND st.transferee_id = te.shareholder_id
      AND st.shares = 250
      AND st.maker_id = 'henok.local_dev'
  )
  RETURNING id, entity_id
),
existing_transfer AS (
  SELECT st.id, st.entity_id
  FROM share_transfer st
  JOIN digaf d ON d.entity_id = st.entity_id
  JOIN transferor tr ON tr.shareholder_id = st.transferor_id
  JOIN transferee te ON te.shareholder_id = st.transferee_id
  WHERE st.shares = 250
    AND st.maker_id = 'henok.local_dev'
  ORDER BY st.created_at ASC
  LIMIT 1
),
target_transfer AS (
  SELECT id, entity_id
  FROM inserted_transfer
  UNION ALL
  SELECT id, entity_id
  FROM existing_transfer
  WHERE NOT EXISTS (
    SELECT 1
    FROM inserted_transfer
  )
),
inserted_approval_request AS (
  INSERT INTO approval_request (
    entity_id,
    request_type,
    reference_id,
    stage,
    current_approver_id,
    status,
    maker_id,
    sla_due_date
  )
  SELECT
    tt.entity_id,
    'share_transfer',
    tt.id,
    'checker_1_review',
    'governance.officer.local_dev',
    'pending',
    'henok.local_dev',
    now() + interval '5 days'
  FROM target_transfer tt
  WHERE NOT EXISTS (
    SELECT 1
    FROM approval_request ar
    WHERE ar.request_type = 'share_transfer'
      AND ar.reference_id = tt.id
  )
  RETURNING id
)
INSERT INTO audit_log (
  entity_id,
  actor_id,
  action,
  table_name,
  record_id,
  old_value_json,
  new_value_json,
  source_ip
)
SELECT
  tt.entity_id,
  'henok.local_dev',
  'share_transfer_created',
  'share_transfer',
  tt.id,
  null,
  jsonb_build_object(
    'status', 'pending_checker_1',
    'shares', 250,
    'maker_id', 'henok.local_dev',
    'approval_request_created', EXISTS (
      SELECT 1
      FROM inserted_approval_request
    )
  ),
  null
FROM target_transfer tt
WHERE NOT EXISTS (
  SELECT 1
  FROM audit_log al
  WHERE al.action = 'share_transfer_created'
    AND al.table_name = 'share_transfer'
    AND al.record_id = tt.id
);
