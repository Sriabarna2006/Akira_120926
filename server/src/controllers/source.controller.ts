import { Request, Response, NextFunction } from 'express';
import { SourceService } from '../services/source.service.js';
import { ApiResponseHelper } from '../utils/response.js';

export class SourceController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { region, category, tier, includeInactive } = req.query;

      const sources = await SourceService.getSources({
        regionId: region as string,
        categoryId: category as string,
        tier: tier ? parseInt(tier as string, 10) : undefined,
        includeInactive: includeInactive === 'true',
      });

      ApiResponseHelper.sendSuccess(res, sources, {
        count: sources.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const source = await SourceService.getSourceById(id);

      if (!source) {
        ApiResponseHelper.sendError(res, 'SOURCE_NOT_FOUND', `Source '${id}' was not found`, 404);
        return;
      }

      ApiResponseHelper.sendSuccess(res, source);
    } catch (err) {
      next(err);
    }
  }
}
