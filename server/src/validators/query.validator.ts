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
