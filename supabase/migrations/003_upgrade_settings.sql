-- ============================================================
-- peadia.in — Schema Upgrade v3
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add new columns to store_settings
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS admin_password_hash TEXT DEFAULT 'peadia2024',
  ADD COLUMN IF NOT EXISTS logo_url            TEXT,
  ADD COLUMN IF NOT EXISTS logo_name           TEXT,
  ADD COLUMN IF NOT EXISTS upi_id              TEXT DEFAULT 'rasheequ@upi',
  ADD COLUMN IF NOT EXISTS upi_name            TEXT DEFAULT 'peadia.in',
  ADD COLUMN IF NOT EXISTS qr_code_url         TEXT,
  ADD COLUMN IF NOT EXISTS bank_name           TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc           TEXT,
  ADD COLUMN IF NOT EXISTS bank_holder_name    TEXT,
  ADD COLUMN IF NOT EXISTS payment_note        TEXT DEFAULT 'Please include your Order ID in the payment note.';

-- 2. Add payment_method field to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS accepted_payments TEXT[] DEFAULT '{"COD","UPI","ONLINE"}';

-- 3. Update existing row with defaults
UPDATE store_settings SET
  admin_password_hash = 'peadia2024',
  upi_id              = 'rasheequ@upi',
  upi_name            = 'peadia.in',
  payment_note        = 'Please include your Order ID in the payment note.'
WHERE id = 1;

-- Verify:
-- SELECT admin_password_hash, upi_id, logo_url FROM store_settings;
