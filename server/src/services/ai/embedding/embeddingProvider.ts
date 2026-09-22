import { EmbeddingVector } from '../../../types/index.js';

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<EmbeddingVector>;
  calculateSimilarity(vecA: EmbeddingVector, vecB: EmbeddingVector): number;
  getDimensions(): number;
  getProviderName(): string;
}

/**
 * 256-dimensional deterministic n-gram & term-frequency embedding provider.
 * Guarantees zero network latency, mathematical reproducibility, and exact cosine similarity metrics.
 */
export class DeterministicTFIDFEmbeddingProvider implements EmbeddingProvider {
  private readonly dimensions: number;
  private readonly providerName: string;

  constructor(dimensions = 256, providerName = 'deterministic-tfidf') {
    this.dimensions = dimensions;
    this.providerName = providerName;
  }

  public getDimensions(): number {
    return this.dimensions;
  }

  public getProviderName(): string {
    return this.providerName;
  }

  /**
   * Generates a 256-dimensional unit vector from normalized input text
   */
  public async generateEmbedding(text: string): Promise<EmbeddingVector> {
    const vector = new Array<number>(this.dimensions).fill(0);
    if (!text || text.trim().length === 0) {
      return {
        dimensions: this.dimensions,
        vector,
        provider: this.providerName,
        modelName: 'tfidf-256',
      };
    }

    // Clean & tokenize text (unigrams + bigrams)
    const tokens = this.tokenize(text);
    const ngrams = this.buildNgrams(tokens, 2);
    const allTerms = [...tokens, ...ngrams];

    // Compute Term Frequencies
    const termFreqs = new Map<string, number>();
    for (const term of allTerms) {
      termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
    }

    // Hash each term into vector bins with log-scaled weighting
    for (const [term, count] of termFreqs.entries()) {
      const hash1 = this.hashTerm(term, 0);
      const hash2 = this.hashTerm(term, 1);
      
      const index1 = Math.abs(hash1) % this.dimensions;
      const index2 = Math.abs(hash2) % this.dimensions;

      const sign1 = (hash1 & 1) === 0 ? 1 : -1;
      const sign2 = (hash2 & 1) === 0 ? 1 : -1;

      // Sublinear term-frequency weight
      const weight = 1 + Math.log(count);

      vector[index1] += sign1 * weight * 0.7;
      vector[index2] += sign2 * weight * 0.3;
    }

    // L2 Normalize vector to unit length
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = Math.round((vector[i] / magnitude) * 10000) / 10000;
      }
    }

    return {
      dimensions: this.dimensions,
      vector,
      provider: this.providerName,
      modelName: 'tfidf-256',
    };
  }

  /**
   * Calculates cosine similarity between two embedding vectors
   */
  public calculateSimilarity(vecA: EmbeddingVector, vecB: EmbeddingVector): number {
    if (!vecA || !vecB || !vecA.vector || !vecB.vector) return 0;
    if (vecA.vector.length === 0 || vecB.vector.length === 0) return 0;

    const len = Math.min(vecA.vector.length, vecB.vector.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      const a = vecA.vector[i];
      const b = vecB.vector[i];
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0;
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, similarity));
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t));
  }

  private buildNgrams(tokens: string[], n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join('_'));
    }
    return ngrams;
  }

  private hashTerm(term: string, seed: number): number {
    let hash = 0x811c9dc5 ^ seed;
    for (let i = 0; i < term.length; i++) {
      hash ^= term.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash;
  }
}

const STOPWORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'beneath',
  'under', 'above', 'has', 'have', 'had', 'been', 'were', 'was', 'this', 'that',
  'these', 'those', 'its', 'their', 'our', 'what', 'who', 'how', 'when', 'where',
]);

export class EmbeddingProviderFactory {
  private static instance: EmbeddingProvider;

  public static getProvider(): EmbeddingProvider {
    if (!EmbeddingProviderFactory.instance) {
      EmbeddingProviderFactory.instance = new DeterministicTFIDFEmbeddingProvider(256);
    }
    return EmbeddingProviderFactory.instance;
  }
}

export const embeddingProvider = EmbeddingProviderFactory.getProvider();
