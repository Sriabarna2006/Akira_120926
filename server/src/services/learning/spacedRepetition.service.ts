import { ReviewStatus, MasteryStatus, UserReviewSchedule } from '../../types/index.js';

export interface ScheduleCalculationInput {
  currentSchedule?: UserReviewSchedule | null;
  scorePercentage: number;
  masteryStatus: MasteryStatus;
  now?: Date;
}

export interface ScheduleCalculationResult {
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  lastReviewedAt: string;
  nextReviewAt: string;
  status: ReviewStatus;
  quality: number;
}

export class SpacedRepetitionService {
  public static readonly DEFAULT_EASE_FACTOR = 2.5;
  public static readonly MIN_EASE_FACTOR = 1.3;

  /**
   * Deterministically maps quiz accuracy percentage to SM-2 quality grade (0 to 5).
   */
  public getReviewQuality(scorePercentage: number): number {
    const score = Math.max(0, Math.min(100, scorePercentage));
    if (score >= 90) return 5;
    if (score >= 80) return 4;
    if (score >= 60) return 3;
    if (score >= 40) return 2;
    if (score > 0) return 1;
    return 0;
  }

  /**
   * Deterministic SM-2 spaced repetition scheduler.
   * Calculates interval days, ease factor, repetition count, and next review date.
   */
  public calculateNextSchedule(input: ScheduleCalculationInput): ScheduleCalculationResult {
    const serverNow = input.now || new Date();
    const quality = this.getReviewQuality(input.scorePercentage);
    const existing = input.currentSchedule;

    let easeFactor = existing ? existing.easeFactor : SpacedRepetitionService.DEFAULT_EASE_FACTOR;
    let repetitionCount = existing ? existing.repetitionCount : 0;
    let intervalDays = existing ? existing.intervalDays : 1;
    let status: ReviewStatus = 'LEARNING';

    if (quality >= 3) {
      // Successful recall
      repetitionCount += 1;

      if (repetitionCount === 1) {
        intervalDays = 1;
      } else if (repetitionCount === 2) {
        intervalDays = 3;
      } else {
        const prevInterval = existing?.intervalDays || 1;
        intervalDays = Math.max(1, Math.round(prevInterval * easeFactor));
      }

      // Standard SM-2 Ease Factor calculation
      // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      const deltaEF = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
      easeFactor = Math.max(SpacedRepetitionService.MIN_EASE_FACTOR, easeFactor + deltaEF);

      if (input.masteryStatus === 'STRONG' && repetitionCount >= 3) {
        status = 'MASTERED';
      } else {
        status = 'REVIEW';
      }
    } else {
      // Weak recall / failure: reset repetition cycle
      repetitionCount = 0;
      intervalDays = 1;
      easeFactor = Math.max(SpacedRepetitionService.MIN_EASE_FACTOR, easeFactor - 0.2);
      status = 'LEARNING';
    }

    // Round ease factor to 2 decimal places for storage precision
    easeFactor = Math.round(easeFactor * 100) / 100;

    const nextReviewDate = new Date(serverNow.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
      easeFactor,
      intervalDays,
      repetitionCount,
      lastReviewedAt: serverNow.toISOString(),
      nextReviewAt: nextReviewDate.toISOString(),
      status,
      quality,
    };
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
