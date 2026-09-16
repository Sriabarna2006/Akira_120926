import {
  UserLearningProgress,
  UserReviewSchedule,
  QuizAttemptRecord,
  DueReviewItem,
  LearningDashboardData,
  LearningRecommendation,
  QuizSubmissionLearningPayload,
  QuizResult,
  CanonicalEvent,
} from '../../types/index.js';
import { learningRepository } from '../../repositories/learning.repository.js';
import { EventRepository } from '../../repositories/event.repository.js';
import { EventService } from '../event.service.js';
import { masteryService } from './mastery.service.js';
import { spacedRepetitionService } from './spacedRepetition.service.js';

export class LearningService {
  // ============================================================================
  // 1. RECORD QUIZ ATTEMPT & UPDATE LEARNING PROFILE
  // ============================================================================

  public async recordQuizAttempt(params: {
    userId: string;
    eventId: string;
    conceptId?: string;
    answers: Record<string | number, number>;
    quizResult: QuizResult;
  }): Promise<QuizSubmissionLearningPayload> {
    const { userId, eventId, conceptId, answers, quizResult } = params;
    const now = new Date();

    // 1. Fetch existing learning progress
    const existingProgress = await learningRepository.getProgress(userId, eventId, conceptId);

    // 2. Deterministic mastery calculation
    const masteryCalc = masteryService.calculateMastery(
      existingProgress?.masteryScore,
      quizResult.correctCount,
      quizResult.totalQuestions
    );

    const isNewMastered = masteryCalc.isMastered && (!existingProgress || !existingProgress.lastMasteredAt);
    const lastMasteredAt = isNewMastered
      ? now.toISOString()
      : existingProgress?.lastMasteredAt;

    const updatedProgress = await learningRepository.saveProgress({
      id: existingProgress?.id,
      userId,
      eventId,
      conceptId,
      masteryScore: masteryCalc.newMastery,
      masteryStatus: masteryCalc.masteryStatus,
      attemptCount: (existingProgress?.attemptCount || 0) + 1,
      correctCount: (existingProgress?.correctCount || 0) + quizResult.correctCount,
      incorrectCount: (existingProgress?.incorrectCount || 0) + (quizResult.totalQuestions - quizResult.correctCount),
      lastAttemptAt: now.toISOString(),
      lastMasteredAt,
    });

    // 3. Fetch and update SM-2 review schedule
    const existingSchedule = await learningRepository.getSchedule(userId, eventId, conceptId);
    const scheduleCalc = spacedRepetitionService.calculateNextSchedule({
      currentSchedule: existingSchedule,
      scorePercentage: quizResult.scorePercentage,
      masteryStatus: masteryCalc.masteryStatus,
      now,
    });

    const updatedSchedule = await learningRepository.saveSchedule({
      id: existingSchedule?.id,
      userId,
      eventId,
      conceptId,
      easeFactor: scheduleCalc.easeFactor,
      intervalDays: scheduleCalc.intervalDays,
      repetitionCount: scheduleCalc.repetitionCount,
      lastReviewedAt: scheduleCalc.lastReviewedAt,
      nextReviewAt: scheduleCalc.nextReviewAt,
      status: scheduleCalc.status,
    });

    // 4. Record normalized quiz attempt audit entry
    const attemptRecord = await learningRepository.saveAttempt({
      userId,
      eventId,
      conceptId,
      score: quizResult.correctCount,
      totalQuestions: quizResult.totalQuestions,
      accuracy: quizResult.totalQuestions > 0 ? quizResult.correctCount / quizResult.totalQuestions : 0,
      scorePercentage: quizResult.scorePercentage,
      masteryStatus: masteryCalc.masteryStatus,
      answers,
      submittedAt: now.toISOString(),
    });

    // 5. Record user activity
    await learningRepository.saveActivity({
      userId,
      activityType: 'QUIZ_COMPLETED',
      eventId,
      conceptId,
      metadata: {
        score: quizResult.correctCount,
        totalQuestions: quizResult.totalQuestions,
        scorePercentage: quizResult.scorePercentage,
        masteryScore: masteryCalc.newMastery,
      },
      createdAt: now.toISOString(),
    });

    // 6. Compute current streak
    const attempts = await learningRepository.getAttemptsForUser(userId, 100);
    const streak = this.calculateStreak(attempts, now);
    const recommendedLevel = masteryService.getRecommendedExplanationLevel(masteryCalc.newMastery);

    return {
      progress: updatedProgress,
      schedule: updatedSchedule,
      attempt: attemptRecord,
      currentStreak: streak.currentStreak,
      recommendedLevel,
    };
  }

  // ============================================================================
  // 2. LEARNING DASHBOARD DATA AGGREGATOR
  // ============================================================================

