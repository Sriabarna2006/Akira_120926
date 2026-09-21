import { apiClient } from './api';
import {
  StorylineCatchupBriefing,
  StorylineJourneyResponse,
  UserStorylineProgress,
} from '../types';

export const storylineCatchupService = {
  /**
   * Retrieves the 60-second consolidated catch-up briefing for a storyline.
   */
  getCatchupBriefing: async (
    storylineId: string,
    forceRefresh?: boolean
  ): Promise<StorylineCatchupBriefing> => {
    const url = forceRefresh
      ? `/storylines/${storylineId}/catch-up?forceRefresh=true`
      : `/storylines/${storylineId}/catch-up`;
    const res = await apiClient.get<{ success: boolean; data: StorylineCatchupBriefing }>(url);
    return res.data.data;
  },

  /**
   * Force refreshes and regenerates the catch-up briefing.
   */
  refreshCatchupBriefing: async (
    storylineId: string
  ): Promise<StorylineCatchupBriefing> => {
    const res = await apiClient.post<{ success: boolean; data: StorylineCatchupBriefing }>(
      `/storylines/${storylineId}/catch-up/refresh`
    );
    return res.data.data;
  },

  /**
   * Retrieves user review progress and stats for a storyline.
   */
  getUserProgress: async (storylineId: string): Promise<UserStorylineProgress> => {
    const res = await apiClient.get<{ success: boolean; data: UserStorylineProgress }>(
      `/storylines/${storylineId}/progress`
    );
    return res.data.data;
  },

  /**
   * Marks a storyline event as reviewed.
   */
  markEventReviewed: async (
    storylineId: string,
    eventId: string
  ): Promise<UserStorylineProgress> => {
    const res = await apiClient.post<{ success: boolean; data: UserStorylineProgress }>(
      `/storylines/${storylineId}/progress`,
      { eventId }
    );
    return res.data.data;
  },

  /**
   * Retrieves the complete interactive Chronological Learning Journey.
   */
  getStorylineJourney: async (storylineId: string): Promise<StorylineJourneyResponse> => {
    const res = await apiClient.get<{ success: boolean; data: StorylineJourneyResponse }>(
      `/storylines/${storylineId}/journey`
    );
    return res.data.data;
  },
};
