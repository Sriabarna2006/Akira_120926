import { apiClient } from './api';
import { CanonicalEvent, RegionType } from '../types';

export interface EventFilterParams {
  region?: RegionType;
  category?: string;
  urgency?: string;
  search?: string;
  limit?: number;
}

export const eventService = {
  /**
   * Fetch Live & Trending events shell / ranked list
   */
  async getLiveEvents(params?: EventFilterParams): Promise<{ data: CanonicalEvent[]; total: number }> {
    try {
      const res = await apiClient.get('/live', { params });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return { data: res.data.data, total: res.data.meta?.total || res.data.data.length };
      }
      if (Array.isArray(res.data)) {
        return { data: res.data, total: res.data.length };
      }
    } catch (err) {
      console.warn('[eventService] Live events fetch notice:', err);
    }
    return { data: [], total: 0 };
  },

  /**
   * Fetch Top 10 flagship events by region
   */
  async getTopEvents(region: RegionType = 'ALL'): Promise<CanonicalEvent[]> {
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
   * Fetch Daily Brief curated stories
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
