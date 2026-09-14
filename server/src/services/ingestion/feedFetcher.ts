import Parser from 'rss-parser';
import { isSafeUrl } from '../../utils/sanitize.js';

export interface RawFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  guid?: string;
  author?: string;
}

export interface FetchFeedResult {
  success: boolean;
  items: RawFeedItem[];
  error?: string;
  durationMs: number;
}

const DEFAULT_TIMEOUT_MS = parseInt(process.env.INGESTION_TIMEOUT_MS || '6000', 10);
const MAX_RETRIES = parseInt(process.env.INGESTION_MAX_RETRIES || '1', 10);

export class FeedFetcher {
  private parser: Parser;
  private timeoutMs: number;

  constructor(timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
    this.parser = new Parser({
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });
  }

  /**
   * Fetches and parses an RSS or Atom feed with retry backoff and timeout isolation.
   */
  async fetchFeed(feedUrl: string, allowedUrls?: Set<string>): Promise<FetchFeedResult> {
    const startTime = Date.now();

    // 1. SSRF & URL Validation
    if (!feedUrl || typeof feedUrl !== 'string' || !isSafeUrl(feedUrl)) {
      return {
        success: false,
        items: [],
        error: `SSRF Guard: Blocked invalid or unsafe feed URL: ${feedUrl}`,
        durationMs: Date.now() - startTime,
      };
    }

    if (allowedUrls && allowedUrls.size > 0 && !allowedUrls.has(feedUrl)) {
      return {
        success: false,
        items: [],
        error: `SSRF Guard: Feed URL not registered in approved sources whitelist.`,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Fetch with strict timeout race and retries
    let attempt = 0;
    let lastError = 'Unknown fetch error';

    while (attempt <= MAX_RETRIES) {
      try {
        const fetchPromise = this.parser.parseURL(feedUrl);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Feed request timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
        );

        const feed = await Promise.race([fetchPromise, timeoutPromise]);
        const durationMs = Date.now() - startTime;

        if (!feed || !Array.isArray(feed.items)) {
          return {
            success: false,
            items: [],
            error: 'Feed responded without valid RSS/Atom items list.',
            durationMs,
          };
        }

        const items: RawFeedItem[] = feed.items.map((item) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate || (item as any).isoDate || (item as any).published,
          content: item.content || (item as any)['content:encoded'],
          contentSnippet: item.contentSnippet || item.summary,
          summary: item.summary,
          guid: item.guid || item.id,
          author: (item as any).creator || (item as any).author,
        }));

        return {
          success: true,
          items,
          durationMs,
        };
      } catch (err) {
        attempt++;
        lastError = (err as Error).message || 'Network error';

        if (attempt <= MAX_RETRIES) {
          const backoffDelay = Math.min(1000, 200 * Math.pow(2, attempt));
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }

    return {
      success: false,
      items: [],
      error: `Failed after ${MAX_RETRIES + 1} attempts. Reason: ${lastError}`,
      durationMs: Date.now() - startTime,
    };
  }
}

export const feedFetcher = new FeedFetcher();
