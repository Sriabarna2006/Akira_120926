import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Globe, 
  Flag, 
  Landmark, 
  Cpu, 
  TrendingUp, 
  Leaf, 
  GraduationCap, 
  HeartPulse, 
  Shield, 
  Rocket, 
  Briefcase,
  Layers,
  ArrowRight,
  BookOpen,
  CloudRain,
  Building2,
  Navigation,
  Trophy,
  Film,
  RotateCw
} from 'lucide-react';
import { SearchBar } from '../components/common/SearchBar';
import { categoryService } from '../services/categoryService';
import { regionService } from '../services/regionService';
import { storylineService } from '../services/storylineService';
import { Category, RegionItem, Storyline } from '../types';
import { GitBranch, Milestone } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Landmark,
  TrendingUp,
  Briefcase,
  Cpu,
  Atom: Rocket,
  Building2,
  GraduationCap,
  HeartPulse,
  Leaf,
  CloudRain,
  Shield,
  Navigation,
  Trophy,
  Film,
  Globe,
  Flag,
};

export const ExplorePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [storylines, setStorylines] = useState<Storyline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, regs, slRes] = await Promise.all([
          categoryService.getCategories(),
          regionService.getRegions(),
          storylineService.getStorylines(),
        ]);
        setCategories(cats);
        setRegions(regs);
        setStorylines(slRes.storylines || []);
      } catch (err) {
        console.warn('ExplorePage load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const popularConceptPills = [
    { name: 'Monetary Policy', slug: 'monetary-policy', category: 'Economy' },
    { name: 'AI Governance', slug: 'ai-governance', category: 'AI & Tech' },
    { name: 'Zero-Day Exploits', slug: 'zero-day-exploit', category: 'Security' },
    { name: 'Semiconductor Fabs', slug: 'semiconductor-fabs', category: 'Hardware' },
    { name: 'Carbon Credits', slug: 'carbon-credits', category: 'Environment' },
    { name: 'Inflation Indices', slug: 'inflation-indices', category: 'Economy' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Exploration Mission */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-cyan-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-cyan-950/60 border border-indigo-200 dark:border-indigo-500/30 shadow-sm dark:shadow-glass">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2">
          <Compass className="w-4 h-4" />
          <span>Knowledge Discovery Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Explore by Topic, Region & Concept
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mt-2">
          Discover real-world developments categorized by domain. Dive directly into chronological storylines, concepts, regional streams, or industry topics.
        </p>

        {/* Integrated Search Bar */}
        <div className="mt-6 max-w-xl">
          <SearchBar placeholder="Search any topic, domain, region, or concept..." />
        </div>
      </div>

      {/* 2. PHASE 11: Active Real-World Storylines Shelf */}
      {storylines.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-indigo-50/50 to-white dark:from-slate-900/90 dark:to-[#111827]/70 border border-indigo-200 dark:border-indigo-500/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              <GitBranch className="w-4 h-4" />
              <span>Living Real-World Storylines</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {storylines.length} Active Narrative Trajectories
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {storylines.map((sl) => (
              <Link
                key={sl.id}
                to={`/event/${sl.currentEventId || 'evt_tn_ev_hub_2026'}`}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group flex flex-col justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                      {sl.category || sl.primaryCategoryId || 'General'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                      {sl.trajectory}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                    {sl.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sl.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Milestone className="w-3 h-3 text-amber-500" />
                    <span>{sl.eventCount} milestones</span>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-1">
                    <span>View Storyline</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3. First-Class Regions Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111827]/60 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>First-Class Regional Streams</span>
          </div>
          <Link to="/all-news" className="text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
            View All News →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {regions.map((reg) => (
            <Link
              key={reg.id}
              to={`/all-news?region=${reg.id}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                {reg.id === 'tamil-nadu' ? (
                  <Landmark className="w-4 h-4 text-amber-500" />
                ) : reg.id === 'india' ? (
                  <Flag className="w-4 h-4 text-orange-500" />
                ) : (
                  <Globe className="w-4 h-4 text-blue-500" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                    {reg.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {reg.description || 'Regional news & intelligence'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Popular Concepts Cloud */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111827]/60 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Popular Concepts to Learn</span>
          </div>
          <Link to="/learn" className="text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
            View Concept Library →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {popularConceptPills.map((c) => (
            <Link
              key={c.slug}
              to={`/learn?concept=${c.slug}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:hover:text-white dark:border-white/5 transition-all group font-semibold text-xs"
            >
              <span>{c.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 font-normal">
                ({c.category})
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Comprehensive Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>All Domains & Knowledge Verticals</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({categories.length} Categories)
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RotateCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading categories from database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = (cat.icon && ICON_MAP[cat.icon]) || Layers;
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-200 shadow-sm dark:shadow-glass"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                        {cat.slug}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors mb-1.5">
                      {cat.name}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {cat.description || 'Real-world events and knowledge insights'}
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    <span>Explore Domain</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
