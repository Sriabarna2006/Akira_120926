# AKIRA Phase 11: Temporal Storyline Evolution & Narrative Trajectory Layer

## 1. Executive Summary

Phase 11 delivers AKIRA's deterministic, transparent **Temporal Storyline Evolution & Narrative Trajectory Layer**.

### The Core Architectural Principle
Real-world events are rarely isolated moments—they evolve chronologically over days, weeks, and months through proposals, debates, official decisions, milestones, implementation, and conclusion.

Prior to Phase 11, AKIRA represented real-world events primarily as individual snapshots. Phase 11 introduces a **Storyline abstraction layer** that groups and links related canonical events into evolving chronological timelines **without altering or replacing underlying canonical events**.

### Strict Non-Prediction Mandate
AKIRA's narrative trajectories describe **what has verifiably happened so far**, not ungrounded speculative predictions or probabilistic election forecasts.
- **Trajectory Classifications**: `ESCALATING`, `DEVELOPING`, `STABLE`, `DE-ESCALATING`, `CONCLUDED`, `UNKNOWN`.
- **Turning Points**: Detected deterministically from factual lifecycle transitions, official policy announcements, regulatory rulings, or milestone completions—accompanied by objective factual explanations.
- **Delta Knowledge**: Computes exact factual progression ($E_t \setminus E_{t-1}$) between chronological steps (new facts, revised figures, superseded assumptions, newly introduced concepts).
- **Personalized Learning Delta**: Compares the user's last mastered/reviewed event in the storyline against newer developments so they only need to read what is new.

---

## 2. Architecture & Data Model

### 2.1 Database Schema (`010_phase11_temporal_storylines.sql`)

