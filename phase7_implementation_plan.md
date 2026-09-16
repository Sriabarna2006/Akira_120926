# 🚀 AKIRA — PHASE 7 IMPLEMENTATION PLAN
## Personalization, Learning Progress & Spaced Repetition Layer

---

## 1. Existing Architecture Discovered

AKIRA's current stack consists of:
- **Server**: Node.js + Express + TypeScript with ESM modules.
- **Database**: Dual-driver architecture using Neon PostgreSQL with pooling (`pg.Pool`), Supabase JS client fallback, and resilient In-Memory state stores across all repositories.
- **Data Layers**:
  - **Phase 1**: Supabase/PostgreSQL schema, Authentication (`auth.middleware.ts`), Profiles, RLS foundations, Saved Events/Articles.
  - **Phase 3**: Core Data Layer (`Repository` -> `Service` -> `Controller` -> `Route`), Standard API Response Envelope (`ApiResponseHelper`), Zod request validation.
  - **Phase 4**: Real News Ingestion, Feed Fetcher, URL Normalization, Canonical Event Clustering, Ingestion Scheduler.
  - **Phase 5**: Dynamic Ranking, Trend Velocity Detection, Coverage Scoring, Recency Decay, Regional Relevance, Top 10 Diversity Filter.
  - **Phase 6**: AI Understanding Layer (5W1H extraction, 5-level adaptive explanations, concept graph extraction, active recall 3-MCQ quiz engine with deterministic server-side grading).
- **Client**: React 18 + Vite + TypeScript + TailwindCSS + Lucide Icons + TanStack Query + React Router v6.

---

## 2. Tables Already Available in Database

From schema inspection (`001_initial_schema.sql`, `004_phase5_ranking.sql`, `005_phase6_ai_understanding.sql`):
- `public.profiles` (id, email, display_name, avatar_url, role)
- `public.regions`, `public.categories`, `public.sources`, `public.articles`
- `public.canonical_events`, `public.event_sources`, `public.event_updates`, `public.event_concepts`
- `public.concepts` (id, title, slug, category_id, short_definition, full_explanation, prerequisites)
- `public.concept_prerequisites` (concept_id, prerequisite_concept_id)
- `public.event_ai_summaries`, `public.event_explanations`, `public.event_quizzes`
- `public.trend_observations`
- `public.saved_events`, `public.saved_articles`, `public.user_interests`, `public.user_article_history`
- `public.user_concept_mastery` (foundation created in Phase 1)
- `public.quiz_attempts` (foundation created in Phase 1)

---

## 3. Existing Quiz Flow & Security

1. **Quiz Generation (`GET /api/events/:id/quiz`)**:
   - `aiService.getQuiz(eventId)` generates or retrieves 3 grounded MCQs.
   - `EventController.getQuiz` strips `correctAnswer` and `explanation` from the payload before sending to client.
2. **Quiz Evaluation (`POST /api/events/:id/quiz/submit`)**:
   - Validated via `quizSubmissionSchema`.
   - Evaluated server-side against ground-truth questions.
   - Computes score (0–100%), `masteryStatus` (`STRONG` | `DEVELOPING` | `NEEDS_LEARNING`), and returns itemized answer review.
3. **Phase 7 Extension**:
   - When `req.user` is present, `EventController.submitQuiz` will hook into `LearningService.recordQuizAttempt(...)` to update user learning progress, review schedules, attempt audit logs, and streaks.

---

## 4. Existing Profile & Auth Structure

- JWT Bearer authentication processed via `authenticateUser` middleware.
- Offline development/testing supported via `mock_user_<id>` token.
- `req.user` carries `{ id, email, role, metadata }`.
- User ID is derived strictly from verified JWT / token; client-supplied `userId` is never trusted.

---

## 5. Phase 7 Additions & Core Models

### 5.1 User Learning Progress (`user_learning_progress`)
Tracks mastery per user per concept and/or event:
- `user_id`, `concept_id`, `event_id`, `mastery_score` (0–100), `mastery_status`, `attempt_count`, `correct_count`, `incorrect_count`, `last_attempt_at`, `last_mastered_at`.

