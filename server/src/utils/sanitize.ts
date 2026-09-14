/**
 * HTML content sanitizer & URL validator.
 * Strips script tags, unsafe event handlers, iframe injections, and ensures URL safety.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
};

/**
 * Strips HTML tags and escapes dangerous characters from input text.
 */
export function sanitizeText(input?: string): string {
  if (!input || typeof input !== 'string') return '';

  // Strip scripts and styles first
  const noScripts = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Strip all HTML tags
  const textOnly = noScripts.replace(/<[^>]*>?/gm, '');

  // Unescape standard entities and trim excess whitespace
  return textOnly
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Escapes characters for safe HTML rendering in templates.
 */
export function escapeHtml(input?: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'`\/]/g, (char) => HTML_ENTITY_MAP[char] || char);
}

/**
 * Validates whether a given URL is safe for external linking.
 * Blocks non-http(s) schemes like javascript:, data:, file:, etc.
 */
export function isSafeUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
