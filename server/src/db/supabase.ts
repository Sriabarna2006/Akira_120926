import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)
);

/**
 * Supabase Admin Client (Service Role)
 * Used exclusively on the backend for privileged database operations,
 * background ingestion, and automated sync jobs.
 * NEVER EXPOSE THIS KEY TO THE BROWSER.
 */
export const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Supabase Public Client (Anon Role)
 * Used on the backend for user-scoped authentication verification.
 */
export const supabasePublic: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY)
  : null;

export interface DatabaseHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  latencyMs: number;
  tablesFound?: string[];
  message: string;
  timestamp: string;
}

/**
 * Verifies live database connectivity and table accessibility.
 */
export async function checkDatabaseConnection(): Promise<DatabaseHealthStatus> {
  const timestamp = new Date().toISOString();

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return {
      isConfigured: false,
      isConnected: false,
      latencyMs: 0,
      message: 'Supabase credentials are not configured in .env (Running in development fallback mode).',
      timestamp,
    };
  }

  const startTime = Date.now();
  try {
    // Attempt a light query to check connection
    const { data, error } = await supabaseAdmin
      .from('regions')
      .select('id, name')
      .limit(3);

    const latencyMs = Date.now() - startTime;

    if (error) {
      // If table doesn't exist yet, it's connected but migrations need to be applied
      if (error.code === '42P01') {
        return {
          isConfigured: true,
          isConnected: true,
          latencyMs,
          message: 'Connected to Supabase PostgreSQL, but schema migrations have not been applied yet.',
          timestamp,
        };
      }
      return {
        isConfigured: true,
        isConnected: false,
        latencyMs,
        message: `Database query error: ${error.message}`,
        timestamp,
      };
    }

    return {
      isConfigured: true,
      isConnected: true,
      latencyMs,
      tablesFound: ['regions', ...(data ? ['records_accessible'] : [])],
      message: 'Successfully connected to Supabase PostgreSQL database.',
      timestamp,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return {
      isConfigured: true,
      isConnected: false,
      latencyMs,
      message: `Failed to connect to database: ${(err as Error).message}`,
      timestamp,
    };
  }
}
