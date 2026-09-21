import {
  NotificationCandidate,
  NotificationDecisionResult,
  NotificationPreference,
  NotificationType,
  NotificationPriority,
  AppNotification,
  PushSubscriptionRecord,
  CanonicalEvent,
} from '../../types/index.js';
import { NotificationRepository } from '../../repositories/notification.repository.js';
import { NotificationDecisionService } from './notificationDecision.service.js';
import { WebPushService } from './webPush.service.js';
import { learningRepository } from '../../repositories/learning.repository.js';

export class NotificationService {
  /**
   * Processes a candidate notification through the Decision Engine, persists the record,
   * and dispatches Web Push messages to all active user device endpoints.
   */
  public static async dispatchCandidate(
    candidate: NotificationCandidate,
    options: { force?: boolean; checkDedupe?: boolean; checkDailyCap?: boolean } = {}
  ): Promise<{
    notified: boolean;
    notification?: AppNotification;
    reason?: string;
    deliveriesCount?: number;
  }> {
    const preferences = await NotificationRepository.getPreferences(candidate.userId);

    // Run through Notification Decision Engine
    if (!options.force) {
      const decision: NotificationDecisionResult = await NotificationDecisionService.evaluateCandidate(
        preferences,
        candidate,
        {
          checkDedupe: options.checkDedupe !== false,
          checkDailyCap: options.checkDailyCap !== false,
        }
      );

      if (!decision.shouldNotify) {
        return {
          notified: false,
          reason: decision.rejectionReason,
        };
      }
    }

    // Persist notification record in database / store
    const notification = await NotificationRepository.createNotification({
      userId: candidate.userId,
      notificationType: candidate.notificationType,
      title: candidate.title,
      body: candidate.body,
      url: candidate.url,
      eventId: candidate.eventId,
      storylineId: candidate.storylineId,
      conceptId: candidate.conceptId,
      dedupeKey: candidate.dedupeKey,
      priority: candidate.priority,
      status: 'SENT',
    });

    // Fetch active device push subscriptions for user
    const subscriptions = await NotificationRepository.getUserActiveSubscriptions(candidate.userId);
    let successfulDeliveries = 0;

    for (const sub of subscriptions) {
      const delivery = await NotificationRepository.createDelivery(notification.id, sub.id);

      const pushResult = await WebPushService.sendPush(sub, {
        title: candidate.title,
        body: candidate.body,
        url: candidate.url,
        tag: `akira-${candidate.notificationType.toLowerCase()}`,
        data: {
          notificationId: notification.id,
          notificationType: candidate.notificationType,
          url: candidate.url,
          eventId: candidate.eventId,
          storylineId: candidate.storylineId,
          conceptId: candidate.conceptId,
        },
      });

      if (pushResult.success) {
        await NotificationRepository.updateDelivery(delivery.id, 'DELIVERED', 'Delivered');
        successfulDeliveries++;
      } else {
        const isRevoked = pushResult.statusCode === 404 || pushResult.statusCode === 410;
        await NotificationRepository.updateDelivery(
          delivery.id,
          isRevoked ? 'REVOKED' : 'FAILED',
          pushResult.error
        );
      }
    }

    return {
      notified: true,
      notification,
      deliveriesCount: successfulDeliveries,
    };
  }

  /**
   * Dispatches a manual test notification to an authenticated user's registered devices.
   */
  public static async sendTestNotification(
    userId: string,
    params: {
      notificationType?: NotificationType;
      title?: string;
      body?: string;
      url?: string;
    } = {}
  ): Promise<{ notification: AppNotification; deliveriesCount: number }> {
    const candidate: NotificationCandidate = {
      userId,
      notificationType: params.notificationType || 'BREAKING_NEWS',
      title: params.title || 'AKIRA • Intelligence Test Alert',
      body: params.body || 'Your AKIRA real-time intelligence & study notifications are working perfectly.',
      url: params.url || '/',
      dedupeKey: `test:${userId}:${Date.now()}`,
      priority: 'HIGH',
      isBypassQuietHours: true,
    };

    const res = await this.dispatchCandidate(candidate, { force: true });
    return {
      notification: res.notification!,
      deliveriesCount: res.deliveriesCount || 0,
    };
  }

  /**
   * Evaluates learning schedule notifications for a user:
   * 1. Scheduled study reminder
   * 2. SM-2 spaced repetition reviews due
   * 3. Daily briefing
   */
  public static async evaluateUserSchedules(
    userId: string,
    referenceDate: Date = new Date()
  ): Promise<AppNotification[]> {
    const preferences = await NotificationRepository.getPreferences(userId);
    if (!preferences.enabled) return [];

    const createdNotifications: AppNotification[] = [];

    // Compute user local date (YYYY-MM-DD) and current hour:minute (HH:MM)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: preferences.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(referenceDate);
    const year = parts.find((p) => p.type === 'year')?.value || '2026';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const day = parts.find((p) => p.type === 'day')?.value || '01';
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';

    const localDateStr = `${year}-${month}-${day}`;
    const localTimeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    // A. Daily Briefing Evaluation
    if (preferences.dailyBriefingEnabled) {
      if (this.isTimeMatching(localTimeStr, preferences.dailyBriefingTime, 30)) {
        const candidate = NotificationDecisionService.buildDailyBriefingCandidate(
          userId,
          localDateStr,
          5
        );
        const res = await this.dispatchCandidate(candidate);
        if (res.notified && res.notification) {
          createdNotifications.push(res.notification);
        }
      }
    }

    // B. Study Reminder Evaluation
    if (preferences.studyEnabled) {
      if (this.isTimeMatching(localTimeStr, preferences.studyTime, 30)) {
        const candidate = NotificationDecisionService.buildStudyReminderCandidate(
          userId,
          localDateStr,
          3
        );
        const res = await this.dispatchCandidate(candidate);
        if (res.notified && res.notification) {
          createdNotifications.push(res.notification);
        }
      }
    }

    // C. SM-2 Spaced Repetition Review Due Evaluation
    if (preferences.reviewEnabled) {
      try {
        const dueReviews = await learningRepository.getDueSchedules(userId);
        if (dueReviews && dueReviews.length > 0) {
          const candidate = NotificationDecisionService.buildReviewDueCandidate(
            userId,
            localDateStr,
            dueReviews.length
          );
          const res = await this.dispatchCandidate(candidate);
          if (res.notified && res.notification) {
            createdNotifications.push(res.notification);
          }
        }
      } catch (err: any) {
        console.warn('[NotificationService] Spaced review query notice:', err.message);
      }
    }

    return createdNotifications;
  }

  /**
   * Helper to check if current user time is approximately matching target time (within windowMinutes).
   */
  public static isTimeMatching(currentTime: string, targetTime: string, windowMinutes = 30): boolean {
    const [cHour, cMin] = currentTime.split(':').map(Number);
    const [tHour, tMin] = targetTime.split(':').map(Number);

    const currentTotalMin = cHour * 60 + cMin;
    const targetTotalMin = tHour * 60 + tMin;

    const diff = Math.abs(currentTotalMin - targetTotalMin);
    return diff <= windowMinutes;
  }
}
