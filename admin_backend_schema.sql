-- ========================================================
-- ADMIN & BACKEND SYSTEM SCHEMA
-- ========================================================
-- This file contains the database architecture to support 
-- the complete professional backend/admin system.

-- 1. EXTENDED USER METADATA AND ROLES
-- The 'role' is stored in auth.users -> raw_user_meta_data
-- Roles available: 'customer', 'seller', 'delivery', 'admin'

-- 2. SELLER VERIFICATION STATUS
-- Sellers need a status for the approval workflow
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'banned')),
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- 3. PLATFORM COMMISSION
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 5.00; -- 5% base commission

-- 4. AUDIT LOGS (Crucial for Admin systems)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL, -- e.g., 'BANNED_USER', 'APPROVED_PRODUCT', 'CHANGED_COMMISSION'
    target_id UUID, -- The ID of the affected user/product
    details JSONB, -- Additional metadata about the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ADMIN SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert Default Settings
INSERT INTO public.platform_settings (key, value) VALUES
('delivery_fee', '{"base": 30, "per_km": 10}'),
('global_commission', '5.00')
ON CONFLICT (key) DO NOTHING;

-- 6. ROW LEVEL SECURITY (RLS) FOR ADMINS
-- Ensure only admins can access audit logs and modify platform settings

-- Function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', 
    ''
  ) = 'admin';
$$;

-- Apply to Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (is_admin());

CREATE POLICY "Only admins can insert audit logs" 
    ON public.audit_logs FOR INSERT 
    WITH CHECK (is_admin());

-- Apply to Platform Settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" 
    ON public.platform_settings FOR SELECT 
    USING (true);

CREATE POLICY "Only admins can modify settings" 
    ON public.platform_settings FOR ALL 
    USING (is_admin())
    WITH CHECK (is_admin());

-- Modify Products table to allow Admin overriding
-- (Assuming public.products exists)
CREATE POLICY "Admins can update any product" 
    ON public.products FOR UPDATE 
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Admins can delete any product" 
    ON public.products FOR DELETE 
    USING (is_admin());

-- Modify Orders table for Admin handling
CREATE POLICY "Admins can update any order" 
    ON public.orders FOR UPDATE 
    USING (is_admin())
    WITH CHECK (is_admin());

-- 7. NOTIFICATIONS SYSTEM
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT, -- 'alert', 'info', 'success'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (is_admin());
