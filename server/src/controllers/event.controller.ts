import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service.js';
import { ApiResponseHelper } from '../utils/response.js';

export class EventController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const { events, total } = await EventService.getEvents({
        regionId: req.query.region as string,
        categoryId: req.query.category as string,
        urgency: req.query.urgency as string,
        search: req.query.search as string,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / limit) || 1;

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

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await EventService.getEventById(id);

      if (!event) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', `Canonical event '${id}' was not found`, 404);
        return;
      }

      ApiResponseHelper.sendSuccess(res, event);
    } catch (err) {
      next(err);
    }
  }

  static async getTop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = req.query.region as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const events = await EventService.getTopEvents(region, limit);

      ApiResponseHelper.sendSuccess(res, events, {
        count: events.length,
        regionFilter: region || 'ALL',
      });
    } catch (err) {
      next(err);
    }
  }
}
