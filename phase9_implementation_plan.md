# AKIRA — Phase 9 Implementation Plan: Knowledge Graph & Cross-Topic Intelligence

## 1. Executive Summary & Objective

Phase 9 establishes the **Knowledge Graph & Cross-Topic Intelligence Layer** for AKIRA. Building directly upon Phase 6 (Concept Extraction, 5W1H Understanding, Multi-level Explanations, Quizzes), Phase 7 (Evidence-Based User Mastery, SM-2 Spaced Repetition), and Phase 8 (Intelligent Discovery Feed & Adaptive Personalization), Phase 9 transforms discrete news events and concepts into a connected, deterministic, and explainable knowledge graph.

The system empowers AKIRA to answer:
> *"How is this event connected to other things I already know or should learn?"*

```text
News Event
    ↓
Concepts
    ↓
Related Concepts (Graph Proximity & Shared Co-occurrences)
    ↓
Prerequisites (DAG Traversal & Cycle Detection)
    ↓
Related Events (Multi-Signal Cross-Topic Scoring)
    ↓
User Mastery (Phase 7 Real Evidence State: STRONG / DEVELOPING / NEEDS_LEARNING / UNKNOWN)
    ↓
Recommended Learning Path (Topological Gap-First Path to Mastery)
```

---

## 2. Review of Existing Architecture (Phases 0–8)

### 2.1 Existing Knowledge & Concept Model (Phase 6)
- **Database Tables**:
  - `public.concepts`: Contains `id`, `title`, `slug`, `category_id`, `short_definition`, `full_explanation`, `prerequisites` (JSONB).
  - `public.event_concepts`: Junction table linking `event_id` and `concept_id` with `relevance_score`.
  - `public.concept_prerequisites`: Edge table `(concept_id, prerequisite_concept_id)` with CASCADE deletions.
- **Repositories & Services**:
  - `AIUnderstandingRepository`: Manages in-memory maps (`inMemoryConcepts`, `inMemoryEventConcepts`, `inMemoryPrerequisites`) and PostgreSQL queries.
  - `AIService`: Handles deterministic concept extraction (`extractConcepts`) and caching.

### 2.2 Existing User Mastery & Personalization Model (Phases 7 & 8)
- **Database Tables**:
  - `public.user_learning_progress`: Stores `(user_id, concept_id, event_id, mastery_score, mastery_status, attempt_count, correct_count, incorrect_count)`.
  - `public.user_review_schedules`: Stores SuperMemo SM-2 state `(ease_factor, interval_days, repetition_count, next_review_at)`.
  - `public.user_learning_preferences`: Stores `daily_goal` and `preferred_difficulty`.
- **Classification Statuses**:
  - `STRONG`: Mastery $\ge 80\%$ or consecutive quiz successes.
  - `DEVELOPING`: Mastery $50\% - 79\%$.
  - `NEEDS_LEARNING`: Mastery $< 50\%$ or failed attempts.
  - `UNKNOWN`: Unattempted concepts (no prior progress record).

---

## 3. Proposed Phase 9 Graph Architecture

### 3.1 Graph Data Model & Relationship Types
Phase 9 extends the concept graph with typed and weighted directional edges while fully preserving existing `concept_prerequisites` data.

Supported Relationship Types:
1. `PREREQUISITE`: Foundational dependency (A must be understood before B).
2. `RELATED`: Bidirectional conceptual affinity / co-occurrence.
3. `PART_OF`: Hierarchical sub-concept or component of a broader domain.
4. `DEPENDS_ON`: Functional or statutory dependency.
5. `CAUSES`: Causal mechanism.
6. `CONTRASTS_WITH`: Opposing or alternative framework.

### 3.2 Database Changes
New migration file: `008_phase9_knowledge_graph.sql`
```sql
-- CONCEPT RELATIONS (Typed & Weighted Graph Edges)
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

CREATE INDEX IF NOT EXISTS idx_concept_relations_source ON public.concept_relations(source_concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_relations_target ON public.concept_relations(target_concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_relations_type ON public.concept_relations(relation_type);
```
Auto-initialization and dual-layer fallback support will be added in `dbClient.ts` to guarantee operation when Postgres is offline.

---

## 4. Graph Traversal, Validation & Cycle Prevention

### 4.1 Graph Validation Rules
1. **Self-Loop Prevention**: Rejects any edge where `source_concept_id === target_concept_id`.
2. **Duplicate Edge Prevention**: Unique constraint on `(source_concept_id, target_concept_id, relation_type)`.
3. **Foreign Key Integrity / Orphan Detection**: Validates existence of both source and target concepts before inserting.
4. **Prerequisite Cycle Prevention (DAG Enforcement)**:
   - Traversal uses Depth-First Search (DFS) with node coloring (`WHITE=unvisited`, `GRAY=visiting`, `BLACK=visited`).
   - If a `GRAY` node is encountered along a `PREREQUISITE` or `DEPENDS_ON` chain, a cycle is detected and reported.
   - Cycle detection prevents circular prerequisite chains (e.g. $A \to B \to C \to A$).
