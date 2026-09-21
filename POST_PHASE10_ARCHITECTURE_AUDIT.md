# AKIRA — POST-PHASE-10 ARCHITECTURE AUDIT

**Audit Date**: September 21, 2026  
**Status**: PASSED / HIGH STABILITY  
**Scope**: Full-stack codebase inspection across Phases 1 through 10, database schemas, algorithmic services, APIs, security, frontend UI, and end-to-end user journey.

---

## 1. Current System Architecture

AKIRA is architected as a modular, TypeScript-native monorepo dividing responsibilities into a client single-page application and a backend RESTful intelligence engine:

```
AKIRA SYSTEM TOPOLOGY
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 REACT 19 + VITE CLIENT                                  │
│  13 Pages • Glassmorphic Dark/Light Design • TanStack Query • Tailwind CSS             │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │ HTTP REST / JSON API (Bearer JWT / Mock)
┌─────────────────────────────────────────▼──────────────────────────────────────────────┐
│                               EXPRESS TYPESCRIPT SERVER                                │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              API ROUTING & MIDDLEWARE                            │  │
│  │  • Rate Limiting (IP-based)               • Zod Schema Validation                │  │
│  │  • Supabase JWT / Dev Auth                • CORS & Security Headers              │  │
│  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
│                                           │                                            │
│  ┌────────────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                              CORE PIPELINE ENGINES                               │  │
│  │  1. Phase 4: News Ingestion & Canonical Clustering (RSS Fetcher, Jaccard Matcher)│  │
│  │  2. Phase 5: Ranking Engine (Velocity, Importance, Recency Decay, Diversity)     │  │
│  │  3. Phase 6: AI Understanding Layer (5W1H, 5 Explanations, Active Recall Quizzes)│  │
│  │  4. Phase 7: Mastery Engine & SM-2 Spaced Repetition (Ease Factor, UTC Streaks)   │  │
│  │  5. Phase 8: Adaptive Personalization & Discovery Feed (6-Factor Recommendation) │  │
│  │  6. Phase 9: Knowledge Graph Engine (Prerequisite DAG, 3-Color DFS, Readiness)   │  │
│  │  7. Phase 10: Trust, Evidence & Source Intelligence (Conglomerate Deduplication,  │  │
│  │               6-Pillar Completeness Scoring, Discrepancy Detection)              │  │
│  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
│                                           │                                            │
│  ┌────────────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                             DATA ACCESS & STORAGE LAYER                          │  │
│  │  • Primary: PostgreSQL (Neon Serverless / Supabase Native Pool)                  │  │
│  │  • Fallback: Dual-Driver In-Memory Repositories (Guarantees zero offline crashes)│  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End User Journey

We audited the 11-stage cognitive journey from real-world event ingestion to long-term memory retention:

```
REAL-WORLD EVENT
       │
       ▼
 [1. RSS INGESTION] ────────► RSS Parser, URL Normalizer, Content Sanitizer, Zod Validator
       │
       ▼
 [2. CANONICAL EVENT] ──────► Jaccard similarity & domain matching clusters articles into canonical events
       │
       ▼
 [3. TREND / RANKING] ──────► Multi-factor mathematical score ($0.35V + 0.30I + 0.20R + 0.15G$) + Diversity Dampener
       │
       ▼
 [4. EVIDENCE & TRUST] ─────► Conglomerate deduplication, 6-pillar completeness gauge, provenance links, conflict detection
       │
       ▼
 [5. UNDERSTANDING] ────────► 5W1H structured analysis & 5-tier adaptive explanation ladder (ELI5 to Deep Dive)
       │
       ▼
 [6. CONCEPTS] ─────────────► Extraction of core domain principles linked to the event
       │
       ▼
 [7. KNOWLEDGE GRAPH] ──────► 3-color DFS cycle validation, prerequisite DAG ordering, "Learn These First" gap analysis
       │
       ▼
 [8. ADAPTIVE FEED] ────────► Personalized Discovery Feed (6-factor score, category affinity, 20% anti-filter-bubble exploration)
       │
       ▼
 [9. QUIZ / MASTERY] ───────► 3-question scenario active recall quiz evaluated server-side, smoothing historical mastery score
       │
       ▼
 [10. SPACED REPETITION] ───► SM-2 scheduler calculates quality grade, adjusts Ease Factor, sets `next_review_at`
       │
       ▼
 [11. REVIEW & RETENTION] ──► Due reviews surfaced on Dashboard and Learn Page for continuous retention
