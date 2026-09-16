import { apiClient } from './api';
import { 
  CanonicalEvent, 
  RegionType, 
  FiveWOneH, 
  MultiLevelExplanation, 
  ExtractedConceptItem, 
  QuizQuestion, 
  QuizResult,
  ExplanationLevel
} from '../types';

export interface EventFilterParams {
  region?: string;
  category?: string;
  urgency?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedEventsResult {
  data: CanonicalEvent[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  timestamp?: string;
}

/**
 * Normalizes raw backend event records into standard, complete CanonicalEvent objects.
 */
export function normalizeEvent(e: any): CanonicalEvent {
  if (!e) return e;

  // Region label resolution
  let region = e.region;
  if (!region) {
    if (e.regionId === 'tamil-nadu') region = 'Tamil Nadu';
    else if (e.regionId === 'india') region = 'India';
    else if (e.regionId === 'world') region = 'World';
    else region = 'World';
  }

  // Category title resolution
  let category = e.category;
  if (!category && e.categoryId) {
    category = e.categoryId
      .split(/[-_]/)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  if (!category) category = 'General';

  // Importance / Breaking status resolution
  let importanceLabel: any = 'IMPORTANT';
  const isBreaking = 
    e.importanceLabel === 'BREAKING' || 
    e.urgencyLabel === 'BREAKING' || 
    e.rankingMetadata?.breakingStatus === true;

  const isTrending = 
    e.importanceLabel === 'TRENDING' || 
    e.urgencyLabel === 'TRENDING' || 
    e.rankingMetadata?.trendStatus === 'TRENDING' || 
    e.rankingMetadata?.trendStatus === 'HIGHLY_TRENDING';

  if (isBreaking) {
    importanceLabel = 'BREAKING';
  } else if (isTrending) {
    importanceLabel = 'TRENDING';
  }

  // Sources normalization
  const rawSources = Array.isArray(e.sources) ? e.sources : [];
  const sources = rawSources.map((s: any) => ({
    id: s.id,
    name: s.sourceName || s.name || 'Wire Source',
    sourceName: s.sourceName || s.name || 'Wire Source',
    url: s.url || '#',
    title: s.title,
    snippet: s.snippet,
    publishedAt: s.publishedAt || e.firstPublishedAt || new Date().toISOString(),
    tier: s.tier || 2,
    credibility: s.credibility,
  }));

  const sourceName = sources[0]?.name || e.source || e.metadata?.initialSource || 'Verified Source';
  const sourceCount = sources.length || e.sourceCount || 1;

  const firstPublishedAt = e.firstPublishedAt || e.createdAt || e.publishedAt || new Date().toISOString();
  const lastUpdatedAt = e.lastUpdatedAt || e.updatedAt || firstPublishedAt;

  return {
    ...e,
    id: e.id,
    title: e.title || 'Untitled Event',
    summary: e.summary || e.title || '',
    region,
    regionId: e.regionId || (region === 'Tamil Nadu' ? 'tamil-nadu' : region === 'India' ? 'india' : 'world'),
    category,
    categoryId: e.categoryId || category.toLowerCase().replace(/\s+/g, '-'),
    importanceLabel,
    urgencyLabel: importanceLabel,
    importanceScore: e.importanceScore ?? 75,
    finalRankScore: e.finalRankScore ?? 80,
    velocityScore: e.velocityScore ?? 60,
    trendScore: e.trendScore ?? 60,
    rankingMetadata: e.rankingMetadata,
    whyItMatters: e.whyItMatters || undefined,
    estimatedReadTime: e.estimatedReadTime || '3 min read',
    firstPublishedAt,
    lastUpdatedAt,
    sourceCount,
    sources,
    source: sourceName,
  };
}

export const eventService = {
  /**
   * Fetch canonical events with pagination and filtering
   */
  async getEvents(params?: EventFilterParams): Promise<PaginatedEventsResult> {
    try {
      const res = await apiClient.get('/events', { params });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return {
          data: res.data.data.map(normalizeEvent),
          total: res.data.meta?.total ?? res.data.data.length,
          page: res.data.meta?.page ?? 1,
          totalPages: res.data.meta?.totalPages ?? 1,
          hasMore: res.data.meta?.hasMore ?? false,
          timestamp: res.data.meta?.timestamp,
        };
      }
    } catch (err) {
      console.warn('[eventService] Events fetch notice:', err);
    }
    return { data: [], total: 0, page: 1, totalPages: 1, hasMore: false };
  },

  /**
   * Fetch Live & Trending stream from database
   */
  async getLiveEvents(params?: EventFilterParams): Promise<PaginatedEventsResult> {
    try {
      const res = await apiClient.get('/live', { params });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return {
          data: res.data.data.map(normalizeEvent),
          total: res.data.meta?.total ?? res.data.data.length,
          page: res.data.meta?.page ?? 1,
          totalPages: res.data.meta?.totalPages ?? 1,
          hasMore: res.data.meta?.hasMore ?? false,
          timestamp: res.data.meta?.timestamp,
        };
      }
    } catch (err) {
      console.warn('[eventService] Live events fetch notice:', err);
    }
    return { data: [], total: 0, page: 1, totalPages: 1, hasMore: false };
  },

  /**
   * Fetch Top 10 flagship dynamically ranked events with filtering
   */
  async getTopEvents(params: { region?: string; category?: string; status?: string; limit?: number } | RegionType | string = 'ALL'): Promise<CanonicalEvent[]> {
    try {
      const queryParams = typeof params === 'string' 
        ? { region: params === 'ALL' ? undefined : params.toLowerCase().replace(' ', '-') } 
        : params;
      const res = await apiClient.get('/live/top', { params: queryParams });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data.map(normalizeEvent);
      }
    } catch (err) {
      console.warn('[eventService] Top events fetch notice:', err);
    }
    return [];
  },

