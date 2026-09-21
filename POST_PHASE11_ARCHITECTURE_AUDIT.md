# AKIRA — POST-PHASE-11 ARCHITECTURE AUDIT

## 1. Current Architecture

AKIRA's system architecture post-Phase 11 comprises an eleven-tier, unidirectional, deterministic intelligence and adaptive learning pipeline:

```
[Real-World Ingestion] (Phase 4 RSS / Wire Sources)
       ↓
[Entity Resolution & Canonical Events] (Phase 4 Clustering)
       ↓
[Multi-Factor Ranking Engine] (Phase 5: Importance, Freshness, Velocity)
       ↓
[Temporal Storyline Abstraction] (Phase 11: Multi-Event Narrative Grouping)
       ↓
[Chronological Timeline & Trajectory] (Phase 11: Turning Points & Delta Knowledge)
       ↓
[Trust & Evidence Intelligence] (Phase 10: 6-Pillar Completeness & Provenance)
       ↓
[AI Deep Understanding] (Phase 6: 5W1H Structured Decomposition)
       ↓
[Knowledge Graph & Concept Lattice] (Phase 9: 3-Color DFS Prerequisite Traversal)
       ↓
[6-Factor Adaptive Personalization] (Phase 8: 80/20 Relevance & Exploration Feed)
       ↓
[Generative Quizzing & Mastery Engine] (Phase 7: Accuracy & Progression Tracking)
       ↓
[SM-2 Spaced Repetition Engine] (Phase 7: Optimal Review Intervals & Ease Factors)
       ↓
[Personalized Storyline Delta] (Phase 11: Known vs New Since Last Review)
```

The system operates across a Node.js/Express TypeScript backend with a dual-mode persistence architecture (PostgreSQL/Neon with resilient In-Memory fallback caches) and a React 18 / Tailwind / Vite client frontend.

---

## 2. End-to-End Pipeline

Every link across AKIRA's data and learning pipeline has been verified through automated end-to-end tests and code inspections:

1. **Real-World Ingestion → Canonical Events**: RSS and raw articles are normalized and grouped into canonical event clusters based on semantic similarity and timestamp windows.
2. **Canonical Events → Ranking**: Events receive multi-factor rank scores ($0.35 \times \text{Importance} + 0.30 \times \text{Velocity} + 0.25 \times \text{Freshness} + 0.10 \times \text{Corroboration}$).
3. **Canonical Events → Temporal Storylines**: Storylines link canonical events across time with deterministic association scores ($0.25 \times \text{Concepts} + 0.20 \times \text{Time} + 0.15 \times \text{Region} + 0.15 \times \text{Category} + 0.10 \times \text{Semantic} + 0.10 \times \text{KG} + 0.05 \times \text{Sources}$).
4. **Storylines → Timeline & Trajectory**: Sequence ordering preserves chronological integrity ($E_1 \to E_2 \to \dots \to E_n$), automatically detecting factual turning points and trajectories (`ESCALATING`, `DEVELOPING`, `STABLE`, `DE-ESCALATING`, `CONCLUDED`, `UNKNOWN`).
5. **Timeline → Evidence Intelligence**: Phase 10 computes 6-pillar evidence completeness scores without generating competing or contradictory metrics.
6. **Timeline → Delta Knowledge**: Computes exact factual progression ($E_t \setminus E_{t-1}$) including new facts, revised figures, and newly introduced concepts.
7. **Canonical Events → Knowledge Graph**: Concepts extracted from events connect into a directed acyclic prerequisite lattice traversed via 3-color cycle-safe DFS.
8. **Concepts & Events → Adaptive Personalization**: Computes 6-factor composite scores ($0.25G + 0.25K + 0.20R + 0.15C + 0.10F + 0.05E$) allocating 80% relevance and 20% exploration slots.
9. **Personalization → Quiz & Mastery**: User quiz attempts update concept and event mastery scores.
10. **Mastery → SM-2 Spaced Repetition**: Quiz scores map to SM-2 quality grades ($q \in [0, 5]$), interval days, and ease factors.
11. **User Mastery → Storyline Delta**: Storyline views compute user-specific unlearned developments since their last mastery timestamp.

---

## 3. Phase 1–11 Status

