import { isSafeUrl } from '../../utils/sanitize.js';

export interface RawArticleInput {
  title?: string;
  url?: string;
  contentSnippet?: string;
  publishedAt?: string | Date;
  sourceId?: string;
  sourceName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates external news article input before database ingestion.
 * Ensures data integrity and isolates malformed publisher items.
 */
export function validateArticle(input: RawArticleInput): ValidationResult {
  const errors: string[] = [];

  // 1. Title validation
  if (!input.title || typeof input.title !== 'string') {
    errors.push('Article title is missing or empty.');
  } else {
    const trimmedTitle = input.title.trim();
    if (trimmedTitle.length < 5) {
      errors.push(`Article title too short (${trimmedTitle.length} chars). Minimum 5 chars required.`);
    }
    if (trimmedTitle.length > 500) {
      errors.push(`Article title too long (${trimmedTitle.length} chars). Maximum 500 chars allowed.`);
    }
  }

  // 2. URL validation & safety
  if (!input.url || typeof input.url !== 'string') {
    errors.push('Article URL is missing.');
  } else {
    const trimmedUrl = input.url.trim();
    if (!isSafeUrl(trimmedUrl)) {
      errors.push('Article URL is unsafe or not a valid HTTP/HTTPS scheme.');
    }
  }

  // 3. Published timestamp validation
  if (!input.publishedAt) {
    errors.push('Article published timestamp is missing.');
  } else {
    const pubDate = new Date(input.publishedAt);
    if (isNaN(pubDate.getTime())) {
      errors.push('Article published timestamp is invalid and could not be parsed.');
    } else {
      const now = Date.now();
      const tenMinutesInFuture = now + 10 * 60 * 1000;
      if (pubDate.getTime() > tenMinutesInFuture) {
        errors.push('Article publication timestamp is in the future.');
      }
      // Check for impossibly old items (e.g. before year 2000 or older than 365 days)
      const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
      if (pubDate.getTime() < oneYearAgo) {
        errors.push('Article publication timestamp is excessively old (> 1 year ago).');
      }
    }
  }

  // 4. Source identification
  if (!input.sourceId && !input.sourceName) {
    errors.push('Article source identity is missing.');
  }

  // 5. Content snippet sanity check
  if (input.contentSnippet && typeof input.contentSnippet === 'string' && input.contentSnippet.length > 10000) {
    errors.push('Article content snippet exceeds maximum safe payload size (10000 chars).');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
