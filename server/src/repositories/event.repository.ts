import { CanonicalEvent, EventSource, Article, TrendObservation, RankingMetadata, UrgencyLabel } from '../types/index.js';
import { query, queryOne } from '../db/dbClient.js';
import { supabaseAdmin, isSupabaseConfigured } from '../db/supabase.js';

let inMemoryObservations: TrendObservation[] = [];

// Safe development reference canonical events
const DEFAULT_EVENTS: CanonicalEvent[] = [
  {
    id: 'evt_tn_ev_hub_2026',
    title: 'Tamil Nadu Cabinet Clears Mega Infrastructure & Electric Mobility Corridor Policy',
    summary: 'State government approves capital investment framework expanding metro transit links across Chennai and Hosur EV manufacturing hub.',
    regionId: 'tamil-nadu',
    categoryId: 'infrastructure',
    urgencyLabel: 'IMPORTANT',
    importanceScore: 94,
    velocityScore: 90,
    finalRankScore: 96,
    whyItMatters: 'Accelerates high-speed regional transit corridors and strengthens clean mobility industrial employment in Tamil Nadu.',
    firstPublishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    sourceCount: 2,
    lifecycleStatus: 'OFFICIAL_CONFIRMATION',
    metadata: { is_dev_sample: true },
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    sources: [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        eventId: 'evt_tn_ev_hub_2026',
        sourceId: 'the-hindu-tn',
        sourceName: 'The Hindu (Tamil Nadu)',
        title: 'TN Cabinet gives nod to industrial corridor expansion and EV battery parks',
        url: 'https://www.thehindu.com/news/national/tamil-nadu/ev-corridor-policy-2026',
        snippet: 'The State Cabinet on Monday approved a dedicated infrastructure fund to boost EV manufacturing clusters in Hosur and Coimbatore.',
        publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        tier: 1,
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'a0000000-0000-0000-0000-000000000002',
        eventId: 'evt_tn_ev_hub_2026',
        sourceId: 'toi',
        sourceName: 'Times of India',
        title: 'Tamil Nadu launches multi-modal transit links for industrial hubs',
        url: 'https://timesofindia.indiatimes.com/city/chennai/tn-transit-ev-policy-2026',
        snippet: 'New rail and expressway linkages cleared to integrate industrial corridors across the state.',
        publishedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        tier: 2,
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: 'evt_macro_rates_2026',
    title: 'Reserve Bank of India & Global Central Banks Shift Monetary Policy Stance',
    summary: 'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
    regionId: 'india',
    categoryId: 'economy',
    urgencyLabel: 'IMPORTANT',
    importanceScore: 92,
    velocityScore: 88,
    finalRankScore: 94,
    whyItMatters: 'Directly shapes retail borrowing costs, investment decisions, and capital market valuations across sectors.',
    firstPublishedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    sourceCount: 2,
    lifecycleStatus: 'OFFICIAL_CONFIRMATION',
    metadata: { is_dev_sample: true },
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    sources: [
      {
        id: 'a0000000-0000-0000-0000-000000000003',
        eventId: 'evt_macro_rates_2026',
        sourceId: 'economic-times',
        sourceName: 'The Economic Times',
        title: 'RBI signals calibrated transition in monetary liquidity policy',
        url: 'https://economictimes.indiatimes.com/news/economy/policy/rbi-monetary-policy-2026',
        snippet: 'Central bank outlines steady glidepath for headline inflation while maintaining financial stability.',
        publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        tier: 1,
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: 'evt_ai_semiconductor_2026',
    title: 'Next-Generation Semiconductor Consortium Announces Global Fab Initiative',
    summary: 'Leading chipmakers and research universities unveil sub-2nm architectural standard for high-throughput AI accelerator silicon.',
    regionId: 'world',
    categoryId: 'technology',
    urgencyLabel: 'IMPORTANT',
    importanceScore: 88,
    velocityScore: 82,
    finalRankScore: 90,
    whyItMatters: 'Defines standard architectures for data center AI workloads and next-generation sovereign computing infrastructure.',
    firstPublishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    sourceCount: 2,
    lifecycleStatus: 'NEW_DEVELOPMENT',
    metadata: { is_dev_sample: true },
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    sources: [
      {
        id: 'a0000000-0000-0000-0000-000000000004',
        eventId: 'evt_ai_semiconductor_2026',
        sourceId: 'techcrunch',
        sourceName: 'TechCrunch',
        title: 'Semiconductor giants form new alliance for sub-2nm AI accelerator hardware',
        url: 'https://techcrunch.com/2026/09/12/sub-2nm-ai-hardware-consortium',
        snippet: 'Consortium aims to standardize ultra-low latency optical interconnects for next-generation neural processors.',
        publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
        tier: 2,
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
    ],
  },
];

let inMemoryEvents: CanonicalEvent[] = [...DEFAULT_EVENTS];

export interface EventFilterParams {
  regionId?: string;
  categoryId?: string;
  urgency?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const isTestMode = process.env.NODE_ENV === 'test' || process.argv.some((a) => a.includes('test'));

export class EventRepository {
  static async findAll(params: EventFilterParams = {}): Promise<{ events: CanonicalEvent[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    if (!isTestMode) {
      try {
        const conditions: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (params.regionId && params.regionId.toUpperCase() !== 'ALL') {
          conditions.push(`(e.region_id = $${idx} OR r.slug = $${idx})`);
          values.push(params.regionId);
          idx++;
        }
        if (params.categoryId && params.categoryId.toUpperCase() !== 'ALL') {
          conditions.push(`(e.category_id = $${idx} OR c.slug = $${idx})`);
          values.push(params.categoryId);
          idx++;
        }
        if (params.urgency && params.urgency.toUpperCase() !== 'ALL') {
          conditions.push(`e.urgency_label = $${idx++}`);
          values.push(params.urgency);
        }
        if (params.search) {
          conditions.push(`(e.title ILIKE $${idx} OR e.summary ILIKE $${idx})`);
          values.push(`%${params.search}%`);
          idx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countSql = `
          SELECT COUNT(*)::int AS total
          FROM public.canonical_events e
          LEFT JOIN public.regions r ON e.region_id = r.id
          LEFT JOIN public.categories c ON e.category_id = c.id
          ${whereClause};
        `;
        const countRow = await queryOne<{ total: number }>(countSql, values);
        const total = countRow?.total || 0;

        const dataSql = `
          SELECT 
            e.id, e.title, e.summary, e.region_id AS "regionId", e.category_id AS "categoryId",
            e.urgency_label AS "urgencyLabel", e.importance_score AS "importanceScore",
            e.velocity_score AS "velocityScore", e.final_rank_score AS "finalRankScore",
            e.why_it_matters AS "whyItMatters", e.first_published_at AS "firstPublishedAt",
            e.last_updated_at AS "lastUpdatedAt", e.source_count AS "sourceCount",
            e.lifecycle_status AS "lifecycleStatus", e.metadata, e.created_at AS "createdAt"
          FROM public.canonical_events e
          LEFT JOIN public.regions r ON e.region_id = r.id
          LEFT JOIN public.categories c ON e.category_id = c.id
          ${whereClause}
          ORDER BY e.first_published_at DESC, e.last_updated_at DESC, e.final_rank_score DESC
          LIMIT $${idx++} OFFSET $${idx++};
        `;
        const rows = await query<CanonicalEvent>(dataSql, [...values, limit, offset]);

        if (rows && rows.length > 0) {
          // Fast single-batch fetch for all corroborating sources
          const eventIds = rows.map((r) => r.id);
          const sourcesSql = `
            SELECT 
              id, event_id AS "eventId", source_id AS "sourceId", source_name AS "sourceName",
              title, url, snippet, published_at AS "publishedAt", tier, created_at AS "createdAt"
            FROM public.event_sources
            WHERE event_id = ANY($1::text[])
            ORDER BY tier ASC, published_at DESC;
          `;
          const allSources = await query<EventSource>(sourcesSql, [eventIds]);
          const sourcesByEvent = new Map<string, EventSource[]>();
          for (const s of allSources) {
            if (!sourcesByEvent.has(s.eventId)) {
              sourcesByEvent.set(s.eventId, []);
            }
            sourcesByEvent.get(s.eventId)!.push(s);
          }

          for (const ev of rows) {
            ev.sources = sourcesByEvent.get(ev.id) || [];
          }
          return { events: rows, total };
        }
      } catch (err) {
        console.warn('[EventRepository] DB query failed, using fallback:', (err as Error).message);
      }
    }

    if (isSupabaseConfigured && supabaseAdmin && process.env.NODE_ENV !== 'test') {
      try {
        let q = supabaseAdmin.from('canonical_events').select('*', { count: 'exact' });
        if (params.regionId && params.regionId.toUpperCase() !== 'ALL') q = q.eq('region_id', params.regionId);
        if (params.categoryId && params.categoryId.toUpperCase() !== 'ALL') q = q.eq('category_id', params.categoryId);
        if (params.urgency && params.urgency.toUpperCase() !== 'ALL') q = q.eq('urgency_label', params.urgency);
        if (params.search) q = q.ilike('title', `%${params.search}%`);

        const { data, count, error } = await q
          .order('final_rank_score', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data && data.length > 0) {
          const events: CanonicalEvent[] = data.map((e: any) => ({
            id: e.id,
            title: e.title,
            summary: e.summary,
            regionId: e.region_id,
            categoryId: e.category_id,
            urgencyLabel: e.urgency_label,
            importanceScore: e.importance_score,
            velocityScore: e.velocity_score,
            finalRankScore: e.final_rank_score,
            whyItMatters: e.why_it_matters,
            firstPublishedAt: e.first_published_at,
            lastUpdatedAt: e.last_updated_at,
            sourceCount: e.source_count,
            lifecycleStatus: e.lifecycle_status,
            metadata: e.metadata,
            createdAt: e.created_at,
          }));

          for (const ev of events) {
            ev.sources = await this.findSourcesByEventId(ev.id);
          }

          return { events, total: count || data.length };
        }
      } catch (err) {
        console.warn('[EventRepository] Supabase query notice:', (err as Error).message);
      }
    }

    let filtered = [...inMemoryEvents].sort((a, b) => new Date(b.firstPublishedAt || b.createdAt || 0).getTime() - new Date(a.firstPublishedAt || a.createdAt || 0).getTime());

    if (params.regionId && params.regionId.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((e) => e.regionId?.toLowerCase() === params.regionId?.toLowerCase());
    }
    if (params.categoryId && params.categoryId.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((e) => e.categoryId?.toLowerCase() === params.categoryId?.toLowerCase());
    }
    if (params.urgency && params.urgency.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((e) => e.urgencyLabel === params.urgency);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(s) || e.summary.toLowerCase().includes(s));
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    return { events: paginated, total };
  }

  static async findById(id: string): Promise<CanonicalEvent | null> {
    try {
      const sql = `
        SELECT 
          e.id, e.title, e.summary, e.region_id AS "regionId", e.category_id AS "categoryId",
          e.urgency_label AS "urgencyLabel", e.importance_score AS "importanceScore",
          e.velocity_score AS "velocityScore", e.final_rank_score AS "finalRankScore",
          e.why_it_matters AS "whyItMatters", e.first_published_at AS "firstPublishedAt",
          e.last_updated_at AS "lastUpdatedAt", e.source_count AS "sourceCount",
          e.lifecycle_status AS "lifecycleStatus", e.metadata, e.created_at AS "createdAt"
        FROM public.canonical_events e
        WHERE e.id = $1
        LIMIT 1;
      `;
      const row = await queryOne<CanonicalEvent>(sql, [id]);
      if (row) {
        row.sources = await this.findSourcesByEventId(row.id);
        row.articles = await this.findArticlesByEventId(row.id);
        return row;
      }
    } catch (err) {
      console.warn('[EventRepository] DB findById error:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin && process.env.NODE_ENV !== 'test') {
      try {
        const { data, error } = await supabaseAdmin.from('canonical_events').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          const ev: CanonicalEvent = {
            id: data.id,
            title: data.title,
            summary: data.summary,
            regionId: data.region_id,
            categoryId: data.category_id,
            urgencyLabel: data.urgency_label,
            importanceScore: data.importance_score,
            velocityScore: data.velocity_score,
            finalRankScore: data.final_rank_score,
            whyItMatters: data.why_it_matters,
            firstPublishedAt: data.first_published_at,
            lastUpdatedAt: data.last_updated_at,
            sourceCount: data.source_count,
            lifecycleStatus: data.lifecycle_status,
            metadata: data.metadata,
            createdAt: data.created_at,
          };
          ev.sources = await this.findSourcesByEventId(ev.id);
          ev.articles = await this.findArticlesByEventId(ev.id);
          return ev;
        }
      } catch (err) {
        console.warn('[EventRepository] Supabase findById notice:', (err as Error).message);
      }
    }

    const local = inMemoryEvents.find((e) => e.id === id);
    return local || null;
  }

  static async findSourcesByEventId(eventId: string): Promise<EventSource[]> {
    try {
      const sql = `
        SELECT 
          id, event_id AS "eventId", source_id AS "sourceId", source_name AS "sourceName",
          title, url, snippet, published_at AS "publishedAt", tier, created_at AS "createdAt"
        FROM public.event_sources
        WHERE event_id = $1
        ORDER BY tier ASC, published_at DESC;
      `;
      const rows = await query<EventSource>(sql, [eventId]);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn('[EventRepository] DB findSourcesByEventId error:', (err as Error).message);
    }

    const local = inMemoryEvents.find((e) => e.id === eventId);
    return local?.sources || [];
  }

  static async findArticlesByEventId(eventId: string): Promise<Article[]> {
    try {
      const sql = `
        SELECT 
          a.id, a.source_id AS "sourceId", s.name AS "sourceName", a.event_id AS "eventId",
          a.title, a.url, a.content_snippet AS "contentSnippet", a.published_at AS "publishedAt",
          a.region_id AS "regionId", a.category_id AS "categoryId", a.created_at AS "createdAt"
        FROM public.articles a
        LEFT JOIN public.sources s ON a.source_id = s.id
        WHERE a.event_id = $1
        ORDER BY a.published_at DESC;
      `;
      const rows = await query<Article>(sql, [eventId]);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn('[EventRepository] DB findArticlesByEventId error:', (err as Error).message);
    }
    return [];
  }

  static async create(event: Omit<CanonicalEvent, 'createdAt'>): Promise<CanonicalEvent> {
    const newEvent: CanonicalEvent = {
      ...event,
      createdAt: new Date().toISOString(),
    };

    try {
      const sql = `
        INSERT INTO public.canonical_events (
          id, title, summary, region_id, category_id, urgency_label,
          importance_score, velocity_score, final_rank_score, why_it_matters,
          first_published_at, last_updated_at, source_count, lifecycle_status, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          why_it_matters = EXCLUDED.why_it_matters,
          final_rank_score = EXCLUDED.final_rank_score,
          last_updated_at = EXCLUDED.last_updated_at,
          source_count = EXCLUDED.source_count
        RETURNING 
          id, title, summary, region_id AS "regionId", category_id AS "categoryId",
          urgency_label AS "urgencyLabel", importance_score AS "importanceScore",
          velocity_score AS "velocityScore", final_rank_score AS "finalRankScore",
          why_it_matters AS "whyItMatters", first_published_at AS "firstPublishedAt",
          last_updated_at AS "lastUpdatedAt", source_count AS "sourceCount",
          lifecycle_status AS "lifecycleStatus", metadata, created_at AS "createdAt";
      `;
      const rows = await query<CanonicalEvent>(sql, [
        newEvent.id,
        newEvent.title,
        newEvent.summary,
        newEvent.regionId || null,
        newEvent.categoryId || null,
        newEvent.urgencyLabel || 'IMPORTANT',
        newEvent.importanceScore || 70,
        newEvent.velocityScore || 50,
        newEvent.finalRankScore || 60,
        newEvent.whyItMatters || null,
        newEvent.firstPublishedAt || new Date().toISOString(),
        newEvent.lastUpdatedAt || new Date().toISOString(),
        newEvent.sourceCount || 1,
        newEvent.lifecycleStatus || 'INITIAL_REPORT',
        JSON.stringify(newEvent.metadata || {}),
      ]);
      inMemoryEvents = inMemoryEvents.filter((e) => e.id !== newEvent.id);
      inMemoryEvents.push(newEvent);

      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn('[EventRepository] DB insert error:', (err as Error).message);
    }

    inMemoryEvents = inMemoryEvents.filter((e) => e.id !== newEvent.id);
    inMemoryEvents.push(newEvent);
    return newEvent;
  }

  static async findRecentEventsForMatching(
    regionId?: string,
    categoryId?: string,
    maxAgeHours = 36
  ): Promise<CanonicalEvent[]> {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 3600 * 1000).toISOString();

    try {
      const conditions: string[] = ['(first_published_at >= $1 OR last_updated_at >= $1)'];
      const values: any[] = [cutoffTime];
      let idx = 2;

      if (regionId) {
        conditions.push(`region_id = $${idx++}`);
        values.push(regionId);
      }

      const sql = `
        SELECT 
          id, title, summary, region_id AS "regionId", category_id AS "categoryId",
          urgency_label AS "urgencyLabel", importance_score AS "importanceScore",
          velocity_score AS "velocityScore", final_rank_score AS "finalRankScore",
          why_it_matters AS "whyItMatters", first_published_at AS "firstPublishedAt",
          last_updated_at AS "lastUpdatedAt", source_count AS "sourceCount",
          lifecycle_status AS "lifecycleStatus", metadata, created_at AS "createdAt"
        FROM public.canonical_events
        WHERE ${conditions.join(' AND ')}
        ORDER BY last_updated_at DESC
        LIMIT 50;
      `;
      const rows = await query<CanonicalEvent>(sql, values);
      if (rows && rows.length > 0) {
        const eventIds = rows.map((r) => r.id);
        const sourcesSql = `
          SELECT 
            id, event_id AS "eventId", source_id AS "sourceId", source_name AS "sourceName",
            title, url, snippet, published_at AS "publishedAt", tier, created_at AS "createdAt"
          FROM public.event_sources
          WHERE event_id = ANY($1::text[])
          ORDER BY tier ASC, published_at DESC;
        `;
        const allSources = await query<EventSource>(sourcesSql, [eventIds]);
        const sourcesByEvent = new Map<string, EventSource[]>();
        for (const s of allSources) {
          if (!sourcesByEvent.has(s.eventId)) {
            sourcesByEvent.set(s.eventId, []);
          }
          sourcesByEvent.get(s.eventId)!.push(s);
        }

        for (const ev of rows) {
          ev.sources = sourcesByEvent.get(ev.id) || [];
        }
        return rows;
      }
    } catch (err) {
      console.warn('[EventRepository] DB findRecentEventsForMatching error:', (err as Error).message);
    }

    const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;
    return inMemoryEvents.filter((e) => {
      const eventTime = new Date(e.lastUpdatedAt || e.firstPublishedAt).getTime();
      if (eventTime < cutoffMs) return false;
      if (regionId && e.regionId !== regionId) return false;
      return true;
    });
  }

  static async attachArticleToEvent(
    eventId: string,
    article: Article,
    sourceName: string,
    tier = 2
  ): Promise<void> {
    const now = new Date().toISOString();

    try {
      // 1. Insert or update event_sources safely
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM public.event_sources WHERE event_id = $1 AND url = $2 LIMIT 1;`,
        [eventId, article.url]
      );

      if (existing) {
        const updateSourceSql = `
          UPDATE public.event_sources
          SET published_at = $1, snippet = $2
          WHERE id = $3;
        `;
        await query(updateSourceSql, [
          article.publishedAt || now,
          article.contentSnippet || null,
          existing.id,
        ]);
      } else {
        const insertSourceSql = `
          INSERT INTO public.event_sources (
            event_id, source_id, source_name, title, url, snippet, published_at, tier
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `;
        await query(insertSourceSql, [
          eventId,
          article.sourceId || null,
          sourceName,
          article.title,
          article.url,
          article.contentSnippet || null,
          article.publishedAt || now,
          tier,
        ]);
      }

      // 2. Update canonical_events timestamp and source_count
      const updateEventSql = `
        UPDATE public.canonical_events
        SET 
          last_updated_at = $1,
          source_count = (
            SELECT COUNT(DISTINCT source_name)::int 
            FROM public.event_sources 
            WHERE event_id = $2
          )
        WHERE id = $2;
      `;
      await query(updateEventSql, [now, eventId]);

      // 3. Link article to event
      const linkArticleSql = `UPDATE public.articles SET event_id = $1 WHERE id = $2;`;
      await query(linkArticleSql, [eventId, article.id]);
    } catch (err) {
      console.warn('[EventRepository] DB attachArticleToEvent error:', (err as Error).message);
    }

    // In-memory fallback updates
    const localEvent = inMemoryEvents.find((e) => e.id === eventId);
    if (localEvent) {
      if (!localEvent.sources) localEvent.sources = [];
      const alreadyHas = localEvent.sources.some((s) => s.url === article.url);
      if (!alreadyHas) {
        localEvent.sources.push({
          id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          eventId,
          sourceId: article.sourceId,
          sourceName,
          title: article.title,
          url: article.url,
          snippet: article.contentSnippet,
          publishedAt: article.publishedAt,
          tier,
          createdAt: now,
        });
      }
      const distinctSources = new Set(localEvent.sources.map((s) => s.sourceName)).size;
      localEvent.sourceCount = distinctSources;
      localEvent.lastUpdatedAt = now;
    }
  }

  static async updateScores(
    eventId: string,
    scores: {
      urgencyLabel?: UrgencyLabel;
      importanceScore?: number;
      velocityScore?: number;
      finalRankScore?: number;
      trendScore?: number;
    },
    metadata?: RankingMetadata
  ): Promise<void> {
    try {
      const sql = `
        UPDATE public.canonical_events
        SET 
          urgency_label = COALESCE($1, urgency_label),
          importance_score = COALESCE($2, importance_score),
          velocity_score = COALESCE($3, velocity_score),
          final_rank_score = COALESCE($4, final_rank_score),
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{ranking}',
            $5::jsonb,
            true
          )
        WHERE id = $6;
      `;
      await query(sql, [
        scores.urgencyLabel || null,
        scores.importanceScore ?? null,
        scores.velocityScore ?? null,
        scores.finalRankScore ?? null,
        JSON.stringify(metadata || {}),
        eventId,
      ]);
    } catch (err) {
      console.warn('[EventRepository] DB updateScores error:', (err as Error).message);
    }

    const local = inMemoryEvents.find((e) => e.id === eventId);
    if (local) {
      if (scores.urgencyLabel) local.urgencyLabel = scores.urgencyLabel;
      if (scores.importanceScore !== undefined) local.importanceScore = scores.importanceScore;
      if (scores.velocityScore !== undefined) local.velocityScore = scores.velocityScore;
      if (scores.finalRankScore !== undefined) local.finalRankScore = scores.finalRankScore;
      if (scores.trendScore !== undefined) local.trendScore = scores.trendScore;
      if (metadata) {
        local.rankingMetadata = metadata;
        local.metadata = { ...(local.metadata || {}), ranking: metadata };
      }
    }
  }

  static async recordTrendObservation(observation: TrendObservation): Promise<void> {
    const obs: TrendObservation = {
      ...observation,
      id: observation.id || `obs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      observedAt: observation.observedAt || new Date().toISOString(),
    };

    try {
      const sql = `
        INSERT INTO public.trend_observations (
          event_id, observed_at, article_count, independent_source_count,
          trend_score, importance_score, velocity_score, coverage_score,
          recency_score, freshness_score, spread_score, final_rank_score
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
      `;
      await query(sql, [
        obs.eventId,
        obs.observedAt,
        obs.articleCount,
        obs.independentSourceCount,
        obs.trendScore,
        obs.importanceScore,
        obs.velocityScore,
        obs.coverageScore,
        obs.recencyScore,
        obs.freshnessScore,
        obs.spreadScore,
        obs.finalRankScore,
      ]);
    } catch (err) {
      console.warn('[EventRepository] DB recordTrendObservation notice:', (err as Error).message);
    }

    inMemoryObservations.unshift(obs);
    // Keep bounded in memory (last 200)
    if (inMemoryObservations.length > 200) {
      inMemoryObservations = inMemoryObservations.slice(0, 200);
    }
  }

  static async getRecentObservations(eventId: string, hours = 24): Promise<TrendObservation[]> {
    const cutoffTime = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    try {
      const sql = `
        SELECT 
          id, event_id AS "eventId", observed_at AS "observedAt",
          article_count AS "articleCount", independent_source_count AS "independentSourceCount",
          trend_score AS "trendScore", importance_score AS "importanceScore",
          velocity_score AS "velocityScore", coverage_score AS "coverageScore",
          recency_score AS "recencyScore", freshness_score AS "freshnessScore",
          spread_score AS "spreadScore", final_rank_score AS "finalRankScore"
        FROM public.trend_observations
        WHERE event_id = $1 AND observed_at >= $2
        ORDER BY observed_at DESC;
      `;
      const rows = await query<TrendObservation>(sql, [eventId, cutoffTime]);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn('[EventRepository] DB getRecentObservations error:', (err as Error).message);
    }

    const cutoffMs = Date.now() - hours * 3600 * 1000;
    return inMemoryObservations.filter(
      (o) => o.eventId === eventId && new Date(o.observedAt).getTime() >= cutoffMs
    );
  }

  static clearMemoryStore(): void {
    inMemoryEvents = [];
    inMemoryObservations = [];
  }

  static save(event: CanonicalEvent): void {
    const existingIdx = inMemoryEvents.findIndex((e) => e.id === event.id);
    if (existingIdx >= 0) {
      inMemoryEvents[existingIdx] = event;
    } else {
      inMemoryEvents.push(event);
    }
  }

  static restoreDefaultEvents(): void {
    inMemoryEvents = [...DEFAULT_EVENTS];
  }
}



