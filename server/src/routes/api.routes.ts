import { Router } from 'express';
import { 
  getTop10LiveEvents, 
  getLiveEventsStream, 
  syncLiveNews, 
  getDailyBrief, 
  getEventById 
} from '../controllers/news.controller.js';
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

// 🔴 LIVE & TRENDING Endpoints
router.get('/live/top', getTop10LiveEvents);
router.get('/live', getLiveEventsStream);
router.post('/live/sync', syncLiveNews);

// ☀️ DAILY BRIEF & EVENT BREAKDOWNS
router.get('/daily-brief', getDailyBrief);
router.get('/events/:id', getEventById);
router.get('/articles/:id', getEventById); // alias for backwards compatibility

// 🎓 CONCEPTS & LEARNING LOOP
router.get('/concepts', getConcepts);
router.post('/quiz/submit', submitQuiz);

export default router;
