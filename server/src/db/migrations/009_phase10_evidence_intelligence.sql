-- ==============================================================================
-- AKIRA DATABASE SCHEMA v1.9
-- Migration: 009_phase10_evidence_intelligence.sql
-- Description: Schema for Trust, Evidence & Source Intelligence Layer.
--              Extends sources with health and source types, adds event evidence
--              corroboration records and structured conflict tracking.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTEND SOURCES TABLE
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sources' AND column_name = 'source_type') THEN
        ALTER TABLE public.sources ADD COLUMN source_type VARCHAR(50) NOT NULL DEFAULT 'NATIONAL';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sources' AND column_name = 'consecutive_failures') THEN
        ALTER TABLE public.sources ADD COLUMN consecutive_failures INT NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sources' AND column_name = 'specialization') THEN
        ALTER TABLE public.sources ADD COLUMN specialization VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sources' AND column_name = 'health_status') THEN
        ALTER TABLE public.sources ADD COLUMN health_status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. EVENT EVIDENCE TABLE (Corroborating Evidence Records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    source_id VARCHAR(100) REFERENCES public.sources(id) ON DELETE SET NULL,
    source_name VARCHAR(150) NOT NULL,
    evidence_type VARCHAR(50) NOT NULL DEFAULT 'INDEPENDENT_REPORTING' CHECK (evidence_type IN ('PRIMARY', 'INDEPENDENT_REPORTING', 'SECONDARY', 'CONTEXT', 'UNCONFIRMED')),
    source_authority_tier INT NOT NULL DEFAULT 2 CHECK (source_authority_tier IN (1, 2, 3)),
    is_independent BOOLEAN NOT NULL DEFAULT true,
    evidence_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evidence_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    verification_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_evidence UNIQUE (event_id, source_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_event_evidence_event_id ON public.event_evidence(event_id);
CREATE INDEX IF NOT EXISTS idx_event_evidence_source_id ON public.event_evidence(source_id);
CREATE INDEX IF NOT EXISTS idx_event_evidence_type ON public.event_evidence(evidence_type);

-- ------------------------------------------------------------------------------
-- 3. EVIDENCE CONFLICTS TABLE (Detected Discrepancies Across Sources)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evidence_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    field VARCHAR(100) NOT NULL,
    source_a VARCHAR(150) NOT NULL,
    source_b VARCHAR(150) NOT NULL,
    value_a TEXT NOT NULL,
    value_b TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    status VARCHAR(30) NOT NULL DEFAULT 'UNRESOLVED' CHECK (status IN ('UNRESOLVED', 'ACKNOWLEDGED', 'RESOLVED')),
    explanation TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_conflicts_event_id ON public.evidence_conflicts(event_id);
CREATE INDEX IF NOT EXISTS idx_evidence_conflicts_severity ON public.evidence_conflicts(severity);
