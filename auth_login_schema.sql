-- ==========================================
-- Supabase Authentication & Multi-Role Schema
-- ==========================================

-- 1. Create or Update the Profiles Table
-- Instead of overwriting, we add IF NOT EXISTS to prevent the "relation already exists" error.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY
);

-- Safely add all required columns if they don't exist yet
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN full_name VARCHAR(255);
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'delivery', 'admin'));
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN email VARCHAR(255) UNIQUE;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN phone VARCHAR(20);
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;


-- 2. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors, then recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view seller profiles" ON public.profiles;
CREATE POLICY "Public can view seller profiles" ON public.profiles
    FOR SELECT USING (role = 'seller');

-- 3. Automatic Profile Creation Trigger
-- When a user signs up via the login page, this trigger captures the metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
      id, 
      email, 
      phone,
      full_name, 
      role
  )
  VALUES (
      NEW.id, 
      NEW.email, 
      NEW.phone,
      NEW.raw_user_meta_data->>'full_name', 
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Auto-update Timestamp Trigger
CREATE OR REPLACE FUNCTION update_profiles_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE update_profiles_modtime();

-- 5. Helper Functions for Role-Based Access Control (RBAC)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'seller'
  );
$$ LANGUAGE sql SECURITY DEFINER;
