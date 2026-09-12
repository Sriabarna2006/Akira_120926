import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Radio, 
  RotateCw, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  Globe, 
  Flag, 
  MapPin, 
  Layers, 
  Flame, 
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../services/api';
import { CanonicalEvent, RegionType } from '../types';

export const LiveTrendingPage: React.FC = () => {
  const [top10Events, setTop10Events] = useState<CanonicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const fetchTop10 = async (region = selectedRegion) => {
    try {
      setLoading(true);
      const res = await apiClient.get('/live/top', {
        params: { region: region !== 'ALL' ? region : undefined }
      });
      if (res.data?.success) {
        setTop10Events(res.data.data);
        setLastSyncTime(new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to fetch Top 10 live events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage('Connecting to Tamil Nadu, India & Global news wires...');
      const res = await apiClient.post('/live/sync');
      if (res.data?.success) {
        setSyncMessage(`✓ Synced! Added ${res.data.data.newCount} updates.`);
        await fetchTop10(selectedRegion);
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch {
      setSyncMessage('Sync failed. Retrying...');
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchTop10(selectedRegion);

    // Auto-refresh every 60 seconds
    const timer = setInterval(() => {
      fetchTop10(selectedRegion);
    }, 60000);

    return () => clearInterval(timer);
  }, [selectedRegion]);

  const regionOptions: { id: string; label: string; icon: any }[] = [
    { id: 'ALL', label: 'All Regions (Top 10 Global & National)', icon: Radio },
    { id: 'Tamil Nadu', label: '🇮🇳 Tamil Nadu (First-Class)', icon: MapPin },
    { id: 'India', label: '🇮🇳 India (National)', icon: Flag },
    { id: 'World', label: '🌍 World (Global)', icon: Globe },
  ];

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
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

  const getLabelBadge = (label: string) => {
    switch (label) {
      case 'BREAKING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            🔴 BREAKING
          </span>
        );
      case 'TRENDING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            <Flame className="h-3 w-3 text-amber-400" />
            🔥 TRENDING
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm">
            <AlertCircle className="h-3 w-3 text-indigo-400" />
            🚨 IMPORTANT
          </span>
        );
    }
  };

  const getRegionBadge = (region: RegionType) => {
    if (region === 'Tamil Nadu') {
      return (
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/30 flex items-center gap-1">
          <MapPin className="h-3 w-3 text-orange-400" />
          <span>Tamil Nadu</span>
        </span>
      );
    }
    if (region === 'India') {
      return (
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <Flag className="h-3 w-3 text-emerald-400" />
          <span>India</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
        <Globe className="h-3 w-3 text-blue-400" />
        <span>World</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* 1. Header Banner & Live Sync Status */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 border border-rose-500/30 shadow-glass">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-rose-400">
                🔴 LIVE & TRENDING INTELLIGENCE
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-300">
                Dynamic Top 10 Ranking
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              What Is Happening Right Now?
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Intelligently ranked real-time updates across <strong>Tamil Nadu, India, and the World</strong>. Filtered for high real-world impact, clustered across multiple news sources, and ready for deep AI comprehension.
            </p>
          </div>

          {/* Action Button & Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {syncMessage && (
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-fadeIn">
                {syncMessage}
              </span>
            )}
            
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-brand-600 hover:from-rose-500 hover:to-brand-500 disabled:opacity-50 text-white font-bold text-xs shadow-glow-purple transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <RotateCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing Wires...' : 'Fetch Latest News'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Region Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-sm">
        {regionOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedRegion(opt.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedRegion === opt.id
                ? 'bg-brand-600 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <opt.icon className="h-3.5 w-3.5" />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Stream Status Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold text-slate-300">
          Showing <strong>Top {top10Events.length}</strong> real-time ranked events
        </span>
        <span>Last checked: {lastSyncTime ? formatRelativeTime(lastSyncTime) : 'Just now'}</span>
      </div>

      {/* 4. Top 10 Ranked Events Cards */}
      {loading ? (
        <div className="p-20 text-center space-y-4">
          <RotateCw className="h-8 w-8 text-rose-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Ranking top real-world developments across news wires...</p>
        </div>
      ) : top10Events.length === 0 ? (
        <div className="p-16 text-center rounded-2xl glass-panel border border-white/10 space-y-3">
          <p className="text-slate-300 font-semibold">No active live events in this regional filter right now.</p>
          <button
            onClick={() => setSelectedRegion('ALL')}
            className="text-xs text-brand-400 hover:underline font-semibold"
          >
            View All Regions
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {top10Events.map((event, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={event.id}
                className={`glass-panel glass-panel-hover p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isTop3 
                    ? 'border-brand-500/40 bg-gradient-to-r from-brand-950/40 via-slate-900 to-slate-900' 
                    : 'border-white/10'
                }`}
              >
                <div>
                  {/* Top metadata row */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Rank Badge */}
                      <span className={`h-6 w-6 rounded-lg font-black text-xs flex items-center justify-center ${
                        rank === 1 ? 'bg-amber-500 text-slate-950 shadow-md' :
                        rank === 2 ? 'bg-slate-300 text-slate-950' :
                        rank === 3 ? 'bg-amber-700 text-white' :
                        'bg-slate-800 text-slate-300 border border-white/10'
                      }`}>
                        #{rank}
                      </span>

                      {getLabelBadge(event.importanceLabel)}
                      {getRegionBadge(event.region)}

                      <span className="text-[11px] text-slate-400 font-medium bg-slate-800/80 px-2 py-0.5 rounded">
                        {event.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(event.lastUpdatedAt)}
                      </span>
                      <span>•</span>
                      <span>{event.estimatedReadTime}</span>
                    </div>
                  </div>

                  {/* Headline */}
                  <Link to={`/event/${event.id}`}>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white hover:text-brand-300 transition-colors leading-snug">
                      {event.title}
                    </h2>
                  </Link>

                  {/* Summary */}
                  <p className="text-slate-300 text-xs sm:text-sm mt-2.5 leading-relaxed">
                    {event.summary}
                  </p>

                  {/* Why It Matters */}
                  {event.whyItMatters && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                      <TrendingUp className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 font-bold uppercase tracking-wider text-[10px] block">
                          Why It Matters
                        </strong>
                        <span className="mt-0.5 block">{event.whyItMatters}</span>
                      </div>
                    </div>
                  )}

                  {/* Multi-source corroboration box */}
                  <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-slate-400" />
                      <span>Reported by {event.sources?.length || 1} source(s):</span>
                    </span>
                    {event.sources?.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center gap-1 transition-colors"
                      >
                        <span>{src.name}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions & Concept Links */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  
                  {/* Related concept pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Prerequisites:</span>
                    {event.relatedConcepts?.slice(0, 3).map((c) => (
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

                  {/* Action Button */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/event/${event.id}`}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-bold flex items-center gap-1.5 shadow-glow-purple transition-all hover:scale-105 active:scale-95"
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
