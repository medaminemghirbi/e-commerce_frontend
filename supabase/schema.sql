-- ============================================================
-- e-commerce — Full Reset with RLS
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. DROP everything ───────────────────────────────────────
DROP TABLE IF EXISTS public.product_subcategories CASCADE;
DROP TABLE IF EXISTS public.subcategories         CASCADE;
DROP TABLE IF EXISTS public.notifications          CASCADE;
DROP TABLE IF EXISTS public.contact_requests       CASCADE;
DROP TABLE IF EXISTS public.orders                 CASCADE;
DROP TABLE IF EXISTS public.slider_images          CASCADE;
DROP TABLE IF EXISTS public.products               CASCADE;
DROP TABLE IF EXISTS public.categories             CASCADE;
DROP TABLE IF EXISTS public.settings               CASCADE;
DROP TABLE IF EXISTS public.users                  CASCADE;
DROP FUNCTION IF EXISTS public.is_admin()          CASCADE;
DROP FUNCTION IF EXISTS public.recalculate_prices  CASCADE;

-- ── 2. TABLES (users first — is_admin depends on it) ─────────

CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  first_name  TEXT DEFAULT '',
  last_name   TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  role        TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr     TEXT NOT NULL,
  name_ar     TEXT DEFAULT '',
  name_en     TEXT DEFAULT '',
  description TEXT DEFAULT '',
  icon        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name_fr     TEXT NOT NULL,
  name_ar     TEXT DEFAULT '',
  name_en     TEXT DEFAULT '',
  description TEXT DEFAULT '',
  icon        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr             TEXT NOT NULL,
  name_ar             TEXT DEFAULT '',
  name_en             TEXT DEFAULT '',
  description_fr      TEXT DEFAULT '',
  description_ar      TEXT DEFAULT '',
  description_en      TEXT DEFAULT '',
  category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  purchase_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity      INTEGER DEFAULT 0,
  images              TEXT[] DEFAULT '{}',
  manufacture_date    DATE,
  expiration_date     DATE,
  has_promotion       BOOLEAN DEFAULT FALSE,
  promotion_discount  INTEGER DEFAULT 0,
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_subcategories (
  product_id     UUID REFERENCES public.products(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, subcategory_id)
);

CREATE TABLE public.slider_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT DEFAULT '',
  subtitle    TEXT DEFAULT '',
  image_url   TEXT NOT NULL,
  link_url    TEXT DEFAULT '',
  link_label  TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.contact_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  message     TEXT NOT NULL,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  status      TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,
  title       TEXT DEFAULT '',
  message     TEXT NOT NULL,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email        TEXT NOT NULL,
  items             JSONB NOT NULL DEFAULT '[]',
  subtotal          DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee      DECIMAL(10,2) NOT NULL DEFAULT 8,
  total             DECIMAL(10,2) NOT NULL DEFAULT 0,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  payment_method    TEXT DEFAULT 'cod',
  delivery_address  JSONB NOT NULL DEFAULT '{}',
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Functions ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.recalculate_prices(margin_pct NUMERIC, promo_pct NUMERIC)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.products
  SET selling_price = ROUND(purchase_price * (1 + margin_pct / 100.0), 2),
      promotion_discount = promo_pct::INTEGER,
      updated_at = NOW();
$$;

-- ── 4. Seed default settings ─────────────────────────────────
INSERT INTO public.settings (key, value)
VALUES ('pricing', '{"margin": 20, "promotion": 20}')
ON CONFLICT (key) DO NOTHING;

-- ── 5. Enable RLS ────────────────────────────────────────────
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slider_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;

-- ── 6. RLS Policies ──────────────────────────────────────────

-- USERS
CREATE POLICY "users_select" ON public.users FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id OR is_admin());

-- SETTINGS (admin only)
CREATE POLICY "settings_select" ON public.settings FOR SELECT USING (is_admin());
CREATE POLICY "settings_admin"  ON public.settings FOR ALL   USING (is_admin());

-- CATEGORIES (public read, admin write)
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin"  ON public.categories FOR ALL   USING (is_admin());

-- SUBCATEGORIES (public read, admin write)
CREATE POLICY "subcategories_select" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "subcategories_admin"  ON public.subcategories FOR ALL   USING (is_admin());

-- PRODUCTS (public read, admin write)
CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_admin"  ON public.products FOR ALL   USING (is_admin());

-- PRODUCT_SUBCATEGORIES (public read, admin write)
CREATE POLICY "prodsub_select" ON public.product_subcategories FOR SELECT USING (true);
CREATE POLICY "prodsub_admin"  ON public.product_subcategories FOR ALL   USING (is_admin());

-- SLIDER IMAGES (public read, admin write)
CREATE POLICY "slider_select" ON public.slider_images FOR SELECT USING (true);
CREATE POLICY "slider_admin"  ON public.slider_images FOR ALL   USING (is_admin());

-- CONTACT REQUESTS (anyone can submit, admin manages)
CREATE POLICY "contact_insert" ON public.contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_admin"  ON public.contact_requests FOR ALL   USING (is_admin());

-- NOTIFICATIONS (admin only)
CREATE POLICY "notif_admin" ON public.notifications FOR ALL USING (is_admin());

-- ORDERS (open insert for guests + logged-in, read own or admin)
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (
  (user_id IS NOT NULL AND user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "orders_admin"  ON public.orders FOR ALL USING (is_admin());

-- ── 7. GRANTS ────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- anon: read public data + insert orders/contact
GRANT SELECT ON public.categories            TO anon;
GRANT SELECT ON public.subcategories         TO anon;
GRANT SELECT ON public.products              TO anon;
GRANT SELECT ON public.product_subcategories TO anon;
GRANT SELECT ON public.slider_images         TO anon;
GRANT INSERT ON public.contact_requests      TO anon;
GRANT INSERT ON public.orders                TO anon;

-- authenticated: full access (RLS still applies per-row)
GRANT ALL ON public.users                TO authenticated;
GRANT ALL ON public.settings             TO authenticated;
GRANT ALL ON public.categories           TO authenticated;
GRANT ALL ON public.subcategories        TO authenticated;
GRANT ALL ON public.products             TO authenticated;
GRANT ALL ON public.product_subcategories TO authenticated;
GRANT ALL ON public.slider_images        TO authenticated;
GRANT ALL ON public.contact_requests     TO authenticated;
GRANT ALL ON public.notifications        TO authenticated;
GRANT ALL ON public.orders               TO authenticated;

-- ── 8. Reload PostgREST schema cache ─────────────────────────
NOTIFY pgrst, 'reload schema';
