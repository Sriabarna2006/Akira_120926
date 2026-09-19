import crypto from 'crypto';
import {
  ConceptRelation,
  ConceptRelationType,
  ExtractedConcept,
} from '../types/index.js';
import { query, queryOne, isDatabaseConnected } from '../db/dbClient.js';
import { aiUnderstandingRepository } from './aiUnderstanding.repository.js';

// In-Memory Fallback Stores for Concept Relations
const inMemoryRelations: ConceptRelation[] = [];
const inMemoryEventConceptJunction = new Map<string, Set<string>>(); // conceptId -> Set of eventIds

// Seed baseline domain concepts and relations for standard intelligence domains
const DEFAULT_CONCEPTS: ExtractedConcept[] = [
  {
    id: 'computer-security',
    title: 'Computer Security',
    slug: 'computer-security',
    category: 'Cybersecurity',
    shortDefinition: 'The protection of computer systems and information from unauthorized access or damage.',
    whyItMatters: 'Foundational root for all digital defense and infrastructure reliability.',
    prerequisites: [],
  },
  {
    id: 'software-security',
    title: 'Software Security',
    slug: 'software-security',
    category: 'Cybersecurity',
    shortDefinition: 'Engineering practices to ensure software continues functioning under malicious attacks.',
    whyItMatters: 'Prevents vulnerabilities from reaching production systems.',
    prerequisites: ['computer-security'],
  },
  {
    id: 'vulnerability',
    title: 'Vulnerability',
    slug: 'vulnerability',
    category: 'Cybersecurity',
    shortDefinition: 'A flaw in a system or software that can be exploited by an adversary.',
    whyItMatters: 'Exposes digital infrastructure to unauthorized exploitation.',
    prerequisites: ['software-security'],
  },
  {
    id: 'exploit',
    title: 'Exploit',
    slug: 'exploit',
    category: 'Cybersecurity',
    shortDefinition: 'A piece of software or sequence of commands that takes advantage of a vulnerability.',
    whyItMatters: 'Translates theoretical software bugs into concrete operational breaches.',
    prerequisites: ['vulnerability'],
  },
  {
    id: 'zero-day-exploit',
    title: 'Zero-Day Exploit',
    slug: 'zero-day-exploit',
    category: 'Cybersecurity',
    shortDefinition: 'An attack targeting a flaw before the developer has released a patch.',
    whyItMatters: 'Represents asymmetric cyber threats with zero pre-existing defense.',
    prerequisites: ['exploit', 'vulnerability'],
  },
  {
    id: 'exploit-mitigation',
    title: 'Exploit Mitigation',
    slug: 'exploit-mitigation',
    category: 'Cybersecurity',
    shortDefinition: 'Architectural defense mechanisms such as sandboxing, ASLR, and memory isolation.',
    whyItMatters: 'Limits the blast radius and success rate of attacks.',
    prerequisites: ['exploit', 'software-security'],
  },
  {
    id: 'inflation',
    title: 'Inflation',
    slug: 'inflation',
    category: 'Economy',
    shortDefinition: 'The rate at which the general level of prices for goods and services is rising.',
    whyItMatters: 'Erodes purchasing power and guides interest rate adjustments.',
    prerequisites: [],
  },
  {
    id: 'interest-rates',
    title: 'Interest Rates',
    slug: 'interest-rates',
    category: 'Economy',
    shortDefinition: 'The proportion of an amount loaned which a lender charges as interest.',
    whyItMatters: 'Governs cost of capital across mortgages, corporate credit, and sovereign debt.',
    prerequisites: ['inflation'],
  },
  {
    id: 'monetary-policy',
    title: 'Monetary Policy',
    slug: 'monetary-policy',
    category: 'Economy',
    shortDefinition: 'Policy adopted by monetary authority to control interest rate or money supply.',
    whyItMatters: 'Maintains price stability and macroeconomic growth.',
    prerequisites: ['interest-rates', 'inflation'],
  },
  {
    id: 'liquidity-corridor',
    title: 'Liquidity Corridor',
    slug: 'liquidity-corridor',
    category: 'Economy',
    shortDefinition: 'The interest rate corridor bounded by reverse repo and marginal standing facility rates.',
    whyItMatters: 'Determines overnight interbank liquidity and short-term interest rates.',
    prerequisites: ['monetary-policy'],
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning',
    slug: 'machine-learning',
    category: 'Technology',
    shortDefinition: 'Algorithms that improve automatically through experience and data.',
    whyItMatters: 'Core foundation for artificial intelligence and pattern recognition.',
    prerequisites: [],
  },
  {
    id: 'ai-governance',
    title: 'AI Governance',
    slug: 'ai-governance',
    category: 'Technology',
    shortDefinition: 'Framework of rules, practices, and standards ensuring trustworthy and safe AI deployment.',
    whyItMatters: 'Ensures algorithmic accountability, copyright safety, and safety audits.',
    prerequisites: ['machine-learning'],
  },
];

