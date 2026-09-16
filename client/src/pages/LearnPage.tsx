import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Flame, 
  Clock,
  CheckCircle2, 
  Layers, 
  GitBranch, 
  ArrowRight, 
  Sparkles, 
  RotateCw, 
  TrendingUp, 
  Target, 
  Compass,
  ChevronRight
} from 'lucide-react';
import { 
  Concept, 
  MultiLevelExplanation, 
  LearningDashboardData, 
  DueReviewItem, 
  LearningRecommendation 
} from '../types';
import { MasteryBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { learningService } from '../services/learningService';

export const LearnPage: React.FC = () => {
  const { user, token, openAuthModal, devLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const activeConceptSlug = searchParams.get('concept') || 'monetary-policy';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'concepts'>('dashboard');
  const [explanationLevel, setExplanationLevel] = useState<keyof MultiLevelExplanation>('student');
  const [selectedConceptSlug, setSelectedConceptSlug] = useState<string>(activeConceptSlug);

  // Phase 7 Dashboard State
  const [dashboardData, setDashboardData] = useState<LearningDashboardData | null>(null);
  const [dueReviews, setDueReviews] = useState<DueReviewItem[]>([]);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchLearningData = async () => {
    if (!user) {
      return;
    }

    try {
      setRefreshing(true);
      const [prog, reviewsRes, recs] = await Promise.all([
        learningService.getProgress(),
        learningService.getDueReviews(20),
        learningService.getRecommendations(6),
      ]);

      if (prog) setDashboardData(prog);
      if (reviewsRes?.items) setDueReviews(reviewsRes.items);
      if (recs) setRecommendations(recs);
    } catch (err) {
      console.warn('[LearnPage] Failed to fetch learning data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLearningData();
  }, [user, token]);

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
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/40 via-slate-900 to-indigo-950/60 border border-purple-500/30 shadow-glass backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span>AKIRA Learning & Spaced Repetition Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Personalized Real-World Learning
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mt-2">
              Transform news events into durable long-term knowledge. AKIRA tracks what you understand, identifies weak concepts, and schedules active recall reviews.
            </p>
          </div>

          {/* Quick Streak & Mastery Badge */}
          {user && (
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-2xl shrink-0 backdrop-blur-md">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Active Streak</div>
                <div className="text-xl font-black text-white flex items-baseline gap-1">
                  <span>{dashboardData?.currentStreak || 0}</span>
                  <span className="text-xs text-slate-400 font-normal">days</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700 mx-2" />
              <div>
                <div className="text-xs text-slate-400 font-medium">Mastery</div>
                <div className="text-xl font-black text-purple-400">
                  {dashboardData?.overallMastery || 0}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>My Learning Profile</span>
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
            <span>Knowledge Concept Library</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT */}
      {activeTab === 'dashboard' ? (
        <div className="space-y-8">
          
          {/* Guest / Unauthenticated Notice */}
          {!user && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-purple-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Sign In to Track Your Personal Learning Profile</h3>
                  <p className="text-sm text-slate-400">
                    Sign in to track active streaks, record quiz scores, and receive automated SM-2 spaced repetition review schedules.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="primary" onClick={openAuthModal}>
                  Sign In / Create Account
                </Button>
                <Button variant="outline" onClick={() => devLogin('user')}>
                  Demo Mode
                </Button>
              </div>
            </div>
          )}

          {/* New User Honest Empty State */}
          {user && dashboardData?.isNewUser && (
            <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-purple-950/20 to-slate-900/90 border border-purple-500/30 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                <Compass className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Your Learning Journey Starts Here</h2>
              <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                You haven’t completed any active recall quizzes yet. Explore current real-world news events, read the grounded explanations, and test your understanding to activate your personalized spaced repetition schedule.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link to="/">
                  <Button variant="primary" className="gap-2">
                    <Compass className="w-4 h-4" />
                    <span>Explore Top Ranked Events</span>
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" className="gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Browse Knowledge Domains</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Progress Overview Grid (When User Has Data) */}
          {user && !dashboardData?.isNewUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Overall Mastery */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 transition-all backdrop-blur-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Overall Mastery</span>
                  <Target className="w-4 h-4 text-purple-400" />
                </div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{dashboardData?.overallMastery || 0}%</span>
                  <span className="text-xs font-medium text-slate-400">
                    {dashboardData?.overallMastery && dashboardData.overallMastery >= 80 ? 'Strong' : dashboardData?.overallMastery && dashboardData.overallMastery >= 50 ? 'Developing' : 'Building'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${dashboardData?.overallMastery || 0}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Spaced Repetition Due Queue */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all backdrop-blur-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Due Today Reviews</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">{dashboardData?.dueReviewsCount || 0}</span>
                  <span className="text-xs text-slate-400">items ready</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{dashboardData?.completedReviewsCount || 0} reviews completed</span>
                </div>
              </div>

              {/* Card 3: Active Streak */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-orange-500/40 transition-all backdrop-blur-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Learning Streak</span>
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-orange-400">{dashboardData?.currentStreak || 0}</span>
                  <span className="text-xs text-slate-400">consecutive days</span>
                </div>
                <div className="text-xs text-slate-400">
                  <span>Best streak: </span>
                  <strong className="text-slate-200">{dashboardData?.longestStreak || 0} days</strong>
                </div>
              </div>

              {/* Card 4: Knowledge Mastery Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all backdrop-blur-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Concepts Mastered</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">{dashboardData?.conceptsLearned || 0}</span>
                  <span className="text-xs text-slate-400">of {dashboardData?.totalItemsTracked || 0} tracked</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="text-yellow-400 font-semibold">{dashboardData?.conceptsDeveloping || 0} developing</span>
                  <span>•</span>
                  <span className="text-rose-400 font-semibold">{dashboardData?.conceptsNeedingLearning || 0} focus</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. DUE TODAY SPACED REPETITION QUEUE */}
          {user && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Today’s Due Reviews (SM-2 Spaced Repetition)</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                    {dueReviews.length}
                  </span>
                </div>
                {refreshing && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 animate-spin">
                    <RotateCw className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {dueReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dueReviews.map((item) => (
                    <div 
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all backdrop-blur-md flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                          <MasteryBadge status={item.masteryStatus} />
                        </div>
                        <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          <span>Interval: <strong className="text-slate-200">{item.intervalDays}d</strong></span>
                          <span>Reps: <strong className="text-slate-200">{item.repetitionCount}</strong></span>
                        </div>
                        <Link to={item.eventId ? `/event/${item.eventId}` : `/learn?concept=${item.conceptId}`}>
                          <Button size="sm" variant="primary" className="gap-1.5 text-xs py-1 px-3">
                            <span>Review Now</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                  <div className="text-emerald-400 font-bold flex items-center justify-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All Caught Up! No Reviews Due Right Now</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Your scheduled memory reinforcements are on track. Continue discovering new events or explore the concept graph below.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. RECOMMENDATIONS & WEAK CONCEPTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Personalized Next Steps */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Recommended Next Steps</h2>
              </div>

              <div className="space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, i) => (
                    <div 
                      key={i}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            rec.type === 'REVIEW_DUE' ? 'bg-amber-500/20 text-amber-300' :
                            rec.type === 'WEAK_CONCEPT' ? 'bg-rose-500/20 text-rose-300' :
                            rec.type === 'CONTINUE_LEARNING' ? 'bg-indigo-500/20 text-indigo-300' :
                            'bg-purple-500/20 text-purple-300'
                          }`}>
                            {rec.type.replace('_', ' ')}
                          </span>
                          {rec.category && <span className="text-xs text-slate-500">• {rec.category}</span>}
                        </div>
                        <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{rec.reason}</p>
                      </div>

                      <Link to={rec.eventId ? `/event/${rec.eventId}` : `/learn?concept=${rec.conceptId || ''}`}>
                        <Button size="sm" variant="outline" className="shrink-0 text-xs py-1 px-2.5 mt-1">
                          <span>Action</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 text-center">
                    Explore top real-world news to receive personalized learning recommendations.
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Category Mastery Distribution */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Category Mastery</h2>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                {dashboardData?.categoryProgress && Object.keys(dashboardData.categoryProgress).length > 0 ? (
                  Object.entries(dashboardData.categoryProgress).map(([catName, score]) => (
                    <div key={catName} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-300">{catName}</span>
                        <span className="text-purple-400 font-bold">{score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No category mastery recorded yet. Complete quizzes to unlock domain analytics.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* 5. CONCEPT LIBRARY TAB */
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

    </div>
  );
};

export default LearnPage;
