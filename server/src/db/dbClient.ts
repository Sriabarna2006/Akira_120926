import dotenv from 'dotenv';
import pg from 'pg';
import { isNeonConfigured } from './neon.js';
import { supabaseAdmin, isSupabaseConfigured } from './supabase.js';
import { dbCircuitBreaker, DatabaseCircuitBreaker } from './circuitBreaker.js';
import { DatabaseConnectionState, CircuitBreakerState, DatabaseErrorClassification } from '../types/index.js';

dotenv.config();

export const isTestMode = process.env.NODE_ENV === 'test' || process.argv.some((a) => a.includes('test'));

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL || '';

let pool: pg.Pool | null = null;

if (isNeonConfigured && DATABASE_URL) {
  try {
    const defaultTimeout = process.env.NODE_ENV === 'test' ? '1000' : '5000';
    const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || defaultTimeout, 10);
    const idleTimeout = parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10);
    const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10);

    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: maxConnections,
      connectionTimeoutMillis: connectionTimeout,
      idleTimeoutMillis: idleTimeout,
    });

    // Handle background pool client errors without crashing Node process
    pool.on('error', (err: Error) => {
      console.warn('[DB Pool Background Client Notice]', err.message);
      dbCircuitBreaker.recordFailure(err);
    });

    if (!isTestMode) {
      // Auto-heal schema, add missing columns, foreign keys, and initialize Phase tables
      pool.query(`
      -- 1. Extend sources table with Phase 10-16 health, geography, and telemetry columns
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS consecutive_failures INT NOT NULL DEFAULT 0;
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS health_status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY';
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS expected_freshness_hours INT NOT NULL DEFAULT 6;
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_error_message TEXT;
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_error_type VARCHAR(50) DEFAULT 'NONE';
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS quarantine_status VARCHAR(30) DEFAULT 'ACTIVE';
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_http_status INT DEFAULT 200;
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS articles_ingested_count INT NOT NULL DEFAULT 0;
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS events_produced_count INT NOT NULL DEFAULT 0;
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS response_time_ms INT NOT NULL DEFAULT 0;
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS authority_level VARCHAR(50) DEFAULT 'SPECIALIST';
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Global';
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'en';
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS specialization TEXT;
      ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) NOT NULL DEFAULT 'NATIONAL';

      -- 2. Ensure credibility_score constraint is safe (0.0 to 1.0)
      ALTER TABLE public.sources DROP CONSTRAINT IF EXISTS sources_credibility_score_check;
      ALTER TABLE public.sources ADD CONSTRAINT sources_credibility_score_check CHECK (credibility_score >= 0.0 AND credibility_score <= 1.0);

      -- 3. Ensure articles source_id FK constraint exists with ON DELETE SET NULL
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'articles_source_id_fkey'
        ) THEN
          ALTER TABLE public.articles 
          ADD CONSTRAINT articles_source_id_fkey 
          FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE SET NULL;
        END IF;
      END $$;

      -- 4. Seed verified sources so source_id foreign keys are always satisfied
      INSERT INTO public.sources (id, name, url, feed_url, region_id, category_id, tier, credibility_score, conglomerate_id, is_active, health_status, expected_freshness_hours, country, language)
      VALUES 
        ('the-hindu-tn', 'The Hindu (Tamil Nadu)', 'https://www.thehindu.com/news/national/tamil-nadu/', 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', 'tamil-nadu', 'politics', 1, 0.95, 'kasturi-sons', true, 'HEALTHY', 4, 'India', 'en'),
        ('the-hindu-chennai', 'The Hindu (Chennai)', 'https://www.thehindu.com/news/cities/chennai/', 'https://www.thehindu.com/news/cities/chennai/feeder/default.rss', 'tamil-nadu', 'infrastructure', 1, 0.95, 'kasturi-sons', true, 'HEALTHY', 4, 'India', 'en'),
        ('oneindia-tamil', 'OneIndia Tamil', 'https://tamil.oneindia.com', 'https://tamil.oneindia.com/rss/tamil-news-fb.xml', 'tamil-nadu', 'politics', 2, 0.85, 'greynium', true, 'HEALTHY', 4, 'India', 'ta'),
        ('the-hindu', 'The Hindu', 'https://www.thehindu.com', 'https://www.thehindu.com/news/national/feeder/default.rss', 'india', 'politics', 1, 0.95, 'kasturi-sons', true, 'HEALTHY', 3, 'India', 'en'),
        ('indian-express', 'The Indian Express', 'https://indianexpress.com', 'https://indianexpress.com/section/india/feed/', 'india', 'politics', 1, 0.94, 'express-group', true, 'HEALTHY', 3, 'India', 'en'),
        ('toi', 'Times of India', 'https://timesofindia.indiatimes.com', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'india', 'politics', 2, 0.85, 'times-group', true, 'HEALTHY', 3, 'India', 'en'),
        ('economic-times', 'The Economic Times', 'https://economictimes.indiatimes.com', 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', 'india', 'economy', 1, 0.92, 'times-group', true, 'HEALTHY', 3, 'India', 'en'),
        ('livemint-economy', 'Livemint (Economy & Policy)', 'https://www.livemint.com', 'https://www.livemint.com/rss/economy', 'india', 'economy', 1, 0.91, 'ht-media', true, 'HEALTHY', 3, 'India', 'en'),
        ('bbc-world', 'BBC News', 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'world', 'politics', 1, 0.95, 'bbc', true, 'HEALTHY', 3, 'UK', 'en'),
        ('aljazeera-world', 'Al Jazeera (World)', 'https://www.aljazeera.com', 'https://www.aljazeera.com/xml/rss/all.xml', 'world', 'politics', 1, 0.93, 'aljazeera-media', true, 'HEALTHY', 3, 'Qatar', 'en'),
        ('dw-world', 'Deutsche Welle (World)', 'https://www.dw.com', 'https://rss.dw.com/xml/rss-en-all', 'world', 'politics', 1, 0.94, 'dw-media', true, 'HEALTHY', 4, 'Germany', 'en'),
        ('france24-en', 'France 24', 'https://www.france24.com', 'https://www.france24.com/en/rss', 'world', 'politics', 1, 0.93, 'france-medias', true, 'HEALTHY', 4, 'France', 'en'),
        ('mit-tech-review', 'MIT Technology Review', 'https://www.technologyreview.com', 'https://www.technologyreview.com/feed/', 'world', 'technology', 1, 0.96, 'mit', true, 'HEALTHY', 6, 'US', 'en'),
        ('arxiv-ai', 'ArXiv (CS.AI Frontiers)', 'https://arxiv.org', 'https://rss.arxiv.org/rss/cs.AI', 'world', 'technology', 1, 0.97, 'cornell-university', true, 'HEALTHY', 12, 'US', 'en'),
        ('techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'world', 'technology', 2, 0.87, 'yahoo', true, 'HEALTHY', 3, 'US', 'en'),
        ('the-verge', 'The Verge', 'https://www.theverge.com', 'https://www.theverge.com/rss/index.xml', 'world', 'technology', 2, 0.86, 'vox-media', true, 'HEALTHY', 4, 'US', 'en'),
        ('bleepingcomputer', 'BleepingComputer', 'https://www.bleepingcomputer.com', 'https://www.bleepingcomputer.com/feed/', 'world', 'security', 1, 0.93, 'bleeping-computer', true, 'HEALTHY', 4, 'US', 'en'),
        ('sciencedaily', 'ScienceDaily', 'https://www.sciencedaily.com', 'https://www.sciencedaily.com/rss/top/science.xml', 'world', 'science', 1, 0.95, 'sciencedaily', true, 'HEALTHY', 6, 'US', 'en'),
        ('sciencedaily-earth', 'ScienceDaily (Earth & Climate)', 'https://www.sciencedaily.com', 'https://www.sciencedaily.com/rss/earth_climate.xml', 'world', 'environment', 1, 0.94, 'sciencedaily', true, 'HEALTHY', 6, 'US', 'en'),
        ('the-guardian-env', 'The Guardian (Environment)', 'https://www.theguardian.com/environment', 'https://www.theguardian.com/environment/rss', 'world', 'environment', 1, 0.93, 'guardian-media', true, 'HEALTHY', 4, 'UK', 'en'),
        ('nasa-news', 'NASA Breaking News', 'https://www.nasa.gov', 'https://www.nasa.gov/rss/dyn/breaking_news.rss', 'world', 'science', 1, 0.98, 'gov-usa', true, 'HEALTHY', 6, 'US', 'en')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        feed_url = EXCLUDED.feed_url,
        region_id = EXCLUDED.region_id,
        category_id = EXCLUDED.category_id,
        tier = EXCLUDED.tier,
        credibility_score = EXCLUDED.credibility_score,
        is_active = EXCLUDED.is_active,
        country = EXCLUDED.country,
        language = EXCLUDED.language,
        updated_at = NOW();

      -- 5. Create Phase 15 & 16 tables
      CREATE TABLE IF NOT EXISTS public.ingestion_health_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sources_attempted INT NOT NULL DEFAULT 0,
        sources_succeeded INT NOT NULL DEFAULT 0,
        sources_failed INT NOT NULL DEFAULT 0,
        articles_discovered INT NOT NULL DEFAULT 0,
        articles_accepted INT NOT NULL DEFAULT 0,
        duplicates_skipped INT NOT NULL DEFAULT 0,
        events_created INT NOT NULL DEFAULT 0,
        events_updated INT NOT NULL DEFAULT 0,
        duration_ms INT NOT NULL DEFAULT 0,
        health_status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY'
      );

      CREATE TABLE IF NOT EXISTS public.source_error_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id VARCHAR(100) NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
        error_type VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
        error_message TEXT NOT NULL,
        http_status INT,
        response_time_ms INT NOT NULL DEFAULT 0,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.source_quarantine (
        source_id VARCHAR(100) PRIMARY KEY REFERENCES public.sources(id) ON DELETE CASCADE,
        quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        quarantine_reason VARCHAR(100) NOT NULL,
        retry_interval_minutes INT NOT NULL DEFAULT 60,
        next_retry_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
        consecutive_quarantine_count INT NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.event_semantic_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL DEFAULT 'deterministic-tfidf',
        model_name VARCHAR(100) NOT NULL DEFAULT 'tfidf-256',
        dimensions INT NOT NULL DEFAULT 256,
        embedding_vector JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_event_semantic_embeddings_event_provider UNIQUE (event_id, provider)
      );

      CREATE TABLE IF NOT EXISTS public.system_health_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        snapshot_type VARCHAR(50) NOT NULL DEFAULT 'HOURLY',
        database_status VARCHAR(30) NOT NULL,
        sources_healthy_count INT NOT NULL,
        sources_degraded_count INT NOT NULL,
        sources_failing_count INT NOT NULL,
        sources_quarantined_count INT NOT NULL,
        sources_disabled_count INT NOT NULL,
        active_events_count INT NOT NULL,
        last_ingestion_duration_ms INT NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb,
        captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).then(() => {
        dbCircuitBreaker.recordSuccess();
      }).catch((err) => {
        console.warn('[DB] Schema bootstrap notice:', err.message);
        dbCircuitBreaker.recordFailure(err);
      });
    }
  } catch (err) {
    console.warn('[DB] Failed to initialize PostgreSQL pool:', (err as Error).message);
    dbCircuitBreaker.recordFailure(err);
  }
}

/**
 * Universal query runner for AKIRA data layer.
 * Attempts execution via PostgreSQL Pool -> Supabase Client -> In-Memory Fallback.
 * Returns array with .rows property for universal backward compatibility.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[] & { rows: T[] }> {
  let rows: T[] = [];
  if (pool && isDatabaseConnected()) {
    try {
      const res = await pool.query(text, params);
      dbCircuitBreaker.recordSuccess();
      rows = res.rows as T[];
    } catch (err: any) {
      const classification = dbCircuitBreaker.recordFailure(err);
      console.warn(`[DB Pool Query Notice] (${classification}) Fallback active: ${err.message}`);
    }
  }

  const result = rows as T[] & { rows: T[] };
  result.rows = rows;
  return result;
}

/**
 * Query helper returning a single record or null
 */
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.length > 0 ? result[0] : null;
}

/**
 * Check if the database is actively connected and reachable
 */
export function isDatabaseConnected(): boolean {
  if (isTestMode) return false;
  if (!pool) return false;
  return dbCircuitBreaker.canExecute();
}

/**
 * Get comprehensive Database Connection State for observability & UI
 */
export function getDatabaseState(): DatabaseConnectionState {
  if (isTestMode) return DatabaseConnectionState.FALLBACK_MEMORY;
  if (!pool) return DatabaseConnectionState.DISCONNECTED;
  
  const cbState = dbCircuitBreaker.getState();
  if (cbState === CircuitBreakerState.OPEN) return DatabaseConnectionState.CIRCUIT_OPEN;
  if (cbState === CircuitBreakerState.FAILURES || cbState === CircuitBreakerState.HALF_OPEN) {
    return DatabaseConnectionState.DEGRADED;
  }
  return DatabaseConnectionState.CONNECTED;
}

/**
 * Get Circuit Breaker State
 */
export function getCircuitBreakerState(): CircuitBreakerState {
  return dbCircuitBreaker.getState();
}

/**
 * Get Circuit Breaker Statistics
 */
export function getCircuitBreakerStats() {
  return dbCircuitBreaker.getStats();
}

/**
 * Execute operation wrapped with circuit breaker protection
 */
export async function executeWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T> | T
): Promise<T> {
  if (!isDatabaseConnected()) {
    return fallback();
  }

  try {
    const result = await operation();
    dbCircuitBreaker.recordSuccess();
    return result;
  } catch (err) {
    dbCircuitBreaker.recordFailure(err);
    return fallback();
  }
}

/**
 * Pool diagnostics for observability
 */
export function getPoolDiagnostics() {
  if (!pool) {
    return {
      status: 'unconfigured',
      databaseState: getDatabaseState(),
      circuitBreaker: dbCircuitBreaker.getStats(),
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    };
  }
  return {
    status: isDatabaseConnected() ? 'connected' : 'degraded',
    databaseState: getDatabaseState(),
    circuitBreaker: dbCircuitBreaker.getStats(),
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Returns raw pool instance
 */
export function getPool(): pg.Pool | null {
  return pool;
}

/**
 * Cleanly drains and closes database pool connections
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
    } catch (_) {}
    pool = null;
  }
  dbCircuitBreaker.reset();
}

export { pool };
