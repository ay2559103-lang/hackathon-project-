-- Migration: 20240513_rls_policies.sql
-- Description: Enables Row Level Security (RLS) and sets up essential policies for products and images.

-- 1. Enable RLS on all core tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- 2. PRODUCTS POLICIES
-- Anyone can view active products
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Products' AND tablename = 'products') THEN
        CREATE POLICY "Public Access to Products" 
        ON public.products FOR SELECT 
        USING (status = 'active' OR auth.uid() = seller_id);
    END IF;

    -- Only the seller who created the product can insert/update/delete it
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Sellers Manage Own Products' AND tablename = 'products') THEN
        CREATE POLICY "Sellers Manage Own Products" 
        ON public.products FOR ALL 
        USING (auth.uid() = seller_id)
        WITH CHECK (auth.uid() = seller_id);
    END IF;
END $$;


-- 3. PRODUCT IMAGES POLICIES
-- Anyone can view product images
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Images' AND tablename = 'product_images') THEN
        CREATE POLICY "Public Access to Images" 
        ON public.product_images FOR SELECT 
        USING (true);
    END IF;

    -- Sellers can manage images for their own products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Sellers Manage Own Product Images' AND tablename = 'product_images') THEN
        CREATE POLICY "Sellers Manage Own Product Images" 
        ON public.product_images FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.products 
                WHERE public.products.id = public.product_images.product_id 
                AND public.products.seller_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.products 
                WHERE public.products.id = public.product_images.product_id 
                AND public.products.seller_id = auth.uid()
            )
        );
    END IF;
END $$;


-- 4. CATEGORIES POLICIES
-- Anyone can view categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Categories' AND tablename = 'product_categories') THEN
        CREATE POLICY "Public Access to Categories" 
        ON public.product_categories FOR SELECT 
        USING (true);
    END IF;
END $$;
