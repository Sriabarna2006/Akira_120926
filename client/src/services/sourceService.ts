import { apiClient } from './api';
import { SourceItem } from '../types';

export const sourceService = {
  /**
   * Fetch all active sources from database
   */
  async getSources(params?: { region?: string; category?: string; tier?: number }): Promise<SourceItem[]> {
    try {
      const res = await apiClient.get('/sources', { params });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[sourceService] Sources fetch notice:', err);
    }
    return [];
  },

  /**
   * Fetch single source by ID
   */
  async getSourceById(id: string): Promise<SourceItem | null> {
    try {
      const res = await apiClient.get(`/sources/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[sourceService] Source ${id} fetch notice:`, err);
    }
    return null;
  },
};
