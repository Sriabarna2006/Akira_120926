-- ==============================================================================
-- AKIRA DATABASE SCHEMA (NEON DB / POSTGRESQL NATIVE)
-- File: neon_schema.sql
-- Description: Complete schema for regions, categories, sources, canonical events,
--              knowledge concepts, quizzes, bookmarks, and user profiles for Neon DB.
-- ==============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES / USERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
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
-- 11. USER CONCEPT MASTERY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_concept_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    notes TEXT,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.saved_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    article_id VARCHAR(100) NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, article_id)
);

-- ------------------------------------------------------------------------------
-- 13. USER INTERESTS & HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.user_article_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_duration_seconds INT NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------------------------
-- 14. QUIZ ATTEMPTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    answers JSONB NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. INDEXES
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
CREATE INDEX IF NOT EXISTS idx_saved_events_user ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);

-- ------------------------------------------------------------------------------
-- 16. SEED REGIONS
-- ------------------------------------------------------------------------------
INSERT INTO public.regions (id, name, slug, description, tier, is_active)
VALUES
    ('tamil-nadu', 'Tamil Nadu', 'tamil-nadu', 'State-level governance, economy, infrastructure, and culture in Tamil Nadu', 1, true),
    ('india', 'India', 'india', 'National governance, policy, macroeconomic developments, and major events across India', 1, true),
    ('world', 'World', 'world', 'Global geopolitics, international economics, science, and world developments', 1, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 17. SEED CATEGORIES
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, icon, color, description, is_active)
VALUES
    ('politics', 'Politics & Policy', 'politics', 'Landmark', '#3B82F6', 'Governance, legislation, constitutional affairs, and elections', true),
    ('economy', 'Economy & Finance', 'economy', 'TrendingUp', '#10B981', 'Macroeconomics, fiscal policy, inflation, banking, and trade', true),
    ('business', 'Business & Markets', 'business', 'Briefcase', '#6366F1', 'Corporate developments, startups, industry growth, and markets', true),
    ('technology', 'Technology & AI', 'technology', 'Cpu', '#8B5CF6', 'Artificial intelligence, semiconductors, software, and digital innovation', true),
    ('science', 'Science & Space', 'science', 'Atom', '#EC4899', 'Space exploration, astrophysics, biotechnology, and fundamental research', true),
    ('infrastructure', 'Infrastructure & Cities', 'infrastructure', 'Building2', '#F59E0B', 'Urban transit, metro rail, highway corridors, and smart cities', true),
    ('education', 'Education & Research', 'education', 'GraduationCap', '#14B8A6', 'Higher education, literacy initiatives, academic research, and policy', true),
    ('health', 'Healthcare & Medicine', 'health', 'HeartPulse', '#EF4444', 'Public health, medical breakthroughs, pharma, and epidemic tracking', true),
    ('environment', 'Environment & Climate', 'environment', 'Leaf', '#22C55E', 'Renewable energy, climate transition, conservation, and ecology', true),
    ('weather', 'Weather & Monsoons', 'weather', 'CloudRain', '#06B6D4', 'Monsoon forecasts, weather phenomena, and natural disaster advisories', true),
    ('security', 'Defense & Security', 'security', 'Shield', '#64748B', 'National security, defense technology, diplomacy, and strategic affairs', true),
    ('transportation', 'Transit & Logistics', 'transportation', 'Navigation', '#F97316', 'Railways, aviation, maritime shipping, and EV mobility corridors', true),
    ('sports', 'Sports & Athletics', 'sports', 'Trophy', '#EAB308', 'Major tournaments, athletics, cricket, and sports science', true),
    ('entertainment', 'Culture & Cinema', 'entertainment', 'Film', '#A855F7', 'Cinema, literature, cultural heritage, and creative arts', true),
    ('other', 'General & Society', 'other', 'Globe', '#94A3B8', 'Public interest announcements, civic developments, and human interest', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 18. SEED SOURCES
-- ------------------------------------------------------------------------------
INSERT INTO public.sources (id, name, url, feed_url, region_id, category_id, tier, credibility_score, conglomerate_id, is_active)
VALUES
    ('the-hindu', 'The Hindu', 'https://www.thehindu.com', 'https://www.thehindu.com/news/national/feeder/default.rss', 'india', 'politics', 1, 0.95, 'kasturi-sons', true),
    ('the-hindu-tn', 'The Hindu (Tamil Nadu)', 'https://www.thehindu.com/news/national/tamil-nadu/', 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', 'tamil-nadu', 'politics', 1, 0.95, 'kasturi-sons', true),
    ('toi', 'Times of India', 'https://timesofindia.indiatimes.com', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'india', 'politics', 2, 0.85, 'times-group', true),
    ('bbc-world', 'BBC News', 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'world', 'politics', 1, 0.95, 'bbc', true),
    ('reuters-world', 'Reuters', 'https://www.reuters.com', 'https://www.reutersagency.com/feed/?best-topics=world', 'world', 'business', 1, 0.95, 'thomson-reuters', true),
    ('economic-times', 'The Economic Times', 'https://economictimes.indiatimes.com', 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', 'india', 'economy', 1, 0.90, 'times-group', true),
    ('dinamalar-tn', 'Dinamalar', 'https://www.dinamalar.com', 'https://rss.dinamalar.com/?cat=tamilnadu', 'tamil-nadu', 'politics', 2, 0.85, 'dinamalar-media', true),
    ('dinamani-tn', 'Dinamani', 'https://www.dinamani.com', 'https://www.dinamani.com/tamilnadu/rss', 'tamil-nadu', 'politics', 2, 0.85, 'express-group', true),
    ('techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'world', 'technology', 2, 0.85, 'yahoo', true),
    ('pib-india', 'Press Information Bureau (PIB)', 'https://pib.gov.in', 'https://pib.gov.in/rss/RssEnglish.aspx', 'india', 'politics', 1, 0.98, 'gov-india', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    url = EXCLUDED.url,
    feed_url = EXCLUDED.feed_url,
    tier = EXCLUDED.tier,
    credibility_score = EXCLUDED.credibility_score;
