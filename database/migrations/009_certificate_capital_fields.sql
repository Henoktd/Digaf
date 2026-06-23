-- Adds the capital-structure figures shown on the official Digaf share
-- certificate template: Authorized Capital, Subscribed Capital, Paid-up
-- Capital, and the per-share par value ("Each per value of birr"). These
-- are captured per certificate since the capital structure can change
-- between issuances.

ALTER TABLE share_certificate ADD COLUMN IF NOT EXISTS authorized_capital NUMERIC(18,2);
ALTER TABLE share_certificate ADD COLUMN IF NOT EXISTS subscribed_capital NUMERIC(18,2);
ALTER TABLE share_certificate ADD COLUMN IF NOT EXISTS paid_up_capital NUMERIC(18,2);
ALTER TABLE share_certificate ADD COLUMN IF NOT EXISTS par_value NUMERIC(18,2);
