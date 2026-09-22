import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Lightbulb, 
  ArrowRight, 
  Calendar, 
  GraduationCap, 
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { CanonicalEvent } from '../types';
import { BriefCard } from '../components/cards/BriefCard';
import { LoadingState } from '../components/common/LoadingState';
import { offlineCache } from '../services/offlineCache';
import { WifiOff, Clock } from 'lucide-react';

export const DailyBriefPage: React.FC = () => {
  const [briefs, setBriefs] = useState<CanonicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineStatus, setOfflineStatus] = useState<{ isOffline: boolean; freshnessLabel: string } | null>(null);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    async function loadBriefs() {
      setLoading(true);
      try {
        const data = await eventService.getDailyBrief();
        if (data && data.length > 0) {
          setBriefs(data);
          setOfflineStatus(null);
          await offlineCache.set('daily_brief', data);
        } else {
          // Check local offline cache
          const cached = await offlineCache.get<CanonicalEvent[]>('daily_brief');
          if (cached && cached.data.length > 0) {
            setBriefs(cached.data);
            setOfflineStatus({ isOffline: cached.isOffline, freshnessLabel: cached.freshnessLabel });
          }
        }
      } catch (err) {
        // Fallback to offline cache on network error
        const cached = await offlineCache.get<CanonicalEvent[]>('daily_brief');
        if (cached && cached.data.length > 0) {
          setBriefs(cached.data);
          setOfflineStatus({ isOffline: true, freshnessLabel: cached.freshnessLabel });
        }
      } finally {
        setLoading(false);
      }
    }

    loadBriefs();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Offline Mode Banner */}
      {offlineStatus && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 text-amber-300 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Offline Mode:</strong> Displaying saved daily intelligence briefing.
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400/80 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{offlineStatus.freshnessLabel}</span>
          </div>
        </div>
      )}
      
      {/* 1. Daily Brief Editorial Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-50 via-white to-indigo-50 dark:from-cyan-950/70 dark:via-slate-900 dark:to-indigo-950/60 border border-cyan-200 dark:border-cyan-500/30 shadow-sm dark:shadow-glass">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate} Edition</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              AKIRA Daily Brief
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              What are the most important things you should understand today? Curated structural analysis behind the headlines.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-center self-start md:self-auto shrink-0 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Curated Focus</span>
            <span className="text-xl font-extrabold text-cyan-700 dark:text-cyan-300">3 Key Stories</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">~12 min total reading</span>
          </div>
        </div>
      </div>

      {/* 2. Today's Key Stories Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today's Key Stories & What To Understand</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Curated for depth over noise
          </span>
        </div>

        {loading ? (
          <LoadingState count={3} message="Compiling today's structural briefing..." />
        ) : (
          <div className="space-y-6">
            {briefs.map((story) => (
              <BriefCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>

      {/* 3. Suggested Learning & Concept Synthesis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Core Concepts to Master Today */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111827]/70 border border-slate-200 dark:border-purple-500/20 shadow-sm dark:shadow-glass space-y-4">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Suggested Learning Pathways</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Concepts Emerging in Today's News</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Understand the foundational principles driving today's geopolitical and technological developments:
          </p>

          <div className="space-y-2.5">
            <Link
              to="/learn?concept=monetary-policy"
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 hover:border-purple-500/30 flex items-center justify-between group transition-all"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">Monetary Policy & Interest Rates</h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Prerequisites: Inflation, Central Banking</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            </Link>

            <Link
              to="/learn?concept=ai-governance"
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 hover:border-purple-500/30 flex items-center justify-between group transition-all"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">AI Governance & Algorithmic Auditing</h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Prerequisites: Machine Learning, Data Privacy</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* What To Understand / Executive Takeaway */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111827]/70 border border-slate-200 dark:border-cyan-500/20 shadow-sm dark:shadow-glass space-y-4">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            <span>What To Understand</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">The Big Picture Synthesis</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Today's events signal two converging transitions: <strong>economic stabilization through calibrated monetary easing</strong> and <strong>increasing institutional regulation over foundational AI models</strong>.
          </p>

          <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/20 text-xs text-slate-800 dark:text-slate-200 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <span>Capital costs are stabilizing, allowing strategic tech hardware investments to resume.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <span>AI compliance is shifting from voluntary ethical pledges to binding legal classifications.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
