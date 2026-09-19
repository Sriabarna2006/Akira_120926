import {
  ExtractedConcept,
  ConceptRelation,
  ConceptRelationType,
  ConceptGraphNode,
  ConceptGraphEdge,
  ConceptLearningPath,
  ConceptLearningPathStep,
  RelatedConceptItem,
  RelatedEventItem,
  EventKnowledgeMap,
  ConceptKnowledgeStatus,
  UserMasteryClassification,
  CanonicalEvent,
} from '../../types/index.js';
import { knowledgeGraphRepository } from '../../repositories/knowledgeGraph.repository.js';
import { learningRepository } from '../../repositories/learning.repository.js';
import { EventRepository } from '../../repositories/event.repository.js';
import { aiUnderstandingRepository } from '../../repositories/aiUnderstanding.repository.js';

export class KnowledgeGraphService {
  private readonly MAX_TRAVERSAL_DEPTH = 5;

  // ============================================================================
  // 1. GRAPH VALIDATION & CYCLE DETECTION (DAG ENFORCEMENT)
  // ============================================================================

  /**
   * Detects cycles in prerequisite / dependency chains using 3-color DFS.
   * Throws or returns detailed cycle path if a cycle is found.
   */
  public async detectPrerequisiteCycle(
    candidateSourceId: string,
    candidateTargetId: string
  ): Promise<{ hasCycle: boolean; cyclePath?: string[] }> {
    const cleanSource = candidateSourceId.trim().toLowerCase();
    const cleanTarget = candidateTargetId.trim().toLowerCase();

    if (cleanSource === cleanTarget) {
      return { hasCycle: true, cyclePath: [cleanSource, cleanTarget] };
    }

    // Build directed adjacency list of prerequisite edges (child -> parent)
    const allRelations = await knowledgeGraphRepository.getAllRelations();
    const adj = new Map<string, string[]>();

    for (const r of allRelations) {
      if (r.relationType === 'PREREQUISITE' || r.relationType === 'DEPENDS_ON') {
        const u = r.sourceConceptId.toLowerCase();
        const v = r.targetConceptId.toLowerCase();
        if (!adj.has(u)) adj.set(u, []);
        adj.get(u)!.push(v);
      }
    }

    // Add hypothetical edge
    if (!adj.has(cleanSource)) adj.set(cleanSource, []);
    adj.get(cleanSource)!.push(cleanTarget);

    // 3-Color DFS: 0=White (unvisited), 1=Gray (visiting), 2=Black (visited)
    const color = new Map<string, number>();
    const parent = new Map<string, string | null>();

    const dfs = (node: string, currentPath: string[]): string[] | null => {
      color.set(node, 1); // Gray
      const neighbors = adj.get(node) || [];

      for (const neighbor of neighbors) {
        if (color.get(neighbor) === 1) {
          // Cycle found!
          return [...currentPath, node, neighbor];
        }
        if (!color.has(neighbor) || color.get(neighbor) === 0) {
          parent.set(neighbor, node);
          const res = dfs(neighbor, [...currentPath, node]);
          if (res) return res;
        }
      }

      color.set(node, 2); // Black
      return null;
    };

    const nodes = Array.from(adj.keys());
    for (const node of nodes) {
      if (!color.has(node) || color.get(node) === 0) {
        const cycle = dfs(node, []);
        if (cycle) {
          return { hasCycle: true, cyclePath: cycle };
        }
      }
    }

    return { hasCycle: false };
  }