  public async getDashboardData(userId: string): Promise<LearningDashboardData> {
    const now = new Date();
    const [allProgress, allSchedules, attempts] = await Promise.all([
      learningRepository.getAllProgressForUser(userId),
      learningRepository.getAllSchedulesForUser(userId),
      learningRepository.getAttemptsForUser(userId, 50),
    ]);

    const totalItemsTracked = allProgress.length;
    const isNewUser = totalItemsTracked === 0 && attempts.length === 0;

    let overallMastery = 0;
    let conceptsLearned = 0;
    let conceptsDeveloping = 0;
    let conceptsNeedingLearning = 0;

    if (totalItemsTracked > 0) {
      const sum = allProgress.reduce((acc, p: UserLearningProgress) => acc + p.masteryScore, 0);
      overallMastery = Math.round(sum / totalItemsTracked);

      for (const p of allProgress) {
        if (p.masteryStatus === 'STRONG') conceptsLearned += 1;
        else if (p.masteryStatus === 'DEVELOPING') conceptsDeveloping += 1;
        else conceptsNeedingLearning += 1;
      }
    }

    const dueReviews = allSchedules.filter((s: UserReviewSchedule) => new Date(s.nextReviewAt).getTime() <= now.getTime());
    const dueReviewsCount = dueReviews.length;
    const completedReviewsCount = allSchedules.filter((s: UserReviewSchedule) => s.repetitionCount > 0).length;

    // Streak calculation
    const streak = this.calculateStreak(attempts, now);

    // Category progress calculation
    const categoryProgress = await this.calculateCategoryProgress(allProgress);

    // Weak concepts calculation
    const weakConcepts = await this.extractWeakConcepts(allProgress, allSchedules, now);

    return {
      overallMastery,
      totalItemsTracked,
      conceptsLearned,
      conceptsDeveloping,
      conceptsNeedingLearning,
      dueReviewsCount,
      completedReviewsCount,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      categoryProgress,
      recentActivity: attempts.slice(0, 10),
      weakConcepts,
      isNewUser,
    };
  }

  // ============================================================================
  // 3. DUE REVIEWS RETRIEVAL & ORDERING
  // ============================================================================

  public async getDueReviews(userId: string, limit: number = 20): Promise<{ dueCount: number; totalScheduled: number; items: DueReviewItem[] }> {
    const now = new Date();
    const [allSchedules, allProgress] = await Promise.all([
      learningRepository.getAllSchedulesForUser(userId),
      learningRepository.getAllProgressForUser(userId),
    ]);

    const progressMap = new Map<string, UserLearningProgress>();
    for (const p of allProgress) {
      if (p.eventId) progressMap.set(p.eventId, p);
      if (p.conceptId) progressMap.set(p.conceptId, p);
    }

    const dueSchedules = allSchedules.filter((s: UserReviewSchedule) => new Date(s.nextReviewAt).getTime() <= now.getTime());

    // Hydrate events
    const items: (DueReviewItem & { importanceScore: number })[] = [];
    for (const s of dueSchedules) {
      const eventId = s.eventId;
      let title = 'General Topic';
      let category = 'General';
      let importanceScore = 50;

      if (eventId) {
        const event = await EventRepository.findById(eventId);
        if (event) {
          title = event.title;
          category = event.category || event.categoryId || 'General';
          importanceScore = event.importanceScore || 50;
        }
      }

      const progress = (eventId ? progressMap.get(eventId) : undefined) || (s.conceptId ? progressMap.get(s.conceptId) : undefined);
      const masteryScore = progress ? progress.masteryScore : 0;
      const masteryStatus = progress ? progress.masteryStatus : 'NEEDS_LEARNING';

      const nextReviewTime = new Date(s.nextReviewAt).getTime();
      const overdueMs = Math.max(0, now.getTime() - nextReviewTime);
      const overdueHours = Math.round(overdueMs / 3600000);

      items.push({
        id: s.id,
        eventId: s.eventId,
        conceptId: s.conceptId,
        title,
        category,
        masteryScore,
        masteryStatus,
        status: s.status,
        intervalDays: s.intervalDays,
        easeFactor: s.easeFactor,
        repetitionCount: s.repetitionCount,
        lastReviewedAt: s.lastReviewedAt,
        nextReviewAt: s.nextReviewAt,
        isOverdue: overdueHours > 0,
        overdueHours,
        recommendedExplanationLevel: masteryService.getRecommendedExplanationLevel(masteryScore),
        importanceScore,
      });
    }

    // Deterministic sorting priority:
    // 1. Overdue hours DESC
    // 2. Mastery score ASC
    // 3. Event importance DESC
    // 4. ID stable tie-breaker
    items.sort((a, b) => {
      if (b.overdueHours !== a.overdueHours) return b.overdueHours - a.overdueHours;
      if (a.masteryScore !== b.masteryScore) return a.masteryScore - b.masteryScore;
      if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore;
      return a.id.localeCompare(b.id);
    });

    const sanitizedItems: DueReviewItem[] = items.slice(0, limit).map(({ importanceScore, ...rest }) => rest);

    return {
      dueCount: dueSchedules.length,
      totalScheduled: allSchedules.length,
      items: sanitizedItems,
    };
  }

