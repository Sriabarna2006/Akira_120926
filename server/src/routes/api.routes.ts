import { Router } from 'express';
import { 
  getTop10LiveEvents, 
  getLiveEventsStream, 
  syncLiveNews, 
  getDailyBrief, 
  getEventById 
} from '../controllers/news.controller.js';
import { getConcepts, submitQuiz } from '../controllers/learning.controller.js';
import { authenticateUser, requireInternalSecret } from '../middleware/auth.middleware.js';
import authRoutes from './auth.routes.js';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();

// Apply optional user authentication across all API routes
router.use(authenticateUser);

// Health checks
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AKIRA Real-World Intelligence & Learning Assistant API',
    timestamp: new Date().toISOString(),
  });
});
router.get('/health/db', AuthController.checkDbHealth);

// 🔐 AUTH & USER-PRIVATE ROUTES
router.use('/auth', authRoutes);

// 🔴 LIVE & TRENDING Endpoints (Canonical & Aliases)
router.get('/live', getLiveEventsStream);
router.get('/news/live', getLiveEventsStream);
router.get('/news', getLiveEventsStream);

router.get('/live/top', getTop10LiveEvents);
router.get('/news/top', getTop10LiveEvents);
router.get('/news/live/top', getTop10LiveEvents);

// 🔒 SECURED Ingestion Sync Endpoints (Internal Secret or Admin required)
router.post('/live/sync', requireInternalSecret, syncLiveNews);
router.post('/news/sync', requireInternalSecret, syncLiveNews);
router.post('/news/live/sync', requireInternalSecret, syncLiveNews);

// ☀️ DAILY BRIEF & EVENT BREAKDOWNS
router.get('/daily-brief', getDailyBrief);
router.get('/news/daily-brief', getDailyBrief);
router.get('/events/:id', getEventById);
router.get('/articles/:id', getEventById); // alias for backwards compatibility
router.get('/news/:id', getEventById);

// 🎓 CONCEPTS & LEARNING LOOP
router.get('/concepts', getConcepts);
router.get('/learning/concepts', getConcepts);
router.post('/quiz/submit', submitQuiz);
router.post('/learning/quiz/submit', submitQuiz);

export default router;