```

### Connection Verification Checklist:
- **Real Event -> Ingestion**: Functional (`feedFetcher.ts` -> `articleValidator.ts` -> `urlNormalizer.ts`).
- **Ingestion -> Canonical Event**: Functional (`classifier.ts` + `eventMatcher.ts`).
- **Canonical Event -> Trend/Ranking**: Functional (`rankingService.ts` computes final rank score `0-100` and urgency label).
- **Canonical Event -> Evidence**: Functional (`evidence.service.ts` deterministically scores completeness, extracts provenance, flags numeric discrepancies).
- **Canonical Event -> AI Understanding**: Functional (`aiService.ts` produces 5W1H breakdown and 5 difficulty tiers).
- **Understanding -> Concepts -> Knowledge Graph**: Functional (`knowledgeGraph.service.ts` constructs prerequisite DAG trees, prevents cycles, evaluates user readiness percentage).
- **Knowledge Graph -> Personalization**: Functional (`personalization.service.ts` incorporates weak concepts ($<50\%$) and due reviews into personalized feed scoring).
- **Personalized Feed -> Quiz/Mastery**: Functional (`EventDetailPage.tsx` and `event.controller.ts` submit quiz answers to server; server updates `user_concept_mastery` and `user_learning_progress`).
- **Quiz -> SM-2 Spaced Repetition**: Functional (`spacedRepetition.service.ts` schedules next review interval; `learningDashboard.controller.ts` exposes `/api/learning/review`).

---

## 3. Phase 1–10 Status

| Phase | Description | Key Modules | Status | Test Verification |
|---|---|---|:---:|:---:|
| **Phase 1** | Foundations, Database Schemas, Reference Data | `dbClient.ts`, `001_initial_schema.sql`, Region & Category routes | **COMPLETE** | `phase1.test.ts` (14/14 PASS) |
| **Phase 2** | UI Shell, Page Routing, Design System | React 19 SPA, 13 pages, Tailwind CSS, Glassmorphic theme | **COMPLETE** | Client build verified (0 errors) |
| **Phase 3** | Authentication & User Isolation | `auth.middleware.ts`, Supabase JWT, `profiles` table, RLS | **COMPLETE** | `phase3.test.ts` (9/9 PASS) |
| **Phase 4** | Real-World News Ingestion Pipeline | `feedFetcher.ts`, `urlNormalizer.ts`, `eventMatcher.ts` | **COMPLETE** | `phase4.test.ts` (12/12 PASS) |
| **Phase 5** | Mathematical Ranking & Trend Engine | `rankingService.ts`, `trendCalculator.ts`, `diversityDampener` | **COMPLETE** | `phase5.test.ts` (14/14 PASS) |
| **Phase 6** | AI Understanding & Active Recall Quizzes | `aiService.ts`, `5W1H`, 5 Explanation levels, Quiz validator | **COMPLETE** | `phase6.test.ts` (12/12 PASS) |
| **Phase 7** | Mastery Engine & SM-2 Spaced Repetition | `mastery.service.ts`, `spacedRepetition.service.ts`, Streaks | **COMPLETE** | `phase7.test.ts` (17/17 PASS) |
| **Phase 8** | Adaptive Personalization & Discovery Feed | `personalization.service.ts`, 6-factor formula, 80/20 explore | **COMPLETE** | `phase8.test.ts` (14/14 PASS) |
| **Phase 9** | Knowledge Graph & Cross-Topic Intelligence | `knowledgeGraph.service.ts`, 3-color DFS DAG, Readiness Map | **COMPLETE** | `phase9.test.ts` (15/15 PASS) |
| **Phase 10** | Trust, Evidence & Source Intelligence | `evidence.service.ts`, Conglomerate deduplication, Conflicts | **COMPLETE** | `phase10.test.ts` (6/6 PASS) |

---

## 4. Functional Features

1. **Deterministic Corroboration Engine**: Counts deduplicated independent publishers by collapsing outlets belonging to the same media conglomerate (e.g. Times of India + Economic Times -> Times Group = 1 publisher).
2. **6-Pillar Evidence Completeness Scoring**: Weighted calculation ($0.25\text{Pub} + 0.20\text{Primary} + 0.20\text{Div} + 0.15\text{Fresh} + 0.10\text{Auth} + 0.10\text{Agree}$) producing bounded $0-100$ completeness score.
3. **Factual Conflict Detection**: Pattern scanning across reporting articles to detect discrepancies (e.g. monetary figures) and display them in a neutral, non-partisan comparison banner.
4. **DAG Knowledge Graph Traversal**: 3-Color DFS cycle rejection (detecting direct $A \to B \to A$ and transitive $A \to B \to C \to A$ dependency cycles).
5. **Topological Learning Paths**: Orders prerequisites before target concepts with knowledge gap prioritization.
6. **Comprehension Readiness Calculation**: Evaluates user mastery of linked prerequisites to display an overall percentage readiness score on canonical event pages.
7. **Cross-Topic Related Event Scoring**: Multi-signal scoring connecting news events across categories through shared concept overlap and temporal alignment.
8. **SM-2 Spaced Repetition Scheduling**: Adjusts interval days ($1 \to 3 \to I \times \text{EF}$) and Ease Factor based on quiz accuracy grades.
9. **Adaptive 5-Level Explanations**: Dynamically selects between ELI5, Beginner, Student, Technical, and Deep Dive based on user mastery history or manual user toggles.
10. **UTC Multi-Day Streak Engine**: Computes consecutive active calendar days based on server UTC timestamps, preventing client clock manipulation.

---

## 5. Incomplete/Placeholder Features

1. **Development Mock Auth Tokens**: `auth.middleware.ts` allows `mock_user_*` tokens for local testing. While beneficial for offline automated tests, this must be gated so it cannot be activated in a production environment.
2. **Deterministic Fallback Explainer**: When no external LLM API key (e.g. `GEMINI_API_KEY`) is configured, the system uses rule-based templating for 5W1H and quiz synthesis. While stable and deterministic, complex events benefit from live LLM synthesis.
3. **Library Page Sub-tabs**: In `LibraryPage.tsx`, the "Saved Articles" tab actively loads bookmarks from `/api/events`, while the "Saved Events", "Recently Viewed", and "Completed Learning" tabs currently default to counter `0` unless retrieved through user activity streams.
4. **Client-side Fallback Data Shells**: When the backend server is temporarily offline, client pages (`Dashboard.tsx`, `DailyBriefPage.tsx`, `KnowledgePage.tsx`) display graceful static fallback intelligence structures instead of failing with blank white screens.

---

## 6. Technical Debt

1. **Dual DDL Maintenance**: Database table creation queries exist in two places:
   - Migration SQL files (`server/src/db/migrations/001_initial_schema.sql` through `009_phase10_evidence_intelligence.sql`).
   - Inline bootstrap `CREATE TABLE IF NOT EXISTS` block in `server/src/db/dbClient.ts`.
   *Recommendation*: Keep `dbClient.ts` lightweight and execute migrations strictly via a standalone migration runner or CLI script.
2. **PostgreSQL Connection String Warning**: Node.js logs indicate:
   `Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'`.
   *Recommendation*: Explicitly specify `sslmode=verify-full` or configure `rejectUnauthorized: false` in connection pool options.
