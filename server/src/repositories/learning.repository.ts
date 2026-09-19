import crypto from 'crypto';
import {
  UserLearningProgress,
  UserReviewSchedule,
  QuizAttemptRecord,
  LearningActivityRecord,
  UserLearningPreferences,
  PreferredDifficulty,
  MasteryStatus,
  ReviewStatus,
  LearningActivityType,
} from '../types/index.js';
import { query, queryOne, isDatabaseConnected } from '../db/dbClient.js';

// In-Memory Fallback Stores
const inMemoryProgress = new Map<string, UserLearningProgress>(); // key: `${userId}:${eventId || ''}:${conceptId || ''}`
const inMemorySchedules = new Map<string, UserReviewSchedule>(); // key: `${userId}:${eventId || ''}:${conceptId || ''}`
const inMemoryAttempts: QuizAttemptRecord[] = [];
const inMemoryActivities: LearningActivityRecord[] = [];
const inMemoryPreferences = new Map<string, UserLearningPreferences>(); // key: userId

export class LearningRepository {
  private makeKey(userId: string, eventId?: string, conceptId?: string): string {
    return `${userId}:${eventId || ''}:${conceptId || ''}`;
  }

  // ============================================================================
  // 1. USER LEARNING PROGRESS
  // ============================================================================

