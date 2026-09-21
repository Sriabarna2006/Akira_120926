import {
  CanonicalEvent,
  StorylineAssociationScore,
  StorylineAssociationSignals,
  StorylineAssociationClassification,
} from '../../types/index.js';
import { STORYLINE_CONFIG } from '../../config/storylineConfig.js';
import { knowledgeGraphRepository } from '../../repositories/knowledgeGraph.repository.js';

export class StorylineAssociationService {
  /**
   * Deterministically calculates association score between an event and an existing storyline or baseline event.
   */
  public async calculateEventAssociationScore(
    eventA: CanonicalEvent,
    eventB: CanonicalEvent
  ): Promise<StorylineAssociationScore> {
    const weights = STORYLINE_CONFIG.WEIGHTS;

    // 1. Shared Concepts Signal (25%)
    const conceptsA = new Set(this.extractEventConceptIds(eventA));
    const conceptsB = new Set(this.extractEventConceptIds(eventB));
    const sharedConcepts = Array.from(conceptsA).filter((c) => conceptsB.has(c));

    let sharedConceptsScore = 0;
    if (sharedConcepts.length >= 4) {
      sharedConceptsScore = STORYLINE_CONFIG.CONCEPT_OVERLAP_SCALING.FOUR_OR_MORE;
    } else if (sharedConcepts.length === 3) {
      sharedConceptsScore = STORYLINE_CONFIG.CONCEPT_OVERLAP_SCALING.THREE;
    } else if (sharedConcepts.length === 2) {
      sharedConceptsScore = STORYLINE_CONFIG.CONCEPT_OVERLAP_SCALING.TWO;
    } else if (sharedConcepts.length === 1) {
      sharedConceptsScore = STORYLINE_CONFIG.CONCEPT_OVERLAP_SCALING.ONE;
    } else {
      sharedConceptsScore = 0;
    }

    // 2. Temporal Proximity Signal (20%)
    const timeA = new Date(eventA.firstPublishedAt || eventA.createdAt || Date.now()).getTime();
    const timeB = new Date(eventB.firstPublishedAt || eventB.createdAt || Date.now()).getTime();
    const timeGapMs = Math.abs(timeA - timeB);
    const timeGapHours = Math.round(timeGapMs / 3600000);
    const timeGapDays = timeGapHours / 24;

    let temporalProximityScore = 0;
    if (timeGapHours <= 24) {
      temporalProximityScore = STORYLINE_CONFIG.TEMPORAL_SCALING.WITHIN_24_HOURS;
    } else if (timeGapDays <= 3) {
      temporalProximityScore = STORYLINE_CONFIG.TEMPORAL_SCALING.WITHIN_3_DAYS;
    } else if (timeGapDays <= 7) {
      temporalProximityScore = STORYLINE_CONFIG.TEMPORAL_SCALING.WITHIN_7_DAYS;
    } else if (timeGapDays <= 14) {
      temporalProximityScore = STORYLINE_CONFIG.TEMPORAL_SCALING.WITHIN_14_DAYS;
    } else if (timeGapDays <= 30) {
      temporalProximityScore = STORYLINE_CONFIG.TEMPORAL_SCALING.WITHIN_30_DAYS;
    } else {
      temporalProximityScore = STORYLINE_CONFIG.TEMPORAL_SCALING.BEYOND_30_DAYS;
    }

    // 3. Regional Affinity Signal (15%)
    let regionalAffinityScore = 10;
    const regionA = (eventA.regionId || eventA.region || '').toLowerCase();
    const regionB = (eventB.regionId || eventB.region || '').toLowerCase();
    if (regionA && regionB && regionA === regionB) {
      regionalAffinityScore = 100;
    } else if (regionA === 'world' || regionB === 'world') {
      regionalAffinityScore = 60;
    } else if (regionA.includes('india') || regionB.includes('india')) {
      regionalAffinityScore = 40;
    }

    // 4. Category Match Signal (15%)
    let categoryMatchScore = 10;
    const catA = (eventA.categoryId || eventA.category || '').toLowerCase();
    const catB = (eventB.categoryId || eventB.category || '').toLowerCase();
    if (catA && catB && catA === catB) {
      categoryMatchScore = 100;
    } else if (
      (catA === 'infrastructure' && catB === 'economy') ||
      (catA === 'economy' && catB === 'infrastructure') ||
      (catA === 'technology' && catB === 'cybersecurity') ||
      (catA === 'cybersecurity' && catB === 'technology')
    ) {
      categoryMatchScore = 60;
    }

    // 5. Semantic / Title Token Similarity (10%)
    const tokensA = this.tokenizeText(`${eventA.title} ${eventA.summary}`);
    const tokensB = this.tokenizeText(`${eventB.title} ${eventB.summary}`);
    const sharedTokens = Array.from(tokensA).filter((t) => tokensB.has(t));
    const tokenUnion = new Set([...tokensA, ...tokensB]);
    const jaccard = tokenUnion.size > 0 ? sharedTokens.length / tokenUnion.size : 0;
    const semanticSimilarityScore = Math.min(100, Math.round(jaccard * 250));

    // 6. Knowledge Graph Relationship Signal (10%)
    let knowledgeGraphScore = 0;
    if (sharedConcepts.length > 0) {
      knowledgeGraphScore = Math.min(100, sharedConcepts.length * 35);
    } else {
      // Check if concepts have direct prerequisite or related edge
      let hasGraphConnection = false;
      for (const ca of conceptsA) {
        for (const cb of conceptsB) {
          const relations = await knowledgeGraphRepository.getRelationsForConcept(ca);
          if (relations.some((r) => r.sourceConceptId === cb || r.targetConceptId === cb)) {
            hasGraphConnection = true;
            break;
          }
        }
        if (hasGraphConnection) break;
      }
      knowledgeGraphScore = hasGraphConnection ? 70 : 15;
    }

    // 7. Source Overlap Signal (5%)
    const sourcesA = new Set((eventA.sources || []).map((s) => s.sourceId || s.sourceName.toLowerCase()));
    const sourcesB = new Set((eventB.sources || []).map((s) => s.sourceId || s.sourceName.toLowerCase()));
    const sharedSources = Array.from(sourcesA).filter((s) => s && sourcesB.has(s));
    const sourceOverlapScore = sharedSources.length >= 2 ? 100 : sharedSources.length === 1 ? 60 : 20;

    // Combined Weighted Score Calculation
    const weightedSum =
      sharedConceptsScore * weights.SHARED_CONCEPTS +
      temporalProximityScore * weights.TEMPORAL_PROXIMITY +
      regionalAffinityScore * weights.REGIONAL_AFFINITY +
      categoryMatchScore * weights.CATEGORY_MATCH +
      semanticSimilarityScore * weights.SEMANTIC_SIMILARITY +
      knowledgeGraphScore * weights.KNOWLEDGE_GRAPH +
      sourceOverlapScore * weights.SOURCE_OVERLAP;

    const finalScore = Math.min(100, Math.max(0, Math.round(weightedSum)));

    let classification: StorylineAssociationClassification = 'UNRELATED';
    if (finalScore >= STORYLINE_CONFIG.THRESHOLDS.AUTO_ASSOCIATE_MIN_SCORE) {
      classification = 'ASSOCIATED';
    } else if (finalScore >= STORYLINE_CONFIG.THRESHOLDS.POSSIBLE_ASSOCIATE_MIN_SCORE) {
      classification = 'POSSIBLE_ASSOCIATION';
    } else {
      classification = 'UNRELATED';
    }

    const signals: StorylineAssociationSignals = {
      sharedConceptsScore,
      temporalProximityScore,
      regionalAffinityScore,
      categoryMatchScore,
      semanticSimilarityScore,
      knowledgeGraphScore,
      sourceOverlapScore,
    };

    // Explainable Deterministic Reason
    let explanation = '';
    if (classification === 'ASSOCIATED') {
      explanation = `Associated with score ${finalScore}/100 because the events share ${
        sharedConcepts.length > 0 ? `${sharedConcepts.length} concepts` : 'key domain themes'
      }, occur within ${timeGapDays <= 1 ? `${timeGapHours}h` : `${Math.round(timeGapDays)} days`}, and belong to ${
        regionalAffinityScore >= 80 ? 'the same region' : 'compatible regions'
      } and ${categoryMatchScore >= 80 ? 'the same category' : 'related categories'}.`;
    } else if (classification === 'POSSIBLE_ASSOCIATION') {
      explanation = `Possible association with score ${finalScore}/100: events share partial topical or regional overlap (${Math.round(timeGapDays)} days apart), but do not meet the deterministic threshold (>=${STORYLINE_CONFIG.THRESHOLDS.AUTO_ASSOCIATE_MIN_SCORE}) for auto-clustering.`;
    } else {
      explanation = `Unrelated with score ${finalScore}/100: events have distinct concepts, categories, or distant temporal occurrence (${Math.round(timeGapDays)} days apart).`;
    }

    return {
      score: finalScore,
      classification,
      signals,
      sharedConcepts,
      timeGapHours,
      explanation,
    };
  }

