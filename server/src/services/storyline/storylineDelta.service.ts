import {
  CanonicalEvent,
  StorylineDeltaKnowledge,
  UserStorylineLearningDelta,
  ExtractedConcept,
  ConfidenceState,
  FiveWOneH,
  EvidenceConflict,
} from '../../types/index.js';
import { aiUnderstandingRepository } from '../../repositories/aiUnderstanding.repository.js';
import { evidenceService } from '../evidence/evidence.service.js';
import { learningRepository } from '../../repositories/learning.repository.js';

export class StorylineDeltaService {
  /**
   * Computes deterministic Delta Knowledge between two chronological events in a storyline.
   */
  public async computeDeltaBetweenEvents(
    storylineId: string,
    fromEvent: CanonicalEvent | undefined,
    toEvent: CanonicalEvent
  ): Promise<StorylineDeltaKnowledge> {
    const toId = toEvent.id;
    const fromId = fromEvent?.id;

    // Time gap calculation
    const fromTime = fromEvent
      ? new Date(fromEvent.firstPublishedAt || fromEvent.createdAt || Date.now()).getTime()
      : new Date(toEvent.firstPublishedAt || toEvent.createdAt || Date.now()).getTime();
    const toTime = new Date(toEvent.firstPublishedAt || toEvent.createdAt || Date.now()).getTime();
    const timeGapHours = Math.max(0, Math.round((toTime - fromTime) / 3600000));

    // Fetch 5W1H breakdowns if available
    let from5W1H: FiveWOneH | null = null;
    let to5W1H: FiveWOneH | null = null;

    if (fromId) {
      const fromSummary = await aiUnderstandingRepository.getSummaryByEventId(fromId);
      from5W1H = fromSummary?.fiveWOneH || null;
    }
    const toSummary = await aiUnderstandingRepository.getSummaryByEventId(toId);
    to5W1H = toSummary?.fiveWOneH || null;

    // Fetch concepts for both events
    const fromConcepts = fromId ? await aiUnderstandingRepository.getConceptsByEventId(fromId) : [];
    const toConcepts = await aiUnderstandingRepository.getConceptsByEventId(toId);

    const fromConceptIds = new Set(fromConcepts.map((c) => c.id || c.slug));
    const newConcepts: ExtractedConcept[] = toConcepts.filter((c) => !fromConceptIds.has(c.id || c.slug));

    // Fetch Phase 10 Evidence Summaries
    let fromEvidenceScore = 60;
    let fromEvidenceState: ConfidenceState = 'DEVELOPING';
    let fromPublishers = new Set<string>();

    if (fromId) {
      try {
        const fromEv = await evidenceService.getEvidenceSummary(fromId);
        fromEvidenceScore = fromEv.completenessScore;
        fromEvidenceState = fromEv.confidenceState;
        fromPublishers = new Set(fromEv.sources.map((s) => s.publisherName.toLowerCase()));
      } catch {
        // fallback
      }
    }

    let toEvidenceScore = 80;
    let toEvidenceState: ConfidenceState = 'WELL_SUPPORTED';
    let toPublishers: string[] = [];
    let toConflicts: EvidenceConflict[] = [];

    try {
      const toEv = await evidenceService.getEvidenceSummary(toId);
      toEvidenceScore = toEv.completenessScore;
      toEvidenceState = toEv.confidenceState;
      toPublishers = toEv.sources.map((s) => s.publisherName);
      toConflicts = toEv.conflicts || [];
    } catch {
      // fallback
    }

    const newPublishers = toPublishers.filter((p) => !fromPublishers.has(p.toLowerCase()));

    // Extract New Facts & Changed Facts deterministically
    const newFacts: string[] = [];
    const changedFacts: string[] = [];

    if (!fromEvent) {
      // Single / Initial Event in storyline
      newFacts.push(toEvent.summary);
      if (toEvent.whyItMatters) {
        newFacts.push(`Key significance: ${toEvent.whyItMatters}`);
      }
      if (to5W1H?.whatHappened) {
        newFacts.push(to5W1H.whatHappened);
      }
    } else {
      // Meaningful difference calculation
      if (toEvent.lifecycleStatus !== fromEvent.lifecycleStatus) {
        changedFacts.push(`Lifecycle status progressed from ${fromEvent.lifecycleStatus.replace('_', ' ')} to ${toEvent.lifecycleStatus.replace('_', ' ')}.`);
      }

      if (to5W1H?.whatHappened && to5W1H.whatHappened !== from5W1H?.whatHappened) {
        newFacts.push(to5W1H.whatHappened);
      } else {
        newFacts.push(toEvent.summary);
      }

      if (toEvent.importanceScore !== fromEvent.importanceScore) {
        changedFacts.push(`Corroborated importance shifted from ${fromEvent.importanceScore}/100 to ${toEvent.importanceScore}/100.`);
      }

      if (newPublishers.length > 0) {
        newFacts.push(`Newly corroborated by ${newPublishers.slice(0, 3).join(', ')}.`);
      }
    }

    // Affected Groups Shift
    const fromAffected = from5W1H?.whoIsAffected || [];
    const toAffected = to5W1H?.whoIsAffected || (toEvent.category ? [toEvent.category, 'General Public'] : ['General Public']);
    const addedAffected = toAffected.filter((a) => !fromAffected.includes(a));

    // Status Shift
    const statusShift = fromEvent && fromEvent.lifecycleStatus !== toEvent.lifecycleStatus
      ? { from: fromEvent.lifecycleStatus, to: toEvent.lifecycleStatus }
      : undefined;

    // Understanding Shift
    const prevSummaryText = fromEvent ? fromEvent.summary : 'Initial baseline anchor for this storyline.';
    const currSummaryText = toEvent.summary;
    const keyShift = fromEvent
      ? `Evolution from initial reporting (${fromEvent.lifecycleStatus}) to active development (${toEvent.lifecycleStatus}).`
      : 'Initial foundational development established.';

    const hasMeaningfulChange = Boolean(
      !fromEvent ||
      newFacts.length > 0 ||
      changedFacts.length > 0 ||
      newConcepts.length > 0 ||
      addedAffected.length > 0 ||
      statusShift !== undefined ||
      Math.abs(toEvidenceScore - fromEvidenceScore) >= 10
    );

    const summaryExplanation = hasMeaningfulChange
      ? fromEvent
        ? `Since ${fromEvent.title.slice(0, 40)}..., ${newFacts.length} new facts confirmed, ${newConcepts.length} new concepts introduced, and evidence completeness moved from ${fromEvidenceScore}% to ${toEvidenceScore}%.`
        : `Initial storyline development established with ${toConcepts.length} concepts and ${toEvidenceScore}% evidence completeness.`
      : 'Meaningful change not detected.';

    return {
      storylineId,
      fromEventId: fromId,
      toEventId: toId,
      fromEventTitle: fromEvent?.title,
      toEventTitle: toEvent.title,
      timeGapHours,
      hasMeaningfulChange,
      newFacts: newFacts.length > 0 ? newFacts : ['Meaningful factual change not detected.'],
      changedFacts,
      newConcepts,
      changedAffectedGroups: {
        added: addedAffected,
        previous: fromAffected,
      },
      statusShift,
      evidenceEvolution: {
        fromScore: fromEvidenceScore,
        toScore: toEvidenceScore,
        scoreDelta: toEvidenceScore - fromEvidenceScore,
        fromState: fromEvidenceState,
        toState: toEvidenceState,
        newPublishers,
      },
      newConflicts: toConflicts,
      understandingShift: {
        previousSummary: prevSummaryText,
        currentSummary: currSummaryText,
        keyShift,
      },
      summaryExplanation,
    };
  }

