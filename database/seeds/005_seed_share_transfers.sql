BEGIN;

DO $$
DECLARE
  v_entity_id UUID;
  v_transferor_id UUID;
  v_transferee_id UUID;
  v_transfer_id UUID;
  v_approval_request_id UUID;
BEGIN
  SELECT entity_id
  INTO v_entity_id
  FROM entity
  WHERE legal_name = 'Digaf Microcredit Provider SC';

  IF v_entity_id IS NULL THEN
    RAISE EXCEPTION 'Required entity not found: Digaf Microcredit Provider SC';
  END IF;

  SELECT shareholder_id
  INTO v_transferor_id
  FROM shareholder
  WHERE entity_id = v_entity_id
    AND legal_name = 'Abebe Kebede';

  IF v_transferor_id IS NULL THEN
    RAISE EXCEPTION 'Required transferor not found: Abebe Kebede';
  END IF;

  SELECT shareholder_id
  INTO v_transferee_id
  FROM shareholder
  WHERE entity_id = v_entity_id
    AND legal_name = 'Hana Tesfaye';

  IF v_transferee_id IS NULL THEN
    RAISE EXCEPTION 'Required transferee not found: Hana Tesfaye';
  END IF;

  SELECT id
  INTO v_transfer_id
  FROM share_transfer
  WHERE entity_id = v_entity_id
    AND transferor_id = v_transferor_id
    AND transferee_id = v_transferee_id
    AND shares = 250
    AND maker_id = 'henok.local_dev'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_transfer_id IS NULL THEN
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
    VALUES (
      v_entity_id,
      v_transferor_id,
      v_transferee_id,
      250,
      'pending_checker_1',
      'henok.local_dev',
      false,
      'passed',
      'passed',
      false,
      '[]'::jsonb
    )
    RETURNING id INTO v_transfer_id;
  ELSE
    UPDATE share_transfer
    SET
      status = 'pending_checker_1',
      board_approval_required = false,
      encumbrance_check_status = 'passed',
      kyc_check_status = 'passed',
      bo_reverification_required = false,
      supporting_documents = COALESCE(supporting_documents, '[]'::jsonb)
    WHERE id = v_transfer_id;
  END IF;

  SELECT id
  INTO v_approval_request_id
  FROM approval_request
  WHERE request_type = 'share_transfer'
    AND reference_id = v_transfer_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_approval_request_id IS NULL THEN
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
    VALUES (
      v_entity_id,
      'share_transfer',
      v_transfer_id,
      'checker_1_review',
      'governance.officer.local_dev',
      'pending',
      'henok.local_dev',
      now() + interval '5 days'
    )
    RETURNING id INTO v_approval_request_id;
  ELSE
    UPDATE approval_request
    SET
      stage = 'checker_1_review',
      current_approver_id = 'governance.officer.local_dev',
      status = 'pending',
      maker_id = 'henok.local_dev',
      sla_due_date = now() + interval '5 days'
    WHERE id = v_approval_request_id;
  END IF;

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
    v_entity_id,
    'henok.local_dev',
    'share_transfer_created',
    'share_transfer',
    v_transfer_id,
    null,
    jsonb_build_object(
      'transferor', 'Abebe Kebede',
      'transferee', 'Hana Tesfaye',
      'shares', 250,
      'status', 'pending_checker_1',
      'maker_id', 'henok.local_dev',
      'approval_request_id', v_approval_request_id
    ),
    null
  WHERE NOT EXISTS (
    SELECT 1
    FROM audit_log
    WHERE action = 'share_transfer_created'
      AND table_name = 'share_transfer'
      AND record_id = v_transfer_id
  );
END $$;

COMMIT;
