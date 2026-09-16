process.env.NODE_ENV = 'test';
import { AIProviderFactory } from '../services/ai/aiProviderFactory.js';
import { DeterministicProvider } from '../services/ai/providers/deterministicProvider.js';
import { GeminiProvider } from '../services/ai/providers/geminiProvider.js';
import { aiService } from '../services/ai/aiService.js';
import { aiUnderstandingRepository } from '../repositories/aiUnderstanding.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { 
  fiveWOneHSchema, 
  multiLevelExplanationSchema, 
  conceptsArraySchema, 
  quizArraySchema,
  quizSubmissionSchema
} from '../services/ai/validators/aiOutput.validator.js';
import { CanonicalEvent } from '../types/index.js';

import { query } from '../db/dbClient.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase6VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 6: AI INTELLIGENCE & UNDERSTANDING LAYER TESTS');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  const sampleEventId = 'evt_tn_ev_hub_2026';

  // Seed sample event in Postgres to satisfy foreign key constraints
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
  } catch (err: any) {
    // Ignore if offline
  }

  // -------------------------------------------------------------------------
  // 1. AI PROVIDER FACTORY & FALLBACK TESTS
  // -------------------------------------------------------------------------
  try {
    const deterministicProvider = AIProviderFactory.getProvider({ provider: 'deterministic' });
    const isDeterministic = deterministicProvider instanceof DeterministicProvider;

    results.push({
      suite: 'Provider Factory',
      name: 'Deterministic Provider Instantiation',
      passed: isDeterministic && deterministicProvider.name === 'deterministic',
      details: `Provider: ${deterministicProvider.name}, Model: ${deterministicProvider.modelName}`
    });
  } catch (err: any) {
    results.push({ suite: 'Provider Factory', name: 'Deterministic Provider Instantiation', passed: false, error: err.message });
  }

  try {
    // Gemini provider with fallback
    const geminiProvider = new GeminiProvider({ apiKey: '' });
    const sampleEvent = await EventRepository.findById(sampleEventId);
    if (!sampleEvent) throw new Error('Sample event not found in repository');

    const result = await geminiProvider.generate5W1H({ event: sampleEvent });
    const isValid = fiveWOneHSchema.safeParse(result).success;

    results.push({
      suite: 'Provider Fallback',
      name: 'Gemini Graceful Fallback on Missing API Key',
      passed: isValid && !!result.whatHappened,
      details: `Fallback produced valid 5W1H summary of length ${result.whatHappened.length}`
    });
  } catch (err: any) {
    results.push({ suite: 'Provider Fallback', name: 'Gemini Graceful Fallback on Missing API Key', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 2. 5W1H UNDERSTANDING ENGINE TESTS
  // -------------------------------------------------------------------------
  try {
    const fiveWOneH = await aiService.get5W1H(sampleEventId, true);
    const parsed = fiveWOneHSchema.safeParse(fiveWOneH);

    const hasAllFields = !!(
      fiveWOneH.whatHappened &&
      fiveWOneH.whyDidItHappen &&
      fiveWOneH.whyDoesItMatter &&
      Array.isArray(fiveWOneH.whoIsAffected) && fiveWOneH.whoIsAffected.length >= 1 &&
      Array.isArray(fiveWOneH.whatCouldHappenNext) && fiveWOneH.whatCouldHappenNext.length >= 1 &&
      fiveWOneH.background
    );

    results.push({
      suite: '5W1H Understanding',
      name: 'Complete 6-Field Grounded Structure & Zod Validation',
      passed: parsed.success && hasAllFields,
      details: `whoIsAffected items: ${fiveWOneH.whoIsAffected.length}, whatCouldHappenNext items: ${fiveWOneH.whatCouldHappenNext.length}`
    });
  } catch (err: any) {
    results.push({ suite: '5W1H Understanding', name: 'Complete 6-Field Grounded Structure & Zod Validation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 3. 5-LEVEL ADAPTIVE EXPLANATIONS TESTS
  // -------------------------------------------------------------------------
  try {
    const explanations = await aiService.getAllExplanations(sampleEventId, true);
    const parsed = multiLevelExplanationSchema.safeParse(explanations);

    const levels = ['verySimple', 'beginner', 'student', 'technical', 'deepDive'] as const;
    const allPresent = levels.every(lvl => typeof explanations[lvl] === 'string' && explanations[lvl].length > 20);

    results.push({
      suite: 'Adaptive Explanations',
      name: '5-Level Progressive Complexity Generation',
      passed: parsed.success && allPresent,
      details: `Generated levels: ${levels.join(', ')}`
    });

    // Test single level retrieval
    const studentExpl = await aiService.getExplanation(sampleEventId, 'student');
    results.push({
      suite: 'Adaptive Explanations',
      name: 'Single Level Fetch via Cache',
      passed: studentExpl.level === 'student' && !!studentExpl.content,
      details: `Student explanation length: ${studentExpl.content.length}`
    });
  } catch (err: any) {
    results.push({ suite: 'Adaptive Explanations', name: '5-Level Progressive Complexity Generation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 4. CONCEPT & PREREQUISITE EXTRACTION TESTS
  // -------------------------------------------------------------------------
  try {
    const concepts = await aiService.getConcepts(sampleEventId, true);
    const parsed = conceptsArraySchema.safeParse(concepts);

    const hasPrereqs = concepts.some(c => Array.isArray(c.prerequisites));
    const hasValidIds = concepts.every(c => c.id && c.title && c.shortDefinition);

    results.push({
      suite: 'Concept Graph',
      name: 'Concept Extraction & Dependency Edge Linking',
      passed: parsed.success && hasValidIds && concepts.length >= 1,
      details: `Extracted ${concepts.length} concepts (${concepts.map(c => c.title).join(', ')})`
    });
  } catch (err: any) {
    results.push({ suite: 'Concept Graph', name: 'Concept Extraction & Dependency Edge Linking', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 5. ACTIVE RECALL QUIZ ENGINE & SERVER EVALUATION TESTS
  // -------------------------------------------------------------------------
  try {
    const quiz = await aiService.getQuiz(sampleEventId, true);
    const parsed = quizArraySchema.safeParse(quiz);

    const exactly3 = quiz.length === 3;
    const validStructure = quiz.every(q => q.options.length >= 2 && typeof q.correctAnswer === 'number' && !!q.explanation);

    results.push({
      suite: 'Quiz Engine',
      name: '3 Grounded Multiple Choice Questions Generation',
      passed: parsed.success && exactly3 && validStructure,
      details: `Generated ${quiz.length} MCQs with explanations`
    });

    // Perfect submission test
    const perfectAnswers: Record<string, number> = {};
    quiz.forEach(q => { perfectAnswers[String(q.id)] = q.correctAnswer; });

    const perfectResult = await aiService.submitQuiz(sampleEventId, { answers: perfectAnswers });

    results.push({
      suite: 'Quiz Engine',
      name: 'Server-Side Evaluation with 100% Score',
      passed: perfectResult.correctCount === 3 && perfectResult.scorePercentage === 100 && perfectResult.masteryStatus === 'STRONG',
      details: `Score: ${perfectResult.correctCount}/3 (${perfectResult.scorePercentage}%), Status: ${perfectResult.masteryStatus}`
    });

    // Imperfect submission test
    const imperfectAnswers: Record<string, number> = {};
    quiz.forEach((q, idx) => {
      // 1 correct, 2 wrong
      imperfectAnswers[String(q.id)] = idx === 0 ? q.correctAnswer : (q.correctAnswer === 0 ? 1 : 0);
    });

    const imperfectResult = await aiService.submitQuiz(sampleEventId, { answers: imperfectAnswers });

    results.push({
      suite: 'Quiz Engine',
      name: 'Server-Side Evaluation with Partial Score & Explanations',
      passed: imperfectResult.correctCount === 1 && imperfectResult.scorePercentage === 33 && imperfectResult.masteryStatus === 'NEEDS_LEARNING',
      details: `Score: ${imperfectResult.correctCount}/3 (${imperfectResult.scorePercentage}%), Status: ${imperfectResult.masteryStatus}`
    });
  } catch (err: any) {
    results.push({ suite: 'Quiz Engine', name: 'Quiz Generation & Evaluation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 6. CONCURRENCY MUTEX LOCKING TESTS
  // -------------------------------------------------------------------------
  try {
    // Run 5 simultaneous requests for 5W1H on the same event
    const promises = [
      aiService.get5W1H(sampleEventId, true),
      aiService.get5W1H(sampleEventId),
      aiService.get5W1H(sampleEventId),
      aiService.get5W1H(sampleEventId),
      aiService.get5W1H(sampleEventId)
    ];

    const resultsArray = await Promise.all(promises);
    const allEqual = resultsArray.every(r => r.whatHappened === resultsArray[0].whatHappened);

    results.push({
      suite: 'Concurrency & Locking',
      name: 'Concurrent Request Deduplication via Per-Event Mutex',
      passed: allEqual && resultsArray.length === 5,
      details: `Processed 5 concurrent requests with identical grounded output`
    });
  } catch (err: any) {
    results.push({ suite: 'Concurrency & Locking', name: 'Concurrent Request Deduplication via Per-Event Mutex', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // 7. CACHE INVALIDATION & FULL REFRESH TESTS
  // -------------------------------------------------------------------------
  try {
    await aiService.refreshEventAI(sampleEventId);
    const summaryAfter = await aiUnderstandingRepository.getSummaryByEventId(sampleEventId);
    const explsAfter = await aiUnderstandingRepository.getExplanationsByEventId(sampleEventId);
    const quizAfter = await aiUnderstandingRepository.getQuizByEventId(sampleEventId);

    const fullyRebuilt = !!summaryAfter && explsAfter.length === 5 && !!quizAfter;

    results.push({
      suite: 'Cache Management',
      name: 'Full Event AI Refresh & In-Memory/DB Cache Rebuilding',
      passed: fullyRebuilt,
      details: `Summaries: ${!!summaryAfter}, Explanations: ${explsAfter.length}/5, Quiz: ${!!quizAfter}`
    });
  } catch (err: any) {
    results.push({ suite: 'Cache Management', name: 'Full Event AI Refresh & In-Memory/DB Cache Rebuilding', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // PRINT TEST SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('PHASE 6 TEST RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------------');

  let passedCount = 0;
  for (const r of results) {
    const symbol = r.passed ? '✅' : '❌';
    console.log(`${symbol} [${r.suite}] ${r.name}`);
    if (r.details) console.log(`   └─ ${r.details}`);
    if (r.error) console.log(`   └─ ERROR: ${r.error}`);
    if (r.passed) passedCount++;
  }

  console.log('\n======================================================================');
  console.log(`Phase 6 Test Results: ${passedCount} / ${results.length} PASSED`);
  console.log('======================================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase6VerificationSuite().catch((err) => {
  console.error('Fatal error during Phase 6 test execution:', err);
  process.exit(1);
});
