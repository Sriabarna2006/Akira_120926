import { Request, Response, NextFunction } from 'express';
import { ArticleService } from '../services/article.service.js';
import { ApiResponseHelper } from '../utils/response.js';

export class ArticleController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const { articles, total } = await ArticleService.getArticles({
        regionId: req.query.region as string,
        categoryId: req.query.category as string,
        sourceId: req.query.source as string,
        eventId: req.query.event_id as string,
        search: req.query.search as string,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / limit) || 1;

      ApiResponseHelper.sendPaginated(res, articles, {
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

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const article = await ArticleService.getArticleById(id);

      if (!article) {
        ApiResponseHelper.sendError(res, 'ARTICLE_NOT_FOUND', `Article '${id}' was not found`, 404);
        return;
      }

      ApiResponseHelper.sendSuccess(res, article);
    } catch (err) {
      next(err);
    }
  }
}
