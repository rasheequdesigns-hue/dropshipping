-- ============================================================
-- peadia.in — Schema Upgrade v5: Social Media + Source Links
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add social media columns to store_settings
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS instagram_url  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_url   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter_url    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube_url    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tiktok_url     TEXT DEFAULT '';

-- 2. Add source_link to products (original Meesho/Flipkart/Amazon link)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS source_link TEXT;

-- Verify:
-- SELECT instagram_url, facebook_url FROM store_settings WHERE id = 1;
-- SELECT source_link FROM products LIMIT 3;
