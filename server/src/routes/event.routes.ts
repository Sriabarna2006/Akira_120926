import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { validateQuery, validateParams, validateBody } from '../middleware/validate.middleware.js';
import { 
  eventQuerySchema, 
  idParamSchema, 
  topEventsQuerySchema, 
  explanationQuerySchema,
  aiRefreshQuerySchema,
  quizSubmissionBodySchema
} from '../validators/query.validator.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';
import { requireInternalSecret } from '../middleware/auth.middleware.js';

import { KnowledgeGraphController } from '../controllers/knowledgeGraph.controller.js';

const router = Router();

// 1. Core Event Endpoints
router.get('/', rateLimiter({ max: 120 }), validateQuery(eventQuerySchema), EventController.getAll);
router.get('/top', rateLimiter({ max: 120 }), validateQuery(topEventsQuerySchema), EventController.getTop);
router.get('/:id', rateLimiter({ max: 120 }), validateParams(idParamSchema), EventController.getById);

// 2. Phase 9: Cross-Topic Intelligence & Knowledge Graph Endpoints
router.get(
  '/:id/knowledge-map',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  KnowledgeGraphController.getEventKnowledgeMap
);

router.get(
  '/:id/related',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  KnowledgeGraphController.getRelatedEvents
);

// 3. Phase 6: AI Intelligence & Understanding Endpoints
router.get(
  '/:id/understanding',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  EventController.getUnderstanding
);

router.get(
  '/:id/explanation',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  validateQuery(explanationQuerySchema),
  EventController.getExplanation
);

router.get(
  '/:id/concepts',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  validateQuery(aiRefreshQuerySchema),
  EventController.getConcepts
);

router.get(
  '/:id/quiz',
  rateLimiter({ max: 120 }),
  validateParams(idParamSchema),
  validateQuery(aiRefreshQuerySchema),
  EventController.getQuiz
);

router.post(
  '/:id/quiz/submit',
  rateLimiter({ max: 60 }),
  validateParams(idParamSchema),
  validateBody(quizSubmissionBodySchema),
  EventController.submitQuiz
);

router.post(
  '/:id/refresh',
  requireInternalSecret,
  validateParams(idParamSchema),
  EventController.refreshAIContent
);

export default router;
