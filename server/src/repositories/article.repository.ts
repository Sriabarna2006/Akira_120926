import { Article } from '../types/index.js';
import { query, queryOne } from '../db/dbClient.js';
import { supabaseAdmin, isSupabaseConfigured } from '../db/supabase.js';

// Safe development seed articles matching 003_seed_data.sql
const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'art_tn_ev_hindu_01',
    sourceId: 'the-hindu-tn',
    sourceName: 'The Hindu (Tamil Nadu)',
    eventId: 'evt_tn_ev_hub_2026',
    title: 'TN Cabinet gives nod to industrial corridor expansion and EV battery parks',
    url: 'https://www.thehindu.com/news/national/tamil-nadu/ev-corridor-policy-2026',
    contentSnippet: 'The State Cabinet on Monday approved a dedicated infrastructure fund to boost EV manufacturing clusters in Hosur and Coimbatore.',
    publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    regionId: 'tamil-nadu',
    categoryId: 'infrastructure',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'art_tn_ev_toi_01',
    sourceId: 'toi',
    sourceName: 'Times of India',
    eventId: 'evt_tn_ev_hub_2026',
    title: 'Tamil Nadu launches multi-modal transit links for industrial hubs',
    url: 'https://timesofindia.indiatimes.com/city/chennai/tn-transit-ev-policy-2026',
    contentSnippet: 'New rail and expressway linkages cleared to integrate industrial corridors across the state.',
    publishedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    regionId: 'tamil-nadu',
    categoryId: 'infrastructure',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'art_macro_et_01',
    sourceId: 'economic-times',
    sourceName: 'The Economic Times',
    eventId: 'evt_macro_rates_2026',
    title: 'RBI signals calibrated transition in monetary liquidity policy',
    url: 'https://economictimes.indiatimes.com/news/economy/policy/rbi-monetary-policy-2026',
    contentSnippet: 'Central bank outlines steady glidepath for headline inflation while maintaining financial stability.',
    publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    regionId: 'india',
    categoryId: 'economy',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'art_ai_tc_01',
    sourceId: 'techcrunch',
    sourceName: 'TechCrunch',
    eventId: 'evt_ai_semiconductor_2026',
    title: 'Semiconductor giants form new alliance for sub-2nm AI accelerator hardware',
    url: 'https://techcrunch.com/2026/09/12/sub-2nm-ai-hardware-consortium',
    contentSnippet: 'Consortium aims to standardize ultra-low latency optical interconnects for next-generation neural processors.',
    publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    regionId: 'world',
    categoryId: 'technology',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

let inMemoryArticles: Article[] = [...DEFAULT_ARTICLES];