  /**
   * Adds or updates a concept relationship with full integrity and cycle validation
   */
  public async addRelation(params: {
    sourceConceptId: string;
    targetConceptId: string;
    relationType: ConceptRelationType;
    weight?: number;
  }): Promise<ConceptRelation> {
    const { sourceConceptId, targetConceptId, relationType, weight = 1.0 } = params;

    if (!sourceConceptId || !targetConceptId) {
      throw new Error('sourceConceptId and targetConceptId are required.');
    }

    const cleanSource = sourceConceptId.trim().toLowerCase();
    const cleanTarget = targetConceptId.trim().toLowerCase();

    if (cleanSource === cleanTarget) {
      throw new Error(`Self-loop rejected: Concept '${cleanSource}' cannot link to itself.`);
    }

    // Validate concept existence
    const [sourceConcept, targetConcept] = await Promise.all([
      knowledgeGraphRepository.getConceptById(cleanSource),
      knowledgeGraphRepository.getConceptById(cleanTarget),
    ]);

    if (!sourceConcept) {
      throw new Error(`Invalid source concept ID: '${cleanSource}' does not exist.`);
    }
    if (!targetConcept) {
      throw new Error(`Invalid target concept ID: '${cleanTarget}' does not exist.`);
    }

    // Validate cycle if this is a directional dependency edge
    if (relationType === 'PREREQUISITE' || relationType === 'DEPENDS_ON') {
      const cycleCheck = await this.detectPrerequisiteCycle(cleanSource, cleanTarget);
      if (cycleCheck.hasCycle) {
        throw new Error(
          `Circular dependency rejected: Adding prerequisite from '${cleanSource}' to '${cleanTarget}' forms a cycle (${cycleCheck.cyclePath?.join(' -> ')}).`
        );
      }
    }

    return knowledgeGraphRepository.saveRelation({
      sourceConceptId: cleanSource,
      targetConceptId: cleanTarget,
      relationType,
      weight,
    });
  }

  // ============================================================================
  // 2. PREREQUISITE GRAPH TRAVERSAL & HIERARCHICAL TREE
  // ============================================================================

  /**
   * Traverses all ancestors in the prerequisite DAG up to max depth 5
   */
  public async getPrerequisiteTree(
    conceptId: string,
    userId?: string,
    maxDepth = this.MAX_TRAVERSAL_DEPTH
  ): Promise<{ nodes: ConceptGraphNode[]; edges: ConceptGraphEdge[] }> {
    const cleanId = conceptId.trim().toLowerCase();
    const targetConcept = await knowledgeGraphRepository.getConceptById(cleanId);
    if (!targetConcept) {
      throw new Error(`Concept '${cleanId}' not found.`);
    }

    const depthLimit = Math.min(this.MAX_TRAVERSAL_DEPTH, Math.max(1, maxDepth));
    const allRelations = await knowledgeGraphRepository.getAllRelations();
    const allConcepts = await knowledgeGraphRepository.getAllConcepts();

    const conceptMap = new Map<string, ExtractedConcept>();
    for (const c of allConcepts) {
      conceptMap.set(c.id.toLowerCase(), c);
      conceptMap.set(c.slug.toLowerCase(), c);
    }

    // Fetch user mastery records if authenticated
    const masteryMap = new Map<string, { score: number; status: UserMasteryClassification }>();
    if (userId) {
      const userProgress = await learningRepository.getAllProgressForUser(userId);
      for (const p of userProgress) {
        if (p.conceptId) {
          masteryMap.set(p.conceptId.toLowerCase(), {
            score: p.masteryScore,
            status: p.masteryStatus as UserMasteryClassification,
          });
        }
      }
    }

    // BFS / DFS up the prerequisite tree
    const visitedNodes = new Set<string>();
    const nodes: ConceptGraphNode[] = [];
    const edges: ConceptGraphEdge[] = [];
    const queue: { id: string; depth: number }[] = [{ id: cleanId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visitedNodes.has(current.id)) continue;
      visitedNodes.add(current.id);

      const conceptObj = conceptMap.get(current.id) || {
        id: current.id,
        title: current.id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        slug: current.id,
        category: targetConcept.category || 'General',
        shortDefinition: `Foundational prerequisite for ${targetConcept.title}.`,
        prerequisites: [],
      };

      const mastery = masteryMap.get(current.id) || { score: 0, status: 'UNKNOWN' };

      nodes.push({
        id: conceptObj.id,
        title: conceptObj.title,
        slug: conceptObj.slug || conceptObj.id,
        category: conceptObj.category || 'General',
        shortDefinition: conceptObj.shortDefinition,
        whyItMatters: conceptObj.whyItMatters,
        masteryStatus: mastery.status,
        masteryScore: mastery.score,
        isTarget: current.id === cleanId,
        isPrerequisite: current.id !== cleanId,
        depth: current.depth,
      });

      if (current.depth >= depthLimit) continue;

      // Find direct prerequisites from relations and concept prerequisites array
      const outgoingPrereqs = allRelations.filter(
        (r) =>
          r.sourceConceptId.toLowerCase() === current.id &&
          (r.relationType === 'PREREQUISITE' || r.relationType === 'DEPENDS_ON')
      );

      const prereqIds = new Set<string>();
      for (const r of outgoingPrereqs) {
        prereqIds.add(r.targetConceptId.toLowerCase());
        edges.push({
          source: r.sourceConceptId,
          target: r.targetConceptId,
          relationType: r.relationType,
          weight: r.weight,
        });
      }

      if (conceptObj.prerequisites) {
        for (const p of conceptObj.prerequisites) {
          const cleanP = p.toLowerCase();
          if (!prereqIds.has(cleanP)) {
            prereqIds.add(cleanP);
            edges.push({
              source: current.id,
              target: cleanP,
              relationType: 'PREREQUISITE',
              weight: 1.0,
            });
          }
        }
      }

      for (const pId of prereqIds) {
        if (!visitedNodes.has(pId)) {
          queue.push({ id: pId, depth: current.depth + 1 });
        }
      }
    }

    return { nodes, edges };
  }

