import crypto from 'crypto';
import {
  Storyline,
  StorylineEventRelation,
  StorylineTurningPoint,
  StorylineFilterParams,
  StorylineStatus,
  StorylineTrajectoryDirection,
  StorylineRelationshipType,
} from '../types/index.js';
import { query, queryOne, isDatabaseConnected } from '../db/dbClient.js';
import { EventRepository } from './event.repository.js';

// Baseline Seed Storylines for Reliable Intelligence and Zero-Lag Testing
const DEFAULT_STORYLINES: Storyline[] = [
  {
    id: 'stl_tn_ev_corridor_2026',
    title: 'Tamil Nadu Clean Mobility & Regional Industrial Transit Corridor Evolution',
    summary: 'Chronological timeline of policy clearances, capital deployment, and transit infrastructure connecting Chennai-Hosur electric vehicle clusters.',
    status: 'ACTIVE',
    regionId: 'tamil-nadu',
    primaryCategoryId: 'infrastructure',
    region: 'Tamil Nadu',
    category: 'Infrastructure',
    startedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    currentEventId: 'evt_tn_ev_hub_2026',
    trajectory: 'DEVELOPING',
    eventCount: 2,
    turningPointCount: 1,
    metadata: { is_canonical_seed: true },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'stl_macro_rates_2026',
    title: 'Global Central Bank Monetary Policy & Interest Rate Trajectory Cycle',
    summary: 'Chronological tracking of central bank rate guidance, inflation metrics, and liquidity corridor adjustments across major economies.',
    status: 'ACTIVE',
    regionId: 'india',
    primaryCategoryId: 'economy',
    region: 'India',
    category: 'Economy',
    startedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    currentEventId: 'evt_macro_rates_2026',
    trajectory: 'STABLE',
    eventCount: 2,
    turningPointCount: 1,
    metadata: { is_canonical_seed: true },
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'stl_ai_semiconductor_2026',
    title: 'Next-Generation Sovereign Semiconductor & Sub-2nm AI Hardware Alliance',
    summary: 'Tracking consortium approvals, architectural standard definitions, and foundry roadmaps for optical AI accelerators.',
    status: 'EMERGING',
    regionId: 'world',
    primaryCategoryId: 'technology',
    region: 'Global',
    category: 'AI & Technology',
    startedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    currentEventId: 'evt_ai_semiconductor_2026',
    trajectory: 'DEVELOPING',
    eventCount: 1,
    turningPointCount: 1,
    metadata: { is_canonical_seed: true },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
];

const DEFAULT_STORYLINE_EVENTS: StorylineEventRelation[] = [
  {
    id: 'se_tn_001',
    storylineId: 'stl_tn_ev_corridor_2026',
    eventId: 'evt_tn_ev_hub_2026_origin',
    relationshipType: 'ORIGIN',
    sequenceOrder: 1,
    eventTime: new Date(Date.now() - 7 * 86400000).toISOString(),
    associationScore: 100,
    associationExplanation: 'Foundational state policy draft submitted for electric mobility transit corridors.',
    addedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'se_tn_002',
    storylineId: 'stl_tn_ev_corridor_2026',
    eventId: 'evt_tn_ev_hub_2026',
    relationshipType: 'DECISION',
    sequenceOrder: 2,
    eventTime: new Date(Date.now() - 4 * 3600000).toISOString(),
    associationScore: 96,
    associationExplanation: 'State Cabinet formally approved capital funding and high-speed metro linkages.',
    addedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'se_macro_001',
    storylineId: 'stl_macro_rates_2026',
    eventId: 'evt_macro_rates_2026_origin',
    relationshipType: 'ORIGIN',
    sequenceOrder: 1,
    eventTime: new Date(Date.now() - 14 * 86400000).toISOString(),
    associationScore: 100,
    associationExplanation: 'Initial central bank inflation print indicated shifting headline price pressures.',
    addedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'se_macro_002',
    storylineId: 'stl_macro_rates_2026',
    eventId: 'evt_macro_rates_2026',
    relationshipType: 'DECISION',
    sequenceOrder: 2,
    eventTime: new Date(Date.now() - 6 * 3600000).toISOString(),
    associationScore: 94,
    associationExplanation: 'Official rate-setting committee announced calibrated stance adjustment.',
    addedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'se_semi_001',
    storylineId: 'stl_ai_semiconductor_2026',
    eventId: 'evt_ai_semiconductor_2026',
    relationshipType: 'ORIGIN',
    sequenceOrder: 1,
    eventTime: new Date(Date.now() - 8 * 3600000).toISOString(),
    associationScore: 100,
    associationExplanation: 'Leading chipmakers announced international sub-2nm architectural standard consortium.',
    addedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

const DEFAULT_TURNING_POINTS: StorylineTurningPoint[] = [
  {
    id: 'tp_tn_001',
    storylineId: 'stl_tn_ev_corridor_2026',
    eventId: 'evt_tn_ev_hub_2026',
    title: 'Cabinet Formal Approval & Capital Outlay Commitment',
    reason: 'Turning point because an official state cabinet decision transitioned the initiative from proposal to funded execution.',
    turningPointType: 'OFFICIAL_DECISION',
    occurredAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'tp_macro_001',
    storylineId: 'stl_macro_rates_2026',
    eventId: 'evt_macro_rates_2026',
    title: 'Monetary Stance Shift Announcement',
    reason: 'Turning point because official central bank policy calibrated interest rate trajectory for the upcoming fiscal cycle.',
    turningPointType: 'OFFICIAL_DECISION',
    occurredAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'tp_semi_001',
    storylineId: 'stl_ai_semiconductor_2026',
    eventId: 'evt_ai_semiconductor_2026',
    title: 'Global Sub-2nm Consortium Formation',
    reason: 'Turning point establishing foundational international architecture standard for sovereign AI accelerators.',
    turningPointType: 'INITIATIVE_LAUNCH',
    occurredAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

// In-Memory Fallback Stores
let inMemoryStorylines: Storyline[] = [...DEFAULT_STORYLINES];
let inMemoryStorylineEvents: StorylineEventRelation[] = [...DEFAULT_STORYLINE_EVENTS];
let inMemoryTurningPoints: StorylineTurningPoint[] = [...DEFAULT_TURNING_POINTS];

export class StorylineRepository {
  // ============================================================================
  // 1. STORYLINE RETRIEVAL & FILTERING
  // ============================================================================

  public async findAll(params: StorylineFilterParams = {}): Promise<{ storylines: Storyline[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    if (isDatabaseConnected()) {
      try {
        const conditions: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (params.regionId && params.regionId.toUpperCase() !== 'ALL') {
          conditions.push(`s.region_id = $${idx++}`);
          values.push(params.regionId);
        }
        if (params.categoryId && params.categoryId.toUpperCase() !== 'ALL') {
          conditions.push(`s.primary_category_id = $${idx++}`);
          values.push(params.categoryId);
        }
        if (params.status) {
          conditions.push(`s.status = $${idx++}`);
          values.push(params.status);
        }
        if (params.trajectory) {
          conditions.push(`s.trajectory = $${idx++}`);
          values.push(params.trajectory);
        }
        if (params.search) {
          conditions.push(`(s.title ILIKE $${idx} OR s.summary ILIKE $${idx})`);
          values.push(`%${params.search}%`);
          idx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countSql = `SELECT COUNT(*)::int AS total FROM public.storylines s ${whereClause}`;
        const countRow = await queryOne<{ total: number }>(countSql, values);
        const total = countRow?.total || 0;

        const dataSql = `
          SELECT 
            s.id,
            s.title,
            s.summary,
            s.status,
            s.region_id as "regionId",
            s.primary_category_id as "primaryCategoryId",
            r.name as "region",
            c.name as "category",
            s.started_at as "startedAt",
            s.last_updated_at as "lastUpdatedAt",
            s.current_event_id as "currentEventId",
            s.trajectory,
            s.event_count as "eventCount",
            s.turning_point_count as "turningPointCount",
            s.metadata,
            s.created_at as "createdAt",
            s.updated_at as "updatedAt"
          FROM public.storylines s
          LEFT JOIN public.regions r ON s.region_id = r.id
          LEFT JOIN public.categories c ON s.primary_category_id = c.id
          ${whereClause}
          ORDER BY s.last_updated_at DESC, s.started_at DESC
          LIMIT $${idx++} OFFSET $${idx++}
        `;
        const rows = await query<Storyline>(dataSql, [...values, limit, offset]);
        if (rows && rows.length > 0) {
          return { storylines: rows, total };
        }
      } catch (err: any) {
        console.warn('[StorylineRepository] DB findAll notice:', err.message);
      }
    }

    // In-memory filtering
    let filtered = [...inMemoryStorylines];

    if (params.regionId && params.regionId.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((s) => s.regionId === params.regionId || s.region?.toLowerCase() === params.regionId?.toLowerCase());
    }
    if (params.categoryId && params.categoryId.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((s) => s.primaryCategoryId === params.categoryId || s.category?.toLowerCase() === params.categoryId?.toLowerCase());
    }
    if (params.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }
    if (params.trajectory) {
      filtered = filtered.filter((s) => s.trajectory === params.trajectory);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((s) => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return { storylines: paginated, total };
  }

  public async findById(id: string): Promise<Storyline | null> {
    if (!id) return null;

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            s.id,
            s.title,
            s.summary,
            s.status,
            s.region_id as "regionId",
            s.primary_category_id as "primaryCategoryId",
            r.name as "region",
            c.name as "category",
            s.started_at as "startedAt",
            s.last_updated_at as "lastUpdatedAt",
            s.current_event_id as "currentEventId",
            s.trajectory,
            s.event_count as "eventCount",
            s.turning_point_count as "turningPointCount",
            s.metadata,
            s.created_at as "createdAt",
            s.updated_at as "updatedAt"
          FROM public.storylines s
          LEFT JOIN public.regions r ON s.region_id = r.id
          LEFT JOIN public.categories c ON s.primary_category_id = c.id
          WHERE s.id = $1
        `;
        const row = await queryOne<Storyline>(sql, [id]);
        if (row) return row;
      } catch (err: any) {
        console.warn('[StorylineRepository] DB findById notice:', err.message);
      }
    }

    const found = inMemoryStorylines.find((s) => s.id === id);
    return found || null;
  }

  public async findByEventId(eventId: string): Promise<Storyline[]> {
    if (!eventId) return [];

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            s.id,
            s.title,
            s.summary,
            s.status,
            s.region_id as "regionId",
            s.primary_category_id as "primaryCategoryId",
            r.name as "region",
            c.name as "category",
            s.started_at as "startedAt",
            s.last_updated_at as "lastUpdatedAt",
            s.current_event_id as "currentEventId",
            s.trajectory,
            s.event_count as "eventCount",
            s.turning_point_count as "turningPointCount",
            s.metadata,
            s.created_at as "createdAt",
            s.updated_at as "updatedAt"
          FROM public.storyline_events se
          JOIN public.storylines s ON se.storyline_id = s.id
          LEFT JOIN public.regions r ON s.region_id = r.id
          LEFT JOIN public.categories c ON s.primary_category_id = c.id
          WHERE se.event_id = $1
          ORDER BY s.last_updated_at DESC
        `;
        const rows = await query<Storyline>(sql, [eventId]);
        if (rows && rows.length > 0) return rows;
      } catch (err: any) {
        console.warn('[StorylineRepository] DB findByEventId notice:', err.message);
      }
    }

    const relations = inMemoryStorylineEvents.filter((se) => se.eventId === eventId);
    const storylineIds = new Set(relations.map((r) => r.storylineId));
    return inMemoryStorylines.filter((s) => storylineIds.has(s.id));
  }

  // ============================================================================
  // 2. STORYLINE MUTATION & CREATION (Idempotent)
  // ============================================================================

  public async saveStoryline(
    storyline: Partial<Storyline> & { id: string; title: string; summary: string }
  ): Promise<Storyline> {
    const now = new Date().toISOString();
    const existing = inMemoryStorylines.find((s) => s.id === storyline.id);

    const fullRecord: Storyline = {
      id: storyline.id,
      title: storyline.title,
      summary: storyline.summary,
      status: storyline.status || existing?.status || 'ACTIVE',
      regionId: storyline.regionId || existing?.regionId,
      primaryCategoryId: storyline.primaryCategoryId || existing?.primaryCategoryId,
      region: storyline.region || existing?.region,
      category: storyline.category || existing?.category,
      startedAt: storyline.startedAt || existing?.startedAt || now,
      lastUpdatedAt: storyline.lastUpdatedAt || now,
      currentEventId: storyline.currentEventId || existing?.currentEventId,
      trajectory: storyline.trajectory || existing?.trajectory || 'DEVELOPING',
      eventCount: storyline.eventCount ?? existing?.eventCount ?? 1,
      turningPointCount: storyline.turningPointCount ?? existing?.turningPointCount ?? 0,
      metadata: storyline.metadata || existing?.metadata || {},
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.storylines (
            id, title, summary, status, region_id, primary_category_id,
            started_at, last_updated_at, current_event_id, trajectory,
            event_count, turning_point_count, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            summary = EXCLUDED.summary,
            status = EXCLUDED.status,
            region_id = EXCLUDED.region_id,
            primary_category_id = EXCLUDED.primary_category_id,
            last_updated_at = EXCLUDED.last_updated_at,
            current_event_id = EXCLUDED.current_event_id,
            trajectory = EXCLUDED.trajectory,
            event_count = EXCLUDED.event_count,
            turning_point_count = EXCLUDED.turning_point_count,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
          RETURNING *;
        `;
        await query(sql, [
          fullRecord.id,
          fullRecord.title,
          fullRecord.summary,
          fullRecord.status,
          fullRecord.regionId || null,
          fullRecord.primaryCategoryId || null,
          fullRecord.startedAt,
          fullRecord.lastUpdatedAt,
          fullRecord.currentEventId || null,
          fullRecord.trajectory,
          fullRecord.eventCount,
          fullRecord.turningPointCount,
          JSON.stringify(fullRecord.metadata),
          fullRecord.createdAt,
          fullRecord.updatedAt,
        ]);
      } catch (err: any) {
        console.warn('[StorylineRepository] DB saveStoryline notice:', err.message);
      }
    }

    const idx = inMemoryStorylines.findIndex((s) => s.id === fullRecord.id);
    if (idx >= 0) {
      inMemoryStorylines[idx] = fullRecord;
    } else {
      inMemoryStorylines.push(fullRecord);
    }

    return fullRecord;
  }

  // ============================================================================
  // 3. STORYLINE EVENT RELATIONS
  // ============================================================================

  public async addEventToStoryline(
    relation: Omit<StorylineEventRelation, 'id' | 'addedAt'> & { id?: string }
  ): Promise<StorylineEventRelation> {
    const id = relation.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const newRelation: StorylineEventRelation = {
      id,
      storylineId: relation.storylineId,
      eventId: relation.eventId,
      relationshipType: relation.relationshipType || 'DEVELOPMENT',
      sequenceOrder: relation.sequenceOrder || 1,
      eventTime: relation.eventTime || now,
      associationScore: relation.associationScore ?? 100,
      associationExplanation: relation.associationExplanation,
      addedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.storyline_events (
            id, storyline_id, event_id, relationship_type, sequence_order,
            event_time, association_score, association_explanation, added_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (storyline_id, event_id) DO UPDATE SET
            relationship_type = EXCLUDED.relationship_type,
            sequence_order = EXCLUDED.sequence_order,
            event_time = EXCLUDED.event_time,
            association_score = EXCLUDED.association_score,
            association_explanation = EXCLUDED.association_explanation
          RETURNING *;
        `;
        await query(sql, [
          newRelation.id,
          newRelation.storylineId,
          newRelation.eventId,
          newRelation.relationshipType,
          newRelation.sequenceOrder,
          newRelation.eventTime,
          newRelation.associationScore,
          newRelation.associationExplanation || null,
          now,
        ]);
      } catch (err: any) {
        console.warn('[StorylineRepository] DB addEventToStoryline notice:', err.message);
      }
    }

    const existingIdx = inMemoryStorylineEvents.findIndex(
      (r) => r.storylineId === newRelation.storylineId && r.eventId === newRelation.eventId
    );
    if (existingIdx >= 0) {
      inMemoryStorylineEvents[existingIdx] = newRelation;
    } else {
      inMemoryStorylineEvents.push(newRelation);
    }

    // Refresh storyline event count and latest update time
    const events = inMemoryStorylineEvents.filter((e) => e.storylineId === newRelation.storylineId);
    events.sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());

    // Update sequence orders deterministically
    events.forEach((ev, idx) => {
      ev.sequenceOrder = idx + 1;
    });

    const storyline = inMemoryStorylines.find((s) => s.id === newRelation.storylineId);
    if (storyline && events.length > 0) {
      storyline.eventCount = events.length;
      storyline.startedAt = events[0].eventTime;
      storyline.lastUpdatedAt = events[events.length - 1].eventTime;
      storyline.currentEventId = events[events.length - 1].eventId;
    }

    return newRelation;
  }

  public async getStorylineEvents(storylineId: string): Promise<StorylineEventRelation[]> {
    if (!storylineId) return [];

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            storyline_id as "storylineId",
            event_id as "eventId",
            relationship_type as "relationshipType",
            sequence_order as "sequenceOrder",
            event_time as "eventTime",
            association_score as "associationScore",
            association_explanation as "associationExplanation",
            added_at as "addedAt"
          FROM public.storyline_events
          WHERE storyline_id = $1
          ORDER BY event_time ASC, sequence_order ASC
        `;
        const rows = await query<StorylineEventRelation>(sql, [storylineId]);
        if (rows && rows.length > 0) return rows;
      } catch (err: any) {
        console.warn('[StorylineRepository] DB getStorylineEvents notice:', err.message);
      }
    }

    const events = inMemoryStorylineEvents.filter((r) => r.storylineId === storylineId);
    return [...events].sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());
  }

  // ============================================================================
  // 4. TURNING POINTS
  // ============================================================================

  public async getTurningPoints(storylineId: string): Promise<StorylineTurningPoint[]> {
    if (!storylineId) return [];

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            storyline_id as "storylineId",
            event_id as "eventId",
            title,
            reason,
            turning_point_type as "turningPointType",
            occurred_at as "occurredAt",
            created_at as "createdAt"
          FROM public.storyline_turning_points
          WHERE storyline_id = $1
          ORDER BY occurred_at ASC
        `;
        const rows = await query<StorylineTurningPoint>(sql, [storylineId]);
        if (rows && rows.length > 0) return rows;
      } catch (err: any) {
        console.warn('[StorylineRepository] DB getTurningPoints notice:', err.message);
      }
    }

    const tps = inMemoryTurningPoints.filter((tp) => tp.storylineId === storylineId);
    return [...tps].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }

  public async saveTurningPoint(
    tp: Omit<StorylineTurningPoint, 'id' | 'createdAt'> & { id?: string }
  ): Promise<StorylineTurningPoint> {
    const id = tp.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record: StorylineTurningPoint = {
      id,
      storylineId: tp.storylineId,
      eventId: tp.eventId,
      title: tp.title,
      reason: tp.reason,
      turningPointType: tp.turningPointType || 'OFFICIAL_DECISION',
      occurredAt: tp.occurredAt || now,
      createdAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.storyline_turning_points (
            id, storyline_id, event_id, title, reason, turning_point_type, occurred_at, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (storyline_id, event_id) DO UPDATE SET
            title = EXCLUDED.title,
            reason = EXCLUDED.reason,
            turning_point_type = EXCLUDED.turning_point_type,
            occurred_at = EXCLUDED.occurred_at
          RETURNING *;
        `;
        await query(sql, [
          record.id,
          record.storylineId,
          record.eventId,
          record.title,
          record.reason,
          record.turningPointType,
          record.occurredAt,
          record.createdAt,
        ]);
      } catch (err: any) {
        console.warn('[StorylineRepository] DB saveTurningPoint notice:', err.message);
      }
    }

    const idx = inMemoryTurningPoints.findIndex(
      (p) => p.storylineId === record.storylineId && p.eventId === record.eventId
    );
    if (idx >= 0) {
      inMemoryTurningPoints[idx] = record;
    } else {
      inMemoryTurningPoints.push(record);
    }

    // Update storyline turningPointCount
    const sl = inMemoryStorylines.find((s) => s.id === record.storylineId);
    if (sl) {
      sl.turningPointCount = inMemoryTurningPoints.filter((p) => p.storylineId === record.storylineId).length;
    }

    return record;
  }

  public async updateStorylineTrajectory(
    storylineId: string,
    trajectory: StorylineTrajectoryDirection,
    status?: StorylineStatus,
    currentEventId?: string
  ): Promise<void> {
    const sl = inMemoryStorylines.find((s) => s.id === storylineId);
    if (sl) {
      sl.trajectory = trajectory;
      if (status) sl.status = status;
      if (currentEventId) sl.currentEventId = currentEventId;
      sl.updatedAt = new Date().toISOString();
    }

    if (isDatabaseConnected()) {
      try {
        const sql = `
          UPDATE public.storylines 
          SET trajectory = $2, 
              status = COALESCE($3, status), 
              current_event_id = COALESCE($4, current_event_id),
              updated_at = NOW()
          WHERE id = $1;
        `;
        await query(sql, [storylineId, trajectory, status || null, currentEventId || null]);
      } catch (err: any) {
        console.warn('[StorylineRepository] DB updateStorylineTrajectory notice:', err.message);
      }
    }
  }

  // ============================================================================
  // 5. TEST & RESET UTILITIES
  // ============================================================================

  public clearMemoryStore(): void {
    inMemoryStorylines = [];
    inMemoryStorylineEvents = [];
    inMemoryTurningPoints = [];
  }

  public resetToDefaults(): void {
    inMemoryStorylines = [...DEFAULT_STORYLINES];
    inMemoryStorylineEvents = [...DEFAULT_STORYLINE_EVENTS];
    inMemoryTurningPoints = [...DEFAULT_TURNING_POINTS];
  }
}

export const storylineRepository = new StorylineRepository();
