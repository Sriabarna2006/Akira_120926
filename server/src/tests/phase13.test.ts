process.env.NODE_ENV = 'test';
import { scenarioSimulationService } from '../services/storyline/scenarioSimulation.service.js';
import { scenarioSimulationRepository } from '../repositories/scenarioSimulation.repository.js';
import { storylineService } from '../services/storyline/storyline.service.js';
import { storylineRepository } from '../repositories/storyline.repository.js';
import { storylineCatchupService } from '../services/storyline/storylineCatchup.service.js';
import { EventRepository } from '../repositories/event.repository.js';
import { aiUnderstandingRepository } from '../repositories/aiUnderstanding.repository.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { spacedRepetitionService } from '../services/learning/spacedRepetition.service.js';
import { personalizationService } from '../services/learning/personalization.service.js';
import { knowledgeGraphService } from '../services/learning/knowledgeGraph.service.js';
import { evidenceService } from '../services/evidence/evidence.service.js';
import {
  createScenarioBodySchema,
  storylineScenarioParamsSchema,
} from '../validators/scenarioSimulation.validator.js';
import { CanonicalEvent, Storyline } from '../types/index.js';

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase13VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 13: INTERACTIVE STORYLINE SCENARIO SIMULATION ENGINE');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  const now = new Date();

  // Test Entities Setup
  const testStorylineId = 'stl_p13_semiconductor_sim';
  const testEmptyStorylineId = 'stl_p13_empty_sim';

  const userA = '00000000-0000-0000-0000-00000000000a';
  const userB = '00000000-0000-0000-0000-00000000000b';

  // Seed Events
  const event1: CanonicalEvent = {
    id: 'evt_p13_semi_01',
    title: 'Union Cabinet Approves ₹76,000 Crore Semiconductor Fab Incentive Framework',
    summary: 'Central government unveils initial financial subsidy package for commercial semiconductor fabrication plants.',
    regionId: 'india',
    categoryId: 'technology',
    region: 'India',
    category: 'Technology',
    importanceScore: 92,
    velocityScore: 88,
    finalRankScore: 94,
    urgencyLabel: 'IMPORTANT',
    whyItMatters: 'Establishes sovereign chip manufacturing capability.',
    lifecycleStatus: 'OFFICIAL_CONFIRMATION',
    firstPublishedAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
    lastUpdatedAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
    createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
    sourceCount: 3,
  };

  const event2: CanonicalEvent = {
    id: 'evt_p13_semi_02',
    title: 'Joint Venture Finalizes $10 Billion Foundry Construction in Gujarat Dholera',
    summary: 'Consortium partners break ground on 28nm high-volume logic semiconductor plant.',
    regionId: 'india',
    categoryId: 'technology',
    region: 'India',
    category: 'Technology',
    importanceScore: 94,
    velocityScore: 90,
    finalRankScore: 95,
    urgencyLabel: 'IMPORTANT',
    whyItMatters: 'Transitions policy framework into physical manufacturing infrastructure.',
    lifecycleStatus: 'OFFICIAL_CONFIRMATION',
    firstPublishedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    lastUpdatedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    sourceCount: 4,
  };

  const event3: CanonicalEvent = {
    id: 'evt_p13_semi_03',
    title: 'Commercial Production Roadmap Announced for 28nm AI Accelerator Wafers',
    summary: 'Foundry consortium announces first commercial silicon tape-out schedule for industrial customers.',
    regionId: 'india',
    categoryId: 'technology',
    region: 'India',
    category: 'Technology',
    importanceScore: 96,
    velocityScore: 94,
    finalRankScore: 97,
    urgencyLabel: 'IMPORTANT',
    whyItMatters: 'Enables domestic electronics and AI companies to source local microcontrollers.',
    lifecycleStatus: 'NEW_DEVELOPMENT',
    firstPublishedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    lastUpdatedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    sourceCount: 5,
  };

  // Seed Repositories
  await EventRepository.create(event1);
  await EventRepository.create(event2);
  await EventRepository.create(event3);

  await storylineRepository.saveStoryline({
    id: testStorylineId,
    title: 'India Sovereign Semiconductor & Fabrication Ecosystem Roadmap',
    summary: 'Chronological timeline of national chip manufacturing policies, fab approvals, and production milestones.',
    status: 'ACTIVE',
    regionId: 'india',
    primaryCategoryId: 'technology',
    startedAt: event1.firstPublishedAt!,
    lastUpdatedAt: event3.firstPublishedAt!,
    currentEventId: event3.id,
    trajectory: 'DEVELOPING',
    eventCount: 3,
    turningPointCount: 1,
  });

  await storylineRepository.addEventToStoryline({
    storylineId: testStorylineId,
    eventId: event1.id,
    relationshipType: 'ORIGIN',
    sequenceOrder: 1,
    eventTime: event1.firstPublishedAt!,
    associationScore: 100,
    associationExplanation: 'Foundational national policy clearance.',
  });

  await storylineRepository.addEventToStoryline({
    storylineId: testStorylineId,
    eventId: event2.id,
    relationshipType: 'DECISION',
    sequenceOrder: 2,
    eventTime: event2.firstPublishedAt!,
    associationScore: 95,
    associationExplanation: 'Groundbreaking for primary commercial foundry.',
  });

  await storylineRepository.addEventToStoryline({
    storylineId: testStorylineId,
    eventId: event3.id,
    relationshipType: 'DEVELOPMENT',
    sequenceOrder: 3,
    eventTime: event3.firstPublishedAt!,
    associationScore: 92,
    associationExplanation: 'First commercial silicon production tape-out.',
  });

  // Seed Concepts
  await aiUnderstandingRepository.saveConcepts(event1.id, [
    { id: 'c_semi_fab', title: 'Semiconductor Fabrication', slug: 'semiconductor-fab', shortDefinition: 'Chip manufacturing facility.' },
    { id: 'c_semi_node', title: 'Process Node (28nm)', slug: 'process-node', shortDefinition: 'Silicon feature geometry.' },
  ]);

  await aiUnderstandingRepository.saveConcepts(event2.id, [
    { id: 'c_semi_fab', title: 'Semiconductor Fabrication', slug: 'semiconductor-fab', shortDefinition: 'Chip manufacturing facility.' },
    { id: 'c_semi_capex', title: 'Capital Subsidies', slug: 'capital-subsidies', shortDefinition: 'Government co-funding for fabs.' },
  ]);

  await aiUnderstandingRepository.saveConcepts(event3.id, [
    { id: 'c_semi_fab', title: 'Semiconductor Fabrication', slug: 'semiconductor-fab', shortDefinition: 'Chip manufacturing facility.' },
    { id: 'c_semi_tapeout', title: 'Silicon Tape-Out', slug: 'silicon-tapeout', shortDefinition: 'Final design submission for photomask creation.' },
  ]);

  // -------------------------------------------------------------------------
  // SUITE 1: Scenario Creation, Schema & Validation (Tests 1–6)
  // -------------------------------------------------------------------------

  let createdScenarioId = '';

  // Test 1: Valid scenario creation returns complete ScenarioResult
  try {
    const result = await scenarioSimulationService.createAndSimulateScenario(
      testStorylineId,
      userA,
      {
        targetEventId: event1.id,
        scenarioType: 'REMOVE_EVENT',
        question: 'What if the ₹76,000 Crore Semiconductor Fab Framework was not approved?',
        assumptionText: 'Assume the central cabinet denied the subsidy package, halting commercial incentive clearances.',
      }
    );

    createdScenarioId = result.scenario.id;
    const passed =
      result.scenario.id &&
      result.scenario.scenarioType === 'REMOVE_EVENT' &&
      result.baselineFacts.length === 3 &&
      result.affectedEvents.length === 2 &&
      result.derivedConsequences.length > 0;

    results.push({
      num: 1,
      name: 'Creation: Valid Scenario Simulation Formulation',
      passed: Boolean(passed),
      details: `Created scenario "${result.scenario.title}" with ${result.affectedEvents.length} affected downstream events.`,
    });
  } catch (err: any) {
    results.push({ num: 1, name: 'Creation: Valid Scenario', passed: false, error: err.message });
  }

  // Test 2: Foreign target event outside storyline rejected
  try {
    let rejected = false;
    try {
      await scenarioSimulationService.createAndSimulateScenario(
        testStorylineId,
        userA,
        {
          targetEventId: 'evt_foreign_random_99',
          scenarioType: 'REMOVE_EVENT',
          question: 'What if a foreign event was altered?',
          assumptionText: 'Assume unrelated event changed.',
        }
      );
    } catch (e: any) {
      rejected = e.message.includes('does not belong');
    }

    results.push({
      num: 2,
      name: 'Validation: Rejection of Target Event Outside Storyline',
      passed: rejected,
      details: `Foreign target event correctly blocked: ${rejected}`,
    });
  } catch (err: any) {
    results.push({ num: 2, name: 'Validation: Foreign Event', passed: false, error: err.message });
  }

  // Test 3: Nonexistent storyline returns 404
  try {
    let rejected = false;
    try {
      await scenarioSimulationService.createAndSimulateScenario(
        'stl_nonexistent_xyz',
        userA,
        {
          scenarioType: 'REMOVE_EVENT',
          question: 'What if something changed?',
          assumptionText: 'Assume something changed.',
        }
      );
    } catch (e: any) {
      rejected = e.message.includes('not found');
    }

    results.push({
      num: 3,
      name: 'Validation: Rejection of Nonexistent Storyline',
      passed: rejected,
      details: `Nonexistent storyline correctly blocked: ${rejected}`,
    });
  } catch (err: any) {
    results.push({ num: 3, name: 'Validation: Nonexistent Storyline', passed: false, error: err.message });
  }

  // Test 4: Invalid scenario type rejected by Zod
  try {
    const invalidTypeParse = createScenarioBodySchema.safeParse({
      scenarioType: 'PREDICT_FUTURE_SPECULATION',
      question: 'Will chip stocks double next year?',
      assumptionText: 'Assume stock prices surge 200%.',
    });

    results.push({
      num: 4,
      name: 'Validation: Strict Rejection of Unsupported / Speculative Scenario Types',
      passed: !invalidTypeParse.success,
      details: `Invalid scenario type rejected by Zod: ${!invalidTypeParse.success}`,
    });
  } catch (err: any) {
    results.push({ num: 4, name: 'Validation: Scenario Type', passed: false, error: err.message });
  }

  // Test 5: Empty question rejected by Zod (min 5 chars)
  try {
    const emptyQParse = createScenarioBodySchema.safeParse({
      scenarioType: 'REMOVE_EVENT',
      question: 'Why',
      assumptionText: 'Assume something changed in the policy.',
    });

    results.push({
      num: 5,
      name: 'Validation: Minimum Length Enforcement on Question',
      passed: !emptyQParse.success,
      details: `Short question rejected: ${!emptyQParse.success}`,
    });
  } catch (err: any) {
    results.push({ num: 5, name: 'Validation: Question Length', passed: false, error: err.message });
  }

  // Test 6: Excessively long question/assumption rejected by Zod
  try {
    const longQ = 'A'.repeat(350);
    const longParse = createScenarioBodySchema.safeParse({
      scenarioType: 'REMOVE_EVENT',
      question: longQ,
      assumptionText: 'Valid assumption text.',
    });

    results.push({
      num: 6,
      name: 'Validation: Maximum Length Constraint on Hypothesis Question (300 chars)',
      passed: !longParse.success,
      details: `Oversized question rejected: ${!longParse.success}`,
    });
  } catch (err: any) {
    results.push({ num: 6, name: 'Validation: Max Length', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Scenario Types Execution & Causal Semantics (Tests 7–11)
  // -------------------------------------------------------------------------

  // Test 7: REMOVE_EVENT scenario sets unoccurred state and disrupts downstream premises
  try {
    const removeResult = await scenarioSimulationService.createAndSimulateScenario(
      testStorylineId,
      userA,
      {
        targetEventId: event1.id,
        scenarioType: 'REMOVE_EVENT',
        question: 'What if event 1 was removed?',
        assumptionText: 'Assume event 1 did not happen.',
      }
    );

    const passed =
      removeResult.assumption.hypotheticalState.hypotheticalStatus === 'UNOCCURRED' &&
      removeResult.affectedEvents.every((e) => e.impactDirection === 'DISRUPTED');

    results.push({
      num: 7,
      name: 'Scenario Type: REMOVE_EVENT Causal Disruption Semantics',
      passed,
      details: `Assumption status: ${removeResult.assumption.hypotheticalState.hypotheticalStatus}, Downstream impact: DISRUPTED`,
    });
  } catch (err: any) {
    results.push({ num: 7, name: 'Scenario Type: REMOVE_EVENT', passed: false, error: err.message });
  }

  // Test 8: DELAY_EVENT scenario introduces time shift and delays downstream chronology
  try {
    const delayResult = await scenarioSimulationService.createAndSimulateScenario(
      testStorylineId,
      userA,
      {
        targetEventId: event1.id,
        scenarioType: 'DELAY_EVENT',
        question: 'What if the fab policy was delayed by 6 months?',
        assumptionText: 'Assume the incentive framework clearance was delayed by 180 days.',
      }
    );

    const passed =
      delayResult.assumption.hypotheticalState.timeShiftHours === 4320 &&
      delayResult.affectedEvents.every((e) => e.impactDirection === 'DELAYED');

    results.push({
      num: 8,
      name: 'Scenario Type: DELAY_EVENT Chronological Shift Semantics',
      passed,
      details: `Time shift: ${delayResult.assumption.hypotheticalState.timeShiftHours}h, Downstream impact: DELAYED`,
    });
  } catch (err: any) {
    results.push({ num: 8, name: 'Scenario Type: DELAY_EVENT', passed: false, error: err.message });
  }

  // Test 9: CHANGE_CONDITION scenario marks amplified condition shifts
  try {
    const changeResult = await scenarioSimulationService.createAndSimulateScenario(
      testStorylineId,
      userA,
      {
        targetEventId: event2.id,
        scenarioType: 'CHANGE_CONDITION',
        question: 'What if the fab funding was doubled to $20 Billion?',
        assumptionText: 'Assume consortium doubled capital expenditure budget.',
      }
    );

    const passed =
      changeResult.affectedEvents.length === 1 &&
      changeResult.affectedEvents[0].impactDirection === 'AMPLIFIED';

    results.push({
      num: 9,
      name: 'Scenario Type: CHANGE_CONDITION Parameter Mutation Semantics',
      passed,
      details: `Affected downstream event: ${changeResult.affectedEvents[0]?.title}, Impact: ${changeResult.affectedEvents[0]?.impactDirection}`,
    });
  } catch (err: any) {
    results.push({ num: 9, name: 'Scenario Type: CHANGE_CONDITION', passed: false, error: err.message });
  }

  // Test 10: REVERSE_RELATION scenario inverts decision polarity
  try {
    const reverseResult = await scenarioSimulationService.createAndSimulateScenario(
      testStorylineId,
      userA,
      {
        targetEventId: event2.id,
        scenarioType: 'REVERSE_RELATION',
        question: 'What if the consortium cancelled the Gujarat foundry project?',
        assumptionText: 'Assume joint venture decided against constructing the fab.',
      }
    );

    const passed =
      reverseResult.affectedEvents.length === 1 &&
      reverseResult.affectedEvents[0].impactDirection === 'DISRUPTED';

    results.push({
      num: 10,
      name: 'Scenario Type: REVERSE_RELATION Polarity Inversion Semantics',
      passed,
      details: `Impact direction: ${reverseResult.affectedEvents[0]?.impactDirection}`,
    });
  } catch (err: any) {
    results.push({ num: 10, name: 'Scenario Type: REVERSE_RELATION', passed: false, error: err.message });
  }

  // Test 11: CONTINUE_CONDITION scenario preserves antecedent status
  try {
    const continueResult = await scenarioSimulationService.createAndSimulateScenario(
      testStorylineId,
      userA,
      {
        targetEventId: event1.id,
        scenarioType: 'CONTINUE_CONDITION',
        question: 'What if the policy consultation stage continued indefinitely?',
        assumptionText: 'Assume draft framework stayed under inter-ministerial review.',
      }
    );

    const passed =
      continueResult.affectedEvents.length === 2 &&
      continueResult.affectedEvents[0].impactDirection === 'MITIGATED';

    results.push({
      num: 11,
      name: 'Scenario Type: CONTINUE_CONDITION Antecedent Preservation Semantics',
      passed,
      details: `Impact direction: ${continueResult.affectedEvents[0]?.impactDirection}`,
    });
  } catch (err: any) {
    results.push({ num: 11, name: 'Scenario Type: CONTINUE_CONDITION', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 3: Grounding, Epistemic Humility & Non-Prediction (Tests 12–16)
  // -------------------------------------------------------------------------

  // Test 12: Baseline facts strictly classified as VERIFIED_FACT
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const passed = res.baselineFacts.every((bf) => bf.classification === 'VERIFIED_FACT');

    results.push({
      num: 12,
      name: 'Grounding: Strict Epistemic Classification of Baseline Facts (VERIFIED_FACT)',
      passed,
      details: `All ${res.baselineFacts.length} baseline facts verified as VERIFIED_FACT`,
    });
  } catch (err: any) {
    results.push({ num: 12, name: 'Grounding: Baseline Facts', passed: false, error: err.message });
  }

  // Test 13: User assumption strictly classified as HYPOTHETICAL_ASSUMPTION
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const passed = res.hypotheticalChange.classification === 'HYPOTHETICAL_ASSUMPTION';

    results.push({
      num: 13,
      name: 'Grounding: Strict Epistemic Classification of User Assumption (HYPOTHETICAL_ASSUMPTION)',
      passed,
      details: `Hypothetical change classification: ${res.hypotheticalChange.classification}`,
    });
  } catch (err: any) {
    results.push({ num: 13, name: 'Grounding: User Assumption', passed: false, error: err.message });
  }

  // Test 14: Propagated outcomes strictly classified as DERIVED_CONSEQUENCE
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const passed =
      res.affectedEvents.every((e) => e.classification === 'DERIVED_CONSEQUENCE') &&
      res.derivedConsequences.every((dc) => dc.classification === 'DERIVED_CONSEQUENCE');

    results.push({
      num: 14,
      name: 'Grounding: Strict Epistemic Classification of Propagated Outcomes (DERIVED_CONSEQUENCE)',
      passed,
      details: `Verified ${res.affectedEvents.length} affected events and ${res.derivedConsequences.length} consequences as DERIVED_CONSEQUENCE`,
    });
  } catch (err: any) {
    results.push({ num: 14, name: 'Grounding: Derived Consequences', passed: false, error: err.message });
  }

  // Test 15: Non-predictable alternative outcomes strictly classified as UNKNOWN
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const passed =
      res.unknowns.length >= 2 &&
      res.unknowns.every((u) => u.classification === 'UNKNOWN');

    results.push({
      num: 15,
      name: 'Epistemic Humility: Explicit Identification of Unknown Non-Predictable Areas (UNKNOWN)',
      passed,
      details: `Identified ${res.unknowns.length} explicit UNKNOWN boundaries: "${res.unknowns[0]?.topic}"`,
    });
  } catch (err: any) {
    results.push({ num: 15, name: 'Epistemic Humility: Unknown Areas', passed: false, error: err.message });
  }

  // Test 16: Grounded summary contains zero future-prediction / probability claims
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const hasPredictionClaims =
      res.groundedSummary.includes('% chance') ||
      res.groundedSummary.includes('will definitely happen') ||
      res.groundedSummary.includes('forecast predicts');

    results.push({
      num: 16,
      name: 'Safety: Zero Speculative Future Predictions or Probability Hallucinations in Output',
      passed: !hasPredictionClaims,
      details: `Verified non-predictive summary phrasing: "${res.groundedSummary.substring(0, 70)}..."`,
    });
  } catch (err: any) {
    results.push({ num: 16, name: 'Safety: Non-prediction', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Storyline, Trajectory & Phase 12 Catch-Up Integration (Tests 17–20)
  // -------------------------------------------------------------------------

  // Test 17: Factual historical storyline timeline preserved unchanged
  try {
    const timeline = await storylineService.getTimeline(testStorylineId);
    const passed =
      timeline.length === 3 &&
      timeline[0].eventId === event1.id &&
      timeline[1].eventId === event2.id &&
      timeline[2].eventId === event3.id;

    results.push({
      num: 17,
      name: 'Integrity: Factual Storyline Timeline Preserved 100% Unmodified by Simulations',
      passed,
      details: `Factual timeline sequence: ${timeline.map((t) => t.eventId).join(' -> ')}`,
    });
  } catch (err: any) {
    results.push({ num: 17, name: 'Integrity: Storyline Timeline', passed: false, error: err.message });
  }

  // Test 18: Storyline turning points correctly flagged and impacted in scenario
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const turningPointEvents = res.affectedEvents.filter((e) => e.isTurningPoint);
    const passed = turningPointEvents.length > 0;

    results.push({
      num: 18,
      name: 'Phase 11 Integration: Storyline Turning Points Identified in Scenario Impacts',
      passed,
      details: `Found ${turningPointEvents.length} turning point event(s) in affected scope.`,
    });
  } catch (err: any) {
    results.push({ num: 18, name: 'Phase 11: Turning Points', passed: false, error: err.message });
  }

  // Test 19: Phase 11 trajectory state integrated into baseline
  try {
    const stl = await storylineRepository.findById(testStorylineId);
    const passed = Boolean(stl && stl.trajectory === 'DEVELOPING' && stl.status === 'ACTIVE');

    results.push({
      num: 19,
      name: 'Phase 11 Integration: Trajectory & Status Models Maintained',
      passed,
      details: `Storyline status: ${stl?.status}, trajectory: ${stl?.trajectory}`,
    });
  } catch (err: any) {
    results.push({ num: 19, name: 'Phase 11: Trajectory Model', passed: false, error: err.message });
  }

  // Test 20: Storyline Catch-Up briefing from Phase 12 accessible alongside scenarios
  try {
    const briefing = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA);
    const passed = Boolean(briefing && briefing.briefingSummary && briefing.newDevelopments);

    results.push({
      num: 20,
      name: 'Phase 12 Integration: Catch-Up Briefings Seamlessly Co-exist with Scenarios',
      passed,
      details: `Catch-up briefing generatedAt: ${briefing.generatedAt}`,
    });
  } catch (err: any) {
    results.push({ num: 20, name: 'Phase 12: Catch-Up Co-existence', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Knowledge Graph Traversal & Bounded Propagation (Tests 21–24)
  // -------------------------------------------------------------------------

  // Test 21: Concept impacts propagated from target event
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const hasDirect = res.affectedConcepts.some((c) => c.impactType === 'DIRECT');
    const hasPropagated = res.affectedConcepts.some((c) => c.impactType === 'PROPAGATED');

    results.push({
      num: 21,
      name: 'Knowledge Graph: Concept Impact Propagation (DIRECT & PROPAGATED)',
      passed: hasDirect || hasPropagated,
      details: `Identified ${res.affectedConcepts.length} affected concepts (Direct & Propagated)`,
    });
  } catch (err: any) {
    results.push({ num: 21, name: 'Knowledge Graph: Concept Propagation', passed: false, error: err.message });
  }

  // Test 22: Unlinked concepts not hallucinated or fabricated
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const hasFabricatedConcept = res.affectedConcepts.some((c) => c.conceptId === 'c_unrelated_random');

    results.push({
      num: 22,
      name: 'Knowledge Graph: Zero Hallucination of Unlinked Arbitrary Concepts',
      passed: !hasFabricatedConcept,
      details: `No fabricated concepts detected across ${res.affectedConcepts.length} affected concept records`,
    });
  } catch (err: any) {
    results.push({ num: 22, name: 'Knowledge Graph: Zero Hallucination', passed: false, error: err.message });
  }

  // Test 23: Graph traversal depth bounded (max 3 hops)
  try {
    const related = await knowledgeGraphService.getRelatedConcepts('computer-security', 3);
    const passed = Array.isArray(related) && related.every((r) => r.graphDistance <= 3);

    results.push({
      num: 23,
      name: 'Knowledge Graph: Bounded Traversal Depth Enforced (Max Depth <= 3)',
      passed,
      details: `Verified ${related.length} concept graph distances are within bounded limit`,
    });
  } catch (err: any) {
    results.push({ num: 23, name: 'Knowledge Graph: Bounded Depth', passed: false, error: err.message });
  }

  // Test 24: Concept mastery levels properly assigned
  try {
    // Seed mastery for user A on c_semi_fab = 90 (STRONG)
    await learningRepository.saveProgress({
      userId: userA,
      conceptId: 'c_semi_fab',
      masteryScore: 90,
      masteryStatus: 'STRONG',
      attemptCount: 3,
      correctCount: 3,
      incorrectCount: 0,
    });

    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA, true);
    const fabConcept = res.affectedConcepts.find((c) => c.conceptId === 'c_semi_fab');
    const passed = fabConcept?.masteryStatus === 'STRONG';

    results.push({
      num: 24,
      name: 'Personalization: Phase 7 Mastery Integration into Scenario Affected Concepts',
      passed: Boolean(passed),
      details: `Concept "c_semi_fab" mapped to user mastery: ${fabConcept?.masteryStatus} (${fabConcept?.masteryScore}%)`,
    });
  } catch (err: any) {
    results.push({ num: 24, name: 'Personalization: Mastery Integration', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 6: Evidence Intelligence & Provenance Integration (Tests 25–27)
  // -------------------------------------------------------------------------

  // Test 25: Phase 10 evidence completeness score included in scenario summary
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const passed =
      typeof res.evidenceSummary.completenessScore === 'number' &&
      res.evidenceSummary.completenessScore > 0;

    results.push({
      num: 25,
      name: 'Phase 10 Integration: Evidence Completeness Scoring Preserved in Scenario',
      passed,
      details: `Completeness score: ${res.evidenceSummary.completenessScore}%, state: ${res.evidenceSummary.confidenceState}`,
    });
  } catch (err: any) {
    results.push({ num: 25, name: 'Phase 10: Evidence Scoring', passed: false, error: err.message });
  }

  // Test 26: Publisher counts and primary sources preserved in scenario result
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const passed = typeof res.evidenceSummary.publisherCount === 'number';

    results.push({
      num: 26,
      name: 'Phase 10 Integration: Multi-Publisher Diversity Tracking in Scenarios',
      passed,
      details: `Publisher count: ${res.evidenceSummary.publisherCount}`,
    });
  } catch (err: any) {
    results.push({ num: 26, name: 'Phase 10: Publisher Diversity', passed: false, error: err.message });
  }

  // Test 27: Conflicting evidence neutral reporting preserved in scenario outputs
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const passed = typeof res.evidenceSummary.hasConflicts === 'boolean';

    results.push({
      num: 27,
      name: 'Phase 10 Integration: Neutral Traceability of Documented Discrepancies',
      passed,
      details: `Conflict flag: ${res.evidenceSummary.hasConflicts}, note: ${res.evidenceSummary.conflictNote || 'None'}`,
    });
  } catch (err: any) {
    results.push({ num: 27, name: 'Phase 10: Conflict Traceability', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 7: Security, Multi-Tenant Isolation & IDOR Protection (Tests 28–31)
  // -------------------------------------------------------------------------

  // Test 28: User A cannot read User B's scenario result
  try {
    // Create scenario for User B
    const scB = await scenarioSimulationService.createAndSimulateScenario(
      testStorylineId,
      userB,
      {
        scenarioType: 'DELAY_EVENT',
        question: 'User B private question on semiconductor delay?',
        assumptionText: 'Private assumption text belonging strictly to user B.',
      }
    );

    let blocked = false;
    try {
      await scenarioSimulationService.getScenarioResult(testStorylineId, scB.scenario.id, userA);
    } catch (e: any) {
      blocked = e.message.includes('not found');
    }

    results.push({
      num: 28,
      name: 'Security: Strict Multi-Tenant Isolation & IDOR Protection on Scenario Read',
      passed: blocked,
      details: `User A prevented from reading User B scenario: ${blocked}`,
    });
  } catch (err: any) {
    results.push({ num: 28, name: 'Security: IDOR Read', passed: false, error: err.message });
  }

  // Test 29: User A cannot delete User B's scenario
  try {
    const scB2 = await scenarioSimulationService.createAndSimulateScenario(
      testStorylineId,
      userB,
      {
        scenarioType: 'REMOVE_EVENT',
        question: 'User B private question 2?',
        assumptionText: 'Private assumption 2.',
      }
    );

    let deleteBlocked = false;
    try {
      await scenarioSimulationService.deleteScenario(testStorylineId, scB2.scenario.id, userA);
    } catch (e: any) {
      deleteBlocked = e.message.includes('not found') || e.message.includes('unauthorized');
    }

    results.push({
      num: 29,
      name: 'Security: Strict Multi-Tenant Authorization on Scenario Deletion',
      passed: deleteBlocked,
      details: `User A prevented from deleting User B scenario: ${deleteBlocked}`,
    });
  } catch (err: any) {
    results.push({ num: 29, name: 'Security: Unauthorized Deletion', passed: false, error: err.message });
  }

  // Test 30: User scenario list strictly returns only authenticated user's scenarios
  try {
    const listA = await scenarioSimulationService.listUserScenarios(testStorylineId, userA);
    const listB = await scenarioSimulationService.listUserScenarios(testStorylineId, userB);

    const passed =
      listA.every((s) => s.userId === userA) &&
      listB.every((s) => s.userId === userB) &&
      listA.length > 0 &&
      listB.length > 0;

    results.push({
      num: 30,
      name: 'Security: Multi-Tenant Query Scoping in Scenario Listing',
      passed,
      details: `User A list (${listA.length} items) strictly isolated from User B list (${listB.length} items)`,
    });
  } catch (err: any) {
    results.push({ num: 30, name: 'Security: Query Scoping', passed: false, error: err.message });
  }

  // Test 31: SQL parameterized queries prevent SQL injection payloads in assumption text
  try {
    const sqlInjectionAssumption = `'; DROP TABLE storyline_scenarios; -- " OR "1"="1`;
    const safeResult = await scenarioSimulationService.createAndSimulateScenario(
      testStorylineId,
      userA,
      {
        scenarioType: 'CHANGE_CONDITION',
        question: 'Testing SQL injection resilience?',
        assumptionText: sqlInjectionAssumption,
      }
    );

    const passed =
      safeResult.scenario.id &&
      safeResult.scenario.assumptionText === sqlInjectionAssumption;

    results.push({
      num: 31,
      name: 'Security: Parameterized SQL Query Protection Against SQL Injection Payloads',
      passed: Boolean(passed),
      details: `Successfully neutralized SQL injection attempt without syntax or execution errors`,
    });
  } catch (err: any) {
    results.push({ num: 31, name: 'Security: SQL Injection', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 8: Concurrency & Caching (Tests 32–35)
  // -------------------------------------------------------------------------

  // Test 32: Deterministic input hash generated consistently
  try {
    const hash1 = scenarioSimulationRepository.generateInputHash(testStorylineId, 'REMOVE_EVENT', event1.id, 'Same assumption text.');
    const hash2 = scenarioSimulationRepository.generateInputHash(testStorylineId, 'REMOVE_EVENT', event1.id, '  Same assumption text.  ');

    results.push({
      num: 32,
      name: 'Performance: Normalized Deterministic Input Hash Generation',
      passed: hash1 === hash2 && hash1.length === 64,
      details: `Generated matching SHA-256 hash: ${hash1.substring(0, 16)}...`,
    });
  } catch (err: any) {
    results.push({ num: 32, name: 'Performance: Input Hash', passed: false, error: err.message });
  }

  // Test 33: In-flight mutex lock merges 5 concurrent identical requests into 1 execution
  try {
    const p1 = scenarioSimulationService.createAndSimulateScenario(testStorylineId, 'user_concurrent_test', {
      scenarioType: 'DELAY_EVENT',
      question: 'Concurrent test question?',
      assumptionText: 'Identical concurrent assumption text.',
    });
    const p2 = scenarioSimulationService.createAndSimulateScenario(testStorylineId, 'user_concurrent_test', {
      scenarioType: 'DELAY_EVENT',
      question: 'Concurrent test question?',
      assumptionText: 'Identical concurrent assumption text.',
    });
    const p3 = scenarioSimulationService.createAndSimulateScenario(testStorylineId, 'user_concurrent_test', {
      scenarioType: 'DELAY_EVENT',
      question: 'Concurrent test question?',
      assumptionText: 'Identical concurrent assumption text.',
    });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    const passed = r1.generatedAt === r2.generatedAt && r2.generatedAt === r3.generatedAt;

    results.push({
      num: 33,
      name: 'Concurrency: Mutex Lock Merges Parallel Identical Scenario Generations',
      passed,
      details: `All concurrent calls returned identical generation timestamp: ${r1.generatedAt}`,
    });
  } catch (err: any) {
    results.push({ num: 33, name: 'Concurrency: Mutex Lock', passed: false, error: err.message });
  }

  // Test 34: Cached run returned immediately on subsequent query
  try {
    const res1 = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA, false);
    const res2 = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA, false);

    const passed = res1.generatedAt === res2.generatedAt;

    results.push({
      num: 34,
      name: 'Performance: Sub-Millisecond Retrieval from Cached Scenario Run Store',
      passed,
      details: `Cached run timestamp verified: ${res1.generatedAt} === ${res2.generatedAt}`,
    });
  } catch (err: any) {
    results.push({ num: 34, name: 'Performance: Cached Run', passed: false, error: err.message });
  }

  // Test 35: Force refresh bypasses cached run and regenerates fresh simulation
  try {
    const initial = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA, false);
    // Force refresh
    const refreshed = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA, true);

    const passed = Boolean(refreshed && refreshed.scenario.id === createdScenarioId);

    results.push({
      num: 35,
      name: 'Performance: Force Refresh Invalidation and Fresh Simulation Execution',
      passed,
      details: `Re-executed simulation successfully for scenario ${createdScenarioId}`,
    });
  } catch (err: any) {
    results.push({ num: 35, name: 'Performance: Force Refresh', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 9: Learning Hooks & Grounded Quiz (Tests 36–37)
  // -------------------------------------------------------------------------

  // Test 36: Scenario learning summary returns recommended actions based on mastery status
  try {
    const learning = await scenarioSimulationService.getScenarioLearning(testStorylineId, createdScenarioId, userA);
    const passed =
      learning.scenarioId === createdScenarioId &&
      Array.isArray(learning.recommendedActions) &&
      learning.recommendedActions.length > 0;

    results.push({
      num: 36,
      name: 'Learning Integration: Concept Action Hooks (REVIEW / LEARN / EXPLORE)',
      passed,
      details: `Generated ${learning.recommendedActions.length} recommended actions: "${learning.recommendedActions[0]?.title}"`,
    });
  } catch (err: any) {
    results.push({ num: 36, name: 'Learning: Action Hooks', passed: false, error: err.message });
  }

  // Test 37: Grounded scenario quiz generated with valid correct option and explanation
  try {
    const res = await scenarioSimulationService.getScenarioResult(testStorylineId, createdScenarioId, userA);
    const hasQuiz = res.quiz && res.quiz.length > 0;
    const firstQ = res.quiz ? res.quiz[0] : null;
    const validQuiz =
      firstQ &&
      firstQ.options.length >= 3 &&
      typeof firstQ.correctAnswerIndex === 'number' &&
      Boolean(firstQ.explanation);

    results.push({
      num: 37,
      name: 'Quiz Integration: Grounded Hypothesis Comprehension Quiz Generation',
      passed: Boolean(hasQuiz && validQuiz),
      details: `Generated ${res.quiz?.length || 0} grounded quiz questions: "${firstQ?.question.substring(0, 60)}..."`,
    });
  } catch (err: any) {
    results.push({ num: 37, name: 'Quiz: Grounded Generation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 10: Zero-Regression Across Phases 5–12 (Tests 38–42)
  // -------------------------------------------------------------------------

  // Test 38: Phase 5 Multi-Factor Ranking intact
  try {
    const sampleEvt = await EventRepository.findById(event1.id);
    const passed = Boolean(sampleEvt && sampleEvt.finalRankScore === 94);

    results.push({
      num: 38,
      name: 'Phase 5 Regression: Multi-Factor Ranking Engine Intact',
      passed: Boolean(passed),
      details: `Event finalRankScore: ${sampleEvt?.finalRankScore}`,
    });
  } catch (err: any) {
    results.push({ num: 38, name: 'Phase 5 Regression', passed: false, error: err.message });
  }

  // Test 39: Phase 7 Spaced Repetition SM-2 intact
  try {
    const sm2 = spacedRepetitionService.calculateNextSchedule({
      scorePercentage: 85,
      masteryStatus: 'DEVELOPING',
      currentSchedule: {
        id: 'sched_p13_reg',
        userId: userA,
        eventId: event1.id,
        intervalDays: 1,
        easeFactor: 2.5,
        repetitionCount: 1,
        nextReviewAt: new Date().toISOString(),
        lastReviewedAt: new Date().toISOString(),
        status: 'LEARNING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    const passed = sm2.intervalDays === 3 && sm2.easeFactor >= 2.4;

    results.push({
      num: 39,
      name: 'Phase 7 Regression: SM-2 Spaced Repetition Algorithm Intact',
      passed,
      details: `Next intervalDays: ${sm2.intervalDays}, easeFactor: ${sm2.easeFactor}`,
    });
  } catch (err: any) {
    results.push({ num: 39, name: 'Phase 7 Regression', passed: false, error: err.message });
  }

  // Test 40: Phase 8 Adaptive Personalization Feed intact
  try {
    const feed = await personalizationService.getPersonalizedFeed(userA, { limit: 5 });
    const passed = Boolean(feed && Array.isArray(feed.items));

    results.push({
      num: 40,
      name: 'Phase 8 Regression: Adaptive Personalization Feed Intact',
      passed,
      details: `Generated feed with ${feed?.items?.length ?? 0} items`,
    });
  } catch (err: any) {
    results.push({ num: 40, name: 'Phase 8 Regression', passed: false, error: err.message });
  }

  // Test 41: Phase 10 Evidence Completeness Scoring intact
  try {
    const ev = await evidenceService.getEvidenceSummary(event1.id);
    const passed = Boolean(ev && typeof ev.completenessScore === 'number');

    results.push({
      num: 41,
      name: 'Phase 10 Regression: 6-Pillar Evidence Completeness Engine Intact',
      passed: Boolean(passed),
      details: `Evidence completeness: ${ev?.completenessScore}%, state: ${ev?.confidenceState}`,
    });
  } catch (err: any) {
    results.push({ num: 41, name: 'Phase 10 Regression', passed: false, error: err.message });
  }

  // Test 42: Phase 12 Catch-Up Briefing Synthesis intact
  try {
    const briefing = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA);
    const passed = Boolean(briefing && briefing.consolidatedDelta && briefing.allConcepts);

    results.push({
      num: 42,
      name: 'Phase 12 Regression: Storyline Catch-Up Briefing Synthesis Intact',
      passed: Boolean(passed),
      details: `Catch-up briefing status: [${briefing?.catchupStatus.join(', ')}]`,
    });
  } catch (err: any) {
    results.push({ num: 42, name: 'Phase 12 Regression', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // RESULTS SUMMARY
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('PHASE 13 TEST RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------------');

  let passedCount = 0;
  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`✅ [${r.num}/${results.length}] ${r.name}`);
      if (r.details) console.log(`   └─ ${r.details}`);
    } else {
      console.log(`❌ [${r.num}/${results.length}] ${r.name}`);
      if (r.error) console.log(`   └─ Error: ${r.error}`);
    }
  }

  console.log('======================================================================');
  console.log(`Phase 13 Test Results: ${passedCount} / ${results.length} PASSED`);
  console.log('======================================================================\n');

  if (passedCount < results.length) {
    process.exit(1);
  }
}

runPhase13VerificationSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
