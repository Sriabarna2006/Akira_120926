export type ImportanceLevel = 'MUST_KNOW' | 'IMPORTANT' | 'INTERESTING';

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

export interface Source {
  id: string;
  name: string;
  siteUrl: string;
  reliabilityTier: number;
}

export interface StructuredBreakdown {
  whatHappened: string;
  whyDidItHappen: string;
  whyItMatters: string;
  whoIsAffected: string[];
  whatCouldHappenNext: string[];
  background: string;
  relatedConcepts: string[];
}

export interface MultiLevelExplanation {
  verySimple: string;
  beginner: string;
  student: string;
  technical: string;
  deepDive: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  fullContent?: string;
  category: Category;
  source: Source;
  originalUrl: string;
  publishedAt: string;
  importanceLevel: ImportanceLevel;
  importanceScore: number;
  whyItMatters: string;
  realWorldImpact: string;
  estimatedReadTime: string;
  structuredBreakdown?: StructuredBreakdown;
  multiLevelExplanation?: MultiLevelExplanation;
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
  id: string;
  articleId?: string;
  conceptId?: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'scenario';
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizAttemptResult {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface CategoryProgress {
  category: Category;
  percentage: number;
  articlesReadCount: number;
  conceptsMasteredCount: number;
  quizzesTakenCount: number;
  averageQuizScore: number;
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
