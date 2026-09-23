import { RANKING_CONFIG } from './rankingConfig.js';
import { TrendCalculator, TrendCalculationResult } from './trendCalculator.js';
import { ImportanceCalculator, ImportanceCalculationResult } from './importanceCalculator.js';
import { 
  CanonicalEvent, 
  Article, 
  RankingMetadata, 
  TrendStatus, 
  FreshnessState, 
  UrgencyLabel 
} from '../../types/index.js';
import { EventRepository } from '../../repositories/event.repository.js';
import { ArticleRepository } from '../../repositories/article.repository.js';

export interface RankOptions {
  limit?: number;
  regionId?: string;
  categoryId?: string;
  status?: string;
  applyDiversity?: boolean;
}

export class RankingService {
  private static isRefreshing = false;

  /**
   * Scores a single canonical event with trend detection, importance, recency, and ranking metadata.
   */
  public static scoreEvent(
    event: CanonicalEvent,
    articles: Article[] = [],
    now: Date = new Date()
  ): CanonicalEvent {
    // 1. Calculate Trend Sub-scores
    const trendRes: TrendCalculationResult = TrendCalculator.calculateTrend(event, articles, now);

    // 2. Calculate Deterministic Importance Sub-scores
    const impRes: ImportanceCalculationResult = ImportanceCalculator.calculateImportance(event, event.sources || []);

    // 3. Determine Freshness State
    let freshnessState: FreshnessState = 'STALE';
    if (trendRes.freshnessScore >= 100) {
      freshnessState = 'FRESH';
    } else if (trendRes.freshnessScore >= 50) {
      freshnessState = 'RECENT';
    } else if (trendRes.freshnessScore >= 25) {
      freshnessState = 'AGING';
    }

    // 4. Determine Breaking Status
    const isBreaking = 
      impRes.importanceScore >= RANKING_CONFIG.THRESHOLDS.BREAKING_MIN_IMPORTANCE &&
      trendRes.freshnessScore >= RANKING_CONFIG.THRESHOLDS.BREAKING_MIN_FRESHNESS &&
      trendRes.recencyScore >= RANKING_CONFIG.THRESHOLDS.BREAKING_MIN_RECENCY;

    // 5. Determine Trend Status
    let trendStatus: TrendStatus = 'NORMAL';
    if (trendRes.trendScore >= RANKING_CONFIG.THRESHOLDS.TRENDING_HIGH_MIN) {
      trendStatus = 'HIGHLY_TRENDING';
    } else if (trendRes.trendScore >= RANKING_CONFIG.THRESHOLDS.TRENDING_ACTIVE_MIN) {
      trendStatus = 'TRENDING';
    } else if (trendRes.trendScore >= RANKING_CONFIG.THRESHOLDS.TRENDING_RISING_MIN) {
      trendStatus = 'RISING';
    }

    // 6. Compute Final Rank Score (0-100)
    const w = RANKING_CONFIG.FINAL_RANK_WEIGHTS;
    let rawRank = 
      w.TREND * trendRes.trendScore +
      w.IMPORTANCE * impRes.importanceScore +
      w.RECENCY * trendRes.recencyScore +
      w.REGIONAL_RELEVANCE * impRes.regionalRelevanceScore;

    // Controlled ranking adjustments
    if (isBreaking) rawRank += 8;
    if (trendRes.independentSourceCount >= 3) rawRank += 4;

    const finalRankScore = Math.min(100, Math.max(0, Math.round(rawRank)));

    // 7. Structured Evidence Explanation (No AI Hallucinations)
    let explanation = `Verified event corroborated by ${trendRes.independentSourceCount} independent source(s).`;
    if (isBreaking) {
      explanation = `Breaking: High-impact developing event with updates in the last hour.`;
    } else if (trendStatus === 'HIGHLY_TRENDING' || trendStatus === 'TRENDING') {
      explanation = `Trending: Coverage increased across ${trendRes.independentSourceCount} independent publisher(s).`;
    } else if (impRes.importanceStatus === 'CRITICAL' || impRes.importanceStatus === 'IMPORTANT') {
      explanation = `Important: High-significance event affecting ${event.regionId || 'regional'} public interest.`;
    }

    // 8. Assign Canonical Urgency Label
    let urgencyLabel: UrgencyLabel = 'IMPORTANT';
    if (isBreaking) {
      urgencyLabel = 'BREAKING';
    } else if (trendStatus === 'TRENDING' || trendStatus === 'HIGHLY_TRENDING') {
      urgencyLabel = 'TRENDING';
    }

    const rankingMetadata: RankingMetadata = {
      trendScore: trendRes.trendScore,
      importanceScore: impRes.importanceScore,
      finalRankScore,
      velocityScore: trendRes.velocityScore,
      coverageScore: trendRes.coverageScore,
      recencyScore: trendRes.recencyScore,
      freshnessScore: trendRes.freshnessScore,
      spreadScore: trendRes.spreadScore,
      regionalRelevanceScore: impRes.regionalRelevanceScore,
      independentSourceCount: trendRes.independentSourceCount,
      trendStatus,
      importanceStatus: impRes.importanceStatus,
      breakingStatus: isBreaking,
      freshnessState,
      confidence: trendRes.confidence,
      explanation,
    };

    return {
      ...event,
      urgencyLabel,
      importanceScore: impRes.importanceScore,
      velocityScore: trendRes.velocityScore,
      trendScore: trendRes.trendScore,
      finalRankScore,
      rankingMetadata,
    };
  }

