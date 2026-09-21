import { Router } from 'express';
import { StorylineController } from '../controllers/storyline.controller.js';
import { validateQuery, validateParams, validateBody } from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/query.validator.js';
import {
  storylineQuerySchema,
  storylineDeltaQuerySchema,
  storylineAssociationBodySchema,
} from '../validators/storyline.validator.js';
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

// 2. Storyline Detail Aggregation
router.get(
  '/:id',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getStorylineById
);

// 3. Chronological Timeline
router.get(
  '/:id/timeline',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getTimeline
);

// 4. Turning Points
router.get(
  '/:id/turning-points',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getTurningPoints
);

// 5. Delta Knowledge (What changed between events?)
router.get(
  '/:id/delta',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  validateQuery(storylineDeltaQuerySchema),
  StorylineController.getDelta
);

// 6. Phase 10 Evidence Evolution Overview
router.get(
  '/:id/evidence',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getEvidence
);

// 7. Phase 9 Knowledge Graph Overview
router.get(
  '/:id/knowledge',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getKnowledge
);

// 8. User Learning Delta (Already Known vs New Since Last Review)
router.get(
  '/:id/learning-delta',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  StorylineController.getUserLearningDelta
);

// 9. Association Mutation (Internal / Admin)
router.post(
  '/associate',
  requireInternalSecret,
  validateBody(storylineAssociationBodySchema),
  StorylineController.associateEvent
);

export default router;
