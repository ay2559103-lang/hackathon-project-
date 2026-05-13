-- Migration: 20240513_rls_universal_fix.sql
-- Description: A definitive fix for RLS violations by resetting and re-applying optimized policies.

-- 1. Reset existing policies to ensure a clean state
DROP POLICY IF EXISTS "Public Access to Products" ON public.products;
DROP POLICY IF EXISTS "Sellers Manage Own Products" ON public.products;
DROP POLICY IF EXISTS "Public Access to Images" ON public.product_images;
DROP POLICY IF EXISTS "Sellers Manage Own Product Images" ON public.product_images;
DROP POLICY IF EXISTS "Public Access to Categories" ON public.product_categories;

-- 2. Enable RLS (Ensure it's actually on)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;


-- 3. UPDATED PRODUCT POLICIES
-- Allow anyone to view active products
CREATE POLICY "Public Read Products" 
ON public.products FOR SELECT 
USING (status = 'active' OR auth.uid() = seller_id);

-- Allow authenticated users to create products
CREATE POLICY "Auth Insert Products" 
ON public.products FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = seller_id);

-- Allow owners to update/delete their products
CREATE POLICY "Owner Update Products" 
ON public.products FOR UPDATE 
TO authenticated 
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Owner Delete Products" 
ON public.products FOR DELETE 
TO authenticated 
USING (auth.uid() = seller_id);


-- 4. UPDATED PRODUCT IMAGES POLICIES
-- Allow anyone to view images
CREATE POLICY "Public Read Images" 
ON public.product_images FOR SELECT 
USING (true);

-- Allow authenticated users to insert images (simplified check)
CREATE POLICY "Auth Insert Images" 
ON public.product_images FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow owners to manage their images
CREATE POLICY "Owner Manage Images" 
ON public.product_images FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.products 
        WHERE public.products.id = public.product_images.product_id 
        AND public.products.seller_id = auth.uid()
    )
);


-- 5. UPDATED CATEGORY POLICIES
CREATE POLICY "Public Read Categories" 
ON public.product_categories FOR SELECT 
USING (true);


-- 6. STORAGE BUCKET POLICIES (Matching the refined filePath)
DROP POLICY IF EXISTS "Authenticated Users Can Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Update/Delete Own Images" ON storage.objects;

CREATE POLICY "Allow Auth Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow Owner Manage" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'product-images' AND (auth.uid()::text = (storage.foldername(name))[1]));
