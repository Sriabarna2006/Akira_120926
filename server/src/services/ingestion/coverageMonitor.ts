import { EventRepository } from '../../repositories/event.repository.js';
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
   * Evaluates category distribution across all active canonical events
   */
  public async generateCoverageReport(): Promise<CategoryCoverageReport> {
    const { events } = await EventRepository.findAll({ limit: 500 });
    const counts: Record<string, number> = {};

    for (const cat of STANDARD_CATEGORIES) {
      counts[cat] = 0;
    }

    for (const evt of events) {
      const cat = (evt.categoryId || 'other').toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    }

    const sparseCategories: string[] = [];
    const uncoveredCategories: string[] = [];
    let coveredCount = 0;

    for (const cat of STANDARD_CATEGORIES) {
      const count = counts[cat] || 0;
      if (count === 0) {
        uncoveredCategories.push(cat);
      } else if (count < 2) {
        sparseCategories.push(cat);
        coveredCount++;
      } else {
        coveredCount++;
      }
    }

    const coveragePercentage = Math.round((coveredCount / STANDARD_CATEGORIES.length) * 100);

    return {
      totalCategories: STANDARD_CATEGORIES.length,
      coveredCategories: coveredCount,
      sparseCategories,
      uncoveredCategories,
      coveragePercentage,
      perCategoryCounts: counts,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const categoryCoverageMonitor = CategoryCoverageMonitor.getInstance();