  /**
   * Sorts and selects Top Events with diversity controls and deterministic tie-breaking.
   */
  public static rankAndFilterEvents(
    events: CanonicalEvent[],
    options: RankOptions = {}
  ): CanonicalEvent[] {
    const { limit = 10, regionId, categoryId, status, applyDiversity = true } = options;

    let filtered = [...events];

    // Filter by Region
    if (regionId && regionId.toUpperCase() !== 'ALL') {
      const targetRegion = regionId.toLowerCase();
      filtered = filtered.filter((e) => (e.regionId || '').toLowerCase() === targetRegion || (e.region || '').toLowerCase() === targetRegion);
    }

    // Filter by Category
    if (categoryId && categoryId.toUpperCase() !== 'ALL') {
      const targetCategory = categoryId.toLowerCase();
      filtered = filtered.filter((e) => (e.categoryId || '').toLowerCase() === targetCategory || (e.category || '').toLowerCase() === targetCategory);
    }

    // Filter by Urgency/Status
    if (status && status.toUpperCase() !== 'ALL') {
      const targetStatus = status.toUpperCase();
      filtered = filtered.filter((e) => {
        if (targetStatus === 'BREAKING') return e.rankingMetadata?.breakingStatus || e.urgencyLabel === 'BREAKING';
        if (targetStatus === 'TRENDING') return e.rankingMetadata?.trendStatus === 'TRENDING' || e.rankingMetadata?.trendStatus === 'HIGHLY_TRENDING' || e.urgencyLabel === 'TRENDING';
        if (targetStatus === 'IMPORTANT') return e.rankingMetadata?.importanceStatus === 'IMPORTANT' || e.rankingMetadata?.importanceStatus === 'CRITICAL' || e.urgencyLabel === 'IMPORTANT';
        return true;
      });
    }

    // Deterministic Tie-Breaking Comparator
    filtered.sort((a, b) => {
      // 1. Final Rank Score
      if (b.finalRankScore !== a.finalRankScore) {
        return b.finalRankScore - a.finalRankScore;
      }
      // 2. Breaking Status
      const aBreaking = a.rankingMetadata?.breakingStatus ? 1 : 0;
      const bBreaking = b.rankingMetadata?.breakingStatus ? 1 : 0;
      if (bBreaking !== aBreaking) {
        return bBreaking - aBreaking;
      }
      // 3. Importance Score
      if (b.importanceScore !== a.importanceScore) {
        return b.importanceScore - a.importanceScore;
      }
      // 4. Recency Score
      const aRecency = a.rankingMetadata?.recencyScore || 0;
      const bRecency = b.rankingMetadata?.recencyScore || 0;
      if (bRecency !== aRecency) {
        return bRecency - aRecency;
      }
      // 5. Stable Event ID (Lexicographic Tie-Breaker)
      return a.id.localeCompare(b.id);
    });

    if (!applyDiversity) {
      return filtered.slice(0, limit);
    }

    // Diversity Control: Prevent over-concentration of a single category or single publisher in Top 10
    const categoryCounts: Record<string, number> = {};
    const publisherCounts: Record<string, number> = {};
    const MAX_PER_PUBLISHER_IN_TOP_10 = 4;
    const diverseResults: CanonicalEvent[] = [];
    const overflow: CanonicalEvent[] = [];

    for (const evt of filtered) {
      const cat = evt.categoryId || 'other';
      const pub = String((evt.metadata as any)?.initialSource || evt.sources?.[0]?.sourceName || 'unknown').toLowerCase();
      const catCount = categoryCounts[cat] || 0;
      const pubCount = publisherCounts[pub] || 0;

      const isCategoryAllowed = catCount < RANKING_CONFIG.DIVERSITY.MAX_PER_CATEGORY_IN_TOP_10;
      const isPublisherAllowed = pubCount < MAX_PER_PUBLISHER_IN_TOP_10;

      if (isCategoryAllowed && isPublisherAllowed) {
        diverseResults.push(evt);
        categoryCounts[cat] = catCount + 1;
        publisherCounts[pub] = pubCount + 1;
      } else {
        overflow.push(evt);
      }

      if (diverseResults.length >= limit) break;
    }

    // Fill remaining slots if needed from overflow
    if (diverseResults.length < limit && overflow.length > 0) {
      for (const ov of overflow) {
        if (!diverseResults.some((d) => d.id === ov.id)) {
          diverseResults.push(ov);
        }
        if (diverseResults.length >= limit) break;
      }
    }

    return diverseResults;
  }

