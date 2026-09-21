import { Request, Response, NextFunction } from 'express';
import { storylineCatchupService } from '../services/storyline/storylineCatchup.service.js';
import { storylineCatchupRepository } from '../repositories/storylineCatchup.repository.js';
import { storylineService } from '../services/storyline/storyline.service.js';

export class StorylineCatchupController {
  /**
   * Helper to extract authenticated user ID from request.
   */
  private static extractUserId(req: Request): string | undefined {
    return (
      (req as any).user?.id ||
      (req.headers['x-user-id'] as string) ||
      (req.query.userId as string) ||
      undefined
    );
  }

  /**
   * GET /api/storylines/:id/catch-up
   * Returns a 60-second consolidated catch-up briefing (personalized if user provided).
   */
  public static async getCatchupBriefing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = StorylineCatchupController.extractUserId(req);
      const forceRefresh = req.query.forceRefresh === 'true';

      const briefing = await storylineCatchupService.getCatchupBriefing(id, userId, forceRefresh);
      res.json({
        success: true,
        data: briefing,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/storylines/:id/catch-up/refresh
   * Force-regenerates and caches a fresh catch-up briefing.
   */
  public static async refreshCatchupBriefing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = StorylineCatchupController.extractUserId(req);

      const briefing = await storylineCatchupService.getCatchupBriefing(id, userId, true);
      res.json({
        success: true,
        data: briefing,
        message: 'Catch-up briefing regenerated successfully.',
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/storylines/:id/progress
   * Marks a storyline event as reviewed/read by the user.
   */
  public static async markProgress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const { eventId } = req.body;
      const userId = StorylineCatchupController.extractUserId(req) || '00000000-0000-0000-0000-000000000001';

      const progress = await storylineCatchupService.markEventReviewed(userId, id, eventId);
      res.json({
        success: true,
        data: progress,
        message: `Event "${eventId}" marked as reviewed in storyline "${id}".`,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message.includes('does not belong')) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/progress
   * Returns current user review progress and stats for a storyline.
   */
  public static async getProgress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = StorylineCatchupController.extractUserId(req) || '00000000-0000-0000-0000-000000000001';

      const timeline = await storylineService.getTimeline(id);
      const progress = await storylineCatchupRepository.getUserProgress(userId, id);

      const totalEventCount = timeline.length;
      const reviewedEventCount = progress?.reviewedEventIds?.length || 0;
      const unreadEventCount = Math.max(0, totalEventCount - reviewedEventCount);
      const progressPercentage =
        totalEventCount > 0 ? Math.round((reviewedEventCount / totalEventCount) * 100) : 100;

      res.json({
        success: true,
        data: {
          storylineId: id,
          userId,
          lastSeenEventId: progress?.lastSeenEventId || null,
          reviewedEventIds: progress?.reviewedEventIds || [],
          reviewedEventCount,
          unreadEventCount,
          totalEventCount,
          progressPercentage,
          isFullyCaughtUp: progressPercentage === 100,
          lastReviewedAt: progress?.lastReviewedAt || null,
        },
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/journey
   * Returns complete chronological learning journey with scrubbing indices.
   */
  public static async getJourney(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = StorylineCatchupController.extractUserId(req);

      const journey = await storylineCatchupService.getStorylineJourney(id, userId);
      res.json({
        success: true,
        data: journey,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }
}
