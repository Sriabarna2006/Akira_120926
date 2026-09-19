import { Request, Response, NextFunction } from 'express';
import { knowledgeGraphService } from '../services/learning/knowledgeGraph.service.js';
import { knowledgeGraphRepository } from '../repositories/knowledgeGraph.repository.js';
import { ApiResponseHelper } from '../utils/response.js';

export class KnowledgeGraphController {
  // ============================================================================
  // 1. CONCEPT DIRECTORY & DETAILS
  // ============================================================================

  static async getAllConcepts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const concepts = await knowledgeGraphRepository.getAllConcepts();
      ApiResponseHelper.sendSuccess(res, concepts, {
        total: concepts.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getConceptById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const concept = await knowledgeGraphRepository.getConceptById(id);

      if (!concept) {
        ApiResponseHelper.sendError(res, 'CONCEPT_NOT_FOUND', `Concept '${id}' was not found.`, 404);
        return;
      }

      ApiResponseHelper.sendSuccess(res, concept, { conceptId: id });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 2. RELATED CONCEPTS
  // ============================================================================

  static async getRelatedConcepts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10))) : 6;

      const related = await knowledgeGraphService.getRelatedConcepts(id, limit);
      ApiResponseHelper.sendSuccess(res, related, {
        conceptId: id,
        count: related.length,
        limit,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'CONCEPT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  // ============================================================================
  // 3. PREREQUISITES GRAPH
  // ============================================================================

  static async getPrerequisites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const depth = req.query.depth ? Math.min(5, Math.max(1, parseInt(req.query.depth as string, 10))) : 5;
      const userId = req.user?.id;

      const tree = await knowledgeGraphService.getPrerequisiteTree(id, userId, depth);
      ApiResponseHelper.sendSuccess(res, tree, {
        conceptId: id,
        nodeCount: tree.nodes.length,
        edgeCount: tree.edges.length,
        maxDepth: depth,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'CONCEPT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  // ============================================================================
  // 4. RECOMMENDED LEARNING PATH
  // ============================================================================

  static async getLearningPath(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = req.user?.id;

      const learningPath = await knowledgeGraphService.getLearningPath(id, userId);
      ApiResponseHelper.sendSuccess(res, learningPath, {
        conceptId: id,
        stepCount: learningPath.totalSteps,
        userReadiness: learningPath.userOverallReadiness,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'CONCEPT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  // ============================================================================
  // 5. USER-SPECIFIC KNOWLEDGE STATUS (AUTH REQUIRED)
  // ============================================================================

  static async getKnowledgeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!req.user || !req.user.id) {
        ApiResponseHelper.sendError(res, 'UNAUTHORIZED', 'Authentication required to access private mastery data.', 401);
        return;
      }

      const status = await knowledgeGraphService.getConceptKnowledgeStatus(id, req.user.id);
      ApiResponseHelper.sendSuccess(res, status, {
        conceptId: id,
        userId: req.user.id,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'CONCEPT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  // ============================================================================
  // 6. EVENT KNOWLEDGE MAP
  // ============================================================================

  static async getEventKnowledgeMap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = req.user?.id;

      const knowledgeMap = await knowledgeGraphService.getEventKnowledgeMap(id, userId);
      ApiResponseHelper.sendSuccess(res, knowledgeMap, {
        eventId: id,
        readiness: knowledgeMap.userReadinessPercentage,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  // ============================================================================
  // 7. RELATED EVENTS
  // ============================================================================

  static async getRelatedEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10))) : 5;

      const related = await knowledgeGraphService.getRelatedEvents(id, limit);
      ApiResponseHelper.sendSuccess(res, related, {
        eventId: id,
        count: related.length,
        limit,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }
}
