-- ==============================================================================
-- PRODUCT FILTERING SCHEMA & RPC (UPDATED TO FIX "COLUMN DOES NOT EXIST" ERROR)
-- ==============================================================================

-- 1. Create the table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

-- 2. Add all columns using ALTER TABLE. 
-- This fixes the error where the table already existed but was missing columns.
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled',
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS unit TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS brand TEXT,
    ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS delivery_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS image TEXT,
    ADD COLUMN IF NOT EXISTS seller_name TEXT,
    ADD COLUMN IF NOT EXISTS seller_initials TEXT,
    ADD COLUMN IF NOT EXISTS seller_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS tags TEXT[],
    ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7),
    ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 7);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
    ON public.products FOR SELECT 
    USING (true);

-- Allow sellers to manage their own products
DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;
CREATE POLICY "Sellers can insert their own products" 
    ON public.products FOR INSERT 
    WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
CREATE POLICY "Sellers can update their own products" 
    ON public.products FOR UPDATE 
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;
CREATE POLICY "Sellers can delete their own products" 
    ON public.products FOR DELETE 
    USING (auth.uid() = seller_id);


-- 3. Advanced Search RPC (Remote Procedure Call)
CREATE OR REPLACE FUNCTION public.search_products(
    search_query TEXT DEFAULT '',
    filter_categories TEXT[] DEFAULT '{}'::TEXT[],
    filter_brands TEXT[] DEFAULT '{}'::TEXT[],
    min_price NUMERIC DEFAULT 0,
    max_price NUMERIC DEFAULT 9999999,
    min_rating NUMERIC DEFAULT 0,
    filter_availability TEXT DEFAULT 'all', -- 'all', 'in_stock', 'out_of_stock'
    filter_delivery_time TEXT DEFAULT 'all', -- 'all', 'same_day', '1_2_days', '3_5_days'
    user_lat NUMERIC DEFAULT NULL,
    user_lng NUMERIC DEFAULT NULL,
    max_distance_km NUMERIC DEFAULT 10,
    sort_by TEXT DEFAULT 'relevance' -- 'relevance', 'price_low', 'price_high', 'rating', 'newest', 'distance'
) RETURNS SETOF public.products LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.*
    FROM public.products p
    WHERE 
        -- Text Search (Title, Description, Category, Brand)
        (search_query = '' OR 
         p.title ILIKE '%' || search_query || '%' OR 
         p.description ILIKE '%' || search_query || '%' OR
         p.category ILIKE '%' || search_query || '%' OR
         p.brand ILIKE '%' || search_query || '%')
        
        -- Categories
        AND (array_length(filter_categories, 1) IS NULL OR p.category = ANY(filter_categories))
        
        -- Brands
        AND (array_length(filter_brands, 1) IS NULL OR p.brand = ANY(filter_brands))
        
        -- Price
        AND (p.price >= min_price AND p.price <= max_price)
        
        -- Rating
        AND (p.rating >= min_rating)
        
        -- Availability
        AND (
            filter_availability = 'all' OR 
            (filter_availability = 'in_stock' AND p.in_stock = TRUE) OR 
            (filter_availability = 'out_of_stock' AND p.in_stock = FALSE)
        )
        
        -- Delivery Time
        AND (
            filter_delivery_time = 'all' OR
            (filter_delivery_time = 'same_day' AND p.delivery_days = 0) OR
            (filter_delivery_time = '1_2_days' AND p.delivery_days <= 2) OR
            (filter_delivery_time = '3_5_days' AND p.delivery_days <= 5)
        )
        
        -- Distance Filter
        AND (
            user_lat IS NULL OR user_lng IS NULL OR p.lat IS NULL OR p.lng IS NULL OR
            (6371 * acos(
                cos(radians(user_lat)) * cos(radians(p.lat)) * 
                cos(radians(p.lng) - radians(user_lng)) + 
                sin(radians(user_lat)) * sin(radians(p.lat))
            )) <= max_distance_km
        )
    ORDER BY 
        CASE WHEN sort_by = 'price_low' THEN p.price END ASC NULLS LAST,
        CASE WHEN sort_by = 'price_high' THEN p.price END DESC NULLS LAST,
        CASE WHEN sort_by = 'rating' THEN p.rating END DESC NULLS LAST,
        CASE WHEN sort_by = 'newest' THEN p.created_at END DESC NULLS LAST,
        CASE WHEN sort_by = 'distance' AND user_lat IS NOT NULL AND p.lat IS NOT NULL THEN
            6371 * acos(
                cos(radians(user_lat)) * cos(radians(p.lat)) * 
                cos(radians(p.lng) - radians(user_lng)) + 
                sin(radians(user_lat)) * sin(radians(p.lat))
            )
        END ASC NULLS LAST,
        CASE WHEN sort_by = 'relevance' THEN p.views END DESC NULLS LAST;
END;
$$;