```sql
-- 1. Storylines Table (Independent Abstraction Above Canonical Events)
CREATE TABLE IF NOT EXISTS public.storylines (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES public.categories(id),
    region_id VARCHAR(50) NOT NULL REFERENCES public.regions(id),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DORMANT', 'RESOLVED', 'ARCHIVED')),
    trajectory VARCHAR(30) NOT NULL DEFAULT 'DEVELOPING' CHECK (trajectory IN ('ESCALATING', 'DEVELOPING', 'STABLE', 'DE-ESCALATING', 'CONCLUDED', 'UNKNOWN')),
    first_event_at TIMESTAMPTZ NOT NULL,
    latest_event_at TIMESTAMPTZ NOT NULL,
    event_count INT NOT NULL DEFAULT 0,
    pinned_event_ids JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Storyline Events Junction (Many-to-Many Connection Model)
CREATE TABLE IF NOT EXISTS public.storyline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    event_order INT NOT NULL DEFAULT 0,
    association_score INT NOT NULL DEFAULT 70 CHECK (association_score >= 0 AND association_score <= 100),
    association_signals JSONB DEFAULT '{}'::jsonb,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_storyline_event UNIQUE (storyline_id, event_id)
);

-- 3. Storyline Turning Points Table
CREATE TABLE IF NOT EXISTS public.storyline_turning_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    turning_point_type VARCHAR(50) NOT NULL CHECK (turning_point_type IN (
        'OFFICIAL_DECISION', 'METRIC_BREAKTHROUGH', 'CONTROVERSY', 'POLICY_SHIFT', 'MILESTONE_REACHED', 'RESOLUTION'
    )),
    importance_magnitude INT NOT NULL DEFAULT 75 CHECK (importance_magnitude >= 0 AND importance_magnitude <= 100),
    explanation TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Storyline Chronological Updates Table (Delta Knowledge Records)
CREATE TABLE IF NOT EXISTS public.storyline_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id VARCHAR(100) NOT NULL REFERENCES public.storylines(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    previous_event_id VARCHAR(100) REFERENCES public.canonical_events(id) ON DELETE SET NULL,
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN ('NEW_DEVELOPMENT', 'FACT_REVISION', 'MILESTONE', 'CLOSURE')),
    delta_summary TEXT NOT NULL,
    new_facts JSONB DEFAULT '[]'::jsonb,
    changed_facts JSONB DEFAULT '[]'::jsonb,
    new_concepts JSONB DEFAULT '[]'::jsonb,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Mathematical & Algorithmic Engines

### 3.1 Deterministic Association Scoring (0–100)

When evaluating whether canonical event $E$ belongs to storyline $S$, AKIRA calculates a transparent composite association score:

$$\text{AssociationScore}(E, S) = \sum_{k} w_k \cdot S_k$$

| Signal | Weight ($w_k$) | Description & Computation Logic |
|---|---|---|
| **1. Concept Overlap** | **35%** | Jaccard similarity of associated knowledge graph concept IDs: $\frac{|C_E \cap C_S|}{|C_E \cup C_S|} \times 100$ |
| **2. Category Alignment** | **25%** | Exact match on primary category = 100, sub-category match = 70, mismatch = 0 |
| **3. Temporal Proximity** | **20%** | Proximity to storyline's latest event: $\Delta t \le 7\text{d} \to 100$, $\le 30\text{d} \to 80$, $\le 90\text{d} \to 50$, $> 90\text{d} \to 20$ |
| **4. Entity & Title Keyword Overlap** | **20%** | Overlap ratio of key named entities and high-salience terms |

#### Classification Thresholds
- $\text{Score} \ge 65$: **`ASSOCIATED`** (Automatically linked)
- $45 \le \text{Score} < 65$: **`POTENTIAL`** (Suggested candidate)
- $\text{Score} < 45$: **`UNRELATED`** (Rejected)

---

### 3.2 Deterministic Turning-Point Detection Engine

Turning points represent critical structural inflection points in an evolving narrative. AKIRA detects them through objective rule matching:

1. **`OFFICIAL_DECISION`**: Event lifecycle status transitions to `OFFICIAL_CONFIRMATION`, or title/summary contains explicit legislative/cabinet sanction keywords.
2. **`POLICY_SHIFT`**: Significant regulatory, rate, or legal framework adjustment detected.
3. **`MILESTONE_REACHED`**: Infrastructure inaugurations, project phase completions, launch events.
4. **`CONTROVERSY`**: Major stakeholder conflicts, high evidence discrepancy rates, or injunctions.
5. **`RESOLUTION`**: Storyline status transition to `RESOLVED` or formal treaty/contract execution.

Every detected turning point produces an **Objective Factual Explanation** attributing the transition directly to verified events rather than speculative opinion.

---

### 3.3 Deterministic Storyline Trajectory & Velocity Analysis

Trajectory reflects the observable pacing and status of the storyline:

$$\text{EventFrequency} = \frac{|E|}{\Delta t_{\text{days}}}$$

- **`ESCALATING`**: $> 2$ events in the past 7 days with increasing importance/velocity scores.
- **`DEVELOPING`**: Steady pace of events ($\ge 1$ update within 30 days) with ongoing developments.
- **`STABLE`**: Ongoing operational phase with minimal breaking volatility.
- **`DE-ESCALATING`**: Declining event frequency after major turning point.
- **`CONCLUDED`**: Storyline resolved with final milestone reached and status set to `RESOLVED`.
- **`UNKNOWN`**: Insufficient chronological data points ($< 2$ events).

---

### 3.4 Delta Knowledge Computation ($E_t \setminus E_{t-1}$)

Delta Knowledge calculates exact factual changes when advancing chronologically from step $t-1$ to $t$:

- **`newFacts`**: Key assertions in $E_t$ not present in $E_{t-1}$.
- **`changedFacts`**: Factual metrics updated between steps (e.g. Budget revised from ₹5,000 Cr to ₹8,000 Cr; completion timeline updated).
- **`newConcepts`**: Concepts introduced in $E_t$ that were not referenced in prior storyline steps.
- **`supersededAssumptions`**: Prior expectations or initial projections modified by new official data.

---

### 3.5 Personalized User Learning Delta

When authenticated user $U$ visits an evolving storyline:
1. Identify the highest-ordered event in storyline $S$ that user $U$ has already reviewed or mastered in Phase 7 (`UserLearningProgress` / `UserReviewSchedule`).
2. If the user is up-to-date: Badge as `"Caught up with this storyline"`.
3. If new developments exist ($E_{\text{user}} < E_{\text{latest}}$): Extract and display the **Cumulative Delta Knowledge** since their last review step, allowing the user to read 100% of new developments in under 60 seconds.

---

## 4. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/storylines` | Paginated list of storylines with category, region, and status filters. |
| `GET` | `/api/storylines/:id` | Full storyline detail with chronological events, trajectory, and turning points. |
| `GET` | `/api/storylines/:id/delta` | Step-by-step Delta Knowledge across all chronological transitions. |
| `GET` | `/api/storylines/:id/user-delta` | Personalized learning delta comparing user's progress against new storyline updates. |
| `GET` | `/api/events/:id/storylines` | Lists all storylines associated with a specific canonical event. |
| `POST` | `/api/storylines` | Creates a new storyline abstraction (Zod validated). |
| `POST` | `/api/storylines/:id/events` | Associates a canonical event with deterministic association scoring. |

---

## 5. Security, Multi-Tenant Isolation & Zero Regressions

1. **Server-Side Scoring**: Association scores, turning points, trajectories, and deltas are strictly calculated on the server. Client submissions cannot inject arbitrary trajectory classifications.
2. **User Data Isolation**: User learning deltas query user-specific mastery records without leaking other users' progress.
3. **Phase 1–10 Mathematical Preservation**:
   - Phase 4 Canonical Events remain unmodified.
   - Phase 5 Multi-factor Ranking formulas are preserved.
   - Phase 7 SM-2 Spaced Repetition interval calculations remain intact.
   - Phase 8 6-Factor Personalization composite weights remain untouched.
   - Phase 9 Knowledge Graph 3-color traversal runs independently.
   - Phase 10 6-Pillar Evidence Completeness scores remain pristine.
