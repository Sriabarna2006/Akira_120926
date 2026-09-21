# AKIRA Phase 14: Real-Time Intelligence & Mobile Notification System

## 1. Executive Summary
Phase 14 establishes a proactive, deterministic, and selective notification and mobile intelligence delivery pipeline for AKIRA.

The system connects AKIRA's existing canonical event ingestion, Phase 5 dynamic ranking, Phase 8 adaptive personalization, Phase 10 evidence completeness, Phase 11 storylines, and Phase 7 SM-2 spaced repetition with standards-based **Web Push** (RFC 8291 / 8292) and **PWA Service Worker** mobile notifications.

---

## 2. Core Architecture Pipeline
```
REAL-WORLD SOURCE / RSS INGESTION / USER STUDY SCHEDULE
                           ↓
        CANONICAL EVENT / STORYLINE / LEARNING TRIGGER
                           ↓
        TREND & IMPORTANCE RANKING (Phase 5)
                           ↓
        EVIDENCE / TRUST & CONFLICT FILTERING (Phase 10)
                           ↓
        PERSONALIZATION & USER AFFINITY (Phase 8)
                           ↓
      ⚡ NOTIFICATION DECISION ENGINE (Phase 14)
       - Candidate Evaluation against user preference toggles
       - Epistemic & evidence completeness verification
       - Timezone-aware Quiet Hours check (midnight wrap-around)
       - Deterministic Deduplication (unique dedupe keys)
       - Per-user Daily Rate Limiting (maximum notifications cap)
                           ↓
      📬 PERSISTENT NOTIFICATION & DELIVERY LOG
                           ↓
      🚀 WEB PUSH DISPATCH (VAPID / Device subscriptions)
                           ↓
      📲 SERVICE WORKER (`/sw.js` on mobile / PWA / desktop)
                           ↓
      🔔 NATIVE LOCK-SCREEN NOTIFICATION (`showNotification`)
                           ↓
      👆 USER TAP → SANITIZED DEEP-LINK ROUTING (Event / Storyline / Learn / Daily Brief)
```

---

## 3. Database Schema & Migrations

### Migration `013_phase14_notifications.sql`

#### `public.push_subscriptions`
Stores Web Push device endpoints per user/device.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL`
- `endpoint TEXT NOT NULL`
- `p256dh TEXT NOT NULL`
- `auth TEXT NOT NULL`
- `device_label VARCHAR(100)`
- `platform VARCHAR(50)` (`android` | `ios` | `desktop` | `mobile`)
- `user_agent TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `revoked_at TIMESTAMPTZ`
- Constraint: `UNIQUE(user_id, endpoint)`

#### `public.notification_preferences`
Stores granular user settings, schedules, and quiet hours.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL UNIQUE`
- `enabled BOOLEAN NOT NULL DEFAULT true`
- `breaking_enabled BOOLEAN NOT NULL DEFAULT true`
- `major_update_enabled BOOLEAN NOT NULL DEFAULT true`
- `storyline_enabled BOOLEAN NOT NULL DEFAULT true`
- `study_enabled BOOLEAN NOT NULL DEFAULT true`
- `review_enabled BOOLEAN NOT NULL DEFAULT true`
- `daily_briefing_enabled BOOLEAN NOT NULL DEFAULT true`
- `knowledge_gap_enabled BOOLEAN NOT NULL DEFAULT true`
- `daily_goal_enabled BOOLEAN NOT NULL DEFAULT true`
- `study_time VARCHAR(10) NOT NULL DEFAULT '19:00'`
- `daily_briefing_time VARCHAR(10) NOT NULL DEFAULT '08:00'`
- `quiet_hours_start VARCHAR(10) NOT NULL DEFAULT '22:30'`
- `quiet_hours_end VARCHAR(10) NOT NULL DEFAULT '07:00'`
- `timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata'`
- `minimum_importance INT NOT NULL DEFAULT 70`
- `minimum_evidence INT NOT NULL DEFAULT 60`
- `maximum_daily_notifications INT NOT NULL DEFAULT 10`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

#### `public.notifications`
Persistent notification history and deduplication tracking.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL`
- `notification_type VARCHAR(50) NOT NULL`
- `title TEXT NOT NULL`
- `body TEXT NOT NULL`
- `url TEXT NOT NULL`
- `event_id VARCHAR(100)`
- `storyline_id VARCHAR(100)`
- `concept_id VARCHAR(100)`
- `dedupe_key VARCHAR(255) NOT NULL`
- `priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL'`
- `status VARCHAR(30) NOT NULL DEFAULT 'PENDING'`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `sent_at TIMESTAMPTZ`
- `opened_at TIMESTAMPTZ`
- `expires_at TIMESTAMPTZ`

