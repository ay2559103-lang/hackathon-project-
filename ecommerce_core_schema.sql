-- =====================================================
-- MASTER E-COMMERCE CORE SCHEMA
-- =====================================================
-- This file implements:
-- 1. Shopping Cart (Real-time sync)
-- 2. Wishlist (Customer discovery)
-- 3. Advanced Orders (Transactions, Items, Fulfillment)
-- 4. Product Reviews & Ratings
-- 5. Promo Codes & Discounts
-- =====================================================

-- 1. SHOPPING CART
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    metadata JSONB DEFAULT '{}'::jsonb, -- Store variant info like color/size
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, product_id) -- One entry per product in cart
);

-- 2. WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- 3. ENHANCED ORDERS
-- (Extending the basic orders table from complete_backend_schema.sql if needed)
CREATE TABLE IF NOT EXISTS public.order_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    total_amount NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    shipping_fee NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT, -- 'razorpay', 'stripe', 'cod'
    payment_id TEXT, -- External transaction ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC(12, 2) NOT NULL, -- Snapshot price
    product_title TEXT NOT NULL, -- Denormalized in case product is deleted
    variant_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCT REVIEWS
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT[], -- Array of review images
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, user_id) -- One review per user per product
);

-- 5. PROMO CODES
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_purchase_amount NUMERIC(10, 2) DEFAULT 0.00,
    max_discount_amount NUMERIC(10, 2), -- Cap for percentage discounts
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    usage_limit INTEGER, -- Total times it can be used
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON public.order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.product_reviews(rating);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- 1. Cart: Users manage own items
CREATE POLICY "Users can manage own cart" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Wishlist: Users manage own wishlist
CREATE POLICY "Users can manage own wishlist" ON public.wishlist
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Order Transactions: Users view own, Admin views all
CREATE POLICY "Users can view own transactions" ON public.order_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Order Items: Sellers view items for their products, Customers view own
CREATE POLICY "Customers can view own order items" ON public.order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
    );

CREATE POLICY "Sellers can view own order items" ON public.order_items
    FOR SELECT USING (seller_id = auth.uid());

-- 5. Reviews: Everyone can read, authenticated users can review their purchases
CREATE POLICY "Anyone can view reviews" ON public.product_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own reviews" ON public.product_reviews
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Promo Codes: Everyone can check if active
CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes
    FOR SELECT USING (is_active = true AND NOW() BETWEEN starts_at AND expires_at);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update product rating on review changes
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET 
        rating = (SELECT COALESCE(AVG(rating), 0) FROM public.product_reviews WHERE product_id = NEW.product_id),
        review_count = (SELECT COUNT(*) FROM public.product_reviews WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW EXECUTE PROCEDURE public.update_product_rating();

-- Function to clean cart on successful order
CREATE OR REPLACE FUNCTION public.clear_cart_after_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'paid' THEN
        DELETE FROM public.cart_items WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_clear_cart_after_order
AFTER INSERT OR UPDATE ON public.order_transactions
FOR EACH ROW EXECUTE PROCEDURE public.clear_cart_after_order();
