import { CanonicalEvent, Article, Source, CategoryCoverageReport } from '../types/index.js';
import { SourceRepository } from '../repositories/source.repository.js';
import { ArticleRepository } from '../repositories/article.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { sanitizeText } from '../utils/sanitize.js';
import { normalizeArticleUrl } from './ingestion/urlNormalizer.js';
import { validateArticle } from './ingestion/articleValidator.js';
import { classifyArticle } from './ingestion/classifier.js';
import { findMatchingCanonicalEvent } from './ingestion/eventMatcher.js';
import { feedFetcher } from './ingestion/feedFetcher.js';
import { quarantineManager } from './ingestion/quarantineManager.js';
import { categoryCoverageMonitor } from './ingestion/coverageMonitor.js';
import { RankingService } from './ranking/rankingService.js';

export interface IngestionReport {
  sourcesAttempted: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  sourcesQuarantined: number;
  articlesDiscovered: number;
  articlesAccepted: number;
  articlesRejected: number;
  duplicatesSkipped: number;
  eventsCreated: number;
  eventsUpdated: number;
  durationMs: number;
  timestamp: string;
  coverageReport?: CategoryCoverageReport;
}

const INGESTION_CONCURRENCY = parseInt(process.env.INGESTION_CONCURRENCY || '5', 10);

export class NewsIngestionService {
  private isSyncing = false;
  private lastSyncTime: Date | null = null;
  private lastReport: IngestionReport | null = null;

