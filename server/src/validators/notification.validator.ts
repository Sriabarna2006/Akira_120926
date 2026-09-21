import { z } from 'zod';

export const subscribePushSchema = z.object({
  endpoint: z.string().url('A valid push service URL is required'),
  keys: z.object({
    p256dh: z.string().min(10, 'p256dh key is required'),
    auth: z.string().min(6, 'auth secret is required'),
  }),
  deviceLabel: z.string().max(100).optional().default('Browser'),
  platform: z.enum(['android', 'ios', 'desktop', 'mobile', 'browser', 'other']).optional().default('desktop'),
  userAgent: z.string().max(500).optional(),
});

export const unsubscribePushSchema = z.object({
  endpoint: z.string().url('A valid subscription endpoint is required'),
});

const timeStringRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const updateNotificationPreferencesSchema = z.object({
  enabled: z.boolean().optional(),
  breakingEnabled: z.boolean().optional(),
  majorUpdateEnabled: z.boolean().optional(),
  storylineEnabled: z.boolean().optional(),
  studyEnabled: z.boolean().optional(),
  reviewEnabled: z.boolean().optional(),
  dailyBriefingEnabled: z.boolean().optional(),
  knowledgeGapEnabled: z.boolean().optional(),
  dailyGoalEnabled: z.boolean().optional(),
  studyTime: z
    .string()
    .regex(timeStringRegex, 'studyTime must be in HH:MM format (00:00 to 23:59)')
    .optional(),
  dailyBriefingTime: z
    .string()
    .regex(timeStringRegex, 'dailyBriefingTime must be in HH:MM format (00:00 to 23:59)')
    .optional(),
  quietHoursStart: z
    .string()
    .regex(timeStringRegex, 'quietHoursStart must be in HH:MM format (00:00 to 23:59)')
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(timeStringRegex, 'quietHoursEnd must be in HH:MM format (00:00 to 23:59)')
    .optional(),
  timezone: z
    .string()
    .min(1, 'Timezone cannot be empty')
    .max(100)
    .refine((tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch (e) {
        return false;
      }
    }, { message: 'Invalid IANA timezone identifier' })
    .optional(),
  minimumImportance: z.number().int().min(0).max(100).optional(),
  minimumEvidence: z.number().int().min(0).max(100).optional(),
  maximumDailyNotifications: z.number().int().min(1).max(50).optional(),
});

export const notificationQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Math.max(1, Number(val)) : 1)),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, Number(val))) : 20)),
  type: z
    .enum([
      'BREAKING_NEWS',
      'MAJOR_UPDATE',
      'STORYLINE_UPDATE',
      'STUDY_REMINDER',
      'REVIEW_DUE',
      'KNOWLEDGE_GAP',
      'DAILY_GOAL',
      'DAILY_BRIEFING',
    ])
    .optional(),
  unreadOnly: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => val === true || val === 'true'),
});

export const notificationIdParamSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
});

export const sendTestNotificationSchema = z.object({
  notificationType: z
    .enum([
      'BREAKING_NEWS',
      'MAJOR_UPDATE',
      'STORYLINE_UPDATE',
      'STUDY_REMINDER',
      'REVIEW_DUE',
      'KNOWLEDGE_GAP',
      'DAILY_GOAL',
      'DAILY_BRIEFING',
    ])
    .optional()
    .default('BREAKING_NEWS'),
  title: z.string().min(3).max(150).optional(),
  body: z.string().min(3).max(500).optional(),
  url: z.string().min(1).max(300).optional().default('/'),
});
