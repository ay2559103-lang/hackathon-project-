-- ==============================================================================
-- MASTER DATABASE SCHEMA: LOCALSELL E-COMMERCE PLATFORM
-- ==============================================================================
-- This file contains the complete SQL architecture for:
-- 1. Multi-Role Profiles (Customer, Seller, Delivery, Admin)
-- 2. OTP Authentication & Security (Rate Limiting, Device Tracking)
-- 3. Product Catalog (Search, Inventory, Categories, Geolocation, Images)
-- 4. E-commerce Core (Cart, Wishlist, Reviews, Promo Codes)
-- 5. Orders & Payments (Transactions, Fulfillment)
-- 6. Real-time Messaging (Buyer-Seller Chat)
-- 7. Notifications & Admin Audit Logs
-- ==============================================================================

-- ─── 0. EXTENSIONS ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. CORE USER PROFILES ───────────────────────────────────────────────────
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'delivery', 'admin')),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 2. OTP AUTHENTICATION & SECURITY ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.otp_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    otp_type VARCHAR(20) DEFAULT 'sms',
    status VARCHAR(20) DEFAULT 'sent',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.auth_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_trusted BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, fingerprint)
);

-- ─── 3. PRODUCT CATALOG ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.product_categories CASCADE;
CREATE TABLE public.product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS public.products CASCADE;
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    original_price NUMERIC(12,2),
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    category_name TEXT,
    brand TEXT,
    sku VARCHAR(50),
    specifications JSONB DEFAULT '{}'::jsonb,
    stock_quantity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected', 'archived')),
    location TEXT,
    image_url TEXT, -- Primary image URL
    tags TEXT[],
    rating NUMERIC(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 3.1 PRODUCT IMAGES (Gallery Support) ──────────────────────────────────
DROP TABLE IF EXISTS public.product_images CASCADE;
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3.2 NEARBY SELLER PRICES (Comparison Feature) ────────────────────────
DROP TABLE IF EXISTS public.nearby_seller_prices CASCADE;
CREATE TABLE public.nearby_seller_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    price NUMERIC(12, 2) NOT NULL,
    distance_km NUMERIC(5, 2),
    availability TEXT DEFAULT 'in_stock',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, seller_id)
);

-- ─── 4. E-COMMERCE CORE ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.cart_items CASCADE;
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

DROP TABLE IF EXISTS public.wishlist CASCADE;
CREATE TABLE public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

DROP TABLE IF EXISTS public.product_reviews CASCADE;
CREATE TABLE public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- ─── 5. ORDERS & TRANSACTIONS ───────────────────────────────────────────────
DROP TABLE IF EXISTS public.orders CASCADE;
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id),
    delivery_partner_id UUID REFERENCES auth.users(id),
    total_amount NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    tracking_lat NUMERIC(10, 7),
    tracking_lng NUMERIC(10, 7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS public.order_items CASCADE;
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC(12, 2) NOT NULL,
    product_title TEXT NOT NULL
);

-- ─── 6. REAL-TIME MESSAGING ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT conversation_participants_check CHECK (participant_1 < participant_2),
    UNIQUE(participant_1, participant_2)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. NOTIFICATIONS & ADMIN ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 8. FUNCTIONS & TRIGGERS ───────────────────────────────────────────────

-- Create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, role)
  VALUES (
      NEW.id, 
      NEW.email, 
      NEW.phone,
      NEW.raw_user_meta_data->>'full_name', 
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update Rating on Review
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET 
        rating = (SELECT AVG(rating) FROM public.product_reviews WHERE product_id = NEW.product_id),
        review_count = (SELECT COUNT(*) FROM public.product_reviews WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_product_rating AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews FOR EACH ROW EXECUTE PROCEDURE public.update_product_rating();

-- ─── 9. SECURITY (RLS) ─────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nearby_seller_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Images viewable by everyone" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Prices viewable by everyone" ON public.nearby_seller_prices FOR SELECT USING (true);

-- ─── 10. REALTIME CONFIG ───────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
