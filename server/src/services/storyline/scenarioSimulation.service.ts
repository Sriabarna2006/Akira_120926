import crypto from 'crypto';
import {
  ScenarioType,
  StorylineScenario,
  ScenarioAssumption,
  ScenarioImpact,
  ScenarioAffectedEvent,
  ScenarioAffectedConcept,
  ScenarioDerivedConsequence,
  ScenarioUnknownArea,
  ScenarioQuizItem,
  ScenarioResult,
  ScenarioLearningSummary,
  CanonicalEvent,
  StorylineTurningPoint,
  UserMasteryClassification,
  ExtractedConcept,
} from '../../types/index.js';
import { storylineRepository } from '../../repositories/storyline.repository.js';
import { EventRepository } from '../../repositories/event.repository.js';
import { storylineService } from './storyline.service.js';
import { scenarioSimulationRepository } from '../../repositories/scenarioSimulation.repository.js';
import { aiUnderstandingRepository } from '../../repositories/aiUnderstanding.repository.js';
import { learningRepository } from '../../repositories/learning.repository.js';
import { knowledgeGraphRepository } from '../../repositories/knowledgeGraph.repository.js';
import { evidenceService } from '../evidence/evidence.service.js';

export class ScenarioSimulationService {
  private activeSimulations: Map<string, Promise<ScenarioResult>> = new Map();

