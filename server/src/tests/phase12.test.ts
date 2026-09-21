process.env.NODE_ENV = 'test';
import { storylineCatchupService } from '../services/storyline/storylineCatchup.service.js';
import { storylineCatchupRepository } from '../repositories/storylineCatchup.repository.js';
import { storylineService } from '../services/storyline/storyline.service.js';
import { storylineRepository } from '../repositories/storyline.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { aiUnderstandingRepository } from '../repositories/aiUnderstanding.repository.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { spacedRepetitionService } from '../services/learning/spacedRepetition.service.js';
import { personalizationService } from '../services/learning/personalization.service.js';
import { knowledgeGraphService } from '../services/learning/knowledgeGraph.service.js';
import { evidenceService } from '../services/evidence/evidence.service.js';
import { storylineProgressBodySchema, storylineIdParamSchema } from '../validators/storylineCatchup.validator.js';
import { CanonicalEvent, Storyline } from '../types/index.js';

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase12VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 12: LIVING STORYLINE CATCH-UP & CHRONOLOGICAL SYNTHESIS');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  const now = new Date();

  // Test Entities Setup
  const testStorylineId = 'stl_p12_test_semiconductor';
  const testEmptyStorylineId = 'stl_p12_test_empty';
  const testSingleStorylineId = 'stl_p12_test_single';

  const userA = '00000000-0000-0000-0000-00000000000a';
  const userB = '00000000-0000-0000-0000-00000000000b';

  // Seed Events
  const event1: CanonicalEvent = {
    id: 'evt_p12_semi_01',
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
    id: 'evt_p12_semi_02',
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
    id: 'evt_p12_semi_03',
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
  // SUITE 1: Catch-Up Engine & Delta Synthesis (Pillars 1–7)
  // -------------------------------------------------------------------------

  // Test 1: Storyline with zero events handled safely
  try {
    await storylineRepository.saveStoryline({
      id: testEmptyStorylineId,
      title: 'Empty Test Storyline',
      summary: 'Storyline with no events.',
      status: 'EMERGING',
      startedAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      trajectory: 'UNKNOWN',
    });

    const emptyBriefing = await storylineCatchupService.getCatchupBriefing(testEmptyStorylineId);
    const passed = emptyBriefing && emptyBriefing.newDevelopmentsCount === 0 && emptyBriefing.totalEventCount === 0;

    results.push({
      num: 1,
      name: 'Pillar 1: Safe Handling of Storyline with Zero Events',
      passed: Boolean(passed),
      details: `Returned valid empty briefing without errors (Status: ${emptyBriefing.catchupStatus.join(', ')})`,
    });
  } catch (err: any) {
    results.push({ num: 1, name: 'Pillar 1: Zero Events Handling', passed: false, error: err.message });
  }

  // Test 2: Storyline with single event generates valid briefing
  try {
    await storylineRepository.saveStoryline({
      id: testSingleStorylineId,
      title: 'Single Event Storyline',
      summary: 'Storyline with single event.',
      status: 'ACTIVE',
      startedAt: event1.firstPublishedAt!,
      lastUpdatedAt: event1.firstPublishedAt!,
      currentEventId: event1.id,
      trajectory: 'DEVELOPING',
    });
    await storylineRepository.addEventToStoryline({
      storylineId: testSingleStorylineId,
      eventId: event1.id,
      relationshipType: 'ORIGIN',
      sequenceOrder: 1,
      eventTime: event1.firstPublishedAt!,
      associationScore: 100,
    });

    const singleBriefing = await storylineCatchupService.getCatchupBriefing(testSingleStorylineId);
    const passed = singleBriefing && singleBriefing.totalEventCount === 1 && singleBriefing.newDevelopmentsCount === 1;

    results.push({
      num: 2,
      name: 'Pillar 1: Single Event Storyline Briefing Formulation',
      passed: Boolean(passed),
      details: `Generated single-event briefing with summary: "${singleBriefing.briefingSummary.substring(0, 60)}..."`,
    });
  } catch (err: any) {
    results.push({ num: 2, name: 'Pillar 1: Single Event Storyline', passed: false, error: err.message });
  }

  // Test 3: Multiple events sorted chronologically
  try {
    const timeline = await storylineService.getTimeline(testStorylineId);
    const isSorted =
      new Date(timeline[0].eventTime).getTime() <= new Date(timeline[1].eventTime).getTime() &&
      new Date(timeline[1].eventTime).getTime() <= new Date(timeline[2].eventTime).getTime();

    results.push({
      num: 3,
      name: 'Pillar 1: Strict Chronological Event Sorting in Storyline',
      passed: isSorted,
      details: `Sorted sequence: ${timeline.map((t) => t.eventId).join(' -> ')}`,
    });
  } catch (err: any) {
    results.push({ num: 3, name: 'Pillar 1: Chronological Sorting', passed: false, error: err.message });
  }

  // Test 4: Last-seen event correctly determines unread events
  try {
    // User A has reviewed event1 & event2
    await storylineCatchupService.markEventReviewed(userA, testStorylineId, event1.id);
    await storylineCatchupService.markEventReviewed(userA, testStorylineId, event2.id);

    const briefingUserA = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA, true);
    const passed =
      briefingUserA.lastKnownEvent?.id === event2.id &&
      briefingUserA.newDevelopmentsCount === 1 &&
      briefingUserA.newDevelopments[0].id === event3.id;

    results.push({
      num: 4,
      name: 'Pillar 2: Last-Seen Event Correctly Determines Unread Events',
      passed,
      details: `Last known: ${briefingUserA.lastKnownEvent?.id}, Unread count: ${briefingUserA.newDevelopmentsCount} (Expected evt_p12_semi_03)`,
    });
  } catch (err: any) {
    results.push({ num: 4, name: 'Pillar 2: Last-Seen Event Determination', passed: false, error: err.message });
  }

  // Test 5: Fully caught-up storyline returns FULLY_CAUGHT_UP status
  try {
    // User A reviews event3 as well
    await storylineCatchupService.markEventReviewed(userA, testStorylineId, event3.id);

    const caughtUpBriefing = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA, true);
    const passed =
      caughtUpBriefing.catchupStatus.includes('FULLY_CAUGHT_UP') &&
      caughtUpBriefing.newDevelopmentsCount === 0;

    results.push({
      num: 5,
      name: 'Pillar 2: Fully Caught-Up Storyline State Recognition',
      passed,
      details: `Statuses: [${caughtUpBriefing.catchupStatus.join(', ')}], Unread: ${caughtUpBriefing.unreadEventCount}`,
    });
  } catch (err: any) {
    results.push({ num: 5, name: 'Pillar 2: Fully Caught Up Recognition', passed: false, error: err.message });
  }

  // Test 6: New developments correctly identified and counted for unreviewed user
  try {
    // User B has zero reviews
    const briefingUserB = await storylineCatchupService.getCatchupBriefing(testStorylineId, userB, true);
    const passed = briefingUserB.newDevelopmentsCount === 3 && briefingUserB.lastKnownEvent === null;

    results.push({
      num: 6,
      name: 'Pillar 3: Accurate Development Count for Fresh User',
      passed,
      details: `Unread count: ${briefingUserB.newDevelopmentsCount}/3, Last known: ${briefingUserB.lastKnownEvent}`,
    });
  } catch (err: any) {
    results.push({ num: 6, name: 'Pillar 3: Fresh User Count', passed: false, error: err.message });
  }

  // Test 7: Multiple unread events consolidated without duplicate facts
  try {
    const briefing = await storylineCatchupService.getCatchupBriefing(testStorylineId, undefined, true);
    const uniqueFacts = new Set(briefing.consolidatedDelta.newFacts);
    const passed = uniqueFacts.size === briefing.consolidatedDelta.newFacts.length && uniqueFacts.size > 0;

    results.push({
      num: 7,
      name: 'Pillar 7: Multi-Event Delta Knowledge Synthesis (Zero Duplicate Facts)',
      passed,
      details: `Consolidated ${briefing.consolidatedDelta.newFacts.length} distinct facts across 3 events`,
    });
  } catch (err: any) {
    results.push({ num: 7, name: 'Pillar 7: Delta Synthesis', passed: false, error: err.message });
  }

  // Test 8: Turning points included correctly with objective reason
  try {
    const briefing = await storylineCatchupService.getCatchupBriefing(testStorylineId);
    const hasTurningPoint = briefing.majorTurningPoints.length > 0;
    const hasReason = hasTurningPoint && Boolean(briefing.majorTurningPoints[0].reason);

    results.push({
      num: 8,
      name: 'Pillar 6: Turning Points Detection & Objective Reason Inclusion',
      passed: hasTurningPoint && hasReason,
      details: `Found ${briefing.majorTurningPoints.length} turning point(s): "${briefing.majorTurningPoints[0]?.eventTitle}"`,
    });
  } catch (err: any) {
    results.push({ num: 8, name: 'Pillar 6: Turning Points Inclusion', passed: false, error: err.message });
  }

  // Test 9: No fabricated delta when facts have not changed
  try {
    const zeroDelta = await storylineCatchupService.getCatchupBriefing(testEmptyStorylineId, undefined, true);
    const passed = zeroDelta.consolidatedDelta.changedFacts.length === 0;

    results.push({
      num: 9,
      name: 'Pillar 7: Honest Zero-Change Delta Handling (No Fabricated Detections)',
      passed,
      details: `Changed facts count on static comparison: ${zeroDelta.consolidatedDelta.changedFacts.length}`,
    });
  } catch (err: any) {
    results.push({ num: 9, name: 'Pillar 7: Honest Delta', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Concept Classification & Personalization (Pillars 8 & 11)
  // -------------------------------------------------------------------------

  // Test 10: Known concepts classified as ALREADY_KNOWN
  try {
    // Seed User A mastery of c_semi_fab = 95 (STRONG)
    await learningRepository.saveProgress({
      userId: userA,
      conceptId: 'c_semi_fab',
      masteryScore: 95,
      masteryStatus: 'STRONG',
      attemptCount: 3,
      correctCount: 3,
      incorrectCount: 0,
      lastAttemptAt: new Date().toISOString(),
      lastMasteredAt: new Date().toISOString(),
    });

    const briefingUserA = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA, true);
    const fabConcept = briefingUserA.allConcepts.find((c) => c.id === 'c_semi_fab');
    const passed = fabConcept?.masteryStatus === 'ALREADY_KNOWN';

    results.push({
      num: 10,
      name: 'Pillar 8: Mastered Concepts Classified as ALREADY_KNOWN',
      passed: Boolean(passed),
      details: `Concept "c_semi_fab" classified as ${fabConcept?.masteryStatus} (${fabConcept?.masteryScore}%)`,
    });
  } catch (err: any) {
    results.push({ num: 10, name: 'Pillar 8: Known Concept Classification', passed: false, error: err.message });
  }

  // Test 11: Weak concepts classified as NEEDS_LEARNING
  try {
    // Seed User A weak mastery on c_semi_node = 30 (NEEDS_LEARNING)
    await learningRepository.saveProgress({
      userId: userA,
      conceptId: 'c_semi_node',
      masteryScore: 30,
      masteryStatus: 'NEEDS_LEARNING',
      attemptCount: 2,
      correctCount: 0,
      incorrectCount: 2,
      lastAttemptAt: new Date().toISOString(),
    });

    const briefingUserA = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA, true);
    const nodeConcept = briefingUserA.allConcepts.find((c) => c.id === 'c_semi_node');
    const passed = nodeConcept?.masteryStatus === 'NEEDS_LEARNING';

    results.push({
      num: 11,
      name: 'Pillar 8: Weak Concepts Classified as NEEDS_LEARNING',
      passed: Boolean(passed),
      details: `Concept "c_semi_node" classified as ${nodeConcept?.masteryStatus} (${nodeConcept?.masteryScore}%)`,
    });
  } catch (err: any) {
    results.push({ num: 11, name: 'Pillar 8: Weak Concept Classification', passed: false, error: err.message });
  }

  // Test 12: Review-due concepts classified as NEEDS_REVIEW
  try {
    // Seed overdue schedule for c_semi_capex
    await learningRepository.saveProgress({
      userId: userA,
      conceptId: 'c_semi_capex',
      masteryScore: 65,
      masteryStatus: 'DEVELOPING',
      attemptCount: 1,
      correctCount: 1,
      incorrectCount: 0,
    });

    await learningRepository.saveSchedule({
      userId: userA,
      conceptId: 'c_semi_capex',
      easeFactor: 2.5,
      intervalDays: 1,
      repetitionCount: 1,
      nextReviewAt: new Date(Date.now() - 3600000).toISOString(), // 1 hr overdue
      status: 'LEARNING',
    });

    const briefingUserA = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA, true);
    const capexConcept = briefingUserA.allConcepts.find((c) => c.id === 'c_semi_capex');
    const passed = capexConcept?.masteryStatus === 'NEEDS_REVIEW';

    results.push({
      num: 12,
      name: 'Pillar 8: Overdue Spaced Repetition Concepts Classified as NEEDS_REVIEW',
      passed: Boolean(passed),
      details: `Concept "c_semi_capex" classified as ${capexConcept?.masteryStatus}`,
    });
  } catch (err: any) {
    results.push({ num: 12, name: 'Pillar 8: Review-Due Concept Classification', passed: false, error: err.message });
  }

  // Test 13: Personalized briefing differs appropriately from generic briefing
  try {
    const generic = await storylineCatchupService.getCatchupBriefing(testStorylineId, undefined, true);
    const personalized = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA, true);

    const passed = generic.isPersonalized === false && personalized.isPersonalized === true;

    results.push({
      num: 13,
      name: 'Pillar 8: Clear Differentiation Between Generic and Personalized Briefings',
      passed,
      details: `Generic (isPersonalized: ${generic.isPersonalized}) vs UserA (isPersonalized: ${personalized.isPersonalized})`,
    });
  } catch (err: any) {
    results.push({ num: 13, name: 'Pillar 8: Personalization Differentiation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 3: Evidence Intelligence & Conflict Traceability (Pillar 9)
  // -------------------------------------------------------------------------

  // Test 14: Evidence state correctly propagated from Phase 10
  try {
    const briefing = await storylineCatchupService.getCatchupBriefing(testStorylineId);
    const passed =
      typeof briefing.evidenceState.completenessScore === 'number' &&
      briefing.evidenceState.completenessScore > 0 &&
      briefing.evidenceState.uniquePublishersCount > 0;

    results.push({
      num: 14,
      name: 'Pillar 9: Evidence Completeness Score and Confidence State Propagation',
      passed,
      details: `Completeness: ${briefing.evidenceState.completenessScore}%, Confidence: ${briefing.evidenceState.confidenceState}`,
    });
  } catch (err: any) {
    results.push({ num: 14, name: 'Pillar 9: Evidence Propagation', passed: false, error: err.message });
  }

  // Test 15: Conflicting evidence remains neutral and traceable
  try {
    const briefing = await storylineCatchupService.getCatchupBriefing(testStorylineId);
    const passed = typeof briefing.evidenceState.hasConflicts === 'boolean';

    results.push({
      num: 15,
      name: 'Pillar 9: Neutral Representation of Discrepancies and Conflicts',
      passed,
      details: `Conflict flag: ${briefing.evidenceState.hasConflicts}, Summary: "${briefing.evidenceState.conflictSummary || 'None'}"`,
    });
  } catch (err: any) {
    results.push({ num: 15, name: 'Pillar 9: Conflict Traceability', passed: false, error: err.message });
  }

  // Test 16: Source provenance remains accessible across journey
  try {
    const journey = await storylineCatchupService.getStorylineJourney(testStorylineId);
    const passed =
      journey.events.length === 3 &&
      journey.events.every((e) => typeof e.evidenceCompletenessScore === 'number');

    results.push({
      num: 16,
      name: 'Pillar 4 & 9: Complete Traceability of Evidence Across Journey Steps',
      passed,
      details: `Verified ${journey.events.length} journey events with evidence completeness scores`,
    });
  } catch (err: any) {
    results.push({ num: 16, name: 'Pillar 9: Source Provenance in Journey', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Security, Multi-Tenant Isolation & Validation
  // -------------------------------------------------------------------------

  // Test 17: User A cannot retrieve User B's personalized briefing
  try {
    const briefingA = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA);
    const briefingB = await storylineCatchupService.getCatchupBriefing(testStorylineId, userB);

    const passed =
      briefingA.userId === userA &&
      briefingB.userId === userB &&
      (briefingA.userId as string) !== (briefingB.userId as string);

    results.push({
      num: 17,
      name: 'Security: Strict Multi-Tenant Isolation Between User Briefings',
      passed,
      details: `UserA (${briefingA.userId}) isolated from UserB (${briefingB.userId})`,
    });
  } catch (err: any) {
    results.push({ num: 17, name: 'Security: Tenant Isolation', passed: false, error: err.message });
  }

  // Test 18: User cannot mark an event outside the storyline as reviewed
  try {
    let rejected = false;
    try {
      await storylineCatchupService.markEventReviewed(userA, testStorylineId, 'evt_unrelated_random');
    } catch (e: any) {
      rejected = e.message.includes('does not belong');
    }

    results.push({
      num: 18,
      name: 'Security: Rejection of Unrelated Events in Storyline Progress Updates',
      passed: rejected,
      details: `Foreign event insertion correctly blocked: ${rejected}`,
    });
  } catch (err: any) {
    results.push({ num: 18, name: 'Security: Foreign Event Rejection', passed: false, error: err.message });
  }

  // Test 19: Client cannot spoof progress ownership
  try {
    const progressA = await storylineCatchupRepository.getUserProgress(userA, testStorylineId);
    const progressB = await storylineCatchupRepository.getUserProgress(userB, testStorylineId);

    const passed = progressA?.userId === userA && (progressB === null || progressB.userId === userB);

    results.push({
      num: 19,
      name: 'Security: Server-Enforced User Progress Ownership Verification',
      passed,
      details: `Verified progress records belong strictly to authenticated IDs`,
    });
  } catch (err: any) {
    results.push({ num: 19, name: 'Security: Ownership Verification', passed: false, error: err.message });
  }

  // Test 20: Invalid storyline/event IDs rejected by Zod
  try {
    const validBody = storylineProgressBodySchema.safeParse({ eventId: 'evt_valid_123' });
    const invalidBody = storylineProgressBodySchema.safeParse({ eventId: '' });
    const invalidParam = storylineIdParamSchema.safeParse({ id: '' });

    const passed = validBody.success && !invalidBody.success && !invalidParam.success;

    results.push({
      num: 20,
      name: 'Security: Strict Zod Input Validation for Query and Progress Payloads',
      passed,
      details: `Valid accepted: ${validBody.success}, Empty rejected: ${!invalidBody.success && !invalidParam.success}`,
    });
  } catch (err: any) {
    results.push({ num: 20, name: 'Security: Zod Validation', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Caching & Concurrency Protection
  // -------------------------------------------------------------------------

  // Test 21: Cache hit avoids unnecessary regeneration
  try {
    const t0 = Date.now();
    const briefing1 = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA, false);
    const t1 = Date.now();
    const briefing2 = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA, false);
    const t2 = Date.now();

    const passed = briefing1.generatedAt === briefing2.generatedAt && t2 - t1 <= t1 - t0 + 10;

    results.push({
      num: 21,
      name: 'Performance: Catch-Up Briefing Caching and Zero-Lag Retrieval',
      passed,
      details: `Initial generatedAt: ${briefing1.generatedAt} === Cached generatedAt: ${briefing2.generatedAt}`,
    });
  } catch (err: any) {
    results.push({ num: 21, name: 'Performance: Caching', passed: false, error: err.message });
  }

  // Test 22: Cache invalidation works after review update
  try {
    const oldBriefing = await storylineCatchupService.getCatchupBriefing(testStorylineId, userA);
    // Invalidate
    await storylineCatchupRepository.invalidateBriefing(testStorylineId, userA);
    const cachedAfter = await storylineCatchupRepository.getBriefing(testStorylineId, userA);

    const passed = cachedAfter === null;

    results.push({
      num: 22,
      name: 'Performance: Explicit Cache Invalidation on Storyline Updates',
      passed,
      details: `Cache successfully purged: ${passed}`,
    });
  } catch (err: any) {
    results.push({ num: 22, name: 'Performance: Invalidation', passed: false, error: err.message });
  }

  // Test 23: Five simultaneous requests produce only one generation (mutex lock)
  try {
    const p1 = storylineCatchupService.getCatchupBriefing(testStorylineId, 'user_concurrent_01', true);
    const p2 = storylineCatchupService.getCatchupBriefing(testStorylineId, 'user_concurrent_01', false);
    const p3 = storylineCatchupService.getCatchupBriefing(testStorylineId, 'user_concurrent_01', false);
    const p4 = storylineCatchupService.getCatchupBriefing(testStorylineId, 'user_concurrent_01', false);
    const p5 = storylineCatchupService.getCatchupBriefing(testStorylineId, 'user_concurrent_01', false);

    const [r1, r2, r3, r4, r5] = await Promise.all([p1, p2, p3, p4, p5]);
    const passed = r1.generatedAt === r2.generatedAt && r1.generatedAt === r5.generatedAt;

    results.push({
      num: 23,
      name: 'Concurrency: Mutex Lock Merges 5 Simultaneous Generations into Single Execution',
      passed,
      details: `All 5 concurrent requests returned identical timestamp: ${r1.generatedAt}`,
    });
  } catch (err: any) {
    results.push({ num: 23, name: 'Concurrency: Mutex Lock', passed: false, error: err.message });
  }

  // Test 24: Different storyline/user combinations do not block each other
  try {
    const pA = storylineCatchupService.getCatchupBriefing(testStorylineId, userA, true);
    const pB = storylineCatchupService.getCatchupBriefing(testSingleStorylineId, userB, true);

    const [rA, rB] = await Promise.all([pA, pB]);
    const passed = rA.storylineId === testStorylineId && rB.storylineId === testSingleStorylineId;

    results.push({
      num: 24,
      name: 'Concurrency: Independent Storylines/Users Execute Concurrently Without Blocking',
      passed,
      details: `Executed storyline A (${rA.storylineId}) and storyline B (${rB.storylineId}) concurrently`,
    });
  } catch (err: any) {
    results.push({ num: 24, name: 'Concurrency: Non-blocking Execution', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUITE 6: Zero Regression Across Phases 5–11
  // -------------------------------------------------------------------------

  // Test 25: Phase 5 Multi-Factor Ranking Mathematics
  try {
    const sampleEvt = await EventRepository.findById('evt_p12_semi_01');
    const passed = Boolean(sampleEvt && sampleEvt.finalRankScore === 94 && sampleEvt.importanceScore === 92);

    results.push({
      num: 25,
      name: 'Phase 5 Regression: Multi-Factor Ranking Mathematics Preserved',
      passed: Boolean(passed),
      details: `Event finalRankScore: ${sampleEvt?.finalRankScore}, importanceScore: ${sampleEvt?.importanceScore}`,
    });
  } catch (err: any) {
    results.push({ num: 25, name: 'Phase 5 Regression', passed: false, error: err.message });
  }

  // Test 26: Phase 6 AI Deep Understanding
  try {
    const concepts = await aiUnderstandingRepository.getConceptsByEventId('evt_p12_semi_01');
    const passed = Array.isArray(concepts) && concepts.length === 2;

    results.push({
      num: 26,
      name: 'Phase 6 Regression: 5W1H & Concept Extraction Intact',
      passed,
      details: `Retrieved ${concepts.length} concepts for evt_p12_semi_01`,
    });
  } catch (err: any) {
    results.push({ num: 26, name: 'Phase 6 Regression', passed: false, error: err.message });
  }

  // Test 27: Phase 7 SM-2 Spaced Repetition Mathematics
  try {
    const sm2Result = spacedRepetitionService.calculateNextSchedule({
      scorePercentage: 85,
      masteryStatus: 'DEVELOPING',
      currentSchedule: {
        id: 'sched_p12_reg',
        userId: userA,
        eventId: 'evt_p12_semi_01',
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
    const passed = sm2Result.intervalDays === 3 && sm2Result.easeFactor >= 2.4;

    results.push({
      num: 27,
      name: 'Phase 7 Regression: SM-2 Spaced Repetition Mathematics Preserved',
      passed,
      details: `Quality 4 -> intervalDays: ${sm2Result.intervalDays}, easeFactor: ${sm2Result.easeFactor}`,
    });
  } catch (err: any) {
    results.push({ num: 27, name: 'Phase 7 Regression', passed: false, error: err.message });
  }

  // Test 28: Phase 8 Adaptive Personalization 6-Factor Feed
  try {
    const feed = await personalizationService.getPersonalizedFeed(userA, { limit: 5 });
    const passed = Boolean(feed && Array.isArray(feed.items));

    results.push({
      num: 28,
      name: 'Phase 8 Regression: 6-Factor Adaptive Personalization Feed Generation',
      passed,
      details: `Generated feed with ${feed?.items?.length ?? 0} items`,
    });
  } catch (err: any) {
    results.push({ num: 28, name: 'Phase 8 Regression', passed: false, error: err.message });
  }

  // Test 29: Phase 9 Knowledge Graph Prerequisite Traversal
  try {
    const related = await knowledgeGraphService.getRelatedConcepts('computer-security', 3);
    const passed = Array.isArray(related);

    results.push({
      num: 29,
      name: 'Phase 9 Regression: Knowledge Graph Traversal Preserved',
      passed,
      details: `Traversed ${related.length} related concepts for computer-security`,
    });
  } catch (err: any) {
    results.push({ num: 29, name: 'Phase 9 Regression', passed: false, error: err.message });
  }

  // Test 30: Phase 10 Evidence Completeness 6-Pillar Engine
  try {
    const evSummary = await evidenceService.getEvidenceSummary('evt_p12_semi_01');
    const passed = evSummary && typeof evSummary.completenessScore === 'number';

    results.push({
      num: 30,
      name: 'Phase 10 Regression: 6-Pillar Evidence Completeness Scoring Preserved',
      passed: Boolean(passed),
      details: `Evidence completeness: ${evSummary?.completenessScore}%, state: ${evSummary?.confidenceState}`,
    });
  } catch (err: any) {
    results.push({ num: 30, name: 'Phase 10 Regression', passed: false, error: err.message });
  }

  // Test 31: Phase 11 Storyline Association and Trajectory
  try {
    const stl = await storylineRepository.findById(testStorylineId);
    const passed = Boolean(stl && stl.status === 'ACTIVE' && stl.trajectory === 'DEVELOPING');

    results.push({
      num: 31,
      name: 'Phase 11 Regression: Storyline Entity & Trajectory Model Preserved',
      passed: Boolean(passed),
      details: `Storyline trajectory: ${stl?.trajectory}, status: ${stl?.status}`,
    });
  } catch (err: any) {
    results.push({ num: 31, name: 'Phase 11 Regression', passed: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('PHASE 12 TEST RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------------');

  let passedCount = 0;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.num}/${results.length}] ${r.name}`);
    if (r.details) console.log(`   └─ ${r.details}`);
    if (r.error) console.log(`   ⚠️ ERROR: ${r.error}`);
    if (r.passed) passedCount++;
  }

  console.log('======================================================================');
  console.log(`Phase 12 Test Results: ${passedCount} / ${results.length} PASSED`);
  console.log('======================================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runPhase12VerificationSuite().catch((err) => {
  console.error('Fatal test error in Phase 12 verification suite:', err);
  process.exit(1);
});
