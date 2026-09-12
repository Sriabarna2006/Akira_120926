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
  RotateCw
} from 'lucide-react';
import { apiClient } from '../services/api';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams();
  const [explainLevel, setExplainLevel] = useState<'verySimple' | 'beginner' | 'student' | 'technical' | 'deepDive'>('beginner');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  // Default fallback data structure
  const [eventData, setEventData] = useState({
    id: id || 'story-1',
    title: 'Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
    category: 'Economy & Money',
    source: 'Financial Times & Reuters Wire',
    originalUrl: 'https://www.reuters.com/markets/rates-bonds/',
    publishedAt: 'September 12, 2026 • 2 hours ago',
    importanceLevel: 'MUST_KNOW',
    importanceScore: 92,
    
    breakdown: {
      whatHappened: 'Major central banks across key emerging and developed economies have signaled a transition in interest rate policy, adjusting repo rates and statutory reserve targets to stabilize consumer prices while avoiding industrial slowdown.',
      whyDidItHappen: 'Post-supply-chain stabilization, combined with shifting commodity import costs and currency liquidity fluctuations, prompted monetary policy committees to re-calibrate benchmark lending rates.',
      whyDoesItMatter: 'Directly dictates borrowing costs for personal home loans, commercial lines of credit, foreign institutional investment flows (FIIs), and overall consumer inflation rates.',
      whoIsAffected: [
        'Homeowners and car loan borrowers (monthly EMI adjustments)',
        'Small and Medium Enterprises (working capital borrowing rates)',
        'Equity and Bond Market Investors (asset price valuation shifts)',
        'Importers and Exporters (foreign exchange volatility)'
      ],
      whatCouldHappenNext: [
        'Commercial retail banks may recalibrate fixed deposit (FD) and savings account interest yields within 7 business days.',
        'Slight appreciation or stabilization in domestic currency against major trade baskets.',
        'Next quarterly economic review will measure whether retail inflation remains within the 4.0% tolerance band.'
      ],
      background: 'Following unprecedented global rate hikes in previous years to curb post-pandemic inflation spikes, central banks entered a holding phase. This latest adjustment represents the first coordinated shift toward neutral-to-supportive monetary balance.'
    },

    explanations: {
      verySimple: 'Think of the central bank as the "bank for all banks." When they change rates, borrowing money gets either cheaper or more expensive for everyone. They are making sure things don\'t get too expensive while helping businesses keep people employed.',
      beginner: 'A central bank controls how expensive it is to borrow money. When inflation (prices of everyday items) is high, they make loans more expensive so people spend less. Now that prices are cooling down, they are balancing rates so businesses can grow without triggering high prices again.',
      student: 'Monetary policy operates through the interest rate transmission channel. The Central Bank alters the benchmark Policy Repo Rate. Commercial banks adjust their Marginal Cost of Funds Based Lending Rate (MCLR), influencing aggregate demand (AD), investment (I), and the Consumer Price Index (CPI).',
      technical: 'The monetary policy committee adjusted open market operations (OMO) and statutory liquidity requirements. By shifting the policy corridor, interbank call money rates realign with overnight collateralized borrowing and lending obligations (CBLO), directly shifting the sovereign yield curve.',
      deepDive: 'Macroeconomic analysis: The central bank is responding to real positive interest rate differentials and shifts in the Taylor Rule optimal rate. With headline CPI converging towards target and core inflation softening, preserving the output gap requires moving from restrictive stance toward neutral rate ($r^*$) equilibrium.'
    },

    concepts: [
      { id: 'inflation', title: 'Inflation', desc: 'The rate at which general price levels for goods and services rise.' },
      { id: 'interest-rates', title: 'Interest Rates', desc: 'The cost of borrowing money or the reward for saving it.' },
      { id: 'central-bank', title: 'Central Bank', desc: 'The national institution that manages currency and monetary policy.' },
      { id: 'monetary-policy', title: 'Monetary Policy', desc: 'Actions taken by central banks to control money supply and promote sustainable growth.' }
    ],

    quiz: [
      {
        id: 1,
        question: 'When a central bank lowers its benchmark interest rate, what is the most direct expected outcome in the economy?',
        options: [
          'Borrowing costs for businesses and consumers generally decrease, stimulating spending.',
          'Borrowing costs immediately double to prevent loan taking.',
          'Currency value triples automatically in foreign exchange markets.',
          'Commercial banks are forbidden from issuing mortgages.'
        ],
        correctIndex: 0,
        explanation: 'Lowering benchmark rates reduces borrowing costs across commercial banks, encouraging investment and consumer spending.'
      },
      {
        id: 2,
        question: 'True or False: The primary goal of shifting from a restrictive stance to a neutral stance is to balance price stability with economic growth.',
        options: [
          'True — Once inflation approaches the target range, central banks calibrate rates to avoid choking growth.',
          'False — Central banks only care about corporate stock prices.'
        ],
        correctIndex: 0,
        explanation: 'A neutral stance aims to neither over-stimulate inflation nor unduly suppress industrial output.'
      },
      {
        id: 3,
        question: 'Scenario: Ramesh is planning to buy a home with a floating-rate mortgage. How does a central bank rate cut likely affect his monthly EMI payments over time?',
        options: [
          'His floating-rate EMI or loan tenure will likely decrease as banks pass on the rate cut.',
          'His EMI will immediately double because lower rates increase taxes.',
          'There is zero connection between central bank benchmark rates and floating-rate loans.',
          'The bank will cancel his loan agreement.'
        ],
        correctIndex: 0,
        explanation: 'Floating-rate loans are linked to external benchmarks (like repo rate); when the benchmark drops, banks reduce lending rates.'
      }
    ]
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient.get(`/articles/${id}`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setEventData(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Using baseline context for article:', err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    eventData.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  if (loading) {
    return (
      <div className="p-20 text-center space-y-4">
        <RotateCw className="h-8 w-8 text-brand-400 animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Generating AI comprehension breakdown & understanding quiz...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-16">
      
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/all-news"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Live Stream</span>
        </Link>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSaved(!isSaved)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isSaved 
                ? 'bg-brand-600/20 border-brand-500 text-brand-300' 
                : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-brand-400 text-brand-400' : ''}`} />
            <span>{isSaved ? 'Saved to Library' : 'Save Event'}</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="badge-must-know text-xs font-bold px-2.5 py-0.5 rounded-full">
            {((eventData as any).importanceLabel || eventData.importanceLevel || 'IMPORTANT').replace('_', ' ')} • Score {eventData.importanceScore}/100
          </span>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            {eventData.category}
          </span>
          <span className="text-xs text-slate-400">
            {eventData.publishedAt}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
          {eventData.title}
        </h1>

        {/* Source citation banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-300 font-semibold">Reported by:</span>
            {((eventData as any).sources && (eventData as any).sources.length > 0) ? (
              (eventData as any).sources.map((src: any, i: number) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 flex items-center gap-1 font-medium transition-colors"
                >
                  <span>{src.name}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ))
            ) : (
              <span className="text-slate-200 font-medium">{eventData.source}</span>
            )}
          </div>

          {eventData.originalUrl && (
            <a 
              href={eventData.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
            >
              <span>Original Wire</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* FEATURE 3: "EXPLAIN THIS" Multi-Level AI Selector */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-500/30 shadow-glow-purple">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-600/30 text-brand-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">AI Explainer — Choose Your Comprehension Level</h2>
              <p className="text-xs text-slate-400">Adaptive explanation tailored to your background knowledge.</p>
            </div>
          </div>
        </div>

        {/* 5 Level Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-white/5 mb-4">
          {[
            { id: 'verySimple', label: '1. Very Simple' },
            { id: 'beginner', label: '2. Beginner' },
            { id: 'student', label: '3. Student' },
            { id: 'technical', label: '4. Technical' },
            { id: 'deepDive', label: '5. Deep Dive' }
          ].map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setExplainLevel(lvl.id as any)}
              className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                explainLevel === lvl.id
                  ? 'bg-brand-600 text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Explanation Text */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 text-sm sm:text-base text-slate-200 leading-relaxed">
          {eventData.explanations[explainLevel]}
        </div>
      </div>

      {/* FEATURE 4: "TEACH ME" Prerequisite Learning Pathway */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Prerequisite Concepts to Master This Event</h2>
          </div>
          <span className="text-xs text-slate-400">Step-by-step learning loop</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {eventData.concepts.map((concept, idx) => (
            <Link 
              key={concept.id}
              to={`/learn?concept=${concept.id}`}
              className="p-4 rounded-xl bg-slate-900/90 border border-white/5 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Step {idx + 1}
                  </span>
                  <BookOpen className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {concept.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {concept.desc}
                </p>
              </div>
              <div className="mt-3 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span>Learn concept</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 7-PART STRUCTURED EVENT BREAKDOWN */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-400" />
          <span>Complete Event Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. What Happened */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-400" />
              <span>1. What Happened?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {eventData.breakdown.whatHappened}
            </p>
          </div>

          {/* 2. Why Did It Happen */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <History className="h-4 w-4 text-blue-400" />
              <span>2. Why Did It Happen?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {eventData.breakdown.whyDidItHappen}
            </p>
          </div>

          {/* 3. Why It Matters */}
          <div className="glass-panel p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <span>3. Why Does It Matter?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {eventData.breakdown.whyDoesItMatter}
            </p>
          </div>

          {/* 4. Background */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-teal-400" />
              <span>4. Background Context</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {eventData.breakdown.background}
            </p>
          </div>

        </div>

        {/* 5. Who is Affected & 6. What Could Happen Next */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Who is affected */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-400" />
              <span>5. Who Is Affected?</span>
            </h3>
            <ul className="space-y-2">
              {eventData.breakdown.whoIsAffected.map((item, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What could happen next */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-rose-400" />
              <span>6. What Could Happen Next? (Projections)</span>
            </h3>
            <ul className="space-y-2">
              {eventData.breakdown.whatCouldHappenNext.map((item, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* FEATURE 5: AI UNDERSTANDING QUIZ */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-brand-500/30 shadow-glass space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400 mb-1">
              <HelpCircle className="h-4 w-4" />
              <span>Test Your Understanding</span>
            </div>
            <h2 className="text-xl font-bold text-white">Event Comprehension Quiz (3 Questions)</h2>
            <p className="text-xs text-slate-400">Questions test comprehension rather than simple memorization.</p>
          </div>

          {showResults && (
            <div className="px-4 py-2 rounded-xl bg-brand-600/20 border border-brand-500 text-brand-300 text-sm font-bold self-start sm:self-auto">
              Score: {calculateScore()} / {eventData.quiz.length} Correct
            </div>
          )}
        </div>

        {/* Question Cards */}
        <div className="space-y-6">
          {eventData.quiz.map((q, qIndex) => {
            const isCorrect = selectedAnswers[qIndex] === q.correctIndex;

            return (
              <div key={q.id} className="p-5 rounded-xl bg-slate-900/90 border border-white/5 space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-brand-600/30 text-brand-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {qIndex + 1}
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                    {q.question}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2 pt-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[qIndex] === optIdx;
                    let optionStyle = 'bg-slate-950/80 border-white/10 text-slate-300 hover:border-brand-500/50 hover:text-white';

                    if (showResults) {
                      if (optIdx === q.correctIndex) {
                        optionStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-200';
                      } else if (isSelected) {
                        optionStyle = 'bg-rose-500/15 border-rose-500 text-rose-200';
                      } else {
                        optionStyle = 'bg-slate-950/40 border-white/5 text-slate-500 opacity-60';
                      }
                    } else if (isSelected) {
                      optionStyle = 'bg-brand-600/20 border-brand-500 text-white font-medium';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(qIndex, optIdx)}
                        disabled={showResults}
                        className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-3 transition-all ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {showResults && optIdx === q.correctIndex && (
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        {showResults && isSelected && optIdx !== q.correctIndex && (
                          <X className="h-4 w-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on reveal */}
                {showResults && (
                  <div className={`mt-3 p-3 rounded-xl text-xs leading-relaxed border ${
                    isCorrect 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                  }`}>
                    <strong>Explanation: </strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quiz Controls */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {Object.keys(selectedAnswers).length} of {eventData.quiz.length} answered
          </span>

          {!showResults ? (
            <button
              onClick={() => setShowResults(true)}
              disabled={Object.keys(selectedAnswers).length === 0}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-glow-purple transition-all"
            >
              Submit Quiz & Check Score
            </button>
          ) : (
            <button
              onClick={() => {
                setShowResults(false);
                setSelectedAnswers({});
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all"
            >
              Retake Quiz
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