const DEFAULT_RELATIONS: Omit<ConceptRelation, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Cybersecurity DAG
  { sourceConceptId: 'software-security', targetConceptId: 'computer-security', relationType: 'PREREQUISITE', weight: 1.0 },
  { sourceConceptId: 'vulnerability', targetConceptId: 'software-security', relationType: 'PREREQUISITE', weight: 1.0 },
  { sourceConceptId: 'exploit', targetConceptId: 'vulnerability', relationType: 'PREREQUISITE', weight: 1.0 },
  { sourceConceptId: 'zero-day-exploit', targetConceptId: 'exploit', relationType: 'PREREQUISITE', weight: 1.0 },
  { sourceConceptId: 'zero-day-exploit', targetConceptId: 'vulnerability', relationType: 'PREREQUISITE', weight: 0.9 },
  { sourceConceptId: 'exploit-mitigation', targetConceptId: 'exploit', relationType: 'PREREQUISITE', weight: 0.9 },
  { sourceConceptId: 'exploit-mitigation', targetConceptId: 'software-security', relationType: 'PREREQUISITE', weight: 0.8 },
  { sourceConceptId: 'zero-day-exploit', targetConceptId: 'exploit-mitigation', relationType: 'RELATED', weight: 0.85 },
  { sourceConceptId: 'vulnerability', targetConceptId: 'exploit-mitigation', relationType: 'CONTRASTS_WITH', weight: 0.7 },

  // Economy DAG
  { sourceConceptId: 'interest-rates', targetConceptId: 'inflation', relationType: 'PREREQUISITE', weight: 1.0 },
  { sourceConceptId: 'monetary-policy', targetConceptId: 'interest-rates', relationType: 'PREREQUISITE', weight: 1.0 },
  { sourceConceptId: 'monetary-policy', targetConceptId: 'inflation', relationType: 'PREREQUISITE', weight: 0.9 },
  { sourceConceptId: 'liquidity-corridor', targetConceptId: 'monetary-policy', relationType: 'PREREQUISITE', weight: 1.0 },
  { sourceConceptId: 'liquidity-corridor', targetConceptId: 'interest-rates', relationType: 'PART_OF', weight: 0.8 },

  // Tech / AI DAG
  { sourceConceptId: 'ai-governance', targetConceptId: 'machine-learning', relationType: 'PREREQUISITE', weight: 1.0 },
  { sourceConceptId: 'ai-governance', targetConceptId: 'computer-security', relationType: 'RELATED', weight: 0.6 },
];

export class KnowledgeGraphRepository {
  constructor() {
    this.seedDefaultsInMemory();
  }

