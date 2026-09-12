import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  RotateCw, 
  Search, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  TrendingUp,
  Layers,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../services/api';
import { CanonicalEvent } from '../types';

export const AllNewsPage: React.FC = () => {
  const [articles, setArticles] = useState<CanonicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedImportance, setSelectedImportance] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLiveNews = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      // Try /live first, with fallback
      let res;
      try {
        res = await apiClient.get('/live');
      } catch {
        res = await apiClient.get('/news/live');
      }

      if (res.data?.success && Array.isArray(res.data.data)) {
        setArticles(res.data.data);
        setLastSyncTime(res.data.meta?.lastSyncTime || new Date().toISOString());
      } else if (Array.isArray(res.data)) {
        setArticles(res.data);
        setLastSyncTime(new Date().toISOString());
      }
    } catch (err: any) {
      console.error('Failed to load live news:', err);
      setErrorMsg('Could not connect to live news stream. Please ensure the backend API server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage('Connecting to Tamil Nadu, India & global wire feeds...');
      let res;
      try {
        res = await apiClient.post('/live/sync');
      } catch {
        res = await apiClient.post('/news/sync');
      }

      if (res.data?.success) {
        const newCount = res.data.data?.newCount ?? 0;
        const total = res.data.data?.totalEvents ?? articles.length;
        setSyncMessage(`✓ Synced! Added ${newCount} updates. Total events: ${total}`);
        await fetchLiveNews();
        setTimeout(() => setSyncMessage(null), 4000);
      } else {
        setSyncMessage('Sync finished.');
        await fetchLiveNews();
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      setSyncMessage('Sync failed. Please check server connection.');
      setTimeout(() => setSyncMessage(null), 3500);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();

    // Auto refresh every 60 seconds
    const interval = setInterval(() => {
      fetchLiveNews();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const regions = [
    { id: 'ALL', label: 'All Regions' },
    { id: 'Tamil Nadu', label: '🇮🇳 Tamil Nadu' },
    { id: 'India', label: '🇮🇳 India' },
    { id: 'World', label: '🌍 World' },
  ];

  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'AI & Technology', label: 'AI & Tech' },
    { id: 'Economy & Money', label: 'Economy' },
    { id: 'Cybersecurity', label: 'Cybersecurity' },
    { id: 'Science & Environment', label: 'Science' },
    { id: 'Government & Society', label: 'Government' },
    { id: 'India', label: 'India' },
    { id: 'World', label: 'World' },
  ];

  // Client-side instant multi-criteria filtering
  const filteredArticles = articles.filter((art) => {
    const artRegion = art.region || '';
    const matchesRegion = 
      selectedRegion === 'ALL' || 
      artRegion.toLowerCase().includes(selectedRegion.toLowerCase());

    const artCategory = art.category || '';
    const matchesCategory = 
      selectedCategory === 'ALL' || 
      artCategory.toLowerCase().includes(selectedCategory.toLowerCase());

    const artLabel = (art.importanceLabel || art.importanceLevel || '').toUpperCase();
    const matchesImportance = 
      selectedImportance === 'ALL' || 
      artLabel === selectedImportance.toUpperCase() ||
      (selectedImportance === 'MUST_KNOW' && (artLabel === 'BREAKING' || art.importanceScore >= 85));

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      (art.title && art.title.toLowerCase().includes(q)) || 
      (art.summary && art.summary.toLowerCase().includes(q)) ||
      (art.sources && art.sources.some(s => s.name.toLowerCase().includes(q))) ||
      (art.source && art.source.toLowerCase().includes(q)) ||
      (art.relatedConcepts && art.relatedConcepts.some(c => c.toLowerCase().includes(q)));

    return matchesRegion && matchesCategory && matchesImportance && matchesSearch;
  });

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const parsedTime = new Date(isoString).getTime();
      if (isNaN(parsedTime)) return 'Recently';
      const diffMs = Date.now() - parsedTime;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getBadgeStyle = (label?: string) => {
    const normalized = (label || 'IMPORTANT').toUpperCase();
    if (normalized === 'BREAKING' || normalized === 'MUST_KNOW') {
      return 'badge-must-know text-[10px] font-bold px-2.5 py-0.5 rounded-full';
    }
    if (normalized === 'TRENDING') {
      return 'badge-important text-[10px] font-bold px-2.5 py-0.5 rounded-full';
    }
    return 'badge-interesting text-[10px] font-bold px-2.5 py-0.5 rounded-full';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* 1. Header & Live Controller Bar */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-brand-950/90 via-slate-900 to-slate-900 border border-brand-500/20 shadow-glass">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Live Multi-Source News & Intelligence Stream
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-medium text-slate-400">
                {articles.length} verified real-world events ingested
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              All News & Real-Time Intelligence Stream
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Continuously aggregated from Reuters, BBC, The Hindu, Economic Times, TechCrunch, and CNBC. Every article is classified, scored, and linked to prerequisite concept learning paths.
            </p>
          </div>

          {/* Sync action button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {syncMessage && (
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-fadeIn">
                {syncMessage}
              </span>
            )}
            
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-xs shadow-glow-purple transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <RotateCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Ingesting Latest Feeds...' : 'Fetch Latest News'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Error Banner if server disconnected */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={fetchLiveNews}
            className="px-3 py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-100 font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 3. Search & Filters Bar */}
      <div className="space-y-3">
        
        {/* Search Bar + Importance filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword (e.g. inflation, cybersecurity, Tamil Nadu, AI, RBI)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Importance Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-white/10 self-stretch sm:self-auto shrink-0">
            {['ALL', 'BREAKING', 'TRENDING', 'IMPORTANT'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedImportance(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedImportance === lvl 
                    ? 'bg-brand-600 text-white shadow-glow-purple' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Region & Category Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          
          {/* Region Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 self-start">
            {regions.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRegion === reg.id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-200 text-slate-900 font-bold shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* 4. Feed Status & Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Showing <strong>{filteredArticles.length}</strong> of <strong>{articles.length}</strong> live articles</span>
        <span>Last synced: {formatRelativeTime(lastSyncTime)}</span>
      </div>

      {/* 5. Main Articles List */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <RotateCw className="h-8 w-8 text-brand-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Aggregating live multi-source news feeds...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-white/10 space-y-3">
          <p className="text-slate-300 font-semibold">No articles match your current search or filters.</p>
          <button
            onClick={() => {
              setSelectedRegion('ALL');
              setSelectedCategory('ALL');
              setSelectedImportance('ALL');
              setSearchQuery('');
            }}
            className="text-xs text-brand-400 hover:underline font-semibold"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const importanceLabel = article.importanceLabel || article.importanceLevel || 'IMPORTANT';
            const primarySource = article.sources?.[0]?.name || article.source || 'Live Wire';
            const primaryUrl = article.sources?.[0]?.url || article.originalUrl || '#';
            const pubDate = article.lastUpdatedAt || article.firstPublishedAt || article.publishedAt || new Date().toISOString();

            return (
              <div
                key={article.id}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Header row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={getBadgeStyle(importanceLabel)}>
                        {importanceLabel} • {article.importanceScore || 80}/100
                      </span>
                      
                      {article.region && (
                        <span className="text-xs text-purple-300 font-medium bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                          {article.region}
                        </span>
                      )}

                      <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        {article.category}
                      </span>

                      {article.sourceCount && article.sourceCount > 1 && (
                        <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {article.sourceCount} sources verified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(pubDate)}
                      </span>
                      <span>•</span>
                      <span>{article.estimatedReadTime || '3 min read'}</span>
                    </div>
                  </div>

                  {/* Headline */}
                  <Link to={`/event/${article.id}`}>
                    <h2 className="text-lg sm:text-xl font-bold text-white hover:text-brand-300 transition-colors leading-snug">
                      {article.title}
                    </h2>
                  </Link>

                  {/* Summary */}
                  <p className="text-slate-300 text-xs sm:text-sm mt-2.5 leading-relaxed">
                    {article.summary}
                  </p>

                  {/* Why It Matters */}
                  {article.whyItMatters && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                      <TrendingUp className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 font-bold uppercase tracking-wider text-[10px] block">
                          Why It Matters
                        </strong>
                        <span className="mt-0.5 block">{article.whyItMatters}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions & Concept Links */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  
                  {/* Related concepts */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Prerequisites:</span>
                    {article.relatedConcepts?.slice(0, 3).map((c) => (
                      <Link
                        key={c}
                        to={`/learn?concept=${encodeURIComponent(c.toLowerCase().replace(/\s+/g, '-'))}`}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-brand-600/30 border border-slate-700/60 transition-colors flex items-center gap-1"
                      >
                        <BookOpen className="h-3 w-3 text-brand-400" />
                        <span>{c}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Source & Action button */}
                  <div className="flex items-center gap-3">
                    <a
                      href={primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <span>{primarySource}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <Link
                      to={`/event/${article.id}`}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1.5 shadow-glow-purple transition-all hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Explain & Quiz</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
