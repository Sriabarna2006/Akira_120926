# AKIRA — Phase 8 Documentation: Intelligent Daily Learning & Adaptive Personalization

## 1. Executive Summary

Phase 8 elevates AKIRA from a traditional news-to-quiz assistant into an **Intelligent, Continuous Learning and Adaptive Discovery Engine**:

$$\text{News} \longrightarrow \text{Personalized Discovery} \longrightarrow \text{Understanding} \longrightarrow \text{Quiz} \longrightarrow \text{Mastery} \longrightarrow \text{Review} \longrightarrow \text{Continuous Learning}$$

Phase 8 is built upon **100% deterministic rules, mathematical formulas, and verified database signals** derived from Phases 5–7. It computes personalized discovery feeds, resolves knowledge gaps, prioritizes SM-2 spaced repetition reviews, injects anti-filter-bubble exploration slots, and tracks daily goal completions without relying on black-box recommendation models.

---

## 2. Architecture & Personalization Formulas

### 2.1 Composite Deterministic Recommendation Scoring Formula

For every candidate canonical event $e$, the personalized score $P(e)$ is computed via a 6-factor composite formula:

$$P(e) = 0.25 \times G(e) + 0.25 \times K(e) + 0.20 \times R(e) + 0.15 \times C(e) + 0.10 \times F(e) + 0.05 \times E(e)$$

Where each signal is normalized between $0$ and $100$:

| Weight | Signal | Symbol | Calculation Method |
| :--- | :--- | :---: | :--- |
| **25%** | **Global Rank / Importance** | $G(e)$ | $\text{finalRankScore}$ or $\text{importanceScore}$ from Phase 5 ranking engine |
| **25%** | **Knowledge Gap** | $K(e)$ | $\max_{\text{concept} \in e}(100 - \text{MasteryScore}(\text{concept}))$; unattempted concepts default to $50$ |
| **20%** | **Review Due Priority** | $R(e)$ | $0$ if not scheduled, $75 + \min(20, \lfloor \text{overdueHours}/10 \rfloor)$ if due/overdue (capped at $\le 95$), $10$ if scheduled in future |
| **15%** | **Category Affinity** | $C(e)$ | Weighted interaction history: $3 \times \text{Quizzes} + 2 \times \text{Saves} + 1 \times \text{Views}$ in category relative to max category |
| **10%** | **Recency & Freshness** | $F(e)$ | Exponential decay: $100 \times \exp(-\lambda \times \text{ageHours})$, $\lambda = \ln(2)/24$ |
| **05%** | **Exploration Boost** | $E(e)$ | $100$ for least-interacted / zero-activity categories; $0$ for primary categories |

### 2.2 80/20 Relevance & Exploration Allocation (Anti-Filter-Bubble)

To avoid echo chambers and narrow domain tunnel vision, feed slotting follows an **80% Relevance / 20% Exploration** allocation:
* **80% Top Relevant Slots**: Populated with highest composite score items (knowledge gaps, due reviews, interest matches).
* **20% Exploration Slots (15–25%)**: Reserved for high-importance canonical events from categories where the user has low or zero historical interaction.
* **Category Diversity Constraint**: Maximum 3 events per category per page; zero duplicate events across slots.

### 2.3 Deterministic Explainability Badges & Reasons

AKIRA never uses vague placeholders like *"AI thinks you'll like this"*. Every recommendation is tagged with clear, verifiable reasons:

