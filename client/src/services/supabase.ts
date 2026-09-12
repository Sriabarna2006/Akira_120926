import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Supabase Browser Client (Anon Key)
 * Safe for client-side usage in the browser.
 * NEVER PUT SERVICE ROLE KEYS IN THIS FILE.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder-akira.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