  // ============================================================================
  // 4. PERSONALIZED LEARNING RECOMMENDATIONS
  // ============================================================================

  public async getRecommendations(userId: string, limit: number = 6): Promise<{ recommendations: LearningRecommendation[] }> {
    const now = new Date();
    const [allProgress, allSchedules, topEvents] = await Promise.all([
      learningRepository.getAllProgressForUser(userId),
      learningRepository.getAllSchedulesForUser(userId),
      EventService.getTopEvents({ limit: 10 }),
    ]);

    const recommendations: LearningRecommendation[] = [];

    // 1. Check for Overdue Reviews (Priority 1)
    const dueReviews = allSchedules.filter((s: UserReviewSchedule) => new Date(s.nextReviewAt).getTime() <= now.getTime());
    if (dueReviews.length > 0) {
      const topDue = dueReviews[0];
      let title = 'Scheduled Review';
      let category = 'Knowledge';
      if (topDue.eventId) {
        const ev = await EventRepository.findById(topDue.eventId);
        if (ev) {
          title = ev.title;
          category = ev.category || ev.categoryId || 'Knowledge';
        }
      }

      recommendations.push({
        type: 'REVIEW_DUE',
        title: `Review Due: ${title}`,
        reason: `It's time to reinforce your memory with active spaced repetition.`,
        eventId: topDue.eventId,
        conceptId: topDue.conceptId,
        category,
        priority: 100,
      });
    }

    // 2. Check for Weak Concepts (Priority 2)
    const weakItems = allProgress.filter((p: UserLearningProgress) => p.masteryStatus === 'NEEDS_LEARNING' || p.masteryScore < 50);
    for (const w of weakItems.slice(0, 2)) {
      let title = 'Weak Subject';
      let category = 'General';
      if (w.eventId) {
        const ev = await EventRepository.findById(w.eventId);
        if (ev) {
          title = ev.title;
          category = ev.category || ev.categoryId || 'General';
        }
      }

      recommendations.push({
        type: 'WEAK_CONCEPT',
        title: `Strengthen: ${title}`,
        reason: `Your current mastery is ${w.masteryScore}%. Review the beginner breakdown to build confidence.`,
        eventId: w.eventId,
        conceptId: w.conceptId,
        category,
        masteryScore: w.masteryScore,
        priority: 80,
      });
    }

    // 3. Check for In-Progress / Developing Items (Priority 3)
    const developingItems = allProgress.filter((p: UserLearningProgress) => p.masteryStatus === 'DEVELOPING');
    for (const d of developingItems.slice(0, 2)) {
      let title = 'In Progress';
      let category = 'General';
      if (d.eventId) {
        const ev = await EventRepository.findById(d.eventId);
        if (ev) {
          title = ev.title;
          category = ev.category || ev.categoryId || 'General';
        }
      }

      recommendations.push({
        type: 'CONTINUE_LEARNING',
        title: `Advance Mastery: ${title}`,
        reason: `You're making solid progress (${d.masteryScore}%). One more successful review will push this to Strong.`,
        eventId: d.eventId,
        conceptId: d.conceptId,
        category,
        masteryScore: d.masteryScore,
        priority: 60,
      });
    }

    // 4. Recommend New High-Impact Concepts/Events (Priority 4)
    const attemptedEventIds = new Set(allProgress.map((p: UserLearningProgress) => p.eventId).filter(Boolean));
    const unattemptedEvents = topEvents.filter((e: CanonicalEvent) => !attemptedEventIds.has(e.id));

    for (const unattempted of unattemptedEvents.slice(0, 3)) {
      recommendations.push({
        type: 'NEW_CONCEPT',
        title: `Explore: ${unattempted.title}`,
        reason: `High real-world importance (${unattempted.importanceScore}/100) and currently trending in ${unattempted.category || unattempted.region || 'News'}.`,
        eventId: unattempted.id,
        category: unattempted.category || unattempted.categoryId || 'General',
        priority: 40,
      });
    }

    // Sort by priority DESC
    recommendations.sort((a, b) => b.priority - a.priority);

    return {
      recommendations: recommendations.slice(0, limit),
    };
  }

