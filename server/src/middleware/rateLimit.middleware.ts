import { Request, Response, NextFunction } from 'express';
import { ApiResponseHelper } from '../utils/response.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref(); // unref so it won't block tests from exiting

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 60s)
  max?: number; // Max requests per windowMs (default: 100)
  keyGenerator?: (req: Request) => string;
}

export function rateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const keyGen = options.keyGenerator || ((req: Request) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'default-client';
  });

  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'test') {
      // Bypass rate limit in tests to prevent test interference
      return next();
    }

    const key = `${keyGen(req)}:${req.baseUrl || req.path}`;
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      ApiResponseHelper.sendError(
        res,
        'RATE_LIMIT_EXCEEDED',
        `Too many requests. Please try again in ${resetSeconds} seconds.`,
        429
      );
      return;
    }

    next();
  };
}
