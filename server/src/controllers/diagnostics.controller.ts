import { Request, Response } from 'express';
import { isDatabaseConnected, getDatabaseState, getCircuitBreakerStats, getPoolDiagnostics } from '../db/dbClient.js';
import { newsIngestionService } from '../services/newsIngestion.service.js';
import { SourceRepository } from '../repositories/source.repository.js';
import { quarantineManager } from '../services/ingestion/quarantineManager.js';
import { categoryCoverageMonitor } from '../services/ingestion/coverageMonitor.js';
import { schemaVerifier } from '../db/schemaVerifier.js';
import { EventRepository } from '../repositories/event.repository.js';
import { SystemHealthStatus } from '../types/index.js';

export class DiagnosticsController {
  /**
   * Public lightweight health check endpoint.
   */
  public static async getHealth(req: Request, res: Response): Promise<void> {
    const isDbAlive = isDatabaseConnected();
    const dbState = getDatabaseState();
    const isVapidConfigured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) || process.env.NODE_ENV !== 'production';

    const status = isDbAlive ? 'healthy' : 'degraded';

    res.json({
      status,
      services: {
        database: dbState,
        newsPipeline: 'operational',
        webPush: isVapidConfigured ? 'ready' : 'missing_credentials',
      },
      timestamp: new Date().toISOString(),
      version: '0.1.0-phase16',
    });
  }

  /**
   * Protected operational diagnostics endpoint.
   */
  public static async getOperationalHealth(req: Request, res: Response): Promise<void> {
    try {
      const isDbAlive = isDatabaseConnected();
      const ingestionStats = await newsIngestionService.getOperationalHealth();
      const sourceHealthReport = await SourceRepository.getSourceHealthReport();
      const staleSources = await SourceRepository.findStaleSources(6);
      const quarantined = await quarantineManager.getQuarantined();

      res.json({
        status: isDbAlive ? 'healthy' : 'degraded',
        database: {
          connected: isDbAlive,
          state: getDatabaseState(),
          circuitBreaker: getCircuitBreakerStats(),
          engine: 'PostgreSQL/Neon',
        },
        ingestion: {
          isSyncing: ingestionStats.isSyncing,
          lastSyncTime: ingestionStats.lastSyncTime,
          lastSyncDurationMs: ingestionStats.lastSyncDurationMs,
          totalArticlesDiscovered: ingestionStats.totalArticlesDiscovered,
          totalArticlesAccepted: ingestionStats.totalArticlesAccepted,
          totalDuplicatesSuppressed: ingestionStats.totalDuplicatesSuppressed,
          totalEventsCreated: ingestionStats.totalEventsCreated,
          totalEventsUpdated: ingestionStats.totalEventsUpdated,
        },
        sources: {
          total: sourceHealthReport.totalSources,
          active: sourceHealthReport.activeSources,
          healthy: sourceHealthReport.healthySources,
          degraded: sourceHealthReport.degradedSources,
          stale: sourceHealthReport.staleSources,
          failing: sourceHealthReport.failingSources,
          disabled: sourceHealthReport.disabledSources,
          quarantinedCount: quarantined.length,
          quarantinedList: quarantined,
          staleSourcesList: staleSources.map((s) => ({
            id: s.id,
            name: s.name,
            expectedFreshnessHours: s.expectedFreshnessHours || 6,
            lastSuccessfulFetch: s.lastSuccessfulFetch,
            consecutiveFailures: s.consecutiveFailures || 0,
            healthStatus: s.healthStatus,
          })),
        },
        coverage: ingestionStats.coverage,
        webPush: {
          isConfigured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) || process.env.NODE_ENV !== 'production',
          subject: process.env.VAPID_SUBJECT || 'mailto:support@akira.ai',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        status: 'error',
        error: 'Failed to compile operational diagnostics',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * System Health Telemetry snapshot endpoint (Phase 16).
   */
  public static async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const dbState = getDatabaseState();
      const cbStats = getCircuitBreakerStats();
      const poolDiag = getPoolDiagnostics();
      const sourceHealth = await SourceRepository.getSourceHealthReport();
      const quarantined = await quarantineManager.getQuarantined();
      const coverage = await categoryCoverageMonitor.generateCoverageReport();
      const { total: activeEventsCount } = await EventRepository.findAll({ limit: 1 });
      const ingestion = newsIngestionService.getStatus();

      let overallStatus: SystemHealthStatus['overallStatus'] = 'OPTIMAL';
      if (dbState === 'CIRCUIT_OPEN' || dbState === 'DISCONNECTED') {
        overallStatus = 'CRITICAL';
      } else if (dbState === 'DEGRADED' || sourceHealth.failingSources > 5 || sourceHealth.staleSources > 5) {
        overallStatus = 'DEGRADED';
      }

      const systemHealth: SystemHealthStatus = {
        overallStatus,
        database: {
          state: dbState,
          circuitBreakerState: cbStats.state,
          totalPoolConnections: poolDiag.totalCount,
          activePoolConnections: poolDiag.totalCount - poolDiag.idleCount,
          lastErrorClassification: cbStats.lastErrorType,
        },
        sources: {
          total: sourceHealth.totalSources,
          healthy: sourceHealth.healthySources,
          degraded: sourceHealth.degradedSources,
          failing: sourceHealth.failingSources,
          quarantined: quarantined.length,
          disabled: sourceHealth.disabledSources,
        },
        ingestion: {
          isSyncing: ingestion.isSyncing,
          lastSyncTime: ingestion.lastSyncTime,
          lastDurationMs: ingestion.lastReport?.durationMs || 0,
          activeEventsCount,
        },
        coverage,
        timestamp: new Date().toISOString(),
        version: 'Phase 16 - Production Intelligence Expansion',
      };

      res.json(systemHealth);
    } catch (err: any) {
      res.status(500).json({
        status: 'error',
        error: 'Failed to generate system health telemetry',
        message: err.message,
      });
    }
  }

  /**
   * Schema Verification and Migration Integrity endpoint (Phase 16).
   */
  public static async getSchemaHealth(req: Request, res: Response): Promise<void> {
    try {
      const schemaReport = await schemaVerifier.verifySchema();
      res.json(schemaReport);
    } catch (err: any) {
      res.status(500).json({
        status: 'error',
        error: 'Failed to verify schema health',
        message: err.message,
      });
    }
  }
}
