BEGIN;

DO $$
DECLARE
  v_entity_id UUID;
  v_abebe_id UUID;
  v_hana_id UUID;
  v_certificate_id UUID;
  v_certificate_serial TEXT;
  v_transfer_id UUID;
  v_legal_hold_id UUID;
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

  SELECT certificate_id, serial_number
  INTO v_certificate_id, v_certificate_serial
  FROM share_certificate
  WHERE entity_id = v_entity_id
  ORDER BY created_at ASC
  LIMIT 1;

  SELECT id
  INTO v_transfer_id
  FROM share_transfer
  WHERE entity_id = v_entity_id
  ORDER BY created_at ASC
  LIMIT 1;

  SELECT id
  INTO v_legal_hold_id
  FROM legal_hold
  WHERE entity_id = v_entity_id
    AND related_record_type = 'shareholder'
    AND related_record_id = v_abebe_id
    AND status = 'active'
  ORDER BY imposed_at DESC
  LIMIT 1;

  INSERT INTO document_reference (
    entity_id,
    file_url,
    library,
    document_type,
    metadata_json,
    retention_category,
    related_entity,
    related_id
  )
  SELECT
    v_entity_id,
    'https://sharepoint.example.com/sites/digaf-governance/certificates/DIGAF-CERT-001.pdf',
    'Certificates',
    'certificate_pdf',
    jsonb_build_object(
      'title', 'Issued share certificate PDF',
      'serial_number', COALESCE(v_certificate_serial, 'DIGAF-CERT-001'),
      'repository', 'SharePoint placeholder'
    ),
    'share_certificate_records',
    'share_certificate',
    v_certificate_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM document_reference
    WHERE entity_id = v_entity_id
      AND file_url = 'https://sharepoint.example.com/sites/digaf-governance/certificates/DIGAF-CERT-001.pdf'
  );

  INSERT INTO document_reference (
    entity_id,
    file_url,
    library,
    document_type,
    metadata_json,
    retention_category,
    related_entity,
    related_id
  )
  SELECT
    v_entity_id,
    'https://sharepoint.example.com/sites/digaf-governance/board-resolutions/BR-2026-001.pdf',
    'Board Resolutions',
    'board_resolution',
    jsonb_build_object(
      'resolution_number', 'BR-2026-001',
      'approved_action', 'Share transfer governance approval',
      'repository', 'SharePoint placeholder'
    ),
    'board_governance_records',
    'board_resolution',
    null
  WHERE NOT EXISTS (
    SELECT 1
    FROM document_reference
    WHERE entity_id = v_entity_id
      AND file_url = 'https://sharepoint.example.com/sites/digaf-governance/board-resolutions/BR-2026-001.pdf'
  );

  INSERT INTO document_reference (
    entity_id,
    file_url,
    library,
    document_type,
    metadata_json,
    retention_category,
    related_entity,
    related_id
  )
  SELECT
    v_entity_id,
    'https://sharepoint.example.com/sites/digaf-governance/kyc/abebe-kebede-kyc.pdf',
    'Compliance KYC',
    'kyc_document',
    jsonb_build_object(
      'shareholder_name', 'Abebe Kebede',
      'review_status', 'passed',
      'repository', 'SharePoint placeholder'
    ),
    'kyc_records',
    'shareholder',
    v_abebe_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM document_reference
    WHERE entity_id = v_entity_id
      AND file_url = 'https://sharepoint.example.com/sites/digaf-governance/kyc/abebe-kebede-kyc.pdf'
  );

  INSERT INTO document_reference (
    entity_id,
    file_url,
    library,
    document_type,
    metadata_json,
    retention_category,
    legal_hold_id,
    related_entity,
    related_id
  )
  SELECT
    v_entity_id,
    'https://sharepoint.example.com/sites/digaf-governance/legal-holds/INTERNAL-REVIEW-001-notice.pdf',
    'Legal Holds',
    'legal_hold_notice',
    jsonb_build_object(
      'authority_reference', 'INTERNAL-REVIEW-001',
      'shareholder_name', 'Abebe Kebede',
      'repository', 'SharePoint placeholder'
    ),
    'legal_hold_records',
    v_legal_hold_id,
    'legal_hold',
    v_legal_hold_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM document_reference
    WHERE entity_id = v_entity_id
      AND file_url = 'https://sharepoint.example.com/sites/digaf-governance/legal-holds/INTERNAL-REVIEW-001-notice.pdf'
  );

  UPDATE document_reference
  SET
    legal_hold_id = COALESCE(v_legal_hold_id, legal_hold_id),
    related_id = COALESCE(v_legal_hold_id, related_id)
  WHERE entity_id = v_entity_id
    AND file_url = 'https://sharepoint.example.com/sites/digaf-governance/legal-holds/INTERNAL-REVIEW-001-notice.pdf';

  INSERT INTO document_reference (
    entity_id,
    file_url,
    library,
    document_type,
    metadata_json,
    retention_category,
    related_entity,
    related_id
  )
  SELECT
    v_entity_id,
    'https://sharepoint.example.com/sites/digaf-governance/transfers/ST-2026-001-supporting-documents.pdf',
    'Share Transfers',
    'transfer_supporting_document',
    jsonb_build_object(
      'transfer_reference', 'ST-2026-001',
      'transferor', 'Abebe Kebede',
      'transferee', 'Hana Tesfaye',
      'repository', 'SharePoint placeholder'
    ),
    'share_transfer_records',
    'share_transfer',
    v_transfer_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM document_reference
    WHERE entity_id = v_entity_id
      AND file_url = 'https://sharepoint.example.com/sites/digaf-governance/transfers/ST-2026-001-supporting-documents.pdf'
  );
END $$;

COMMIT;
