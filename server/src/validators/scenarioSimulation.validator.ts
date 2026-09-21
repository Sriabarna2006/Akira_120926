import { z } from 'zod';

export const storylineScenarioParamsSchema = z.object({
  id: z.string().min(1, 'Storyline ID is required'),
  scenarioId: z.string().min(1, 'Scenario ID is required'),
});

export const createScenarioBodySchema = z.object({
  targetEventId: z.string().min(1, 'Target event ID is required').optional(),
  scenarioType: z.enum(
    ['REMOVE_EVENT', 'DELAY_EVENT', 'CHANGE_CONDITION', 'REVERSE_RELATION', 'CONTINUE_CONDITION'],
    {
      errorMap: () => ({
        message: 'scenarioType must be REMOVE_EVENT, DELAY_EVENT, CHANGE_CONDITION, REVERSE_RELATION, or CONTINUE_CONDITION',
      }),
    }
  ),
  question: z
    .string()
    .min(5, 'Question must be at least 5 characters')
    .max(300, 'Question cannot exceed 300 characters'),
  assumptionText: z
    .string()
    .min(5, 'Assumption must be at least 5 characters')
    .max(1000, 'Assumption cannot exceed 1000 characters'),
  title: z.string().min(3).max(255).optional(),
});

export const scenarioQuerySchema = z.object({
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Number(val) : 20)),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Number(val) : 1)),
});
