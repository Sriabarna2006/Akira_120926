export type RegionTier = 1 | 2 | 3;
export type SourceTier = 1 | 2 | 3;
export type UrgencyLabel = 'BREAKING' | 'TRENDING' | 'IMPORTANT';
export type TrendStatus = 'NORMAL' | 'RISING' | 'TRENDING' | 'HIGHLY_TRENDING';
export type ImportanceStatus = 'LOW' | 'MODERATE' | 'IMPORTANT' | 'CRITICAL';
export type FreshnessState = 'FRESH' | 'RECENT' | 'AGING' | 'STALE' | 'SOURCE_UNAVAILABLE';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type LifecycleStatus = 
  | 'INITIAL_REPORT' 
  | 'NEW_DEVELOPMENT' 
  | 'OFFICIAL_CONFIRMATION' 
  | 'FOLLOW_UP' 
  | 'RESOLVED';

export interface RankingMetadata {
  trendScore: number;
  importanceScore: number;
  finalRankScore: number;
  velocityScore: number;
  coverageScore: number;
  recencyScore: number;
  freshnessScore: number;
  spreadScore: number;
  regionalRelevanceScore: number;
  independentSourceCount: number;
  trendStatus: TrendStatus;
  importanceStatus: ImportanceStatus;
  breakingStatus: boolean;
  freshnessState: FreshnessState;
  confidence: ConfidenceLevel;
  explanation: string;
}

export interface TrendObservation {
  id?: string;
  eventId: string;
  observedAt: string;
  articleCount: number;
  independentSourceCount: number;
  trendScore: number;
  importanceScore: number;
  velocityScore: number;
  coverageScore: number;
  recencyScore: number;
  freshnessScore: number;
  spreadScore: number;
  finalRankScore: number;
}

