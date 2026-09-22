import { SourceErrorType } from '../../types/index.js';
import { isSafeUrl } from '../../utils/sanitize.js';

export interface FeedValidationResult {
  isValid: boolean;
  errorType: SourceErrorType;
  errorMessage?: string;
  httpStatus?: number;
  itemCount: number;
  sampleTitle?: string;
  hasValidDates: boolean;
}

export class FeedValidator {
  /**
   * Validates URL safety and SSRF boundaries
   */
  public static validateUrl(url: string, allowedWhitelist?: Set<string>): { isValid: boolean; errorType: SourceErrorType; errorMessage?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, errorType: 'UNKNOWN', errorMessage: 'Feed URL is required' };
    }

    if (!isSafeUrl(url)) {
      return { isValid: false, errorType: 'SSRF_BLOCKED', errorMessage: `SSRF Guard: Blocked invalid or unsafe feed URL: ${url}` };
    }

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();

      // Check loopback, private IP ranges and internal AWS/cloud metadata
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('172.16.') ||
        host.startsWith('172.17.') ||
        host.startsWith('172.18.') ||
        host.startsWith('172.19.') ||
        host.startsWith('172.20.') ||
        host.startsWith('172.21.') ||
        host.startsWith('172.22.') ||
        host.startsWith('172.23.') ||
        host.startsWith('172.24.') ||
        host.startsWith('172.25.') ||
        host.startsWith('172.26.') ||
        host.startsWith('172.27.') ||
        host.startsWith('172.28.') ||
        host.startsWith('172.29.') ||
        host.startsWith('172.30.') ||
        host.startsWith('172.31.') ||
        host.startsWith('169.254.')
      ) {
        return { isValid: false, errorType: 'SSRF_BLOCKED', errorMessage: `SSRF Guard: Blocked invalid or unsafe feed URL: ${host}` };
      }
    } catch {
      return { isValid: false, errorType: 'SSRF_BLOCKED', errorMessage: `SSRF Guard: Malformed URL: ${url}` };
    }

    if (allowedWhitelist && allowedWhitelist.size > 0 && !allowedWhitelist.has(url)) {
      return { isValid: false, errorType: 'SSRF_BLOCKED', errorMessage: 'SSRF Guard: Feed URL not registered in approved sources whitelist.' };
    }

    return { isValid: true, errorType: 'NONE' };
  }

  /**
   * Classify HTTP error responses into standard SourceErrorType
   */
  public static classifyHttpError(status: number, statusText?: string): { errorType: SourceErrorType; errorMessage: string } {
    if (status === 403) {
      return { errorType: 'HTTP_403', errorMessage: `HTTP 403 Forbidden: Endpoint blocked feed crawler (${statusText || 'Access Denied'})` };
    }
    if (status === 401) {
      return { errorType: 'UNAUTHORIZED', errorMessage: `HTTP 401 Unauthorized: Endpoint requires authentication (${statusText || 'Unauthorized'})` };
    }
    if (status === 404 || status === 410) {
      return { errorType: 'HTTP_404', errorMessage: `HTTP ${status}: Feed endpoint does not exist or was discontinued` };
    }
    if (status >= 500 && status <= 599) {
      return { errorType: 'HTTP_5XX', errorMessage: `HTTP ${status} Server Error: Upstream publisher server failure (${statusText || 'Internal Server Error'})` };
    }
    return { errorType: 'UNKNOWN', errorMessage: `HTTP ${status} ${statusText || 'Error'}` };
  }

  /**
   * Classify raw exception/network error into SourceErrorType
   */
  public static classifyNetworkError(err: unknown): { errorType: SourceErrorType; errorMessage: string } {
    if (!err) return { errorType: 'UNKNOWN', errorMessage: 'Unknown network error' };

    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as any).code) : '';

    if (msg.includes('timeout') || msg.includes('timed out') || code === 'ETIMEDOUT') {
      return { errorType: 'TIMEOUT', errorMessage: 'Feed request timed out' };
    }
    if (msg.includes('enotfound') || msg.includes('getaddrinfo') || code === 'ENOTFOUND') {
      return { errorType: 'DNS_ERROR', errorMessage: 'DNS lookup failed for feed host' };
    }
    if (msg.includes('econnrefused') || code === 'ECONNREFUSED') {
      return { errorType: 'DNS_ERROR', errorMessage: 'Connection refused by feed server' };
    }
    if (msg.includes('403') || msg.includes('forbidden') || msg.includes('cloudflare') || msg.includes('captcha') || msg.includes('just a moment')) {
      return { errorType: 'HTTP_403', errorMessage: 'Bot challenge or HTTP 403 received from feed server' };
    }
    if (msg.includes('404') || msg.includes('not found')) {
      return { errorType: 'HTTP_404', errorMessage: 'Feed endpoint returned 404 Not Found' };
    }
    if (msg.includes('unquoted attribute') || msg.includes('invalid xml') || msg.includes('non-whitespace before first tag') || msg.includes('unexpected close tag')) {
      return { errorType: 'XML_MALFORMED', errorMessage: `Malformed XML structure: ${err instanceof Error ? err.message : String(err)}` };
    }

    return { errorType: 'UNKNOWN', errorMessage: err instanceof Error ? err.message : String(err) };
  }

  /**
   * Inspects parsed feed object to verify structural integrity and presence of items
   */
  public static validateFeedStructure(feed: any): FeedValidationResult {
    if (!feed) {
      return {
        isValid: false,
        errorType: 'EMPTY_FEED',
        errorMessage: 'Feed payload is empty or null',
        itemCount: 0,
        hasValidDates: false,
      };
    }

    const items = feed.items || feed.entries || [];
    if (!Array.isArray(items) || items.length === 0) {
      return {
        isValid: false,
        errorType: 'EMPTY_FEED',
        errorMessage: 'Feed returned 0 articles or items',
        itemCount: 0,
        hasValidDates: false,
      };
    }

    // Check if items have mandatory title and URL
    const validItems = items.filter((item: any) => Boolean((item.title && item.title.trim().length > 3) && (item.link || item.guid || item.url)));

    if (validItems.length === 0) {
      return {
        isValid: false,
        errorType: 'SCHEMA_VIOLATION',
        errorMessage: 'Feed items lack required title or link fields',
        itemCount: 0,
        hasValidDates: false,
      };
    }

    // Check publication timestamps
    const sampleItem = validItems[0];
    const sampleDate = sampleItem.pubDate || sampleItem.isoDate || sampleItem.published;
    const hasValidDates = sampleDate ? !isNaN(new Date(sampleDate).getTime()) : false;

    return {
      isValid: true,
      errorType: 'NONE',
      itemCount: validItems.length,
      sampleTitle: sampleItem.title,
      hasValidDates,
    };
  }
}

export const feedValidator = new FeedValidator();
