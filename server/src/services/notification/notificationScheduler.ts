import { NotificationService } from './notification.service.js';
import { NotificationRepository } from '../../repositories/notification.repository.js';
import { query, isDatabaseConnected } from '../../db/dbClient.js';

export interface NotificationEvaluationReport {
  durationMs: number;
  usersEvaluated: number;
  notificationsCreated: number;
  staleSubscriptionsCleaned: number;
  errorCount: number;
}

class NotificationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isEvaluating = false;
  private intervalMinutes: number;

  constructor() {
    const parsedMinutes = parseInt(process.env.NOTIFICATION_INTERVAL_MINUTES || '10', 10);
    this.intervalMinutes = isNaN(parsedMinutes) || parsedMinutes < 1 ? 10 : parsedMinutes;
  }

  /**
   * Starts periodic notification schedule evaluation in the background.
   */
  public start(): void {
    if (this.isRunning) {
      console.log('[NotificationScheduler] Notification scheduler is already running.');
      return;
    }

    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.isRunning = true;
    console.log(`[NotificationScheduler] Started notification scheduler (interval: ${this.intervalMinutes}m).`);

    // Initial evaluation after 5 seconds
    setTimeout(() => {
      this.runEvaluationCycle().catch((err) => {
        console.warn('[NotificationScheduler] Initial evaluation cycle notice:', err.message);
      });
    }, 5000);

    const intervalMs = this.intervalMinutes * 60 * 1000;
    this.timer = setInterval(async () => {
      await this.runEvaluationCycle();
    }, intervalMs);
  }

  /**
   * Executes a complete notification evaluation cycle with concurrency mutex lock.
   */
  public async runEvaluationCycle(): Promise<NotificationEvaluationReport> {
    if (this.isEvaluating) {
      console.log('[NotificationScheduler] Evaluation already in progress. Skipping overlapping run.');
      return {
        durationMs: 0,
        usersEvaluated: 0,
        notificationsCreated: 0,
        staleSubscriptionsCleaned: 0,
        errorCount: 0,
      };
    }

    this.isEvaluating = true;
    const startTime = Date.now();
    let usersEvaluated = 0;
    let notificationsCreated = 0;
    let errorCount = 0;

    try {
      // 1. Get active users with push subscriptions or customized preferences
      const userIds = await this.getActiveUserIds();

      // 2. Evaluate schedules per user
      for (const userId of userIds) {
        try {
          usersEvaluated++;
          const notifs = await NotificationService.evaluateUserSchedules(userId);
          notificationsCreated += notifs.length;
        } catch (err: any) {
          errorCount++;
          console.warn(`[NotificationScheduler] User ${userId} evaluation error:`, err.message);
        }
      }

      // 3. Clean up stale revoked subscriptions
      const cleaned = await NotificationRepository.cleanStaleSubscriptions(60);

      const durationMs = Date.now() - startTime;
      return {
        durationMs,
        usersEvaluated,
        notificationsCreated,
        staleSubscriptionsCleaned: cleaned,
        errorCount,
      };
    } finally {
      this.isEvaluating = false;
    }
  }

  /**
   * Helper to retrieve distinct active user IDs to evaluate.
   */
  private async getActiveUserIds(): Promise<string[]> {
    const userIdsSet = new Set<string>();

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT DISTINCT user_id FROM public.push_subscriptions WHERE revoked_at IS NULL
          UNION
          SELECT DISTINCT user_id FROM public.notification_preferences WHERE enabled = true;
        `;
        const rows = await query(sql);
        rows.forEach((r) => {
          if (r.user_id) userIdsSet.add(r.user_id);
        });
      } catch (err: any) {
        console.warn('[NotificationScheduler] getActiveUserIds DB fallback:', err.message);
      }
    }

    return Array.from(userIdsSet);
  }

  /**
   * Stops the notification scheduler gracefully.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[NotificationScheduler] Notification scheduler stopped.');
  }
}

export const notificationScheduler = new NotificationScheduler();
