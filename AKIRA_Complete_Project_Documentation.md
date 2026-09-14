# 🚀 AKIRA — Autonomous Knowledge & Intelligence Real-Time Aggregator
## Complete Project Documentation & End-to-End System Walkthrough (Phases 1 to 4)

---

## 🧭 Executive Summary & Core Philosophy

**AKIRA** is a next-generation real-world news and intelligence platform designed to eliminate misinformation, clickbait, and duplicate noise. Unlike conventional scrapers or news apps, AKIRA operates on four core architectural pillars:

1. **Canonical Event vs. Article Separation:**
   * An **Article** is a specific report published by a news agency.
   * A **Canonical Event** is the underlying real-world occurrence.
   * Multiple corroborating articles are clustered into a single Canonical Event, presenting users with a unified story backed by multi-source verification badges.
2. **First-Class Tamil Nadu & Regional Taxonomy:**
   * Tamil Nadu is treated as a top-tier primary region alongside India National and World, with specialized district, Chennai Metro, DIPR government, and infrastructure tracking.
3. **Strict Source Transparency & Attribution:**
   * Every article retains its original publisher identity, credibility rating, and unaltered destination URL. AKIRA never fabricates sources or replaces original links.
4. **Anti-Hallucination & No Fake Live Data:**
   * Transparent timestamps (`published_at` vs `discovered_at`) ensure users know exactly when events occurred, completely avoiding deceptive "BREAKING" or "JUST NOW" labels unless verifiably current.

---

## 📊 End-to-End System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL RSS / ATOM FEEDS                       │
│    (The Hindu, Indian Express, BBC, Reuters, TechCrunch, ScienceDaily) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 FEED FETCHER & NETWORK SAFETY LAYER                    │
│   • rss-parser with Chrome User-Agent                                  │
│   • Strict 6,000ms Timeout & Exponential Retry Backoff                 │
│   • SSRF Whitelist Guard (Only database-registered sources)            │
│   • Non-blocking Failure Isolation                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             NORMALIZATION, SANITIZATION & DEDUPLICATION                │
│   • Strip tracking parameters (utm_*, ref, fbclid, gclid)              │
│   • HTML Sanitization (Strip <script>, <iframe>, unsafe URLs)          │
│   • Structural & Timestamp Validation                                  │
│   • Instant In-Memory / DB URL Existence Check (existsByUrl)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              DETERMINISTIC LAYERED CLASSIFICATION                      │
│   • Region Classifier (Tamil Nadu Priority > India > World)            │
│   • Category Classifier (15 Standardized Knowledge Domains)            │
│   • Strict Separation: Region ≠ Category                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               CANONICAL EVENT CLUSTERING ENGINE                        │
│   • 36-Hour Temporal Sliding Window                                    │
│   • Regional & Category Isolation (Prevents cross-region merging)      │
│   • Weighted Token Jaccard Similarity (60% Title + 40% Body)           │
│   • Idempotent Multi-Source Attachment (event_sources)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             PERSISTENT DATABASE LAYER (PostgreSQL / Neon)              │
│   • tables: articles, canonical_events, event_sources, sources, etc.   │
│   • Source Health Tracking (last_successful_fetch, failure_count)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    EXPRESS REST API & MIDDLEWARE                       │
│   • JWT Auth & Postgres Row-Level Security (RLS)                       │
│   • Sliding Window Rate Limiting & Zod Query Validation                │
│   • Protected Manual Sync (POST /api/live/sync)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   REACT 18 + TYPESCRIPT FRONTEND                       │
│   • Glassmorphism Dark UI & Handcrafted CSS Design System              │
│   • Live Trending Feed, Regional Filters, Category Badges              │
│   • Canonical Event Detail View & Corroborating Source Badges          │
│   • Private User Bookmarks & Search Experience                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Phase-by-Phase Breakdown

### 🔹 PHASE 1: Database & Authentication Foundations

