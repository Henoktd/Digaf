-- Migration 006: Add price_per_share and stamp duty to share_transfer
-- Run on Neon via SQL Editor

ALTER TABLE share_transfer
  ADD COLUMN IF NOT EXISTS price_per_share    NUMERIC(18,6),
  ADD COLUMN IF NOT EXISTS transfer_value     NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS stamp_duty_amount  NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS stamp_duty_rate    NUMERIC(6,5) DEFAULT 0.005;
