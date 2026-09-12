export type RegionType = 'Tamil Nadu' | 'India' | 'World';
export type ImportanceLabelType = 'BREAKING' | 'TRENDING' | 'IMPORTANT';
export type ImportanceLevel = 'MUST_KNOW' | 'IMPORTANT' | 'INTERESTING' | ImportanceLabelType;

export type CategorySlug = 
  | 'india' 
  | 'world' 
  | 'ai-technology' 
  | 'economy-money' 
  | 'government-society' 
  | 'science-environment' 
  | 'cybersecurity' 
  | 'career-industry';

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description: string;
  icon: string;
  color: string;
}

export interface CorroboratingSource {
  name: string;
  url: string;
  publishedAt: string;
  tier: number;
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
  region: RegionType;
  category: string;
  importanceLabel: ImportanceLabelType;
  importanceLevel?: string;
  importanceScore: number;
  trendScore: number;
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

export interface Concept {
  id: string;
  title: string;
  slug: string;
  category: Category;
  shortDefinition: string;
  fullExplanation: string;
  prerequisites: {
    id: string;
    title: string;
    description: string;
    order: number;
  }[];
  multiLevelExplanations: MultiLevelExplanation;
  userMasteryScore?: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CategoryProgress {
  category: string;
  percentage: number;
  articlesReadCount: number;
  conceptsMasteredCount: number;
  quizzesTakenCount: number;
  averageQuizScore: number;
  color: string;
}

export interface UserKnowledgeProfile {
  totalArticlesRead: number;
  totalConceptsLearned: number;
  totalQuizzesTaken: number;
  overallMasteryPercentage: number;
  categoryProgress: CategoryProgress[];
  strongAreas: string[];
  weakAreas: string[];
  recentConcepts: Concept[];
  recommendedTopics: string[];
}
