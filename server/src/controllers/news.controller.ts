import { Request, Response } from 'express';
import { newsIngestionService } from '../services/newsIngestion.service.js';
import { aiExplainerService } from '../services/aiExplainer.service.js';

export const getLiveNewsStream = async (req: Request, res: Response) => {
  try {
    const { category, importance, search, limit } = req.query;

    const result = newsIngestionService.getAllArticles({
      category: category as string,
      importance: importance as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.articles,
      meta: {
        total: result.total,
        lastSyncTime: result.lastSyncTime,
        isSyncing: result.isSyncing,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch live news' });
  }
};

export const syncLiveNews = async (req: Request, res: Response) => {
  try {
    const result = await newsIngestionService.syncAllFeeds();
    res.json({
      success: true,
      message: `Successfully synced news feeds. Added ${result.newCount} new articles.`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to sync news feeds' });
  }
};

export const getDailyBrief = async (req: Request, res: Response) => {
  try {
    const all = newsIngestionService.getAllArticles();
    // Prioritize MUST_KNOW and top scored articles for the brief
    const topBriefs = all.articles
      .sort((a, b) => b.importanceScore - a.importanceScore)
      .slice(0, 10);

    res.json({
      success: true,
      data: topBriefs,
      meta: {
        totalEventsParsed: all.total,
        highImpactSelected: topBriefs.length,
        lastSyncTime: all.lastSyncTime,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve daily brief' });
  }
};

export const getArticleById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const article = newsIngestionService.getArticleById(id);

    if (!article) {
      // Fallback if not found
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const fullAnalysis = aiExplainerService.generateAnalysisForArticle(article);

    res.json({
      success: true,
      data: {
        ...article,
        breakdown: fullAnalysis.breakdown,
        explanations: fullAnalysis.explanations,
        concepts: fullAnalysis.concepts,
        quiz: fullAnalysis.quiz,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve article details' });
  }
};
