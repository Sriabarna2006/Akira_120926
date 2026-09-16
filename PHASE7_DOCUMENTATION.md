# 🚀 AKIRA — PHASE 7 TECHNICAL DOCUMENTATION
## Personalization, Learning Progress & Spaced Repetition Layer

---

## 1. Executive Summary & Architecture

Phase 7 completes AKIRA's transformation from a news-and-quiz app into a **personal learning and spaced repetition assistant**.

### AKIRA's Three Isolated Intelligence Layers
1. **News Intelligence (Phase 4)**: Real-world ingestion, normalization, and canonical event clustering.
2. **Trend Intelligence (Phase 5)**: Trend velocity scoring, step-wise coverage, exponential recency decay, and top 10 dynamic ranking.
3. **Learning Intelligence (Phase 6 + Phase 7)**:
   - *Phase 6*: 5W1H grounded comprehension, 5 adaptive complexity explanation levels, knowledge graphs, and active recall quizzes.
   - *Phase 7*: Evidence-based mastery tracking, SM-2 spaced repetition review scheduling, deterministic multi-day streak calculation, and personalized review recommendations.

---

## 2. Database Schema (`006_phase7_personalization.sql`)

### 2.1 `public.user_learning_progress`
Evidence-based mastery state per authenticated user and concept/event:
- `id` (UUID, Primary Key)
- `user_id` (UUID, References `auth.users(id)`)
- `concept_id` (VARCHAR(100), Optional)
- `event_id` (VARCHAR(100), Optional)
- `mastery_score` (INT, 0–100)
- `mastery_status` (`NEEDS_LEARNING` | `DEVELOPING` | `STRONG`)
- `attempt_count` (INT)
- `correct_count` (INT)
- `incorrect_count` (INT)
- `last_attempt_at` (TIMESTAMPTZ)
- `last_mastered_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2.2 `public.user_review_schedules`
SM-2 spaced repetition state:
- `id` (UUID, Primary Key)
- `user_id` (UUID, References `auth.users(id)`)
- `concept_id`, `event_id` (VARCHAR(100))
- `ease_factor` (FLOAT, Default 2.5, Min 1.3)
- `interval_days` (INT, Default 1)
- `repetition_count` (INT, Default 0)
- `last_reviewed_at` (TIMESTAMPTZ)
- `next_review_at` (TIMESTAMPTZ)
- `status` (`NEW` | `LEARNING` | `REVIEW` | `MASTERED`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2.3 `public.user_quiz_attempts`
Normalized audit log for temporal analysis and streak verification:
- `id` (UUID, Primary Key)
- `user_id` (UUID)
- `event_id` (VARCHAR(100))
- `concept_id` (VARCHAR(100), Optional)
- `score` (INT)
- `total_questions` (INT)
- `accuracy` (FLOAT, 0.0–1.0)
- `score_percentage` (INT, 0–100)
- `mastery_status` (`NEEDS_LEARNING` | `DEVELOPING` | `STRONG`)
- `answers` (JSONB)
- `submitted_at` (TIMESTAMPTZ)

### 2.4 `public.user_learning_activities`
Event stream for learning action tracking:
- `id` (UUID, Primary Key)
- `user_id` (UUID)
- `activity_type` (`EVENT_VIEWED` | `EXPLANATION_VIEWED` | `CONCEPT_VIEWED` | `QUIZ_STARTED` | `QUIZ_COMPLETED` | `EVENT_SAVED` | `REVIEW_COMPLETED`)
- `event_id`, `concept_id` (VARCHAR(100))
- `metadata` (JSONB)
- `created_at` (TIMESTAMPTZ)

---

## 3. Deterministic Formulas & Algorithms

### 3.1 Mastery Scoring Engine (`MasteryService`)
- **First Attempt**:
  $$M_{\text{new}} = \text{round}(\text{accuracy} \times 100)$$
- **Subsequent Attempts (Historical Smoothing)**:
  $$M_{\text{new}} = \text{round}(M_{\text{old}} \times 0.7 + (\text{accuracy} \times 100) \times 0.3)$$
- **Clamping**: $0 \le M_{\text{new}} \le 100$
- **Classification Thresholds**:
  - $80 \le M \le 100 \implies \text{STRONG}$
  - $50 \le M < 80 \implies \text{DEVELOPING}$
  - $0 \le M < 50 \implies \text{NEEDS\_LEARNING}$

### 3.2 Spaced Repetition Engine (SM-2 Variant) (`SpacedRepetitionService`)
- **Quiz Performance Quality Grade ($0\text{--}5$)**:
  - $90\text{--}100\% \to 5$
  - $80\text{--}89\% \to 4$
  - $60\text{--}79\% \to 3$
  - $40\text{--}59\% \to 2$
  - $1\text{--}39\% \to 1$
  - $0\% \to 0$
- **Successful Recall ($\text{quality} \ge 3$)**:
  - $\text{repetitionCount} = \text{prevReps} + 1$
  - $\text{intervalDays} = \begin{cases} 1 & \text{if reps} = 1 \\ 3 & \text{if reps} = 2 \\ \max(1, \text{round}(\text{prevInterval} \times \text{easeFactor})) & \text{if reps} \ge 3 \end{cases}$
  - $\text{easeFactor} = \max(1.3, \text{prevEF} + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)))$
  - $\text{status} = \begin{cases} \text{MASTERED} & \text{if } M \ge 80 \land \text{reps} \ge 3 \\ \text{REVIEW} & \text{otherwise} \end{cases}$
- **Weak Recall / Failed Review ($\text{quality} < 3$)**:
  - $\text{repetitionCount} = 0$
  - $\text{intervalDays} = 1$
  - $\text{easeFactor} = \max(1.3, \text{prevEF} - 0.2)$
  - $\text{status} = \text{LEARNING}$

### 3.3 Streak Calculation
- Evaluates distinct active UTC calendar days ($YYYY\text{-}MM\text{-}DD$) from quiz attempts.
- Streak is active if user completed a quiz today or yesterday in UTC.
- Missed days reset `currentStreak` without resetting `longestStreak`.

### 3.4 Due Reviews Prioritization
- Item is due when $\text{nextReviewAt} \le \text{serverNow}$.
- Deterministic Priority Order:
  1. Overdue duration (hours overdue DESC)
  2. Lowest mastery score ASC
  3. Canonical event importance score DESC
  4. Stable tie-breaker ID

---

## 4. API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/learning/progress` | Required (Bearer) | Full learning dashboard metrics, mastery, streak, categories, weak items |
| `GET` | `/api/learning/review` | Required (Bearer) | Prioritized due spaced repetition review items |
| `GET` | `/api/learning/recommendations` | Required (Bearer) | Deterministic review/study recommendations |
| `GET` | `/api/learning/concepts` | Public | Knowledge concept directory |
| `POST` | `/api/events/:id/quiz/submit` | Optional Auth | Submits quiz answers; automatically updates learning profile when authenticated |

