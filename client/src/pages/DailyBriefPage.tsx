import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { ImportanceLevel } from '../types';

export const DailyBriefPage: React.FC = () => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const briefs = [
    {
      id: 'story-1',
      title: 'Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
      category: 'Economy & Money',
      source: 'Financial Times / Reuters',
      originalUrl: 'https://reuters.com',
      publishedAt: '2 hours ago',
      importanceLevel: 'MUST_KNOW' as ImportanceLevel,
      importanceScore: 92,
      summary: 'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
      whyItMatters: 'Directly impacts home loan EMIs, business borrowing costs, currency exchange rates, and consumer purchasing power.',
      estimatedReadTime: '3 min read',
      concepts: ['Inflation', 'Interest Rates', 'Monetary Policy']
    },
    {
      id: 'story-2',
      title: 'EU Enforces Comprehensive AI Act: What High-Risk AI Classification Means for Tech',
      category: 'AI & Technology',
      source: 'MIT Technology Review',
      originalUrl: 'https://technologyreview.com',
      publishedAt: '4 hours ago',
      importanceLevel: 'MUST_KNOW' as ImportanceLevel,
      importanceScore: 89,
      summary: 'The landmark European AI framework enters legal enforcement, requiring strict audits for biometric identification and generative foundational models.',
      whyItMatters: 'Sets the first legally binding global standard for generative AI compliance, data privacy, and algorithm transparency.',
      estimatedReadTime: '4 min read',
      concepts: ['AI Governance', 'Algorithmic Auditing', 'Compliance Frameworks']
    },
    {
      id: 'story-3',
      title: 'Critical Zero-Day Vulnerability Discovered in Cloud Identity Infrastructure',
      category: 'Cybersecurity',
      source: 'Wired Security',
      originalUrl: 'https://wired.com',
      publishedAt: '6 hours ago',
      importanceLevel: 'IMPORTANT' as ImportanceLevel,
      importanceScore: 78,
      summary: 'Security researchers unveil a token forging vulnerability allowing cross-tenant privilege escalation in multi-cloud SSO identity providers.',
      whyItMatters: 'Requires immediate enterprise patching to prevent unauthorized session hijacking across global cloud deployments.',
      estimatedReadTime: '2 min read',
      concepts: ['OAuth / JWT Tokens', 'Zero-Day Exploits', 'SSO Architecture']
    },
    {
      id: 'story-4',
      title: 'Global Semiconductor Consortium Unveils 1.4nm Next-Generation Architecture Roadmap',
      category: 'AI & Technology',
      source: 'IEEE Spectrum',
      originalUrl: 'https://spectrum.ieee.org',
      publishedAt: '8 hours ago',
      importanceLevel: 'INTERESTING' as ImportanceLevel,
      importanceScore: 68,
      summary: 'Advanced lithography breakthroughs promise 30% greater power efficiency for mobile edge neural processing units by 2028.',
      whyItMatters: 'Drives the future generation of on-device AI models and sovereign chip fabrication capabilities.',
      estimatedReadTime: '3 min read',
      concepts: ['Semiconductor Lithography', 'Edge Computing', 'Transistor Scaling']
    }
  ];

  const filteredBriefs = filterLevel === 'ALL' 
    ? briefs 
    : briefs.filter(b => b.importanceLevel === filterLevel);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Curated Daily Briefing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Today's Global Intelligence Brief
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Curated, scored, and prioritized to cut through the noise.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          {['ALL', 'MUST_KNOW', 'IMPORTANT', 'INTERESTING'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterLevel === lvl 
                  ? 'bg-brand-600 text-white shadow-glow-purple' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Briefs list */}
      <div className="space-y-4">
        {filteredBriefs.map((brief) => (
          <div 
            key={brief.id}
            className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={
                    brief.importanceLevel === 'MUST_KNOW' ? 'badge-must-know text-xs font-bold px-2.5 py-0.5 rounded-full' :
                    brief.importanceLevel === 'IMPORTANT' ? 'badge-important text-xs font-bold px-2.5 py-0.5 rounded-full' :
                    'badge-interesting text-xs font-bold px-2.5 py-0.5 rounded-full'
                  }>
                    {brief.importanceLevel.replace('_', ' ')} • {brief.importanceScore}/100
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{brief.category}</span>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {brief.publishedAt} • {brief.estimatedReadTime}
                </span>
              </div>

              <Link to={`/event/${brief.id}`}>
                <h2 className="text-lg sm:text-xl font-bold text-white hover:text-brand-300 transition-colors leading-snug">
                  {brief.title}
                </h2>
              </Link>

              <p className="text-slate-300 text-sm mt-2.5 leading-relaxed">
                {brief.summary}
              </p>

              {/* Why it matters */}
              <div className="mt-3.5 p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 text-xs text-slate-300 leading-relaxed">
                <strong className="text-amber-300 font-bold uppercase tracking-wider text-[11px] block mb-1">
                  Why it matters:
                </strong>
                {brief.whyItMatters}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500">Related Concepts:</span>
                {brief.concepts.map((c) => (
                  <Link 
                    key={c}
                    to={`/learn?concept=${encodeURIComponent(c)}`}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-brand-600/30 border border-slate-700 transition-colors"
                  >
                    {c}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <a 
                  href={brief.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <span>{brief.source}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <Link
                  to={`/event/${brief.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Explain & Quiz</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
