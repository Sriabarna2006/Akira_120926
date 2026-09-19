process.env.NODE_ENV = 'test';
import { masteryService } from '../services/learning/mastery.service.js';
import { spacedRepetitionService } from '../services/learning/spacedRepetition.service.js';
import { learningService } from '../services/learning/learning.service.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { aiService } from '../services/ai/aiService.js';
import { EventRepository } from '../repositories/event.repository.js';
import { query } from '../db/dbClient.js';
import { QuizResult } from '../types/index.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase7VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 7: PERSONALIZATION, LEARNING PROGRESS & SPACED REPETITION');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  const testUserId1 = '00000000-0000-0000-0000-000000000001';
  const testUserId2 = '00000000-0000-0000-0000-000000000002';
  const sampleEventId = 'evt_tn_ev_hub_2026';

  // Seed sample event in Postgres to satisfy foreign keys if DB is live
  try {
    await query(`
      INSERT INTO public.canonical_events (
        id, title, summary, region_id, category_id, urgency_label,
        importance_score, velocity_score, final_rank_score, why_it_matters,
        first_published_at, last_updated_at, source_count, lifecycle_status, created_at
      ) VALUES (
        'evt_tn_ev_hub_2026',
        'Tamil Nadu Cabinet Clears Mega Infrastructure & Electric Mobility Corridor Policy',
        'State government approves capital investment framework expanding metro transit links across Chennai and Hosur EV manufacturing hub.',
        'tamil-nadu', 'infrastructure', 'IMPORTANT', 94, 90, 96,
        'Accelerates high-speed regional transit corridors and strengthens clean mobility industrial employment in Tamil Nadu.',
        NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour', 2, 'OFFICIAL_CONFIRMATION', NOW() - INTERVAL '4 hours'
      ) ON CONFLICT (id) DO NOTHING;
    `);
  } catch (err) {
    // Ignore DB offline
  }

  async function cleanTestState() {
    learningRepository.clearInMemoryStores();
    try {
      await query('DELETE FROM public.user_learning_progress WHERE user_id = $1 OR user_id = $2', [testUserId1, testUserId2]);
      await query('DELETE FROM public.user_review_schedules WHERE user_id = $1 OR user_id = $2', [testUserId1, testUserId2]);
      await query('DELETE FROM public.user_quiz_attempts WHERE user_id = $1 OR user_id = $2', [testUserId1, testUserId2]);
      await query('DELETE FROM public.user_learning_activities WHERE user_id = $1 OR user_id = $2', [testUserId1, testUserId2]);
    } catch (err) {
      // Ignore DB offline
    }
  }

  // Initial cleanup
  await cleanTestState();

  // -------------------------------------------------------------------------
  // 1. DETERMINISTIC MASTERY CALCULATION TESTS
  // -------------------------------------------------------------------------
  try {
    // 1.1 First attempt calculation
    const firstAttempt = masteryService.calculateMastery(null, 3, 3);
    const passed1 =
      firstAttempt.newMastery === 100 &&
      firstAttempt.masteryStatus === 'STRONG' &&
      firstAttempt.isMastered === true &&
      firstAttempt.scorePercentage === 100;

    results.push({
      suite: 'Mastery Engine',
      name: 'First Attempt Mastery Calculation (100% score)',
      passed: passed1,
      details: `NewMastery: ${firstAttempt.newMastery}%, Status: ${firstAttempt.masteryStatus}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Mastery Engine', name: 'First Attempt Mastery Calculation', passed: false, error: err.message });
  }

  try {
    // 1.2 First attempt partial score
    const partialAttempt = masteryService.calculateMastery(null, 1, 3); // 33%
    const passed2 =
      partialAttempt.newMastery === 33 &&
      partialAttempt.masteryStatus === 'NEEDS_LEARNING' &&
      partialAttempt.isMastered === false;

    results.push({
      suite: 'Mastery Engine',
      name: 'First Attempt Weak Mastery Classification (<50%)',
      passed: passed2,
      details: `NewMastery: ${partialAttempt.newMastery}%, Status: ${partialAttempt.masteryStatus}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Mastery Engine', name: 'First Attempt Weak Mastery Classification', passed: false, error: err.message });
  }

  try {
    // 1.3 Weighted historical update (70% old + 30% new)
    // Old: 33%, New: 3/3 (100%) -> Math.round(33 * 0.7 + 100 * 0.3) = Math.round(23.1 + 30) = 53%
    const updatedAttempt = masteryService.calculateMastery(33, 3, 3);
    const expectedScore = Math.round(33 * 0.7 + 100 * 0.3); // 53
    const passed3 =
      updatedAttempt.newMastery === expectedScore &&
      updatedAttempt.masteryStatus === 'DEVELOPING';

    results.push({
      suite: 'Mastery Engine',
      name: 'Historical Mastery Weighted Smoothing Formula (0.7 / 0.3)',
      passed: passed3,
      details: `Expected: ${expectedScore}%, Actual: ${updatedAttempt.newMastery}%, Status: ${updatedAttempt.masteryStatus}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Mastery Engine', name: 'Historical Mastery Weighted Smoothing', passed: false, error: err.message });
  }

  try {
    // 1.4 Clamping bounds (0 <= mastery <= 100)
    const clampedUpper = masteryService.calculateMastery(150, 5, 3);
    const clampedLower = masteryService.calculateMastery(-50, 0, 3);
    const passed4 = clampedUpper.newMastery <= 100 && clampedLower.newMastery >= 0;

    results.push({
      suite: 'Mastery Engine',
      name: 'Mastery Boundary Clamping (0 <= score <= 100)',
      passed: passed4,
      details: `Upper: ${clampedUpper.newMastery}%, Lower: ${clampedLower.newMastery}%`,
    });
  } catch (err: any) {
    results.push({ suite: 'Mastery Engine', name: 'Mastery Boundary Clamping', passed: false, error: err.message });
  }

  try {
    // 1.5 Explanation level recommendations
    const lvl1 = masteryService.getRecommendedExplanationLevel(25); // beginner
    const lvl2 = masteryService.getRecommendedExplanationLevel(60); // student
    const lvl3 = masteryService.getRecommendedExplanationLevel(75); // technical
    const lvl4 = masteryService.getRecommendedExplanationLevel(92); // deepDive
    const passed5 = lvl1 === 'beginner' && lvl2 === 'student' && lvl3 === 'technical' && lvl4 === 'deepDive';

    results.push({
      suite: 'Mastery Engine',
      name: 'Adaptive Explanation Level Recommendations',
      passed: passed5,
      details: `25%->${lvl1}, 60%->${lvl2}, 75%->${lvl3}, 92%->${lvl4}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Mastery Engine', name: 'Adaptive Explanation Level Recommendations', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 2. DETERMINISTIC SM-2 SPACED REPETITION ENGINE TESTS
  // -------------------------------------------------------------------------
  try {
    // 2.1 Quality mapping
    const q5 = spacedRepetitionService.getReviewQuality(95); // 5
    const q4 = spacedRepetitionService.getReviewQuality(85); // 4
    const q3 = spacedRepetitionService.getReviewQuality(65); // 3
    const q2 = spacedRepetitionService.getReviewQuality(45); // 2
    const q1 = spacedRepetitionService.getReviewQuality(20); // 1
    const q0 = spacedRepetitionService.getReviewQuality(0);  // 0
    const passedQ = q5 === 5 && q4 === 4 && q3 === 3 && q2 === 2 && q1 === 1 && q0 === 0;

    results.push({
      suite: 'Spaced Repetition',
      name: 'Quiz Accuracy to SM-2 Quality Grade Mapping (0 to 5)',
      passed: passedQ,
      details: `95%->${q5}, 85%->${q4}, 65%->${q3}, 45%->${q2}, 20%->${q1}, 0%->${q0}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Spaced Repetition', name: 'Quality Grade Mapping', passed: false, error: err.message });
  }

  try {
    // 2.2 First successful review schedule (rep 1 -> 1 day)
    const baseNow = new Date('2026-09-16T12:00:00.000Z');
    const sched1 = spacedRepetitionService.calculateNextSchedule({
      currentSchedule: null,
      scorePercentage: 100,
      masteryStatus: 'STRONG',
      now: baseNow,
    });

    const passedS1 =
      sched1.repetitionCount === 1 &&
      sched1.intervalDays === 1 &&
      sched1.easeFactor >= 2.5 &&
      sched1.status === 'REVIEW' &&
      new Date(sched1.nextReviewAt).getTime() === baseNow.getTime() + 86400000;

    results.push({
      suite: 'Spaced Repetition',
      name: 'First Successful Review Interval (1 Day, Rep 1)',
      passed: passedS1,
      details: `Interval: ${sched1.intervalDays}d, Reps: ${sched1.repetitionCount}, Ease: ${sched1.easeFactor}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Spaced Repetition', name: 'First Review Interval', passed: false, error: err.message });
  }

  try {
    // 2.3 Second successful review schedule (rep 2 -> 3 days)
    const baseNow = new Date('2026-09-17T12:00:00.000Z');
    const prevSched = {
      id: 'sched-1',
      userId: testUserId1,
      eventId: sampleEventId,
      easeFactor: 2.6,
      intervalDays: 1,
      repetitionCount: 1,
      status: 'REVIEW' as const,
      nextReviewAt: baseNow.toISOString(),
      createdAt: baseNow.toISOString(),
      updatedAt: baseNow.toISOString(),
    };

    const sched2 = spacedRepetitionService.calculateNextSchedule({
      currentSchedule: prevSched,
      scorePercentage: 100,
      masteryStatus: 'STRONG',
      now: baseNow,
    });

    const passedS2 =
      sched2.repetitionCount === 2 &&
      sched2.intervalDays === 3 &&
      sched2.status === 'REVIEW';

    results.push({
      suite: 'Spaced Repetition',
      name: 'Second Successful Review Interval (3 Days, Rep 2)',
      passed: passedS2,
      details: `Interval: ${sched2.intervalDays}d, Reps: ${sched2.repetitionCount}, Ease: ${sched2.easeFactor}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Spaced Repetition', name: 'Second Review Interval', passed: false, error: err.message });
  }

  try {
    // 2.4 Third successful review (rep 3 -> interval * easeFactor, status: MASTERED)
    const baseNow = new Date('2026-09-20T12:00:00.000Z');
    const prevSched = {
      id: 'sched-2',
      userId: testUserId1,
      eventId: sampleEventId,
      easeFactor: 2.5,
      intervalDays: 3,
      repetitionCount: 2,
      status: 'REVIEW' as const,
      nextReviewAt: baseNow.toISOString(),
      createdAt: baseNow.toISOString(),
      updatedAt: baseNow.toISOString(),
    };

    const sched3 = spacedRepetitionService.calculateNextSchedule({
      currentSchedule: prevSched,
      scorePercentage: 90,
      masteryStatus: 'STRONG',
      now: baseNow,
    });

    const expectedInterval = Math.round(3 * 2.5); // 8 days
    const passedS3 =
      sched3.repetitionCount === 3 &&
      sched3.intervalDays === expectedInterval &&
      sched3.status === 'MASTERED';

    results.push({
      suite: 'Spaced Repetition',
      name: 'Third Review Mastery & Exponential Interval Expansion (8 Days, MASTERED)',
      passed: passedS3,
      details: `Interval: ${sched3.intervalDays}d, Status: ${sched3.status}, Ease: ${sched3.easeFactor}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Spaced Repetition', name: 'Third Review Mastery', passed: false, error: err.message });
  }

  try {
    // 2.5 Failed review resets interval & repetition count
    const baseNow = new Date('2026-09-28T12:00:00.000Z');
    const masteredSched = {
      id: 'sched-3',
      userId: testUserId1,
      eventId: sampleEventId,
      easeFactor: 2.5,
      intervalDays: 8,
      repetitionCount: 3,
      status: 'MASTERED' as const,
      nextReviewAt: baseNow.toISOString(),
      createdAt: baseNow.toISOString(),
      updatedAt: baseNow.toISOString(),
    };

    const failedSched = spacedRepetitionService.calculateNextSchedule({
      currentSchedule: masteredSched,
      scorePercentage: 33, // failed
      masteryStatus: 'NEEDS_LEARNING',
      now: baseNow,
    });

    const passedFailed =
      failedSched.repetitionCount === 0 &&
      failedSched.intervalDays === 1 &&
      failedSched.easeFactor === 2.3 && // 2.5 - 0.2
      failedSched.status === 'LEARNING';

    results.push({
      suite: 'Spaced Repetition',
      name: 'Failed Review Reset (Interval -> 1 Day, Reps -> 0, Ease Reduced)',
      passed: passedFailed,
      details: `Interval: ${failedSched.intervalDays}d, Reps: ${failedSched.repetitionCount}, Ease: ${failedSched.easeFactor}, Status: ${failedSched.status}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Spaced Repetition', name: 'Failed Review Reset', passed: false, error: err.message });
  }

  try {
    // 2.6 Ease Factor Floor (>= 1.3)
    const baseNow = new Date('2026-09-29T12:00:00.000Z');
    const lowEaseSched = {
      id: 'sched-low',
      userId: testUserId1,
      eventId: sampleEventId,
      easeFactor: 1.35,
      intervalDays: 1,
      repetitionCount: 0,
      status: 'LEARNING' as const,
      nextReviewAt: baseNow.toISOString(),
      createdAt: baseNow.toISOString(),
      updatedAt: baseNow.toISOString(),
    };

    const flooredSched = spacedRepetitionService.calculateNextSchedule({
      currentSchedule: lowEaseSched,
      scorePercentage: 0,
      masteryStatus: 'NEEDS_LEARNING',
      now: baseNow,
    });

    const passedFloor = flooredSched.easeFactor >= 1.3;

    results.push({
      suite: 'Spaced Repetition',
      name: 'Ease Factor Minimum Bound (Floor >= 1.3)',
      passed: passedFloor && flooredSched.easeFactor === 1.3,
      details: `Clamped EaseFactor: ${flooredSched.easeFactor}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Spaced Repetition', name: 'Ease Factor Minimum Bound', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 3. DETERMINISTIC STREAK COMPUTATION TESTS
  // -------------------------------------------------------------------------
  try {
    const today = new Date('2026-09-16T15:00:00.000Z');

    // 3.1 Consecutive 3 active UTC days
    const consecutiveAttempts = [
      { id: '1', userId: testUserId1, eventId: 'e1', score: 3, totalQuestions: 3, accuracy: 1, scorePercentage: 100, masteryStatus: 'STRONG' as const, answers: {}, submittedAt: '2026-09-16T10:00:00.000Z' },
      { id: '2', userId: testUserId1, eventId: 'e2', score: 3, totalQuestions: 3, accuracy: 1, scorePercentage: 100, masteryStatus: 'STRONG' as const, answers: {}, submittedAt: '2026-09-15T14:00:00.000Z' },
      { id: '3', userId: testUserId1, eventId: 'e3', score: 2, totalQuestions: 3, accuracy: 0.67, scorePercentage: 67, masteryStatus: 'DEVELOPING' as const, answers: {}, submittedAt: '2026-09-14T09:00:00.000Z' },
    ];

    const streak1 = learningService.calculateStreak(consecutiveAttempts, today);
    const passedStreak1 = streak1.currentStreak === 3 && streak1.longestStreak === 3;

    results.push({
      suite: 'Learning Streak',
      name: 'Consecutive Multi-Day Active Streak (3 Days)',
      passed: passedStreak1,
      details: `CurrentStreak: ${streak1.currentStreak}, LongestStreak: ${streak1.longestStreak}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Learning Streak', name: 'Consecutive Multi-Day Active Streak', passed: false, error: err.message });
  }

  try {
    const today = new Date('2026-09-16T15:00:00.000Z');

    // 3.2 Broken streak (gap between 2026-09-16 and 2026-09-12)
    const gapAttempts = [
      { id: '1', userId: testUserId1, eventId: 'e1', score: 3, totalQuestions: 3, accuracy: 1, scorePercentage: 100, masteryStatus: 'STRONG' as const, answers: {}, submittedAt: '2026-09-16T10:00:00.000Z' },
      // Missed 15, 14, 13
      { id: '2', userId: testUserId1, eventId: 'e2', score: 3, totalQuestions: 3, accuracy: 1, scorePercentage: 100, masteryStatus: 'STRONG' as const, answers: {}, submittedAt: '2026-09-12T14:00:00.000Z' },
      { id: '3', userId: testUserId1, eventId: 'e3', score: 3, totalQuestions: 3, accuracy: 1, scorePercentage: 100, masteryStatus: 'STRONG' as const, answers: {}, submittedAt: '2026-09-11T09:00:00.000Z' },
      { id: '4', userId: testUserId1, eventId: 'e4', score: 3, totalQuestions: 3, accuracy: 1, scorePercentage: 100, masteryStatus: 'STRONG' as const, answers: {}, submittedAt: '2026-09-10T09:00:00.000Z' },
      { id: '5', userId: testUserId1, eventId: 'e5', score: 3, totalQuestions: 3, accuracy: 1, scorePercentage: 100, masteryStatus: 'STRONG' as const, answers: {}, submittedAt: '2026-09-09T09:00:00.000Z' },
    ];

    const streak2 = learningService.calculateStreak(gapAttempts, today);
    const passedStreak2 = streak2.currentStreak === 1 && streak2.longestStreak === 4;

    results.push({
      suite: 'Learning Streak',
      name: 'Broken Streak Reset with Historical Longest Retention (Current: 1, Longest: 4)',
      passed: passedStreak2,
      details: `CurrentStreak: ${streak2.currentStreak}, LongestStreak: ${streak2.longestStreak}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Learning Streak', name: 'Broken Streak Reset', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 4. DUE REVIEWS & PRIORITIZATION TESTS
  // -------------------------------------------------------------------------
  try {
    await cleanTestState();
    const now = new Date();

    // Seed 1 overdue schedule and 1 future schedule
    await learningRepository.saveSchedule({
      userId: testUserId1,
      eventId: 'evt_tn_ev_hub_2026',
      easeFactor: 2.5,
      intervalDays: 1,
      repetitionCount: 1,
      status: 'REVIEW',
      nextReviewAt: new Date(now.getTime() - 4 * 3600000).toISOString(), // 4h overdue
    });

    await learningRepository.saveSchedule({
      userId: testUserId1,
      eventId: 'evt_macro_rates_2026',
      easeFactor: 2.5,
      intervalDays: 3,
      repetitionCount: 2,
      status: 'REVIEW',
      nextReviewAt: new Date(now.getTime() + 24 * 3600000).toISOString(), // 24h future
    });

    const dueResult = await learningService.getDueReviews(testUserId1);
    const passedDue =
      dueResult.dueCount === 1 &&
      dueResult.totalScheduled === 2 &&
      dueResult.items.length === 1 &&
      dueResult.items[0].eventId === 'evt_tn_ev_hub_2026' &&
      dueResult.items[0].isOverdue === true;

    results.push({
      suite: 'Due Reviews',
      name: 'Due Reviews Filter & Overdue Duration Calculation',
      passed: passedDue,
      details: `Due: ${dueResult.dueCount}/${dueResult.totalScheduled}, Top Due: ${dueResult.items[0]?.title}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Due Reviews', name: 'Due Reviews Filter', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 5. USER ISOLATION & SECURITY BOUNDARIES
  // -------------------------------------------------------------------------
  try {
    // User 1 has records from previous test
    const user1Dashboard = await learningService.getDashboardData(testUserId1);
    // User 2 has zero records
    const user2Dashboard = await learningService.getDashboardData(testUserId2);

    const passedIsolation =
      user1Dashboard.totalItemsTracked >= 0 &&
      user2Dashboard.totalItemsTracked === 0 &&
      user2Dashboard.isNewUser === true &&
      user2Dashboard.overallMastery === 0;

    results.push({
      suite: 'Security & Isolation',
      name: 'Strict Cross-User Tenant Isolation (User A Cannot Leak to User B)',
      passed: passedIsolation,
      details: `User1 tracked: ${user1Dashboard.totalItemsTracked}, User2 tracked: ${user2Dashboard.totalItemsTracked} (isNewUser: ${user2Dashboard.isNewUser})`,
    });
  } catch (err: any) {
    results.push({ suite: 'Security & Isolation', name: 'Cross-User Tenant Isolation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 6. END-TO-END QUIZ SUBMISSION HOOK INTEGRATION
  // -------------------------------------------------------------------------
  try {
    await cleanTestState();

    const mockQuizResult: QuizResult = {
      eventId: sampleEventId,
      totalQuestions: 3,
      correctCount: 3,
      scorePercentage: 100,
      masteryStatus: 'STRONG',
      results: [
        { questionId: 0, question: 'Q1', selectedAnswer: 1, correctAnswer: 1, isCorrect: true, explanation: 'Exp1' },
        { questionId: 1, question: 'Q2', selectedAnswer: 0, correctAnswer: 0, isCorrect: true, explanation: 'Exp2' },
        { questionId: 2, question: 'Q3', selectedAnswer: 2, correctAnswer: 2, isCorrect: true, explanation: 'Exp3' },
      ],
      timestamp: new Date().toISOString(),
    };

    const payload = await learningService.recordQuizAttempt({
      userId: testUserId1,
      eventId: sampleEventId,
      answers: { 0: 1, 1: 0, 2: 2 },
      quizResult: mockQuizResult,
    });

    const passedHook =
      payload.progress.masteryScore === 100 &&
      payload.progress.masteryStatus === 'STRONG' &&
      payload.schedule.repetitionCount === 1 &&
      payload.schedule.intervalDays === 1 &&
      payload.currentStreak === 1 &&
      payload.recommendedLevel === 'deepDive';

    results.push({
      suite: 'E2E Integration',
      name: 'Quiz Submission Hook -> Mastery Update + Spaced Repetition + Streak',
      passed: passedHook,
      details: `Mastery: ${payload.progress.masteryScore}%, Status: ${payload.progress.masteryStatus}, NextReviewIn: ${payload.schedule.intervalDays}d, Streak: ${payload.currentStreak}`,
    });
  } catch (err: any) {
    results.push({ suite: 'E2E Integration', name: 'Quiz Submission Hook', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 7. RECOMMENDATIONS ENGINE TESTS
  // -------------------------------------------------------------------------
  try {
    const recs = await learningService.getRecommendations(testUserId1, 5);
    const passedRecs = recs.recommendations.length > 0 && recs.recommendations.every((r) => !!r.title && !!r.type && !!r.reason);

    results.push({
      suite: 'Recommendations',
      name: 'Deterministic Recommendations Generation with Priority Weighting',
      passed: passedRecs,
      details: `Generated ${recs.recommendations.length} recommendations: [${recs.recommendations.map((r) => r.type).join(', ')}]`,
    });
  } catch (err: any) {
    results.push({ suite: 'Recommendations', name: 'Recommendations Generation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // PRINT SUMMARY
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('PHASE 7 TEST RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------------');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.suite}] ${r.name}`);
    if (r.details) console.log(`   └─ ${r.details}`);
    if (r.error) {
      console.log(`   └─ 🚨 ERROR: ${r.error}`);
      allPassed = false;
    }
    if (!r.passed) allPassed = false;
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log('\n======================================================================');
  console.log(`Phase 7 Test Results: ${passedCount} / ${results.length} PASSED`);
  console.log('======================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runPhase7VerificationSuite().catch((err) => {
  console.error('Phase 7 Verification Suite failed with unexpected exception:', err);
  process.exit(1);
});
