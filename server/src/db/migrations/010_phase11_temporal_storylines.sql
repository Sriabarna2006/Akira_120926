-- ==============================================================================
-- AKIRA DATABASE SCHEMA v2.0
-- Migration: 010_phase11_temporal_storylines.sql
-- Description: Schema for Temporal Storyline Evolution & Narrative Trajectory Layer.
--              Introduces storylines abstraction above canonical events,
--              many-to-many event associations, chronological ordering,
--              turning-point tracking, and delta knowledge updates.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STORYLINES TABLE (Living Real-World Chronological Intelligence Objects)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storylines (
    id VARCHAR(100) PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('EMERGING', 'DEVELOPING', 'ACTIVE', 'STABILIZING', 'CONCLUDED', 'UNKNOWN')),
    region_id VARCHAR(50) REFERENCES public.regions(id) ON DELETE SET NULL,
    primary_category_id VARCHAR(50) REFERENCES public.categories(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE SET NULL,
    trajectory VARCHAR(30) NOT NULL DEFAULT 'DEVELOPING' CHECK (trajectory IN ('ESCALATING', 'DEVELOPING', 'STABLE', 'DE-ESCALATING', 'CONCLUDED', 'UNKNOWN')),
    event_count INT NOT NULL DEFAULT 1,
    turning_point_count INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storylines_status ON public.storylines(status);
CREATE INDEX IF NOT EXISTS idx_storylines_region ON public.storylines(region_id);
CREATE INDEX IF NOT EXISTS idx_storylines_category ON public.storylines(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_storylines_updated ON public.storylines(last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_storylines_trajectory ON public.storylines(trajectory);

-- ------------------------------------------------------------------------------
-- 2. STORYLINE EVENTS JUNCTION (Chronological Multi-Event Connection)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storyline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'DEVELOPMENT' CHECK (relationship_type IN ('ORIGIN', 'DEVELOPMENT', 'DECISION', 'RESPONSE', 'IMPLEMENTATION', 'OUTCOME', 'UPDATE', 'OTHER')),
    sequence_order INT NOT NULL DEFAULT 1,
    event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    association_score INT NOT NULL DEFAULT 100 CHECK (association_score BETWEEN 0 AND 100),
    association_explanation TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_storyline_event UNIQUE (storyline_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_storyline_events_storyline_id ON public.storyline_events(storyline_id);
CREATE INDEX IF NOT EXISTS idx_storyline_events_event_id ON public.storyline_events(event_id);
CREATE INDEX IF NOT EXISTS idx_storyline_events_event_time ON public.storyline_events(event_time ASC);
CREATE INDEX IF NOT EXISTS idx_storyline_events_sequence ON public.storyline_events(storyline_id, sequence_order ASC);

-- ------------------------------------------------------------------------------
-- 3. STORYLINE TURNING POINTS (Major Structural / Status / Outcome Shifts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storyline_turning_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    turning_point_type VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL_DECISION',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_storyline_turning_point UNIQUE (storyline_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_storyline_turning_points_storyline_id ON public.storyline_turning_points(storyline_id);
CREATE INDEX IF NOT EXISTS idx_storyline_turning_points_event_id ON public.storyline_turning_points(event_id);
CREATE INDEX IF NOT EXISTS idx_storyline_turning_points_occurred ON public.storyline_turning_points(occurred_at ASC);

-- ------------------------------------------------------------------------------
-- 4. STORYLINE UPDATES & DELTA KNOWLEDGE RECORDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storyline_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE SET NULL,
    update_type VARCHAR(50) NOT NULL DEFAULT 'NEW_DEVELOPMENT',
    summary TEXT NOT NULL,
    delta_facts JSONB DEFAULT '[]'::jsonb,
    delta_concepts JSONB DEFAULT '[]'::jsonb,
    evidence_shift TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storyline_updates_storyline_id ON public.storyline_updates(storyline_id);
CREATE INDEX IF NOT EXISTS idx_storyline_updates_recorded ON public.storyline_updates(recorded_at DESC);
