import { Category } from '../types/index.js';
import { CategoryRepository } from '../repositories/category.repository.js';

export class CategoryService {
  static async getAllCategories(includeInactive = false): Promise<Category[]> {
    return CategoryRepository.findAll(includeInactive);
  }

  static async getCategoryById(idOrSlug: string): Promise<Category | null> {
    if (!idOrSlug) return null;
    return CategoryRepository.findByIdOrSlug(idOrSlug.trim());
  }
}