export interface ArticleFilterParams {
  regionId?: string;
  categoryId?: string;
  sourceId?: string;
  eventId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ArticleRepository {
  static async findAll(params: ArticleFilterParams = {}): Promise<{ articles: Article[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (params.regionId) {
        conditions.push(`(a.region_id = $${idx} OR r.slug = $${idx})`);
        values.push(params.regionId);
        idx++;
      }
      if (params.categoryId) {
        conditions.push(`(a.category_id = $${idx} OR c.slug = $${idx})`);
        values.push(params.categoryId);
        idx++;
      }
      if (params.sourceId) {
        conditions.push(`a.source_id = $${idx++}`);
        values.push(params.sourceId);
      }
      if (params.eventId) {
        conditions.push(`a.event_id = $${idx++}`);
        values.push(params.eventId);
      }
      if (params.search) {
        conditions.push(`(a.title ILIKE $${idx} OR a.content_snippet ILIKE $${idx})`);
        values.push(`%${params.search}%`);
        idx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `
        SELECT COUNT(*)::int AS total
        FROM public.articles a
        LEFT JOIN public.regions r ON a.region_id = r.id
        LEFT JOIN public.categories c ON a.category_id = c.id
        ${whereClause};
      `;
      const countRow = await queryOne<{ total: number }>(countSql, values);
      const total = countRow?.total || 0;

      const dataSql = `
        SELECT 
          a.id, a.source_id AS "sourceId", s.name AS "sourceName", a.event_id AS "eventId",
          a.title, a.url, a.content_snippet AS "contentSnippet", a.published_at AS "publishedAt",
          a.region_id AS "regionId", a.category_id AS "categoryId", a.created_at AS "createdAt"
        FROM public.articles a
        LEFT JOIN public.sources s ON a.source_id = s.id
        LEFT JOIN public.regions r ON a.region_id = r.id
        LEFT JOIN public.categories c ON a.category_id = c.id
        ${whereClause}
        ORDER BY a.published_at DESC
        LIMIT $${idx++} OFFSET $${idx++};
      `;
      const rows = await query<Article>(dataSql, [...values, limit, offset]);

      if (rows && rows.length > 0) {
        return { articles: rows, total };
      }
    } catch (err) {
      console.warn('[ArticleRepository] DB query failed, using fallback:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let q = supabaseAdmin.from('articles').select('*, sources(name)', { count: 'exact' });
        if (params.regionId) q = q.eq('region_id', params.regionId);
        if (params.categoryId) q = q.eq('category_id', params.categoryId);
        if (params.sourceId) q = q.eq('source_id', params.sourceId);
        if (params.eventId) q = q.eq('event_id', params.eventId);
        if (params.search) q = q.ilike('title', `%${params.search}%`);

        const { data, count, error } = await q
          .order('published_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data && data.length > 0) {
          return {
            articles: data.map((a: any) => ({
              id: a.id,
              sourceId: a.source_id,
              sourceName: a.sources?.name,
              eventId: a.event_id,
              title: a.title,
              url: a.url,
              contentSnippet: a.content_snippet,
              publishedAt: a.published_at,
              regionId: a.region_id,
              categoryId: a.category_id,
              createdAt: a.created_at,
            })),
            total: count || data.length,
          };
        }
      } catch (err) {
        console.warn('[ArticleRepository] Supabase query notice:', (err as Error).message);
      }
    }

    // Fallback store
    let filtered = [...inMemoryArticles];
    if (params.regionId) {
      filtered = filtered.filter((a) => a.regionId?.toLowerCase() === params.regionId?.toLowerCase());
    }
    if (params.categoryId) {
      filtered = filtered.filter((a) => a.categoryId?.toLowerCase() === params.categoryId?.toLowerCase());
    }
    if (params.sourceId) {
      filtered = filtered.filter((a) => a.sourceId === params.sourceId);
    }
    if (params.eventId) {
      filtered = filtered.filter((a) => a.eventId === params.eventId);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter((a) => a.title.toLowerCase().includes(s) || a.contentSnippet?.toLowerCase().includes(s));
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    return { articles: paginated, total };
  }

  static async findById(id: string): Promise<Article | null> {
    try {
      const sql = `
        SELECT 
          a.id, a.source_id AS "sourceId", s.name AS "sourceName", a.event_id AS "eventId",
          a.title, a.url, a.content_snippet AS "contentSnippet", a.published_at AS "publishedAt",
          a.region_id AS "regionId", a.category_id AS "categoryId", a.created_at AS "createdAt"
        FROM public.articles a
        LEFT JOIN public.sources s ON a.source_id = s.id
        WHERE a.id = $1
        LIMIT 1;
      `;
      const row = await queryOne<Article>(sql, [id]);
      if (row) return row;
    } catch (err) {
      console.warn('[ArticleRepository] DB findById error:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('articles')
          .select('*, sources(name)')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            sourceId: data.source_id,
            sourceName: (data as any).sources?.name,
            eventId: data.event_id,
            title: data.title,
            url: data.url,
            contentSnippet: data.content_snippet,
            publishedAt: data.published_at,
            regionId: data.region_id,
            categoryId: data.category_id,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('[ArticleRepository] Supabase findById notice:', (err as Error).message);
      }
    }

    return inMemoryArticles.find((a) => a.id === id) || null;
  }

  static async findByUrl(url: string): Promise<Article | null> {
    try {
      const sql = `SELECT id, source_id AS "sourceId", event_id AS "eventId", title, url, content_snippet AS "contentSnippet", published_at AS "publishedAt", region_id AS "regionId", category_id AS "categoryId", created_at AS "createdAt" FROM public.articles WHERE url = $1 LIMIT 1;`;
      const row = await queryOne<Article>(sql, [url]);
      if (row) return row;
    } catch (err) {
      console.warn('[ArticleRepository] DB findByUrl error:', (err as Error).message);
    }

    return inMemoryArticles.find((a) => a.url === url) || null;
  }

  static async existsByUrl(url: string): Promise<boolean> {
    const found = await this.findByUrl(url);
    return found !== null;
  }

  static async updateEventId(articleId: string, eventId: string): Promise<void> {
    try {
      const sql = `UPDATE public.articles SET event_id = $1 WHERE id = $2;`;
      await query(sql, [eventId, articleId]);
    } catch (err) {
      console.warn('[ArticleRepository] updateEventId DB error:', (err as Error).message);
    }
    const local = inMemoryArticles.find((a) => a.id === articleId);
    if (local) {
      local.eventId = eventId;
    }
  }

  static async create(article: Omit<Article, 'createdAt'>): Promise<Article> {
    const newArticle: Article = {
      ...article,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = await queryOne<{ id: string }>(`SELECT id FROM public.articles WHERE url = $1 LIMIT 1;`, [newArticle.url]);

      if (existing) {
        const updateSql = `
          UPDATE public.articles 
          SET 
            title = $1, 
            content_snippet = $2, 
            event_id = COALESCE($3, event_id),
            region_id = COALESCE($4, region_id),
            category_id = COALESCE($5, category_id)
          WHERE id = $6
          RETURNING 
            id, source_id AS "sourceId", event_id AS "eventId", title, url, 
            content_snippet AS "contentSnippet", published_at AS "publishedAt", 
            region_id AS "regionId", category_id AS "categoryId", created_at AS "createdAt";
        `;
        const rows = await query<Article>(updateSql, [
          newArticle.title,
          newArticle.contentSnippet || null,
          newArticle.eventId || null,
          newArticle.regionId || null,
          newArticle.categoryId || null,
          existing.id,
        ]);
        if (rows && rows.length > 0) {
          return rows[0];
        }
      } else {
        const insertSql = `
          INSERT INTO public.articles (
            id, source_id, event_id, title, url, content_snippet, published_at, region_id, category_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING 
            id, source_id AS "sourceId", event_id AS "eventId", title, url, 
            content_snippet AS "contentSnippet", published_at AS "publishedAt", 
            region_id AS "regionId", category_id AS "categoryId", created_at AS "createdAt";
        `;
        
        let rows = await query<Article>(insertSql, [
          newArticle.id,
          newArticle.sourceId || null,
          newArticle.eventId || null,
          newArticle.title,
          newArticle.url,
          newArticle.contentSnippet || null,
          newArticle.publishedAt,
          newArticle.regionId || null,
          newArticle.categoryId || null,
        ]);

        // If insertion failed due to FK constraint on unknown source_id, fallback with source_id=null
        if ((!rows || rows.length === 0) && newArticle.sourceId) {
          console.warn(`[ArticleRepository] Retrying article insertion with source_id=null fallback for: ${newArticle.url}`);
          rows = await query<Article>(insertSql, [
            newArticle.id,
            null,
            newArticle.eventId || null,
            newArticle.title,
            newArticle.url,
            newArticle.contentSnippet || null,
            newArticle.publishedAt,
            newArticle.regionId || null,
            newArticle.categoryId || null,
          ]);
        }

        if (rows && rows.length > 0) {
          return rows[0];
        }
      }
    } catch (err: any) {
      console.warn('[ArticleRepository] DB insert/update error:', err.message);
    }

    inMemoryArticles = inMemoryArticles.filter((a) => a.url !== newArticle.url && a.id !== newArticle.id);
    inMemoryArticles.push(newArticle);
    return newArticle;
  }

  static async findByEventId(eventId: string): Promise<Article[]> {
    if (!eventId) return [];
    const res = await this.findAll({ eventId, limit: 100 });
    return res.articles;
  }
}

