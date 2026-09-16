-- ==============================================================================
-- AKIRA PHASE 6 MIGRATION: AI INTELLIGENCE & UNDERSTANDING LAYER
-- File: 005_phase6_ai_understanding.sql
-- Description: Creates tables for 5W1H summaries, multi-level explanations,
--              active recall quizzes, and concept prerequisites.
-- ==============================================================================

-- 1. EVENT AI SUMMARIES (5W1H Structured Analysis)
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

-- 2. EVENT EXPLANATIONS (5 Adaptive Difficulty Levels)
CREATE TABLE IF NOT EXISTS public.event_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL CHECK (level IN ('verySimple', 'beginner', 'student', 'technical', 'deepDive')),
    content TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'deterministic',
    model VARCHAR(100) NOT NULL DEFAULT 'akira-core-v1',
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_explanations_event_level_version UNIQUE (event_id, level, version)
);

-- 3. EVENT QUIZZES (3 Active Recall Multiple Choice Questions)
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

-- 4. CONCEPT PREREQUISITES (Knowledge Graph Dependency Edges)
CREATE TABLE IF NOT EXISTS public.concept_prerequisites (
    concept_id VARCHAR(100) NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    prerequisite_concept_id VARCHAR(100) NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (concept_id, prerequisite_concept_id)
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_event_ai_summaries_event ON public.event_ai_summaries(event_id);
CREATE INDEX IF NOT EXISTS idx_event_explanations_event ON public.event_explanations(event_id, level);
CREATE INDEX IF NOT EXISTS idx_event_quizzes_event ON public.event_quizzes(event_id);
CREATE INDEX IF NOT EXISTS idx_concept_prereq_concept ON public.concept_prerequisites(concept_id);
