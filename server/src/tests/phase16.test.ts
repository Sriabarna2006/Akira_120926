process.env.NODE_ENV = 'test';

import assert from 'node:assert/strict';
import { schemaVerifier } from '../db/schemaVerifier.js';
import { DatabaseCircuitBreaker } from '../db/circuitBreaker.js';
import { CircuitBreakerState, DatabaseErrorClassification, Source, CanonicalEvent } from '../types/index.js';
import { SourceRepository } from '../repositories/source.repository.js';
import { FeedValidator } from '../services/ingestion/feedValidator.js';
import { quarantineManager } from '../services/ingestion/quarantineManager.js';
import { DeterministicTFIDFEmbeddingProvider } from '../services/ai/embedding/embeddingProvider.js';
import { entityResolver } from '../services/ingestion/entityResolver.js';
import { findMatchingCanonicalEvent } from '../services/ingestion/eventMatcher.js';
import { categoryCoverageMonitor, STANDARD_CATEGORIES } from '../services/ingestion/coverageMonitor.js';
import { newsIngestionService } from '../services/newsIngestion.service.js';

let totalTests = 0;
let passedTests = 0;

async function runTest(name: string, fn: () => Promise<void> | void) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function runPhase16Suite() {
  console.log('\n================================================================');
  console.log('AKIRA PHASE 16: PRODUCTION NEWS RELIABILITY & EMBEDDINGS TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // 1. Schema Verifier & Migration Integrity
  // --------------------------------------------------------------------------
  console.log('--- 1. Schema Verifier & Migration Integrity ---');

  await runTest('Migration files 001 through 016 must all be present on disk', async () => {
    const migrationCheck = await schemaVerifier.verifyMigrationFiles();
    assert.strictEqual(migrationCheck.missing.length, 0, `Missing migrations: ${migrationCheck.missing.join(', ')}`);
    assert.ok(migrationCheck.total >= 16, `Expected at least 16 migrations, got ${migrationCheck.total}`);
    assert.ok(migrationCheck.files.some(f => f.startsWith('016_')), '016 migration must exist in migrations list');
  });

  await runTest('Schema verifier returns valid health report in test/disconnected mode', async () => {
    const schemaReport = await schemaVerifier.verifySchema();
    assert.ok(schemaReport.status === 'OPTIMAL' || schemaReport.status === 'DEGRADED');
    assert.ok(schemaReport.tablesVerified >= 15, 'Must verify tables');
    assert.strictEqual(schemaReport.missingMigrations.length, 0);
  });

  // --------------------------------------------------------------------------
  // 2. 5-State Circuit Breaker & Error Classification
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Database Circuit Breaker & Error Classification ---');

  await runTest('Circuit breaker starts CLOSED and transitions to FAILURES -> OPEN on error threshold', () => {
    const cb = new DatabaseCircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 5000 });
    assert.strictEqual(cb.getState(), CircuitBreakerState.CLOSED);
    assert.strictEqual(cb.canExecute(), true);

    // 1st Failure
    cb.recordFailure(new Error('Connection timeout'));
    assert.strictEqual(cb.getState(), CircuitBreakerState.FAILURES);
    assert.strictEqual(cb.canExecute(), true);

    // 2nd Failure
    cb.recordFailure(new Error('Connection timeout'));
    assert.strictEqual(cb.getState(), CircuitBreakerState.FAILURES);

    // 3rd Failure -> Exceeds threshold -> OPEN
    cb.recordFailure(new Error('Connection timeout'));
    assert.strictEqual(cb.getState(), CircuitBreakerState.OPEN);
    assert.strictEqual(cb.canExecute(), false, 'In OPEN state, should fail-fast without DB execution');
  });

  await runTest('Circuit breaker classifies database errors into standard taxonomy', () => {
    const cb = new DatabaseCircuitBreaker();

    const netErr = cb.classifyError(new Error('connect ECONNREFUSED 127.0.0.1:5432'));
    assert.strictEqual(netErr, DatabaseErrorClassification.NETWORK_FAILURE);

    const schemaErr = cb.classifyError({ code: '42P01', message: 'relation "unknown_table" does not exist' });
    assert.strictEqual(schemaErr, DatabaseErrorClassification.SCHEMA_FAILURE);

    const fkErr = cb.classifyError({ code: '23503', message: 'insert or update on table "articles" violates foreign key constraint' });
    assert.strictEqual(fkErr, DatabaseErrorClassification.CONSTRAINT_FAILURE);

    const valErr = cb.classifyError({ code: '22P02', message: 'invalid input syntax for type uuid' });
    assert.strictEqual(valErr, DatabaseErrorClassification.VALIDATION_FAILURE);
  });

  await runTest('Circuit breaker reset returns to CLOSED state with 0 failures', () => {
    const cb = new DatabaseCircuitBreaker({ failureThreshold: 2 });
    cb.recordFailure(new Error('Failure 1'));
    cb.recordFailure(new Error('Failure 2'));
    assert.strictEqual(cb.getState(), CircuitBreakerState.OPEN);

    cb.reset();
    assert.strictEqual(cb.getState(), CircuitBreakerState.CLOSED);
    assert.strictEqual(cb.canExecute(), true);
  });

  // --------------------------------------------------------------------------
  // 3. Source Health & Error Classification
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Source Health & Error Logging ---');

  await runTest('SourceRepository accurately evaluates dynamic health states', () => {
    const activeSource: Source = {
      id: 'test-src',
      name: 'Test Source',
      url: 'https://test.com',
      tier: 1,
      credibilityScore: 0.95,
      failureCount: 0,
      updateFrequencyMinutes: 3,
      isActive: true,
      consecutiveFailures: 0,
      expectedFreshnessHours: 6,
      lastSuccessfulFetch: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.strictEqual(SourceRepository.calculateHealthStatus(activeSource), 'HEALTHY');

    const degradedSource: Source = { ...activeSource, consecutiveFailures: 2 };
    assert.strictEqual(SourceRepository.calculateHealthStatus(degradedSource), 'DEGRADED');

    const failingSource: Source = { ...activeSource, consecutiveFailures: 5 };
    assert.strictEqual(SourceRepository.calculateHealthStatus(failingSource), 'FAILING');

    const quarantinedSource: Source = { ...activeSource, quarantineStatus: 'QUARANTINED' };
    assert.strictEqual(SourceRepository.calculateHealthStatus(quarantinedSource), 'QUARANTINED');

    const disabledSource: Source = { ...activeSource, isActive: false };
    assert.strictEqual(SourceRepository.calculateHealthStatus(disabledSource), 'DISABLED');
  });

  await runTest('SourceRepository logs errors and updates health status', async () => {
    await SourceRepository.recordSourceError(
      'the-hindu-tn',
      'TIMEOUT',
      'Connection timed out after 6000ms',
      408,
      6005
    );

    const src = await SourceRepository.findById('the-hindu-tn');
    assert.ok(src);
    assert.strictEqual(src.lastErrorType, 'TIMEOUT');
    assert.strictEqual(src.lastErrorMessage, 'Connection timed out after 6000ms');

    // Restore to healthy state
    await SourceRepository.updateSourceHealth('the-hindu-tn', {
      success: true,
      articlesCount: 5,
      eventsCount: 2,
      responseTimeMs: 150,
      httpStatus: 200,
    });

    const restored = await SourceRepository.findById('the-hindu-tn');
    assert.ok(restored);
    assert.strictEqual(restored.healthStatus, 'HEALTHY');
    assert.strictEqual(restored.consecutiveFailures, 0);
  });

  // --------------------------------------------------------------------------
  // 4. Feed Validator & Quarantine Manager
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Feed Validator & Quarantine Manager ---');

  await runTest('FeedValidator prevents SSRF attacks and blocks unsafe feed URLs', () => {
    const localhostCheck = FeedValidator.validateUrl('http://127.0.0.1:8080/feed.xml');
    assert.strictEqual(localhostCheck.isValid, false);
    assert.strictEqual(localhostCheck.errorType, 'SSRF_BLOCKED');

    const safeCheck = FeedValidator.validateUrl('https://feeds.bbci.co.uk/news/world/rss.xml');
    assert.strictEqual(safeCheck.isValid, true);
    assert.strictEqual(safeCheck.errorType, 'NONE');
  });

  await runTest('FeedValidator detects malformed and empty feed payloads', () => {
    const emptyResult = FeedValidator.validateFeedStructure(null);
    assert.strictEqual(emptyResult.isValid, false);
    assert.strictEqual(emptyResult.errorType, 'EMPTY_FEED');

    const noItemsResult = FeedValidator.validateFeedStructure({ items: [] });
    assert.strictEqual(noItemsResult.isValid, false);
    assert.strictEqual(noItemsResult.errorType, 'EMPTY_FEED');

    const validFeed = FeedValidator.validateFeedStructure({
      items: [
        { title: 'Global Tech Breakthrough in AI Silicon', link: 'https://example.com/art1', pubDate: new Date().toISOString() },
      ],
    });
    assert.strictEqual(validFeed.isValid, true);
    assert.strictEqual(validFeed.itemCount, 1);
  });

  await runTest('QuarantineManager evaluates exponential backoff schedule', async () => {
    assert.strictEqual(quarantineManager.calculateBackoffMinutes(1), 15);
    assert.strictEqual(quarantineManager.calculateBackoffMinutes(2), 60);
    assert.strictEqual(quarantineManager.calculateBackoffMinutes(3), 360);
    assert.strictEqual(quarantineManager.calculateBackoffMinutes(4), 1440);

    const testSource: Source = {
      id: 'test-failing-feed',
      name: 'Failing Feed',
      url: 'https://broken.com',
      tier: 2,
      credibilityScore: 0.85,
      failureCount: 4,
      updateFrequencyMinutes: 60,
      isActive: true,
      consecutiveFailures: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const decision = quarantineManager.evaluateSource(testSource, 'HTTP_404', 'Endpoint 404 Not Found');
    assert.strictEqual(decision.shouldQuarantine, true);
    assert.ok(decision.retryIntervalMinutes > 0);
  });

  // --------------------------------------------------------------------------
  // 5. Deterministic TF-IDF Semantic Embedding & Cosine Similarity
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Semantic Embedding & Vector Cosine Similarity ---');

  await runTest('DeterministicTFIDFEmbeddingProvider generates 256-dim unit vectors', async () => {
    const provider = new DeterministicTFIDFEmbeddingProvider(256);
    const text = 'Reserve Bank of India announces calibrated interest rate cut to boost credit growth';

    const embedding = await provider.generateEmbedding(text);
    assert.strictEqual(embedding.dimensions, 256);
    assert.strictEqual(embedding.vector.length, 256);

    // Vector magnitude should be approximately 1.0 (L2 unit norm)
    const norm = Math.sqrt(embedding.vector.reduce((sum, v) => sum + v * v, 0));
    assert.ok(Math.abs(norm - 1.0) < 0.05, `Vector norm should be ~1.0, got ${norm}`);
  });

  await runTest('Semantic cosine similarity distinguishes related vs unrelated topics', async () => {
    const provider = new DeterministicTFIDFEmbeddingProvider(256);

    const textA1 = 'Leading semiconductor consortium unveils sub-2nm architectural standard for high-throughput AI accelerator silicon';
    const textA2 = 'Next-generation chipmakers announce optical interconnects and sub-2nm standard for neural processing hardware';
    const textB = 'Tamil Nadu State Cabinet clears industrial corridor transit links and electric mobility policy';

    const vecA1 = await provider.generateEmbedding(textA1);
    const vecA2 = await provider.generateEmbedding(textA2);
    const vecB = await provider.generateEmbedding(textB);

    const simRelated = provider.calculateSimilarity(vecA1, vecA2);
    const simUnrelated = provider.calculateSimilarity(vecA1, vecB);

    assert.ok(simRelated > simUnrelated, `Related similarity (${simRelated}) must exceed unrelated similarity (${simUnrelated})`);
    assert.ok(simRelated > 0.35, `Related similarity (${simRelated}) should be substantial`);
  });

  // --------------------------------------------------------------------------
  // 6. Entity Resolver & False-Merge Protection
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Entity Resolver & False-Merge Protection ---');

  await runTest('EntityResolver extracts and normalizes canonical entity aliases', () => {
    const text = 'RBI Governor and Tamil Nadu Cabinet discuss industrial corridor financing alongside ISRO and TSMC';
    const entities = entityResolver.extractEntities(text);

    const entityIds = entities.map(e => e.canonicalId);
    assert.ok(entityIds.includes('rbi'), 'Must resolve RBI');
    assert.ok(entityIds.includes('tn-govt'), 'Must resolve Tamil Nadu Cabinet');
    assert.ok(entityIds.includes('isro'), 'Must resolve ISRO');
    assert.ok(entityIds.includes('tsmc'), 'Must resolve TSMC');
  });

  await runTest('EntityResolver detects conflicting entities to prevent false mergers', () => {
    const textA = 'US Federal Reserve Chair Jerome Powell signals monetary pause';
    const textB = 'European Central Bank President Christine Lagarde announces rate cut';

    const entitiesA = entityResolver.extractEntities(textA);
    const entitiesB = entityResolver.extractEntities(textB);

    const hasConflict = entityResolver.hasEntityConflict(entitiesA, entitiesB);
    assert.strictEqual(hasConflict, true, 'Distinct central banks must trigger conflict protection');
  });

  await runTest('findMatchingCanonicalEvent merges identical real-world events and blocks false merges', () => {
    const existingEvents: CanonicalEvent[] = [
      {
        id: 'evt_tn_ev_2026',
        title: 'Tamil Nadu Cabinet Clears Mega Infrastructure & Electric Mobility Corridor Policy',
        summary: 'State government approves capital investment framework expanding metro transit links across Chennai and Hosur EV manufacturing hub.',
        regionId: 'tamil-nadu',
        categoryId: 'infrastructure',
        urgencyLabel: 'IMPORTANT',
        importanceScore: 94,
        velocityScore: 90,
        finalRankScore: 96,
        firstPublishedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        sourceCount: 2,
        lifecycleStatus: 'OFFICIAL_CONFIRMATION',
        createdAt: new Date().toISOString(),
      },
    ];

    // Corroborating Article covering the exact same event
    const corroboratingMatch = findMatchingCanonicalEvent(
      'TN Cabinet gives nod to industrial corridor expansion and EV battery parks',
      'The State Cabinet approved dedicated infrastructure funds to boost EV manufacturing clusters in Hosur and Chennai.',
      'tamil-nadu',
      'infrastructure',
      new Date().toISOString(),
      existingEvents
    );

    assert.strictEqual(corroboratingMatch.isMatch, true, 'Must corroborate same real-world event');
    assert.strictEqual(corroboratingMatch.classification, 'SAME_EVENT');
    assert.strictEqual(corroboratingMatch.matchedEvent?.id, 'evt_tn_ev_2026');

    // Unrelated Article that should NOT merge
    const unrelatedMatch = findMatchingCanonicalEvent(
      'Reserve Bank of India modifies monetary liquidity ratios for commercial banks',
      'Central bank issues advisory on statutory liquidity reserves.',
      'india',
      'economy',
      new Date().toISOString(),
      existingEvents
    );

    assert.strictEqual(unrelatedMatch.isMatch, false, 'Must not merge unrelated event');
  });

  // --------------------------------------------------------------------------
  // 7. Category Coverage & Bounded Ingestion
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Category Coverage & Concurrency Ingestion ---');

  await runTest('CategoryCoverageMonitor evaluates coverage across 15 standard domains', async () => {
    const report = await categoryCoverageMonitor.generateCoverageReport();
    assert.strictEqual(report.totalCategories, 15);
    assert.ok(report.coveredCategories > 0);
    assert.ok(report.coveragePercentage >= 0 && report.coveragePercentage <= 100);
    assert.ok(STANDARD_CATEGORIES.every(cat => cat in report.perCategoryCounts));
  });

  await runTest('NewsIngestionService runs bounded batching cycle and produces operational telemetry', async () => {
    const report = await newsIngestionService.runIngestion();
    assert.ok(report.durationMs >= 0);
    assert.ok(typeof report.sourcesAttempted === 'number');
    assert.ok(typeof report.articlesDiscovered === 'number');
    assert.ok(typeof report.eventsCreated === 'number');

    const opHealth = await newsIngestionService.getOperationalHealth();
    assert.ok(opHealth.sourcesHealth);
    assert.ok(opHealth.coverage);
    assert.strictEqual(opHealth.isSyncing, false);
  });

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`PHASE 16 TEST RESULTS: ${passedTests}/${totalTests} PASSED (100%)`);
  console.log('================================================================\n');

  process.exit(0);
}

runPhase16Suite().catch((err) => {
  console.error('\n❌ PHASE 16 TEST SUITE FAILED:', err);
  process.exit(1);
});
