import crypto from 'crypto';
import {
  EvidenceRecord,
  EvidenceConflict,
  SourceHealthReport,
  EvidenceType,
  ConflictSeverity,
  ConflictStatus,
  SourceType,
  SourceHealthStatus,
} from '../types/index.js';
import { query, queryOne, isDatabaseConnected } from '../db/dbClient.js';
import { SourceRepository } from './source.repository.js';

// In-Memory Fallback Stores
const inMemoryEvidence: EvidenceRecord[] = [];
const inMemoryConflicts: EvidenceConflict[] = [];
const inMemorySourceHealth = new Map<string, SourceHealthReport>();

export class EvidenceRepository {
  // ============================================================================
  // 1. EVENT EVIDENCE RECORDS
  // ============================================================================

  public async saveEvidence(
    record: Omit<EvidenceRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<EvidenceRecord> {
    const id = record.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const newEvidence: EvidenceRecord = {
      id,
      eventId: record.eventId,
      articleId: record.articleId,
      sourceId: record.sourceId,
      sourceName: record.sourceName,
      evidenceType: record.evidenceType || 'INDEPENDENT_REPORTING',
      sourceAuthorityTier: record.sourceAuthorityTier || 2,
      isIndependent: record.isIndependent ?? true,
      evidenceTimestamp: record.evidenceTimestamp || now,
      evidenceStatus: record.evidenceStatus || 'ACTIVE',
      verificationMetadata: record.verificationMetadata || {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.event_evidence (
            id, event_id, article_id, source_id, source_name,
            evidence_type, source_authority_tier, is_independent,
            evidence_timestamp, evidence_status, verification_metadata,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (event_id, source_id, article_id) DO UPDATE SET
            evidence_type = EXCLUDED.evidence_type,
            source_authority_tier = EXCLUDED.source_authority_tier,
            is_independent = EXCLUDED.is_independent,
            evidence_timestamp = EXCLUDED.evidence_timestamp,
            evidence_status = EXCLUDED.evidence_status,
            verification_metadata = EXCLUDED.verification_metadata,
            updated_at = NOW()
          RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
        `;
        const row = await queryOne<any>(sql, [
          newEvidence.id,
          newEvidence.eventId,
          newEvidence.articleId || null,
          newEvidence.sourceId || null,
          newEvidence.sourceName,
          newEvidence.evidenceType,
          newEvidence.sourceAuthorityTier,
          newEvidence.isIndependent,
          newEvidence.evidenceTimestamp,
          newEvidence.evidenceStatus,
          JSON.stringify(newEvidence.verificationMetadata),
          now,
          now,
        ]);
        if (row) {
          newEvidence.id = row.id;
          newEvidence.createdAt = row.createdAt?.toISOString?.() || row.createdAt;
          newEvidence.updatedAt = row.updatedAt?.toISOString?.() || row.updatedAt;
        }
      } catch (err: any) {
        console.warn('[EvidenceRepository] DB saveEvidence notice:', err.message);
      }
    }

    const idx = inMemoryEvidence.findIndex(
      (e) =>
        e.eventId === newEvidence.eventId &&
        e.sourceId === newEvidence.sourceId &&
        e.articleId === newEvidence.articleId
    );

    if (idx >= 0) {
      inMemoryEvidence[idx] = newEvidence;
    } else {
      inMemoryEvidence.push(newEvidence);
    }

    return newEvidence;
  }

  public async getEvidenceByEventId(eventId: string): Promise<EvidenceRecord[]> {
    if (!eventId) return [];

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            event_id as "eventId",
            article_id as "articleId",
            source_id as "sourceId",
            source_name as "sourceName",
            evidence_type as "evidenceType",
            source_authority_tier as "sourceAuthorityTier",
            is_independent as "isIndependent",
            evidence_timestamp as "evidenceTimestamp",
            evidence_status as "evidenceStatus",
            verification_metadata as "verificationMetadata",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.event_evidence
          WHERE event_id = $1
          ORDER BY source_authority_tier ASC, evidence_timestamp DESC
        `;
        const rows = await query<any>(sql, [eventId]);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            eventId: r.eventId,
            articleId: r.articleId || undefined,
            sourceId: r.sourceId || undefined,
            sourceName: r.sourceName,
            evidenceType: r.evidenceType as EvidenceType,
            sourceAuthorityTier: Number(r.sourceAuthorityTier),
            isIndependent: Boolean(r.isIndependent),
            evidenceTimestamp: r.evidenceTimestamp?.toISOString?.() || r.evidenceTimestamp,
            evidenceStatus: r.evidenceStatus,
            verificationMetadata: typeof r.verificationMetadata === 'string' ? JSON.parse(r.verificationMetadata) : r.verificationMetadata || {},
            createdAt: r.createdAt?.toISOString?.() || r.createdAt,
            updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
          }));
        }
      } catch (err: any) {
        console.warn('[EvidenceRepository] DB getEvidenceByEventId notice:', err.message);
      }
    }

    return inMemoryEvidence.filter((e) => e.eventId === eventId);
  }

  // ============================================================================
  // 2. EVIDENCE CONFLICTS
  // ============================================================================

  public async saveConflict(
    conflict: Omit<EvidenceConflict, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<EvidenceConflict> {
    const id = conflict.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const newConflict: EvidenceConflict = {
      id,
      eventId: conflict.eventId,
      field: conflict.field,
      sourceA: conflict.sourceA,
      sourceB: conflict.sourceB,
      valueA: conflict.valueA,
      valueB: conflict.valueB,
      severity: conflict.severity || 'LOW',
      status: conflict.status || 'UNRESOLVED',
      explanation: conflict.explanation,
      detectedAt: conflict.detectedAt || now,
      createdAt: now,
      updatedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.evidence_conflicts (
            id, event_id, field, source_a, source_b,
            value_a, value_b, severity, status, explanation,
            detected_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
        `;
        const row = await queryOne<any>(sql, [
          newConflict.id,
          newConflict.eventId,
          newConflict.field,
          newConflict.sourceA,
          newConflict.sourceB,
          newConflict.valueA,
          newConflict.valueB,
          newConflict.severity,
          newConflict.status,
          newConflict.explanation || null,
          newConflict.detectedAt,
          now,
          now,
        ]);
        if (row) {
          newConflict.id = row.id;
          newConflict.createdAt = row.createdAt?.toISOString?.() || newConflict.createdAt;
          newConflict.updatedAt = row.updatedAt?.toISOString?.() || newConflict.updatedAt;
        }
      } catch (err: any) {
        console.warn('[EvidenceRepository] DB saveConflict notice:', err.message);
      }
    }

    inMemoryConflicts.push(newConflict);
    return newConflict;
  }

  public async getConflictsByEventId(eventId: string): Promise<EvidenceConflict[]> {
    if (!eventId) return [];

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            event_id as "eventId",
            field,
            source_a as "sourceA",
            source_b as "sourceB",
            value_a as "valueA",
            value_b as "valueB",
            severity,
            status,
            explanation,
            detected_at as "detectedAt",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.evidence_conflicts
          WHERE event_id = $1
          ORDER BY detected_at DESC
        `;
        const rows = await query<any>(sql, [eventId]);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            eventId: r.eventId,
            field: r.field,
            sourceA: r.sourceA,
            sourceB: r.sourceB,
            valueA: r.valueA,
            valueB: r.valueB,
            severity: r.severity as ConflictSeverity,
            status: r.status as ConflictStatus,
            explanation: r.explanation || undefined,
            detectedAt: r.detectedAt?.toISOString?.() || r.detectedAt,
            createdAt: r.createdAt?.toISOString?.() || r.createdAt,
            updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
          }));
        }
      } catch (err: any) {
        console.warn('[EvidenceRepository] DB getConflictsByEventId notice:', err.message);
      }
    }

    return inMemoryConflicts.filter((c) => c.eventId === eventId);
  }

  // ============================================================================
  // 3. SOURCE HEALTH INTELLIGENCE
  // ============================================================================

  public async getSourceHealth(sourceId: string): Promise<SourceHealthReport | null> {
    if (!sourceId) return null;
    const cleanId = sourceId.trim().toLowerCase();

    // Check in-memory first if set
    if (inMemorySourceHealth.has(cleanId)) {
      return inMemorySourceHealth.get(cleanId)!;
    }

    // Lookup base source
    const sources = await SourceRepository.findAll({ includeInactive: true });
    const s = sources.find((src) => src.id.toLowerCase() === cleanId);
    if (!s) return null;

    const report: SourceHealthReport = {
      sourceId: s.id,
      sourceName: s.name,
      sourceType: (s.sourceType as SourceType) || (s.id.includes('pib') || s.id.includes('gov') ? 'GOVERNMENT' : s.id.includes('reuters') || s.id.includes('bbc') ? 'WIRE' : s.id.includes('tech') || s.id.includes('bleep') || s.id.includes('science') ? 'SPECIALIST' : 'NATIONAL'),
      tier: s.tier,
      isActive: s.isActive,
      healthStatus: s.failureCount >= 5 ? 'DOWN' : s.failureCount > 0 ? 'DEGRADED' : 'HEALTHY',
      failureCount: s.failureCount || 0,
      consecutiveFailures: s.consecutiveFailures || s.failureCount || 0,
      lastSuccessfulFetch: s.lastSuccessfulFetch,
      lastFailedFetch: s.lastFailedFetch,
      updateFrequencyMinutes: s.updateFrequencyMinutes || 3,
    };

    inMemorySourceHealth.set(cleanId, report);
    return report;
  }

  public async getAllSourceHealthReports(): Promise<SourceHealthReport[]> {
    const sources = await SourceRepository.findAll({ includeInactive: true });
    const reports: SourceHealthReport[] = [];

    for (const s of sources) {
      const existing = inMemorySourceHealth.get(s.id.toLowerCase());
      if (existing) {
        reports.push(existing);
      } else {
        const rep: SourceHealthReport = {
          sourceId: s.id,
          sourceName: s.name,
          sourceType: (s.sourceType as SourceType) || (s.id.includes('pib') || s.id.includes('gov') ? 'GOVERNMENT' : s.id.includes('reuters') || s.id.includes('bbc') ? 'WIRE' : s.id.includes('tech') || s.id.includes('bleep') || s.id.includes('science') ? 'SPECIALIST' : 'NATIONAL'),
          tier: s.tier,
          isActive: s.isActive,
          healthStatus: s.failureCount >= 5 ? 'DOWN' : s.failureCount > 0 ? 'DEGRADED' : 'HEALTHY',
          failureCount: s.failureCount || 0,
          consecutiveFailures: s.consecutiveFailures || s.failureCount || 0,
          lastSuccessfulFetch: s.lastSuccessfulFetch,
          lastFailedFetch: s.lastFailedFetch,
          updateFrequencyMinutes: s.updateFrequencyMinutes || 3,
        };
        inMemorySourceHealth.set(s.id.toLowerCase(), rep);
        reports.push(rep);
      }
    }

    return reports;
  }

  public async updateSourceHealth(
    sourceId: string,
    updates: Partial<SourceHealthReport>
  ): Promise<SourceHealthReport> {
    const existing = (await this.getSourceHealth(sourceId)) || {
      sourceId,
      sourceName: sourceId,
      sourceType: 'NATIONAL',
      tier: 2,
      isActive: true,
      healthStatus: 'HEALTHY',
      failureCount: 0,
      consecutiveFailures: 0,
      updateFrequencyMinutes: 3,
    };

    const updated: SourceHealthReport = {
      ...existing,
      ...updates,
      sourceId,
    };

    inMemorySourceHealth.set(sourceId.toLowerCase(), updated);
    return updated;
  }

  public clearMemoryStore(): void {
    inMemoryEvidence.length = 0;
    inMemoryConflicts.length = 0;
    inMemorySourceHealth.clear();
  }
}

export const evidenceRepository = new EvidenceRepository();
