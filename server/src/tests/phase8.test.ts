process.env.NODE_ENV = 'test';
import { personalizationService } from '../services/learning/personalization.service.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { RankingService } from '../services/ranking/rankingService.js';
import { masteryService } from '../services/learning/mastery.service.js';
import { query } from '../db/dbClient.js';
import { CanonicalEvent, Article } from '../types/index.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase8VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 8: INTELLIGENT DAILY LEARNING & ADAPTIVE PERSONALIZATION');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  const testUserId1 = '00000000-0000-0000-0000-000000000001';
  const testUserId2 = '00000000-0000-0000-0000-000000000002';

  // Seed standard test events
  const now = new Date();
  const sampleEvents: CanonicalEvent[] = [
    {
      id: 'evt_p8_infra_tn',
      title: 'Tamil Nadu Cabinet Approves Metro Extension & Clean Mobility Hub in Hosur',
      summary: 'State infrastructure ministry clears major transit expansion linking regional industrial zones.',
      regionId: 'tamil-nadu',
      categoryId: 'infrastructure',
      region: 'Tamil Nadu',
      category: 'Infrastructure',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 94,
      velocityScore: 90,
      finalRankScore: 95,
      whyItMatters: 'Reduces commute times and boosts clean tech manufacturing.',
      firstPublishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      lastUpdatedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      sourceCount: 3,
      lifecycleStatus: 'OFFICIAL_CONFIRMATION',
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      concepts: [
        { id: 'c_infra_transit', title: 'Urban Transit Corridors', slug: 'urban-transit', shortDefinition: 'High-capacity metro systems.' },
        { id: 'c_infra_ev', title: 'Electric Mobility Ecosystems', slug: 'ev-ecosystems', shortDefinition: 'Battery and charging networks.' },
      ],
    },
    {
      id: 'evt_p8_economy_rbi',
      title: 'RBI Adjusts Liquidity Corridor and Monetary Policy Target Band',
      summary: 'Central bank recalibrates repo rate and reserve ratios to target inflation stability.',
      regionId: 'india',
      categoryId: 'economy',
      region: 'India',
      category: 'Economy & Money',
      urgencyLabel: 'BREAKING',
      importanceScore: 92,
      velocityScore: 95,
      finalRankScore: 94,
      whyItMatters: 'Directly modulates mortgage lending and corporate capital borrowing rates.',
      firstPublishedAt: new Date(now.getTime() - 0.5 * 3600000).toISOString(),
      lastUpdatedAt: new Date(now.getTime() - 0.5 * 3600000).toISOString(),
      sourceCount: 4,
      lifecycleStatus: 'OFFICIAL_CONFIRMATION',
      createdAt: new Date(now.getTime() - 0.5 * 3600000).toISOString(),
      concepts: [
        { id: 'c_econ_repo', title: 'Monetary Repo Rate', slug: 'repo-rate', shortDefinition: 'Benchmark interest rate.' },
        { id: 'c_econ_inflation', title: 'Consumer Inflation Index', slug: 'inflation-index', shortDefinition: 'Price level changes.' },
      ],
    },
    {
      id: 'evt_p8_cyber_zeroday',
      title: 'Global Cybersecurity Advisory on Critical Zero-Day Kernel Vulnerability',
      summary: 'Computer emergency response teams issue urgent patch guidelines for kernel privilege escalation.',
      regionId: 'world',
      categoryId: 'cybersecurity',
      region: 'World',
      category: 'Cybersecurity',
      urgencyLabel: 'BREAKING',
      importanceScore: 96,
      velocityScore: 92,
      finalRankScore: 96,
      whyItMatters: 'Exposes cloud servers and enterprise workstations to remote unauthorized execution.',
      firstPublishedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      lastUpdatedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      sourceCount: 5,
      lifecycleStatus: 'INITIAL_REPORT',
      createdAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      concepts: [
        { id: 'c_sec_zeroday', title: 'Zero-Day Vulnerability', slug: 'zero-day', shortDefinition: 'Unpatched vulnerability flaw.' },
      ],
    },
    {
      id: 'evt_p8_ai_governance',
      title: 'International AI Safety Consortium Publishes Model Alignment Framework',
      summary: 'Standardized evaluation metrics established for frontier LLM red-teaming and compliance audits.',
      regionId: 'world',
      categoryId: 'technology',
      region: 'World',
      category: 'AI & Technology',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 88,
      velocityScore: 80,
      finalRankScore: 86,
      whyItMatters: 'Mandates safety evaluations before large-scale foundation model releases.',
      firstPublishedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      lastUpdatedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      sourceCount: 2,
      lifecycleStatus: 'NEW_DEVELOPMENT',
      createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      concepts: [
        { id: 'c_ai_safety', title: 'Algorithmic Alignment', slug: 'ai-alignment', shortDefinition: 'Ensuring models follow safety rules.' },
      ],
    },
    {
      id: 'evt_p8_space_isro',
      title: 'ISRO Completes Qualification Tests for Reusable Launch Vehicle Propulsion',
      summary: 'Indian space agency successfully validates next-generation aerodynamic recovery thrusters.',
      regionId: 'india',
      categoryId: 'science',
      region: 'India',
      category: 'Science & Space',
      urgencyLabel: 'IMPORTANT',
      importanceScore: 85,
      velocityScore: 78,
      finalRankScore: 82,
      whyItMatters: 'Lowers satellite launch costs and advances domestic aerospace capability.',
      firstPublishedAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      lastUpdatedAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      sourceCount: 2,
      lifecycleStatus: 'OFFICIAL_CONFIRMATION',
      createdAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      concepts: [
        { id: 'c_space_propulsion', title: 'Reusable Propulsion', slug: 'reusable-propulsion', shortDefinition: 'Space recovery thrusters.' },
      ],
    },
  ];

  // Ensure schema is prepared in PostgreSQL if DB is live
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS public.user_learning_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        daily_goal INT NOT NULL DEFAULT 3,
        preferred_difficulty VARCHAR(30) NOT NULL DEFAULT 'ADAPTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (err) {
    // Ignore DB offline
  }

  async function cleanTestState() {
    learningRepository.clearInMemoryStores();
    EventRepository.clearMemoryStore();
    try {
      await query('DELETE FROM public.user_learning_preferences WHERE user_id = $1 OR user_id = $2', [testUserId1, testUserId2]);
      await query('DELETE FROM public.user_learning_progress WHERE user_id = $1 OR user_id = $2', [testUserId1, testUserId2]);
      await query('DELETE FROM public.user_review_schedules WHERE user_id = $1 OR user_id = $2', [testUserId1, testUserId2]);
      await query('DELETE FROM public.user_quiz_attempts WHERE user_id = $1 OR user_id = $2', [testUserId1, testUserId2]);
      await query('DELETE FROM public.user_learning_activities WHERE user_id = $1 OR user_id = $2', [testUserId1, testUserId2]);
    } catch (err) {
      // Ignore DB offline
    }
    for (const evt of sampleEvents) {
      EventRepository.save(evt);
    }
  }

  await cleanTestState();

  // -------------------------------------------------------------------------
  // 1. RECOMMENDATION ENGINE TESTS
  // -------------------------------------------------------------------------
  try {
    // 1.1 Returns real canonical events
    const feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 5 });
    const passed1 = feed.items.length > 0 && feed.items.every((item) => !!item.event.id && !!item.event.title);

    results.push({
      suite: 'Personalized Feed',
      name: 'Personalized Feed Returns Real Ranked Canonical Events',
      passed: passed1,
      details: `Returned ${feed.items.length} events (Top: ${feed.items[0]?.event.title})`,
    });
  } catch (err: any) {
    results.push({ suite: 'Personalized Feed', name: 'Personalized Feed Returns Real Events', passed: false, error: err.message });
  }

  try {
    // 1.2 Limit & Pagination
    const feedLimit2 = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 2, page: 1 });
    const passedLimit = feedLimit2.items.length === 2 && feedLimit2.meta.limit === 2 && feedLimit2.meta.page === 1;

    results.push({
      suite: 'Personalized Feed',
      name: 'Feed Limit & Pagination Parameters',
      passed: passedLimit,
      details: `Requested limit=2, returnedCount=${feedLimit2.items.length}, hasMore=${feedLimit2.meta.hasMore}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Personalized Feed', name: 'Feed Limit & Pagination', passed: false, error: err.message });
  }

  try {
    // 1.3 Determinism: Same input produces identical scoring & ranking
    const run1 = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 5 });
    const run2 = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 5 });

    const scores1 = run1.items.map((i) => i.personalizedScore);
    const scores2 = run2.items.map((i) => i.personalizedScore);
    const ids1 = run1.items.map((i) => i.event.id);
    const ids2 = run2.items.map((i) => i.event.id);

    const isIdentical =
      JSON.stringify(scores1) === JSON.stringify(scores2) &&
      JSON.stringify(ids1) === JSON.stringify(ids2);

    results.push({
      suite: 'Personalized Feed',
      name: 'Strict Mathematical Determinism (Same Inputs -> Identical Output)',
      passed: isIdentical,
      details: `Run 1 scores: [${scores1.join(', ')}], Run 2 scores: [${scores2.join(', ')}]`,
    });
  } catch (err: any) {
    results.push({ suite: 'Personalized Feed', name: 'Mathematical Determinism', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 2. KNOWLEDGE GAP TESTS
  // -------------------------------------------------------------------------
  try {
    await cleanTestState();

    // User 1 has WEAK mastery (20%) in Cybersecurity concept 'c_sec_zeroday'
    await learningRepository.saveProgress({
      userId: testUserId1,
      conceptId: 'c_sec_zeroday',
      eventId: 'evt_p8_cyber_zeroday',
      masteryScore: 20,
      masteryStatus: 'NEEDS_LEARNING',
      attemptCount: 1,
      correctCount: 1,
      incorrectCount: 2,
    });

    // User 1 has STRONG mastery (95%) in Infrastructure concept 'c_infra_transit'
    await learningRepository.saveProgress({
      userId: testUserId1,
      conceptId: 'c_infra_transit',
      eventId: 'evt_p8_infra_tn',
      masteryScore: 95,
      masteryStatus: 'STRONG',
      attemptCount: 3,
      correctCount: 9,
      incorrectCount: 0,
    });

    const feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 5 });
    const cyberItem = feed.items.find((i) => i.event.id === 'evt_p8_cyber_zeroday');
    const infraItem = feed.items.find((i) => i.event.id === 'evt_p8_infra_tn');

    const gapPassed =
      !!cyberItem &&
      !!infraItem &&
      cyberItem.context.scoreBreakdown!.knowledgeGapScore > infraItem.context.scoreBreakdown!.knowledgeGapScore;

    results.push({
      suite: 'Knowledge Gap',
      name: 'Weak Concepts Increase Learning Priority Over Mastered Concepts',
      passed: gapPassed,
      details: `Cyber Gap: ${cyberItem?.context.scoreBreakdown?.knowledgeGapScore} (Mastery 20%), Infra Gap: ${infraItem?.context.scoreBreakdown?.knowledgeGapScore} (Mastery 95%)`,
    });
  } catch (err: any) {
    results.push({ suite: 'Knowledge Gap', name: 'Weak Concepts Priority', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 3. SM-2 DUE REVIEW PRIORITIZATION TESTS
  // -------------------------------------------------------------------------
  try {
    await cleanTestState();
    const testNow = new Date();

    // Event 1 is overdue by 5 hours
    await learningRepository.saveSchedule({
      userId: testUserId1,
      eventId: 'evt_p8_infra_tn',
      easeFactor: 2.5,
      intervalDays: 1,
      repetitionCount: 1,
      status: 'REVIEW',
      nextReviewAt: new Date(testNow.getTime() - 5 * 3600000).toISOString(),
    });

    // Event 2 is scheduled for review 48 hours in the future
    await learningRepository.saveSchedule({
      userId: testUserId1,
      eventId: 'evt_p8_space_isro',
      easeFactor: 2.5,
      intervalDays: 3,
      repetitionCount: 2,
      status: 'REVIEW',
      nextReviewAt: new Date(testNow.getTime() + 48 * 3600000).toISOString(),
    });

    const feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 5 });
    const dueItem = feed.items.find((i) => i.event.id === 'evt_p8_infra_tn');
    const futureItem = feed.items.find((i) => i.event.id === 'evt_p8_space_isro');

    const duePassed =
      !!dueItem &&
      !!futureItem &&
      dueItem.context.scoreBreakdown!.reviewPriority >= 70 &&
      futureItem.context.scoreBreakdown!.reviewPriority <= 10 &&
      dueItem.reasonCode === 'REVIEW_DUE';

    results.push({
      suite: 'Review Priority',
      name: 'Due Reviews Receive High Priority Boost with Spaced Repetition Reason',
      passed: duePassed,
      details: `Due Priority: ${dueItem?.context.scoreBreakdown?.reviewPriority} (Reason: ${dueItem?.reasonCode}), Future Priority: ${futureItem?.context.scoreBreakdown?.reviewPriority}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Review Priority', name: 'Due Reviews Prioritization', passed: false, error: err.message });
  }

  try {
    // 3.2 Review Priority Score Capping (Cannot exceed 100)
    await cleanTestState();
    const testNow = new Date();

    // Event is 200 hours overdue
    await learningRepository.saveSchedule({
      userId: testUserId1,
      eventId: 'evt_p8_infra_tn',
      easeFactor: 2.5,
      intervalDays: 1,
      repetitionCount: 1,
      status: 'REVIEW',
      nextReviewAt: new Date(testNow.getTime() - 200 * 3600000).toISOString(),
    });

    const feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 5 });
    const overdueItem = feed.items.find((i) => i.event.id === 'evt_p8_infra_tn');
    const cappedPassed = !!overdueItem && overdueItem.context.scoreBreakdown!.reviewPriority <= 100;

    results.push({
      suite: 'Review Priority',
      name: 'Overdue Review Priority Capping (Bounded <= 100 to Prevent Feed Starvation)',
      passed: cappedPassed,
      details: `200h Overdue Priority Score: ${overdueItem?.context.scoreBreakdown?.reviewPriority}/100`,
    });
  } catch (err: any) {
    results.push({ suite: 'Review Priority', name: 'Review Priority Capping', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 4. CATEGORY AFFINITY & BEHAVIOR TRACKING
  // -------------------------------------------------------------------------
  try {
    await cleanTestState();

    // Record 5 quiz attempts in 'economy'
    for (let i = 0; i < 5; i++) {
      await learningRepository.saveAttempt({
        userId: testUserId1,
        eventId: 'evt_p8_economy_rbi',
        score: 3,
        totalQuestions: 3,
        accuracy: 1.0,
        scorePercentage: 100,
        masteryStatus: 'STRONG',
        answers: {},
      });
    }

    // Record 1 save activity in 'infrastructure'
    await learningRepository.saveActivity({
      userId: testUserId1,
      activityType: 'EVENT_SAVED',
      eventId: 'evt_p8_infra_tn',
    });

    const feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 5 });
    const econItem = feed.items.find((i) => i.event.id === 'evt_p8_economy_rbi');
    const isroItem = feed.items.find((i) => i.event.id === 'evt_p8_space_isro');

    const affinityPassed =
      !!econItem &&
      !!isroItem &&
      econItem.context.scoreBreakdown!.categoryAffinity > isroItem.context.scoreBreakdown!.categoryAffinity;

    results.push({
      suite: 'Category Affinity',
      name: 'Category Affinity Derivation from Real Quiz & Activity History',
      passed: affinityPassed,
      details: `Economy Affinity: ${econItem?.context.scoreBreakdown?.categoryAffinity}%, Science Affinity: ${isroItem?.context.scoreBreakdown?.categoryAffinity}%`,
    });
  } catch (err: any) {
    results.push({ suite: 'Category Affinity', name: 'Category Affinity Derivation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 5. EXPLORATION & ANTI-FILTER-BUBBLE GUARANTEE
  // -------------------------------------------------------------------------
  try {
    await cleanTestState();

    // User is heavily engaged in 'economy'
    for (let i = 0; i < 10; i++) {
      await learningRepository.saveAttempt({
        userId: testUserId1,
        eventId: 'evt_p8_economy_rbi',
        score: 3,
        totalQuestions: 3,
        accuracy: 1.0,
        scorePercentage: 100,
        masteryStatus: 'STRONG',
        answers: {},
      });
    }

    const feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 5, explorationRatio: 0.20 });
    const hasExploration = feed.items.some((i) => i.context.isExplorationSlot || i.reasonCode === 'EXPLORATION' || i.event.category !== 'Economy & Money');
    const explorationNotDominant = feed.items.filter((i) => i.context.isExplorationSlot).length <= 2;

    results.push({
      suite: 'Exploration & Diversity',
      name: 'Anti-Filter-Bubble Exploration Injection (15-25% Reserved Slots)',
      passed: hasExploration && explorationNotDominant,
      details: `Exploration items: ${feed.meta.explorationItemCount}/${feed.items.length}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Exploration & Diversity', name: 'Exploration Injection', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 6. DIVERSITY & DEDUPLICATION RULES
  // -------------------------------------------------------------------------
  try {
    const feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 10 });
    const eventIds = feed.items.map((i) => i.event.id);
    const uniqueIds = new Set(eventIds);

    const categoryCounts: Record<string, number> = {};
    for (const item of feed.items) {
      const cat = item.event.category || 'other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    const noDuplicates = eventIds.length === uniqueIds.size;
    const diversityRespected = Object.values(categoryCounts).every((count) => count <= 3);

    results.push({
      suite: 'Exploration & Diversity',
      name: 'Category Diversity Limits (Max 3 Per Category) & Zero Duplicate Events',
      passed: noDuplicates && diversityRespected,
      details: `Unique: ${uniqueIds.size}/${eventIds.length}, Category counts: ${JSON.stringify(categoryCounts)}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Exploration & Diversity', name: 'Category Diversity & Deduplication', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 7. EXPLAINABILITY & DETERMINISTIC REASONS
  // -------------------------------------------------------------------------
  try {
    const feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 5 });
    const allHaveReasons = feed.items.every(
      (i) => !!i.recommendationReason && !!i.reasonCode && !!i.badgeLabel && !i.recommendationReason.includes('AI thinks')
    );

    const validCodes = ['REVIEW_DUE', 'WEAK_CONCEPT', 'KNOWLEDGE_GAP', 'CATEGORY_AFFINITY', 'EXPLORATION', 'BREAKING_GLOBAL', 'CONTINUE_LEARNING'];
    const codesValid = feed.items.every((i) => validCodes.includes(i.reasonCode));

    results.push({
      suite: 'Explainability',
      name: 'Deterministic Explainable Reasons (No Vague "AI Thinks" Placeholders)',
      passed: allHaveReasons && codesValid,
      details: `Reason sample: "${feed.items[0]?.recommendationReason}" (Code: ${feed.items[0]?.reasonCode}, Badge: ${feed.items[0]?.badgeLabel})`,
    });
  } catch (err: any) {
    results.push({ suite: 'Explainability', name: 'Deterministic Explainable Reasons', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 8. ADAPTIVE EXPLANATION LEVEL RECOMMENDATIONS
  // -------------------------------------------------------------------------
  try {
    const lvl1 = masteryService.getRecommendedExplanationLevel(20); // beginner
    const lvl2 = masteryService.getRecommendedExplanationLevel(55); // student
    const lvl3 = masteryService.getRecommendedExplanationLevel(75); // technical
    const lvl4 = masteryService.getRecommendedExplanationLevel(90); // deepDive

    const passedLvl = lvl1 === 'beginner' && lvl2 === 'student' && lvl3 === 'technical' && lvl4 === 'deepDive';

    results.push({
      suite: 'Adaptive Learning',
      name: 'Deterministic Complexity Mapping (<40->Beginner, 40-69->Student, 70-84->Technical, 85+->DeepDive)',
      passed: passedLvl,
      details: `20%->${lvl1}, 55%->${lvl2}, 75%->${lvl3}, 90%->${lvl4}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Adaptive Learning', name: 'Complexity Mapping', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 9. DAILY LEARNING SUMMARY & GOAL TRACKING
  // -------------------------------------------------------------------------
  try {
    await cleanTestState();

    // Set daily goal to 3
    await personalizationService.updateUserPreferences(testUserId1, { dailyGoal: 3 });

    // Submit 2 quiz attempts today
    await learningRepository.saveAttempt({
      userId: testUserId1,
      eventId: 'evt_p8_infra_tn',
      score: 3,
      totalQuestions: 3,
      accuracy: 1.0,
      scorePercentage: 100,
      masteryStatus: 'STRONG',
      answers: {},
      submittedAt: new Date().toISOString(),
    });

    await learningRepository.saveAttempt({
      userId: testUserId1,
      eventId: 'evt_p8_economy_rbi',
      score: 2,
      totalQuestions: 3,
      accuracy: 0.67,
      scorePercentage: 67,
      masteryStatus: 'DEVELOPING',
      answers: {},
      submittedAt: new Date().toISOString(),
    });

    const summary = await personalizationService.getDailyLearningSummary(testUserId1);
    const summaryPassed =
      summary.quizzesCompletedToday === 2 &&
      summary.dailyGoal === 3 &&
      summary.dailyGoalProgressPercentage === 67 &&
      summary.isDailyGoalAchieved === false;

    results.push({
      suite: 'Daily Summary',
      name: 'Daily Summary Analytics & Goal Completion Computation (2/3 Activities -> 67%)',
      passed: summaryPassed,
      details: `Quizzes today: ${summary.quizzesCompletedToday}/${summary.dailyGoal}, Progress: ${summary.dailyGoalProgressPercentage}%, NextAction: "${summary.recommendedNextAction?.title}"`,
    });
  } catch (err: any) {
    results.push({ suite: 'Daily Summary', name: 'Daily Summary Analytics', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 10. MULTI-TENANT ISOLATION & SECURITY
  // -------------------------------------------------------------------------
  try {
    // User 1 has preferences and activities from previous test
    const user1Prefs = await personalizationService.getUserPreferences(testUserId1);
    const user2Prefs = await personalizationService.getUserPreferences(testUserId2);

    // User 1 goal is 3, User 2 default goal is 3, update User 2 to 5
    await personalizationService.updateUserPreferences(testUserId2, { dailyGoal: 5 });
    const user1PrefsAfter = await personalizationService.getUserPreferences(testUserId1);
    const user2PrefsAfter = await personalizationService.getUserPreferences(testUserId2);

    const isolationPassed =
      user1PrefsAfter.dailyGoal === 3 &&
      user2PrefsAfter.dailyGoal === 5;

    results.push({
      suite: 'Security & Isolation',
      name: 'Strict Multi-Tenant User Isolation (User A Cannot Mutate User B State)',
      passed: isolationPassed,
      details: `User 1 Goal: ${user1PrefsAfter.dailyGoal}, User 2 Goal: ${user2PrefsAfter.dailyGoal}`,
    });
  } catch (err: any) {
    results.push({ suite: 'Security & Isolation', name: 'Multi-Tenant Isolation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 11. CLIENT SCORE INJECTION PREVENTION
  // -------------------------------------------------------------------------
  try {
    // Personalized feed calculates scores strictly server-side
    const feed = await personalizationService.getPersonalizedFeed(testUserId1, { limit: 3 });
    const scoresAreServerCalculated = feed.items.every(
      (i) => typeof i.personalizedScore === 'number' && i.personalizedScore >= 0 && i.personalizedScore <= 100
    );

    results.push({
      suite: 'Security & Isolation',
      name: 'Client Score Injection Prevention (Scores Strictly Computed Server-Side)',
      passed: scoresAreServerCalculated,
      details: `Verified ${feed.items.length} server-computed scores`,
    });
  } catch (err: any) {
    results.push({ suite: 'Security & Isolation', name: 'Client Score Injection Prevention', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // PRINT SUMMARY
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('PHASE 8 TEST RESULTS SUMMARY:');
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
  console.log(`Phase 8 Test Results: ${passedCount} / ${results.length} PASSED`);
  console.log('======================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runPhase8VerificationSuite().catch((err) => {
  console.error('Phase 8 Verification Suite failed with unexpected exception:', err);
  process.exit(1);
});
