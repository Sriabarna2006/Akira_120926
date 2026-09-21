import {
  Storyline,
  StorylineDetailResponse,
  StorylineTimelineItem,
  StorylineTurningPoint,
  StorylineTrajectoryDetails,
  StorylineDeltaKnowledge,
  StorylineEvidenceOverview,
  StorylineKnowledgeOverview,
  UserStorylineLearningDelta,
} from '../types';

const API_BASE = '/api';

export class StorylineService {
  /**
   * Fetches paginated storylines list with optional filters.
   */
  public async getStorylines(params: {
    page?: number;
    limit?: number;
    regionId?: string;
    categoryId?: string;
    status?: string;
    trajectory?: string;
    search?: string;
  } = {}): Promise<{ storylines: Storyline[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', params.page.toString());
      if (params.limit) query.set('limit', params.limit.toString());
      if (params.regionId) query.set('regionId', params.regionId);
      if (params.categoryId) query.set('categoryId', params.categoryId);
      if (params.status) query.set('status', params.status);
      if (params.trajectory) query.set('trajectory', params.trajectory);
      if (params.search) query.set('search', params.search);

      const res = await fetch(`${API_BASE}/storylines?${query.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch storylines (status: ${res.status})`);
      const json = await res.json();
      return { storylines: json.data || [], total: json.meta?.total || 0 };
    } catch (err) {
      console.warn('[StorylineService] getStorylines fallback:', err);
      return { storylines: this.getFallbackStorylines(), total: 3 };
    }
  }

