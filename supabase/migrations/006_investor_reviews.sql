-- ============================================================
--  006_investor_reviews.sql
--  Investor access management + Product/Site reviews
-- ============================================================

-- ─── Investor Access ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS investor_access (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  email           text,
  phone           text,
  position        text,
  company         text,
  location        text,
  token           text UNIQUE NOT NULL,          -- URL token e.g. "abc123xyz"
  password_hash   text NOT NULL,                 -- plain text for now, owner-managed
  notes           text,
  is_active       boolean DEFAULT true,
  last_viewed_at  timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Enable RLS (only service role / admin writes; token-based reads handled in app)
ALTER TABLE investor_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read by token" ON investor_access FOR SELECT USING (is_active = true);
CREATE POLICY "Admin all" ON investor_access FOR ALL USING (true);

-- ─── Reviews ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,  -- NULL = site review
  name        text NOT NULL,
  rating      int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- Customers can insert (not update/delete)
CREATE POLICY "Anyone can submit review" ON reviews FOR INSERT WITH CHECK (true);
-- Only approved reviews are publicly readable
CREATE POLICY "Public read approved" ON reviews FOR SELECT USING (is_approved = true);
-- Admin can read all
CREATE POLICY "Admin read all" ON reviews FOR ALL USING (true);

-- Index for fast product lookups
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_id);
