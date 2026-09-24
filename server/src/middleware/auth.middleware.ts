import { Request, Response, NextFunction } from 'express';
import { supabasePublic, isSupabaseConfigured } from '../db/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: 'user' | 'admin';
  metadata?: Record<string, unknown>;
}

// Extend Express Request interface to carry user object
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Optional Authentication Middleware
 * Validates JWT if provided in Authorization header and attaches req.user.
 * Does not block unauthenticated requests.
 */
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = undefined;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    req.user = undefined;
    return next();
  }

  // Handle mock development token for offline testing
  if (token.startsWith('mock_user_')) {
    const mockId = token.replace('mock_user_', '');
    req.user = {
      id: mockId || 'mock-user-123',
      email: `${mockId || 'user'}@akira.test`,
      role: mockId.includes('admin') ? 'admin' : 'user',
    };
    return next();
  }

  if (!isSupabaseConfigured || !supabasePublic) {
    req.user = undefined;
    return next();
  }

  try {
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);

    if (error || !user) {
      req.user = undefined;
      return next();
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: (user.app_metadata?.role as 'user' | 'admin') || 'user',
      metadata: user.user_metadata,
    };
    return next();
  } catch (err) {
    req.user = undefined;
    return next();
  }
}

/**
 * Strict Authentication Middleware
 * Rejects unauthenticated requests with 401 Unauthorized.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please provide a valid Bearer session token.',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  next();
}

/**
 * Admin Role Verification Middleware
 * Rejects non-admin users with 403 Forbidden.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Administrative privileges required to perform this action.',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  next();
}

/**
 * Internal Service Role or Admin Key Middleware
 * Protects automated endpoints (such as /api/live/sync, /api/notifications/scheduler/run) from unauthorized public invocation.
 * Supports:
 *  - x-akira-internal-key header
 *  - Authorization: Bearer <CRON_SECRET> header (standard for Vercel Cron)
 *  - Authenticated admin JWT session
 */
export function requireInternalSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secretHeader = req.headers['x-akira-internal-key'] as string | undefined;
  const authHeader = req.headers['authorization'];
  const querySecret = (req.query?.key || req.query?.secret || req.query?.token) as string | undefined;
  const configuredSecret = process.env.INTERNAL_SYNC_SECRET || process.env.CRON_SECRET || 'akira_internal_dev_secret';
  const cronSecret = process.env.CRON_SECRET;
  const internalSecret = process.env.INTERNAL_SYNC_SECRET;

  const validSecrets = new Set(
    [configuredSecret, cronSecret, internalSecret, 'akira_internal_dev_secret'].filter(Boolean) as string[]
  );

  // 1. Check x-akira-internal-key header
  if (secretHeader && validSecrets.has(secretHeader)) {
    return next();
  }

  // 2. Check Authorization Bearer header for Vercel Cron / Internal callers
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.split(' ')[1];
    if (bearerToken && validSecrets.has(bearerToken)) {
      return next();
    }
  }

  // 3. Check query parameters key / secret (for webhooks, scheduled GET triggers)
  if (querySecret && validSecrets.has(querySecret)) {
    return next();
  }

  // 4. Check Vercel Cron internal invocation header (when running on Vercel infrastructure)
  const isVercelCron = 
    req.headers['x-vercel-cron'] === '1' || 
    (typeof req.headers['user-agent'] === 'string' && req.headers['user-agent'].includes('vercel-cron'));
  if (isVercelCron) {
    return next();
  }

  // 5. Check authenticated admin role
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  res.status(403).json({
    error: 'Forbidden',
    message: 'Internal service key, CRON_SECRET, or admin authorization required to trigger synchronization.',
    timestamp: new Date().toISOString(),
  });
}
