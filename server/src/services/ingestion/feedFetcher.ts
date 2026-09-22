import Parser from 'rss-parser';
import { isSafeUrl } from '../../utils/sanitize.js';
import { SourceErrorType } from '../../types/index.js';
import { FeedValidator } from './feedValidator.js';

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
  errorType?: SourceErrorType;
  httpStatus?: number;
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
    const urlCheck = FeedValidator.validateUrl(feedUrl, allowedUrls);
    if (!urlCheck.isValid) {
      return {
        success: false,
        items: [],
        error: urlCheck.errorMessage,
        errorType: urlCheck.errorType,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Fetch with strict timeout race and retries
    let attempt = 0;
    let lastError = 'Unknown fetch error';
    let lastErrorType: SourceErrorType = 'UNKNOWN';
    let lastHttpStatus = 0;

    while (attempt <= MAX_RETRIES) {
      try {
        const fetchPromise = this.parser.parseURL(feedUrl);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Feed request timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
        );

        const feed = await Promise.race([fetchPromise, timeoutPromise]);
        const durationMs = Date.now() - startTime;

        // Structural validation
        const structureCheck = FeedValidator.validateFeedStructure(feed);
        if (!structureCheck.isValid) {
          return {
            success: false,
            items: [],
            error: structureCheck.errorMessage,
            errorType: structureCheck.errorType,
            durationMs,
          };
        }

        const items: RawFeedItem[] = feed.items.map((item: any) => ({
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
          errorType: 'NONE',
          httpStatus: 200,
          durationMs,
        };
      } catch (err: any) {
        attempt++;
        const netErr = FeedValidator.classifyNetworkError(err);
        lastError = netErr.errorMessage;
        lastErrorType = netErr.errorType;

        if (err && typeof err === 'object' && 'statusCode' in err) {
          lastHttpStatus = err.statusCode;
        }

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
      errorType: lastErrorType,
      httpStatus: lastHttpStatus,
      durationMs: Date.now() - startTime,
    };
  }
}

export const feedFetcher = new FeedFetcher();
