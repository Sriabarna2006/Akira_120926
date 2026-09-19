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


