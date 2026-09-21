import {
  Storyline,
  CanonicalEvent,
  StorylineTimelineItem,
  StorylineTurningPoint,
  StorylineCatchupBriefing,
  StorylineCatchupEvent,
  StorylineCatchupDelta,
  StorylineCatchupConcept,
  StorylineCatchupStatus,
  StorylineNextAction,
  StorylineJourneyResponse,
  UserStorylineProgress,
  ExtractedConcept,
  ConfidenceState,
} from '../../types/index.js';
import { storylineRepository } from '../../repositories/storyline.repository.js';
import { EventRepository } from '../../repositories/event.repository.js';
import { storylineCatchupRepository } from '../../repositories/storylineCatchup.repository.js';
import { storylineService } from './storyline.service.js';
import { storylineDeltaService } from './storylineDelta.service.js';
import { aiUnderstandingRepository } from '../../repositories/aiUnderstanding.repository.js';
import { learningRepository } from '../../repositories/learning.repository.js';
import { evidenceService } from '../evidence/evidence.service.js';
import { knowledgeGraphRepository } from '../../repositories/knowledgeGraph.repository.js';

export class StorylineCatchupService {
  // Concurrency mutex lock map to prevent redundant concurrent generations
  private activeGenerations: Map<string, Promise<StorylineCatchupBriefing>> = new Map();

  private getMutexKey(storylineId: string, userId?: string): string {
    return `${storylineId}:${userId || 'generic'}`;
  }

  /**
   * Main entry point: Retrieves or generates a 60-second Catch-Up Briefing.
   */
  public async getCatchupBriefing(
    storylineId: string,
    userId?: string,
    forceRefresh: boolean = false
  ): Promise<StorylineCatchupBriefing> {
    const storyline = await storylineRepository.findById(storylineId);
    if (!storyline) {
      throw new Error(`Storyline with ID "${storylineId}" not found`);
    }

    // 1. Check Cache if not forcing refresh
    if (!forceRefresh) {
      const cached = await storylineCatchupRepository.getBriefing(storylineId, userId);
      if (cached) {
        return cached;
      }
    }

    // 2. Concurrency Lock: Await existing in-flight generation if present
    const mutexKey = this.getMutexKey(storylineId, userId);
    const inFlight = this.activeGenerations.get(mutexKey);
    if (inFlight) {
      return inFlight;
    }

    // 3. Initiate Generation Promise with Mutex Guard
    const generationPromise = this.synthesizeBriefing(storyline, userId)
      .then(async (briefing) => {
        await storylineCatchupRepository.saveBriefing(briefing);
        return briefing;
      })
      .finally(() => {
        this.activeGenerations.delete(mutexKey);
      });

    this.activeGenerations.set(mutexKey, generationPromise);
    return generationPromise;
  }

