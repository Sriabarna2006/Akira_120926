import { RANKING_CONFIG } from './rankingConfig.js';
import { CanonicalEvent, EventSource, ImportanceStatus } from '../../types/index.js';

export interface ImportanceCalculationResult {
  importanceScore: number;
  importanceStatus: ImportanceStatus;
  matchedKeywords: string[];
  categoryBaseline: number;
  regionalRelevanceScore: number;
}

export class ImportanceCalculator {
  /**
   * Deterministic Importance Evaluation:
   * Assesses real-world significance without AI hallucinations based on:
   * 1. Knowledge domain / category baseline impact
   * 2. High-stakes keyword dictionary patterns
   * 3. Publisher tier credibility
   * 4. Regional public relevance
   */
  public static calculateImportance(
    event: CanonicalEvent,
    sources: EventSource[] = []
  ): ImportanceCalculationResult {
    const categoryKey = (event.categoryId || event.category || 'other').toLowerCase();
    const categoryBaseline = RANKING_CONFIG.CATEGORY_IMPORTANCE_BASELINES[categoryKey] || 50;

    let score = categoryBaseline;
    const matchedKeywords: string[] = [];

    const textToAnalyze = `${event.title} ${event.summary} ${event.whyItMatters || ''}`.toLowerCase();

    // 1. Critical Emergency & Disaster Signals
    for (const kw of RANKING_CONFIG.HIGH_IMPACT_KEYWORDS.criticalEmergency) {
      if (textToAnalyze.includes(kw)) {
        score += 15;
        matchedKeywords.push(kw);
        break;
      }
    }

    // 2. High-Level Governance, Policy & Judiciary
    for (const kw of RANKING_CONFIG.HIGH_IMPACT_KEYWORDS.governanceAndPolicy) {
      if (textToAnalyze.includes(kw)) {
        score += 10;
        matchedKeywords.push(kw);
        break;
      }
    }

    // 3. Macroeconomic & Central Bank Decisions
    for (const kw of RANKING_CONFIG.HIGH_IMPACT_KEYWORDS.economicAndFinancial) {
      if (textToAnalyze.includes(kw)) {
        score += 8;
        matchedKeywords.push(kw);
        break;
      }
    }

    // 4. Critical Infrastructure, Transit & Mobility
    for (const kw of RANKING_CONFIG.HIGH_IMPACT_KEYWORDS.infrastructureAndTransit) {
      if (textToAnalyze.includes(kw)) {
        score += 8;
        matchedKeywords.push(kw);
        break;
      }
    }

    // 5. Scientific & Deep-Tech Breakthroughs
    for (const kw of RANKING_CONFIG.HIGH_IMPACT_KEYWORDS.scienceAndBreakthroughs) {
      if (textToAnalyze.includes(kw)) {
        score += 8;
        matchedKeywords.push(kw);
        break;
      }
    }

    // 6. Source Authority Boost (Tier 1 confirmation)
    const hasTier1 = sources.some((s) => s.tier === 1);
    if (hasTier1) {
      score += 5;
    }

    // 7. Conservative fallback for minimal evidence
    if (textToAnalyze.trim().length < 30 && matchedKeywords.length === 0) {
      score = Math.min(score, 55);
    }

    const importanceScore = Math.min(100, Math.max(0, Math.round(score)));

    // Assign Importance Status
    let importanceStatus: ImportanceStatus = 'LOW';
    if (importanceScore >= 85) {
      importanceStatus = 'CRITICAL';
    } else if (importanceScore >= RANKING_CONFIG.THRESHOLDS.IMPORTANT_MIN) {
      importanceStatus = 'IMPORTANT';
    } else if (importanceScore >= 60) {
      importanceStatus = 'MODERATE';
    }

    // Compute Regional Relevance Score for the event's designated region
    const regionKey = (event.regionId || event.region || 'world').toLowerCase();
    const regionalRelevanceScore = RANKING_CONFIG.REGIONAL_BASELINES[regionKey] || 75;

    return {
      importanceScore,
      importanceStatus,
      matchedKeywords,
      categoryBaseline,
      regionalRelevanceScore,
    };
  }
}
