import { 
  FiveWOneH, 
  MultiLevelExplanation, 
  ExplanationLevel, 
  ExtractedConcept, 
  QuizQuestion, 
  QuizResult,
} from '../../types/index.js';
import { aiUnderstandingRepository } from '../../repositories/aiUnderstanding.repository.js';
import { EventRepository } from '../../repositories/event.repository.js';
import { AIProviderFactory } from './aiProviderFactory.js';
import { AIProvider, EventPromptContext } from './aiProvider.js';
import { quizSubmissionSchema } from './validators/aiOutput.validator.js';

export class AIService {
  private activeLocks: Map<string, Promise<any>> = new Map();

  private async withEventLock<T>(eventId: string, key: string, fn: () => Promise<T>): Promise<T> {
    const lockKey = `${eventId}:${key}`;
    const existingPromise = this.activeLocks.get(lockKey);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.activeLocks.delete(lockKey);
      }
    })();

    this.activeLocks.set(lockKey, promise);
    return promise;
  }

  private async getEventContext(eventId: string): Promise<EventPromptContext> {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw new Error(`Canonical event not found: ${eventId}`);
    }
    return {
      event,
      articles: (event.sources as any) || (event.articles as any) || []
    };
  }

  private getProvider(): AIProvider {
    return AIProviderFactory.getDefault();
  }

  // ============================================================================
  // 1. 5W1H UNDERSTANDING ENGINE
  // ============================================================================

  public async get5W1H(eventId: string, forceRefresh: boolean = false): Promise<FiveWOneH> {
    if (!forceRefresh) {
      const cached = await aiUnderstandingRepository.getSummaryByEventId(eventId);
      if (cached && cached.fiveWOneH) {
        return cached.fiveWOneH;
      }
    }

    return this.withEventLock(eventId, '5w1h', async () => {
      if (!forceRefresh) {
        const cached = await aiUnderstandingRepository.getSummaryByEventId(eventId);
        if (cached && cached.fiveWOneH) {
          return cached.fiveWOneH;
        }
      }

      const context = await this.getEventContext(eventId);
      const provider = this.getProvider();
      const fiveWOneH = await provider.generate5W1H(context);

      await aiUnderstandingRepository.saveSummary({
        eventId,
        version: 1,
        provider: provider.name,
        model: provider.modelName,
        fiveWOneH,
        status: 'COMPLETED'
      });

      return fiveWOneH;
    });
  }

  // ============================================================================
  // 2. MULTI-LEVEL ADAPTIVE EXPLANATIONS
  // ============================================================================

  public async getAllExplanations(eventId: string, forceRefresh: boolean = false): Promise<MultiLevelExplanation> {
    const levels: ExplanationLevel[] = ['verySimple', 'beginner', 'student', 'technical', 'deepDive'];

    if (!forceRefresh) {
      const existing = await aiUnderstandingRepository.getExplanationsByEventId(eventId);
      if (existing.length === 5) {
        const map: any = {};
        for (const item of existing) {
          map[item.level] = item.content;
        }
        return map as MultiLevelExplanation;
      }
    }

    return this.withEventLock(eventId, 'explanations', async () => {
      if (!forceRefresh) {
        const existing = await aiUnderstandingRepository.getExplanationsByEventId(eventId);
        if (existing.length === 5) {
          const map: any = {};
          for (const item of existing) {
            map[item.level] = item.content;
          }
          return map as MultiLevelExplanation;
        }
      }

      const context = await this.getEventContext(eventId);
      const provider = this.getProvider();
      const generated = await provider.generateExplanationLevels(context);

      for (const lvl of levels) {
        if (generated[lvl]) {
          await aiUnderstandingRepository.saveExplanation({
            eventId,
            level: lvl,
            content: generated[lvl],
            provider: provider.name,
            model: provider.modelName,
            version: 1
          });
        }
      }

      return generated;
    });
  }

  public async getExplanation(eventId: string, level: ExplanationLevel = 'beginner', forceRefresh: boolean = false): Promise<{ level: ExplanationLevel; content: string }> {
    if (!forceRefresh) {
      const cached = await aiUnderstandingRepository.getExplanationByLevel(eventId, level);
      if (cached) {
        return { level: cached.level, content: cached.content };
      }
    }

    const all = await this.getAllExplanations(eventId, forceRefresh);
    return {
      level,
      content: all[level] || all.beginner || all.verySimple || 'Explanation currently generating...'
    };
  }

  // ============================================================================
  // 3. CONCEPT & PREREQUISITE EXTRACTION
  // ============================================================================

  public async getConcepts(eventId: string, forceRefresh: boolean = false): Promise<ExtractedConcept[]> {
    if (!forceRefresh) {
      const cached = await aiUnderstandingRepository.getConceptsByEventId(eventId);
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    return this.withEventLock(eventId, 'concepts', async () => {
      if (!forceRefresh) {
        const cached = await aiUnderstandingRepository.getConceptsByEventId(eventId);
        if (cached && cached.length > 0) {
          return cached;
        }
      }

      const context = await this.getEventContext(eventId);
      const provider = this.getProvider();
      const concepts = await provider.extractConcepts(context);

      await aiUnderstandingRepository.saveConcepts(eventId, concepts);
      return concepts;
    });
  }

  // ============================================================================
  // 4. ACTIVE RECALL QUIZ ENGINE
  // ============================================================================

  public async getQuiz(eventId: string, forceRefresh: boolean = false): Promise<QuizQuestion[]> {
    if (!forceRefresh) {
      const cached = await aiUnderstandingRepository.getQuizByEventId(eventId);
      if (cached && cached.questions && cached.questions.length === 3) {
        return cached.questions;
      }
    }

    return this.withEventLock(eventId, 'quiz', async () => {
      if (!forceRefresh) {
        const cached = await aiUnderstandingRepository.getQuizByEventId(eventId);
        if (cached && cached.questions && cached.questions.length === 3) {
          return cached.questions;
        }
      }

      const context = await this.getEventContext(eventId);
      const provider = this.getProvider();
      const questions = await provider.generateQuiz(context);

      await aiUnderstandingRepository.saveQuiz({
        eventId,
        version: 1,
        questions,
        provider: provider.name,
        model: provider.modelName
      });

      return questions;
    });
  }

  public async submitQuiz(eventId: string, rawSubmission: any): Promise<QuizResult> {
    const submission = quizSubmissionSchema.parse(rawSubmission);
    const questions = await this.getQuiz(eventId);

    let correctCount = 0;
    const results = questions.map((q) => {
      const selectedAnswer = submission.answers[q.id] ?? submission.answers[String(q.id)] ?? -1;
      const isCorrect = selectedAnswer === q.correctAnswer;
      if (isCorrect) correctCount += 1;

      return {
        questionId: q.id,
        question: q.question,
        selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      };
    });

    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const masteryStatus: 'NEEDS_LEARNING' | 'DEVELOPING' | 'STRONG' =
      scorePercentage >= 80 ? 'STRONG' : scorePercentage >= 50 ? 'DEVELOPING' : 'NEEDS_LEARNING';

    return {
      eventId,
      totalQuestions,
      correctCount,
      scorePercentage,
      masteryStatus,
      results,
      timestamp: new Date().toISOString()
    };
  }

  // ============================================================================
  // 5. REFRESH & INVALIDATION
  // ============================================================================

  public async refreshEventAI(eventId: string): Promise<void> {
    await aiUnderstandingRepository.deleteByEventId(eventId);
    await Promise.allSettled([
      this.get5W1H(eventId, true),
      this.getAllExplanations(eventId, true),
      this.getConcepts(eventId, true),
      this.getQuiz(eventId, true),
    ]);
  }
}

export const aiService = new AIService();
