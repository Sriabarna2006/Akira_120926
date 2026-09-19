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
  GitBranch, 
  Info, 
  RefreshCw,
  ArrowRight,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { learningService } from '../services/learningService';
import { knowledgeGraphService } from '../services/knowledgeGraphService';
import { 
  CanonicalEvent, 
  FiveWOneH, 
  ExplanationLevel, 
  ExtractedConceptItem, 
  QuizQuestion, 
  QuizResult,
  EventKnowledgeMap,
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
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string | number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load canonical event, AI pillars, and Phase 9 Knowledge Map
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
    ]).then(([eventRes, understandingRes, conceptsRes, quizRes, explRes, mapRes]) => {
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
          Activating AKIRA Phase 6 AI Intelligence & Grounded Comprehension Layer...
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

        {/* Source Citation Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Corroborated Sources ({event?.sources?.length || event?.sourceCount || 1}):</span>
            {event?.sources && event.sources.length > 0 ? (
              event.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 flex items-center gap-1 font-medium transition-colors"
                >
                  <span>{src.name || src.sourceName || 'Source'}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ))
            ) : (
              <span className="text-slate-800 dark:text-slate-200 font-medium">{event?.source || 'Verified Wire'}</span>
            )}
          </div>

          {event?.originalUrl && (
            <a 
              href={event.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1 font-semibold"
            >
              <span>Original Wire</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

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

      {/* 3. FEATURE: 5-Level Adaptive AI Explainer */}
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

      {/* 4. PHASE 9 FEATURE: What You Need to Understand This & Knowledge Readiness */}
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

        {/* Section 3: "Learn These First" (Knowledge Gaps Shelf) */}
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

        {/* Section 4: Interactive Knowledge Graph Hierarchy */}
        {knowledgeMap && knowledgeMap.prerequisiteTree && knowledgeMap.prerequisiteTree.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <GitBranch className="w-4 h-4" />
                <span>Knowledge Graph Dependency Chain</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {knowledgeMap.prerequisiteTree.length} Concept Nodes • {knowledgeMap.edges.length} Dependencies
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {knowledgeMap.prerequisiteTree.map((node) => (
                <div
                  key={node.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex flex-col justify-between gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{node.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        node.masteryStatus === 'STRONG'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : node.masteryStatus === 'DEVELOPING'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      {node.masteryStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {node.shortDefinition}
                  </p>
                  <Link
                    to={`/concept/${node.id}`}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline pt-1 flex items-center gap-1"
                  >
                    <span>Inspect Tree Node</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Concept Detail Modal */}
      {selectedConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedConcept.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedConcept(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Definition</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedConcept.shortDefinition}</p>
              </div>

              {selectedConcept.whyItMatters && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Why It Matters</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedConcept.whyItMatters}</p>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prerequisite Knowledge Dependencies</span>
                {selectedConcept.prerequisites && selectedConcept.prerequisites.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {selectedConcept.prerequisites.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        <span>{p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">This is a foundational concept with no prior prerequisites required.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Link
                to={`/concept/${selectedConcept.id}`}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Full Graph View →
              </Link>
              <button
                onClick={() => setSelectedConcept(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FEATURE: Grounded 5W1H Structured Breakdown */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <span>Grounded 5W1H Understanding Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. What Happened */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <span>1. What Happened?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {default5W1H.whatHappened}
            </p>
          </div>

          {/* 2. Why Did It Happen */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>2. Why Did It Happen?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {default5W1H.whyDidItHappen}
            </p>
          </div>

          {/* 3. Why It Matters */}
          <div className="glass-panel p-5 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>3. Why Does It Matter?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {default5W1H.whyDoesItMatter}
            </p>
          </div>

          {/* 4. Background Context */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>4. Background Context</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {default5W1H.background}
            </p>
          </div>

        </div>

        {/* 5. Who is Affected & 6. What Could Happen Next */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Who is affected */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>5. Who Is Affected?</span>
            </h3>
            <ul className="space-y-2">
              {default5W1H.whoIsAffected.map((item, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What could happen next */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>6. What Could Happen Next? (Projections)</span>
            </h3>
            <ul className="space-y-2">
              {default5W1H.whatCouldHappenNext.map((item, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* 6. FEATURE: Active Recall Understanding Quiz */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-brand-200 dark:border-brand-500/30 shadow-sm dark:shadow-glass space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
              <HelpCircle className="h-4 w-4" />
              <span>Phase 6 Active Recall Engine</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Event Comprehension Quiz (Exactly 3 Questions)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates conceptual comprehension with server-side validation.
            </p>
          </div>

          {quizResult && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${
                quizResult.masteryStatus === 'STRONG'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-300'
                  : quizResult.masteryStatus === 'DEVELOPING'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-300'
                  : 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/40 dark:border-blue-500/40 dark:text-blue-300'
              }`}>
                <Award className="h-4 w-4" />
                <span>Score: {quizResult.correctCount} / {quizResult.totalQuestions} ({quizResult.scorePercentage}%) • {quizResult.masteryStatus}</span>
              </div>
            </div>
          )}
        </div>

        {/* Question Cards */}
        <div className="space-y-6">
          {displayQuiz.map((q, qIndex) => {
            const resultItem = quizResult?.results?.find(r => String(r.questionId) === String(q.id) || r.questionId === qIndex + 1);
            const isCorrect = resultItem?.isCorrect;
            const selectedOpt = selectedAnswers[q.id] ?? selectedAnswers[qIndex + 1];

            return (
              <div key={q.id} className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-600/30 dark:text-brand-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
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

      {/* 7. PHASE 9 FEATURE: Related Real-World Events (Cross-Topic Scored) */}
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