| Reason Code | Badge Label | Trigger Condition | Example User-Facing Reason |
| :--- | :--- | :--- | :--- |
| `REVIEW_DUE` | **REVIEW DUE** | Overdue / Due SM-2 Spaced Review ($R \ge 75$) | *"Active recall review due today based on your SuperMemo SM-2 spaced repetition schedule."* |
| `WEAK_CONCEPT` / `KNOWLEDGE_GAP` | **KNOWLEDGE GAP** | Low concept mastery ($K \ge 60$, Mastery $<50\%$) | *"Targeted to reinforce weak concept: Zero-Day Vulnerabilities (current mastery: 20%)."* |
| `CATEGORY_AFFINITY` | **INTEREST MATCH** | High category interactions ($C \ge 70$) | *"Recommended based on your frequent study of Economy & Money events and quizzes."* |
| `EXPLORATION` | **EXPLORE TOPIC** | Anti-filter-bubble exploration slot ($E = 100$) | *"Curated topic outside your frequent categories to expand domain breadth and prevent filter bubbles."* |
| `BREAKING_GLOBAL` | **BREAKING** | High importance / breaking event ($G \ge 90$) | *"High-impact breaking event corroborated across 4 verified publishers."* |
| `CONTINUE_LEARNING` | **CONTINUE** | Partial quiz or explanation view history | *"Continue exploring concepts connected to your recent reading activity."* |

### 2.4 Adaptive Comprehension Complexity

Complexity recommendations are mapped deterministically based on user concept mastery and preferences:

| Mastery Range | Recommended Level | Description |
| :---: | :---: | :--- |
| **$< 40\%$** | `beginner` | Concrete vocabulary, analogies, foundational definitions |
| **$40\% - 69\%$** | `student` | Core mechanisms, causal chains, regulatory structure |
| **$70\% - 84\%$** | `technical` | Implementation details, institutional protocols, equations |
| **$\ge 85\%$** | `deepDive` | Frontier edge cases, policy trade-offs, advanced analysis |

If a user explicitly sets a preferred difficulty (`BEGINNER`, `STUDENT`, `TECHNICAL`, `DEEP_DIVE`), that setting is honored; `ADAPTIVE` utilizes the dynamic mastery mapping.

---

## 3. Database Schema

Phase 8 creates the `user_learning_preferences` table with performance indexes:

```sql
CREATE TABLE IF NOT EXISTS public.user_learning_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_goal INT NOT NULL DEFAULT 3 CHECK (daily_goal BETWEEN 1 AND 20),
    preferred_difficulty VARCHAR(30) NOT NULL DEFAULT 'ADAPTIVE' CHECK (preferred_difficulty IN ('ADAPTIVE', 'BEGINNER', 'STUDENT', 'TECHNICAL', 'DEEP_DIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_learning_preferences_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_learning_preferences_user ON public.user_learning_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_activities_user_type_date ON public.user_learning_activities(user_id, activity_type, created_at DESC);
```

---

## 4. API Endpoints

All endpoints are mounted under `/api/learning/` with session authentication:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/learning/feed` | Returns deterministic personalized feed with score breakdown, explainability badges, and exploration items. |
| `GET` | `/api/learning/daily-summary` | Returns today's activity counts, daily goal progress percentage, streak, and recommended next action. |
| `GET` | `/api/learning/preferences` | Returns user's daily goal target and preferred comprehension difficulty. |
| `PUT` | `/api/learning/preferences` | Updates user's daily goal target (1–20) and preferred comprehension difficulty. |
| `POST` | `/api/learning/activity` | Logs user learning activities (`READ_EXPLANATION`, `VIEW_EVENT`, etc.) to drive affinity calculations. |

---

## 5. Security & Privacy Guarantees

1. **Session-Derived User Identity**: All user queries read `user.id` strictly from verified JWT tokens. Client cannot spoof or query other users' learning preferences.
2. **Zero Client Score Injection**: Recommendations, match scores, and goal percentages are computed 100% server-side.
3. **Zero Political / Sensitive Profiling**: Recommendation scoring is purely knowledge-graph-driven (concepts, topics, mastery gaps, spaced review schedules). AKIRA never profiles political affiliations or personal viewpoints.
4. **Tenant Isolation**: Multi-tenant database boundaries ensure User A cannot mutate or view User B's preferences or learning logs.
