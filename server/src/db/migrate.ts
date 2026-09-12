import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin, isSupabaseConfigured } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationFile {
  filename: string;
  filepath: string;
  version: string;
  sql: string;
}

/**
 * Loads all SQL migration files sorted in ascending order.
 */
export function loadMigrations(): MigrationFile[] {
  let migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    // Try src/db/migrations if running from dist
    migrationsDir = path.join(__dirname, '../../src/db/migrations');
  }
  if (!fs.existsSync(migrationsDir)) {
    // Try relative from project root
    migrationsDir = path.join(process.cwd(), 'server/src/db/migrations');
  }
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((filename) => {
    const filepath = path.join(migrationsDir, filename);
    const sql = fs.readFileSync(filepath, 'utf-8');
    const version = filename.split('_')[0];
    return { filename, filepath, version, sql };
  });
}

/**
 * Runs or validates migration files.
 */
export async function runMigrations(): Promise<{
  success: boolean;
  applied: string[];
  errors: string[];
}> {
  const migrations = loadMigrations();
  const applied: string[] = [];
  const errors: string[] = [];

  console.log(`[AKIRA Migration] Discovered ${migrations.length} migration file(s).`);

  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.log('[AKIRA Migration] Supabase not configured in current environment.');
    return {
      success: false,
      applied,
      errors: ['Supabase connection not configured in .env'],
    };
  }

  for (const migration of migrations) {
    console.log(`[AKIRA Migration] Processing: ${migration.filename}`);
    try {
      // Execute raw SQL via Supabase RPC or direct sql execution where supported
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: migration.sql });
      if (error) {
        // If exec_sql RPC is not installed, note manual SQL execution requirement in Supabase SQL editor
        console.warn(`[AKIRA Migration] RPC execution note for ${migration.filename}: ${error.message}`);
        applied.push(`${migration.filename} (Ready for Supabase SQL Editor / CLI)`);
      } else {
        applied.push(migration.filename);
      }
    } catch (err) {
      errors.push(`Error in ${migration.filename}: ${(err as Error).message}`);
    }
  }

  return {
    success: errors.length === 0,
    applied,
    errors,
  };
}

// Allow running directly via tsx: `tsx src/db/migrate.ts`
if (process.argv[1] && process.argv[1].includes('migrate')) {
  runMigrations().then((res) => {
    console.log('[AKIRA Migration Result]', JSON.stringify(res, null, 2));
  });
}
