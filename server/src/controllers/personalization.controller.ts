import { Request, Response, NextFunction } from 'express';
import { personalizationService } from '../services/learning/personalization.service.js';
import { ApiResponseHelper } from '../utils/response.js';
import { LearningActivityType, PreferredDifficulty } from '../types/index.js';

export class PersonalizationController {
  /**
   * GET /api/learning/feed
   * Returns deterministic personalized discovery feed tailored to the user's progress,
   * knowledge gaps, due reviews, and category interactions with 80/20 exploration balance.
   */
  public static async getPersonalizedFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.sendError(res, 'UNAUTHORIZED', 'Authentication required to access personalized learning feed', 401);
        return;
      }

      const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10))) : 10;
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
      const regionId = req.query.region as string;
      const categoryId = req.query.category as string;
      const explorationRatio = req.query.explorationRatio ? Math.min(0.5, Math.max(0.05, parseFloat(req.query.explorationRatio as string))) : 0.20;

      const result = await personalizationService.getPersonalizedFeed(req.user.id, {
        limit,
        page,
        regionId,
        categoryId,
        explorationRatio,
        applyDiversity: true,
      });

      ApiResponseHelper.sendSuccess(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/learning/daily-summary
   * Returns daily learning activity statistics, streak, SM-2 due status, and daily goal progress.
   */
  public static async getDailySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.sendError(res, 'UNAUTHORIZED', 'Authentication required to access daily learning summary', 401);
        return;
      }

      const summary = await personalizationService.getDailyLearningSummary(req.user.id);
      ApiResponseHelper.sendSuccess(res, summary, {
        userId: req.user.id,
        calculatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/learning/preferences
   * Returns user learning goal and difficulty preferences.
   */
  public static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.sendError(res, 'UNAUTHORIZED', 'Authentication required to view preferences', 401);
        return;
      }

      const preferences = await personalizationService.getUserPreferences(req.user.id);
      ApiResponseHelper.sendSuccess(res, preferences);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/learning/preferences
   * Updates user learning daily target and preferred explanation complexity.
   */
  public static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.sendError(res, 'UNAUTHORIZED', 'Authentication required to update preferences', 401);
        return;
      }

      const { dailyGoal, preferredDifficulty } = req.body || {};

      let validDailyGoal: number | undefined;
      if (dailyGoal !== undefined) {
        const parsed = parseInt(String(dailyGoal), 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 20) {
          ApiResponseHelper.sendError(res, 'VALIDATION_ERROR', 'Daily goal must be an integer between 1 and 20', 400);
          return;
        }
        validDailyGoal = parsed;
      }

      let validDifficulty: PreferredDifficulty | undefined;
      if (preferredDifficulty !== undefined) {
        const allowed: PreferredDifficulty[] = ['ADAPTIVE', 'BEGINNER', 'STUDENT', 'TECHNICAL', 'DEEP_DIVE'];
        if (!allowed.includes(preferredDifficulty)) {
          ApiResponseHelper.sendError(res, 'VALIDATION_ERROR', `Preferred difficulty must be one of: ${allowed.join(', ')}`, 400);
          return;
        }
        validDifficulty = preferredDifficulty;
      }

      const updated = await personalizationService.updateUserPreferences(req.user.id, {
        dailyGoal: validDailyGoal,
        preferredDifficulty: validDifficulty,
      });

      ApiResponseHelper.sendSuccess(res, updated, {
        message: 'Learning preferences updated successfully',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/learning/activity
   * Records lightweight interaction event for telemetry, category affinity, and daily goals.
   */
  public static async trackActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.sendError(res, 'UNAUTHORIZED', 'Authentication required to record activity', 401);
        return;
      }

      const { activityType, eventId, conceptId, metadata } = req.body || {};

      const validTypes: LearningActivityType[] = [
        'EVENT_VIEWED',
        'EXPLANATION_VIEWED',
        'CONCEPT_VIEWED',
        'QUIZ_STARTED',
        'QUIZ_COMPLETED',
        'EVENT_SAVED',
        'REVIEW_COMPLETED',
      ];

      if (!activityType || !validTypes.includes(activityType)) {
        ApiResponseHelper.sendError(res, 'VALIDATION_ERROR', `Invalid activity type. Expected one of: ${validTypes.join(', ')}`, 400);
        return;
      }

      const record = await personalizationService.trackActivity({
        userId: req.user.id,
        activityType,
        eventId,
        conceptId,
        metadata,
      });

      ApiResponseHelper.sendSuccess(res, record, {
        recordedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
