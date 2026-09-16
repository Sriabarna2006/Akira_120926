import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID must not be empty').max(100, 'ID is too long'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});

export const regionQuerySchema = z.object({
  includeInactive: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export const categoryQuerySchema = z.object({
  includeInactive: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export const sourceQuerySchema = z.object({
  region: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  tier: z.coerce.number().int().min(1).max(3).optional(),
  includeInactive: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export const articleQuerySchema = z.object({
  region: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  event_id: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});

export const eventQuerySchema = z.object({
  region: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  urgency: z.enum(['BREAKING', 'TRENDING', 'IMPORTANT', 'ALL']).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});

export const topEventsQuerySchema = z.object({
  region: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(['BREAKING', 'TRENDING', 'IMPORTANT', 'ALL']).optional(),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(50, 'Limit cannot exceed 50').default(10),
});

export const explanationQuerySchema = z.object({
  level: z.enum(['verySimple', 'beginner', 'student', 'technical', 'deepDive']).optional().default('beginner'),
  forceRefresh: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export const aiRefreshQuerySchema = z.object({
  forceRefresh: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export const quizSubmissionBodySchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1, 'Question ID is required'),
      selectedOptionIndex: z.number().int().min(0).max(3, 'Option index must be between 0 and 3'),
    })
  ).min(1, 'Must provide at least one answer').max(10, 'Cannot exceed 10 answers'),
});

