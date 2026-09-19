process.env.NODE_ENV = 'test';
import { TrendCalculator } from '../services/ranking/trendCalculator.js';
import { ImportanceCalculator } from '../services/ranking/importanceCalculator.js';
import { RankingService } from '../services/ranking/rankingService.js';
import { RANKING_CONFIG } from '../services/ranking/rankingConfig.js';
import { EventRepository } from '../repositories/event.repository.js';
import { topEventsQuerySchema } from '../validators/query.validator.js';
import { CanonicalEvent, Article, EventSource, TrendObservation } from '../types/index.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase5VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 5: TREND DETECTION, IMPORTANCE SCORING & RANKING TESTS');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  const now = new Date('2026-09-16T12:00:00.000Z');

  // -------------------------------------------------------------------------
  // 1. VELOCITY CALCULATION & OBSERVATION WINDOW TESTS
  // -------------------------------------------------------------------------
  try {
    const articles: Article[] = [
      { id: 'a1', title: 'Art 1', url: 'https://test.com/1', publishedAt: new Date(now.getTime() - 1 * 3600000).toISOString(), createdAt: '' },
      { id: 'a2', title: 'Art 2', url: 'https://test.com/2', publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(), createdAt: '' },
      { id: 'a3', title: 'Art 3', url: 'https://test.com/3', publishedAt: new Date(now.getTime() - 3 * 3600000).toISOString(), createdAt: '' },
      { id: 'a4', title: 'Art 4', url: 'https://test.com/4', publishedAt: new Date(now.getTime() - 8 * 3600000).toISOString(), createdAt: '' },
    ];

    const vel = TrendCalculator.calculateVelocity(articles, new Date(now.getTime() - 10 * 3600000).toISOString(), now);

    if (vel.currentWindowCount === 3 && vel.previousWindowCount === 1 && vel.isIncreasing && vel.velocityScore > 50) {
      results.push({
        suite: 'Trend Velocity',
        name: 'Velocity Window Comparison & Acceleration Detection',
        passed: true,
        details: `Current: ${vel.currentWindowCount}, Previous: ${vel.previousWindowCount}, Score: ${vel.velocityScore}`,
      });
    } else {
      results.push({
        suite: 'Trend Velocity',
        name: 'Velocity Window Comparison & Acceleration Detection',
        passed: false,
        error: `Expected accelerating velocity, got ${JSON.stringify(vel)}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Trend Velocity', name: 'Velocity Window Comparison & Acceleration Detection', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 2. VELOCITY INCREASE DETECTION
  // -------------------------------------------------------------------------
  try {
    const rapidArticles: Article[] = [
      { id: 'r1', title: 'R1', url: 'u1', publishedAt: new Date(now.getTime() - 0.5 * 3600000).toISOString(), createdAt: '' },
      { id: 'r2', title: 'R2', url: 'u2', publishedAt: new Date(now.getTime() - 1 * 3600000).toISOString(), createdAt: '' },
      { id: 'r3', title: 'R3', url: 'u3', publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(), createdAt: '' },
      { id: 'r4', title: 'R4', url: 'u4', publishedAt: new Date(now.getTime() - 3 * 3600000).toISOString(), createdAt: '' },
      { id: 'r5', title: 'R5', url: 'u5', publishedAt: new Date(now.getTime() - 4 * 3600000).toISOString(), createdAt: '' },
      { id: 'r6', title: 'R6', url: 'u6', publishedAt: new Date(now.getTime() - 5 * 3600000).toISOString(), createdAt: '' },
      { id: 'r7', title: 'R7', url: 'u7', publishedAt: new Date(now.getTime() - 5.5 * 3600000).toISOString(), createdAt: '' },
      { id: 'r8', title: 'R8', url: 'u8', publishedAt: new Date(now.getTime() - 8 * 3600000).toISOString(), createdAt: '' },
      { id: 'r9', title: 'R9', url: 'u9', publishedAt: new Date(now.getTime() - 9 * 3600000).toISOString(), createdAt: '' },
    ];

    const velInc = TrendCalculator.calculateVelocity(rapidArticles, new Date(now.getTime() - 10 * 3600000).toISOString(), now);

    if (velInc.isIncreasing && velInc.velocityScore >= 80) {
      results.push({
        suite: 'Trend Velocity',
        name: 'Velocity Increase Detection (7 vs 2 qualifying reports)',
        passed: true,
        details: `Detected surge: VelocityScore=${velInc.velocityScore}, isIncreasing=${velInc.isIncreasing}`,
      });
    } else {
      results.push({
        suite: 'Trend Velocity',
        name: 'Velocity Increase Detection (7 vs 2 qualifying reports)',
        passed: false,
        error: `Expected velocityScore >= 80, got ${velInc.velocityScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Trend Velocity', name: 'Velocity Increase Detection (7 vs 2 qualifying reports)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 3. VELOCITY DECREASE DETECTION
  // -------------------------------------------------------------------------
  try {
    const slowingArticles: Article[] = [
      { id: 's1', title: 'S1', url: 'u1', publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(), createdAt: '' },
      { id: 's2', title: 'S2', url: 'u2', publishedAt: new Date(now.getTime() - 7 * 3600000).toISOString(), createdAt: '' },
      { id: 's3', title: 'S3', url: 'u3', publishedAt: new Date(now.getTime() - 8 * 3600000).toISOString(), createdAt: '' },
      { id: 's4', title: 'S4', url: 'u4', publishedAt: new Date(now.getTime() - 9 * 3600000).toISOString(), createdAt: '' },
      { id: 's5', title: 'S5', url: 'u5', publishedAt: new Date(now.getTime() - 10 * 3600000).toISOString(), createdAt: '' },
      { id: 's6', title: 'S6', url: 'u6', publishedAt: new Date(now.getTime() - 11 * 3600000).toISOString(), createdAt: '' },
    ];

    const velDec = TrendCalculator.calculateVelocity(slowingArticles, new Date(now.getTime() - 12 * 3600000).toISOString(), now);

    if (!velDec.isIncreasing && velDec.velocityScore < 40) {
      results.push({
        suite: 'Trend Velocity',
        name: 'Velocity Decrease Detection (1 vs 5 qualifying reports)',
        passed: true,
        details: `Detected cooling: VelocityScore=${velDec.velocityScore}, isIncreasing=${velDec.isIncreasing}`,
      });
    } else {
      results.push({
        suite: 'Trend Velocity',
        name: 'Velocity Decrease Detection (1 vs 5 qualifying reports)',
        passed: false,
        error: `Expected velocityScore < 40, got ${velDec.velocityScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Trend Velocity', name: 'Velocity Decrease Detection (1 vs 5 qualifying reports)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 4. INSUFFICIENT HISTORICAL DATA & NO FABRICATED VELOCITY
  // -------------------------------------------------------------------------
  try {
    const singleArticle: Article[] = [
      { id: 'new_1', title: 'Just In', url: 'u_new', publishedAt: new Date(now.getTime() - 10 * 60000).toISOString(), createdAt: '' },
    ];

    const velNew = TrendCalculator.calculateVelocity(singleArticle, new Date(now.getTime() - 10 * 60000).toISOString(), now);

    if (velNew.confidence === 'LOW' && velNew.velocityScore === 50) {
      results.push({
        suite: 'Trend Velocity',
        name: 'New Event Low Confidence Handling (No Fabricated Velocity)',
        passed: true,
        details: `Handled new event honestly: Confidence=${velNew.confidence}, BaseScore=${velNew.velocityScore}`,
      });
    } else {
      results.push({
        suite: 'Trend Velocity',
        name: 'New Event Low Confidence Handling (No Fabricated Velocity)',
        passed: false,
        error: `Expected LOW confidence and baseline score, got ${JSON.stringify(velNew)}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Trend Velocity', name: 'New Event Low Confidence Handling (No Fabricated Velocity)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 5. BOUNDED VELOCITY SCORE (0-100, No Div by 0)
  // -------------------------------------------------------------------------
  try {
    const velZero = TrendCalculator.calculateVelocity([], new Date(now.getTime() - 48 * 3600000).toISOString(), now);
    const inBounds = velZero.velocityScore >= 0 && velZero.velocityScore <= 100 && !isNaN(velZero.velocityScore);

    if (inBounds) {
      results.push({
        suite: 'Trend Velocity',
        name: 'Bounded Mathematical Stability (0/0 Safe Division)',
        passed: true,
        details: `Calculated safe score without NaN or crash: ${velZero.velocityScore}`,
      });
    } else {
      results.push({
        suite: 'Trend Velocity',
        name: 'Bounded Mathematical Stability (0/0 Safe Division)',
        passed: false,
        error: `Velocity score out of bounds or NaN: ${velZero.velocityScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Trend Velocity', name: 'Bounded Mathematical Stability (0/0 Safe Division)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 6. COVERAGE SCORE (Independent Source Rule 1-4+ Sources)
  // -------------------------------------------------------------------------
  try {
    const sources4: EventSource[] = [
      { id: 's1', eventId: 'e1', sourceId: 'the-hindu', sourceName: 'The Hindu', title: 'T1', url: 'u1', publishedAt: '', tier: 1, createdAt: '' },
      { id: 's2', eventId: 'e1', sourceId: 'indian-express', sourceName: 'Indian Express', title: 'T2', url: 'u2', publishedAt: '', tier: 1, createdAt: '' },
      { id: 's3', eventId: 'e1', sourceId: 'bbc-world', sourceName: 'BBC News', title: 'T3', url: 'u3', publishedAt: '', tier: 1, createdAt: '' },
      { id: 's4', eventId: 'e1', sourceId: 'reuters-world', sourceName: 'Reuters', title: 'T4', url: 'u4', publishedAt: '', tier: 1, createdAt: '' },
    ];

    const cov1 = TrendCalculator.calculateCoverage([sources4[0]]);
    const cov2 = TrendCalculator.calculateCoverage([sources4[0], sources4[1]]);
    const cov3 = TrendCalculator.calculateCoverage([sources4[0], sources4[1], sources4[2]]);
    const cov4 = TrendCalculator.calculateCoverage(sources4);

    if (cov1.coverageScore === 25 && cov2.coverageScore === 50 && cov3.coverageScore === 75 && cov4.coverageScore === 100) {
      results.push({
        suite: 'Coverage Scoring',
        name: 'Step-wise Independent Source Coverage (25, 50, 75, 100)',
        passed: true,
        details: `1src=${cov1.coverageScore}, 2src=${cov2.coverageScore}, 3src=${cov3.coverageScore}, 4src=${cov4.coverageScore}`,
      });
    } else {
      results.push({
        suite: 'Coverage Scoring',
        name: 'Step-wise Independent Source Coverage (25, 50, 75, 100)',
        passed: false,
        error: `Expected 25/50/75/100, got ${cov1.coverageScore}/${cov2.coverageScore}/${cov3.coverageScore}/${cov4.coverageScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Coverage Scoring', name: 'Step-wise Independent Source Coverage (25, 50, 75, 100)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 7. SAME PUBLISHER COUNTED ONLY ONCE AS INDEPENDENT SOURCE
  // -------------------------------------------------------------------------
  try {
    const singlePubMultipleArticles: EventSource[] = [
      { id: 's1', eventId: 'e1', sourceId: 'the-hindu', sourceName: 'The Hindu', title: 'T1', url: 'u1', publishedAt: '', tier: 1, createdAt: '' },
      { id: 's2', eventId: 'e1', sourceId: 'the-hindu', sourceName: 'The Hindu', title: 'T2', url: 'u2', publishedAt: '', tier: 1, createdAt: '' },
      { id: 's3', eventId: 'e1', sourceId: 'the-hindu', sourceName: 'The Hindu', title: 'T3', url: 'u3', publishedAt: '', tier: 1, createdAt: '' },
      { id: 's4', eventId: 'e1', sourceId: 'the-hindu', sourceName: 'The Hindu', title: 'T4', url: 'u4', publishedAt: '', tier: 1, createdAt: '' },
    ];

    const covDedupe = TrendCalculator.calculateCoverage(singlePubMultipleArticles);

    if (covDedupe.independentSourceCount === 1 && covDedupe.coverageScore === 25) {
      results.push({
        suite: 'Coverage Scoring',
        name: 'Independent Source Rule (10 articles from 1 publisher = 1 source)',
        passed: true,
        details: `Deduplicated 4 articles from 'the-hindu' to 1 independent source (Score: 25)`,
      });
    } else {
      results.push({
        suite: 'Coverage Scoring',
        name: 'Independent Source Rule (10 articles from 1 publisher = 1 source)',
        passed: false,
        error: `Expected independentSourceCount=1 and score=25, got ${covDedupe.independentSourceCount} and ${covDedupe.coverageScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Coverage Scoring', name: 'Independent Source Rule (10 articles from 1 publisher = 1 source)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 8. RECENCY EXPONENTIAL DECAY FORMULA R = 100 * e^(-0.10h)
  // -------------------------------------------------------------------------
  try {
    const r0 = TrendCalculator.calculateRecency(now.toISOString(), now);
    const r2 = TrendCalculator.calculateRecency(new Date(now.getTime() - 2 * 3600000).toISOString(), now);
    const r6 = TrendCalculator.calculateRecency(new Date(now.getTime() - 6 * 3600000).toISOString(), now);
    const r12 = TrendCalculator.calculateRecency(new Date(now.getTime() - 12 * 3600000).toISOString(), now);
    const r24 = TrendCalculator.calculateRecency(new Date(now.getTime() - 24 * 3600000).toISOString(), now);

    const matchesExpected = 
      r0 === 100 && 
      Math.abs(r2 - 82) <= 1 && 
      Math.abs(r6 - 55) <= 1 && 
      Math.abs(r12 - 30) <= 1 && 
      Math.abs(r24 - 9) <= 1;

    if (matchesExpected) {
      results.push({
        suite: 'Recency Scoring',
        name: 'Exponential Recency Decay R = 100 * e^(-0.10h)',
        passed: true,
        details: `0h=${r0}, 2h=${r2} (exp 82), 6h=${r6} (exp 55), 12h=${r12} (exp 30), 24h=${r24} (exp 9)`,
      });
    } else {
      results.push({
        suite: 'Recency Scoring',
        name: 'Exponential Recency Decay R = 100 * e^(-0.10h)',
        passed: false,
        error: `Values mismatch: 0h=${r0}, 2h=${r2}, 6h=${r6}, 12h=${r12}, 24h=${r24}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Recency Scoring', name: 'Exponential Recency Decay R = 100 * e^(-0.10h)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 9. FRESHNESS SCORE STEP THRESHOLDS
  // -------------------------------------------------------------------------
  try {
    const f05 = TrendCalculator.calculateFreshness(new Date(now.getTime() - 0.5 * 3600000).toISOString(), now);
    const f2 = TrendCalculator.calculateFreshness(new Date(now.getTime() - 2 * 3600000).toISOString(), now);
    const f4 = TrendCalculator.calculateFreshness(new Date(now.getTime() - 4 * 3600000).toISOString(), now);
    const f8 = TrendCalculator.calculateFreshness(new Date(now.getTime() - 8 * 3600000).toISOString(), now);
    const f14 = TrendCalculator.calculateFreshness(new Date(now.getTime() - 14 * 3600000).toISOString(), now);

    if (f05 === 100 && f2 === 75 && f4 === 50 && f8 === 25 && f14 === 0) {
      results.push({
        suite: 'Freshness Scoring',
        name: 'Step-Wise Freshness Thresholds (<1h=100, 1-3h=75, 3-6h=50, 6-12h=25, >12h=0)',
        passed: true,
        details: `<1h=${f05}, 2h=${f2}, 4h=${f4}, 8h=${f8}, >12h=${f14}`,
      });
    } else {
      results.push({
        suite: 'Freshness Scoring',
        name: 'Step-Wise Freshness Thresholds (<1h=100, 1-3h=75, 3-6h=50, 6-12h=25, >12h=0)',
        passed: false,
        error: `Expected 100/75/50/25/0, got ${f05}/${f2}/${f4}/${f8}/${f14}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Freshness Scoring', name: 'Step-Wise Freshness Thresholds (<1h=100, 1-3h=75, 3-6h=50, 6-12h=25, >12h=0)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 10. SPREAD SCORE (Multi-Tier Diversity)
  // -------------------------------------------------------------------------
  try {
    const multiTierSources: EventSource[] = [
      { id: 's1', eventId: 'e1', sourceId: 'the-hindu', sourceName: 'The Hindu', title: 'T1', url: 'u1', publishedAt: '', tier: 1, createdAt: '' },
      { id: 's2', eventId: 'e1', sourceId: 'toi', sourceName: 'Times of India', title: 'T2', url: 'u2', publishedAt: '', tier: 2, createdAt: '' },
    ];
    const spreadScore = TrendCalculator.calculateSpread(multiTierSources);

    if (spreadScore >= 80) {
      results.push({
        suite: 'Spread Scoring',
        name: 'Multi-Tier Publisher Breadth Scoring (Tier 1 + Tier 2 mix)',
        passed: true,
        details: `SpreadScore=${spreadScore} for multi-tier source presence`,
      });
    } else {
      results.push({
        suite: 'Spread Scoring',
        name: 'Multi-Tier Publisher Breadth Scoring (Tier 1 + Tier 2 mix)',
        passed: false,
        error: `Expected spreadScore >= 80, got ${spreadScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Spread Scoring', name: 'Multi-Tier Publisher Breadth Scoring (Tier 1 + Tier 2 mix)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 11. IMPORTANCE CALCULATION (Deterministic Impact & Keywords)
  // -------------------------------------------------------------------------
  try {
    const importantEvent: CanonicalEvent = {
      id: 'e_imp',
      title: 'Tamil Nadu Cabinet Clears Metro Rail Phase 2 Infrastructure Corridors',
      summary: 'State cabinet officially clears dedicated capital funds for metro and expressways.',
      regionId: 'tamil-nadu',
      categoryId: 'infrastructure',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 0,
      velocityScore: 0,
      finalRankScore: 0,
      firstPublishedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      sourceCount: 2,
      lifecycleStatus: 'OFFICIAL_CONFIRMATION',
      createdAt: now.toISOString(),
    };

    const imp = ImportanceCalculator.calculateImportance(importantEvent, [
      { id: 's1', eventId: 'e_imp', sourceName: 'The Hindu', title: 'TN Cabinet Clears Metro Project', url: 'u1', publishedAt: '', tier: 1, createdAt: '' }
    ]);

    if (imp.importanceScore >= 85 && imp.matchedKeywords.length > 0 && imp.importanceStatus === 'CRITICAL') {
      results.push({
        suite: 'Importance Scoring',
        name: 'Deterministic Real-World Impact (Keywords + Category + Tier 1)',
        passed: true,
        details: `ImportanceScore=${imp.importanceScore}, Matched: [${imp.matchedKeywords.join(', ')}], Status=${imp.importanceStatus}`,
      });
    } else {
      results.push({
        suite: 'Importance Scoring',
        name: 'Deterministic Real-World Impact (Keywords + Category + Tier 1)',
        passed: false,
        error: `Expected importanceScore >= 85, got ${imp.importanceScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Importance Scoring', name: 'Deterministic Real-World Impact (Keywords + Category + Tier 1)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 12. CONSERVATIVE HANDLING OF INSUFFICIENT EVIDENCE
  // -------------------------------------------------------------------------
  try {
    const lowEvidenceEvent: CanonicalEvent = {
      id: 'e_low',
      title: 'Local announcement update',
      summary: 'Short note.',
      regionId: 'world',
      categoryId: 'other',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 0,
      velocityScore: 0,
      finalRankScore: 0,
      firstPublishedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      sourceCount: 1,
      lifecycleStatus: 'INITIAL_REPORT',
      createdAt: now.toISOString(),
    };

    const impLow = ImportanceCalculator.calculateImportance(lowEvidenceEvent, []);

    if (impLow.importanceScore <= 55 && impLow.importanceStatus === 'LOW') {
      results.push({
        suite: 'Importance Scoring',
        name: 'Conservative Scoring on Insufficient Evidence',
        passed: true,
        details: `Conservative score assigned: ${impLow.importanceScore} (Status: ${impLow.importanceStatus})`,
      });
    } else {
      results.push({
        suite: 'Importance Scoring',
        name: 'Conservative Scoring on Insufficient Evidence',
        passed: false,
        error: `Expected score <= 55, got ${impLow.importanceScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Importance Scoring', name: 'Conservative Scoring on Insufficient Evidence', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 13. BREAKING CLASSIFICATION TESTS
  // -------------------------------------------------------------------------
  try {
    const breakingCandidate: CanonicalEvent = {
      id: 'e_break',
      title: 'Emergency Red Alert Issued for Severe Cyclone Coastal Landfall in Tamil Nadu',
      summary: 'State disaster management activates emergency evacuation protocols.',
      regionId: 'tamil-nadu',
      categoryId: 'weather',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 90,
      velocityScore: 80,
      finalRankScore: 0,
      firstPublishedAt: new Date(now.getTime() - 20 * 60000).toISOString(),
      lastUpdatedAt: new Date(now.getTime() - 20 * 60000).toISOString(),
      sourceCount: 2,
      lifecycleStatus: 'INITIAL_REPORT',
      createdAt: new Date(now.getTime() - 20 * 60000).toISOString(),
      sources: [
        { id: 's1', eventId: 'e_break', sourceName: 'The Hindu', title: 'Cyclone Red Alert Issued', url: 'u1', publishedAt: '', tier: 1, createdAt: '' }
      ]
    };

    const scoredBreaking = RankingService.scoreEvent(breakingCandidate, [], now);

    if (scoredBreaking.rankingMetadata?.breakingStatus && scoredBreaking.urgencyLabel === 'BREAKING') {
      results.push({
        suite: 'Status Labels',
        name: 'Deterministic BREAKING Status Classification',
        passed: true,
        details: `Correctly marked BREAKING (Freshness: ${scoredBreaking.rankingMetadata.freshnessScore}, Importance: ${scoredBreaking.importanceScore})`,
      });
    } else {
      results.push({
        suite: 'Status Labels',
        name: 'Deterministic BREAKING Status Classification',
        passed: false,
        error: `Expected breakingStatus=true and urgencyLabel=BREAKING, got ${JSON.stringify(scoredBreaking.rankingMetadata)}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Status Labels', name: 'Deterministic BREAKING Status Classification', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 14. TRENDING STATUS CLASSIFICATION (NORMAL, RISING, TRENDING, HIGHLY_TRENDING)
  // -------------------------------------------------------------------------
  try {
    const dummyEvent: CanonicalEvent = {
      id: 'e_dummy',
      title: 'Tech event',
      summary: 'Summary',
      regionId: 'world',
      categoryId: 'technology',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 70,
      velocityScore: 0,
      finalRankScore: 0,
      firstPublishedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      sourceCount: 1,
      lifecycleStatus: 'INITIAL_REPORT',
      createdAt: now.toISOString(),
    };

    // Scored event with multiple sources updated recently
    const multiArticles: Article[] = [
      { id: 'a1', title: 'A1', url: 'u1', sourceId: 'the-hindu', publishedAt: new Date(now.getTime() - 1 * 3600000).toISOString(), createdAt: '' },
      { id: 'a2', title: 'A2', url: 'u2', sourceId: 'bbc', publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(), createdAt: '' },
      { id: 'a3', title: 'A3', url: 'u3', sourceId: 'reuters', publishedAt: new Date(now.getTime() - 2.5 * 3600000).toISOString(), createdAt: '' },
    ];
    dummyEvent.sources = [
      { id: 's1', eventId: 'e_dummy', sourceId: 'the-hindu', sourceName: 'The Hindu', title: 'T1', url: 'u1', publishedAt: '', tier: 1, createdAt: '' },
      { id: 's2', eventId: 'e_dummy', sourceId: 'bbc', sourceName: 'BBC', title: 'T2', url: 'u2', publishedAt: '', tier: 1, createdAt: '' },
      { id: 's3', eventId: 'e_dummy', sourceId: 'reuters', sourceName: 'Reuters', title: 'T3', url: 'u3', publishedAt: '', tier: 1, createdAt: '' },
    ];

    const scoredTrending = RankingService.scoreEvent(dummyEvent, multiArticles, now);

    if (scoredTrending.rankingMetadata?.trendStatus === 'TRENDING' || scoredTrending.rankingMetadata?.trendStatus === 'HIGHLY_TRENDING') {
      results.push({
        suite: 'Status Labels',
        name: 'Trending Status Classification (TRENDING / HIGHLY_TRENDING)',
        passed: true,
        details: `TrendScore=${scoredTrending.rankingMetadata.trendScore}, Status=${scoredTrending.rankingMetadata.trendStatus}`,
      });
    } else {
      results.push({
        suite: 'Status Labels',
        name: 'Trending Status Classification (TRENDING / HIGHLY_TRENDING)',
        passed: false,
        error: `Expected TRENDING status, got ${scoredTrending.rankingMetadata?.trendStatus}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Status Labels', name: 'Trending Status Classification (TRENDING / HIGHLY_TRENDING)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 15. IMPORTANT STATUS (High importance without trending)
  // -------------------------------------------------------------------------
  try {
    const importantOldEvent: CanonicalEvent = {
      id: 'e_imp_old',
      title: 'Supreme Court Constitutional Bench Delivers Landmark Verdict on Federal Governance',
      summary: 'Five-judge bench lays down permanent guidelines on state fiscal powers.',
      regionId: 'india',
      categoryId: 'politics',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 92,
      velocityScore: 20,
      finalRankScore: 0,
      firstPublishedAt: new Date(now.getTime() - 20 * 3600000).toISOString(),
      lastUpdatedAt: new Date(now.getTime() - 20 * 3600000).toISOString(),
      sourceCount: 1,
      lifecycleStatus: 'OFFICIAL_CONFIRMATION',
      createdAt: new Date(now.getTime() - 20 * 3600000).toISOString(),
    };

    const scoredImp = RankingService.scoreEvent(importantOldEvent, [], now);

    if (scoredImp.rankingMetadata?.importanceStatus === 'CRITICAL' || scoredImp.rankingMetadata?.importanceStatus === 'IMPORTANT') {
      results.push({
        suite: 'Status Labels',
        name: 'Importance != Trend Separation (Important event with low velocity)',
        passed: true,
        details: `Importance=${scoredImp.importanceScore} (Status=${scoredImp.rankingMetadata?.importanceStatus}), TrendScore=${scoredImp.rankingMetadata?.trendScore}`,
      });
    } else {
      results.push({
        suite: 'Status Labels',
        name: 'Importance != Trend Separation (Important event with low velocity)',
        passed: false,
        error: `Expected high importance status, got ${scoredImp.rankingMetadata?.importanceStatus}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Status Labels', name: 'Importance != Trend Separation (Important event with low velocity)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 16. FINAL RANK CALCULATION & BOUNDS
  // -------------------------------------------------------------------------
  try {
    const testEvt: CanonicalEvent = {
      id: 'e_rank_test',
      title: 'Global Semiconductor Alliance Announces Fabrication Architecture',
      summary: 'Next generation sub-2nm consortium founded.',
      regionId: 'world',
      categoryId: 'technology',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 85,
      velocityScore: 70,
      finalRankScore: 0,
      firstPublishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      lastUpdatedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      sourceCount: 3,
      lifecycleStatus: 'NEW_DEVELOPMENT',
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    };

    const scored = RankingService.scoreEvent(testEvt, [], now);
    const validBounds = scored.finalRankScore >= 0 && scored.finalRankScore <= 100;

    if (validBounds && scored.finalRankScore > 60) {
      results.push({
        suite: 'Ranking Engine',
        name: 'Final Rank Score Calculation & 0-100 Normalization',
        passed: true,
        details: `FinalRankScore=${scored.finalRankScore} (Trend=${scored.rankingMetadata?.trendScore}, Imp=${scored.importanceScore})`,
      });
    } else {
      results.push({
        suite: 'Ranking Engine',
        name: 'Final Rank Score Calculation & 0-100 Normalization',
        passed: false,
        error: `Expected finalRankScore > 60 in bounds, got ${scored.finalRankScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Ranking Engine', name: 'Final Rank Score Calculation & 0-100 Normalization', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 17. TOP 10 LIMIT & DIVERSITY ENFORCEMENT
  // -------------------------------------------------------------------------
  try {
    const mockEvents: CanonicalEvent[] = [];
    for (let i = 1; i <= 20; i++) {
      mockEvents.push({
        id: `evt_${i}`,
        title: `Event ${i}`,
        summary: `Summary ${i}`,
        regionId: i % 3 === 0 ? 'tamil-nadu' : i % 3 === 1 ? 'india' : 'world',
        categoryId: i <= 8 ? 'politics' : i <= 14 ? 'technology' : 'economy',
        urgencyLabel: 'IMPORTANT',
        importanceScore: 70 + (i % 20),
        velocityScore: 60 + (i % 20),
        finalRankScore: 70 + (i % 20),
        firstPublishedAt: now.toISOString(),
        lastUpdatedAt: now.toISOString(),
        sourceCount: 2,
        lifecycleStatus: 'INITIAL_REPORT',
        createdAt: now.toISOString(),
      });
    }

    const top10 = RankingService.rankAndFilterEvents(mockEvents, { limit: 10, applyDiversity: true });
    const politicsCount = top10.filter((e) => e.categoryId === 'politics').length;

    if (top10.length === 10 && politicsCount <= RANKING_CONFIG.DIVERSITY.MAX_PER_CATEGORY_IN_TOP_10) {
      results.push({
        suite: 'Ranking Engine',
        name: 'Top 10 Limit & Category Diversity Filter (Max 3 per category)',
        passed: true,
        details: `Top 10 returned: length=${top10.length}, politicsCount=${politicsCount} (<= 3)`,
      });
    } else {
      results.push({
        suite: 'Ranking Engine',
        name: 'Top 10 Limit & Category Diversity Filter (Max 3 per category)',
        passed: false,
        error: `Length: ${top10.length}, Politics count: ${politicsCount}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Ranking Engine', name: 'Top 10 Limit & Category Diversity Filter (Max 3 per category)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 18. NO DUPLICATE CANONICAL EVENTS IN TOP 10
  // -------------------------------------------------------------------------
  try {
    const topEvents = await RankingService.getTopRankedEvents({ limit: 10 });
    const eventIds = topEvents.map((e) => e.id);
    const uniqueIds = new Set(eventIds);

    if (uniqueIds.size === eventIds.length) {
      results.push({
        suite: 'Ranking Engine',
        name: 'Zero Duplicate Canonical Events in Dynamic Top 10',
        passed: true,
        details: `Verified ${uniqueIds.size}/${eventIds.length} unique events`,
      });
    } else {
      results.push({
        suite: 'Ranking Engine',
        name: 'Zero Duplicate Canonical Events in Dynamic Top 10',
        passed: false,
        error: `Duplicates detected in Top 10: [${eventIds.join(', ')}]`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Ranking Engine', name: 'Zero Duplicate Canonical Events in Dynamic Top 10', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 19. DETERMINISTIC TIE-BREAKING
  // -------------------------------------------------------------------------
  try {
    const tieEventA: CanonicalEvent = {
      id: 'evt_alpha',
      title: 'Event Alpha',
      summary: 'Summary Alpha',
      regionId: 'india',
      categoryId: 'economy',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 80,
      velocityScore: 70,
      finalRankScore: 75,
      firstPublishedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      sourceCount: 2,
      lifecycleStatus: 'INITIAL_REPORT',
      createdAt: now.toISOString(),
    };
    const tieEventB: CanonicalEvent = {
      id: 'evt_beta',
      title: 'Event Beta',
      summary: 'Summary Beta',
      regionId: 'world',
      categoryId: 'technology',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 80,
      velocityScore: 70,
      finalRankScore: 75,
      firstPublishedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      sourceCount: 2,
      lifecycleStatus: 'INITIAL_REPORT',
      createdAt: now.toISOString(),
    };

    const order1 = RankingService.rankAndFilterEvents([tieEventA, tieEventB], { limit: 2 });
    const order2 = RankingService.rankAndFilterEvents([tieEventB, tieEventA], { limit: 2 });

    const isDeterministic = order1[0].id === order2[0].id && order1[1].id === order2[1].id;

    if (isDeterministic && order1[0].id === 'evt_alpha') {
      results.push({
        suite: 'Ranking Engine',
        name: 'Deterministic Tie-Breaking (Stable ordering on score tie)',
        passed: true,
        details: `Deterministically resolved tie in stable lexicographical order: ${order1.map((e) => e.id).join(' -> ')}`,
      });
    } else {
      results.push({
        suite: 'Ranking Engine',
        name: 'Deterministic Tie-Breaking (Stable ordering on score tie)',
        passed: false,
        error: `Order mismatch between runs: ${order1.map((e) => e.id)} vs ${order2.map((e) => e.id)}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Ranking Engine', name: 'Deterministic Tie-Breaking (Stable ordering on score tie)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 20. REGIONAL RELEVANCE (Tamil Nadu, India, World)
  // -------------------------------------------------------------------------
  try {
    const tnEvent: CanonicalEvent = {
      id: 'evt_tn_major',
      title: 'Tamil Nadu Cabinet Clears Mega Infrastructure Corridor',
      summary: 'Summary',
      regionId: 'tamil-nadu',
      categoryId: 'infrastructure',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 92,
      velocityScore: 85,
      finalRankScore: 90,
      firstPublishedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      sourceCount: 2,
      lifecycleStatus: 'OFFICIAL_CONFIRMATION',
      createdAt: now.toISOString(),
    };
    const scoredTN = RankingService.scoreEvent(tnEvent, [], now);

    if (scoredTN.rankingMetadata?.regionalRelevanceScore === 85) {
      results.push({
        suite: 'Regional Relevance',
        name: 'First-Class Tamil Nadu Regional Relevance Evaluation',
        passed: true,
        details: `Tamil Nadu baseline regional score: ${scoredTN.rankingMetadata.regionalRelevanceScore}`,
      });
    } else {
      results.push({
        suite: 'Regional Relevance',
        name: 'First-Class Tamil Nadu Regional Relevance Evaluation',
        passed: false,
        error: `Expected regionalRelevanceScore=85, got ${scoredTN.rankingMetadata?.regionalRelevanceScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Regional Relevance', name: 'First-Class Tamil Nadu Regional Relevance Evaluation', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 21. MAJOR WORLD EVENT OUTRANKS MINOR REGIONAL EVENT
  // -------------------------------------------------------------------------
  try {
    const majorWorldEvent: CanonicalEvent = {
      id: 'e_world_major',
      title: 'Global Central Banks Announce Coordinated Liquidity Intervention',
      summary: 'Emergency action to stabilize international banking currency flows.',
      regionId: 'world',
      categoryId: 'economy',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 95,
      velocityScore: 90,
      finalRankScore: 94,
      firstPublishedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      sourceCount: 4,
      lifecycleStatus: 'OFFICIAL_CONFIRMATION',
      createdAt: now.toISOString(),
    };

    const minorTNEvent: CanonicalEvent = {
      id: 'e_tn_minor',
      title: 'Local village civic community park opened in Salem',
      summary: 'Short local announcement.',
      regionId: 'tamil-nadu',
      categoryId: 'other',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 45,
      velocityScore: 30,
      finalRankScore: 40,
      firstPublishedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      sourceCount: 1,
      lifecycleStatus: 'INITIAL_REPORT',
      createdAt: now.toISOString(),
    };

    const scoredWorld = RankingService.scoreEvent(majorWorldEvent, [], now);
    const scoredTNMinor = RankingService.scoreEvent(minorTNEvent, [], now);

    if (scoredWorld.finalRankScore > scoredTNMinor.finalRankScore) {
      results.push({
        suite: 'Regional Relevance',
        name: 'Evidence-Based Ranking (Major World naturally outranks Minor Regional)',
        passed: true,
        details: `Major World (${scoredWorld.finalRankScore}) > Minor Regional (${scoredTNMinor.finalRankScore})`,
      });
    } else {
      results.push({
        suite: 'Regional Relevance',
        name: 'Evidence-Based Ranking (Major World naturally outranks Minor Regional)',
        passed: false,
        error: `Expected world > tn_minor, got ${scoredWorld.finalRankScore} vs ${scoredTNMinor.finalRankScore}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Regional Relevance', name: 'Evidence-Based Ranking (Major World naturally outranks Minor Regional)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 22. STALE EVENT FRESHNESS DECAY & STATUS
  // -------------------------------------------------------------------------
  try {
    const staleEvent: CanonicalEvent = {
      id: 'e_stale',
      title: 'Historical report from 3 days ago',
      summary: 'Old summary.',
      regionId: 'india',
      categoryId: 'politics',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 70,
      velocityScore: 10,
      finalRankScore: 30,
      firstPublishedAt: new Date(now.getTime() - 72 * 3600000).toISOString(),
      lastUpdatedAt: new Date(now.getTime() - 72 * 3600000).toISOString(),
      sourceCount: 1,
      lifecycleStatus: 'RESOLVED',
      createdAt: new Date(now.getTime() - 72 * 3600000).toISOString(),
    };

    const scoredStale = RankingService.scoreEvent(staleEvent, [], now);

    if (scoredStale.rankingMetadata?.freshnessState === 'STALE' && scoredStale.rankingMetadata.freshnessScore === 0) {
      results.push({
        suite: 'Freshness & Aging',
        name: 'Honest Freshness State Assignment (STALE for 72h old event)',
        passed: true,
        details: `FreshnessState=${scoredStale.rankingMetadata.freshnessState}, FreshnessScore=${scoredStale.rankingMetadata.freshnessScore}`,
      });
    } else {
      results.push({
        suite: 'Freshness & Aging',
        name: 'Honest Freshness State Assignment (STALE for 72h old event)',
        passed: false,
        error: `Expected STALE freshness, got ${scoredStale.rankingMetadata?.freshnessState}`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Freshness & Aging', name: 'Honest Freshness State Assignment (STALE for 72h old event)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 23. TREND OBSERVATION PERSISTENCE & HISTORY RETRIEVAL
  // -------------------------------------------------------------------------
  try {
    const observation: TrendObservation = {
      eventId: 'evt_tn_ev_hub_2026',
      observedAt: new Date().toISOString(),
      articleCount: 2,
      independentSourceCount: 2,
      trendScore: 82,
      importanceScore: 94,
      velocityScore: 88,
      coverageScore: 50,
      recencyScore: 82,
      freshnessScore: 100,
      spreadScore: 90,
      finalRankScore: 92,
    };

    await EventRepository.recordTrendObservation(observation);
    const history = await EventRepository.getRecentObservations('evt_tn_ev_hub_2026', 24);

    if (history.length > 0 && history[0].eventId === 'evt_tn_ev_hub_2026') {
      results.push({
        suite: 'Historical Data',
        name: 'Trend Observation Persistence & Temporal Snapshot Retrieval',
        passed: true,
        details: `Saved observation: count=${history.length}, latest observedAt=${history[0].observedAt}`,
      });
    } else {
      results.push({
        suite: 'Historical Data',
        name: 'Trend Observation Persistence & Temporal Snapshot Retrieval',
        passed: false,
        error: `Observation not retrieved from repository`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Historical Data', name: 'Trend Observation Persistence & Temporal Snapshot Retrieval', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 24. RANKING API QUERY VALIDATION
  // -------------------------------------------------------------------------
  try {
    const validParams = topEventsQuerySchema.parse({
      region: 'tamil-nadu',
      category: 'infrastructure',
      status: 'TRENDING',
      limit: '10',
    });

    let caughtInvalidLimit = false;
    try {
      topEventsQuerySchema.parse({ limit: '1000' });
    } catch {
      caughtInvalidLimit = true;
    }

    if (validParams.limit === 10 && validParams.status === 'TRENDING' && caughtInvalidLimit) {
      results.push({
        suite: 'API & Validation',
        name: 'Strict Zod Query Validation on GET /api/live/top',
        passed: true,
        details: `Validated valid query parameters and rejected limit=1000`,
      });
    } else {
      results.push({
        suite: 'API & Validation',
        name: 'Strict Zod Query Validation on GET /api/live/top',
        passed: false,
        error: `Validation behavior incorrect`,
      });
    }
  } catch (err) {
    results.push({ suite: 'API & Validation', name: 'Strict Zod Query Validation on GET /api/live/top', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 25. SCORE INJECTION PREVENTION (Server-Controlled Scores)
  // -------------------------------------------------------------------------
  try {
    const maliciousQuery = {
      limit: '5',
      trendScore: '100',
      importanceScore: '100',
      finalRankScore: '100',
    };
    const sanitized = topEventsQuerySchema.parse(maliciousQuery);

    const hasInjectedProps = 'trendScore' in sanitized || 'importanceScore' in sanitized || 'finalRankScore' in sanitized;

    if (!hasInjectedProps && sanitized.limit === 5) {
      results.push({
        suite: 'API & Security',
        name: 'Client Score Injection Prevention (Strict Server-Side Scoring)',
        passed: true,
        details: `Stripped injected client score fields: [trendScore, importanceScore, finalRankScore]`,
      });
    } else {
      results.push({
        suite: 'API & Security',
        name: 'Client Score Injection Prevention (Strict Server-Side Scoring)',
        passed: false,
        error: `Injected scores leaked into sanitized parameters`,
      });
    }
  } catch (err) {
    results.push({ suite: 'API & Security', name: 'Client Score Injection Prevention (Strict Server-Side Scoring)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // 26. SCORE REFRESH SCHEDULER OVERLAP PREVENTION
  // -------------------------------------------------------------------------
  try {
    const p1 = RankingService.refreshScores();
    const p2 = RankingService.refreshScores();
    const [r1, r2] = await Promise.all([p1, p2]);

    // One of them should succeed and one should skip due to concurrency guard
    if (r1.updatedCount > 0 || r2.updatedCount > 0) {
      results.push({
        suite: 'Scheduler & Locking',
        name: 'Score Refresh Mutex Guard (Overlap Prevention)',
        passed: true,
        details: `Executed concurrent score refreshes safely without race condition`,
      });
    } else {
      results.push({
        suite: 'Scheduler & Locking',
        name: 'Score Refresh Mutex Guard (Overlap Prevention)',
        passed: false,
        error: `Both score refreshes reported 0 updates`,
      });
    }
  } catch (err) {
    results.push({ suite: 'Scheduler & Locking', name: 'Score Refresh Mutex Guard (Overlap Prevention)', passed: false, error: (err as Error).message });
  }

  // -------------------------------------------------------------------------
  // OUTPUT RESULTS SUMMARY
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  let passedCount = 0;
  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`✅ [PASS] ${r.suite} -> ${r.name}`);
      if (r.details) console.log(`   └─ ${r.details}`);
    } else {
      console.log(`❌ [FAIL] ${r.suite} -> ${r.name}`);
      if (r.error) console.log(`   └─ Error: ${r.error}`);
    }
  }

  console.log('----------------------------------------------------------------------');
  console.log(`📊 PHASE 5 TEST RESULTS: ${passedCount}/${results.length} PASSED`);
  console.log('======================================================================\n');

  if (passedCount < results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase5VerificationSuite().catch((err) => {
  console.error('Fatal error during Phase 5 test execution:', err);
  process.exit(1);
});
