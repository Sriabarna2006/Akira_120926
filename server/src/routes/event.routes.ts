import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { validateQuery, validateParams } from '../middleware/validate.middleware.js';
import { eventQuerySchema, idParamSchema } from '../validators/query.validator.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public Read Endpoints with rate limiting
router.get('/', rateLimiter({ max: 120 }), validateQuery(eventQuerySchema), EventController.getAll);
router.get('/top', rateLimiter({ max: 120 }), EventController.getTop);
router.get('/:id', rateLimiter({ max: 120 }), validateParams(idParamSchema), EventController.getById);

export default router;