3. **Client Query Caching Inconsistency**: `App.tsx` initializes `@tanstack/react-query`, but several components (`EventDetailPage.tsx`, `LearnPage.tsx`) use raw `useEffect` + `fetch` instead of `useQuery` hooks.
4. **Search Endpoint Legacy Dual-Query**: `SearchPage.tsx` attempts `apiClient.get('/live', ...)` with fallback to `apiClient.get('/news/live', ...)`. A single unified search API endpoint should be standardized.

---

## 7. Security Findings

- **SSRF Mitigation**: `feedFetcher.ts` validates feed URLs against an approved whitelist of registered source domains before making outbound HTTP requests.
- **Client Script Injection / XSS**: Article titles, snippets, and user inputs pass through HTML sanitization (`sanitizeText`) before storage and rendering.
- **Multi-Tenant User Isolation**: All progress, review schedules, preferences, and quiz attempt endpoints enforce `user_id = req.user.id` filter conditions server-side.
- **Rate Limiting**: Express middleware enforces endpoint rate limits (e.g. 120 req/min for general reads, 60 req/min for quiz submissions).
- **Internal Synchronisation Guard**: Sync triggers (`/api/live/sync`, `/api/news/sync`) require `x-akira-internal-key` or an authenticated admin session.

---

## 8. Data Integrity Findings

