import { Router } from 'express';
import { DiagnosticsController } from '../controllers/diagnostics.controller.js';
import { requireInternalSecret } from '../middleware/auth.middleware.js';

const router = Router();

// Public lightweight health check
router.get('/health', DiagnosticsController.getHealth);

// Phase 16 Public System Health Telemetry & Diagnostic snapshots
router.get('/system-health', DiagnosticsController.getSystemHealth);
router.get('/schema-health', DiagnosticsController.getSchemaHealth);

// Protected operational diagnostics endpoint
router.get('/operational-health', requireInternalSecret, DiagnosticsController.getOperationalHealth);

export default router;
