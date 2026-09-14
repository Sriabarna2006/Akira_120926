import { CanonicalEvent } from '../types/index.js';
import { EventRepository, EventFilterParams } from '../repositories/event.repository.js';

export class EventService {
  static async getEvents(params: EventFilterParams = {}): Promise<{ events: CanonicalEvent[]; total: number }> {
    return EventRepository.findAll(params);
  }

  static async getEventById(id: string): Promise<CanonicalEvent | null> {
    if (!id) return null;
    return EventRepository.findById(id.trim());
  }

  static async getTopEvents(regionId?: string, limit = 10): Promise<CanonicalEvent[]> {
    const res = await EventRepository.findAll({
      regionId,
      limit,
      page: 1,
    });
    return res.events;
  }
}
