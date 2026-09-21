import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Zap,
  TrendingUp,
  GitBranch,
  BookOpen,
  Sun,
  Settings,
  Clock,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  Check,
  Loader2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import {
  AppNotification,
  NotificationPreference,
  NotificationType,
  PushPermissionState,
} from '../../types';

export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationsChanged?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNotificationsChanged,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'alerts' | 'preferences'>('alerts');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [permissionState, setPermissionState] = useState<PushPermissionState>('default');
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadPreferences();
      setPermissionState(notificationService.getPermissionState());
    }
  }, [isOpen, user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await notificationService.getNotifications({ limit: 30 });
      setNotifications(res.notifications || []);
      const unread = await notificationService.getUnreadCount();
      setUnreadCount(unread);
      onNotificationsChanged?.();
    } catch (err) {
      console.warn('[NotificationsModal] loadNotifications error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreferences = async () => {
    if (!user) return;
    try {
      const pref = await notificationService.getPreferences();
      setPreferences(pref);
    } catch (err) {
      console.warn('[NotificationsModal] loadPreferences error:', err);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.openedAt) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, openedAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        onNotificationsChanged?.();
      } catch (e) {
        // ignore
      }
    }

    onClose();
    if (notif.url) {
      navigate(notif.url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, openedAt: n.openedAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
      onNotificationsChanged?.();
    } catch (err) {
      console.warn('[NotificationsModal] markAllRead error:', err);
    }
  };

  const handleTogglePush = async () => {
    setIsSubscribing(true);
    setTestStatus(null);
    try {
      if (permissionState === 'granted') {
        await notificationService.unsubscribeFromPush();
        setPermissionState(notificationService.getPermissionState());
      } else {
        const result = await notificationService.subscribeToPush();
        setPermissionState(notificationService.getPermissionState());
        if (!result.success && result.error) {
          setTestStatus(result.error);
        }
      }
    } catch (err: any) {
      setTestStatus(err.message || 'Failed to update push status');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendTestPush = async () => {
    try {
      setTestStatus('Dispatching test push notification...');
      const res = await notificationService.sendTestNotification({
        title: 'AKIRA • Intelligence Test Alert',
        body: 'Real-time push intelligence notifications are active on your device.',
        url: '/',
      });
      setTestStatus(`Test dispatched! (${res.deliveriesCount || 1} device received)`);
      loadNotifications();
    } catch (err: any) {
      setTestStatus(err.message || 'Failed to dispatch test notification');
    }
  };

  const handleSavePreferences = async (updates: Partial<NotificationPreference>) => {
    if (!preferences) return;
    try {
      const updated = await notificationService.updatePreferences(updates);
      setPreferences(updated);
      setSaveStatus('Preferences saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err: any) {
      console.warn('[NotificationsModal] savePreferences error:', err);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const renderTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'BREAKING_NEWS':
        return (
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Zap className="w-4 h-4" />
          </div>
        );
      case 'MAJOR_UPDATE':
        return (
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        );
      case 'STORYLINE_UPDATE':
        return (
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <GitBranch className="w-4 h-4" />
          </div>
        );
      case 'STUDY_REMINDER':
      case 'REVIEW_DUE':
      case 'KNOWLEDGE_GAP':
      case 'DAILY_GOAL':
        return (
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
        );
      case 'DAILY_BRIEFING':
      default:
        return (
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Sun className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-lg">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <span>Notifications & Intelligence</span>
            {unreadCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
      }
      description="Proactive real-world intelligence updates, SM-2 review reminders, and daily briefing alerts."
      size="md"
    >
      <div className="space-y-4 pt-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'alerts'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts Feed</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'preferences'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Notification Settings</span>
          </button>
        </div>

        {/* TAB 1: ALERTS FEED */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Recent Intelligence Updates</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                  <span className="text-xs">Loading intelligence alerts...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center">
                    <CheckCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      You're all caught up.
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed max-w-xs">
                      No unread alerts right now. When major developing stories or scheduled learning times arrive, they will appear here and on your mobile lock screen.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isUnread = !notif.openedAt;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isUnread
                          ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800/40 hover:border-cyan-400'
                          : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                    >
                      {renderTypeIcon(notif.notificationType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-xs truncate ${
                              isUnread
                                ? 'font-bold text-slate-900 dark:text-white'
                                : 'font-medium text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.body}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-cyan-500 self-center mt-1" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PREFERENCES & SETTINGS */}
        {activeTab === 'preferences' && preferences && (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {/* Push Status Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Device Web Push Status
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    permissionState === 'granted'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                      : permissionState === 'denied'
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                  }`}
                >
                  {permissionState === 'granted'
                    ? 'Active'
                    : permissionState === 'denied'
                    ? 'Blocked'
                    : 'Permission Required'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Receive proactive lock-screen alerts for critical news developments and scheduled study sessions even when AKIRA is closed.
              </p>

              {permissionState === 'denied' && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Push permission is blocked in your browser settings. To enable alerts, open browser site settings and change Notifications to "Allow".
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant={permissionState === 'granted' ? 'outline' : 'primary'}
                  onClick={handleTogglePush}
                  disabled={isSubscribing}
                  className="text-xs"
                >
                  {isSubscribing
                    ? 'Connecting...'
                    : permissionState === 'granted'
                    ? 'Disconnect Device Push'
                    : 'Enable Push Notifications'}
                </Button>

                {permissionState === 'granted' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSendTestPush}
                    className="text-xs text-slate-600 dark:text-slate-300"
                  >
                    Send Test Alert
                  </Button>
                )}
              </div>

              {testStatus && (
                <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium pt-1">
                  {testStatus}
                </div>
              )}
            </div>

            {/* Notification Types Toggles */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Notification Channels
              </h4>

              <div className="space-y-1.5">
                {[
                  {
                    key: 'breakingEnabled',
                    label: 'Breaking Real-World News',
                    desc: 'High importance and high trend velocity alerts',
                  },
                  {
                    key: 'majorUpdateEnabled',
                    label: 'Major Storyline Developments',
                    desc: 'Official decisions, policy shifts, and milestones',
                  },
                  {
                    key: 'studyEnabled',
                    label: 'Scheduled Study Reminders',
                    desc: 'Daily prompt when your custom study session is ready',
                  },
                  {
                    key: 'reviewEnabled',
                    label: 'Spaced Repetition (SM-2) Reviews',
                    desc: 'Reminds you when concept retention reviews are due',
                  },
                  {
                    key: 'dailyBriefingEnabled',
                    label: 'Morning Daily Briefing',
                    desc: 'Top 5-10 curated regional and world updates',
                  },
                  {
                    key: 'knowledgeGapEnabled',
                    label: 'Knowledge Gap Recommendations',
                    desc: 'Concept mastery opportunities related to your interests',
                  },
                ].map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="pr-3">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {desc}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(preferences as any)[key] !== false}
                      onChange={(e) =>
                        handleSavePreferences({ [key]: e.target.checked } as any)
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule & Quiet Hours */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Schedule & Quiet Hours
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Study Reminder Time
                  </label>
                  <input
                    type="time"
                    value={preferences.studyTime || '19:00'}
                    onChange={(e) => handleSavePreferences({ studyTime: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Daily Briefing Time
                  </label>
                  <input
                    type="time"
                    value={preferences.dailyBriefingTime || '08:00'}
                    onChange={(e) => handleSavePreferences({ dailyBriefingTime: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Quiet Hours (Mute Non-Critical Alerts)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">From</span>
                    <input
                      type="time"
                      value={preferences.quietHoursStart || '22:30'}
                      onChange={(e) =>
                        handleSavePreferences({ quietHoursStart: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-medium mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Until</span>
                    <input
                      type="time"
                      value={preferences.quietHoursEnd || '07:00'}
                      onChange={(e) =>
                        handleSavePreferences({ quietHoursEnd: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-medium mt-0.5"
                    />
                  </div>
                </div>
              </div>

              {saveStatus && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>{saveStatus}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10 px-1">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Epistemic Grounding Engine: Active</span>
          </span>
          <Button variant="ghost" size="xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
