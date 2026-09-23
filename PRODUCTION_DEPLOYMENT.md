# AKIRA — PRODUCTION DEPLOYMENT RUNBOOK & OPERATIONAL GUIDE

> **Production Launch Certification**: Version 1.0.0 (Phases 1–17 Complete)  
> **Target Architecture**: Vercel (Frontend & Serverless API Routes) / Express Node.js Engine + Neon Serverless PostgreSQL + Supabase Auth + Web Push + Vercel Cron.

---

## 1. System Architecture

```
                                    ┌────────────────────────┐
                                    │    Client / User       │
                                    │  (PWA / Mobile / Web)  │
                                    └───────────┬────────────┘
                                                │ HTTPS
                                                ▼
                                    ┌────────────────────────┐
                                    │     Vercel Edge /      │
                                    │   Vite Static Asset    │
                                    └───────────┬────────────┘
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        │                                               │
                        ▼                                               ▼
          ┌───────────────────────────┐                   ┌───────────────────────────┐
          │  AKIRA Serverless Engine  │                   │  Direct Supabase Auth     │
          │     (api/index.js)        │                   │  (Client SDK Flow)        │
          └─────────────┬─────────────┘                   └───────────────────────────┘
                        │
       ┌────────────────┼───────────────────────────────┐
       ▼                ▼                               ▼
┌──────────────┐ ┌──────────────┐            ┌──────────────────────┐
│  Neon DB     │ │  News Feeds  │            │  Google Gemini AI    │
│  PostgreSQL  │ │  (27 Feeds)  │            │  (5W1H & Explanations│
└──────────────┘ └──────────────┘            └──────────────────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ Web Push (VAPID)    │
             │ Real-Time Alerts    │
             └─────────────────────┘
```

---

## 2. Frontend Deployment (Vercel)

* **Framework Preset**: Vite
* **Root Directory**: `./`
* **Build Command**: `npm run build` (Builds server, client, and copies assets to `./dist`)
* **Output Directory**: `dist`
* **Install Command**: `npm install`
* **Routing Strategy**: Single Page Application (SPA) with deep link rewrites in `vercel.json` (`((?!api|assets|favicon.svg|manifest.json|sw.js).*) -> /index.html`).

---

## 3. Backend Deployment (Serverless / Express Node.js)

* **Serverless Entry Point**: `api/index.js` (Proxies requests to `server/dist/index.js`)
* **Express Core**: `server/src/index.ts`
* **Production Port**: Defaults to `5000` or assigned by platform `$PORT`
* **CORS Configuration**: Supports comma-delimited `CORS_ORIGIN` for production domain white-listing while rejecting unauthorized origin headers.
* **Background Scheduler Fallback**: When deployed in long-running container mode, `ingestionScheduler` and `notificationScheduler` auto-start. In Vercel serverless mode, Vercel Cron triggers `/api/live/sync`.

---

## 4. Database Deployment (Neon Serverless PostgreSQL / Supabase)

* **Primary Engine**: Neon Serverless PostgreSQL with SSL (`sslmode=require`)
* **Connection Pooling**: `pg.Pool` with connection timeout (`5000ms`), idle timeout (`30000ms`), and maximum pool limit (`10`).
* **Resilience**: 5-State Circuit Breaker (`CLOSED`, `FAILURES`, `OPEN`, `HALF_OPEN`, `DRAINING`) with automatic in-memory fallback to avoid process crashes.
* **Schema Health Check**: `GET /api/diagnostics/schema-health` validates 42 tables, foreign keys, and indexes.

---

## 5. Environment Variables Configuration

### Client-Safe (Exposed to Browser Bundle)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base API route URL | `/api` |
| `VITE_SUPABASE_URL` | Public Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anonymous API key | `eyJhbGciOi...` |
| `VITE_VAPID_PUBLIC_KEY` | Public VAPID key for Web Push registration | `BPVc5r3wmD6Cc...` |

### Server-Only (Strictly Protected Secrets)
| Variable | Description | Classification |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection URI with credentials | SECRET |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin service-role key for backend bypass | SECRET |
| `GEMINI_API_KEY` | Google Gemini API key for structured explanations | SECRET |
| `VAPID_PUBLIC_KEY` | Public Web Push key for payload signing | PUBLIC/SERVER |
| `VAPID_PRIVATE_KEY` | Private Web Push signing secret | SECRET |
| `VAPID_SUBJECT` | Contact mailto for VAPID push service | CONFIG |
| `CRON_SECRET` | Secret token to authenticate scheduled cron jobs | SECRET |
| `INTERNAL_SYNC_SECRET` | Internal service-to-service invocation secret | SECRET |
| `CORS_ORIGIN` | Allowed origin domains (comma-separated) | CONFIG |
| `DB_CONNECTION_TIMEOUT_MS` | Max connection acquire timeout (ms) | `5000` |

---

## 6. Cron & Ingestion Configuration

* **Vercel Cron Schedule**: Configured in `vercel.json` to execute `POST /api/live/sync` every 4 hours (`0 */4 * * *`).
* **Authentication**: Enforced via `Authorization: Bearer <CRON_SECRET>` or `x-akira-internal-key: <INTERNAL_SYNC_SECRET>`.
* **Idempotency**: Title & URL content hash deduplication skips duplicate articles and prevents duplicate canonical event creation across overlapping runs.

