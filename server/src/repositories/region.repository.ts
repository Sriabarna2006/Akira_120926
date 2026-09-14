import { Region } from '../types/index.js';
import { query } from '../db/dbClient.js';
import { supabaseAdmin, isSupabaseConfigured } from '../db/supabase.js';

// Seed reference data matching 003_seed_data.sql
const DEFAULT_REGIONS: Region[] = [
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    slug: 'tamil-nadu',
    description: 'State-level governance, economy, infrastructure, and culture in Tamil Nadu',
    tier: 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'india',
    name: 'India',
    slug: 'india',
    description: 'National governance, policy, macroeconomic developments, and major events across India',
    tier: 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'world',
    name: 'World',
    slug: 'world',
    description: 'Global geopolitics, international economics, science, and world developments',
    tier: 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

let inMemoryRegions: Region[] = [...DEFAULT_REGIONS];

export class RegionRepository {
  static async findAll(includeInactive = false): Promise<Region[]> {
    try {
      const sql = includeInactive
        ? 'SELECT id, name, slug, description, tier, is_active AS "isActive", created_at AS "createdAt" FROM public.regions ORDER BY tier ASC, name ASC;'
        : 'SELECT id, name, slug, description, tier, is_active AS "isActive", created_at AS "createdAt" FROM public.regions WHERE is_active = true ORDER BY tier ASC, name ASC;';
      const rows = await query<Region>(sql);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn('[RegionRepository] DB query failed, using fallback:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let q = supabaseAdmin.from('regions').select('id, name, slug, description, tier, is_active, created_at').order('tier', { ascending: true });
        if (!includeInactive) {
          q = q.eq('is_active', true);
        }
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            description: r.description,
            tier: r.tier,
            isActive: r.is_active,
            createdAt: r.created_at,
          }));
        }
      } catch (err) {
        console.warn('[RegionRepository] Supabase query notice:', (err as Error).message);
      }
    }

    return includeInactive
      ? inMemoryRegions
      : inMemoryRegions.filter((r) => r.isActive);
  }

  static async findByIdOrSlug(idOrSlug: string): Promise<Region | null> {
    try {
      const sql = 'SELECT id, name, slug, description, tier, is_active AS "isActive", created_at AS "createdAt" FROM public.regions WHERE id = $1 OR slug = $1 LIMIT 1;';
      const rows = await query<Region>(sql, [idOrSlug]);
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn('[RegionRepository] DB query failed:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('regions')
          .select('id, name, slug, description, tier, is_active, created_at')
          .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            tier: data.tier,
            isActive: data.is_active,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('[RegionRepository] Supabase single query notice:', (err as Error).message);
      }
    }

    const found = inMemoryRegions.find((r) => r.id === idOrSlug || r.slug === idOrSlug);
    return found || null;
  }

  static async create(region: Omit<Region, 'createdAt'>): Promise<Region> {
    const newRegion: Region = {
      ...region,
      createdAt: new Date().toISOString(),
    };

    try {
      const sql = `
        INSERT INTO public.regions (id, name, slug, description, tier, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description
        RETURNING id, name, slug, description, tier, is_active AS "isActive", created_at AS "createdAt";
      `;
      const rows = await query<Region>(sql, [
        newRegion.id,
        newRegion.name,
        newRegion.slug,
        newRegion.description || null,
        newRegion.tier,
        newRegion.isActive,
      ]);
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn('[RegionRepository] DB insert error:', (err as Error).message);
    }

    inMemoryRegions = inMemoryRegions.filter((r) => r.id !== newRegion.id);
    inMemoryRegions.push(newRegion);
    return newRegion;
  }
}
