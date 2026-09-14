import { apiClient } from './api';
import { Category } from '../types';

export const categoryService = {
  /**
   * Fetch all active categories from database
   */
  async getCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get('/categories');
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[categoryService] Categories fetch notice:', err);
    }
    // Fallback safe reference
    return [
      { id: 'politics', name: 'Politics & Policy', slug: 'politics', icon: 'Landmark', color: '#3B82F6', description: 'Governance, legislation, constitutional affairs, and elections' },
      { id: 'economy', name: 'Economy & Finance', slug: 'economy', icon: 'TrendingUp', color: '#10B981', description: 'Macroeconomics, fiscal policy, inflation, banking, and trade' },
      { id: 'business', name: 'Business & Markets', slug: 'business', icon: 'Briefcase', color: '#6366F1', description: 'Corporate developments, startups, industry growth, and markets' },
      { id: 'technology', name: 'Technology & AI', slug: 'technology', icon: 'Cpu', color: '#8B5CF6', description: 'Artificial intelligence, semiconductors, software, and digital innovation' },
      { id: 'science', name: 'Science & Space', slug: 'science', icon: 'Atom', color: '#EC4899', description: 'Space exploration, astrophysics, biotechnology, and fundamental research' },
      { id: 'infrastructure', name: 'Infrastructure & Cities', slug: 'infrastructure', icon: 'Building2', color: '#F59E0B', description: 'Urban transit, metro rail, highway corridors, and smart cities' },
      { id: 'education', name: 'Education & Research', slug: 'education', icon: 'GraduationCap', color: '#14B8A6', description: 'Higher education, literacy initiatives, academic research, and policy' },
      { id: 'health', name: 'Healthcare & Medicine', slug: 'health', icon: 'HeartPulse', color: '#EF4444', description: 'Public health, medical breakthroughs, pharma, and epidemic tracking' },
      { id: 'environment', name: 'Environment & Climate', slug: 'environment', icon: 'Leaf', color: '#22C55E', description: 'Renewable energy, climate transition, conservation, and ecology' },
      { id: 'weather', name: 'Weather & Monsoons', slug: 'weather', icon: 'CloudRain', color: '#06B6D4', description: 'Monsoon forecasts, weather phenomena, and natural disaster advisories' },
      { id: 'security', name: 'Defense & Security', slug: 'security', icon: 'Shield', color: '#64748B', description: 'National security, defense technology, diplomacy, and strategic affairs' },
      { id: 'transportation', name: 'Transit & Logistics', slug: 'transportation', icon: 'Navigation', color: '#F97316', description: 'Railways, aviation, maritime shipping, and EV mobility corridors' },
      { id: 'sports', name: 'Sports & Athletics', slug: 'sports', icon: 'Trophy', color: '#EAB308', description: 'Major tournaments, athletics, cricket, and sports science' },
      { id: 'entertainment', name: 'Culture & Cinema', slug: 'entertainment', icon: 'Film', color: '#A855F7', description: 'Cinema, literature, cultural heritage, and creative arts' },
      { id: 'other', name: 'General & Society', slug: 'other', icon: 'Globe', color: '#94A3B8', description: 'Public interest announcements, civic developments, and human interest' },
    ];
  },

  /**
   * Fetch single category by ID or slug
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const res = await apiClient.get(`/categories/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn(`[categoryService] Category ${id} fetch notice:`, err);
    }
    return null;
  },
};
