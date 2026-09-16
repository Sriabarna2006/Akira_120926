import { Router } from 'express';
import { LearningDashboardController } from '../controllers/learningDashboard.controller.js';
import { getConcepts } from '../controllers/learning.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// 1. Core Learning Dashboard Metrics (Requires Authentication)
router.get(
  '/progress',
  rateLimiter({ max: 120 }),
  requireAuth,
  LearningDashboardController.getProgress
);

// 2. Spaced Repetition Due Reviews (Requires Authentication)
router.get(
  '/review',
  rateLimiter({ max: 120 }),
  requireAuth,
  LearningDashboardController.getDueReviews
);

// 3. Personalized Learning Recommendations (Requires Authentication)
router.get(
  '/recommendations',
  rateLimiter({ max: 120 }),
  requireAuth,
  LearningDashboardController.getRecommendations
);

// 4. Public / Reference Concepts Directory
router.get(
  '/concepts',
  rateLimiter({ max: 120 }),
  getConcepts
);

export default router;
