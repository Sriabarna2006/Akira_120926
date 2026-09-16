-- ==============================================================================
-- AKIRA PHASE 7 MIGRATION: PERSONALIZATION, LEARNING PROGRESS & SPACED REPETITION
-- File: 006_phase7_personalization.sql
-- Description: Creates tables for user learning progress, SM-2 spaced repetition
--              schedules, normalized quiz attempt audit logs, and learning activities.
-- ==============================================================================

-- 1. USER LEARNING PROGRESS (Evidence-based mastery scores per user & concept/event)
CREATE TABLE IF NOT EXISTS public.user_learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id VARCHAR(100) REFERENCES public.concepts(id) ON DELETE CASCADE,
    event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    mastery_score INT NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
    mastery_status VARCHAR(30) NOT NULL DEFAULT 'NEEDS_LEARNING' CHECK (mastery_status IN ('NEEDS_LEARNING', 'DEVELOPING', 'STRONG')),
    attempt_count INT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    correct_count INT NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    incorrect_count INT NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
    last_attempt_at TIMESTAMPTZ,
    last_mastered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_learning_progress_user_event_concept UNIQUE (user_id, event_id, concept_id)
);

-- 2. USER REVIEW SCHEDULES (SM-2 Spaced Repetition Scheduling State)
CREATE TABLE IF NOT EXISTS public.user_review_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id VARCHAR(100) REFERENCES public.concepts(id) ON DELETE CASCADE,
    event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    ease_factor FLOAT NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
    interval_days INT NOT NULL DEFAULT 1 CHECK (interval_days >= 1),
    repetition_count INT NOT NULL DEFAULT 0 CHECK (repetition_count >= 0),
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'LEARNING', 'REVIEW', 'MASTERED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_review_schedule_user_event_concept UNIQUE (user_id, event_id, concept_id)
);

-- 3. USER QUIZ ATTEMPTS (Normalized audit log of quiz submissions for streak & performance tracking)
CREATE TABLE IF NOT EXISTS public.user_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    concept_id VARCHAR(100) REFERENCES public.concepts(id) ON DELETE SET NULL,
    score INT NOT NULL CHECK (score >= 0),
    total_questions INT NOT NULL CHECK (total_questions > 0),
    accuracy FLOAT NOT NULL CHECK (accuracy >= 0.0 AND accuracy <= 1.0),
    score_percentage INT NOT NULL CHECK (score_percentage BETWEEN 0 AND 100),
    mastery_status VARCHAR(30) NOT NULL CHECK (mastery_status IN ('NEEDS_LEARNING', 'DEVELOPING', 'STRONG')),
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. USER LEARNING ACTIVITIES (Lightweight event stream for streaks and time-based analytics)
CREATE TABLE IF NOT EXISTS public.user_learning_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'EVENT_VIEWED',
        'EXPLANATION_VIEWED',
        'CONCEPT_VIEWED',
        'QUIZ_STARTED',
        'QUIZ_COMPLETED',
        'EVENT_SAVED',
        'REVIEW_COMPLETED'
    )),
    event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE SET NULL,
    concept_id VARCHAR(100) REFERENCES public.concepts(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PERFORMANCE INDEXES (Optimized for user dashboard queries, due reviews, and temporal aggregation)
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user ON public.user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user_event ON public.user_learning_progress(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user_concept ON public.user_learning_progress(user_id, concept_id);
CREATE INDEX IF NOT EXISTS idx_user_review_schedules_user_due ON public.user_review_schedules(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_date ON public.user_quiz_attempts(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_learning_activities_user_date ON public.user_learning_activities(user_id, created_at DESC);
