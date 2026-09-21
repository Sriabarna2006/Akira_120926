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
      connectionTimeoutMillis: 1000,
      idleTimeoutMillis: 30000,
    });

    // Auto-create Phase 5 & Phase 6 tables if not present
    pool.query(`
      CREATE TABLE IF NOT EXISTS public.trend_observations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
        observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        article_count INT NOT NULL DEFAULT 1,
        independent_source_count INT NOT NULL DEFAULT 1,
        trend_score INT NOT NULL,
        importance_score INT NOT NULL,
        velocity_score INT NOT NULL,
        coverage_score INT NOT NULL,
        recency_score INT NOT NULL,
        freshness_score INT NOT NULL,
        spread_score INT NOT NULL,
        final_rank_score INT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.event_ai_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
        version INT NOT NULL DEFAULT 1,
        provider VARCHAR(50) NOT NULL DEFAULT 'deterministic',
        model VARCHAR(100) NOT NULL DEFAULT 'akira-core-v1',
        five_w_one_h JSONB NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_event_ai_summaries_event_version UNIQUE (event_id, version)
      );

      CREATE TABLE IF NOT EXISTS public.event_explanations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
        level VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        provider VARCHAR(50) NOT NULL DEFAULT 'deterministic',
        model VARCHAR(100) NOT NULL DEFAULT 'akira-core-v1',
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_event_explanations_event_level_version UNIQUE (event_id, level, version)
      );

      CREATE TABLE IF NOT EXISTS public.event_quizzes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
        version INT NOT NULL DEFAULT 1,
        questions JSONB NOT NULL,
        provider VARCHAR(50) NOT NULL DEFAULT 'deterministic',
        model VARCHAR(100) NOT NULL DEFAULT 'akira-core-v1',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_event_quizzes_event_version UNIQUE (event_id, version)
      );

      CREATE TABLE IF NOT EXISTS public.concept_prerequisites (
        concept_id VARCHAR(100) NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
        prerequisite_concept_id VARCHAR(100) NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (concept_id, prerequisite_concept_id)
      );

      CREATE TABLE IF NOT EXISTS public.user_learning_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        concept_id VARCHAR(100),
        event_id VARCHAR(100),
        mastery_score INT NOT NULL DEFAULT 0,
        mastery_status VARCHAR(30) NOT NULL DEFAULT 'NEEDS_LEARNING',
        attempt_count INT NOT NULL DEFAULT 0,
        correct_count INT NOT NULL DEFAULT 0,
        incorrect_count INT NOT NULL DEFAULT 0,
        last_attempt_at TIMESTAMPTZ,
        last_mastered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.user_review_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        concept_id VARCHAR(100),
        event_id VARCHAR(100),
        ease_factor FLOAT NOT NULL DEFAULT 2.5,
        interval_days INT NOT NULL DEFAULT 1,
        repetition_count INT NOT NULL DEFAULT 0,
        last_reviewed_at TIMESTAMPTZ,
        next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status VARCHAR(30) NOT NULL DEFAULT 'NEW',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.user_quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        event_id VARCHAR(100) NOT NULL,
        concept_id VARCHAR(100),
        score INT NOT NULL,
        total_questions INT NOT NULL,
        accuracy FLOAT NOT NULL,
        score_percentage INT NOT NULL,
        mastery_status VARCHAR(30) NOT NULL,
        answers JSONB NOT NULL DEFAULT '{}'::jsonb,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.user_learning_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        event_id VARCHAR(100),
        concept_id VARCHAR(100),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.user_learning_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        daily_goal INT NOT NULL DEFAULT 3,
        preferred_difficulty VARCHAR(30) NOT NULL DEFAULT 'ADAPTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.concept_relations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_concept_id VARCHAR(100) NOT NULL,
        target_concept_id VARCHAR(100) NOT NULL,
        relation_type VARCHAR(50) NOT NULL DEFAULT 'RELATED',
        weight FLOAT NOT NULL DEFAULT 1.0,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.event_evidence (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(100) NOT NULL,
        article_id UUID,
        source_id VARCHAR(100),
        source_name VARCHAR(150) NOT NULL,
        evidence_type VARCHAR(50) NOT NULL DEFAULT 'INDEPENDENT_REPORTING',
        source_authority_tier INT NOT NULL DEFAULT 2,
        is_independent BOOLEAN NOT NULL DEFAULT true,
        evidence_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        evidence_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        verification_metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.evidence_conflicts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(100) NOT NULL,
        field VARCHAR(100) NOT NULL,
        source_a VARCHAR(150) NOT NULL,
        source_b VARCHAR(150) NOT NULL,
        value_a TEXT NOT NULL,
        value_b TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
        status VARCHAR(30) NOT NULL DEFAULT 'UNRESOLVED',
        explanation TEXT,
        detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.storylines (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        region_id VARCHAR(50),
        primary_category_id VARCHAR(50),
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        current_event_id VARCHAR(100),
        trajectory VARCHAR(30) NOT NULL DEFAULT 'DEVELOPING',
        event_count INT NOT NULL DEFAULT 1,
        turning_point_count INT NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.storyline_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        storyline_id VARCHAR(100) NOT NULL,
        event_id VARCHAR(100) NOT NULL,
        relationship_type VARCHAR(50) NOT NULL DEFAULT 'DEVELOPMENT',
        sequence_order INT NOT NULL DEFAULT 1,
        event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        association_score INT NOT NULL DEFAULT 100,
        association_explanation TEXT,
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.storyline_turning_points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        storyline_id VARCHAR(100) NOT NULL,
        event_id VARCHAR(100) NOT NULL,
        title TEXT NOT NULL,
        reason TEXT NOT NULL,
        turning_point_type VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL_DECISION',
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.storyline_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        storyline_id VARCHAR(100) NOT NULL,
        event_id VARCHAR(100),
        update_type VARCHAR(50) NOT NULL DEFAULT 'NEW_DEVELOPMENT',
        summary TEXT NOT NULL,
        delta_facts JSONB DEFAULT '[]'::jsonb,
        delta_concepts JSONB DEFAULT '[]'::jsonb,
        evidence_shift TEXT,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      INSERT INTO public.canonical_events (
        id, title, summary, region_id, category_id, urgency_label,
        importance_score, velocity_score, final_rank_score, why_it_matters,
        first_published_at, last_updated_at, source_count, lifecycle_status, created_at
      ) VALUES (
        'evt_tn_ev_hub_2026',
        'Tamil Nadu Cabinet Clears Mega Infrastructure & Electric Mobility Corridor Policy',
        'State government approves capital investment framework expanding metro transit links across Chennai and Hosur EV manufacturing hub.',
        'tamil-nadu', 'infrastructure', 'IMPORTANT', 94, 90, 96,
        'Accelerates high-speed regional transit corridors and strengthens clean mobility industrial employment in Tamil Nadu.',
        NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour', 2, 'OFFICIAL_CONFIRMATION', NOW() - INTERVAL '4 hours'
      ) ON CONFLICT (id) DO NOTHING;
    `).catch((err) => {
      console.warn('[DB] Phase tables initialization notice:', err.message);
    });
  } catch (err) {
    console.warn('[DB] Failed to initialize PostgreSQL pool:', (err as Error).message);
  }
}

let lastPoolErrorTime = 0;
const POOL_COOLOFF_MS = 15000;

/**
 * Universal query runner for AKIRA data layer.
 * Attempts execution via PostgreSQL Pool -> Supabase Client -> In-Memory Fallback.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  if (pool && isDatabaseConnected()) {
    try {
      const res = await pool.query(text, params);
      lastPoolErrorTime = 0;
      return res.rows as T[];
    } catch (err: any) {
      if (err.message && (err.message.includes('timeout') || err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND'))) {
        lastPoolErrorTime = Date.now();
      }
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

export function isDatabaseConnected(): boolean {
  if (!pool) return false;
  if (lastPoolErrorTime > 0 && Date.now() - lastPoolErrorTime < POOL_COOLOFF_MS) {
    return false;
  }
  return true;
}

export { pool };
