import { Request, Response, NextFunction } from 'express';
import { ApiResponseHelper } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  
  // Safe user-facing message
  let message = err.message || 'An unexpected internal server error occurred.';
  
  // Suppress low-level SQL and database connection strings from leakage
  if (message.includes('pg_') || message.includes('postgres://') || message.includes('postgresql://') || message.includes('neon.tech')) {
    message = 'A database query error occurred.';
  }

  logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl || req.url}`, err);

  ApiResponseHelper.sendError(
    res,
    code,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? { path: req.path } : undefined
  );
}
