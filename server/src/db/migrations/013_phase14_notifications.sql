-- Phase 14: Real-Time Intelligence & Mobile Notification System
-- Push Subscriptions, User Notification Preferences, Notifications History, and Delivery Tracking

-- 1. Push Subscriptions Table (Web Push device endpoints per user)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_label VARCHAR(100) DEFAULT 'Browser',
    platform VARCHAR(50) DEFAULT 'desktop',
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    CONSTRAINT uq_push_subscriptions_user_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_revoked ON public.push_subscriptions(revoked_at) WHERE revoked_at IS NULL;

-- 2. Notification Preferences Table (User configuration & quiet hours)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    breaking_enabled BOOLEAN NOT NULL DEFAULT true,
    major_update_enabled BOOLEAN NOT NULL DEFAULT true,
    storyline_enabled BOOLEAN NOT NULL DEFAULT true,
    study_enabled BOOLEAN NOT NULL DEFAULT true,
    review_enabled BOOLEAN NOT NULL DEFAULT true,
    daily_briefing_enabled BOOLEAN NOT NULL DEFAULT true,
    knowledge_gap_enabled BOOLEAN NOT NULL DEFAULT true,
    daily_goal_enabled BOOLEAN NOT NULL DEFAULT true,
    study_time VARCHAR(10) NOT NULL DEFAULT '19:00',
    daily_briefing_time VARCHAR(10) NOT NULL DEFAULT '08:00',
    quiet_hours_start VARCHAR(10) NOT NULL DEFAULT '22:30',
    quiet_hours_end VARCHAR(10) NOT NULL DEFAULT '07:00',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    minimum_importance INT NOT NULL DEFAULT 70,
    minimum_evidence INT NOT NULL DEFAULT 60,
    maximum_daily_notifications INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON public.notification_preferences(user_id);

-- 3. Notifications History Table (Persistent notification records & deduplication)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT NOT NULL,
    event_id VARCHAR(100),
    storyline_id VARCHAR(100),
    concept_id VARCHAR(100),
    dedupe_key VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_dedupe ON public.notifications(user_id, dedupe_key);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_storyline_id ON public.notifications(storyline_id) WHERE storyline_id IS NOT NULL;

-- 4. Notification Deliveries Table (Device-level push delivery dispatch tracking)
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    provider_response TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON public.notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_subscription ON public.notification_deliveries(subscription_id);
