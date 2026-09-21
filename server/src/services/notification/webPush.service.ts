import webPush from 'web-push';
import { PushSubscriptionRecord } from '../../types/index.js';
import { NotificationRepository } from '../../repositories/notification.repository.js';

export interface WebPushPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
  tag?: string;
  timestamp?: number;
  data?: Record<string, any>;
}

export class WebPushService {
  private static vapidPublicKey: string = '';
  private static vapidPrivateKey: string = '';
  private static vapidSubject: string = 'mailto:support@akira.ai';
  private static isInitialized = false;

  /**
   * Initializes VAPID credentials from environment variables or creates dev ephemeral keys.
   */
  public static initialize(): void {
    if (this.isInitialized) return;

    const envPub = process.env.VAPID_PUBLIC_KEY;
    const envPriv = process.env.VAPID_PRIVATE_KEY;
    const envSubject = process.env.VAPID_SUBJECT;

    if (envPub && envPriv) {
      this.vapidPublicKey = envPub;
      this.vapidPrivateKey = envPriv;
      this.vapidSubject = envSubject || 'mailto:support@akira.ai';
    } else {
      // Auto-generate dev keys for smooth offline / zero-config local testing
      const generated = webPush.generateVAPIDKeys();
      this.vapidPublicKey = generated.publicKey;
      this.vapidPrivateKey = generated.privateKey;
      this.vapidSubject = 'mailto:dev@akira.local';
    }

    try {
      webPush.setVapidDetails(this.vapidSubject, this.vapidPublicKey, this.vapidPrivateKey);
      this.isInitialized = true;
    } catch (err: any) {
      console.warn('[WebPushService] VAPID details registration warning:', err.message);
    }
  }

  /**
   * Returns the VAPID public key to send to browsers for Web Push subscriptions.
   */
  public static getVapidPublicKey(): string {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.vapidPublicKey;
  }

  /**
   * Dispatches a Web Push payload to an active device subscription.
   */
  public static async sendPush(
    subscription: PushSubscriptionRecord,
    payload: WebPushPayload
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    if (!this.isInitialized) {
      this.initialize();
    }

    // Handle mock endpoints for testing / CI
    if (
      subscription.endpoint.includes('mock.push.test') ||
      subscription.endpoint.includes('mock-endpoint') ||
      process.env.NODE_ENV === 'test'
    ) {
      if (subscription.endpoint.includes('expired') || subscription.endpoint.includes('invalid')) {
        await NotificationRepository.revokeSubscriptionByEndpoint(subscription.endpoint);
        return { success: false, statusCode: 410, error: 'Subscription has expired or is unsubscribed' };
      }
      return { success: true, statusCode: 201 };
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const notificationData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.svg',
      badge: payload.badge || '/favicon.svg',
      tag: payload.tag || 'akira-intelligence',
      timestamp: payload.timestamp || Date.now(),
      data: {
        url: payload.url,
        ...(payload.data || {}),
      },
    });

    try {
      const response = await webPush.sendNotification(pushSubscription, notificationData, {
        TTL: 60 * 60 * 24, // 24 hours
        urgency: 'high',
      });

      return {
        success: true,
        statusCode: response.statusCode,
      };
    } catch (err: any) {
      const statusCode = err.statusCode || 500;

      // RFC 8291 / 8292: 404 Not Found or 410 Gone indicates expired/revoked device subscription
      if (statusCode === 404 || statusCode === 410) {
        console.info(`[WebPushService] Device endpoint revoked (${statusCode}): ${subscription.endpoint.substring(0, 40)}...`);
        await NotificationRepository.revokeSubscriptionByEndpoint(subscription.endpoint);
      }

      return {
        success: false,
        statusCode,
        error: err.message || 'Failed to dispatch web push',
      };
    }
  }
}
