-- ==============================================================================
-- AKIRA PHASE 8 MIGRATION: INTELLIGENT DAILY LEARNING & ADAPTIVE PERSONALIZATION
-- File: 007_phase8_adaptive_personalization.sql
-- Description: Creates user learning preferences table and adds performance indexes
--              for personalized discovery feed scoring and daily goal tracking.
-- ==============================================================================

-- 1. USER LEARNING PREFERENCES
CREATE TABLE IF NOT EXISTS public.user_learning_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_goal INT NOT NULL DEFAULT 3 CHECK (daily_goal BETWEEN 1 AND 20),
    preferred_difficulty VARCHAR(30) NOT NULL DEFAULT 'ADAPTIVE' CHECK (preferred_difficulty IN ('ADAPTIVE', 'BEGINNER', 'STUDENT', 'TECHNICAL', 'DEEP_DIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_learning_preferences_user UNIQUE (user_id)
);

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_user_learning_preferences_user ON public.user_learning_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_activities_user_type_date ON public.user_learning_activities(user_id, activity_type, created_at DESC);
