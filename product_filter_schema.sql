-- ==========================================
-- Product Filtering Optimization Schema
-- ==========================================

-- 1. Add missing columns for advanced filtering if they don't exist
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.seller_products ADD COLUMN brand VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    BEGIN
        ALTER TABLE public.seller_products ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0.0;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE public.seller_products ADD COLUMN reviews_count INT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE public.seller_products ADD COLUMN views_count INT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        -- e.g. 'same_day', '1_2_days', '3_5_days'
        ALTER TABLE public.seller_products ADD COLUMN delivery_time VARCHAR(20) DEFAULT '3_5_days'; 
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- 2. Create Optimized View joining inventory and products for faster filtering
CREATE OR REPLACE VIEW public.vw_optimized_products AS
SELECT 
    p.id,
    p.seller_id,
    p.title,
    p.description,
    p.price,
    p.original_price,
    p.category_id,
    p.category_name,
    p.brand,
    p.rating,
    p.reviews_count,
    p.views_count,
    p.delivery_time,
    p.status,
    p.created_at,
    i.stock_quantity,
    i.is_in_stock,
    -- Full Text Search Vector
    setweight(to_tsvector('english', coalesce(p.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(p.category_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(p.brand, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(p.description, '')), 'D') as search_vector
FROM public.seller_products p
LEFT JOIN public.product_inventory i ON p.id = i.product_id
WHERE p.status = 'active';

-- 3. Create Indexes on underlying tables to optimize view performance
-- Price index
CREATE INDEX IF NOT EXISTS idx_seller_products_price ON public.seller_products(price);
-- Category index
CREATE INDEX IF NOT EXISTS idx_seller_products_category ON public.seller_products(category_name);
-- Brand index
CREATE INDEX IF NOT EXISTS idx_seller_products_brand ON public.seller_products(brand);
-- Rating index
CREATE INDEX IF NOT EXISTS idx_seller_products_rating ON public.seller_products(rating DESC);
-- Created At index for Newest sorting
CREATE INDEX IF NOT EXISTS idx_seller_products_created_at ON public.seller_products(created_at DESC);
-- Delivery Time index
CREATE INDEX IF NOT EXISTS idx_seller_products_delivery ON public.seller_products(delivery_time);

-- GIN Index for Fast Full-Text Search on seller_products
-- We use a generated column for the tsvector to index it efficiently
ALTER TABLE public.seller_products 
    ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(category_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(brand, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_seller_products_search ON public.seller_products USING GIN (search_vector);

-- 4. Create an RPC function for fetching paginated and filtered products
CREATE OR REPLACE FUNCTION get_filtered_products(
    search_term TEXT DEFAULT '',
    categories_filter TEXT[] DEFAULT '{}',
    brands_filter TEXT[] DEFAULT '{}',
    min_price DECIMAL DEFAULT 0,
    max_price DECIMAL DEFAULT 999999,
    min_rating DECIMAL DEFAULT 0,
    availability_filter TEXT DEFAULT 'all', -- 'all', 'in_stock', 'out_of_stock'
    delivery_filter TEXT DEFAULT 'all',
    sort_by TEXT DEFAULT 'relevance',
    page_size INT DEFAULT 20,
    page_number INT DEFAULT 1
) RETURNS TABLE (
    id UUID,
    title VARCHAR,
    price DECIMAL,
    original_price DECIMAL,
    category_name VARCHAR,
    brand VARCHAR,
    rating DECIMAL,
    reviews_count INT,
    is_in_stock BOOLEAN,
    delivery_time VARCHAR,
    total_count BIGINT
) AS $$
DECLARE
    offset_val INT;
BEGIN
    offset_val := (page_number - 1) * page_size;
    
    RETURN QUERY 
    WITH filtered AS (
        SELECT v.* 
        FROM public.vw_optimized_products v
        WHERE 
            (search_term = '' OR v.search_vector @@ plainto_tsquery('english', search_term))
            AND (array_length(categories_filter, 1) IS NULL OR v.category_name = ANY(categories_filter))
            AND (array_length(brands_filter, 1) IS NULL OR v.brand = ANY(brands_filter))
            AND (v.price >= min_price AND v.price <= max_price)
            AND (v.rating >= min_rating)
            AND (availability_filter = 'all' OR (availability_filter = 'in_stock' AND v.is_in_stock = true) OR (availability_filter = 'out_of_stock' AND v.is_in_stock = false))
            AND (delivery_filter = 'all' OR v.delivery_time = delivery_filter)
    ),
    counted AS (
        SELECT count(*) as total FROM filtered
    )
    SELECT 
        f.id,
        f.title,
        f.price,
        f.original_price,
        f.category_name,
        f.brand,
        f.rating,
        f.reviews_count,
        f.is_in_stock,
        f.delivery_time,
        c.total
    FROM filtered f
    CROSS JOIN counted c
    ORDER BY
        CASE WHEN sort_by = 'price_low' THEN f.price END ASC NULLS LAST,
        CASE WHEN sort_by = 'price_high' THEN f.price END DESC NULLS LAST,
        CASE WHEN sort_by = 'rating' THEN f.rating END DESC NULLS LAST,
        CASE WHEN sort_by = 'newest' THEN f.created_at END DESC NULLS LAST,
        CASE WHEN sort_by = 'relevance' AND search_term != '' THEN ts_rank(f.search_vector, plainto_tsquery('english', search_term)) END DESC NULLS LAST,
        f.views_count DESC NULLS LAST -- fallback for relevance
    LIMIT page_size
    OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
