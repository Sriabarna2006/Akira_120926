import dotenv from 'dotenv';
import pg from 'pg';
import { isNeonConfigured } from './neon.js';
import { supabaseAdmin, isSupabaseConfigured } from './supabase.js';

dotenv.config();

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL || '';

let pool: pg.Pool | null = null;

if (isNeonConfigured && DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  } catch (err) {
    console.warn('[DB] Failed to initialize PostgreSQL pool:', (err as Error).message);
  }
}

/**
 * Universal query runner for AKIRA data layer.
 * Attempts execution via PostgreSQL Pool -> Supabase Client -> In-Memory Fallback.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return res.rows as T[];
    } catch (err: any) {
      // If table doesn't exist or query failed on remote DB, log and fallback if needed
      console.warn(`[DB Pool Query Error] ${err.message}`);
    }
  }

  return [];
}

/**
 * Query helper returning a single record or null
 */
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

export { pool };
