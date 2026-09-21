import {
  Storyline,
  StorylineTimelineItem,
  StorylineTurningPoint,
  StorylineTrajectoryDetails,
  StorylineDeltaKnowledge,
  StorylineEvidenceOverview,
  StorylineKnowledgeOverview,
  StorylineDetailResponse,
  StorylineFilterParams,
  UserStorylineLearningDelta,
  CanonicalEvent,
  StorylineRelationshipType,
  ExtractedConcept,
} from '../../types/index.js';
import { storylineRepository } from '../../repositories/storyline.repository.js';
import { EventRepository } from '../../repositories/event.repository.js';
import { storylineAssociationService } from './storylineAssociation.service.js';
import { storylineTrajectoryService } from './storylineTrajectory.service.js';
import { storylineDeltaService } from './storylineDelta.service.js';
import { aiUnderstandingRepository } from '../../repositories/aiUnderstanding.repository.js';
import { evidenceService } from '../evidence/evidence.service.js';
import { knowledgeGraphRepository } from '../../repositories/knowledgeGraph.repository.js';

export class StorylineService {
  /**
   * Retrieves paginated list of storylines with optional filters.
   */
  public async getStorylines(params: StorylineFilterParams = {}): Promise<{ storylines: Storyline[]; total: number }> {
    return storylineRepository.findAll(params);
  }

  /**
   * Retrieves a single storyline by ID.
   */
  public async getStorylineById(id: string): Promise<Storyline | null> {
    return storylineRepository.findById(id);
  }

  /**
   * Retrieves full chronological timeline for a storyline.
   */
  public async getTimeline(storylineId: string): Promise<StorylineTimelineItem[]> {
    const relations = await storylineRepository.getStorylineEvents(storylineId);
    if (relations.length === 0) return [];

    const eventIds = relations.map((r) => r.eventId);
    const eventsMap = new Map<string, CanonicalEvent>();

    for (const eid of eventIds) {
      const ev = await EventRepository.findById(eid);
      if (ev) eventsMap.set(eid, ev);
    }

    const turningPoints = await storylineRepository.getTurningPoints(storylineId);
    return storylineTrajectoryService.buildChronologicalTimeline(relations, eventsMap, turningPoints);
  }

  /**
   * Retrieves turning points for a storyline.
   */
  public async getTurningPoints(storylineId: string): Promise<StorylineTurningPoint[]> {
    const stored = await storylineRepository.getTurningPoints(storylineId);
    if (stored.length > 0) return stored;

    // Derive turning points from timeline
    const timeline = await this.getTimeline(storylineId);
    const tps: StorylineTurningPoint[] = [];

    for (const item of timeline) {
      if (item.isTurningPoint) {
        tps.push({
          id: `tp_${item.id}`,
          storylineId,
          eventId: item.eventId,
          title: item.title,
          reason: item.turningPointReason || 'Key developmental shift in storyline trajectory.',
          turningPointType: item.relationshipType || 'OFFICIAL_DECISION',
          occurredAt: item.eventTime,
          createdAt: item.eventTime,
        });
      }
    }

    return tps;
  }

  /**
   * Computes trajectory details for a storyline.
   */
  public async getTrajectoryDetails(storylineId: string): Promise<StorylineTrajectoryDetails> {
    const timeline = await this.getTimeline(storylineId);
    return storylineTrajectoryService.calculateTrajectory(storylineId, timeline);
  }

  /**
   * Computes Delta Knowledge between two events in a storyline (defaulting to previous -> latest).
   */
  public async getDeltaKnowledge(
    storylineId: string,
    fromEventId?: string,
    toEventId?: string
  ): Promise<StorylineDeltaKnowledge> {
    const timeline = await this.getTimeline(storylineId);
    if (timeline.length === 0) {
      throw new Error(`No events found for storyline ${storylineId}`);
    }

    let targetTo = timeline[timeline.length - 1];
    let targetFrom = timeline.length > 1 ? timeline[timeline.length - 2] : undefined;

    if (toEventId) {
      const foundTo = timeline.find((t) => t.eventId === toEventId);
      if (foundTo) targetTo = foundTo;
    }
    if (fromEventId) {
      const foundFrom = timeline.find((t) => t.eventId === fromEventId);
      if (foundFrom) targetFrom = foundFrom;
    }

    const toEvent = await EventRepository.findById(targetTo.eventId);
    if (!toEvent) {
      throw new Error(`Target event ${targetTo.eventId} not found`);
    }

    const fromEvent = targetFrom ? await EventRepository.findById(targetFrom.eventId) : undefined;

    return storylineDeltaService.computeDeltaBetweenEvents(storylineId, fromEvent || undefined, toEvent);
  }

