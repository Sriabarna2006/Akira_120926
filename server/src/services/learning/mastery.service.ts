import { MasteryStatus, ExplanationLevel } from '../../types/index.js';

export interface MasteryCalculationResult {
  newMastery: number;
  masteryStatus: MasteryStatus;
  isMastered: boolean;
  scorePercentage: number;
}

export class MasteryService {
  /**
   * Deterministic mastery scoring engine.
   * Uses weighted historical smoothing:
   *   - 1st attempt: 100% weight to current performance
   *   - Subsequent: 70% historical mastery + 30% current accuracy
   * Clamped strictly between 0 and 100.
   */
  public calculateMastery(
    oldMastery: number | null | undefined,
    correctCount: number,
    totalQuestions: number
  ): MasteryCalculationResult {
    const accuracy = totalQuestions > 0 ? Math.max(0, Math.min(1, correctCount / totalQuestions)) : 0;
    const scorePercentage = Math.round(accuracy * 100);

    let newMastery: number;
    if (oldMastery === null || oldMastery === undefined) {
      newMastery = scorePercentage;
    } else {
      const historical = Math.max(0, Math.min(100, oldMastery));
      newMastery = Math.round(historical * 0.7 + scorePercentage * 0.3);
    }

    newMastery = Math.max(0, Math.min(100, newMastery));
    const masteryStatus = this.classifyMastery(newMastery);
    const isMastered = newMastery >= 80;

    return {
      newMastery,
      masteryStatus,
      isMastered,
      scorePercentage,
    };
  }

  /**
   * Deterministic classification of mastery status.
   */
  public classifyMastery(score: number): MasteryStatus {
    const clamped = Math.max(0, Math.min(100, score));
    if (clamped >= 80) return 'STRONG';
    if (clamped >= 50) return 'DEVELOPING';
    return 'NEEDS_LEARNING';
  }

  /**
   * Adaptive explanation level recommendation based on mastery score.
   */
  public getRecommendedExplanationLevel(masteryScore: number): ExplanationLevel {
    const score = Math.max(0, Math.min(100, masteryScore));
    if (score < 40) return 'beginner';
    if (score < 70) return 'student';
    if (score < 85) return 'technical';
    return 'deepDive';
  }
}

export const masteryService = new MasteryService();
