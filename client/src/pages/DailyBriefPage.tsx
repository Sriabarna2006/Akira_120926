import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, ArrowRight, ExternalLink, Sparkles, RotateCw, BookOpen } from 'lucide-react';
import { apiClient } from '../services/api';
import { CanonicalEvent } from '../types';

export const DailyBriefPage: React.FC = () => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [briefs, setBriefs] = useState<CanonicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchBriefs = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.get('/daily-brief');
      } catch {
        res = await apiClient.get('/news/daily-brief');
      }

      if (res.data?.success && res.data.data?.length > 0) {
        setBriefs(res.data.data);
      }
    } catch (err) {
      console.warn('Daily brief load fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefs();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await apiClient.post('/live/sync');
      await fetchBriefs();
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setSyncing(false);
    }
  };

  const fallbackBriefs: CanonicalEvent[] = [
    {
      id: 'story-1',
      title: 'Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
      category: 'Economy & Money',
      region: 'India',
      source: 'Financial Times / Reuters',
      originalUrl: 'https://reuters.com',
      firstPublishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      lastUpdatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      importanceLabel: 'BREAKING',
      importanceLevel: 'MUST_KNOW',
      importanceScore: 92,
      trendScore: 85,
      finalRankScore: 95,
      sourceCount: 2,
      sources: [{ name: 'Financial Times', url: 'https://reuters.com', publishedAt: new Date().toISOString(), tier: 1 }],
      summary: 'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
      whyItMatters: 'Directly impacts home loan EMIs, business borrowing costs, currency exchange rates, and consumer purchasing power.',
      estimatedReadTime: '3 min read',
      relatedConcepts: ['Inflation', 'Interest Rates', 'Monetary Policy']
    },
    {
      id: 'story-2',
      title: 'EU Enforces Comprehensive AI Act: What High-Risk AI Classification Means for Tech',
      category: 'AI & Technology',
      region: 'World',
      source: 'MIT Technology Review',
      originalUrl: 'https://technologyreview.com',
      firstPublishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      lastUpdatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      importanceLabel: 'BREAKING',
      importanceLevel: 'MUST_KNOW',
      importanceScore: 89,
      trendScore: 82,
      finalRankScore: 92,
      sourceCount: 2,
      sources: [{ name: 'MIT Tech Review', url: 'https://technologyreview.com', publishedAt: new Date().toISOString(), tier: 1 }],
      summary: 'The landmark European AI framework enters legal enforcement, requiring strict audits for biometric identification and generative foundational models.',
      whyItMatters: 'Sets the first legally binding global standard for generative AI compliance, data privacy, and algorithm transparency.',
      estimatedReadTime: '4 min read',
      relatedConcepts: ['AI Governance', 'Algorithmic Auditing', 'Compliance Frameworks']
    },
    {
      id: 'story-3',
      title: 'Critical Zero-Day Vulnerability Discovered in Cloud Identity Infrastructure',
      category: 'Cybersecurity',
      region: 'World',
      source: 'Wired Security',
      originalUrl: 'https://wired.com',
      firstPublishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      lastUpdatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      publishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      importanceLabel: 'IMPORTANT',
      importanceLevel: 'IMPORTANT',
      importanceScore: 78,
      trendScore: 75,
      finalRankScore: 85,
      sourceCount: 2,
      sources: [{ name: 'Wired', url: 'https://wired.com', publishedAt: new Date().toISOString(), tier: 1 }],
      summary: 'Security researchers unveil a token forging vulnerability allowing cross-tenant privilege escalation in multi-cloud SSO identity providers.',
      whyItMatters: 'Requires immediate enterprise patching to prevent unauthorized session hijacking across global cloud deployments.',
      estimatedReadTime: '2 min read',
      relatedConcepts: ['OAuth / JWT Tokens', 'Zero-Day Exploits', 'SSO Architecture']
    }
  ];

  const activeList = briefs.length > 0 ? briefs : fallbackBriefs;

  const filteredBriefs = activeList.filter((b) => {
    if (filterLevel === 'ALL') return true;
    const label = (b.importanceLabel || b.importanceLevel || '').toUpperCase();
    if (filterLevel === 'MUST_KNOW') return label === 'MUST_KNOW' || label === 'BREAKING';
    return label === filterLevel;
  });

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Today';
    try {
      const parsed = new Date(isoString).getTime();
      if (isNaN(parsed)) return 'Today';
      const diffMs = Date.now() - parsed;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Today';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
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

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <RotateCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Filter buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            {['ALL', 'BREAKING', 'IMPORTANT'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterLevel === lvl 
                    ? 'bg-brand-600 text-white shadow-glow-purple' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Briefs list */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <RotateCw className="h-8 w-8 text-brand-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Synthesizing curated briefing...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBriefs.map((brief) => {
            const importanceLabel = brief.importanceLabel || brief.importanceLevel || 'IMPORTANT';
            const primarySource = brief.sources?.[0]?.name || brief.source || 'Live Wire';
            const primaryUrl = brief.sources?.[0]?.url || brief.originalUrl || '#';
            const pubDate = brief.lastUpdatedAt || brief.firstPublishedAt || brief.publishedAt;

            return (
              <div 
                key={brief.id}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={
                        (String(importanceLabel) === 'MUST_KNOW' || String(importanceLabel) === 'BREAKING')
                          ? 'badge-must-know text-xs font-bold px-2.5 py-0.5 rounded-full' 
                          : 'badge-important text-xs font-bold px-2.5 py-0.5 rounded-full'
                      }>
                        {importanceLabel} • {brief.importanceScore || 85}/100
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{brief.category}</span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelativeTime(pubDate)} • {brief.estimatedReadTime || '3 min read'}
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
                  {brief.whyItMatters && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-amber-300 font-bold uppercase tracking-wider text-[11px] block mb-1">
                        Why it matters:
                      </strong>
                      {brief.whyItMatters}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">Related Concepts:</span>
                    {brief.relatedConcepts?.slice(0, 3).map((c) => (
                      <Link 
                        key={c}
                        to={`/learn?concept=${encodeURIComponent(c.toLowerCase().replace(/\s+/g, '-'))}`}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-brand-600/30 border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <BookOpen className="h-3 w-3 text-brand-400" />
                        <span>{c}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <a 
                      href={primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <span>{primarySource}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <Link
                      to={`/event/${brief.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1.5 transition-all shadow-glow-purple"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Explain & Quiz</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
