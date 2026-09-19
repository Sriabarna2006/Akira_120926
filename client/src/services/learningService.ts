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
  },

  // ============================================================================
  // PHASE 8: PERSONALIZED DISCOVERY FEED & DAILY LEARNING METHODS
  // ============================================================================

  /**
   * Fetch deterministic personalized discovery feed with explainability reasons
   */
  async getPersonalizedFeed(
    options: import('../types').PersonalizationFeedOptions = {}
  ): Promise<import('../types').PersonalizedFeedResult | null> {
    try {
      const res = await apiClient.get('/learning/feed', { params: options });
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[learningService] Personalized feed fetch notice:', err);
    }
    return null;
  },

  /**
   * Fetch daily learning summary with goal progress and next recommended action
   */
  async getDailySummary(): Promise<import('../types').DailyLearningSummary | null> {
    try {
      const res = await apiClient.get('/learning/daily-summary');
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[learningService] Daily summary fetch notice:', err);
    }
    return null;
  },

  /**
   * Fetch user learning preferences (daily goal & difficulty)
   */
  async getPreferences(): Promise<import('../types').UserLearningPreferences | null> {
    try {
      const res = await apiClient.get('/learning/preferences');
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[learningService] Learning preferences fetch notice:', err);
    }
    return null;
  },

  /**
   * Update user learning preferences
   */
  async updatePreferences(
    preferences: Partial<import('../types').UserLearningPreferences>
  ): Promise<import('../types').UserLearningPreferences | null> {
    try {
      const res = await apiClient.put('/learning/preferences', preferences);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[learningService] Learning preferences update notice:', err);
    }
    return null;
  },

  /**
   * Track user learning activity (e.g. reading explanation, viewing event)
   */
  async trackActivity(
    activityType: string,
    eventId?: string,
    conceptId?: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const res = await apiClient.post('/learning/activity', {
        activityType,
        eventId,
        conceptId,
        metadata,
      });
      return Boolean(res.data?.success);
    } catch (err) {
      console.warn('[learningService] Activity track notice:', err);
      return false;
    }
  },
};