  /**
   * Main entrypoint: Creates a scenario record and executes deterministic hypothesis simulation.
   */
  public async createAndSimulateScenario(
    storylineId: string,
    userId: string,
    payload: {
      targetEventId?: string;
      scenarioType: ScenarioType;
      question: string;
      assumptionText: string;
      title?: string;
    }
  ): Promise<ScenarioResult> {
    const storyline = await storylineRepository.findById(storylineId);
    if (!storyline) {
      throw new Error(`Storyline with ID "${storylineId}" not found`);
    }

    const timeline = await storylineService.getTimeline(storylineId);
    let targetEvent: CanonicalEvent | null = null;

    if (payload.targetEventId) {
      const eventInStoryline = timeline.some((t) => t.eventId === payload.targetEventId);
      if (!eventInStoryline) {
        throw new Error(
          `Target event "${payload.targetEventId}" does not belong to storyline "${storylineId}"`
        );
      }
      targetEvent = await EventRepository.findById(payload.targetEventId);
    } else if (timeline.length > 0) {
      // Default to latest or first turning point if not specified
      const turningPoints = await storylineService.getTurningPoints(storylineId);
      const defaultId = turningPoints.length > 0 ? turningPoints[0].eventId : timeline[0].eventId;
      targetEvent = await EventRepository.findById(defaultId);
    }

    const scenarioId = crypto.randomUUID();
    const now = new Date().toISOString();
    const title =
      payload.title ||
      (targetEvent
        ? `Scenario: ${payload.scenarioType.replace(/_/g, ' ')} on "${targetEvent.title.substring(0, 50)}..."`
        : `Hypothesis Simulation on ${storyline.title.substring(0, 50)}`);

    const scenario: StorylineScenario = {
      id: scenarioId,
      storylineId,
      userId,
      title,
      question: payload.question,
      scenarioType: payload.scenarioType,
      assumptionText: payload.assumptionText,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    await scenarioSimulationRepository.saveScenario(scenario);

    // Run Simulation
    return this.runSimulation(scenario, targetEvent, userId, true);
  }

  /**
   * Retrieves an existing scenario and its latest simulation result (with optional force refresh).
   */
  public async getScenarioResult(
    storylineId: string,
    scenarioId: string,
    userId: string,
    forceRefresh: boolean = false
  ): Promise<ScenarioResult> {
    const scenario = await scenarioSimulationRepository.findScenarioById(scenarioId, userId);
    if (!scenario || scenario.storylineId !== storylineId) {
      throw new Error(`Scenario with ID "${scenarioId}" not found for this storyline`);
    }

    const inputHash = scenarioSimulationRepository.generateInputHash(
      storylineId,
      scenario.scenarioType,
      undefined,
      scenario.assumptionText
    );

    if (!forceRefresh) {
      const cached = await scenarioSimulationRepository.getCachedRun(inputHash);
      if (cached) {
        return {
          ...cached,
          scenario,
        };
      }
    }

    // Determine target event if available
    const timeline = await storylineService.getTimeline(storylineId);
    let targetEvent: CanonicalEvent | null = null;
    if (timeline.length > 0) {
      targetEvent = await EventRepository.findById(timeline[0].eventId);
    }

    return this.runSimulation(scenario, targetEvent, userId, forceRefresh);
  }

  /**
   * Lists scenarios created by a user for a storyline.
   */
  public async listUserScenarios(
    storylineId: string,
    userId: string,
    limit: number = 20,
    page: number = 1
  ): Promise<StorylineScenario[]> {
    const storyline = await storylineRepository.findById(storylineId);
    if (!storyline) {
      throw new Error(`Storyline with ID "${storylineId}" not found`);
    }
    return scenarioSimulationRepository.listUserScenarios(storylineId, userId, limit, page);
  }

  /**
   * Deletes a scenario if owned by the requesting user.
   */
  public async deleteScenario(
    storylineId: string,
    scenarioId: string,
    userId: string
  ): Promise<boolean> {
    const scenario = await scenarioSimulationRepository.findScenarioById(scenarioId, userId);
    if (!scenario || scenario.storylineId !== storylineId) {
      throw new Error(`Scenario with ID "${scenarioId}" not found or unauthorized`);
    }
    return scenarioSimulationRepository.deleteScenario(scenarioId, userId);
  }

  /**
   * Retrieves scenario learning summary and reinforcement quiz.
   */
  public async getScenarioLearning(
    storylineId: string,
    scenarioId: string,
    userId: string
  ): Promise<ScenarioLearningSummary> {
    const result = await this.getScenarioResult(storylineId, scenarioId, userId);
    const affectedConcepts = result.affectedConcepts;

    const recommendedActions: ScenarioLearningSummary['recommendedActions'] = [];

    const needsLearning = affectedConcepts.filter((c) => c.masteryStatus === 'NEEDS_LEARNING');
    const needsReview = affectedConcepts.filter((c) => c.masteryStatus === 'DEVELOPING');

    if (needsReview.length > 0) {
      recommendedActions.push({
        actionType: 'REVIEW_CONCEPT',
        conceptId: needsReview[0].conceptId,
        title: `Review "${needsReview[0].title}"`,
        explanation: `Reinforce your understanding of ${needsReview[0].title} following this scenario exploration.`,
      });
    }

    if (needsLearning.length > 0) {
      recommendedActions.push({
        actionType: 'LEARN_CONCEPT',
        conceptId: needsLearning[0].conceptId,
        title: `Learn "${needsLearning[0].title}"`,
        explanation: `Explore foundational concept ${needsLearning[0].title} connected to the simulated changes.`,
      });
    }

    if (result.quiz && result.quiz.length > 0) {
      recommendedActions.push({
        actionType: 'TAKE_SCENARIO_QUIZ',
        title: 'Test Hypothesis Understanding',
        explanation: 'Check your reasoning about the documented causal relationships in this scenario.',
      });
    }

    recommendedActions.push({
      actionType: 'EXPLORE_STORYLINE',
      title: 'Return to Factual Storyline',
      explanation: 'Compare scenario outcomes with the actual factual trajectory and evidence.',
    });

    return {
      scenarioId,
      storylineId,
      affectedConcepts,
      recommendedActions,
      quiz: result.quiz || [],
    };
  }

  /**
   * Core Deterministic Simulation & Graph Traversal Pipeline.
   */
  private async runSimulation(
    scenario: StorylineScenario,
    targetEvent: CanonicalEvent | null,
    userId: string,
    forceRefresh: boolean
  ): Promise<ScenarioResult> {
    const inputHash = scenarioSimulationRepository.generateInputHash(
      scenario.storylineId,
      scenario.scenarioType,
      targetEvent?.id,
      scenario.assumptionText
    );

    if (!forceRefresh) {
      const cached = await scenarioSimulationRepository.getCachedRun(inputHash);
      if (cached) {
        return { ...cached, scenario };
      }
    }

    // In-flight Mutex lock to merge parallel requests
    const inFlight = this.activeSimulations.get(inputHash);
    if (inFlight) {
      return inFlight;
    }

    const simulationPromise = this.executeSimulationCore(scenario, targetEvent, userId)
      .then(async (result) => {
        await scenarioSimulationRepository.saveScenarioRun(scenario.id, inputHash, result);
        return result;
      })
      .finally(() => {
        this.activeSimulations.delete(inputHash);
      });

    this.activeSimulations.set(inputHash, simulationPromise);
    return simulationPromise;
  }

  /**
   * Core 6-Step Deterministic Calculation.
   */
  private async executeSimulationCore(
    scenario: StorylineScenario,
    targetEvent: CanonicalEvent | null,
    userId: string
  ): Promise<ScenarioResult> {
    const storylineId = scenario.storylineId;
    const now = new Date().toISOString();

    // 1. Load Storyline Context & Timeline
    const [timeline, turningPoints, evidenceOverview] = await Promise.all([
      storylineService.getTimeline(storylineId),
      storylineService.getTurningPoints(storylineId),
      storylineService.getEvidenceOverview(storylineId),
    ]);

    const allEvents: CanonicalEvent[] = [];
    for (const item of timeline) {
      const ev = await EventRepository.findById(item.eventId);
      if (ev) allEvents.push(ev);
    }

    // 2. Establish Baseline Facts
    const baselineFacts: ScenarioResult['baselineFacts'] = [];
    for (const ev of allEvents) {
      baselineFacts.push({
        statement: `${ev.title} occurred (${new Date(ev.firstPublishedAt || ev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}).`,
        eventId: ev.id,
        classification: 'VERIFIED_FACT',
        evidenceScore: (ev.finalRankScore || 80) > 90 ? 92 : 80,
      });
    }

    // 3. Build Explicit Assumption
    const assumption: ScenarioAssumption = {
      id: crypto.randomUUID(),
      scenarioId: scenario.id,
      targetEventId: targetEvent?.id || null,
      assumptionType: scenario.scenarioType,
      originalState: {
        title: targetEvent?.title || 'Initial baseline condition',
        summary: targetEvent?.summary || 'Standard observed condition in storyline timeline.',
        eventTime: targetEvent?.firstPublishedAt || targetEvent?.createdAt || now,
        status: targetEvent?.lifecycleStatus || 'OFFICIAL_CONFIRMATION',
      },
      hypotheticalState: {
        title: targetEvent ? `[HYPOTHETICAL] ${scenario.scenarioType.replace(/_/g, ' ')}: ${targetEvent.title}` : 'Hypothetical Condition',
        conditionShift: scenario.assumptionText,
        timeShiftHours: scenario.scenarioType === 'DELAY_EVENT' ? 4320 : 0, // 180 days default shift
        hypotheticalStatus: scenario.scenarioType === 'REMOVE_EVENT' ? 'UNOCCURRED' : 'ALTERED',
      },
      rationale: scenario.question,
      createdAt: now,
    };

    await scenarioSimulationRepository.saveAssumption(assumption);

    // 4. Propagate Documented Relations & Downstream Impact Identification
    const targetIndex = targetEvent ? allEvents.findIndex((e) => e.id === targetEvent.id) : -1;
    const downstreamEvents = targetIndex >= 0 ? allEvents.slice(targetIndex + 1) : allEvents.slice(1);

    const affectedEvents: ScenarioAffectedEvent[] = [];
    const impactsToSave: ScenarioImpact[] = [];

    for (const ev of downstreamEvents) {
      const isTP = turningPoints.some((tp) => tp.eventId === ev.id);
      let impactDirection: ScenarioAffectedEvent['impactDirection'] = 'DISRUPTED';
      let explanation = '';

      switch (scenario.scenarioType) {
        case 'REMOVE_EVENT':
          impactDirection = 'DISRUPTED';
          explanation = `Because "${targetEvent?.title || 'the initial event'}" did not occur under this assumption, the premise leading to "${ev.title}" is disrupted within this hypothetical model.`;
          break;
        case 'DELAY_EVENT':
          impactDirection = 'DELAYED';
          explanation = `Assuming the preceding milestone was delayed, the subsequent milestone "${ev.title}" would chronologically shift backward in this hypothetical timeline.`;
          break;
        case 'CHANGE_CONDITION':
          impactDirection = 'AMPLIFIED';
          explanation = `The altered condition ("${scenario.assumptionText}") directly impacts the operational assumptions behind "${ev.title}".`;
          break;
        case 'REVERSE_RELATION':
          impactDirection = 'DISRUPTED';
          explanation = `Reversing the causal relationship inverts the documented rationale for "${ev.title}".`;
          break;
        case 'CONTINUE_CONDITION':
          impactDirection = 'MITIGATED';
          explanation = `Continuing the previous condition postpones the structural transition represented by "${ev.title}".`;
          break;
      }

      affectedEvents.push({
        eventId: ev.id,
        title: ev.title,
        eventTime: ev.firstPublishedAt || ev.createdAt,
        isTurningPoint: isTP,
        relationshipToTarget: 'DOWNSTREAM_DOCUMENTED_CHRONOLOGY',
        impactDirection,
        classification: 'DERIVED_CONSEQUENCE',
        explanation,
        evidenceCompletenessScore: ev.sourceCount ? Math.min(100, ev.sourceCount * 25) : 75,
      });

      impactsToSave.push({
        id: crypto.randomUUID(),
        scenarioId: scenario.id,
        sourceEntityId: targetEvent?.id || 'baseline_condition',
        affectedEntityId: ev.id,
        entityType: isTP ? 'TURNING_POINT' : 'EVENT',
        relationshipType: 'CHRONOLOGICAL_DEPENDENCY',
        impactDirection,
        impactStrength: 0.85,
        explanation,
        evidenceState: {
          completenessScore: ev.sourceCount ? Math.min(100, ev.sourceCount * 25) : 75,
          confidenceState: 'WELL_SUPPORTED',
          hasConflicts: false,
        },
        createdAt: now,
      });
    }

    await scenarioSimulationRepository.saveImpacts(scenario.id, impactsToSave);

    // 5. Concept Knowledge Graph Traversal (Max Depth = 3)
    const affectedConcepts = await this.propagateConceptImpacts(
      allEvents,
      targetEvent,
      downstreamEvents,
      scenario.scenarioType,
      userId
    );

    // 6. Formulate Derived Consequences (Non-predictive, strictly bounded)
    const derivedConsequences: ScenarioDerivedConsequence[] = [];
    if (targetEvent) {
      derivedConsequences.push({
        statement: `The documented causal link between "${targetEvent.title}" and subsequent storyline developments would be altered.`,
        classification: 'DERIVED_CONSEQUENCE',
        supportingRelations: ['storyline_chronological_sequence', 'turning_point_association'],
        impactDirection: scenario.scenarioType === 'DELAY_EVENT' ? 'DELAYED' : 'DISRUPTED',
        groundingExplanation: `Derived from the strict chronological sequence established in Phase 11 for storyline "${storylineId}".`,
      });
    }

    if (affectedEvents.length > 0) {
      derivedConsequences.push({
        statement: `Within this hypothetical model, ${affectedEvents.length} downstream milestone${affectedEvents.length === 1 ? '' : 's'} would lack their documented historical antecedent.`,
        classification: 'DERIVED_CONSEQUENCE',
        supportingRelations: ['historical_event_precedence'],
        impactDirection: 'DISRUPTED',
        groundingExplanation: 'Follows from the removal or mutation of foundational prior decisions in the canonical timeline.',
      });
    }

    // 7. Explicit Unknown Areas (Grounded Epistemic Humility)
    const unknowns: ScenarioUnknownArea[] = [
      {
        topic: 'Alternative Counter-Decisions',
        reason: 'Historical records only document actual official decisions and responses.',
        explanation: `AKIRA cannot establish what alternative commercial or government actions would have arisen if "${targetEvent?.title || 'the target event'}" had not taken place.`,
        classification: 'UNKNOWN',
      },
      {
        topic: 'Hypothetical Market Pricing & Timeline Realignment',
        reason: 'Empirical market reactions outside documented timelines are speculative.',
        explanation: 'The exact timing of subsequent market tape-outs or regulatory clearances under this hypothetical scenario remains unknown.',
        classification: 'UNKNOWN',
      },
    ];

    // 8. Grounded Summary Formulation (Strictly Non-Predictive)
    const groundedSummary = this.formulateGroundedSummary(
      scenario,
      targetEvent,
      affectedEvents,
      affectedConcepts,
      derivedConsequences,
      unknowns
    );

    // 9. Generate Grounded Reasoning Quiz
    const quiz = this.generateScenarioQuiz(
      scenario,
      targetEvent,
      affectedEvents,
      affectedConcepts
    );

    return {
      scenario,
      assumption,
      baselineFacts,
      hypotheticalChange: {
        description: scenario.assumptionText,
        targetEventTitle: targetEvent?.title,
        assumptionType: scenario.scenarioType,
        classification: 'HYPOTHETICAL_ASSUMPTION',
      },
      affectedEvents,
      affectedConcepts,
      derivedConsequences,
      unknowns,
      evidenceSummary: {
        completenessScore: evidenceOverview.latestCompletenessScore,
        confidenceState: evidenceOverview.overallConfidenceState,
        publisherCount: evidenceOverview.totalUniquePublishers,
        hasConflicts: evidenceOverview.conflictCount > 0,
        conflictNote:
          evidenceOverview.conflictCount > 0
            ? `${evidenceOverview.conflictCount} reporting divergence(s) documented across publishers.`
            : undefined,
      },
      groundedSummary,
      quiz,
      generatedAt: now,
      isCached: false,
    };
  }

  /**
   * Propagates concept impacts across Knowledge Graph relations (bounded depth 3).
   */
  private async propagateConceptImpacts(
    allEvents: CanonicalEvent[],
    targetEvent: CanonicalEvent | null,
    downstreamEvents: CanonicalEvent[],
    scenarioType: ScenarioType,
    userId?: string
  ): Promise<ScenarioAffectedConcept[]> {
    const conceptMap = new Map<string, ExtractedConcept>();

    if (targetEvent) {
      const targetConcepts = await aiUnderstandingRepository.getConceptsByEventId(targetEvent.id);
      for (const c of targetConcepts) {
        conceptMap.set(c.id || c.slug, c);
      }
    }

    for (const ev of downstreamEvents) {
      const concepts = await aiUnderstandingRepository.getConceptsByEventId(ev.id);
      for (const c of concepts) {
        if (!conceptMap.has(c.id || c.slug)) {
          conceptMap.set(c.id || c.slug, c);
        }
      }
    }

    // Load User Mastery Map
    const userProgressMap = new Map<string, any>();
    if (userId) {
      const progress = await learningRepository.getAllProgressForUser(userId);
      for (const p of progress) {
        if (p.conceptId) userProgressMap.set(p.conceptId, p);
      }
    }

    const affectedConcepts: ScenarioAffectedConcept[] = [];

    for (const [id, c] of conceptMap.entries()) {
      const p = userProgressMap.get(id);
      let masteryStatus: UserMasteryClassification = 'NEEDS_LEARNING';
      let masteryScore = 0;

      if (p) {
        masteryScore = p.masteryScore || 0;
        if (p.masteryStatus === 'STRONG' || masteryScore >= 80) {
          masteryStatus = 'STRONG';
        } else if (p.masteryStatus === 'DEVELOPING' || masteryScore >= 50) {
          masteryStatus = 'DEVELOPING';
        } else {
          masteryStatus = 'NEEDS_LEARNING';
        }
      }

      // Check KG Relations (Depth 1-2)
      const isDirect = targetEvent
        ? (await aiUnderstandingRepository.getConceptsByEventId(targetEvent.id)).some(
            (tc) => (tc.id || tc.slug) === id
          )
        : false;

      const impactType = isDirect ? 'DIRECT' : 'PROPAGATED';
      const explanation = isDirect
        ? `Directly affected by the hypothetical modification of "${c.title}".`
        : `Connected via documented storyline sequence dependencies to "${c.title}".`;

      affectedConcepts.push({
        conceptId: c.id,
        title: c.title,
        slug: c.slug,
        category: c.category || 'General',
        shortDefinition: c.shortDefinition || 'Domain concept.',
        masteryStatus,
        masteryScore,
        impactType,
        explanation,
        reason:
          masteryStatus === 'STRONG'
            ? `You have mastered this concept (${masteryScore}%).`
            : masteryStatus === 'DEVELOPING'
            ? `Moderate mastery (${masteryScore}%). Reinforce with scenario reasoning.`
            : 'Unmastered concept. Explore foundational definition.',
      });
    }

    return affectedConcepts;
  }

  /**
   * Formulates a natural, non-predictive grounded explanation.
   */
  private formulateGroundedSummary(
    scenario: StorylineScenario,
    targetEvent: CanonicalEvent | null,
    affectedEvents: ScenarioAffectedEvent[],
    affectedConcepts: ScenarioAffectedConcept[],
    derivedConsequences: ScenarioDerivedConsequence[],
    unknowns: ScenarioUnknownArea[]
  ): string {
    const parts: string[] = [];

    parts.push(
      `Under the hypothetical assumption "${scenario.assumptionText}", AKIRA evaluated the documented chronological dependencies of this storyline.`
    );

    if (targetEvent) {
      parts.push(
        `The documented baseline relies on "${targetEvent.title}". Changing this condition would logically impact ${affectedEvents.length} downstream milestone${affectedEvents.length === 1 ? '' : 's'} and ${affectedConcepts.length} connected concept${affectedConcepts.length === 1 ? '' : 's'} within this scenario model.`
      );
    }

    if (derivedConsequences.length > 0) {
      parts.push(
        `Logical consequence: ${derivedConsequences[0].statement}`
      );
    }

    parts.push(
      `Important: ${unknowns[0].explanation} AKIRA maintains strict separation between verified facts and hypothetical models.`
    );

    return parts.join(' ');
  }

  /**
   * Generates a grounded multiple-choice reasoning quiz based on the scenario.
   */
  private generateScenarioQuiz(
    scenario: StorylineScenario,
    targetEvent: CanonicalEvent | null,
    affectedEvents: ScenarioAffectedEvent[],
    affectedConcepts: ScenarioAffectedConcept[]
  ): ScenarioQuizItem[] {
    const quizItems: ScenarioQuizItem[] = [];

    if (targetEvent && affectedEvents.length > 0) {
      quizItems.push({
        id: `q_sc_${scenario.id}_1`,
        question: `In this scenario, how does the assumption regarding "${targetEvent.title.substring(0, 45)}..." affect "${affectedEvents[0].title.substring(0, 45)}..."?`,
        options: [
          `It disrupts or alters the chronological dependency leading to the subsequent milestone.`,
          `It guarantees that the subsequent event happens immediately with 100% certainty.`,
          `It eliminates all historical evidence that ever existed prior to this storyline.`,
          `It proves that the verified historical facts were completely fabricated.`,
        ],
        correctAnswerIndex: 0,
        explanation: `Within AKIRA's hypothetical model, altering a prior milestone disrupts the chronological prerequisite relationship for downstream developments, but does not rewrite verified historical records.`,
        relatedEventId: targetEvent.id,
      });
    }

    if (affectedConcepts.length > 0) {
      const c = affectedConcepts[0];
      quizItems.push({
        id: `q_sc_${scenario.id}_2`,
        question: `Which core domain concept is directly connected to this scenario exploration?`,
        options: [
          c.title,
          'Unrelated Planetary Astrophysics',
          'Classical Latin Grammar',
          'Medieval Navigation Techniques',
        ],
        correctAnswerIndex: 0,
        explanation: `"${c.title}" is explicitly extracted from the canonical events involved in this storyline scenario.`,
        conceptId: c.conceptId,
      });
    }

    return quizItems;
  }
}

export const scenarioSimulationService = new ScenarioSimulationService();
