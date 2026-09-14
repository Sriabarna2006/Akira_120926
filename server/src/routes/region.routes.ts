import { Router } from 'express';
import { RegionController } from '../controllers/region.controller.js';
import { validateQuery, validateParams } from '../middleware/validate.middleware.js';
import { regionQuerySchema, idParamSchema } from '../validators/query.validator.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public Read Endpoints with rate limiting
router.get('/', rateLimiter({ max: 120 }), validateQuery(regionQuerySchema), RegionController.getAll);
router.get('/:id', rateLimiter({ max: 120 }), validateParams(idParamSchema), RegionController.getById);

export default router;
