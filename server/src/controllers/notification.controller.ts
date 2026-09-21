import { Request, Response } from 'express';
import { WebPushService } from '../services/notification/webPush.service.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { NotificationService } from '../services/notification/notification.service.js';
import { notificationScheduler } from '../services/notification/notificationScheduler.js';
import {
  subscribePushSchema,
  unsubscribePushSchema,
  updateNotificationPreferencesSchema,
  notificationQuerySchema,
  notificationIdParamSchema,
  sendTestNotificationSchema,
} from '../validators/notification.validator.js';

export class NotificationController {
  /**
   * GET /api/notifications/vapid-public-key
   * Returns the server's VAPID public key.
   */
  public static getVapidPublicKey(req: Request, res: Response): void {
    const publicKey = WebPushService.getVapidPublicKey();
    res.json({
      publicKey,
      status: 'ready',
    });
  }

  /**
   * POST /api/notifications/push/subscribe
   * Registers or updates a device Web Push subscription for the authenticated user.
   */
  public static async subscribePush(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const parseResult = subscribePushSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
      return;
    }

    const subscription = await NotificationRepository.createOrUpdateSubscription(
      userId,
      parseResult.data
    );

    res.status(201).json({
      message: 'Push subscription registered successfully',
      subscription,
    });
  }

  /**
   * DELETE /api/notifications/push/subscribe
   * Revokes an existing push subscription.
   */
  public static async unsubscribePush(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const parseResult = unsubscribePushSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
      return;
    }

    await NotificationRepository.revokeSubscription(userId, parseResult.data.endpoint);

    res.json({
      success: true,
      message: 'Push subscription revoked successfully',
    });
  }

  /**
   * GET /api/notifications/preferences
   * Fetches notification preferences for the authenticated user.
   */
  public static async getPreferences(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const preferences = await NotificationRepository.getPreferences(userId);
    res.json(preferences);
  }

  /**
   * PUT /api/notifications/preferences
   * Updates notification preferences for the authenticated user.
   */
  public static async updatePreferences(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const parseResult = updateNotificationPreferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
      return;
    }

    const updated = await NotificationRepository.upsertPreferences(userId, parseResult.data);
    res.json({
      message: 'Preferences updated successfully',
      preferences: updated,
    });
  }

  /**
   * GET /api/notifications
   * Retrieves paginated notification history for the authenticated user.
   */
  public static async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const parseResult = notificationQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
      return;
    }

    const result = await NotificationRepository.getNotificationHistory(userId, parseResult.data);
    res.json(result);
  }

  /**
   * GET /api/notifications/unread-count
   * Retrieves the number of unread notifications for the authenticated user.
   */
  public static async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const count = await NotificationRepository.getUnreadCount(userId);
    res.json({ unreadCount: count });
  }

  /**
   * POST /api/notifications/:id/read
   * Marks a single notification as read/opened.
   */
  public static async markAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const paramCheck = notificationIdParamSchema.safeParse(req.params);
    if (!paramCheck.success) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    const notif = await NotificationRepository.markAsRead(paramCheck.data.id, userId);
    if (!notif) {
      res.status(404).json({
        error: 'Not found',
        message: 'Notification not found or does not belong to the authenticated user',
      });
      return;
    }

    res.json({
      success: true,
      notification: notif,
    });
  }

  /**
   * POST /api/notifications/read-all
   * Marks all unread notifications for the user as read.
   */
  public static async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const updatedCount = await NotificationRepository.markAllAsRead(userId);
    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: updatedCount,
    });
  }

  /**
   * POST /api/notifications/test
   * Sends a test Web Push notification to the authenticated user's registered devices.
   */
  public static async sendTestNotification(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const parseResult = sendTestNotificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
      return;
    }

    const result = await NotificationService.sendTestNotification(userId, parseResult.data);
    res.json({
      success: true,
      message: 'Test notification dispatched',
      notification: result.notification,
      deliveriesCount: result.deliveriesCount,
    });
  }

  /**
   * POST /api/notifications/scheduler/run
   * Manually triggers a notification evaluation cycle (e.g. from a serverless cron job).
   */
  public static async triggerSchedulerRun(req: Request, res: Response): Promise<void> {
    const report = await notificationScheduler.runEvaluationCycle();
    res.json({
      success: true,
      message: 'Notification evaluation cycle completed',
      report,
    });
  }
}
