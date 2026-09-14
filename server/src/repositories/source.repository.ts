import { Source } from '../types/index.js';
import { query } from '../db/dbClient.js';
import { supabaseAdmin, isSupabaseConfigured } from '../db/supabase.js';

// Vetted publisher directory matching 003_seed_data.sql
const DEFAULT_SOURCES: Source[] = [
  { id: 'the-hindu', name: 'The Hindu', url: 'https://www.thehindu.com', feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss', regionId: 'india', categoryId: 'politics', tier: 1, credibilityScore: 0.95, conglomerateId: 'kasturi-sons', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'the-hindu-tn', name: 'The Hindu (Tamil Nadu)', url: 'https://www.thehindu.com/news/national/tamil-nadu/', feedUrl: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', regionId: 'tamil-nadu', categoryId: 'politics', tier: 1, credibilityScore: 0.95, conglomerateId: 'kasturi-sons', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'the-hindu-chennai', name: 'The Hindu (Chennai)', url: 'https://www.thehindu.com/news/cities/chennai/', feedUrl: 'https://www.thehindu.com/news/cities/chennai/feeder/default.rss', regionId: 'tamil-nadu', categoryId: 'infrastructure', tier: 1, credibilityScore: 0.95, conglomerateId: 'kasturi-sons', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'toi', name: 'Times of India', url: 'https://timesofindia.indiatimes.com', feedUrl: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', regionId: 'india', categoryId: 'politics', tier: 2, credibilityScore: 0.85, conglomerateId: 'times-group', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bbc-world', name: 'BBC News', url: 'https://www.bbc.com/news', feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml', regionId: 'world', categoryId: 'politics', tier: 1, credibilityScore: 0.95, conglomerateId: 'bbc', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'reuters-world', name: 'Reuters', url: 'https://www.reuters.com', feedUrl: 'https://www.reutersagency.com/feed/?best-topics=world', regionId: 'world', categoryId: 'business', tier: 1, credibilityScore: 0.95, conglomerateId: 'thomson-reuters', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'economic-times', name: 'The Economic Times', url: 'https://economictimes.indiatimes.com', feedUrl: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', regionId: 'india', categoryId: 'economy', tier: 1, credibilityScore: 0.90, conglomerateId: 'times-group', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'dinamalar-tn', name: 'Dinamalar', url: 'https://www.dinamalar.com', feedUrl: 'https://rss.dinamalar.com/?cat=tamilnadu', regionId: 'tamil-nadu', categoryId: 'politics', tier: 2, credibilityScore: 0.85, conglomerateId: 'dinamalar-media', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'dinamani-tn', name: 'Dinamani', url: 'https://www.dinamani.com', feedUrl: 'https://www.dinamani.com/tamilnadu/rss', regionId: 'tamil-nadu', categoryId: 'politics', tier: 2, credibilityScore: 0.85, conglomerateId: 'express-group', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com', feedUrl: 'https://techcrunch.com/feed/', regionId: 'world', categoryId: 'technology', tier: 2, credibilityScore: 0.85, conglomerateId: 'yahoo', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'the-verge', name: 'The Verge', url: 'https://www.theverge.com', feedUrl: 'https://www.theverge.com/rss/index.xml', regionId: 'world', categoryId: 'technology', tier: 2, credibilityScore: 0.85, conglomerateId: 'vox-media', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'sciencedaily', name: 'ScienceDaily', url: 'https://www.sciencedaily.com', feedUrl: 'https://www.sciencedaily.com/rss/top/science.xml', regionId: 'world', categoryId: 'science', tier: 1, credibilityScore: 0.95, conglomerateId: 'sciencedaily', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bleepingcomputer', name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com', feedUrl: 'https://www.bleepingcomputer.com/feed/', regionId: 'world', categoryId: 'security', tier: 1, credibilityScore: 0.92, conglomerateId: 'bleeping-computer', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'pib-india', name: 'Press Information Bureau (PIB)', url: 'https://pib.gov.in', feedUrl: 'https://pib.gov.in/rss/RssEnglish.aspx', regionId: 'india', categoryId: 'politics', tier: 1, credibilityScore: 0.98, conglomerateId: 'gov-india', isActive: true, failureCount: 0, updateFrequencyMinutes: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

let inMemorySources: Source[] = [...DEFAULT_SOURCES];

export interface SourceFilterParams {
  regionId?: string;
  categoryId?: string;
  tier?: number;
  includeInactive?: boolean;
}

export class SourceRepository {
  static async findAll(params: SourceFilterParams = {}): Promise<Source[]> {
    const { regionId, categoryId, tier, includeInactive = false } = params;

    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (!includeInactive) {
        conditions.push(`is_active = true`);
      }
      if (regionId) {
        conditions.push(`region_id = $${idx++}`);
        values.push(regionId);
      }
      if (categoryId) {
        conditions.push(`category_id = $${idx++}`);
        values.push(categoryId);
      }
      if (tier) {
        conditions.push(`tier = $${idx++}`);
        values.push(tier);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `
        SELECT 
          id, name, url, feed_url AS "feedUrl", region_id AS "regionId", 
          category_id AS "categoryId", tier, credibility_score AS "credibilityScore", 
          conglomerate_id AS "conglomerateId", is_active AS "isActive", 
          last_successful_fetch AS "lastSuccessfulFetch", last_failed_fetch AS "lastFailedFetch", 
          failure_count AS "failureCount", update_frequency_minutes AS "updateFrequencyMinutes", 
          created_at AS "createdAt", updated_at AS "updatedAt"
        FROM public.sources
        ${whereClause}
        ORDER BY tier ASC, name ASC;
      `;
      const rows = await query<Source>(sql, values);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn('[SourceRepository] DB query failed, using fallback:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let q = supabaseAdmin.from('sources').select('*');
        if (!includeInactive) q = q.eq('is_active', true);
        if (regionId) q = q.eq('region_id', regionId);
        if (categoryId) q = q.eq('category_id', categoryId);
        if (tier) q = q.eq('tier', tier);

        const { data, error } = await q.order('tier', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((s) => ({
            id: s.id,
            name: s.name,
            url: s.url,
            feedUrl: s.feed_url,
            regionId: s.region_id,
            categoryId: s.category_id,
            tier: s.tier,
            credibilityScore: s.credibility_score,
            conglomerateId: s.conglomerate_id,
            isActive: s.is_active,
            lastSuccessfulFetch: s.last_successful_fetch,
            lastFailedFetch: s.last_failed_fetch,
            failureCount: s.failure_count,
            updateFrequencyMinutes: s.update_frequency_minutes,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          }));
        }
      } catch (err) {
        console.warn('[SourceRepository] Supabase query notice:', (err as Error).message);
      }
    }

    let results = inMemorySources;
    if (!includeInactive) results = results.filter((s) => s.isActive);
    if (regionId) results = results.filter((s) => s.regionId === regionId);
    if (categoryId) results = results.filter((s) => s.categoryId === categoryId);
    if (tier) results = results.filter((s) => s.tier === tier);
    return results;
  }

  static async findById(id: string): Promise<Source | null> {
    try {
      const sql = `
        SELECT 
          id, name, url, feed_url AS "feedUrl", region_id AS "regionId", 
          category_id AS "categoryId", tier, credibility_score AS "credibilityScore", 
          conglomerate_id AS "conglomerateId", is_active AS "isActive", 
          last_successful_fetch AS "lastSuccessfulFetch", last_failed_fetch AS "lastFailedFetch", 
          failure_count AS "failureCount", update_frequency_minutes AS "updateFrequencyMinutes", 
          created_at AS "createdAt", updated_at AS "updatedAt"
        FROM public.sources
        WHERE id = $1
        LIMIT 1;
      `;
      const rows = await query<Source>(sql, [id]);
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn('[SourceRepository] DB findById error:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('sources').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            url: data.url,
            feedUrl: data.feed_url,
            regionId: data.region_id,
            categoryId: data.category_id,
            tier: data.tier,
            credibilityScore: data.credibility_score,
            conglomerateId: data.conglomerate_id,
            isActive: data.is_active,
            lastSuccessfulFetch: data.last_successful_fetch,
            lastFailedFetch: data.last_failed_fetch,
            failureCount: data.failure_count,
            updateFrequencyMinutes: data.update_frequency_minutes,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('[SourceRepository] Supabase findById notice:', (err as Error).message);
      }
    }

    const found = inMemorySources.find((s) => s.id === id);
    return found || null;
  }

  static async create(source: Omit<Source, 'createdAt' | 'updatedAt'>): Promise<Source> {
    const newSource: Source = {
      ...source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const sql = `
        INSERT INTO public.sources (
          id, name, url, feed_url, region_id, category_id, tier, 
          credibility_score, conglomerate_id, is_active, update_frequency_minutes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          url = EXCLUDED.url,
          feed_url = EXCLUDED.feed_url,
          tier = EXCLUDED.tier,
          credibility_score = EXCLUDED.credibility_score
        RETURNING 
          id, name, url, feed_url AS "feedUrl", region_id AS "regionId", 
          category_id AS "categoryId", tier, credibility_score AS "credibilityScore", 
          conglomerate_id AS "conglomerateId", is_active AS "isActive", 
          last_successful_fetch AS "lastSuccessfulFetch", last_failed_fetch AS "lastFailedFetch", 
          failure_count AS "failureCount", update_frequency_minutes AS "updateFrequencyMinutes", 
          created_at AS "createdAt", updated_at AS "updatedAt";
      `;
      const rows = await query<Source>(sql, [
        newSource.id,
        newSource.name,
        newSource.url,
        newSource.feedUrl || null,
        newSource.regionId || null,
        newSource.categoryId || null,
        newSource.tier,
        newSource.credibilityScore,
        newSource.conglomerateId || null,
        newSource.isActive,
        newSource.updateFrequencyMinutes || 3,
      ]);
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn('[SourceRepository] DB insert error:', (err as Error).message);
    }

    inMemorySources = inMemorySources.filter((s) => s.id !== newSource.id);
    inMemorySources.push(newSource);
    return newSource;
  }

  static async updateFetchStatus(id: string, success: boolean, failureReason?: string): Promise<void> {
    const now = new Date().toISOString();
    try {
      if (success) {
        const sql = `
          UPDATE public.sources 
          SET last_successful_fetch = $1, failure_count = 0, updated_at = $1
          WHERE id = $2;
        `;
        await query(sql, [now, id]);
      } else {
        const sql = `
          UPDATE public.sources 
          SET last_failed_fetch = $1, failure_count = failure_count + 1, updated_at = $1
          WHERE id = $2;
        `;
        await query(sql, [now, id]);
      }
    } catch (err) {
      console.warn('[SourceRepository] updateFetchStatus DB error:', (err as Error).message);
    }

    const localSource = inMemorySources.find((s) => s.id === id);
    if (localSource) {
      if (success) {
        localSource.lastSuccessfulFetch = now;
        localSource.failureCount = 0;
      } else {
        localSource.lastFailedFetch = now;
        localSource.failureCount = (localSource.failureCount || 0) + 1;
      }
      localSource.updatedAt = now;
    }
  }
}

