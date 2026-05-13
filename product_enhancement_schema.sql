-- =====================================================
-- PRODUCT ENHANCEMENT SCHEMA
-- =====================================================
-- Adds detailed fields to products table for conversion-focused product pages

-- 1. EXTEND PRODUCTS TABLE
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS tax_info TEXT DEFAULT 'Inclusive of all taxes',
ADD COLUMN IF NOT EXISTS emi_options TEXT,
ADD COLUMN IF NOT EXISTS key_features TEXT[], -- Array of bullet points
ADD COLUMN IF NOT EXISTS materials TEXT,
ADD COLUMN IF NOT EXISTS dimensions TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS warranty_info TEXT,
ADD COLUMN IF NOT EXISTS delivery_estimate TEXT DEFAULT '3-5 Business Days',
ADD COLUMN IF NOT EXISTS shipping_charges NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS cod_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS return_policy TEXT DEFAULT '7 Days Replacement',
ADD COLUMN IF NOT EXISTS replacement_policy TEXT DEFAULT '7 Days Replacement',
ADD COLUMN IF NOT EXISTS size_variants TEXT[], -- e.g., ['S', 'M', 'L', 'XL']
ADD COLUMN IF NOT EXISTS color_variants TEXT[], -- e.g., ['Red', 'Blue', 'Black']
ADD COLUMN IF NOT EXISTS material_variants TEXT[], -- e.g., ['Cotton', 'Leather']
ADD COLUMN IF NOT EXISTS product_condition TEXT CHECK (product_condition IN ('New', 'Like New', 'Good', 'Fair', 'Used')),
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_state TEXT,
ADD COLUMN IF NOT EXISTS location_country TEXT DEFAULT 'India',
ADD COLUMN IF NOT EXISTS location_pincode TEXT,
ADD COLUMN IF NOT EXISTS is_shipping_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb; -- Array of {question: string, answer: string}

-- 2. ENHANCE PRODUCT REVIEWS (Add breakdown support)
-- We already have a function update_product_rating, but we can add a view for rating breakdown
CREATE OR REPLACE VIEW public.product_rating_stats AS
SELECT 
    product_id,
    COUNT(*) as total_reviews,
    AVG(rating) as average_rating,
    COUNT(*) FILTER (WHERE rating = 5) as five_star,
    COUNT(*) FILTER (WHERE rating = 4) as four_star,
    COUNT(*) FILTER (WHERE rating = 3) as three_star,
    COUNT(*) FILTER (WHERE rating = 2) as two_star,
    COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM public.product_reviews
GROUP BY product_id;

-- 3. ENHANCE SELLER PROFILES (Add more detail for detail page)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS seller_bio TEXT,
ADD COLUMN IF NOT EXISTS seller_rating NUMERIC(3, 2) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS total_seller_reviews INTEGER DEFAULT 0;

-- 4. RELATED PRODUCTS (Basic association table)
CREATE TABLE IF NOT EXISTS public.related_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    related_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    relation_type TEXT DEFAULT 'similar' CHECK (relation_type IN ('similar', 'bought_together', 'recommended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, related_product_id)
);

-- 5. RLS FOR NEW TABLES
ALTER TABLE public.related_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view related products" ON public.related_products FOR SELECT USING (true);
