import { RANKING_CONFIG } from './rankingConfig.js';
import { CanonicalEvent, EventSource, Article, ConfidenceLevel } from '../../types/index.js';

export interface VelocityResult {
  velocityScore: number;
  confidence: ConfidenceLevel;
  currentWindowCount: number;
  previousWindowCount: number;
  isIncreasing: boolean;
}

export interface CoverageResult {
  coverageScore: number;
  independentSourceCount: number;
  uniquePublishers: string[];
}

export interface TrendCalculationResult {
  trendScore: number;
  velocityScore: number;
  coverageScore: number;
  recencyScore: number;
  freshnessScore: number;
  spreadScore: number;
  independentSourceCount: number;
  confidence: ConfidenceLevel;
}

export class TrendCalculator {
  /**
   * Calculates velocity by comparing article update counts across observation windows.
   * Safe bounded calculation with no division-by-zero risks.
   */
  public static calculateVelocity(
    articles: Article[] = [],
    eventCreatedAt: string,
    now: Date = new Date()
  ): VelocityResult {
    const nowMs = now.getTime();
    const currWindowStart = nowMs - RANKING_CONFIG.VELOCITY.CURRENT_WINDOW_HOURS * 3600 * 1000;
    const prevWindowStart = nowMs - (RANKING_CONFIG.VELOCITY.CURRENT_WINDOW_HOURS + RANKING_CONFIG.VELOCITY.PREVIOUS_WINDOW_HOURS) * 3600 * 1000;

    let currentWindowCount = 0;
    let previousWindowCount = 0;

    for (const art of articles) {
      const artTime = new Date(art.publishedAt || art.createdAt).getTime();
      if (artTime >= currWindowStart && artTime <= nowMs) {
        currentWindowCount++;
      } else if (artTime >= prevWindowStart && artTime < currWindowStart) {
        previousWindowCount++;
      }
    }

    // New event with limited activity: handle honestly without fabricating velocity
    const totalArticles = articles.length;
    const eventAgeHours = Math.max(0, (nowMs - new Date(eventCreatedAt).getTime()) / 3600000);

    if (totalArticles <= 1 && eventAgeHours < 2) {
      return {
        velocityScore: RANKING_CONFIG.VELOCITY.DEFAULT_BASE_SCORE,
        confidence: 'LOW',
        currentWindowCount,
        previousWindowCount,
        isIncreasing: false,
      };
    }

    // Smoothed bounded ratio calculation
    const smoothedRatio = (currentWindowCount + 0.5) / (previousWindowCount + 0.5);
    const logVal = Math.log2(smoothedRatio);
    
    // Normalization to 0-100 scale: ratio 1.0 -> 50, ratio >= 3.0 -> 100, ratio <= 0.33 -> ~10
    let score = Math.round(50 + 35 * logVal);

    // If no recent activity in either window but old articles exist, velocity is decayed
    if (currentWindowCount === 0 && previousWindowCount === 0) {
      score = Math.max(10, Math.round(50 - eventAgeHours * 1.5));
    }

    const boundedScore = Math.min(100, Math.max(0, score));
    const isIncreasing = currentWindowCount > previousWindowCount;
    const confidence: ConfidenceLevel = totalArticles >= 3 ? 'HIGH' : totalArticles >= 2 ? 'MEDIUM' : 'LOW';

    return {
      velocityScore: boundedScore,
      confidence,
      currentWindowCount,
      previousWindowCount,
      isIncreasing,
    };
  }

  /**
   * Independent Source Rule:
   * Deduplicates by sourceId or normalized sourceName.
   * Multiple articles from same publisher count as ONE independent source.
   */
  public static calculateCoverage(
    sources: EventSource[] = [],
    articles: Article[] = []
  ): CoverageResult {
    const uniquePublishers = new Set<string>();

    for (const s of sources) {
      const pubName = (s.sourceId || s.sourceName || '').trim().toLowerCase();
      if (pubName) uniquePublishers.add(pubName);
    }

    for (const a of articles) {
      const pubName = (a.sourceId || a.sourceName || '').trim().toLowerCase();
      if (pubName) uniquePublishers.add(pubName);
    }

    const independentSourceCount = Math.max(1, uniquePublishers.size);

    let coverageScore = RANKING_CONFIG.COVERAGE_SCORES.ONE_SOURCE;
    if (independentSourceCount === 2) {
      coverageScore = RANKING_CONFIG.COVERAGE_SCORES.TWO_SOURCES;
    } else if (independentSourceCount === 3) {
      coverageScore = RANKING_CONFIG.COVERAGE_SCORES.THREE_SOURCES;
    } else if (independentSourceCount >= 4) {
      coverageScore = RANKING_CONFIG.COVERAGE_SCORES.FOUR_PLUS_SOURCES;
    }

    return {
      coverageScore,
      independentSourceCount,
      uniquePublishers: Array.from(uniquePublishers),
    };
  }