### 5.2 Spaced Repetition Schedule (`user_review_schedules`)
SM-2-inspired scheduling state:
- `user_id`, `concept_id`, `event_id`, `ease_factor` (default 2.5, min 1.3), `interval_days` (1, 3, interval * easeFactor), `repetition_count`, `last_reviewed_at`, `next_review_at`, `status` (`NEW`, `LEARNING`, `REVIEW`, `MASTERED`).

### 5.3 Normalized Quiz Attempt Audit Log (`user_quiz_attempts`)
Audit history for streaks, historical analytics, and temporal trend tracking:
- `user_id`, `event_id`, `concept_id`, `score`, `total_questions`, `accuracy`, `score_percentage`, `mastery_status`, `answers`, `submitted_at`.

### 5.4 User Learning Activity Log (`user_learning_activities`)
Lightweight event stream:
- `user_id`, `activity_type`, `event_id`, `concept_id`, `metadata`, `created_at`.

---

## 6. Mathematical Formulas & Deterministic Algorithms

### 6.1 Mastery Calculation Engine (`MasteryService`)
- Accuracy: `accuracy = correctCount / totalQuestions`
- Bounded update formula:
  - First attempt: `newMastery = Math.round(accuracy * 100)`
  - Subsequent attempts: `newMastery = Math.round(oldMastery * 0.7 + (accuracy * 100) * 0.3)`
  - Bounds: `0 <= newMastery <= 100`
- Classification:
  - `80 <= mastery <= 100`: `STRONG`
  - `50 <= mastery < 80`: `DEVELOPING`
  - `0 <= mastery < 50`: `NEEDS_LEARNING`

### 6.2 Spaced Repetition Engine (SM-2 Variant) (`SpacedRepetitionService`)
- Quality mapping:
  - 90–100% -> 5
  - 80–89% -> 4
  - 60–79% -> 3
  - 40–59% -> 2
  - 1–39% -> 1
  - 0% -> 0
- Schedule calculation:
  - If `quality >= 3`:
    - `rep = repetitionCount + 1`
    - `interval = rep === 1 ? 1 : rep === 2 ? 3 : Math.round(prevInterval * easeFactor)`
    - `easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))`
    - `status = (masteryStatus === 'STRONG' && rep >= 3) ? 'MASTERED' : rep >= 1 ? 'REVIEW' : 'LEARNING'`
  - If `quality < 3`:
    - `rep = 0`
    - `interval = 1`
    - `easeFactor = Math.max(1.3, easeFactor - 0.2)`
    - `status = 'LEARNING'`
  - `nextReviewAt = serverNow + (interval * 86400000 ms)`

### 6.3 Streak Calculation
- Evaluates distinct active UTC calendar days from `user_quiz_attempts` / `user_learning_activities`.
- Consecutive consecutive days increment `currentStreak`.
- If latest active day was yesterday or today, streak is active; if skipped 2+ days, `currentStreak` resets to 1 (if active today) or 0.
- `longestStreak` is preserved monotonically.

### 6.4 Due Review Prioritization
- Condition: `next_review_at <= serverNow`
- Priority order:
  1. Overdue duration (hours overdue DESC)
  2. Lowest mastery score ASC
  3. Event importance score DESC
  4. Most recent attempt timestamp

### 6.5 Personalized Recommendations
- `REVIEW_DUE`: Top overdue items.
- `WEAK_CONCEPT`: Concepts/events with `NEEDS_LEARNING` or low accuracy.
- `CONTINUE_LEARNING`: Items in `DEVELOPING` state.
- `NEW_CONCEPT`: High importance items with zero attempts.

### 6.6 Adaptive Explanation Level Recommendation
- `< 40` -> `beginner`
- `40–69` -> `student`
- `70–84` -> `technical`
- `85+` -> `deepDive`
- (Recommended default only; user can still switch freely to any level).

---

## 7. Files to Create

