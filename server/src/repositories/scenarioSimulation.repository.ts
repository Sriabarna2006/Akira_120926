import crypto from 'crypto';
import {
  StorylineScenario,
  ScenarioAssumption,
  ScenarioImpact,
  ScenarioResult,
} from '../types/index.js';
import { query, queryOne, isDatabaseConnected } from '../db/dbClient.js';

export class ScenarioSimulationRepository {
  // In-memory fallback maps for zero-latency execution & offline resilience
  private memoryScenarios: Map<string, StorylineScenario> = new Map();
  private memoryAssumptions: Map<string, ScenarioAssumption> = new Map();
  private memoryImpacts: Map<string, ScenarioImpact[]> = new Map();
  private memoryRuns: Map<string, { result: ScenarioResult; expiresAt: string }> = new Map();

  /**
   * Generates a deterministic input hash from scenario parameters.
   */
  public generateInputHash(
    storylineId: string,
    scenarioType: string,
    targetEventId?: string | null,
    assumptionText: string = '',
    engineVersion: string = '1.0.0'
  ): string {
    const raw = `${storylineId}:${scenarioType}:${targetEventId || 'none'}:${assumptionText.trim().toLowerCase()}:${engineVersion}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Retrieves a cached scenario run by input hash.
   */
  public async getCachedRun(inputHash: string): Promise<ScenarioResult | null> {
    if (isDatabaseConnected()) {
      try {
        const sql = `SELECT result_json, expires_at FROM public.scenario_runs WHERE input_hash = $1 AND expires_at > NOW() LIMIT 1`;
        const res = await queryOne<{ result_json: any; expires_at: string }>(sql, [inputHash]);
        if (res && res.result_json) {
          const result = typeof res.result_json === 'string' ? JSON.parse(res.result_json) : res.result_json;
          return { ...result, isCached: true };
        }
      } catch (err: any) {
        console.warn(`[ScenarioRepo] PostgreSQL getCachedRun error: ${err.message}. Falling back to memory.`);
      }
    }

    const cached = this.memoryRuns.get(inputHash);
    if (cached) {
      if (new Date(cached.expiresAt).getTime() < Date.now()) {
        this.memoryRuns.delete(inputHash);
        return null;
      }
      return { ...cached.result, isCached: true };
    }

    return null;
  }

  /**
   * Saves or updates a cached scenario run.
   */
  public async saveScenarioRun(
    scenarioId: string,
    inputHash: string,
    result: ScenarioResult,
    engineVersion: string = '1.0.0'
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 24 hours
    this.memoryRuns.set(inputHash, { result, expiresAt });

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.scenario_runs (
            id, scenario_id, input_hash, engine_version, result_json, status, generated_at, expires_at, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, 'COMPLETED', NOW(), $6, NOW()
          )
          ON CONFLICT (input_hash)
          DO UPDATE SET
            result_json = EXCLUDED.result_json,
            generated_at = NOW(),
            expires_at = EXCLUDED.expires_at;
        `;
        const id = crypto.randomUUID();
        await query(sql, [id, scenarioId, inputHash, engineVersion, JSON.stringify(result), expiresAt]);
      } catch (err: any) {
        console.warn(`[ScenarioRepo] PostgreSQL saveScenarioRun error: ${err.message}`);
      }
    }
  }

  /**
   * Saves a new or updated scenario entity.
   */
  public async saveScenario(scenario: StorylineScenario): Promise<void> {
    this.memoryScenarios.set(scenario.id, scenario);

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.storyline_scenarios (
            id, storyline_id, user_id, title, question, scenario_type, assumption_text, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          )
          ON CONFLICT (id)
          DO UPDATE SET
            title = EXCLUDED.title,
            question = EXCLUDED.question,
            assumption_text = EXCLUDED.assumption_text,
            status = EXCLUDED.status,
            updated_at = NOW();
        `;
        await query(sql, [
          scenario.id,
          scenario.storylineId,
          scenario.userId,
          scenario.title,
          scenario.question,
          scenario.scenarioType,
          scenario.assumptionText,
          scenario.status,
          scenario.createdAt,
          scenario.updatedAt,
        ]);
      } catch (err: any) {
        console.warn(`[ScenarioRepo] PostgreSQL saveScenario error: ${err.message}`);
      }
    }
  }

  /**
   * Retrieves a scenario by ID and ensures user ownership.
   */
  public async findScenarioById(
    scenarioId: string,
    userId?: string
  ): Promise<StorylineScenario | null> {
    if (isDatabaseConnected()) {
      try {
        const sql = userId
          ? `SELECT * FROM public.storyline_scenarios WHERE id = $1 AND user_id = $2 LIMIT 1`
          : `SELECT * FROM public.storyline_scenarios WHERE id = $1 LIMIT 1`;
        const params = userId ? [scenarioId, userId] : [scenarioId];
        const res = await queryOne<any>(sql, params);
        if (res) {
          const sc: StorylineScenario = {
            id: res.id,
            storylineId: res.storyline_id,
            userId: res.user_id,
            title: res.title,
            question: res.question,
            scenarioType: res.scenario_type,
            assumptionText: res.assumption_text,
            status: res.status,
            createdAt: res.created_at,
            updatedAt: res.updated_at,
          };
          this.memoryScenarios.set(sc.id, sc);
          return sc;
        }
      } catch (err: any) {
        console.warn(`[ScenarioRepo] PostgreSQL findScenarioById error: ${err.message}`);
      }
    }

    const sc = this.memoryScenarios.get(scenarioId);
    if (sc) {
      if (userId && sc.userId !== userId) {
        return null;
      }
      return sc;
    }
    return null;
  }

  /**
   * Lists scenarios for a user in a specific storyline.
   */
  public async listUserScenarios(
    storylineId: string,
    userId: string,
    limit: number = 20,
    page: number = 1
  ): Promise<StorylineScenario[]> {
    const offset = (page - 1) * limit;

    if (isDatabaseConnected()) {
      try {
        const sql = `
          SELECT * FROM public.storyline_scenarios 
          WHERE storyline_id = $1 AND user_id = $2 
          ORDER BY created_at DESC 
          LIMIT $3 OFFSET $4
        `;
        const rows = await query<any>(sql, [storylineId, userId, limit, offset]);
        return rows.map((res) => ({
          id: res.id,
          storylineId: res.storyline_id,
          userId: res.user_id,
          title: res.title,
          question: res.question,
          scenarioType: res.scenario_type,
          assumptionText: res.assumption_text,
          status: res.status,
          createdAt: res.created_at,
          updatedAt: res.updated_at,
        }));
      } catch (err: any) {
        console.warn(`[ScenarioRepo] PostgreSQL listUserScenarios error: ${err.message}`);
      }
    }

    const all = Array.from(this.memoryScenarios.values()).filter(
      (s) => s.storylineId === storylineId && s.userId === userId
    );
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all.slice(offset, offset + limit);
  }

  /**
   * Deletes a scenario by ID if owned by user.
   */
  public async deleteScenario(scenarioId: string, userId: string): Promise<boolean> {
    const existing = await this.findScenarioById(scenarioId, userId);
    if (!existing) {
      return false;
    }

    this.memoryScenarios.delete(scenarioId);
    this.memoryAssumptions.delete(scenarioId);
    this.memoryImpacts.delete(scenarioId);

    // Also remove any in-memory runs associated with scenarioId
    for (const [hash, entry] of Array.from(this.memoryRuns.entries())) {
      if (entry.result?.scenario?.id === scenarioId) {
        this.memoryRuns.delete(hash);
      }
    }

    if (isDatabaseConnected()) {
      try {
        await query(
          `DELETE FROM public.storyline_scenarios WHERE id = $1 AND user_id = $2`,
          [scenarioId, userId]
        );
      } catch (err: any) {
        console.warn(`[ScenarioRepo] PostgreSQL deleteScenario error: ${err.message}`);
      }
    }

    return true;
  }

  /**
   * Saves explicit scenario assumption.
   */
  public async saveAssumption(assumption: ScenarioAssumption): Promise<void> {
    this.memoryAssumptions.set(assumption.scenarioId, assumption);

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO public.scenario_assumptions (
            id, scenario_id, target_event_id, assumption_type, original_state, hypothetical_state, rationale, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, NOW()
          );
        `;
        await query(sql, [
          assumption.id,
          assumption.scenarioId,
          assumption.targetEventId || null,
          assumption.assumptionType,
          JSON.stringify(assumption.originalState),
          JSON.stringify(assumption.hypotheticalState),
          assumption.rationale,
        ]);
      } catch (err: any) {
        console.warn(`[ScenarioRepo] PostgreSQL saveAssumption error: ${err.message}`);
      }
    }
  }

  /**
   * Saves scenario impact records.
   */
  public async saveImpacts(scenarioId: string, impacts: ScenarioImpact[]): Promise<void> {
    this.memoryImpacts.set(scenarioId, impacts);

    if (isDatabaseConnected()) {
      try {
        for (const imp of impacts) {
          const sql = `
            INSERT INTO public.scenario_impacts (
              id, scenario_id, source_entity_id, affected_entity_id, entity_type, relationship_type,
              impact_direction, impact_strength, explanation, evidence_state, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
            );
          `;
          await query(sql, [
            imp.id,
            imp.scenarioId,
            imp.sourceEntityId,
            imp.affectedEntityId,
            imp.entityType,
            imp.relationshipType,
            imp.impactDirection,
            imp.impactStrength,
            imp.explanation,
            JSON.stringify(imp.evidenceState || {}),
          ]);
        }
      } catch (err: any) {
        console.warn(`[ScenarioRepo] PostgreSQL saveImpacts error: ${err.message}`);
      }
    }
  }
}

export const scenarioSimulationRepository = new ScenarioSimulationRepository();
