export type RegionTier = 1 | 2 | 3;
export type SourceTier = 1 | 2 | 3;
export type UrgencyLabel = 'BREAKING' | 'TRENDING' | 'IMPORTANT';
export type LifecycleStatus = 
  | 'INITIAL_REPORT' 
  | 'NEW_DEVELOPMENT' 
  | 'OFFICIAL_CONFIRMATION' 
  | 'FOLLOW_UP' 
  | 'RESOLVED';

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
  finalRankScore: number;
  whyItMatters?: string;
  firstPublishedAt: string;
  lastUpdatedAt: string;
  sourceCount: number;
  lifecycleStatus: LifecycleStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  sources?: EventSource[];
  articles?: Article[];
  relatedConcepts?: string[];
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
