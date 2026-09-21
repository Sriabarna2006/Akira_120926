import crypto from 'crypto';
import {
  StorylineCatchupBriefing,
  UserStorylineProgress,
} from '../types/index.js';
import { query, queryOne, isDatabaseConnected } from '../db/dbClient.js';

export class StorylineCatchupRepository {
  // In-memory fallback caches for zero-latency execution and offline resilience
  private memoryBriefings: Map<string, StorylineCatchupBriefing> = new Map();
  private memoryProgress: Map<string, UserStorylineProgress> = new Map();

  private getBriefingKey(storylineId: string, userId?: string): string {
    return `${storylineId}:${userId || 'generic'}`;
  }

  private getProgressKey(userId: string, storylineId: string): string {
    return `${userId}:${storylineId}`;
  }

  /**
   * Retrieves a cached briefing for a storyline (and optional user).
   */
  public async getBriefing(
    storylineId: string,
    userId?: string
  ): Promise<StorylineCatchupBriefing | null> {
    const key = this.getBriefingKey(storylineId, userId);

    if (isDatabaseConnected()) {
      try {
        const sql = userId
          ? `SELECT briefing_json, expires_at FROM public.storyline_catchup_briefings 
             WHERE storyline_id = $1 AND user_id = $2 AND expires_at > NOW() LIMIT 1`
          : `SELECT briefing_json, expires_at FROM public.storyline_catchup_briefings 
             WHERE storyline_id = $1 AND user_id IS NULL AND expires_at > NOW() LIMIT 1`;
        const params = userId ? [storylineId, userId] : [storylineId];
        const res = await queryOne<{ briefing_json: any; expires_at: string }>(sql, params);

        if (res && res.briefing_json) {
          const briefing = typeof res.briefing_json === 'string' ? JSON.parse(res.briefing_json) : res.briefing_json;
          this.memoryBriefings.set(key, briefing);
          return briefing;
        }
      } catch (err: any) {
        console.warn(`[CatchupRepo] PostgreSQL getBriefing error: ${err.message}. Falling back to memory.`);
      }
    }

    const cached = this.memoryBriefings.get(key);
    if (cached) {
      if (cached.expiresAt && new Date(cached.expiresAt).getTime() < Date.now()) {
        this.memoryBriefings.delete(key);
        return null;
      }
      return cached;
    }

    return null;
  }