| Phase | Description | Assertions / Tests | Status |
|---|---|---|---|
| **Phase 1** | System Infrastructure & Baseline API | 5 / 5 | **PASSED** |
| **Phase 3** | Regional News Stream & Live Ingestion | 5 / 5 | **PASSED** |
| **Phase 4** | Real-World News Ingestion & Deduplication | 10 / 10 | **PASSED** |
| **Phase 5** | Multi-Factor Event Ranking & Dynamic Decay | 26 / 26 | **PASSED** |
| **Phase 6** | 5W1H Structured AI Understanding | 11 / 11 | **PASSED** |
| **Phase 7** | Personalization, Mastery & SM-2 Spaced Repetition | 17 / 17 | **PASSED** |
| **Phase 8** | Intelligent Daily Learning & 6-Factor Personalization | 18 / 18 | **PASSED** |
| **Phase 9** | Deep Concept Graphs & Prerequisite Traversal | 15 / 15 | **PASSED** |
| **Phase 10** | Trust, Evidence & Source Intelligence Layer | 6 / 6 | **PASSED** |
| **Phase 11** | Temporal Storyline Evolution & Narrative Trajectory | 27 / 27 | **PASSED** |
| **Total** | **Full Regression Suite** | **140 / 140** | **PASSED (100%)** |

---

## 4. Phase 11 Implementation Audit

- **Storyline Data Model**: Clean separation between `storylines` (high-level narrative) and `storyline_events` (canonical event mappings).
- **Event-Storyline Relationship**: True many-to-many relationship supporting multi-narrative intersections.
- **Association Scoring**: Deterministic, weighted across 7 signals with full breakdown transparency.
- **Association Thresholds**: Auto-associate $\ge 65$, Possible $40–64$, Unrelated $< 40$.
- **Timeline Ordering**: Strictly enforced by publication and occurrence timestamps ($t_1 \le t_2 \le \dots \le t_n$).
- **Turning-Point Detection**: Rule-driven, triggering on lifecycle transitions, high importance spikes, or policy shifts with objective explanations.
- **Trajectory Engine**: Grounded strictly in observable event frequency and status—zero speculative or probabilistic predictions.
- **Delta Knowledge ($E_t \setminus E_{t-1}$)**: Computes new facts, revised figures, and new concepts with zero fabricated differences on identical comparisons.
- **User Learning Delta**: Accurately queries user-specific mastery to isolate already known vs new developments.
- **API Implementation**: Fully validated with Zod, protected routes, and standardized error envelopes.
- **Frontend Implementation**: Interactive timeline, collapsible Delta tabs, turning point callouts, and Explore page shelf.
- **Idempotency & Concurrency**: Safe under concurrent requests with stable sorting and mutex guards.
- **Security**: Strict server-side scoring, stripping any client-injected trajectory or association data.

---

## 5. Data Integrity

- **Foreign Keys**: `storylines.category_id` and `storylines.region_id` reference lookup tables; `storyline_events.storyline_id` and `event_id` cascade on delete.
- **Unique Constraints**: `CONSTRAINT uq_storyline_event UNIQUE (storyline_id, event_id)` prevents duplicate associations.
- **Orphan Record Protection**: Junction tables use foreign key cascades and existence checks before relationship insertion.
- **Timestamp Consistency**: All date fields enforce ISO-8601 formatting with fallback guards for missing publish dates.
- **Historical Event Preservation**: Associating an event to a storyline never overwrites or mutates the underlying canonical event fields.
- **Migration Safety**: Migration `010_phase11_temporal_storylines.sql` uses `IF NOT EXISTS` constructs with idempotent seed data.
- **PostgreSQL / In-Memory Dual Consistency**: Repository methods fall back to in-memory caches seamlessly when PostgreSQL is unreachable.

---

## 6. Storyline Quality

- **Unrelated Event Rejection**: Verified by Unit Test 5; disparate events (e.g. macroeconomics vs local transit) score $< 20$ and are strictly rejected.
- **Duplicate Storylines**: Prevented through unique IDs and centralized association checks.
- **Contradictory Relationships**: Chronological sorting prevents future events from being ordered before ancestral events.
- **Fabricated Delta Prevention**: Verified by Unit Test 13; identical events produce exactly 0 changed facts and 0 new concepts.
- **Turning Point Classification**: Derived strictly from verified event attributes (e.g. `OFFICIAL_CONFIRMATION` lifecycle state) rather than arbitrary sentiment analysis.
- **Grounded Conclusions**: Trajectory indicators only reflect past and present pacing; no predictive political or financial claims are generated.

---

## 7. Evidence Integration

- **Phase 10 Authority**: Phase 10 remains the single source of truth for evidence intelligence. Phase 11 aggregates Phase 10 outputs without recalculating or creating conflicting scores.
- **Evidence State & Completeness**: Storyline evidence overviews aggregate individual event completeness scores ($0–100$) and confidence states (`WELL_SUPPORTED`, `DEVELOPING`, `LIMITED_EVIDENCE`, `CONFLICTING`, `UNCONFIRMED`).
- **Source Provenance & Conflicts**: All publisher URLs, authority tiers, and detected discrepancies are preserved throughout storyline views.

