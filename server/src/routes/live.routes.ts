import { Router } from 'express';
import { LiveController } from '../controllers/live.controller.js';
import { requireInternalSecret } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { eventQuerySchema } from '../validators/query.validator.js';

const router = Router();

// Public persisted events stream
router.get('/', rateLimiter({ max: 120 }), validateQuery(eventQuerySchema), LiveController.getLiveStream);
router.get('/top', rateLimiter({ max: 120 }), LiveController.getTop);

// Protected internal / admin sync endpoint
router.post('/sync', requireInternalSecret, LiveController.sync);

export default router;