  /**
   * Caches or updates a catch-up briefing.
   */
  public async saveBriefing(briefing: StorylineCatchupBriefing): Promise<void> {
    const key = this.getBriefingKey(briefing.storylineId, briefing.userId);
    this.memoryBriefings.set(key, briefing);

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.storyline_catchup_briefings (
            id, storyline_id, user_id, last_seen_event_id, briefing_json,
            version, generated_at, expires_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, 1, $6, $7, NOW(), NOW()
          )
          ON CONFLICT (storyline_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
          DO UPDATE SET
            briefing_json = EXCLUDED.briefing_json,
            last_seen_event_id = EXCLUDED.last_seen_event_id,
            generated_at = EXCLUDED.generated_at,
            expires_at = EXCLUDED.expires_at,
            updated_at = NOW();
        `;
        const id = crypto.randomUUID();
        const expiresAt = briefing.expiresAt || new Date(Date.now() + 3600000).toISOString();
        const params = [
          id,
          briefing.storylineId,
          briefing.userId || null,
          briefing.lastKnownEvent?.id || null,
          JSON.stringify(briefing),
          briefing.generatedAt,
          expiresAt,
        ];
        await query(sql, params);
      } catch (err: any) {
        console.warn(`[CatchupRepo] PostgreSQL saveBriefing error: ${err.message}`);
      }
    }
  }

  /**
   * Invalidates cached briefings for a storyline (all users or specific user).
   */
  public async invalidateBriefing(storylineId: string, userId?: string): Promise<void> {
    if (userId) {
      const key = this.getBriefingKey(storylineId, userId);
      this.memoryBriefings.delete(key);
    } else {
      for (const k of Array.from(this.memoryBriefings.keys())) {
        if (k.startsWith(`${storylineId}:`)) {
          this.memoryBriefings.delete(k);
        }
      }
    }

    if (isDatabaseConnected()) {
      try {
        if (userId) {
          await query(
            `DELETE FROM public.storyline_catchup_briefings WHERE storyline_id = $1 AND user_id = $2`,
            [storylineId, userId]
          );
        } else {
          await query(
            `DELETE FROM public.storyline_catchup_briefings WHERE storyline_id = $1`,
            [storylineId]
          );
        }
      } catch (err: any) {
        console.warn(`[CatchupRepo] PostgreSQL invalidateBriefing error: ${err.message}`);
      }
    }
  }

  /**
   * Retrieves a user's progress for a storyline.
   */
  public async getUserProgress(
    userId: string,
    storylineId: string
  ): Promise<UserStorylineProgress | null> {
    const key = this.getProgressKey(userId, storylineId);

    if (isDatabaseConnected()) {
      try {
        const sql = `SELECT * FROM public.user_storyline_progress WHERE user_id = $1 AND storyline_id = $2 LIMIT 1`;
        const res = await queryOne<any>(sql, [userId, storylineId]);
        if (res) {
          const progress: UserStorylineProgress = {
            id: res.id,
            userId: res.user_id,
            storylineId: res.storyline_id,
            lastSeenEventId: res.last_seen_event_id,
            reviewedEventIds: Array.isArray(res.reviewed_event_ids)
              ? res.reviewed_event_ids
              : typeof res.reviewed_event_ids === 'string'
              ? JSON.parse(res.reviewed_event_ids)
              : [],
            isFullyCaughtUp: res.is_fully_caught_up,
            lastReviewedAt: res.last_reviewed_at,
            createdAt: res.created_at,
            updatedAt: res.updated_at,
          };
          this.memoryProgress.set(key, progress);
          return progress;
        }
      } catch (err: any) {
        console.warn(`[CatchupRepo] PostgreSQL getUserProgress error: ${err.message}`);
      }
    }

    return this.memoryProgress.get(key) || null;
  }

  /**
   * Marks an event as reviewed by a user in a storyline.
   */
  public async markEventReviewed(
    userId: string,
    storylineId: string,
    eventId: string,
    allStorylineEventIds: string[] = []
  ): Promise<UserStorylineProgress> {
    const key = this.getProgressKey(userId, storylineId);
    let existing = await this.getUserProgress(userId, storylineId);

    const now = new Date().toISOString();
    const reviewedSet = new Set<string>(existing ? existing.reviewedEventIds : []);
    reviewedSet.add(eventId);

    const reviewedList = Array.from(reviewedSet);
    const isFullyCaughtUp =
      allStorylineEventIds.length > 0 &&
      allStorylineEventIds.every((eid) => reviewedSet.has(eid));

    const progress: UserStorylineProgress = {
      id: existing ? existing.id : crypto.randomUUID(),
      userId,
      storylineId,
      lastSeenEventId: eventId,
      reviewedEventIds: reviewedList,
      isFullyCaughtUp,
      lastReviewedAt: now,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.memoryProgress.set(key, progress);

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.user_storyline_progress (
            id, user_id, storyline_id, last_seen_event_id, reviewed_event_ids,
            is_fully_caught_up, last_reviewed_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
          )
          ON CONFLICT (user_id, storyline_id)
          DO UPDATE SET
            last_seen_event_id = EXCLUDED.last_seen_event_id,
            reviewed_event_ids = EXCLUDED.reviewed_event_ids,
            is_fully_caught_up = EXCLUDED.is_fully_caught_up,
            last_reviewed_at = EXCLUDED.last_reviewed_at,
            updated_at = NOW();
        `;
        const params = [
          progress.id,
          userId,
          storylineId,
          eventId,
          JSON.stringify(reviewedList),
          isFullyCaughtUp,
          now,
        ];
        await query(sql, params);
      } catch (err: any) {
        console.warn(`[CatchupRepo] PostgreSQL markEventReviewed error: ${err.message}`);
      }
    }

    // Invalidate user's personalized briefing cache on review update
    await this.invalidateBriefing(storylineId, userId);

    return progress;
  }
}

export const storylineCatchupRepository = new StorylineCatchupRepository();
