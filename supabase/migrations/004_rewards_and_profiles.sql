-- ============================================================
-- peadia.in — Schema Upgrade v4: Referral Rewards & Profiles
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. USER PROFILES (phone-number based, no login required)
CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         TEXT        NOT NULL UNIQUE,
  name          TEXT,
  email         TEXT,
  referral_code TEXT        NOT NULL UNIQUE,
  referred_by   TEXT,  -- referral_code of the person who referred them
  reward_balance NUMERIC(10,2) DEFAULT 0.00,
  reward_points  INT          DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_code  ON user_profiles(referral_code);

-- 2. REWARD TRANSACTIONS (audit log)
CREATE TABLE IF NOT EXISTS reward_transactions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         TEXT        NOT NULL,
  type          TEXT        NOT NULL,  -- 'referral_earn', 'purchase_redeem', 'admin_grant'
  amount        NUMERIC(10,2) DEFAULT 0,
  points        INT          DEFAULT 0,
  order_id      UUID        REFERENCES orders(id) ON DELETE SET NULL,
  description   TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_phone ON reward_transactions(phone);

-- 3. Add reward fields to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS referral_reward_type   TEXT    DEFAULT 'none',  -- 'none','cash','percent','points'
  ADD COLUMN IF NOT EXISTS referral_reward_value  NUMERIC(10,2) DEFAULT 0, -- ₹ amount, % value, or points
  ADD COLUMN IF NOT EXISTS reward_expiry_days     INT     DEFAULT 30;       -- days before reward expires

-- 4. RLS
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create profile"        ON user_profiles       FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read own profile"      ON user_profiles       FOR SELECT USING (true);
CREATE POLICY "Anyone can update own profile"    ON user_profiles       FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert reward tx"      ON reward_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read own rewards"      ON reward_transactions FOR SELECT USING (true);
CREATE POLICY "Admin full profiles"              ON user_profiles       FOR ALL    USING (true);
CREATE POLICY "Admin full reward tx"             ON reward_transactions FOR ALL    USING (true);

-- Verify:
-- SELECT * FROM user_profiles LIMIT 5;
-- SELECT * FROM reward_transactions LIMIT 5;
