-- ==========================================
-- Seller Products & Inventory Schema
-- ==========================================

-- 1. Product Categories
CREATE TABLE public.product_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Categories
INSERT INTO public.product_categories (name, slug) VALUES 
('Electronics', 'electronics'),
('Fashion', 'fashion'),
('Home & Garden', 'home-garden'),
('Handmade Crafts', 'handmade-crafts'),
('Groceries', 'groceries');

-- 2. Seller Products
CREATE TABLE public.seller_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100), -- Denormalized for quick frontend access
    status VARCHAR(50) DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'active', 'rejected', 'archived')),
    location VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(seller_id, title) -- Prevent duplicate products with same title for a single seller
);

-- 3. Product Inventory
CREATE TABLE public.product_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.seller_products(id) ON DELETE CASCADE UNIQUE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    is_in_stock BOOLEAN GENERATED ALWAYS AS (stock_quantity > 0) STORED,
    last_restocked_at TIMESTAMP WITH TIME ZONE
);

-- 4. Seller Uploads (Image Metadata)
CREATE TABLE public.seller_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.seller_products(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_seller_products_seller_id ON public.seller_products(seller_id);
CREATE INDEX idx_seller_products_status ON public.seller_products(status);
CREATE INDEX idx_product_inventory_stock ON public.product_inventory(is_in_stock);

-- RLS Policies
ALTER TABLE public.seller_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read active products, Sellers can CRUD their own
CREATE POLICY "Anyone can view active products" ON public.seller_products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can view own products" ON public.seller_products
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own products" ON public.seller_products
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products" ON public.seller_products
    FOR UPDATE USING (auth.uid() = seller_id);

-- Uploads: Everyone can read, Sellers can insert for their products
CREATE POLICY "Anyone can view product uploads" ON public.seller_uploads
    FOR SELECT USING (true);

CREATE POLICY "Sellers can insert uploads" ON public.seller_uploads
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Inventory: Everyone can read, Sellers can update their own
CREATE POLICY "Anyone can view inventory" ON public.product_inventory
    FOR SELECT USING (true);

CREATE POLICY "Sellers can manage inventory" ON public.product_inventory
    FOR ALL USING (product_id IN (SELECT id FROM public.seller_products WHERE seller_id = auth.uid()));

-- Storage Bucket Config (Run manually or via Supabase UI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
-- CREATE POLICY "Auth Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