  /**
   * Computes personalized user learning delta for an authenticated user on a storyline.
   */
  public async computeUserLearningDelta(
    userId: string,
    storylineId: string,
    storylineEvents: CanonicalEvent[]
  ): Promise<UserStorylineLearningDelta> {
    if (!userId || storylineEvents.length === 0) {
      return {
        userId: userId || 'anonymous',
        storylineId,
        hasLearnedEarlierEvents: false,
        alreadyKnownEventIds: [],
        alreadyKnownConceptIds: [],
        newEventsSinceLastLearning: storylineEvents.map((e) => ({
          id: e.id,
          title: e.title,
          eventTime: e.firstPublishedAt || e.createdAt,
          relationshipType: 'DEVELOPMENT',
        })),
        newConceptsSinceLastLearning: [],
        summaryText: 'Discover the full chronological evolution of this storyline.',
      };
    }

    // Get user learning activities & mastery
    const userProgress = await learningRepository.getAllProgressForUser(userId);
    const userActivities = await learningRepository.getActivitiesForUser(userId, 50);

    const learnedEventIds = new Set<string>();
    const learnedConceptIds = new Set<string>();

    for (const p of userProgress) {
      if (p.eventId) learnedEventIds.add(p.eventId);
      if (p.conceptId && p.masteryScore > 0) learnedConceptIds.add(p.conceptId);
    }

    for (const act of userActivities) {
      if (act.eventId) learnedEventIds.add(act.eventId);
      if (act.conceptId) learnedConceptIds.add(act.conceptId);
    }

    const alreadyKnownEventIds: string[] = [];
    const newEventsSinceLastLearning: {
      id: string;
      title: string;
      eventTime: string;
      relationshipType: any;
    }[] = [];

    for (const ev of storylineEvents) {
      if (learnedEventIds.has(ev.id)) {
        alreadyKnownEventIds.push(ev.id);
      } else {
        newEventsSinceLastLearning.push({
          id: ev.id,
          title: ev.title,
          eventTime: ev.firstPublishedAt || ev.createdAt,
          relationshipType: 'DEVELOPMENT',
        });
      }
    }

    // Extract new concepts
    const newConceptsSinceLastLearning: ExtractedConcept[] = [];
    for (const ev of storylineEvents) {
      if (!learnedEventIds.has(ev.id)) {
        const evConcepts = await aiUnderstandingRepository.getConceptsByEventId(ev.id);
        for (const c of evConcepts) {
          if (!learnedConceptIds.has(c.id || c.slug)) {
            newConceptsSinceLastLearning.push(c);
          }
        }
      }
    }

    const hasLearnedEarlierEvents = alreadyKnownEventIds.length > 0;

    let summaryText = '';
    if (hasLearnedEarlierEvents && newEventsSinceLastLearning.length > 0) {
      summaryText = `You already reviewed the background of this storyline (${alreadyKnownEventIds.length} event${
        alreadyKnownEventIds.length === 1 ? '' : 's'
      }). New since your last review: ${newEventsSinceLastLearning.length} new development${
        newEventsSinceLastLearning.length === 1 ? '' : 's'
      }${newConceptsSinceLastLearning.length > 0 ? ` and ${newConceptsSinceLastLearning.length} new concept(s)` : ''}.`;
    } else if (hasLearnedEarlierEvents && newEventsSinceLastLearning.length === 0) {
      summaryText = 'You are completely up to date with all chronological developments in this storyline.';
    } else {
      summaryText = 'You have not reviewed this storyline yet. Start from the origin to build foundational mastery.';
    }

    return {
      userId,
      storylineId,
      hasLearnedEarlierEvents,
      alreadyKnownEventIds,
      alreadyKnownConceptIds: Array.from(learnedConceptIds),
      newEventsSinceLastLearning,
      newConceptsSinceLastLearning,
      summaryText,
    };
  }
}

export const storylineDeltaService = new StorylineDeltaService();
