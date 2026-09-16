import { AIProvider, EventPromptContext, AIProviderConfig } from '../aiProvider.js';
import { 
  FiveWOneH, 
  MultiLevelExplanation, 
  ExtractedConcept, 
  QuizQuestion 
} from '../../../types/index.js';
import { build5W1HPrompt } from '../prompts/fiveWOneH.prompt.js';
import { buildExplanationPrompt } from '../prompts/explanation.prompt.js';
import { buildConceptPrompt } from '../prompts/concept.prompt.js';
import { buildQuizPrompt } from '../prompts/quiz.prompt.js';
import { 
  fiveWOneHSchema, 
  multiLevelExplanationSchema, 
  conceptsArraySchema, 
  quizArraySchema 
} from '../validators/aiOutput.validator.js';
import { DeterministicProvider } from './deterministicProvider.js';

export class GeminiProvider implements AIProvider {
  public readonly name: string;
  public readonly modelName: string;
  private readonly config: AIProviderConfig;
  private readonly fallback: DeterministicProvider;

  constructor(config?: Partial<AIProviderConfig>) {
    this.name = config?.provider || process.env.AI_PROVIDER || 'gemini';
    this.modelName = config?.model || process.env.AI_MODEL || 'gemini-1.5-flash';
    this.config = {
      provider: this.name,
      model: this.modelName,
      apiKey: config?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY,
      timeoutMs: config?.timeoutMs || parseInt(process.env.AI_TIMEOUT_MS || '5000', 10),
      maxRetries: config?.maxRetries || parseInt(process.env.AI_MAX_RETRIES || '2', 10),
    };
    this.fallback = new DeterministicProvider();
  }

  private async callRemoteLLM(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('AI_API_KEY is not configured');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`LLM provider HTTP error: ${response.status} ${response.statusText}`);
        }

        const data: any = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Empty response from LLM provider');
        }
        return text;
      } catch (err: any) {
        lastError = err;
        // Exponential backoff
        await new Promise((r) => setTimeout(r, attempt * 300));
      }
    }

    throw lastError || new Error('Failed to complete LLM request after retries');
  }

  public async generate5W1H(context: EventPromptContext): Promise<FiveWOneH> {
    try {
      const prompt = build5W1HPrompt(context);
      const rawText = await this.callRemoteLLM(prompt);
      const parsed = JSON.parse(rawText);
      return fiveWOneHSchema.parse(parsed);
    } catch (err: any) {
      console.warn('[GeminiProvider] Remote 5W1H notice, using deterministic grounding:', err.message);
      return this.fallback.generate5W1H(context);
    }
  }

  public async generateExplanationLevels(context: EventPromptContext): Promise<MultiLevelExplanation> {
    try {
      const prompt = buildExplanationPrompt(context);
      const rawText = await this.callRemoteLLM(prompt);
      const parsed = JSON.parse(rawText);
      return multiLevelExplanationSchema.parse(parsed);
    } catch (err: any) {
      console.warn('[GeminiProvider] Remote Explanation notice, using deterministic grounding:', err.message);
      return this.fallback.generateExplanationLevels(context);
    }
  }

  public async extractConcepts(context: EventPromptContext): Promise<ExtractedConcept[]> {
    try {
      const prompt = buildConceptPrompt(context);
      const rawText = await this.callRemoteLLM(prompt);
      const parsed = JSON.parse(rawText);
      return conceptsArraySchema.parse(parsed);
    } catch (err: any) {
      console.warn('[GeminiProvider] Remote Concept notice, using deterministic grounding:', err.message);
      return this.fallback.extractConcepts(context);
    }
  }

  public async generateQuiz(context: EventPromptContext): Promise<QuizQuestion[]> {
    try {
      const prompt = buildQuizPrompt(context);
      const rawText = await this.callRemoteLLM(prompt);
      const parsed = JSON.parse(rawText);
      return quizArraySchema.parse(parsed);
    } catch (err: any) {
      console.warn('[GeminiProvider] Remote Quiz notice, using deterministic grounding:', err.message);
      return this.fallback.generateQuiz(context);
    }
  }
}
