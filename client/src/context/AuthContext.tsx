import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import axios from 'axios';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  interests?: string[];
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  devLogin: (role?: 'user' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'akira_auth_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Initialize session
  useEffect(() => {
    async function initAuth() {
      // 1. If Supabase is configured, check live session
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Explorer',
              role: (session.user.app_metadata?.role as 'user' | 'admin') || 'user',
              avatarUrl: session.user.user_metadata?.avatar_url,
            });
            setToken(session.access_token);
          }
        } catch (err) {
          console.warn('[AuthContext] Supabase session retrieval error:', err);
        }

        // Listen for Supabase auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Explorer',
              role: (session.user.app_metadata?.role as 'user' | 'admin') || 'user',
              avatarUrl: session.user.user_metadata?.avatar_url,
            });
            setToken(session.access_token);
          } else {
            setUser(null);
            setToken(null);
          }
        });

        setLoading(false);
        return () => subscription.unsubscribe();
      }

      // 2. Fallback to persisted local session for offline development
      const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          setUser(parsed.user);
          setToken(parsed.token);
        } catch (e) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  // Update Axios Authorization header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'Explorer',
          role: (data.user.app_metadata?.role as 'user' | 'admin') || 'user',
        });
        setToken(data.session?.access_token || null);
        closeAuthModal();
        return { success: true };
      }
    }

    // Local development fallback
    const devUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      displayName: email.split('@')[0] || 'AKIRA Explorer',
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    const devToken = `mock_user_${devUser.id}`;
    setUser(devUser);
    setToken(devToken);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: devUser, token: devToken }));
    closeAuthModal();
    return { success: true };
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split('@')[0] },
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          displayName: displayName || data.user.email?.split('@')[0] || 'Explorer',
          role: 'user',
        });
        setToken(data.session?.access_token || null);
        closeAuthModal();
        return { success: true };
      }
    }

    // Local development fallback
    const devUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      displayName: displayName || email.split('@')[0] || 'AKIRA Explorer',
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    const devToken = `mock_user_${devUser.id}`;
    setUser(devUser);
    setToken(devToken);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: devUser, token: devToken }));
    closeAuthModal();
    return { success: true };
  };

  const signOut = async (): Promise<void> => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);

    if (!isSupabaseConfigured) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: updated, token }));
    }

    try {
      await axios.post('/api/auth/profile', data);
    } catch (e) {
      console.warn('[AuthContext] Backend profile update note:', e);
    }
  };

  const devLogin = (role: 'user' | 'admin' = 'user') => {
    const devUser: UserProfile = {
      id: role === 'admin' ? 'admin-101' : 'explorer-202',
      email: role === 'admin' ? 'admin@akira.ai' : 'explorer@akira.ai',
      displayName: role === 'admin' ? 'Lead Admin' : 'Curious Learner',
      role,
      interests: ['technology', 'economy', 'infrastructure'],
      createdAt: new Date().toISOString(),
    };
    const devToken = `mock_user_${devUser.id}`;
    setUser(devUser);
    setToken(devToken);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: devUser, token: devToken }));
    closeAuthModal();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
        updateProfile,
        devLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
