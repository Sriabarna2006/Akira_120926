import { newsIngestionService } from '../newsIngestion.service.js';

class IngestionScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private intervalMinutes: number;

  constructor() {
    const parsedMinutes = parseInt(process.env.INGESTION_INTERVAL_MINUTES || '15', 10);
    this.intervalMinutes = isNaN(parsedMinutes) || parsedMinutes < 2 ? 15 : parsedMinutes;
  }

  /**
   * Starts periodic news feed ingestion in background.
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
    console.log(`[IngestionScheduler] Starting periodic ingestion every ${this.intervalMinutes} minutes.`);

    // Optional immediate initial sync with safe error handling
    if (process.env.RUN_INITIAL_SYNC === 'true') {
      this.triggerImmediateSync().catch((err) => {
        console.warn('[IngestionScheduler] Initial sync warning:', err.message);
      });
    }

    const intervalMs = this.intervalMinutes * 60 * 1000;
    this.timer = setInterval(async () => {
      await this.triggerImmediateSync();
    }, intervalMs);
  }

  /**
   * Triggers an immediate ingestion run safely.
   */
  public async triggerImmediateSync() {
    try {
      console.log('[IngestionScheduler] Executing scheduled ingestion cycle...');
      const report = await newsIngestionService.runIngestion();
      console.log(`[IngestionScheduler] Cycle complete in ${report.durationMs}ms: Discovered=${report.articlesDiscovered}, Accepted=${report.articlesAccepted}, Dupes=${report.duplicatesSkipped}, EventsCreated=${report.eventsCreated}, EventsUpdated=${report.eventsUpdated}`);
      return report;
    } catch (err: any) {
      console.error('[IngestionScheduler] Scheduled ingestion encountered an error:', err.message);
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
    this.isRunning = false;
    console.log('[IngestionScheduler] Ingestion scheduler stopped.');
  }
}

export const ingestionScheduler = new IngestionScheduler();
