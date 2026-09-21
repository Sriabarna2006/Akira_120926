import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  StorylineCatchupEvent,
  ScenarioType,
  StorylineScenario,
} from '../../types';
import {
  scenarioSimulationService,
  CreateScenarioPayload,
} from '../../services/scenarioSimulationService';
import {
  Sparkles,
  Play,
  RotateCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Plus,
  Layers,
  Check,
} from 'lucide-react';

interface ScenarioExplorerProps {
  storylineId: string;
  events: StorylineCatchupEvent[];
  initialTargetEventId?: string;
}

export const ScenarioExplorer: React.FC<ScenarioExplorerProps> = ({
  storylineId,
  events,
  initialTargetEventId,
}) => {
  const queryClient = useQueryClient();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form State
  const [targetEventId, setTargetEventId] = useState<string>(
    initialTargetEventId || (events.length > 0 ? events[0].id : '')
  );
  const [scenarioType, setScenarioType] = useState<ScenarioType>('REMOVE_EVENT');
  const [question, setQuestion] = useState<string>('What if this policy milestone was not approved?');
  const [assumptionText, setAssumptionText] = useState<string>(
    'Assume the foundational policy approval was denied, removing the legal subsidy framework.'
  );

  // Quiz State
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  // 1. Fetch User Scenarios List
  const {
    data: scenarios = [],
    isLoading: isLoadingList,
  } = useQuery({
    queryKey: ['storylineScenarios', storylineId],
    queryFn: () => scenarioSimulationService.listScenarios(storylineId),
    enabled: Boolean(storylineId),
  });

  // Auto-select first scenario if available and none selected
  const activeScenarioId = selectedScenarioId || (scenarios.length > 0 ? scenarios[0].id : null);

  // 2. Fetch Selected Scenario Result
  const {
    data: scenarioResult,
    isLoading: isLoadingResult,
    isFetching: isFetchingResult,
  } = useQuery({
    queryKey: ['scenarioResult', storylineId, activeScenarioId],
    queryFn: () => scenarioSimulationService.getScenario(storylineId, activeScenarioId!),
    enabled: Boolean(activeScenarioId),
  });

  // 3. Create Scenario Mutation
  const createScenarioMutation = useMutation({
    mutationFn: (payload: CreateScenarioPayload) =>
      scenarioSimulationService.createScenario(storylineId, payload),
    onSuccess: (newResult) => {
      queryClient.invalidateQueries({ queryKey: ['storylineScenarios', storylineId] });
      setSelectedScenarioId(newResult.scenario.id);
      setIsCreating(false);
    },
  });

  // 4. Delete Scenario Mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: (id: string) => scenarioSimulationService.deleteScenario(storylineId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storylineScenarios', storylineId] });
      setSelectedScenarioId(null);
    },
  });

  // 5. Refresh Scenario Mutation
  const refreshScenarioMutation = useMutation({
    mutationFn: (id: string) => scenarioSimulationService.refreshScenario(storylineId, id),
    onSuccess: (refreshed) => {
      queryClient.setQueryData(['scenarioResult', storylineId, refreshed.scenario.id], refreshed);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !assumptionText) return;

    createScenarioMutation.mutate({
      targetEventId: targetEventId || undefined,
      scenarioType,
      question,
      assumptionText,
    });
  };

  const handleQuizAnswerSelect = (quizId: string, optionIndex: number) => {
    setSelectedQuizAnswers((prev) => ({ ...prev, [quizId]: optionIndex }));
  };

  const handleQuizSubmit = (quizId: string) => {
    setQuizSubmitted((prev) => ({ ...prev, [quizId]: true }));
  };

  const scenarioTypeLabels: Record<ScenarioType, { title: string; desc: string }> = {
    REMOVE_EVENT: {
      title: 'Remove Event',
      desc: 'What if this documented milestone had not happened at all?',
    },
    DELAY_EVENT: {
      title: 'Delay Event',
      desc: 'What if this milestone occurred significantly later in the timeline?',
    },
    CHANGE_CONDITION: {
      title: 'Change Condition',
      desc: 'What if the policy scope, funding, or parameters were altered?',
    },
    REVERSE_RELATION: {
      title: 'Reverse Relation',
      desc: 'What if the documented causal relationship or decision was inverted?',
    },
    CONTINUE_CONDITION: {
      title: 'Continue Condition',
      desc: 'What if the previous historical status quo continued indefinitely?',
    },
  };

  const getImpactBadge = (direction: string) => {
    switch (direction) {
      case 'DISRUPTED':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
      case 'DELAYED':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'AMPLIFIED':
        return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
      case 'MITIGATED':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
      default:
        return 'text-slate-400 bg-slate-800/60 border-slate-700/60';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 border border-purple-800/80 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Bounded Scenario Simulation
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
              Non-Predictive Hypothesis Engine
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Explore "What If?" Counterfactual Branches
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-3xl">
            Simulate how altered assumptions impact documented storyline dependencies, turning points, and domain concepts without forecasting the future.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-950/40"
        >
          {isCreating ? 'Cancel' : <><Plus className="w-4 h-4" /> Create New Hypothesis</>}
        </button>
      </div>

      {/* 2. Create Scenario Form Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-6 bg-slate-900/95 border border-purple-500/40 rounded-3xl shadow-2xl space-y-5 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-400" /> Configure Hypothetical Scenario
            </h3>
            <span className="text-xs text-slate-400">Strictly Bounded by Verified Historical Facts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Event Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-400">
                1. Target Storyline Milestone
              </label>
              <select
                value={targetEventId}
                onChange={(e) => setTargetEventId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {events.map((ev, i) => (
                  <option key={ev.id} value={ev.id}>
                    Step {i + 1}: {ev.title.substring(0, 60)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Scenario Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-400">
                2. Scenario Type
              </label>
              <select
                value={scenarioType}
                onChange={(e) => setScenarioType(e.target.value as ScenarioType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {Object.entries(scenarioTypeLabels).map(([typeKey, info]) => (
                  <option key={typeKey} value={typeKey}>
                    {info.title} — {info.desc.substring(0, 45)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-400">
              3. Core Hypothesis Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What if the commercial fab subsidy framework was delayed by 6 months?"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {/* Assumption Details Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-400">
              4. Explicit Parameter Change (Assumption Text)
            </label>
            <textarea
              value={assumptionText}
              onChange={(e) => setAssumptionText(e.target.value)}
              rows={2}
              placeholder="Describe the exact hypothetical condition change..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createScenarioMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-950/50"
            >
              {createScenarioMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Execute Simulation
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 3. Scenario Selector Carousel */}
      {scenarios.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Saved Storyline Scenarios ({scenarios.length})
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            {scenarios.map((sc: StorylineScenario) => {
              const isSelected = sc.id === activeScenarioId;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`text-left p-3 rounded-2xl min-w-[220px] max-w-[280px] border transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    {sc.scenarioType.replace(/_/g, ' ')}
                  </span>
                  <div className="text-xs font-bold text-white mt-1.5 line-clamp-1">{sc.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{sc.question}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Active Scenario Simulation Viewer */}
      {isLoadingList || isLoadingResult ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-400">Propagating documented relationships and calculating scenario impacts...</p>
        </div>
      ) : scenarioResult ? (
        <div className="space-y-6">
          {/* A. Scenario Summary Header */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-purple-400 bg-purple-950/80 border border-purple-800/80 px-3 py-1 rounded-full">
                  {scenarioResult.scenario.scenarioType.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
                  Created {new Date(scenarioResult.scenario.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {scenarioResult.isCached && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                    Deterministic Cache Hit
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshScenarioMutation.mutate(scenarioResult.scenario.id)}
                  disabled={refreshScenarioMutation.isPending || isFetchingResult}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
                  title="Re-run Simulation"
                >
                  <RotateCw className={`w-4 h-4 ${refreshScenarioMutation.isPending || isFetchingResult ? 'animate-spin text-purple-400' : ''}`} />
                </button>
                <button
                  onClick={() => deleteScenarioMutation.mutate(scenarioResult.scenario.id)}
                  disabled={deleteScenarioMutation.isPending}
                  className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/50 rounded-xl transition-colors"
                  title="Delete Scenario"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white">{scenarioResult.scenario.title}</h3>
            <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-2xl text-xs text-purple-200">
              <span className="font-bold text-purple-300 uppercase mr-1">Hypothesis:</span>
              "{scenarioResult.scenario.assumptionText}"
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/70">
              {scenarioResult.groundedSummary}
            </p>
          </div>

          {/* B. Epistemic Classification Legend */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs">
            <span className="font-bold text-slate-400 uppercase text-[10px] mr-1">Classifications:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
              VERIFIED FACT
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
              HYPOTHETICAL ASSUMPTION
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800 text-[10px] font-bold">
              DERIVED CONSEQUENCE
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold">
              UNKNOWN (NOT PREDICTED)
            </span>
          </div>

          {/* C. Side-by-Side Timeline Comparison (Factual Baseline vs. Hypothetical) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Verified Baseline */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 1. Factual Historical Baseline
                </h4>
                <span className="text-[10px] text-slate-400">Verified Canonical Records</span>
              </div>

              <div className="space-y-3">
                {scenarioResult.baselineFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/70 border border-emerald-950/50 rounded-2xl space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-emerald-400 uppercase">Fact #{idx + 1}</span>
                      <span className="text-slate-400">{fact.evidenceScore}% Evidence</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">{fact.statement}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hypothetical Model */}
            <div className="p-6 bg-slate-900/80 border border-purple-900/40 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> 2. Hypothetical Scenario Model
                </h4>
                <span className="text-[10px] text-purple-300">Derived from Documented Relations</span>
              </div>

              {/* Assumption Card */}
              <div className="p-3.5 bg-amber-950/30 border border-amber-800/60 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-amber-400 uppercase">User Assumption</span>
                  <span className="text-amber-300">{scenarioResult.hypotheticalChange.assumptionType}</span>
                </div>
                <p className="text-xs text-amber-200 font-semibold">
                  {scenarioResult.hypotheticalChange.description}
                </p>
              </div>

              {/* Affected Downstream Events */}
              <div className="space-y-3">
                {scenarioResult.affectedEvents.map((aev) => (
                  <div
                    key={aev.eventId}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold uppercase px-2 py-0.5 rounded border ${getImpactBadge(aev.impactDirection)}`}>
                        {aev.impactDirection}
                      </span>
                      <span className="text-slate-400">{aev.classification.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{aev.title}</div>
                    <p className="text-xs text-slate-300">{aev.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* D. Explicit Unknowns & Epistemic Guardrails */}
          <div className="p-6 bg-slate-900/90 border border-rose-950/60 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> Explicit Unknowns & Epistemic Boundaries
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenarioResult.unknowns.map((unk, i) => (
                <div key={i} className="p-3.5 bg-slate-950/60 border border-rose-900/40 rounded-2xl space-y-1">
                  <div className="text-xs font-bold text-rose-300">{unk.topic}</div>
                  <p className="text-xs text-slate-300">{unk.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* E. Affected Domain Concepts & Mastery Hooks */}
          {scenarioResult.affectedConcepts.length > 0 && (
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" /> Affected Domain Concepts ({scenarioResult.affectedConcepts.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {scenarioResult.affectedConcepts.map((c) => (
                  <div key={c.conceptId} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-cyan-400 uppercase">{c.impactType}</span>
                      <span className="text-slate-400 font-semibold">{c.masteryStatus.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{c.title}</div>
                    <p className="text-[11px] text-slate-300">{c.explanation}</p>
                    <Link
                      to={`/concept/${c.conceptId}`}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 pt-1"
                    >
                      Study Concept <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* F. Grounded Scenario Reasoning Quiz */}
          {scenarioResult.quiz && scenarioResult.quiz.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-purple-950/30 via-slate-900/90 to-slate-900/90 border border-purple-500/30 rounded-3xl space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-400" /> Scenario Comprehension & Reasoning Quiz
                </h4>
                <span className="text-[10px] text-slate-400">Grounded in Scenario Logic</span>
              </div>

              <div className="space-y-4">
                {scenarioResult.quiz.map((q, qIndex) => {
                  const isAnswered = quizSubmitted[q.id];
                  const selected = selectedQuizAnswers[q.id];
                  const isCorrect = selected === q.correctAnswerIndex;

                  return (
                    <div key={q.id} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-3">
                      <div className="text-xs font-bold text-white">
                        {qIndex + 1}. {q.question}
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => {
                          let optStyle = 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300';
                          if (selected === optIndex) {
                            optStyle = 'bg-purple-950/80 border-purple-500 text-white';
                          }
                          if (isAnswered) {
                            if (optIndex === q.correctAnswerIndex) {
                              optStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                            } else if (selected === optIndex && !isCorrect) {
                              optStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                            }
                          }

                          return (
                            <button
                              key={optIndex}
                              onClick={() => !isAnswered && handleQuizAnswerSelect(q.id, optIndex)}
                              disabled={isAnswered}
                              className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {isAnswered && optIndex === q.correctAnswerIndex && (
                                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {!isAnswered && selected !== undefined && (
                        <button
                          onClick={() => handleQuizSubmit(q.id)}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors"
                        >
                          Submit Answer
                        </button>
                      )}

                      {isAnswered && (
                        <div className={`p-3 rounded-xl border text-xs ${isCorrect ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'}`}>
                          <span className="font-bold">{isCorrect ? 'Correct! ' : 'Incorrect. '}</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Scenario Simulations Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Create New Hypothesis" above to explore bounded "What if?" branches on this storyline.
          </p>
        </div>
      )}
    </div>
  );
};