  /**
   * Primary ingestion pipeline orchestrator.
   * Pulls approved feeds with bounded concurrency (concurrency=5), normalizes, validates,
   * deduplicates, classifies, clusters canonical events, evaluates source health/quarantine,
   * and persists to PostgreSQL.
   */
  public async runIngestion(sourceFilterIds?: string[]): Promise<IngestionReport> {
    if (this.isSyncing) {
      console.log('[NewsIngestion] Ingestion cycle already in progress, skipping concurrent run.');
      return this.lastReport || {
        sourcesAttempted: 0,
        sourcesSucceeded: 0,
        sourcesFailed: 0,
        sourcesQuarantined: 0,
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
      sourcesQuarantined: 0,
      articlesDiscovered: 0,
      articlesAccepted: 0,
      articlesRejected: 0,
      duplicatesSkipped: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };

    console.log('[NewsIngestion] Starting real-world news ingestion cycle (concurrency = 5)...');

    try {
      // 1. Load active registered sources from database
      let sources = await SourceRepository.findAll({ includeInactive: false });
      if (sourceFilterIds && sourceFilterIds.length > 0) {
        sources = sources.filter((s) => sourceFilterIds.includes(s.id));
      }

      // Filter to sources having configured feed URLs and not locked in quarantine
      const feedSources = sources.filter((s) => s.feedUrl && s.feedUrl.trim().length > 0 && s.quarantineStatus !== 'QUARANTINED');
      report.sourcesAttempted = feedSources.length;

      // Whitelist of approved feed URLs for SSRF prevention
      const approvedFeedUrls = new Set(feedSources.map((s) => s.feedUrl as string));

      // 2. Pre-fetch recent canonical events for clustering pool (past 36 hours)
      const recentEventsPool: CanonicalEvent[] = await EventRepository.findRecentEventsForMatching(undefined, undefined, 36);

      // 3. Process feeds with bounded concurrency chunking
      for (let i = 0; i < feedSources.length; i += INGESTION_CONCURRENCY) {
        const batch = feedSources.slice(i, i + INGESTION_CONCURRENCY);

        await Promise.all(
          batch.map(async (source) => {
            const sourceStartTime = Date.now();
            const feedUrl = source.feedUrl as string;
            let sourceArticlesAccepted = 0;
            let sourceEventsCreated = 0;

            const fetchResult = await feedFetcher.fetchFeed(feedUrl, approvedFeedUrls);
            const responseTimeMs = Date.now() - sourceStartTime;

            if (!fetchResult.success) {
              const errorType = fetchResult.errorType || 'UNKNOWN';
              const errorMsg = fetchResult.error || 'Fetch error';
              const httpStatus = fetchResult.httpStatus || 0;

              console.warn(`[NewsIngestion] Source "${source.name}" (${source.id}) failed: ${errorMsg} (${errorType})`);

              // Record structured error log in database
              await SourceRepository.recordSourceError(
                source.id,
                errorType,
                errorMsg,
                httpStatus,
                responseTimeMs
              );

              // Evaluate for quarantine
              const quarantineDecision = quarantineManager.evaluateSource(source, errorType, errorMsg);
              if (quarantineDecision.shouldQuarantine) {
                console.warn(`[NewsIngestion] Quarantining source "${source.name}" (${source.id}): ${quarantineDecision.reason}`);
                await quarantineManager.quarantine(source.id, quarantineDecision.reason, quarantineDecision.retryIntervalMinutes);
                report.sourcesQuarantined++;
              }

              report.sourcesFailed++;
              return;
            }

            report.sourcesSucceeded++;
            report.articlesDiscovered += fetchResult.items.length;

            // Process articles for this source (top 15 newest items per cycle)
            const candidateItems = fetchResult.items.slice(0, 15);
            const urlsToCheck = candidateItems.map((item) => normalizeArticleUrl(item.link || '')).filter(Boolean);
            const existingUrlsSet = await ArticleRepository.findExistingUrls(urlsToCheck);

            for (const rawItem of candidateItems) {
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

              // 5. Fast batch deduplication check against database
              if (existingUrlsSet.has(normalizedUrl)) {
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

              // 7. Multi-Signal Canonical Event Matching with False-Merge Guardrails
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
              for (let j = 0; j < rawArtHash.length; j++) {
                hashVal = (hashVal << 5) - hashVal + rawArtHash.charCodeAt(j);
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
                sourceArticlesAccepted++;
              } else {
                // Create new canonical event
                const rawEvtHash = `${regionId}_${categoryId}_${cleanTitle.toLowerCase().slice(0, 40)}`;
                let evtHash = 0;
                for (let k = 0; k < rawEvtHash.length; k++) {
                  evtHash = (evtHash << 5) - evtHash + rawEvtHash.charCodeAt(k);
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
                    matchClassification: matchResult.classification,
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
                sourceArticlesAccepted++;
                sourceEventsCreated++;
              }
            }

            // Record successful source health & metrics
            await SourceRepository.updateSourceHealth(source.id, {
              success: true,
              articlesCount: sourceArticlesAccepted,
              eventsCount: sourceEventsCreated,
              responseTimeMs,
              httpStatus: 200,
            });
          })
        );
      }

      // 8. Generate Category Coverage Report
      report.coverageReport = await categoryCoverageMonitor.generateCoverageReport();
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
        `Failed: ${report.sourcesFailed}, Quarantined: ${report.sourcesQuarantined}, ` +
        `Discovered: ${report.articlesDiscovered}, Accepted: ${report.articlesAccepted}, ` +
        `Dupes: ${report.duplicatesSkipped}, Events Created: ${report.eventsCreated}, Events Updated: ${report.eventsUpdated}`
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
   * Generates a complete operational health and diagnostic telemetry report.
   */
  public async getOperationalHealth() {
    const sourceHealth = await SourceRepository.getSourceHealthReport();
    const quarantinedSources = await quarantineManager.getQuarantined();
    const coverage = await categoryCoverageMonitor.generateCoverageReport();

    return {
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
      lastSyncDurationMs: this.lastReport?.durationMs || 0,
      isSyncing: this.isSyncing,
      totalArticlesDiscovered: this.lastReport?.articlesDiscovered || 0,
      totalArticlesAccepted: this.lastReport?.articlesAccepted || 0,
      totalDuplicatesSuppressed: this.lastReport?.duplicatesSkipped || 0,
      totalEventsCreated: this.lastReport?.eventsCreated || 0,
      totalEventsUpdated: this.lastReport?.eventsUpdated || 0,
      sourcesHealth: sourceHealth,
      quarantinedCount: quarantinedSources.length,
      quarantinedList: quarantinedSources,
      coverage,
    };
  }

  /**
   * Returns top 10 live events using Phase 5 dynamic ranking & diversity engine
   */
  public async getTop10LiveEvents(
    options?: string | { region?: string; category?: string; status?: string; limit?: number }
  ): Promise<CanonicalEvent[]> {
    if (typeof options === 'string') {
      return RankingService.getTopRankedEvents({
        regionId: options,
        limit: 10,
      });
    }

    return RankingService.getTopRankedEvents({
      regionId: options?.region,
      categoryId: options?.category,
      status: options?.status,
      limit: options?.limit || 10,
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
