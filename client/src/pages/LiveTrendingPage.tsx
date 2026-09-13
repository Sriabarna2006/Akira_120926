import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  RotateCw, 
  Globe, 
  Flag, 
  Landmark 
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

  const regionTabs: TabItem<RegionType>[] = [
    { id: 'ALL', label: 'All Regions' },
    { id: 'Tamil Nadu', label: 'Tamil Nadu', icon: <Landmark className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'India', label: 'India', icon: <Flag className="w-3.5 h-3.5 text-orange-500" /> },
    { id: 'World', label: 'World', icon: <Globe className="w-3.5 h-3.5 text-blue-500" /> },
  ];

  const urgencyFilters = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'BREAKING', label: '🔴 Breaking' },
    { id: 'TRENDING', label: '🔥 Trending' },
    { id: 'IMPORTANT', label: '🚨 Important' },
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [eventsRes, savedRes] = await Promise.allSettled([
        eventService.getTopEvents(selectedRegion),
        eventService.getSavedEvents(),
      ]);

      if (eventsRes.status === 'fulfilled' && eventsRes.value.length > 0) {
        setEvents(eventsRes.value);
      } else {
        // Fallback UI shell dataset for Phase 2 frontend foundation
        setEvents([
          {
            id: 'evt_tn_ev_hub_2026',
            title: 'Tamil Nadu Cabinet Clears Mega Infrastructure & Electric Mobility Corridor Policy',
            summary: 'State government approves capital investment framework expanding metro transit links across Chennai and Hosur EV manufacturing hub.',
            region: 'Tamil Nadu',
            category: 'Government & Society',
            importanceLabel: 'BREAKING',
            importanceScore: 94,
            velocityScore: 90,
            finalRankScore: 96,
            whyItMatters: 'Accelerates high-speed regional transit corridors and strengthens clean mobility industrial employment in Tamil Nadu.',
            estimatedReadTime: '3 min read',
            relatedConcepts: ['EV Infrastructure', 'Transit Corridors', 'Industrial Policy'],
            firstPublishedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
            lastUpdatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
            sourceCount: 2,
            sources: [
              { name: 'The Hindu (Tamil Nadu)', url: 'https://thehindu.com', publishedAt: new Date().toISOString(), tier: 1 },
              { name: 'Times of India', url: 'https://timesofindia.indiatimes.com', publishedAt: new Date().toISOString(), tier: 1 },
            ],
          },
          {
            id: 'evt_macro_rates_2026',
            title: 'Reserve Bank of India & Global Central Banks Shift Monetary Policy Stance',
            summary: 'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
            region: 'India',
            category: 'Economy & Money',
            importanceLabel: 'IMPORTANT',
            importanceScore: 92,
            velocityScore: 88,
            finalRankScore: 94,
            whyItMatters: 'Directly shapes retail borrowing costs, investment decisions, and capital market valuations across sectors.',
            estimatedReadTime: '3 min read',
            relatedConcepts: ['Inflation', 'Interest Rates', 'Monetary Policy'],
            firstPublishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            lastUpdatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            sourceCount: 4,
            sources: [
              { name: 'Financial Times', url: 'https://ft.com', publishedAt: new Date().toISOString(), tier: 1 },
              { name: 'Reuters', url: 'https://reuters.com', publishedAt: new Date().toISOString(), tier: 1 },
            ],
          },
          {
            id: 'evt_ai_act_2026',
            title: 'EU Enforces Comprehensive AI Act: What High-Risk AI Classification Means for Tech',
            summary: 'Landmark AI framework enters legal enforcement requiring strict audits for biometric and generative foundational models.',
            region: 'World',
            category: 'AI & Technology',
            importanceLabel: 'TRENDING',
            importanceScore: 89,
            velocityScore: 85,
            finalRankScore: 91,
            whyItMatters: 'Sets the first legally binding global standard for generative AI compliance, data privacy, and algorithm transparency.',
            estimatedReadTime: '4 min read',
            relatedConcepts: ['AI Governance', 'Algorithmic Auditing'],
            firstPublishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            lastUpdatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            sourceCount: 3,
            sources: [
              { name: 'MIT Technology Review', url: 'https://technologyreview.com', publishedAt: new Date().toISOString(), tier: 1 },
              { name: 'BBC Tech', url: 'https://bbc.com', publishedAt: new Date().toISOString(), tier: 1 },
            ],
          },
          {
            id: 'evt_cyber_cloud_2026',
            title: 'Critical Zero-Day Vulnerability Discovered in Cloud Identity Infrastructure',
            summary: 'Security researchers unveil token forging vulnerability allowing cross-tenant privilege escalation.',
            region: 'World',
            category: 'Cybersecurity',
            importanceLabel: 'IMPORTANT',
            importanceScore: 86,
            velocityScore: 78,
            finalRankScore: 88,
            whyItMatters: 'Requires immediate enterprise patching to prevent unauthorized session hijacking across cloud deployments.',
            estimatedReadTime: '2 min read',
            relatedConcepts: ['OAuth / JWT Tokens', 'Zero-Day Exploits'],
            firstPublishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            lastUpdatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            sourceCount: 2,
            sources: [
              { name: 'Wired Security', url: 'https://wired.com', publishedAt: new Date().toISOString(), tier: 1 },
            ],
          },
        ]);
      }

      if (savedRes.status === 'fulfilled') {
        setSavedEventIds(savedRes.value);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedRegion]);

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

  // Filter events by urgency and region
  const filteredEvents = events.filter((evt) => {
    const matchesRegion = selectedRegion === 'ALL' || evt.region === selectedRegion;
    const matchesUrgency = selectedUrgency === 'ALL' || evt.importanceLabel === selectedUrgency;
    return matchesRegion && matchesUrgency;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 animate-pulse text-rose-500 dark:text-rose-400" />
            <span>Real-Time Intelligence Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Live & Trending Top 10
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            What is happening right now — ranked canonical events corroborated across multi-tier sources.
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
            Refresh Stream
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
        <LoadingState count={4} message="Ranking and corroborating incoming live events..." />
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((evt, idx) => (
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