---

## 8. Learning Integration

- **Phase 7 SM-2 Preservation**: Spaced repetition interval calculations, ease factors ($EF \ge 1.3$), and repetition counts remain identical.
- **Phase 8 Personalization Preservation**: 6-factor composite recommendation scoring ($0.25G + 0.25K + 0.20R + 0.15C + 0.10F + 0.05E$) runs unchanged.
- **Storyline Learning Delta**: Correctly segments events into `alreadyKnownEventIds` vs `newEventsSinceLastLearning` using user mastery tables.
- **Spoof Prevention**: Mastery updates require valid quiz completions processed on the server; client cannot inject arbitrary mastery states.

---

## 9. Knowledge Graph Integration

- **Phase 9 Preservation**: 3-color DFS traversal (`WHITE`, `GRAY`, `BLACK`) and prerequisite DAG checks remain intact.
- **Concept Connectivity**: Storyline overviews extract dominant concepts and surface prerequisite concepts from the knowledge graph.
- **Related Storylines**: Discovered deterministically through shared knowledge graph concept IDs.

---

## 10. Frontend Audit

- **EventDetailPage**:
  - Displays interactive chronological timeline with trajectory badges.
  - Highlights turning points with factual attribution badges.
  - "What Changed" Delta Knowledge Hub offers tabs for New Facts, Changed Facts, and New Concepts.
  - Personalized Learning Delta banner informs users of new developments since their last review.
- **ExplorePage**:
  - Contains "Living Real-World Storylines" shelf displaying active narratives.
- **State Handling**: Loading spinners, empty states, and fallback error states are implemented.
- **Honest UI**: No dummy counters or placeholder buttons; all metrics bind directly to backend API responses.

---

## 11. API Audit

- **Endpoints Audited**:
  - `GET /api/storylines` (paginated discovery with filters)
  - `GET /api/storylines/:id` (full detail package)
  - `GET /api/storylines/:id/timeline` (chronological events)
  - `GET /api/storylines/:id/turning-points` (inflection points)
  - `GET /api/storylines/:id/delta` (step-by-step delta)
  - `GET /api/storylines/:id/learning-delta` (user-specific delta)
  - `GET /api/events/:id/storylines` (event-to-storylines lookup)
  - `POST /api/storylines/associate` (admin association route with `requireInternalSecret`)
- **Validation**: All query parameters, route params, and request bodies validated via Zod schemas.
- **Rate Limiting**: Rate limiting middleware active on all public endpoints.
- **SQL Parameterization**: All SQL queries use parameterized arguments (`$1`, `$2`, etc.), preventing SQL injection.

---

## 12. Performance Audit

- **N+1 Query Finding**: `storyline.service.ts` fetches canonical events sequentially in a loop during timeline construction.
  - *Status*: Acceptable for current timeline lengths ($< 20$ events), but batch `findByIds` query will improve latency as storylines grow.
- **Knowledge Overview Graph Lookups**: Concept relation traversals execute per concept.
  - *Status*: Bounded by repository caching; low overhead in production.
- **Indexing**: Tables `storylines`, `storyline_events`, `storyline_turning_points`, and `storyline_updates` feature primary keys and foreign key indexes.

---

## 13. Security Audit

- **SQL Injection**: Zero raw string concatenation in SQL queries; 100% parameterized queries.
- **Client Spoofing**: All trajectory, association, and delta scores are calculated exclusively on the server.
- **Tenant Isolation**: User learning progress is filtered strictly by authenticated `userId`.
- **Sensitive Data**: Internal mutation endpoints require `x-internal-secret` header authentication.

---

## 14. Documentation Consistency

- `PHASE11_DOCUMENTATION.md` accurately describes data models, association formulas, trajectory classifications, and API routes matching the live TypeScript implementation.
- `PHASE11_COMPLETION_REPORT.md` details all deliverables, deliverables links, and test metrics.
- All Phase 1–10 terminology (Canonical Events, SM-2 Spaced Repetition, 6-Pillar Evidence Completeness, 3-Color DFS) remains consistent across documentation.

---

## 15. Test Results

- **Phase 11 Suite (`phase11.test.ts`)**: 27 / 27 tests PASSED (100%).
- **Full Regression Suite (`npm test`)**: 140 / 140 assertions PASSED (100%).
- **Failures**: 0.

---

## 16. Build Results

- **Server Build (`npm run build`)**: PASSED (0 TypeScript errors).
- **Client Build (`npm run build`)**: PASSED (0 Vite/TypeScript errors; synced to `../dist`).

