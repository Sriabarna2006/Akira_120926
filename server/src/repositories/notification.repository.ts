import { query, queryOne, isDatabaseConnected } from '../db/dbClient.js';
import {
  PushSubscriptionPayload,
  PushSubscriptionRecord,
  NotificationPreference,
  AppNotification,
  NotificationDelivery,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from '../types/index.js';

// In-Memory fallback storage for offline, CI, and test execution
const memoryPushSubscriptions = new Map<string, PushSubscriptionRecord>();
const memoryNotificationPreferences = new Map<string, NotificationPreference>();
const memoryNotifications = new Map<string, AppNotification>();
const memoryNotificationDeliveries = new Map<string, NotificationDelivery>();

export class NotificationRepository {
  /**
   * Clears in-memory state (useful for test resets)
   */
  public static clearMemoryStore(): void {
    memoryPushSubscriptions.clear();
    memoryNotificationPreferences.clear();
    memoryNotifications.clear();
    memoryNotificationDeliveries.clear();
  }

  // =========================================================================
  // 1. PUSH SUBSCRIPTIONS
  // =========================================================================

  public static async createOrUpdateSubscription(
    userId: string,
    payload: PushSubscriptionPayload
  ): Promise<PushSubscriptionRecord> {
    const { endpoint, keys, deviceLabel = 'Browser', platform = 'desktop', userAgent } = payload;

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.push_subscriptions (
            user_id, endpoint, p256dh, auth, device_label, platform, user_agent, last_seen_at, revoked_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NULL)
          ON CONFLICT (user_id, endpoint)
          DO UPDATE SET
            p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth,
            device_label = EXCLUDED.device_label,
            platform = EXCLUDED.platform,
            user_agent = EXCLUDED.user_agent,
            last_seen_at = NOW(),
            revoked_at = NULL
          RETURNING *;
        `;
        const row = await queryOne(sql, [
          userId,
          endpoint,
          keys.p256dh,
          keys.auth,
          deviceLabel,
          platform,
          userAgent || null,
        ]);
        if (row) {
          return this.mapDbSubscription(row);
        }
      } catch (err: any) {
        console.warn('[NotificationRepository] DB subscription upsert fallback:', err.message);
      }
    }

    // In-Memory Fallback
    const existing = Array.from(memoryPushSubscriptions.values()).find(
      (s) => s.userId === userId && s.endpoint === endpoint
    );

    const now = new Date().toISOString();
    const record: PushSubscriptionRecord = {
      id: existing ? existing.id : `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      deviceLabel,
      platform,
      userAgent,
      createdAt: existing ? existing.createdAt : now,
      lastSeenAt: now,
      revokedAt: null,
    };

    memoryPushSubscriptions.set(record.id, record);
    return record;
  }

  public static async revokeSubscription(userId: string, endpoint: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          UPDATE public.push_subscriptions
          SET revoked_at = NOW()
          WHERE user_id = $1 AND endpoint = $2;
        `;
        await query(sql, [userId, endpoint]);
        return true;
      } catch (err: any) {
        console.warn('[NotificationRepository] DB revokeSubscription fallback:', err.message);
      }
    }

    let modified = false;
    for (const [id, sub] of memoryPushSubscriptions.entries()) {
      if (sub.userId === userId && sub.endpoint === endpoint) {
        sub.revokedAt = new Date().toISOString();
        memoryPushSubscriptions.set(id, sub);
        modified = true;
      }
    }
    return modified;
  }

  public static async revokeSubscriptionByEndpoint(endpoint: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          UPDATE public.push_subscriptions
          SET revoked_at = NOW()
          WHERE endpoint = $1;
        `;
        await query(sql, [endpoint]);
        return true;
      } catch (err: any) {
        console.warn('[NotificationRepository] DB revokeSubscriptionByEndpoint fallback:', err.message);
      }
    }

    let modified = false;
    for (const [id, sub] of memoryPushSubscriptions.entries()) {
      if (sub.endpoint === endpoint) {
        sub.revokedAt = new Date().toISOString();
        memoryPushSubscriptions.set(id, sub);
        modified = true;
      }
    }
    return modified;
  }

  public static async getUserActiveSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT * FROM public.push_subscriptions
          WHERE user_id = $1 AND revoked_at IS NULL
          ORDER BY last_seen_at DESC;
        `;
        const rows = await query(sql, [userId]);
        return rows.map((r) => this.mapDbSubscription(r));
      } catch (err: any) {
        console.warn('[NotificationRepository] DB getUserActiveSubscriptions fallback:', err.message);
      }
    }

    return Array.from(memoryPushSubscriptions.values())
      .filter((s) => s.userId === userId && !s.revokedAt)
      .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
  }

  public static async cleanStaleSubscriptions(daysInactive = 90): Promise<number> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          DELETE FROM public.push_subscriptions
          WHERE revoked_at IS NOT NULL AND revoked_at < NOW() - ($1 || ' days')::INTERVAL;
        `;
        const res = await query(sql, [daysInactive]);
        return res.length;
      } catch (err: any) {
        console.warn('[NotificationRepository] DB cleanStaleSubscriptions fallback:', err.message);
      }
    }

    let count = 0;
    const cutoff = Date.now() - daysInactive * 24 * 60 * 60 * 1000;
    for (const [id, sub] of memoryPushSubscriptions.entries()) {
      if (sub.revokedAt && new Date(sub.revokedAt).getTime() < cutoff) {
        memoryPushSubscriptions.delete(id);
        count++;
      }
    }
    return count;
  }

  // =========================================================================
  // 2. NOTIFICATION PREFERENCES
  // =========================================================================

  public static getDefaultPreferences(userId: string): NotificationPreference {
    return {
      userId,
      enabled: true,
      breakingEnabled: true,
      majorUpdateEnabled: true,
      storylineEnabled: true,
      studyEnabled: true,
      reviewEnabled: true,
      dailyBriefingEnabled: true,
      knowledgeGapEnabled: true,
      dailyGoalEnabled: true,
      studyTime: '19:00',
      dailyBriefingTime: '08:00',
      quietHoursStart: '22:30',
      quietHoursEnd: '07:00',
      timezone: 'Asia/Kolkata',
      minimumImportance: 70,
      minimumEvidence: 60,
      maximumDailyNotifications: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public static async getPreferences(userId: string): Promise<NotificationPreference> {
    if (isDatabaseConnected()) {
      try {
        const sql = `SELECT * FROM public.notification_preferences WHERE user_id = $1;`;
        const row = await queryOne(sql, [userId]);
        if (row) {
          return this.mapDbPreferences(row);
        }
      } catch (err: any) {
        console.warn('[NotificationRepository] DB getPreferences fallback:', err.message);
      }
    }

    const memoryPref = memoryNotificationPreferences.get(userId);
    if (memoryPref) {
      return memoryPref;
    }

    const defaultPref = this.getDefaultPreferences(userId);
    memoryNotificationPreferences.set(userId, defaultPref);
    return defaultPref;
  }

  public static async upsertPreferences(
    userId: string,
    updates: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const existing = await this.getPreferences(userId);
    const merged: NotificationPreference = {
      ...existing,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.notification_preferences (
            user_id, enabled, breaking_enabled, major_update_enabled, storyline_enabled,
            study_enabled, review_enabled, daily_briefing_enabled, knowledge_gap_enabled,
            daily_goal_enabled, study_time, daily_briefing_time, quiet_hours_start,
            quiet_hours_end, timezone, minimum_importance, minimum_evidence,
            maximum_daily_notifications, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
          )
          ON CONFLICT (user_id)
          DO UPDATE SET
            enabled = EXCLUDED.enabled,
            breaking_enabled = EXCLUDED.breaking_enabled,
            major_update_enabled = EXCLUDED.major_update_enabled,
            storyline_enabled = EXCLUDED.storyline_enabled,
            study_enabled = EXCLUDED.study_enabled,
            review_enabled = EXCLUDED.review_enabled,
            daily_briefing_enabled = EXCLUDED.daily_briefing_enabled,
            knowledge_gap_enabled = EXCLUDED.knowledge_gap_enabled,
            daily_goal_enabled = EXCLUDED.daily_goal_enabled,
            study_time = EXCLUDED.study_time,
            daily_briefing_time = EXCLUDED.daily_briefing_time,
            quiet_hours_start = EXCLUDED.quiet_hours_start,
            quiet_hours_end = EXCLUDED.quiet_hours_end,
            timezone = EXCLUDED.timezone,
            minimum_importance = EXCLUDED.minimum_importance,
            minimum_evidence = EXCLUDED.minimum_evidence,
            maximum_daily_notifications = EXCLUDED.maximum_daily_notifications,
            updated_at = NOW()
          RETURNING *;
        `;
        const row = await queryOne(sql, [
          merged.userId,
          merged.enabled,
          merged.breakingEnabled,
          merged.majorUpdateEnabled,
          merged.storylineEnabled,
          merged.studyEnabled,
          merged.reviewEnabled,
          merged.dailyBriefingEnabled,
          merged.knowledgeGapEnabled,
          merged.dailyGoalEnabled,
          merged.studyTime,
          merged.dailyBriefingTime,
          merged.quietHoursStart,
          merged.quietHoursEnd,
          merged.timezone,
          merged.minimumImportance,
          merged.minimumEvidence,
          merged.maximumDailyNotifications,
        ]);
        if (row) {
          return this.mapDbPreferences(row);
        }
      } catch (err: any) {
        console.warn('[NotificationRepository] DB upsertPreferences fallback:', err.message);
      }
    }

    memoryNotificationPreferences.set(userId, merged);
    return merged;
  }

  // =========================================================================
  // 3. NOTIFICATIONS HISTORY
  // =========================================================================

  public static async createNotification(
    params: Omit<AppNotification, 'id' | 'createdAt' | 'status'> & { status?: NotificationStatus }
  ): Promise<AppNotification> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const status: NotificationStatus = params.status || 'SENT';

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.notifications (
            id, user_id, notification_type, title, body, url, event_id, storyline_id,
            concept_id, dedupe_key, priority, status, created_at, sent_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
          )
          RETURNING *;
        `;
        const row = await queryOne(sql, [
          id,
          params.userId,
          params.notificationType,
          params.title,
          params.body,
          params.url,
          params.eventId || null,
          params.storylineId || null,
          params.conceptId || null,
          params.dedupeKey,
          params.priority,
          status,
        ]);
        if (row) {
          return this.mapDbNotification(row);
        }
      } catch (err: any) {
        console.warn('[NotificationRepository] DB createNotification fallback:', err.message);
      }
    }

    const notification: AppNotification = {
      id,
      userId: params.userId,
      notificationType: params.notificationType,
      title: params.title,
      body: params.body,
      url: params.url,
      eventId: params.eventId || null,
      storylineId: params.storylineId || null,
      conceptId: params.conceptId || null,
      dedupeKey: params.dedupeKey,
      priority: params.priority,
      status,
      createdAt: now,
      sentAt: now,
      openedAt: null,
      expiresAt: null,
    };

    memoryNotifications.set(id, notification);
    return notification;
  }

  public static async getNotificationById(id: string, userId?: string): Promise<AppNotification | null> {
    if (isDatabaseConnected()) {
      try {
        let sql = `SELECT * FROM public.notifications WHERE id = $1`;
        const params: any[] = [id];
        if (userId) {
          sql += ` AND user_id = $2`;
          params.push(userId);
        }
        const row = await queryOne(sql, params);
        if (row) return this.mapDbNotification(row);
      } catch (err: any) {
        console.warn('[NotificationRepository] DB getNotificationById fallback:', err.message);
      }
    }

    const notif = memoryNotifications.get(id);
    if (!notif) return null;
    if (userId && notif.userId !== userId) return null;
    return notif;
  }

  public static async getNotificationByDedupeKey(
    userId: string,
    dedupeKey: string
  ): Promise<AppNotification | null> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT * FROM public.notifications
          WHERE user_id = $1 AND dedupe_key = $2
          ORDER BY created_at DESC LIMIT 1;
        `;
        const row = await queryOne(sql, [userId, dedupeKey]);
        if (row) return this.mapDbNotification(row);
      } catch (err: any) {
        console.warn('[NotificationRepository] DB getNotificationByDedupeKey fallback:', err.message);
      }
    }

    return (
      Array.from(memoryNotifications.values()).find(
        (n) => n.userId === userId && n.dedupeKey === dedupeKey
      ) || null
    );
  }

  public static async getNotificationHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: NotificationType;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: AppNotification[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const offset = (page - 1) * limit;

    if (isDatabaseConnected()) {
      try {
        let whereClause = `WHERE user_id = $1`;
        const params: any[] = [userId];
        let paramIndex = 2;

        if (options.type) {
          whereClause += ` AND notification_type = $${paramIndex++}`;
          params.push(options.type);
        }

        if (options.unreadOnly) {
          whereClause += ` AND opened_at IS NULL`;
        }

        const countSql = `SELECT COUNT(*) as total FROM public.notifications ${whereClause};`;
        const countRow = await queryOne(countSql, params);
        const total = countRow ? parseInt(countRow.total, 10) : 0;

        const dataSql = `
          SELECT * FROM public.notifications
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${paramIndex++} OFFSET $${paramIndex++};
        `;
        params.push(limit, offset);

        const rows = await query(dataSql, params);
        return {
          notifications: rows.map((r) => this.mapDbNotification(r)),
          total,
          page,
          limit,
        };
      } catch (err: any) {
        console.warn('[NotificationRepository] DB getNotificationHistory fallback:', err.message);
      }
    }

    let list = Array.from(memoryNotifications.values()).filter((n) => n.userId === userId);
    if (options.type) {
      list = list.filter((n) => n.notificationType === options.type);
    }
    if (options.unreadOnly) {
      list = list.filter((n) => !n.openedAt);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const paginated = list.slice(offset, offset + limit);

    return {
      notifications: paginated,
      total,
      page,
      limit,
    };
  }

  public static async getUnreadCount(userId: string): Promise<number> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT COUNT(*) as unread_count
          FROM public.notifications
          WHERE user_id = $1 AND opened_at IS NULL;
        `;
        const row = await queryOne(sql, [userId]);
        return row ? parseInt(row.unread_count, 10) : 0;
      } catch (err: any) {
        console.warn('[NotificationRepository] DB getUnreadCount fallback:', err.message);
      }
    }

    return Array.from(memoryNotifications.values()).filter(
      (n) => n.userId === userId && !n.openedAt
    ).length;
  }

  public static async markAsRead(id: string, userId: string): Promise<AppNotification | null> {
    const now = new Date().toISOString();

    if (isDatabaseConnected()) {
      try {
        const sql = `
          UPDATE public.notifications
          SET opened_at = NOW(), status = 'OPENED'
          WHERE id = $1 AND user_id = $2
          RETURNING *;
        `;
        const row = await queryOne(sql, [id, userId]);
        if (row) return this.mapDbNotification(row);
      } catch (err: any) {
        console.warn('[NotificationRepository] DB markAsRead fallback:', err.message);
      }
    }

    const notif = memoryNotifications.get(id);
    if (!notif || notif.userId !== userId) return null;

    notif.openedAt = now;
    notif.status = 'OPENED';
    memoryNotifications.set(id, notif);
    return notif;
  }

  public static async markAllAsRead(userId: string): Promise<number> {
    const now = new Date().toISOString();

    if (isDatabaseConnected()) {
      try {
        const sql = `
          UPDATE public.notifications
          SET opened_at = NOW(), status = 'OPENED'
          WHERE user_id = $1 AND opened_at IS NULL;
        `;
        const res = await query(sql, [userId]);
        return res.length;
      } catch (err: any) {
        console.warn('[NotificationRepository] DB markAllAsRead fallback:', err.message);
      }
    }

    let count = 0;
    for (const [id, notif] of memoryNotifications.entries()) {
      if (notif.userId === userId && !notif.openedAt) {
        notif.openedAt = now;
        notif.status = 'OPENED';
        memoryNotifications.set(id, notif);
        count++;
      }
    }
    return count;
  }

  public static async countNotificationsToday(userId: string): Promise<number> {
    const startOfTodayUtc = new Date();
    startOfTodayUtc.setUTCHours(0, 0, 0, 0);

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT COUNT(*) as daily_count
          FROM public.notifications
          WHERE user_id = $1 AND created_at >= $2;
        `;
        const row = await queryOne(sql, [userId, startOfTodayUtc.toISOString()]);
        return row ? parseInt(row.daily_count, 10) : 0;
      } catch (err: any) {
        console.warn('[NotificationRepository] DB countNotificationsToday fallback:', err.message);
      }
    }

    const cutoffTime = startOfTodayUtc.getTime();
    return Array.from(memoryNotifications.values()).filter(
      (n) => n.userId === userId && new Date(n.createdAt).getTime() >= cutoffTime
    ).length;
  }

  // =========================================================================
  // 4. NOTIFICATION DELIVERIES
  // =========================================================================

  public static async createDelivery(
    notificationId: string,
    subscriptionId: string
  ): Promise<NotificationDelivery> {
    const id = `del_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.notification_deliveries (
            id, notification_id, subscription_id, status, attempted_at
          ) VALUES ($1, $2, $3, 'PENDING', NOW())
          RETURNING *;
        `;
        const row = await queryOne(sql, [id, notificationId, subscriptionId]);
        if (row) return this.mapDbDelivery(row);
      } catch (err: any) {
        console.warn('[NotificationRepository] DB createDelivery fallback:', err.message);
      }
    }

    const delivery: NotificationDelivery = {
      id,
      notificationId,
      subscriptionId,
      status: 'PENDING',
      attemptedAt: now,
    };
    memoryNotificationDeliveries.set(id, delivery);
    return delivery;
  }

  public static async updateDelivery(
    id: string,
    status: 'DELIVERED' | 'FAILED' | 'REVOKED',
    providerResponse?: string
  ): Promise<NotificationDelivery | null> {
    const now = new Date().toISOString();

    if (isDatabaseConnected()) {
      try {
        const sql = `
          UPDATE public.notification_deliveries
          SET status = $2,
              provider_response = $3,
              delivered_at = CASE WHEN $2 = 'DELIVERED' THEN NOW() ELSE delivered_at END,
              failed_at = CASE WHEN $2 IN ('FAILED', 'REVOKED') THEN NOW() ELSE failed_at END
          WHERE id = $1
          RETURNING *;
        `;
        const row = await queryOne(sql, [id, status, providerResponse || null]);
        if (row) return this.mapDbDelivery(row);
      } catch (err: any) {
        console.warn('[NotificationRepository] DB updateDelivery fallback:', err.message);
      }
    }

    const del = memoryNotificationDeliveries.get(id);
    if (!del) return null;
    del.status = status;
    del.providerResponse = providerResponse || null;
    if (status === 'DELIVERED') del.deliveredAt = now;
    if (status === 'FAILED' || status === 'REVOKED') del.failedAt = now;
    memoryNotificationDeliveries.set(id, del);
    return del;
  }

  // =========================================================================
  // MAPPERS
  // =========================================================================

  private static mapDbSubscription(r: any): PushSubscriptionRecord {
    return {
      id: r.id,
      userId: r.user_id,
      endpoint: r.endpoint,
      p256dh: r.p256dh,
      auth: r.auth,
      deviceLabel: r.device_label || 'Browser',
      platform: r.platform || 'desktop',
      userAgent: r.user_agent || undefined,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      lastSeenAt: r.last_seen_at instanceof Date ? r.last_seen_at.toISOString() : r.last_seen_at,
      revokedAt: r.revoked_at ? (r.revoked_at instanceof Date ? r.revoked_at.toISOString() : r.revoked_at) : null,
    };
  }

  private static mapDbPreferences(r: any): NotificationPreference {
    return {
      id: r.id,
      userId: r.user_id,
      enabled: r.enabled !== false,
      breakingEnabled: r.breaking_enabled !== false,
      majorUpdateEnabled: r.major_update_enabled !== false,
      storylineEnabled: r.storyline_enabled !== false,
      studyEnabled: r.study_enabled !== false,
      reviewEnabled: r.review_enabled !== false,
      dailyBriefingEnabled: r.daily_briefing_enabled !== false,
      knowledgeGapEnabled: r.knowledge_gap_enabled !== false,
      dailyGoalEnabled: r.daily_goal_enabled !== false,
      studyTime: r.study_time || '19:00',
      dailyBriefingTime: r.daily_briefing_time || '08:00',
      quietHoursStart: r.quiet_hours_start || '22:30',
      quietHoursEnd: r.quiet_hours_end || '07:00',
      timezone: r.timezone || 'Asia/Kolkata',
      minimumImportance: typeof r.minimum_importance === 'number' ? r.minimum_importance : 70,
      minimumEvidence: typeof r.minimum_evidence === 'number' ? r.minimum_evidence : 60,
      maximumDailyNotifications: typeof r.maximum_daily_notifications === 'number' ? r.maximum_daily_notifications : 10,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    };
  }

  private static mapDbNotification(r: any): AppNotification {
    return {
      id: r.id,
      userId: r.user_id,
      notificationType: r.notification_type,
      title: r.title,
      body: r.body,
      url: r.url,
      eventId: r.event_id || null,
      storylineId: r.storyline_id || null,
      conceptId: r.concept_id || null,
      dedupeKey: r.dedupe_key,
      priority: r.priority || 'NORMAL',
      status: r.status || 'SENT',
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      sentAt: r.sent_at ? (r.sent_at instanceof Date ? r.sent_at.toISOString() : r.sent_at) : null,
      openedAt: r.opened_at ? (r.opened_at instanceof Date ? r.opened_at.toISOString() : r.opened_at) : null,
      expiresAt: r.expires_at ? (r.expires_at instanceof Date ? r.expires_at.toISOString() : r.expires_at) : null,
    };
  }

  private static mapDbDelivery(r: any): NotificationDelivery {
    return {
      id: r.id,
      notificationId: r.notification_id,
      subscriptionId: r.subscription_id,
      status: r.status,
      providerResponse: r.provider_response || null,
      attemptedAt: r.attempted_at instanceof Date ? r.attempted_at.toISOString() : r.attempted_at,
      deliveredAt: r.delivered_at ? (r.delivered_at instanceof Date ? r.delivered_at.toISOString() : r.delivered_at) : null,
      failedAt: r.failed_at ? (r.failed_at instanceof Date ? r.failed_at.toISOString() : r.failed_at) : null,
    };
  }
}
