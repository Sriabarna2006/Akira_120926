import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service.js';
import { ApiResponseHelper } from '../utils/response.js';
import { aiService } from '../services/ai/aiService.js';
import { learningService } from '../services/learning/learning.service.js';
import { ExplanationLevel } from '../types/index.js';

export class EventController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const { events, total } = await EventService.getEvents({
        regionId: req.query.region as string,
        categoryId: req.query.category as string,
        urgency: req.query.urgency as string,
        search: req.query.search as string,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / limit) || 1;

      ApiResponseHelper.sendPaginated(res, events, {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await EventService.getEventById(id);

      if (!event) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', `Canonical event '${id}' was not found`, 404);
        return;
      }

      ApiResponseHelper.sendSuccess(res, event);
    } catch (err) {
      next(err);
    }
  }

  static async getTop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = req.query.region as string;
      const category = req.query.category as string;
      const status = req.query.status as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      
      const events = await EventService.getTopEvents({
        regionId: region,
        categoryId: category,
        status,
        limit,
      });

      ApiResponseHelper.sendSuccess(res, events, {
        count: events.length,
        regionFilter: region || 'ALL',
        categoryFilter: category || 'ALL',
        statusFilter: status || 'ALL',
        calculatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // PHASE 6: AI UNDERSTANDING CONTROLLERS
  // ============================================================================

  static async getUnderstanding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const forceRefresh = req.query.forceRefresh === 'true';

      const understanding = await aiService.get5W1H(id, forceRefresh);
      ApiResponseHelper.sendSuccess(res, understanding, {
        eventId: id,
        cached: !forceRefresh
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  static async getExplanation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const level = req.query.level as ExplanationLevel | 'all' | undefined;
      const forceRefresh = req.query.forceRefresh === 'true';

      if (level === 'all') {
        const all = await aiService.getAllExplanations(id, forceRefresh);
        ApiResponseHelper.sendSuccess(res, all, { eventId: id, level: 'all' });
        return;
      }

      const selectedLevel = (level as ExplanationLevel) || 'beginner';
      const result = await aiService.getExplanation(id, selectedLevel, forceRefresh);
      ApiResponseHelper.sendSuccess(res, result, {
        eventId: id,
        level: selectedLevel
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  static async getConcepts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const forceRefresh = req.query.forceRefresh === 'true';

      const concepts = await aiService.getConcepts(id, forceRefresh);
      ApiResponseHelper.sendSuccess(res, concepts, {
        eventId: id,
        count: concepts.length
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  static async getQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const forceRefresh = req.query.forceRefresh === 'true';

      const quiz = await aiService.getQuiz(id, forceRefresh);
      // Strip correctOptionIndex and explanations from client response if needed,
      // or send questions for client quiz rendering
      const sanitizedQuiz = quiz.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
      }));

      ApiResponseHelper.sendSuccess(res, sanitizedQuiz, {
        eventId: id,
        questionCount: sanitizedQuiz.length
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  static async submitQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await aiService.submitQuiz(id, req.body);

      let learningUpdate: any = undefined;
      if (req.user) {
        learningUpdate = await learningService.recordQuizAttempt({
          userId: req.user.id,
          eventId: id,
          answers: req.body?.answers || {},
          quizResult: result,
        });
      }

      ApiResponseHelper.sendSuccess(res, result, {
        eventId: id,
        evaluatedAt: new Date().toISOString(),
        ...(learningUpdate ? { learningUpdate } : {})
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        ApiResponseHelper.sendError(res, 'VALIDATION_ERROR', 'Invalid quiz submission format', 400, err.errors);
        return;
      }
      if (err.message?.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
        return;
      }
      next(err);
    }
  }

  static async refreshAIContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await aiService.refreshEventAI(id);

      ApiResponseHelper.sendSuccess(res, {
        message: `AI intelligence content refreshed for event '${id}'`,
        eventId: id,
        timestamp: new Date().toISOString()
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
