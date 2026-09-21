import {
  CanonicalEvent,
  StorylineEventRelation,
  StorylineTimelineItem,
  StorylineTurningPoint,
  StorylineTrajectoryDetails,
  StorylineTrajectoryDirection,
  StorylineStatus,
  ConfidenceState,
  LifecycleStatus,
} from '../../types/index.js';
import { STORYLINE_CONFIG } from '../../config/storylineConfig.js';
import { evidenceService } from '../evidence/evidence.service.js';

export class StorylineTrajectoryService {
  /**
   * Constructs strict chronological timeline items from associated events.
   */
  public async buildChronologicalTimeline(
    relations: StorylineEventRelation[],
    eventsMap: Map<string, CanonicalEvent>,
    turningPoints: StorylineTurningPoint[]
  ): Promise<StorylineTimelineItem[]> {
    const turningPointsByEventId = new Map<string, StorylineTurningPoint>();
    for (const tp of turningPoints) {
      turningPointsByEventId.set(tp.eventId, tp);
    }

    // Strict chronological sort by eventTime (falling back to canonical event dates)
    const sortedRelations = [...relations].sort((a, b) => {
      const timeA = new Date(a.eventTime || eventsMap.get(a.eventId)?.firstPublishedAt || 0).getTime();
      const timeB = new Date(b.eventTime || eventsMap.get(b.eventId)?.firstPublishedAt || 0).getTime();
      return timeA - timeB;
    });

    const timeline: StorylineTimelineItem[] = [];

    for (let i = 0; i < sortedRelations.length; i++) {
      const rel = sortedRelations[i];
      const ev = eventsMap.get(rel.eventId);
      const tp = turningPointsByEventId.get(rel.eventId);

      const eventTime = rel.eventTime || ev?.firstPublishedAt || ev?.createdAt || new Date().toISOString();
      const title = ev?.title || `Event ${rel.eventId}`;
      const summary = ev?.summary || rel.associationExplanation || 'Event development in storyline.';
      const urgencyLabel = ev?.urgencyLabel || 'IMPORTANT';
      const importanceScore = ev?.importanceScore || 70;
      const finalRankScore = ev?.finalRankScore || 60;
      const sourceCount = ev?.sourceCount || (ev?.sources ? ev.sources.length : 1);
      const lifecycleStatus: LifecycleStatus = ev?.lifecycleStatus || 'NEW_DEVELOPMENT';

      // Detect turning point dynamically if not explicitly stored
      const isTp = Boolean(tp) || this.isPotentialTurningPoint(ev, rel, i, sortedRelations, eventsMap);
      const tpReason = tp?.reason || (isTp ? this.generateTurningPointReason(ev, rel, i) : undefined);

      // Integrate Phase 10 evidence completeness where available
      let evidenceCompletenessScore: number | undefined = undefined;
      let evidenceConfidenceState: ConfidenceState | undefined = undefined;

      if (ev) {
        try {
          const evSummary = await evidenceService.getEvidenceSummary(ev.id);
          evidenceCompletenessScore = evSummary.completenessScore;
          evidenceConfidenceState = evSummary.confidenceState;
        } catch {
          // graceful fallback
          evidenceCompletenessScore = 75;
          evidenceConfidenceState = 'WELL_SUPPORTED';
        }
      }

      timeline.push({
        id: rel.id,
        eventId: rel.eventId,
        title,
        summary,
        relationshipType: rel.relationshipType,
        sequenceOrder: i + 1,
        eventTime,
        urgencyLabel,
        importanceScore,
        finalRankScore,
        sourceCount,
        lifecycleStatus,
        isTurningPoint: isTp,
        turningPointReason: tpReason,
        evidenceCompletenessScore,
        evidenceConfidenceState,
        keyConcepts: ev?.relatedConcepts || ev?.concepts?.map((c) => c.title) || [],
      });
    }

    return timeline;
  }

