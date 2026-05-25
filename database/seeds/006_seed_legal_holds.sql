BEGIN;

DO $$
DECLARE
  v_entity_id UUID;
  v_shareholder_id UUID;
  v_legal_hold_id UUID;
  v_transfer_freeze_id UUID;
BEGIN
  SELECT entity_id
  INTO v_entity_id
  FROM entity
  WHERE legal_name = 'Digaf Microcredit Provider SC';

  IF v_entity_id IS NULL THEN
    RAISE EXCEPTION 'Required entity not found: Digaf Microcredit Provider SC';
  END IF;

  SELECT shareholder_id
  INTO v_shareholder_id
  FROM shareholder
  WHERE entity_id = v_entity_id
    AND legal_name = 'Abebe Kebede';

  IF v_shareholder_id IS NULL THEN
    RAISE EXCEPTION 'Required shareholder not found: Abebe Kebede';
  END IF;

  SELECT id
  INTO v_legal_hold_id
  FROM legal_hold
  WHERE entity_id = v_entity_id
    AND hold_type = 'regulatory_review'
    AND related_record_type = 'shareholder'
    AND related_record_id = v_shareholder_id
    AND authority_reference = 'INTERNAL-REVIEW-001'
  ORDER BY imposed_at ASC
  LIMIT 1;

  IF v_legal_hold_id IS NULL THEN
    INSERT INTO legal_hold (
      entity_id,
      hold_type,
      related_record_type,
      related_record_id,
      imposed_by,
      reason,
      status,
      authority_reference
    )
    VALUES (
      v_entity_id,
      'regulatory_review',
      'shareholder',
      v_shareholder_id,
      'compliance.local_dev',
      'Prototype legal hold for regulatory review',
      'active',
      'INTERNAL-REVIEW-001'
    )
    RETURNING id INTO v_legal_hold_id;
  ELSE
    UPDATE legal_hold
    SET
      imposed_by = 'compliance.local_dev',
      reason = 'Prototype legal hold for regulatory review',
      status = 'active',
      lifted_by = null,
      lifted_at = null
    WHERE id = v_legal_hold_id;
  END IF;

  SELECT id
  INTO v_transfer_freeze_id
  FROM transfer_freeze
  WHERE entity_id = v_entity_id
    AND shareholder_id = v_shareholder_id
    AND freeze_type = 'legal_hold'
    AND reason = 'Transfer freeze linked to prototype legal hold'
  ORDER BY imposed_at ASC
  LIMIT 1;

  IF v_transfer_freeze_id IS NULL THEN
    INSERT INTO transfer_freeze (
      entity_id,
      shareholder_id,
      freeze_type,
      imposed_by,
      reason,
      status
    )
    VALUES (
      v_entity_id,
      v_shareholder_id,
      'legal_hold',
      'compliance.local_dev',
      'Transfer freeze linked to prototype legal hold',
      'active'
    )
    RETURNING id INTO v_transfer_freeze_id;
  ELSE
    UPDATE transfer_freeze
    SET
      imposed_by = 'compliance.local_dev',
      status = 'active',
      lifted_by = null,
      lifted_at = null
    WHERE id = v_transfer_freeze_id;
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
    'compliance.local_dev',
    'legal_hold_imposed',
    'legal_hold',
    v_legal_hold_id,
    null,
    jsonb_build_object(
      'hold_type', 'regulatory_review',
      'related_record_type', 'shareholder',
      'related_record_id', v_shareholder_id,
      'related_shareholder_name', 'Abebe Kebede',
      'status', 'active',
      'authority_reference', 'INTERNAL-REVIEW-001',
      'transfer_freeze_id', v_transfer_freeze_id
    ),
    null
  WHERE NOT EXISTS (
    SELECT 1
    FROM audit_log
    WHERE action = 'legal_hold_imposed'
      AND table_name = 'legal_hold'
      AND record_id = v_legal_hold_id
  );
END $$;

COMMIT;
