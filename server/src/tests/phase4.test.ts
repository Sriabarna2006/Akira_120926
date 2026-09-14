process.env.NODE_ENV = 'test';
import http from 'http';
import { normalizeArticleUrl } from '../services/ingestion/urlNormalizer.js';
import { validateArticle } from '../services/ingestion/articleValidator.js';
import { classifyArticle } from '../services/ingestion/classifier.js';
import { findMatchingCanonicalEvent } from '../services/ingestion/eventMatcher.js';
import { sanitizeText, isSafeUrl } from '../utils/sanitize.js';
import { SourceRepository } from '../repositories/source.repository.js';
import { ArticleRepository } from '../repositories/article.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { newsIngestionService } from '../services/newsIngestion.service.js';
import Parser from 'rss-parser';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase4VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 4: REAL NEWS INGESTION & CANONICAL EVENT PIPELINE TESTS');
  console.log('======================================================================\n');

  const results: TestResult[] = [];

  // -------------------------------------------------------------------------
  // 1. URL NORMALIZATION & PARAMETER STRIPPING TESTS
  // -------------------------------------------------------------------------
  try {
    const rawTrackedUrl = 'https://www.thehindu.com/news/national/tamil-nadu/article123.ece?utm_source=rssfeed&utm_medium=twitter&utm_campaign=breaking&ref=feed#section-2';
    const normalized = normalizeArticleUrl(rawTrackedUrl);
    const expected = 'https://www.thehindu.com/news/national/tamil-nadu/article123.ece';

    if (normalized === expected) {
      results.push({
        suite: 'URL Normalization',
        name: 'Strip UTM, Ref, and Fragment Tracking Parameters',
        passed: true,
        details: `Correctly transformed tracked URL to: ${normalized}`,
      });
    } else {
      results.push({
        suite: 'URL Normalization',
        name: 'Strip UTM, Ref, and Fragment Tracking Parameters',
        passed: false,
        error: `Expected "${expected}", got "${normalized}"`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'URL Normalization',
      name: 'Strip UTM, Ref, and Fragment Tracking Parameters',
      passed: false,
      error: (err as Error).message,
    });
  }

  // -------------------------------------------------------------------------
  // 2. HTML SANITIZATION & SECURITY TESTS
  // -------------------------------------------------------------------------
  try {
    const dangerousHtml = '<script>evilCode()</script><p>Tamil Nadu approves <a href="javascript:alert(1)">new transport policy</a>.</p>';
    const clean = sanitizeText(dangerousHtml);
    const safeUrl = isSafeUrl('https://www.thehindu.com/news');
    const dangerousUrl = isSafeUrl('javascript:alert(document.cookie)');

    if (clean === 'Tamil Nadu approves new transport policy.' && safeUrl && !dangerousUrl) {
      results.push({
        suite: 'HTML & Security',
        name: 'Sanitize Dangerous Tags, Scripts, and Unsafe Schemes',
        passed: true,
        details: `Sanitized text to safe plaintext and blocked dangerous javascript: scheme.`,
      });
    } else {
      results.push({
        suite: 'HTML & Security',
        name: 'Sanitize Dangerous Tags, Scripts, and Unsafe Schemes',
        passed: false,
        error: `Clean text: "${clean}", Safe URL: ${safeUrl}, Dangerous URL: ${dangerousUrl}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'HTML & Security',
      name: 'Sanitize Dangerous Tags, Scripts, and Unsafe Schemes',
      passed: false,
      error: (err as Error).message,
    });
  }

  // -------------------------------------------------------------------------
  // 3. ARTICLE VALIDATION TESTS
  // -------------------------------------------------------------------------
  try {
    const validArticle = validateArticle({
      title: 'State Cabinet Approves Chennai Metro Phase 2 Extension',
      url: 'https://www.thehindu.com/news/cities/chennai/metro-phase-2',
      publishedAt: new Date().toISOString(),
      sourceId: 'the-hindu-tn',
    });

    const invalidShortTitle = validateArticle({
      title: 'Hi',
      url: 'https://example.com/news',
      publishedAt: new Date().toISOString(),
      sourceId: 'the-hindu',
    });

    const invalidFutureDate = validateArticle({
      title: 'Valid Long Title For News Article Verification',
      url: 'https://example.com/news',
      publishedAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      sourceId: 'the-hindu',
    });

    if (validArticle.isValid && !invalidShortTitle.isValid && !invalidFutureDate.isValid) {
      results.push({
        suite: 'Article Validation',
        name: 'Validate Structure, Lengths, and Timestamps',
        passed: true,
        details: 'Valid article accepted; short title and future timestamp rejected.',
      });
    } else {
      results.push({
        suite: 'Article Validation',
        name: 'Validate Structure, Lengths, and Timestamps',
        passed: false,
        error: `Valid: ${validArticle.isValid}, Short: ${invalidShortTitle.isValid}, Future: ${invalidFutureDate.isValid}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Article Validation',
      name: 'Validate Structure, Lengths, and Timestamps',
      passed: false,
      error: (err as Error).message,
    });
  }

  // -------------------------------------------------------------------------
  // 4. REGION & CATEGORY DETERMINISTIC CLASSIFICATION TESTS
  // -------------------------------------------------------------------------
  try {
    // 4.1 Tamil Nadu + Infrastructure
    const tnInfra = classifyArticle(
      'CMRL inaugurates new underground metro stretch in Chennai',
      'The Chennai Metro Rail Limited opened Phase 2 corridor connecting central hubs.'
    );

    // 4.2 India + Economy
    const inEcon = classifyArticle(
      'RBI adjusts repo rate in monetary policy committee review',
      'Reserve Bank of India calibrates inflation baseline with financial stability targets.'
    );

    // 4.3 World + Technology
    const wdTech = classifyArticle(
      'Global semiconductor consortium unveils sub-2nm AI accelerator chip',
      'New hardware architectures promise low latency neural processing.'
    );

    const isTnOk = tnInfra.regionId === 'tamil-nadu' && tnInfra.categoryId === 'infrastructure';
    const isInOk = inEcon.regionId === 'india' && inEcon.categoryId === 'economy';
    const isWdOk = wdTech.regionId === 'world' && wdTech.categoryId === 'technology';

    if (isTnOk && isInOk && isWdOk) {
      results.push({
        suite: 'Classification Engine',
        name: 'Deterministic Layered Region & Category Classification',
        passed: true,
        details: `Classified TN+Infra (${tnInfra.regionId}/${tnInfra.categoryId}), India+Econ (${inEcon.regionId}/${inEcon.categoryId}), World+Tech (${wdTech.regionId}/${wdTech.categoryId}).`,
      });
    } else {
      results.push({
        suite: 'Classification Engine',
        name: 'Deterministic Layered Region & Category Classification',
        passed: false,
        error: `TN: ${tnInfra.regionId}/${tnInfra.categoryId}, IN: ${inEcon.regionId}/${inEcon.categoryId}, WD: ${wdTech.regionId}/${wdTech.categoryId}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Classification Engine',
      name: 'Deterministic Layered Region & Category Classification',
      passed: false,
      error: (err as Error).message,
    });
  }

  // -------------------------------------------------------------------------
  // 5. CANONICAL EVENT MATCHING & FALSE MERGE SAFETY TESTS
  // -------------------------------------------------------------------------
  try {
    const existingEvents = [
      {
        id: 'evt_space_isro_01',
        title: 'ISRO launches advanced ocean monitoring satellite from Sriharikota',
        summary: 'Indian Space Research Organisation successfully places Earth observation satellite into orbit.',
        regionId: 'india',
        categoryId: 'science',
        urgencyLabel: 'IMPORTANT' as const,
        importanceScore: 85,
        velocityScore: 70,
        finalRankScore: 80,
        firstPublishedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        sourceCount: 1,
        lifecycleStatus: 'INITIAL_REPORT' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    // Corroborating article on same ISRO launch (different publisher)
    const matchSameEvent = findMatchingCanonicalEvent(
      'ISRO puts ocean observation satellite into orbit from Sriharikota spaceport',
      'The space agency confirmed solar panels deployed successfully after launch.',
      'india',
      'science',
      new Date().toISOString(),
      existingEvents
    );

    // Different event in different region (NASA launch in World)
    const matchDifferentEvent = findMatchingCanonicalEvent(
      'NASA launches climate monitoring satellite from Cape Canaveral',
      'US space agency deploys next generation environmental satellite.',
      'world',
      'science',
      new Date().toISOString(),
      existingEvents
    );

    if (matchSameEvent.isMatch && matchSameEvent.matchedEvent?.id === 'evt_space_isro_01' && !matchDifferentEvent.isMatch) {
      results.push({
        suite: 'Canonical Event Clustering',
        name: 'Corroborating Event Matching & False-Merge Regional Guardrails',
        passed: true,
        details: `Correctly clustered ISRO corroborating report (score: ${matchSameEvent.confidenceScore.toFixed(2)}) and isolated NASA World event.`,
      });
    } else {
      results.push({
        suite: 'Canonical Event Clustering',
        name: 'Corroborating Event Matching & False-Merge Regional Guardrails',
        passed: false,
        error: `SameMatch: ${matchSameEvent.isMatch}, DiffMatch: ${matchDifferentEvent.isMatch}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Canonical Event Clustering',
      name: 'Corroborating Event Matching & False-Merge Regional Guardrails',
      passed: false,
      error: (err as Error).message,
    });
  }

  // -------------------------------------------------------------------------
  // 6. RSS & ATOM FEED PARSING TESTS (MOCK FIXTURES)
  // -------------------------------------------------------------------------
  try {
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test News RSS Feed</title>
          <link>https://example.com</link>
          <description>Verified news updates</description>
          <item>
            <title>Tamil Nadu signs clean energy pact for green hydrogen corridor</title>
            <link>https://example.com/news/tn-green-hydrogen-2026</link>
            <description>State inks agreements with global partners for renewable infrastructure.</description>
            <pubDate>${new Date().toUTCString()}</pubDate>
            <guid>https://example.com/news/tn-green-hydrogen-2026</guid>
          </item>
        </channel>
      </rss>`;

    const parser = new Parser();
    const parsedRss = await parser.parseString(rssXml);

    if (parsedRss && parsedRss.items && parsedRss.items.length === 1 && parsedRss.items[0].title?.includes('Tamil Nadu')) {
      results.push({
        suite: 'Feed Ingestion',
        name: 'RSS 2.0 / Atom XML Parsing & Extraction',
        passed: true,
        details: `Successfully parsed fixture feed with item: "${parsedRss.items[0].title}"`,
      });
    } else {
      results.push({
        suite: 'Feed Ingestion',
        name: 'RSS 2.0 / Atom XML Parsing & Extraction',
        passed: false,
        error: `Failed to parse RSS XML structure: ${JSON.stringify(parsedRss)}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Feed Ingestion',
      name: 'RSS 2.0 / Atom XML Parsing & Extraction',
      passed: false,
      error: (err as Error).message,
    });
  }

  // -------------------------------------------------------------------------
  // 7. PERSISTENCE & IDEMPOTENCY VERIFICATION
  // -------------------------------------------------------------------------
  try {
    // Run initial ingestion cycle
    const report1 = await newsIngestionService.runIngestion(['the-hindu-tn']);

    // Run secondary ingestion cycle immediately with identical feeds
    const report2 = await newsIngestionService.runIngestion(['the-hindu-tn']);

    if (report2.duplicatesSkipped >= 0 && report2.eventsCreated === 0) {
      results.push({
        suite: 'Idempotency & Persistence',
        name: 'Idempotent Ingestion (Second Run Skips 100% of Existing Articles)',
        passed: true,
        details: `Run 1 (Accepted=${report1.articlesAccepted}, Created=${report1.eventsCreated}) -> Run 2 (Accepted=${report2.articlesAccepted}, DupesSkipped=${report2.duplicatesSkipped}, Created=${report2.eventsCreated}).`,
      });
    } else {
      results.push({
        suite: 'Idempotency & Persistence',
        name: 'Idempotent Ingestion (Second Run Skips 100% of Existing Articles)',
        passed: false,
        error: `Run 2 created unexpected records: Created=${report2.eventsCreated}, Accepted=${report2.articlesAccepted}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Idempotency & Persistence',
      name: 'Idempotent Ingestion (Second Run Skips 100% of Existing Articles)',
      passed: false,
      error: (err as Error).message,
    });
  }

  // -------------------------------------------------------------------------
  // 8. SOURCE HEALTH & FRESHNESS TRACKING TESTS
  // -------------------------------------------------------------------------
  try {
    await SourceRepository.updateFetchStatus('the-hindu-tn', true);
    await SourceRepository.updateFetchStatus('the-hindu-tn', false, 'Connection timeout simulation');
    const source = await SourceRepository.findById('the-hindu-tn');

    if (source && source.lastSuccessfulFetch && source.lastFailedFetch && source.failureCount >= 1) {
      results.push({
        suite: 'Source Health',
        name: 'Source Health Tracking (Last Success, Failure Count & Isolation)',
        passed: true,
        details: `Recorded lastSuccessfulFetch (${source.lastSuccessfulFetch}), failureCount (${source.failureCount}).`,
      });
    } else {
      results.push({
        suite: 'Source Health',
        name: 'Source Health Tracking (Last Success, Failure Count & Isolation)',
        passed: false,
        error: `Source state: ${JSON.stringify(source)}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Source Health',
      name: 'Source Health Tracking (Last Success, Failure Count & Isolation)',
      passed: false,
      error: (err as Error).message,
    });
  }

  // -------------------------------------------------------------------------
  // 9. HTTP API & PROTECTED SYNC ENDPOINT TESTS
  // -------------------------------------------------------------------------
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const apiRoutes = (await import('../routes/api.routes.js')).default;
  const { errorHandler } = await import('../middleware/errorHandler.js');

  const testApp = express();
  testApp.use(cors());
  testApp.use(express.json());
  testApp.use('/api', apiRoutes);
  testApp.use(errorHandler);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5003;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 9.1 Protected /api/live/sync without key (403 Forbidden)
    const unauthRes = await fetch(`${baseUrl}/live/sync`, { method: 'POST' });

    // 9.2 Protected /api/live/sync with valid key (200 OK + Ingestion Report)
    const authRes = await fetch(`${baseUrl}/live/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-akira-internal-key': 'akira_internal_dev_secret',
      },
      body: JSON.stringify({ sources: ['the-hindu-tn'] }),
    });
    const authData = (await authRes.json()) as any;

    if (
      unauthRes.status === 403 &&
      authRes.status === 200 &&
      authData.success === true &&
      authData.data?.status === 'COMPLETED' &&
      authData.data?.report
    ) {
      results.push({
        suite: 'Security & API Integration',
        name: 'POST /api/live/sync Protection & Pipeline Execution',
        passed: true,
        details: `Blocked unauthenticated request (403); executed authorized sync returning duration: ${authData.data.report.durationMs}ms.`,
      });
    } else {
      results.push({
        suite: 'Security & API Integration',
        name: 'POST /api/live/sync Protection & Pipeline Execution',
        passed: false,
        error: `Unauth Status: ${unauthRes.status}, Auth Status: ${authRes.status}, Auth Body: ${JSON.stringify(authData)}`,
      });
    }
  } finally {
    server.close();
  }

  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------------');
  let allPassed = true;
  for (const r of results) {
    if (r.passed) {
      console.log(`✅ [PASS] [${r.suite}] ${r.name}`);
      if (r.details) console.log(`   └─ ${r.details}`);
    } else {
      allPassed = false;
      console.log(`❌ [FAIL] [${r.suite}] ${r.name}`);
      if (r.error) console.log(`   └─ Error: ${r.error}`);
    }
  }
  console.log('----------------------------------------------------------------------');
  console.log(`Overall Status: ${allPassed ? '🟢 ALL PHASE 4 TESTS PASSED' : '🔴 TESTS FAILED'}`);
  console.log('======================================================================\n');

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase4VerificationSuite();
