/**
 * Safe Logger for AKIRA backend.
 * Automatically masks tokens, secrets, credentials, and API keys from logs.
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'secret',
  'key',
  'service_role',
  'cookie',
  'session',
  'bearer',
];

function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 4 || obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Check if string looks like a bearer token or secret
    if (obj.startsWith('Bearer ') || obj.length > 80 && /^[A-Za-z0-9-_.]+$/.test(obj)) {
      return '[REDACTED_TOKEN]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some((s) => lowerKey.includes(s));
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

export const logger = {
  info(message: string, meta?: any) {
    if (meta !== undefined) {
      console.log(`[INFO] ${message}`, sanitizeObject(meta));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },

  warn(message: string, meta?: any) {
    if (meta !== undefined) {
      console.warn(`[WARN] ${message}`, sanitizeObject(meta));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  error(message: string, error?: any) {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}: ${error.message}`);
    } else if (error !== undefined) {
      console.error(`[ERROR] ${message}`, sanitizeObject(error));
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
};
