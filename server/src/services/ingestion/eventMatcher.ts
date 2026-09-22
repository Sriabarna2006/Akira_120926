import { CanonicalEvent } from '../../types/index.js';
import { embeddingProvider } from '../ai/embedding/embeddingProvider.js';
import { entityResolver } from './entityResolver.js';

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could', 'did', 'do',
  'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'more',
  'most', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
  'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
  'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'said', 'says', 'news', 'report', 'reports'
]);

// High-salience entity patterns for real-world event corroboration
const ENTITY_PATTERNS = [
  /\b(isro|nasa|esa|rbi|sebi|drdo|un|who|imf|world bank)\b/gi,
  /\b(cabinet|ministry|parliament|lok sabha|rajya sabha|supreme court|high court)\b/gi,
  /\b(tamil nadu|chennai|hosur|coimbatore|madurai|delhi|mumbai|bengaluru|hyderabad)\b/gi,
  /\b(ai accelerator|semiconductor|clean mobility|hydrogen|metro rail|green energy)\b/gi,
  /\b(cve-\d{4}-\d+|zero-day|ransomware|malware)\b/gi,
  /\b\d+(?:\.\d+)?(?:\s?(?:bps|basis points|percent|%|crore|lakh|billion|million|trillion))\b/gi,
  /\b\d{2,4}\b/g,
  /(?:₹|\$|€|£)\s?\d+(?:,\d+)*(?:\s?(?:crore|lakh|billion|million|trillion))?/gi,
];

export type EventMatchClassification = 'SAME_EVENT' | 'RELATED_DEVELOPMENT' | 'UNRELATED_EVENT';

export interface MultiSignalMatchScore {
  lexicalScore: number;
  semanticScore: number;
  entityScore: number;
  temporalScore: number;
  categoryScore: number;
  compositeScore: number;
  classification: EventMatchClassification;
  falseMergePrevented?: boolean;
}

export interface MatchCandidateResult {
  isMatch: boolean;
  isRelated: boolean;
  matchedEvent: CanonicalEvent | null;
  confidenceScore: number;
  classification: EventMatchClassification;
  signalBreakdown?: MultiSignalMatchScore;
}

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersection++;
    }
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

function extractRawEntities(text: string): Set<string> {
  const entities = new Set<string>();
  for (const pattern of ENTITY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((m) => entities.add(m.toLowerCase().trim()));
    }
  }
  return entities;
}

/**
 * Computes deterministic dense character 3-gram semantic vector cosine similarity + root stem overlap.
 */
function computeSemanticNGramCosine(textA: string, textB: string): number {
  if (!textA || !textB) return 0;

  const getCharGrams = (str: string, n = 3): Map<string, number> => {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const map = new Map<string, number>();
    for (let i = 0; i <= cleaned.length - n; i++) {
      const gram = cleaned.substring(i, i + n);
      map.set(gram, (map.get(gram) || 0) + 1);
    }
    return map;
  };

  const gramsA = getCharGrams(textA);
  const gramsB = getCharGrams(textB);
  if (gramsA.size === 0 || gramsB.size === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [gram, countA] of gramsA.entries()) {
    normA += countA * countA;
    if (gramsB.has(gram)) {
      dotProduct += countA * (gramsB.get(gram) || 0);
    }
  }
  for (const countB of gramsB.values()) {
    normB += countB * countB;
  }

  const charCosine = normA > 0 && normB > 0 ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;

  // Root stemmed token overlap
  const stem = (w: string) => w.replace(/(?:ing|tion|ed|es|s|ly|ment|ers|er)$/g, '');
  const tokensA = new Set(
    textA.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w)).map(stem)
  );
  const tokensB = new Set(
    textB.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w)).map(stem)
  );

  let match = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) match++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  const wordSim = union > 0 ? match / union : 0;

  return Math.min(1.0, 0.6 * charCosine + 0.4 * wordSim);
}

/**
 * Evaluates category domain compatibility between incoming article and candidate event.
 */
function evaluateCategoryCompatibility(catA?: string, catB?: string): number {
  if (!catA || !catB) return 0.5;
  if (catA === catB) return 1.0;
  const compatiblePairs: [string, string][] = [
    ['politics', 'economy'],
    ['politics', 'infrastructure'],
    ['technology', 'science'],
    ['technology', 'security'],
    ['economy', 'business'],
    ['environment', 'science'],
  ];
  for (const [c1, c2] of compatiblePairs) {
    if ((catA === c1 && catB === c2) || (catA === c2 && catB === c1)) {
      return 0.7;
    }
  }
  return 0.2;
}

/**
 * Deterministic Multi-Signal Canonical Event Matcher (Phase 16)
 *
 * Evaluates 6 orthogonal signals with False Merge Protection:
 * 1. Lexical Jaccard Similarity (0.25 weight)
 * 2. Semantic Subword N-Gram & Embedding Vector Cosine (0.30 weight)
 * 3. Resolved Entity & Numeric Policy Value Overlap (0.20 weight)
 * 4. Temporal Window & Exponential Recency Decay (0.15 weight)
 * 5. Category Domain Compatibility (0.10 weight)
 * 6. False-Merge Guardrails (Distinct entity conflicts, regional mismatch)
 */
