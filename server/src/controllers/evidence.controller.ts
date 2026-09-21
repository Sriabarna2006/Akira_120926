import { Request, Response, NextFunction } from 'express';
import { evidenceService } from '../services/evidence/evidence.service.js';
import { evidenceRepository } from '../repositories/evidence.repository.js';
import { ApiResponseHelper } from '../utils/response.js';

export class EvidenceController {
  // ============================================================================
  // 1. EVENT EVIDENCE ENDPOINTS
  // ============================================================================

  public static async getEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const summary = await evidenceService.getEvidenceSummary(id);
      ApiResponseHelper.sendSuccess(res, summary);
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
      } else {
        next(err);
      }
    }
  }

  public static async getSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const sources = await evidenceService.getSourceProvenance(id);
      ApiResponseHelper.sendSuccess(res, sources);
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
      } else {
        next(err);
      }
    }
  }

  public static async getConflicts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const conflicts = await evidenceService.getEventConflicts(id);
      ApiResponseHelper.sendSuccess(res, conflicts);
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        ApiResponseHelper.sendError(res, 'EVENT_NOT_FOUND', err.message, 404);
      } else {
        next(err);
      }
    }
  }

  // ============================================================================
  // 2. SOURCE HEALTH ENDPOINTS
  // ============================================================================

  public static async getSourceHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const health = await evidenceRepository.getSourceHealth(id);
      if (!health) {
        ApiResponseHelper.sendError(res, 'SOURCE_NOT_FOUND', `Source '${id}' not found.`, 404);
        return;
      }
      ApiResponseHelper.sendSuccess(res, health);
    } catch (err) {
      next(err);
    }
  }

  public static async getAllSourceHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await evidenceRepository.getAllSourceHealthReports();
      ApiResponseHelper.sendSuccess(res, reports);
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 3. ADMIN / INTERNAL EVIDENCE MUTATION
  // ============================================================================

  public static async recordEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { articleId, sourceId, sourceName, evidenceType, sourceAuthorityTier, isIndependent, verificationMetadata } = req.body;

      const saved = await evidenceRepository.saveEvidence({
        eventId: id,
        articleId,
        sourceId,
        sourceName: sourceName || sourceId || 'Verified Publisher',
        evidenceType: evidenceType || 'INDEPENDENT_REPORTING',
        sourceAuthorityTier: sourceAuthorityTier || 2,
        isIndependent: isIndependent ?? true,
        evidenceTimestamp: new Date().toISOString(),
        evidenceStatus: 'ACTIVE',
        verificationMetadata,
      });

      ApiResponseHelper.sendSuccess(res, saved, undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async recordConflict(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { field, sourceA, sourceB, valueA, valueB, severity, explanation } = req.body;

      const saved = await evidenceRepository.saveConflict({
        eventId: id,
        field: field || 'factual_detail',
        sourceA: sourceA || 'Source A',
        sourceB: sourceB || 'Source B',
        valueA: String(valueA),
        valueB: String(valueB),
        severity: severity || 'LOW',
        status: 'UNRESOLVED',
        explanation,
        detectedAt: new Date().toISOString(),
      });

      ApiResponseHelper.sendSuccess(res, saved, undefined, 201);
    } catch (err) {
      next(err);
    }
  }
}