  /**
   * Core Deterministic 12-Pillar Synthesis Engine.
   */
  private async synthesizeBriefing(
    storyline: Storyline,
    userId?: string
  ): Promise<StorylineCatchupBriefing> {
    const storylineId = storyline.id;

    // A. Load Timeline and Canonical Events in strict chronological order
    const timeline = await storylineService.getTimeline(storylineId);
    const eventIds = timeline.map((t) => t.eventId);
    const events: CanonicalEvent[] = [];

    for (const eid of eventIds) {
      const ev = await EventRepository.findById(eid);
      if (ev) events.push(ev);
    }

    // Handle edge case: Storyline with zero events
    if (events.length === 0) {
      return this.buildEmptyStorylineBriefing(storyline, userId);
    }

    // B. Turning Points
    const turningPoints = await storylineService.getTurningPoints(storylineId);

    // C. Evidence Intelligence Integration
    const evidenceOverview = await storylineService.getEvidenceOverview(storylineId);

    // D. User Review & Last-Seen Boundary Resolution
    let userProgress: UserStorylineProgress | null = null;
    let reviewedEventIds = new Set<string>();
    let lastKnownEventIndex = -1;

    if (userId) {
      userProgress = await storylineCatchupRepository.getUserProgress(userId, storylineId);
      if (userProgress && userProgress.reviewedEventIds) {
        for (const rid of userProgress.reviewedEventIds) {
          reviewedEventIds.add(rid);
        }
      }

      // Also check Phase 7 learning progress
      const p7Progress = await learningRepository.getAllProgressForUser(userId);
      for (const p of p7Progress) {
        if (p.eventId && eventIds.includes(p.eventId)) {
          reviewedEventIds.add(p.eventId);
        }
      }

      // Identify highest chronological reviewed event
      for (let i = events.length - 1; i >= 0; i--) {
        if (reviewedEventIds.has(events[i].id)) {
          lastKnownEventIndex = i;
          break;
        }
      }
    }

    const lastKnownEvent =
      lastKnownEventIndex >= 0
        ? {
            id: events[lastKnownEventIndex].id,
            title: events[lastKnownEventIndex].title,
            eventTime: events[lastKnownEventIndex].firstPublishedAt || events[lastKnownEventIndex].createdAt,
            summary: events[lastKnownEventIndex].summary,
          }
        : null;

    // E. Isolate Unread Developments
    const unreadEvents =
      lastKnownEventIndex >= 0 ? events.slice(lastKnownEventIndex + 1) : events;

    const newDevelopments = unreadEvents.map((ev) => {
      const isTP = turningPoints.some((tp) => tp.eventId === ev.id);
      const tpObj = turningPoints.find((tp) => tp.eventId === ev.id);
      return {
        id: ev.id,
        title: ev.title,
        eventTime: ev.firstPublishedAt || ev.createdAt,
        summary: ev.summary,
        isTurningPoint: isTP,
        turningPointType: tpObj ? tpObj.turningPointType : undefined,
      };
    });

    // F. Multi-Event Delta Knowledge Synthesis (Consolidate deltas without redundancy)
    const consolidatedDelta = await this.consolidateDeltas(storylineId, events, lastKnownEventIndex);

    // G. Concepts & Personalized Mastery Classification
    const conceptAnalysis = await this.analyzeStorylineConcepts(events, unreadEvents, userId);

    // H. Major Turning Points Summary
    const majorTurningPoints = turningPoints.map((tp) => ({
      id: tp.id,
      eventId: tp.eventId,
      eventTitle: tp.title,
      turningPointType: tp.turningPointType,
      reason: tp.reason,
      occurredAt: tp.occurredAt,
    }));

    // I. Deterministic Catch-Up Status Badges
    const catchupStatus: StorylineCatchupStatus[] = [];
    if (unreadEvents.length === 0) {
      catchupStatus.push('FULLY_CAUGHT_UP');
    } else {
      catchupStatus.push('NEW_DEVELOPMENTS');
      if (unreadEvents.length >= 3 || unreadEvents.some((e) => (e.finalRankScore || 0) >= 90)) {
        catchupStatus.push('MAJOR_UPDATE');
      }
    }

    if (turningPoints.length >= 2) {
      catchupStatus.push('MULTIPLE_TURNING_POINTS');
    }

    if (evidenceOverview.conflictCount > 0) {
      catchupStatus.push('CONFLICTING_INFORMATION');
    }

    if (evidenceOverview.latestCompletenessScore < 50) {
      catchupStatus.push('LIMITED_EVIDENCE');
    }

    // J. Deterministic Next Action Recommendation
    const nextAction = this.determineNextAction(
      storyline,
      events,
      unreadEvents,
      conceptAnalysis.conceptsToReview,
      conceptAnalysis.newConcepts,
      userId
    );

    // K. Formulate Concise 60-Second Briefing Summary
    const briefingSummary = this.formulateBriefingSummary(
      storyline,
      lastKnownEvent,
      unreadEvents,
      consolidatedDelta,
      turningPoints,
      evidenceOverview.latestCompletenessScore
    );

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour TTL

    return {
      id: `brf_${storylineId}_${userId ? userId.substring(0, 8) : 'gen'}`,
      storylineId,
      storylineTitle: storyline.title,
      briefingSummary,
      lastKnownEvent,
      newDevelopmentsCount: unreadEvents.length,
      newDevelopments,
      majorTurningPoints,
      currentState: storyline.status,
      trajectory: storyline.trajectory,
      evidenceState: {
        completenessScore: evidenceOverview.latestCompletenessScore,
        confidenceState: evidenceOverview.overallConfidenceState,
        uniquePublishersCount: evidenceOverview.totalUniquePublishers,
        primarySourcesCount: evidenceOverview.totalPrimarySources,
        conflictSummary:
          evidenceOverview.conflictCount > 0
            ? `${evidenceOverview.conflictCount} reporting divergence(s) documented across independent publishers.`
            : undefined,
        hasConflicts: evidenceOverview.conflictCount > 0,
      },
      newConcepts: conceptAnalysis.newConcepts,
      conceptsToReview: conceptAnalysis.conceptsToReview,
      allConcepts: conceptAnalysis.allConcepts,
      consolidatedDelta,
      catchupStatus,
      nextAction,
      isPersonalized: Boolean(userId),
      userId,
      unreadEventCount: unreadEvents.length,
      totalEventCount: events.length,
      reviewedEventCount: reviewedEventIds.size,
      generatedAt: now,
      expiresAt,
    };
  }

