import { Router } from 'express';
import regionRoutes from './region.routes.js';
import categoryRoutes from './category.routes.js';
import sourceRoutes from './source.routes.js';
import articleRoutes from './article.routes.js';
import eventRoutes from './event.routes.js';
import liveRoutes from './live.routes.js';
import authRoutes from './auth.routes.js';
import learningRoutes from './learning.routes.js';
import { authenticateUser, requireInternalSecret } from '../middleware/auth.middleware.js';
import { AuthController } from '../controllers/auth.controller.js';
import { getDailyBrief } from '../controllers/news.controller.js';
import { getConcepts, submitQuiz } from '../controllers/learning.controller.js';
import { EventController } from '../controllers/event.controller.js';
import { LiveController } from '../controllers/live.controller.js';

const router = Router();

// Apply optional user authentication across all API routes
router.use(authenticateUser);

// 🩺 HEALTH CHECKS
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AKIRA Real-World Intelligence & Learning Assistant API',
    version: 'Phase 7 (Personalization, Learning Progress & Spaced Repetition)',
    timestamp: new Date().toISOString(),
  });
});
router.get('/health/db', AuthController.checkDbHealth);
router.post('/health/db/migrate', AuthController.migrateNeon);

// 🌐 CORE REFERENCE & INTELLIGENCE DOMAIN ROUTES
router.use('/regions', regionRoutes);
router.use('/categories', categoryRoutes);
router.use('/sources', sourceRoutes);
router.use('/articles', articleRoutes);
router.use('/events', eventRoutes);
router.use('/live', liveRoutes);

// 🧠 PHASE 7: PERSONALIZATION & LEARNING ENGINE ROUTES
router.use('/learning', learningRoutes);

// 🔐 AUTH & USER-PRIVATE ROUTES
router.use('/auth', authRoutes);

// 🔄 BACKWARDS COMPATIBILITY ALIASES
router.get('/news/live', LiveController.getLiveStream);
router.get('/news', LiveController.getLiveStream);
router.get('/news/top', LiveController.getTop);
router.get('/news/live/top', LiveController.getTop);
router.post('/news/refresh', LiveController.refreshLiveFeeds);
router.post('/news/sync', requireInternalSecret, LiveController.sync);
router.post('/news/live/sync', requireInternalSecret, LiveController.sync);
router.get('/news/:id', EventController.getById);


// ☀️ DAILY BRIEF
router.get('/daily-brief', getDailyBrief);
router.get('/news/daily-brief', getDailyBrief);

// 🎓 CONCEPTS & LEGACY QUIZ ALIASES
router.get('/concepts', getConcepts);
router.post('/quiz/submit', submitQuiz);

export default router;
