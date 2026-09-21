import { Router } from 'express';
import { SourceController } from '../controllers/source.controller.js';
import { EvidenceController } from '../controllers/evidence.controller.js';
import { validateQuery, validateParams } from '../middleware/validate.middleware.js';
import { sourceQuerySchema, idParamSchema } from '../validators/query.validator.js';
import { rateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Phase 10: Safe Source Health Status Endpoints
router.get('/health', rateLimiter({ max: 60 }), EvidenceController.getAllSourceHealth);
router.get('/:id/health', rateLimiter({ max: 60 }), validateParams(idParamSchema), EvidenceController.getSourceHealth);

// Public Read Endpoints with rate limiting
router.get('/', rateLimiter({ max: 120 }), validateQuery(sourceQuerySchema), SourceController.getAll);
router.get('/:id', rateLimiter({ max: 120 }), validateParams(idParamSchema), SourceController.getById);

export default router;
