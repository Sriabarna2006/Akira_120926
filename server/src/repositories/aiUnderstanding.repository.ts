import { 
  EventAISummaryRecord, 
  EventExplanationRecord, 
  EventQuizRecord, 
  ExtractedConcept, 
  ExplanationLevel,
  QuizQuestion 
} from '../types/index.js';
import { query, queryOne, isDatabaseConnected } from '../db/dbClient.js';
import crypto from 'crypto';

// In-Memory Fallback Stores for when DB is unavailable
const inMemorySummaries = new Map<string, EventAISummaryRecord>();
const inMemoryExplanations = new Map<string, EventExplanationRecord>(); // key: `${eventId}:${level}:v${version}`
const inMemoryQuizzes = new Map<string, EventQuizRecord>();
const inMemoryConcepts = new Map<string, ExtractedConcept>(); // key: conceptId
const inMemoryEventConcepts = new Map<string, string[]>(); // key: eventId -> conceptIds[]
const inMemoryPrerequisites = new Map<string, string[]>(); // key: conceptId -> prerequisiteIds[]

export class AIUnderstandingRepository {
  // ============================================================================
  // 1. 5W1H SUMMARIES
  // ============================================================================

  public async getSummaryByEventId(eventId: string, version: number = 1): Promise<EventAISummaryRecord | null> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            event_id as "eventId",
            version,
            provider,
            model,
            five_w_one_h as "fiveWOneH",
            status,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.event_ai_summaries
          WHERE event_id = $1 AND version = $2
          ORDER BY version DESC
          LIMIT 1
        `;
        const row = await queryOne<any>(sql, [eventId, version]);
        if (row) {
          const fiveW = typeof row.fiveWOneH === 'string' ? JSON.parse(row.fiveWOneH) : row.fiveWOneH;
          return {
            id: row.id,
            eventId: row.eventId,
            version: row.version,
            provider: row.provider,
            model: row.model,
            fiveWOneH: fiveW,
            status: row.status,
            createdAt: row.createdAt?.toISOString?.() || row.createdAt,
            updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
          };
        }
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB getSummary failed, fallback to memory:`, err.message);
      }
    }

    const key = `${eventId}:v${version}`;
    return inMemorySummaries.get(key) || null;
  }

  public async saveSummary(summary: Omit<EventAISummaryRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<EventAISummaryRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: EventAISummaryRecord = {
      id,
      eventId: summary.eventId,
      version: summary.version,
      provider: summary.provider,
      model: summary.model,
      fiveWOneH: summary.fiveWOneH,
      status: summary.status,
      createdAt: now,
      updatedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.event_ai_summaries (
            id, event_id, version, provider, model, five_w_one_h, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (event_id, version) DO UPDATE SET
            provider = EXCLUDED.provider,
            model = EXCLUDED.model,
            five_w_one_h = EXCLUDED.five_w_one_h,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at
          RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
        `;
        const res = await queryOne<any>(sql, [
          id,
          summary.eventId,
          summary.version,
          summary.provider,
          summary.model,
          JSON.stringify(summary.fiveWOneH),
          summary.status,
          now,
          now
        ]);
        if (res) {
          record.id = res.id;
          record.createdAt = res.createdAt?.toISOString?.() || res.createdAt;
          record.updatedAt = res.updatedAt?.toISOString?.() || res.updatedAt;
        }
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB saveSummary failed, saving in memory:`, err.message);
      }
    }

    const key = `${summary.eventId}:v${summary.version}`;
    inMemorySummaries.set(key, record);
    return record;
  }

  // ============================================================================
  // 2. MULTI-LEVEL EXPLANATIONS
  // ============================================================================

  public async getExplanationsByEventId(eventId: string, version: number = 1): Promise<EventExplanationRecord[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            event_id as "eventId",
            level,
            content,
            provider,
            model,
            version,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.event_explanations
          WHERE event_id = $1 AND version = $2
          ORDER BY created_at ASC
        `;
        const rows = await query<any>(sql, [eventId, version]);
        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            eventId: r.eventId,
            level: r.level as ExplanationLevel,
            content: r.content,
            provider: r.provider,
            model: r.model,
            version: r.version,
            createdAt: r.createdAt?.toISOString?.() || r.createdAt,
            updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
          }));
        }
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB getExplanations failed, fallback to memory:`, err.message);
      }
    }

    const results: EventExplanationRecord[] = [];
    const levels: ExplanationLevel[] = ['verySimple', 'beginner', 'student', 'technical', 'deepDive'];
    for (const lvl of levels) {
      const rec = inMemoryExplanations.get(`${eventId}:${lvl}:v${version}`);
      if (rec) results.push(rec);
    }
    return results;
  }

  public async getExplanationByLevel(eventId: string, level: ExplanationLevel, version: number = 1): Promise<EventExplanationRecord | null> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            event_id as "eventId",
            level,
            content,
            provider,
            model,
            version,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.event_explanations
          WHERE event_id = $1 AND level = $2 AND version = $3
          LIMIT 1
        `;
        const row = await queryOne<any>(sql, [eventId, level, version]);
        if (row) {
          return {
            id: row.id,
            eventId: row.eventId,
            level: row.level as ExplanationLevel,
            content: row.content,
            provider: row.provider,
            model: row.model,
            version: row.version,
            createdAt: row.createdAt?.toISOString?.() || row.createdAt,
            updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
          };
        }
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB getExplanationByLevel failed, fallback to memory:`, err.message);
      }
    }

    return inMemoryExplanations.get(`${eventId}:${level}:v${version}`) || null;
  }

  public async saveExplanation(explanation: Omit<EventExplanationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<EventExplanationRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: EventExplanationRecord = {
      id,
      eventId: explanation.eventId,
      level: explanation.level,
      content: explanation.content,
      provider: explanation.provider,
      model: explanation.model,
      version: explanation.version,
      createdAt: now,
      updatedAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.event_explanations (
            id, event_id, level, content, provider, model, version, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (event_id, level, version) DO UPDATE SET
            content = EXCLUDED.content,
            provider = EXCLUDED.provider,
            model = EXCLUDED.model,
            updated_at = EXCLUDED.updated_at
          RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
        `;
        const res = await queryOne<any>(sql, [
          id,
          explanation.eventId,
          explanation.level,
          explanation.content,
          explanation.provider,
          explanation.model,
          explanation.version,
          now,
          now
        ]);
        if (res) {
          record.id = res.id;
          record.createdAt = res.createdAt?.toISOString?.() || res.createdAt;
          record.updatedAt = res.updatedAt?.toISOString?.() || res.updatedAt;
        }
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB saveExplanation failed, saving in memory:`, err.message);
      }
    }

    const key = `${explanation.eventId}:${explanation.level}:v${explanation.version}`;
    inMemoryExplanations.set(key, record);
    return record;
  }

  // ============================================================================
  // 3. EXTRACTED CONCEPTS & PREREQUISITES
  // ============================================================================

  public async getConceptsByEventId(eventId: string): Promise<ExtractedConcept[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            c.id,
            c.title,
            c.slug,
            c.category_id as "category",
            c.short_definition as "shortDefinition",
            c.full_explanation as "whyItMatters",
            c.prerequisites
          FROM public.event_concepts ec
          JOIN public.concepts c ON ec.concept_id = c.id
          WHERE ec.event_id = $1
        `;
        const rows = await query<any>(sql, [eventId]);
        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            category: r.category,
            shortDefinition: r.shortDefinition,
            whyItMatters: r.whyItMatters,
            prerequisites: typeof r.prerequisites === 'string' ? JSON.parse(r.prerequisites) : (r.prerequisites || []),
          }));
        }
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB getConcepts failed, fallback to memory:`, err.message);
      }
    }

    const conceptIds = inMemoryEventConcepts.get(eventId) || [];
    const concepts: ExtractedConcept[] = [];
    for (const cid of conceptIds) {
      const c = inMemoryConcepts.get(cid);
      if (c) {
        const prereqs = inMemoryPrerequisites.get(cid) || c.prerequisites || [];
        concepts.push({ ...c, prerequisites: prereqs });
      }
    }
    return concepts;
  }

  public async saveConcepts(eventId: string, concepts: ExtractedConcept[]): Promise<void> {
    if (!concepts || concepts.length === 0) return;

    if (isDatabaseConnected()) {
      try {
        for (const c of concepts) {
          const conceptSql = `
            INSERT INTO public.concepts (
              id, title, slug, category_id, short_definition, full_explanation, prerequisites
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              short_definition = EXCLUDED.short_definition,
              full_explanation = EXCLUDED.full_explanation,
              prerequisites = EXCLUDED.prerequisites,
              updated_at = NOW()
          `;
          await query(conceptSql, [
            c.id,
            c.title,
            c.slug || c.id,
            c.category || 'general',
            c.shortDefinition,
            c.whyItMatters || c.shortDefinition,
            JSON.stringify(c.prerequisites || [])
          ]);

          const eventConceptSql = `
            INSERT INTO public.event_concepts (event_id, concept_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `;
          await query(eventConceptSql, [eventId, c.id]);

          if (c.prerequisites && c.prerequisites.length > 0) {
            for (const prereqId of c.prerequisites) {
              const prereqUpsertSql = `
                INSERT INTO public.concepts (id, title, slug, category_id, short_definition, full_explanation, prerequisites)
                VALUES ($1, $2, $3, $4, $5, $6, '[]'::jsonb)
                ON CONFLICT (id) DO NOTHING
              `;
              await query(prereqUpsertSql, [
                prereqId,
                prereqId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                prereqId,
                c.category || 'general',
                `Foundational concept prerequisite for ${c.title}.`,
                `Prerequisite background knowledge required for understanding ${c.title}.`
              ]);

              const prereqSql = `
                INSERT INTO public.concept_prerequisites (concept_id, prerequisite_concept_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
              `;
              await query(prereqSql, [c.id, prereqId]);
            }
          }
        }
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB saveConcepts failed, saving in memory:`, err.message);
      }
    }

    const currentConceptIds = inMemoryEventConcepts.get(eventId) || [];
    for (const c of concepts) {
      inMemoryConcepts.set(c.id, c);
      if (!currentConceptIds.includes(c.id)) {
        currentConceptIds.push(c.id);
      }
      if (c.prerequisites && c.prerequisites.length > 0) {
        inMemoryPrerequisites.set(c.id, c.prerequisites);
        for (const p of c.prerequisites) {
          if (!inMemoryConcepts.has(p)) {
            inMemoryConcepts.set(p, {
              id: p,
              title: p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              slug: p,
              shortDefinition: `Foundational concept prerequisite for ${c.title}.`,
              whyItMatters: `Prerequisite background knowledge required for understanding ${c.title}.`,
              category: c.category || 'general',
              prerequisites: []
            });
          }
        }
      }
    }
    inMemoryEventConcepts.set(eventId, currentConceptIds);
  }

  // ============================================================================
  // 4. EVENT QUIZZES
  // ============================================================================

  public async getQuizByEventId(eventId: string, version: number = 1): Promise<EventQuizRecord | null> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            event_id as "eventId",
            version,
            questions,
            provider,
            model,
            created_at as "createdAt"
          FROM public.event_quizzes
          WHERE event_id = $1 AND version = $2
          ORDER BY version DESC
          LIMIT 1
        `;
        const row = await queryOne<any>(sql, [eventId, version]);
        if (row) {
          const qs = typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions;
          return {
            id: row.id,
            eventId: row.eventId,
            version: row.version,
            questions: qs as QuizQuestion[],
            provider: row.provider,
            model: row.model,
            createdAt: row.createdAt?.toISOString?.() || row.createdAt,
          };
        }
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB getQuiz failed, fallback to memory:`, err.message);
      }
    }

    return inMemoryQuizzes.get(`${eventId}:v${version}`) || null;
  }

  public async saveQuiz(quiz: Omit<EventQuizRecord, 'id' | 'createdAt'>): Promise<EventQuizRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: EventQuizRecord = {
      id,
      eventId: quiz.eventId,
      version: quiz.version,
      questions: quiz.questions,
      provider: quiz.provider,
      model: quiz.model,
      createdAt: now,
    };

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.event_quizzes (
            id, event_id, version, questions, provider, model, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (event_id, version) DO UPDATE SET
            questions = EXCLUDED.questions,
            provider = EXCLUDED.provider,
            model = EXCLUDED.model
          RETURNING id, created_at as "createdAt"
        `;
        const res = await queryOne<any>(sql, [
          id,
          quiz.eventId,
          quiz.version,
          JSON.stringify(quiz.questions),
          quiz.provider,
          quiz.model,
          now
        ]);
        if (res) {
          record.id = res.id;
          record.createdAt = res.createdAt?.toISOString?.() || res.createdAt;
        }
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB saveQuiz failed, saving in memory:`, err.message);
      }
    }

    const key = `${quiz.eventId}:v${quiz.version}`;
    inMemoryQuizzes.set(key, record);
    return record;
  }

  // ============================================================================
  // 5. CACHE INVALIDATION / REFRESH
  // ============================================================================

  public async deleteByEventId(eventId: string): Promise<void> {
    if (isDatabaseConnected()) {
      try {
        await query(`DELETE FROM public.event_ai_summaries WHERE event_id = $1`, [eventId]);
        await query(`DELETE FROM public.event_explanations WHERE event_id = $1`, [eventId]);
        await query(`DELETE FROM public.event_quizzes WHERE event_id = $1`, [eventId]);
        await query(`DELETE FROM public.event_concepts WHERE event_id = $1`, [eventId]);
      } catch (err: any) {
        console.warn(`[AIUnderstandingRepository] DB deleteByEventId error:`, err.message);
      }
    }

    for (const k of Array.from(inMemorySummaries.keys())) {
      if (k.startsWith(`${eventId}:`)) inMemorySummaries.delete(k);
    }
    for (const k of Array.from(inMemoryExplanations.keys())) {
      if (k.startsWith(`${eventId}:`)) inMemoryExplanations.delete(k);
    }
    for (const k of Array.from(inMemoryQuizzes.keys())) {
      if (k.startsWith(`${eventId}:`)) inMemoryQuizzes.delete(k);
    }
    inMemoryEventConcepts.delete(eventId);
  }
}

export const aiUnderstandingRepository = new AIUnderstandingRepository();
