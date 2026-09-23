import { EventRepository } from '../../repositories/event.repository.js';
import { SourceRepository } from '../../repositories/source.repository.js';
import { CategoryCoverageReport } from '../../types/index.js';

export const STANDARD_CATEGORIES = [
  'politics',
  'economy',
  'technology',
  'science',
  'security',
  'environment',
  'infrastructure',
  'business',
  'governance',
  'defence',
  'energy',
  'health',
  'education',
  'culture',
  'sports',
];

export const STANDARD_REGIONS = ['tamil-nadu', 'india', 'world'];

export class CategoryCoverageMonitor {
  private static instance: CategoryCoverageMonitor;

  private constructor() {}

  public static getInstance(): CategoryCoverageMonitor {
    if (!CategoryCoverageMonitor.instance) {
      CategoryCoverageMonitor.instance = new CategoryCoverageMonitor();
    }
    return CategoryCoverageMonitor.instance;
  }

  /**
   * Evaluates category distribution, freshness, source failures, and corroboration across canonical events.
   */
  public async generateCoverageReport(): Promise<CategoryCoverageReport> {
    const { events } = await EventRepository.findAll({ limit: 500 });
    const allSources = await SourceRepository.findAll({ includeInactive: true });

    const counts: Record<string, number> = {};
    const regionCounts: Record<string, number> = { 'tamil-nadu': 0, 'india': 0, 'world': 0 };
    const domainFreshnessHours: Record<string, number> = {};
    const now = Date.now();

    for (const cat of STANDARD_CATEGORIES) {
      counts[cat] = 0;
      domainFreshnessHours[cat] = 999; // Default if no events
    }

    let multiSourceEventsCount = 0;

    for (const evt of events) {
      const cat = (evt.categoryId || 'other').toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;

      const reg = (evt.regionId || 'world').toLowerCase();
      if (regionCounts[reg] !== undefined) {
        regionCounts[reg] += 1;
      }

      // Check multi-source corroboration
      const sourceCount = evt.sourceCount || (evt.sources ? evt.sources.length : 1);
      if (sourceCount > 1) {
        multiSourceEventsCount++;
      }

      // Calculate domain freshness
      const evtTime = evt.lastUpdatedAt || evt.firstPublishedAt || evt.createdAt;
      if (evtTime) {
        const ageHours = Math.max(0, (now - new Date(evtTime).getTime()) / (3600 * 1000));
        if (domainFreshnessHours[cat] === undefined || ageHours < domainFreshnessHours[cat]) {
          domainFreshnessHours[cat] = Math.round(ageHours * 10) / 10;
        }
      }
    }

    const sparseCategories: string[] = [];
    const uncoveredCategories: string[] = [];
    const healthyDomains: string[] = [];
    const staleDomains: string[] = [];
    let coveredCount = 0;

    for (const cat of STANDARD_CATEGORIES) {
      const count = counts[cat] || 0;
      const freshness = domainFreshnessHours[cat];

      if (count === 0) {
        uncoveredCategories.push(cat);
      } else if (count < 2) {
        sparseCategories.push(cat);
        coveredCount++;
      } else {
        coveredCount++;
      }

      // Determine healthy vs stale domain status
      if (count > 0 && freshness <= 18) {
        healthyDomains.push(cat);
      } else if (count > 0 && freshness > 18) {
        staleDomains.push(cat);
      }
    }

    // Weak regions evaluation (< 2 events)
    const weakRegions: string[] = [];
    for (const reg of STANDARD_REGIONS) {
      if ((regionCounts[reg] || 0) < 2) {
        weakRegions.push(reg);
      }
    }

    // Track source failures affecting coverage
    const sourceFailuresAffectingCoverage = allSources
      .filter((s) => s.healthStatus === 'FAILING' || s.quarantineStatus === 'QUARANTINED' || (s.consecutiveFailures || 0) > 0)
      .map((s) => ({
        sourceId: s.id,
        sourceName: s.name,
        categoryId: s.categoryId || 'general',
        errorType: s.lastErrorType || 'UNKNOWN',
      }));

    const coveragePercentage = Math.round((coveredCount / STANDARD_CATEGORIES.length) * 100);

    return {
      totalCategories: STANDARD_CATEGORIES.length,
      coveredCategories: coveredCount,
      sparseCategories,
      uncoveredCategories,
      coveragePercentage,
      perCategoryCounts: counts,
      healthyDomains,
      staleDomains,
      weakRegions,
      sourceFailuresAffectingCoverage,
      domainFreshnessHours,
      uniqueEventsCount: events.length,
      multiSourceEventsCount,
      underrepresentedCategories: [...uncoveredCategories, ...sparseCategories],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const categoryCoverageMonitor = CategoryCoverageMonitor.getInstance();

