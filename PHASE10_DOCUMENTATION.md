# AKIRA Phase 10: Trust, Evidence & Source Intelligence Layer

## 1. Executive Summary

Phase 10 delivers AKIRA's deterministic, transparent **Trust, Evidence & Source Intelligence Layer**. 

### The Core Philosophy: Determinism Over Hallucinated Truth Scores
AKIRA does **not** act as an arbitrary judge of "truth" or assign subjective "fake news" percentage ratings. Instead, AKIRA computes an objective **Evidence Completeness Score (0-100)** and classifies **Confidence State** (`WELL_SUPPORTED`, `DEVELOPING`, `LIMITED_EVIDENCE`, `CONFLICTING`, `UNCONFIRMED`) based strictly on verifiable source count, independent publisher diversity, official primary source presence, freshness, and cross-source reporting agreement.

When reporting discrepancies occur across credible outlets (e.g. diverging casualty numbers or financial valuations), AKIRA highlights both figures side-by-side neutrally without taking sides.

---

## 2. Architecture & Data Model

### 2.1 Database Schema (`009_phase10_evidence_intelligence.sql`)
The schema introduces multi-source evidence tracking, source health diagnostics, and structured conflict tracking:

```sql
-- 1. Extend Sources Table with Health and Type
ALTER TABLE public.sources 
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) NOT NULL DEFAULT 'NATIONAL',
  ADD COLUMN IF NOT EXISTS consecutive_failures INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specialization VARCHAR(100),
  ADD COLUMN IF NOT EXISTS health_status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY';

-- 2. Event Corroborating Evidence Table
CREATE TABLE IF NOT EXISTS public.event_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL REFERENCES public.canonical_events(id) ON DELETE CASCADE,
    article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    source_id VARCHAR(100) REFERENCES public.sources(id) ON DELETE SET NULL,
    source_name VARCHAR(150) NOT NULL,
    evidence_type VARCHAR(50) NOT NULL DEFAULT 'INDEPENDENT_REPORTING',
    source_authority_tier INT NOT NULL DEFAULT 2 CHECK (source_authority_tier IN (1, 2, 3)),
    is_independent BOOLEAN NOT NULL DEFAULT true,
    evidence_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evidence_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    verification_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_evidence UNIQUE (event_id, source_id, article_id)
);

-- 3. Evidence Reporting Conflicts Table
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
```

---

## 3. Mathematical & Algorithmic Engines

### 3.1 Composite Evidence Completeness Score (0-100)
The Evidence Completeness Score is deterministically computed from 6 weighted pillars:

$$\text{CompletenessScore} = \sum_{i=1}^{6} w_i \cdot S_i$$

| Pillar | Weight ($w_i$) | Scaling Logic ($S_i \in [0, 100]$) |
|---|---|---|
| **1. Independent Publisher Count** | **25%** | 1 pub = 30, 2 pubs = 60, 3 pubs = 85, $\ge 4$ pubs = 100 |
| **2. Primary Source Presence** | **20%** | 0 official sources = 0, 1 source = 80, $\ge 2$ sources = 100 |
| **3. Source Type Diversity** | **20%** | 1 type = 30, 2 types = 65, $\ge 3$ types (Wire, Govt, Specialist) = 100 |
| **4. Freshness & Recency** | **15%** | $\le 2\text{h} = 100$, $\le 6\text{h} = 80$, $\le 12\text{h} = 60$, $\le 24\text{h} = 40$, $> 24\text{h} = 20$ |
| **5. Source Authority Tier** | **10%** | Tier 1 = 100, Tier 2 = 70, Tier 3 = 40 (Averaged across sources) |
| **6. Cross-Source Agreement** | **10%** | No conflicts = 100, Low = 75, Med = 45, High = 15 |

### 3.2 Conglomerate Publisher Deduplication (Entity Resolution)
To prevent coordinated syndication networks or multi-outlet media conglomerates from artificially inflating corroboration scores, outlets sharing a common parent corporation (`conglomerateId`) are grouped together:
$$\text{UniquePublishers} = |\{\text{conglomerateId} \text{ if set, else } \text{publisherName}\}|$$

### 3.3 Deterministic Confidence State Classification
- **`WELL_SUPPORTED`**: Completeness Score $\ge 70$ AND ($\ge 3$ Independent Publishers OR ($\ge 1$ Primary Source AND $\ge 2$ Independent Publishers)).
- **`DEVELOPING`**: $\ge 2$ Independent Publishers OR $\ge 1$ Primary Source.
- **`LIMITED_EVIDENCE`**: Exactly 1 publisher reporting.
- **`CONFLICTING`**: Severe cross-publisher discrepancy detected on critical fields.
- **`UNCONFIRMED`**: Insufficient independent corroboration.

---

## 4. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events/:id/evidence` | Returns full evidence summary, completeness score, confidence state, breakdown, and conflict list. |
| `GET` | `/api/events/:id/sources` | Returns list of source provenance items with direct URLs and authority tiers. |
| `GET` | `/api/events/:id/conflicts` | Returns detected cross-publisher reporting discrepancies. |
| `POST` | `/api/events/:id/evidence` | Internal / Admin endpoint to record verified corroboration. |
| `POST` | `/api/events/:id/conflicts` | Internal / Admin endpoint to record manual or detected conflicts. |
| `GET` | `/api/sources/health` | Returns health reports and uptime status for all monitored sources. |
| `GET` | `/api/sources/:id/health` | Returns health diagnostic for a single source. |

---

## 5. Frontend UI Integration

Integrated directly into [`EventDetailPage.tsx`](file:///a:/My%20web%20app(ML%20ai)/client/src/pages/EventDetailPage.tsx):
1. **Evidence Completeness Gauge**: Color-coded progress ring (Emerald/Sky/Amber).
2. **Confidence Status Badge**: Clear state indicator with natural language explanation.
3. **Corroboration Metrics**: Independent publisher counts, Primary sources available, and Source diversity categories.
4. **Reporting Discrepancy Box**: Side-by-side transparent display of conflicting data points with source attribution.
5. **Traceable Source Provenance Table**: Clickable external links, authority tiers, and publisher metadata.
6. **Formula Weights Drawer**: Expandable inspection of the 6 score components.
