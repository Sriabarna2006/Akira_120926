import { Article } from '../types/index.js';
import { ArticleRepository, ArticleFilterParams } from '../repositories/article.repository.js';

export class ArticleService {
  static async getArticles(params: ArticleFilterParams = {}): Promise<{ articles: Article[]; total: number }> {
    return ArticleRepository.findAll(params);
  }

  static async getArticleById(id: string): Promise<Article | null> {
    if (!id) return null;
    return ArticleRepository.findById(id.trim());
  }
}
