-- ===================================================================
-- DELIVERY ORDERS TABLE — stores available delivery jobs for partners
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant    TEXT NOT NULL,
  restaurant_type TEXT DEFAULT 'Restaurant',
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  distance_km   NUMERIC(5,2) NOT NULL DEFAULT 0,
  duration_min  INTEGER NOT NULL DEFAULT 10,
  wages         NUMERIC(8,2) NOT NULL DEFAULT 0,
  net_profit    NUMERIC(8,2) NOT NULL DEFAULT 0,
  items_count   INTEGER NOT NULL DEFAULT 1,
  order_value   NUMERIC(10,2) NOT NULL DEFAULT 0,
  order_type    TEXT NOT NULL DEFAULT 'Standard' CHECK (order_type IN ('Express', 'Standard', 'Scheduled')),
  rating        NUMERIC(2,1) DEFAULT 4.5,
  is_surge      BOOLEAN DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'picked_up', 'delivered', 'cancelled')),
  assigned_to   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  expires_at    TIMESTAMPTZ DEFAULT (now() + interval '30 minutes')
);

-- Index for fast nearby delivery lookups
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON public.delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_assigned ON public.delivery_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_created ON public.delivery_orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to READ available deliveries (public preview on login page)
CREATE POLICY "Anyone can view available deliveries"
  ON public.delivery_orders
  FOR SELECT
  USING (status = 'available');

-- Authenticated delivery partners can view their own assigned orders
CREATE POLICY "Delivery partners can view their assigned orders"
  ON public.delivery_orders
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- Authenticated delivery partners can claim available orders
CREATE POLICY "Delivery partners can claim available orders"
  ON public.delivery_orders
  FOR UPDATE
  TO authenticated
  USING (status = 'available')
  WITH CHECK (assigned_to = auth.uid() AND status = 'assigned');

-- Service role can do everything (for seeding and admin)
CREATE POLICY "Service role full access"
  ON public.delivery_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant access to anon and authenticated roles  
GRANT SELECT ON public.delivery_orders TO anon;
GRANT SELECT, UPDATE ON public.delivery_orders TO authenticated;

-- ===================================================================
-- SEED DATA — pre-populate with realistic delivery orders
-- ===================================================================

INSERT INTO public.delivery_orders (restaurant, restaurant_type, pickup_address, delivery_address, distance_km, duration_min, wages, net_profit, items_count, order_value, order_type, rating, is_surge, status, customer_name) VALUES
  ('Spice Junction', 'Indian Cuisine', 'MG Road, Sector 14', 'Green Valley Apt, Tower B', 1.2, 8, 55, 22, 3, 480, 'Express', 4.9, true, 'available', 'Priya Sharma'),
  ('Fresh Bites Café', 'Continental', 'Koramangala 5th Block', 'Sunflower Residency, 3rd Floor', 2.8, 15, 75, 28, 5, 720, 'Standard', 4.6, false, 'available', 'Rahul Gupta'),
  ('Dragon Wok', 'Chinese & Thai', 'HSR Layout, 27th Main', 'Brigade Gateway, Unit 412', 0.8, 5, 45, 18, 2, 350, 'Express', 4.7, true, 'available', 'Arjun Reddy'),
  ('The Baker''s Dozen', 'Bakery & Desserts', 'Indiranagar, 12th Main', 'Whitefield, Palm Meadows', 3.5, 20, 90, 35, 8, 1250, 'Scheduled', 4.8, false, 'available', 'Sneha Nair'),
  ('Green Leaf Organics', 'Healthy & Organic', 'JP Nagar, 6th Phase', 'Mantri Serenity, Block C', 1.9, 12, 65, 25, 4, 560, 'Standard', 4.5, false, 'available', 'Vikram Patel'),
  ('Tandoori Knights', 'North Indian', 'Rajaji Nagar, 4th Block', 'Prestige Lakeside Habitat, B2', 2.1, 10, 60, 20, 3, 420, 'Express', 4.8, true, 'available', 'Meera Iyer'),
  ('Sushi House Tokyo', 'Japanese', 'Lavelle Road, MG Road Area', 'Embassy Golf Links, Tower 3', 3.2, 18, 85, 32, 6, 980, 'Standard', 4.9, false, 'available', 'Ankit Joshi'),
  ('Pizza Republic', 'Italian', 'Electronic City, Phase 1', 'Purva Fountain Square, Wing A', 1.5, 9, 50, 15, 2, 390, 'Express', 4.4, false, 'available', 'Kavitha Menon'),
  ('Chai & Snacks Co.', 'Café & Snacks', 'BTM Layout, 2nd Stage', 'Sobha Dream Acres, Unit 502', 2.5, 14, 70, 26, 4, 310, 'Standard', 4.6, true, 'available', 'Deepak Kumar'),
  ('Royal Biryani House', 'Hyderabadi', 'Marathahalli Bridge Road', 'Divyasree Republic, Tower D', 1.8, 11, 58, 21, 3, 550, 'Express', 4.7, true, 'available', 'Fatima Sheikh')
ON CONFLICT DO NOTHING;