  /**
   * Fetches full detail aggregation for a storyline.
   */
  public async getStorylineDetail(id: string): Promise<StorylineDetailResponse> {
    try {
      const res = await fetch(`${API_BASE}/storylines/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch storyline detail (status: ${res.status})`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn(`[StorylineService] getStorylineDetail fallback for '${id}':`, err);
      return this.getFallbackDetail(id);
    }
  }

  /**
   * Fetches chronological timeline items for a storyline.
   */
  public async getTimeline(id: string): Promise<StorylineTimelineItem[]> {
    try {
      const res = await fetch(`${API_BASE}/storylines/${id}/timeline`);
      if (!res.ok) throw new Error(`Failed to fetch timeline (status: ${res.status})`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn(`[StorylineService] getTimeline fallback for '${id}':`, err);
      const detail = this.getFallbackDetail(id);
      return detail.timeline;
    }
  }

  /**
   * Fetches turning points for a storyline.
   */
  public async getTurningPoints(id: string): Promise<StorylineTurningPoint[]> {
    try {
      const res = await fetch(`${API_BASE}/storylines/${id}/turning-points`);
      if (!res.ok) throw new Error(`Failed to fetch turning points (status: ${res.status})`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn(`[StorylineService] getTurningPoints fallback for '${id}':`, err);
      const detail = this.getFallbackDetail(id);
      return detail.turningPoints;
    }
  }

  /**
   * Fetches delta knowledge between events in a storyline.
   */
  public async getDelta(id: string, fromEventId?: string, toEventId?: string): Promise<StorylineDeltaKnowledge> {
    try {
      const query = new URLSearchParams();
      if (fromEventId) query.set('fromEventId', fromEventId);
      if (toEventId) query.set('toEventId', toEventId);

      const res = await fetch(`${API_BASE}/storylines/${id}/delta?${query.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch delta (status: ${res.status})`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn(`[StorylineService] getDelta fallback for '${id}':`, err);
      const detail = this.getFallbackDetail(id);
      return detail.latestDelta;
    }
  }

  /**
   * Fetches storyline overview for a canonical event.
   */
  public async getStorylinesForEvent(eventId: string): Promise<Storyline[]> {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/storylines`);
      if (!res.ok) throw new Error(`Failed to fetch event storylines (status: ${res.status})`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn(`[StorylineService] getStorylinesForEvent fallback for '${eventId}':`, err);
      return this.getFallbackStorylines().slice(0, 1);
    }
  }

  /**
   * Fetches personalized user learning delta for an authenticated user.
   */
  public async getUserLearningDelta(storylineId: string): Promise<UserStorylineLearningDelta> {
    try {
      const res = await fetch(`${API_BASE}/storylines/${storylineId}/learning-delta`);
      if (!res.ok) throw new Error(`Failed to fetch user learning delta (status: ${res.status})`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn(`[StorylineService] getUserLearningDelta fallback for '${storylineId}':`, err);
      return {
        userId: 'anonymous',
        storylineId,
        hasLearnedEarlierEvents: false,
        alreadyKnownEventIds: [],
        alreadyKnownConceptIds: [],
        newEventsSinceLastLearning: [
          {
            id: 'evt_tn_ev_hub_2026',
            title: 'Tamil Nadu Cabinet Clears Mega Infrastructure & Electric Mobility Corridor Policy',
            eventTime: new Date().toISOString(),
            relationshipType: 'DECISION',
          },
        ],
        newConceptsSinceLastLearning: [],
        summaryText: 'Discover the full chronological evolution of this storyline.',
      };
    }
  }

  // ============================================================================
  // Fallbacks for Smooth Previews & Offline Execution
  // ============================================================================

  private getFallbackStorylines(): Storyline[] {
    return [
      {
        id: 'stl_tn_ev_corridor_2026',
        title: 'Tamil Nadu Clean Mobility & Regional Industrial Transit Corridor Evolution',
        summary: 'Chronological timeline of policy clearances, capital deployment, and transit infrastructure connecting Chennai-Hosur electric vehicle clusters.',
        status: 'ACTIVE',
        region: 'Tamil Nadu',
        category: 'Infrastructure',
        startedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        currentEventId: 'evt_tn_ev_hub_2026',
        trajectory: 'DEVELOPING',
        eventCount: 2,
        turningPointCount: 1,
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
      {
        id: 'stl_macro_rates_2026',
        title: 'Global Central Bank Monetary Policy & Interest Rate Trajectory Cycle',
        summary: 'Chronological tracking of central bank rate guidance, inflation metrics, and liquidity corridor adjustments across major economies.',
        status: 'ACTIVE',
        region: 'India',
        category: 'Economy',
        startedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        currentEventId: 'evt_macro_rates_2026',
        trajectory: 'STABLE',
        eventCount: 2,
        turningPointCount: 1,
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ];
  }

  private getFallbackDetail(id: string): StorylineDetailResponse {
    const storylines = this.getFallbackStorylines();
    const sl = storylines.find((s) => s.id === id) || storylines[0];

    const timeline: StorylineTimelineItem[] = [
      {
        id: 'se_01',
        eventId: 'evt_origin',
        title: 'Initial State Strategic Infrastructure Policy Framework Drafted',
        summary: 'Planning commission proposed integrated industrial transport corridors across emerging manufacturing hubs.',
        relationshipType: 'ORIGIN',
        sequenceOrder: 1,
        eventTime: new Date(Date.now() - 7 * 86400000).toISOString(),
        urgencyLabel: 'IMPORTANT',
        importanceScore: 84,
        finalRankScore: 82,
        sourceCount: 2,
        lifecycleStatus: 'INITIAL_REPORT',
        isTurningPoint: true,
        turningPointReason: 'Foundational baseline establishing the initial policy proposal.',
        evidenceCompletenessScore: 78,
        evidenceConfidenceState: 'WELL_SUPPORTED',
        keyConcepts: ['electric-mobility', 'regional-transit'],
      },
      {
        id: 'se_02',
        eventId: sl.currentEventId || 'evt_tn_ev_hub_2026',
        title: sl.title,
        summary: sl.summary,
        relationshipType: 'DECISION',
        sequenceOrder: 2,
        eventTime: new Date(Date.now() - 2 * 3600000).toISOString(),
        urgencyLabel: 'IMPORTANT',
        importanceScore: 94,
        finalRankScore: 96,
        sourceCount: 3,
        lifecycleStatus: 'OFFICIAL_CONFIRMATION',
        isTurningPoint: true,
        turningPointReason: 'State Cabinet formally approved capital funding and high-speed metro linkages.',
        evidenceCompletenessScore: 88,
        evidenceConfidenceState: 'WELL_SUPPORTED',
        keyConcepts: ['electric-mobility', 'regional-transit', 'infrastructure-funding'],
      },
    ];

    const turningPoints: StorylineTurningPoint[] = [
      {
        id: 'tp_01',
        storylineId: id,
        eventId: 'evt_origin',
        title: 'Initial Strategic Policy Draft',
        reason: 'Foundational baseline establishing the initial policy proposal.',
        turningPointType: 'ORIGIN',
        occurredAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: 'tp_02',
        storylineId: id,
        eventId: sl.currentEventId || 'evt_tn_ev_hub_2026',
        title: 'Cabinet Formal Approval & Capital Outlay Commitment',
        reason: 'Turning point because an official state cabinet decision transitioned the initiative from proposal to funded execution.',
        turningPointType: 'OFFICIAL_DECISION',
        occurredAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ];

    const trajectory: StorylineTrajectoryDetails = {
      storylineId: id,
      currentStatus: 'ACTIVE',
      trajectoryDirection: 'DEVELOPING',
      eventCount: 2,
      timelineDurationHours: 166,
      timelineDurationFormatted: '6d 22h',
      recentActivityLevel: 'HIGH',
      turningPointCount: 2,
      latestEvent: {
        id: sl.currentEventId || 'evt_tn_ev_hub_2026',
        title: sl.title,
        eventTime: new Date(Date.now() - 2 * 3600000).toISOString(),
        lifecycleStatus: 'OFFICIAL_CONFIRMATION',
      },
      previousEvent: {
        id: 'evt_origin',
        title: 'Initial State Strategic Infrastructure Policy Framework Drafted',
        eventTime: new Date(Date.now() - 7 * 86400000).toISOString(),
        lifecycleStatus: 'INITIAL_REPORT',
      },
      latestEvidenceCompleteness: 88,
      latestConfidenceState: 'WELL_SUPPORTED',
      explanation: 'Observed chronological trajectory: DEVELOPING (2 canonical events spanning 6d 22h, with 2 turning points).',
    };

    const latestDelta: StorylineDeltaKnowledge = {
      storylineId: id,
      fromEventId: 'evt_origin',
      toEventId: sl.currentEventId || 'evt_tn_ev_hub_2026',
      fromEventTitle: 'Initial State Strategic Infrastructure Policy Framework Drafted',
      toEventTitle: sl.title,
      timeGapHours: 166,
      hasMeaningfulChange: true,
      newFacts: [
        'State Cabinet formally approved dedicated capital funding allocations.',
        'High-speed metro transit links approved connecting Chennai industrial corridors to Hosur EV manufacturing hub.',
        'Corroborated across 3 verified regional and national publications.',
      ],
      changedFacts: [
        'Lifecycle status progressed from Initial Report to Official Confirmation.',
        'Corroborated importance score increased from 84/100 to 94/100.',
      ],
      newConcepts: [
        {
          id: 'infrastructure-funding',
          title: 'Infrastructure Capital Allocation',
          slug: 'infrastructure-funding',
          shortDefinition: 'Statutory capital expenditure cleared for strategic multi-modal connectivity.',
        },
      ],
      changedAffectedGroups: {
        added: ['EV Manufacturers', 'Regional Commuters', 'Supply Chain Hubs'],
        previous: ['State Planning Commission'],
      },
      statusShift: {
        from: 'INITIAL_REPORT',
        to: 'OFFICIAL_CONFIRMATION',
      },
      evidenceEvolution: {
        fromScore: 78,
        toScore: 88,
        scoreDelta: 10,
        fromState: 'DEVELOPING',
        toState: 'WELL_SUPPORTED',
        newPublishers: ['Press Information Bureau (PIB)', 'The Hindu'],
      },
      newConflicts: [],
      understandingShift: {
        previousSummary: 'Planning commission proposed integrated industrial transport corridors.',
        currentSummary: sl.summary,
        keyShift: 'Transition from strategic proposal to statutory approval and funded capital rollout.',
      },
      summaryExplanation: 'Since initial planning, formal cabinet decision confirmed funding, introduced infrastructure capital allocation concepts, and raised evidence completeness to 88%.',
    };

    const evidenceOverview: StorylineEvidenceOverview = {
      storylineId: id,
      latestCompletenessScore: 88,
      overallConfidenceState: 'WELL_SUPPORTED',
      totalUniquePublishers: 3,
      totalPrimarySources: 1,
      totalIndependentReportingCount: 2,
      publisherTypeCounts: {
        GOVERNMENT: 1,
        NATIONAL: 1,
        WIRE: 1,
      },
      conflictCount: 0,
      timelineEvidenceEvolution: [
        {
          eventId: 'evt_origin',
          eventTitle: 'Initial State Strategic Infrastructure Policy Framework Drafted',
          eventTime: new Date(Date.now() - 7 * 86400000).toISOString(),
          completenessScore: 78,
          confidenceState: 'WELL_SUPPORTED',
          sourceCount: 2,
        },
        {
          eventId: sl.currentEventId || 'evt_tn_ev_hub_2026',
          eventTitle: sl.title,
          eventTime: new Date(Date.now() - 2 * 3600000).toISOString(),
          completenessScore: 88,
          confidenceState: 'WELL_SUPPORTED',
          sourceCount: 3,
        },
      ],
    };

    const knowledgeOverview: StorylineKnowledgeOverview = {
      storylineId: id,
      dominantConcepts: [
        {
          id: 'electric-mobility',
          title: 'Electric Mobility',
          slug: 'electric-mobility',
          shortDefinition: 'Transportation powered by electricity including battery electric vehicles.',
        },
        {
          id: 'regional-transit',
          title: 'Regional Transit Corridors',
          slug: 'regional-transit',
          shortDefinition: 'Dedicated high-capacity transportation networks connecting urban and industrial zones.',
        },
      ],
      timelineConceptEvolution: [
        {
          eventId: 'evt_origin',
          eventTitle: 'Initial State Strategic Infrastructure Policy Framework Drafted',
          newConceptsIntroduced: [
            {
              id: 'electric-mobility',
              title: 'Electric Mobility',
              slug: 'electric-mobility',
              shortDefinition: 'Transportation powered by electricity including battery electric vehicles.',
            },
          ],
        },
        {
          eventId: sl.currentEventId || 'evt_tn_ev_hub_2026',
          eventTitle: sl.title,
          newConceptsIntroduced: [
            {
              id: 'regional-transit',
              title: 'Regional Transit Corridors',
              slug: 'regional-transit',
              shortDefinition: 'Dedicated high-capacity transportation networks connecting urban and industrial zones.',
            },
          ],
        },
      ],
      prerequisiteConcepts: [],
      relatedConcepts: [],
      relatedStorylines: [],
    };

    return {
      storyline: sl,
      trajectory,
      timeline,
      turningPoints,
      latestDelta,
      evidenceOverview,
      knowledgeOverview,
    };
  }
}

export const storylineService = new StorylineService();
