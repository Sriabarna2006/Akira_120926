import {
  CanonicalEvent,
  PersonalizedFeedItem,
  PersonalizedFeedResult,
  PersonalizationFeedOptions,
  DailyLearningSummary,
  UserLearningPreferences,
  RecommendationReasonCode,
  PersonalizedRecommendationContext,
  RecommendationScoreBreakdown,
  ExplanationLevel,
  UserLearningProgress,
  UserReviewSchedule,
  QuizAttemptRecord,
  LearningActivityRecord,
  LearningActivityType,
} from '../../types/index.js';
import { learningRepository } from '../../repositories/learning.repository.js';
import { EventRepository } from '../../repositories/event.repository.js';
import { aiUnderstandingRepository } from '../../repositories/aiUnderstanding.repository.js';
import { RankingService } from '../ranking/rankingService.js';
import { masteryService } from './mastery.service.js';
import { learningService } from './learning.service.js';

export class PersonalizationService {
  // ============================================================================
  // 1. COMPUTE DETERMINISTIC PERSONALIZED FEED
  // ============================================================================

  public async getPersonalizedFeed(
    userId: string,
    options: PersonalizationFeedOptions = {}
  ): Promise<PersonalizedFeedResult> {
    const {
      limit = 10,
      page = 1,
      regionId,
      categoryId,
      explorationRatio = 0.20,
      applyDiversity = true,
    } = options;

    const now = new Date();

    // 1. Fetch user data in parallel
    const [
      allProgress,
      allSchedules,
      allAttempts,
      allActivities,
      userPreferences,
      candidateEventsResult,
    ] = await Promise.all([
      learningRepository.getAllProgressForUser(userId),
      learningRepository.getAllSchedulesForUser(userId),
      learningRepository.getAttemptsForUser(userId, 100),
      learningRepository.getActivitiesForUser(userId, 100),
      learningRepository.getPreferences(userId),
      EventRepository.findAll({
        regionId,
        categoryId,
        limit: 50,
        page: 1,
      }),
    ]);

    // 2. Score candidate events with Phase 5 ranking engine
    const scoredCandidates: CanonicalEvent[] = [];
    for (const evt of candidateEventsResult.events) {
      const articles = evt.articles || (await EventRepository.findArticlesByEventId(evt.id));
      const scored = RankingService.scoreEvent(evt, articles, now);
      scoredCandidates.push(scored);
    }

    // 3. Build fast lookup maps for user state
    const progressByEventId = new Map<string, UserLearningProgress>();
    const progressByConceptId = new Map<string, UserLearningProgress>();
    for (const p of allProgress) {
      if (p.eventId) progressByEventId.set(p.eventId, p);
      if (p.conceptId) progressByConceptId.set(p.conceptId, p);
    }

    const scheduleByEventId = new Map<string, UserReviewSchedule>();
    const scheduleByConceptId = new Map<string, UserReviewSchedule>();
    for (const s of allSchedules) {
      if (s.eventId) scheduleByEventId.set(s.eventId, s);
      if (s.conceptId) scheduleByConceptId.set(s.conceptId, s);
    }

    // 4. Calculate Category Affinity Map (from real user attempts, saves, activities)
    const categoryAffinities = this.calculateCategoryAffinities(
      allAttempts,
      allActivities,
      allProgress,
      scoredCandidates
    );

    // 5. Compute Personalization Sub-scores for each candidate event
    const evaluatedItems: (PersonalizedFeedItem & { isExplorationEligible: boolean })[] = [];

    for (const event of scoredCandidates) {
      // A. Global News Score (Phase 5)
      const globalNewsScore = Math.min(100, Math.max(0, event.finalRankScore || event.importanceScore || 50));

      // B. Knowledge Gap Score (Phase 7 mastery of associated concepts)
      const eventConcepts = await this.getEventConcepts(event);
      const gapEval = this.calculateKnowledgeGap(event, eventConcepts, progressByEventId, progressByConceptId);
      const knowledgeGapScore = gapEval.gapScore;

      // C. Review Priority (Phase 7 SM-2 schedule)
      const reviewEval = this.calculateReviewPriority(event, scheduleByEventId, progressByEventId, now);
      const reviewPriority = reviewEval.score;

      // D. Category Affinity Score (0-100)
      const eventCategory = (event.category || event.categoryId || 'general').toLowerCase();
      const rawAffinity = categoryAffinities.get(eventCategory) ?? 0;
      const totalUserInteractions = allAttempts.length + allActivities.length;
      // If user has zero interactions across the platform, give neutral baseline 50
      const categoryAffinity = totalUserInteractions === 0 ? 50 : Math.min(100, Math.round(rawAffinity));

      // E. Freshness Score (Phase 5 decay)
      const freshnessScore = event.rankingMetadata?.freshnessScore ?? 50;

      // F. Exploration Score (Inversely related to category affinity, boosts under-explored domains)
      let explorationScore = 20;
      if (totalUserInteractions > 0) {
        if (!categoryAffinities.has(eventCategory) || rawAffinity === 0) {
          explorationScore = 100;
        } else if (rawAffinity < 15) {
          explorationScore = 80;
        } else if (rawAffinity < 30) {
          explorationScore = 50;
        } else {
          explorationScore = 10;
        }
      } else {
        explorationScore = 50;
      }

      // G. Composite Deterministic Personalization Formula:
      // PersonalizedScore = 0.25*G + 0.25*K + 0.20*R + 0.15*C + 0.10*F + 0.05*E
      const rawCombined =
        0.25 * globalNewsScore +
        0.25 * knowledgeGapScore +
        0.20 * reviewPriority +
        0.15 * categoryAffinity +
        0.10 * freshnessScore +
        0.05 * explorationScore;

      const personalizedScore = Math.min(100, Math.max(0, Math.round(rawCombined)));

      const breakdown: RecommendationScoreBreakdown = {
        globalNewsScore,
        knowledgeGapScore,
        reviewPriority,
        categoryAffinity,
        freshnessScore,
        explorationScore,
        rawCombinedScore: Math.round(rawCombined),
      };

      // H. Deterministic Reason & Badge Assignment
      const reasonMeta = this.determineRecommendationReason(
        breakdown,
        event,
        gapEval.weakConcepts,
        reviewEval.isDue,
        reviewEval.overdueHours
      );

      // I. Adaptive Explanation Level
      const eventMastery = progressByEventId.get(event.id)?.masteryScore ?? gapEval.averageConceptMastery;
      const recommendedExplanationLevel = masteryService.getRecommendedExplanationLevel(eventMastery);

      const context: PersonalizedRecommendationContext = {
        reasonCode: reasonMeta.code,
        reasonExplanation: reasonMeta.explanation,
        badgeLabel: reasonMeta.badge,
        recommendedExplanationLevel,
        dominantSignal: reasonMeta.dominantSignal,
        isExplorationSlot: false,
        scoreBreakdown: breakdown,
        relatedWeakConcepts: gapEval.weakConcepts,
        reviewDueStatus: {
          isDue: reviewEval.isDue,
          overdueHours: reviewEval.overdueHours,
          repetitionCount: scheduleByEventId.get(event.id)?.repetitionCount || 0,
        },
      };

      evaluatedItems.push({
        event,
        personalizedScore,
        recommendationReason: reasonMeta.explanation,
        reasonCode: reasonMeta.code,
        badgeLabel: reasonMeta.badge,
        recommendedExplanationLevel,
        context,
        isExplorationEligible: explorationScore >= 75 && globalNewsScore >= 60,
      });
    }

    // 6. Sort by PersonalizedScore DESC with stable tie-breaking
    evaluatedItems.sort((a, b) => {
      if (b.personalizedScore !== a.personalizedScore) {
        return b.personalizedScore - a.personalizedScore;
      }
      if (b.event.finalRankScore !== a.event.finalRankScore) {
        return b.event.finalRankScore - a.event.finalRankScore;
      }
      return a.event.id.localeCompare(b.event.id);
    });

    // 7. Apply 80/20 Relevance & Exploration Composition
    const totalSlots = limit;
    const explorationSlotsCount = Math.max(1, Math.round(totalSlots * explorationRatio));
    const relevanceSlotsCount = totalSlots - explorationSlotsCount;

    const chosenItems: PersonalizedFeedItem[] = [];
    const chosenIds = new Set<string>();
    const categoryCounts: Record<string, number> = {};

    // First pass: Fill relevance slots
    for (const item of evaluatedItems) {
      const cat = (item.event.category || item.event.categoryId || 'other').toLowerCase();
      const count = categoryCounts[cat] || 0;

      if (applyDiversity && count >= 3) {
        continue; // Max 3 items per category in top recommendations
      }

      chosenItems.push(item);
      chosenIds.add(item.event.id);
      categoryCounts[cat] = count + 1;

      if (chosenItems.length >= relevanceSlotsCount) break;
    }

    // Second pass: Fill exploration slots with under-represented categories
    let explorationAdded = 0;
    for (const item of evaluatedItems) {
      if (chosenIds.has(item.event.id)) continue;
      if (item.isExplorationEligible) {
        const cat = (item.event.category || item.event.categoryId || 'other').toLowerCase();
        const count = categoryCounts[cat] || 0;

        if (!applyDiversity || count < 2) {
          const itemClone: PersonalizedFeedItem = {
            ...item,
            context: {
              ...item.context,
              isExplorationSlot: true,
              badgeLabel: 'DISCOVER NEW',
              reasonCode: 'EXPLORATION',
              reasonExplanation: `Broaden your real-world understanding with key developments in ${item.event.category || 'new topics'}.`,
            },
            badgeLabel: 'DISCOVER NEW',
            reasonCode: 'EXPLORATION',
            recommendationReason: `Broaden your real-world understanding with key developments in ${item.event.category || 'new topics'}.`,
          };

          chosenItems.push(itemClone);
          chosenIds.add(item.event.id);
          categoryCounts[cat] = count + 1;
          explorationAdded++;

          if (explorationAdded >= explorationSlotsCount) break;
        }
      }
    }

    // Third pass: Fill remaining slots if any remain
    if (chosenItems.length < totalSlots) {
      for (const item of evaluatedItems) {
        if (!chosenIds.has(item.event.id)) {
          chosenItems.push(item);
          chosenIds.add(item.event.id);
          if (chosenItems.length >= totalSlots) break;
        }
      }
    }

    // Slicing for pagination
    const startIndex = (page - 1) * limit;
    const paginatedItems = chosenItems.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      meta: {
        totalEvaluated: evaluatedItems.length,
        returnedCount: paginatedItems.length,
        page,
        limit,
        hasMore: startIndex + limit < chosenItems.length,
        explorationItemCount: paginatedItems.filter((i) => i.context.isExplorationSlot || i.reasonCode === 'EXPLORATION').length,
        calculatedAt: now.toISOString(),
      },
    };
  }

  // ============================================================================
  // 2. DAILY LEARNING SUMMARY & GOAL TRACKER
  // ============================================================================

  public async getDailyLearningSummary(userId: string): Promise<DailyLearningSummary> {
    const now = new Date();
    const todayUtc = now.toISOString().split('T')[0];

    const [
      allProgress,
      allSchedules,
      allAttempts,
      allActivities,
      userPreferences,
    ] = await Promise.all([
      learningRepository.getAllProgressForUser(userId),
      learningRepository.getAllSchedulesForUser(userId),
      learningRepository.getAttemptsForUser(userId, 100),
      learningRepository.getActivitiesForUser(userId, 100),
      learningRepository.getPreferences(userId),
    ]);

    // Filter today's attempts and activities by UTC date
    const todayAttempts = allAttempts.filter((a) => {
      const d = new Date(a.submittedAt);
      return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === todayUtc;
    });

    const todayActivities = allActivities.filter((act) => {
      const d = new Date(act.createdAt);
      return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === todayUtc;
    });

    const quizzesCompletedToday = todayAttempts.length;
    const activitiesCompletedToday = todayActivities.length;

    // Due reviews today
    const dueSchedules = allSchedules.filter((s) => new Date(s.nextReviewAt).getTime() <= now.getTime());
    const reviewsDueToday = dueSchedules.length;

    // Completed reviews today (activities of type REVIEW_COMPLETED or quiz completions on scheduled items)
    const scheduledEventIds = new Set(allSchedules.map((s) => s.eventId).filter(Boolean));
    const reviewsCompletedToday = todayAttempts.filter((a) => scheduledEventIds.has(a.eventId)).length;

    // Concept mastery statistics
    let overallMastery = 0;
    let conceptsMasteredToday = 0;
    let conceptsDevelopingToday = 0;

    if (allProgress.length > 0) {
      const sum = allProgress.reduce((acc, p) => acc + p.masteryScore, 0);
      overallMastery = Math.round(sum / allProgress.length);

      for (const p of allProgress) {
        const lastAttDate = p.lastAttemptAt ? new Date(p.lastAttemptAt).toISOString().split('T')[0] : null;
        if (lastAttDate === todayUtc) {
          if (p.masteryStatus === 'STRONG') conceptsMasteredToday++;
          else if (p.masteryStatus === 'DEVELOPING') conceptsDevelopingToday++;
        }
      }
    }

    // New topics discovered today (distinct events viewed or attempted for the first time today)
    const todayEventIds = new Set(todayActivities.map((a) => a.eventId).filter(Boolean));
    const newTopicsDiscoveredToday = todayEventIds.size;

    // Daily Goal calculation
    const dailyGoal = userPreferences.dailyGoal || 3;
    const totalDailyActions = quizzesCompletedToday + todayActivities.filter((a) => a.activityType === 'EXPLANATION_VIEWED' || a.activityType === 'EVENT_VIEWED').length;
    const dailyGoalProgressPercentage = Math.min(100, Math.round((totalDailyActions / dailyGoal) * 100));
    const isDailyGoalAchieved = totalDailyActions >= dailyGoal;

    // Streak calculation
    const streak = learningService.calculateStreak(allAttempts, now);

    // Recommended Next Action Item
    let recommendedNextAction: DailyLearningSummary['recommendedNextAction'];
    if (dueSchedules.length > 0) {
      const topDue = dueSchedules[0];
      let title = 'Review Due Concept';
      if (topDue.eventId) {
        const ev = await EventRepository.findById(topDue.eventId);
        if (ev) title = ev.title;
      }
      recommendedNextAction = {
        title: `Spaced Review: ${title}`,
        reason: 'Reinforce active recall while the memory interval is optimal.',
        actionType: 'REVIEW',
        eventId: topDue.eventId,
        conceptId: topDue.conceptId,
      };
    } else {
      const weakItems = allProgress.filter((p) => p.masteryStatus === 'NEEDS_LEARNING' || p.masteryScore < 50);
      if (weakItems.length > 0) {
        const weak = weakItems[0];
        let title = 'Strengthen Weak Concept';
        if (weak.eventId) {
          const ev = await EventRepository.findById(weak.eventId);
          if (ev) title = ev.title;
        }
        recommendedNextAction = {
          title: `Build Mastery: ${title}`,
          reason: `Current mastery is ${weak.masteryScore}%. Review the beginner explanation to build confidence.`,
          actionType: 'LEARN',
          eventId: weak.eventId,
          conceptId: weak.conceptId,
        };
      } else {
        recommendedNextAction = {
          title: 'Discover Fresh Canonical Events',
          reason: 'Explore top trending real-world stories and unlock new knowledge concepts.',
          actionType: 'EXPLORE',
        };
      }
    }

    return {
      userId,
      todayDateUtc: todayUtc,
      reviewsDueToday,
      reviewsCompletedToday,
      quizzesCompletedToday,
      conceptsMasteredToday,
      conceptsDevelopingToday,
      newTopicsDiscoveredToday,
      activitiesCompletedToday: totalDailyActions,
      dailyGoal,
      dailyGoalProgressPercentage,
      isDailyGoalAchieved,
      overallMastery,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      recommendedNextAction,
    };
  }

  // ============================================================================
  // 3. LEARNING PREFERENCES MANAGEMENT
  // ============================================================================

  public async getUserPreferences(userId: string): Promise<UserLearningPreferences> {
    return learningRepository.getPreferences(userId);
  }

  public async updateUserPreferences(
    userId: string,
    updates: Partial<UserLearningPreferences>
  ): Promise<UserLearningPreferences> {
    return learningRepository.savePreferences({
      ...updates,
      userId,
    });
  }

  // ============================================================================
  // 4. ACTIVITY TRACKING HOOK
  // ============================================================================

  public async trackActivity(params: {
    userId: string;
    activityType: LearningActivityType;
    eventId?: string;
    conceptId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LearningActivityRecord> {
    return learningRepository.saveActivity({
      userId: params.userId,
      activityType: params.activityType,
      eventId: params.eventId,
      conceptId: params.conceptId,
      metadata: params.metadata || {},
      createdAt: new Date().toISOString(),
    });
  }

  // ============================================================================
  // 5. HELPER ALGORITHMS (KNOWLEDGE GAP, REVIEW PRIORITY, AFFINITY, REASONS)
  // ============================================================================

  private calculateCategoryAffinities(
    attempts: QuizAttemptRecord[],
    activities: LearningActivityRecord[],
    progress: UserLearningProgress[],
    events: CanonicalEvent[]
  ): Map<string, number> {
    const eventCategoryMap = new Map<string, string>();
    for (const e of events) {
      if (e.id) {
        eventCategoryMap.set(e.id, (e.category || e.categoryId || 'general').toLowerCase());
      }
    }

    const categoryWeights = new Map<string, number>();
    let totalWeight = 0;

    // Weight 1: Quiz attempts (weight 3.0)
    for (const a of attempts) {
      const cat = eventCategoryMap.get(a.eventId) || 'general';
      const w = 3.0;
      categoryWeights.set(cat, (categoryWeights.get(cat) || 0) + w);
      totalWeight += w;
    }

    // Weight 2: Activities (Saved: 2.0, Viewed: 1.0)
    for (const act of activities) {
      const cat = (act.eventId ? eventCategoryMap.get(act.eventId) : undefined) || 'general';
      const w = act.activityType === 'EVENT_SAVED' ? 2.0 : 1.0;
      categoryWeights.set(cat, (categoryWeights.get(cat) || 0) + w);
      totalWeight += w;
    }

    const affinities = new Map<string, number>();
    if (totalWeight === 0) {
      return affinities;
    }

    for (const [cat, w] of categoryWeights.entries()) {
      const percentage = Math.round((w / totalWeight) * 100);
      affinities.set(cat, percentage);
    }

    return affinities;
  }

  private async getEventConcepts(event: CanonicalEvent): Promise<{ id: string; title: string }[]> {
    if (event.concepts && event.concepts.length > 0) {
      return event.concepts.map((c) => ({ id: c.id, title: c.title }));
    }
    const repoConcepts = await aiUnderstandingRepository.getConceptsByEventId(event.id);
    if (repoConcepts && repoConcepts.length > 0) {
      return repoConcepts.map((c) => ({ id: c.id, title: c.title }));
    }
    return [];
  }

  private calculateKnowledgeGap(
    event: CanonicalEvent,
    concepts: { id: string; title: string }[],
    progressByEvent: Map<string, UserLearningProgress>,
    progressByConcept: Map<string, UserLearningProgress>
  ): { gapScore: number; weakConcepts: string[]; averageConceptMastery: number } {
    const weakConcepts: string[] = [];
    const eventProgress = progressByEvent.get(event.id);

    if (concepts.length === 0) {
      if (eventProgress) {
        const gap = Math.max(10, 100 - eventProgress.masteryScore);
        if (eventProgress.masteryStatus === 'NEEDS_LEARNING') weakConcepts.push(event.title);
        return { gapScore: gap, weakConcepts, averageConceptMastery: eventProgress.masteryScore };
      }
      return { gapScore: 60, weakConcepts: [], averageConceptMastery: 0 };
    }

    let totalGap = 0;
    let totalMastery = 0;

    for (const c of concepts) {
      const cp = progressByConcept.get(c.id);
      if (!cp) {
        // No prior attempt on this concept -> moderate-high learning gap
        totalGap += 70;
        totalMastery += 0;
      } else {
        totalMastery += cp.masteryScore;
        if (cp.masteryStatus === 'NEEDS_LEARNING' || cp.masteryScore < 50) {
          totalGap += Math.max(50, 100 - cp.masteryScore);
          weakConcepts.push(c.title);
        } else if (cp.masteryStatus === 'DEVELOPING') {
          totalGap += Math.max(20, 100 - cp.masteryScore);
        } else {
          // Strong mastery -> low gap
          totalGap += Math.max(10, 100 - cp.masteryScore);
        }
      }
    }

    const gapScore = Math.min(100, Math.max(0, Math.round(totalGap / concepts.length)));
    const averageConceptMastery = Math.round(totalMastery / concepts.length);

    return { gapScore, weakConcepts, averageConceptMastery };
  }

  private calculateReviewPriority(
    event: CanonicalEvent,
    scheduleByEvent: Map<string, UserReviewSchedule>,
    progressByEvent: Map<string, UserLearningProgress>,
    now: Date
  ): { score: number; isDue: boolean; overdueHours: number } {
    const schedule = scheduleByEvent.get(event.id);
    if (!schedule) {
      return { score: 0, isDue: false, overdueHours: 0 };
    }

    const reviewTime = new Date(schedule.nextReviewAt).getTime();
    const isDue = reviewTime <= now.getTime();
    const overdueMs = Math.max(0, now.getTime() - reviewTime);
    const overdueHours = Math.round(overdueMs / 3600000);

    if (!isDue) {
      return { score: 10, isDue: false, overdueHours: 0 };
    }

    const eventProgress = progressByEvent.get(event.id);
    const mastery = eventProgress ? eventProgress.masteryScore : 50;

    // Due score calculation (capped at 100)
    let score = 70 + Math.min(20, overdueHours * 2) + Math.max(0, Math.round((100 - mastery) / 10));
    score = Math.min(100, Math.max(70, score));

    return { score, isDue: true, overdueHours };
  }

  private determineRecommendationReason(
    breakdown: RecommendationScoreBreakdown,
    event: CanonicalEvent,
    weakConcepts: string[],
    isReviewDue: boolean,
    overdueHours: number
  ): { code: RecommendationReasonCode; explanation: string; badge: string; dominantSignal: string } {
    const categoryName = event.category || event.categoryId || 'General';

    // Rule 1: Scheduled Spaced Review Due
    if (isReviewDue || breakdown.reviewPriority >= 70) {
      const overdueText = overdueHours > 0 ? ` (${overdueHours}h overdue)` : '';
      return {
        code: 'REVIEW_DUE',
        explanation: `Scheduled active recall review is due today${overdueText} to reinforce long-term memory.`,
        badge: 'REVIEW DUE',
        dominantSignal: 'Spaced Repetition Schedule',
      };
    }

    // Rule 2: Breaking / Critical Global Event
    if (event.rankingMetadata?.breakingStatus || (breakdown.globalNewsScore >= 90 && breakdown.freshnessScore >= 75)) {
      return {
        code: 'BREAKING_GLOBAL',
        explanation: `High-impact breaking news corroborated across ${event.sourceCount || 2} verified publishers.`,
        badge: 'BREAKING',
        dominantSignal: 'Global News Ranking',
      };
    }

    // Rule 3: Weak Concepts Needing Reinforcement
    if (weakConcepts.length > 0 && breakdown.knowledgeGapScore >= 60) {
      return {
        code: 'WEAK_CONCEPT',
        explanation: `Strengthen developing concepts: "${weakConcepts.slice(0, 2).join(', ')}" related to this event.`,
        badge: 'STRENGTHEN',
        dominantSignal: 'Weak Concepts',
      };
    }

    // Rule 4: High Knowledge Gap / New Concepts
    if (breakdown.knowledgeGapScore >= 65) {
      return {
        code: 'KNOWLEDGE_GAP',
        explanation: `Introduces foundational knowledge concepts in ${categoryName} relevant to current affairs.`,
        badge: 'LEARN THIS',
        dominantSignal: 'Knowledge Gap',
      };
    }

    // Rule 5: Exploration of Under-Represented Domains
    if (breakdown.explorationScore >= 75) {
      return {
        code: 'EXPLORATION',
        explanation: `Broaden your domain knowledge with key developments in ${categoryName}.`,
        badge: 'DISCOVER NEW',
        dominantSignal: 'Domain Exploration',
      };
    }

    // Rule 6: High Category Learning Affinity
    if (breakdown.categoryAffinity >= 40) {
      return {
        code: 'CATEGORY_AFFINITY',
        explanation: `Recommended based on your active learning engagement in ${categoryName}.`,
        badge: 'FOR YOU',
        dominantSignal: 'Category Affinity',
      };
    }

    // Default: Continue Developing
    return {
      code: 'CONTINUE_LEARNING',
      explanation: `Trending event with structured 5W1H breakdown and active recall quiz.`,
      badge: 'CONTINUE',
      dominantSignal: 'Curated Intelligence',
    };
  }
}

export const personalizationService = new PersonalizationService();
