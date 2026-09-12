-- ==============================================================================
-- AKIRA DATABASE SCHEMA v1.1
-- Migration: 001_initial_schema.sql
-- Description: Core schema for canonical events, sources, regions, categories,
--              knowledge concepts, and user learning/personalization tables.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. REGIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.regions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    tier INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(50),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. SOURCES (Publishers, Wires, and Media Outlets)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sources (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    url TEXT NOT NULL,
    feed_url TEXT,
    region_id VARCHAR(50) REFERENCES public.regions(id) ON DELETE SET NULL,
    category_id VARCHAR(50) REFERENCES public.categories(id) ON DELETE SET NULL,
    tier INT NOT NULL DEFAULT 2 CHECK (tier IN (1, 2, 3)),
    credibility_score FLOAT NOT NULL DEFAULT 0.85 CHECK (credibility_score >= 0.0 AND credibility_score <= 1.0),
    conglomerate_id VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_successful_fetch TIMESTAMPTZ,
    last_failed_fetch TIMESTAMPTZ,
    failure_count INT NOT NULL DEFAULT 0,
    update_frequency_minutes INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. CANONICAL EVENTS (Core Aggregated Intelligence Object)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.canonical_events (
    id VARCHAR(100) PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    region_id VARCHAR(50) REFERENCES public.regions(id) ON DELETE SET NULL,
    category_id VARCHAR(50) REFERENCES public.categories(id) ON DELETE SET NULL,
    urgency_label VARCHAR(30) NOT NULL DEFAULT 'IMPORTANT' CHECK (urgency_label IN ('BREAKING', 'TRENDING', 'IMPORTANT')),
    importance_score INT NOT NULL DEFAULT 70 CHECK (importance_score BETWEEN 0 AND 100),
    velocity_score INT NOT NULL DEFAULT 50 CHECK (velocity_score BETWEEN 0 AND 100),
    final_rank_score INT NOT NULL DEFAULT 60 CHECK (final_rank_score BETWEEN 0 AND 100),
    why_it_matters TEXT,
    first_published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_count INT NOT NULL DEFAULT 1,
    lifecycle_status VARCHAR(50) NOT NULL DEFAULT 'INITIAL_REPORT' CHECK (lifecycle_status IN ('INITIAL_REPORT', 'NEW_DEVELOPMENT', 'OFFICIAL_CONFIRMATION', 'FOLLOW_UP', 'RESOLVED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Canonical Events View Alias
CREATE OR REPLACE VIEW public.events AS SELECT * FROM public.canonical_events;

-- ------------------------------------------------------------------------------
-- 6. EVENT SOURCES (Corroborating Outlets per Canonical Event)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    source_id VARCHAR(100) REFERENCES public.sources(id) ON DELETE SET NULL,
    source_name VARCHAR(150) NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    snippet TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    tier INT NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. EVENT UPDATES (Temporal Evolution & Lifecycle Timeline)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    update_title TEXT NOT NULL,
    update_summary TEXT NOT NULL,
    lifecycle_stage VARCHAR(50) NOT NULL DEFAULT 'NEW_DEVELOPMENT',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_url TEXT
);

-- ------------------------------------------------------------------------------
-- 8. ARTICLES (Raw Ingested News Articles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.articles (
    id VARCHAR(100) PRIMARY KEY,
    source_id VARCHAR(100) REFERENCES public.sources(id) ON DELETE SET NULL,
    event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    content_snippet TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    region_id VARCHAR(50) REFERENCES public.regions(id) ON DELETE SET NULL,
    category_id VARCHAR(50) REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. CONCEPTS (Knowledge Graph Prerequisite Nodes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concepts (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    category_id VARCHAR(50) REFERENCES public.categories(id) ON DELETE SET NULL,
    short_definition TEXT NOT NULL,
    full_explanation TEXT NOT NULL,
    prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. EVENT CONCEPTS (Junction Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_concepts (
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    concept_id VARCHAR(100) NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    relevance_score FLOAT NOT NULL DEFAULT 1.0,
    PRIMARY KEY (event_id, concept_id)
);

-- ------------------------------------------------------------------------------
-- 11. USER CONCEPT MASTERY (Evidence-Based Learning States)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_concept_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id VARCHAR(100) NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'NEEDS_LEARNING' CHECK (status IN ('NEEDS_LEARNING', 'DEVELOPING', 'STRONG')),
    attempts_count INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    confidence_score FLOAT NOT NULL DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    last_attempt_at TIMESTAMPTZ,
    last_mastered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, concept_id)
);

-- ------------------------------------------------------------------------------
-- 12. SAVED EVENTS & SAVED ARTICLES (User Bookmarks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    notes TEXT,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.saved_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id VARCHAR(100) NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, article_id)
);

-- ------------------------------------------------------------------------------
-- 13. USER INTERESTS & HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.user_article_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_duration_seconds INT NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------------------------
-- 14. QUIZ ATTEMPTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    answers JSONB NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. INDEXES (Optimized for fast reads and zero table scans)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_canonical_events_rank ON public.canonical_events(final_rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_canonical_events_region ON public.canonical_events(region_id);
CREATE INDEX IF NOT EXISTS idx_canonical_events_category ON public.canonical_events(category_id);
CREATE INDEX IF NOT EXISTS idx_canonical_events_urgency ON public.canonical_events(urgency_label);
CREATE INDEX IF NOT EXISTS idx_canonical_events_updated ON public.canonical_events(last_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_sources_event_id ON public.event_sources(event_id);
CREATE INDEX IF NOT EXISTS idx_event_updates_event_id ON public.event_updates(event_id);
CREATE INDEX IF NOT EXISTS idx_articles_event_id ON public.articles(event_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_mastery_user ON public.user_concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mastery_concept ON public.user_concept_mastery(concept_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_user ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
