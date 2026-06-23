-- Adds the head office sub-city (K.K / Kifle Ketema) field, missing from
-- migration 008, and corrects values against the authoritative bilingual
-- text supplied by the Digaf team. P.O.Box was previously seeded as
-- 31698 (typo) — correct value is 31688. Wereda and sub-city were
-- previously blank.

ALTER TABLE entity ADD COLUMN IF NOT EXISTS head_office_kk TEXT;

UPDATE entity
SET
  head_office_kk = COALESCE(head_office_kk, 'Gulele'),
  head_office_wereda = '09',
  head_office_po_box = '31688'
WHERE legal_name = 'Digaf Microcredit Provider SC';
