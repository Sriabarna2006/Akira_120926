import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  RotateCw, 
  Globe, 
  Flag, 
  Landmark,
  Clock
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
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
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

  const urgencyFilters = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'BREAKING', label: 'Breaking' },
    { id: 'TRENDING', label: 'Trending' },
    { id: 'IMPORTANT', label: 'Important' },
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const regionParam = selectedRegion === 'ALL' ? undefined : (selectedRegion === 'Tamil Nadu' ? 'tamil-nadu' : selectedRegion.toLowerCase());
      const urgencyParam = selectedUrgency === 'ALL' ? undefined : selectedUrgency;

      const [eventsRes, savedRes] = await Promise.allSettled([
        eventService.getLiveEvents({
          region: regionParam,
          urgency: urgencyParam,
        }),
        user ? eventService.getSavedEvents() : Promise.resolve([]),
      ]);

      if (eventsRes.status === 'fulfilled' && eventsRes.value.data.length > 0) {
        // Map database events to client CanonicalEvent shape
        const mapped: CanonicalEvent[] = eventsRes.value.data.map((e: any) => ({
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
      } else {
        setEvents([]);
      }

      if (savedRes.status === 'fulfilled') {
        setSavedEventIds(savedRes.value);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Failed to load events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedRegion, selectedUrgency]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
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
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Persisted Intelligence Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Canonical Events & Intelligence Stream
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Ranked canonical events corroborated across multi-tier sources.</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" /> Updated: {lastUpdated}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            onClick={handleRefresh}
            isLoading={refreshing}
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh Data
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

        {/* Urgency Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {urgencyFilters.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUrgency(u.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedUrgency === u.id
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white border-slate-900 dark:border-cyan-500/40 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-white/5'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingState count={4} message="Fetching verified events from database..." />
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((evt, idx) => (
            <EventCard
              key={evt.id || idx}
              event={evt}
              isSaved={savedEventIds.includes(evt.id)}
              onToggleSave={handleToggleSave}
              variant={idx === 0 && selectedRegion === 'ALL' ? 'featured' : 'standard'}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Radio className="w-8 h-8 text-rose-500" />}
          title={`No ${selectedUrgency !== 'ALL' ? selectedUrgency : ''} events in ${selectedRegion}`}
          description="We couldn't find events matching your selected filter. Switch filters or refresh the stream."
          actionLabel="Show All Regions"
          onAction={() => {
            setSelectedRegion('ALL');
            setSelectedUrgency('ALL');
          }}
        />
      )}
    </div>
  );
};
