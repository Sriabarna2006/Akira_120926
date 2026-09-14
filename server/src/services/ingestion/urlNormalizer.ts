/**
 * URL Normalizer for News Articles
 * Strips marketing/tracking parameters while preserving canonical destination URL.
 */

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_name',
  'utm_cid',
  'utm_reader',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'twclid',
  'msclkid',
  '_ga',
  '_gl',
  'mc_cid',
  'mc_eid',
  'ref',
  'ref_src',
  'feedName',
  'feedType',
  'ito',
]);

/**
 * Normalizes an article URL by removing tracking query parameters and fragments.
 * Handles malformed strings safely.
 */
export function normalizeArticleUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);

    // Only process http / https URLs
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return trimmed;
    }

    // Filter out tracking query parameters
    const searchParams = new URLSearchParams(parsed.search);
    const keysToDelete: string[] = [];

    for (const [key] of searchParams.entries()) {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      searchParams.delete(key);
    }

    parsed.search = searchParams.toString();
    // Remove hash/fragment
    parsed.hash = '';

    // Standardize pathname (remove trailing slash except for root)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    // If URL parsing fails, return sanitized trim
    return trimmed.split('#')[0].split('?utm_')[0];
  }
}
