-- ============================================================
-- ADMIN PRODUCT MANAGEMENT - Complete Supabase Schema
-- ============================================================

-- 1. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Products Table (comprehensive)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Core Info
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  brand TEXT,
  sku TEXT UNIQUE,
  barcode TEXT,
  
  -- Categorization
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  
  -- Pricing
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  
  -- Inventory
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  track_inventory BOOLEAN DEFAULT true,
  
  -- Media
  image_url TEXT,
  thumbnail_url TEXT,
  
  -- Status & Visibility
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'out_of_stock')),
  is_featured BOOLEAN DEFAULT false,
  
  -- Physical attributes
  weight NUMERIC(8,2),
  weight_unit TEXT DEFAULT 'kg',
  
  -- Location
  location TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'India',
  location_pincode TEXT,
  
  -- Shipping
  is_shipping_available BOOLEAN DEFAULT true,
  shipping_charges NUMERIC(10,2) DEFAULT 0,
  delivery_estimate TEXT,
  return_policy TEXT,
  warranty_info TEXT,
  
  -- Condition
  product_condition TEXT DEFAULT 'new' CHECK (product_condition IN ('new', 'like_new', 'good', 'fair', 'refurbished')),
  
  -- Structured Data
  tags TEXT[],
  key_features TEXT[],
  specifications JSONB DEFAULT '{}',
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  seo_slug TEXT UNIQUE,
  
  -- Variant support
  has_variants BOOLEAN DEFAULT false,
  size_variants TEXT[],
  color_variants TEXT[],
  material_variants TEXT[],
  
  -- Analytics
  view_count INT DEFAULT 0,
  order_count INT DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- 3. Product Images Gallery
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  file_size INT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  variant_value TEXT NOT NULL,
  sku_suffix TEXT,
  price_adjustment NUMERIC(10,2) DEFAULT 0,
  stock_quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Product Audit Log
CREATE TABLE IF NOT EXISTS product_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'published', 'archived', 'duplicated', 'status_changed')),
  changes JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Product Drafts (auto-save)
CREATE TABLE IF NOT EXISTS product_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(admin_id, product_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_title_search ON products USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_audit_product ON product_audit_log(product_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin can do everything with products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Sellers can manage own products"
  ON products FOR ALL
  USING (seller_id = auth.uid());

-- Product Images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT USING (true);

CREATE POLICY "Admin can manage product images"
  ON product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Product Variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product variants"
  ON product_variants FOR SELECT USING (true);

CREATE POLICY "Admin can manage product variants"
  ON product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Product Categories
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON product_categories FOR SELECT USING (true);

CREATE POLICY "Admin can manage categories"
  ON product_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Audit Log
ALTER TABLE product_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view audit log"
  ON product_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert audit log"
  ON product_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Product Drafts
ALTER TABLE product_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage own drafts"
  ON product_drafts FOR ALL
  USING (admin_id = auth.uid());

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Anyone can view product images in storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Auth users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users can update own product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth users can delete own product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_modified
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_categories_modified
  BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_drafts_modified
  BEFORE UPDATE ON product_drafts
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Admin product stats RPC
CREATE OR REPLACE FUNCTION get_admin_product_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_products', (SELECT count(*) FROM products),
    'published', (SELECT count(*) FROM products WHERE status = 'published'),
    'drafts', (SELECT count(*) FROM products WHERE status = 'draft'),
    'out_of_stock', (SELECT count(*) FROM products WHERE stock_quantity <= 0),
    'low_stock', (SELECT count(*) FROM products WHERE stock_quantity > 0 AND stock_quantity <= low_stock_threshold),
    'total_revenue_potential', (SELECT coalesce(sum(price * stock_quantity), 0) FROM products WHERE status = 'published'),
    'categories_count', (SELECT count(DISTINCT category_name) FROM products WHERE category_name IS NOT NULL)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Full-text search for products
CREATE OR REPLACE FUNCTION search_admin_products(
  search_query TEXT DEFAULT '',
  filter_status TEXT DEFAULT '',
  filter_category TEXT DEFAULT '',
  sort_field TEXT DEFAULT 'created_at',
  sort_direction TEXT DEFAULT 'desc',
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 20
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_count INT;
  offset_val INT := (page_num - 1) * page_size;
BEGIN
  SELECT count(*) INTO total_count
  FROM products p
  WHERE
    (search_query = '' OR
     p.title ILIKE '%' || search_query || '%' OR
     p.brand ILIKE '%' || search_query || '%' OR
     p.sku ILIKE '%' || search_query || '%' OR
     p.description ILIKE '%' || search_query || '%')
    AND (filter_status = '' OR p.status = filter_status)
    AND (filter_category = '' OR p.category_name = filter_category);

  SELECT json_build_object(
    'products', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT p.*,
          (SELECT count(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
          (SELECT count(*) FROM product_variants pv WHERE pv.product_id = p.id) as variant_count
        FROM products p
        WHERE
          (search_query = '' OR
           p.title ILIKE '%' || search_query || '%' OR
           p.brand ILIKE '%' || search_query || '%' OR
           p.sku ILIKE '%' || search_query || '%' OR
           p.description ILIKE '%' || search_query || '%')
          AND (filter_status = '' OR p.status = filter_status)
          AND (filter_category = '' OR p.category_name = filter_category)
        ORDER BY
          CASE WHEN sort_field = 'created_at' AND sort_direction = 'desc' THEN p.created_at END DESC,
          CASE WHEN sort_field = 'created_at' AND sort_direction = 'asc' THEN p.created_at END ASC,
          CASE WHEN sort_field = 'price' AND sort_direction = 'desc' THEN p.price END DESC,
          CASE WHEN sort_field = 'price' AND sort_direction = 'asc' THEN p.price END ASC,
          CASE WHEN sort_field = 'title' AND sort_direction = 'asc' THEN p.title END ASC,
          CASE WHEN sort_field = 'title' AND sort_direction = 'desc' THEN p.title END DESC,
          CASE WHEN sort_field = 'stock_quantity' AND sort_direction = 'asc' THEN p.stock_quantity END ASC,
          CASE WHEN sort_field = 'stock_quantity' AND sort_direction = 'desc' THEN p.stock_quantity END DESC
        LIMIT page_size OFFSET offset_val
      ) t
    ), '[]'::json),
    'total_count', total_count,
    'page', page_num,
    'page_size', page_size,
    'total_pages', ceil(total_count::float / page_size)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default categories
INSERT INTO product_categories (name, slug, display_order) VALUES
  ('Electronics', 'electronics', 1),
  ('Fashion', 'fashion', 2),
  ('Home & Living', 'home-living', 3),
  ('Grocery', 'grocery', 4),
  ('Beauty & Health', 'beauty-health', 5),
  ('Sports & Outdoors', 'sports-outdoors', 6),
  ('Books & Stationery', 'books-stationery', 7),
  ('Toys & Games', 'toys-games', 8),
  ('Automotive', 'automotive', 9),
  ('Handmade & Craft', 'handmade-craft', 10)
ON CONFLICT (name) DO NOTHING;

-- GRANT access for anon/authenticated if Data API requires it
GRANT SELECT ON product_categories TO anon, authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_images TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON product_audit_log TO authenticated;
GRANT ALL ON product_drafts TO authenticated;
