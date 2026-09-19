import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Flame, 
  CheckCircle2, 
  Layers, 
  GitBranch, 
  ArrowRight, 
  Sparkles, 
  RotateCw, 
  Target, 
  Compass, 
  ChevronRight, 
  Sliders, 
  BrainCircuit, 
  Zap, 
  CheckCircle, 
  BarChart3, 
  Lightbulb, 
  RefreshCw 
} from 'lucide-react';
import { 
  Concept, 
  MultiLevelExplanation, 
  LearningDashboardData, 
  DueReviewItem, 
  PersonalizedFeedItem, 
  DailyLearningSummary, 
  UserLearningPreferences, 
  PreferredDifficulty 
} from '../types';
import { MasteryBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { learningService } from '../services/learningService';
import { PersonalizedEventCard } from '../components/cards/PersonalizedEventCard';

export const LearnPage: React.FC = () => {
  const { user, token, openAuthModal, devLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const activeConceptSlug = searchParams.get('concept') || 'monetary-policy';

  const [activeTab, setActiveTab] = useState<'forYou' | 'spacedReview' | 'concepts'>('forYou');
  const [explanationLevel, setExplanationLevel] = useState<keyof MultiLevelExplanation>('student');
  const [selectedConceptSlug, setSelectedConceptSlug] = useState<string>(activeConceptSlug);

  // Phase 8 & Phase 7 State
  const [dailySummary, setDailySummary] = useState<DailyLearningSummary | null>(null);
  const [personalizedFeed, setPersonalizedFeed] = useState<PersonalizedFeedItem[]>([]);
  const [explorationItems, setExplorationItems] = useState<PersonalizedFeedItem[]>([]);
  const [dashboardData, setDashboardData] = useState<LearningDashboardData | null>(null);
  const [dueReviews, setDueReviews] = useState<DueReviewItem[]>([]);
  const [preferences, setPreferences] = useState<UserLearningPreferences | null>(null);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'GAP' | 'REVIEW' | 'AFFINITY'>('ALL');
  
  // Preferences Modal State
  const [showPrefModal, setShowPrefModal] = useState<boolean>(false);
  const [prefDailyGoal, setPrefDailyGoal] = useState<number>(3);
  const [prefDifficulty, setPrefDifficulty] = useState<PreferredDifficulty>('ADAPTIVE');
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchLearningData = async () => {
    if (!user) {
      return;
    }

    try {
      setRefreshing(true);
      const [summaryRes, feedRes, progRes, reviewsRes, prefsRes] = await Promise.all([
        learningService.getDailySummary(),
        learningService.getPersonalizedFeed({ limit: 12 }),
        learningService.getProgress(),
        learningService.getDueReviews(20),
        learningService.getPreferences(),
      ]);

      if (summaryRes) setDailySummary(summaryRes);
      if (progRes) setDashboardData(progRes);
      if (reviewsRes?.items) setDueReviews(reviewsRes.items);
      if (prefsRes) {
        setPreferences(prefsRes);
        setPrefDailyGoal(prefsRes.dailyGoal);
        setPrefDifficulty(prefsRes.preferredDifficulty);
      }

      if (feedRes?.items) {
        const regular = feedRes.items.filter((i) => !i.context.isExplorationSlot);
        const explore = feedRes.items.filter((i) => i.context.isExplorationSlot);
        setPersonalizedFeed(regular.length > 0 ? regular : feedRes.items);
        setExplorationItems(explore);
      }
    } catch (err) {
      console.warn('[LearnPage] Failed to fetch learning data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLearningData();
  }, [user, token]);

  const handleSavePreferences = async () => {
    try {
      setSavingPrefs(true);
      const updated = await learningService.updatePreferences({
        dailyGoal: prefDailyGoal,
        preferredDifficulty: prefDifficulty,
      });
      if (updated) {
        setPreferences(updated);
        setShowPrefModal(false);
        await fetchLearningData();
      }
    } catch (err) {
      console.warn('[LearnPage] Failed to save preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  // Filter personalized feed
  const filteredFeed = personalizedFeed.filter((item) => {
    if (feedFilter === 'ALL') return true;
    if (feedFilter === 'GAP') return item.reasonCode === 'WEAK_CONCEPT' || item.reasonCode === 'KNOWLEDGE_GAP';
    if (feedFilter === 'REVIEW') return item.reasonCode === 'REVIEW_DUE';
    if (feedFilter === 'AFFINITY') return item.reasonCode === 'CATEGORY_AFFINITY';
    return true;
  });

  // Concept Library Data
  const concepts: Concept[] = [
    {
      id: 'monetary-policy',
      title: 'Monetary Policy',
      slug: 'monetary-policy',
      category: 'Economy & Money',
      shortDefinition: 'The strategic framework and operational tools used by a central bank to control the supply of money, credit availability, and benchmark interest rates.',
      fullExplanation: 'Monetary policy is the primary macroeconomic steering wheel used by central banks (such as the RBI or the Federal Reserve) to promote maximum sustainable employment while keeping consumer price inflation near a stable target (typically 2–4%). When inflation accelerates, central banks employ contractionary policy by increasing policy rates. Conversely, during slowdowns, expansionary rate cuts stimulate lending and commercial investment.',
      prerequisites: [
        { id: 'inflation', title: 'Inflation', description: 'The continuous, generalized increase in aggregate prices of goods and services over time.' },
        { id: 'interest-rates', title: 'Interest Rates', description: 'The cost of borrowing money and the return on capital lent or deposited.' },
        { id: 'central-bank', title: 'Central Bank', description: 'The apex financial and monetary institution governing a country’s banking system.' }
      ],
      keyTakeaways: [
        'Expansionary Policy: Decreases borrowing costs to encourage business capital investment and consumer spending.',
        'Contractionary Policy: Increases interest rates to restrain aggregate demand and tame rapid inflation.',
        'Transmission Lag: Policy changes take between 6 to 18 months to fully propagate through credit markets and the real economy.',
      ],
      multiLevelExplanations: {
        verySimple: 'Think of monetary policy as a thermostat for the country’s money. If the economy gets too hot with high prices, the central bank turns on the AC (raises rates). If it gets too cold and slow, they turn on the heater (lowers rates).',
        beginner: 'Monetary policy is how a central bank manages how much money flows in the country. By making loans cheaper or more expensive, they control how much people and companies spend.',
        student: 'The central bank adjusts the benchmark repo/discount rate and reserve requirements. A higher rate raises commercial lending rates, reducing aggregate demand (AD) and curbing demand-pull inflation.',
        technical: 'Operating via open market operations (OMO), liquidity adjustment facilities (LAF), and repo corridor calibration, monetary transmission modulates the term structure of interest rates, broad money supply (M3), and yield curves.',
        deepDive: 'Examines dynamic stochastic general equilibrium (DSGE) frameworks, Taylor Rule interest rate targets, quantitative tightening balance-sheet dynamics, and cross-border currency parity adjustments.',
      },
      masteryStatus: 'DEVELOPING',
    },
    {
      id: 'ai-governance',
      title: 'AI Governance & Compliance',
      slug: 'ai-governance',
      category: 'AI & Technology',
      shortDefinition: 'The legal, institutional, and technical rules governing artificial intelligence systems to guarantee safety, algorithmic transparency, copyright compliance, and non-discrimination.',
      fullExplanation: 'AI governance encompasses regulations such as the EU AI Act and India’s DPDP guidelines that categorize artificial intelligence deployments into risk tiers (Unacceptable, High-Risk, Minimal). High-risk models in healthcare, law enforcement, and biometric surveillance require mandatory safety audits, data provenance verification, and human oversight fail-safes.',
      prerequisites: [
        { id: 'machine-learning', title: 'Machine Learning Basics', description: 'How deep neural networks discover statistical representations from training corpora.' },
        { id: 'data-privacy', title: 'Data Privacy & Ethics', description: 'Principles governing user consent, biometric storage, and unauthorized web scraping.' }
      ],
      keyTakeaways: [
        'Risk-Tiered Audits: Systems are audited based on potential societal harm rather than sheer model parameter count.',
        'Algorithmic Transparency: High-stakes automated decisions must provide explainable audit logs.',
        'Data Provenance: Developers must disclose copyrighted materials included in training datasets.',
      ],
      multiLevelExplanations: {
        verySimple: 'AI Governance is the rulebook for smart computers. Just like cars need speed limits and seatbelts, AI systems need safety checks so they do not hurt people or steal information.',
        beginner: 'It is the set of laws that requires tech companies to test their AI tools for bias, safety, and privacy before releasing them to the public.',
        student: 'A regulatory architecture classifying models into risk categories. High-risk systems must pass independent third-party audits and provide transparent data provenance.',
        technical: 'Involves model alignment protocols (RLHF, DPO), automated red-teaming for adversarial prompt injection, differential privacy preservation, and compliance reporting under ISO/IEC 42001.',
        deepDive: 'Explores constitutional AI architectures, jurisdictional divergence between EU risk-based frameworks and US executive directives, and liability frameworks for open-source weights.',
      },
      masteryStatus: 'STRONG',
    },
    {
      id: 'zero-day-exploit',
      title: 'Zero-Day Vulnerabilities',
      slug: 'zero-day-exploit',
      category: 'Cybersecurity',
      shortDefinition: 'A software vulnerability unknown to the software creator or vendor, leaving zero days of defense between discovery and initial exploitation.',
      fullExplanation: 'A zero-day exploit targets previously undisclosed software flaws before security patches or detection signatures are created. Because defensive mechanisms cannot rely on known vulnerability databases (CVEs), systems must rely on defense-in-depth, least privilege access, and runtime behavioral anomaly detection.',
      prerequisites: [
        { id: 'threat-actor', title: 'Threat Vectors', description: 'Attack pathways utilized by malicious actors to infiltrate target systems.' },
        { id: 'patch-management', title: 'Patch Management', description: 'The operational engineering cycle of testing and deploying software fixes.' }
      ],
      keyTakeaways: [
        'Asymmetric Advantage: Attackers have an advantage until the vendor develops and distributes a verified patch.',
        'Responsible Disclosure: Ethical security researchers disclose flaws privately to vendors under a 90-day patch window.',
        'Zero Trust Defense: Network segmentation and strict identity authentication limit the blast radius of zero-day exploits.',
      ],
      multiLevelExplanations: {
        verySimple: 'A zero-day is like a secret back door in a house that the builder does not know about, but a burglar finds. The builder has had "zero days" to install a lock.',
        beginner: 'A software bug that hackers discover before the developers do, meaning there is no update or fix ready to block the attack.',
        student: 'An unpatched vulnerability in an OS or application. Mitigation requires heuristic monitoring, sandboxing, and zero-trust authentication while the vendor writes a patch.',
        technical: 'Exploitation involves memory corruption (heap spraying, buffer overflows), return-oriented programming (ROP chains), or privilege escalation bypassing ASLR and DEP.',
        deepDive: 'Analyzes vulnerability brokers, memory-safe language migration (Rust in kernel spaces), hardware-enforced pointer authentication, and automated fuzzer suites.',
      },
      masteryStatus: 'NEEDS_LEARNING',
    },
  ];

  const currentConcept = concepts.find((c) => c.slug === selectedConceptSlug || c.id === selectedConceptSlug) || concepts[0];

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/40 via-slate-900 to-indigo-950/60 border border-purple-500/30 shadow-glass backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span>AKIRA Adaptive Learning & Personalized Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Intelligent Daily Learning
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mt-2">
              Continuous learning grounded in real news. AKIRA tracks what you understand, targets knowledge gaps, and serves explainable, personalized recommendations.
            </p>
          </div>

          {/* Quick Stats Pill */}
          {user && (
            <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-2xl shrink-0 backdrop-blur-md">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Daily Goal</div>
                <div className="text-lg font-black text-white flex items-baseline gap-1">
                  <span>{dailySummary?.activitiesCompletedToday || 0}</span>
                  <span className="text-xs text-slate-400 font-normal">/ {dailySummary?.dailyGoal || preferences?.dailyGoal || 3}</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700 mx-1" />
              <div>
                <div className="text-xs text-slate-400 font-medium">Streak</div>
                <div className="text-lg font-black text-amber-400 flex items-baseline gap-1">
                  <span>{dailySummary?.currentStreak ?? dashboardData?.currentStreak ?? 0}</span>
                  <span className="text-xs text-slate-400 font-normal">days</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700 mx-1" />
              <button
                onClick={fetchLearningData}
                disabled={refreshing}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Refresh Recommendations"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowPrefModal(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Learning Settings & Daily Goal"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('forYou')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'forYou'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>For You (Personalized Feed)</span>
          </button>
          <button
            onClick={() => setActiveTab('spacedReview')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'spacedReview'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Spaced Reviews ({dueReviews.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'concepts'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Concept Knowledge Graph</span>
          </button>
        </div>
      </div>

      {/* Guest / Unauthenticated Notice */}
      {!user && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-purple-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sign In for Personalized Adaptive Learning</h3>
              <p className="text-sm text-slate-400">
                Sign in to customize daily goals, track weak concepts, and receive deterministic recommendations tailored to your behavior.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="primary" onClick={openAuthModal}>
              Sign In / Register
            </Button>
            <Button variant="outline" onClick={() => devLogin('user')}>
              Demo Mode
            </Button>
          </div>
        </div>
      )}

      {/* 2. TAB 1: FOR YOU (PERSONALIZED DAILY FEED & GOAL PROGRESS) */}
      {activeTab === 'forYou' && (
        <div className="space-y-8">
          
          {/* Today's Goal Progress & Recommended Next Action Widget */}
          {dailySummary && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Goal Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-purple-500/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      Today's Learning Goal
                    </span>
                    <button
                      onClick={() => setShowPrefModal(true)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" />
                      Edit Goal
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {dailySummary.activitiesCompletedToday} of {dailySummary.dailyGoal}
                      <span className="text-xs text-slate-400 font-normal ml-2">activities</span>
                    </div>
                    <span className="text-sm font-bold text-purple-400">
                      {dailySummary.dailyGoalProgressPercentage}%
                    </span>
                  </div>

                  {/* Goal Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dailySummary.isDailyGoalAchieved
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, dailySummary.dailyGoalProgressPercentage)}%` }}
                    />
                  </div>

                  {dailySummary.isDailyGoalAchieved ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Daily Goal Complete! Fantastic momentum.</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">
                      {dailySummary.dailyGoal - dailySummary.activitiesCompletedToday} more learning activities to hit your target today.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-slate-800 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <div className="text-slate-400 text-[10px]">Quizzes</div>
                    <div className="font-bold text-white">{dailySummary.quizzesCompletedToday}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <div className="text-slate-400 text-[10px]">Mastered</div>
                    <div className="font-bold text-emerald-400">{dailySummary.conceptsMasteredToday}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <div className="text-slate-400 text-[10px]">Due Reviews</div>
                    <div className="font-bold text-amber-400">{dailySummary.reviewsDueToday}</div>
                  </div>
                </div>
              </div>

              {/* Recommended Next Action Banner */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-cyan-950/30 border border-indigo-500/30 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Highest-Priority Next Action
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                      {dailySummary.recommendedNextAction?.actionType || 'LEARN'}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {dailySummary.recommendedNextAction?.title || 'Explore Fresh Corroborated Intelligence'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {dailySummary.recommendedNextAction?.reason || 'AKIRA recommends exploring new verified events to expand your real-world knowledge graph.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                    <span>Preferred Level: <strong className="text-slate-200">{preferences?.preferredDifficulty || 'Adaptive'}</strong></span>
                  </div>

                  {dailySummary.recommendedNextAction?.eventId ? (
                    <Link
                      to={`/event/${dailySummary.recommendedNextAction.eventId}${dailySummary.recommendedNextAction.actionType === 'REVIEW' ? '#quiz' : ''}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-sm"
                    >
                      <span>Take Action Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => setActiveTab('concepts')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
                    >
                      <span>Browse Concepts</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Spaced Review Due Shelf (If items are due today) */}
          {dueReviews.length > 0 && (
            <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <RotateCw className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Active Recall Reviews Due Today</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                        {dueReviews.length} Due
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Automated SuperMemo SM-2 spaced repetition intervals to ensure durable long-term retention.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('spacedReview')}
                  className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dueReviews.slice(0, 3).map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <Badge variant="concept">{review.category}</Badge>
                        <span className="text-[11px] text-amber-400 font-bold">
                          {review.isOverdue ? `${review.overdueHours}h overdue` : 'Due today'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                        {review.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400">
                        Repetition: #{review.repetitionCount + 1}
                      </span>
                      {review.eventId && (
                        <Link
                          to={`/event/${review.eventId}#quiz`}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                        >
                          Review Quiz
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personalized "For You" Feed Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                  <span>Personalized Discovery Feed</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Real canonical news scored with composite 6-factor deterministic personalization.
                </p>
              </div>

              {/* Feed Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
                <button
                  onClick={() => setFeedFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    feedFilter === 'ALL'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({personalizedFeed.length})
                </button>
                <button
                  onClick={() => setFeedFilter('GAP')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    feedFilter === 'GAP'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Knowledge Gaps
                </button>
                <button
                  onClick={() => setFeedFilter('REVIEW')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    feedFilter === 'REVIEW'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Due Reviews
                </button>
                <button
                  onClick={() => setFeedFilter('AFFINITY')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    feedFilter === 'AFFINITY'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Interest Matches
                </button>
              </div>
            </div>

            {/* Feed Grid */}
            {filteredFeed.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredFeed.map((item) => (
                  <PersonalizedEventCard
                    key={item.event.id}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400">
                <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm">No items matching current filter.</p>
              </div>
            )}
          </div>

          {/* Discover Something New (Exploration Shelf - 15-25% Anti-Filter-Bubble) */}
          {explorationItems.length > 0 && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-slate-900/90 to-teal-950/20 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Discover Something New</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        Exploration Slot
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Curated topics outside your primary categories to prevent echo chambers and expand domain breadth.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {explorationItems.map((item) => (
                  <PersonalizedEventCard
                    key={`explore_${item.event.id}`}
                    item={item}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. TAB 2: SPACED REVIEW & LEARNING PROGRESS */}
      {activeTab === 'spacedReview' && (
        <div className="space-y-8">
          {/* Spaced Repetition Due List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Active Recall Review Queue</h2>
                <p className="text-xs text-slate-400">Items scheduled via SuperMemo SM-2 interval expansion algorithm</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
                {dueReviews.length} Ready For Review
              </span>
            </div>

            {dueReviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dueReviews.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="concept">{item.category}</Badge>
                        <span className={`text-xs font-bold ${item.isOverdue ? 'text-amber-400' : 'text-slate-400'}`}>
                          {item.isOverdue ? `${item.overdueHours}h Overdue` : 'Due Now'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Mastery: <strong className="text-purple-400">{item.masteryScore}%</strong></span>
                        <span>•</span>
                        <span>Interval: <strong className="text-slate-200">{item.intervalDays}d</strong></span>
                        <span>•</span>
                        <span>Reps: <strong className="text-slate-200">#{item.repetitionCount}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400">
                        Recommended: <strong className="text-slate-300 capitalize">{item.recommendedExplanationLevel}</strong>
                      </span>
                      {item.eventId && (
                        <Link
                          to={`/event/${item.eventId}#quiz`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                        >
                          <span>Review Quiz</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-base font-bold text-white">All Caught Up!</p>
                <p className="text-xs text-slate-400 mt-1">No spaced repetition reviews are due right now. Explore new events to add concepts.</p>
              </div>
            )}
          </div>

          {/* Category Mastery Breakdown */}
          {dashboardData?.categoryProgress && Object.keys(dashboardData.categoryProgress).length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>Domain Mastery Breakdown</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(dashboardData.categoryProgress).map(([cat, score]) => (
                  <div key={cat} className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300 capitalize">{cat}</span>
                      <span className="font-bold text-purple-400">{score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 3: CONCEPT KNOWLEDGE GRAPH */}
      {activeTab === 'concepts' && (
        <div className="space-y-8">
          
          {/* Concept Selector Pills */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Select Concept To Study:
            </span>
            <div className="flex flex-wrap gap-2">
              {concepts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConceptSlug(c.slug)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border ${
                    selectedConceptSlug === c.slug
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{c.title}</span>
                  <MasteryBadge status={c.masteryStatus} />
                </button>
              ))}
            </div>
          </div>

          {/* Active Concept Breakdown View */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
                  {currentConcept.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {currentConcept.title}
                </h2>
              </div>
              <MasteryBadge status={currentConcept.masteryStatus} />
            </div>

            {/* Short Definition */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-slate-200 text-sm sm:text-base leading-relaxed">
              <strong className="text-purple-300 font-bold block mb-1">Core Definition:</strong>
              {currentConcept.shortDefinition}
            </div>

            {/* Multi-Level Explanations Switcher */}
            {currentConcept.multiLevelExplanations && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Adaptive Complexity Level:
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['verySimple', 'beginner', 'student', 'technical', 'deepDive'] as (keyof MultiLevelExplanation)[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setExplanationLevel(level)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        explanationLevel === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {level === 'verySimple' && 'ELI5'}
                      {level === 'beginner' && 'Beginner'}
                      {level === 'student' && 'Student'}
                      {level === 'technical' && 'Technical'}
                      {level === 'deepDive' && 'Deep Dive'}
                    </button>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-300 leading-relaxed font-sans">
                  {currentConcept.multiLevelExplanations[explanationLevel]}
                </div>
              </div>
            )}

            {/* Prerequisites Map */}
            {currentConcept.prerequisites && currentConcept.prerequisites.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                  <GitBranch className="w-4 h-4 text-indigo-400" />
                  <span>Knowledge Graph Prerequisites</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentConcept.prerequisites.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-indigo-300">{p.title}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{p.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 5. PREFERENCES MODAL */}
      {showPrefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>Learning Preferences</span>
              </h3>
              <button
                onClick={() => setShowPrefModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Daily Goal Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Daily Learning Goal (Activities / Day)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={prefDailyGoal}
                  onChange={(e) => setPrefDailyGoal(Number(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-base font-extrabold text-purple-400 w-12 text-center px-2 py-1 rounded-lg bg-slate-800">
                  {prefDailyGoal}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Number of quizzes, explanations, or reviews you aim to complete daily.
              </p>
            </div>

            {/* Preferred Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Default Comprehension Complexity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'ADAPTIVE', label: 'Adaptive (Auto)' },
                    { id: 'BEGINNER', label: 'Beginner' },
                    { id: 'STUDENT', label: 'Student' },
                    { id: 'TECHNICAL', label: 'Technical' },
                    { id: 'DEEP_DIVE', label: 'Deep Dive' },
                  ] as { id: PreferredDifficulty; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrefDifficulty(opt.id)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                      prefDifficulty === opt.id
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setShowPrefModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSavePreferences} disabled={savingPrefs}>
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LearnPage;