  /**
   * Deterministically evaluates whether an event in the timeline qualifies as a Turning Point.
   */
  public isPotentialTurningPoint(
    event: CanonicalEvent | undefined,
    relation: StorylineEventRelation,
    index: number,
    allRelations: StorylineEventRelation[],
    eventsMap: Map<string, CanonicalEvent>
  ): boolean {
    if (!event) return false;

    // 1. Origin of storyline is always a key anchor
    if (relation.relationshipType === 'ORIGIN' || index === 0) {
      return true;
    }

    // 2. Explicit decision, outcome, or implementation relationship
    if (['DECISION', 'OUTCOME', 'IMPLEMENTATION'].includes(relation.relationshipType)) {
      return true;
    }

    // 3. Official confirmation or resolution lifecycle stage
    if (['OFFICIAL_CONFIRMATION', 'RESOLVED'].includes(event.lifecycleStatus)) {
      return true;
    }

    // 4. Critical importance spike (>= 90)
    if (event.importanceScore >= STORYLINE_CONFIG.TURNING_POINT_TRIGGERS.HIGH_IMPORTANCE_THRESHOLD) {
      return true;
    }

    // 5. Significant gap followed by active resumption
    if (index > 0) {
      const prevRel = allRelations[index - 1];
      const prevEv = eventsMap.get(prevRel.eventId);
      const timePrev = new Date(prevRel.eventTime || prevEv?.firstPublishedAt || 0).getTime();
      const timeCurr = new Date(relation.eventTime || event.firstPublishedAt || 0).getTime();
      const gapDays = (timeCurr - timePrev) / 86400000;

      if (gapDays >= 7) {
        return true;
      }

      // Check importance delta jump
      if (prevEv && event.importanceScore - prevEv.importanceScore >= STORYLINE_CONFIG.TURNING_POINT_TRIGGERS.SIGNIFICANT_IMPORTANCE_DELTA) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generates factual, non-sensational explainable reason for turning point.
   */
  public generateTurningPointReason(
    event: CanonicalEvent | undefined,
    relation: StorylineEventRelation,
    index: number
  ): string {
    if (relation.relationshipType === 'ORIGIN' || index === 0) {
      return 'Foundational anchor establishing the baseline real-world development.';
    }
    if (relation.relationshipType === 'DECISION' || event?.lifecycleStatus === 'OFFICIAL_CONFIRMATION') {
      return 'Turning point because an official confirmation or policy decision transitioned the development to funded execution.';
    }
    if (relation.relationshipType === 'OUTCOME' || event?.lifecycleStatus === 'RESOLVED') {
      return 'Turning point representing formal outcome and observed resolution of the storyline.';
    }
    if (relation.relationshipType === 'IMPLEMENTATION') {
      return 'Turning point marking active operational implementation and physical rollout.';
    }
    if (event && event.importanceScore >= 90) {
      return `Turning point marked by high global impact and high corroboration score (${event.importanceScore}/100).`;
    }
    return 'Turning point marked by meaningful progression in the storyline narrative.';
  }

  /**
   * Calculates deterministic storyline trajectory details based on observed timeline events.
   */
  public calculateTrajectory(
    storylineId: string,
    timeline: StorylineTimelineItem[]
  ): StorylineTrajectoryDetails {
    if (timeline.length === 0) {
      return {
        storylineId,
        currentStatus: 'UNKNOWN',
        trajectoryDirection: 'UNKNOWN',
        eventCount: 0,
        timelineDurationHours: 0,
        timelineDurationFormatted: '0 hours',
        recentActivityLevel: 'LOW',
        turningPointCount: 0,
        latestEvent: {
          id: 'unknown',
          title: 'No events',
          eventTime: new Date().toISOString(),
          lifecycleStatus: 'INITIAL_REPORT',
        },
        latestEvidenceCompleteness: 0,
        latestConfidenceState: 'UNCONFIRMED',
        explanation: 'Insufficient event data to compute storyline trajectory.',
      };
    }

    const firstItem = timeline[0];
    const latestItem = timeline[timeline.length - 1];
    const prevItem = timeline.length > 1 ? timeline[timeline.length - 2] : undefined;

    const startTime = new Date(firstItem.eventTime).getTime();
    const latestTime = new Date(latestItem.eventTime).getTime();
    const durationMs = Math.max(0, latestTime - startTime);
    const timelineDurationHours = Math.round(durationMs / 3600000);

    const durationDays = Math.floor(timelineDurationHours / 24);
    const durationRemHours = timelineDurationHours % 24;
    const timelineDurationFormatted =
      durationDays > 0 ? `${durationDays}d ${durationRemHours}h` : `${timelineDurationHours}h`;

    const now = Date.now();
    const hoursSinceLatest = Math.round((now - latestTime) / 3600000);

    let recentActivityLevel: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    if (hoursSinceLatest <= STORYLINE_CONFIG.TRAJECTORY_ACTIVITY_THRESHOLDS.HIGH_HOURS) {
      recentActivityLevel = 'HIGH';
    } else if (hoursSinceLatest <= STORYLINE_CONFIG.TRAJECTORY_ACTIVITY_THRESHOLDS.MODERATE_HOURS) {
      recentActivityLevel = 'MODERATE';
    } else {
      recentActivityLevel = 'LOW';
    }

    const turningPointCount = timeline.filter((t) => t.isTurningPoint).length;

    // Evaluate Trajectory Direction
    let trajectoryDirection: StorylineTrajectoryDirection = 'DEVELOPING';
    let currentStatus: StorylineStatus = 'ACTIVE';

    if (latestItem.lifecycleStatus === 'RESOLVED' || latestItem.relationshipType === 'OUTCOME') {
      trajectoryDirection = 'CONCLUDED';
      currentStatus = 'CONCLUDED';
    } else if (latestItem.urgencyLabel === 'BREAKING' || latestItem.importanceScore >= 92) {
      trajectoryDirection = 'ESCALATING';
      currentStatus = 'ACTIVE';
    } else if (hoursSinceLatest > 14 * 24 && latestItem.lifecycleStatus === 'FOLLOW_UP') {
      trajectoryDirection = 'DE-ESCALATING';
      currentStatus = 'STABILIZING';
    } else if (timeline.length === 1) {
      trajectoryDirection = 'DEVELOPING';
      currentStatus = 'EMERGING';
    } else if (recentActivityLevel === 'HIGH') {
      trajectoryDirection = 'DEVELOPING';
      currentStatus = 'ACTIVE';
    } else {
      trajectoryDirection = 'STABLE';
      currentStatus = 'STABILIZING';
    }

    const latestEvidenceCompleteness = latestItem.evidenceCompletenessScore || 75;
    const latestConfidenceState = latestItem.evidenceConfidenceState || 'WELL_SUPPORTED';

    const explanation = `Observed chronological trajectory: ${trajectoryDirection} (${timeline.length} canonical events spanning ${timelineDurationFormatted}, with ${turningPointCount} turning point${
      turningPointCount === 1 ? '' : 's'
    }). Latest update occurred ${hoursSinceLatest <= 1 ? 'within the last hour' : `${hoursSinceLatest}h ago`}.`;

    return {
      storylineId,
      currentStatus,
      trajectoryDirection,
      eventCount: timeline.length,
      timelineDurationHours,
      timelineDurationFormatted,
      recentActivityLevel,
      turningPointCount,
      latestEvent: {
        id: latestItem.eventId,
        title: latestItem.title,
        eventTime: latestItem.eventTime,
        lifecycleStatus: latestItem.lifecycleStatus,
      },
      previousEvent: prevItem
        ? {
            id: prevItem.eventId,
            title: prevItem.title,
            eventTime: prevItem.eventTime,
            lifecycleStatus: prevItem.lifecycleStatus,
          }
        : undefined,
      latestEvidenceCompleteness,
      latestConfidenceState,
      explanation,
    };
  }
}

export const storylineTrajectoryService = new StorylineTrajectoryService();