- **Referential Integrity**: All relational child tables (`event_evidence`, `evidence_conflicts`, `concept_relations`, `user_learning_progress`, `user_review_schedules`) define `FOREIGN KEY ... ON DELETE CASCADE` referencing canonical events or concepts.
- **Duplicate Prevention**: Unique constraints (`uq_event_evidence`, `uq_concept_relations`, `uq_user_learning_progress_user_event_concept`) prevent duplicate records from corrupting scores.
- **Cycle Prevention**: The Knowledge Graph engine performs cycle detection on all directional prerequisite edges prior to database insertion.
- **Circuit Breaker for Database Pool**: `dbClient.ts` incorporates a 15-second cooloff circuit breaker that falls back to in-memory repositories if PostgreSQL connection timeouts occur, preventing API thread starvation.

---

## 9. Frontend Findings

- **Framework**: React 19 with Vite 6, TypeScript 5.7, and Tailwind CSS.
- **Navigation**: 8 primary navigation tabs (Dashboard, Live, Daily Brief, Explore, Learn, Library, Knowledge, Profile) plus dynamic detail views (`/event/:id`, `/concept/:id`, `/category/:slug`, `/search`, `/all-news`).
- **Visual Design**: Glassmorphic dark/light design system with custom CSS variables, accessible color contrasts, and responsive flex/grid layouts.
- **Production Bundle**: Bundles cleanly in 5.37s with gzip sizes:
  - `vendor-react`: 59.95 kB (gzip)
  - `vendor-query`: 28.34 kB (gzip)
  - `vendor-icons`: 6.62 kB (gzip)
  - `index.js`: 115.72 kB (gzip)

---

## 10. Backend Findings

- **Framework**: Express 4.21 with Node.js ESM modules and TypeScript.
- **Architecture**: Clear layer separation:
  - `routes/` (URL definitions and middleware mounting)
  - `controllers/` (Request handling and HTTP response dispatch)
  - `services/` (Deterministic business logic, graph traversals, and mathematical formulas)
  - `repositories/` (Dual PostgreSQL / in-memory data access objects)
  - `validators/` (Zod schemas for query, params, and body validation)
  - `config/` (Scoring weights, thresholds, and environment flags)

---

## 11. Database Findings

- **Engine**: PostgreSQL 15+ compatible (tested with Neon DB and Supabase).
- **Migration Set**:
  1. `001_initial_schema.sql` (Regions, Categories, Sources, Canonical Events, Articles, Concepts, Profiles)
  2. `002_rls_policies.sql` (Supabase Row-Level Security policies)
  3. `003_seed_data.sql` (Reference sources, categories, regions)
  4. `004_phase5_ranking.sql` (Trend observations table)
  5. `005_phase6_ai_understanding.sql` (AI summaries, multi-level explanations, quizzes, concept prerequisites)
  6. `006_phase7_personalization.sql` (User learning progress, review schedules, quiz attempts, learning activities)
  7. `007_phase8_adaptive_personalization.sql` (User learning preferences)
  8. `008_phase9_knowledge_graph.sql` (Concept relations with weighted directional edges)
  9. `009_phase10_evidence_intelligence.sql` (Source health, event evidence corroboration, evidence conflicts)
  10. `neon_schema.sql` (Consolidated single-file baseline)

