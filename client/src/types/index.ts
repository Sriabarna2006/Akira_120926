export type RegionType = 'Tamil Nadu' | 'India' | 'World' | 'ALL';
export type ImportanceLabelType = 'BREAKING' | 'TRENDING' | 'IMPORTANT';
export type ImportanceLevel = 'MUST_KNOW' | 'IMPORTANT' | 'INTERESTING' | ImportanceLabelType;
export type ExplanationLevel = 'verySimple' | 'beginner' | 'student' | 'technical' | 'deepDive';

export type CategorySlug = string;

export interface RegionItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tier: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface SourceItem {
  id: string;
  name: string;
  url: string;
  feedUrl?: string;
  regionId?: string;
  categoryId?: string;
  tier: number;
  credibilityScore: number;
  isActive: boolean;
}

export interface ArticleItem {
  id: string;
  sourceId?: string;
  sourceName?: string;
  eventId?: string;
  title: string;
  url: string;
  contentSnippet?: string;
  publishedAt: string;
  regionId?: string;
  categoryId?: string;
}

export interface CorroboratingSource {
  id?: string;
  name: string;
  sourceName?: string;
  url: string;
  title?: string;
  snippet?: string;
  publishedAt: string;
  tier: number;
  credibility?: string;
}

export interface FiveWOneH {
  whatHappened: string;
  whyDidItHappen: string;
  whyDoesItMatter: string;
  whoIsAffected: string[];
  whatCouldHappenNext: string[];
  background: string;
}

export interface StructuredBreakdown extends FiveWOneH {
  relatedConcepts?: string[];
}

export interface MultiLevelExplanation {
  verySimple: string;
  beginner: string;
  student: string;
  technical: string;
  deepDive: string;
}

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
  trendStatus: 'NORMAL' | 'RISING' | 'TRENDING' | 'HIGHLY_TRENDING';
  importanceStatus: 'LOW' | 'MODERATE' | 'IMPORTANT' | 'CRITICAL';
  breakingStatus: boolean;
  freshnessState: 'FRESH' | 'RECENT' | 'AGING' | 'STALE' | 'SOURCE_UNAVAILABLE';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface ExtractedConceptItem {
  id: string;
  title: string;
  slug: string;
  shortDefinition: string;
  whyItMatters?: string;
  category?: string;
  prerequisites?: string[];
}

