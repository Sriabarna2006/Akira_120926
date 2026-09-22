/**
 * Offline Learning Cache Service (Phase 15I)
 * Provides indexed storage for user-owned daily briefings, saved events, and SM-2 flashcards
 * with transparent freshness indicators (never presenting stale cached data as live news).
 */

const CACHE_PREFIX = 'akira_offline_';

export interface CachedEnvelope<T> {
  data: T;
  cachedAt: string;
  expiresAt?: string;
  sourceVersion: string;
}

export const offlineCache = {
  /**
   * Checks current navigator network online status.
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  /**
   * Saves a data payload to the local offline envelope store.
   */
  async set<T>(key: string, data: T, ttlMinutes = 1440): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000).toISOString();
      const envelope: CachedEnvelope<T> = {
        data,
        cachedAt: now.toISOString(),
        expiresAt,
        sourceVersion: '0.1.0-phase15',
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(envelope));
    } catch (e) {
      console.warn('[OfflineCache] Local storage set error:', e);
    }
  },

  /**
   * Retrieves cached data with metadata.
   */
  async get<T>(key: string): Promise<{
    data: T;
    cachedAt: string;
    isOffline: boolean;
    ageMinutes: number;
    freshnessLabel: string;
  } | null> {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;

      const envelope: CachedEnvelope<T> = JSON.parse(raw);
      const cachedTime = new Date(envelope.cachedAt).getTime();
      const ageMinutes = Math.max(0, Math.floor((Date.now() - cachedTime) / (60 * 1000)));

      return {
        data: envelope.data,
        cachedAt: envelope.cachedAt,
        isOffline: !this.isOnline(),
        ageMinutes,
        freshnessLabel: this.formatFreshness(envelope.cachedAt),
      };
    } catch (e) {
      console.warn('[OfflineCache] Local storage get error:', e);
      return null;
    }
  },

  /**
   * Removes a specific item from offline cache.
   */
  async remove(key: string): Promise<void> {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  },

  /**
   * Formats a human-readable relative freshness label.
   */
  formatFreshness(cachedAtIso: string): string {
    const ageMs = Date.now() - new Date(cachedAtIso).getTime();
    const minutes = Math.floor(ageMs / (60 * 1000));
    if (minutes < 1) return 'Cached just now';
    if (minutes < 60) return `Cached ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Cached ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Cached ${days}d ago`;
  },
};
