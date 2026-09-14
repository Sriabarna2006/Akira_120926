import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  RotateCw, 
  Search, 
  Clock, 
  ExternalLink, 
  ArrowRight, 
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { regionService } from '../services/regionService';
import { categoryService } from '../services/categoryService';
import { CanonicalEvent, RegionItem, Category } from '../types';

export const AllNewsPage: React.FC = () => {
  const [events, setEvents] = useState<CanonicalEvent[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [regs, cats] = await Promise.all([
          regionService.getRegions(),
          categoryService.getCategories(),
        ]);
        setRegions(regs);
        setCategories(cats);
      } catch (err) {
        console.warn('Metadata load notice:', err);
      }
    }
    loadMetadata();
  }, []);

  const fetchEvents = async (page = 1) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const regionParam = selectedRegion === 'ALL' ? undefined : (selectedRegion === 'Tamil Nadu' ? 'tamil-nadu' : selectedRegion.toLowerCase());
      const categoryParam = selectedCategory === 'ALL' ? undefined : selectedCategory.toLowerCase();
      const urgencyParam = selectedUrgency === 'ALL' ? undefined : selectedUrgency;

      const res = await eventService.getEvents({
        region: regionParam,
        category: categoryParam,
        urgency: urgencyParam,
        search: searchQuery || undefined,
        page,
        limit: 10,
      });

      const mapped: CanonicalEvent[] = res.data.map((e: any) => ({
        ...e,
        region: e.regionId === 'tamil-nadu' ? 'Tamil Nadu' : e.regionId === 'india' ? 'India' : 'World',
        category: e.categoryId || 'General',
        importanceLabel: e.urgencyLabel || 'IMPORTANT',
        firstPublishedAt: e.firstPublishedAt || new Date().toISOString(),
        lastUpdatedAt: e.lastUpdatedAt || new Date().toISOString(),
        sourceCount: e.sources?.length || e.sourceCount || 1,
        estimatedReadTime: '3 min read',
        sources: (e.sources || []).map((s: any) => ({
          name: s.sourceName || s.name || 'Wire Source',
          url: s.url || '#',
          publishedAt: s.publishedAt || new Date().toISOString(),
          tier: s.tier || 2,
        })),
      }));

      setEvents(mapped);
      setTotalEvents(res.total);
      setCurrentPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setErrorMsg('Could not connect to database event feed. Please ensure the backend API server is running.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1);
  }, [selectedRegion, selectedCategory, selectedUrgency]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents(1);
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-white/10 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Core Intelligence Database</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              All Canonical Events & Articles
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-xl">
              Filter through verified events, regional state streams, and cross-corroborated publisher archives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEvents(currentPage)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, policy name, or headline..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111827]/70 border border-slate-200 dark:border-white/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Region selector */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Urgency selector */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="BREAKING">Breaking</option>
            <option value="TRENDING">Trending</option>
            <option value="IMPORTANT">Important</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-900 dark:text-white">{events.length}</span> of {totalEvents} events
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <RotateCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading events from PostgreSQL database...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-center space-y-2">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{errorMsg}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#111827]/60 border border-slate-200 dark:border-white/10 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No events found matching your criteria</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const primarySource = event.sources?.[0]?.name || 'Wire Source';
            const primaryUrl = event.sources?.[0]?.url || '#';
            const pubDate = event.lastUpdatedAt || event.firstPublishedAt;

            return (
              <div
                key={event.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#111827]/70 border border-slate-200 dark:border-white/10 hover:border-cyan-500/30 transition-all space-y-3 shadow-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-white/5">
                        {event.importanceLabel} • Rank {event.finalRankScore || 80}/100
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{event.region}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{event.category}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatRelativeTime(pubDate)}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    <Link to={`/events/${event.id}`}>{event.title}</Link>
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {event.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span>Source:</span>
                    <a
                      href={primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-500 inline-flex items-center gap-1"
                    >
                      <span>{primarySource}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {event.sources && event.sources.length > 1 && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                        +{event.sources.length - 1} corroborating
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/events/${event.id}`}
                    className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                  >
                    <span>Read Full Breakdown</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => fetchEvents(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => fetchEvents(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </button>
        </div>
      )}
    </div>
  );
};
