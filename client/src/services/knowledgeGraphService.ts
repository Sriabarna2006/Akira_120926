import { apiClient } from './api';
import {
  ExtractedConceptItem,
  ConceptGraphNode,
  ConceptGraphEdge,
  ConceptLearningPath,
  RelatedConceptItem,
  RelatedEventItem,
  EventKnowledgeMap,
  ConceptKnowledgeStatus,
} from '../types';

export const knowledgeGraphService = {
  /**
   * Fetch all concepts from the knowledge graph directory
   */
  async getAllConcepts(): Promise<ExtractedConceptItem[]> {
    try {
      const res = await apiClient.get('/concepts');
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[knowledgeGraphService] getAllConcepts notice:', err);
    }
    return [];
  },

  /**
   * Fetch single concept details
   */
  async getConceptById(id: string): Promise<ExtractedConceptItem | null> {
    try {
      const res = await apiClient.get(`/concepts/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[knowledgeGraphService] getConceptById ${id} notice:`, err);
    }
    return null;
  },

  /**
   * Fetch related concepts
   */
  async getRelatedConcepts(id: string, limit: number = 6): Promise<RelatedConceptItem[]> {
    try {
      const res = await apiClient.get(`/concepts/${id}/related`, { params: { limit } });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[knowledgeGraphService] getRelatedConcepts ${id} notice:`, err);
    }
    return [];
  },

  /**
   * Fetch prerequisite DAG tree
   */
  async getPrerequisites(
    id: string,
    depth: number = 5
  ): Promise<{ nodes: ConceptGraphNode[]; edges: ConceptGraphEdge[] } | null> {
    try {
      const res = await apiClient.get(`/concepts/${id}/prerequisites`, { params: { depth } });
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[knowledgeGraphService] getPrerequisites ${id} notice:`, err);
    }
    return null;
  },

  /**
   * Fetch personalized recommended learning path
   */
  async getLearningPath(id: string): Promise<ConceptLearningPath | null> {
    try {
      const res = await apiClient.get(`/concepts/${id}/learning-path`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[knowledgeGraphService] getLearningPath ${id} notice:`, err);
    }
    return null;
  },

  /**
   * Fetch private authenticated user mastery status on this concept
   */
  async getKnowledgeStatus(id: string): Promise<ConceptKnowledgeStatus | null> {
    try {
      const res = await apiClient.get(`/concepts/${id}/knowledge-status`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[knowledgeGraphService] getKnowledgeStatus ${id} notice:`, err);
    }
    return null;
  },

  /**
   * Fetch complete event knowledge map (What you need to understand, prerequisites, gaps, readiness)
   */
  async getEventKnowledgeMap(eventId: string): Promise<EventKnowledgeMap | null> {
    try {
      const res = await apiClient.get(`/events/${eventId}/knowledge-map`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[knowledgeGraphService] getEventKnowledgeMap ${eventId} notice:`, err);
    }
    return null;
  },

  /**
   * Fetch multi-signal related events
   */
  async getRelatedEvents(eventId: string, limit: number = 5): Promise<RelatedEventItem[]> {
    try {
      const res = await apiClient.get(`/events/${eventId}/related`, { params: { limit } });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[knowledgeGraphService] getRelatedEvents ${eventId} notice:`, err);
    }
    return [];
  },
};