  private seedDefaultsInMemory(): void {
    if (inMemoryRelations.length === 0) {
      const now = new Date().toISOString();
      for (const r of DEFAULT_RELATIONS) {
        inMemoryRelations.push({
          id: crypto.randomUUID(),
          sourceConceptId: r.sourceConceptId,
          targetConceptId: r.targetConceptId,
          relationType: r.relationType,
          weight: r.weight,
          metadata: r.metadata || {},
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  // ============================================================================
  // 1. CONCEPT RETRIEVAL
  // ============================================================================

  public async getAllConcepts(): Promise<ExtractedConcept[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            title,
            slug,
            category_id as "category",
            short_definition as "shortDefinition",
            full_explanation as "whyItMatters",
            prerequisites
          FROM public.concepts
          ORDER BY title ASC
        `;
        const rows = await query<any>(sql);
        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            category: r.category,
            shortDefinition: r.shortDefinition,
            whyItMatters: r.whyItMatters,
            prerequisites: typeof r.prerequisites === 'string' ? JSON.parse(r.prerequisites) : (r.prerequisites || []),
          }));
        }
      } catch (err: any) {
        console.warn('[KnowledgeGraphRepository] DB getAllConcepts error:', err.message);
      }
    }

    return [...DEFAULT_CONCEPTS];
  }

  public async getConceptById(id: string): Promise<ExtractedConcept | null> {
    if (!id) return null;
    const cleanId = id.trim().toLowerCase();

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            title,
            slug,
            category_id as "category",
            short_definition as "shortDefinition",
            full_explanation as "whyItMatters",
            prerequisites
          FROM public.concepts
          WHERE id = $1 OR slug = $1
          LIMIT 1
        `;
        const row = await queryOne<any>(sql, [cleanId]);
        if (row) {
          return {
            id: row.id,
            title: row.title,
            slug: row.slug,
            category: row.category,
            shortDefinition: row.shortDefinition,
            whyItMatters: row.whyItMatters,
            prerequisites: typeof row.prerequisites === 'string' ? JSON.parse(row.prerequisites) : (row.prerequisites || []),
          };
        }
      } catch (err: any) {
        console.warn('[KnowledgeGraphRepository] DB getConceptById error:', err.message);
      }
    }

    const found = DEFAULT_CONCEPTS.find((c) => c.id === cleanId || c.slug === cleanId);
    return found ? { ...found } : null;
  }

  public async saveConcept(concept: ExtractedConcept): Promise<ExtractedConcept> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.concepts (
            id, title, slug, category_id, short_definition, full_explanation, prerequisites
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            category_id = EXCLUDED.category_id,
            short_definition = EXCLUDED.short_definition,
            full_explanation = EXCLUDED.full_explanation,
            prerequisites = EXCLUDED.prerequisites,
            updated_at = NOW()
        `;
        await query(sql, [
          concept.id,
          concept.title,
          concept.slug || concept.id,
          concept.category || 'General',
          concept.shortDefinition,
          concept.whyItMatters || concept.shortDefinition,
          JSON.stringify(concept.prerequisites || []),
        ]);
      } catch (err: any) {
        console.warn('[KnowledgeGraphRepository] DB saveConcept error:', err.message);
      }
    }

    const idx = DEFAULT_CONCEPTS.findIndex((c) => c.id === concept.id);
    if (idx >= 0) {
      DEFAULT_CONCEPTS[idx] = concept;
    } else {
      DEFAULT_CONCEPTS.push(concept);
    }

    return concept;
  }

  // ============================================================================
  // 2. GRAPH RELATIONS & EDGES
  // ============================================================================

  public async getRelationsForConcept(conceptId: string): Promise<ConceptRelation[]> {
    if (!conceptId) return [];
    const cleanId = conceptId.trim().toLowerCase();

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            source_concept_id as "sourceConceptId",
            target_concept_id as "targetConceptId",
            relation_type as "relationType",
            weight,
            metadata,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.concept_relations
          WHERE source_concept_id = $1 OR target_concept_id = $1
        `;
        const rows = await query<any>(sql, [cleanId]);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            sourceConceptId: r.sourceConceptId,
            targetConceptId: r.targetConceptId,
            relationType: r.relationType as ConceptRelationType,
            weight: Number(r.weight),
            metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {},
            createdAt: r.createdAt?.toISOString?.() || r.createdAt,
            updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
          }));
        }
      } catch (err: any) {
        console.warn('[KnowledgeGraphRepository] DB getRelationsForConcept error:', err.message);
      }
    }

    return inMemoryRelations.filter(
      (r) => r.sourceConceptId === cleanId || r.targetConceptId === cleanId
    );
  }

  public async getAllRelations(): Promise<ConceptRelation[]> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT 
            id,
            source_concept_id as "sourceConceptId",
            target_concept_id as "targetConceptId",
            relation_type as "relationType",
            weight,
            metadata,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM public.concept_relations
        `;
        const rows = await query<any>(sql);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            sourceConceptId: r.sourceConceptId,
            targetConceptId: r.targetConceptId,
            relationType: r.relationType as ConceptRelationType,
            weight: Number(r.weight),
            metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {},
            createdAt: r.createdAt?.toISOString?.() || r.createdAt,
            updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
          }));
        }
      } catch (err: any) {
        console.warn('[KnowledgeGraphRepository] DB getAllRelations error:', err.message);
      }
    }

    return [...inMemoryRelations];
  }

  public async saveRelation(
    relation: Omit<ConceptRelation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<ConceptRelation> {
    const id = relation.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record: ConceptRelation = {
      id,
      sourceConceptId: relation.sourceConceptId.trim().toLowerCase(),
      targetConceptId: relation.targetConceptId.trim().toLowerCase(),
      relationType: relation.relationType,
      weight: Math.max(0.0, Math.min(1.0, relation.weight ?? 1.0)),
      metadata: relation.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    // Prevent self-loops
    if (record.sourceConceptId === record.targetConceptId) {
      throw new Error(`Invalid graph relationship: Self-loops are not allowed for concept '${record.sourceConceptId}'.`);
    }

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.concept_relations (
            id, source_concept_id, target_concept_id, relation_type, weight, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (source_concept_id, target_concept_id, relation_type) DO UPDATE SET
            weight = EXCLUDED.weight,
            metadata = EXCLUDED.metadata,
            updated_at = EXCLUDED.updated_at
          RETURNING id, created_at as "createdAt", updated_at as "updatedAt"
        `;
        const res = await queryOne<any>(sql, [
          id,
          record.sourceConceptId,
          record.targetConceptId,
          record.relationType,
          record.weight,
          JSON.stringify(record.metadata),
          now,
          now,
        ]);
        if (res) {
          record.id = res.id;
          record.createdAt = res.createdAt?.toISOString?.() || record.createdAt;
          record.updatedAt = res.updatedAt?.toISOString?.() || record.updatedAt;
        }
      } catch (err: any) {
        console.warn('[KnowledgeGraphRepository] DB saveRelation error:', err.message);
      }
    }

    const existingIdx = inMemoryRelations.findIndex(
      (r) =>
        r.sourceConceptId === record.sourceConceptId &&
        r.targetConceptId === record.targetConceptId &&
        r.relationType === record.relationType
    );

    if (existingIdx >= 0) {
      inMemoryRelations[existingIdx] = record;
    } else {
      inMemoryRelations.push(record);
    }

    return record;
  }

  // ============================================================================
  // 3. EVENT-CONCEPT CROSS MAPPINGS
  // ============================================================================

  public async linkEventConcept(eventId: string, conceptId: string, relevanceScore = 1.0): Promise<void> {
    const cleanCid = conceptId.trim().toLowerCase();

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.event_concepts (event_id, concept_id, relevance_score)
          VALUES ($1, $2, $3)
          ON CONFLICT (event_id, concept_id) DO UPDATE SET
            relevance_score = EXCLUDED.relevance_score
        `;
        await query(sql, [eventId, cleanCid, relevanceScore]);
      } catch (err: any) {
        console.warn('[KnowledgeGraphRepository] DB linkEventConcept error:', err.message);
      }
    }

    if (!inMemoryEventConceptJunction.has(cleanCid)) {
      inMemoryEventConceptJunction.set(cleanCid, new Set<string>());
    }
    inMemoryEventConceptJunction.get(cleanCid)!.add(eventId);
  }

  public async getEventIdsForConcept(conceptId: string): Promise<string[]> {
    const cleanCid = conceptId.trim().toLowerCase();

    if (isDatabaseConnected()) {
      try {
        const sql = `SELECT event_id as "eventId" FROM public.event_concepts WHERE concept_id = $1`;
        const rows = await query<any>(sql, [cleanCid]);
        if (rows && rows.length > 0) {
          return rows.map((r) => r.eventId);
        }
      } catch (err: any) {
        console.warn('[KnowledgeGraphRepository] DB getEventIdsForConcept error:', err.message);
      }
    }

    const set = inMemoryEventConceptJunction.get(cleanCid);
    return set ? Array.from(set) : [];
  }

  public async getEventIdsForConceptsBatch(conceptIds: string[]): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    for (const cid of conceptIds) {
      result.set(cid, []);
    }

    if (conceptIds.length === 0) return result;

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT concept_id as "conceptId", event_id as "eventId"
          FROM public.event_concepts
          WHERE concept_id = ANY($1::text[])
        `;
        const rows = await query<any>(sql, [conceptIds]);
        if (rows && rows.length > 0) {
          for (const r of rows) {
            if (!result.has(r.conceptId)) result.set(r.conceptId, []);
            result.get(r.conceptId)!.push(r.eventId);
          }
          return result;
        }
      } catch (err: any) {
        console.warn('[KnowledgeGraphRepository] DB getEventIdsForConceptsBatch error:', err.message);
      }
    }

    for (const cid of conceptIds) {
      const set = inMemoryEventConceptJunction.get(cid.toLowerCase());
      result.set(cid, set ? Array.from(set) : []);
    }

    return result;
  }

  public clearMemoryStore(): void {
    inMemoryRelations.length = 0;
    inMemoryEventConceptJunction.clear();
    this.seedDefaultsInMemory();
  }
}

export const knowledgeGraphRepository = new KnowledgeGraphRepository();
