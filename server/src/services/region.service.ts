import { Region } from '../types/index.js';
import { RegionRepository } from '../repositories/region.repository.js';

export class RegionService {
  static async getAllRegions(includeInactive = false): Promise<Region[]> {
    return RegionRepository.findAll(includeInactive);
  }

  static async getRegionById(idOrSlug: string): Promise<Region | null> {
    if (!idOrSlug) return null;
    return RegionRepository.findByIdOrSlug(idOrSlug.trim());
  }
}
