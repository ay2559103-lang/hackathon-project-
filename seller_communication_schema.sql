-- ==============================================================================
-- DIRECT SELLER COMMUNICATION & ANTI-SPAM SCHEMA
-- Run this in your Supabase SQL Editor to add backend support for the 
-- Seller Contact Modal (Phone, WhatsApp, Online Status, and Rate Limiting).
-- ==============================================================================

-- 1. Ensure the sellers table exists
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID REFERENCES auth.users(id) PRIMARY KEY
);

-- 2. Add Communication & Profile Fields to Sellers Table
ALTER TABLE public.sellers 
    ADD COLUMN IF NOT EXISTS phone_number TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_number TEXT, -- Optional, if different from phone
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT 'var(--gradient-primary)',
    ADD COLUMN IF NOT EXISTS total_rating NUMERIC(3,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 3. Create a Contact Logs Table (Anti-Spam & Analytics)
-- This table tracks every time a buyer clicks "Call" or "WhatsApp"
CREATE TABLE IF NOT EXISTS public.contact_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for guest users
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    contact_method TEXT CHECK (contact_method IN ('call', 'whatsapp', 'secure_chat')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) on Contact Logs
ALTER TABLE public.contact_logs ENABLE ROW LEVEL SECURITY;

-- Buyers can only see their own logs
DROP POLICY IF EXISTS "Buyers can view own contact logs" ON public.contact_logs;
CREATE POLICY "Buyers can view own contact logs" 
    ON public.contact_logs FOR SELECT 
    USING (auth.uid() = buyer_id);

-- Buyers can insert their own logs
DROP POLICY IF EXISTS "Buyers can insert contact logs" ON public.contact_logs;
CREATE POLICY "Buyers can insert contact logs" 
    ON public.contact_logs FOR INSERT 
    WITH CHECK (auth.uid() = buyer_id OR buyer_id IS NULL);

-- Sellers can see who contacted them
DROP POLICY IF EXISTS "Sellers can view logs targeting them" ON public.contact_logs;
CREATE POLICY "Sellers can view logs targeting them" 
    ON public.contact_logs FOR SELECT 
    USING (auth.uid() = seller_id);

-- 5. Anti-Spam Backend Function (Rate Limiting)
-- Call this function before revealing the phone number or opening WhatsApp
CREATE OR REPLACE FUNCTION check_contact_rate_limit(target_seller_id UUID, current_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recent_requests INTEGER;
BEGIN
    -- If guest user, skip DB limit (frontend handles IP/localstorage limit)
    IF current_buyer_id IS NULL THEN
        RETURN TRUE; 
    END IF;

    -- Count how many sellers this buyer has contacted in the last 10 minutes
    SELECT COUNT(*) INTO recent_requests
    FROM public.contact_logs
    WHERE buyer_id = current_buyer_id 
    AND created_at > NOW() - INTERVAL '10 minutes';
    
    -- Limit to 5 contacts per 10 minutes to prevent scraping
    IF recent_requests >= 5 THEN
        RETURN FALSE; -- Rate limit exceeded
    END IF;
    
    -- Also prevent clicking the exact same seller more than 3 times in 5 minutes
    SELECT COUNT(*) INTO recent_requests
    FROM public.contact_logs
    WHERE buyer_id = current_buyer_id 
    AND seller_id = target_seller_id
    AND created_at > NOW() - INTERVAL '5 minutes';

    IF recent_requests >= 3 THEN
        RETURN FALSE; -- Spamming specific seller
    END IF;

    RETURN TRUE; -- Allowed
END;
$$;

-- 6. Helper Function: Update Online Status
-- Call this when the user opens the app to update their last active time
CREATE OR REPLACE FUNCTION update_seller_online_status(is_active BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.sellers
    SET 
        is_online = is_active,
        last_active = timezone('utc'::text, now())
    WHERE id = auth.uid();
END;
$$;
