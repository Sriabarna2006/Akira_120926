import { Request, Response, NextFunction } from 'express';
import { RegionService } from '../services/region.service.js';
import { ApiResponseHelper } from '../utils/response.js';

export class RegionController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const regions = await RegionService.getAllRegions(includeInactive);

      ApiResponseHelper.sendSuccess(res, regions, {
        count: regions.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const region = await RegionService.getRegionById(id);

      if (!region) {
        ApiResponseHelper.sendError(res, 'REGION_NOT_FOUND', `Region '${id}' was not found`, 404);
        return;
      }

      ApiResponseHelper.sendSuccess(res, region);
    } catch (err) {
      next(err);
    }
  }
}