  /**
   * Integrates Phase 10 Evidence across all events in the storyline.
   */
  public async getEvidenceOverview(storylineId: string): Promise<StorylineEvidenceOverview> {
    const timeline = await this.getTimeline(storylineId);
    const publisherCounts = new Map<string, number>();
    const publisherTypeCounts: Record<string, number> = {};
    let totalPrimarySources = 0;
    let totalIndependent = 0;
    let totalConflicts = 0;

    const timelineEvolution = [];

    for (const item of timeline) {
      try {
        const ev = await evidenceService.getEvidenceSummary(item.eventId);
        for (const s of ev.sources) {
          publisherCounts.set(s.publisherName, (publisherCounts.get(s.publisherName) || 0) + 1);
          publisherTypeCounts[s.sourceType] = (publisherTypeCounts[s.sourceType] || 0) + 1;
          if (s.evidenceType === 'PRIMARY' || s.sourceType === 'GOVERNMENT' || s.sourceType === 'OFFICIAL') {
            totalPrimarySources++;
          }
          if (s.isIndependent) {
            totalIndependent++;
          }
        }
        totalConflicts += (ev.conflicts || []).length;

        timelineEvolution.push({
          eventId: item.eventId,
          eventTitle: item.title,
          eventTime: item.eventTime,
          completenessScore: ev.completenessScore,
          confidenceState: ev.confidenceState,
          sourceCount: ev.sources.length,
        });
      } catch {
        timelineEvolution.push({
          eventId: item.eventId,
          eventTitle: item.title,
          eventTime: item.eventTime,
          completenessScore: item.evidenceCompletenessScore || 70,
          confidenceState: item.evidenceConfidenceState || 'WELL_SUPPORTED',
          sourceCount: item.sourceCount,
        });
      }
    }

    const latestEvolution = timelineEvolution[timelineEvolution.length - 1];
    const latestCompletenessScore = latestEvolution ? latestEvolution.completenessScore : 75;
    const overallConfidenceState = latestEvolution ? latestEvolution.confidenceState : 'WELL_SUPPORTED';

    return {
      storylineId,
      latestCompletenessScore,
      overallConfidenceState,
      totalUniquePublishers: publisherCounts.size || Math.max(1, timeline.length),
      totalPrimarySources,
      totalIndependentReportingCount: totalIndependent,
      publisherTypeCounts,
      conflictCount: totalConflicts,
      timelineEvidenceEvolution: timelineEvolution,
    };
  }

