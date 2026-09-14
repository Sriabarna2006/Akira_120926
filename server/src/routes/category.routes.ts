import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { validateQuery, validateParams } from '../middleware/validate.middleware.js';
import { categoryQuerySchema, idParamSchema } from '../validators/query.validator.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public Read Endpoints with rate limiting
router.get('/', rateLimiter({ max: 120 }), validateQuery(categoryQuerySchema), CategoryController.getAll);
router.get('/:id', rateLimiter({ max: 120 }), validateParams(idParamSchema), CategoryController.getById);

export default router;
