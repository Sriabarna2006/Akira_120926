import { SourceRepository } from '../../repositories/source.repository.js';
import { Source, FeedQuarantineRecord, SourceErrorType } from '../../types/index.js';

export interface QuarantineDecision {
  shouldQuarantine: boolean;
  reason: string;
  retryIntervalMinutes: number;
}

export class QuarantineManager {
  private static instance: QuarantineManager;

  // Backoff schedule in minutes: 15m -> 60m -> 360m (6h) -> 1440m (24h)
  private readonly backoffScheduleMinutes = [15, 60, 360, 1440];

  private constructor() {}

  public static getInstance(): QuarantineManager {
    if (!QuarantineManager.instance) {
      QuarantineManager.instance = new QuarantineManager();
    }
    return QuarantineManager.instance;
  }

  /**
   * Evaluates whether a source should be placed in quarantine based on failure signals
   */
  public evaluateSource(
    source: Source,
    errorType: SourceErrorType,
    errorMessage: string
  ): QuarantineDecision {
    const consecutiveFailures = (source.consecutiveFailures || 0) + 1;

    // 1. Terminal / Persistent HTTP status errors (404, 410, 403)
    if (errorType === 'HTTP_404' || errorType === 'HTTP_403' || errorType === 'UNAUTHORIZED') {
      const retryMinutes = this.calculateBackoffMinutes(1);
      return {
        shouldQuarantine: true,
        reason: `${errorType}: ${errorMessage}`,
        retryIntervalMinutes: retryMinutes,
      };
    }

    // 2. High consecutive failure count (>= 5)
    if (consecutiveFailures >= 5) {
      const retryMinutes = this.calculateBackoffMinutes(Math.floor(consecutiveFailures / 5));
      return {
        shouldQuarantine: true,
        reason: `Consecutive failures exceeded threshold (${consecutiveFailures}): ${errorMessage}`,
        retryIntervalMinutes: retryMinutes,
      };
    }

    // 3. Persistent malformed XML
    if (errorType === 'XML_MALFORMED' && consecutiveFailures >= 3) {
      return {
        shouldQuarantine: true,
        reason: `Repeated XML parsing failures: ${errorMessage}`,
        retryIntervalMinutes: 60,
      };
    }

    return {
      shouldQuarantine: false,
      reason: '',
      retryIntervalMinutes: 0,
    };
  }

  /**
   * Calculate backoff interval based on consecutive quarantine count
   */
  public calculateBackoffMinutes(quarantineCount: number): number {
    const index = Math.min(Math.max(0, quarantineCount - 1), this.backoffScheduleMinutes.length - 1);
    return this.backoffScheduleMinutes[index];
  }

  /**
   * Applies quarantine to a source
   */
  public async quarantine(
    sourceId: string,
    reason: string,
    retryIntervalMinutes?: number
  ): Promise<void> {
    const minutes = retryIntervalMinutes || this.backoffScheduleMinutes[0];
    await SourceRepository.quarantineSource(sourceId, reason, minutes);
  }

  /**
   * Restores a source from quarantine
   */
  public async restore(sourceId: string): Promise<void> {
    await SourceRepository.restoreFromQuarantine(sourceId);
  }

  /**
   * Identifies all quarantined sources that are eligible for retry probes
   */
  public async getEligibleForRetry(): Promise<FeedQuarantineRecord[]> {
    const quarantined = await SourceRepository.getQuarantinedSources();
    const now = Date.now();

    return quarantined.filter((record) => {
      const retryTime = new Date(record.nextRetryAt).getTime();
      return now >= retryTime;
    });
  }

  /**
   * Gets all currently quarantined source records
   */
  public async getQuarantined(): Promise<FeedQuarantineRecord[]> {
    return SourceRepository.getQuarantinedSources();
  }
}

export const quarantineManager = QuarantineManager.getInstance();
