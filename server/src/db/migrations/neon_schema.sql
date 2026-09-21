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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_sources_event_url UNIQUE (event_id, url)
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
-- 15. TREND OBSERVATIONS (Historical Observation Snapshots for Velocity)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 16. INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_canonical_events_rank ON public.canonical_events(final_rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_canonical_events_region ON public.canonical_events(region_id);
CREATE INDEX IF NOT EXISTS idx_canonical_events_category ON public.canonical_events(category_id);
CREATE INDEX IF NOT EXISTS idx_canonical_events_urgency ON public.canonical_events(urgency_label);
CREATE INDEX IF NOT EXISTS idx_canonical_events_updated ON public.canonical_events(last_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_trend_observations_event ON public.trend_observations(event_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_observations_time ON public.trend_observations(observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_sources_event_id ON public.event_sources(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sources_source_id ON public.event_sources(source_id);
CREATE INDEX IF NOT EXISTS idx_event_updates_event_id ON public.event_updates(event_id);
CREATE INDEX IF NOT EXISTS idx_articles_event_id ON public.articles(event_id);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON public.articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_region_id ON public.articles(region_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_sources_region ON public.sources(region_id);
CREATE INDEX IF NOT EXISTS idx_sources_category ON public.sources(category_id);

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
    ('the-hindu-chennai', 'The Hindu (Chennai)', 'https://www.thehindu.com/news/cities/chennai/', 'https://www.thehindu.com/news/cities/chennai/feeder/default.rss', 'tamil-nadu', 'infrastructure', 1, 0.95, 'kasturi-sons', true),
    ('toi', 'Times of India', 'https://timesofindia.indiatimes.com', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'india', 'politics', 2, 0.85, 'times-group', true),
    ('bbc-world', 'BBC News', 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'world', 'politics', 1, 0.95, 'bbc', true),
    ('reuters-world', 'Reuters', 'https://www.reuters.com', 'https://www.reutersagency.com/feed/?best-topics=world', 'world', 'business', 1, 0.95, 'thomson-reuters', true),
    ('economic-times', 'The Economic Times', 'https://economictimes.indiatimes.com', 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', 'india', 'economy', 1, 0.90, 'times-group', true),
    ('dinamalar-tn', 'Dinamalar', 'https://www.dinamalar.com', 'https://rss.dinamalar.com/?cat=tamilnadu', 'tamil-nadu', 'politics', 2, 0.85, 'dinamalar-media', true),
    ('dinamani-tn', 'Dinamani', 'https://www.dinamani.com', 'https://www.dinamani.com/tamilnadu/rss', 'tamil-nadu', 'politics', 2, 0.85, 'express-group', true),
    ('techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'world', 'technology', 2, 0.85, 'yahoo', true),
    ('the-verge', 'The Verge', 'https://www.theverge.com', 'https://www.theverge.com/rss/index.xml', 'world', 'technology', 2, 0.85, 'vox-media', true),
    ('sciencedaily', 'ScienceDaily', 'https://www.sciencedaily.com', 'https://www.sciencedaily.com/rss/top/science.xml', 'world', 'science', 1, 0.95, 'sciencedaily', true),
    ('bleepingcomputer', 'BleepingComputer', 'https://www.bleepingcomputer.com', 'https://www.bleepingcomputer.com/feed/', 'world', 'security', 1, 0.92, 'bleeping-computer', true),
    ('pib-india', 'Press Information Bureau (PIB)', 'https://pib.gov.in', 'https://pib.gov.in/rss/RssEnglish.aspx', 'india', 'politics', 1, 0.98, 'gov-india', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    url = EXCLUDED.url,
    feed_url = EXCLUDED.feed_url,
    tier = EXCLUDED.tier,
    credibility_score = EXCLUDED.credibility_score;

-- ------------------------------------------------------------------------------
-- 19. SEED SAMPLE DEVELOPMENT CANONICAL EVENTS (Clearly marked development data)
-- ------------------------------------------------------------------------------
INSERT INTO public.canonical_events (
    id, title, summary, region_id, category_id, urgency_label, 
    importance_score, velocity_score, final_rank_score, why_it_matters, 
    first_published_at, last_updated_at, source_count, lifecycle_status, metadata
)
VALUES
    (
        'evt_tn_ev_hub_2026',
        'Tamil Nadu Cabinet Clears Mega Infrastructure & Electric Mobility Corridor Policy',
        'State government approves capital investment framework expanding metro transit links across Chennai and Hosur EV manufacturing hub.',
        'tamil-nadu',
        'infrastructure',
        'IMPORTANT',
        94, 90, 96,
        'Accelerates high-speed regional transit corridors and strengthens clean mobility industrial employment in Tamil Nadu.',
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '1 hour',
        2,
        'OFFICIAL_CONFIRMATION',
        '{"is_dev_sample": true, "environment": "development"}'::jsonb
    ),
    (
        'evt_macro_rates_2026',
        'Reserve Bank of India & Global Central Banks Shift Monetary Policy Stance',
        'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
        'india',
        'economy',
        'IMPORTANT',
        92, 88, 94,
        'Directly shapes retail borrowing costs, investment decisions, and capital market valuations across sectors.',
        NOW() - INTERVAL '6 hours',
        NOW() - INTERVAL '2 hours',
        2,
        'OFFICIAL_CONFIRMATION',
        '{"is_dev_sample": true, "environment": "development"}'::jsonb
    ),
    (
        'evt_ai_semiconductor_2026',
        'Next-Generation Semiconductor Consortium Announces Global Fab Initiative',
        'Leading chipmakers and research universities unveil sub-2nm architectural standard for high-throughput AI accelerator silicon.',
        'world',
        'technology',
        'IMPORTANT',
        88, 82, 90,
        'Defines standard architectures for data center AI workloads and next-generation sovereign computing infrastructure.',
        NOW() - INTERVAL '8 hours',
        NOW() - INTERVAL '3 hours',
        2,
        'NEW_DEVELOPMENT',
        '{"is_dev_sample": true, "environment": "development"}'::jsonb
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    region_id = EXCLUDED.region_id,
    category_id = EXCLUDED.category_id,
    why_it_matters = EXCLUDED.why_it_matters,
    final_rank_score = EXCLUDED.final_rank_score;

-- ------------------------------------------------------------------------------
-- 20. SEED SAMPLE DEVELOPMENT EVENT SOURCES
-- ------------------------------------------------------------------------------
INSERT INTO public.event_sources (id, event_id, source_id, source_name, title, url, snippet, published_at, tier)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'evt_tn_ev_hub_2026',
        'the-hindu-tn',
        'The Hindu (Tamil Nadu)',
        'TN Cabinet gives nod to industrial corridor expansion and EV battery parks',
        'https://www.thehindu.com/news/national/tamil-nadu/ev-corridor-policy-2026',
        'The State Cabinet on Monday approved a dedicated infrastructure fund to boost EV manufacturing clusters in Hosur and Coimbatore.',
        NOW() - INTERVAL '4 hours',
        1
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'evt_tn_ev_hub_2026',
        'toi',
        'Times of India',
        'Tamil Nadu launches multi-modal transit links for industrial hubs',
        'https://timesofindia.indiatimes.com/city/chennai/tn-transit-ev-policy-2026',
        'New rail and expressway linkages cleared to integrate industrial corridors across the state.',
        NOW() - INTERVAL '3 hours',
        2
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'evt_macro_rates_2026',
        'economic-times',
        'The Economic Times',
        'RBI signals calibrated transition in monetary liquidity policy',
        'https://economictimes.indiatimes.com/news/economy/policy/rbi-monetary-policy-2026',
        'Central bank outlines steady glidepath for headline inflation while maintaining financial stability.',
        NOW() - INTERVAL '6 hours',
        1
    ),
    (
        'a0000000-0000-0000-0000-000000000004',
        'evt_ai_semiconductor_2026',
        'techcrunch',
        'TechCrunch',
        'Semiconductor giants form new alliance for sub-2nm AI accelerator hardware',
        'https://techcrunch.com/2026/09/12/sub-2nm-ai-hardware-consortium',
        'Consortium aims to standardize ultra-low latency optical interconnects for next-generation neural processors.',
        NOW() - INTERVAL '8 hours',
        2
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    snippet = EXCLUDED.snippet;

-- ------------------------------------------------------------------------------
-- 21. SEED SAMPLE DEVELOPMENT ARTICLES
-- ------------------------------------------------------------------------------
INSERT INTO public.articles (
    id, source_id, event_id, title, url, content_snippet, published_at, region_id, category_id
)
VALUES
    (
        'art_tn_ev_hindu_01',
        'the-hindu-tn',
        'evt_tn_ev_hub_2026',
        'TN Cabinet gives nod to industrial corridor expansion and EV battery parks',
        'https://www.thehindu.com/news/national/tamil-nadu/ev-corridor-policy-2026',
        'The State Cabinet on Monday approved a dedicated infrastructure fund to boost EV manufacturing clusters in Hosur and Coimbatore.',
        NOW() - INTERVAL '4 hours',
        'tamil-nadu',
        'infrastructure'
    ),
    (
        'art_tn_ev_toi_01',
        'toi',
        'evt_tn_ev_hub_2026',
        'Tamil Nadu launches multi-modal transit links for industrial hubs',
        'https://timesofindia.indiatimes.com/city/chennai/tn-transit-ev-policy-2026',
        'New rail and expressway linkages cleared to integrate industrial corridors across the state.',
        NOW() - INTERVAL '3 hours',
        'tamil-nadu',
        'infrastructure'
    ),
    (
        'art_macro_et_01',
        'economic-times',
        'evt_macro_rates_2026',
        'RBI signals calibrated transition in monetary liquidity policy',
        'https://economictimes.indiatimes.com/news/economy/policy/rbi-monetary-policy-2026',
        'Central bank outlines steady glidepath for headline inflation while maintaining financial stability.',
        NOW() - INTERVAL '6 hours',
        'india',
        'economy'
    ),
    (
        'art_ai_tc_01',
        'techcrunch',
        'evt_ai_semiconductor_2026',
        'Semiconductor giants form new alliance for sub-2nm AI accelerator hardware',
        'https://techcrunch.com/2026/09/12/sub-2nm-ai-hardware-consortium',
        'Consortium aims to standardize ultra-low latency optical interconnects for next-generation neural processors.',
        NOW() - INTERVAL '8 hours',
        'world',
        'technology'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content_snippet = EXCLUDED.content_snippet;

-- ------------------------------------------------------------------------------
-- 17. PHASE 11: TEMPORAL STORYLINE EVOLUTION & NARRATIVE TRAJECTORY
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

INSERT INTO public.storylines (
    id, title, summary, status, region_id, primary_category_id,
    started_at, last_updated_at, current_event_id, trajectory, event_count, turning_point_count
) VALUES (
-- ------------------------------------------------------------------------------
-- 18. PHASE 12: LIVING STORYLINE CATCH-UP BRIEFINGS & CHRONOLOGICAL SYNTHESIS
-- ------------------------------------------------------------------------------
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_storyline_catchup_user_briefing 
    ON public.storyline_catchup_briefings (storyline_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

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

-- ------------------------------------------------------------------------------
-- 19. PHASE 13: INTERACTIVE STORYLINE SCENARIO SIMULATION & HYPOTHESIS EXPLORATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storyline_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    scenario_type VARCHAR(50) NOT NULL,
    assumption_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scenario_assumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.storyline_scenarios(id) ON DELETE CASCADE,
    target_event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE SET NULL,
    assumption_type VARCHAR(50) NOT NULL,
    original_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    hypothetical_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scenario_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.storyline_scenarios(id) ON DELETE CASCADE,
    source_entity_id VARCHAR(100) NOT NULL,
    affected_entity_id VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    impact_direction VARCHAR(50) NOT NULL,
    impact_strength NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    explanation TEXT NOT NULL,
    evidence_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scenario_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.storyline_scenarios(id) ON DELETE CASCADE,
    concept_id VARCHAR(100) NOT NULL,
    impact_type VARCHAR(50) NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scenario_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES public.storyline_scenarios(id) ON DELETE CASCADE,
    input_hash VARCHAR(64) NOT NULL UNIQUE,
    engine_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    result_json JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- PHASE 14: REAL-TIME INTELLIGENCE & MOBILE NOTIFICATION SYSTEM
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_label VARCHAR(100) DEFAULT 'Browser',
    platform VARCHAR(50) DEFAULT 'desktop',
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    CONSTRAINT uq_push_subscriptions_user_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_revoked ON public.push_subscriptions(revoked_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    breaking_enabled BOOLEAN NOT NULL DEFAULT true,
    major_update_enabled BOOLEAN NOT NULL DEFAULT true,
    storyline_enabled BOOLEAN NOT NULL DEFAULT true,
    study_enabled BOOLEAN NOT NULL DEFAULT true,
    review_enabled BOOLEAN NOT NULL DEFAULT true,
    daily_briefing_enabled BOOLEAN NOT NULL DEFAULT true,
    knowledge_gap_enabled BOOLEAN NOT NULL DEFAULT true,
    daily_goal_enabled BOOLEAN NOT NULL DEFAULT true,
    study_time VARCHAR(10) NOT NULL DEFAULT '19:00',
    daily_briefing_time VARCHAR(10) NOT NULL DEFAULT '08:00',
    quiet_hours_start VARCHAR(10) NOT NULL DEFAULT '22:30',
    quiet_hours_end VARCHAR(10) NOT NULL DEFAULT '07:00',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    minimum_importance INT NOT NULL DEFAULT 70,
    minimum_evidence INT NOT NULL DEFAULT 60,
    maximum_daily_notifications INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON public.notification_preferences(user_id);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT NOT NULL,
    event_id VARCHAR(100),
    storyline_id VARCHAR(100),
    concept_id VARCHAR(100),
    dedupe_key VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_dedupe ON public.notifications(user_id, dedupe_key);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_storyline_id ON public.notifications(storyline_id) WHERE storyline_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    provider_response TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON public.notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_subscription ON public.notification_deliveries(subscription_id);



