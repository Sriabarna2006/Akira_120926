import { z } from 'zod';

export const storylineQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  regionId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['EMERGING', 'DEVELOPING', 'ACTIVE', 'STABILIZING', 'CONCLUDED', 'UNKNOWN']).optional(),
  trajectory: z.enum(['ESCALATING', 'DEVELOPING', 'STABLE', 'DE-ESCALATING', 'CONCLUDED', 'UNKNOWN']).optional(),
  search: z.string().optional(),
});

export const storylineDeltaQuerySchema = z.object({
  fromEventId: z.string().optional(),
  toEventId: z.string().optional(),
});

export const storylineAssociationBodySchema = z.object({
  storylineId: z.string().min(1, 'Storyline ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
  relationshipType: z.enum([
    'ORIGIN',
    'DEVELOPMENT',
    'DECISION',
    'RESPONSE',
    'IMPLEMENTATION',
    'OUTCOME',
    'UPDATE',
    'OTHER',
  ]).optional().default('DEVELOPMENT'),
  explanation: z.string().optional(),
});
