import { supabase } from '../utils/supabase/client';

/**
 * Delivery Service — handles all delivery_orders interactions with Supabase.
 * Used on the login page (public preview) and the delivery dashboard (authenticated).
 */
export const deliveryService = {

  /**
   * Fetch all available (unclaimed) delivery orders.
   * This is accessible to anonymous users via RLS policy for public preview.
   */
  async getAvailableDeliveries() {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching available deliveries:', error);
      return { data: [], error };
    }
  },

  /**
   * Fetch a single delivery order by ID
   */
  async getDeliveryById(id) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching delivery:', error);
      return { data: null, error };
    }
  },

  /**
   * Claim/accept a delivery order (authenticated delivery partner only)
   */
  async acceptDelivery(deliveryId, userId) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'assigned',
          assigned_to: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .eq('status', 'available')
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error accepting delivery:', error);
      return { data: null, error };
    }
  },

  /**
   * Get deliveries assigned to a specific delivery partner
   */
  async getMyDeliveries(userId) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('assigned_to', userId)
        .in('status', ['assigned', 'picked_up'])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching my deliveries:', error);
      return { data: [], error };
    }
  },

  /**
   * Mark delivery as picked up
   */
  async markPickedUp(deliveryId, userId) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'picked_up',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .eq('assigned_to', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error marking pickup:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark delivery as completed/delivered
   */
  async completeDelivery(deliveryId, userId) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'delivered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .eq('assigned_to', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error completing delivery:', error);
      return { data: null, error };
    }
  },

  /**
   * Get delivery stats for a partner
   */
  async getDeliveryStats(userId) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('wages, net_profit, status')
        .eq('assigned_to', userId);

      if (error) throw error;

      const completed = (data || []).filter(d => d.status === 'delivered');
      return {
        data: {
          totalDeliveries: completed.length,
          totalEarnings: completed.reduce((sum, d) => sum + Number(d.wages), 0),
          totalProfit: completed.reduce((sum, d) => sum + Number(d.net_profit), 0),
          activeOrders: (data || []).filter(d => ['assigned', 'picked_up'].includes(d.status)).length,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { data: null, error };
    }
  },

  /**
   * Seed delivery orders into the database (for demo purposes).
   * Inserts only if the table is empty.
   */
  async seedDeliveryOrders() {
    try {
      // Check if orders already exist
      const { data: existing } = await supabase
        .from('delivery_orders')
        .select('id')
        .limit(1);

      if (existing && existing.length > 0) {
        return { seeded: false, message: 'Orders already exist' };
      }

      const seedData = [
        { restaurant: 'Spice Junction', restaurant_type: 'Indian Cuisine', pickup_address: 'MG Road, Sector 14', delivery_address: 'Green Valley Apt, Tower B', distance_km: 1.2, duration_min: 8, wages: 55, net_profit: 22, items_count: 3, order_value: 480, order_type: 'Express', rating: 4.9, is_surge: true, status: 'available', customer_name: 'Priya Sharma' },
        { restaurant: 'Fresh Bites Café', restaurant_type: 'Continental', pickup_address: 'Koramangala 5th Block', delivery_address: 'Sunflower Residency, 3rd Floor', distance_km: 2.8, duration_min: 15, wages: 75, net_profit: 28, items_count: 5, order_value: 720, order_type: 'Standard', rating: 4.6, is_surge: false, status: 'available', customer_name: 'Rahul Gupta' },
        { restaurant: 'Dragon Wok', restaurant_type: 'Chinese & Thai', pickup_address: 'HSR Layout, 27th Main', delivery_address: 'Brigade Gateway, Unit 412', distance_km: 0.8, duration_min: 5, wages: 45, net_profit: 18, items_count: 2, order_value: 350, order_type: 'Express', rating: 4.7, is_surge: true, status: 'available', customer_name: 'Arjun Reddy' },
        { restaurant: "The Baker's Dozen", restaurant_type: 'Bakery & Desserts', pickup_address: 'Indiranagar, 12th Main', delivery_address: 'Whitefield, Palm Meadows', distance_km: 3.5, duration_min: 20, wages: 90, net_profit: 35, items_count: 8, order_value: 1250, order_type: 'Scheduled', rating: 4.8, is_surge: false, status: 'available', customer_name: 'Sneha Nair' },
        { restaurant: 'Green Leaf Organics', restaurant_type: 'Healthy & Organic', pickup_address: 'JP Nagar, 6th Phase', delivery_address: 'Mantri Serenity, Block C', distance_km: 1.9, duration_min: 12, wages: 65, net_profit: 25, items_count: 4, order_value: 560, order_type: 'Standard', rating: 4.5, is_surge: false, status: 'available', customer_name: 'Vikram Patel' },
        { restaurant: 'Tandoori Knights', restaurant_type: 'North Indian', pickup_address: 'Rajaji Nagar, 4th Block', delivery_address: 'Prestige Lakeside Habitat, B2', distance_km: 2.1, duration_min: 10, wages: 60, net_profit: 20, items_count: 3, order_value: 420, order_type: 'Express', rating: 4.8, is_surge: true, status: 'available', customer_name: 'Meera Iyer' },
        { restaurant: 'Sushi House Tokyo', restaurant_type: 'Japanese', pickup_address: 'Lavelle Road, MG Road Area', delivery_address: 'Embassy Golf Links, Tower 3', distance_km: 3.2, duration_min: 18, wages: 85, net_profit: 32, items_count: 6, order_value: 980, order_type: 'Standard', rating: 4.9, is_surge: false, status: 'available', customer_name: 'Ankit Joshi' },
        { restaurant: 'Pizza Republic', restaurant_type: 'Italian', pickup_address: 'Electronic City, Phase 1', delivery_address: 'Purva Fountain Square, Wing A', distance_km: 1.5, duration_min: 9, wages: 50, net_profit: 15, items_count: 2, order_value: 390, order_type: 'Express', rating: 4.4, is_surge: false, status: 'available', customer_name: 'Kavitha Menon' },
        { restaurant: 'Chai & Snacks Co.', restaurant_type: 'Café & Snacks', pickup_address: 'BTM Layout, 2nd Stage', delivery_address: 'Sobha Dream Acres, Unit 502', distance_km: 2.5, duration_min: 14, wages: 70, net_profit: 26, items_count: 4, order_value: 310, order_type: 'Standard', rating: 4.6, is_surge: true, status: 'available', customer_name: 'Deepak Kumar' },
        { restaurant: 'Royal Biryani House', restaurant_type: 'Hyderabadi', pickup_address: 'Marathahalli Bridge Road', delivery_address: 'Divyasree Republic, Tower D', distance_km: 1.8, duration_min: 11, wages: 58, net_profit: 21, items_count: 3, order_value: 550, order_type: 'Express', rating: 4.7, is_surge: true, status: 'available', customer_name: 'Fatima Sheikh' },
      ];

      const { error } = await supabase
        .from('delivery_orders')
        .insert(seedData);

      if (error) throw error;
      return { seeded: true, message: `Seeded ${seedData.length} delivery orders` };
    } catch (error) {
      console.error('Error seeding delivery orders:', error);
      return { seeded: false, message: error.message };
    }
  },
};

