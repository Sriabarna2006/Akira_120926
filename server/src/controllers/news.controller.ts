import { Request, Response } from 'express';
import { newsIngestionService } from '../services/newsIngestion.service.js';
import { aiExplainerService } from '../services/aiExplainer.service.js';

export const getTop10LiveEvents = async (req: Request, res: Response) => {
  try {
    const { region, category, status, label, limit } = req.query;
    const top10 = await newsIngestionService.getTop10LiveEvents({
      region: (region as string) || undefined,
      category: (category as string) || undefined,
      status: (status as string) || (label as string) || undefined,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    res.json({
      success: true,
      data: top10,
      meta: {
        count: top10.length,
        regionFilter: region || 'ALL',
        statusFilter: status || label || 'ALL',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch Top 10 live events' });
  }
};

export const getLiveEventsStream = async (req: Request, res: Response) => {
  try {
    const { region, category, label, search, limit } = req.query;

    const result = await newsIngestionService.getAllEvents({
      region: region as string,
      category: category as string,
      label: label as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.events,
      meta: {
        total: result.total,
        lastSyncTime: result.lastSyncTime,
        isSyncing: result.isSyncing,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch live events' });
  }
};

export const syncLiveNews = async (req: Request, res: Response) => {
  try {
    const result = await newsIngestionService.syncAllFeeds();
    res.json({
      success: true,
      message: `Successfully synced news feeds across Tamil Nadu, India, and World. Added ${result.newCount} new events.`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to sync news feeds' });
  }
};

export const getDailyBrief = async (req: Request, res: Response) => {
  try {
    const top10 = await newsIngestionService.getTop10LiveEvents();
    // Curate top 6 high-impact events for the Daily Brief
    const curatedBrief = top10.slice(0, 6);

    res.json({
      success: true,
      data: curatedBrief,
      meta: {
        totalParsed: top10.length,
        curatedCount: curatedBrief.length,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve daily brief' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const event = await newsIngestionService.getEventById(id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const fullAnalysis = aiExplainerService.generateAnalysisForEvent(event as any);

    res.json({
      success: true,
      data: {
        ...event,
        breakdown: fullAnalysis.breakdown,
        explanations: fullAnalysis.explanations,
        concepts: fullAnalysis.concepts,
        quiz: fullAnalysis.quiz,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve event details' });
  }
};

