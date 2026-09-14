import { apiClient } from './api';
import { ArticleItem } from '../types';

export interface ArticleFilterParams {
  region?: string;
  category?: string;
  source?: string;
  event_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const articleService = {
  /**
   * Fetch paginated articles from database
   */
  async getArticles(params?: ArticleFilterParams): Promise<{ data: ArticleItem[]; total: number; page: number; totalPages: number }> {
    try {
      const res = await apiClient.get('/articles', { params });
      if (res.data?.success && Array.isArray(res.data.data)) {
        return {
          data: res.data.data,
          total: res.data.meta?.total || res.data.data.length,
          page: res.data.meta?.page || 1,
          totalPages: res.data.meta?.totalPages || 1,
        };
      }
    } catch (err) {
      console.warn('[articleService] Articles fetch notice:', err);
    }
    return { data: [], total: 0, page: 1, totalPages: 1 };
  },

  /**
   * Fetch single article by ID
   */
  async getArticleById(id: string): Promise<ArticleItem | null> {
    try {
      const res = await apiClient.get(`/articles/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[articleService] Article ${id} fetch notice:`, err);
    }
    return null;
  },
};