  private extractEventConceptIds(event: CanonicalEvent): string[] {
    const list: string[] = [];
    if (event.relatedConcepts && Array.isArray(event.relatedConcepts)) {
      list.push(...event.relatedConcepts);
    }
    if (event.concepts && Array.isArray(event.concepts)) {
      list.push(...event.concepts.map((c) => c.id || c.slug));
    }
    if (event.metadata && typeof event.metadata === 'object' && Array.isArray((event.metadata as any).concept_ids)) {
      list.push(...(event.metadata as any).concept_ids);
    }

    // Fallback extraction from title & category
    if (list.length === 0) {
      const text = `${event.title} ${event.category || ''}`.toLowerCase();
      if (text.includes('mobility') || text.includes('ev') || text.includes('battery')) list.push('electric-mobility');
      if (text.includes('corridor') || text.includes('transit') || text.includes('metro')) list.push('regional-transit');
      if (text.includes('rate') || text.includes('monetary') || text.includes('inflation')) list.push('monetary-policy');
      if (text.includes('semiconductor') || text.includes('chip') || text.includes('hardware')) list.push('semiconductor-architecture');
    }

    return Array.from(new Set(list));
  }

  private tokenizeText(text: string): Set<string> {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about',
      'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'from', 'up', 'down', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall', 'should', 'can',
      'could', 'may', 'might', 'must', 'ought', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'this', 'that', 'these', 'those', 'state', 'government', 'new', 'policy'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    return new Set(words);
  }
}

export const storylineAssociationService = new StorylineAssociationService();
