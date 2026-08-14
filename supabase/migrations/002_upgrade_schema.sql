-- ============================================================
-- peadia.in — Schema Upgrade v2
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS contact_messages (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name  TEXT   NOT NULL,
  customer_phone TEXT   NOT NULL,
  email          TEXT,
  subject        TEXT,
  message        TEXT   NOT NULL,
  is_read        BOOLEAN DEFAULT false,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. STORE SETTINGS & PROMO ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
  id                      INT  PRIMARY KEY DEFAULT 1,
  store_name              TEXT DEFAULT 'peadia.in',
  contact_phone           TEXT DEFAULT '+91 9526569313',
  contact_email           TEXT DEFAULT 'rasheequ.designs@gmail.com',
  address                 TEXT DEFAULT 'Malappuram, Kerala, India',
  whatsapp_number         TEXT DEFAULT '919526569313',
  announcement_text       TEXT DEFAULT 'Special Offer: Get Free Delivery on all orders above ₹499 · Use code PEADIA10 for 10% off',
  free_delivery_min_amount NUMERIC(10,2) DEFAULT 499.00,
  promo_code              TEXT DEFAULT 'PEADIA10',
  promo_discount_percent  INT  DEFAULT 10,
  is_announcement_active  BOOLEAN DEFAULT true,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO store_settings (
  id, store_name, contact_phone, contact_email, address, whatsapp_number,
  announcement_text, free_delivery_min_amount, promo_code, promo_discount_percent, is_announcement_active
) VALUES (
  1, 'peadia.in', '+91 9526569313', 'rasheequ.designs@gmail.com', 'Malappuram, Kerala, India', '919526569313',
  'Special Offer: Get Free Delivery on all orders above ₹499 · Use code PEADIA10 for 10% off',
  499.00, 'PEADIA10', 10, true
) ON CONFLICT (id) DO NOTHING;

-- 3. EXTEND PRODUCTS TABLE
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand_name              TEXT,
  ADD COLUMN IF NOT EXISTS sku                     TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery_days INT          DEFAULT 3,
  ADD COLUMN IF NOT EXISTS delivery_charge         NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS is_returnable           BOOLEAN      DEFAULT true;

-- Unique SKU only where set
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku
  ON products (sku) WHERE sku IS NOT NULL;

-- 4. RLS POLICIES
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert messages"    ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read settings"      ON store_settings   FOR SELECT USING (true);
CREATE POLICY "Allow admin full messages"       ON contact_messages FOR ALL    USING (true);
CREATE POLICY "Allow admin full settings"       ON store_settings   FOR ALL    USING (true);

-- Verify:
-- SELECT * FROM store_settings;
-- SELECT count(*) FROM contact_messages;