5. **Bounded Traversal Depth**: All graph traversals (prerequisites, learning paths, neighborhood subgraphs) enforce a strict maximum depth of $5$ (configurable, default $5$).

---

## 5. Deterministic Algorithms

### 5.1 Related Concept Scoring Algorithm
Computes conceptual similarity between concept $C_1$ and candidate concept $C_2$:
$$\text{RelatedConceptScore}(C_1, C_2) = w_r \cdot S_{\text{rel}} + w_e \cdot S_{\text{shared\_events}} + w_c \cdot S_{\text{category}} + w_g \cdot S_{\text{graph\_dist}}$$
Where:
- $S_{\text{rel}}$: Direct relationship weight ($1.0$ for direct relation, $0.0$ otherwise).
- $S_{\text{shared\_events}}$: Jaccard similarity of events containing both concepts:
  $$\frac{|\text{Events}(C_1) \cap \text{Events}(C_2)|}{|\text{Events}(C_1) \cup \text{Events}(C_2)|}$$
- $S_{\text{category}}$: Category match ($1.0$ if same category, $0.3$ if different).
- $S_{\text{graph\_dist}}$: Graph proximity decay ($\frac{1}{\text{shortest\_path\_distance}}$ for distance $\le 3$, $0$ otherwise).
- Weights: $w_r = 0.35, w_e = 0.30, w_c = 0.20, w_g = 0.15$.
- Normalized to $0 - 100$.

### 5.2 Related Event Scoring Algorithm
For a given canonical event $E_{\text{target}}$ and candidate event $E_{\text{candidate}}$:
$$\begin{aligned}
\text{RelatedEventScore} = &\ 0.40 \cdot \text{SharedConceptScore} \\
& + 0.20 \cdot \text{RelatedConceptScore} \\
& + 0.15 \cdot \text{CategorySimilarity} \\
& + 0.10 \cdot \text{RegionSimilarity} \\
& + 0.10 \cdot \text{TemporalRelevance} \\
& + 0.05 \cdot \text{GlobalImportance}
\end{aligned}$$
Where:
- $\text{SharedConceptScore}$: Jaccard similarity of concept IDs directly linked to both events.
- $\text{RelatedConceptScore}$: Average relatedness between concept sets of $E_1$ and $E_2$.
- $\text{CategorySimilarity}$: $100$ if identical category, $20$ otherwise.
- $\text{RegionSimilarity}$: $100$ if identical region, $50$ if global/regional overlap, $0$ otherwise.
- $\text{TemporalRelevance}$: Exponential decay over time difference: $100 \cdot e^{-\lambda \cdot \Delta t_{\text{hours}}}$.
- $\text{GlobalImportance}$: Phase 5 canonical rank score of candidate event.
- Candidates exclude $E_{\text{target}}$ itself and duplicate cluster duplicates.

### 5.3 Deterministic Learning Path Generator
Given target concept $C_{\text{target}}$, user ID (optional), and prerequisite DAG:
1. Perform reverse topological sort from $C_{\text{target}}$ up to depth $5$ to collect all ancestor prerequisites.
2. For each concept in the ancestor tree:
   - Query user mastery from `LearningRepository`.
   - Categorize status: `STRONG` ($\ge 80$), `DEVELOPING` ($50-79$), `NEEDS_LEARNING` ($< 50$), `UNKNOWN` ($0$).
3. Filter & order the path:
   - Include all `NEEDS_LEARNING` and `UNKNOWN` prerequisites (critical knowledge gaps).
   - Include `DEVELOPING` prerequisites if they are immediate parents.
   - Omit `STRONG` prerequisites from the active learning sequence unless explicitly requested.
   - Append the target concept $C_{\text{target}}$ as the final step.
4. Output structured steps:
   `Step 1 -> Missing Prereq A -> Step 2 -> Developing Prereq B -> Step 3 -> Target Concept`.

### 5.4 Event Knowledge Map Builder
For an event $E$:
1. Retrieve key concepts $K(E)$ from `event_concepts`.
2. Retrieve all prerequisite trees for each $c \in K(E)$.
3. Attach authenticated user mastery status to every concept node.
4. Identify outstanding knowledge gaps: prerequisites with status `NEEDS_LEARNING` or `UNKNOWN`.
5. Synthesize the "What You Need to Understand This" and "Learn These First" payloads.

---

## 6. API Design

### 6.1 Concept Intelligence Endpoints
- `GET /api/concepts/:id`: Detailed concept information, definition, category, and direct relationships.
- `GET /api/concepts/:id/related`: Top deterministic related concepts with scoring and reason breakdown.
- `GET /api/concepts/:id/prerequisites`: Full prerequisite DAG up to depth $5$ with cycle validation.
- `GET /api/concepts/:id/learning-path`: Topological learning path tailored to the user's mastery.
- `GET /api/concepts/:id/knowledge-status`: Authenticated endpoint returning user's mastery status, quiz history, and gap analysis for this concept.