// ─── Fallback mock data if DB is unreachable ─────────────────────────
export const FALLBACK_DELIVERIES = [
  { id: 'mock-1', restaurant: 'Spice Junction', restaurant_type: 'Indian Cuisine', pickup_address: 'MG Road, Sector 14', delivery_address: 'Green Valley Apt, Tower B', distance_km: 1.2, duration_min: 8, wages: 55, net_profit: 22, items_count: 3, order_value: 480, order_type: 'Express', rating: 4.9, is_surge: true, status: 'available' },
  { id: 'mock-2', restaurant: 'Fresh Bites Café', restaurant_type: 'Continental', pickup_address: 'Koramangala 5th Block', delivery_address: 'Sunflower Residency, 3rd Floor', distance_km: 2.8, duration_min: 15, wages: 75, net_profit: 28, items_count: 5, order_value: 720, order_type: 'Standard', rating: 4.6, is_surge: false, status: 'available' },
  { id: 'mock-3', restaurant: 'Dragon Wok', restaurant_type: 'Chinese & Thai', pickup_address: 'HSR Layout, 27th Main', delivery_address: 'Brigade Gateway, Unit 412', distance_km: 0.8, duration_min: 5, wages: 45, net_profit: 18, items_count: 2, order_value: 350, order_type: 'Express', rating: 4.7, is_surge: true, status: 'available' },
  { id: 'mock-4', restaurant: "The Baker's Dozen", restaurant_type: 'Bakery & Desserts', pickup_address: 'Indiranagar, 12th Main', delivery_address: 'Whitefield, Palm Meadows', distance_km: 3.5, duration_min: 20, wages: 90, net_profit: 35, items_count: 8, order_value: 1250, order_type: 'Scheduled', rating: 4.8, is_surge: false, status: 'available' },
  { id: 'mock-5', restaurant: 'Green Leaf Organics', restaurant_type: 'Healthy & Organic', pickup_address: 'JP Nagar, 6th Phase', delivery_address: 'Mantri Serenity, Block C', distance_km: 1.9, duration_min: 12, wages: 65, net_profit: 25, items_count: 4, order_value: 560, order_type: 'Standard', rating: 4.5, is_surge: false, status: 'available' },
];
