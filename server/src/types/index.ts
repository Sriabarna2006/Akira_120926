export type RegionTier = 1 | 2 | 3;
export type SourceTier = 1 | 2 | 3;
export type UrgencyLabel = 'BREAKING' | 'TRENDING' | 'IMPORTANT';
export type TrendStatus = 'NORMAL' | 'RISING' | 'TRENDING' | 'HIGHLY_TRENDING';
export type ImportanceStatus = 'LOW' | 'MODERATE' | 'IMPORTANT' | 'CRITICAL';
export type FreshnessState = 'FRESH' | 'RECENT' | 'AGING' | 'STALE' | 'SOURCE_UNAVAILABLE' | 'UNKNOWN';
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

export type SourceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'PAUSED' | 'STALE' | 'FAILING' | 'DISABLED' | 'QUARANTINED';

export type SourceType = 'WIRE' | 'NATIONAL' | 'REGIONAL' | 'SPECIALIST' | 'GOVERNMENT' | 'OFFICIAL' | 'TECHNICAL' | 'AGGREGATOR' | 'OTHER';

export interface Source {
  id: string;
  name: string;
  url: string;
  feedUrl?: string;
  regionId?: string;
  categoryId?: string;
  country?: string;
  language?: string;
  tier: number;
  credibilityScore: number;
  conglomerateId?: string;
  isActive: boolean;
  sourceType?: SourceType;
  authorityLevel?: 'OFFICIAL' | 'PEER_REVIEWED' | 'TIER1_WIRE' | 'NATIONAL_PAPER' | 'REGIONAL_PRESS' | 'SPECIALIST';
  consecutiveFailures?: number;
  specialization?: string;
  healthStatus?: SourceHealthStatus;
  expectedFreshnessHours?: number;
  lastSuccessfulFetch?: string;
  lastFailedFetch?: string;
  lastErrorMessage?: string;
  lastErrorType?: SourceErrorType;
  quarantineStatus?: 'ACTIVE' | 'QUARANTINED' | 'DISABLED';
  lastHttpStatus?: number;
  articlesIngestedCount?: number;
  eventsProducedCount?: number;
  responseTimeMs?: number;
  failureCount: number;
  updateFrequencyMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface SourceRegistryHealthSummary {
  totalSources: number;
  activeSources: number;
  healthySources: number;
  degradedSources: number;
  staleSources: number;
  failingSources: number;
  disabledSources: number;
  staleSourceList: {
    id: string;
    name: string;
    lastSuccessfulFetch?: string;
    staleDurationHours: number;
    healthStatus: SourceHealthStatus;
  }[];
  generatedAt: string;
}

export interface IngestionHealthStats {
  lastSyncTime: string | null;
  lastSyncDurationMs: number;
  isSyncing: boolean;
  totalArticlesDiscovered: number;
  totalArticlesAccepted: number;
  totalDuplicatesSuppressed: number;
  totalEventsCreated: number;
  totalEventsUpdated: number;
  sourcesHealth: SourceRegistryHealthSummary;
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

// ==============================================================================
// PHASE 13: INTERACTIVE STORYLINE SCENARIO SIMULATION & HYPOTHESIS EXPLORATION
// ==============================================================================

export type ScenarioType =
  | 'REMOVE_EVENT'
  | 'DELAY_EVENT'
  | 'CHANGE_CONDITION'
  | 'REVERSE_RELATION'
  | 'CONTINUE_CONDITION';

export type EpistemicClassification =
  | 'VERIFIED_FACT'
  | 'DOCUMENTED_RELATION'
  | 'HYPOTHETICAL_ASSUMPTION'
  | 'DERIVED_CONSEQUENCE'
  | 'UNKNOWN';

export type ScenarioImpactDirection =
  | 'DISRUPTED'
  | 'DELAYED'
  | 'AMPLIFIED'
  | 'MITIGATED'
  | 'UNCERTAIN';

export type ScenarioConceptImpactType =
  | 'DIRECT'
  | 'PROPAGATED'
  | 'PREREQUISITE'
  | 'REINFORCED';

export interface StorylineScenario {
  id: string;
  storylineId: string;
  userId: string;
  title: string;
  question: string;
  scenarioType: ScenarioType;
  assumptionText: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioAssumption {
  id: string;
  scenarioId: string;
  targetEventId?: string | null;
  assumptionType: ScenarioType;
  originalState: {
    title?: string;
    summary?: string;
    eventTime?: string;
    status?: string;
  };
  hypotheticalState: {
    title?: string;
    conditionShift?: string;
    timeShiftHours?: number;
    hypotheticalStatus?: string;
  };
  rationale: string;
  createdAt: string;
}

export interface ScenarioImpact {
  id: string;
  scenarioId: string;
  sourceEntityId: string;
  affectedEntityId: string;
  entityType: 'EVENT' | 'CONCEPT' | 'TURNING_POINT';
  relationshipType: string;
  impactDirection: ScenarioImpactDirection;
  impactStrength: number;
  explanation: string;
  evidenceState?: {
    completenessScore: number;
    confidenceState: ConfidenceState;
    hasConflicts: boolean;
  };
  createdAt: string;
}

export interface ScenarioAffectedEvent {
  eventId: string;
  title: string;
  eventTime: string;
  isTurningPoint: boolean;
  relationshipToTarget: string;
  impactDirection: ScenarioImpactDirection;
  classification: EpistemicClassification;
  explanation: string;
  evidenceCompletenessScore: number;
}

export interface ScenarioAffectedConcept {
  conceptId: string;
  title: string;
  slug: string;
  category: string;
  shortDefinition: string;
  masteryStatus: UserMasteryClassification;
  masteryScore: number;
  impactType: ScenarioConceptImpactType;
  explanation: string;
  reason: string;
}

export interface ScenarioDerivedConsequence {
  statement: string;
  classification: 'DERIVED_CONSEQUENCE';
  supportingRelations: string[];
  impactDirection: ScenarioImpactDirection;
  groundingExplanation: string;
}

export interface ScenarioUnknownArea {
  topic: string;
  reason: string;
  explanation: string;
  classification: 'UNKNOWN';
}

export interface ScenarioQuizItem {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  conceptId?: string;
  relatedEventId?: string;
}

export interface ScenarioResult {
  scenario: StorylineScenario;
  assumption: ScenarioAssumption;
  baselineFacts: {
    statement: string;
    eventId?: string;
    conceptId?: string;
    classification: 'VERIFIED_FACT' | 'DOCUMENTED_RELATION';
    evidenceScore: number;
  }[];
  hypotheticalChange: {
    description: string;
    targetEventTitle?: string;
    assumptionType: ScenarioType;
    classification: 'HYPOTHETICAL_ASSUMPTION';
  };
  affectedEvents: ScenarioAffectedEvent[];
  affectedConcepts: ScenarioAffectedConcept[];
  derivedConsequences: ScenarioDerivedConsequence[];
  unknowns: ScenarioUnknownArea[];
  evidenceSummary: {
    completenessScore: number;
    confidenceState: ConfidenceState;
    publisherCount: number;
    hasConflicts: boolean;
    conflictNote?: string;
  };
  groundedSummary: string;
  quiz?: ScenarioQuizItem[];
  generatedAt: string;
  isCached: boolean;
}

export interface ScenarioLearningSummary {
  scenarioId: string;
  storylineId: string;
  affectedConcepts: ScenarioAffectedConcept[];
  recommendedActions: {
    actionType: 'REVIEW_CONCEPT' | 'LEARN_CONCEPT' | 'TAKE_SCENARIO_QUIZ' | 'EXPLORE_STORYLINE';
    conceptId?: string;
    title: string;
    explanation: string;
  }[];
  quiz: ScenarioQuizItem[];
}

// =========================================================================
// PHASE 14: REAL-TIME INTELLIGENCE & MOBILE NOTIFICATION SYSTEM TYPES
// =========================================================================

export type NotificationType =
  | 'BREAKING_NEWS'
  | 'MAJOR_UPDATE'
  | 'STORYLINE_UPDATE'
  | 'STUDY_REMINDER'
  | 'REVIEW_DUE'
  | 'KNOWLEDGE_GAP'
  | 'DAILY_GOAL'
  | 'DAILY_BRIEFING';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
  deviceLabel?: string;
  platform?: 'android' | 'ios' | 'desktop' | 'mobile' | 'browser' | string;
  userAgent?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceLabel: string;
  platform: string;
  userAgent?: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt?: string | null;
}

export interface NotificationPreference {
  id?: string;
  userId: string;
  enabled: boolean;
  breakingEnabled: boolean;
  majorUpdateEnabled: boolean;
  storylineEnabled: boolean;
  studyEnabled: boolean;
  reviewEnabled: boolean;
  dailyBriefingEnabled: boolean;
  knowledgeGapEnabled: boolean;
  dailyGoalEnabled: boolean;
  studyDays?: number[]; // Array of days of week (0=Sunday, 1=Monday, ... 6=Saturday)
  studyTime: string; // HH:MM format e.g. "19:00"
  dailyBriefingTime: string; // HH:MM format e.g. "08:00"
  quietHoursStart: string; // HH:MM format e.g. "22:30"
  quietHoursEnd: string; // HH:MM format e.g. "07:00"
  timezone: string; // IANA timezone e.g. "Asia/Kolkata" or "UTC"
  minimumImportance: number;
  minimumEvidence: number;
  maximumDailyNotifications: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  url: string;
  eventId?: string | null;
  storylineId?: string | null;
  conceptId?: string | null;
  dedupeKey: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string | null;
  openedAt?: string | null;
  expiresAt?: string | null;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  subscriptionId: string;
  status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'REVOKED';
  providerResponse?: string | null;
  attemptedAt: string;
  deliveredAt?: string | null;
  failedAt?: string | null;
}

export interface NotificationCandidate {
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  url: string;
  eventId?: string;
  storylineId?: string;
  conceptId?: string;
  dedupeKey: string;
  priority: NotificationPriority;
  importanceScore?: number;
  evidenceScore?: number;
  hasConflicts?: boolean;
  isBypassQuietHours?: boolean;
}

export interface NotificationDecisionResult {
  shouldNotify: boolean;
  candidate?: NotificationCandidate;
  rejectionReason?:
    | 'USER_DISABLED'
    | 'TYPE_DISABLED'
    | 'QUIET_HOURS'
    | 'LOW_IMPORTANCE'
    | 'INSUFFICIENT_EVIDENCE'
    | 'EVIDENCE_CONFLICT'
    | 'DAILY_CAP_EXCEEDED'
    | 'DUPLICATE_DEDUPE_KEY'
    | 'COOLDOWN_ACTIVE'
    | 'NO_SCHEDULED_ACTION'
    | 'NO_REVIEWS_DUE'
    | 'NO_ACTIVE_SUBSCRIPTION'
    | 'STUDY_DAY_MISMATCH';
  details?: Record<string, any>;
}

// ============================================================================
// PHASE 16 & 17: PRODUCTION NEWS RELIABILITY, SOURCE HEALTH & SEMANTIC INGESTION
// ============================================================================

export type EpistemicGroundingLabel =
  | 'CONFIRMED'
  | 'AI_EXPLANATION'
  | 'ANALYSIS'
  | 'POSSIBLE_FUTURE_DEVELOPMENT';

export type SourceErrorType =
  | 'TIMEOUT'
  | 'DNS_ERROR'
  | 'HTTP_403'
  | 'HTTP_404'
  | 'HTTP_429'
  | 'HTTP_500'
  | 'HTTP_5XX'
  | 'UNAUTHORIZED'
  | 'XML_MALFORMED'
  | 'MALFORMED_XML'
  | 'SCHEMA_VIOLATION'
  | 'EMPTY_FEED'
  | 'SSRF_BLOCKED'
  | 'TLS_ERROR'
  | 'INVALID_RSS'
  | 'INVALID_ATOM'
  | 'UNKNOWN'
  | 'NONE';

export const DatabaseConnectionState = {
  CONNECTED: 'CONNECTED',
  DEGRADED: 'DEGRADED',
  CIRCUIT_OPEN: 'CIRCUIT_OPEN',
  DISCONNECTED: 'DISCONNECTED',
  FALLBACK_MEMORY: 'FALLBACK_MEMORY',
} as const;
export type DatabaseConnectionState = (typeof DatabaseConnectionState)[keyof typeof DatabaseConnectionState];

export const CircuitBreakerState = {
  CLOSED: 'CLOSED',
  FAILURES: 'FAILURES',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
} as const;
export type CircuitBreakerState = (typeof CircuitBreakerState)[keyof typeof CircuitBreakerState];

export const DatabaseErrorClassification = {
  NETWORK_FAILURE: 'NETWORK_FAILURE',
  SCHEMA_FAILURE: 'SCHEMA_FAILURE',
  CONSTRAINT_FAILURE: 'CONSTRAINT_FAILURE',
  VALIDATION_FAILURE: 'VALIDATION_FAILURE',
  QUERY_FAILURE: 'QUERY_FAILURE',
} as const;
export type DatabaseErrorClassification = (typeof DatabaseErrorClassification)[keyof typeof DatabaseErrorClassification];

export interface FeedQuarantineRecord {
  sourceId: string;
  sourceName?: string;
  quarantinedAt: string;
  quarantineReason: string;
  retryIntervalMinutes: number;
  nextRetryAt: string;
  consecutiveQuarantineCount: number;
  updatedAt?: string;
}

export interface CategoryCoverageReport {
  totalCategories: number;
  coveredCategories: number;
  sparseCategories: string[];
  uncoveredCategories: string[];
  coveragePercentage: number;
  perCategoryCounts: Record<string, number>;
  healthyDomains?: string[];
  staleDomains?: string[];
  weakRegions?: string[];
  sourceFailuresAffectingCoverage?: {
    sourceId: string;
    sourceName: string;
    categoryId: string;
    errorType: string;
  }[];
  domainFreshnessHours?: Record<string, number>;
  uniqueEventsCount?: number;
  multiSourceEventsCount?: number;
  underrepresentedCategories?: string[];
  generatedAt: string;
}

export interface SystemHealthStatus {
  overallStatus: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  database: {
    state: string;
    circuitBreakerState: string;
    totalPoolConnections: number;
    activePoolConnections: number;
    lastErrorClassification: string;
  };
  sources: {
    total: number;
    healthy: number;
    degraded: number;
    failing: number;
    quarantined: number;
    disabled: number;
  };
  ingestion: {
    isSyncing: boolean;
    lastSyncTime: string | null;
    lastDurationMs: number;
    activeEventsCount: number;
  };
  coverage: CategoryCoverageReport;
  timestamp: string;
  version: string;
}

export interface EmbeddingVector {
  eventId?: string;
  provider: string;
  modelName?: string;
  model?: string;
  dimensions: number;
  vector: number[];
  createdAt?: string;
}


