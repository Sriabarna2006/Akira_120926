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

export const DailyBriefPage: React.FC = () => {
  const [briefs, setBriefs] = useState<CanonicalEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
        if (data.length > 0) {
          setBriefs(data);
        } else {
          // Structured Daily Brief UI Shell Placeholder
          setBriefs([
            {
              id: 'story-1',
              title: 'Global Central Banks Shift Monetary Policy Stance: Navigating Disinflation and Growth',
              summary: 'Monetary policy committees across major economies announce rate corridor recalibrations as structural price pressures ease, altering corporate borrowing costs and mortgage rates worldwide.',
              category: 'Economy & Money',
              region: 'World',
              importanceLabel: 'IMPORTANT',
              importanceScore: 95,
              finalRankScore: 98,
              whyItMatters: 'Directly influences personal home loans, commercial capital expenditure, currency exchange volatility, and global consumer confidence.',
              estimatedReadTime: '4 min read',
              relatedConcepts: ['Monetary Policy', 'Inflation Hedging', 'Central Bank Mandates', 'Interest Rate Parity'],
              firstPublishedAt: new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
              sourceCount: 3,
              sources: [
                { name: 'Financial Times', url: 'https://ft.com', publishedAt: new Date().toISOString(), tier: 1 },
                { name: 'Reuters', url: 'https://reuters.com', publishedAt: new Date().toISOString(), tier: 1 },
              ],
            },
            {
              id: 'story-2',
              title: 'European Union Enforces Landmark AI Act: Strict Compliance for High-Risk Systems',
              summary: 'The comprehensive artificial intelligence governance framework takes effect, classifying AI models by societal risk and mandating algorithmic auditing for foundational systems.',
              category: 'AI & Technology',
              region: 'World',
              importanceLabel: 'IMPORTANT',
              importanceScore: 91,
              finalRankScore: 93,
              whyItMatters: 'Establishes the worldwide legal benchmark for AI safety, algorithmic transparency, intellectual property rights, and commercial deployments.',
              estimatedReadTime: '5 min read',
              relatedConcepts: ['AI Governance', 'Algorithmic Auditing', 'Risk Classification', 'Data Privacy'],
              firstPublishedAt: new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
              sourceCount: 2,
              sources: [
                { name: 'MIT Technology Review', url: 'https://technologyreview.com', publishedAt: new Date().toISOString(), tier: 1 },
              ],
            },
            {
              id: 'story-3',
              title: 'India Advances High-Precision Semiconductor Mission with Mega State Hubs',
              summary: 'Federal and regional industrial corridors clear incentive packages for OSAT facilities and silicon fabrication units, reducing dependency on external chip supply chains.',
              category: 'Career & Industry',
              region: 'India',
              importanceLabel: 'IMPORTANT',
              importanceScore: 88,
              finalRankScore: 90,
              whyItMatters: 'Builds long-term sovereign hardware resilience and anchors engineering talent within domestic high-tech manufacturing ecosystems.',
              estimatedReadTime: '3 min read',
              relatedConcepts: ['Semiconductor Fabrication', 'OSAT Assembly', 'Supply Chain Sovereignty'],
              firstPublishedAt: new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
              sourceCount: 2,
              sources: [
                { name: 'BusinessLine', url: 'https://thehindubusinessline.com', publishedAt: new Date().toISOString(), tier: 1 },
              ],
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadBriefs();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      
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
