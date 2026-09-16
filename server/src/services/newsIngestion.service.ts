import { CanonicalEvent, Article, Source } from '../types/index.js';
import { SourceRepository } from '../repositories/source.repository.js';
import { ArticleRepository } from '../repositories/article.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { sanitizeText } from '../utils/sanitize.js';
import { normalizeArticleUrl } from './ingestion/urlNormalizer.js';
import { validateArticle } from './ingestion/articleValidator.js';
import { classifyArticle } from './ingestion/classifier.js';
import { findMatchingCanonicalEvent } from './ingestion/eventMatcher.js';
import { feedFetcher } from './ingestion/feedFetcher.js';
import { RankingService } from './ranking/rankingService.js';

export interface IngestionReport {
  sourcesAttempted: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  articlesDiscovered: number;
  articlesAccepted: number;
  articlesRejected: number;
  duplicatesSkipped: number;
  eventsCreated: number;
  eventsUpdated: number;
  durationMs: number;
  timestamp: string;
}

export class NewsIngestionService {
  private isSyncing = false;
  private lastSyncTime: Date | null = null;
  private lastReport: IngestionReport | null = null;

  /**
   * Primary ingestion pipeline orchestrator.
   * Pulls approved feeds, normalizes, validates, deduplicates, classifies,
   * clusters canonical events, and persists to PostgreSQL.
   */
  public async runIngestion(sourceFilterIds?: string[]): Promise<IngestionReport> {
    if (this.isSyncing) {
      console.log('[NewsIngestion] Ingestion cycle already in progress, skipping concurrent run.');
      return this.lastReport || {
        sourcesAttempted: 0,
        sourcesSucceeded: 0,
        sourcesFailed: 0,
        articlesDiscovered: 0,
        articlesAccepted: 0,
        articlesRejected: 0,
        duplicatesSkipped: 0,
        eventsCreated: 0,
        eventsUpdated: 0,
        durationMs: 0,
        timestamp: new Date().toISOString(),
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    const report: IngestionReport = {
      sourcesAttempted: 0,
      sourcesSucceeded: 0,
      sourcesFailed: 0,
      articlesDiscovered: 0,
      articlesAccepted: 0,
      articlesRejected: 0,
      duplicatesSkipped: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };

    console.log('[NewsIngestion] Starting real-world news ingestion cycle...');

    try {
      // 1. Load active registered sources from database
      let sources = await SourceRepository.findAll({ includeInactive: false });
      if (sourceFilterIds && sourceFilterIds.length > 0) {
        sources = sources.filter((s) => sourceFilterIds.includes(s.id));
      }

      // Filter to sources having configured feed URLs
      const feedSources = sources.filter((s) => s.feedUrl && s.feedUrl.trim().length > 0);
      report.sourcesAttempted = feedSources.length;

      // Whitelist of approved feed URLs for SSRF prevention
      const approvedFeedUrls = new Set(feedSources.map((s) => s.feedUrl as string));

      // 2. Pre-fetch recent canonical events for clustering pool (past 36 hours)
      const recentEventsPool: CanonicalEvent[] = await EventRepository.findRecentEventsForMatching(undefined, undefined, 36);

      // 3. Process feeds with controlled concurrency
      for (const source of feedSources) {
        const feedUrl = source.feedUrl as string;
        const fetchResult = await feedFetcher.fetchFeed(feedUrl, approvedFeedUrls);

        if (!fetchResult.success) {
          console.warn(`[NewsIngestion] Source "${source.name}" (${source.id}) failed: ${fetchResult.error}`);
          await SourceRepository.updateFetchStatus(source.id, false, fetchResult.error);
          report.sourcesFailed++;
          continue;
        }

        // Record successful fetch
        await SourceRepository.updateFetchStatus(source.id, true);
        report.sourcesSucceeded++;
        report.articlesDiscovered += fetchResult.items.length;

        // Process articles for this source (top 15 newest items per cycle)
        for (const rawItem of fetchResult.items.slice(0, 15)) {
          const rawUrl = rawItem.link || '';
          const normalizedUrl = normalizeArticleUrl(rawUrl);
          const rawTitle = rawItem.title || '';
          const cleanTitle = sanitizeText(rawTitle);
          const rawSnippet = rawItem.contentSnippet || rawItem.content || rawItem.summary || '';
          const cleanSnippet = sanitizeText(rawSnippet).slice(0, 1000);
          const publishedAt = rawItem.pubDate ? new Date(rawItem.pubDate).toISOString() : new Date().toISOString();

          // 4. Validate article schema & integrity
          const validation = validateArticle({
            title: cleanTitle,
            url: normalizedUrl,
            contentSnippet: cleanSnippet,
            publishedAt,
            sourceId: source.id,
            sourceName: source.name,
          });

          if (!validation.isValid) {
            report.articlesRejected++;
            continue;
          }

          // 5. Deduplication check against database
          const alreadyExists = await ArticleRepository.existsByUrl(normalizedUrl);
          if (alreadyExists) {
            report.duplicatesSkipped++;
            continue;
          }

          // 6. Deterministic Region & Category Classification
          const { regionId, categoryId } = classifyArticle(
            cleanTitle,
            cleanSnippet,
            source.regionId || 'world',
            source.categoryId || 'other'
          );

          // 7. Canonical Event Matching
          const matchResult = findMatchingCanonicalEvent(
            cleanTitle,
            cleanSnippet,
            regionId,
            categoryId,
            publishedAt,
            recentEventsPool
          );

          // Generate stable article ID
          const rawArtHash = `${source.id}_${normalizedUrl}`;
          let hashVal = 0;
          for (let i = 0; i < rawArtHash.length; i++) {
            hashVal = (hashVal << 5) - hashVal + rawArtHash.charCodeAt(i);
            hashVal |= 0;
          }
          const articleId = `art_${Math.abs(hashVal).toString(36)}`;

          if (matchResult.isMatch && matchResult.matchedEvent) {
            // Corroborate existing canonical event
            const matchedEvent = matchResult.matchedEvent;

            // Persist raw article linked to existing event
            const createdArticle = await ArticleRepository.create({
              id: articleId,
              sourceId: source.id,
              eventId: matchedEvent.id,
              title: cleanTitle,
              url: normalizedUrl,
              contentSnippet: cleanSnippet,
              publishedAt,
              regionId,
              categoryId,
            });

            // Attach source & update canonical event
            await EventRepository.attachArticleToEvent(
              matchedEvent.id,
              createdArticle,
              source.name,
              source.tier || 2
            );

            report.eventsUpdated++;
            report.articlesAccepted++;
          } else {
            // Create new canonical event
            const rawEvtHash = `${regionId}_${categoryId}_${cleanTitle.toLowerCase().slice(0, 40)}`;
            let evtHash = 0;
            for (let i = 0; i < rawEvtHash.length; i++) {
              evtHash = (evtHash << 5) - evtHash + rawEvtHash.charCodeAt(i);
              evtHash |= 0;
            }
            const eventId = `evt_${regionId.replace('-', '_')}_${Math.abs(evtHash).toString(36)}`;

            const hoursAgo = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3600000);
            const urgencyLabel = hoursAgo <= 2 ? 'BREAKING' : hoursAgo <= 12 ? 'TRENDING' : 'IMPORTANT';

            const newEvent: CanonicalEvent = {
              id: eventId,
              title: cleanTitle,
              summary: cleanSnippet || cleanTitle,
              regionId,
              categoryId,
              urgencyLabel,
              importanceScore: 75,
              velocityScore: 60,
              finalRankScore: 70,
              whyItMatters: undefined,
              firstPublishedAt: publishedAt,
              lastUpdatedAt: publishedAt,
              sourceCount: 1,
              lifecycleStatus: 'INITIAL_REPORT',
              metadata: {
                initialSource: source.name,
                sourceTier: source.tier,
              },
              createdAt: publishedAt,
            };

            const createdEvent = await EventRepository.create(newEvent);

            // Persist raw article linked to new event
            const createdArticle = await ArticleRepository.create({
              id: articleId,
              sourceId: source.id,
              eventId: createdEvent.id,
              title: cleanTitle,
              url: normalizedUrl,
              contentSnippet: cleanSnippet,
              publishedAt,
              regionId,
              categoryId,
            });

            // Attach initial event source record
            await EventRepository.attachArticleToEvent(
              createdEvent.id,
              createdArticle,
              source.name,
              source.tier || 2
            );

            // Add new event to matching pool for subsequent items
            recentEventsPool.unshift(createdEvent);

            report.eventsCreated++;
            report.articlesAccepted++;
          }
        }
      }
    } catch (err: any) {
      console.error('[NewsIngestion] Critical pipeline failure:', err.message);
    } finally {
      report.durationMs = Date.now() - startTime;
      this.lastSyncTime = new Date();
      this.isSyncing = false;
      this.lastReport = report;

      console.log(
        `[NewsIngestion] Ingestion run completed in ${report.durationMs}ms. ` +
        `Attempted: ${report.sourcesAttempted}, Succeeded: ${report.sourcesSucceeded}, ` +
        `Failed: ${report.sourcesFailed}, Discovered: ${report.articlesDiscovered}, ` +
        `Accepted: ${report.articlesAccepted}, Dupes: ${report.duplicatesSkipped}, ` +
        `Events Created: ${report.eventsCreated}, Events Updated: ${report.eventsUpdated}`
      );
    }

    return report;
  }

  public getStatus(): { isSyncing: boolean; lastSyncTime: string | null; lastReport: IngestionReport | null } {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
      lastReport: this.lastReport,
    };
  }

