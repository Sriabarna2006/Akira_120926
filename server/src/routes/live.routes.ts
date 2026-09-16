import { Router } from 'express';
import { LiveController } from '../controllers/live.controller.js';
import { requireInternalSecret } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { eventQuerySchema, topEventsQuerySchema } from '../validators/query.validator.js';

const router = Router();

// Public persisted events stream
router.get('/', rateLimiter({ max: 120 }), validateQuery(eventQuerySchema), LiveController.getLiveStream);
router.get('/top', rateLimiter({ max: 120 }), validateQuery(topEventsQuerySchema), LiveController.getTop);

// Public on-demand news feed sync trigger
router.post('/refresh', rateLimiter({ max: 30 }), LiveController.refreshLiveFeeds);

// Protected internal / admin sync and score refresh endpoints
router.post('/sync', requireInternalSecret, LiveController.sync);
router.post('/refresh-scores', requireInternalSecret, LiveController.refreshScores);

export default router;


