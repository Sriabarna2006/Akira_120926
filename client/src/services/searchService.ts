import { apiClient } from './api';
import { CanonicalEvent, Concept } from '../types';

export interface SearchResults {
  events: CanonicalEvent[];
  concepts: Concept[];
  categories: string[];
}

export const searchService = {
  /**
   * Search across events, concepts, and categories
   */
  async search(query: string): Promise<SearchResults> {
    if (!query.trim()) {
      return { events: [], concepts: [], categories: [] };
    }

    try {
      const res = await apiClient.get('/search', { params: { q: query } });
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[searchService] Search notice:', err);
    }

    return { events: [], concepts: [], categories: [] };
  }
};
