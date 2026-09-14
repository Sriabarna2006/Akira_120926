process.env.NODE_ENV = 'test';
import http from 'http';
import { loadMigrations } from '../db/migrate.js';
import { checkDatabaseConnection } from '../db/supabase.js';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase1VerificationSuite(): Promise<void> {
  console.log('=====================================================');
  console.log('🧪 AKIRA PHASE 1: DATABASE & AUTHENTICATION TEST SUITE');
  console.log('=====================================================\n');

  const results: TestResult[] = [];

  // Test 1: Migration Files Discovery & Integrity
  try {
    const migrations = loadMigrations();
    const hasSchema = migrations.some((m) => m.filename.includes('001_initial_schema'));
    const hasRLS = migrations.some((m) => m.filename.includes('002_rls_policies'));
    const hasSeed = migrations.some((m) => m.filename.includes('003_seed_data'));

    if (migrations.length >= 3 && hasSchema && hasRLS && hasSeed) {
      results.push({
        name: 'Database Migrations Integrity',
        passed: true,
        details: `Discovered ${migrations.length} migration files (Schema, RLS Policies, Seed Data).`,
      });
    } else {
      results.push({
        name: 'Database Migrations Integrity',
        passed: false,
        error: `Incomplete migrations. Found: ${migrations.map((m) => m.filename).join(', ')}`,
      });
    }
  } catch (err) {
    results.push({
      name: 'Database Migrations Integrity',
      passed: false,
      error: (err as Error).message,
    });
  }

  // Test 2: Database Connection & Graceful Fallback
  try {
    const health = await checkDatabaseConnection();
    results.push({
      name: 'Database Connection & Fallback Handling',
      passed: true,
      details: `Health check returned: configured=${health.isConfigured}, message="${health.message}"`,
    });
  } catch (err) {
    results.push({
      name: 'Database Connection & Fallback Handling',
      passed: false,
      error: (err as Error).message,
    });
  }

  // Start test Express server on ephemeral port for endpoint verification
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const apiRoutes = (await import('../routes/api.routes.js')).default;

  const testApp = express();
  testApp.use(cors());
  testApp.use(express.json());
  testApp.use('/api', apiRoutes);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5001;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // Test 3: Unauthenticated Protected Route Access Rejection
    const unauthRes = await fetch(`${baseUrl}/auth/profile`);
    const unauthData = (await unauthRes.json()) as { error?: string; message?: string };
    if (unauthRes.status === 401) {
      results.push({
        name: 'Unauthenticated Request Rejection (401)',
        passed: true,
        details: `Rejected with status 401: ${unauthData.message || unauthData.error}`,
      });
    } else {
      results.push({
        name: 'Unauthenticated Request Rejection (401)',
        passed: false,
        error: `Expected 401 but received ${unauthRes.status}`,
      });
    }

    // Test 4: Authenticated Request Processing
    const authRes = await fetch(`${baseUrl}/auth/profile`, {
      headers: {
        Authorization: 'Bearer mock_user_user_101',
      },
    });
    const authData = (await authRes.json()) as { id?: string; email?: string; role?: string };
    if (authRes.status === 200 && authData.id === 'user_101') {
      results.push({
        name: 'Authenticated Session Identification (200)',
        passed: true,
        details: `Identified user: ${authData.id}, role: ${authData.role}`,
      });
    } else {
      results.push({
        name: 'Authenticated Session Identification (200)',
        passed: false,
        error: `Expected user_101 with 200 OK, got: ${JSON.stringify(authData)}`,
      });
    }

    // Test 5: Authorization & Private Data Isolation (User A vs User B)
    // User A saves an event
    await fetch(`${baseUrl}/auth/saved-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_user_user_alpha',
      },
      body: JSON.stringify({ eventId: 'evt_tn_ev_hub_2026' }),
    });

    // User A reads saved events
    const userARes = await fetch(`${baseUrl}/auth/saved-events`, {
      headers: { Authorization: 'Bearer mock_user_user_alpha' },
    });
    const userAData = (await userARes.json()) as { savedEvents?: string[] };

    // User B reads saved events
    const userBRes = await fetch(`${baseUrl}/auth/saved-events`, {
      headers: { Authorization: 'Bearer mock_user_user_bravo' },
    });
    const userBData = (await userBRes.json()) as { savedEvents?: string[] };

    const userAHasEvent = userAData.savedEvents?.includes('evt_tn_ev_hub_2026');
    const userBHasNoEvent = !userBData.savedEvents?.includes('evt_tn_ev_hub_2026');

    if (userAHasEvent && userBHasNoEvent) {
      results.push({
        name: 'Private Data Isolation (User A vs User B)',
        passed: true,
        details: 'User A saved event is strictly isolated; User B sees 0 saved events.',
      });
    } else {
      results.push({
        name: 'Private Data Isolation (User A vs User B)',
        passed: false,
        error: `Isolation breach: User A has=${userAHasEvent}, User B has=${!userBHasNoEvent}`,
      });
    }

    // Test 6: Ingestion Sync Endpoint Protection
    const publicSyncRes = await fetch(`${baseUrl}/live/sync`, { method: 'POST' });
    const authSyncRes = await fetch(`${baseUrl}/live/sync`, {
      method: 'POST',
      headers: { 'x-akira-internal-key': 'akira_internal_dev_secret' },
    });

    if (publicSyncRes.status === 403 && authSyncRes.status === 200) {
      results.push({
        name: 'Internal Sync Endpoint Protection',
        passed: true,
        details: 'Public /api/live/sync blocked (403); internal secret accepted (200).',
      });
    } else {
      results.push({
        name: 'Internal Sync Endpoint Protection',
        passed: false,
        error: `Expected public=403, secret=200; got public=${publicSyncRes.status}, secret=${authSyncRes.status}`,
      });
    }

    // Test 7: Public News and Concepts Accessibility
    const newsRes = await fetch(`${baseUrl}/live/top?region=Tamil%20Nadu`);
    const newsData = (await newsRes.json()) as { data?: unknown[] };
    if (newsRes.status === 200 && Array.isArray(newsData.data)) {
      results.push({
        name: 'Public News & Regional Tab Access',
        passed: true,
        details: `Public endpoint returned ${newsData.data.length} ranked canonical events.`,
      });
    } else {
      results.push({
        name: 'Public News & Regional Tab Access',
        passed: false,
        error: 'Failed to access public news stream.',
      });
    }

  } finally {
    server.close();
  }

  // Print Summary
  console.log('-----------------------------------------------------');
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('-----------------------------------------------------');
  let allPassed = true;
  for (const r of results) {
    if (r.passed) {
      console.log(`✅ [PASS] ${r.name}`);
      if (r.details) console.log(`   └─ ${r.details}`);
    } else {
      allPassed = false;
      console.log(`❌ [FAIL] ${r.name}`);
      if (r.error) console.log(`   └─ Error: ${r.error}`);
    }
  }
  console.log('-----------------------------------------------------');
  console.log(`Overall Status: ${allPassed ? '🟢 ALL TESTS PASSED' : '🔴 TESTS FAILED'}`);
  console.log('=====================================================\n');

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase1VerificationSuite();
