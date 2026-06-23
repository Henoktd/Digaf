-- Migration 010 corrected P.O.Box to 31688 based on a transcription that
-- turned out to be wrong. The Digaf team confirmed the correct value is
-- 31698 (the original value from migration 008). Restoring it here.

UPDATE entity
SET head_office_po_box = '31698'
WHERE legal_name = 'Digaf Microcredit Provider SC';
