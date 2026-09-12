import { Router } from 'express';
import { getLiveNewsStream, syncLiveNews, getDailyBrief, getArticleById } from '../controllers/news.controller.js';
import { getConcepts, submitQuiz } from '../controllers/learning.controller.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Aura Real-World Intelligence & Learning Assistant API',
    timestamp: new Date().toISOString(),
  });
});

// Live News Stream & Feed Sync
router.get('/news/live', getLiveNewsStream);
router.post('/news/sync', syncLiveNews);

// Daily Brief & Article Details
router.get('/daily-brief', getDailyBrief);
router.get('/articles/:id', getArticleById);

// Concepts & Learning Loop
router.get('/concepts', getConcepts);
router.post('/quiz/submit', submitQuiz);

export default router;
