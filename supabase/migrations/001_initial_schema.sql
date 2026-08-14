-- ============================================================
-- peadia.in  — Supabase PostgreSQL Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  image_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admin can manage categories"
  ON public.categories FOR ALL USING (true);   -- tighten with auth.uid() later

-- ─────────────────────────────────────────────
-- 2. PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  mrp_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock       INTEGER     NOT NULL DEFAULT 0,
  category_id UUID        REFERENCES public.categories(id) ON DELETE SET NULL,
  images      TEXT[]      DEFAULT '{}',
  variants    JSONB       DEFAULT '{}',
  is_featured BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  sku         TEXT,
  tags        TEXT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast category filtering
CREATE INDEX IF NOT EXISTS idx_products_category  ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured  ON public.products(is_featured);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(description,'')));

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products"
  ON public.products FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage products"
  ON public.products FOR ALL USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────
-- 3. ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT        NOT NULL UNIQUE,
  customer_name    TEXT        NOT NULL,
  customer_phone   TEXT        NOT NULL,
  customer_email   TEXT,
  shipping_address JSONB       NOT NULL DEFAULT '{}',
  total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method   TEXT        NOT NULL DEFAULT 'COD',  -- COD | UPI | Online
  status           TEXT        NOT NULL DEFAULT 'Pending',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on phone for customer order history lookup
CREATE INDEX IF NOT EXISTS idx_orders_phone      ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Constraint: valid statuses
ALTER TABLE public.orders
  ADD CONSTRAINT chk_order_status
  CHECK (status IN ('Pending','Processing','Shipped','Out for Delivery','Delivered','Cancelled'));

ALTER TABLE public.orders
  ADD CONSTRAINT chk_payment_method
  CHECK (payment_method IN ('COD','UPI','Online'));

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders"
  ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can read all orders"
  ON public.orders FOR SELECT USING (true);

CREATE POLICY "Admin can update orders"
  ON public.orders FOR UPDATE USING (true);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────
-- 4. ORDER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID        NOT NULL REFERENCES public.orders(id)   ON DELETE CASCADE,
  product_id UUID        NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity   INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  variant    JSONB       DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order items"
  ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can read order items"
  ON public.order_items FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- 5. BANNERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  image_url   TEXT        NOT NULL,
  link_url    TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 1,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active banners"
  ON public.banners FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage banners"
  ON public.banners FOR ALL USING (true);

