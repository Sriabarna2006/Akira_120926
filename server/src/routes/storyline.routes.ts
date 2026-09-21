import { Router } from 'express';
import { StorylineController } from '../controllers/storyline.controller.js';
import { StorylineCatchupController } from '../controllers/storylineCatchup.controller.js';
import { validateQuery, validateParams, validateBody } from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/query.validator.js';
import {
  storylineQuerySchema,
  storylineDeltaQuerySchema,
  storylineAssociationBodySchema,
} from '../validators/storyline.validator.js';
import {
  storylineIdParamSchema,
  storylineCatchupQuerySchema,
  storylineProgressBodySchema,
} from '../validators/storylineCatchup.validator.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';
import { requireInternalSecret } from '../middleware/auth.middleware.js';

const router = Router();

// 1. Storyline Discovery & List
router.get(
  '/',
  rateLimiter({ max: 120 }),
  validateQuery(storylineQuerySchema),
  StorylineController.getStorylines
);

// 2. Phase 12: 60-Second Consolidated Catch-Up Briefing
router.get(
  '/:id/catch-up',
  rateLimiter({ max: 120 }),
  validateParams(storylineIdParamSchema),
  validateQuery(storylineCatchupQuerySchema),
  StorylineCatchupController.getCatchupBriefing
);

// 3. Phase 12: Force Refresh Catch-Up Briefing
router.post(
  '/:id/catch-up/refresh',
  rateLimiter({ max: 30 }),
  validateParams(storylineIdParamSchema),
  StorylineCatchupController.refreshCatchupBriefing
);

// 4. Phase 12: User Storyline Review Progress
router.get(
  '/:id/progress',
  rateLimiter({ max: 120 }),
  validateParams(storylineIdParamSchema),
  StorylineCatchupController.getProgress
);

router.post(
  '/:id/progress',
  rateLimiter({ max: 60 }),
  validateParams(storylineIdParamSchema),
  validateBody(storylineProgressBodySchema),
  StorylineCatchupController.markProgress
);

// 5. Phase 12: Chronological Learning Journey
router.get(
  '/:id/journey',
  rateLimiter({ max: 120 }),
  validateParams(storylineIdParamSchema),
  StorylineCatchupController.getJourney
);

// 6. Storyline Detail Aggregation
router.get(
  '/:id',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getStorylineById
);

// 7. Chronological Timeline
router.get(
  '/:id/timeline',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getTimeline
);

// 8. Turning Points
router.get(
  '/:id/turning-points',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getTurningPoints
);

// 9. Delta Knowledge (What changed between events?)
router.get(
  '/:id/delta',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  validateQuery(storylineDeltaQuerySchema),
  StorylineController.getDelta
);

// 10. Phase 10 Evidence Evolution Overview
router.get(
  '/:id/evidence',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getEvidence
);

// 11. Phase 9 Knowledge Graph Overview
router.get(
  '/:id/knowledge',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getKnowledge
);

// 12. User Learning Delta (Already Known vs New Since Last Review)
router.get(
  '/:id/learning-delta',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getUserLearningDelta
);

// 13. Association Mutation (Internal / Admin)
router.post(
  '/associate',
  requireInternalSecret,
  validateBody(storylineAssociationBodySchema),
  StorylineController.associateEvent
);

export default router;

