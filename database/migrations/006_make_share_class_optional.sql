-- Run in Supabase SQL Editor AND against local dev DATABASE_URL.
--
-- Digaf does not currently use share classes — all shareholders hold the
-- same class with the same voting rights. This migration removes the NOT NULL
-- constraint so share_class_id can be omitted when creating certificates and
-- recording ownership, without dropping the column or the FK (preserving the
-- ability to add classes later if the business requires it).

ALTER TABLE share_certificate ALTER COLUMN share_class_id DROP NOT NULL;

-- shareholder_ownership is created in migration 002
ALTER TABLE shareholder_ownership ALTER COLUMN share_class_id DROP NOT NULL;