-- ─────────────────────────────────────────────
-- 6. SEED DATA — Categories
-- ─────────────────────────────────────────────
INSERT INTO public.categories (id, name, slug, image_url) VALUES
  ('11111111-0001-0001-0001-000000000001', 'Electronics', 'electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300'),
  ('11111111-0002-0002-0002-000000000002', 'Fashion',     'fashion',     'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300'),
  ('11111111-0003-0003-0003-000000000003', 'Home',        'home',        'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=300'),
  ('11111111-0004-0004-0004-000000000004', 'Beauty',      'beauty',      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300'),
  ('11111111-0005-0005-0005-000000000005', 'Sports',      'sports',      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300'),
  ('11111111-0006-0006-0006-000000000006', 'Books',       'books',       'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- 7. SEED DATA — Banners
-- ─────────────────────────────────────────────
INSERT INTO public.banners (title, image_url, link_url, sort_order) VALUES
  ('Big Billion Sale — Up to 80% Off',  'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=400&fit=crop', '/category/all',         1),
  ('New Arrivals — Trending Fashion',   'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=400&fit=crop', '/category/fashion',     2),
  ('Electronics Mega Sale',             'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=400&fit=crop', '/category/electronics', 3)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 8. SEED DATA — Products (12 sample products)
-- ─────────────────────────────────────────────
INSERT INTO public.products
  (title, description, mrp_price, sale_price, stock, category_id, images, variants, is_featured, is_active)
VALUES
  (
    'Wireless Bluetooth Headphones with Noise Cancellation',
    'Premium sound quality with ANC, 30-hour battery life, quick charge support. Foldable design perfect for travel and daily commute.',
    2999, 1499, 50,
    '11111111-0001-0001-0001-000000000001',
    ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
    '{"colors":["Black","White","Blue"]}',
    true, true
  ),
  (
    'Smart Watch Fitness Tracker with Heart Rate Monitor',
    'Track steps, calories, sleep and heart rate. IP68 waterproof rating, 7-day battery life, 20+ sport modes.',
    4999, 2499, 35,
    '11111111-0001-0001-0001-000000000001',
    ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    '{"sizes":["S","M","L"]}',
    true, true
  ),
  (
    'Cotton Kurti for Women — Floral Print',
    'Breathable 100% cotton fabric, perfect for daily wear and festive occasions. Machine washable, anti-shrink treatment.',
    1299, 599, 120,
    '11111111-0002-0002-0002-000000000002',
    ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'],
    '{"sizes":["S","M","L","XL","XXL"]}',
    true, true
  ),
  (
    'Men''s Lightweight Running Shoes',
    'Ultra-light mesh upper, cushioned EVA sole, breathable lining. Ideal for jogging, gym, and casual wear.',
    3999, 1999, 60,
    '11111111-0002-0002-0002-000000000002',
    ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
    '{"sizes":["7","8","9","10","11"]}',
    true, true
  ),
  (
    'Stainless Steel Kitchen Appliance Set (4 Pcs)',
    'Includes blender, toaster, electric kettle, and hand mixer. BPA-free materials, 2-year manufacturer warranty.',
    5999, 3499, 25,
    '11111111-0003-0003-0003-000000000003',
    ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'],
    '{}',
    true, true
  ),
  (
    'Luxury Skincare Set — Glow & Hydrate Bundle',
    'Cleanser, vitamin C serum, moisturiser, and SPF 50 sunscreen. Cruelty-free, dermatologically tested, suitable for all skin types.',
    2499, 1299, 80,
    '11111111-0004-0004-0004-000000000004',
    ARRAY['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600'],
    '{}',
    true, true
  ),
  (
    'Wireless RGB Gaming Mouse 12000 DPI',
    'Adjustable DPI up to 12000, 7 programmable buttons, 50-hour battery life, 16.8M color RGB lighting.',
    1999, 999, 90,
    '11111111-0001-0001-0001-000000000001',
    ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'],
    '{"colors":["Black","White"]}',
    false, true
  ),
  (
    '400TC Cotton Bed Sheet Set — King Size',
    'Includes 1 fitted bedsheet and 2 pillow covers. Fade-resistant dye, easy wash & dry, anti-pilling finish.',
    1999, 899, 45,
    '11111111-0003-0003-0003-000000000003',
    ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'],
    '{"colors":["White","Grey","Blue"]}',
    false, true
  ),
  (
    'Yoga Mat Anti-Slip with Carry Bag',
    '6mm thick eco-friendly TPE foam, printed alignment lines, non-slip surface on both sides. Includes shoulder carry strap.',
    1499, 699, 70,
    '11111111-0005-0005-0005-000000000005',
    ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'],
    '{"colors":["Purple","Blue","Black"]}',
    false, true
  ),
  (
    'Bestseller Novel Pack — 5 Books Combo',
    'Curated collection of 5 bestsellers spanning fiction, self-help, thriller, and motivational genres. Perfect gift combo.',
    999, 499, 200,
    '11111111-0006-0006-0006-000000000006',
    ARRAY['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600'],
    '{}',
    false, true
  ),
  (
    'Portable Bluetooth Speaker — 360° Sound',
    '20W total output, IPX5 waterproof rating, 12-hour playtime, TWS stereo pairing with a second speaker.',
    3499, 1799, 40,
    '11111111-0001-0001-0001-000000000001',
    ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'],
    '{"colors":["Black","Red","Teal"]}',
    true, true
  ),
  (
    'Men''s Formal Slim-Fit Shirt',
    'Premium cotton-polyester blend, anti-wrinkle finish, regular collar. Ideal for office, parties, and casual outings.',
    1799, 799, 100,
    '11111111-0002-0002-0002-000000000002',
    ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600'],
    '{"sizes":["S","M","L","XL"],"colors":["White","Blue","Black"]}',
    false, true
  );

-- ─────────────────────────────────────────────
-- Done! Verify with:
--   SELECT count(*) FROM products;
--   SELECT count(*) FROM categories;
--   SELECT count(*) FROM banners;
-- ─────────────────────────────────────────────