---

## 12. API Findings

- **Endpoint Consistency**: All endpoints adhere to standardized JSON formats:
  ```json
  {
    "success": true,
    "data": { ... },
    "timestamp": "2026-09-21T06:54:00.000Z"
  }
  ```
- **Error Responses**: Return descriptive HTTP status codes (400, 401, 403, 404, 429, 500) with error messages and timestamps.
- **Backwards Compatibility**: Aliases provided for legacy endpoints (`/api/news`, `/api/news/top`, `/api/quiz/submit`, `/api/daily-brief`).

---

## 13. Test Coverage

All 9 server test suites pass 100% across the full regression suite:

| Test Suite | Assertions Covered | Status |
|---|---|:---:|
| `phase1.test.ts` | Schema validation, source models, region lookups | ✅ 14/14 PASS |
| `phase3.test.ts` | Auth headers, mock dev tokens, user isolation | ✅ 9/9 PASS |
| `phase4.test.ts` | Ingestion pipeline, URL normalization, article deduplication | ✅ 12/12 PASS |
| `phase5.test.ts` | Importance score, trend velocity, recency decay, diversity dampener | ✅ 14/14 PASS |
| `phase6.test.ts` | 5W1H breakdown, 5-tier explanations, quiz evaluation | ✅ 12/12 PASS |
| `phase7.test.ts` | SM-2 scheduling, ease factor modulation, UTC streaks, due reviews | ✅ 17/17 PASS |
| `phase8.test.ts` | 6-factor recommendation scoring, category affinity, 80/20 exploration | ✅ 14/14 PASS |
| `phase9.test.ts` | 3-Color DFS DAG cycle detection, topological learning paths, readiness | ✅ 15/15 PASS |
| `phase10.test.ts` | Conglomerate deduplication, 6-pillar completeness, conflict detection | ✅ 6/6 PASS |
| **Total** | **Full Regression Suite** | **✅ 113/113 PASS (100%)** |

---

## 14. Build Status

- **Server Compilation (`npm run build --workspace=server`)**: 
  - `npx tsc -p tsconfig.json` exits with code 0 (0 compilation errors).
- **Client Compilation (`npm run build --workspace=client`)**:
  - `tsc --noEmit && vite build` exits with code 0 (1,788 modules transformed, 0 bundle errors).
- **Vercel / Distribution Sync**:
  - `copy-dist.js` and `copy-to-root.js` sync client build to `dist/` and `client/dist/` cleanly.

---

## 15. Documentation Mismatches

1. **Phase 7 & Phase 8 Naming Scheme**:
   - In earlier completion reports, Phase 7 was titled *"Personalization & Spaced Repetition"* and Phase 8 *"Adaptive Recommendations"*.
   - The master architectural breakdown specifies:
     - **Phase 7**: Mastery Engine & SM-2 Spaced Repetition.
     - **Phase 8**: Adaptive Personalization & Intelligent Discovery Feed.
   - *Resolution*: Standardized in all current documentation.
2. **README.md Roadmap**:
   - Section 0 in `README.md` contains an early 3-phase roadmap draft ("Phase 1: Accounts, Phase 2: Embeddings, Phase 3: Mobile Native") that does not reflect the executed 10-phase architecture.

---

## 16. Recommended Next Capability

### **Temporal Storyline Evolution & Narrative Trajectory (Lifecycle Intelligence)**

**Why this capability is the missing link in AKIRA**:
AKIRA's mission is to:
> *"Help people understand what is happening in the real world, why it matters, and continuously learn from it."*

Currently, AKIRA represents real-world intelligence as **isolated canonical events** enriched with static 5W1H, explanations, concepts, and evidence. 

However, real-world affairs do not happen in instantaneous, disconnected moments. High-impact news stories—such as major regulatory reforms, geopolitical negotiations, technological milestones, or macroeconomic shifts—are **living, evolving storylines** that unfold across days, weeks, or months through distinct lifecycle phases:

