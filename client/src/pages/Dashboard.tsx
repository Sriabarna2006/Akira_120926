import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Radio, 
  ArrowRight, 
  GraduationCap, 
  Bookmark, 
  BarChart3, 
  Compass, 
  BookOpen, 
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { learningService } from '../services/learningService';
import { CanonicalEvent, ConceptChainStep, UserConceptMastery } from '../types';
import { EventCard } from '../components/cards/EventCard';
import { BriefCard } from '../components/cards/BriefCard';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/common/LoadingState';
import { MasteryBadge } from '../components/ui/Badge';

export const Dashboard: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [topEvents, setTopEvents] = useState<CanonicalEvent[]>([]);
  const [briefStories, setBriefStories] = useState<CanonicalEvent[]>([]);
  const [userMastery, setUserMastery] = useState<UserConceptMastery[]>([]);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Time-aware greeting
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const userName = user?.displayName || 'Explorer';

  // Sample structured learning chain (Section 10 requirement)
  const sampleConceptChain: ConceptChainStep[] = [
    { step: 1, title: 'Current Event', type: 'EVENT', description: 'Central Banks adjust interest rate corridors' },
    { step: 2, title: 'Inflation', type: 'CONCEPT', description: 'Generalized rise in consumer price indices' },
    { step: 3, title: 'Interest Rates', type: 'MECHANISM', description: 'Cost of borrowing & hurdle rate of capital' },
    { step: 4, title: 'Central Bank', type: 'REGULATION', description: 'Monetary regulator controlling money supply' },
    { step: 5, title: 'Monetary Policy', type: 'CONCEPT', description: 'Framework balancing growth vs price stability' },
    { step: 6, title: 'Economic Impact', type: 'IMPACT', description: 'Real GDP, mortgage EMIs & investment flows' },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        const [liveRes, briefRes, masteryRes, savedRes] = await Promise.allSettled([
          eventService.getTopEvents('ALL'),
          eventService.getDailyBrief(),
          learningService.getUserMastery(),
          eventService.getSavedEvents(),
        ]);

        if (!isMounted) return;

        if (liveRes.status === 'fulfilled' && liveRes.value.length > 0) {
          setTopEvents(liveRes.value.slice(0, 3));
        } else {
          // Clean structured UI shell placeholders ready for backend connection
          setTopEvents([
            {
              id: 'evt_macro_rates_2026',
              title: 'Reserve Bank & Global Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
              summary: 'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
              region: 'India',
              category: 'Economy & Money',
              importanceLabel: 'BREAKING',
              importanceScore: 92,
              finalRankScore: 95,
              whyItMatters: 'Directly impacts home loan EMIs, business borrowing costs, currency exchange rates, and consumer purchasing power.',
              estimatedReadTime: '3 min read',
              relatedConcepts: ['Inflation', 'Interest Rates', 'Monetary Policy', 'Central Banking'],
              firstPublishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
              lastUpdatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
              sourceCount: 3,
              sources: [{ name: 'Financial Times / Reuters', url: 'https://reuters.com', publishedAt: new Date().toISOString(), tier: 1 }],
            },
            {
              id: 'evt_ai_act_2026',
              title: 'EU Enforces Comprehensive AI Act: What High-Risk AI Classification Means for Tech',
              summary: 'Landmark AI framework enters legal enforcement requiring strict audits for biometric and generative foundational models.',
              region: 'World',
              category: 'AI & Technology',
              importanceLabel: 'TRENDING',
              importanceScore: 89,
              finalRankScore: 91,
              whyItMatters: 'Sets the first legally binding global standard for generative AI compliance, data privacy, and algorithm transparency.',
              estimatedReadTime: '4 min read',
              relatedConcepts: ['AI Governance', 'Algorithmic Auditing'],
              firstPublishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
              lastUpdatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
              sourceCount: 2,
              sources: [{ name: 'MIT Technology Review', url: 'https://technologyreview.com', publishedAt: new Date().toISOString(), tier: 1 }],
            },
            {
              id: 'evt_tn_semiconductor_2026',
              title: 'Tamil Nadu Announces ₹12,000 Cr Semiconductor Packaging & Assembly Hub',
              summary: 'State cabinet clears mega incentive policy to establish high-precision testing, OSAT, and chip design centers.',
              region: 'Tamil Nadu',
              category: 'AI & Technology',
              importanceLabel: 'IMPORTANT',
              importanceScore: 85,
              finalRankScore: 88,
              whyItMatters: 'Accelerates regional industrial transformation and creates thousands of high-tech engineering opportunities.',
              estimatedReadTime: '3 min read',
              relatedConcepts: ['Semiconductors', 'Industrial Policy', 'Supply Chains'],
              firstPublishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
              lastUpdatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
              sourceCount: 2,
              sources: [{ name: 'The Hindu', url: 'https://thehindu.com', publishedAt: new Date().toISOString(), tier: 1 }],
            },
          ]);
        }

        if (briefRes.status === 'fulfilled' && briefRes.value.length > 0) {
          setBriefStories(briefRes.value.slice(0, 1));
        } else {
          setBriefStories([
            {
              id: 'evt_macro_rates_2026',
              title: 'Global Macroeconomic Realignment: Inflation Anchoring & Central Bank Mandates',
              summary: 'A curated overview of how global monetary policies interact with domestic price indices and employment trajectories.',
              region: 'World',
              category: 'Economy & Money',
              importanceLabel: 'IMPORTANT',
              importanceScore: 94,
              finalRankScore: 96,
              whyItMatters: 'Establishes the macroeconomic foundation required to evaluate corporate hiring, currency volatility, and investment climate.',
              estimatedReadTime: '4 min read',
              relatedConcepts: ['Monetary Policy', 'Inflation', 'Liquidity Pools'],
              firstPublishedAt: new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
              sourceCount: 3,
              sources: [{ name: 'Bloomberg', url: 'https://bloomberg.com', publishedAt: new Date().toISOString(), tier: 1 }],
            },
          ]);
        }

        if (masteryRes.status === 'fulfilled') {
          setUserMastery(masteryRes.value);
        }

        if (savedRes.status === 'fulfilled') {
          setSavedEventIds(savedRes.value);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

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
      
      {/* 1. Welcome & Philosophy Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-50 via-white to-indigo-50 dark:from-cyan-950/60 dark:via-slate-900 dark:to-indigo-950/60 border border-cyan-200 dark:border-cyan-500/20 shadow-sm dark:shadow-glass">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Real-World Intelligence Assistant</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {greeting}, <span className="gradient-text-purple">{userName}</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Stay informed. Understand what matters. Keep learning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <Button
              onClick={() => navigate('/live')}
              size="md"
              variant="primary"
              leftIcon={<Radio className="w-4 h-4" />}
            >
              Live & Trending
            </Button>
            <Button
              onClick={() => navigate('/daily-brief')}
              size="md"
              variant="secondary"
              leftIcon={<BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
            >
              Today's Brief
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Live Updates & Today's Brief */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Live & Trending Preview */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live & Trending</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">High-velocity developments ranked across Tamil Nadu, India, and World</p>
                </div>
              </div>

              <Link
                to="/live"
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>View Top 10</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <LoadingState count={2} />
            ) : (
              <div className="space-y-4">
                {topEvents.map((evt, idx) => (
                  <EventCard
                    key={evt.id || idx}
                    event={evt}
                    isSaved={savedEventIds.includes(evt.id)}
                    onToggleSave={handleToggleSave}
                    variant={idx === 0 ? 'featured' : 'standard'}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section: Today's Curated Brief */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today's Brief</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Curated structural understanding behind today's biggest shifts</p>
                </div>
              </div>

              <Link
                to="/daily-brief"
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>Full Brief</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {briefStories.map((story) => (
              <BriefCard key={story.id} story={story} />
            ))}
          </section>

          {/* Section: Continue Learning Concept Pathway */}
          <section className="p-6 rounded-2xl bg-white dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-glass space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Continue Learning Pathway</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">From real-world event to underlying economic mechanism</p>
                </div>
              </div>

              <Link
                to="/learn"
                className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <span>Explore Concepts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Visual Concept Chain */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
              {sampleConceptChain.map((step) => (
                <div
                  key={step.step}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-2 relative group hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    <span>STEP {step.step}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300">{step.type}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">{step.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1 line-clamp-2">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right 1 Col: Knowledge Snapshot & Saved Items */}
        <div className="space-y-8">
          
          {/* Section: Knowledge Snapshot (Evidence-Based, No Fake Percentages) */}
          <section className="p-6 rounded-2xl bg-white dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-glass space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Knowledge Snapshot</h3>
              </div>
              <Link to="/knowledge" className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold">
                Details
              </Link>
            </div>

            {userMastery.length > 0 ? (
              <div className="space-y-3">
                {userMastery.slice(0, 3).map((item) => (
                  <div key={item.conceptId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{item.conceptTitle}</span>
                      <MasteryBadge status={item.status} size="xs" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.attemptsCount} quizzes completed</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-600 dark:text-cyan-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Learning Journey Ready</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your knowledge will populate as you read events and complete active recall quizzes.
                </p>
                <Button
                  onClick={() => navigate('/learn')}
                  size="xs"
                  variant="outline"
                  className="mt-1"
                >
                  Start First Concept
                </Button>
              </div>
            )}
          </section>

          {/* Section: Saved Items / Library Preview */}
          <section className="p-6 rounded-2xl bg-white dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-glass space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Saved Items</h3>
              </div>
              <Link to="/library" className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold">
                View All
              </Link>
            </div>

            {savedEventIds.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  You have <strong>{savedEventIds.length}</strong> saved {savedEventIds.length === 1 ? 'item' : 'items'} in your library.
                </p>
                <Button
                  onClick={() => navigate('/library')}
                  size="sm"
                  variant="secondary"
                  className="w-full"
                >
                  Open My Library
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-center space-y-2">
                <Bookmark className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Your library is currently empty.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Click the bookmark icon on any event or concept to save it for later revision.
                </p>
              </div>
            )}
          </section>

          {/* Section: Topic Discovery Exploration Banner */}
          <section className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Explore Topics</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Explore real-world events across Tamil Nadu, India, World, AI, Energy, and Economics.
            </p>
            <Button
              onClick={() => navigate('/explore')}
              size="sm"
              variant="outline"
              className="w-full"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Browse All Topics
            </Button>
          </section>

        </div>

      </div>

    </div>
  );
};
