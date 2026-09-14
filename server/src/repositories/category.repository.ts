import { Category } from '../types/index.js';
import { query } from '../db/dbClient.js';
import { supabaseAdmin, isSupabaseConfigured } from '../db/supabase.js';

// Approved 15 categories matching 003_seed_data.sql
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'politics', name: 'Politics & Policy', slug: 'politics', icon: 'Landmark', color: '#3B82F6', description: 'Governance, legislation, constitutional affairs, and elections', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'economy', name: 'Economy & Finance', slug: 'economy', icon: 'TrendingUp', color: '#10B981', description: 'Macroeconomics, fiscal policy, inflation, banking, and trade', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'business', name: 'Business & Markets', slug: 'business', icon: 'Briefcase', color: '#6366F1', description: 'Corporate developments, startups, industry growth, and markets', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'technology', name: 'Technology & AI', slug: 'technology', icon: 'Cpu', color: '#8B5CF6', description: 'Artificial intelligence, semiconductors, software, and digital innovation', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'science', name: 'Science & Space', slug: 'science', icon: 'Atom', color: '#EC4899', description: 'Space exploration, astrophysics, biotechnology, and fundamental research', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'infrastructure', name: 'Infrastructure & Cities', slug: 'infrastructure', icon: 'Building2', color: '#F59E0B', description: 'Urban transit, metro rail, highway corridors, and smart cities', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'education', name: 'Education & Research', slug: 'education', icon: 'GraduationCap', color: '#14B8A6', description: 'Higher education, literacy initiatives, academic research, and policy', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'health', name: 'Healthcare & Medicine', slug: 'health', icon: 'HeartPulse', color: '#EF4444', description: 'Public health, medical breakthroughs, pharma, and epidemic tracking', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'environment', name: 'Environment & Climate', slug: 'environment', icon: 'Leaf', color: '#22C55E', description: 'Renewable energy, climate transition, conservation, and ecology', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'weather', name: 'Weather & Monsoons', slug: 'weather', icon: 'CloudRain', color: '#06B6D4', description: 'Monsoon forecasts, weather phenomena, and natural disaster advisories', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'security', name: 'Defense & Security', slug: 'security', icon: 'Shield', color: '#64748B', description: 'National security, defense technology, diplomacy, and strategic affairs', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'transportation', name: 'Transit & Logistics', slug: 'transportation', icon: 'Navigation', color: '#F97316', description: 'Railways, aviation, maritime shipping, and EV mobility corridors', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'sports', name: 'Sports & Athletics', slug: 'sports', icon: 'Trophy', color: '#EAB308', description: 'Major tournaments, athletics, cricket, and sports science', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'entertainment', name: 'Culture & Cinema', slug: 'entertainment', icon: 'Film', color: '#A855F7', description: 'Cinema, literature, cultural heritage, and creative arts', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'other', name: 'General & Society', slug: 'other', icon: 'Globe', color: '#94A3B8', description: 'Public interest announcements, civic developments, and human interest', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
];

let inMemoryCategories: Category[] = [...DEFAULT_CATEGORIES];

export class CategoryRepository {
  static async findAll(includeInactive = false): Promise<Category[]> {
    try {
      const sql = includeInactive
        ? 'SELECT id, name, slug, icon, color, description, is_active AS "isActive", created_at AS "createdAt" FROM public.categories ORDER BY name ASC;'
        : 'SELECT id, name, slug, icon, color, description, is_active AS "isActive", created_at AS "createdAt" FROM public.categories WHERE is_active = true ORDER BY name ASC;';
      const rows = await query<Category>(sql);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn('[CategoryRepository] DB query failed, using fallback:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let q = supabaseAdmin.from('categories').select('id, name, slug, icon, color, description, is_active, created_at').order('name', { ascending: true });
        if (!includeInactive) {
          q = q.eq('is_active', true);
        }
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            icon: c.icon,
            color: c.color,
            description: c.description,
            isActive: c.is_active,
            createdAt: c.created_at,
          }));
        }
      } catch (err) {
        console.warn('[CategoryRepository] Supabase query notice:', (err as Error).message);
      }
    }

    return includeInactive
      ? inMemoryCategories
      : inMemoryCategories.filter((c) => c.isActive);
  }

  static async findByIdOrSlug(idOrSlug: string): Promise<Category | null> {
    try {
      const sql = 'SELECT id, name, slug, icon, color, description, is_active AS "isActive", created_at AS "createdAt" FROM public.categories WHERE id = $1 OR slug = $1 LIMIT 1;';
      const rows = await query<Category>(sql, [idOrSlug]);
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn('[CategoryRepository] DB query failed:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('categories')
          .select('id, name, slug, icon, color, description, is_active, created_at')
          .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            icon: data.icon,
            color: data.color,
            description: data.description,
            isActive: data.is_active,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('[CategoryRepository] Supabase single query notice:', (err as Error).message);
      }
    }

    const found = inMemoryCategories.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
    return found || null;
  }

  static async create(category: Omit<Category, 'createdAt'>): Promise<Category> {
    const newCategory: Category = {
      ...category,
      createdAt: new Date().toISOString(),
    };

    try {
      const sql = `
        INSERT INTO public.categories (id, name, slug, icon, color, description, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          description = EXCLUDED.description
        RETURNING id, name, slug, icon, color, description, is_active AS "isActive", created_at AS "createdAt";
      `;
      const rows = await query<Category>(sql, [
        newCategory.id,
        newCategory.name,
        newCategory.slug,
        newCategory.icon || null,
        newCategory.color || null,
        newCategory.description || null,
        newCategory.isActive,
      ]);
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn('[CategoryRepository] DB insert error:', (err as Error).message);
    }

    inMemoryCategories = inMemoryCategories.filter((c) => c.id !== newCategory.id);
    inMemoryCategories.push(newCategory);
    return newCategory;
  }
}