  /**
   * Returns top 10 live events using Phase 5 dynamic ranking & diversity engine
   */
  public async getTop10LiveEvents(regionFilter?: string): Promise<CanonicalEvent[]> {
    return RankingService.getTopRankedEvents({
      regionId: regionFilter,
      limit: 10,
    });
  }

  /**
   * Returns paginated events stream from database repository
   */
  public async getAllEvents(params?: {
    region?: string;
    category?: string;
    label?: string;
    search?: string;
    limit?: number;
  }): Promise<{ events: CanonicalEvent[]; total: number; lastSyncTime: string; isSyncing: boolean }> {
    const { events, total } = await EventRepository.findAll({
      regionId: params?.region,
      categoryId: params?.category,
      urgency: params?.label,
      search: params?.search,
      limit: params?.limit || 20,
    });

    return {
      events,
      total,
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : new Date().toISOString(),
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Returns a single canonical event by ID
   */
  public async getEventById(id: string): Promise<CanonicalEvent | null> {
    return EventRepository.findById(id);
  }

  /**
   * Backward-compatible syncAllFeeds helper
   */
  public async syncAllFeeds(): Promise<{ newCount: number; totalEvents: number }> {
    const report = await this.runIngestion();
    const { total } = await EventRepository.findAll({ limit: 1 });
    return {
      newCount: report.eventsCreated,
      totalEvents: total,
    };
  }
}

export type { CanonicalEvent } from '../types/index.js';
export const newsIngestionService = new NewsIngestionService();