  /**
   * Consolidates multi-event deltas across the unread event span.
   */
  private async consolidateDeltas(
    storylineId: string,
    events: CanonicalEvent[],
    lastKnownEventIndex: number
  ): Promise<StorylineCatchupDelta> {
    const newFactsSet = new Set<string>();
    const changedFactsSet = new Set<string>();
    const supersededSet = new Set<string>();

    const startIndex = Math.max(0, lastKnownEventIndex);
    for (let i = startIndex; i < events.length; i++) {
      const current = events[i];
      const prev = i > 0 ? events[i - 1] : undefined;

      try {
        const delta = await storylineDeltaService.computeDeltaBetweenEvents(storylineId, prev, current);
        for (const f of delta.newFacts) newFactsSet.add(f);
        for (const cf of delta.changedFacts) changedFactsSet.add(cf);
        if (delta.statusShift) {
          changedFactsSet.add(`Status shifted from ${delta.statusShift.from} to ${delta.statusShift.to}`);
        }
      } catch {
        if (current.summary) newFactsSet.add(current.summary);
      }
    }

    const newFacts = Array.from(newFactsSet);
    const changedFacts = Array.from(changedFactsSet);
    const supersededAssumptions = Array.from(supersededSet);
    const hasMeaningfulChange = newFacts.length > 0 || changedFacts.length > 0;

    return {
      newFacts,
      changedFacts,
      newConcepts: [],
      supersededAssumptions,
      hasMeaningfulChange,
    };
  }

