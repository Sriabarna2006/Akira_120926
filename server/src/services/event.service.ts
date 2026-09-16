import { CanonicalEvent } from '../types/index.js';
import { EventRepository, EventFilterParams } from '../repositories/event.repository.js';
import { RankingService, RankOptions } from './ranking/rankingService.js';

export class EventService {
  static async getEvents(params: EventFilterParams = {}): Promise<{ events: CanonicalEvent[]; total: number }> {
    return EventRepository.findAll(params);
  }

  static async getEventById(id: string): Promise<CanonicalEvent | null> {
    if (!id) return null;
    return EventRepository.findById(id.trim());
  }

  static async getTopEvents(options: RankOptions | string = {}, legacyLimit = 10): Promise<CanonicalEvent[]> {
    if (typeof options === 'string') {
      return RankingService.getTopRankedEvents({
        regionId: options,
        limit: legacyLimit,
      });
    }
    return RankingService.getTopRankedEvents(options);
  }
}

