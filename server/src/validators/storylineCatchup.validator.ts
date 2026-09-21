import { z } from 'zod';

export const storylineIdParamSchema = z.object({
  id: z.string().min(1, 'Storyline ID is required'),
});

export const storylineCatchupQuerySchema = z.object({
  forceRefresh: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === 'true'),
});

export const storylineProgressBodySchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
});
