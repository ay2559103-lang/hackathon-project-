import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../../utils/supabase/client';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setSessionInfo(session ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setSessionInfo(session ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile might not exist yet for new OTP users - create one
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser();
          const newProfile = {
            id: userId,
            full_name: userData?.user?.user_metadata?.full_name || '',
            role: userData?.user?.user_metadata?.role || 'customer',
            phone: userData?.user?.phone || '',
            email: userData?.user?.email || '',
          };

          const { data: created, error: createError } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' })
            .select()
            .single();

          if (!createError && created) {
            setProfile(created);
          } else {
            // If profile table doesn't exist or create fails, use metadata
            setProfile({
              id: userId,
              role: userData?.user?.user_metadata?.role || 'customer',
              full_name: userData?.user?.user_metadata?.full_name || '',
              phone: userData?.user?.phone || '',
            });
          }
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      // Fallback - set basic profile from user metadata
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          setProfile({
            id: userId,
            role: userData.user.user_metadata?.role || 'customer',
            full_name: userData.user.user_metadata?.full_name || '',
            phone: userData.user.phone || '',
          });
        }
      } catch (e) {
        // Final fallback
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = useCallback(async () => {
    try {
      // Revoke custom session if exists
      if (sessionInfo) {
        await supabase.rpc('revoke_auth_session', {
          p_session_id: sessionInfo.access_token,
          p_reason: 'user_logout',
        }).catch(() => {});
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
      // Force sign out even on error
      await supabase.auth.signOut();
    }
  }, [sessionInfo]);

  const signIn = async (credentials) => {
    if (credentials.email) {
      return await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
    } else if (credentials.phone) {
      return await supabase.auth.signInWithPassword({
        phone: credentials.phone,
        password: credentials.password,
      });
    }
    return { error: new Error('Please provide either email or phone') };
  };

  const signUp = async (credentials) => {
    if (credentials.email) {
      return await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: credentials.options,
      });
    } else if (credentials.phone) {
      return await supabase.auth.signUp({
        phone: credentials.phone,
        password: credentials.password,
        options: credentials.options,
      });
    }
    return { error: new Error('Please provide either email or phone') };
  };

  // OTP-specific sign in (used by OTPAuth component)
  const signInWithOTP = async (phone) => {
    return await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: true },
    });
  };

  const verifyOTP = async (phone, token) => {
    return await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }
    return { data, error };
  };

  // Refresh session
  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data?.session) {
      setSessionInfo(data.session);
    }
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      sessionInfo,
      signOut,
      signIn,
      signUp,
      signInWithOTP,
      verifyOTP,
      updateProfile,
      refreshSession,
      setMockUser: (mockUser, mockProfile) => {
        setUser(mockUser);
        setProfile(mockProfile || { 
          id: mockUser.id, 
          role: mockUser.user_metadata?.role || 'customer',
          full_name: mockUser.user_metadata?.full_name || 'Debug User'
        });
        setLoading(false);
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
