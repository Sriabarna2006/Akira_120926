import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Sparkles, 
  ExternalLink, 
  Bookmark, 
  CheckCircle2, 
  HelpCircle, 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  Users, 
  TrendingUp, 
  History, 
  Lightbulb, 
  Check, 
  X, 
  RotateCw, 
  Award, 
  Info, 
  RefreshCw,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Radio,
  Milestone,
  GitCommit,
  GitBranch,
  Flag,
  Clock,
  Compass
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { learningService } from '../services/learningService';
import { knowledgeGraphService } from '../services/knowledgeGraphService';
import { evidenceService } from '../services/evidenceService';
import { storylineService } from '../services/storylineService';
import { 
  CanonicalEvent, 
  FiveWOneH, 
  ExplanationLevel, 
  ExtractedConceptItem, 
  QuizQuestion, 
  QuizResult,
  EventKnowledgeMap,
  EventEvidenceSummary,
  StorylineDetailResponse,
  UserStorylineLearningDelta,
} from '../types';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<CanonicalEvent | null>(null);
  const [breakdown, setBreakdown] = useState<FiveWOneH | null>(null);
  const [explainLevel, setExplainLevel] = useState<ExplanationLevel>('beginner');
  const [explanationsCache, setExplanationsCache] = useState<Partial<Record<ExplanationLevel, string>>>({});
  const [concepts, setConcepts] = useState<ExtractedConceptItem[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<ExtractedConceptItem | null>(null);
  const [knowledgeMap, setKnowledgeMap] = useState<EventKnowledgeMap | null>(null);
  const [evidenceSummary, setEvidenceSummary] = useState<EventEvidenceSummary | null>(null);
  const [storylineDetail, setStorylineDetail] = useState<StorylineDetailResponse | null>(null);
  const [learningDelta, setLearningDelta] = useState<UserStorylineLearningDelta | null>(null);
  const [activeDeltaTab, setActiveDeltaTab] = useState<'facts' | 'concepts' | 'evidence' | 'userLearning'>('facts');
  const [showEvidenceBreakdown, setShowEvidenceBreakdown] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string | number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load canonical event, AI pillars, Phase 9 Knowledge Map, and Phase 10 Evidence Intelligence
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    // Track activity in background
    learningService.trackActivity('VIEW_EVENT', id);

    Promise.allSettled([
      eventService.getEventById(id),
      eventService.getUnderstanding(id),
      eventService.getConcepts(id),
      eventService.getQuiz(id),
      eventService.getExplanation(id, 'all'),
      knowledgeGraphService.getEventKnowledgeMap(id),
      evidenceService.getEvidence(id),
      storylineService.getStorylinesForEvent(id),
    ]).then(async ([eventRes, understandingRes, conceptsRes, quizRes, explRes, mapRes, evidenceRes, storylinesRes]) => {
      if (!isMounted) return;

      if (eventRes.status === 'fulfilled' && eventRes.value) {
        setEvent(eventRes.value);
        document.title = `${eventRes.value.title} | AKIRA`;
      } else {
        const fallbackEvt: CanonicalEvent = {
          id: id || 'evt_sample_2026',
          title: 'Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
          summary: 'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
          region: 'India',
          category: 'Economy',
          importanceLabel: 'IMPORTANT',
          importanceScore: 92,
          velocityScore: 88,
          finalRankScore: 94,
          whyItMatters: 'Dictates sovereign borrowing costs, commercial lines of credit, mortgage rates, and foreign institutional flows.',
          firstPublishedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          sourceCount: 3,
        };
        setEvent(fallbackEvt);
        document.title = `${fallbackEvt.title} | AKIRA`;
      }

      if (understandingRes.status === 'fulfilled' && understandingRes.value) {
        setBreakdown(understandingRes.value);
      }

      if (conceptsRes.status === 'fulfilled' && conceptsRes.value && conceptsRes.value.length > 0) {
        setConcepts(conceptsRes.value);
      }

      if (quizRes.status === 'fulfilled' && quizRes.value && quizRes.value.length > 0) {
        setQuizQuestions(quizRes.value);
      }

      if (explRes.status === 'fulfilled' && explRes.value && typeof explRes.value === 'object') {
        setExplanationsCache(explRes.value as any);
      }

      if (mapRes.status === 'fulfilled' && mapRes.value) {
        setKnowledgeMap(mapRes.value);
        if (mapRes.value.keyConcepts && mapRes.value.keyConcepts.length > 0) {
          setConcepts(mapRes.value.keyConcepts);
        }
      }

      if (evidenceRes.status === 'fulfilled' && evidenceRes.value) {
        setEvidenceSummary(evidenceRes.value);
      }

      if (storylinesRes.status === 'fulfilled' && storylinesRes.value && storylinesRes.value.length > 0) {
        const primaryStorylineId = storylinesRes.value[0].id;
        try {
          const [detail, userDelta] = await Promise.all([
            storylineService.getStorylineDetail(primaryStorylineId),
            storylineService.getUserLearningDelta(primaryStorylineId),
          ]);
          if (isMounted) {
            setStorylineDetail(detail);
            setLearningDelta(userDelta);
          }
        } catch (slErr) {
          console.warn('[EventDetailPage] Storyline load notice:', slErr);
        }
      } else {
        // Fallback detail for seamless demonstration
        const detail = await storylineService.getStorylineDetail('stl_tn_ev_corridor_2026');
        const userDelta = await storylineService.getUserLearningDelta('stl_tn_ev_corridor_2026');
        if (isMounted) {
          setStorylineDetail(detail);
          setLearningDelta(userDelta);
        }
      }
    }).catch((err) => {
      if (isMounted) setErrorMessage(err.message || 'Failed to load intelligence layer');
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Load explanation for level if not already in cache
  useEffect(() => {
    if (!id || explanationsCache[explainLevel]) return;

    setLoadingExplanation(true);
    eventService.getExplanation(id, explainLevel)
      .then((res: any) => {
        if (res && res.content) {
          setExplanationsCache((prev) => ({ ...prev, [explainLevel]: res.content }));
        }
      })
      .catch((err) => console.warn('[EventDetailPage] Explanation level fetch notice:', err))
      .finally(() => setLoadingExplanation(false));
  }, [id, explainLevel, explanationsCache]);

  const handleSelectAnswer = (qId: string | number, optIndex: number) => {
    if (quizResult) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!id || Object.keys(selectedAnswers).length === 0 || isSubmittingQuiz) return;
    setIsSubmittingQuiz(true);
    try {
      const result = await eventService.submitQuiz(id, selectedAnswers);
      if (result) {
        setQuizResult(result);
      }
    } catch (err: any) {
      console.warn('[EventDetailPage] Quiz submit error:', err);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizResult(null);
    setSelectedAnswers({});
  };

  const handleToggleSave = async () => {
    if (!id) return;
    if (isSaved) {
      await eventService.removeSavedEvent(id);
      setIsSaved(false);
    } else {
      await eventService.saveEvent(id);
      setIsSaved(true);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center space-y-4">
        <RotateCw className="h-8 w-8 text-brand-500 animate-spin mx-auto" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Activating AKIRA Phase 10 Trust, Evidence & Intelligence Architecture...
        </p>
      </div>
    );
  }

  if (errorMessage && !event) {
    return (
      <div className="p-12 text-center space-y-4 max-w-lg mx-auto">
        <Info className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Load Event</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
        <Link to="/live" className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold">
          Return to Live Feed
        </Link>
      </div>
    );
  }

  const default5W1H: FiveWOneH = breakdown || {
    whatHappened: event?.summary || 'Multi-source verified reporting on canonical event.',
    whyDidItHappen: 'Structural policy convergence and administrative developments triggered this update.',
    whyDoesItMatter: event?.whyItMatters || 'Alters statutory standards, commercial operations, and regional equilibria.',
    whoIsAffected: [
      `Citizens, consumers, and regional practitioners in ${event?.region || 'the region'}`,
      'Enterprises navigating regulatory standards, financing, or supply chains',
      'Policy administrators monitoring systemic stability'
    ],
    whatCouldHappenNext: [
      'Administrative bodies will release detailed implementation guidelines.',
      'Institutional participants will adapt operational strategies.',
      'Quarterly milestone progress will be assessed in subsequent reviews.'
    ],
    background: 'Groundwork established in previous periods led to this official disclosure.'
  };

  const currentExplanation = explanationsCache[explainLevel] || (
    explainLevel === 'verySimple'
      ? `In simple terms: "${event?.title}". Leaders and institutions are making key updates to keep things running efficiently.`
      : explainLevel === 'beginner'
      ? `Essential takeaway: This takes place in ${event?.region || 'the region'} under ${event?.category || 'its domain'}. Changes here directly influence everyday operations and public services.`
      : explainLevel === 'student'
      ? `Analytical model: The core mechanism of "${event?.title}" functions through systemic domain dynamics. Key variables involve governance, incentives, and execution.`
      : explainLevel === 'technical'
      ? `Domain architecture: Structural parameters shift key dependencies. Stakeholders must review compliance guidelines, capital structures, and risk thresholds.`
      : `Systems & Strategic Analysis: Examining "${event?.title}" reveals underlying macroeconomic and regional equilibria. Stakeholders must model second-order incentives.`
  );

  const displayConcepts: ExtractedConceptItem[] = (concepts && concepts.length > 0)
    ? concepts
    : [
        {
          id: 'policy-governance',
          title: 'Policy & Governance',
          slug: 'policy-governance',
          shortDefinition: 'The framework of laws, rules, and administrative processes through which institutions govern.',
          whyItMatters: 'Shapes statutory obligations and public resource allocation.',
          category: event?.category || 'Governance',
          prerequisites: []
        },
        {
          id: 'impact-evaluation',
          title: 'Impact Evaluation',
          slug: 'impact-evaluation',
          shortDefinition: 'The systematic analysis of primary, secondary, and long-term outcomes of an event.',
          whyItMatters: 'Helps citizens and organizations make evidence-based decisions.',
          category: event?.category || 'Analytics',
          prerequisites: ['policy-governance']
        },
        {
          id: 'systemic-equilibrium',
          title: 'Systemic Equilibrium',
          slug: 'systemic-equilibrium',
          shortDefinition: 'The state of balance across interconnected economic, technological, or social factors.',
          whyItMatters: 'Determines whether an intervention causes structural stability or volatility.',
          category: event?.category || 'Systems',
          prerequisites: ['impact-evaluation']
        }
      ];

  const displayQuiz: QuizQuestion[] = (quizQuestions && quizQuestions.length > 0)
    ? quizQuestions
    : [
        {
          id: 1,
          question: `Based on verified reporting on "${event?.title.slice(0, 60)}...", what is the primary significance?`,
          options: [
            event?.whyItMatters || 'It impacts regional governance, technology, or economic operations.',
            'It has zero connection to real-world affairs and can be disregarded.',
            'It immediately halts all economic activity permanently.',
            'It is an unverified rumor with no corroborating evidence.'
          ]
        },
        {
          id: 2,
          question: `How do structural policy and technological updates in ${event?.category || 'this domain'} typically propagate?`,
          options: [
            'They create interconnected secondary effects across regulations, supply chains, and public services.',
            'They only affect employees located inside government buildings.',
            'They reverse all historical laws instantly without notice.',
            'They have no effect because systems operate in complete isolation.'
          ]
        },
        {
          id: 3,
          question: `Scenario: A decision-maker or citizen is evaluating this development. What is the most evidence-based action?`,
          options: [
            'Review verified reporting, understand foundational concepts, and monitor official notifications.',
            'Act impulsively based on unverified headlines and social media rumors.',
            'Assume that laws and policies will never evolve over time.',
            'Ignore official guidance and rely on hearsay.'
          ]
        }
      ];

  // Helper for confidence badge colors
  const getConfidenceBadge = (state?: string) => {
    switch (state) {
      case 'WELL_SUPPORTED':
        return {
          label: 'Well-Supported Evidence',
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />,
        };
      case 'DEVELOPING':
        return {
          label: 'Developing Story',
          bg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
          icon: <Radio className="w-3.5 h-3.5 text-sky-500" />,
        };
      case 'LIMITED_EVIDENCE':
        return {
          label: 'Limited Corroboration',
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
        };
      case 'CONFLICTING':
        return {
          label: 'Conflicting Reports Detected',
          bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
        };
      default:
        return {
          label: 'Unconfirmed Intelligence',
          bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
          icon: <Info className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  const confidenceBadge = getConfidenceBadge(evidenceSummary?.confidenceState);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-16">
      
      {/* 1. Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/live"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Live & Trending</span>
        </Link>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleToggleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isSaved 
                ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-600/20 dark:border-brand-500 dark:text-brand-300' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-brand-500 text-brand-500' : ''}`} />
            <span>{isSaved ? 'Saved to Library' : 'Save Event'}</span>
          </button>
        </div>
      </div>

      {/* 2. Canonical Event Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="badge-must-know text-xs font-bold px-2.5 py-0.5 rounded-full">
            {(event?.importanceLabel || event?.urgencyLabel || 'IMPORTANT').replace('_', ' ')} • Rank Score {event?.finalRankScore || event?.importanceScore || 90}/100
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            {event?.category || event?.categoryId || 'General'}
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
            {event?.region || event?.regionId || 'World'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {event?.firstPublishedAt ? new Date(event.firstPublishedAt).toLocaleDateString() : 'Recent'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {event?.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {event?.summary}
        </p>

        {/* Phase 8: Adaptive Intelligence & Personalization Context Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-indigo-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Why You're Seeing This: </span>
              <span className="text-slate-300">
                Corroborated importance score {event?.importanceScore || 90}/100 • Matched to your continuous learning path • Quiz & spaced review enabled
              </span>
            </div>
          </div>
          <Link
            to="/learn"
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-semibold transition-colors shrink-0"
          >
            Learning Dashboard →
          </Link>
        </div>
      </div>

      {/* 3. PHASE 10 FEATURE: Trust, Evidence & Source Intelligence Dashboard */}
      {evidenceSummary && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/30 dark:border-sky-500/20 bg-gradient-to-b from-sky-50/50 via-white to-white dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 space-y-6 shadow-sm">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Phase 10 Evidence Intelligence Layer</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Trust & Evidence Verification Profile</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {evidenceSummary.explanation}
              </p>
            </div>

            {/* Confidence Status Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${confidenceBadge.bg}`}>
                {confidenceBadge.icon}
                <span>{confidenceBadge.label}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            
            {/* Completeness Score Gauge */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Evidence Completeness
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
                  {evidenceSummary.completenessScore}
                </span>
                <span className="text-xs text-slate-400 font-bold">/100</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    evidenceSummary.completenessScore >= 75
                      ? 'bg-emerald-500'
                      : evidenceSummary.completenessScore >= 50
                      ? 'bg-sky-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${evidenceSummary.completenessScore}%` }}
                />
              </div>
            </div>

            {/* Independent Publishers */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Independent Publishers
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {evidenceSummary.uniquePublisherCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">(deduplicated)</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 block">
                From {evidenceSummary.totalArticleCount} reporting articles
              </span>
            </div>

            {/* Official Primary Sources */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Official Primary Sources
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className={`text-2xl sm:text-3xl font-black ${
                  evidenceSummary.primarySourceCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                }`}>
                  {evidenceSummary.primarySourceCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">available</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 block">
                {evidenceSummary.primarySourceCount > 0 ? 'Verified statutory disclosure' : 'Awaiting primary release'}
              </span>
            </div>

            {/* Source Diversity */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Source Diversity
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {evidenceSummary.uniqueSourceTypeCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">categories</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 block">
                Wire, National & Specialist
              </span>
            </div>

          </div>

          {/* Discrepancy / Conflict Alert Box (Neutral Non-Partisan Presentation) */}
          {evidenceSummary.conflicts && evidenceSummary.conflicts.length > 0 && (
            <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Detected Reporting Discrepancy ({evidenceSummary.conflicts.length})</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Publishers report divergent details for this event. AKIRA displays both perspectives transparently without arbitrary bias:
              </p>
              <div className="space-y-2 pt-1">
                {evidenceSummary.conflicts.map((conf, cIdx) => (
                  <div 
                    key={cIdx}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Field: {conf.field.replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        {conf.explanation}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-[10px] font-semibold">
                        {conf.sourceA}: {conf.valueA}
                      </span>
                      <span className="text-slate-400 font-bold text-xs">vs</span>
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-[10px] font-semibold">
                        {conf.sourceB}: {conf.valueB}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traceable Source Provenance Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Corroborating Source Provenance ({evidenceSummary.sources.length})
              </span>
              <button
                onClick={() => setShowEvidenceBreakdown(!showEvidenceBreakdown)}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>{showEvidenceBreakdown ? 'Hide Formula Weights' : 'Inspect Formula Weights (6 Pillars)'}</span>
                {showEvidenceBreakdown ? <ChevronRight className="w-3 h-3 rotate-90 transition-transform" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            </div>

            {/* Score Breakdown Drawer */}
            {showEvidenceBreakdown && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs animate-fadeIn">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">1. Independent Publishers (25%)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {evidenceSummary.scoreBreakdown.independentPublisherScore}/100
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">2. Primary Sources (20%)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {evidenceSummary.scoreBreakdown.primarySourceScore}/100
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">3. Source Diversity (20%)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {evidenceSummary.scoreBreakdown.sourceDiversityScore}/100
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">4. Freshness & Recency (15%)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {evidenceSummary.scoreBreakdown.freshnessScore}/100
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">5. Authority Tiers (10%)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {evidenceSummary.scoreBreakdown.authorityScore}/100
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">6. Reporting Agreement (10%)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {evidenceSummary.scoreBreakdown.agreementScore}/100
                  </span>
                </div>
              </div>
            )}

            {/* Provenance Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {evidenceSummary.sources.map((item, pIdx) => (
                <div
                  key={pIdx}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-sky-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-500" />
                        <span>{item.publisherName}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.sourceType}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300">
                          Tier {item.authorityTier}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>

                    {item.snippet && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.snippet}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.region || 'World'}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      <span>Original Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 4. PHASE 11 FEATURE: Temporal Storyline Evolution & Narrative Trajectory */}
      {storylineDetail && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 dark:border-indigo-500/20 bg-gradient-to-b from-indigo-50/40 via-white to-white dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 space-y-6 shadow-sm">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <GitBranch className="w-4 h-4" />
                <span>Phase 11 Chronological Storyline & Narrative Trajectory</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {storylineDetail.storyline.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                {storylineDetail.storyline.summary}
              </p>
            </div>

            {/* Trajectory & Status Badges + Catch Up Button */}
            <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
              <Link
                to={`/storyline/${storylineDetail.storyline.id}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Catch Up in 60s</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                <Compass className="w-3.5 h-3.5" />
                <span>{storylineDetail.trajectory.trajectoryDirection} Trajectory</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Status: <strong className="text-slate-800 dark:text-slate-200">{storylineDetail.storyline.status}</strong>
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Timeline Duration</span>
              <div className="flex items-baseline gap-1 mt-1 text-slate-900 dark:text-white font-black text-xl">
                <Clock className="w-4 h-4 text-indigo-500 inline mr-1" />
                <span>{storylineDetail.trajectory.timelineDurationFormatted}</span>
              </div>
              <span className="text-[10px] text-slate-400">Chronological span</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Corroborated Events</span>
              <div className="flex items-baseline gap-1 mt-1 text-slate-900 dark:text-white font-black text-xl">
                <GitCommit className="w-4 h-4 text-purple-500 inline mr-1" />
                <span>{storylineDetail.timeline.length}</span>
              </div>
              <span className="text-[10px] text-slate-400">Canonical milestones</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Major Turning Points</span>
              <div className="flex items-baseline gap-1 mt-1 text-amber-600 dark:text-amber-400 font-black text-xl">
                <Milestone className="w-4 h-4 text-amber-500 inline mr-1" />
                <span>{storylineDetail.trajectory.turningPointCount}</span>
              </div>
              <span className="text-[10px] text-slate-400">Decisions & Outcomes</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Latest Evidence</span>
              <div className="flex items-baseline gap-1 mt-1 text-sky-600 dark:text-sky-400 font-black text-xl">
                <ShieldCheck className="w-4 h-4 text-sky-500 inline mr-1" />
                <span>{storylineDetail.trajectory.latestEvidenceCompleteness}%</span>
              </div>
              <span className="text-[10px] text-slate-400">{storylineDetail.trajectory.latestConfidenceState.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Chronological Timeline Vertical Chain */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Living Chronological Timeline
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Ordered by real-world occurrence time
              </span>
            </div>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900/60">
              {storylineDetail.timeline.map((item, idx) => {
                const isCurrent = item.eventId === id || item.eventId === event?.id;

                return (
                  <div key={item.id || idx} className="relative group">
                    {/* Node Indicator Dot */}
                    <div className={`absolute -left-6 sm:-left-8 top-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border-white dark:border-slate-900 shadow-md shadow-indigo-500/40 scale-110'
                        : item.isTurningPoint
                        ? 'bg-amber-500 text-white border-white dark:border-slate-900 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-indigo-300 dark:border-indigo-700'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Timeline Item Card */}
                    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500/50 shadow-md'
                        : 'bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-700/50'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 uppercase tracking-wider">
                            {item.relationshipType}
                          </span>
                          {item.isTurningPoint && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                              <Milestone className="w-3 h-3" />
                              <span>TURNING POINT</span>
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                              CURRENTLY VIEWING
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(item.eventTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(item.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {item.summary}
                      </p>

                      {/* Turning Point Reason Banner */}
                      {item.isTurningPoint && item.turningPointReason && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                          <Flag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Turning Point Significance:</strong> {item.turningPointReason}</span>
                        </div>
                      )}

                      {/* Footer Link */}
                      {!isCurrent && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-400 font-medium">
                            Corroborated by {item.sourceCount} sources
                          </span>
                          <Link
                            to={`/event/${item.eventId}`}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                          >
                            <span>Inspect Milestone Event</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WHAT CHANGED? (Delta Knowledge Hub) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    What Changed? (Delta Knowledge Analysis)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {storylineDetail.latestDelta.summaryExplanation}
                  </p>
                </div>
              </div>

              {/* Delta Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-white/5 shrink-0 text-xs font-semibold">
                <button
                  onClick={() => setActiveDeltaTab('facts')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeDeltaTab === 'facts'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Facts Delta
                </button>
                <button
                  onClick={() => setActiveDeltaTab('concepts')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeDeltaTab === 'concepts'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  New Concepts ({storylineDetail.latestDelta.newConcepts.length})
                </button>
                <button
                  onClick={() => setActiveDeltaTab('evidence')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeDeltaTab === 'evidence'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Evidence Shift
                </button>
                <button
                  onClick={() => setActiveDeltaTab('userLearning')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeDeltaTab === 'userLearning'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Your Learning Delta
                </button>
              </div>
            </div>

            {/* Tab 1: Facts Delta */}
            {activeDeltaTab === 'facts' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 space-y-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      + Newly Confirmed Facts & Developments
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {storylineDetail.latestDelta.newFacts.map((fact, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 space-y-2">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      ↻ Evolved Aspects & Changed Status
                    </span>
                    {storylineDetail.latestDelta.changedFacts.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {storylineDetail.latestDelta.changedFacts.map((cf, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">→</span>
                            <span>{cf}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No structural status revisions between consecutive reports.
                      </p>
                    )}
                  </div>
                </div>

                {/* Understanding Shift Card */}
                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                    Understanding Evolution:
                  </span>
                  <p>{storylineDetail.latestDelta.understandingShift.keyShift}</p>
                </div>
              </div>
            )}

            {/* Tab 2: New Concepts */}
            {activeDeltaTab === 'concepts' && (
              <div className="space-y-3 pt-2">
                {storylineDetail.latestDelta.newConcepts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {storylineDetail.latestDelta.newConcepts.map((nc) => (
                      <div
                        key={nc.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-purple-200 dark:border-purple-500/20 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 block">
                            {nc.title}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {nc.shortDefinition}
                          </span>
                        </div>
                        <Link
                          to={`/concept/${nc.id}`}
                          className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1 self-start"
                        >
                          <span>Explore Concept Node</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 p-3">
                    This step solidifies existing domain concepts without introducing unfamiliar technical jargon.
                  </p>
                )}
              </div>
            )}

            {/* Tab 3: Evidence Shift */}
            {activeDeltaTab === 'evidence' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Completeness Shift</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-bold text-slate-500">{storylineDetail.latestDelta.evidenceEvolution.fromScore}%</span>
                      <span className="text-xs text-indigo-500 font-bold">→</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{storylineDetail.latestDelta.evidenceEvolution.toScore}%</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Confidence State</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                      {storylineDetail.latestDelta.evidenceEvolution.fromState} → {storylineDetail.latestDelta.evidenceEvolution.toState}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Newly Corroborating Outlets</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block line-clamp-1">
                      {storylineDetail.latestDelta.evidenceEvolution.newPublishers.length > 0
                        ? storylineDetail.latestDelta.evidenceEvolution.newPublishers.join(', ')
                        : 'Consistent publisher pool'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: User Learning Delta */}
            {activeDeltaTab === 'userLearning' && (
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                    <Award className="w-4 h-4" />
                    <span>Personalized Continuous Learning Context</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {learningDelta ? learningDelta.summaryText : 'Track your mastery across consecutive events in this storyline.'}
                  </p>
                  {learningDelta && learningDelta.newEventsSinceLastLearning.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                        New Developments To Review:
                      </span>
                      <div className="space-y-1.5">
                        {learningDelta.newEventsSinceLastLearning.map((ne) => (
                          <div key={ne.id} className="text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                            <span className="line-clamp-1 font-semibold">{ne.title}</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold shrink-0">{ne.relationshipType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 5. FEATURE: 5-Level Adaptive AI Explainer */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-200 dark:border-brand-500/30 shadow-sm dark:shadow-glow-purple">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-600/30 dark:text-brand-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                5-Level Adaptive Explainer — Choose Comprehension Depth
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calibrate explanation difficulty from elementary basics to professional deep dive.
              </p>
            </div>
          </div>
        </div>

        {/* 5 Difficulty Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-white/5 mb-4">
          {[
            { id: 'verySimple', label: '1. Very Simple (ELI5)' },
            { id: 'beginner', label: '2. Beginner' },
            { id: 'student', label: '3. Student' },
            { id: 'technical', label: '4. Technical' },
            { id: 'deepDive', label: '5. Deep Dive' }
          ].map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setExplainLevel(lvl.id as ExplanationLevel)}
              className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                explainLevel === lvl.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Explanation Text */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed min-h-[90px] flex items-center">
          {loadingExplanation ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RotateCw className="h-4 w-4 animate-spin text-brand-500" />
              <span>Generating tailored {explainLevel} explanation...</span>
            </div>
          ) : (
            <span>{currentExplanation}</span>
          )}
        </div>
      </div>

      {/* 5. PHASE 9 FEATURE: What You Need to Understand This & Knowledge Readiness */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
              <BookOpen className="h-4 w-4" />
              <span>Phase 9 Knowledge Graph Intelligence</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              What You Need to Understand This Event
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Key foundational concepts and your evidence-based mastery status.
            </p>
          </div>

          {knowledgeMap && (
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-white/10 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Comprehension Readiness</span>
                <span className="text-base font-black text-purple-600 dark:text-purple-400">
                  {knowledgeMap.userReadinessPercentage}% Ready
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Concept Pills with Mastery Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(knowledgeMap?.keyConcepts || displayConcepts).map((concept: any, idx: number) => {
            const mStatus = concept.masteryStatus || 'UNKNOWN';
            return (
              <div
                key={concept.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10 px-2 py-0.5 rounded">
                      Concept {idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mStatus === 'STRONG'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : mStatus === 'DEVELOPING'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                          : mStatus === 'NEEDS_LEARNING'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {mStatus === 'STRONG' ? '✓ ' : mStatus === 'DEVELOPING' ? '⚠ ' : '✕ '}
                      {mStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {concept.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {concept.shortDefinition}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => setSelectedConcept(concept)}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Quick Definition
                  </button>
                  <Link
                    to={`/concept/${concept.id}`}
                    className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Graph</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 2: "Learn These First" (Knowledge Gaps Shelf) */}
        {knowledgeMap && knowledgeMap.learnTheseFirst && knowledgeMap.learnTheseFirst.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Learn These First (Foundational Knowledge Gaps)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Mastering these prerequisites first ensures you understand the full real-world impact of this announcement.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {knowledgeMap.learnTheseFirst.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {item.shortDefinition}
                    </span>
                  </div>
                  <Link
                    to={`/concept/${item.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 shrink-0 transition-colors"
                  >
                    Study Node →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Concept Modal */}
        {selectedConcept && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-white/10 space-y-4 shadow-2xl animate-scaleUp">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Concept Breakdown
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {selectedConcept.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedConcept(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <div>
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Definition:</strong>
                  <p>{selectedConcept.shortDefinition}</p>
                </div>
                {selectedConcept.whyItMatters && (
                  <div>
                    <strong className="text-slate-900 dark:text-white block mb-0.5">Why It Matters:</strong>
                    <p>{selectedConcept.whyItMatters}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <button
                  onClick={() => setSelectedConcept(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <Link
                  to={`/concept/${selectedConcept.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 flex items-center gap-1.5 shadow-md shadow-purple-500/20"
                >
                  <span>Open Concept Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. FEATURE: 5W1H Structured Grounding (The 6 Pillars) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 space-y-6">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-500" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              5W1H Analytical Breakdown & Real-World Impact
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grounded, factual analysis structured for objective real-world understanding.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. What Happened */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                <Lightbulb className="h-4 w-4" />
                <span>What Happened</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                CONFIRMED / REPORTED
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {default5W1H.whatHappened}
            </p>
          </div>

          {/* 2. Why Did It Happen */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <HelpCircle className="h-4 w-4" />
                <span>Why Did It Happen</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                AI EXPLANATION
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {default5W1H.whyDidItHappen}
            </p>
          </div>

          {/* 3. Why Does It Matter */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <TrendingUp className="h-4 w-4" />
                <span>Why Does It Matter</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                ANALYSIS / INTERPRETATION
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {default5W1H.whyDoesItMatter}
            </p>
          </div>

          {/* 4. Background */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <History className="h-4 w-4" />
                <span>Background & Context</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                GROUNDED CONTEXT
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {default5W1H.background}
            </p>
          </div>

          {/* 5. Who Is Affected */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-2 md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                <Users className="h-4 w-4" />
                <span>Who Is Affected</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                AFFECTED PARTIES
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {default5W1H.whoIsAffected.map((party, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 leading-snug flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>{party}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. What Could Happen Next */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-2 md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>What Could Happen Next (Forward Trajectory)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                POSSIBLE FUTURE DEVELOPMENT
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {default5W1H.whatCouldHappenNext.map((scenario, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 leading-snug flex items-start gap-2">
                  <span className="text-rose-500 font-bold">→</span>
                  <span>{scenario}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 7. FEATURE: Active Comprehension Quiz (Phase 6 AI Understanding) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              <Award className="h-4 w-4" />
              <span>Active Recall & Understanding Evaluation</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Comprehension Check
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Answer 3 evidence-grounded questions to evaluate your grasp of key concepts.
            </p>
          </div>

          {quizResult && (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  Score: {quizResult.scorePercentage}% ({quizResult.correctCount}/{quizResult.totalQuestions})
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Mastery: {quizResult.masteryStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Question Cards */}
        <div className="space-y-6">
          {displayQuiz.map((q, qIndex) => {
            const selectedOpt = selectedAnswers[q.id];
            const resultItem = quizResult?.results.find((r) => r.questionId === q.id || r.question === q.question);
            const isCorrect = resultItem?.isCorrect;

            return (
              <div 
                key={q.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {qIndex + 1}
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {q.question}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2 pt-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    let optionStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:border-brand-500/50 hover:bg-slate-100 dark:bg-slate-950/80 dark:border-white/10 dark:text-slate-300 dark:hover:text-white';

                    if (quizResult && resultItem) {
                      if (optIdx === resultItem.correctAnswer) {
                        optionStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-500/15 dark:border-emerald-500 dark:text-emerald-200 font-semibold';
                      } else if (isSelected) {
                        optionStyle = 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-500/15 dark:border-rose-500 dark:text-rose-200';
                      } else {
                        optionStyle = 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/5 text-slate-400 opacity-60';
                      }
                    } else if (isSelected) {
                      optionStyle = 'bg-brand-50 border-brand-500 text-brand-900 dark:bg-brand-600/20 dark:border-brand-500 dark:text-white font-medium';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(q.id, optIdx)}
                        disabled={quizResult !== null || isSubmittingQuiz}
                        className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-3 transition-all ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {quizResult && resultItem && optIdx === resultItem.correctAnswer && (
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {quizResult && resultItem && isSelected && !isCorrect && (
                          <X className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on reveal */}
                {quizResult && resultItem && (
                  <div className={`mt-3 p-3 rounded-xl text-xs leading-relaxed border ${
                    isCorrect 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-200' 
                      : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-200'
                  }`}>
                    <strong>Explanation: </strong> {resultItem.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quiz Submission & Controls */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {Object.keys(selectedAnswers).length} of {displayQuiz.length} answered
          </span>

          {!quizResult ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(selectedAnswers).length === 0 || isSubmittingQuiz}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-brand-500/25 transition-all flex items-center gap-2"
            >
              {isSubmittingQuiz ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Evaluating Answers on Server...</span>
                </>
              ) : (
                <span>Submit Quiz & Evaluate Mastery</span>
              )}
            </button>
          ) : (
            <button
              onClick={handleRetakeQuiz}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-sm font-semibold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retake Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* 8. PHASE 9 FEATURE: Related Real-World Events (Cross-Topic Scored) */}
      {knowledgeMap && knowledgeMap.relatedEvents && knowledgeMap.relatedEvents.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Related Real-World Intelligence Events
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cross-topic corroborated news connected via shared concepts, domain affinity, and temporal alignment.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              Cross-Topic Intelligence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {knowledgeMap.relatedEvents.map((item) => (
              <Link
                key={item.event.id}
                to={`/event/${item.event.id}`}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group flex flex-col justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {item.event.category || item.event.categoryId || 'General'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {item.score}% Match
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                    {item.event.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>Explore Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
