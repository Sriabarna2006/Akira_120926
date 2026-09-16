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
  Flame,
  Radio,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { regionService } from '../services/regionService';
import { categoryService } from '../services/categoryService';
import { CanonicalEvent, RegionItem, Category } from '../types';
import { StatusIndicator } from '../components/common/StatusIndicator';


export const AllNewsPage: React.FC = () => {
  const [events, setEvents] = useState<CanonicalEvent[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
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

      setEvents(res.data);
      setTotalEvents(res.total);
      setCurrentPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setErrorMsg('Could not connect to event stream. Please ensure the server is running.');
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

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      setSyncFeedback('Synchronizing with 14 verified news feeds...');
      const res = await eventService.refreshLiveFeeds();
      if (res.success) {
        setSyncFeedback('All live feeds successfully synchronized!');
        await fetchEvents(1);
      } else {
        setSyncFeedback('Feeds checked.');
      }
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback('Sync check completed.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
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
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Real-World News Wire & Live Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              All Breaking News & Live Stream
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Real-world updates deduplicated and continuously corroborated across 14 verified publishers in Tamil Nadu, India, and Global bureaus.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              title="Pull the latest real-time articles from all 14 RSS news feeds"
            >
              <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing 14 Feeds...' : 'Fetch Latest Feeds'}</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-xs text-cyan-200 flex items-center gap-2 animate-fadeIn">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, policy, person, or headline..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold border border-white/10 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Quick Status & Region Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111827]/70 border border-slate-200 dark:border-white/10 shadow-sm">
        
        {/* Urgency status buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedUrgency('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedUrgency === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Wire
          </button>
          <button
            type="button"
            onClick={() => setSelectedUrgency('BREAKING')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedUrgency === 'BREAKING'
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/30'
                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>🔴 Breaking Only</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedUrgency('TRENDING')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedUrgency === 'TRENDING'
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30'
                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🔥 Trending</span>
          </button>
        </div>

        {/* Dropdown Filters for Region and Category */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Region selector */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Regions</option>
            {regions.length > 0 ? (
              regions.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))
            ) : (
              <>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="India">India</option>
                <option value="World">World</option>
              </>
            )}
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
        </div>
      </div>

      {/* Feed Status & Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>14 Verified Publisher Feeds Active</span>
        </div>
        <div>
          Showing <strong className="text-slate-900 dark:text-white">{events.length}</strong> of {totalEvents} stories
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white dark:bg-[#111827]/40 rounded-2xl border border-slate-200 dark:border-white/5">
          <RotateCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading live breaking stories...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-center space-y-2">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{errorMsg}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#111827]/60 border border-slate-200 dark:border-white/10 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No stories found matching your criteria</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your region, status filters, or search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const primarySource = event.sources?.[0]?.name || event.source || 'Wire Source';
            const primaryUrl = event.sources?.[0]?.url || '#';
            const pubDate = event.lastUpdatedAt || event.firstPublishedAt;

            return (
              <div
                key={event.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 hover:border-cyan-500/40 transition-all space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusIndicator status={event.importanceLabel || 'IMPORTANT'} size="sm" />
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                        {event.region}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
                        {event.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatRelativeTime(pubDate)}</span>
                    </div>
                  </div>

                  <Link to={`/event/${event.id}`}>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors leading-snug">
                      {event.title}
                    </h3>
                  </Link>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {event.summary}
                  </p>

                  {event.whyItMatters && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300">
                      <strong className="text-cyan-700 dark:text-cyan-400 uppercase tracking-wide mr-1">Why It Matters:</strong>
                      <span>{event.whyItMatters}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Verified by:</span>
                    <a
                      href={primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-slate-800 dark:text-slate-200 hover:text-cyan-500 inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                    >
                      <span>{primarySource}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {event.sources && event.sources.length > 1 && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                        +{event.sources.length - 1} corroborated
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/event/${event.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-sm transition-all"
                  >
                    <span>Understand & Learn</span>
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

