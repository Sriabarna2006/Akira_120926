import { Request, Response, NextFunction } from 'express';
import { storylineService } from '../services/storyline/storyline.service.js';
import { ApiResponse } from '../types/index.js';

export class StorylineController {
  /**
   * GET /api/storylines
   */
  public static async getStorylines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const regionId = req.query.regionId as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const status = req.query.status as any;
      const trajectory = req.query.trajectory as any;
      const search = req.query.search as string | undefined;

      const result = await storylineService.getStorylines({
        page,
        limit,
        regionId,
        categoryId,
        status,
        trajectory,
        search,
      });

      const totalPages = Math.ceil(result.total / limit) || 1;
      const response: ApiResponse<any> = {
        success: true,
        data: result.storylines,
        meta: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasMore: page < totalPages,
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id
   */
  public static async getStorylineById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const detail = await storylineService.getStorylineDetail(id);

      const response: ApiResponse<any> = {
        success: true,
        data: detail,
      };

      res.json(response);
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STORYLINE_NOT_FOUND',
            message: err.message,
          },
        });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/timeline
   */
  public static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const storyline = await storylineService.getStorylineById(id);
      if (!storyline) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STORYLINE_NOT_FOUND',
            message: `Storyline with ID ${id} not found`,
          },
        });
        return;
      }

      const timeline = await storylineService.getTimeline(id);
      const response: ApiResponse<any> = {
        success: true,
        data: timeline,
        meta: {
          storylineId: id,
          count: timeline.length,
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/turning-points
   */
  public static async getTurningPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const storyline = await storylineService.getStorylineById(id);
      if (!storyline) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STORYLINE_NOT_FOUND',
            message: `Storyline with ID ${id} not found`,
          },
        });
        return;
      }

      const turningPoints = await storylineService.getTurningPoints(id);
      const response: ApiResponse<any> = {
        success: true,
        data: turningPoints,
        meta: {
          storylineId: id,
          count: turningPoints.length,
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/delta
   */
  public static async getDelta(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const fromEventId = req.query.fromEventId as string | undefined;
      const toEventId = req.query.toEventId as string | undefined;

      const delta = await storylineService.getDeltaKnowledge(id, fromEventId, toEventId);
      const response: ApiResponse<any> = {
        success: true,
        data: delta,
      };

      res.json(response);
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: err.message,
          },
        });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/evidence
   */
  public static async getEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const storyline = await storylineService.getStorylineById(id);
      if (!storyline) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STORYLINE_NOT_FOUND',
            message: `Storyline with ID ${id} not found`,
          },
        });
        return;
      }

      const evidenceOverview = await storylineService.getEvidenceOverview(id);
      const response: ApiResponse<any> = {
        success: true,
        data: evidenceOverview,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/knowledge
   */
  public static async getKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const storyline = await storylineService.getStorylineById(id);
      if (!storyline) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STORYLINE_NOT_FOUND',
            message: `Storyline with ID ${id} not found`,
          },
        });
        return;
      }

      const knowledgeOverview = await storylineService.getKnowledgeOverview(id);
      const response: ApiResponse<any> = {
        success: true,
        data: knowledgeOverview,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/learning-delta
   */
  public static async getUserLearningDelta(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.id || 'anonymous';

      const learningDelta = await storylineService.getUserLearningDelta(id, userId);
      const response: ApiResponse<any> = {
        success: true,
        data: learningDelta,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/events/:id/storylines
   */
  public static async getStorylinesForEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const storylines = await storylineService.getStorylinesForEvent(id);

      const response: ApiResponse<any> = {
        success: true,
        data: storylines,
        meta: {
          eventId: id,
          count: storylines.length,
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/storylines/associate (Internal / Admin)
   */
  public static async associateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storylineId, eventId, relationshipType, explanation } = req.body;
      await storylineService.associateEventToStoryline(storylineId, eventId, relationshipType, explanation);

      const detail = await storylineService.getStorylineDetail(storylineId);
      const response: ApiResponse<any> = {
        success: true,
        data: detail,
        meta: {
          message: `Successfully associated event ${eventId} to storyline ${storylineId}`,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}