---

## 17. Real User Journey

| Step | User Action / Experience | Verified Pipeline Component | Status |
|---|---|---|---|
| 1 | Opens AKIRA homepage | `/api/live/top` (Phase 5 Ranking) | Functional |
| 2 | Browses events & storylines | `/api/storylines` & Explore shelf (Phase 11) | Functional |
| 3 | Opens event detail page | `/api/events/:id` (Phase 4 & 6) | Functional |
| 4 | Inspects evidence & sources | `/api/events/:id/evidence` (Phase 10) | Functional |
| 5 | Reads 5W1H explanation | `/api/understand/:id` (Phase 6) | Functional |
| 6 | Reviews storyline timeline | `/api/storylines/:id/timeline` (Phase 11) | Functional |
| 7 | Inspects Delta Knowledge | `/api/storylines/:id/delta` (Phase 11) | Functional |
| 8 | Explores prerequisite concepts | `/api/concepts/:id/prerequisites` (Phase 9) | Functional |
| 9 | Completes concept quiz | `/api/quizzes/submit` (Phase 7 & 8) | Functional |
| 10 | Gains mastery score | `mastery.service.ts` (Phase 7) | Functional |
| 11 | Returns later for review | `/api/learning/reviews/due` (Phase 7 SM-2) | Functional |
| 12 | Views new storyline updates | `/api/storylines/:id/learning-delta` (Phase 11) | Functional |

**Identified Transition Gap**: While the user can see what has changed in a storyline since their last review, there is currently no direct **"One-Click Catch-Up Briefing / Delta Audio & Interactive Summary"** that synthesizes the multi-event gap into a single unified dynamic reading session.

---

## 18. Remaining Gaps

1. **Functional Gap**: Storyline updates require manual navigation between events; there is no unified multi-event storyline briefing or consolidated narrative synthesis.
2. **User-Value Gap**: Users following long-running storylines over weeks have to read multiple individual event deltas rather than an aggregated "Catch-Up Briefing".
3. **Technical Gap**: Timeline queries fetch canonical events individually rather than via batch lookup.
4. **Data-Quality Gap**: Storyline association is currently event-to-event pairwise; multi-event cluster centroid matching could further improve association recall.
5. **Interview / Demo Gap**: Demonstrating the storyline evolution currently requires scrolling through chronological events rather than playing an animated / structured "Storyline Journey Mode".

---

## 19. Recommended Phase 12

### **AKIRA Phase 12: Living Storyline Catch-Up Briefings & Chronological Synthesis Engine**

Build a deterministic storyline synthesis engine that generates:
1. **Aggregated Catch-Up Briefings**: Consolidates $N$ unread storyline updates into a single structured multi-event summary tailored to the user's mastery gap.
2. **Chronological Storyline Journey Mode**: An interactive stepped walkthrough allowing users to scrub through the history of a storyline from origin to latest development.
3. **Batch Timeline Query Optimization**: Optimized batch repository queries for high-throughput storyline timeline generation.

---

## 20. Why Phase 12 Should Come Next

1. **Directly Completes the Storyline User Loop**: Phase 11 built the structural data models, association engines, and delta calculations. Phase 12 delivers the ultimate user payoff: catching up on weeks of complex real-world news in 60 seconds.
2. **Leverages All Prior Phases**: Synthesizes Phase 6 (5W1H), Phase 9 (Concept Graphs), Phase 10 (Evidence Provenance), and Phase 11 (Storyline Deltas).
3. **High Architectural Value, Low Risk**: Operates purely as a presentation and synthesis layer without altering foundational ranking, SM-2, or evidence scoring math.

---

## 21. Phase 12 Non-Goals

- Strictly NO generative AI hallucination of future events or predictive outcomes.
- Strictly NO modification of Phase 5 ranking, Phase 7 SM-2, Phase 8 personalization, Phase 9 DFS traversal, or Phase 10 evidence completeness formulas.
- Strictly NO speculative political or market forecasting.

---

## 22. Risks

1. **Synthesis Redundancy**: Aggregating multiple events could repeat background facts if not properly deduplicated via Delta Knowledge.
   - *Mitigation*: Base synthesis strictly on the union of computed `newFacts` and `changedFacts`.
2. **Performance Scaling**: Generating multi-event briefings dynamically could increase response times.
   - *Mitigation*: Cache computed briefings at the storyline update boundary.
3. **Cognitive Overload**: Presenting too many turning points at once could overwhelm the learner.
   - *Mitigation*: Limit catch-up briefings to high-salience milestones and key factual revisions.
