import { Router } from 'express';
import { ArticleController } from '../controllers/article.controller.js';
import { validateQuery, validateParams } from '../middleware/validate.middleware.js';
import { articleQuerySchema, idParamSchema } from '../validators/query.validator.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public Read Endpoints with rate limiting
router.get('/', rateLimiter({ max: 120 }), validateQuery(articleQuerySchema), ArticleController.getAll);
router.get('/:id', rateLimiter({ max: 120 }), validateParams(idParamSchema), ArticleController.getById);

export default router;