  /**
   * Extracts and classifies concepts across storyline events against user mastery.
   */
  private async analyzeStorylineConcepts(
    allEvents: CanonicalEvent[],
    unreadEvents: CanonicalEvent[],
    userId?: string
  ): Promise<{
    allConcepts: StorylineCatchupConcept[];
    newConcepts: StorylineCatchupConcept[];
    conceptsToReview: StorylineCatchupConcept[];
  }> {
    const conceptMap = new Map<string, ExtractedConcept>();
    const unreadConceptIds = new Set<string>();

    for (const ev of allEvents) {
      const concepts = await aiUnderstandingRepository.getConceptsByEventId(ev.id);
      for (const c of concepts) {
        const id = c.id || c.slug;
        conceptMap.set(id, c);
      }
    }

    for (const uev of unreadEvents) {
      const uConcepts = await aiUnderstandingRepository.getConceptsByEventId(uev.id);
      for (const uc of uConcepts) {
        unreadConceptIds.add(uc.id || uc.slug);
      }
    }

    let userProgressMap = new Map<string, any>();
    let userReviewSchedules = new Map<string, any>();

    if (userId) {
      const progress = await learningRepository.getAllProgressForUser(userId);
      for (const p of progress) {
        if (p.conceptId) userProgressMap.set(p.conceptId, p);
      }
      const schedules = await learningRepository.getAllSchedulesForUser(userId);
      for (const s of schedules) {
        if (s.conceptId) userReviewSchedules.set(s.conceptId, s);
      }
    }

    const allConcepts: StorylineCatchupConcept[] = [];
    const newConcepts: StorylineCatchupConcept[] = [];
    const conceptsToReview: StorylineCatchupConcept[] = [];

    const now = Date.now();

    for (const [id, c] of conceptMap.entries()) {
      const p = userProgressMap.get(id);
      const s = userReviewSchedules.get(id);

      let masteryStatus: any = 'NEW';
      let masteryScore = 0;
      let reason = 'Key concept in this storyline.';

      if (userId) {
        if (p) {
          masteryScore = p.masteryScore || 0;
          if (p.masteryStatus === 'STRONG' || masteryScore >= 80) {
            masteryStatus = 'ALREADY_KNOWN';
            reason = `You have mastered this concept (${masteryScore}%).`;
          } else if (p.masteryStatus === 'DEVELOPING' || (masteryScore >= 50 && masteryScore < 80)) {
            masteryStatus = 'NEEDS_REVIEW';
            reason = `Moderate mastery (${masteryScore}%). Recommended for reinforcement.`;
          } else {
            masteryStatus = 'NEEDS_LEARNING';
            reason = 'Needs fundamental concept learning.';
          }
        } else if (unreadConceptIds.has(id)) {
          masteryStatus = 'NEW';
          reason = 'Newly introduced concept in recent developments.';
        } else {
          masteryStatus = 'NEEDS_LEARNING';
          reason = 'Concept not yet mastered.';
        }

        // Check SM-2 Review Due
        if (s && s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now) {
          masteryStatus = 'NEEDS_REVIEW';
          reason = 'Due for spaced repetition review.';
        }
      } else {
        masteryStatus = unreadConceptIds.has(id) ? 'NEW' : 'NEEDS_LEARNING';
      }

      const catchupConcept: StorylineCatchupConcept = {
        id: c.id,
        title: c.title,
        slug: c.slug,
        shortDefinition: c.shortDefinition || 'Key domain concept.',
        category: c.category || 'General',
        masteryStatus,
        masteryScore,
        reason,
      };

      allConcepts.push(catchupConcept);

      if (masteryStatus === 'NEW') {
        newConcepts.push(catchupConcept);
      } else if (masteryStatus === 'NEEDS_REVIEW') {
        conceptsToReview.push(catchupConcept);
      }
    }

    return { allConcepts, newConcepts, conceptsToReview };
  }

  /**
   * Formulates a concise 60-second narrative briefing summary.
   */
  private formulateBriefingSummary(
    storyline: Storyline,
    lastKnownEvent: { title: string } | null,
    unreadEvents: CanonicalEvent[],
    delta: StorylineCatchupDelta,
    turningPoints: StorylineTurningPoint[],
    evidenceScore: number
  ): string {
    if (unreadEvents.length === 0) {
      return `You are completely up to date on "${storyline.title}". Current observed state is ${storyline.status.toLowerCase()} with a ${storyline.trajectory.toLowerCase()} trajectory.`;
    }

    const sentences: string[] = [];

    if (lastKnownEvent) {
      sentences.push(`Since your last review of "${lastKnownEvent.title}", ${unreadEvents.length} new development${unreadEvents.length === 1 ? ' has' : 's have'} occurred.`);
    } else {
      sentences.push(`This storyline tracks ${unreadEvents.length} chronological development${unreadEvents.length === 1 ? '' : 's'} regarding ${storyline.title}.`);
    }

    if (turningPoints.length > 0) {
      const latestTP = turningPoints[turningPoints.length - 1];
      sentences.push(`A critical inflection point occurred: ${latestTP.title} (${latestTP.reason}).`);
    }

    if (delta.changedFacts.length > 0) {
      sentences.push(`Key change: ${delta.changedFacts[0]}`);
    } else if (unreadEvents.length > 0 && unreadEvents[unreadEvents.length - 1].whyItMatters) {
      sentences.push(`Significance: ${unreadEvents[unreadEvents.length - 1].whyItMatters}`);
    }

    sentences.push(`Evidence completeness across reporting outlets is currently evaluated at ${evidenceScore}%.`);

    return sentences.join(' ');
  }

