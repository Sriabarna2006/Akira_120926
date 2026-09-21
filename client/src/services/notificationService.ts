import { apiClient } from './api';
import {
  AppNotification,
  NotificationPreference,
  NotificationType,
  PushPermissionState,
} from '../types';

/**
 * Utility to convert VAPID base64 string to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const notificationService = {
  /**
   * Checks whether the current browser environment supports Service Workers and Web Push.
   */
  isPushSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  /**
   * Returns current notification permission state.
   */
  getPermissionState(): PushPermissionState {
    if (!this.isPushSupported()) {
      return 'unsupported';
    }
    return Notification.permission as PushPermissionState;
  },

  /**
   * Registers the PWA service worker (/sw.js)
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isPushSupported()) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      return registration;
    } catch (err: any) {
      console.warn('[PWA] Service Worker registration failed:', err.message);
      return null;
    }
  },

  /**
   * Fetches VAPID public key from backend API.
   */
  async getVapidPublicKey(): Promise<string> {
    const res = await apiClient.get('/notifications/vapid-public-key');
    return res.data.publicKey;
  },

  /**
   * Requests browser notification permission and registers push subscription on backend.
   */
  async subscribeToPush(): Promise<{ success: boolean; error?: string }> {
    if (!this.isPushSupported()) {
      return {
        success: false,
        error: 'Push notifications are not supported on this browser or device.',
      };
    }

    try {
      // 1. Explicitly request browser permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          error: permission === 'denied'
            ? 'Notification permissions are blocked. Please enable notifications in your browser site settings.'
            : 'Notification permission was not granted.',
        };
      }

      // 2. Ensure Service Worker is active
      let registration = await navigator.serviceWorker.ready;
      if (!registration) {
        registration = (await this.registerServiceWorker())!;
      }

      // 3. Get VAPID Key
      const publicKey = await this.getVapidPublicKey();
      if (!publicKey) {
        throw new Error('VAPID public key unavailable from server.');
      }

      // 4. Create PushSubscription
      const applicationServerKey = urlBase64ToUint8Array(publicKey) as unknown as BufferSource;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Incomplete subscription credentials returned by browser.');
      }

      // Determine platform
      const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const platform = isAndroid ? 'android' : isIOS ? 'ios' : isMobile ? 'mobile' : 'desktop';

      // 5. Send subscription to authenticated backend
      await apiClient.post('/notifications/push/subscribe', {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        deviceLabel: isMobile ? (isAndroid ? 'Android Device' : 'iOS Device') : 'Desktop Browser',
        platform,
        userAgent: navigator.userAgent,
      });

      return { success: true };
    } catch (err: any) {
      console.error('[notificationService] subscribeToPush error:', err);
      return {
        success: false,
        error: err.message || 'Failed to complete push subscription.',
      };
    }
  },

  /**
   * Unsubscribes current device from Web Push and notifies backend.
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.isPushSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Notify backend of revocation
        try {
          await apiClient.delete('/notifications/push/subscribe', { data: { endpoint } });
        } catch (e) {
          // ignore backend notification errors on teardown
        }
      }
      return true;
    } catch (err) {
      console.warn('[notificationService] unsubscribe error:', err);
      return false;
    }
  },

  /**
   * Fetches user notification preferences.
   */
  async getPreferences(): Promise<NotificationPreference> {
    const res = await apiClient.get('/notifications/preferences');
    return res.data;
  },

  /**
   * Updates user notification preferences.
   */
  async updatePreferences(updates: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const res = await apiClient.put('/notifications/preferences', updates);
    return res.data.preferences;
  },

  /**
   * Fetches paginated notification history.
   */
  async getNotifications(options: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    unreadOnly?: boolean;
  } = {}): Promise<{ notifications: AppNotification[]; total: number; page: number; limit: number }> {
    const res = await apiClient.get('/notifications', { params: options });
    return res.data;
  },

  /**
   * Gets unread notifications count.
   */
  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data.unreadCount || 0;
  },

  /**
   * Marks a notification as read.
   */
  async markAsRead(id: string): Promise<AppNotification> {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data.notification;
  },

  /**
   * Marks all notifications as read.
   */
  async markAllAsRead(): Promise<number> {
    const res = await apiClient.post('/notifications/read-all');
    return res.data.count || 0;
  },

  /**
   * Sends a test notification to verify device setup.
   */
  async sendTestNotification(params: {
    notificationType?: NotificationType;
    title?: string;
    body?: string;
    url?: string;
  } = {}): Promise<any> {
    const res = await apiClient.post('/notifications/test', params);
    return res.data;
  },
};

