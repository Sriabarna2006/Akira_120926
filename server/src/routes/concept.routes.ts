import { Router } from 'express';
import { KnowledgeGraphController } from '../controllers/knowledgeGraph.controller.js';
import { validateParams } from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/query.validator.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// 1. Concept Directory
router.get('/', rateLimiter({ max: 120 }), KnowledgeGraphController.getAllConcepts);

// 2. Single Concept Details
router.get('/:id', rateLimiter({ max: 120 }), validateParams(idParamSchema), KnowledgeGraphController.getConceptById);

// 3. Related Concepts
router.get(
  '/:id/related',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  KnowledgeGraphController.getRelatedConcepts
);

// 4. Prerequisites DAG Tree
router.get(
  '/:id/prerequisites',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  KnowledgeGraphController.getPrerequisites
);

// 5. Recommended Learning Path
router.get(
  '/:id/learning-path',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  KnowledgeGraphController.getLearningPath
);

// 6. User-Specific Knowledge Status (Private Mastery - Requires Auth)
router.get(
  '/:id/knowledge-status',
  rateLimiter({ max: 120 }),
  requireAuth,
  validateParams(idParamSchema),
  KnowledgeGraphController.getKnowledgeStatus
);

export default router;
