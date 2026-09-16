import { newsIngestionService } from '../newsIngestion.service.js';
import { RankingService } from '../ranking/rankingService.js';

class IngestionScheduler {
  private timer: NodeJS.Timeout | null = null;
  private rankingTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private intervalMinutes: number;
  private rankingIntervalMinutes: number;

  constructor() {
    const parsedMinutes = parseInt(process.env.INGESTION_INTERVAL_MINUTES || '15', 10);
    this.intervalMinutes = isNaN(parsedMinutes) || parsedMinutes < 2 ? 15 : parsedMinutes;

    const parsedRankMinutes = parseInt(process.env.TREND_REFRESH_INTERVAL_MINUTES || '5', 10);
    this.rankingIntervalMinutes = isNaN(parsedRankMinutes) || parsedRankMinutes < 1 ? 5 : parsedRankMinutes;
  }

  /**
   * Starts periodic news feed ingestion and ranking score refresh in background.
   */
  public start(): void {
    if (this.isRunning) {
      console.log('[IngestionScheduler] Ingestion scheduler is already running.');
      return;
    }

    if (process.env.NODE_ENV === 'test') {
      console.log('[IngestionScheduler] Disabled automatic scheduler during test mode.');
      return;
    }

    this.isRunning = true;
    console.log(`[IngestionScheduler] Starting periodic ingestion every ${this.intervalMinutes}m and ranking refresh every ${this.rankingIntervalMinutes}m.`);

    // Automatic initial sync on server boot with safe error handling
    setTimeout(() => {
      this.triggerImmediateSync().catch((err) => {
        console.warn('[IngestionScheduler] Initial sync warning:', err.message);
      });
    }, 2000);


    const intervalMs = this.intervalMinutes * 60 * 1000;
    this.timer = setInterval(async () => {
      await this.triggerImmediateSync();
    }, intervalMs);

    const rankIntervalMs = this.rankingIntervalMinutes * 60 * 1000;
    this.rankingTimer = setInterval(async () => {
      await this.triggerScoreRefresh();
    }, rankIntervalMs);
  }

  /**
   * Triggers an immediate ingestion run safely and refreshes scores.
   */
  public async triggerImmediateSync() {
    try {
      console.log('[IngestionScheduler] Executing scheduled ingestion cycle...');
      const report = await newsIngestionService.runIngestion();
      console.log(`[IngestionScheduler] Cycle complete in ${report.durationMs}ms: Discovered=${report.articlesDiscovered}, Accepted=${report.articlesAccepted}, Dupes=${report.duplicatesSkipped}, EventsCreated=${report.eventsCreated}, EventsUpdated=${report.eventsUpdated}`);
      
      // Refresh ranking scores after ingestion
      await RankingService.refreshScores();
      return report;
    } catch (err: any) {
      console.error('[IngestionScheduler] Scheduled ingestion encountered an error:', err.message);
    }
  }

  /**
   * Triggers an immediate ranking score refresh safely.
   */
  public async triggerScoreRefresh() {
    try {
      return await RankingService.refreshScores();
    } catch (err: any) {
      console.error('[IngestionScheduler] Scheduled ranking refresh encountered an error:', err.message);
    }
  }

  /**
   * Stops the background scheduler gracefully.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.rankingTimer) {
      clearInterval(this.rankingTimer);
      this.rankingTimer = null;
    }
    this.isRunning = false;
    console.log('[IngestionScheduler] Ingestion scheduler stopped.');
  }
}


export const ingestionScheduler = new IngestionScheduler();
