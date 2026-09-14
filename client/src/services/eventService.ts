import { apiClient } from './api';
import { CanonicalEvent, RegionType } from '../types';

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

export const eventService = {
  /**
   * Fetch canonical events with pagination and filtering
   */
  async getEvents(params?: EventFilterParams): Promise<PaginatedEventsResult> {
    try {
      const res = await apiClient.get('/events', { params });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return {
          data: res.data.data,
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
          data: res.data.data,
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
   * Fetch Top 10 flagship events by region
   */
  async getTopEvents(region: RegionType | string = 'ALL'): Promise<CanonicalEvent[]> {
    try {
      const res = await apiClient.get('/live/top', { params: { region } });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
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
        return res.data.data;
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
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[eventService] Event ${id} fetch notice:`, err);
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
