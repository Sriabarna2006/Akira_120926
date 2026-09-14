import { CanonicalEvent } from '../../types/index.js';

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

export interface MatchCandidateResult {
  isMatch: boolean;
  matchedEvent: CanonicalEvent | null;
  confidenceScore: number;
}

/**
 * Deterministic Canonical Event Matcher
 * Compares an incoming article against candidate recent events.
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
  const articleSnippetTokens = tokenize(articleSnippet.slice(0, 300));
  const articleCombinedTokens = new Set([...articleTitleTokens, ...articleSnippetTokens]);
  const articleTime = new Date(articlePublishedAt).getTime();

  let bestMatch: CanonicalEvent | null = null;
  let highestScore = 0;

  for (const event of candidateEvents) {
    // 1. Regional Isolation (Never cross-merge across different regions)
    if (event.regionId && event.regionId !== regionId) {
      continue;
    }

    // 2. Temporal Window Check (36 hours maximum window between publication dates)
    const eventTime = new Date(event.firstPublishedAt || event.lastUpdatedAt).getTime();
    const timeDiffHours = Math.abs(articleTime - eventTime) / (3600 * 1000);
    if (timeDiffHours > 36) {
      continue;
    }

    // 3. Title-Weighted Token & Keyword Jaccard Similarity
    const eventTitleTokens = tokenize(event.title);
    const eventSnippetTokens = tokenize(event.summary.slice(0, 300));
    const eventCombinedTokens = new Set([...eventTitleTokens, ...eventSnippetTokens]);

    const titleSim = calculateJaccardSimilarity(articleTitleTokens, eventTitleTokens);
    const combinedSim = calculateJaccardSimilarity(articleCombinedTokens, eventCombinedTokens);

    // Weighted composite score (60% title similarity, 40% combined similarity)
    const similarity = 0.6 * titleSim + 0.4 * combinedSim;

    // 4. Category Alignment Bonus
    const isSameCategory = event.categoryId === categoryId;
    const effectiveThreshold = isSameCategory ? 0.28 : 0.42;

    if (similarity >= effectiveThreshold && similarity > highestScore) {
      highestScore = similarity;
      bestMatch = event;
    }
  }

  return {
    isMatch: bestMatch !== null,
    matchedEvent: bestMatch,
    confidenceScore: highestScore,
  };
}
