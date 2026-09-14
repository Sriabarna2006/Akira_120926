import { Router } from 'express';
import { SourceController } from '../controllers/source.controller.js';
import { validateQuery, validateParams } from '../middleware/validate.middleware.js';
import { sourceQuerySchema, idParamSchema } from '../validators/query.validator.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public Read Endpoints with rate limiting
router.get('/', rateLimiter({ max: 120 }), validateQuery(sourceQuerySchema), SourceController.getAll);
router.get('/:id', rateLimiter({ max: 120 }), validateParams(idParamSchema), SourceController.getById);

export default router;