export interface Region {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tier: number;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  feedUrl?: string;
  regionId?: string;
  categoryId?: string;
  tier: number;
  credibilityScore: number;
  conglomerateId?: string;
  isActive: boolean;
  lastSuccessfulFetch?: string;
  lastFailedFetch?: string;
  failureCount: number;
  updateFrequencyMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventSource {
  id: string;
  eventId: string;
  sourceId?: string;
  sourceName: string;
  title: string;
  url: string;
  snippet?: string;
  publishedAt: string;
  tier: number;
  createdAt: string;
}

export interface Article {
  id: string;
  sourceId?: string;
  eventId?: string;
  title: string;
  url: string;
  contentSnippet?: string;
  publishedAt: string;
  regionId?: string;
  categoryId?: string;
  createdAt: string;
  sourceName?: string;
}

export type ExplanationLevel = 'verySimple' | 'beginner' | 'student' | 'technical' | 'deepDive';

export interface FiveWOneH {
  whatHappened: string;
  whyDidItHappen: string;
  whyDoesItMatter: string;
  whoIsAffected: string[];
  whatCouldHappenNext: string[];
  background: string;
}

export interface MultiLevelExplanation {
  verySimple: string;
  beginner: string;
  student: string;
  technical: string;
  deepDive: string;
}

export interface ExtractedConcept {
  id: string;
  title: string;
  slug: string;
  shortDefinition: string;
  whyItMatters?: string;
  category?: string;
  prerequisites?: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EventAISummaryRecord {
  id: string;
  eventId: string;
  version: number;
  provider: string;
  model: string;
  fiveWOneH: FiveWOneH;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

export interface EventExplanationRecord {
  id: string;
  eventId: string;
  level: ExplanationLevel;
  content: string;
  provider: string;
  model: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventQuizRecord {
  id: string;
  eventId: string;
  version: number;
  questions: QuizQuestion[];
  provider: string;
  model: string;
  createdAt: string;
}

export interface QuizSubmission {
  eventId: string;
  answers: Record<number | string, number>;
}

export interface QuizResult {
  eventId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  masteryStatus: 'NEEDS_LEARNING' | 'DEVELOPING' | 'STRONG';
  results: {
    questionId: number;
    question: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string;
  }[];
  timestamp: string;
}

export interface CanonicalEvent {
  id: string;
  title: string;
  summary: string;
  regionId?: string;
  categoryId?: string;
  region?: string;
  category?: string;
  urgencyLabel: UrgencyLabel;
  importanceScore: number;
  velocityScore: number;
  trendScore?: number;
  finalRankScore: number;
  whyItMatters?: string;
  firstPublishedAt: string;
  lastUpdatedAt: string;
  sourceCount: number;
  lifecycleStatus: LifecycleStatus;
  metadata?: Record<string, unknown>;
  rankingMetadata?: RankingMetadata;
  createdAt: string;
  sources?: EventSource[];
  articles?: Article[];
  relatedConcepts?: string[];
  breakdown?: FiveWOneH;
  explanations?: MultiLevelExplanation;
  concepts?: ExtractedConcept[];
  quiz?: QuizQuestion[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  timestamp: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// PHASE 7: PERSONALIZATION, LEARNING PROGRESS & SPACED REPETITION TYPES
// ============================================================================

export type MasteryStatus = 'NEEDS_LEARNING' | 'DEVELOPING' | 'STRONG';
export type ReviewStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
export type LearningActivityType = 
  | 'EVENT_VIEWED'
  | 'EXPLANATION_VIEWED'
  | 'CONCEPT_VIEWED'
  | 'QUIZ_STARTED'
  | 'QUIZ_COMPLETED'
  | 'EVENT_SAVED'
  | 'REVIEW_COMPLETED';

export interface UserLearningProgress {
  id: string;
  userId: string;
  conceptId?: string;
  eventId?: string;
  masteryScore: number;
  masteryStatus: MasteryStatus;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  lastAttemptAt?: string;
  lastMasteredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserReviewSchedule {
  id: string;
  userId: string;
  conceptId?: string;
  eventId?: string;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  lastReviewedAt?: string;
  nextReviewAt: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttemptRecord {
  id: string;
  userId: string;
  eventId: string;
  conceptId?: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  scorePercentage: number;
  masteryStatus: MasteryStatus;
  answers: Record<string | number, number>;
  submittedAt: string;
}

export interface LearningActivityRecord {
  id: string;
  userId: string;
  activityType: LearningActivityType;
  eventId?: string;
  conceptId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DueReviewItem {
  id: string;
  eventId?: string;
  conceptId?: string;
  title: string;
  category: string;
  masteryScore: number;
  masteryStatus: MasteryStatus;
  status: ReviewStatus;
  intervalDays: number;
  easeFactor: number;
  repetitionCount: number;
  lastReviewedAt?: string;
  nextReviewAt: string;
  isOverdue: boolean;
  overdueHours: number;
  recommendedExplanationLevel: ExplanationLevel;
}

export interface LearningRecommendation {
  type: 'REVIEW_DUE' | 'WEAK_CONCEPT' | 'CONTINUE_LEARNING' | 'NEW_CONCEPT';
  title: string;
  reason: string;
  eventId?: string;
  conceptId?: string;
  category?: string;
  masteryScore?: number;
  priority: number;
}

export interface LearningDashboardData {
  overallMastery: number;
  totalItemsTracked: number;
  conceptsLearned: number;
  conceptsDeveloping: number;
  conceptsNeedingLearning: number;
  dueReviewsCount: number;
  completedReviewsCount: number;
  currentStreak: number;
  longestStreak: number;
  categoryProgress: Record<string, number>;
  recentActivity: QuizAttemptRecord[];
  weakConcepts: DueReviewItem[];
  isNewUser: boolean;
}

export interface QuizSubmissionLearningPayload {
  progress: UserLearningProgress;
  schedule: UserReviewSchedule;
  attempt: QuizAttemptRecord;
  currentStreak: number;
  recommendedLevel: ExplanationLevel;
}

// ============================================================================
// PHASE 8: INTELLIGENT DAILY LEARNING & ADAPTIVE PERSONALIZATION TYPES
// ============================================================================

export type RecommendationReasonCode =
  | 'REVIEW_DUE'
  | 'WEAK_CONCEPT'
  | 'KNOWLEDGE_GAP'
  | 'CATEGORY_AFFINITY'
  | 'EXPLORATION'
  | 'BREAKING_GLOBAL'
  | 'CONTINUE_LEARNING';

export type PreferredDifficulty = 'ADAPTIVE' | 'BEGINNER' | 'STUDENT' | 'TECHNICAL' | 'DEEP_DIVE';

export interface UserLearningPreferences {
  id: string;
  userId: string;
  dailyGoal: number;
  preferredDifficulty: PreferredDifficulty;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationScoreBreakdown {
  globalNewsScore: number;
  knowledgeGapScore: number;
  reviewPriority: number;
  categoryAffinity: number;
  freshnessScore: number;
  explorationScore: number;
  rawCombinedScore: number;
}

export interface PersonalizedRecommendationContext {
  reasonCode: RecommendationReasonCode;
  reasonExplanation: string;
  badgeLabel: string;
  recommendedExplanationLevel: ExplanationLevel;
  dominantSignal: string;
  isExplorationSlot: boolean;
  scoreBreakdown?: RecommendationScoreBreakdown;
  relatedWeakConcepts?: string[];
  reviewDueStatus?: {
    isDue: boolean;
    overdueHours: number;
    repetitionCount: number;
  };
}

export interface PersonalizedFeedItem {
  event: CanonicalEvent;
  personalizedScore: number;
  recommendationReason: string;
  reasonCode: RecommendationReasonCode;
  badgeLabel: string;
  recommendedExplanationLevel: ExplanationLevel;
  context: PersonalizedRecommendationContext;
}

export interface PersonalizedFeedResult {
  items: PersonalizedFeedItem[];
  meta: {
    totalEvaluated: number;
    returnedCount: number;
    page: number;
    limit: number;
    hasMore: boolean;
    explorationItemCount: number;
    calculatedAt: string;
  };
}

export interface DailyLearningSummary {
  userId: string;
  todayDateUtc: string;
  reviewsDueToday: number;
  reviewsCompletedToday: number;
  quizzesCompletedToday: number;
  conceptsMasteredToday: number;
  conceptsDevelopingToday: number;
  newTopicsDiscoveredToday: number;
  activitiesCompletedToday: number;
  dailyGoal: number;
  dailyGoalProgressPercentage: number;
  isDailyGoalAchieved: boolean;
  overallMastery: number;
  currentStreak: number;
  longestStreak: number;
  recommendedNextAction?: {
    title: string;
    reason: string;
    actionType: 'REVIEW' | 'LEARN' | 'EXPLORE';
    eventId?: string;
    conceptId?: string;
  };
}

export interface PersonalizationFeedOptions {
  limit?: number;
  page?: number;
  regionId?: string;
  categoryId?: string;
  explorationRatio?: number; // default 0.20 (20%)
  applyDiversity?: boolean;
}

// ============================================================================
// PHASE 9: KNOWLEDGE GRAPH & CROSS-TOPIC INTELLIGENCE TYPES
// ============================================================================

export type ConceptRelationType =
  | 'PREREQUISITE'
  | 'RELATED'
  | 'PART_OF'
  | 'CAUSES'
  | 'DEPENDS_ON'
  | 'CONTRASTS_WITH';

export type UserMasteryClassification = 'STRONG' | 'DEVELOPING' | 'NEEDS_LEARNING' | 'UNKNOWN';

export interface ConceptRelation {
  id: string;
  sourceConceptId: string;
  targetConceptId: string;
  relationType: ConceptRelationType;
  weight: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConceptGraphNode {
  id: string;
  title: string;
  slug: string;
  category: string;
  shortDefinition: string;
  whyItMatters?: string;
  masteryStatus: UserMasteryClassification;
  masteryScore: number;
  isTarget?: boolean;
  isPrerequisite?: boolean;
  depth?: number;
}

export interface ConceptGraphEdge {
  source: string;
  target: string;
  relationType: ConceptRelationType;
  weight: number;
}

export interface ConceptLearningPathStep {
  stepNumber: number;
  conceptId: string;
  title: string;
  slug: string;
  category: string;
  shortDefinition: string;
  masteryStatus: UserMasteryClassification;
  masteryScore: number;
  reason: string;
  isPrerequisite: boolean;
  isTarget: boolean;
  actionType: 'LEARN' | 'REVIEW' | 'PASS';
}

export interface ConceptLearningPath {
  targetConcept: ExtractedConcept;
  totalSteps: number;
  estimatedMinutes: number;
  steps: ConceptLearningPathStep[];
  userOverallReadiness: number;
  hasMissingPrerequisites: boolean;
}

export interface RelatedConceptItem {
  concept: ExtractedConcept;
  score: number;
  relationType?: ConceptRelationType;
  sharedEventCount: number;
  directRelationWeight: number;
  graphDistance: number;
  reason: string;
}

export interface RelatedEventItem {
  event: CanonicalEvent;
  score: number;
  sharedConceptIds: string[];
  relatedConceptIds: string[];
  scoreBreakdown: {
    sharedConceptScore: number;
    relatedConceptScore: number;
    categorySimilarity: number;
    regionSimilarity: number;
    temporalRelevance: number;
    globalImportance: number;
  };
  reason: string;
}

export interface EventKnowledgeMap {
  eventId: string;
  eventTitle: string;
  keyConcepts: (ExtractedConcept & { masteryStatus: UserMasteryClassification; masteryScore: number })[];
  prerequisiteTree: ConceptGraphNode[];
  edges: ConceptGraphEdge[];
  userReadinessPercentage: number;
  knowledgeGaps: (ExtractedConcept & { masteryStatus: UserMasteryClassification; masteryScore: number })[];
  learnTheseFirst: (ExtractedConcept & { masteryStatus: UserMasteryClassification; masteryScore: number; reason: string })[];
  relatedConcepts: RelatedConceptItem[];
  relatedEvents: RelatedEventItem[];
}

export interface ConceptKnowledgeStatus {
  concept: ExtractedConcept;
  masteryScore: number;
  masteryStatus: UserMasteryClassification;
  attemptCount: number;
  correctCount: number;
  lastAttemptAt?: string;
  prerequisites: (ExtractedConcept & { masteryStatus: UserMasteryClassification; masteryScore: number })[];
  knowledgeGaps: (ExtractedConcept & { masteryStatus: UserMasteryClassification; masteryScore: number })[];
  isReadyForTarget: boolean;
}




