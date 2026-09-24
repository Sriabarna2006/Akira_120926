import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service.js';
import { newsIngestionService } from '../services/newsIngestion.service.js';
import { RankingService } from '../services/ranking/rankingService.js';
import { ApiResponseHelper } from '../utils/response.js';

export class LiveController {
  /**
   * GET /api/live
   * Returns current persisted events stream with explicit timestamp metadata.
   */
  static async getLiveStream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const region = req.query.region as string;
      const category = req.query.category as string;
      const search = req.query.search as string;

      const { events, total } = await EventService.getEvents({
        regionId: region,
        categoryId: category,
        search,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / limit) || 1;

      // Note: Transparently declare that this is persisted database intelligence
      ApiResponseHelper.sendPaginated(res, events, {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/live/top
   * Returns top 10 dynamically ranked canonical events.
   */
  static async getTop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = req.query.region as string;
      const category = req.query.category as string;
      const status = req.query.status as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const topEvents = await EventService.getTopEvents({
        regionId: region,
        categoryId: category,
        status,
        limit,
      });

      ApiResponseHelper.sendSuccess(res, topEvents, {
        count: topEvents.length,
        regionFilter: region || 'ALL',
        categoryFilter: category || 'ALL',
        statusFilter: status || 'ALL',
        calculatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/live/refresh-scores
   * Protected internal / admin ranking score recalculation trigger.
   */
  static async refreshScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await RankingService.refreshScores();
      ApiResponseHelper.sendSuccess(res, {
        status: 'COMPLETED',
        ...result,
      }, {
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/live/refresh
   * User-facing safe on-demand news feed sync and ranking refresh.
   */
  static async refreshLiveFeeds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await newsIngestionService.runIngestion();
      await RankingService.refreshScores();

      ApiResponseHelper.sendSuccess(res, {
        status: 'SUCCESS',
        message: 'Live news feeds synchronized and breaking scores recalculated successfully.',
        report,
      }, {
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET / POST /api/live/sync
   * Protected internal / admin ingestion trigger.
   */
  static async sync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let sourceFilter: string[] | undefined = undefined;

      if (req.body?.sources && Array.isArray(req.body.sources)) {
        sourceFilter = req.body.sources;
      } else if (req.query?.sources) {
        sourceFilter = typeof req.query.sources === 'string'
          ? req.query.sources.split(',').map((s) => s.trim())
          : (req.query.sources as string[]);
      }

      if (!sourceFilter && process.env.NODE_ENV === 'test') {
        sourceFilter = ['the-hindu-tn'];
      }
      const report = await newsIngestionService.runIngestion(sourceFilter);
      await RankingService.refreshScores();

      ApiResponseHelper.sendSuccess(res, {
        status: 'COMPLETED',
        report,
      }, {
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}




