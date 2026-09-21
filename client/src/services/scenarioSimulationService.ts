import { apiClient } from './api';
import {
  ScenarioResult,
  StorylineScenario,
  ScenarioLearningSummary,
  ScenarioType,
} from '../types';

export interface CreateScenarioPayload {
  targetEventId?: string;
  scenarioType: ScenarioType;
  question: string;
  assumptionText: string;
  title?: string;
}

export const scenarioSimulationService = {
  /**
   * Creates a new scenario and executes immediate deterministic simulation.
   */
  createScenario: async (
    storylineId: string,
    payload: CreateScenarioPayload
  ): Promise<ScenarioResult> => {
    const res = await apiClient.post<{ success: boolean; data: ScenarioResult }>(
      `/storylines/${storylineId}/scenarios`,
      payload
    );
    return res.data.data;
  },

  /**
   * Retrieves full scenario result with baseline comparison, affected nodes, and unknowns.
   */
  getScenario: async (
    storylineId: string,
    scenarioId: string,
    forceRefresh?: boolean
  ): Promise<ScenarioResult> => {
    const url = forceRefresh
      ? `/storylines/${storylineId}/scenarios/${scenarioId}?forceRefresh=true`
      : `/storylines/${storylineId}/scenarios/${scenarioId}`;
    const res = await apiClient.get<{ success: boolean; data: ScenarioResult }>(url);
    return res.data.data;
  },

  /**
   * Lists scenarios created by the user in this storyline.
   */
  listScenarios: async (
    storylineId: string,
    limit: number = 20,
    page: number = 1
  ): Promise<StorylineScenario[]> => {
    const res = await apiClient.get<{ success: boolean; data: StorylineScenario[] }>(
      `/storylines/${storylineId}/scenarios?limit=${limit}&page=${page}`
    );
    return res.data.data;
  },

  /**
   * Force refreshes and re-simulates the scenario.
   */
  refreshScenario: async (
    storylineId: string,
    scenarioId: string
  ): Promise<ScenarioResult> => {
    const res = await apiClient.post<{ success: boolean; data: ScenarioResult }>(
      `/storylines/${storylineId}/scenarios/${scenarioId}/refresh`
    );
    return res.data.data;
  },

  /**
   * Deletes a user scenario.
   */
  deleteScenario: async (
    storylineId: string,
    scenarioId: string
  ): Promise<boolean> => {
    const res = await apiClient.delete<{ success: boolean }>(
      `/storylines/${storylineId}/scenarios/${scenarioId}`
    );
    return res.data.success;
  },

  /**
   * Retrieves scenario learning summary and reasoning quiz.
   */
  getScenarioLearning: async (
    storylineId: string,
    scenarioId: string
  ): Promise<ScenarioLearningSummary> => {
    const res = await apiClient.get<{ success: boolean; data: ScenarioLearningSummary }>(
      `/storylines/${storylineId}/scenarios/${scenarioId}/learning`
    );
    return res.data.data;
  },
};