  /**
   * Refreshes ranking scores across eligible canonical events in parallel batches.
   * Concurrency-guarded to prevent overlapping jobs.
   */
  public static async refreshScores(): Promise<{ updatedCount: number; durationMs: number }> {
    if (this.isRefreshing) {
      console.log('[RankingService] Score refresh already in progress, skipping concurrent run.');
      return { updatedCount: 0, durationMs: 0 };
    }

    this.isRefreshing = true;
    const startTime = Date.now();
    let updatedCount = 0;

    try {
      console.log('[RankingService] Starting ranking score refresh cycle...');

      // 1. Fetch eligible active canonical events (top 25 most recent within live window)
      const { events } = await EventRepository.findAll({ limit: 25, page: 1 });
      const now = new Date();

      // 2. Process in fast parallel batches of 5 to eliminate serial network latency
      for (let i = 0; i < events.length; i += 5) {
        const batch = events.slice(i, i + 5);
        await Promise.all(
          batch.map(async (event) => {
            try {
              const articles = event.articles || (await EventRepository.findArticlesByEventId(event.id));
              const scoredEvent = this.scoreEvent(event, articles, now);

              // Update database with new scores and ranking metadata
              await EventRepository.updateScores(
                scoredEvent.id,
                {
                  urgencyLabel: scoredEvent.urgencyLabel,
                  importanceScore: scoredEvent.importanceScore,
                  velocityScore: scoredEvent.velocityScore,
                  finalRankScore: scoredEvent.finalRankScore,
                  trendScore: scoredEvent.trendScore,
                },
                scoredEvent.rankingMetadata
              );

              // Record temporal trend observation
              if (scoredEvent.rankingMetadata) {
                await EventRepository.recordTrendObservation({
                  eventId: scoredEvent.id,
                  observedAt: now.toISOString(),
                  articleCount: articles.length,
                  independentSourceCount: scoredEvent.rankingMetadata.independentSourceCount,
                  trendScore: scoredEvent.rankingMetadata.trendScore,
                  importanceScore: scoredEvent.rankingMetadata.importanceScore,
                  velocityScore: scoredEvent.rankingMetadata.velocityScore,
                  coverageScore: scoredEvent.rankingMetadata.coverageScore,
                  recencyScore: scoredEvent.rankingMetadata.recencyScore,
                  freshnessScore: scoredEvent.rankingMetadata.freshnessScore,
                  spreadScore: scoredEvent.rankingMetadata.spreadScore,
                  finalRankScore: scoredEvent.rankingMetadata.finalRankScore,
                });
              }

              updatedCount++;
            } catch (err: any) {
              console.warn(`[RankingService] Error scoring event ${event.id}:`, err.message);
            }
          })
        );
      }
    } catch (err: any) {
      console.error('[RankingService] Error during score refresh:', err.message);
    } finally {
      this.isRefreshing = false;
      const durationMs = Date.now() - startTime;
      console.log(`[RankingService] Score refresh completed: ${updatedCount} events updated in ${durationMs}ms.`);
      return { updatedCount, durationMs };
    }
  }

  /**
   * Retrieves dynamically ranked Top Events.
   */
  public static async getTopRankedEvents(options: RankOptions = {}): Promise<CanonicalEvent[]> {
    const limit = Math.min(50, Math.max(1, options.limit || 10));

    // Fetch candidate events from repository
    const { events } = await EventRepository.findAll({
      regionId: options.regionId,
      categoryId: options.categoryId,
      limit: 20,
      page: 1,
    });

    const now = new Date();
    const scoredEvents: CanonicalEvent[] = [];

    for (const evt of events) {
      const articles = evt.articles || (await EventRepository.findArticlesByEventId(evt.id));
      const scored = this.scoreEvent(evt, articles, now);
      scoredEvents.push(scored);
    }

    return this.rankAndFilterEvents(scoredEvents, {
      ...options,
      limit,
    });
  }
}
