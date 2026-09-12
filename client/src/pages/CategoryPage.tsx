import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Compass, ArrowRight, Clock, Sparkles, ExternalLink, RotateCw, BookOpen, TrendingUp } from 'lucide-react';
import { apiClient } from '../services/api';
import { CanonicalEvent } from '../types';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams();
  const [articles, setArticles] = useState<CanonicalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const title = slug ? slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Category';

  useEffect(() => {
    const fetchCategoryEvents = async () => {
      try {
        setLoading(true);
        let res;
        try {
          res = await apiClient.get('/live', { params: { category: title } });
        } catch {
          res = await apiClient.get('/news/live', { params: { category: title } });
        }
        if (res.data?.success && Array.isArray(res.data.data)) {
          setArticles(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load category feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryEvents();
  }, [slug, title]);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-950/80 via-slate-900 to-slate-900 border border-brand-500/20">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
          <Compass className="h-4 w-4" />
          <span>Category Stream</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {title}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Verified intelligence feeds, contextual background, and concept prerequisites for {title}.
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <RotateCw className="h-8 w-8 text-brand-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading {title} intelligence feed...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center space-y-3">
          <p className="text-slate-300 font-semibold">No live articles currently filed under {title}.</p>
          <Link to="/all-news" className="text-xs text-brand-400 hover:underline font-semibold inline-flex items-center gap-1">
            <span>Explore all news streams</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => {
            const importanceLabel = article.importanceLabel || article.importanceLevel || 'IMPORTANT';
            const primarySource = article.sources?.[0]?.name || article.source || 'Live Wire';
            const primaryUrl = article.sources?.[0]?.url || article.originalUrl || '#';
            const pubDate = article.lastUpdatedAt || article.firstPublishedAt || article.publishedAt;

            return (
              <div
                key={article.id}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="badge-must-know text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {importanceLabel} • {article.importanceScore || 80}/100
                      </span>
                      <span className="text-xs text-slate-400">{article.category}</span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(pubDate)} • {article.estimatedReadTime || '3 min read'}
                    </span>
                  </div>

                  <Link to={`/event/${article.id}`}>
                    <h2 className="text-lg font-bold text-white hover:text-brand-300 transition-colors">
                      {article.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    {article.summary}
                  </p>

                  {article.whyItMatters && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{article.whyItMatters}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {article.relatedConcepts?.slice(0, 2).map((c) => (
                      <Link
                        key={c}
                        to={`/learn?concept=${encodeURIComponent(c.toLowerCase().replace(/\s+/g, '-'))}`}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1"
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
                      to={`/event/${article.id}`}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1 shadow-glow-purple"
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