  // ============================================================================
  // 3. DETERMINISTIC RELATED CONCEPTS ENGINE
  // ============================================================================

  /**
   * Deterministically scores and ranks related concepts using:
   * 0.35 * RelationWeight + 0.30 * SharedEvents + 0.20 * CategorySimilarity + 0.15 * GraphDistance
   */
  public async getRelatedConcepts(conceptId: string, limit = 6): Promise<RelatedConceptItem[]> {
    const cleanId = conceptId.trim().toLowerCase();
    const sourceConcept = await knowledgeGraphRepository.getConceptById(cleanId);
    if (!sourceConcept) {
      throw new Error(`Concept '${cleanId}' not found.`);
    }

    const [allConcepts, allRelations] = await Promise.all([
      knowledgeGraphRepository.getAllConcepts(),
      knowledgeGraphRepository.getAllRelations(),
    ]);

    const otherConcepts = allConcepts.filter(
      (c) => c.id.toLowerCase() !== cleanId && c.slug.toLowerCase() !== cleanId
    );

    if (otherConcepts.length === 0) return [];

    // Batch fetch event associations
    const conceptIdsToFetch = [cleanId, ...otherConcepts.map((c) => c.id.toLowerCase())];
    const eventMap = await knowledgeGraphRepository.getEventIdsForConceptsBatch(conceptIdsToFetch);
    const sourceEventIds = new Set(eventMap.get(cleanId) || []);

    // Build direct relationship lookup
    const directRelationMap = new Map<string, { weight: number; type: ConceptRelationType }>();
    for (const r of allRelations) {
      const src = r.sourceConceptId.toLowerCase();
      const tgt = r.targetConceptId.toLowerCase();
      if (src === cleanId) {
        directRelationMap.set(tgt, { weight: r.weight, type: r.relationType });
      } else if (tgt === cleanId) {
        directRelationMap.set(src, { weight: r.weight, type: r.relationType });
      }
    }

    // Build BFS distance lookup for graph proximity
    const graphDistances = this.computeShortestGraphDistances(cleanId, allRelations);

    const scoredItems: RelatedConceptItem[] = [];

    for (const candidate of otherConcepts) {
      const candId = candidate.id.toLowerCase();
      const candEventIds = eventMap.get(candId) || [];

      // 1. Direct Relation Signal (0-100)
      const directRel = directRelationMap.get(candId);
      const directRelationWeight = directRel ? directRel.weight : 0.0;
      const relationScore = directRelationWeight * 100;

      // 2. Shared Events Signal (Jaccard similarity, 0-100)
      let sharedEventCount = 0;
      for (const eid of candEventIds) {
        if (sourceEventIds.has(eid)) sharedEventCount++;
      }
      const unionCount = new Set([...Array.from(sourceEventIds), ...candEventIds]).size;
      const sharedEventScore = unionCount > 0 ? (sharedEventCount / unionCount) * 100 : 0;

      // 3. Category Similarity (0-100)
      const sameCategory =
        sourceConcept.category &&
        candidate.category &&
        sourceConcept.category.toLowerCase() === candidate.category.toLowerCase();
      const categoryScore = sameCategory ? 100 : 25;

      // 4. Graph Distance Signal (0-100)
      const dist = graphDistances.get(candId) ?? 99;
      let graphDistanceScore = 0;
      if (dist === 1) graphDistanceScore = 100;
      else if (dist === 2) graphDistanceScore = 70;
      else if (dist === 3) graphDistanceScore = 40;
      else if (dist <= 5) graphDistanceScore = 20;

      // Composite Deterministic Formula
      const rawScore =
        0.35 * relationScore +
        0.30 * sharedEventScore +
        0.20 * categoryScore +
        0.15 * graphDistanceScore;

      const score = Math.min(100, Math.max(0, Math.round(rawScore)));

      // Reason explanation
      let reason = `Related concept in ${candidate.category || 'this domain'}.`;
      if (directRel) {
        reason = `Directly connected via ${directRel.type.toLowerCase().replace('_', ' ')} relationship.`;
      } else if (sharedEventCount > 0) {
        reason = `Appears together across ${sharedEventCount} real-world intelligence events.`;
      } else if (sameCategory) {
        reason = `Belongs to shared domain: ${candidate.category}.`;
      }

      scoredItems.push({
        concept: candidate,
        score,
        relationType: directRel?.type,
        sharedEventCount,
        directRelationWeight,
        graphDistance: dist,
        reason,
      });
    }

    // Stable deterministic sort
    scoredItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.directRelationWeight !== a.directRelationWeight) {
        return b.directRelationWeight - a.directRelationWeight;
      }
      return a.concept.title.localeCompare(b.concept.title);
    });

    return scoredItems.slice(0, limit);
  }

  // ============================================================================
  // 4. DETERMINISTIC RELATED EVENTS ENGINE
  // ============================================================================

  /**
   * Deterministically scores and ranks related events using:
   * 0.40 * SharedConcepts + 0.20 * RelatedConcepts + 0.15 * Category + 0.10 * Region + 0.10 * Temporal + 0.05 * GlobalRank
   */
  public async getRelatedEvents(eventId: string, limit = 5): Promise<RelatedEventItem[]> {
    const targetEvent = await EventRepository.findById(eventId);
    if (!targetEvent) {
      throw new Error(`Canonical event '${eventId}' not found.`);
    }

    // Fetch candidate events from repository
    const candidatesResult = await EventRepository.findAll({ limit: 40, page: 1 });
    const candidates = candidatesResult.events.filter((e) => e.id !== eventId);

    if (candidates.length === 0) return [];

    // Fetch concepts for target event
    const targetConcepts = await this.getConceptsForEvent(targetEvent);
    const targetConceptIds = new Set(targetConcepts.map((c) => c.id.toLowerCase()));

    // Get 1-hop related concepts for target concepts
    const relatedConceptIdSet = new Set<string>();
    for (const cid of targetConceptIds) {
      const rels = await knowledgeGraphRepository.getRelationsForConcept(cid);
      for (const r of rels) {
        if (r.sourceConceptId.toLowerCase() === cid) relatedConceptIdSet.add(r.targetConceptId.toLowerCase());
        else relatedConceptIdSet.add(r.sourceConceptId.toLowerCase());
      }
    }

    const now = new Date();
    const targetPublished = new Date(targetEvent.firstPublishedAt || targetEvent.createdAt || now).getTime();
    const scoredList: RelatedEventItem[] = [];

    for (const candidate of candidates) {
      const candConcepts = await this.getConceptsForEvent(candidate);
      const candConceptIds = candConcepts.map((c) => c.id.toLowerCase());

      // 1. Shared Concept Score (0-100)
      const shared: string[] = [];
      for (const cid of candConceptIds) {
        if (targetConceptIds.has(cid)) shared.push(cid);
      }
      const unionSize = new Set([...Array.from(targetConceptIds), ...candConceptIds]).size;
      const sharedConceptScore = unionSize > 0 ? (shared.length / unionSize) * 100 : 0;

      // 2. Related Concept Score (0-100)
      const relatedMatches: string[] = [];
      for (const cid of candConceptIds) {
        if (relatedConceptIdSet.has(cid) && !targetConceptIds.has(cid)) {
          relatedMatches.push(cid);
        }
      }
      const relatedConceptScore = Math.min(100, relatedMatches.length * 40);

      // 3. Category Similarity (0-100)
      const targetCat = (targetEvent.category || targetEvent.categoryId || '').toLowerCase();
      const candCat = (candidate.category || candidate.categoryId || '').toLowerCase();
      const categorySimilarity = targetCat === candCat && targetCat !== '' ? 100 : 20;

      // 4. Region Similarity (0-100)
      const targetReg = (targetEvent.region || targetEvent.regionId || '').toLowerCase();
      const candReg = (candidate.region || candidate.regionId || '').toLowerCase();
      const regionSimilarity = targetReg === candReg && targetReg !== '' ? 100 : (targetReg === 'world' || candReg === 'world' ? 50 : 0);

      // 5. Temporal Relevance (Exponential decay, 0-100)
      const candPublished = new Date(candidate.firstPublishedAt || candidate.createdAt || now).getTime();
      const diffHours = Math.abs(targetPublished - candPublished) / (1000 * 3600);
      const temporalRelevance = Math.max(10, Math.round(100 * Math.exp(-0.02 * diffHours)));

      // 6. Global Rank Score (0-100)
      const globalImportance = candidate.finalRankScore || candidate.importanceScore || 50;

      // Composite Weighted Score
      const rawScore =
        0.40 * sharedConceptScore +
        0.20 * relatedConceptScore +
        0.15 * categorySimilarity +
        0.10 * regionSimilarity +
        0.10 * temporalRelevance +
        0.05 * globalImportance;

      const score = Math.min(100, Math.max(0, Math.round(rawScore)));

      // Explainable reason
      let reason = `Corroborated news in ${candidate.category || 'this domain'}.`;
      if (shared.length > 0) {
        reason = `Shares ${shared.length} core knowledge concept${shared.length > 1 ? 's' : ''} (${shared.slice(0, 2).join(', ')}).`;
      } else if (relatedMatches.length > 0) {
        reason = `Connected via related concepts in ${candidate.category || 'domain'}.`;
      } else if (categorySimilarity === 100) {
        reason = `Parallel developments in ${candidate.category}.`;
      }

      scoredList.push({
        event: candidate,
        score,
        sharedConceptIds: shared,
        relatedConceptIds: relatedMatches,
        scoreBreakdown: {
          sharedConceptScore: Math.round(sharedConceptScore),
          relatedConceptScore: Math.round(relatedConceptScore),
          categorySimilarity,
          regionSimilarity,
          temporalRelevance,
          globalImportance,
        },
        reason,
      });
    }

    // Deterministic sorting
    scoredList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.event.finalRankScore !== a.event.finalRankScore) {
        return b.event.finalRankScore - a.event.finalRankScore;
      }
      return a.event.id.localeCompare(b.event.id);
    });

    return scoredList.slice(0, limit);
  }

  // ============================================================================
  // 5. TOPOLOGICAL RECOMMENDED LEARNING PATH GENERATOR
  // ============================================================================

  /**
   * Generates a step-by-step learning path tailored to user mastery:
   * Prioritizes missing foundational prerequisites -> developing concepts -> target concept.
   */
  public async getLearningPath(targetConceptId: string, userId?: string): Promise<ConceptLearningPath> {
    const cleanId = targetConceptId.trim().toLowerCase();
    const targetConcept = await knowledgeGraphRepository.getConceptById(cleanId);
    if (!targetConcept) {
      throw new Error(`Target concept '${cleanId}' not found.`);
    }

    // Get prerequisite DAG
    const tree = await this.getPrerequisiteTree(cleanId, userId, this.MAX_TRAVERSAL_DEPTH);
    const prerequisiteNodes = tree.nodes.filter((n) => !n.isTarget);

    // Group prerequisites by mastery status
    const missingPrereqs: ConceptGraphNode[] = [];
    const developingPrereqs: ConceptGraphNode[] = [];
    const strongPrereqs: ConceptGraphNode[] = [];

    // Sort prerequisite nodes by depth DESC (deepest/most foundational first)
    prerequisiteNodes.sort((a, b) => (b.depth || 0) - (a.depth || 0));

    for (const node of prerequisiteNodes) {
      if (node.masteryStatus === 'STRONG') {
        strongPrereqs.push(node);
      } else if (node.masteryStatus === 'DEVELOPING') {
        developingPrereqs.push(node);
      } else {
        missingPrereqs.push(node);
      }
    }

    const steps: ConceptLearningPathStep[] = [];
    let stepNumber = 1;

    // Step 1: Missing Foundational Prerequisites (Knowledge Gaps)
    for (const p of missingPrereqs) {
      steps.push({
        stepNumber: stepNumber++,
        conceptId: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        shortDefinition: p.shortDefinition,
        masteryStatus: p.masteryStatus,
        masteryScore: p.masteryScore,
        reason: `Foundational prerequisite required before mastering ${targetConcept.title}.`,
        isPrerequisite: true,
        isTarget: false,
        actionType: 'LEARN',
      });
    }

    // Step 2: Developing Prerequisites (Reinforce active recall)
    for (const p of developingPrereqs) {
      steps.push({
        stepNumber: stepNumber++,
        conceptId: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        shortDefinition: p.shortDefinition,
        masteryStatus: p.masteryStatus,
        masteryScore: p.masteryScore,
        reason: `Developing prerequisite (${p.masteryScore}% mastery). Strengthen with a brief review.`,
        isPrerequisite: true,
        isTarget: false,
        actionType: 'REVIEW',
      });
    }

    // Target Concept node
    const targetNode = tree.nodes.find((n) => n.isTarget) || {
      id: targetConcept.id,
      title: targetConcept.title,
      slug: targetConcept.slug || targetConcept.id,
      category: targetConcept.category || 'General',
      shortDefinition: targetConcept.shortDefinition,
      masteryStatus: 'UNKNOWN' as UserMasteryClassification,
      masteryScore: 0,
    };

    steps.push({
      stepNumber: stepNumber++,
      conceptId: targetNode.id,
      title: targetNode.title,
      slug: targetNode.slug,
      category: targetNode.category,
      shortDefinition: targetNode.shortDefinition,
      masteryStatus: targetNode.masteryStatus,
      masteryScore: targetNode.masteryScore,
      reason: `Target objective: Achieve full mastery of ${targetConcept.title}.`,
      isPrerequisite: false,
      isTarget: true,
      actionType: targetNode.masteryStatus === 'STRONG' ? 'PASS' : 'LEARN',
    });

    const totalConceptsEvaluated = tree.nodes.length;
    const strongCount = strongPrereqs.length + (targetNode.masteryStatus === 'STRONG' ? 1 : 0);
    const userOverallReadiness =
      totalConceptsEvaluated > 0 ? Math.round((strongCount / totalConceptsEvaluated) * 100) : 100;

    return {
      targetConcept,
      totalSteps: steps.length,
      estimatedMinutes: steps.length * 3,
      steps,
      userOverallReadiness,
      hasMissingPrerequisites: missingPrereqs.length > 0,
    };
  }

  // ============================================================================
  // 6. EVENT KNOWLEDGE MAP BUILDER
  // ============================================================================

  /**
   * Generates a complete Knowledge Map for an event:
   * Key Concepts -> Prerequisite Tree -> User Readiness -> Knowledge Gaps -> Related Events
   */
  public async getEventKnowledgeMap(eventId: string, userId?: string): Promise<EventKnowledgeMap> {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw new Error(`Canonical event '${eventId}' not found.`);
    }

    const keyConceptsRaw = await this.getConceptsForEvent(event);

    // Fetch user mastery records if authenticated
    const masteryMap = new Map<string, { score: number; status: UserMasteryClassification }>();
    if (userId) {
      const userProgress = await learningRepository.getAllProgressForUser(userId);
      for (const p of userProgress) {
        if (p.conceptId) {
          masteryMap.set(p.conceptId.toLowerCase(), {
            score: p.masteryScore,
            status: p.masteryStatus as UserMasteryClassification,
          });
        }
      }
    }

    const keyConcepts = keyConceptsRaw.map((c) => {
      const m = masteryMap.get(c.id.toLowerCase()) || { score: 0, status: 'UNKNOWN' };
      return {
        ...c,
        masteryStatus: m.status,
        masteryScore: m.score,
      };
    });

    // Build union prerequisite tree across all event concepts
    const combinedNodesMap = new Map<string, ConceptGraphNode>();
    const edges: ConceptGraphEdge[] = [];

    for (const kc of keyConceptsRaw) {
      const tree = await this.getPrerequisiteTree(kc.id, userId, 3);
      for (const node of tree.nodes) {
        if (!combinedNodesMap.has(node.id)) {
          combinedNodesMap.set(node.id, node);
        }
      }
      for (const edge of tree.edges) {
        const edgeKey = `${edge.source}->${edge.target}`;
        if (!edges.some((e) => `${e.source}->${e.target}` === edgeKey)) {
          edges.push(edge);
        }
      }
    }

    const prerequisiteTree = Array.from(combinedNodesMap.values());

    // Identify knowledge gaps
    const knowledgeGaps: (ExtractedConcept & { masteryStatus: UserMasteryClassification; masteryScore: number })[] = [];
    const learnTheseFirst: (ExtractedConcept & {
      masteryStatus: UserMasteryClassification;
      masteryScore: number;
      reason: string;
    })[] = [];

    for (const node of prerequisiteTree) {
      if (node.isPrerequisite && (node.masteryStatus === 'NEEDS_LEARNING' || node.masteryStatus === 'UNKNOWN')) {
        const conceptObj: ExtractedConcept = {
          id: node.id,
          title: node.title,
          slug: node.slug,
          category: node.category,
          shortDefinition: node.shortDefinition,
        };
        knowledgeGaps.push({
          ...conceptObj,
          masteryStatus: node.masteryStatus,
          masteryScore: node.masteryScore,
        });

        learnTheseFirst.push({
          ...conceptObj,
          masteryStatus: node.masteryStatus,
          masteryScore: node.masteryScore,
          reason: `Foundational knowledge gap required to understand this event.`,
        });
      }
    }

    // Readiness percentage
    let totalItems = prerequisiteTree.length;
    let strongItems = prerequisiteTree.filter((n) => n.masteryStatus === 'STRONG').length;
    const userReadinessPercentage = totalItems > 0 ? Math.round((strongItems / totalItems) * 100) : 100;

    // Fetch related concepts & related events
    const primaryConceptId = keyConceptsRaw[0]?.id || 'computer-security';
    const [relatedConcepts, relatedEvents] = await Promise.all([
      this.getRelatedConcepts(primaryConceptId, 4),
      this.getRelatedEvents(eventId, 3),
    ]);

    return {
      eventId: event.id,
      eventTitle: event.title,
      keyConcepts,
      prerequisiteTree,
      edges,
      userReadinessPercentage,
      knowledgeGaps,
      learnTheseFirst,
      relatedConcepts,
      relatedEvents,
    };
  }

  // ============================================================================
  // 7. USER-SPECIFIC KNOWLEDGE STATUS API
  // ============================================================================

  public async getConceptKnowledgeStatus(conceptId: string, userId: string): Promise<ConceptKnowledgeStatus> {
    const cleanId = conceptId.trim().toLowerCase();
    const concept = await knowledgeGraphRepository.getConceptById(cleanId);
    if (!concept) {
      throw new Error(`Concept '${cleanId}' not found.`);
    }

    const [userProgress, tree] = await Promise.all([
      learningRepository.getProgress(userId, undefined, cleanId),
      this.getPrerequisiteTree(cleanId, userId, 4),
    ]);

    const masteryScore = userProgress ? userProgress.masteryScore : 0;
    const masteryStatus = (userProgress ? userProgress.masteryStatus : 'UNKNOWN') as UserMasteryClassification;
    const attemptCount = userProgress ? userProgress.attemptCount : 0;
    const correctCount = userProgress ? userProgress.correctCount : 0;
    const lastAttemptAt = userProgress?.lastAttemptAt;

    const prerequisites: (ExtractedConcept & { masteryStatus: UserMasteryClassification; masteryScore: number })[] = [];
    const knowledgeGaps: (ExtractedConcept & { masteryStatus: UserMasteryClassification; masteryScore: number })[] = [];

    for (const node of tree.nodes) {
      if (node.isPrerequisite) {
        const item = {
          id: node.id,
          title: node.title,
          slug: node.slug,
          category: node.category,
          shortDefinition: node.shortDefinition,
          masteryStatus: node.masteryStatus,
          masteryScore: node.masteryScore,
        };
        prerequisites.push(item);
        if (node.masteryStatus === 'NEEDS_LEARNING' || node.masteryStatus === 'UNKNOWN') {
          knowledgeGaps.push(item);
        }
      }
    }

    return {
      concept,
      masteryScore,
      masteryStatus,
      attemptCount,
      correctCount,
      lastAttemptAt,
      prerequisites,
      knowledgeGaps,
      isReadyForTarget: knowledgeGaps.length === 0,
    };
  }

  // ============================================================================
  // 8. HELPER METHODS
  // ============================================================================

  private async getConceptsForEvent(event: CanonicalEvent): Promise<ExtractedConcept[]> {
    if (event.concepts && event.concepts.length > 0) {
      return event.concepts;
    }
    const fromRepo = await aiUnderstandingRepository.getConceptsByEventId(event.id);
    if (fromRepo && fromRepo.length > 0) {
      return fromRepo;
    }

    // Default fallback concepts
    return [
      {
        id: 'policy-governance',
        title: 'Policy & Governance',
        slug: 'policy-governance',
        category: event.category || 'General',
        shortDefinition: 'Framework of regulations and governance oversight.',
        prerequisites: [],
      },
    ];
  }

  private computeShortestGraphDistances(
    rootId: string,
    relations: ConceptRelation[]
  ): Map<string, number> {
    const adj = new Map<string, string[]>();
    for (const r of relations) {
      const u = r.sourceConceptId.toLowerCase();
      const v = r.targetConceptId.toLowerCase();
      if (!adj.has(u)) adj.set(u, []);
      if (!adj.has(v)) adj.set(v, []);
      adj.get(u)!.push(v);
      adj.get(v)!.push(u); // Undirected for proximity distance
    }

    const distances = new Map<string, number>();
    distances.set(rootId, 0);
    const queue: string[] = [rootId];

    while (queue.length > 0) {
      const u = queue.shift()!;
      const d = distances.get(u)!;
      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        if (!distances.has(v)) {
          distances.set(v, d + 1);
          queue.push(v);
        }
      }
    }

    return distances;
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();