  /**
   * Deterministically assigns the highest-priority next learning action.
   */
  private determineNextAction(
    storyline: Storyline,
    allEvents: CanonicalEvent[],
    unreadEvents: CanonicalEvent[],
    conceptsToReview: StorylineCatchupConcept[],
    newConcepts: StorylineCatchupConcept[],
    userId?: string
  ): StorylineNextAction {
    if (conceptsToReview.length > 0) {
      return {
        actionType: 'REVIEW_CONCEPT',
        title: `Review "${conceptsToReview[0].title}"`,
        explanation: `Reinforce your understanding of ${conceptsToReview[0].title} based on your spaced repetition schedule.`,
        targetId: conceptsToReview[0].id,
        targetType: 'concept',
        priority: 1,
      };
    }

    if (unreadEvents.length > 0) {
      const latestUnread = unreadEvents[unreadEvents.length - 1];
      return {
        actionType: 'READ_LATEST_EVENT',
        title: `Read Latest Update: "${latestUnread.title}"`,
        explanation: 'Review the most recent official development in this evolving storyline.',
        targetId: latestUnread.id,
        targetType: 'event',
        priority: 2,
      };
    }

    if (newConcepts.length > 0) {
      return {
        actionType: 'LEARN_PREREQUISITE',
        title: `Learn "${newConcepts[0].title}"`,
        explanation: 'Explore this newly introduced concept to gain deeper structural context.',
        targetId: newConcepts[0].id,
        targetType: 'concept',
        priority: 3,
      };
    }

    if (allEvents.length > 0) {
      return {
        actionType: 'COMPLETE_QUIZ',
        title: `Take Storyline Concept Quiz`,
        explanation: 'Test and solidify your mastery across all milestones in this storyline.',
        targetId: allEvents[allEvents.length - 1].id,
        targetType: 'quiz',
        priority: 4,
      };
    }

    return {
      actionType: 'NO_ACTION',
      title: 'Fully Caught Up',
      explanation: 'No immediate learning action needed. Check back for future developments.',
      priority: 5,
    };
  }

  /**
   * Fallback builder for storylines with zero events.
   */
  private buildEmptyStorylineBriefing(
    storyline: Storyline,
    userId?: string
  ): StorylineCatchupBriefing {
    const now = new Date().toISOString();
    return {
      id: `brf_${storyline.id}_empty`,
      storylineId: storyline.id,
      storylineTitle: storyline.title,
      briefingSummary: `No verified chronological events have been associated with "${storyline.title}" yet.`,
      lastKnownEvent: null,
      newDevelopmentsCount: 0,
      newDevelopments: [],
      majorTurningPoints: [],
      currentState: storyline.status,
      trajectory: storyline.trajectory,
      evidenceState: {
        completenessScore: 0,
        confidenceState: 'LIMITED_EVIDENCE',
        uniquePublishersCount: 0,
        primarySourcesCount: 0,
        hasConflicts: false,
      },
      newConcepts: [],
      conceptsToReview: [],
      allConcepts: [],
      consolidatedDelta: {
        newFacts: [],
        changedFacts: [],
        newConcepts: [],
        supersededAssumptions: [],
        hasMeaningfulChange: false,
      },
      catchupStatus: ['FULLY_CAUGHT_UP'],
      nextAction: {
        actionType: 'NO_ACTION',
        title: 'Awaiting Initial Events',
        explanation: 'Storyline is currently awaiting canonical event associations.',
        priority: 5,
      },
      isPersonalized: Boolean(userId),
      userId,
      unreadEventCount: 0,
      totalEventCount: 0,
      reviewedEventCount: 0,
      generatedAt: now,
    };
  }

