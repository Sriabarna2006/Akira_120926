-- ==============================================================================
-- AKIRA PHASE 5 MIGRATION: TREND DETECTION & RANKING OBSERVATIONS
-- File: 004_phase5_ranking.sql
-- Description: Creates the trend_observations table for velocity tracking,
--              adds ranking indexes, and ensures score persistence support.
-- ==============================================================================

-- 1. TREND OBSERVATIONS TABLE (Historical Snapshot Series)
CREATE TABLE IF NOT EXISTS public.trend_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    article_count INT NOT NULL DEFAULT 1,
    independent_source_count INT NOT NULL DEFAULT 1,
    trend_score INT NOT NULL CHECK (trend_score BETWEEN 0 AND 100),
    importance_score INT NOT NULL CHECK (importance_score BETWEEN 0 AND 100),
    velocity_score INT NOT NULL CHECK (velocity_score BETWEEN 0 AND 100),
    coverage_score INT NOT NULL CHECK (coverage_score BETWEEN 0 AND 100),
    recency_score INT NOT NULL CHECK (recency_score BETWEEN 0 AND 100),
    freshness_score INT NOT NULL CHECK (freshness_score BETWEEN 0 AND 100),
    spread_score INT NOT NULL CHECK (spread_score BETWEEN 0 AND 100),
    final_rank_score INT NOT NULL CHECK (final_rank_score BETWEEN 0 AND 100)
);

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_trend_observations_event ON public.trend_observations(event_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_observations_time ON public.trend_observations(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_canonical_events_final_rank ON public.canonical_events(final_rank_score DESC, last_updated_at DESC);
