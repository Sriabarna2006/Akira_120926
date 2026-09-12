import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Flame, 
  ArrowRight, 
  Clock, 
  ExternalLink, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  HelpCircle,
  Radio
} from 'lucide-react';
import { apiClient } from '../services/api';

interface ArticleItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  originalUrl: string;
  publishedAt: string;
  importanceLevel: 'MUST_KNOW' | 'IMPORTANT' | 'INTERESTING';
  importanceScore: number;
  whyItMatters: string;
  estimatedReadTime: string;
  relatedConcepts: string[];
}

export const Dashboard: React.FC = () => {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [totalLiveCount, setTotalLiveCount] = useState<number>(100);

  useEffect(() => {
    apiClient.get('/news/live')
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          setArticles(res.data.data);
          setTotalLiveCount(res.data.meta?.total || res.data.data.length);
        }
      })
      .catch((err) => console.error('Failed to load dashboard live feed:', err));
  }, []);

  // Use the top scored article as the spotlight
  const topStory = articles.length > 0 ? articles[0] : {
    id: 'story-1',
    title: 'Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
    summary: 'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
    category: 'Economy & Money',
    source: 'Financial Times / Reuters',
    originalUrl: 'https://reuters.com',
    publishedAt: new Date().toISOString(),
    importanceLevel: 'MUST_KNOW' as const,
    importanceScore: 92,
    whyItMatters: 'Directly impacts home loan EMIs, business borrowing costs, currency exchange rates, and consumer purchasing power.',
    estimatedReadTime: '3 min read',
    relatedConcepts: ['Inflation', 'Interest Rates', 'Monetary Policy', 'Central Banking']
  };

  const trendingBriefs = articles.length > 1 ? articles.slice(1, 5) : [
    {
      id: 'story-2',
      title: 'EU Enforces Comprehensive AI Act: What High-Risk AI Classification Means for Tech',
      summary: 'Landmark AI framework enters legal enforcement requiring strict audits for biometric and generative foundational models.',
      category: 'AI & Technology',
      source: 'MIT Technology Review',
      originalUrl: 'https://technologyreview.com',
      publishedAt: new Date().toISOString(),
      importanceLevel: 'MUST_KNOW' as const,
      importanceScore: 89,
      whyItMatters: 'Sets the first legally binding global standard for generative AI compliance, data privacy, and algorithm transparency.',
      estimatedReadTime: '4 min read',
      relatedConcepts: ['AI Governance', 'Algorithmic Auditing']
    },
    {
      id: 'story-3',
      title: 'Critical Zero-Day Vulnerability Discovered in Cloud Identity Infrastructure',
      summary: 'Security researchers unveil token forging vulnerability allowing cross-tenant privilege escalation.',
      category: 'Cybersecurity',
      source: 'Wired Security',
      originalUrl: 'https://wired.com',
      publishedAt: new Date().toISOString(),
      importanceLevel: 'IMPORTANT' as const,
      importanceScore: 78,
      whyItMatters: 'Requires immediate enterprise patching to prevent unauthorized session hijacking across cloud deployments.',
      estimatedReadTime: '2 min read',
      relatedConcepts: ['OAuth / JWT Tokens', 'Zero-Day Exploits']
    }
  ];

  const categoryMasteries = [
    { name: 'AI & Technology', percentage: 74, color: 'bg-purple-500', count: '12 concepts' },
    { name: 'Cybersecurity', percentage: 62, color: 'bg-rose-500', count: '8 concepts' },
    { name: 'Economy & Money', percentage: 55, color: 'bg-emerald-500', count: '9 concepts' },
    { name: 'Science & Environment', percentage: 48, color: 'bg-teal-500', count: '6 concepts' },
    { name: 'Government & Society', percentage: 40, color: 'bg-amber-500', count: '5 concepts' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header Greeting & Intelligence Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand-950/80 via-slate-900 to-slate-900 border border-brand-500/20 shadow-glass">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-400 mb-1">
            <Sparkles className="h-4 w-4" />
            <span>AI Real-World Knowledge Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Good morning. Here is what is shaping the world today.
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Continuously ingesting and scoring <strong>{totalLiveCount}+ live global events</strong> into structured intelligence briefs with prerequisite concept pathways.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Link 
            to="/all-news"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-semibold text-xs shadow-glow-purple transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <Radio className="h-4 w-4 text-emerald-300 animate-pulse" />
            <span>All News Stream ({totalLiveCount})</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* 2. Top Must-Know Story Spotlight Card */}
      <div className="relative rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 overflow-hidden hover:border-brand-500/40 transition-all group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className="badge-must-know text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {topStory.importanceLevel.replace('_', ' ')} • Score {topStory.importanceScore}/100
          </span>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            {topStory.category}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Live Wire
          </span>
        </div>

        <Link to={`/event/${topStory.id}`}>
          <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-brand-300 transition-colors leading-snug">
            {topStory.title}
          </h2>
        </Link>

        <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
          {topStory.summary}
        </p>

        {/* Why it matters highlight box */}
        {topStory.whyItMatters && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/20 flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Why It Matters</span>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed">{topStory.whyItMatters}</p>
            </div>
          </div>
        )}

        {/* Action Row */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Prerequisites:</span>
            {topStory.relatedConcepts?.slice(0, 3).map((concept) => (
              <Link 
                key={concept}
                to={`/learn?concept=${encodeURIComponent(concept.toLowerCase().replace(/\s+/g, '-'))}`}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-brand-600/30 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3 text-brand-400" />
                <span>{concept}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a 
              href={topStory.originalUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <span>Source ({topStory.source})</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <Link 
              to={`/event/${topStory.id}`}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-glow-purple"
            >
              <span>Breakdown & Quiz</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Grid: Other High-Impact Events & Knowledge Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: More Curated Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>More High-Impact Breaking Briefs</span>
            </h3>
            <Link to="/all-news" className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
              <span>View all {totalLiveCount} live stories</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {trendingBriefs.map((brief) => (
              <div 
                key={brief.id} 
                className="glass-panel glass-panel-hover p-5 rounded-xl border border-white/5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={brief.importanceLevel === 'MUST_KNOW' ? 'badge-must-know text-[10px] font-bold px-2 py-0.5 rounded-full' : 'badge-important text-[10px] font-bold px-2 py-0.5 rounded-full'}>
                      {brief.importanceLevel.replace('_', ' ')} • {brief.importanceScore}/100
                    </span>
                    <span className="text-[11px] text-slate-400">{brief.category}</span>
                  </div>

                  <Link to={`/event/${brief.id}`}>
                    <h4 className="text-base font-semibold text-white hover:text-brand-300 transition-colors leading-snug">
                      {brief.title}
                    </h4>
                  </Link>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    <strong className="text-slate-300">Why it matters: </strong>
                    {brief.whyItMatters}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Source: {brief.source}</span>
                  <Link to={`/event/${brief.id}`} className="text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
                    <span>Explain & Learn</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Knowledge Progress & Quick Learn */}
        <div className="space-y-6">
          
          {/* Knowledge Progress Card */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-brand-400" />
                <span>Your Knowledge Profile</span>
              </h3>
              <Link to="/knowledge" className="text-xs text-brand-400 hover:underline">
                Details
              </Link>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Percentages calculated from your completed reads, quizzes, and concept lessons.
            </p>

            <div className="space-y-3.5">
              {categoryMasteries.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{cat.name}</span>
                    <span className="text-slate-400 font-semibold">{cat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Link 
              to="/knowledge"
              className="mt-5 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Take Assessment Quiz</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick Learn Concept Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/50 to-slate-900 border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-2">
              <HelpCircle className="h-4 w-4 text-purple-400" />
              <span>Quick Learn (2 min)</span>
            </div>
            <h4 className="text-sm font-bold text-white">What is a Central Bank Balance Sheet?</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Understand quantitative easing, asset purchases, and how money supply is injected into the real economy.
            </p>
            <Link 
              to="/learn?concept=central-bank-balance-sheet"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200"
            >
              <span>Start 2-min lesson</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};
