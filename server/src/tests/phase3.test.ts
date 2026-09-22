process.env.NODE_ENV = 'test';
import http from 'http';
import { RegionRepository } from '../repositories/region.repository.js';
import { CategoryRepository } from '../repositories/category.repository.js';
import { SourceRepository } from '../repositories/source.repository.js';
import { ArticleRepository } from '../repositories/article.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { sanitizeText, isSafeUrl } from '../utils/sanitize.js';
import { loadMigrations } from '../db/migrate.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase3VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 3: CORE DATA LAYER & BACKEND API VERIFICATION SUITE');
  console.log('======================================================================\n');

  const results: TestResult[] = [];

  // -------------------------------------------------------------------------
  // 1. DATABASE REPOSITORIES & DATA PERSISTENCE TESTS
  // -------------------------------------------------------------------------
  
  // Test 1.1: Region Repository
  try {
    const regions = await RegionRepository.findAll();
    const hasTN = regions.some((r) => r.id === 'tamil-nadu');
    const hasIndia = regions.some((r) => r.id === 'india');
    const hasWorld = regions.some((r) => r.id === 'world');

    if (regions.length >= 3 && hasTN && hasIndia && hasWorld) {
      results.push({
        suite: 'Data Layer',
        name: 'Region Repository (First-Class Regions)',
        passed: true,
        details: `Discovered ${regions.length} active regions including Tamil Nadu, India, and World.`,
      });
    } else {
      results.push({
        suite: 'Data Layer',
        name: 'Region Repository (First-Class Regions)',
        passed: false,
        error: `Missing core regions. Found: ${regions.map((r) => r.id).join(', ')}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Data Layer',
      name: 'Region Repository (First-Class Regions)',
      passed: false,
      error: (err as Error).message,
    });
  }

  // Test 1.2: Category Repository
  try {
    const categories = await CategoryRepository.findAll();
    const hasTech = categories.some((c) => c.id === 'technology');
    const hasEcon = categories.some((c) => c.id === 'economy');
    const hasInfra = categories.some((c) => c.id === 'infrastructure');

    if (categories.length >= 10 && hasTech && hasEcon && hasInfra) {
      results.push({
        suite: 'Data Layer',
        name: 'Category Repository (Approved Domains)',
        passed: true,
        details: `Loaded ${categories.length} standardized knowledge domains.`,
      });
    } else {
      results.push({
        suite: 'Data Layer',
        name: 'Category Repository (Approved Domains)',
        passed: false,
        error: `Categories count: ${categories.length}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Data Layer',
      name: 'Category Repository (Approved Domains)',
      passed: false,
      error: (err as Error).message,
    });
  }

  // Test 1.3: Source Repository
  try {
    const sources = await SourceRepository.findAll({ includeInactive: true });
    const hasHinduTN = sources.some((s) => s.id === 'the-hindu-tn');
    const hasReuters = sources.some((s) => s.id === 'reuters-world' || s.id === 'bbc-world');

    if (sources.length >= 5 && hasHinduTN && hasReuters) {
      results.push({
        suite: 'Data Layer',
        name: 'Source Repository (Vetted Publisher Directory)',
        passed: true,
        details: `Verified ${sources.length} sources with credibility metadata.`,
      });
    } else {
      results.push({
        suite: 'Data Layer',
        name: 'Source Repository (Vetted Publisher Directory)',
        passed: false,
        error: `Sources count: ${sources.length}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Data Layer',
      name: 'Source Repository (Vetted Publisher Directory)',
      passed: false,
      error: (err as Error).message,
    });
  }

  // Test 1.4: Canonical Event & Article 1-to-Many Relational Model
  try {
    const event = await EventRepository.findById('evt_tn_ev_hub_2026');
    const articlesRes = await ArticleRepository.findAll({ eventId: 'evt_tn_ev_hub_2026' });

    if (event && event.sources && event.sources.length >= 2 && articlesRes.articles.length >= 2) {
      results.push({
        suite: 'Data Layer',
        name: 'Canonical Event Relational Model (Multiple Sources/Articles per Event)',
        passed: true,
        details: `Event "${event.id}" aggregates ${event.sources.length} corroborating sources and ${articlesRes.articles.length} raw articles.`,
      });
    } else {
      results.push({
        suite: 'Data Layer',
        name: 'Canonical Event Relational Model (Multiple Sources/Articles per Event)',
        passed: false,
        error: `Event or corroborating sources missing. Event: ${Boolean(event)}, Sources: ${event?.sources?.length}, Articles: ${articlesRes.articles.length}`,
      });
    }
  } catch (err) {
    results.push({
      suite: 'Data Layer',
      name: 'Canonical Event Relational Model (Multiple Sources/Articles per Event)',
      passed: false,
      error: (err as Error).message,
    });
  }

  // -------------------------------------------------------------------------
  // 2. EXPRESS HTTP API INTEGRATION TESTS
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
  const port = typeof address === 'object' && address ? address.port : 5002;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // Test 2.1: GET /api/regions
    const regRes = await fetch(`${baseUrl}/regions`);
    const regData = (await regRes.json()) as any;
    if (regRes.status === 200 && regData.success && Array.isArray(regData.data) && regData.data.length >= 3) {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/regions',
        passed: true,
        details: `Returned ${regData.data.length} regions with metadata.`,
      });
    } else {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/regions',
        passed: false,
        error: `Status: ${regRes.status}, Data: ${JSON.stringify(regData)}`,
      });
    }

    // Test 2.2: GET /api/regions/:id (Single & 404)
    const singleRegRes = await fetch(`${baseUrl}/regions/tamil-nadu`);
    const singleRegData = (await singleRegRes.json()) as any;
    const notFoundRegRes = await fetch(`${baseUrl}/regions/non-existent-region-999`);
    const notFoundRegData = (await notFoundRegRes.json()) as any;

    if (singleRegRes.status === 200 && singleRegData.data?.id === 'tamil-nadu' && notFoundRegRes.status === 404 && notFoundRegData.error?.code === 'REGION_NOT_FOUND') {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/regions/:id (Found & 404 Handled)',
        passed: true,
        details: 'Correctly resolved tamil-nadu and returned 404 for invalid region.',
      });
    } else {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/regions/:id (Found & 404 Handled)',
        passed: false,
        error: `Found Status: ${singleRegRes.status}, NotFound Status: ${notFoundRegRes.status}`,
      });
    }

    // Test 2.3: GET /api/categories
    const catRes = await fetch(`${baseUrl}/categories`);
    const catData = (await catRes.json()) as any;
    if (catRes.status === 200 && catData.success && Array.isArray(catData.data) && catData.data.length >= 10) {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/categories',
        passed: true,
        details: `Returned ${catData.data.length} categories.`,
      });
    } else {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/categories',
        passed: false,
        error: `Status: ${catRes.status}, Data: ${JSON.stringify(catData)}`,
      });
    }

    // Test 2.4: GET /api/sources (Filtered by Region)
    const srcRes = await fetch(`${baseUrl}/sources?region=tamil-nadu`);
    const srcData = (await srcRes.json()) as any;
    const tnSources = srcData.data?.every((s: any) => s.regionId === 'tamil-nadu');
    if (srcRes.status === 200 && srcData.success && tnSources) {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/sources?region=tamil-nadu (Filtering)',
        passed: true,
        details: `Filtered ${srcData.data.length} sources correctly for Tamil Nadu.`,
      });
    } else {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/sources?region=tamil-nadu (Filtering)',
        passed: false,
        error: `Status: ${srcRes.status}, Data: ${JSON.stringify(srcData)}`,
      });
    }

    // Test 2.5: GET /api/articles (Pagination & Metadata)
    const artRes = await fetch(`${baseUrl}/articles?page=1&limit=2`);
    const artData = (await artRes.json()) as any;
    if (
      artRes.status === 200 &&
      artData.success &&
      Array.isArray(artData.data) &&
      artData.meta?.page === 1 &&
      artData.meta?.limit === 2 &&
      typeof artData.meta?.total === 'number'
    ) {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/articles (Pagination & Structured Meta)',
        passed: true,
        details: `Paginated ${artData.data.length} items (Total: ${artData.meta.total}, TotalPages: ${artData.meta.totalPages}).`,
      });
    } else {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/articles (Pagination & Structured Meta)',
        passed: false,
        error: `Status: ${artRes.status}, Data: ${JSON.stringify(artData)}`,
      });
    }

    // Test 2.6: GET /api/events (Canonical Events Stream & Top)
    const evtRes = await fetch(`${baseUrl}/events?region=tamil-nadu`);
    const evtData = (await evtRes.json()) as any;
    const topRes = await fetch(`${baseUrl}/events/top?region=tamil-nadu`);
    const topData = (await topRes.json()) as any;

    if (evtRes.status === 200 && evtData.success && topRes.status === 200 && topData.success) {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/events and /api/events/top',
        passed: true,
        details: `Events stream returned ${evtData.data.length} events; top returned ${topData.data.length} ranked events.`,
      });
    } else {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/events and /api/events/top',
        passed: false,
        error: `EvtStatus: ${evtRes.status}, TopStatus: ${topRes.status}`,
      });
    }

    // Test 2.7: GET /api/live (Persisted Stream with Explicit Timestamp)
    const liveRes = await fetch(`${baseUrl}/live`);
    const liveData = (await liveRes.json()) as any;
    if (liveRes.status === 200 && liveData.success && liveData.meta?.timestamp) {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/live (Persisted Data with Transparent Timestamp)',
        passed: true,
        details: `Returned stream with timestamp ${liveData.meta.timestamp}.`,
      });
    } else {
      results.push({
        suite: 'API Foundation',
        name: 'GET /api/live (Persisted Data with Transparent Timestamp)',
        passed: false,
        error: `Status: ${liveRes.status}, Data: ${JSON.stringify(liveData)}`,
      });
    }

    // Test 2.8: Validation & Malformed Input Rejection (400 Bad Request)
    const badParamRes = await fetch(`${baseUrl}/articles?limit=-5`);
    const badParamData = (await badParamRes.json()) as any;
    if (badParamRes.status === 400 && badParamData.error?.code === 'INVALID_QUERY_PARAMS') {
      results.push({
        suite: 'Validation & Security',
        name: 'Input Validation (Negative Limit Rejection 400)',
        passed: true,
        details: `Rejected invalid parameter with: "${badParamData.error.message}"`,
      });
    } else {
      results.push({
        suite: 'Validation & Security',
        name: 'Input Validation (Negative Limit Rejection 400)',
        passed: false,
        error: `Expected 400 with INVALID_QUERY_PARAMS, got: ${badParamRes.status} ${JSON.stringify(badParamData)}`,
      });
    }

    // Test 2.9: Internal Secret Protection for Sync (/api/live/sync)
    const unauthSyncRes = await fetch(`${baseUrl}/live/sync`, { method: 'POST' });
    const authSyncRes = await fetch(`${baseUrl}/live/sync`, {
      method: 'POST',
      headers: { 'x-akira-internal-key': 'akira_internal_dev_secret' },
    });
    const authSyncData = (await authSyncRes.json()) as any;

    if (unauthSyncRes.status === 403 && authSyncRes.status === 200 && (authSyncData.data?.status === 'COMPLETED' || authSyncData.data?.status === 'READY')) {
      results.push({
        suite: 'Validation & Security',
        name: 'Protected Ingestion Endpoint (403 Forbidden without Key, 200 with Key)',
        passed: true,
        details: 'Unauthenticated POST /api/live/sync blocked (403); internal secret authorized (200).',
      });
    } else {
      results.push({
        suite: 'Validation & Security',
        name: 'Protected Ingestion Endpoint (403 Forbidden without Key, 200 with Key)',
        passed: false,
        error: `Unauth Status: ${unauthSyncRes.status}, Auth Status: ${authSyncRes.status}`,
      });
    }

    // Test 2.10: Content Sanitization & URL Safety
    const dirtyText = '<script>alert("xss")</script><b>Critical policy</b> update announced.';
    const clean = sanitizeText(dirtyText);
    const safeUrlCheck = isSafeUrl('https://thehindu.com/news');
    const dangerousUrlCheck = isSafeUrl('javascript:alert(1)');

    if (clean === 'Critical policy update announced.' && safeUrlCheck && !dangerousUrlCheck) {
      results.push({
        suite: 'Validation & Security',
        name: 'Content Sanitizer & Safe URL Guardrails',
        passed: true,
        details: 'Successfully stripped XSS scripts and blocked non-HTTP protocols.',
      });
    } else {
      results.push({
        suite: 'Validation & Security',
        name: 'Content Sanitizer & Safe URL Guardrails',
        passed: false,
        error: `Clean text: "${clean}", Safe URL: ${safeUrlCheck}, Dangerous URL: ${dangerousUrlCheck}`,
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
  console.log(`Overall Status: ${allPassed ? '🟢 ALL PHASE 3 TESTS PASSED' : '🔴 TESTS FAILED'}`);
  console.log('======================================================================\n');

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase3VerificationSuite();