  /**
   * Fetch Daily Brief stories
   */
  async getDailyBrief(): Promise<CanonicalEvent[]> {
    try {
      const res = await apiClient.get('/daily-brief');
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data.map(normalizeEvent);
      }
    } catch (err) {
      console.warn('[eventService] Daily brief fetch notice:', err);
    }
    return [];
  },

  /**
   * Fetch single event details by ID
   */
  async getEventById(id: string): Promise<CanonicalEvent | null> {
    try {
      const res = await apiClient.get(`/events/${id}`);
      if (res.data?.success && res.data.data) {
        return normalizeEvent(res.data.data);
      }
    } catch (err) {
      console.warn(`[eventService] Event ${id} fetch notice:`, err);
    }
    return null;
  },

  /**
   * Triggers an on-demand live news feeds synchronization from 14 verified RSS publishers
   */
  async refreshLiveFeeds(): Promise<{ success: boolean; report?: any; message: string }> {
    try {
      const res = await apiClient.post('/live/refresh');
      if (res.data?.success) {
        return {
          success: true,
          report: res.data.data?.report,
          message: res.data.data?.message || 'Live feeds synchronized successfully.',
        };
      }
    } catch (err: any) {
      console.warn('[eventService] Live refresh notice:', err);
    }
    return { success: false, message: 'Could not sync live feeds at this time.' };
  },


  // ============================================================================
  // PHASE 6: AI INTELLIGENCE & UNDERSTANDING METHODS
  // ============================================================================

  /**
   * Fetch grounded 5W1H Understanding Breakdown
   */
  async getUnderstanding(eventId: string, forceRefresh?: boolean): Promise<FiveWOneH | null> {
    try {
      const res = await apiClient.get(`/events/${eventId}/understanding`, {
        params: { forceRefresh: forceRefresh ? 'true' : undefined }
      });
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[eventService] 5W1H fetch notice for ${eventId}:`, err);
    }
    return null;
  },

  /**
   * Fetch multi-level explanation (single level or all)
   */
  async getExplanation(eventId: string, level: ExplanationLevel | 'all' = 'beginner', forceRefresh?: boolean): Promise<{ level: string; content: string } | MultiLevelExplanation | null> {
    try {
      const res = await apiClient.get(`/events/${eventId}/explanation`, {
        params: { level, forceRefresh: forceRefresh ? 'true' : undefined }
      });
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[eventService] Explanation fetch notice for ${eventId}:`, err);
    }
    return null;
  },

  /**
   * Fetch extracted concepts & prerequisites
   */
  async getConcepts(eventId: string, forceRefresh?: boolean): Promise<ExtractedConceptItem[]> {
    try {
      const res = await apiClient.get(`/events/${eventId}/concepts`, {
        params: { forceRefresh: forceRefresh ? 'true' : undefined }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[eventService] Concepts fetch notice for ${eventId}:`, err);
    }
    return [];
  },

  /**
   * Fetch active recall quiz questions
   */
  async getQuiz(eventId: string, forceRefresh?: boolean): Promise<QuizQuestion[]> {
    try {
      const res = await apiClient.get(`/events/${eventId}/quiz`, {
        params: { forceRefresh: forceRefresh ? 'true' : undefined }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[eventService] Quiz fetch notice for ${eventId}:`, err);
    }
    return [];
  },

  /**
   * Submit quiz for server-side evaluation & scoring
   */
  async submitQuiz(eventId: string, answers: Record<string | number, number>): Promise<QuizResult | null> {
    try {
      const res = await apiClient.post(`/events/${eventId}/quiz/submit`, { answers });
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[eventService] Quiz submission notice for ${eventId}:`, err);
    }
    return null;
  },

  /**
   * Fetch user saved events (library)
   */
  async getSavedEvents(): Promise<string[]> {
    try {
      const res = await apiClient.get('/auth/saved-events');
      if (res.data?.savedEvents) {
        return res.data.savedEvents;
      }
    } catch (err) {
      console.warn('[eventService] Saved events fetch notice:', err);
    }
    return [];
  },

  /**
   * Save or bookmark an event
   */
  async saveEvent(eventId: string): Promise<boolean> {
    try {
      const res = await apiClient.post('/auth/saved-events', { eventId });
      return res.status === 200;
    } catch (err) {
      console.warn(`[eventService] Save event ${eventId} notice:`, err);
      return false;
    }
  },

  /**
   * Remove saved event
   */
  async removeSavedEvent(eventId: string): Promise<boolean> {
    try {
      const res = await apiClient.delete(`/auth/saved-events/${eventId}`);
      return res.status === 200;
    } catch (err) {
      console.warn(`[eventService] Remove saved event ${eventId} notice:`, err);
      return false;
    }
  }
};
