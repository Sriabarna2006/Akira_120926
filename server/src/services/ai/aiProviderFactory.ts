import { AIProvider, AIProviderConfig } from './aiProvider.js';
import { GeminiProvider } from './providers/geminiProvider.js';
import { DeterministicProvider } from './providers/deterministicProvider.js';

export class AIProviderFactory {
  private static instance: AIProvider | null = null;

  public static getProvider(config?: Partial<AIProviderConfig>): AIProvider {
    const providerName = (config?.provider || process.env.AI_PROVIDER || 'gemini').toLowerCase();

    if (providerName === 'deterministic' || providerName === 'fallback') {
      return new DeterministicProvider();
    }

    if (providerName === 'gemini') {
      return new GeminiProvider(config);
    }

    // Default to GeminiProvider which has built-in graceful fallback to DeterministicProvider
    return new GeminiProvider(config);
  }

  public static getDefault(): AIProvider {
    if (!this.instance) {
      this.instance = this.getProvider();
    }
    return this.instance;
  }

  public static resetDefault(): void {
    this.instance = null;
  }
}