  /**
   * Produces the full interactive Chronological Learning Journey.
   */
  public async getStorylineJourney(
    storylineId: string,
    userId?: string
  ): Promise<StorylineJourneyResponse> {
    const storyline = await storylineRepository.findById(storylineId);
    if (!storyline) {
      throw new Error(`Storyline with ID "${storylineId}" not found`);
    }

    const [timeline, turningPoints, trajectory, overallEvidence, briefing, userProgress] =
      await Promise.all([
        storylineService.getTimeline(storylineId),
        storylineService.getTurningPoints(storylineId),
        storylineService.getTrajectoryDetails(storylineId),
        storylineService.getEvidenceOverview(storylineId),
        this.getCatchupBriefing(storylineId, userId),
        userId ? storylineCatchupRepository.getUserProgress(userId, storylineId) : Promise.resolve(null),
      ]);

    const reviewedSet = new Set<string>(userProgress?.reviewedEventIds || []);

    const journeyEvents: StorylineCatchupEvent[] = [];

    for (let i = 0; i < timeline.length; i++) {
      const item = timeline[i];
      const ev = await EventRepository.findById(item.eventId);
      const concepts = await aiUnderstandingRepository.getConceptsByEventId(item.eventId);

      let newFacts: string[] = [ev?.summary || item.title];
      let changedFacts: string[] = [];

      if (i > 0) {
        const prevItem = timeline[i - 1];
        const prevEv = await EventRepository.findById(prevItem.eventId);
        try {
          const d = await storylineDeltaService.computeDeltaBetweenEvents(storylineId, prevEv || undefined, ev!);
          newFacts = d.newFacts;
          changedFacts = d.changedFacts;
        } catch {
          // fallback
        }
      }

      journeyEvents.push({
        id: item.eventId,
        title: item.title,
        summary: ev?.summary || item.title,
        eventTime: item.eventTime,
        isTurningPoint: item.isTurningPoint,
        turningPointType: item.relationshipType,
        turningPointReason: item.turningPointReason,
        isReviewedByUser: reviewedSet.has(item.eventId),
        evidenceCompletenessScore: item.evidenceCompletenessScore || 70,
        evidenceConfidenceState: item.evidenceConfidenceState || 'WELL_SUPPORTED',
        newFactsIntroduced: newFacts,
        changedFacts,
        concepts,
      });
    }

    const totalEventCount = journeyEvents.length;
    const reviewedEventCount = journeyEvents.filter((e) => e.isReviewedByUser).length;
    const progressPercentage =
      totalEventCount > 0 ? Math.round((reviewedEventCount / totalEventCount) * 100) : 100;

    return {
      storyline,
      trajectory,
      events: journeyEvents,
      turningPoints,
      overallEvidence,
      userProgress: {
        userId,
        lastSeenEventId: userProgress?.lastSeenEventId || null,
        reviewedEventCount,
        totalEventCount,
        progressPercentage,
        isFullyCaughtUp: progressPercentage === 100,
      },
      briefing,
    };
  }

  /**
   * Marks an event as reviewed by user and updates progress.
   */
  public async markEventReviewed(
    userId: string,
    storylineId: string,
    eventId: string
  ): Promise<UserStorylineProgress> {
    const storyline = await storylineRepository.findById(storylineId);
    if (!storyline) {
      throw new Error(`Storyline with ID "${storylineId}" not found`);
    }

    const timeline = await storylineService.getTimeline(storylineId);
    const eventExistsInStoryline = timeline.some((t) => t.eventId === eventId);
    if (!eventExistsInStoryline) {
      throw new Error(`Event "${eventId}" does not belong to storyline "${storylineId}"`);
    }

    const allEventIds = timeline.map((t) => t.eventId);
    return storylineCatchupRepository.markEventReviewed(
      userId,
      storylineId,
      eventId,
      allEventIds
    );
  }
}

export const storylineCatchupService = new StorylineCatchupService();
