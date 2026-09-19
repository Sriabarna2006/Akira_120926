-- ==============================================================================
-- AKIRA PHASE 9 MIGRATION: KNOWLEDGE GRAPH & CROSS-TOPIC INTELLIGENCE LAYER
-- File: 008_phase9_knowledge_graph.sql
-- Description: Creates tables for typed directional concept relations, graph edges,
--              and performance indexes for topological graph traversals.
-- ==============================================================================

-- 1. CONCEPT RELATIONS (Typed & Weighted Graph Edges)
CREATE TABLE IF NOT EXISTS public.concept_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_concept_id VARCHAR(100) NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    target_concept_id VARCHAR(100) NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL DEFAULT 'RELATED' CHECK (relation_type IN (
        'PREREQUISITE', 'RELATED', 'PART_OF', 'CAUSES', 'DEPENDS_ON', 'CONTRASTS_WITH'
    )),
    weight FLOAT NOT NULL DEFAULT 1.0 CHECK (weight >= 0.0 AND weight <= 1.0),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_concept_relations UNIQUE (source_concept_id, target_concept_id, relation_type),
    CONSTRAINT chk_no_self_loop CHECK (source_concept_id <> target_concept_id)
);

-- 2. PERFORMANCE INDEXES (Optimized for fast directional lookups & neighborhood traversals)
CREATE INDEX IF NOT EXISTS idx_concept_relations_source ON public.concept_relations(source_concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_relations_target ON public.concept_relations(target_concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_relations_type ON public.concept_relations(relation_type);
CREATE INDEX IF NOT EXISTS idx_event_concepts_concept ON public.event_concepts(concept_id);
