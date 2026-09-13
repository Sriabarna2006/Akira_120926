import { apiClient } from './api';
import { UserProfile, UserPreferences } from '../types';

export const profileService = {
  async getProfile(): Promise<UserProfile | null> {
    try {
      const res = await apiClient.get('/auth/profile');
      if (res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[profileService] Backend profile retrieval notice:', err);
    }
    return null;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const res = await apiClient.post('/auth/profile', updates);
      return res.status === 200;
    } catch (err) {
      console.warn('[profileService] Backend profile update notice:', err);
      return false;
    }
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const res = await apiClient.post('/auth/preferences', preferences);
      return res.status === 200;
    } catch (err) {
      console.warn('[profileService] Backend preferences update notice:', err);
      return false;
    }
  }
};
