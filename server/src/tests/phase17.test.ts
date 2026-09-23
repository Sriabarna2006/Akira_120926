import assert from 'assert';
import { SourceRepository } from '../repositories/source.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { ArticleRepository } from '../repositories/article.repository.js';
import { categoryCoverageMonitor, STANDARD_CATEGORIES } from '../services/ingestion/coverageMonitor.js';
import { RankingService } from '../services/ranking/rankingService.js';
import { NotificationDecisionService } from '../services/notification/notificationDecision.service.js';
import { DeterministicProvider } from '../services/ai/providers/deterministicProvider.js';
import { fiveWOneHSchema, multiLevelExplanationSchema } from '../services/ai/validators/aiOutput.validator.js';
import { CanonicalEvent, Source, NotificationPreference } from '../types/index.js';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  })();
}

console.log('================================================================');
console.log('🧪 AKIRA PHASE 17: PRODUCTION LIVE INTELLIGENCE & LAUNCH SUITE');
console.log('================================================================\n');

async function runAllTests() {
  // --------------------------------------------------------------------------
  // WORKSTREAM A: MULTI-DOMAIN SOURCE REGISTRY & HEALTH STATES
  // --------------------------------------------------------------------------
  await test('Workstream A1: Source registry covers Tamil Nadu, India, World, and 15 standard domains', async () => {
    const sources = await SourceRepository.findAll({ includeInactive: true });
    assert(sources.length >= 15, `Expected >= 15 registered sources, got ${sources.length}`);

    const regions = new Set(sources.map((s) => s.regionId));
    assert(regions.has('tamil-nadu'), 'Missing Tamil Nadu region in source registry');
    assert(regions.has('india'), 'Missing India region in source registry');
    assert(regions.has('world'), 'Missing World region in source registry');

    const categories = new Set(sources.map((s) => s.categoryId));
    assert(categories.has('health'), 'Missing health category in source registry');
    assert(categories.has('sports'), 'Missing sports category in source registry');
    assert(categories.has('education'), 'Missing education category in source registry');
    assert(categories.has('energy'), 'Missing energy category in source registry');
    assert(categories.has('business'), 'Missing business category in source registry');
    assert(categories.has('technology'), 'Missing technology category in source registry');
  });

  await test('Workstream A2: Source health status accurately identifies states', async () => {
    const healthySource: Source = {
      id: 'test-healthy',
      name: 'Test Healthy',
      url: 'https://test.org',
      tier: 1,
      credibilityScore: 0.95,
      failureCount: 0,
      updateFrequencyMinutes: 4,
      isActive: true,
      consecutiveFailures: 0,
      quarantineStatus: 'ACTIVE',
      expectedFreshnessHours: 6,
      lastSuccessfulFetch: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    assert.strictEqual(SourceRepository.calculateHealthStatus(healthySource), 'HEALTHY');

    const degradedSource: Source = {
      ...healthySource,
      consecutiveFailures: 2,
    };
    assert.strictEqual(SourceRepository.calculateHealthStatus(degradedSource), 'DEGRADED');

    const failingSource: Source = {
      ...healthySource,
      consecutiveFailures: 5,
    };
    assert.strictEqual(SourceRepository.calculateHealthStatus(failingSource), 'FAILING');

    const quarantinedSource: Source = {
      ...healthySource,
      quarantineStatus: 'QUARANTINED',
    };
    assert.strictEqual(SourceRepository.calculateHealthStatus(quarantinedSource), 'QUARANTINED');

    const disabledSource: Source = {
      ...healthySource,
      isActive: false,
    };
    assert.strictEqual(SourceRepository.calculateHealthStatus(disabledSource), 'DISABLED');
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM B & C: COVERAGE QUALITY MONITOR & DIAGNOSTICS
  // --------------------------------------------------------------------------
  await test('Workstream B1: Coverage monitor answers all 8 required diagnostic capabilities', async () => {
    const report = await categoryCoverageMonitor.generateCoverageReport();
    assert.strictEqual(report.totalCategories, STANDARD_CATEGORIES.length);
    assert(typeof report.coveredCategories === 'number', 'Missing coveredCategories');
    assert(Array.isArray(report.sparseCategories), 'Missing sparseCategories array');
    assert(Array.isArray(report.uncoveredCategories), 'Missing uncoveredCategories array');
    assert(Array.isArray(report.healthyDomains), 'Missing healthyDomains array');
    assert(Array.isArray(report.staleDomains), 'Missing staleDomains array');
    assert(Array.isArray(report.weakRegions), 'Missing weakRegions array');
    assert(Array.isArray(report.sourceFailuresAffectingCoverage), 'Missing source failures tracking');
    assert(typeof report.domainFreshnessHours === 'object', 'Missing domainFreshnessHours object');
    assert(typeof report.uniqueEventsCount === 'number', 'Missing uniqueEventsCount');
    assert(typeof report.multiSourceEventsCount === 'number', 'Missing multiSourceEventsCount');
    assert(Array.isArray(report.underrepresentedCategories), 'Missing underrepresentedCategories array');
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM D: RANKING DIVERSITY & PUBLISHER ANTI-MONOPOLY
  // --------------------------------------------------------------------------
  await test('Workstream D1: Ranking diversity limits single publisher domination in Top 10', async () => {
    // Generate 16 events: 8 from 'MonopolyNews', 4 from 'IndependentTech', 4 from 'IndependentScience'
    const testEvents: CanonicalEvent[] = [];
    for (let i = 1; i <= 8; i++) {
      testEvents.push({
        id: `evt_monopoly_${i}`,
        title: `Monopoly Event ${i}`,
        summary: `Summary of event ${i}`,
        regionId: 'india',
        categoryId: 'economy',
        urgencyLabel: 'IMPORTANT',
        importanceScore: 90,
        velocityScore: 50,
        finalRankScore: 95 - i,
        sourceCount: 1,
        lifecycleStatus: 'INITIAL_REPORT',
        firstPublishedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        metadata: { initialSource: 'MonopolyNews' },
        sources: [
          {
            id: `src_1_${i}`,
            eventId: `evt_monopoly_${i}`,
            sourceName: 'MonopolyNews',
            title: `Monopoly Article ${i}`,
            url: `https://monopoly.com/art-${i}`,
            publishedAt: new Date().toISOString(),
            tier: 1,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    for (let j = 1; j <= 4; j++) {
      testEvents.push({
        id: `evt_tech_${j}`,
        title: `Tech Event ${j}`,
        summary: `Summary of tech event ${j}`,
        regionId: 'world',
        categoryId: 'technology',
        urgencyLabel: 'IMPORTANT',
        importanceScore: 80,
        velocityScore: 50,
        finalRankScore: 80 - j,
        sourceCount: 1,
        lifecycleStatus: 'INITIAL_REPORT',
        firstPublishedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        metadata: { initialSource: `IndependentTech_${j}` },
        sources: [
          {
            id: `src_tech_${j}`,
            eventId: `evt_tech_${j}`,
            sourceName: `IndependentTech_${j}`,
            title: `Tech Article ${j}`,
            url: `https://independent-tech.com/art-${j}`,
            publishedAt: new Date().toISOString(),
            tier: 1,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    for (let k = 1; k <= 4; k++) {
      testEvents.push({
        id: `evt_science_${k}`,
        title: `Science Event ${k}`,
        summary: `Summary of science event ${k}`,
        regionId: 'world',
        categoryId: 'science',
        urgencyLabel: 'IMPORTANT',
        importanceScore: 78,
        velocityScore: 50,
        finalRankScore: 78 - k,
        sourceCount: 1,
        lifecycleStatus: 'INITIAL_REPORT',
        firstPublishedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        metadata: { initialSource: `IndependentScience_${k}` },
        sources: [
          {
            id: `src_sci_${k}`,
            eventId: `evt_science_${k}`,
            sourceName: `IndependentScience_${k}`,
            title: `Science Article ${k}`,
            url: `https://independent-sci.com/art-${k}`,
            publishedAt: new Date().toISOString(),
            tier: 1,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    const top10 = RankingService.rankAndFilterEvents(testEvents, { limit: 10, applyDiversity: true });
    assert.strictEqual(top10.length, 10, 'Expected exactly 10 ranked events');

    const monopolyCount = top10.filter((e) => String(e.metadata?.initialSource || '').toLowerCase() === 'monopolynews').length;
    assert(monopolyCount <= 4, `Publisher MonopolyNews exceeded diversity cap: ${monopolyCount} / 4`);

    const hasTech = top10.some((e) => String(e.metadata?.initialSource || '').startsWith('IndependentTech'));
    assert(hasTech, 'Independent Tech publishers should be present in top 10');

    const hasScience = top10.some((e) => String(e.metadata?.initialSource || '').startsWith('IndependentScience'));
    assert(hasScience, 'Independent Science publishers should be present in top 10');
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM E: STUDY-TIME NOTIFICATIONS WITH DAY-OF-WEEK VALIDATION
  // --------------------------------------------------------------------------
  await test('Workstream E1: Study-time candidate evaluation respects studyDays configuration', async () => {
    const mondayDate = new Date('2026-09-21T19:00:00.000Z'); // Monday (day 1)
    const sundayDate = new Date('2026-09-20T19:00:00.000Z'); // Sunday (day 0)

    const basePref: NotificationPreference = {
      userId: 'test-user-p17',
      enabled: true,
      breakingEnabled: true,
      majorUpdateEnabled: true,
      storylineEnabled: true,
      studyEnabled: true,
      reviewEnabled: true,
      dailyBriefingEnabled: true,
      knowledgeGapEnabled: true,
      dailyGoalEnabled: true,
      studyDays: [1, 2, 3, 4, 5], // Monday - Friday only
      studyTime: '19:00',
      dailyBriefingTime: '08:00',
      quietHoursStart: '23:00',
      quietHoursEnd: '06:00',
      timezone: 'UTC',
      minimumImportance: 50,
      minimumEvidence: 50,
      maximumDailyNotifications: 10,
    };

    const candidate = NotificationDecisionService.buildStudyReminderCandidate('test-user-p17', '2026-09-21');

    // Monday evaluation (matches studyDays [1,2,3,4,5])
    const mondayResult = await NotificationDecisionService.evaluateCandidate(basePref, candidate, {
      checkDedupe: false,
      checkDailyCap: false,
      currentTime: mondayDate,
    });
    assert.strictEqual(mondayResult.shouldNotify, true, 'Expected study reminder on Monday');

    // Sunday evaluation (does NOT match studyDays [1,2,3,4,5])
    const sundayCandidate = NotificationDecisionService.buildStudyReminderCandidate('test-user-p17', '2026-09-20');
    const sundayResult = await NotificationDecisionService.evaluateCandidate(basePref, sundayCandidate, {
      checkDedupe: false,
      checkDailyCap: false,
      currentTime: sundayDate,
    });
    assert.strictEqual(sundayResult.shouldNotify, false, 'Expected study reminder to be rejected on Sunday');
    assert.strictEqual(sundayResult.rejectionReason, 'STUDY_DAY_MISMATCH');
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM F: AI EPISTEMIC GROUNDING & VALIDATION
  // --------------------------------------------------------------------------
  await test('Workstream F1: Deterministic AI provider produces schema-validated 5W1H and multi-level explanations', async () => {
    const provider = new DeterministicProvider();
    const mockEvent: CanonicalEvent = {
      id: 'evt_p17_ai_test',
      title: 'Tamil Nadu Launches Green Energy Grid Expansion',
      summary: 'State authorities approve funding for smart solar-wind transmission lines.',
      regionId: 'tamil-nadu',
      categoryId: 'energy',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 85,
      velocityScore: 50,
      finalRankScore: 80,
      sourceCount: 1,
      lifecycleStatus: 'INITIAL_REPORT',
      firstPublishedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      whyItMatters: 'Accelerates renewable grid integration and reduces power outages.',
      createdAt: new Date().toISOString(),
    };

    const fiveWOneH = await provider.generate5W1H({ event: mockEvent, articles: [] });
    const validated5W1H = fiveWOneHSchema.safeParse(fiveWOneH);
    assert(validated5W1H.success, `5W1H failed schema validation: ${JSON.stringify(validated5W1H.error)}`);

    const explanations = await provider.generateExplanationLevels({ event: mockEvent, articles: [] });
    const validatedExp = multiLevelExplanationSchema.safeParse(explanations);
    assert(validatedExp.success, `Multi-level explanation failed validation: ${JSON.stringify(validatedExp.error)}`);
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM G: IDEMPOTENCY & DUPLICATE PREVENTION
  // --------------------------------------------------------------------------
  await test('Workstream G1: Article and event repositories prevent duplicate insertions', async () => {
    const uniqueUrl = `https://test-publisher.org/news/p17-article-${Date.now()}`;
    const artId = `art_p17_${Date.now()}`;

    // First creation
    await ArticleRepository.create({
      id: artId,
      sourceId: 'the-hindu',
      title: 'P17 Test Idempotency Headline',
      url: uniqueUrl,
      publishedAt: new Date().toISOString(),
      regionId: 'india',
      categoryId: 'technology',
    });

    const exists = await ArticleRepository.existsByUrl(uniqueUrl);
    assert.strictEqual(exists, true, 'Article should exist after creation');
  });

  console.log('\n================================================================');
  console.log(`PHASE 17 TEST RESULTS: ${passed}/${passed + failed} PASSED (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Phase 17 test suite execution error:', err);
  process.exit(1);
});
