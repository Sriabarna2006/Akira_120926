-- ============================================================================
-- AKIRA PHASE 15: PRODUCTION HARDENING, SOURCE REGISTRY & HEALTH OBSERVABILITY
-- ============================================================================

-- 1. Enhance public.sources with operational metrics and health state columns
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS health_status VARCHAR(30) DEFAULT 'HEALTHY';
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS consecutive_failures INT DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS expected_freshness_hours INT DEFAULT 6;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_error_message TEXT;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS articles_ingested_count INT DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS events_produced_count INT DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS response_time_ms INT DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS authority_level VARCHAR(50) DEFAULT 'SPECIALIST';
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'India';
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'en';

-- 2. Create ingestion operational health snapshots table
CREATE TABLE IF NOT EXISTS public.ingestion_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sources_attempted INT NOT NULL DEFAULT 0,
  sources_succeeded INT NOT NULL DEFAULT 0,
  sources_failed INT NOT NULL DEFAULT 0,
  articles_discovered INT NOT NULL DEFAULT 0,
  articles_accepted INT NOT NULL DEFAULT 0,
  duplicates_skipped INT NOT NULL DEFAULT 0,
  events_created INT NOT NULL DEFAULT 0,
  events_updated INT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  health_status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY'
);

-- 3. Create index for rapid telemetry querying
CREATE INDEX IF NOT EXISTS idx_ingestion_snapshots_time ON public.ingestion_health_snapshots(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_sources_health ON public.sources(health_status, is_active);
