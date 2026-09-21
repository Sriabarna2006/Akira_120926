import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storylineCatchupService } from '../services/storylineCatchupService';
import { StorylineJourney } from '../components/storylines/StorylineJourney';
import {
  Compass,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const StorylinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'journey' | 'turningPoints' | 'knowledge'>('journey');

  // Fetch Journey & Catch-Up Data
  const {
    data: journeyData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['storylineJourney', id],
    queryFn: () => storylineCatchupService.getStorylineJourney(id!),
    enabled: Boolean(id),
  });

  // Mark Event Reviewed Mutation
  const markReviewedMutation = useMutation({
    mutationFn: (eventId: string) => storylineCatchupService.markEventReviewed(id!, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storylineJourney', id] });
    },
  });

  // Refresh Catch-Up Briefing Mutation
  const refreshBriefingMutation = useMutation({
    mutationFn: () => storylineCatchupService.refreshCatchupBriefing(id!),
    onSuccess: (newBriefing) => {
      queryClient.setQueryData(['storylineJourney', id], (old: any) => {
        if (!old) return old;
        return { ...old, briefing: newBriefing };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium text-sm">Synthesizing storyline journey and catch-up briefing...</p>
      </div>
    );
  }

  if (isError || !journeyData) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl my-8">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Storyline Not Found</h2>
        <p className="text-slate-400 text-sm mb-4">
          {(error as Error)?.message || 'The requested storyline could not be retrieved.'}
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const { storyline, trajectory, events, turningPoints, overallEvidence, userProgress, briefing } = journeyData;

  const trajectoryColors: Record<string, string> = {
    ESCALATING: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
    DEVELOPING: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
    STABLE: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
    'DE-ESCALATING': 'text-amber-400 bg-amber-950/60 border-amber-800/60',
    CONCLUDED: 'text-purple-400 bg-purple-950/60 border-purple-800/60',
    UNKNOWN: 'text-slate-400 bg-slate-800/60 border-slate-700/60',
  };

  const getTrajectoryBadge = (t: string) => {
    return trajectoryColors[t] || trajectoryColors.DEVELOPING;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="p-6 md:p-8 bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-3 py-1 rounded-full">
              Living Storyline
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider border px-3 py-1 rounded-full ${getTrajectoryBadge(storyline.trajectory)}`}>
              Trajectory: {storyline.trajectory}
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
              Status: {storyline.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Updated {new Date(storyline.lastUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <button
              onClick={() => refreshBriefingMutation.mutate()}
              disabled={refreshBriefingMutation.isPending}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-colors"
              title="Refresh Briefing"
            >
              <RotateCw className={`w-4 h-4 ${refreshBriefingMutation.isPending ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
          {storyline.title}
        </h1>

        <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-4xl">
          {storyline.summary}
        </p>

        {/* Progress & Evidence Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Developments</div>
            <div className="text-lg font-bold text-white mt-0.5">{events.length} Events</div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Your Progress</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">
              {userProgress.progressPercentage}% Reviewed
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Turning Points</div>
            <div className="text-lg font-bold text-purple-400 mt-0.5">{turningPoints.length} Key Shifts</div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Evidence Health</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {overallEvidence.latestCompletenessScore}% ({overallEvidence.overallConfidenceState})
            </div>
          </div>
        </div>
      </div>

      {/* 2. "Catch Up in 60 Seconds" Synthesized Briefing Card */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-900/90 border border-cyan-500/30 rounded-3xl shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Catch Up in 60 Seconds</h2>
              <div className="text-xs text-slate-400">Chronological synthesis of unread developments</div>
            </div>
          </div>

          {/* Catch-Up Badges */}
          <div className="flex flex-wrap gap-1.5">
            {briefing.catchupStatus.map((status) => (
              <span
                key={status}
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-300"
              >
                {status.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Core Briefing Summary */}
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-sm md:text-base text-slate-200 leading-relaxed">
          {briefing.briefingSummary}
        </div>

        {/* Last Known vs Unread Gap Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Last Known Position:
            </div>
            {briefing.lastKnownEvent ? (
              <div>
                <div className="text-sm font-semibold text-white">{briefing.lastKnownEvent.title}</div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{briefing.lastKnownEvent.summary}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No previous events reviewed yet. Start from the beginning.</p>
            )}
          </div>

          <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              New Developments ({briefing.newDevelopmentsCount}):
            </div>
            {briefing.newDevelopments.length > 0 ? (
              <ul className="text-xs text-slate-300 space-y-1.5">
                {briefing.newDevelopments.slice(0, 3).map((dev) => (
                  <li key={dev.id} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span className="line-clamp-1">{dev.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-400 font-medium">You are completely up to date with this storyline!</p>
            )}
          </div>
        </div>

        {/* Recommended Next Action Banner */}
        {briefing.nextAction && (
          <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Recommended Next Learning Action
              </div>
              <div className="text-sm font-bold text-white">{briefing.nextAction.title}</div>
              <div className="text-xs text-slate-300">{briefing.nextAction.explanation}</div>
            </div>

            {briefing.nextAction.targetId && (
              <Link
                to={
                  briefing.nextAction.targetType === 'concept'
                    ? `/concept/${briefing.nextAction.targetId}`
                    : `/event/${briefing.nextAction.targetId}`
                }
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-950/50"
              >
                Proceed to Action <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 3. Storyline Exploration Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('journey')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'journey' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chronological Journey ({events.length})
            {activeTab === 'journey' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500" />}
          </button>

          <button
            onClick={() => setActiveTab('turningPoints')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'turningPoints' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Turning Points ({turningPoints.length})
            {activeTab === 'turningPoints' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500" />}
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'knowledge' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Your Knowledge ({briefing.allConcepts.length})
            {activeTab === 'knowledge' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />}
          </button>
        </div>

        {/* Tab 1: Chronological Scrubber Journey */}
        {activeTab === 'journey' && (
          <StorylineJourney
            storylineId={id!}
            events={events}
            turningPoints={turningPoints}
            trajectory={trajectory}
            onMarkReviewed={(eid) => markReviewedMutation.mutate(eid)}
            isMarkingReviewed={markReviewedMutation.isPending}
          />
        )}

        {/* Tab 2: Turning Points List */}
        {activeTab === 'turningPoints' && (
          <div className="space-y-4">
            {turningPoints.map((tp) => (
              <div
                key={tp.id}
                className="p-5 bg-slate-900/80 border border-purple-900/50 rounded-2xl shadow-xl space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-950/80 border border-purple-800/80 px-2.5 py-1 rounded-lg">
                      {tp.turningPointType}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(tp.occurredAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <Link
                    to={`/event/${tp.eventId}`}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    View Event <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <h3 className="text-lg font-bold text-white">{tp.title}</h3>
                <p className="text-sm text-slate-300">{tp.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Knowledge Concepts Grid */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {briefing.allConcepts.map((concept) => {
                const badgeColor =
                  concept.masteryStatus === 'ALREADY_KNOWN'
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                    : concept.masteryStatus === 'NEEDS_REVIEW'
                    ? 'text-amber-400 bg-amber-950/60 border-amber-800/60'
                    : concept.masteryStatus === 'NEW'
                    ? 'text-purple-400 bg-purple-950/60 border-purple-800/60'
                    : 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';

                return (
                  <div
                    key={concept.id}
                    className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeColor}`}>
                        {concept.masteryStatus.replace(/_/g, ' ')}
                      </span>
                      {concept.masteryScore > 0 && (
                        <span className="text-xs font-bold text-slate-400">
                          {concept.masteryScore}% Mastery
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white">{concept.title}</h4>
                    <p className="text-xs text-slate-300">{concept.shortDefinition}</p>

                    {concept.reason && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                        {concept.reason}
                      </p>
                    )}

                    <div className="pt-2">
                      <Link
                        to={`/concept/${concept.id}`}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        Explore Concept <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
