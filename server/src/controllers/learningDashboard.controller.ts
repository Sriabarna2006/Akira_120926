import { Request, Response, NextFunction } from 'express';
import { learningService } from '../services/learning/learning.service.js';
import { ApiResponseHelper } from '../utils/response.js';

export class LearningDashboardController {
  /**
   * GET /api/learning/progress
   * Returns user learning dashboard metrics (mastery, streak, category progress, weak concepts).
   */
  public static async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.sendError(res, 'UNAUTHORIZED', 'Authentication required to view learning progress', 401);
        return;
      }

      const data = await learningService.getDashboardData(req.user.id);
      ApiResponseHelper.sendSuccess(res, data, {
        userId: req.user.id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/learning/review
   * Returns due items for spaced repetition review sorted by priority.
   */
  public static async getDueReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.sendError(res, 'UNAUTHORIZED', 'Authentication required to view review schedule', 401);
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const data = await learningService.getDueReviews(req.user.id, limit);

      ApiResponseHelper.sendSuccess(res, data, {
        userId: req.user.id,
        serverTime: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/learning/recommendations
   * Returns deterministic learning recommendations tailored to the user's progress.
   */
  public static async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.sendError(res, 'UNAUTHORIZED', 'Authentication required to view recommendations', 401);
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
      const data = await learningService.getRecommendations(req.user.id, limit);

      ApiResponseHelper.sendSuccess(res, data, {
        userId: req.user.id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
