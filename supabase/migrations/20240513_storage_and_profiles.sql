-- Migration: 20240513_storage_and_profiles.sql
-- Description: Sets up Storage bucket, Profiles table, and triggers for a seamless product publishing experience.

-- 1. STORAGE SETUP
-- Create the bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Note: You may need to run these as a Superuser or through the Supabase Dashboard
DO $$
BEGIN
    -- Public Access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects') THEN
        CREATE POLICY "Public Access" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'product-images');
    END IF;

    -- Authenticated Users Can Upload
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Users Can Upload' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated Users Can Upload" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
    END IF;

    -- Users Can Update/Delete Own Images
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users Can Update/Delete Own Images' AND tablename = 'objects') THEN
        CREATE POLICY "Users Can Update/Delete Own Images" 
        ON storage.objects FOR ALL 
        USING (bucket_id = 'product-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() = owner));
    END IF;
END $$;


-- 2. PROFILES TABLE (Required for Seller associations)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'buyer',
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'profiles') THEN
        CREATE POLICY "Public profiles are viewable by everyone"
        ON public.profiles FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update own profile"
        ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;


-- 3. SYNC TRIGGER (Auto-create profile on sign up)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    new.raw_user_meta_data->>'avatar_url', 
    COALESCE(new.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;


-- 4. UPDATE PRODUCTS TABLE FK (Ensure it points to profiles for easier joins)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE public.products 
        DROP CONSTRAINT IF EXISTS products_seller_id_fkey,
        ADD CONSTRAINT products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
