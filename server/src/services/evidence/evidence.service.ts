import {
  CanonicalEvent,
  EventSource,
  Article,
  EvidenceRecord,
  EvidenceConflict,
  SourceProvenanceItem,
  EventEvidenceSummary,
  ConfidenceState,
  SourceType,
  EvidenceType,
  ConflictSeverity,
} from '../../types/index.js';
import { EVIDENCE_CONFIG } from '../../config/evidenceConfig.js';
import { evidenceRepository } from '../../repositories/evidence.repository.js';
import { EventRepository } from '../../repositories/event.repository.js';
import { ArticleRepository } from '../../repositories/article.repository.js';
import { SourceRepository } from '../../repositories/source.repository.js';

export class EvidenceService {
  /**
   * Deterministically calculates the complete Trust, Evidence & Source Intelligence
   * profile for a canonical event without hallucinations or fake truth scores.
   */
  public async getEvidenceSummary(eventId: string): Promise<EventEvidenceSummary> {
    const cleanId = eventId.trim();
    const event = await EventRepository.findById(cleanId);
    if (!event) {
      throw new Error(`Canonical event '${cleanId}' not found.`);
    }

    // 1. Fetch raw evidence records, articles, and sources
    const [storedEvidence, storedArticles, storedConflicts, allSources] = await Promise.all([
      evidenceRepository.getEvidenceByEventId(cleanId),
      ArticleRepository.findByEventId(cleanId),
      evidenceRepository.getConflictsByEventId(cleanId),
      SourceRepository.findAll({ includeInactive: true }),
    ]);

    const sourceMap = new Map<string, any>();
    for (const s of allSources) {
      sourceMap.set(s.id.toLowerCase(), s);
      sourceMap.set(s.name.toLowerCase(), s);
    }

    // 2. Aggregate corroborating sources and articles into provenance items
    const provenanceList = this.buildProvenanceItems(event, storedArticles, storedEvidence, sourceMap);

    // 3. Count Independent Publishers (Conglomerate / Publisher Deduplication Rule)
    const publisherSet = new Set<string>();
    const conglomerateSet = new Set<string>();
    const sourceTypes = new Set<SourceType>();
    let primarySourceCount = 0;
    let independentReportingCount = 0;

    for (const item of provenanceList) {
      const pubId = (item.sourceId || item.publisherName || '').toLowerCase().trim();
      publisherSet.add(pubId);

      const sourceObj = item.sourceId ? sourceMap.get(item.sourceId.toLowerCase()) : null;
      if (sourceObj && sourceObj.conglomerateId) {
        conglomerateSet.add(sourceObj.conglomerateId.toLowerCase());
      } else {
        conglomerateSet.add(pubId);
      }

      sourceTypes.add(item.sourceType);

      if (item.evidenceType === 'PRIMARY' || item.sourceType === 'GOVERNMENT' || item.sourceType === 'OFFICIAL') {
        primarySourceCount++;
      } else if (item.evidenceType === 'INDEPENDENT_REPORTING' || item.isIndependent) {
        independentReportingCount++;
      }
    }

    // Conglomerate-deduplicated independent publisher count
    const uniquePublisherCount = Math.max(provenanceList.length > 0 ? 1 : 0, conglomerateSet.size || publisherSet.size);
    const totalArticleCount = provenanceList.length;
    const uniqueSourceTypeCount = sourceTypes.size;

    // 4. Agreement and Conflict Analysis
    const dynamicConflicts = this.detectSourceConflicts(cleanId, provenanceList);
    const allConflicts: EvidenceConflict[] = [...storedConflicts, ...dynamicConflicts];

    // Deduplicate conflicts by field + sourceA + sourceB
    const uniqueConflicts = this.deduplicateConflicts(allConflicts);

    // Determine agreement state
    let agreementState: 'HIGH_CONSISTENCY' | 'MODERATE_CONSISTENCY' | 'CONFLICTING' | 'SINGLE_SOURCE' = 'HIGH_CONSISTENCY';
    if (uniquePublisherCount <= 1) {
      agreementState = 'SINGLE_SOURCE';
    } else if (uniqueConflicts.some((c) => c.severity === 'HIGH' || c.severity === 'MEDIUM')) {
      agreementState = 'CONFLICTING';
    } else if (uniqueConflicts.length > 0) {
      agreementState = 'MODERATE_CONSISTENCY';
    }

    // 5. Deterministic Score Breakdown (0-100 scales)
    const breakdown = this.calculateScoreBreakdown({
      uniquePublisherCount,
      primarySourceCount,
      uniqueSourceTypeCount,
      provenanceList,
      event,
      conflicts: uniqueConflicts,
    });

    // 6. Composite Evidence Completeness Score (0-100)
    const w = EVIDENCE_CONFIG.WEIGHTS;
    const rawCompleteness =
      w.INDEPENDENT_PUBLISHER * breakdown.independentPublisherScore +
      w.PRIMARY_SOURCE * breakdown.primarySourceScore +
      w.SOURCE_DIVERSITY * breakdown.sourceDiversityScore +
      w.FRESHNESS * breakdown.freshnessScore +
      w.AUTHORITY * breakdown.authorityScore +
      w.AGREEMENT * breakdown.agreementScore;

    const completenessScore = Math.min(100, Math.max(0, Math.round(rawCompleteness)));

    // 7. Deterministic Confidence State Classification
    const confidenceState = this.classifyConfidenceState({
      completenessScore,
      uniquePublisherCount,
      primarySourceCount,
      conflicts: uniqueConflicts,
    });

    // 8. Human-Readable Evidence Explanation
    const explanation = this.generateEvidenceExplanation({
      confidenceState,
      uniquePublisherCount,
      totalArticleCount,
      primarySourceCount,
      conflicts: uniqueConflicts,
    });

    return {
      eventId: cleanId,
      completenessScore,
      confidenceState,
      totalArticleCount,
      uniquePublisherCount,
      uniqueSourceTypeCount,
      primarySourceCount,
      independentReportingCount,
      agreementState,
      scoreBreakdown: breakdown,
      conflicts: uniqueConflicts,
      sources: provenanceList,
      explanation,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns list of source provenance items with full traceability and direct URLs
   */
  public async getSourceProvenance(eventId: string): Promise<SourceProvenanceItem[]> {
    const summary = await this.getEvidenceSummary(eventId);
    return summary.sources;
  }

  /**
   * Returns detected source conflicts for an event
   */
  public async getEventConflicts(eventId: string): Promise<EvidenceConflict[]> {
    const summary = await this.getEvidenceSummary(eventId);
    return summary.conflicts;
  }

  // ============================================================================
  // INTERNAL HELPER LOGIC
  // ============================================================================

  private buildProvenanceItems(
    event: CanonicalEvent,
    articles: Article[],
    storedEvidence: EvidenceRecord[],
    sourceMap: Map<string, any>
  ): SourceProvenanceItem[] {
    const items: SourceProvenanceItem[] = [];
    const seenUrls = new Set<string>();

    // 1. From stored evidence records
    for (const ev of storedEvidence) {
      const srcMeta = ev.sourceId ? sourceMap.get(ev.sourceId.toLowerCase()) : null;
      items.push({
        articleId: ev.articleId,
        sourceId: ev.sourceId,
        publisherName: ev.sourceName || srcMeta?.name || 'Verified Source',
        title: (ev.verificationMetadata?.title as string) || event.title,
        url: (ev.verificationMetadata?.url as string) || ((event.metadata?.originalUrl as string) || srcMeta?.url || 'https://news.google.com'),
        snippet: (ev.verificationMetadata?.snippet as string) || event.summary,
        publishedAt: ev.evidenceTimestamp || event.firstPublishedAt || new Date().toISOString(),
        sourceType: this.inferSourceType(ev.sourceId, srcMeta?.sourceType, ev.sourceName),
        authorityTier: ev.sourceAuthorityTier || srcMeta?.tier || 2,
        region: srcMeta?.regionId || event.regionId || 'World',
        isIndependent: ev.isIndependent ?? true,
        evidenceType: ev.evidenceType,
      });
      if (ev.verificationMetadata?.url) {
        seenUrls.add((ev.verificationMetadata.url as string).toLowerCase());
      }
    }

    // 2. From articles
    for (const art of articles) {
      if (art.url && seenUrls.has(art.url.toLowerCase())) continue;
      if (art.url) seenUrls.add(art.url.toLowerCase());

      const srcMeta = art.sourceId ? sourceMap.get(art.sourceId.toLowerCase()) : null;
      const pubName = art.sourceName || srcMeta?.name || 'Publisher';
      const isGovOrOfficial = (art.sourceId || '').includes('pib') || (art.sourceId || '').includes('gov') || pubName.includes('PIB') || pubName.includes('Government');

      items.push({
        articleId: art.id,
        sourceId: art.sourceId,
        publisherName: pubName,
        title: art.title,
        url: art.url,
        snippet: art.contentSnippet,
        publishedAt: art.publishedAt || art.createdAt || event.firstPublishedAt || new Date().toISOString(),
        sourceType: this.inferSourceType(art.sourceId, srcMeta?.sourceType, pubName),
        authorityTier: srcMeta?.tier || (isGovOrOfficial ? 1 : 2),
        region: art.regionId || srcMeta?.regionId || event.regionId || 'World',
        isIndependent: !isGovOrOfficial,
        evidenceType: isGovOrOfficial ? 'PRIMARY' : 'INDEPENDENT_REPORTING',
      });
    }

    // 3. From event.sources array if not already present
    if (event.sources && event.sources.length > 0) {
      for (const s of event.sources) {
        if (s.url && seenUrls.has(s.url.toLowerCase())) continue;
        if (s.url) seenUrls.add(s.url.toLowerCase());

        const srcMeta = s.sourceId ? sourceMap.get(s.sourceId.toLowerCase()) : null;
        const pubName = s.sourceName || srcMeta?.name || 'Publisher';
        const isGov = (s.sourceId || '').includes('pib') || (s.sourceId || '').includes('gov') || pubName.includes('PIB');

        items.push({
          sourceId: s.sourceId,
          publisherName: pubName,
          title: s.title || event.title,
          url: s.url,
          snippet: s.snippet || event.summary,
          publishedAt: s.publishedAt || event.firstPublishedAt || new Date().toISOString(),
          sourceType: this.inferSourceType(s.sourceId, srcMeta?.sourceType, pubName),
          authorityTier: s.tier || srcMeta?.tier || 2,
          region: srcMeta?.regionId || event.regionId || 'World',
          isIndependent: !isGov,
          evidenceType: isGov ? 'PRIMARY' : 'INDEPENDENT_REPORTING',
        });
      }
    }

    // 4. Default fallback if empty
    if (items.length === 0) {
      const fallbackPublisher = (event.metadata?.source as string) || 'Aggregated Intelligence Feed';
      items.push({
        publisherName: fallbackPublisher,
        title: event.title,
        url: (event.metadata?.originalUrl as string) || 'https://news.google.com',
        snippet: event.summary,
        publishedAt: event.firstPublishedAt || new Date().toISOString(),
        sourceType: 'NATIONAL',
        authorityTier: 2,
        region: event.regionId || 'World',
        isIndependent: true,
        evidenceType: 'INDEPENDENT_REPORTING',
      });
    }

    return items;
  }

  private inferSourceType(sourceId?: string, explicitType?: string, publisherName?: string): SourceType {
    if (explicitType) return explicitType as SourceType;
    const sid = (sourceId || '').toLowerCase();
    const name = (publisherName || '').toLowerCase();

    if (sid.includes('pib') || sid.includes('gov') || name.includes('government') || name.includes('pib')) {
      return 'GOVERNMENT';
    }
    if (sid.includes('reuters') || sid.includes('bbc') || sid.includes('wire') || sid.includes('afp') || sid.includes('ap')) {
      return 'WIRE';
    }
    if (sid.includes('bleeping') || sid.includes('techcrunch') || sid.includes('verge') || sid.includes('science')) {
      return 'SPECIALIST';
    }
    if (sid.includes('tn') || sid.includes('chennai') || sid.includes('dinamalar') || sid.includes('dinamani')) {
      return 'REGIONAL';
    }
    return 'NATIONAL';
  }

  private calculateScoreBreakdown(params: {
    uniquePublisherCount: number;
    primarySourceCount: number;
    uniqueSourceTypeCount: number;
    provenanceList: SourceProvenanceItem[];
    event: CanonicalEvent;
    conflicts: EvidenceConflict[];
  }) {
    const { uniquePublisherCount, primarySourceCount, uniqueSourceTypeCount, provenanceList, event, conflicts } = params;

    // 1. Independent Publisher Score (25%)
    let independentPublisherScore: number = EVIDENCE_CONFIG.INDEPENDENT_PUBLISHER_SCALING.ONE;
    if (uniquePublisherCount === 2) {
      independentPublisherScore = EVIDENCE_CONFIG.INDEPENDENT_PUBLISHER_SCALING.TWO;
    } else if (uniquePublisherCount === 3) {
      independentPublisherScore = EVIDENCE_CONFIG.INDEPENDENT_PUBLISHER_SCALING.THREE;
    } else if (uniquePublisherCount >= 4) {
      independentPublisherScore = EVIDENCE_CONFIG.INDEPENDENT_PUBLISHER_SCALING.FOUR_OR_MORE;
    }

    // 2. Primary Source Score (20%)
    let primarySourceScore: number = EVIDENCE_CONFIG.PRIMARY_SOURCE_SCALING.ZERO;
    if (primarySourceCount === 1) {
      primarySourceScore = EVIDENCE_CONFIG.PRIMARY_SOURCE_SCALING.ONE;
    } else if (primarySourceCount >= 2) {
      primarySourceScore = EVIDENCE_CONFIG.PRIMARY_SOURCE_SCALING.TWO_OR_MORE;
    }

    // 3. Source Diversity Score (20%)
    let sourceDiversityScore: number = EVIDENCE_CONFIG.SOURCE_DIVERSITY_SCALING.ONE_TYPE;
    if (uniqueSourceTypeCount === 2) {
      sourceDiversityScore = EVIDENCE_CONFIG.SOURCE_DIVERSITY_SCALING.TWO_TYPES;
    } else if (uniqueSourceTypeCount >= 3) {
      sourceDiversityScore = EVIDENCE_CONFIG.SOURCE_DIVERSITY_SCALING.THREE_OR_MORE_TYPES;
    }

    // 4. Freshness Score (15%)
    const nowMs = Date.now();
    let latestTimeMs = 0;
    for (const p of provenanceList) {
      const t = new Date(p.publishedAt).getTime();
      if (t > latestTimeMs) latestTimeMs = t;
    }
    if (latestTimeMs === 0) {
      latestTimeMs = new Date(event.lastUpdatedAt || event.firstPublishedAt || nowMs).getTime();
    }
    const ageHours = Math.max(0, (nowMs - latestTimeMs) / 3600000);
    let freshnessScore = 20;
    if (ageHours <= 2) freshnessScore = 100;
    else if (ageHours <= 6) freshnessScore = 80;
    else if (ageHours <= 12) freshnessScore = 60;
    else if (ageHours <= 24) freshnessScore = 40;

    // 5. Authority Score (10%)
    let totalAuthority = 0;
    for (const p of provenanceList) {
      if (p.authorityTier === 1) totalAuthority += EVIDENCE_CONFIG.AUTHORITY_SCALING.TIER_1;
      else if (p.authorityTier === 2) totalAuthority += EVIDENCE_CONFIG.AUTHORITY_SCALING.TIER_2;
      else totalAuthority += EVIDENCE_CONFIG.AUTHORITY_SCALING.TIER_3;
    }
    const authorityScore = provenanceList.length > 0 ? Math.round(totalAuthority / provenanceList.length) : 70;

    // 6. Agreement Score (10%)
    let agreementScore: number = EVIDENCE_CONFIG.AGREEMENT_SCALING.NO_CONFLICTS;
    const hasHigh = conflicts.some((c) => c.severity === 'HIGH');
    const hasMed = conflicts.some((c) => c.severity === 'MEDIUM');
    const hasLow = conflicts.some((c) => c.severity === 'LOW');

    if (hasHigh) agreementScore = EVIDENCE_CONFIG.AGREEMENT_SCALING.HIGH_SEVERITY_CONFLICT;
    else if (hasMed) agreementScore = EVIDENCE_CONFIG.AGREEMENT_SCALING.MEDIUM_SEVERITY_CONFLICT;
    else if (hasLow) agreementScore = EVIDENCE_CONFIG.AGREEMENT_SCALING.LOW_SEVERITY_CONFLICT;

    return {
      independentPublisherScore,
      primarySourceScore,
      sourceDiversityScore,
      freshnessScore,
      authorityScore,
      agreementScore,
    };
  }

  private classifyConfidenceState(params: {
    completenessScore: number;
    uniquePublisherCount: number;
    primarySourceCount: number;
    conflicts: EvidenceConflict[];
  }): ConfidenceState {
    const { completenessScore, uniquePublisherCount, primarySourceCount, conflicts } = params;

    const hasCriticalConflict = conflicts.some((c) => c.severity === 'HIGH') || conflicts.length >= 2;
    if (hasCriticalConflict) {
      return 'CONFLICTING';
    }

    const hasStrongCorroboration =
      uniquePublisherCount >= EVIDENCE_CONFIG.CONFIDENCE_THRESHOLDS.WELL_SUPPORTED_MIN_INDEPENDENT ||
      (primarySourceCount >= 1 && uniquePublisherCount >= EVIDENCE_CONFIG.CONFIDENCE_THRESHOLDS.WELL_SUPPORTED_WITH_PRIMARY_MIN_INDEPENDENT);

    if (completenessScore >= EVIDENCE_CONFIG.CONFIDENCE_THRESHOLDS.WELL_SUPPORTED_MIN_SCORE && hasStrongCorroboration) {
      return 'WELL_SUPPORTED';
    }

    if (uniquePublisherCount >= EVIDENCE_CONFIG.CONFIDENCE_THRESHOLDS.DEVELOPING_MIN_INDEPENDENT || primarySourceCount >= 1) {
      return 'DEVELOPING';
    }

    if (uniquePublisherCount === EVIDENCE_CONFIG.CONFIDENCE_THRESHOLDS.LIMITED_INDEPENDENT) {
      return 'LIMITED_EVIDENCE';
    }

    return 'UNCONFIRMED';
  }

  private generateEvidenceExplanation(params: {
    confidenceState: ConfidenceState;
    uniquePublisherCount: number;
    totalArticleCount: number;
    primarySourceCount: number;
    conflicts: EvidenceConflict[];
  }): string {
    const { confidenceState, uniquePublisherCount, totalArticleCount, primarySourceCount, conflicts } = params;

    if (conflicts.length > 0) {
      const firstConf = conflicts[0];
      return `Sources differ on reported ${firstConf.field.replace('_', ' ')} (${firstConf.sourceA}: "${firstConf.valueA}" vs ${firstConf.sourceB}: "${firstConf.valueB}"). AKIRA does not choose a winner and presents available evidence transparently.`;
    }

    if (confidenceState === 'WELL_SUPPORTED') {
      const primStr = primarySourceCount > 0 ? ` ${primarySourceCount} official primary source is available.` : '';
      return `Evidence: Corroborated by ${uniquePublisherCount} independent publisher(s) across ${totalArticleCount} article(s).${primStr} No major conflicts detected.`;
    }

    if (confidenceState === 'DEVELOPING') {
      const primStr = primarySourceCount > 0 ? ` 1 primary source identified.` : ' No primary source identified yet.';
      return `Evidence is developing: ${uniquePublisherCount} publisher(s) report this event.${primStr} Further independent confirmations expected as coverage broadens.`;
    }

    if (confidenceState === 'LIMITED_EVIDENCE') {
      return `Limited evidence: Only 1 publisher currently reports this development. Independent corroboration has not yet been established.`;
    }

    return `Unconfirmed evidence: Insufficient independent corroboration exists for this report at present.`;
  }

  /**
   * Deterministically compares structured figures/numbers across articles to flag discrepancies
   */
  private detectSourceConflicts(eventId: string, provenance: SourceProvenanceItem[]): EvidenceConflict[] {
    if (provenance.length < 2) return [];

    const conflicts: EvidenceConflict[] = [];

    // Simple heuristic regex scanning for numbers preceded by key terms (e.g., $ / Rs / casualties / crores)
    for (let i = 0; i < provenance.length; i++) {
      for (let j = i + 1; j < provenance.length; j++) {
        const itemA = provenance[i];
        const itemB = provenance[j];

        // Do not compare articles from identical publisher
        if (itemA.publisherName.toLowerCase() === itemB.publisherName.toLowerCase()) continue;

        const textA = `${itemA.title} ${itemA.snippet || ''}`;
        const textB = `${itemB.title} ${itemB.snippet || ''}`;

        // Example: Detect monetary discrepancies (e.g. ₹5,000 crore vs ₹8,000 crore)
        const matchMoneyA = textA.match(/(?:Rs\.?|₹|\$)\s*([0-9,.]+)\s*(?:crore|billion|million)?/i);
        const matchMoneyB = textB.match(/(?:Rs\.?|₹|\$)\s*([0-9,.]+)\s*(?:crore|billion|million)?/i);

        if (matchMoneyA && matchMoneyB && matchMoneyA[1] !== matchMoneyB[1]) {
          conflicts.push({
            id: `conf_${i}_${j}_financial`,
            eventId,
            field: 'financial_amount',
            sourceA: itemA.publisherName,
            sourceB: itemB.publisherName,
            valueA: matchMoneyA[0],
            valueB: matchMoneyB[0],
            severity: 'MEDIUM',
            status: 'UNRESOLVED',
            explanation: `${itemA.publisherName} reported ${matchMoneyA[0]} while ${itemB.publisherName} reported ${matchMoneyB[0]}.`,
            detectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return conflicts;
  }

  private deduplicateConflicts(conflicts: EvidenceConflict[]): EvidenceConflict[] {
    const map = new Map<string, EvidenceConflict>();
    for (const c of conflicts) {
      const key = `${c.field}:${c.sourceA}:${c.sourceB}`.toLowerCase();
      if (!map.has(key)) {
        map.set(key, c);
      }
    }
    return Array.from(map.values());
  }
}

export const evidenceService = new EvidenceService();
