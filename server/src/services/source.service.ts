import { Source } from '../types/index.js';
import { SourceRepository, SourceFilterParams } from '../repositories/source.repository.js';

export class SourceService {
  static async getSources(params: SourceFilterParams = {}): Promise<Source[]> {
    return SourceRepository.findAll(params);
  }

  static async getSourceById(id: string): Promise<Source | null> {
    if (!id) return null;
    return SourceRepository.findById(id.trim());
  }
}
