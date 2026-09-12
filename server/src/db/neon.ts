import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || '';

export const isNeonConfigured = Boolean(
  DATABASE_URL && (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://'))
);

/**
 * Neon DB HTTP Query Executor (Works across Serverless, Edge, and Node.js over HTTPS port 443)
 */
export const sql: NeonQueryFunction<false, false> | null = isNeonConfigured
  ? neon(DATABASE_URL)
  : null;

export interface NeonHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  latencyMs: number;
  tablesFound?: string[];
  message: string;
  timestamp: string;
}

/**
 * Health check to verify Neon DB connectivity over secure HTTPS
 */
export async function checkNeonConnection(): Promise<NeonHealthStatus> {
  const timestamp = new Date().toISOString();

  if (!isNeonConfigured || !sql) {
    return {
      isConfigured: false,
      isConnected: false,
      latencyMs: 0,
      message: 'Neon DATABASE_URL is not configured in .env (Running in development fallback mode).',
      timestamp,
    };
  }

  const startTime = Date.now();
  try {
    const rows = (await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `) as { table_name: string }[];

    const latencyMs = Date.now() - startTime;
    const tables = rows.map((r) => r.table_name);

    return {
      isConfigured: true,
      isConnected: true,
      latencyMs,
      tablesFound: tables,
      message: tables.includes('canonical_events') || tables.includes('regions')
        ? `Connected to Neon PostgreSQL (${tables.length} tables active).`
        : 'Connected to Neon PostgreSQL, but tables have not been created yet.',
      timestamp,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      isConfigured: true,
      isConnected: false,
      latencyMs,
      message: `Failed to connect to Neon DB: ${err.message}`,
      timestamp,
    };
  }
}

/**
 * Automatically executes the neon_schema.sql to initialize all tables and seed data
 */
export async function runNeonMigrations(): Promise<{ success: boolean; message: string; appliedTables: string[] }> {
  if (!isNeonConfigured || !sql) {
    return {
      success: false,
      message: 'Neon DATABASE_URL is not configured in .env',
      appliedTables: [],
    };
  }

  const schemaPath = path.resolve(__dirname, 'migrations', 'neon_schema.sql');
  if (!fs.existsSync(schemaPath)) {
    return {
      success: false,
      message: `Schema file not found at ${schemaPath}`,
      appliedTables: [],
    };
  }

  const rawSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    // Strip single-line comments and clean SQL
    const cleanSql = rawSql
      .replace(/--.*$/gm, '')
      .replace(/\r\n/g, '\n');

    // Split by semicolons
    const statements = cleanSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      if (stmt) {
        await (sql as any).query(stmt);
      }
    }

    const tablesRes = (await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `) as { table_name: string }[];

    const tables = tablesRes.map((r) => r.table_name);

    return {
      success: true,
      message: `Successfully executed neon_schema.sql on Neon DB!`,
      appliedTables: tables,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Neon Migration Error: ${err.message}`,
      appliedTables: [],
    };
  }
}
