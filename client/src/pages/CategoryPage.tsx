import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Compass, ArrowRight, Clock, ExternalLink, RotateCw, Layers } from 'lucide-react';
import { eventService } from '../services/eventService';
import { categoryService } from '../services/categoryService';
import { CanonicalEvent, Category } from '../types';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [events, setEvents] = useState<CanonicalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const title = category?.name || (slug ? slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Category');

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const [catData, eventsRes] = await Promise.all([
          categoryService.getCategoryById(slug),
          eventService.getEvents({ category: slug }),
        ]);

        if (catData) setCategory(catData);

        if (eventsRes.data.length > 0) {
          const mapped: CanonicalEvent[] = eventsRes.data.map((e: any) => ({
            ...e,
            region: e.regionId === 'tamil-nadu' ? 'Tamil Nadu' : e.regionId === 'india' ? 'India' : 'World',
            category: e.categoryId || title,
            importanceLabel: e.urgencyLabel || 'IMPORTANT',
            firstPublishedAt: e.firstPublishedAt || new Date().toISOString(),
            lastUpdatedAt: e.lastUpdatedAt || new Date().toISOString(),
            sourceCount: e.sources?.length || e.sourceCount || 1,
            estimatedReadTime: '3 min read',
            sources: (e.sources || []).map((s: any) => ({
              name: s.sourceName || s.name || 'Wire Source',
              url: s.url || '#',
              publishedAt: s.publishedAt || new Date().toISOString(),
              tier: s.tier || 2,
            })),
          }));
          setEvents(mapped);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.warn('Failed to load category feed:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug]);

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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-50 via-white to-slate-50 dark:from-brand-950/80 dark:via-slate-900 dark:to-slate-900 border border-brand-200 dark:border-brand-500/20 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
          <Compass className="h-4 w-4" />
          <span>Category Stream</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          {category?.description || `Verified intelligence feeds, contextual background, and concept prerequisites for ${title}.`}
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <RotateCw className="h-8 w-8 text-cyan-500 animate-spin mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading {title} intelligence feed...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-white/10 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold">No active events currently filed under {title}.</p>
          <Link to="/all-news" className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold inline-flex items-center gap-1">
            <span>Explore all news streams</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const primarySource = event.sources?.[0]?.name || 'Wire Source';
            const primaryUrl = event.sources?.[0]?.url || '#';
            const pubDate = event.lastUpdatedAt || event.firstPublishedAt;

            return (
              <div
                key={event.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#111827]/70 border border-slate-200 dark:border-white/10 hover:border-cyan-500/30 transition-all space-y-3 shadow-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-white/5">
                        {event.importanceLabel} • Rank {event.finalRankScore || 80}/100
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{event.region}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatRelativeTime(pubDate)}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    <Link to={`/events/${event.id}`}>{event.title}</Link>
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {event.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span>Source:</span>
                    <a
                      href={primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-500 inline-flex items-center gap-1"
                    >
                      <span>{primarySource}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {event.sources && event.sources.length > 1 && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                        +{event.sources.length - 1} corroborating
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/events/${event.id}`}
                    className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                  >
                    <span>Read Full Breakdown</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
