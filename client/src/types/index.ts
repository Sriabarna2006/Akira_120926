export type RegionType = 'Tamil Nadu' | 'India' | 'World' | 'ALL';
export type ImportanceLabelType = 'BREAKING' | 'TRENDING' | 'IMPORTANT';
export type ImportanceLevel = 'MUST_KNOW' | 'IMPORTANT' | 'INTERESTING' | ImportanceLabelType;

export type CategorySlug = 
  | 'world'
  | 'india'
  | 'tamil-nadu'
  | 'ai-technology' 
  | 'economy-money' 
  | 'government-society' 
  | 'science-environment' 
  | 'cybersecurity' 
  | 'career-industry'
  | 'space'
  | 'health'
  | 'education';

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description: string;
  icon?: string;
  color?: string;
}

export interface CorroboratingSource {
  name: string;
  url: string;
  publishedAt: string;
  tier: number;
  credibility?: string;
}

export interface StructuredBreakdown {
  whatHappened: string;
  whyDidItHappen: string;
  whyDoesItMatter: string;
  whoIsAffected: string[];
  whatCouldHappenNext: string[];
  background: string;
  relatedConcepts?: string[];
}

export interface MultiLevelExplanation {
  verySimple: string;
  beginner: string;
  student: string;
  technical: string;
  deepDive: string;
}

export interface CanonicalEvent {
  id: string;
  title: string;
  summary: string;
  region: 'Tamil Nadu' | 'India' | 'World';
  category: string;
  importanceLabel: ImportanceLabelType;
  importanceLevel?: string;
  importanceScore: number;
  velocityScore?: number;
  trendScore?: number;
  finalRankScore: number;
  whyItMatters: string;
  estimatedReadTime: string;
  relatedConcepts: string[];
  sources: CorroboratingSource[];
  source?: string;
  originalUrl?: string;
  publishedAt?: string;
  firstPublishedAt: string;
  lastUpdatedAt: string;
  sourceCount: number;
  breakdown?: StructuredBreakdown;
  explanations?: MultiLevelExplanation;
  concepts?: { id: string; title: string; desc: string }[];
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

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
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