#### 1. Normal Working Phase (User & Product Experience)
* **User Accounts & Login:** Users can sign up, log in securely with email and password, and remain logged in via authenticated session tokens.
* **Profile Management:** Users have personalized profile records where their display names and preferences are managed.
* **Private Bookmarking:** Users can save stories and events to their personal reading list. Bookmarked items are strictly private — User A can never see User B's saved events.
* **Protected Administrative Controls:** Sensitive backend actions (like triggering news synchronization) are locked down and inaccessible to regular users.

#### 2. Technical Engineering Phase (Code & Architecture)
* **PostgreSQL / Supabase Schema:**
  * Defined core relational schema in `001_initial_schema.sql` and `neon_schema.sql`.
  * Core entities: `profiles`, `saved_events`, `saved_articles`, `regions`, `categories`.
* **Row-Level Security (RLS):**
  * Configured in `002_rls_policies.sql` ensuring database-enforced multi-tenant privacy.
* **Authentication Middleware:**
  * Created `auth.middleware.ts` to decode Supabase JWT Bearer tokens and populate `req.user`.
* **Resilient In-Memory Fallbacks:**
  * Engineered repository fallback mechanisms that keep the app running locally even if remote credentials are unset.
* **Verification Suite:**
  * `phase1.test.ts` (7/7 tests passed: schema integrity, RLS isolation, token verification, sync protection).

---

### 🔹 PHASE 2: Frontend MVP & UI Foundation

#### 1. Normal Working Phase (User & Product Experience)
* **Cyberpunk & Glassmorphism Aesthetic:** A modern dark UI built with deep space navy, cyan glows, violet accents, and subtle micro-animations.
* **Collapsible Navigation & Responsive Sidebar:** Seamless navigation between Home/Explore, Live Trending, Regional News, Categories, Search, and Bookmarks.
* **Multi-Tab Regional Filter:** Instant switching between **Tamil Nadu**, **India**, and **World** news streams.
* **Canonical Event Cards:** Rich preview cards displaying topic badges, time elapsed, and corroborating publisher pills.
* **Event Detail View:** Deep-dive modal/page showing all raw publisher reports, timestamps, and direct external links.
* **Search & Bookmarking Drawers:** Search by keywords across titles and summaries, with one-click saving.

#### 2. Technical Engineering Phase (Code & Architecture)
* **Technology Stack:** React 18, TypeScript, Vite, React Router v6, Lucide React icons, TanStack React Query.
* **Handcrafted Vanilla CSS Design System:**
  * Tailwind-free `index.css` leveraging CSS Custom Properties (`--bg-primary`, `--glass-surface`, `--accent-cyan`), backdrop filters, custom scrollbars, and keyframe animations (`pulse-glow`, `fade-in`).
* **Modular Component Architecture:**
  * `components/layout/`: `Navbar.tsx`, `Sidebar.tsx`, `Footer.tsx`, `MobileNav.tsx`.
  * `components/events/`: `EventCard.tsx`, `SourceBadge.tsx`, `EventTimeline.tsx`, `UrgencyTag.tsx`.
  * `components/auth/`: `AuthModal.tsx`, `UserDropdown.tsx`.
  * `components/common/`: `LoadingSpinner.tsx`, `ErrorState.tsx`, `EmptyState.tsx`.
* **Pages:** `HomePage.tsx`, `LiveTrendingPage.tsx`, `ExplorePage.tsx`, `CategoryPage.tsx`, `EventDetailPage.tsx`, `AllNewsPage.tsx`, `SavedPage.tsx`.

---

### 🔹 PHASE 3: Core Data Layer & Backend Foundation

#### 1. Normal Working Phase (User & Product Experience)
* **Real REST API Connectivity:** The frontend connects directly to a live Express backend and PostgreSQL database.
* **Live Exploration & Pagination:** Browse through 15 standardized knowledge domains, filter articles by source credibility, and page through news with structured metadata.
* **True Timestamps:** Clear distinction between when a publisher released a story (`published_at`) and when AKIRA discovered it (`discovered_at`).

#### 2. Technical Engineering Phase (Code & Architecture)
* **Layered Server Architecture:**
  * `Routes` -> `Middleware` -> `Controllers` -> `Services` -> `Repositories` -> `PostgreSQL Database`.
* **Repositories (`server/src/repositories/`):**
  * `region.repository.ts`, `category.repository.ts`, `source.repository.ts`, `article.repository.ts`, `event.repository.ts`.