1. `server/src/db/migrations/006_phase7_personalization.sql` - Database migration script.
2. `server/src/repositories/learning.repository.ts` - Data access layer with PostgreSQL + In-Memory fallback store.
3. `server/src/services/learning/mastery.service.ts` - Deterministic mastery scoring and classification.
4. `server/src/services/learning/spacedRepetition.service.ts` - SM-2 spaced repetition scheduler.
5. `server/src/services/learning/learning.service.ts` - High-level learning coordinator (dashboard, streaks, recommendations).
6. `server/src/controllers/learningDashboard.controller.ts` - REST controller for learning endpoints.
7. `server/src/routes/learning.routes.ts` - Router for `/api/learning/*` endpoints.
8. `server/src/tests/phase7.test.ts` - Comprehensive test suite (Auth, Mastery, SM-2, Streaks, Recommendations, Security).
9. `client/src/services/learningService.ts` - Client API service for learning data.
10. `PHASE7_DOCUMENTATION.md` - Complete technical architecture documentation.
11. `PHASE7_COMPLETION_REPORT.md` - Final audit and verification report.

---

## 8. Files to Modify

1. `server/src/types/index.ts` - Add Phase 7 types (`UserLearningProgress`, `UserReviewSchedule`, `QuizAttempt`, `LearningDashboardData`, `LearningRecommendation`, `DueReviewItem`).
2. `server/src/db/dbClient.ts` - Add initialization DDL for Phase 7 tables in PostgreSQL pool initialization.
3. `server/src/controllers/event.controller.ts` - Hook `submitQuiz` to call `LearningService.recordQuizAttempt`.
4. `server/src/controllers/learning.controller.ts` - Update legacy stub to delegate to `LearningService`.
5. `server/src/routes/api.routes.ts` - Mount `/learning` routes.
6. `server/package.json` - Add `test:phase7` script and update `test` script to include Phase 7.
7. `client/src/types/index.ts` - Update client types with Phase 7 models.
8. `client/src/pages/LearnPage.tsx` - Enhance into rich Learning Dashboard with Mastery Gauge, Streak, Due Reviews, Category Mastery, and Weak Concepts.
9. `client/src/pages/EventDetailPage.tsx` - Display recommended explanation level based on mastery score.

---

## 9. API Changes & Contracts

- `GET /api/learning/progress` (Requires Auth)
  - Returns: `{ overallMastery, totalConceptsLearned, conceptsStrong, conceptsDeveloping, conceptsNeedingLearning, dueReviewsCount, completedReviewsCount, currentStreak, longestStreak, categoryProgress, recentActivity, weakConcepts }`
- `GET /api/learning/review` (Requires Auth)
  - Returns: `{ dueCount, totalScheduled, items: DueReviewItem[] }`
- `GET /api/learning/recommendations` (Requires Auth)
  - Returns: `{ recommendations: LearningRecommendation[] }`
- `POST /api/events/:id/quiz/submit` (Maintains full backward compatibility, updates learning progress when authenticated)
- `GET /api/learning/concepts` (Public / Authenticated concept directory)

---

## 10. Security & Privacy Considerations

- **Strict Server Authority**: Client cannot send `mastery`, `interval`, `nextReviewAt`, `streak`, or `score`.
- **Session-Derived User ID**: User ID derived from validated JWT / mock session; never accepted from body/query.
- **Tenant/User Isolation**: Queries strictly scoped by `WHERE user_id = $1`.
- **Quiz Anti-Spoofing**: Questions fetched securely server-side; correct answers never exposed in GET endpoints.
- **Rate Limiting**: Applied across all learning endpoints.

---

## 11. Phase Isolation Verification

- **Phase 4 (Ingestion & Clustering)**: Untouched.
- **Phase 5 (Dynamic Ranking)**: Untouched.
- **Phase 6 (AI Summaries & Generation)**: Untouched (only safely consumed by Phase 7).
- **Phase 7**: Purely consumes Phase 6 quiz submissions and events to manage user learning profiles.
