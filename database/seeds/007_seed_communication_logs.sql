BEGIN;

DO $$
DECLARE
  v_entity_id UUID;
  v_abebe_id UUID;
  v_hana_id UUID;
BEGIN
  SELECT entity_id
  INTO v_entity_id
  FROM entity
  WHERE legal_name = 'Digaf Microcredit Provider SC';

  IF v_entity_id IS NULL THEN
    RAISE EXCEPTION 'Required entity not found: Digaf Microcredit Provider SC';
  END IF;

  SELECT shareholder_id
  INTO v_abebe_id
  FROM shareholder
  WHERE entity_id = v_entity_id
    AND legal_name = 'Abebe Kebede';

  SELECT shareholder_id
  INTO v_hana_id
  FROM shareholder
  WHERE entity_id = v_entity_id
    AND legal_name = 'Hana Tesfaye';

  IF v_abebe_id IS NULL THEN
    RAISE EXCEPTION 'Required shareholder not found: Abebe Kebede';
  END IF;

  IF v_hana_id IS NULL THEN
    RAISE EXCEPTION 'Required shareholder not found: Hana Tesfaye';
  END IF;

  INSERT INTO communication_log (
    entity_id,
    type,
    recipient_id,
    channel,
    subject,
    delivery_status,
    sent_at,
    related_event_id
  )
  SELECT
    v_entity_id,
    'certificate_issued_notification',
    v_abebe_id,
    'email',
    'Certificate issued notification - Abebe Kebede',
    'sent',
    now(),
    null
  WHERE NOT EXISTS (
    SELECT 1
    FROM communication_log
    WHERE entity_id = v_entity_id
      AND type = 'certificate_issued_notification'
      AND recipient_id = v_abebe_id
      AND subject = 'Certificate issued notification - Abebe Kebede'
  );

  INSERT INTO communication_log (
    entity_id,
    type,
    recipient_id,
    channel,
    subject,
    delivery_status,
    sent_at,
    related_event_id
  )
  SELECT
    v_entity_id,
    'share_transfer_submitted_notification',
    v_hana_id,
    'email',
    'Share transfer submitted notification - Hana Tesfaye',
    'sent',
    now(),
    null
  WHERE NOT EXISTS (
    SELECT 1
    FROM communication_log
    WHERE entity_id = v_entity_id
      AND type = 'share_transfer_submitted_notification'
      AND recipient_id = v_hana_id
      AND subject = 'Share transfer submitted notification - Hana Tesfaye'
  );

  INSERT INTO communication_log (
    entity_id,
    type,
    recipient_id,
    channel,
    subject,
    delivery_status,
    sent_at,
    related_event_id
  )
  SELECT
    v_entity_id,
    'legal_hold_notice',
    v_abebe_id,
    'email',
    'Legal hold notice - INTERNAL-REVIEW-001',
    'sent',
    now(),
    null
  WHERE NOT EXISTS (
    SELECT 1
    FROM communication_log
    WHERE entity_id = v_entity_id
      AND type = 'legal_hold_notice'
      AND recipient_id = v_abebe_id
      AND subject = 'Legal hold notice - INTERNAL-REVIEW-001'
  );
END $$;

COMMIT;
