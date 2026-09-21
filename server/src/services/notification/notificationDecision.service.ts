import {
  NotificationCandidate,
  NotificationDecisionResult,
  NotificationPreference,
  NotificationType,
  NotificationPriority,
  CanonicalEvent,
  Storyline,
  StorylineTurningPoint,
  ExtractedConcept,
} from '../../types/index.js';
import { NotificationRepository } from '../../repositories/notification.repository.js';

export class NotificationDecisionService {
  /**
   * Main Decision Engine method:
   * Evaluates if a candidate notification should be dispatched to the given user right now.
   */
  public static async evaluateCandidate(
    userPreference: NotificationPreference,
    candidate: NotificationCandidate,
    options: { checkDedupe?: boolean; checkDailyCap?: boolean } = {}
  ): Promise<NotificationDecisionResult> {
    const { checkDedupe = true, checkDailyCap = true } = options;

    // 1. Global User Notification Enabled Check
    if (!userPreference.enabled) {
      return {
        shouldNotify: false,
        rejectionReason: 'USER_DISABLED',
        details: { message: 'User has globally disabled notifications' },
      };
    }

    // 2. Notification Type Preference Check
    if (!this.isTypeEnabled(userPreference, candidate.notificationType)) {
      return {
        shouldNotify: false,
        rejectionReason: 'TYPE_DISABLED',
        details: { notificationType: candidate.notificationType },
      };
    }

    // 3. Minimum Importance Score Check (for news/storyline events)
    if (typeof candidate.importanceScore === 'number') {
      if (candidate.importanceScore < userPreference.minimumImportance) {
        return {
          shouldNotify: false,
          rejectionReason: 'LOW_IMPORTANCE',
          details: {
            eventImportance: candidate.importanceScore,
            minimumRequired: userPreference.minimumImportance,
          },
        };
      }
    }

    // 4. Evidence Completeness & Conflict Check (Phase 10 Epistemic Grounding)
    if (typeof candidate.evidenceScore === 'number') {
      if (candidate.evidenceScore < userPreference.minimumEvidence) {
        return {
          shouldNotify: false,
          rejectionReason: 'INSUFFICIENT_EVIDENCE',
          details: {
            evidenceScore: candidate.evidenceScore,
            minimumRequired: userPreference.minimumEvidence,
          },
        };
      }
    }

    if (candidate.hasConflicts) {
      return {
        shouldNotify: false,
        rejectionReason: 'EVIDENCE_CONFLICT',
        details: { message: 'Unresolved evidence conflicts prevent push dispatch' },
      };
    }

    // 5. Timezone-Aware Quiet Hours Check (with midnight wrap-around)
    const isInQuiet = this.isTimeInQuietHours(
      userPreference.quietHoursStart,
      userPreference.quietHoursEnd,
      userPreference.timezone
    );

    if (isInQuiet && !candidate.isBypassQuietHours && candidate.priority !== 'CRITICAL') {
      return {
        shouldNotify: false,
        rejectionReason: 'QUIET_HOURS',
        details: {
          quietHoursStart: userPreference.quietHoursStart,
          quietHoursEnd: userPreference.quietHoursEnd,
          timezone: userPreference.timezone,
        },
      };
    }

    // 6. Daily Notification Rate-Limiting Cap Check
    if (checkDailyCap) {
      const sentToday = await NotificationRepository.countNotificationsToday(userPreference.userId);
      if (sentToday >= userPreference.maximumDailyNotifications) {
        return {
          shouldNotify: false,
          rejectionReason: 'DAILY_CAP_EXCEEDED',
          details: {
            sentToday,
            maximumDaily: userPreference.maximumDailyNotifications,
          },
        };
      }
    }

    // 7. Deterministic Deduplication Check
    if (checkDedupe) {
      const existing = await NotificationRepository.getNotificationByDedupeKey(
        userPreference.userId,
        candidate.dedupeKey
      );
      if (existing) {
        return {
          shouldNotify: false,
          rejectionReason: 'DUPLICATE_DEDUPE_KEY',
          details: { dedupeKey: candidate.dedupeKey, existingId: existing.id },
        };
      }
    }

    // All conditions satisfied: Eligible for push delivery
    return {
      shouldNotify: true,
      candidate,
    };
  }

  /**
   * Evaluates if a given time falls within the configured quiet hours.
   * Handles midnight wrap-around (e.g. 22:30 -> 07:00).
   */
  public static isTimeInQuietHours(
    quietStart: string,
    quietEnd: string,
    timezone: string,
    referenceDate: Date = new Date()
  ): boolean {
    try {
      // Format current time in user's timezone as HH:MM
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(referenceDate);
      const hour = parts.find((p) => p.type === 'hour')?.value || '00';
      const minute = parts.find((p) => p.type === 'minute')?.value || '00';
      const currentTimeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

      return this.isTimeInRange(currentTimeStr, quietStart, quietEnd);
    } catch (err) {
      // Fallback to UTC if timezone parsing encounters issues
      const h = String(referenceDate.getUTCHours()).padStart(2, '0');
      const m = String(referenceDate.getUTCMinutes()).padStart(2, '0');
      const utcTime = `${h}:${m}`;
      return this.isTimeInRange(utcTime, quietStart, quietEnd);
    }
  }

  /**
   * Helper to check if a "HH:MM" time falls between start and end (with midnight wrap-around)
   */
  public static isTimeInRange(current: string, start: string, end: string): boolean {
    if (start === end) {
      return false; // zero duration quiet hours
    }

    if (start < end) {
      // Standard daytime/evening range e.g. "01:00" to "06:00"
      return current >= start && current < end;
    } else {
      // Midnight crossing range e.g. "22:30" to "07:00"
      return current >= start || current < end;
    }
  }