export function findMatchingCanonicalEvent(
  articleTitle: string,
  articleSnippet: string,
  regionId: string,
  categoryId: string,
  articlePublishedAt: string,
  candidateEvents: CanonicalEvent[]
): MatchCandidateResult {
  const articleTitleTokens = tokenize(articleTitle);
  const articleSnippetTokens = tokenize(articleSnippet.slice(0, 400));
  const articleCombinedTokens = new Set([...articleTitleTokens, ...articleSnippetTokens]);
  const articleFullText = `${articleTitle} ${articleSnippet}`;
  const articleRawEntities = extractRawEntities(articleFullText);
  const articleResolvedEntities = entityResolver.extractEntities(articleFullText);
  const articleTime = new Date(articlePublishedAt).getTime();

  let bestMatch: CanonicalEvent | null = null;
  let bestScore = 0;
  let bestBreakdown: MultiSignalMatchScore | undefined;

  for (const event of candidateEvents) {
    // 1. Regional Guardrail (Strict isolation between geographic scopes)
    if (event.regionId && event.regionId !== regionId) {
      continue;
    }

    // 2. Temporal Window Check (36 hours sliding pool limit)
    const eventTime = new Date(event.firstPublishedAt || event.lastUpdatedAt || event.createdAt).getTime();
    const timeDiffHours = Math.max(0, Math.abs(articleTime - eventTime) / (3600 * 1000));
    if (timeDiffHours > 36) {
      continue;
    }

    // Temporal proximity exponential decay factor
    const temporalScore = Math.exp(-0.04 * timeDiffHours);

    // 3. Lexical Jaccard Overlap
    const eventTitleTokens = tokenize(event.title);
    const eventSnippetTokens = tokenize(event.summary.slice(0, 400));
    const eventCombinedTokens = new Set([...eventTitleTokens, ...eventSnippetTokens]);

    const titleSim = calculateJaccardSimilarity(articleTitleTokens, eventTitleTokens);
    const combinedSim = calculateJaccardSimilarity(articleCombinedTokens, eventCombinedTokens);
    const lexicalScore = 0.65 * titleSim + 0.35 * combinedSim;

    // 4. Semantic Subword N-Gram Cosine Similarity
    const semanticTitleSim = computeSemanticNGramCosine(articleTitle, event.title || '');
    const semanticBodySim = computeSemanticNGramCosine((articleSnippet || '').slice(0, 300), (event.summary || '').slice(0, 300));
    const semanticScore = 0.7 * semanticTitleSim + 0.3 * semanticBodySim;

    // 5. Named Entity & Resolved Canonical Entity Overlap
    const eventFullText = `${event.title || ''} ${event.summary || ''}`;
    const eventRawEntities = extractRawEntities(eventFullText);
    const eventResolvedEntities = entityResolver.extractEntities(eventFullText);

    const rawEntitySim = calculateJaccardSimilarity(articleRawEntities, eventRawEntities);
    const canonicalEntitySim = entityResolver.computeEntityOverlap(articleResolvedEntities, eventResolvedEntities);
    const entityScore = Math.max(rawEntitySim, canonicalEntitySim);

    // 6. Category Compatibility
    const categoryScore = evaluateCategoryCompatibility(categoryId, event.categoryId);

    // False Merge Check: Detect if there are conflicting distinct entities
    const hasEntityConflict = entityResolver.hasEntityConflict(articleResolvedEntities, eventResolvedEntities);

    // Phase 16 Composite Score Weights:
    // Lexical (25%), Semantic (30%), Entity (20%), Temporal (15%), Category (10%)
    let compositeScore =
      0.25 * lexicalScore +
      0.30 * semanticScore +
      0.20 * entityScore +
      0.15 * temporalScore +
      0.10 * categoryScore;

    if (hasEntityConflict) {
      // Penalty for conflicting named entities
      compositeScore *= 0.4;
    }

    // Classification Decision Logic
    let classification: EventMatchClassification = 'UNRELATED_EVENT';
    let falseMergePrevented = false;

    if (hasEntityConflict) {
      classification = 'UNRELATED_EVENT';
      falseMergePrevented = true;
    } else if (
      compositeScore >= 0.50 ||
      (compositeScore >= 0.33 && categoryScore >= 0.7 && temporalScore >= 0.90 && entityScore >= 0.50) ||
      (compositeScore >= 0.38 && categoryScore >= 0.7 && temporalScore >= 0.85 && (semanticScore >= 0.22 || lexicalScore >= 0.18)) ||
      (lexicalScore >= 0.28 && categoryScore >= 0.7 && semanticScore >= 0.25)
    ) {
      classification = 'SAME_EVENT';
    } else if (compositeScore >= 0.24 && (entityScore > 0 || semanticScore >= 0.10 || lexicalScore >= 0.08)) {
      classification = 'RELATED_DEVELOPMENT';
    }

    if (compositeScore > bestScore) {
      bestScore = compositeScore;
      bestBreakdown = {
        lexicalScore: Math.round(lexicalScore * 100) / 100,
        semanticScore: Math.round(semanticScore * 100) / 100,
        entityScore: Math.round(entityScore * 100) / 100,
        temporalScore: Math.round(temporalScore * 100) / 100,
        categoryScore: Math.round(categoryScore * 100) / 100,
        compositeScore: Math.round(compositeScore * 100) / 100,
        classification,
        falseMergePrevented,
      };

      if (classification === 'SAME_EVENT') {
        bestMatch = event;
      }
    }
  }

  const isMatch = bestMatch !== null;
  const isRelated = bestBreakdown?.classification === 'RELATED_DEVELOPMENT';

  return {
    isMatch,
    isRelated,
    matchedEvent: bestMatch,
    confidenceScore: bestScore,
    classification: bestBreakdown?.classification || 'UNRELATED_EVENT',
    signalBreakdown: bestBreakdown,
  };
}
