process.env.NODE_ENV = 'test';
import { evidenceService } from '../services/evidence/evidence.service.js';
import { evidenceRepository } from '../repositories/evidence.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { ArticleRepository } from '../repositories/article.repository.js';
import { SourceRepository } from '../repositories/source.repository.js';
import {
  CanonicalEvent,
  Article,
  Source,
  EvidenceRecord,
  EvidenceConflict,
  EventEvidenceSummary,
} from '../types/index.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase10VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 10: TRUST, EVIDENCE & SOURCE INTELLIGENCE SUITE');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  const now = new Date();

  // -------------------------------------------------------------------------
  // 0. SEED FIXTURES
  // -------------------------------------------------------------------------
  const sGov: Source = {
    id: 'src_pib_official',
    name: 'Press Information Bureau (PIB)',
    url: 'https://pib.gov.in',
    tier: 1,
    credibilityScore: 98,
    sourceType: 'GOVERNMENT',
    isActive: true,
    failureCount: 0,
    updateFrequencyMinutes: 3,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const sWire: Source = {
    id: 'src_reuters_wire',
    name: 'Reuters World Service',
    url: 'https://reuters.com',
    tier: 1,
    credibilityScore: 96,
    sourceType: 'WIRE',
    isActive: true,
    failureCount: 0,
    updateFrequencyMinutes: 2,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const sTimesA: Source = {
    id: 'src_toi_metro',
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com',
    tier: 2,
    credibilityScore: 88,
    conglomerateId: 'times-group',
    sourceType: 'NATIONAL',
    isActive: true,
    failureCount: 0,
    updateFrequencyMinutes: 3,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const sTimesB: Source = {
    id: 'src_et_finance',
    name: 'Economic Times',
    url: 'https://economictimes.indiatimes.com',
    tier: 2,
    credibilityScore: 89,
    conglomerateId: 'times-group',
    sourceType: 'NATIONAL',
    isActive: true,
    failureCount: 0,
    updateFrequencyMinutes: 3,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const sSpecialist: Source = {
    id: 'src_tech_deep',
    name: 'Semiconductor Review Daily',
    url: 'https://techreview.com',
    tier: 2,
    credibilityScore: 91,
    sourceType: 'SPECIALIST',
    isActive: true,
    failureCount: 0,
    updateFrequencyMinutes: 5,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Seed into repository
  await SourceRepository.create(sGov);
  await SourceRepository.create(sWire);
  await SourceRepository.create(sTimesA);
  await SourceRepository.create(sTimesB);
  await SourceRepository.create(sSpecialist);

  // -------------------------------------------------------------------------
  // SUITE 1: Deterministic Completeness Score & Weights Breakdown
  // -------------------------------------------------------------------------
  try {
    const eventMultiCorroborated: CanonicalEvent = {
      id: 'evt_test_corroborated_01',
      title: 'Global Semiconductor Consortium Launches Next-Gen Lithography Standard',
      summary: 'Major industrial chipmakers ratify unified standard for optical lithography architecture.',
      regionId: 'world',
      categoryId: 'technology',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 92,
      velocityScore: 85,
      finalRankScore: 90,
      firstPublishedAt: new Date(Date.now() - 3600000).toISOString(),
      lastUpdatedAt: new Date(Date.now() - 1800000).toISOString(),
      sourceCount: 4,
      lifecycleStatus: 'NEW_DEVELOPMENT',
      createdAt: now.toISOString(),
    };
    await EventRepository.create(eventMultiCorroborated);

    // Attach 4 articles across 4 distinct independent publishers & sources
    await ArticleRepository.create({
      id: 'art_p10_gov',
      eventId: eventMultiCorroborated.id,
      sourceId: sGov.id,
      title: 'Official Notification on Next-Gen Lithography Standard',
      url: 'https://pib.gov.in/release/1001',
      contentSnippet: 'Department confirms international standards collaboration for semiconductor manufacturing.',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      regionId: 'world',
      categoryId: 'technology',
    });

    await ArticleRepository.create({
      id: 'art_p10_wire',
      eventId: eventMultiCorroborated.id,
      sourceId: sWire.id,
      title: 'Chipmakers Alliance Finalizes Sub-2nm Lithography Norms',
      url: 'https://reuters.com/tech/sub2nm-consortium-2026',
      contentSnippet: 'Global consortium finalizes equipment specifications for next generation chips.',
      publishedAt: new Date(Date.now() - 3000000).toISOString(),
      regionId: 'world',
      categoryId: 'technology',
    });

    await ArticleRepository.create({
      id: 'art_p10_toi',
      eventId: eventMultiCorroborated.id,
      sourceId: sTimesA.id,
      title: 'India Fab Ecosystem Welcomes New Unified Lithography Protocol',
      url: 'https://timesofindia.indiatimes.com/tech/lithography-standard-2026',
      contentSnippet: 'Domestic chip designers prepare for upgraded architecture compatibility.',
      publishedAt: new Date(Date.now() - 2500000).toISOString(),
      regionId: 'india',
      categoryId: 'technology',
    });

    await ArticleRepository.create({
      id: 'art_p10_spec',
      eventId: eventMultiCorroborated.id,
      sourceId: sSpecialist.id,
      title: 'Technical Breakdown: Optical Path Specifications in 2nm Lithography',
      url: 'https://techreview.com/deep-dive/2nm-optics',
      contentSnippet: 'Engineering review of multi-layer mask alignments in consortium standard.',
      publishedAt: new Date(Date.now() - 1800000).toISOString(),
      regionId: 'world',
      categoryId: 'technology',
    });

    const summary = await evidenceService.getEvidenceSummary(eventMultiCorroborated.id);

    const hasExpectedScore = summary.completenessScore >= 80 && summary.completenessScore <= 100;
    const isWellSupported = summary.confidenceState === 'WELL_SUPPORTED';
    const hasPrimary = summary.primarySourceCount >= 1;
    const hasBreakdown =
      summary.scoreBreakdown.independentPublisherScore > 0 &&
      summary.scoreBreakdown.primarySourceScore > 0 &&
      summary.scoreBreakdown.sourceDiversityScore > 0;

    results.push({
      suite: 'Completeness Scoring',
      name: 'Calculates high completeness score (>80) for multi-corroborated event with official primary source',
      passed: hasExpectedScore && isWellSupported && hasPrimary && hasBreakdown,
      details: `Score: ${summary.completenessScore}/100, State: ${summary.confidenceState}, Primary Sources: ${summary.primarySourceCount}, Diversity: ${summary.uniqueSourceTypeCount}`,
    });
  } catch (err: any) {
    results.push({
      suite: 'Completeness Scoring',
      name: 'Calculates high completeness score for multi-corroborated event',
      passed: false,
      error: err.message,
    });
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Conglomerate Deduplication (Publisher Entity Resolution)
  // -------------------------------------------------------------------------
  try {
    const eventConglomerate: CanonicalEvent = {
      id: 'evt_test_conglomerate_02',
      title: 'Financial Markets Open Lower Following Central Bank Commentary',
      summary: 'Domestic benchmark indices drop 150 points during early morning trade.',
      regionId: 'india',
      categoryId: 'economy',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 80,
      velocityScore: 70,
      finalRankScore: 78,
      firstPublishedAt: new Date(Date.now() - 1800000).toISOString(),
      lastUpdatedAt: new Date(Date.now() - 1200000).toISOString(),
      sourceCount: 2,
      lifecycleStatus: 'INITIAL_REPORT',
      createdAt: now.toISOString(),
    };
    await EventRepository.create(eventConglomerate);

    // Attach 2 articles from distinct source outlets belonging to the same media conglomerate
    await ArticleRepository.create({
      id: 'art_cong_toi',
      eventId: eventConglomerate.id,
      sourceId: sTimesA.id, // conglomerateId: 'times-group'
      title: 'Sensex slips 150 pts on hawkish policy signals',
      url: 'https://timesofindia.indiatimes.com/business/market-morning-drop',
      contentSnippet: 'Equity benchmarks slipped in early trading hours.',
      publishedAt: new Date(Date.now() - 1800000).toISOString(),
      regionId: 'india',
      categoryId: 'economy',
    });

    await ArticleRepository.create({
      id: 'art_cong_et',
      eventId: eventConglomerate.id,
      sourceId: sTimesB.id, // conglomerateId: 'times-group'
      title: 'Markets trim gains as banking index pulls back',
      url: 'https://economictimes.indiatimes.com/markets/sensex-nifty-drop',
      contentSnippet: 'Financial stocks faced profit taking.',
      publishedAt: new Date(Date.now() - 1200000).toISOString(),
      regionId: 'india',
      categoryId: 'economy',
    });

    const summaryConglom = await evidenceService.getEvidenceSummary(eventConglomerate.id);

    // Even though there are 2 articles and 2 sources, conglomerate deduplication should count them as 1 independent publisher
    const deduplicatedCorrectly = summaryConglom.uniquePublisherCount === 1;
    const hasLimitedOrDevelopingState =
      summaryConglom.confidenceState === 'LIMITED_EVIDENCE' || summaryConglom.confidenceState === 'DEVELOPING';

    results.push({
      suite: 'Conglomerate Deduplication',
      name: 'Deduplicates outlets under same media conglomerate into 1 independent publisher',
      passed: deduplicatedCorrectly && hasLimitedOrDevelopingState,
      details: `Articles: ${summaryConglom.totalArticleCount}, Deduplicated Publishers: ${summaryConglom.uniquePublisherCount}, Confidence: ${summaryConglom.confidenceState}`,
    });
  } catch (err: any) {
    results.push({
      suite: 'Conglomerate Deduplication',
      name: 'Deduplicates outlets under same media conglomerate',
      passed: false,
      error: err.message,
    });
  }

  // -------------------------------------------------------------------------
  // SUITE 3: Conflict & Discrepancy Detection (Non-Partisan Neutrality)
  // -------------------------------------------------------------------------
  try {
    const eventDiscrepancy: CanonicalEvent = {
      id: 'evt_test_conflict_03',
      title: 'Infrastructure Corridor Budget Outlay Revisions',
      summary: 'Conflicting reports emerge on total allocated budget for highway modernization corridor.',
      regionId: 'india',
      categoryId: 'infrastructure',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 85,
      velocityScore: 75,
      finalRankScore: 82,
      firstPublishedAt: new Date(Date.now() - 7200000).toISOString(),
      lastUpdatedAt: new Date(Date.now() - 3600000).toISOString(),
      sourceCount: 2,
      lifecycleStatus: 'NEW_DEVELOPMENT',
      createdAt: now.toISOString(),
    };
    await EventRepository.create(eventDiscrepancy);

    // Article A claims ₹5,000 crore
    await ArticleRepository.create({
      id: 'art_disc_a',
      eventId: eventDiscrepancy.id,
      sourceId: sTimesA.id,
      title: 'State clears ₹5,000 crore package for industrial transit links',
      url: 'https://timesofindia.indiatimes.com/transit/5000-crore-package',
      contentSnippet: 'Cabinet meeting approves ₹5,000 crore for regional expressway upgrades.',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      regionId: 'india',
      categoryId: 'infrastructure',
    });

    // Article B claims ₹8,000 crore
    await ArticleRepository.create({
      id: 'art_disc_b',
      eventId: eventDiscrepancy.id,
      sourceId: sWire.id,
      title: 'Highways Ministry Allocates ₹8,000 crore for Multi-Modal Expressway Expansion',
      url: 'https://reuters.com/india/8000-crore-transit',
      contentSnippet: 'Officials signal expanded ₹8,000 crore total project valuation including logistics parks.',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      regionId: 'india',
      categoryId: 'infrastructure',
    });

    const summaryConflict = await evidenceService.getEvidenceSummary(eventDiscrepancy.id);

    const conflictDetected = summaryConflict.conflicts.length > 0;
    const hasFinancialField = summaryConflict.conflicts.some((c) => c.field === 'financial_amount');
    const neutralExplanation = summaryConflict.explanation.includes('differ') || summaryConflict.explanation.includes('vs');

    results.push({
      suite: 'Conflict & Discrepancy Detection',
      name: 'Detects factual discrepancies across publishers and generates non-partisan attribution',
      passed: conflictDetected && hasFinancialField && neutralExplanation,
      details: `Detected Conflicts: ${summaryConflict.conflicts.length}, Field: ${summaryConflict.conflicts[0]?.field}, Values: "${summaryConflict.conflicts[0]?.valueA}" vs "${summaryConflict.conflicts[0]?.valueB}"`,
    });
  } catch (err: any) {
    results.push({
      suite: 'Conflict & Discrepancy Detection',
      name: 'Detects factual discrepancies across publishers',
      passed: false,
      error: err.message,
    });
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Source Health Status & Failure Tracking
  // -------------------------------------------------------------------------
  try {
    const healthBefore = await evidenceRepository.getSourceHealth(sWire.id);
    const initialHealthy = healthBefore?.healthStatus === 'HEALTHY';

    // Simulate 6 consecutive failures
    await evidenceRepository.updateSourceHealth(sWire.id, {
      failureCount: 6,
      consecutiveFailures: 6,
      healthStatus: 'DOWN',
      lastFailedFetch: new Date().toISOString(),
    });

    const healthAfter = await evidenceRepository.getSourceHealth(sWire.id);
    const isDown = healthAfter?.healthStatus === 'DOWN' && healthAfter.consecutiveFailures === 6;

    // Reset health back to clean state
    await evidenceRepository.updateSourceHealth(sWire.id, {
      failureCount: 0,
      consecutiveFailures: 0,
      healthStatus: 'HEALTHY',
      lastSuccessfulFetch: new Date().toISOString(),
    });

    const healthRestored = await evidenceRepository.getSourceHealth(sWire.id);
    const isRestored = healthRestored?.healthStatus === 'HEALTHY';

    results.push({
      suite: 'Source Health Monitoring',
      name: 'Tracks consecutive failure counts and degrades source health status safely',
      passed: initialHealthy && isDown && isRestored,
      details: `Healthy: ${initialHealthy} -> Down: ${isDown} -> Restored: ${isRestored}`,
    });
  } catch (err: any) {
    results.push({
      suite: 'Source Health Monitoring',
      name: 'Tracks consecutive failure counts',
      passed: false,
      error: err.message,
    });
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Source Provenance Traceability & Outbound Links
  // -------------------------------------------------------------------------
  try {
    const provenance = await evidenceService.getSourceProvenance('evt_test_corroborated_01');

    const hasSources = provenance.length >= 4;
    const allHaveUrls = provenance.every((p) => p.url && p.url.startsWith('http'));
    const allHavePublishers = provenance.every((p) => p.publisherName && p.publisherName.length > 0);
    const hasGovType = provenance.some((p) => p.sourceType === 'GOVERNMENT');
    const hasWireType = provenance.some((p) => p.sourceType === 'WIRE');

    results.push({
      suite: 'Source Provenance',
      name: 'Extracts full provenance list with valid URLs, publisher names, and source types',
      passed: hasSources && allHaveUrls && allHavePublishers && hasGovType && hasWireType,
      details: `Provenance Items: ${provenance.length}, Types: ${[...new Set(provenance.map((p) => p.sourceType))].join(', ')}`,
    });
  } catch (err: any) {
    results.push({
      suite: 'Source Provenance',
      name: 'Extracts full provenance list',
      passed: false,
      error: err.message,
    });
  }

  // -------------------------------------------------------------------------
  // SUITE 6: Seed Event Evidence Integration (evt_tn_ev_hub_2026)
  // -------------------------------------------------------------------------
  try {
    const summarySeed = await evidenceService.getEvidenceSummary('evt_tn_ev_hub_2026');

    const hasValidSummary =
      summarySeed.completenessScore > 0 &&
      summarySeed.totalArticleCount > 0 &&
      summarySeed.sources.length > 0 &&
      typeof summarySeed.explanation === 'string';

    results.push({
      suite: 'Seed Event Integration',
      name: 'Produces evidence summary for canonical seed event (evt_tn_ev_hub_2026)',
      passed: hasValidSummary,
      details: `Completeness: ${summarySeed.completenessScore}%, Confidence: ${summarySeed.confidenceState}, Sources: ${summarySeed.sources.length}`,
    });
  } catch (err: any) {
    results.push({
      suite: 'Seed Event Integration',
      name: 'Produces evidence summary for canonical seed event',
      passed: false,
      error: err.message,
    });
  }

  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('======================================================================');

  let passedCount = 0;
  for (const r of results) {
    const statusIcon = r.passed ? '✅' : '❌';
    console.log(`${statusIcon} [${r.suite}] ${r.name}`);
    if (r.details) console.log(`   ℹ️  ${r.details}`);
    if (r.error) console.log(`   ⚠️ Error: ${r.error}`);
    if (r.passed) passedCount++;
  }

  console.log('----------------------------------------------------------------------');
  console.log(`Results: ${passedCount}/${results.length} tests passed (${Math.round((passedCount / results.length) * 100)}% success)`);
  console.log('======================================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase10VerificationSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
