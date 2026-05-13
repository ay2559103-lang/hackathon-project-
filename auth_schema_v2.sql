-- ==============================================================================
-- SECURE ROLE-BASED AUTHENTICATION SCHEMA
-- Run this in your Supabase SQL Editor
-- Features: Profiles, Roles, Login Tracking, Rate Limiting, RLS
-- ==============================================================================

-- 1. User Profiles & Roles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('customer', 'seller', 'delivery', 'admin')) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Login Activity Logging (Security & Auditing)
CREATE TABLE IF NOT EXISTS public.login_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    login_status TEXT CHECK (login_status IN ('success', 'failed_attempt', 'locked_out')),
    attempted_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Rate Limiting / Brute Force Prevention (Table-based approach)
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    ip_address TEXT PRIMARY KEY,
    failed_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMP WITH TIME ZONE
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Profiles: Users can read/update their own profile. Admins can read all.
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" 
    ON public.user_profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" 
    ON public.user_profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Login Activity: Users can see their own login history
DROP POLICY IF EXISTS "Users view own login history" ON public.login_activity;
CREATE POLICY "Users view own login history" 
    ON public.login_activity FOR SELECT 
    USING (auth.uid() = user_id);

-- System functions (Bypass RLS for tracking)
CREATE OR REPLACE FUNCTION public.log_failed_login(client_ip TEXT, email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_attempts INTEGER;
    locked_time TIMESTAMP;
BEGIN
    -- Log the attempt
    INSERT INTO public.login_activity (ip_address, login_status, attempted_email)
    VALUES (client_ip, 'failed_attempt', email);

    -- Update rate limit tracker
    INSERT INTO public.auth_rate_limits (ip_address, failed_attempts)
    VALUES (client_ip, 1)
    ON CONFLICT (ip_address) 
    DO UPDATE SET failed_attempts = public.auth_rate_limits.failed_attempts + 1;

    -- Check if should lockout
    SELECT failed_attempts INTO current_attempts FROM public.auth_rate_limits WHERE ip_address = client_ip;
    
    IF current_attempts >= 5 THEN
        UPDATE public.auth_rate_limits 
        SET lockout_until = NOW() + INTERVAL '15 minutes' 
        WHERE ip_address = client_ip;
        RETURN FALSE; -- Account locked
    END IF;

    RETURN TRUE; -- Allowed to try again
END;
$$;

-- Function to check if IP is locked out
CREATE OR REPLACE FUNCTION public.check_ip_lockout(client_ip TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    locked_time TIMESTAMP;
BEGIN
    SELECT lockout_until INTO locked_time FROM public.auth_rate_limits WHERE ip_address = client_ip;
    
    IF locked_time IS NOT NULL AND locked_time > NOW() THEN
        RETURN TRUE; -- Is locked out
    END IF;
    
    -- If time passed, reset
    IF locked_time IS NOT NULL AND locked_time <= NOW() THEN
        UPDATE public.auth_rate_limits SET failed_attempts = 0, lockout_until = NULL WHERE ip_address = client_ip;
    END IF;
    
    RETURN FALSE; -- Not locked out
END;
$$;

-- 6. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
