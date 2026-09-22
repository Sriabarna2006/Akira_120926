-- ============================================================================
-- AKIRA MIGRATION 016: PRODUCTION RELIABILITY, SOURCE HEALTH & EMBEDDINGS
-- ============================================================================

-- 1. Source Error Log Table
CREATE TABLE IF NOT EXISTS public.source_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id VARCHAR(100) NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  error_type VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
  error_message TEXT NOT NULL,
  http_status INT,
  response_time_ms INT NOT NULL DEFAULT 0,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Feed Quarantine Table
CREATE TABLE IF NOT EXISTS public.source_quarantine (
  source_id VARCHAR(100) PRIMARY KEY REFERENCES public.sources(id) ON DELETE CASCADE,
  quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quarantine_reason VARCHAR(100) NOT NULL,
  retry_interval_minutes INT NOT NULL DEFAULT 60,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  consecutive_quarantine_count INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Semantic Vector Embeddings Table (Optional Vector Cache)
CREATE TABLE IF NOT EXISTS public.event_semantic_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'deterministic-tfidf',
  model_name VARCHAR(100) NOT NULL DEFAULT 'tfidf-256',
  dimensions INT NOT NULL DEFAULT 256,
  embedding_vector JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_event_semantic_embeddings_event_provider UNIQUE (event_id, provider)
);

-- 4. System Health Snapshots Table
CREATE TABLE IF NOT EXISTS public.system_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type VARCHAR(50) NOT NULL DEFAULT 'HOURLY',
  database_status VARCHAR(30) NOT NULL,
  sources_healthy_count INT NOT NULL,
  sources_degraded_count INT NOT NULL,
  sources_failing_count INT NOT NULL,
  sources_quarantined_count INT NOT NULL,
  sources_disabled_count INT NOT NULL,
  active_events_count INT NOT NULL,
  last_ingestion_duration_ms INT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Extend Sources Table with Phase 16 Fields
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_error_type VARCHAR(50) DEFAULT 'NONE';
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS quarantine_status VARCHAR(30) DEFAULT 'ACTIVE';
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_http_status INT DEFAULT 200;

-- 6. Indexes for High-Throughput Queries
CREATE INDEX IF NOT EXISTS idx_source_error_logs_source ON public.source_error_logs(source_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_quarantine_next_retry ON public.source_quarantine(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_system_health_snapshots_captured ON public.system_health_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_sources_health_status ON public.sources(health_status, is_active);
