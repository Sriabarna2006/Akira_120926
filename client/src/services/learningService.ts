import { apiClient } from './api';
import { Concept, UserConceptMastery } from '../types';

export const learningService = {
  /**
   * Fetch all concepts or filter by category
   */
  async getConcepts(category?: string): Promise<Concept[]> {
    try {
      const res = await apiClient.get('/concepts', { params: { category } });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[learningService] Concepts fetch notice:', err);
    }
    return [];
  },

  /**
   * Fetch single concept by slug
   */
  async getConceptBySlug(slug: string): Promise<Concept | null> {
    try {
      const res = await apiClient.get(`/concepts/${slug}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[learningService] Concept ${slug} fetch notice:`, err);
    }
    return null;
  },

  /**
   * Fetch user concept mastery records
   */
  async getUserMastery(): Promise<UserConceptMastery[]> {
    try {
      const res = await apiClient.get('/knowledge/mastery');
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[learningService] User mastery fetch notice:', err);
    }
    return [];
  },

  /**
   * Submit quiz answers
   */
  async submitQuiz(eventId: string, answers: number[]): Promise<{ score: number; passed: boolean } | null> {
    try {
      const res = await apiClient.post('/quiz/submit', { eventId, answers });
      if (res.data?.success) {
        return { score: res.data.score, passed: res.data.passed };
      }
    } catch (err) {
      console.warn(`[learningService] Quiz submit for ${eventId} notice:`, err);
    }
    return null;
  }
};