### 6.2 Event Cross-Topic Intelligence Endpoints
- `GET /api/events/:id/knowledge-map`: Complete knowledge map including key concepts, prerequisite tree, user mastery status, and "Learn Before This" items.
- `GET /api/events/:id/related`: Top $N$ related canonical events scored via multi-signal formula with explainability breakdown.

---

## 7. Frontend Integration & UI Design

### 7.1 EventDetailPage Enhancements
1. **Section 1: "What You Need to Understand This"**:
   - Visual concept pills with status badges (✓ Strong, ⚠ Developing, ✕ Needs Learning, ○ Unexplored).
2. **Section 2: "Your Knowledge Status"**:
   - Summary card displaying user's readiness percentage for the event.
3. **Section 3: "Learn These First" (Knowledge Gaps)**:
   - Ordered list of missing foundational prerequisites with one-click learning modals.
4. **Section 4: "Interactive Knowledge Graph View"**:
   - Visual dependency tree displaying prerequisites $\to$ key concepts $\to$ current event.
5. **Section 5: "Related Real-World Events"**:
   - Cards showing related events with reason badges (e.g., *"Shares 2 Core Concepts"*, *"Connected via Monetary Policy"*).

### 7.2 Dedicated Concept Detail Experience
- Route: `/concept/:id` and interactive modal viewer.
- Displays: Title, category, multi-level definition, prerequisite tree, related concepts, related news events, and personalized learning path.

---

## 8. Security & Multi-Tenant Isolation

1. **Strict Auth on Private Knowledge Data**:
   - All mastery-dependent endpoints extract `userId` strictly from verified JWT claims (`req.user.id`).
   - Querying another user's mastery or passing spoofed user IDs in parameters will result in a 401/403.
2. **Deterministic Server Truth**:
   - Mastery states, gap calculations, and relationship scores are computed entirely on the backend; client input cannot modify scores.
3. **Input Validation**:
   - Validates all slug/UUID inputs, enforces pagination bounds (`limit <= 50`), and caps traversal depth (`depth <= 5`).
4. **IDOR Prevention**:
   - Accessing public concept/event graph structures does not leak private user learning records.

---

## 9. Performance & Optimization

1. **Bounded Traversal**: Strict max depth $5$ prevents unbounded recursive queries.
2. **Batch Querying**: Single-batch fetches for node prerequisites and mastery records to eliminate N+1 queries.
3. **Graph In-Memory Indexing**: Adjacency lists maintained in `KnowledgeGraphRepository` for instantaneous path traversal during high concurrency.
4. **Database Indexes**: Indexed foreign keys on `(source_concept_id)`, `(target_concept_id)`, `(concept_id, event_id)`.

---

## 10. Comprehensive Verification & Test Strategy (`phase9.test.ts`)

Create `server/src/tests/phase9.test.ts` covering all 31 test points:
- **Graph Structure & Integrity**:
  1. Concept relationships load correctly.
  2. Related concepts are mathematically deterministic.
  3. Prerequisites load hierarchically.
  4. Self-loops are rejected with error.
  5. Duplicate edges are prevented.
  6. Invalid concept IDs are rejected.
  7. Circular prerequisite chains ($A \to B \to A$) are detected and prevented.
  8. Traversal depth is bounded at max depth 5.
- **Related Events & Cross-Topic Intelligence**:
  9. Shared concepts properly influence related event ranking.
  10. Duplicate canonical events and self-events are excluded.
  11. Multi-signal related event ranking is deterministic.
- **Mastery Integration**:
  12. User mastery is correctly attached to concept nodes.
  13. STRONG concepts are classified correctly ($\ge 80\%$).
  14. DEVELOPING concepts are classified correctly ($50-79\%$).
  15. NEEDS_LEARNING concepts are classified correctly ($< 50\%$).
  16. Missing/unattempted concepts default to UNKNOWN without errors.
- **Learning Path Generation**:
  17. Missing prerequisites are identified as step 1.
  18. Strongly mastered prerequisites are skipped in the recommended sequence.
  19. Developing prerequisites are included.
  20. Target concept is positioned at the end of the path.
  21. Graph cycles cannot cause infinite recursion or stack overflows.
- **Security & Multi-Tenant Isolation**:
  22. Authentication is strictly required for private knowledge endpoints.
  23. Cross-user mastery access is blocked (User A cannot access User B).
  24. Spoofed user IDs are rejected.
  25. Client cannot tamper with graph weights or mastery status.
- **Full Regression Integration**:
  26. Phase 5 ranking continues to pass.
  27. Phase 6 AI understanding continues to pass.
  28. Phase 6 quiz system continues to pass.
  29. Phase 7 mastery engine continues to pass.
  30. Phase 7 spaced repetition continues to pass.
  31. Phase 8 personalized discovery feed continues to pass.
