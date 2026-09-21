-- AKIRA Database Migration: Phase 12 Living Storyline Catch-Up Briefings & Chronological Synthesis Engine
-- Creates tables for caching consolidated catch-up briefings and tracking user storyline progress.

-- 1. Storyline Catch-Up Briefings Cache Table
CREATE TABLE IF NOT EXISTS public.storyline_catchup_briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    user_id UUID,
    last_seen_event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE SET NULL,
    briefing_json JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index for user-specific briefing or generic briefing (when user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_storyline_catchup_user_briefing 
    ON public.storyline_catchup_briefings (storyline_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS idx_catchup_briefings_storyline ON public.storyline_catchup_briefings (storyline_id);
CREATE INDEX IF NOT EXISTS idx_catchup_briefings_user ON public.storyline_catchup_briefings (user_id);
CREATE INDEX IF NOT EXISTS idx_catchup_briefings_expires ON public.storyline_catchup_briefings (expires_at);

-- 2. User Storyline Progress Tracking Table
CREATE TABLE IF NOT EXISTS public.user_storyline_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    last_seen_event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE SET NULL,
    reviewed_event_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_fully_caught_up BOOLEAN NOT NULL DEFAULT false,
    last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_storyline_progress UNIQUE (user_id, storyline_id)
);

CREATE INDEX IF NOT EXISTS idx_user_storyline_progress_user ON public.user_storyline_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_storyline_progress_storyline ON public.user_storyline_progress (storyline_id);
