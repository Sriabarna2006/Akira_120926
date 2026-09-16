import { 
  CanonicalEvent, 
  Article, 
  FiveWOneH, 
  MultiLevelExplanation, 
  ExtractedConcept, 
  QuizQuestion 
} from '../../types/index.js';

export interface EventPromptContext {
  event: CanonicalEvent;
  articles?: Article[];
}

export interface AIProviderConfig {
  provider: string;
  model: string;
  apiKey?: string;
  timeoutMs: number;
  maxRetries: number;
}

export interface AIProvider {
  readonly name: string;
  readonly modelName: string;

  generate5W1H(context: EventPromptContext): Promise<FiveWOneH>;
  generateExplanationLevels(context: EventPromptContext): Promise<MultiLevelExplanation>;
  extractConcepts(context: EventPromptContext): Promise<ExtractedConcept[]>;
  generateQuiz(context: EventPromptContext): Promise<QuizQuestion[]>;
}
