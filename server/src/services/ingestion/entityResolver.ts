export interface ResolvedEntity {
  canonicalId: string;
  name: string;
  type: 'GOVERNMENT' | 'CENTRAL_BANK' | 'ORGANIZATION' | 'CORPORATION' | 'ACADEMIC' | 'PERSON' | 'LOCATION';
  matchedAlias: string;
}

const ENTITY_DICTIONARY: {
  canonicalId: string;
  name: string;
  type: ResolvedEntity['type'];
  aliases: string[];
}[] = [
  {
    canonicalId: 'rbi',
    name: 'Reserve Bank of India',
    type: 'CENTRAL_BANK',
    aliases: ['reserve bank of india', 'rbi', 'rbi governor', 'monetary policy committee', 'mpc'],
  },
  {
    canonicalId: 'us-fed',
    name: 'US Federal Reserve',
    type: 'CENTRAL_BANK',
    aliases: ['federal reserve', 'us fed', 'the fed', 'fomc', 'jerome powell'],
  },
  {
    canonicalId: 'ecb',
    name: 'European Central Bank',
    type: 'CENTRAL_BANK',
    aliases: ['european central bank', 'ecb', 'christine lagarde'],
  },
  {
    canonicalId: 'tn-govt',
    name: 'Government of Tamil Nadu',
    type: 'GOVERNMENT',
    aliases: ['tamil nadu government', 'tn govt', 'tamil nadu cabinet', 'mk stalin', 'chief minister stalin', 'fort st george'],
  },
  {
    canonicalId: 'gov-india',
    name: 'Government of India',
    type: 'GOVERNMENT',
    aliases: ['government of india', 'union cabinet', 'pmo', 'prime minister modi', 'narendra modi', 'centre', 'ministry of finance'],
  },
  {
    canonicalId: 'united-nations',
    name: 'United Nations',
    type: 'ORGANIZATION',
    aliases: ['united nations', 'un', 'un general assembly', 'unga', 'un security council', 'unsc', 'antonio guterres'],
  },
  {
    canonicalId: 'who',
    name: 'World Health Organization',
    type: 'ORGANIZATION',
    aliases: ['world health organization', 'who', 'tedros adhanom'],
  },
  {
    canonicalId: 'isro',
    name: 'Indian Space Research Organisation',
    type: 'ORGANIZATION',
    aliases: ['isro', 'indian space research organisation', 'chandrayaan', 'gaganyaan', 'somanath'],
  },
  {
    canonicalId: 'nasa',
    name: 'National Aeronautics and Space Administration',
    type: 'ORGANIZATION',
    aliases: ['nasa', 'national aeronautics and space administration', 'artemis', 'james webb'],
  },
  {
    canonicalId: 'tsmc',
    name: 'TSMC (Taiwan Semiconductor)',
    type: 'CORPORATION',
    aliases: ['tsmc', 'taiwan semiconductor', 'taiwan semiconductor manufacturing'],
  },
  {
    canonicalId: 'nvidia',
    name: 'NVIDIA',
    type: 'CORPORATION',
    aliases: ['nvidia', 'jensen huang', 'geforce', 'blackwell', 'h100', 'b200'],
  },
  {
    canonicalId: 'openai',
    name: 'OpenAI',
    type: 'CORPORATION',
    aliases: ['openai', 'sam altman', 'chatgpt', 'gpt 4', 'gpt 5', 'sora'],
  },
  {
    canonicalId: 'google-deepmind',
    name: 'Google & DeepMind',
    type: 'CORPORATION',
    aliases: ['google', 'deepmind', 'alphabet', 'sundar pichai', 'demis hassabis', 'gemini'],
  },
  {
    canonicalId: 'microsoft',
    name: 'Microsoft',
    type: 'CORPORATION',
    aliases: ['microsoft', 'satya nadella', 'azure', 'copilot'],
  },
  {
    canonicalId: 'apple',
    name: 'Apple',
    type: 'CORPORATION',
    aliases: ['apple', 'tim cook', 'iphone', 'macbook', 'apple intelligence'],
  },
  {
    canonicalId: 'sebi',
    name: 'Securities and Exchange Board of India',
    type: 'GOVERNMENT',
    aliases: ['sebi', 'securities and exchange board of india', 'madhabi puri buch'],
  },
  {
    canonicalId: 'supreme-court-india',
    name: 'Supreme Court of India',
    type: 'GOVERNMENT',
    aliases: ['supreme court of india', 'supreme court', 'cji', 'chief justice of india'],
  },
];

export class EntityResolver {
  private static instance: EntityResolver;

  private constructor() {}

  public static getInstance(): EntityResolver {
    if (!EntityResolver.instance) {
      EntityResolver.instance = new EntityResolver();
    }
    return EntityResolver.instance;
  }

  /**
   * Resolves and extracts canonical entities from raw text
   */
  public extractEntities(text: string): ResolvedEntity[] {
    if (!text || text.trim().length === 0) return [];

    const lower = text.toLowerCase();
    const matches = new Map<string, ResolvedEntity>();

    for (const entry of ENTITY_DICTIONARY) {
      for (const alias of entry.aliases) {
        // Regex word boundary matching
        const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower)) {
          matches.set(entry.canonicalId, {
            canonicalId: entry.canonicalId,
            name: entry.name,
            type: entry.type,
            matchedAlias: alias,
          });
          break; // Found matching alias for this entity
        }
      }
    }

    return Array.from(matches.values());
  }

  /**
   * Computes Jaccard Entity Overlap Similarity (0.0 to 1.0)
   */
  public computeEntityOverlap(entitiesA: ResolvedEntity[], entitiesB: ResolvedEntity[]): number {
    if (!entitiesA.length || !entitiesB.length) return 0;

    const setA = new Set(entitiesA.map((e) => e.canonicalId));
    const setB = new Set(entitiesB.map((e) => e.canonicalId));

    let intersectionCount = 0;
    for (const id of setA) {
      if (setB.has(id)) intersectionCount++;
    }

    const unionCount = setA.size + setB.size - intersectionCount;
    return unionCount === 0 ? 0 : Math.round((intersectionCount / unionCount) * 100) / 100;
  }

  /**
   * Checks if two entity sets have mutually exclusive conflict entities
   */
  public hasEntityConflict(entitiesA: ResolvedEntity[], entitiesB: ResolvedEntity[]): boolean {
    const setA = new Set(entitiesA.map((e) => e.canonicalId));
    const setB = new Set(entitiesB.map((e) => e.canonicalId));

    // If both have central banks, but distinct ones, flag conflict
    const centralBanksA = entitiesA.filter((e) => e.type === 'CENTRAL_BANK');
    const centralBanksB = entitiesB.filter((e) => e.type === 'CENTRAL_BANK');
    if (centralBanksA.length > 0 && centralBanksB.length > 0) {
      const hasCommon = centralBanksA.some((cb) => setB.has(cb.canonicalId));
      if (!hasCommon) return true;
    }

    return false;
  }
}

export const entityResolver = EntityResolver.getInstance();