* **Input Validation & Security Middleware:**
  * `query.validator.ts`: Zod schemas validating query parameters (page, limit, region, category, search).
  * `rateLimit.middleware.ts`: Sliding window rate limiter preventing API abuse.
  * `sanitize.ts`: HTML sanitizer stripping `<script>`, `<iframe>`, and malicious URI schemes (`javascript:`).
  * `errorHandler.ts`: Standardized error responses with sensitive stack traces masked in production.
* **Verification Suite:**
  * `phase3.test.ts` (14/14 tests passed: repository methods, REST endpoints, rate limiting, validation errors, and sanitization).

---

### 🔹 PHASE 4: Real News Ingestion & Event Pipeline

#### 1. Normal Working Phase (User & Product Experience)
* **Automated News Collection:** AKIRA continuously pulls real news from 14 verified feeds across Tamil Nadu, India, and the World.
* **Intelligent Story Merging:** When multiple news outlets cover the same event (e.g., ISRO launch or a government transport announcement), AKIRA automatically groups them into one Canonical Event rather than flooding the feed with duplicate cards.
* **Full Source Attribution:** Every event clearly displays who reported it first, who confirmed it, and provides direct links to the original articles.
* **Live Source Directory:** Users can check publisher health, seeing which feeds are active, healthy, or experiencing temporary delays.

#### 2. Technical Engineering Phase (Code & Architecture)
* **Modular Ingestion Services (`server/src/services/ingestion/`):**
  * `feedFetcher.ts`: RSS 2.0 / Atom parser using `rss-parser` with browser User-Agent, SSRF URL whitelist check, 6,000ms `Promise.race` timeout, and exponential retry backoff.
  * `urlNormalizer.ts`: Normalizes URLs and strips tracking parameters (`utm_source`, `utm_medium`, `utm_campaign`, `ref`, `fbclid`, `gclid`, hash fragments).
  * `articleValidator.ts`: Validates title length (5–500 chars), future timestamp boundaries, safe HTTP/HTTPS protocols, and source presence.
  * `classifier.ts`: Rule-based deterministic classifier prioritizing Tamil Nadu (districts, Chennai metro, CM, DIPR) over India/World, and categorizing into 15 knowledge domains.
  * `eventMatcher.ts`: Canonical event clustering engine using a 36-hour sliding temporal window, regional isolation, and weighted title/body token Jaccard similarity (0.60 title + 0.40 body, threshold 0.28).
  * `scheduler.ts`: Background cron runner executing every `INGESTION_INTERVAL_MINUTES` (default 15m) with `isSyncing` concurrency guards.
* **Master Ingestion Service (`newsIngestion.service.ts`):**
  * Coordinates fetch, validation, deduplication, classification, clustering, persistence, and health metric tracking.
* **Idempotency Guarantee:**
  * `existsByUrl` and `attachArticleToEvent` ensure that running ingestion multiple times against unchanged feeds skips 100% of existing articles (0 duplicate records created).
* **Verification Suite:**
  * `phase4.test.ts` (9/9 tests passed: URL normalization, XSS sanitization, structural validation, classifier rules, event clustering, RSS parsing, 100% idempotency, source health, and protected sync).

---

## 📁 Complete Inventory of Project Files

