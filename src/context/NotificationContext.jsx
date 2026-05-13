import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Deduplication: Track processed notification IDs
  const processedIds = useRef(new Set());
  // Realtime channel reference
  const channelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Get latest 50

      if (error) throw error;

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
        data.forEach(n => processedIds.current.add(n.id));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Basic Retry Logic
      setTimeout(fetchNotifications, 5000); 
    } finally {
      setLoading(false);
    }
  }, [user]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return;

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`notifications:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new;
          // Deduplication check
          if (!processedIds.current.has(newNotif.id)) {
            processedIds.current.add(newNotif.id);
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // System level push or alert here if necessary
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotif = payload.new;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotif.id ? updatedNotif : n)
          );
          // Recompute unread count safely
          setNotifications(currentNotifs => {
            const newNotifs = currentNotifs.map(n => n.id === updatedNotif.id ? updatedNotif : n);
            setUnreadCount(newNotifs.filter(n => !n.is_read).length);
            return newNotifs;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected: Notifications');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log('Realtime disconnected/error. Reconnecting...');
          setTimeout(setupRealtimeSubscription, 5000); // Retry reconnect
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    let unsubscribe;
    if (user) {
      fetchNotifications();
      unsubscribe = setupRealtimeSubscription();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      processedIds.current.clear();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, fetchNotifications, setupRealtimeSubscription]);

  const markAsRead = async (id) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) throw error;
    } catch (err) {
      console.error('Failed to mark read', err);
      // Revert on failure
      fetchNotifications(); 
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to mark all read', err);
      fetchNotifications();
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
