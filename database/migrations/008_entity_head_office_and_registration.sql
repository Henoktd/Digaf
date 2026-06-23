-- Adds the company-level fields shown on the official Digaf share
-- certificate template: head office address block and the regulatory
-- registration references quoted in the licensing paragraph. These are
-- fixed per legal entity (not per certificate), so they live on `entity`.
--
-- Seed values below are taken directly from the Digaf certificate
-- template supplied by the Digaf team — confirm before relying on them
-- for production certificates.

ALTER TABLE entity ADD COLUMN IF NOT EXISTS head_office_city TEXT;
ALTER TABLE entity ADD COLUMN IF NOT EXISTS head_office_wereda TEXT;
ALTER TABLE entity ADD COLUMN IF NOT EXISTS head_office_house_no TEXT;
ALTER TABLE entity ADD COLUMN IF NOT EXISTS head_office_po_box TEXT;
ALTER TABLE entity ADD COLUMN IF NOT EXISTS trade_registration_number TEXT;
ALTER TABLE entity ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE entity ADD COLUMN IF NOT EXISTS proclamation_reference TEXT;

UPDATE entity
SET
  head_office_city = COALESCE(head_office_city, 'Addis Ababa'),
  head_office_house_no = COALESCE(head_office_house_no, '157'),
  head_office_po_box = COALESCE(head_office_po_box, '31698'),
  trade_registration_number = COALESCE(trade_registration_number, '10/2/5481/97'),
  license_number = COALESCE(license_number, 'MFI/027/2005'),
  proclamation_reference = COALESCE(proclamation_reference, '40/96')
WHERE legal_name = 'Digaf Microcredit Provider SC';
