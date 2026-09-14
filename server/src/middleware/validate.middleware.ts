import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponseHelper } from '../utils/response.js';

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        const message = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid query parameters';
        ApiResponseHelper.sendError(res, 'INVALID_QUERY_PARAMS', message, 400, err.format());
        return;
      }
      ApiResponseHelper.sendError(res, 'VALIDATION_ERROR', 'Malformed query data', 400);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        const message = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid path parameters';
        ApiResponseHelper.sendError(res, 'INVALID_PATH_PARAMS', message, 400, err.format());
        return;
      }
      ApiResponseHelper.sendError(res, 'VALIDATION_ERROR', 'Malformed parameter data', 400);
    }
  };
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        const message = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid request body';
        ApiResponseHelper.sendError(res, 'INVALID_REQUEST_BODY', message, 400, err.format());
        return;
      }
      ApiResponseHelper.sendError(res, 'VALIDATION_ERROR', 'Malformed request body', 400);
    }
  };
}
