-- ==============================================================================
-- COMPLETE BACKEND SCHEMA FOR LOCALSELL
-- This file contains all the SQL required for the AI Assistant, 
-- Real-time Delivery Tracking, and the Professional Admin System.
-- ==============================================================================


-- ==============================================================================
-- 1. AI SELLING ASSISTANT SCHEMA
-- ==============================================================================

-- Create table for AI Chat History
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    category TEXT, -- 'pricing', 'seo', 'reply', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure the chat history (Sellers can only see their own chats)
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own chat history" 
    ON public.ai_chat_history FOR SELECT 
    USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own chat history" 
    ON public.ai_chat_history FOR INSERT 
    WITH CHECK (auth.uid() = seller_id);

-- Create table for Rate Limiting and Analytics
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast rate-limit queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_seller_time ON public.ai_usage_logs(seller_id, created_at);

-- Function to check rate limits (Max 50 requests per hour)
CREATE OR REPLACE FUNCTION check_ai_rate_limit(target_seller_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM public.ai_usage_logs
    WHERE seller_id = target_seller_id 
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF request_count >= 50 THEN
        RETURN FALSE; -- Rate limit exceeded
    END IF;
    
    RETURN TRUE; -- Allowed
END;
$$;


-- ==============================================================================
-- 2. REAL-TIME DELIVERY TRACKING SCHEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Extend orders table with tracki-- Ensure orders table exists (Assuming basic structure)
Cng fields
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'placed',
ADD COLUMN IF NOT EXISTS tracking_lat NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS tracking_lng NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES auth.users(id);

-- Enable Realtime for the 'orders' table
-- Note: 'supabase_realtime' publication usually exists, we just add the table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END
$$;

-- Security Policies for Tracking
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Partners can update assigned orders" 
ON public.orders FOR UPDATE 
USING (auth.uid() = delivery_partner_id)
WITH CHECK (auth.uid() = delivery_partner_id);


-- ==============================================================================
-- 3. PROFESSIONAL ADMIN SYSTEM SCHEMA
-- ==============================================================================

-- Function to check if current user is an admin
-- Assumes role is stored in raw_user_meta_data -> 'role'
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

-- Create sellers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Seller verification and commission
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'banned')),
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 5.00;

-- Audit Logs for tracking Admin Actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL, 
    target_id UUID, 
    details JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (is_admin());

CREATE POLICY "Only admins can insert audit logs" 
    ON public.audit_logs FOR INSERT 
    WITH CHECK (is_admin());

-- Platform Settings (Global configurations)
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

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" 
    ON public.platform_settings FOR SELECT 
    USING (true);

CREATE POLICY "Only admins can modify settings" 
    ON public.platform_settings FOR ALL 
    USING (is_admin())
    WITH CHECK (is_admin());

-- Notifications System
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
