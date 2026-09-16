import { apiClient } from './api';
import { 
  Concept, 
  UserConceptMastery, 
  LearningDashboardData, 
  DueReviewsResponse, 
  LearningRecommendation,
  QuizResult 
} from '../types';

export const learningService = {
  /**
   * Fetch complete user learning dashboard progress (Mastery, streaks, categories, weak concepts)
   */
  async getProgress(): Promise<LearningDashboardData | null> {
    try {
      const res = await apiClient.get('/learning/progress');
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[learningService] Progress fetch notice:', err);
    }
    return null;
  },

  /**
   * Fetch due reviews for spaced repetition
   */
  async getDueReviews(limit: number = 20): Promise<DueReviewsResponse | null> {
    try {
      const res = await apiClient.get('/learning/review', { params: { limit } });
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[learningService] Due reviews fetch notice:', err);
    }
    return null;
  },

  /**
   * Fetch personalized recommendations
   */
  async getRecommendations(limit: number = 6): Promise<LearningRecommendation[]> {
    try {
      const res = await apiClient.get('/learning/recommendations', { params: { limit } });
      if (res.data?.success && res.data.data?.recommendations) {
        return res.data.data.recommendations;
      }
    } catch (err) {
      console.warn('[learningService] Recommendations fetch notice:', err);
    }
    return [];
  },

  /**
   * Fetch all concepts or filter by category
   */
  async getConcepts(category?: string): Promise<Concept[]> {
    try {
      const res = await apiClient.get('/learning/concepts', { params: { category } });
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
      const res = await apiClient.get(`/learning/concepts/${slug}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[learningService] Concept ${slug} fetch notice:`, err);
    }
    return null;
  },

  /**
   * Fetch user concept mastery records (legacy alias)
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
   * Submit quiz answers with server evaluation
   */
  async submitQuiz(eventId: string, answers: Record<string | number, number>): Promise<QuizResult | null> {
    try {
      const res = await apiClient.post(`/events/${eventId}/quiz/submit`, { answers });
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[learningService] Quiz submit for ${eventId} notice:`, err);
    }
    return null;
  }
};
