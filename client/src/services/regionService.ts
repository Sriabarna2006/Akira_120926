import { apiClient } from './api';
import { RegionItem } from '../types';

export const regionService = {
  /**
   * Fetch all active regions from database
   */
  async getRegions(): Promise<RegionItem[]> {
    try {
      const res = await apiClient.get('/regions');
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[regionService] Regions fetch notice:', err);
    }
    // Fallback safe reference
    return [
      { id: 'tamil-nadu', name: 'Tamil Nadu', slug: 'tamil-nadu', tier: 1, isActive: true },
      { id: 'india', name: 'India', slug: 'india', tier: 1, isActive: true },
      { id: 'world', name: 'World', slug: 'world', tier: 1, isActive: true },
    ];
  },

  /**
   * Fetch single region by ID or slug
   */
  async getRegionById(id: string): Promise<RegionItem | null> {
    try {
      const res = await apiClient.get(`/regions/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[regionService] Region ${id} fetch notice:`, err);
    }
    return null;
  },
};
