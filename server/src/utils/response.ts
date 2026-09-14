import { Response } from 'express';
import { PaginationMeta } from '../types/index.js';

export class ApiResponseHelper {
  static sendSuccess<T>(
    res: Response,
    data: T,
    meta?: Record<string, unknown>,
    statusCode = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      data,
      ...(meta && { meta: { ...meta, timestamp: meta.timestamp || new Date().toISOString() } }),
    });
  }

  static sendPaginated<T>(
    res: Response,
    data: T[],
    paginationMeta: PaginationMeta,
    statusCode = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      data,
      meta: paginationMeta,
    });
  }

  static sendError(
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: unknown
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    });
  }
}