#### `public.notification_deliveries`
Device-level push dispatch logs and delivery tracking.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE`
- `subscription_id UUID NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE`
- `status VARCHAR(30) NOT NULL DEFAULT 'PENDING'` (`PENDING` | `DELIVERED` | `FAILED` | `REVOKED`)
- `provider_response TEXT`
- `attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `delivered_at TIMESTAMPTZ`
- `failed_at TIMESTAMPTZ`

---

## 4. Notification Types & Priority Model

| Type | Priority | Trigger Condition | Deep-Link Destination |
| :--- | :--- | :--- | :--- |
| `BREAKING_NEWS` | `CRITICAL` | Importance $\ge 80$, recency $< 6\text{h}$, evidence $\ge 70$, no conflicts | `/event/:id` |
| `MAJOR_UPDATE` | `HIGH` | Turning point or rank surge in storyline | `/storyline/:id` or `/event/:id` |
| `STORYLINE_UPDATE` | `NORMAL` | New development in followed storyline | `/storyline/:id` |
| `STUDY_REMINDER` | `NORMAL` | Local user time matches scheduled study time | `/learn` |
| `REVIEW_DUE` | `NORMAL` | SM-2 spaced repetition items due today | `/learn` |
| `KNOWLEDGE_GAP` | `LOW` | Recommended concept mastery opportunity | `/concept/:id` |
| `DAILY_GOAL` | `NORMAL` | Daily learning goal status reminder | `/learn` |
| `DAILY_BRIEFING` | `NORMAL` | Local user time matches morning briefing time | `/daily-brief` |

---

## 5. Notification Decision Engine

The decision engine in `notificationDecision.service.ts` deterministically evaluates:
1. **Global Toggle**: `preferences.enabled === true`
2. **Channel Toggle**: Specific type enabled in preferences
3. **Importance Threshold**: Event importance $\ge$ `preferences.minimumImportance`
4. **Epistemic Trust Verification**: Evidence completeness $\ge$ `preferences.minimumEvidence` and zero unresolved conflicts
5. **Timezone-Aware Quiet Hours**: Evaluates user local time against `quietHoursStart` and `quietHoursEnd` (with midnight wrap-around handling)
6. **Daily Cap**: Daily count $<$ `preferences.maximumDailyNotifications`
7. **Deduplication Key**: Prevents duplicate pushes with matching deterministic keys

### Deterministic Deduplication Keys
- Breaking: `breaking:${eventId}`
- Major Update: `major:${storylineId}:${eventId}`
- Storyline: `storyline:${storylineId}:${eventId}`
- Study Reminder: `study:${userId}:${dateStr}`
- Spaced Review: `review:${userId}:${dateStr}`
- Daily Briefing: `briefing:${userId}:${dateStr}`
- Knowledge Gap: `gap:${userId}:${conceptId}:${dateStr}`

---

## 6. PWA & Service Worker Implementation

- **Web App Manifest (`client/public/manifest.json`)**: Configured for standalone mobile installation with portrait orientation, dark theme color (`#0B0F17`), and SVG/PNG icon assets.
- **Service Worker (`client/public/sw.js`)**:
  - `push` event: Parses Web Push payload safely and invokes `self.registration.showNotification` with vibration pattern and tag replacement.
  - `notificationclick` event: Closes notification, sanitizes destination URL, searches for open client windows, and navigates/focuses or opens a new window.

---

## 7. Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VAPID_PUBLIC_KEY` | Optional (auto-generated in dev) | Auto-generated dev key | Application server public key for browser push registration |
| `VAPID_PRIVATE_KEY` | Optional (auto-generated in dev) | Auto-generated dev key | Application server private key (NEVER exposed to client) |
| `VAPID_SUBJECT` | Optional | `mailto:support@akira.ai` | Contact email or URL for push service providers |
| `NOTIFICATION_INTERVAL_MINUTES` | Optional | `10` | Evaluation cycle frequency for background notification scheduler |
| `INTERNAL_SYNC_SECRET` | Optional | `akira_internal_dev_secret` | Internal authentication key for cron endpoints |

---

## 8. Deployment & Platform Compatibility

- **Node.js Standalone**: In-process `notificationScheduler.start()` runs evaluation cycles periodically with concurrency mutex lock protection.
- **Serverless / Vercel**: External cron or serverless scheduler triggers `POST /api/notifications/scheduler/run` authenticated via `x-akira-internal-key` header.
- **Mobile Browsers**: Android Chrome, Android Firefox, Edge Mobile, Samsung Internet, and iOS 16.4+ installed PWAs supported out-of-the-box.
