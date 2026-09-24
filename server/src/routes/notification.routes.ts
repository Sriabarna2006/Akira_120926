import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { requireAuth, requireInternalSecret } from '../middleware/auth.middleware.js';

const router = Router();

// 🔑 Public/General: Get VAPID Public Key for Web Push registration
router.get('/vapid-public-key', NotificationController.getVapidPublicKey);

// 📱 Push Subscription Management (authenticated user)
router.post('/push/subscribe', requireAuth, NotificationController.subscribePush);
router.delete('/push/subscribe', requireAuth, NotificationController.unsubscribePush);

// ⚙️ User Notification Preferences
router.get('/preferences', requireAuth, NotificationController.getPreferences);
router.put('/preferences', requireAuth, NotificationController.updatePreferences);

// 🔔 Notification History & Actions
router.get('/unread-count', requireAuth, NotificationController.getUnreadCount);
router.get('/', requireAuth, NotificationController.getNotifications);
router.post('/read-all', requireAuth, NotificationController.markAllAsRead);
router.post('/:id/read', requireAuth, NotificationController.markAsRead);

// 🧪 Test Notification Dispatch (authenticated user)
router.post('/test', requireAuth, NotificationController.sendTestNotification);

// ⏰ Scheduler Cron Trigger (internal secret / cron protected - supports GET and POST)
router.get('/scheduler/run', requireInternalSecret, NotificationController.triggerSchedulerRun);
router.post('/scheduler/run', requireInternalSecret, NotificationController.triggerSchedulerRun);

export default router;
