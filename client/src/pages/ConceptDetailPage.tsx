import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  GitBranch,
  Target,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Info,
} from 'lucide-react';
import { knowledgeGraphService } from '../services/knowledgeGraphService';
import { useAuth } from '../context/AuthContext';
import {
  ExtractedConceptItem,
  ConceptGraphNode,
  ConceptGraphEdge,
  ConceptLearningPath,
  RelatedConceptItem,
  ConceptKnowledgeStatus,
  UserMasteryClassification,
} from '../types';

export const ConceptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [concept, setConcept] = useState<ExtractedConceptItem | null>(null);
  const [knowledgeStatus, setKnowledgeStatus] = useState<ConceptKnowledgeStatus | null>(null);
  const [prereqTree, setPrereqTree] = useState<{ nodes: ConceptGraphNode[]; edges: ConceptGraphEdge[] } | null>(null);
  const [learningPath, setLearningPath] = useState<ConceptLearningPath | null>(null);
  const [relatedConcepts, setRelatedConcepts] = useState<RelatedConceptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    Promise.allSettled([
      knowledgeGraphService.getConceptById(id),
      knowledgeGraphService.getPrerequisites(id, 5),
      knowledgeGraphService.getLearningPath(id),
      knowledgeGraphService.getRelatedConcepts(id, 6),
      user ? knowledgeGraphService.getKnowledgeStatus(id) : Promise.resolve(null),
    ])
      .then(([conceptRes, prereqRes, pathRes, relatedRes, statusRes]) => {
        if (!isMounted) return;

        if (conceptRes.status === 'fulfilled' && conceptRes.value) {
          setConcept(conceptRes.value);
          document.title = `${conceptRes.value.title} | AKIRA Knowledge Graph`;
        } else {
          // Fallback concept
          const fallback: ExtractedConceptItem = {
            id: id,
            title: id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            slug: id,
            category: 'General',
            shortDefinition: 'Foundational mechanism for real-world intelligence analysis.',
            whyItMatters: 'Essential for understanding structural relationships in news reporting.',
          };
          setConcept(fallback);
          document.title = `${fallback.title} | AKIRA Knowledge Graph`;
        }

        if (prereqRes.status === 'fulfilled' && prereqRes.value) {
          setPrereqTree(prereqRes.value);
        }

        if (pathRes.status === 'fulfilled' && pathRes.value) {
          setLearningPath(pathRes.value);
        }

        if (relatedRes.status === 'fulfilled' && relatedRes.value) {
          setRelatedConcepts(relatedRes.value);
        }

        if (statusRes.status === 'fulfilled' && statusRes.value) {
          setKnowledgeStatus(statusRes.value);
        }
      })
      .catch((err) => {
        if (isMounted) setErrorMessage(err.message || 'Failed to load concept graph details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="p-20 text-center space-y-4">
        <RotateCw className="h-8 w-8 text-brand-500 animate-spin mx-auto" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Loading AKIRA Phase 9 Knowledge Graph & Prerequisite Chain...
        </p>
      </div>
    );
  }

  if (errorMessage && !concept) {
    return (
      <div className="p-12 text-center space-y-4 max-w-lg mx-auto">
        <Info className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Concept Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
        <Link to="/learn" className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold">
          Return to Learning Dashboard
        </Link>
      </div>
    );
  }

  const masteryStatus: UserMasteryClassification = knowledgeStatus?.masteryStatus || 'UNKNOWN';
  const masteryScore: number = knowledgeStatus?.masteryScore || 0;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-16">
      {/* 1. Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/learn"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Learning Dashboard</span>
        </Link>

        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
          Knowledge Node: {concept?.category || 'General'}
        </span>
      </div>

      {/* 2. Concept Header & User Mastery Status */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-indigo-950/40 border border-purple-500/30 shadow-glass space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
              {concept?.category || 'Domain Knowledge'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {concept?.title}
            </h1>
          </div>

          {/* User Mastery Pill */}
          <div className="flex items-center gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div
              className={`p-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                masteryStatus === 'STRONG'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : masteryStatus === 'DEVELOPING'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : masteryStatus === 'NEEDS_LEARNING'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {masteryStatus === 'STRONG' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : masteryStatus === 'DEVELOPING' ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{masteryStatus.replace('_', ' ')}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Mastery Score</span>
              <span className="text-lg font-black text-white">{masteryScore}%</span>
            </div>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
          {concept?.shortDefinition}
        </p>

        {concept?.whyItMatters && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 text-xs sm:text-sm text-slate-300">
            <strong className="text-purple-300 font-bold block mb-0.5">Why It Matters:</strong>
            {concept.whyItMatters}
          </div>
        )}
      </div>

      {/* 3. Recommended Learning Path (Gap-First Sequence) */}
      {learningPath && learningPath.steps.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                <Target className="h-4 w-4" />
                <span>Deterministic Learning Path</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Step-by-Step Pathway to Mastery
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Topological prerequisite sequence starting with your identified knowledge gaps.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Readiness</span>
              <span className="text-base font-bold text-purple-400">
                {learningPath.userOverallReadiness}% Ready
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {learningPath.steps.map((step) => (
              <div
                key={step.conceptId}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  step.isTarget
                    ? 'bg-purple-950/20 border-purple-500/40'
                    : step.masteryStatus === 'STRONG'
                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 opacity-80'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-7 w-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                      step.isTarget
                        ? 'bg-purple-600 text-white shadow-md'
                        : step.masteryStatus === 'STRONG'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {step.stepNumber}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {step.title}
                      </h3>
                      {step.isTarget && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Target Goal
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          step.masteryStatus === 'STRONG'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : step.masteryStatus === 'DEVELOPING'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                      >
                        {step.masteryStatus} ({step.masteryScore}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {step.reason}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {!step.isTarget && (
                    <Link
                      to={`/concept/${step.conceptId}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      Study Concept →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Prerequisite Dependency Graph */}
      {prereqTree && prereqTree.nodes.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Prerequisite Dependency Hierarchy
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {prereqTree.nodes.length} Nodes • {prereqTree.edges.length} Edges
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {prereqTree.nodes.map((node) => (
              <div
                key={node.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-2 ${
                  node.isTarget
                    ? 'bg-purple-950/20 border-purple-500/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {node.isTarget ? 'Target Node' : `Depth ${node.depth}`}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        node.masteryStatus === 'STRONG'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : node.masteryStatus === 'DEVELOPING'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {node.masteryStatus}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {node.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {node.shortDefinition}
                  </p>
                </div>

                {!node.isTarget && (
                  <Link
                    to={`/concept/${node.id}`}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-2 flex items-center gap-1"
                  >
                    <span>Inspect Dependency</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Related Concepts */}
      {relatedConcepts.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Related Knowledge Concepts
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {relatedConcepts.map((item) => (
              <Link
                key={item.concept.id}
                to={`/concept/${item.concept.id}`}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {item.relationType || 'RELATED'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{item.score}% Match</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                    {item.concept.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {item.reason}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>Explore Concept</span>
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