```
[Day 1: Initial Breaking Report]
       │
       ▼
[Day 3: Key Stakeholder Reactions & Counter-Proposals]
       │
       ▼
[Day 7: Official Statutory Confirmation & Legislative Passage]
       │
       ▼
[Day 30: Implementation Milestones & Second-Order Economic Fallout]
```

Without temporal storyline tracking:
1. When a new article is ingested about an ongoing saga, users see either duplicate events or loose connections without understanding the **chronological trajectory**.
2. When the facts of a developing story fundamentally shift, previously taken quizzes and mastery records become outdated because they tested an older stage of the story.
3. Learners lack a **"Storyline Narrative Timeline"** that explains: *"How did this start? What changed? Where is it now? What is the projected trajectory?"*

---

## 17. Why That Capability Should Come Next

1. **Builds Directly on Existing Foundations**:
   - Uses Phase 4 ingestion articles to build chronological event milestones.
   - Leverages Phase 5 velocity to measure story acceleration over time.
   - Connects to Phase 9 Knowledge Graph concepts to show how a story's concept footprint expands as it develops.
   - Enhances Phase 10 Evidence layer by showing how evidence confidence matures from `UNCONFIRMED` $\to$ `DEVELOPING` $\to$ `WELL_SUPPORTED`.
2. **Eliminates Stale Knowledge & Invalids**:
   - Introduces "Delta Learning": When a story advances from an initial rumor to an official law, AKIRA can flag a "Storyline Update Review" in the Spaced Repetition queue.
3. **Elevates User Comprehension**:
   - Provides users with an executive timeline scrubber and storyline evolution graph to understand multi-stage complex world events.

---

## 18. Proposed Phase 11 Scope

1. **Storyline Entity & Lifecycle State Machine**:
   - Model `Storyline` entity grouping multiple chronological `CanonicalEvents`.
   - Lifecycle stages: `BREAKING_EMERGENCE`, `ACTIVE_DEVELOPMENT`, `POLICY_DECISION`, `IMPLEMENTATION`, `RETROSPECTIVE_RESOLUTION`.
2. **Temporal Narrative Timeline Engine**:
   - Automatically clusters related canonical events over a rolling 90-day window into coherent story sagas.
   - Extracts key turning points (milestone events that altered the trajectory of the issue).
3. **Delta Knowledge & Storyline Progression Quizzing**:
   - Quizzes that test comprehension of how the story progressed from Phase A to Phase B.
   - Automatic notification in the Review queue when a mastered event receives a major new development update.
4. **Frontend Storyline Timeline Scrubber**:
   - Interactive chronological timeline UI component on Event Detail and new Storyline pages.
   - Before-and-After analytical impact comparisons.

---

## 19. Phase 11 Non-Goals

- **Non-Goal 1**: Do NOT replace or alter existing Phase 4 ingestion, Phase 5 ranking formulas, or Phase 9 DAG cycle detection.
- **Non-Goal 2**: Do NOT build native mobile iOS/Android applications (maintain focus on responsive web).
- **Non-Goal 3**: Do NOT implement live audio generation or voice synthesizers (keep textual and structural clarity first).
- **Non-Goal 4**: Do NOT introduce speculative opinion forecasting or partisan commentary.

---

## 20. Risks & Mitigations

| Risk | Severity | Mitigation Strategy |
|---|:---:|---|
| **Storyline Over-Clustering**: Merging unrelated events into the same saga due to common keywords. | Medium | Use strict entity extraction + shared concept intersection threshold ($\ge 0.60$) combined with temporal proximity windows. |
| **Narrative Staleness**: Long-running storylines remaining in active state indefinitely. | Low | Implement automatic decay to `RETROSPECTIVE_RESOLUTION` if no new updates occur within 30 days. |
| **Database Query Overhead**: Traversing historical timelines across hundreds of events. | Medium | Add composite indexes on `(storyline_id, published_at DESC)` and cache aggregated timelines. |

---

# AUDIT CONCLUSION

The AKIRA codebase after Phase 10 is structurally sound, mathematically verified, fully tested with 100% test pass rate, and ready for the next evolution of its cognitive learning architecture.

```text
POST-PHASE-10 AUDIT COMPLETE: READY FOR PHASE 11 SPECIFICATION
```
