import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service.js';
import { ApiResponseHelper } from '../utils/response.js';

export class CategoryController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await CategoryService.getAllCategories(includeInactive);

      ApiResponseHelper.sendSuccess(res, categories, {
        count: categories.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const category = await CategoryService.getCategoryById(id);

      if (!category) {
        ApiResponseHelper.sendError(res, 'CATEGORY_NOT_FOUND', `Category '${id}' was not found`, 404);
        return;
      }

      ApiResponseHelper.sendSuccess(res, category);
    } catch (err) {
      next(err);
    }
  }
}
