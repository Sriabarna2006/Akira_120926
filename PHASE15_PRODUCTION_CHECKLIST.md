# AKIRA — PHASE 15 PRODUCTION CHECKLIST

This checklist must be verified prior to production deployment of AKIRA.

---

## 1. DATABASE & CONNECTION RELIABILITY
- [x] **Migrations Synchronized**: All 15 SQL migrations (`001_initial_schema.sql` through `014_phase15_production_hardening.sql`) verified and loadable in strict order.
- [x] **Schema Integrity**: `sources`, `canonical_events`, `event_sources`, `storylines`, `storyline_events`, `user_learning_profiles`, `push_subscriptions`, `notifications`, and `ingestion_health_snapshots` tables present.
- [x] **Connection Timeout Resilience**: `DB_CONNECTION_TIMEOUT_MS` configured (default: 3500ms) with zero-crash in-memory fallback.
- [x] **Multi-Tenant RLS**: Row Level Security policies active across user profile, learning progress, and push subscription tables.

---

## 2. ENVIRONMENT & CREDENTIAL SECURITY
- [x] **Production VAPID Keys**: `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` populated in production environment variables.
- [x] **No Hardcoded Secrets**: Zero private keys or passwords committed in git repository.
- [x] **Cron Secret Configured**: `CRON_SECRET` populated for scheduled invocation of `/api/live/sync` and `/api/notifications/scheduler/evaluate`.
- [x] **AI Provider Key**: `GEMINI_API_KEY` configured on backend only (never exposed to client bundle).
- [x] **CORS Origins**: Restricted to verified client domains in production.

---

## 3. REAL-WORLD NEWS INGESTION & SOURCE COVERAGE
- [x] **22 Verified Live Feeds**: Coverage across Regional (Tamil Nadu), National (India), Economy, Global Wires, AI, Technology, Cybersecurity, Science, and Environment.
- [x] **SSRF Protection Active**: Dangerous URI schemes (`javascript:`, `file:`, `ftp:`) and unapproved hosts blocked by `FeedFetcher`.
- [x] **Source Health Monitoring**: Latency, consecutive failures, and HTTP error tracking active.
- [x] **Stale Source Detection**: Automatic classification of feeds exceeding configured freshness windows (`STALE` / `FAILING`).
- [x] **Ingestion Concurrency Guard**: In-memory mutex lock prevents overlapping sync executions.

---

## 4. DEDUPLICATION & CANONICAL EVENT PIPELINE
- [x] **Multi-Signal Association Engine**: Lexical (35%), Semantic N-Gram Cosine (30%), Named Entity/Number Overlap (15%), Temporal Decay (10%), and Category Compatibility (10%).
- [x] **Same Event Corroboration**: Correctly clusters synonymous headlines into existing canonical events without creating duplicates.
- [x] **Related Development Preservation**: Distinct developments correctly classified as `RELATED_DEVELOPMENT` and attached as sequential storyline milestones.
- [x] **Evidence Intelligence Intact**: Multi-publisher conglomerate deduplication and 6-pillar evidence completeness score preserved.

---

## 5. NOTIFICATION ENGINE & WEB PUSH RELIABILITY
- [x] **Deterministic Quiet Hours**: Local timezone quiet hours calculation verified (including midnight wrap-around).
- [x] **CRITICAL Breaking News Bypass**: Highest priority emergency alerts bypass quiet hours according to policy.
- [x] **Evidence Gates**: Articles with evidence score < 60 or unresolved conflicts suppressed from push notifications.
- [x] **Daily Notification Cap**: Server enforces user maximum daily notification limit (default: 10).
- [x] **Stale Device Pruning**: HTTP 410 / 404 responses from push gateways automatically revoke dead subscriptions.

---

## 6. PWA SERVICE WORKER & OFFLINE EXPERIENCE
- [x] **Direct `/sw.js` Route**: `vercel.json` rewrite rules exclude `/sw.js` from SPA `index.html` fallback.
- [x] **Service Worker Registration**: PWA registers `/sw.js` with root scope.
- [x] **App Manifest**: `manifest.json` configured with correct icons, `standalone` display mode, and theme color `#0f172a`.
- [x] **PWA Install Banner**: Chromium `beforeinstallprompt` captured; responsive install UI displayed on user intent.
- [x] **iOS Safari Guidance Flow**: Step-by-step "Add to Home Screen" modal for iOS devices.
- [x] **Offline Learning Cache**: Caches Daily Briefing and Spaced Repetition items with visible "Updated X min ago" freshness indicator.

---

## 7. OBSERVABILITY & DIAGNOSTICS
- [x] **Public Health Check**: `GET /api/health` returns status without sensitive credentials.
- [x] **Protected Diagnostics**: `GET /api/diagnostics/operational-health` provides ingestion statistics and source health telemetry under secret authorization.
- [x] **Safe Error Handling**: Production API responses return user-friendly error messages without leaking database stack traces or internal server paths.

---

## 8. TEST SUITE & PRODUCTION BUILDS
- [x] **Full Regression Suite**: **294 / 294 tests passing (100%)**.
- [x] **Phase 14 Test Determinism**: Test 15 daytime evaluation verified passing (39/39).
- [x] **Phase 15 Verification Suite**: 20 / 20 assertions passing.
- [x] **Server Build**: `npm run build --workspace=server` compiles cleanly with zero TypeScript errors.
- [x] **Client Build**: `npm run build --workspace=client` generates production bundle cleanly.
