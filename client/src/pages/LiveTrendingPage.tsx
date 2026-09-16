import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  RotateCw, 
  Globe, 
  Flag, 
  Landmark, 
  Clock,
  Flame,
  AlertTriangle,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { CanonicalEvent, RegionType } from '../types';
import { EventCard } from '../components/cards/EventCard';
import { Tabs, TabItem } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const LiveTrendingPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState<RegionType>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [events, setEvents] = useState<CanonicalEvent[]>([]);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const regionTabs: TabItem<RegionType>[] = [
    { id: 'ALL', label: 'All Regions' },
    { id: 'Tamil Nadu', label: 'Tamil Nadu', icon: <Landmark className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'India', label: 'India', icon: <Flag className="w-3.5 h-3.5 text-orange-500" /> },
    { id: 'World', label: 'World', icon: <Globe className="w-3.5 h-3.5 text-blue-500" /> },
  ];

  const statusFilters = [
    { id: 'ALL', label: 'All Intelligence', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'BREAKING', label: '🔴 Breaking', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'TRENDING', label: '🔥 Trending', icon: <Flame className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'IMPORTANT', label: '🚨 Important', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
  ];

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const regionParam = selectedRegion === 'ALL' 
        ? undefined 
        : (selectedRegion === 'Tamil Nadu' ? 'tamil-nadu' : selectedRegion.toLowerCase());
      const statusParam = selectedStatus === 'ALL' ? undefined : selectedStatus;

      const [eventsRes, savedRes] = await Promise.allSettled([
        eventService.getTopEvents({
          region: regionParam,
          status: statusParam,
          limit: 10,
        }),
        user ? eventService.getSavedEvents() : Promise.resolve([]),
      ]);

      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value);
      } else {
        setEvents([]);
      }

      if (savedRes.status === 'fulfilled') {
        setSavedEventIds(savedRes.value);
      }
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Failed to load live ranking events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedRegion, selectedStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleSyncFeeds = async () => {
    try {
      setIsSyncing(true);
      await eventService.refreshLiveFeeds();
      await fetchEvents();
    } finally {
      setIsSyncing(false);
    }
  };


  const handleToggleSave = async (eventId: string) => {
    if (!user) {
      openAuthModal();
      return;
    }
    const isSaved = savedEventIds.includes(eventId);
    if (isSaved) {
      setSavedEventIds((prev) => prev.filter((id) => id !== eventId));
      await eventService.removeSavedEvent(eventId);
    } else {
      setSavedEventIds((prev) => [...prev, eventId]);
      await eventService.saveEvent(eventId);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span>Dynamic Live & Trending Top 10</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Live Intelligence Ranking</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-mono">
              Top 10
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Dynamic importance scoring & trend velocity across Tamil Nadu, India, and World.</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" /> Updated: {lastUpdated}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            onClick={handleSyncFeeds}
            isLoading={isSyncing}
            variant="primary"
            size="sm"
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            {isSyncing ? 'Syncing Feeds...' : 'Fetch Latest Feeds'}
          </Button>

          <Button
            onClick={handleRefresh}
            isLoading={refreshing}
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh Ranking
          </Button>
        </div>

      </div>

      {/* Filter & Region Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Region Tabs */}
        <Tabs<RegionType>
          tabs={regionTabs}
          activeTab={selectedRegion}
          onChange={(tab) => setSelectedRegion(tab)}
          variant="pills"
          size="sm"
        />

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusFilters.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedStatus(u.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedStatus === u.id
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white border-slate-900 dark:border-cyan-500/40 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-white/5'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ranked Events List */}
      {loading ? (
        <LoadingState count={4} message="Evaluating live trend velocity & importance rankings..." />
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((evt, idx) => {
            const rank = idx + 1;
            const meta = evt.rankingMetadata;
            return (
              <div key={evt.id || idx} className="relative group">
                {/* Ranking Position Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${
                    rank === 1 
                      ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30' 
                      : rank === 2 
                      ? 'bg-slate-300/30 text-slate-700 dark:text-slate-300 border border-slate-400/30' 
                      : rank === 3 
                      ? 'bg-amber-700/15 text-amber-700 dark:text-amber-500 border border-amber-700/30' 
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                  }`}>
                    <span>#{rank}</span>
                    <span className="font-sans text-[11px] font-medium opacity-80">
                      Rank Score: {evt.finalRankScore ?? 60}
                    </span>
                  </div>

                  {/* Honest Freshness Pill */}
                  {meta && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      meta.freshnessState === 'FRESH'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : meta.freshnessState === 'RECENT'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        : meta.freshnessState === 'AGING'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                    }`}>
                      ● {meta.freshnessState}
                    </span>
                  )}

                  {/* Evidence explanation snippet */}
                  {meta?.explanation && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      <Info className="w-3 h-3 text-cyan-500 opacity-70" />
                      {meta.explanation}
                    </span>
                  )}
                </div>

                <EventCard
                  event={evt}
                  isSaved={savedEventIds.includes(evt.id)}
                  onToggleSave={handleToggleSave}
                  variant={idx === 0 && selectedRegion === 'ALL' && selectedStatus === 'ALL' ? 'featured' : 'standard'}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<TrendingUp className="w-8 h-8 text-cyan-500" />}
          title={`No ${selectedStatus !== 'ALL' ? selectedStatus : ''} ranked events in ${selectedRegion}`}
          description="We couldn't find ranked events matching your selected filter. Switch filters or refresh the stream."
          actionLabel="Show All Intelligence"
          onAction={() => {
            setSelectedRegion('ALL');
            setSelectedStatus('ALL');
          }}
        />
      )}
    </div>
  );
};
