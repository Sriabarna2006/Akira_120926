import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  StorylineCatchupEvent,
  StorylineTurningPoint,
  StorylineTrajectoryDetails,
} from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight,
  BookOpen,
  Calendar,
} from 'lucide-react';

interface StorylineJourneyProps {
  storylineId: string;
  events: StorylineCatchupEvent[];
  turningPoints: StorylineTurningPoint[];
  trajectory: StorylineTrajectoryDetails;
  onMarkReviewed?: (eventId: string) => void;
  isMarkingReviewed?: boolean;
}

export const StorylineJourney: React.FC<StorylineJourneyProps> = ({
  events,
  onMarkReviewed,
  isMarkingReviewed = false,
}) => {
  // Find first unreviewed event or default to last event
  const firstUnreviewedIndex = events.findIndex((e) => !e.isReviewedByUser);
  const initialIndex = firstUnreviewedIndex >= 0 ? firstUnreviewedIndex : Math.max(0, events.length - 1);

  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);

  if (events.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
        <Compass className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No chronological events associated with this storyline yet.</p>
      </div>
    );
  }

  const currentEvent = events[activeIndex] || events[0];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === events.length - 1;

  // Jump helpers
  const handlePrev = () => setActiveIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setActiveIndex((prev) => Math.min(events.length - 1, prev + 1));
  const handleJumpToLatest = () => setActiveIndex(events.length - 1);
  const handleJumpToUnread = () => {
    const idx = events.findIndex((e) => !e.isReviewedByUser);
    if (idx >= 0) setActiveIndex(idx);
  };
  const handleJumpToTurningPoint = () => {
    const idx = events.findIndex((e) => e.isTurningPoint);
    if (idx >= 0) setActiveIndex(idx);
  };

  const hasUnread = events.some((e) => !e.isReviewedByUser);
  const hasTurningPoints = events.some((e) => e.isTurningPoint);

  return (
    <div className="space-y-6">
      {/* 1. Scrubber Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800/80 backdrop-blur-md rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-lg">
            Step {activeIndex + 1} of {events.length}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {new Date(currentEvent.eventTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Quick jump actions */}
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={handleJumpToUnread}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/50 px-2.5 py-1 rounded-lg transition-colors"
            >
              Jump to Unread
            </button>
          )}
          {hasTurningPoints && (
            <button
              onClick={handleJumpToTurningPoint}
              className="text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/50 px-2.5 py-1 rounded-lg transition-colors"
            >
              Jump to Turning Point
            </button>
          )}
          <button
            onClick={handleJumpToLatest}
            className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 px-2.5 py-1 rounded-lg transition-colors"
          >
            Jump to Latest
          </button>
        </div>
      </div>

      {/* 2. Interactive Scrubber Track */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="flex items-center min-w-full justify-between gap-2 px-2">
          {events.map((ev, idx) => {
            const isActive = idx === activeIndex;
            const isTP = ev.isTurningPoint;
            const isRev = ev.isReviewedByUser;

            return (
              <button
                key={ev.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative group flex flex-col items-center flex-1 min-w-[120px] p-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-cyan-950/50 border border-cyan-500/50 shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-900/40 hover:bg-slate-800/50 border border-slate-800/60'
                }`}
              >
                {/* Connector Line */}
                {idx < events.length - 1 && (
                  <div
                    className={`hidden md:block absolute top-[18px] left-[50%] w-full h-[2px] z-0 ${
                      ev.isReviewedByUser ? 'bg-cyan-800/60' : 'bg-slate-800'
                    }`}
                  />
                )}

                {/* Node Icon */}
                <div className="relative z-10 mb-1.5">
                  {isRev ? (
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isTP
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                          : isActive
                          ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300/60'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : isTP ? (
                    <div className="w-7 h-7 rounded-full bg-purple-900/80 border border-purple-500 flex items-center justify-center text-purple-300 animate-pulse">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Date & Title snippet */}
                <span className="text-[10px] font-medium text-slate-400">
                  {new Date(ev.eventTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs font-semibold text-slate-200 line-clamp-1 text-center w-full mt-0.5">
                  {ev.title}
                </span>

                {isTP && (
                  <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 border border-purple-800/70 px-1.5 py-0.5 rounded">
                    Turning Point
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Step Inspection Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-5">
        {/* Step Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-md">
                Development #{activeIndex + 1}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(currentEvent.eventTime).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {currentEvent.isReviewedByUser && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white leading-tight">
              {currentEvent.title}
            </h3>
          </div>

          {/* Evidence Completeness Pill */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Evidence</div>
              <div className="text-xs font-bold text-emerald-300">
                {currentEvent.evidenceCompletenessScore}% ({currentEvent.evidenceConfidenceState})
              </div>
            </div>
          </div>
        </div>

        {/* Turning Point Callout if applicable */}
        {currentEvent.isTurningPoint && (
          <div className="p-4 bg-purple-950/40 border border-purple-800/60 rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Critical Storyline Turning Point ({currentEvent.turningPointType || 'OFFICIAL_DECISION'})
              </div>
              <p className="text-sm text-purple-200 mt-0.5">
                {currentEvent.turningPointReason || 'This development significantly transitioned the trajectory of the storyline.'}
              </p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
          {currentEvent.summary}
        </div>

        {/* What Changed in this step */}
        {(currentEvent.newFactsIntroduced.length > 0 || currentEvent.changedFacts.length > 0) && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              What Changed in this Step:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentEvent.newFactsIntroduced.length > 0 && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-1.5">
                  <div className="text-xs font-semibold text-emerald-400">New Facts:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {currentEvent.newFactsIntroduced.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentEvent.changedFacts.length > 0 && (
                <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-1.5">
                  <div className="text-xs font-semibold text-amber-400">Changed / Updated Facts:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {currentEvent.changedFacts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Introduced Concepts */}
        {currentEvent.concepts && currentEvent.concepts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Concepts in this Event:
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentEvent.concepts.map((concept) => (
                <Link
                  key={concept.id || concept.slug}
                  to={`/concept/${concept.id || concept.slug}`}
                  className="text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {concept.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Step Navigation & Review Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={handleNext}
              disabled={isLast}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onMarkReviewed && !currentEvent.isReviewedByUser && (
              <button
                onClick={() => onMarkReviewed(currentEvent.id)}
                disabled={isMarkingReviewed}
                className="px-4 py-2 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark as Reviewed
              </button>
            )}

            <Link
              to={`/event/${currentEvent.id}`}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
            >
              Full Event Detail <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