  /**
   * Recency Score: Exponential decay R = 100 * e^(-0.10 * h)
   * where h = hours since latest meaningful update.
   */
  public static calculateRecency(lastUpdatedAt: string, now: Date = new Date()): number {
    const eventTime = new Date(lastUpdatedAt).getTime();
    const nowTime = now.getTime();
    const hours = Math.max(0, (nowTime - eventTime) / 3600000);

    const recency = 100 * Math.exp(-RANKING_CONFIG.RECENCY.LAMBDA * hours);
    return Math.min(100, Math.max(0, Math.round(recency)));
  }

  /**
   * Freshness Score: Step-function based on update age.
   * <1h = 100, 1-3h = 75, 3-6h = 50, 6-12h = 25, >12h = 0
   */
  public static calculateFreshness(lastUpdatedAt: string, now: Date = new Date()): number {
    const eventTime = new Date(lastUpdatedAt).getTime();
    const nowTime = now.getTime();
    const hours = Math.max(0, (nowTime - eventTime) / 3600000);

    for (const step of RANKING_CONFIG.FRESHNESS_THRESHOLDS) {
      if (hours < step.maxHours) {
        return step.score;
      }
    }
    return RANKING_CONFIG.FRESHNESS_DEFAULT_SCORE;
  }

  /**
   * Spread Score: Measures publisher tier diversity (Tier 1 + Tier 2 mix)
   * and multi-domain breadth without repeating independent source count.
   */
  public static calculateSpread(sources: EventSource[] = []): number {
    if (sources.length === 0) return 50;

    const tiers = new Set<number>();
    for (const s of sources) {
      if (s.tier) tiers.add(s.tier);
    }

    // Multi-tier corroboration (both Tier 1 national/wire + Tier 2 regional/specialist)
    if (tiers.has(1) && tiers.has(2)) {
      return 90;
    } else if (tiers.has(1)) {
      return 75;
    } else {
      return 50;
    }
  }

  /**
   * Computes the overall unified Trend Score (0-100).
   * TrendScore = 0.35 * Velocity + 0.25 * Coverage + 0.20 * Recency + 0.10 * Freshness + 0.10 * Spread
   */
  public static calculateTrend(
    event: CanonicalEvent,
    articles: Article[] = [],
    now: Date = new Date()
  ): TrendCalculationResult {
    const velocityRes = this.calculateVelocity(articles, event.firstPublishedAt || event.createdAt, now);
    const coverageRes = this.calculateCoverage(event.sources || [], articles);
    const recencyScore = this.calculateRecency(event.lastUpdatedAt || event.firstPublishedAt, now);
    const freshnessScore = this.calculateFreshness(event.lastUpdatedAt || event.firstPublishedAt, now);
    const spreadScore = this.calculateSpread(event.sources || []);

    const w = RANKING_CONFIG.TREND_WEIGHTS;
    const rawTrend = 
      w.VELOCITY * velocityRes.velocityScore +
      w.COVERAGE * coverageRes.coverageScore +
      w.RECENCY * recencyScore +
      w.FRESHNESS * freshnessScore +
      w.SPREAD * spreadScore;

    const trendScore = Math.min(100, Math.max(0, Math.round(rawTrend)));

    return {
      trendScore,
      velocityScore: velocityRes.velocityScore,
      coverageScore: coverageRes.coverageScore,
      recencyScore,
      freshnessScore,
      spreadScore,
      independentSourceCount: coverageRes.independentSourceCount,
      confidence: velocityRes.confidence,
    };
  }
}