| Component / Layer | Key File Paths | Core Purpose |
| :--- | :--- | :--- |
| **Database & Schema** | `server/src/db/migrations/001_initial_schema.sql`<br/>`server/src/db/migrations/002_rls_policies.sql`<br/>`server/src/db/migrations/003_seed_data.sql`<br/>`server/src/db/migrations/neon_schema.sql` | Postgres table schemas, RLS policies, foreign keys, 14 verified feeds, and 15 categories. |
| **Ingestion Pipeline** | `server/src/services/ingestion/feedFetcher.ts`<br/>`server/src/services/ingestion/urlNormalizer.ts`<br/>`server/src/services/ingestion/articleValidator.ts`<br/>`server/src/services/ingestion/classifier.ts`<br/>`server/src/services/ingestion/eventMatcher.ts`<br/>`server/src/services/ingestion/scheduler.ts` | Network fetching, tracking stripper, validation, classification, canonical clustering, and background cron. |
| **Repositories** | `server/src/repositories/source.repository.ts`<br/>`server/src/repositories/article.repository.ts`<br/>`server/src/repositories/event.repository.ts`<br/>`server/src/repositories/region.repository.ts`<br/>`server/src/repositories/category.repository.ts` | Database access layer, URL deduplication, and event-source attachment. |
| **Controllers & Services** | `server/src/services/newsIngestion.service.ts`<br/>`server/src/controllers/live.controller.ts`<br/>`server/src/controllers/news.controller.ts`<br/>`server/src/controllers/region.controller.ts`<br/>`server/src/controllers/category.controller.ts` | Orchestration, REST API handlers, and protected sync endpoints. |
| **Security & Middleware** | `server/src/middleware/auth.middleware.ts`<br/>`server/src/middleware/rateLimit.middleware.ts`<br/>`server/src/middleware/validate.middleware.ts`<br/>`server/src/middleware/errorHandler.ts`<br/>`server/src/utils/sanitize.ts` | JWT auth, sliding rate limiting, Zod validation, error masking, and XSS sanitization. |
| **Frontend Pages** | `client/src/pages/HomePage.tsx`<br/>`client/src/pages/LiveTrendingPage.tsx`<br/>`client/src/pages/ExplorePage.tsx`<br/>`client/src/pages/CategoryPage.tsx`<br/>`client/src/pages/EventDetailPage.tsx`<br/>`client/src/pages/AllNewsPage.tsx`<br/>`client/src/pages/SavedPage.tsx` | React 18 pages with glassmorphism UI, real-time data hooks, and search. |
| **Frontend UI Components** | `client/src/components/layout/` (Navbar, Sidebar, MobileNav)<br/>`client/src/components/events/` (EventCard, SourceBadge, EventTimeline)<br/>`client/src/components/auth/` (AuthModal)<br/>`client/src/components/common/` (LoadingSpinner, ErrorState)<br/>`client/src/index.css` | Reusable UI components and Tailwind-free vanilla CSS design system. |
| **Automated Test Suites** | `server/src/tests/phase1.test.ts`<br/>`server/src/tests/phase3.test.ts`<br/>`server/src/tests/phase4.test.ts` | Automated verification suites testing all 4 phases. |

---

## 🧪 Test Verification & Production Status

```text
======================================================================
📊 MASTER TEST EXECUTION SUMMARY (ALL SUITES PASSING)
======================================================================
✅ Phase 1 Suite (Database & Authentication): 7/7 PASSED
✅ Phase 3 Suite (Core Data Layer & REST APIs): 14/14 PASSED
✅ Phase 4 Suite (Real Ingestion & Event Pipeline): 9/9 PASSED
   └─ URL Normalization: PASSED
   └─ XSS Sanitization: PASSED
   └─ Article Validation: PASSED
   └─ Layered Classifier: PASSED
   └─ Canonical Clustering: PASSED
   └─ RSS/Atom Parser: PASSED
   └─ 100% Idempotent Re-Ingestion (0 duplicates created): PASSED
   └─ Source Health Tracking: PASSED
   └─ Protected Sync Security: PASSED
----------------------------------------------------------------------
✓ Client Vite Production Build: PASSED (1,783 modules transformed, 0 errors)
✓ Server TypeScript Build: PASSED (0 errors)
======================================================================
```

---

## 🚀 Prepared Documentation Files

The full documentation is available in your workspace in three formats:
1. **PDF Document:** [AKIRA_Complete_Project_Documentation.pdf](file:///a:/My%20web%20app%28ML%20ai%29/AKIRA_Complete_Project_Documentation.pdf)
2. **Word Document:** [AKIRA_Complete_Project_Documentation.docx](file:///a:/My%20web%20app%28ML%20ai%29/AKIRA_Complete_Project_Documentation.docx)
3. **Markdown Documentation:** [AKIRA_Complete_Project_Documentation.md](file:///a:/My%20web%20app%28ML%20ai%29/AKIRA_Complete_Project_Documentation.md)