---

## 7. Web Push Notification Configuration

* **VAPID Public Key Endpoint**: `GET /api/notifications/vapid-public-key` dynamically provides the browser client with the active key.
* **Service Worker**: `client/public/sw.js` handles background push display, user actions, deep-link navigation, and network-first fetch without caching dynamic `/api/*` endpoints.
* **Notification Types**: `BREAKING_NEWS`, `IMPORTANT_EVENT`, `DAILY_BRIEF`, `STUDY_TIME`, `DUE_REVIEW`.

---

## 8. PWA Configuration

* **Manifest**: `client/public/manifest.json` configured with standalone mode, theme color `#0B0F17`, and maskable SVG icons.
* **Installation**: Auto-prompted and installable across iOS (Safari Add to Home Screen) and Android (Chrome / Edge PWA installation).
* **Offline Fallback**: Service Worker caches navigation shell `/index.html` for offline opening.

---

## 9. Authentication & User Data Isolation

* **Provider**: Supabase Auth (JWT Bearer Token verification).
* **Isolation Rule**: All user-private routes (`/api/auth/saved-events`, `/api/auth/profile`, `/api/learning/*`, `/api/notifications/*`) require valid user identity and strictly scope queries to `req.user.id`.
* **Verification**: Verified zero data leakage between distinct user accounts (`Alice` vs `Bob`).

---

## 10. Production URLs

* **Frontend Web App**: `https://your-akira-app.vercel.app` (or custom domain)
* **Backend API Base**: `https://your-akira-app.vercel.app/api`
* **Health Check**: `https://your-akira-app.vercel.app/api/health`
* **Database Health**: `https://your-akira-app.vercel.app/api/health/db`
* **System Diagnostics**: `https://your-akira-app.vercel.app/api/diagnostics/system-health`
* **Schema Integrity**: `https://your-akira-app.vercel.app/api/diagnostics/schema-health`

---

## 11. Deployment Commands

```bash
# 1. Install workspace dependencies
npm install

# 2. Run full 17-phase regression suite (307 tests)
npm test

# 3. Compile server and build Vite production bundle
npm run build

# 4. Deploy to Vercel production
npx vercel --prod
```

---

## 12. Migration & Schema Verification Procedure

```bash
# Run schema migration & seed bootstrap directly via tsx
npx tsx server/src/db/run-migrate.ts

# Or trigger via secured HTTP endpoint
curl -X POST https://your-akira-app.vercel.app/api/health/db/migrate \
  -H "Authorization: Bearer <CRON_SECRET>"
```

---

## 13. Rollback Procedure

### Frontend Rollback
1. In the Vercel Dashboard, navigate to **Deployments**.
2. Select the previous stable deployment and click **Redeploy / Instant Rollback**.
3. Or using Vercel CLI: `vercel rollback [deployment-id]`.

### Backend & Serverless Rollback
1. Revert to the prior release commit in Git:
   ```bash
   git revert HEAD --no-edit
   git push origin main
   ```
2. Vercel automatically deploys the reverted commit.

### Database Migration Rollback
1. Neon supports **Branch Point-in-Time Recovery**:
   - In the Neon Console, restore database state to a timestamp prior to the migration.
2. For Supabase, restore from daily automated backups via Supabase Dashboard **Database -> Backups**.

---

## 14. Monitoring & Observability

* **Vercel Observability**: Real-time serverless execution logs, function execution durations, and HTTP 5xx error tracking in Vercel Analytics.
* **Telemetry Snapshots**: `GET /api/diagnostics/system-health` provides live source health, quarantine counts, and category coverage percentages.
* **Circuit Breaker Status**: Monitored on all API responses via `dbCircuitBreaker.getStats()`.

---

## 15. Backup & Disaster Recovery

* **Neon PostgreSQL**: Continuous WAL archiving with automated Point-in-Time Restore (PITR) up to 7 days retention on Launch tier.
* **Supabase Auth**: Automated daily snapshot backups with point-in-time recovery.
* **In-Memory Fallback**: If the database cluster becomes temporarily unreachable, the AKIRA Circuit Breaker transitions to in-memory fallback to keep the user experience alive without downtime.

---

## 16. Security Checklist

- [x] All server secrets (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`, `GEMINI_API_KEY`) excluded from client bundle.
- [x] `.env` files added to `.gitignore`.
- [x] CORS restricts untrusted origins in production mode.
- [x] `POST /api/live/sync` protected with `CRON_SECRET` / internal service key.
- [x] SQL injection protected via parameterized queries across all repositories.
- [x] XSS protection and security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1`) configured in `vercel.json`.
- [x] User-private data strictly isolated by user ID session token.

---

## 17. Known Limitations & Recommendations

1. **Vercel Serverless Function Execution Limit**: Free tier functions have a 10s or 60s execution limit; news ingestion is bounded to concurrent batch sizes to finish comfortably within limits.
2. **Web Push Browser Compatibility**: Safari iOS requires user to "Add to Home Screen" (PWA installation) before Web Push API becomes active.
3. **Feed Availability**: External news feeds may experience transient network timeouts; AKIRA automatically isolates failing feeds to quarantine without impacting other sources.
