import { Request, Response, NextFunction } from 'express';
import { scenarioSimulationService } from '../services/storyline/scenarioSimulation.service.js';

export class ScenarioSimulationController {
  private static extractUserId(req: Request): string {
    return (
      (req as any).user?.id ||
      (req.headers['x-user-id'] as string) ||
      (req.query.userId as string) ||
      '00000000-0000-0000-0000-000000000001'
    );
  }

  /**
   * POST /api/storylines/:id/scenarios
   * Creates a new scenario and executes immediate deterministic simulation.
   */
  public static async createScenario(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const storylineId = req.params.id as string;
      const userId = ScenarioSimulationController.extractUserId(req);

      const result = await scenarioSimulationService.createAndSimulateScenario(
        storylineId,
        userId,
        req.body
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Scenario created and simulated successfully.',
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message.includes('does not belong')) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/scenarios/:scenarioId
   * Retrieves full scenario result with baseline comparison, affected nodes, and unknowns.
   */
  public static async getScenario(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const storylineId = req.params.id as string;
      const scenarioId = req.params.scenarioId as string;
      const userId = ScenarioSimulationController.extractUserId(req);
      const forceRefresh = req.query.forceRefresh === 'true';

      const result = await scenarioSimulationService.getScenarioResult(
        storylineId,
        scenarioId,
        userId,
        forceRefresh
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/scenarios
   * Lists scenarios created by the user in this storyline.
   */
  public static async listScenarios(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const storylineId = req.params.id as string;
      const userId = ScenarioSimulationController.extractUserId(req);
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const page = req.query.page ? Number(req.query.page) : 1;

      const list = await scenarioSimulationService.listUserScenarios(
        storylineId,
        userId,
        limit,
        page
      );

      res.json({
        success: true,
        data: list,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/storylines/:id/scenarios/:scenarioId/refresh
   * Force refreshes and re-simulates the scenario.
   */
  public static async refreshScenario(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const storylineId = req.params.id as string;
      const scenarioId = req.params.scenarioId as string;
      const userId = ScenarioSimulationController.extractUserId(req);

      const result = await scenarioSimulationService.getScenarioResult(
        storylineId,
        scenarioId,
        userId,
        true
      );

      res.json({
        success: true,
        data: result,
        message: 'Scenario re-simulated successfully.',
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * DELETE /api/storylines/:id/scenarios/:scenarioId
   * Deletes a user scenario.
   */
  public static async deleteScenario(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const storylineId = req.params.id as string;
      const scenarioId = req.params.scenarioId as string;
      const userId = ScenarioSimulationController.extractUserId(req);

      await scenarioSimulationService.deleteScenario(storylineId, scenarioId, userId);

      res.json({
        success: true,
        message: `Scenario "${scenarioId}" deleted successfully.`,
      });
    } catch (err: any) {
      if (err.message.includes('not found') || err.message.includes('unauthorized')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/storylines/:id/scenarios/:scenarioId/learning
   * Returns concept mastery hooks and scenario reasoning quiz.
   */
  public static async getScenarioLearning(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const storylineId = req.params.id as string;
      const scenarioId = req.params.scenarioId as string;
      const userId = ScenarioSimulationController.extractUserId(req);

      const learning = await scenarioSimulationService.getScenarioLearning(
        storylineId,
        scenarioId,
        userId
      );

      res.json({
        success: true,
        data: learning,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }
}
