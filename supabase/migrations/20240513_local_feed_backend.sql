-- 0. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Referencing auth.users for better compatibility
    title TEXT NOT NULL,
    description TEXT,
    tagline TEXT,
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    category_id UUID REFERENCES product_categories(id),
    category_name TEXT,
    brand TEXT,
    sku TEXT,
    product_condition TEXT, 
    stock_quantity INTEGER DEFAULT 0,
    location TEXT,
    location_city TEXT,
    location_state TEXT,
    location_country TEXT,
    location_pincode TEXT,
    image_url TEXT,
    tags TEXT[],
    status TEXT DEFAULT 'active',
    is_shipping_available BOOLEAN DEFAULT TRUE,
    delivery_estimate TEXT,
    shipping_charges DECIMAL(10,2) DEFAULT 0,
    return_policy TEXT,
    warranty_info TEXT,
    size_variants TEXT[],
    color_variants TEXT[],
    material_variants TEXT[],
    key_features TEXT[],
    rating DECIMAL(3,2) DEFAULT 4.5,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create RPC Function for Advanced Filtering
DROP FUNCTION IF EXISTS get_filtered_products(TEXT, TEXT[], TEXT[], DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_filtered_products(
    search_term TEXT DEFAULT NULL,
    categories_filter TEXT[] DEFAULT NULL,
    brands_filter TEXT[] DEFAULT NULL,
    min_price DECIMAL DEFAULT 0,
    max_price DECIMAL DEFAULT 1000000,
    min_rating DECIMAL DEFAULT 0,
    availability_filter TEXT DEFAULT 'all',
    delivery_filter TEXT DEFAULT 'all',
    sort_by TEXT DEFAULT 'newest',
    page_size INTEGER DEFAULT 20,
    page_number INTEGER DEFAULT 1
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price DECIMAL,
    original_price DECIMAL,
    category_name TEXT,
    brand TEXT,
    rating DECIMAL,
    review_count INTEGER,
    is_in_stock BOOLEAN,
    delivery_time TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
) AS $$
DECLARE
    offset_val INTEGER;
BEGIN
    offset_val := (page_number - 1) * page_size;

    RETURN QUERY
    WITH filtered AS (
        SELECT 
            p.id,
            p.title,
            p.price,
            p.original_price,
            p.category_name,
            p.brand,
            p.rating,
            p.review_count,
            (p.stock_quantity > 0) as is_in_stock,
            p.delivery_estimate as delivery_time,
            p.image_url,
            p.created_at,
            COUNT(*) OVER() as full_count
        FROM products p
        WHERE 
            p.status = 'active'
            AND (search_term IS NULL OR search_term = '' OR p.title ILIKE '%' || search_term || '%' OR p.description ILIKE '%' || search_term || '%')
            AND (categories_filter IS NULL OR array_length(categories_filter, 1) IS NULL OR p.category_name = ANY(categories_filter))
            AND (brands_filter IS NULL OR array_length(brands_filter, 1) IS NULL OR p.brand = ANY(brands_filter))
            AND (p.price >= min_price AND p.price <= max_price)
            AND (p.rating >= min_rating)
            AND (
                availability_filter = 'all' 
                OR (availability_filter = 'in_stock' AND p.stock_quantity > 0)
                OR (availability_filter = 'out_of_stock' AND p.stock_quantity = 0)
            )
            AND (
                delivery_filter = 'all'
                OR (delivery_filter = 'same_day' AND (p.delivery_estimate ILIKE '%today%' OR p.delivery_estimate ILIKE '%same day%'))
                OR (delivery_filter = '1_2_days' AND p.delivery_estimate ~* '1|2|tomorrow')
            )
    )
    SELECT 
        f.id, f.title, f.price, f.original_price, f.category_name, f.brand, f.rating, f.review_count, f.is_in_stock, f.delivery_time, f.image_url, f.created_at, f.full_count
    FROM filtered f
    ORDER BY
        CASE WHEN sort_by = 'price_low' THEN f.price END ASC,
        CASE WHEN sort_by = 'price_high' THEN f.price END DESC,
        CASE WHEN sort_by = 'rating' THEN f.rating END DESC,
        CASE WHEN sort_by = 'newest' THEN f.created_at END DESC,
        f.created_at DESC -- Default fallback
    LIMIT page_size
    OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;