  /**
   * Checks if user has enabled the specific notification type
   */
  public static isTypeEnabled(pref: NotificationPreference, type: NotificationType): boolean {
    switch (type) {
      case 'BREAKING_NEWS':
        return pref.breakingEnabled !== false;
      case 'MAJOR_UPDATE':
        return pref.majorUpdateEnabled !== false;
      case 'STORYLINE_UPDATE':
        return pref.storylineEnabled !== false;
      case 'STUDY_REMINDER':
        return pref.studyEnabled !== false;
      case 'REVIEW_DUE':
        return pref.reviewEnabled !== false;
      case 'KNOWLEDGE_GAP':
        return pref.knowledgeGapEnabled !== false;
      case 'DAILY_GOAL':
        return pref.dailyGoalEnabled !== false;
      case 'DAILY_BRIEFING':
        return pref.dailyBriefingEnabled !== false;
      default:
        return true;
    }
  }

  // =========================================================================
  // CANDIDATE BUILDERS
  // =========================================================================

  public static buildBreakingCandidate(
    userId: string,
    event: { id: string; title: string; summary?: string; importanceScore?: number },
    evidence?: { completenessScore?: number; hasConflicts?: boolean }
  ): NotificationCandidate {
    return {
      userId,
      notificationType: 'BREAKING_NEWS',
      title: 'AKIRA • Breaking Update',
      body: event.title,
      url: `/event/${event.id}`,
      eventId: event.id,
      dedupeKey: `breaking:${event.id}`,
      priority: 'CRITICAL',
      importanceScore: event.importanceScore ?? 85,
      evidenceScore: evidence?.completenessScore ?? 80,
      hasConflicts: evidence?.hasConflicts ?? false,
    };
  }

  public static buildMajorUpdateCandidate(
    userId: string,
    event: { id: string; title: string; summary?: string; importanceScore?: number },
    turningPoint?: { title: string; reason?: string },
    storyline?: { id: string; title: string },
    evidence?: { completenessScore?: number; hasConflicts?: boolean }
  ): NotificationCandidate {
    const bodyText = turningPoint
      ? `${turningPoint.title}: ${event.title}`
      : event.title;

    return {
      userId,
      notificationType: 'MAJOR_UPDATE',
      title: storyline ? `AKIRA • ${storyline.title}` : 'AKIRA • Major Update',
      body: bodyText,
      url: storyline ? `/storyline/${storyline.id}` : `/event/${event.id}`,
      eventId: event.id,
      storylineId: storyline?.id,
      dedupeKey: storyline ? `major:${storyline.id}:${event.id}` : `major:${event.id}`,
      priority: 'HIGH',
      importanceScore: event.importanceScore ?? 75,
      evidenceScore: evidence?.completenessScore ?? 75,
      hasConflicts: evidence?.hasConflicts ?? false,
    };
  }

  public static buildStorylineCandidate(
    userId: string,
    storyline: { id: string; title: string; trajectory?: string },
    latestEvent: { id: string; title: string; importanceScore?: number }
  ): NotificationCandidate {
    return {
      userId,
      notificationType: 'STORYLINE_UPDATE',
      title: 'AKIRA • Storyline Update',
      body: `${storyline.title}: New development recorded.`,
      url: `/storyline/${storyline.id}`,
      eventId: latestEvent.id,
      storylineId: storyline.id,
      dedupeKey: `storyline:${storyline.id}:${latestEvent.id}`,
      priority: 'NORMAL',
      importanceScore: latestEvent.importanceScore ?? 70,
      evidenceScore: 70,
    };
  }

  public static buildStudyReminderCandidate(
    userId: string,
    dateStr: string,
    pendingItemsCount = 1
  ): NotificationCandidate {
    return {
      userId,
      notificationType: 'STUDY_REMINDER',
      title: 'AKIRA • Study Time',
      body: `Your daily learning session is ready with ${pendingItemsCount} topic${pendingItemsCount > 1 ? 's' : ''} to explore.`,
      url: '/learn',
      dedupeKey: `study:${userId}:${dateStr}`,
      priority: 'NORMAL',
    };
  }

  public static buildReviewDueCandidate(
    userId: string,
    dateStr: string,
    dueCount: number
  ): NotificationCandidate {
    return {
      userId,
      notificationType: 'REVIEW_DUE',
      title: 'AKIRA • Spaced Repetition Due',
      body: `You have ${dueCount} concept${dueCount > 1 ? 's' : ''} due for SM-2 mastery review today.`,
      url: '/learn',
      dedupeKey: `review:${userId}:${dateStr}`,
      priority: 'NORMAL',
    };
  }

  public static buildKnowledgeGapCandidate(
    userId: string,
    concept: { id: string; title: string; masteryScore?: number },
    dateStr: string
  ): NotificationCandidate {
    return {
      userId,
      notificationType: 'KNOWLEDGE_GAP',
      title: 'AKIRA • Knowledge Gap',
      body: `Strengthen your grasp on "${concept.title}" to stay ahead of upcoming developments.`,
      url: `/concept/${concept.id}`,
      conceptId: concept.id,
      dedupeKey: `gap:${userId}:${concept.id}:${dateStr}`,
      priority: 'LOW',
    };
  }

  public static buildDailyBriefingCandidate(
    userId: string,
    dateStr: string,
    itemCount = 5
  ): NotificationCandidate {
    return {
      userId,
      notificationType: 'DAILY_BRIEFING',
      title: 'AKIRA • Daily Briefing',
      body: `Your morning intelligence summary is ready with ${itemCount} top developments.`,
      url: '/daily-brief',
      dedupeKey: `briefing:${userId}:${dateStr}`,
      priority: 'NORMAL',
    };
  }
}