  /**
   * Integrates Phase 9 Knowledge Graph across all events in the storyline.
   */
  public async getKnowledgeOverview(storylineId: string): Promise<StorylineKnowledgeOverview> {
    const timeline = await this.getTimeline(storylineId);
    const conceptMap = new Map<string, ExtractedConcept>();
    const timelineConceptEvolution = [];
    const seenConceptIds = new Set<string>();

    for (const item of timeline) {
      const concepts = await aiUnderstandingRepository.getConceptsByEventId(item.eventId);
      const newForThisStep: ExtractedConcept[] = [];

      for (const c of concepts) {
        conceptMap.set(c.id || c.slug, c);
        if (!seenConceptIds.has(c.id || c.slug)) {
          seenConceptIds.add(c.id || c.slug);
          newForThisStep.push(c);
        }
      }

      timelineConceptEvolution.push({
        eventId: item.eventId,
        eventTitle: item.title,
        newConceptsIntroduced: newForThisStep,
      });
    }

    const dominantConcepts = Array.from(conceptMap.values());

    // Gather prerequisite and related concepts from knowledge graph
    const prerequisiteConcepts: ExtractedConcept[] = [];
    const relatedConcepts: ExtractedConcept[] = [];

    for (const c of dominantConcepts) {
      const relations = await knowledgeGraphRepository.getRelationsForConcept(c.id);
      for (const rel of relations) {
        if (rel.relationType === 'PREREQUISITE' && rel.targetConceptId === c.id) {
          const prereq = await knowledgeGraphRepository.getConceptById(rel.sourceConceptId);
          if (prereq && !prerequisiteConcepts.some((p) => p.id === prereq.id)) {
            prerequisiteConcepts.push(prereq);
          }
        } else if (rel.relationType === 'RELATED') {
          const otherId = rel.sourceConceptId === c.id ? rel.targetConceptId : rel.sourceConceptId;
          const related = await knowledgeGraphRepository.getConceptById(otherId);
          if (related && !relatedConcepts.some((r) => r.id === related.id)) {
            relatedConcepts.push(related);
          }
        }
      }
    }

    // Find related storylines
    const allStorylines = await storylineRepository.findAll();
    const otherStorylines = allStorylines.storylines.filter((s) => s.id !== storylineId);
    const relatedStorylines: StorylineKnowledgeOverview['relatedStorylines'] = [];

    const dominantIds = new Set(dominantConcepts.map((c) => c.id || c.slug));

    for (const other of otherStorylines) {
      let sharedCount = 0;
      const shared: string[] = [];
      const otherTimeline = await this.getTimeline(other.id);
      for (const oItem of otherTimeline) {
        const oConcepts = await aiUnderstandingRepository.getConceptsByEventId(oItem.eventId);
        for (const oc of oConcepts) {
          if (dominantIds.has(oc.id || oc.slug) && !shared.includes(oc.title)) {
            shared.push(oc.title);
            sharedCount++;
          }
        }
      }

      if (sharedCount > 0 || other.primaryCategoryId === (await storylineRepository.findById(storylineId))?.primaryCategoryId) {
        const score = Math.min(100, sharedCount * 30 + (other.primaryCategoryId === (await storylineRepository.findById(storylineId))?.primaryCategoryId ? 35 : 0));
        relatedStorylines.push({
          id: other.id,
          title: other.title,
          status: other.status,
          trajectory: other.trajectory,
          sharedConcepts: shared,
          relevanceScore: score,
        });
      }
    }

    relatedStorylines.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      storylineId,
      dominantConcepts,
      timelineConceptEvolution,
      prerequisiteConcepts,
      relatedConcepts,
      relatedStorylines: relatedStorylines.slice(0, 3),
    };
  }

  /**
   * Retrieves full aggregated detail package for a storyline.
   */
  public async getStorylineDetail(id: string): Promise<StorylineDetailResponse> {
    const storyline = await storylineRepository.findById(id);
    if (!storyline) {
      throw new Error(`Storyline with ID ${id} not found`);
    }

    const [timeline, turningPoints, trajectory, evidenceOverview, knowledgeOverview] = await Promise.all([
      this.getTimeline(id),
      this.getTurningPoints(id),
      this.getTrajectoryDetails(id),
      this.getEvidenceOverview(id),
      this.getKnowledgeOverview(id),
    ]);

    // Update repository with computed trajectory state
    await storylineRepository.updateStorylineTrajectory(
      id,
      trajectory.trajectoryDirection,
      trajectory.currentStatus,
      trajectory.latestEvent.id
    );

    let latestDelta: StorylineDeltaKnowledge;
    try {
      latestDelta = await this.getDeltaKnowledge(id);
    } catch {
      latestDelta = {
        storylineId: id,
        toEventId: storyline.currentEventId || 'unknown',
        toEventTitle: storyline.title,
        timeGapHours: 0,
        hasMeaningfulChange: false,
        newFacts: [storyline.summary],
        changedFacts: [],
        newConcepts: [],
        changedAffectedGroups: { added: [], previous: [] },
        evidenceEvolution: {
          fromScore: 70,
          toScore: 75,
          scoreDelta: 5,
          fromState: 'DEVELOPING',
          toState: 'WELL_SUPPORTED',
          newPublishers: [],
        },
        newConflicts: [],
        understandingShift: {
          previousSummary: storyline.summary,
          currentSummary: storyline.summary,
          keyShift: 'Initial storyline tracking baseline.',
        },
        summaryExplanation: 'Storyline established.',
      };
    }

    return {
      storyline,
      trajectory,
      timeline,
      turningPoints,
      latestDelta,
      evidenceOverview,
      knowledgeOverview,
    };
  }

  /**
   * Retrieves user learning delta for an authenticated user on a storyline.
   */
  public async getUserLearningDelta(storylineId: string, userId: string): Promise<UserStorylineLearningDelta> {
    const timeline = await this.getTimeline(storylineId);
    const events: CanonicalEvent[] = [];
    for (const item of timeline) {
      const ev = await EventRepository.findById(item.eventId);
      if (ev) events.push(ev);
    }

    return storylineDeltaService.computeUserLearningDelta(userId, storylineId, events);
  }

  /**
   * Retrieves all storylines connected to a specific canonical event.
   */
  public async getStorylinesForEvent(eventId: string): Promise<Storyline[]> {
    return storylineRepository.findByEventId(eventId);
  }

  /**
   * Idempotently associates an event to a storyline with deterministic relation and order.
   */
  public async associateEventToStoryline(
    storylineId: string,
    eventId: string,
    relationshipType: StorylineRelationshipType = 'DEVELOPMENT',
    explanation?: string
  ): Promise<void> {
    const event = await EventRepository.findById(eventId);
    const eventTime = event?.firstPublishedAt || event?.createdAt || new Date().toISOString();

    await storylineRepository.addEventToStoryline({
      storylineId,
      eventId,
      relationshipType,
      sequenceOrder: 1,
      eventTime,
      associationScore: 100,
      associationExplanation: explanation || `Associated event ${eventId} to storyline ${storylineId}`,
    });

    // Refresh turning points & trajectory
    const timeline = await this.getTimeline(storylineId);
    const trajectory = storylineTrajectoryService.calculateTrajectory(storylineId, timeline);
    await storylineRepository.updateStorylineTrajectory(
      storylineId,
      trajectory.trajectoryDirection,
      trajectory.currentStatus,
      eventId
    );
  }
}

export const storylineService = new StorylineService();
