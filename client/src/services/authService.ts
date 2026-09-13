import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile } from '../types';

const LOCAL_STORAGE_KEY = 'akira_auth_session';

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export const authService = {
  isConfigured: isSupabaseConfigured,

  async getInitialSession(): Promise<{ user: UserProfile | null; token: string | null }> {
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Explorer',
            role: (session.user.app_metadata?.role as 'user' | 'admin') || 'user',
            avatarUrl: session.user.user_metadata?.avatar_url,
          };
          return { user: profile, token: session.access_token };
        }
      } catch (err) {
        console.warn('[authService] Supabase session retrieval error:', err);
      }
    }

    // Fallback local session
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { user: parsed.user, token: parsed.token };
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
    return { user: null, token: null };
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
          displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'Explorer',
          role: (data.user.app_metadata?.role as 'user' | 'admin') || 'user',
        };
        return { success: true, user: profile };
      }
    }

    // Dev fallback
    const devUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      displayName: email.split('@')[0] || 'AKIRA Explorer',
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    const devToken = `mock_user_${devUser.id}`;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: devUser, token: devToken }));
    return { success: true, user: devUser };
  },

  async signUp(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || email.split('@')[0] } },
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
          displayName: displayName || data.user.email?.split('@')[0] || 'Explorer',
          role: 'user',
        };
        return { success: true, user: profile };
      }
    }

    // Dev fallback
    const devUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      displayName: displayName || email.split('@')[0] || 'AKIRA Explorer',
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    const devToken = `mock_user_${devUser.id}`;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: devUser, token: devToken }));
    return { success: true, user: devUser };
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
};