  // ============================================================================
  // 5. DETERMINISTIC STREAK COMPUTATION (UTC Days)
  // ============================================================================

  public calculateStreak(
    attempts: QuizAttemptRecord[],
    currentDate: Date = new Date()
  ): { currentStreak: number; longestStreak: number } {
    if (!attempts || attempts.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Extract unique active calendar dates in UTC (format: YYYY-MM-DD)
    const dateSet = new Set<string>();
    for (const a of attempts) {
      const d = new Date(a.submittedAt);
      if (!isNaN(d.getTime())) {
        const utcDateStr = d.toISOString().split('T')[0];
        dateSet.add(utcDateStr);
      }
    }

    if (dateSet.size === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const todayUtc = currentDate.toISOString().split('T')[0];
    const yesterdayDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayUtc = yesterdayDate.toISOString().split('T')[0];

    // Check if streak is active today or yesterday
    let currentStreak = 0;
    let anchorDate: Date;

    if (dateSet.has(todayUtc)) {
      anchorDate = new Date(currentDate.getTime());
    } else if (dateSet.has(yesterdayUtc)) {
      anchorDate = yesterdayDate;
    } else {
      anchorDate = new Date(0); // Streak broken
    }

    if (anchorDate.getTime() > 0) {
      let checkDate = new Date(anchorDate.getTime());
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(dateStr)) {
          currentStreak += 1;
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
    }

    // Calculate longest consecutive streak across all historical dates
    const sortedDates = Array.from(dateSet).sort();
    let longestStreak = 0;
    let runningStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of sortedDates) {
      const d = new Date(dateStr + 'T00:00:00.000Z');
      if (!prevDate) {
        runningStreak = 1;
      } else {
        const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          runningStreak += 1;
        } else {
          runningStreak = 1;
        }
      }
      prevDate = d;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
    };
  }

  // ============================================================================
  // 6. HELPER CALCULATIONS
  // ============================================================================

  private async calculateCategoryProgress(progressList: UserLearningProgress[]): Promise<Record<string, number>> {
    const categoryScores: Record<string, { total: number; count: number }> = {};

    for (const p of progressList) {
      let category = 'General';
      if (p.eventId) {
        const event = await EventRepository.findById(p.eventId);
        if (event) {
          category = event.category || event.categoryId || 'General';
        }
      }

      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0 };
      }
      categoryScores[category].total += p.masteryScore;
      categoryScores[category].count += 1;
    }

    const result: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryScores)) {
      result[cat] = Math.round(data.total / data.count);
    }

    return result;
  }

  private async extractWeakConcepts(
    progressList: UserLearningProgress[],
    schedules: UserReviewSchedule[],
    now: Date
  ): Promise<DueReviewItem[]> {
    const weakList = progressList
      .filter((p: UserLearningProgress) => p.masteryStatus === 'NEEDS_LEARNING' || p.masteryScore < 50)
      .sort((a, b) => a.masteryScore - b.masteryScore);

    const scheduleMap = new Map<string, UserReviewSchedule>();
    for (const s of schedules) {
      if (s.eventId) scheduleMap.set(s.eventId, s);
      if (s.conceptId) scheduleMap.set(s.conceptId, s);
    }

    const items: DueReviewItem[] = [];
    for (const p of weakList.slice(0, 5)) {
      let title = 'Knowledge Concept';
      let category = 'General';
      if (p.eventId) {
        const ev = await EventRepository.findById(p.eventId);
        if (ev) {
          title = ev.title;
          category = ev.category || ev.categoryId || 'General';
        }
      }

      const schedule = (p.eventId ? scheduleMap.get(p.eventId) : undefined) || (p.conceptId ? scheduleMap.get(p.conceptId) : undefined);
      const nextReviewAt = schedule?.nextReviewAt || now.toISOString();
      const overdueMs = Math.max(0, now.getTime() - new Date(nextReviewAt).getTime());

      items.push({
        id: p.id,
        eventId: p.eventId,
        conceptId: p.conceptId,
        title,
        category,
        masteryScore: p.masteryScore,
        masteryStatus: p.masteryStatus,
        status: schedule?.status || 'LEARNING',
        intervalDays: schedule?.intervalDays || 1,
        easeFactor: schedule?.easeFactor || 2.5,
        repetitionCount: schedule?.repetitionCount || 0,
        lastReviewedAt: schedule?.lastReviewedAt || p.lastAttemptAt,
        nextReviewAt,
        isOverdue: overdueMs > 0,
        overdueHours: Math.round(overdueMs / 3600000),
        recommendedExplanationLevel: masteryService.getRecommendedExplanationLevel(p.masteryScore),
      });
    }

    return items;
  }
}

export const learningService = new LearningService();