  public async getProgress(
    userId: string,
    eventId?: string,
    conceptId?: string
  ): Promise<UserLearningProgress | null> {
    if (isDatabaseConnected()) {
      try {
        let sql = `
          SELECT 
            id,
            user_id as "userId",
            concept_id as "conceptId",
            event_id as "eventId",
            mastery_score as "masteryScore",
            mastery_status as "masteryStatus",
            attempt_count as "attemptCount",
            correct_count as "correctCount",
            incorrect_count as "incorrectCount",
            last_attempt_at as "lastAttemptAt",
            last_mastered_at as "lastMasteredAt",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.user_learning_progress
          WHERE user_id = $1
        `;
        const params: any[] = [userId];

        if (eventId && conceptId) {
          sql += ` AND event_id = $2 AND concept_id = $3`;
          params.push(eventId, conceptId);
        } else if (eventId) {
          sql += ` AND event_id = $2`;
          params.push(eventId);
        } else if (conceptId) {
          sql += ` AND concept_id = $2`;
          params.push(conceptId);
        }

        sql += ` LIMIT 1`;
        const row = await queryOne<any>(sql, params);
        if (row) {
          return {
            id: row.id,
            userId: row.userId,
            conceptId: row.conceptId || undefined,
            eventId: row.eventId || undefined,
            masteryScore: Number(row.masteryScore),
            masteryStatus: row.masteryStatus as MasteryStatus,
            attemptCount: Number(row.attemptCount),
            correctCount: Number(row.correctCount),
            incorrectCount: Number(row.incorrectCount),
            lastAttemptAt: row.lastAttemptAt?.toISOString?.() || row.lastAttemptAt,
            lastMasteredAt: row.lastMasteredAt?.toISOString?.() || row.lastMasteredAt,
            createdAt: row.createdAt?.toISOString?.() || row.createdAt,
            updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
          };
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB getProgress failed, fallback to memory:`, err.message);
      }
    }

    const key = this.makeKey(userId, eventId, conceptId);
    if (inMemoryProgress.has(key)) {
      return inMemoryProgress.get(key)!;
    }

    // Secondary scan in memory if eventId or conceptId was partially supplied
    for (const p of inMemoryProgress.values()) {
      if (p.userId === userId) {
        if (eventId && p.eventId === eventId) return p;
        if (conceptId && p.conceptId === conceptId) return p;
      }
    }

    return null;
  }

  public async getAllProgressForUser(userId: string): Promise<UserLearningProgress[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            user_id as "userId",
            concept_id as "conceptId",
            event_id as "eventId",
            mastery_score as "masteryScore",
            mastery_status as "masteryStatus",
            attempt_count as "attemptCount",
            correct_count as "correctCount",
            incorrect_count as "incorrectCount",
            last_attempt_at as "lastAttemptAt",
            last_mastered_at as "lastMasteredAt",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.user_learning_progress
          WHERE user_id = $1
          ORDER BY updated_at DESC
        `;
        const rows = await query<any>(sql, [userId]);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            userId: r.userId,
            conceptId: r.conceptId || undefined,
            eventId: r.eventId || undefined,
            masteryScore: Number(r.masteryScore),
            masteryStatus: r.masteryStatus as MasteryStatus,
            attemptCount: Number(r.attemptCount),
            correctCount: Number(r.correctCount),
            incorrectCount: Number(r.incorrectCount),
            lastAttemptAt: r.lastAttemptAt?.toISOString?.() || r.lastAttemptAt,
            lastMasteredAt: r.lastMasteredAt?.toISOString?.() || r.lastMasteredAt,
            createdAt: r.createdAt?.toISOString?.() || r.createdAt,
            updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
          }));
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB getAllProgress failed, fallback to memory:`, err.message);
      }
    }

    return Array.from(inMemoryProgress.values()).filter((p) => p.userId === userId);
  }

  public async saveProgress(
    progress: Omit<UserLearningProgress, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<UserLearningProgress> {
    const id = progress.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record: UserLearningProgress = {
      id,
      userId: progress.userId,
      conceptId: progress.conceptId,
      eventId: progress.eventId,
      masteryScore: progress.masteryScore,
      masteryStatus: progress.masteryStatus,
      attemptCount: progress.attemptCount,
      correctCount: progress.correctCount,
      incorrectCount: progress.incorrectCount,
      lastAttemptAt: progress.lastAttemptAt || now,
      lastMasteredAt: progress.lastMasteredAt,
      createdAt: now,
      updatedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        let existingId: string | null = progress.id || null;
        if (!existingId) {
          const findRow = await queryOne<{ id: string }>(
            `SELECT id FROM public.user_learning_progress WHERE user_id = $1 AND COALESCE(event_id, '') = COALESCE($2, '') AND COALESCE(concept_id, '') = COALESCE($3, '') LIMIT 1`,
            [progress.userId, progress.eventId || null, progress.conceptId || null]
          );
          if (findRow) existingId = findRow.id;
        }

        if (existingId) {
          const sql = `
            UPDATE public.user_learning_progress SET
              mastery_score = $1,
              mastery_status = $2,
              attempt_count = $3,
              correct_count = $4,
              incorrect_count = $5,
              last_attempt_at = $6,
              last_mastered_at = COALESCE($7, last_mastered_at),
              updated_at = $8
            WHERE id = $9
            RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
          `;
          const res = await queryOne<any>(sql, [
            progress.masteryScore,
            progress.masteryStatus,
            progress.attemptCount,
            progress.correctCount,
            progress.incorrectCount,
            progress.lastAttemptAt ? new Date(progress.lastAttemptAt) : new Date(now),
            progress.lastMasteredAt ? new Date(progress.lastMasteredAt) : null,
            new Date(now),
            existingId,
          ]);
          if (res) {
            record.id = res.id;
            record.createdAt = res.createdAt?.toISOString?.() || record.createdAt;
            record.updatedAt = res.updatedAt?.toISOString?.() || record.updatedAt;
          }
        } else {
          const sql = `
            INSERT INTO public.user_learning_progress (
              id, user_id, concept_id, event_id, mastery_score, mastery_status,
              attempt_count, correct_count, incorrect_count, last_attempt_at, last_mastered_at,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
          `;
          const res = await queryOne<any>(sql, [
            id,
            progress.userId,
            progress.conceptId || null,
            progress.eventId || null,
            progress.masteryScore,
            progress.masteryStatus,
            progress.attemptCount,
            progress.correctCount,
            progress.incorrectCount,
            progress.lastAttemptAt ? new Date(progress.lastAttemptAt) : new Date(now),
            progress.lastMasteredAt ? new Date(progress.lastMasteredAt) : null,
            new Date(now),
            new Date(now),
          ]);
          if (res) {
            record.id = res.id;
            record.createdAt = res.createdAt?.toISOString?.() || record.createdAt;
            record.updatedAt = res.updatedAt?.toISOString?.() || record.updatedAt;
          }
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB saveProgress failed, saving to memory:`, err.message);
      }
    }

    const key = this.makeKey(progress.userId, progress.eventId, progress.conceptId);
    inMemoryProgress.set(key, record);
    return record;
  }

  // ============================================================================
  // 2. USER REVIEW SCHEDULES (SM-2)
  // ============================================================================

  public async getSchedule(
    userId: string,
    eventId?: string,
    conceptId?: string
  ): Promise<UserReviewSchedule | null> {
    if (isDatabaseConnected()) {
      try {
        let sql = `
          SELECT 
            id,
            user_id as "userId",
            concept_id as "conceptId",
            event_id as "eventId",
            ease_factor as "easeFactor",
            interval_days as "intervalDays",
            repetition_count as "repetitionCount",
            last_reviewed_at as "lastReviewedAt",
            next_review_at as "nextReviewAt",
            status,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.user_review_schedules
          WHERE user_id = $1
        `;
        const params: any[] = [userId];

        if (eventId && conceptId) {
          sql += ` AND event_id = $2 AND concept_id = $3`;
          params.push(eventId, conceptId);
        } else if (eventId) {
          sql += ` AND event_id = $2`;
          params.push(eventId);
        } else if (conceptId) {
          sql += ` AND concept_id = $2`;
          params.push(conceptId);
        }

        sql += ` LIMIT 1`;
        const row = await queryOne<any>(sql, params);
        if (row) {
          return {
            id: row.id,
            userId: row.userId,
            conceptId: row.conceptId || undefined,
            eventId: row.eventId || undefined,
            easeFactor: Number(row.easeFactor),
            intervalDays: Number(row.intervalDays),
            repetitionCount: Number(row.repetitionCount),
            lastReviewedAt: row.lastReviewedAt?.toISOString?.() || row.lastReviewedAt,
            nextReviewAt: row.nextReviewAt?.toISOString?.() || row.nextReviewAt,
            status: row.status as ReviewStatus,
            createdAt: row.createdAt?.toISOString?.() || row.createdAt,
            updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
          };
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB getSchedule failed, fallback to memory:`, err.message);
      }
    }

    const key = this.makeKey(userId, eventId, conceptId);
    if (inMemorySchedules.has(key)) {
      return inMemorySchedules.get(key)!;
    }

    for (const s of inMemorySchedules.values()) {
      if (s.userId === userId) {
        if (eventId && s.eventId === eventId) return s;
        if (conceptId && s.conceptId === conceptId) return s;
      }
    }

    return null;
  }

  public async getDueSchedules(userId: string, beforeDate: Date = new Date()): Promise<UserReviewSchedule[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            user_id as "userId",
            concept_id as "conceptId",
            event_id as "eventId",
            ease_factor as "easeFactor",
            interval_days as "intervalDays",
            repetition_count as "repetitionCount",
            last_reviewed_at as "lastReviewedAt",
            next_review_at as "nextReviewAt",
            status,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.user_review_schedules
          WHERE user_id = $1 AND next_review_at <= $2
          ORDER BY next_review_at ASC
        `;
        const rows = await query<any>(sql, [userId, beforeDate]);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            userId: r.userId,
            conceptId: r.conceptId || undefined,
            eventId: r.eventId || undefined,
            easeFactor: Number(r.easeFactor),
            intervalDays: Number(r.intervalDays),
            repetitionCount: Number(r.repetitionCount),
            lastReviewedAt: r.lastReviewedAt?.toISOString?.() || r.lastReviewedAt,
            nextReviewAt: r.nextReviewAt?.toISOString?.() || r.nextReviewAt,
            status: r.status as ReviewStatus,
            createdAt: r.createdAt?.toISOString?.() || r.createdAt,
            updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
          }));
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB getDueSchedules failed, fallback to memory:`, err.message);
      }
    }

    const threshold = beforeDate.getTime();
    return Array.from(inMemorySchedules.values())
      .filter((s) => s.userId === userId && new Date(s.nextReviewAt).getTime() <= threshold)
      .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
  }

  public async getAllSchedulesForUser(userId: string): Promise<UserReviewSchedule[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            user_id as "userId",
            concept_id as "conceptId",
            event_id as "eventId",
            ease_factor as "easeFactor",
            interval_days as "intervalDays",
            repetition_count as "repetitionCount",
            last_reviewed_at as "lastReviewedAt",
            next_review_at as "nextReviewAt",
            status,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.user_review_schedules
          WHERE user_id = $1
          ORDER BY next_review_at ASC
        `;
        const rows = await query<any>(sql, [userId]);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            userId: r.userId,
            conceptId: r.conceptId || undefined,
            eventId: r.eventId || undefined,
            easeFactor: Number(r.easeFactor),
            intervalDays: Number(r.intervalDays),
            repetitionCount: Number(r.repetitionCount),
            lastReviewedAt: r.lastReviewedAt?.toISOString?.() || r.lastReviewedAt,
            nextReviewAt: r.nextReviewAt?.toISOString?.() || r.nextReviewAt,
            status: r.status as ReviewStatus,
            createdAt: r.createdAt?.toISOString?.() || r.createdAt,
            updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
          }));
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB getAllSchedules failed, fallback to memory:`, err.message);
      }
    }

    return Array.from(inMemorySchedules.values()).filter((s) => s.userId === userId);
  }

  public async saveSchedule(
    schedule: Omit<UserReviewSchedule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<UserReviewSchedule> {
    const id = schedule.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record: UserReviewSchedule = {
      id,
      userId: schedule.userId,
      conceptId: schedule.conceptId,
      eventId: schedule.eventId,
      easeFactor: schedule.easeFactor,
      intervalDays: schedule.intervalDays,
      repetitionCount: schedule.repetitionCount,
      lastReviewedAt: schedule.lastReviewedAt,
      nextReviewAt: schedule.nextReviewAt,
      status: schedule.status,
      createdAt: now,
      updatedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        let existingId: string | null = schedule.id || null;
        if (!existingId) {
          const findRow = await queryOne<{ id: string }>(
            `SELECT id FROM public.user_review_schedules WHERE user_id = $1 AND COALESCE(event_id, '') = COALESCE($2, '') AND COALESCE(concept_id, '') = COALESCE($3, '') LIMIT 1`,
            [schedule.userId, schedule.eventId || null, schedule.conceptId || null]
          );
          if (findRow) existingId = findRow.id;
        }

        if (existingId) {
          const sql = `
            UPDATE public.user_review_schedules SET
              ease_factor = $1,
              interval_days = $2,
              repetition_count = $3,
              last_reviewed_at = $4,
              next_review_at = $5,
              status = $6,
              updated_at = $7
            WHERE id = $8
            RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
          `;
          const res = await queryOne<any>(sql, [
            schedule.easeFactor,
            schedule.intervalDays,
            schedule.repetitionCount,
            schedule.lastReviewedAt ? new Date(schedule.lastReviewedAt) : null,
            new Date(schedule.nextReviewAt),
            schedule.status,
            new Date(now),
            existingId,
          ]);
          if (res) {
            record.id = res.id;
            record.createdAt = res.createdAt?.toISOString?.() || record.createdAt;
            record.updatedAt = res.updatedAt?.toISOString?.() || record.updatedAt;
          }
        } else {
          const sql = `
            INSERT INTO public.user_review_schedules (
              id, user_id, concept_id, event_id, ease_factor, interval_days,
              repetition_count, last_reviewed_at, next_review_at, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
          `;
          const res = await queryOne<any>(sql, [
            id,
            schedule.userId,
            schedule.conceptId || null,
            schedule.eventId || null,
            schedule.easeFactor,
            schedule.intervalDays,
            schedule.repetitionCount,
            schedule.lastReviewedAt ? new Date(schedule.lastReviewedAt) : null,
            new Date(schedule.nextReviewAt),
            schedule.status,
            new Date(now),
            new Date(now),
          ]);
          if (res) {
            record.id = res.id;
            record.createdAt = res.createdAt?.toISOString?.() || record.createdAt;
            record.updatedAt = res.updatedAt?.toISOString?.() || record.updatedAt;
          }
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB saveSchedule failed, saving to memory:`, err.message);
      }
    }

    const key = this.makeKey(schedule.userId, schedule.eventId, schedule.conceptId);
    inMemorySchedules.set(key, record);
    return record;
  }

  // ============================================================================
  // 3. QUIZ ATTEMPT AUDIT LOG
  // ============================================================================

  public async saveAttempt(
    attempt: Omit<QuizAttemptRecord, 'id' | 'submittedAt'> & { id?: string; submittedAt?: string }
  ): Promise<QuizAttemptRecord> {
    const id = attempt.id || crypto.randomUUID();
    const now = attempt.submittedAt || new Date().toISOString();

    const record: QuizAttemptRecord = {
      id,
      userId: attempt.userId,
      eventId: attempt.eventId,
      conceptId: attempt.conceptId,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      accuracy: attempt.accuracy,
      scorePercentage: attempt.scorePercentage,
      masteryStatus: attempt.masteryStatus,
      answers: attempt.answers,
      submittedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.user_quiz_attempts (
            id, user_id, event_id, concept_id, score, total_questions,
            accuracy, score_percentage, mastery_status, answers, submitted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, submitted_at as "submittedAt"
        `;
        const res = await queryOne<any>(sql, [
          id,
          attempt.userId,
          attempt.eventId,
          attempt.conceptId || null,
          attempt.score,
          attempt.totalQuestions,
          attempt.accuracy,
          attempt.scorePercentage,
          attempt.masteryStatus,
          JSON.stringify(attempt.answers),
          new Date(now),
        ]);

        if (res) {
          record.id = res.id;
          record.submittedAt = res.submittedAt?.toISOString?.() || record.submittedAt;
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB saveAttempt failed, saving to memory:`, err.message);
      }
    }

    inMemoryAttempts.push(record);
    return record;
  }

  public async getAttemptsForUser(userId: string, limit: number = 50): Promise<QuizAttemptRecord[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            user_id as "userId",
            event_id as "eventId",
            concept_id as "conceptId",
            score,
            total_questions as "totalQuestions",
            accuracy,
            score_percentage as "scorePercentage",
            mastery_status as "masteryStatus",
            answers,
            submitted_at as "submittedAt"
          FROM public.user_quiz_attempts
          WHERE user_id = $1
          ORDER BY submitted_at DESC
          LIMIT $2
        `;
        const rows = await query<any>(sql, [userId, limit]);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            userId: r.userId,
            eventId: r.eventId,
            conceptId: r.conceptId || undefined,
            score: Number(r.score),
            totalQuestions: Number(r.totalQuestions),
            accuracy: Number(r.accuracy),
            scorePercentage: Number(r.scorePercentage),
            masteryStatus: r.masteryStatus as MasteryStatus,
            answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers || {},
            submittedAt: r.submittedAt?.toISOString?.() || r.submittedAt,
          }));
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB getAttempts failed, fallback to memory:`, err.message);
      }
    }

    return inMemoryAttempts
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, limit);
  }

  // ============================================================================
  // 4. USER LEARNING ACTIVITIES
  // ============================================================================

  public async saveActivity(
    activity: Omit<LearningActivityRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ): Promise<LearningActivityRecord> {
    const id = activity.id || crypto.randomUUID();
    const now = activity.createdAt || new Date().toISOString();

    const record: LearningActivityRecord = {
      id,
      userId: activity.userId,
      activityType: activity.activityType,
      eventId: activity.eventId,
      conceptId: activity.conceptId,
      metadata: activity.metadata || {},
      createdAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.user_learning_activities (
            id, user_id, activity_type, event_id, concept_id, metadata, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, created_at as "createdAt"
        `;
        const res = await queryOne<any>(sql, [
          id,
          activity.userId,
          activity.activityType,
          activity.eventId || null,
          activity.conceptId || null,
          JSON.stringify(activity.metadata || {}),
          new Date(now),
        ]);

        if (res) {
          record.id = res.id;
          record.createdAt = res.createdAt?.toISOString?.() || record.createdAt;
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB saveActivity failed, saving to memory:`, err.message);
      }
    }

    inMemoryActivities.push(record);
    return record;
  }

  public async getActivitiesForUser(userId: string, limit: number = 50): Promise<LearningActivityRecord[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            user_id as "userId",
            activity_type as "activityType",
            event_id as "eventId",
            concept_id as "conceptId",
            metadata,
            created_at as "createdAt"
          FROM public.user_learning_activities
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        `;
        const rows = await query<any>(sql, [userId, limit]);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            userId: r.userId,
            activityType: r.activityType as LearningActivityType,
            eventId: r.eventId || undefined,
            conceptId: r.conceptId || undefined,
            metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {},
            createdAt: r.createdAt?.toISOString?.() || r.createdAt,
          }));
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB getActivities failed, fallback to memory:`, err.message);
      }
    }

    return inMemoryActivities
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // ============================================================================
  // 5. USER LEARNING PREFERENCES
  // ============================================================================

  public async getPreferences(userId: string): Promise<UserLearningPreferences> {
    const now = new Date().toISOString();
    const defaultPreferences: UserLearningPreferences = {
      id: crypto.randomUUID(),
      userId,
      dailyGoal: 3,
      preferredDifficulty: 'ADAPTIVE',
      createdAt: now,
      updatedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            user_id as "userId",
            daily_goal as "dailyGoal",
            preferred_difficulty as "preferredDifficulty",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.user_learning_preferences
          WHERE user_id = $1
          LIMIT 1
        `;
        const row = await queryOne<any>(sql, [userId]);
        if (row) {
          return {
            id: row.id,
            userId: row.userId,
            dailyGoal: Number(row.dailyGoal),
            preferredDifficulty: row.preferredDifficulty as PreferredDifficulty,
            createdAt: row.createdAt?.toISOString?.() || row.createdAt,
            updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
          };
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB getPreferences failed, fallback to memory:`, err.message);
      }
    }

    if (inMemoryPreferences.has(userId)) {
      return inMemoryPreferences.get(userId)!;
    }

    inMemoryPreferences.set(userId, defaultPreferences);
    return defaultPreferences;
  }

  public async savePreferences(
    preferences: Partial<UserLearningPreferences> & { userId: string }
  ): Promise<UserLearningPreferences> {
    const now = new Date().toISOString();
    const existing = await this.getPreferences(preferences.userId);

    const record: UserLearningPreferences = {
      id: existing.id || preferences.id || crypto.randomUUID(),
      userId: preferences.userId,
      dailyGoal: preferences.dailyGoal !== undefined ? Math.max(1, Math.min(20, preferences.dailyGoal)) : existing.dailyGoal,
      preferredDifficulty: preferences.preferredDifficulty || existing.preferredDifficulty,
      createdAt: existing.createdAt || now,
      updatedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.user_learning_preferences (
            id, user_id, daily_goal, preferred_difficulty, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id) DO UPDATE SET
            daily_goal = EXCLUDED.daily_goal,
            preferred_difficulty = EXCLUDED.preferred_difficulty,
            updated_at = EXCLUDED.updated_at
          RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
        `;
        const res = await queryOne<any>(sql, [
          record.id,
          record.userId,
          record.dailyGoal,
          record.preferredDifficulty,
          record.createdAt,
          record.updatedAt,
        ]);
        if (res) {
          record.id = res.id;
          record.createdAt = res.createdAt?.toISOString?.() || record.createdAt;
          record.updatedAt = res.updatedAt?.toISOString?.() || record.updatedAt;
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] DB savePreferences failed, saving to memory:`, err.message);
      }
    }

    inMemoryPreferences.set(preferences.userId, record);
    return record;
  }

  // ============================================================================
  // 6. TEST & MAINTENANCE HELPERS
  // ============================================================================

  public clearInMemoryStores(): void {
    inMemoryProgress.clear();
    inMemorySchedules.clear();
    inMemoryAttempts.length = 0;
    inMemoryActivities.length = 0;
    inMemoryPreferences.clear();
  }
}

export const learningRepository = new LearningRepository();
