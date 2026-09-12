-- ==============================================================================
-- AKIRA DATABASE SECURITY & RLS POLICIES v1.1
-- Migration: 002_rls_policies.sql
-- Description: Enables Row Level Security (RLS) across all tables, ensuring
--              strict isolation of user-private data and safe public access.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE RLS ACROSS ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_article_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. PUBLIC READ POLICIES (Read-only for all public & authenticated users)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public Read Regions" ON public.regions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public Read Categories" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public Read Sources" ON public.sources
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public Read Canonical Events" ON public.canonical_events
    FOR SELECT USING (true);

CREATE POLICY "Public Read Event Sources" ON public.event_sources
    FOR SELECT USING (true);

CREATE POLICY "Public Read Event Updates" ON public.event_updates
    FOR SELECT USING (true);

CREATE POLICY "Public Read Articles" ON public.articles
    FOR SELECT USING (true);

CREATE POLICY "Public Read Concepts" ON public.concepts
    FOR SELECT USING (true);

CREATE POLICY "Public Read Event Concepts" ON public.event_concepts
    FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 3. SERVICE ROLE WRITE POLICIES (Restricted to internal backend ingestion)
-- ------------------------------------------------------------------------------
CREATE POLICY "Service Role Ingestion Events" ON public.canonical_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service Role Ingestion Sources" ON public.event_sources
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service Role Ingestion Updates" ON public.event_updates
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service Role Ingestion Articles" ON public.articles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ------------------------------------------------------------------------------
-- 4. USER PROFILE POLICIES (Scoped strictly to auth.uid())
-- ------------------------------------------------------------------------------
CREATE POLICY "User View Own Profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "User Update Own Profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "User Insert Own Profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 5. USER PRIVATE DATA ISOLATION POLICIES (User A cannot access User B data)
-- ------------------------------------------------------------------------------
CREATE POLICY "User Mastery Isolation" ON public.user_concept_mastery
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User Saved Events Isolation" ON public.saved_events
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User Saved Articles Isolation" ON public.saved_articles
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User Interests Isolation" ON public.user_interests
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User History Isolation" ON public.user_article_history
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User Quiz Isolation" ON public.quiz_attempts
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. AUTO-CREATE PROFILE TRIGGER (On Supabase auth.users creation)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
