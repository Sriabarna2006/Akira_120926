-- AKIRA Database Migration: Phase 13 Interactive Storyline Scenario Simulation & Hypothesis Exploration Engine
-- Tables for scenario management, explicit assumptions, propagated impacts, affected concepts, and cached execution runs.

-- 1. Storyline Scenarios Table
CREATE TABLE IF NOT EXISTS public.storyline_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    scenario_type VARCHAR(50) NOT NULL, -- 'REMOVE_EVENT', 'DELAY_EVENT', 'CHANGE_CONDITION', 'REVERSE_RELATION', 'CONTINUE_CONDITION'
    assumption_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storyline_scenarios_storyline ON public.storyline_scenarios (storyline_id);
CREATE INDEX IF NOT EXISTS idx_storyline_scenarios_user ON public.storyline_scenarios (user_id);
CREATE INDEX IF NOT EXISTS idx_storyline_scenarios_created ON public.storyline_scenarios (created_at DESC);

-- 2. Scenario Assumptions Table (Explicit Hypothetical Mutated State)
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

CREATE INDEX IF NOT EXISTS idx_scenario_assumptions_scenario ON public.scenario_assumptions (scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_assumptions_event ON public.scenario_assumptions (target_event_id);

-- 3. Scenario Impacts Table (Derived Consequences along Documented Relations)
CREATE TABLE IF NOT EXISTS public.scenario_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.storyline_scenarios(id) ON DELETE CASCADE,
    source_entity_id VARCHAR(100) NOT NULL,
    affected_entity_id VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'EVENT', 'CONCEPT', 'TURNING_POINT'
    relationship_type VARCHAR(50) NOT NULL,
    impact_direction VARCHAR(50) NOT NULL, -- 'DISRUPTED', 'DELAYED', 'AMPLIFIED', 'MITIGATED', 'UNCERTAIN'
    impact_strength NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    explanation TEXT NOT NULL,
    evidence_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenario_impacts_scenario ON public.scenario_impacts (scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_impacts_affected ON public.scenario_impacts (affected_entity_id);

-- 4. Scenario Concepts Table (Affected Domain Concepts & Learning Hooks)
CREATE TABLE IF NOT EXISTS public.scenario_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.storyline_scenarios(id) ON DELETE CASCADE,
    concept_id VARCHAR(100) NOT NULL,
    impact_type VARCHAR(50) NOT NULL, -- 'DIRECT', 'PROPAGATED', 'PREREQUISITE', 'REINFORCED'
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenario_concepts_scenario ON public.scenario_concepts (scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_concepts_concept ON public.scenario_concepts (concept_id);

-- 5. Scenario Runs Cache Table (Deterministic Execution Store keyed by Input Hash)
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

CREATE INDEX IF NOT EXISTS idx_scenario_runs_hash ON public.scenario_runs (input_hash);
CREATE INDEX IF NOT EXISTS idx_scenario_runs_expires ON public.scenario_runs (expires_at);
