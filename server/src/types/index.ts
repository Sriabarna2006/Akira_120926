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
  sourceType?: SourceType;
  consecutiveFailures?: number;
  specialization?: string;
  healthStatus?: SourceHealthStatus;
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

// ============================================================================
// PHASE 10: TRUST, EVIDENCE & SOURCE INTELLIGENCE TYPES
// ============================================================================

export type SourceType =
  | 'GOVERNMENT'
  | 'OFFICIAL'
  | 'WIRE'
  | 'NATIONAL'
  | 'REGIONAL'
  | 'SPECIALIST'
  | 'TECHNICAL'
  | 'OTHER';

export type EvidenceType =
  | 'PRIMARY'
  | 'INDEPENDENT_REPORTING'
  | 'SECONDARY'
  | 'CONTEXT'
  | 'UNCONFIRMED';

export type ConfidenceState =
  | 'WELL_SUPPORTED'
  | 'DEVELOPING'
  | 'LIMITED_EVIDENCE'
  | 'CONFLICTING'
  | 'UNCONFIRMED';

export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ConflictStatus = 'UNRESOLVED' | 'ACKNOWLEDGED' | 'RESOLVED';
export type SourceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'PAUSED';

export interface EvidenceRecord {
  id: string;
  eventId: string;
  articleId?: string;
  sourceId?: string;
  sourceName: string;
  evidenceType: EvidenceType;
  sourceAuthorityTier: number;
  isIndependent: boolean;
  evidenceTimestamp: string;
  evidenceStatus: string;
  verificationMetadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceConflict {
  id: string;
  eventId: string;
  field: string;
  sourceA: string;
  sourceB: string;
  valueA: string;
  valueB: string;
  severity: ConflictSeverity;
  status: ConflictStatus;
  explanation?: string;
  detectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceProvenanceItem {
  articleId?: string;
  sourceId?: string;
  publisherName: string;
  title: string;
  url: string;
  snippet?: string;
  publishedAt: string;
  sourceType: SourceType;
  authorityTier: number;
  region?: string;
  isIndependent: boolean;
  evidenceType: EvidenceType;
}

export interface EvidenceScoreBreakdown {
  independentPublisherScore: number; // 25%
  primarySourceScore: number; // 20%
  sourceDiversityScore: number; // 20%
  freshnessScore: number; // 15%
  authorityScore: number; // 10%
  agreementScore: number; // 10%
}

export interface EventEvidenceSummary {
  eventId: string;
  completenessScore: number;
  confidenceState: ConfidenceState;
  totalArticleCount: number;
  uniquePublisherCount: number;
  uniqueSourceTypeCount: number;
  primarySourceCount: number;
  independentReportingCount: number;
  agreementState: 'HIGH_CONSISTENCY' | 'MODERATE_CONSISTENCY' | 'CONFLICTING' | 'SINGLE_SOURCE';
  scoreBreakdown: EvidenceScoreBreakdown;
  conflicts: EvidenceConflict[];
  sources: SourceProvenanceItem[];
  explanation: string;
  calculatedAt: string;
}

export interface SourceHealthReport {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  tier: number;
  isActive: boolean;
  healthStatus: SourceHealthStatus;
  failureCount: number;
  consecutiveFailures: number;
  lastSuccessfulFetch?: string;
  lastFailedFetch?: string;
  updateFrequencyMinutes: number;
  lastArticleReceived?: string;
}

// ============================================================================
// PHASE 11: TEMPORAL STORYLINE EVOLUTION & NARRATIVE TRAJECTORY TYPES
// ============================================================================

export type StorylineStatus = 
  | 'EMERGING' 
  | 'DEVELOPING' 
  | 'ACTIVE' 
  | 'STABILIZING' 
  | 'CONCLUDED' 
  | 'UNKNOWN';

export type StorylineTrajectoryDirection = 
  | 'ESCALATING' 
  | 'DEVELOPING' 
  | 'STABLE' 
  | 'DE-ESCALATING' 
  | 'CONCLUDED' 
  | 'UNKNOWN';

export type StorylineRelationshipType = 
  | 'ORIGIN' 
  | 'DEVELOPMENT' 
  | 'DECISION' 
  | 'RESPONSE' 
  | 'IMPLEMENTATION' 
  | 'OUTCOME' 
  | 'UPDATE' 
  | 'OTHER';

export type StorylineAssociationClassification = 
  | 'ASSOCIATED' 
  | 'POSSIBLE_ASSOCIATION' 
  | 'UNRELATED';

export interface Storyline {
  id: string;
  title: string;
  summary: string;
  status: StorylineStatus;
  regionId?: string;
  primaryCategoryId?: string;
  region?: string;
  category?: string;
  startedAt: string;
  lastUpdatedAt: string;
  currentEventId?: string;
  trajectory: StorylineTrajectoryDirection;
  eventCount: number;
  turningPointCount: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StorylineEventRelation {
  id: string;
  storylineId: string;
  eventId: string;
  relationshipType: StorylineRelationshipType;
  sequenceOrder: number;
  eventTime: string;
  associationScore: number;
  associationExplanation?: string;
  addedAt: string;
  event?: CanonicalEvent;
}

export interface StorylineTimelineItem {
  id: string;
  eventId: string;
  title: string;
  summary: string;
  relationshipType: StorylineRelationshipType;
  sequenceOrder: number;
  eventTime: string;
  urgencyLabel: UrgencyLabel;
  importanceScore: number;
  finalRankScore: number;
  sourceCount: number;
  lifecycleStatus: LifecycleStatus;
  isTurningPoint: boolean;
  turningPointReason?: string;
  evidenceCompletenessScore?: number;
  evidenceConfidenceState?: ConfidenceState;
  keyConcepts?: string[];
}

export interface StorylineTurningPoint {
  id: string;
  storylineId: string;
  eventId: string;
  title: string;
  reason: string;
  turningPointType: string;
  occurredAt: string;
  createdAt: string;
}

export interface StorylineAssociationSignals {
  sharedConceptsScore: number;     // 25%
  temporalProximityScore: number;  // 20%
  regionalAffinityScore: number;   // 15%
  categoryMatchScore: number;      // 15%
  semanticSimilarityScore: number; // 10%
  knowledgeGraphScore: number;     // 10%
  sourceOverlapScore: number;      // 5%
}

export interface StorylineAssociationScore {
  score: number; // 0-100
  classification: StorylineAssociationClassification;
  signals: StorylineAssociationSignals;
  sharedConcepts: string[];
  timeGapHours: number;
  explanation: string;
}

export interface StorylineTrajectoryDetails {
  storylineId: string;
  currentStatus: StorylineStatus;
  trajectoryDirection: StorylineTrajectoryDirection;
  eventCount: number;
  timelineDurationHours: number;
  timelineDurationFormatted: string;
  recentActivityLevel: 'HIGH' | 'MODERATE' | 'LOW';
  turningPointCount: number;
  latestEvent: {
    id: string;
    title: string;
    eventTime: string;
    lifecycleStatus: LifecycleStatus;
  };
  previousEvent?: {
    id: string;
    title: string;
    eventTime: string;
    lifecycleStatus: LifecycleStatus;
  };
  latestEvidenceCompleteness: number;
  latestConfidenceState: ConfidenceState;
  explanation: string;
}

export interface StorylineDeltaKnowledge {
  storylineId: string;
  fromEventId?: string;
  toEventId: string;
  fromEventTitle?: string;
  toEventTitle: string;
  timeGapHours: number;
  hasMeaningfulChange: boolean;
  newFacts: string[];
  changedFacts: string[];
  newConcepts: ExtractedConcept[];
  changedAffectedGroups: {
    added: string[];
    previous: string[];
  };
  statusShift?: {
    from: string;
    to: string;
  };
  evidenceEvolution: {
    fromScore: number;
    toScore: number;
    scoreDelta: number;
    fromState: ConfidenceState;
    toState: ConfidenceState;
    newPublishers: string[];
  };
  newConflicts: EvidenceConflict[];
  understandingShift: {
    previousSummary: string;
    currentSummary: string;
    keyShift: string;
  };
  summaryExplanation: string;
}

export interface UserStorylineLearningDelta {
  userId: string;
  storylineId: string;
  hasLearnedEarlierEvents: boolean;
  alreadyKnownEventIds: string[];
  alreadyKnownConceptIds: string[];
  newEventsSinceLastLearning: {
    id: string;
    title: string;
    eventTime: string;
    relationshipType: StorylineRelationshipType;
  }[];
  newConceptsSinceLastLearning: ExtractedConcept[];
  evidenceStateShift?: string;
  summaryText: string;
}

export interface StorylineEvidenceOverview {
  storylineId: string;
  latestCompletenessScore: number;
  overallConfidenceState: ConfidenceState;
  totalUniquePublishers: number;
  totalPrimarySources: number;
  totalIndependentReportingCount: number;
  publisherTypeCounts: Record<string, number>;
  conflictCount: number;
  timelineEvidenceEvolution: {
    eventId: string;
    eventTitle: string;
    eventTime: string;
    completenessScore: number;
    confidenceState: ConfidenceState;
    sourceCount: number;
  }[];
}

export interface StorylineKnowledgeOverview {
  storylineId: string;
  dominantConcepts: ExtractedConcept[];
  timelineConceptEvolution: {
    eventId: string;
    eventTitle: string;
    newConceptsIntroduced: ExtractedConcept[];
  }[];
  prerequisiteConcepts: ExtractedConcept[];
  relatedConcepts: ExtractedConcept[];
  relatedStorylines: {
    id: string;
    title: string;
    status: StorylineStatus;
    trajectory: StorylineTrajectoryDirection;
    sharedConcepts: string[];
    relevanceScore: number;
  }[];
}

export interface StorylineDetailResponse {
  storyline: Storyline;
  trajectory: StorylineTrajectoryDetails;
  timeline: StorylineTimelineItem[];
  turningPoints: StorylineTurningPoint[];
  latestDelta: StorylineDeltaKnowledge;
  evidenceOverview: StorylineEvidenceOverview;
  knowledgeOverview: StorylineKnowledgeOverview;
}

export interface StorylineFilterParams {
  regionId?: string;
  categoryId?: string;
  status?: StorylineStatus;
  trajectory?: StorylineTrajectoryDirection;
  search?: string;
  page?: number;
  limit?: number;
}

// ==============================================================================
// PHASE 12: LIVING STORYLINE CATCH-UP & CHRONOLOGICAL SYNTHESIS
// ==============================================================================

export type StorylineCatchupStatus =
  | 'FULLY_CAUGHT_UP'
  | 'NEW_DEVELOPMENTS'
  | 'MAJOR_UPDATE'
  | 'MULTIPLE_TURNING_POINTS'
  | 'CONFLICTING_INFORMATION'
  | 'LIMITED_EVIDENCE';

export type StorylineNextActionType =
  | 'REVIEW_CONCEPT'
  | 'COMPLETE_QUIZ'
  | 'READ_LATEST_EVENT'
  | 'LEARN_PREREQUISITE'
  | 'REVIEW_STORYLINE'
  | 'EXPLORE_RELATED_EVENT'
  | 'NO_ACTION';

export type ConceptMasteryCategory =
  | 'ALREADY_KNOWN'
  | 'NEEDS_REVIEW'
  | 'NEEDS_LEARNING'
  | 'NEW';

export interface StorylineCatchupConcept {
  id: string;
  title: string;
  slug: string;
  shortDefinition: string;
  category: string;
  masteryStatus: ConceptMasteryCategory;
  masteryScore: number;
  reason?: string;
}

export interface StorylineCatchupDelta {
  newFacts: string[];
  changedFacts: string[];
  newConcepts: StorylineCatchupConcept[];
  supersededAssumptions: string[];
  hasMeaningfulChange: boolean;
}

export interface StorylineCatchupEvent {
  id: string;
  title: string;
  summary: string;
  eventTime: string;
  isTurningPoint: boolean;
  turningPointType?: StorylineRelationshipType;
  turningPointReason?: string;
  isReviewedByUser: boolean;
  evidenceCompletenessScore: number;
  evidenceConfidenceState: ConfidenceState;
  newFactsIntroduced: string[];
  changedFacts: string[];
  concepts: ExtractedConcept[];
}

export interface StorylineNextAction {
  actionType: StorylineNextActionType;
  title: string;
  explanation: string;
  targetId?: string;
  targetType?: 'event' | 'concept' | 'storyline' | 'quiz';
  priority: number;
}

export interface StorylineCatchupBriefing {
  id: string;
  storylineId: string;
  storylineTitle: string;
  briefingSummary: string;
  lastKnownEvent: {
    id: string;
    title: string;
    eventTime: string;
    summary: string;
  } | null;
  newDevelopmentsCount: number;
  newDevelopments: {
    id: string;
    title: string;
    eventTime: string;
    summary: string;
    isTurningPoint: boolean;
    turningPointType?: string;
  }[];
  majorTurningPoints: {
    id: string;
    eventId: string;
    eventTitle: string;
    turningPointType: string;
    reason: string;
    occurredAt: string;
  }[];
  currentState: StorylineStatus;
  trajectory: StorylineTrajectoryDirection;
  evidenceState: {
    completenessScore: number;
    confidenceState: ConfidenceState;
    uniquePublishersCount: number;
    primarySourcesCount: number;
    conflictSummary?: string;
    hasConflicts: boolean;
  };
  newConcepts: StorylineCatchupConcept[];
  conceptsToReview: StorylineCatchupConcept[];
  allConcepts: StorylineCatchupConcept[];
  consolidatedDelta: StorylineCatchupDelta;
  catchupStatus: StorylineCatchupStatus[];
  nextAction: StorylineNextAction;
  isPersonalized: boolean;
  userId?: string;
  unreadEventCount: number;
  totalEventCount: number;
  reviewedEventCount: number;
  generatedAt: string;
  expiresAt?: string;
}

export interface UserStorylineProgress {
  id: string;
  userId: string;
  storylineId: string;
  lastSeenEventId?: string | null;
  reviewedEventIds: string[];
  isFullyCaughtUp: boolean;
  lastReviewedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorylineJourneyResponse {
  storyline: Storyline;
  trajectory: StorylineTrajectoryDetails;
  events: StorylineCatchupEvent[];
  turningPoints: StorylineTurningPoint[];
  overallEvidence: StorylineEvidenceOverview;
  userProgress: {
    userId?: string;
    lastSeenEventId: string | null;
    reviewedEventCount: number;
    totalEventCount: number;
    progressPercentage: number;
    isFullyCaughtUp: boolean;
  };
  briefing: StorylineCatchupBriefing;
}






