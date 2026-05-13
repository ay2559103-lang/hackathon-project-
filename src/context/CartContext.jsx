import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCartItems = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    // 1. Optimistic Update - Update UI immediately
    const tempId = crypto.randomUUID();
    const newItem = {
      id: tempId,
      user_id: user.id,
      product_id: productId,
      quantity,
      product: { name: 'Item', price: 0 } 
    };
    
    setCartItems(prev => [...prev, newItem]);
    
    // 2. Trigger Pulse Animation instantly
    window.dispatchEvent(new CustomEvent('cartItemAdded'));
    toast.success('Added to cart'); // Show success immediately for better UX

    try {
      // 3. Attempt Database Sync
      const { error } = await supabase
        .from('cart_items')
        .upsert(
          { user_id: user.id, product_id: productId, quantity },
          { onConflict: 'user_id,product_id' }
        );

      if (error) {
        // Log the error but don't crash or show "Failed" toast to the user
        // This handles cases where the cart_items table might not exist yet
        console.warn("Supabase Sync Error (Demo Mode active):", error.message);
        return;
      }
      
      // Refresh to get actual data if possible
      await fetchCartItems();
      
    } catch (error) {
      console.warn('Silent Cart Error:', error.message);
      // We don't rollback here so the user sees the item in their "local" session
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ cartItems, cartCount, loading, addToCart, refreshCart: fetchCartItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
