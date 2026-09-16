import { z } from 'zod';

export const fiveWOneHSchema = z.object({
  whatHappened: z.string().min(10, 'whatHappened must be at least 10 characters'),
  whyDidItHappen: z.string().min(10, 'whyDidItHappen must be at least 10 characters'),
  whyDoesItMatter: z.string().min(10, 'whyDoesItMatter must be at least 10 characters'),
  whoIsAffected: z.array(z.string().min(3)).min(1, 'whoIsAffected must contain at least 1 item'),
  whatCouldHappenNext: z.array(z.string().min(3)).min(1, 'whatCouldHappenNext must contain at least 1 item'),
  background: z.string().min(10, 'background must be at least 10 characters'),
});

export const multiLevelExplanationSchema = z.object({
  verySimple: z.string().min(10, 'verySimple must be at least 10 characters'),
  beginner: z.string().min(10, 'beginner must be at least 10 characters'),
  student: z.string().min(10, 'student must be at least 10 characters'),
  technical: z.string().min(10, 'technical must be at least 10 characters'),
  deepDive: z.string().min(10, 'deepDive must be at least 10 characters'),
});

export const singleConceptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  slug: z.string().min(2),
  shortDefinition: z.string().min(10),
  whyItMatters: z.string().optional(),
  category: z.string().optional(),
  prerequisites: z.array(z.string()).optional().default([]),
});

export const conceptsArraySchema = z.array(singleConceptSchema).min(1, 'Must extract at least 1 concept');

export const quizQuestionSchema = z.object({
  id: z.number().int(),
  question: z.string().min(10, 'Question must be at least 10 characters'),
  options: z.array(z.string().min(1)).min(2).max(4),
  correctAnswer: z.number().int().min(0).max(3),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export const quizArraySchema = z.array(quizQuestionSchema).length(3, 'Quiz must contain exactly 3 active recall questions');

export const quizSubmissionSchema = z.object({
  answers: z.record(z.coerce.string(), z.coerce.number().int().min(0).max(3)),
});

export const explanationLevelQuerySchema = z.object({
  level: z.enum(['verySimple', 'beginner', 'student', 'technical', 'deepDive', '1', '2', '3', '4', '5']).optional().default('beginner'),
});