---

## 5. Security & Privacy Boundaries

- **Zero Client-Controlled Scores**: Mastery scores, SM-2 intervals, streaks, and review dates are computed exclusively on the server.
- **Tenant Isolation**: All queries strictly enforce `WHERE user_id = $1`. User A cannot view User B's mastery, review queue, or attempts.
- **Session-Derived Identity**: User ID is taken exclusively from verified JWT / session, never from request body parameters.
- **Rate Limiting**: Rate limiter applied across all learning routes.
- **Safe Fallback**: If PostgreSQL connection is interrupted, the resilient repository falls back gracefully to in-memory state stores.

---

## 6. Verification & Test Results

```text
Phase 1 (Database & Auth Foundation):           7 / 7 PASSED
Phase 3 (Core Data Layer & REST Backend):      14 / 14 PASSED
Phase 4 (Ingestion & Canonical Clustering):     9 / 9 PASSED
Phase 5 (Trend Detection & Live Ranking):      26 / 26 PASSED
Phase 6 (AI Understanding Layer):              11 / 11 PASSED
Phase 7 (Personalization & Spaced Repetition): 17 / 17 PASSED

TOTAL REGRESSION SUITE:                        84 / 84 PASSED (100%)
```

### Production Build Status
- **Server TypeScript Build**: PASS (0 errors)
- **Client TypeScript Build**: PASS (0 errors)
- **Vite Production Bundle**: PASS (0 errors, 1783 modules bundled)
