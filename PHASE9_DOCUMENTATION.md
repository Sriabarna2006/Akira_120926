# AKIRA Phase 9: Knowledge Graph & Cross-Topic Intelligence Layer

## 1. Executive Summary

Phase 9 integrates all conceptual extraction (Phase 6), user mastery tracking & spaced repetition (Phase 7), and adaptive personalization feeds (Phase 8) into a unified, deterministic **Knowledge Graph & Cross-Topic Intelligence Layer**.

It transforms static event lists into an interconnected cognitive map where:
- Every event highlights the **exact concepts** needed for comprehension.
- Users can visualize upstream **prerequisites**, downstream **unlocked topics**, and related multi-disciplinary concepts.
- The system generates personalized **topological learning paths** that sequence missing prerequisites first.
- Real-world events are linked via multi-signal similarity to explore ripple effects and parallel developments.

---

## 2. Architecture & Data Model

### 2.1 Database Schema (`concept_relations`)
The schema introduces typed, directed, and weighted edges connecting concepts in PostgreSQL (with automatic in-memory fallback):

```sql
CREATE TABLE IF NOT EXISTS public.concept_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    target_concept_id TEXT NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,
    weight NUMERIC(4, 3) NOT NULL DEFAULT 1.000 CHECK (weight >= 0.000 AND weight <= 1.000),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_loops CHECK (source_concept_id <> target_concept_id),
    CONSTRAINT uq_concept_relation UNIQUE (source_concept_id, target_concept_id, relation_type)
);
```

### 2.2 Relationship Types
1. `PREREQUISITE` — Must understand Target before Source (Strict DAG, cycle-prevented).
2. `DEPENDS_ON` — Directional functional dependency.
3. `RELATED` — Semantic proximity in domain/field (can be bi-directional).
4. `PART_OF` — Hierarchical sub-topic grouping.
5. `CAUSES` — Causal mechanism between concepts.
6. `CONTRASTS_WITH` — Comparative distinction between opposing concepts.

---

## 3. Mathematical & Algorithmic Engines

### 3.1 Cycle Detection (3-Color DFS)
Before inserting or modifying any directional `PREREQUISITE` or `DEPENDS_ON` edge, the system performs a 3-Color Depth First Search ($0=\text{White/Unvisited}$, $1=\text{Gray/Visiting}$, $2=\text{Black/Done}$) across the active dependency graph:
- If a back-edge is encountered ($v \in \text{Gray}$), the insertion is aborted with an explanatory cycle path.
- Self-loops ($u = v$) are blocked immediately by schema constraints and service checks.

### 3.2 Deterministic Related Concepts Scoring
Calculates cross-concept similarity without nondeterministic LLM hallucinations:
$$\text{Score}(A, B) = 0.35 \cdot \text{RelationWeight} + 0.30 \cdot \text{SharedEvents} + 0.20 \cdot \text{CategorySimilarity} + 0.15 \cdot \text{GraphProximity}$$

Where:
- $\text{RelationWeight}$: 100 for direct weighted edge, 0 otherwise.
- $\text{SharedEvents}$: Jaccard index $\frac{|E_A \cap E_B|}{|E_A \cup E_B|} \times 100$.
- $\text{CategorySimilarity}$: 100 for identical category, 25 otherwise.
- $\text{GraphProximity}$: Shortest BFS unweighted distance (1-hop = 100, 2-hop = 70, 3-hop = 40, $\le$ 5-hop = 20).

### 3.3 Deterministic Related Events Scoring
Ranks real-world events connected to a target event:
$$\text{Relevance} = 0.40 \cdot \text{SharedConcepts} + 0.20 \cdot \text{RelatedConcepts} + 0.15 \cdot \text{Category} + 0.10 \cdot \text{Region} + 0.10 \cdot \text{Temporal} + 0.05 \cdot \text{GlobalRank}$$

Where:
- $\text{SharedConcepts}$: Direct concept intersection Jaccard score.
- $\text{RelatedConcepts}$: 1-hop graph neighbor overlap.
- $\text{Temporal}$: Exponential decay $100 \cdot e^{-0.02 \cdot \Delta t_{\text{hours}}}$.
- $\text{GlobalRank}$: Normalized Phase 5 final importance rank score.

### 3.4 Personalized Topological Learning Path
Generates an ordered roadmap to master a target concept:
1. Traverses prerequisite ancestors up to depth 5.
2. Evaluates user mastery status (`STRONG`, `DEVELOPING`, `NEEDS_LEARNING`, `UNKNOWN`).
3. Sequentially orders steps:
   - **Step 1: Missing Gaps** (`NEEDS_LEARNING` / `UNKNOWN`) -> Action: `LEARN`.
   - **Step 2: Developing Concepts** (Score 50-79%) -> Action: `REVIEW`.
   - **Step 3: Target Concept** -> Action: `LEARN` / `PASS`.
4. Calculates user overall readiness percentage for the target concept.

---

## 4. API Endpoints

### 4.1 Concept Graph & Learning Path
- `GET /api/concepts/:id/graph` — Full node & edge hierarchy (up to depth 5), annotated with user mastery if authenticated.
- `GET /api/concepts/:id/learning-path` — Ordered step-by-step topological path prioritizing knowledge gaps.
- `GET /api/concepts/:id/related` — Deterministically scored related concepts with reasons.
- `GET /api/concepts/:id/status` — User-specific mastery status, attempt count, and gap analysis.
- `POST /api/concepts/relations` — Add/update concept relationships with cycle detection (Admin/System).

### 4.2 Event Knowledge Map
- `GET /api/events/:id/knowledge-map` — Comprehensive intelligence map: key concepts, prerequisite tree, readiness score, knowledge gaps, "Learn These First" items, and related events.
- `GET /api/events/:id/related` — Related canonical events scored via cross-concept graph signals.

---

## 5. Frontend User Experience

### 5.1 Enhanced Event Detail Page (`/events/:id`)
- **What You Need to Understand**: Visual cards for direct concepts with mastery badges.
- **Comprehension Readiness Score**: Circular progress indicator reflecting personalized prerequisite mastery.
- **Learn These First**: Prominent warning callout highlighting unmastered foundational concepts before reading deep analysis.
- **Knowledge Graph Dependency Chain**: Interactive visual graph showing prerequisites, targets, and downstream unlocks.
- **Related Intelligence Events**: Corroborated news and parallel developments connected via shared concepts.

### 5.2 Dedicated Concept Detail Page (`/concept/:id`)
- **Concept Header & Definition**: Importance score, difficulty level, and key domain.
- **Personalized Step-by-Step Learning Path**: Visual sequential steps with direct actions (`LEARN`, `REVIEW`, `START QUIZ`).
- **Interactive Concept Hierarchy**: Upstream foundations vs downstream topics unlocked upon mastery.
- **Related Real-World Events**: Canonical intelligence stories exemplifying this concept in action.
- **Multi-Disciplinary Related Concepts**: Adjacent concepts across economics, cybersecurity, and technology.
