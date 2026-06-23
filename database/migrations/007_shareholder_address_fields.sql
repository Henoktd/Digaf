-- Adds the structured Ethiopian address fields needed for the official
-- bilingual (Amharic/English) Digaf share certificate template, which
-- requires Address City, Wereda K.K, Kebele and House No. as separate
-- fields for the shareholder. Tel.No. reuses the existing mobile_number
-- column rather than duplicating it.

ALTER TABLE shareholder ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE shareholder ADD COLUMN IF NOT EXISTS wereda_kk TEXT;
ALTER TABLE shareholder ADD COLUMN IF NOT EXISTS kebele TEXT;
ALTER TABLE shareholder ADD COLUMN IF NOT EXISTS house_no TEXT;