export interface QuizQuestion {
  id: number | string;
  question: string;
  options: string[];
  correctAnswer?: number;
  correctIndex?: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizSubmission {
  answers: Record<string | number, number>;
}

export interface QuizResultItem {
  questionId: number;
  question: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResult {
  eventId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  masteryStatus: 'NEEDS_LEARNING' | 'DEVELOPING' | 'STRONG';
  results: QuizResultItem[];
  timestamp: string;
}

export interface CanonicalEvent {
  id: string;
  title: string;
  summary: string;
  region: 'Tamil Nadu' | 'India' | 'World' | string;
  regionId?: string;
  category: string;
  categoryId?: string;
  importanceLabel: ImportanceLabelType;
  urgencyLabel?: string;
  importanceLevel?: string;
  importanceScore: number;
  velocityScore?: number;
  trendScore?: number;
  finalRankScore: number;
  rankingMetadata?: RankingMetadata;
  whyItMatters: string;
  estimatedReadTime?: string;
  relatedConcepts?: string[];
  sources?: CorroboratingSource[];
  source?: string;
  originalUrl?: string;
  publishedAt?: string;
  firstPublishedAt: string;
  lastUpdatedAt: string;
  sourceCount: number;
  breakdown?: StructuredBreakdown;
  explanations?: MultiLevelExplanation;
  concepts?: ExtractedConceptItem[];
  quiz?: QuizQuestion[];
  isSaved?: boolean;
}

export type MasteryStatus = 'NEEDS_LEARNING' | 'DEVELOPING' | 'STRONG';

export interface Prerequisite {
  id: string;
  title: string;
  description: string;
  order?: number;
}

export interface Concept {
  id: string;
  title: string;
  slug: string;
  category: string;
  shortDefinition: string;
  fullExplanation?: string;
  prerequisites: Prerequisite[];
  keyTakeaways?: string[];
  multiLevelExplanations?: MultiLevelExplanation;
  masteryStatus?: MasteryStatus;
  attemptsCount?: number;
  correctCount?: number;
  lastAttemptAt?: string;
}

export interface ConceptChainStep {
  step: number;
  title: string;
  type: 'EVENT' | 'CONCEPT' | 'MECHANISM' | 'REGULATION' | 'IMPACT';
  description: string;
}

export interface UserConceptMastery {
  conceptId: string;
  conceptTitle: string;
  category: string;
  status: MasteryStatus;
  attemptsCount: number;
  correctCount: number;
  lastAttemptAt: string;
  confidenceScore: number;
}

export interface UserPreferences {
  defaultRegion: RegionType;
  preferredCategories: string[];
  theme: 'dark' | 'system';
  emailDigest: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  interests?: string[];
  readingStreakDays?: number;
  totalArticlesRead?: number;
  totalConceptsLearned?: number;
  savedEventsCount?: number;
  preferences?: UserPreferences;
  createdAt?: string;
}

export interface SavedItem {
  id: string;
  eventId: string;
  eventTitle: string;
  category: string;
  region: string;
  savedAt: string;
  importanceLabel: ImportanceLabelType;
}

// ============================================================================
// PHASE 7: LEARNING, SPACED REPETITION & PERSONALIZATION TYPES
// ============================================================================

export type ReviewStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';

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

export interface DueReviewsResponse {
  dueCount: number;
  totalScheduled: number;
  items: DueReviewItem[];
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
  explorationRatio?: number;
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
  targetConcept: ExtractedConceptItem;
  totalSteps: number;
  estimatedMinutes: number;
  steps: ConceptLearningPathStep[];
  userOverallReadiness: number;
  hasMissingPrerequisites: boolean;
}

export interface RelatedConceptItem {
  concept: ExtractedConceptItem;
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
  keyConcepts: (ExtractedConceptItem & { masteryStatus: UserMasteryClassification; masteryScore: number })[];
  prerequisiteTree: ConceptGraphNode[];
  edges: ConceptGraphEdge[];
  userReadinessPercentage: number;
  knowledgeGaps: (ExtractedConceptItem & { masteryStatus: UserMasteryClassification; masteryScore: number })[];
  learnTheseFirst: (ExtractedConceptItem & { masteryStatus: UserMasteryClassification; masteryScore: number; reason: string })[];
  relatedConcepts: RelatedConceptItem[];
  relatedEvents: RelatedEventItem[];
}

export interface ConceptKnowledgeStatus {
  concept: ExtractedConceptItem;
  masteryScore: number;
  masteryStatus: UserMasteryClassification;
  attemptCount: number;
  correctCount: number;
  lastAttemptAt?: string;
  prerequisites: (ExtractedConceptItem & { masteryStatus: UserMasteryClassification; masteryScore: number })[];
  knowledgeGaps: (ExtractedConceptItem & { masteryStatus: UserMasteryClassification; masteryScore: number })[];
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

export interface StorylineTimelineItem {
  id: string;
  eventId: string;
  title: string;
  summary: string;
  relationshipType: StorylineRelationshipType;
  sequenceOrder: number;
  eventTime: string;
  urgencyLabel: string;
  importanceScore: number;
  finalRankScore: number;
  sourceCount: number;
  lifecycleStatus: string;
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
    lifecycleStatus: string;
  };
  previousEvent?: {
    id: string;
    title: string;
    eventTime: string;
    lifecycleStatus: string;
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
  newConcepts: ExtractedConceptItem[];
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
  newConceptsSinceLastLearning: ExtractedConceptItem[];
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
  dominantConcepts: ExtractedConceptItem[];
  timelineConceptEvolution: {
    eventId: string;
    eventTitle: string;
    newConceptsIntroduced: ExtractedConceptItem[];
  }[];
  prerequisiteConcepts: ExtractedConceptItem[];
  relatedConcepts: ExtractedConceptItem[];
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
  concepts: ExtractedConceptItem[];
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
// PHASE 14: REAL-TIME INTELLIGENCE & MOBILE NOTIFICATION TYPES
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
  studyDays?: number[];
  studyTime: string;
  dailyBriefingTime: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  minimumImportance: number;
  minimumEvidence: number;
  maximumDailyNotifications: number;
  createdAt?: string;
  updatedAt?: string;
}

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export type FreshnessState = 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';

export type EpistemicGroundingLabel =
  | 'CONFIRMED'
  | 'AI_EXPLANATION'
  | 'ANALYSIS'
  | 'POSSIBLE_FUTURE_DEVELOPMENT';

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
