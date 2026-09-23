import { Router } from 'express';
import { LearningDashboardController } from '../controllers/learningDashboard.controller.js';
import { PersonalizationController } from '../controllers/personalization.controller.js';
import { getConcepts, submitQuiz } from '../controllers/learning.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// ============================================================================
// PHASE 8: INTELLIGENT DISCOVERY FEED & ADAPTIVE PERSONALIZATION
// ============================================================================

// 1. Personalized Discovery Learning Feed (Requires Authentication)
router.get(
  '/feed',
  rateLimiter({ max: 120 }),
  requireAuth,
  PersonalizationController.getPersonalizedFeed
);

// 2. Daily Learning Summary & Goal Progress (Requires Authentication)
router.get(
  '/daily-summary',
  rateLimiter({ max: 120 }),
  requireAuth,
  PersonalizationController.getDailySummary
);

// 3. User Learning Preferences (Requires Authentication)
router.get(
  '/preferences',
  rateLimiter({ max: 120 }),
  requireAuth,
  PersonalizationController.getPreferences
);

router.put(
  '/preferences',
  rateLimiter({ max: 60 }),
  requireAuth,
  PersonalizationController.updatePreferences
);

// 4. Learning Activity Tracking (Requires Authentication)
router.post(
  '/activity',
  rateLimiter({ max: 180 }),
  requireAuth,
  PersonalizationController.trackActivity
);

// ============================================================================
// PHASE 7: LEARNING METRICS & SPACED REPETITION
// ============================================================================

// 5. Core Learning Dashboard Metrics (Requires Authentication)
router.get(
  '/progress',
  rateLimiter({ max: 120 }),
  requireAuth,
  LearningDashboardController.getProgress
);

// 6. Spaced Repetition Due Reviews (Requires Authentication)
router.get(
  '/review',
  rateLimiter({ max: 120 }),
  requireAuth,
  LearningDashboardController.getDueReviews
);

// 7. Personalized Learning Recommendations (Requires Authentication)
router.get(
  '/recommendations',
  rateLimiter({ max: 120 }),
  requireAuth,
  LearningDashboardController.getRecommendations
);

// 8. Public / Reference Concepts Directory
router.get(
  '/concepts',
  rateLimiter({ max: 120 }),
  getConcepts
);

// 9. Quiz Submission & Spaced Repetition Mastery Engine (Phase 7 & 8)
router.post(
  '/quiz/submit',
  rateLimiter({ max: 60 }),
  submitQuiz
);

export default router;

