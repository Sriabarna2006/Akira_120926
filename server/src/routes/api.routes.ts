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

import conceptRoutes from './concept.routes.js';
import storylineRoutes from './storyline.routes.js';
import notificationRoutes from './notification.routes.js';
import diagnosticsRoutes from './diagnostics.routes.js';

import { isDatabaseConnected, getDatabaseState } from '../db/dbClient.js';

const router = Router();

// Apply optional user authentication across all API routes
router.use(authenticateUser);

// 🩺 OPERATIONAL DIAGNOSTICS & HEALTH (PHASE 15 & 16)
router.use('/diagnostics', diagnosticsRoutes);

// 🩺 HEALTH CHECKS
router.get('/health', (req, res) => {
  const isDbConnected = isDatabaseConnected();
  res.json({
    status: isDbConnected ? 'healthy' : 'operational',
    service: 'AKIRA Real-World Intelligence & Learning Assistant API',
    environment: process.env.NODE_ENV || 'production',
    database: getDatabaseState(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0 (Production Launch)',
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

// 📜 PHASE 11: TEMPORAL STORYLINE EVOLUTION & NARRATIVE TRAJECTORY ROUTES
router.use('/storylines', storylineRoutes);

// 🧠 PHASE 9: KNOWLEDGE GRAPH & CONCEPT DOMAIN ROUTES
router.use('/concepts', conceptRoutes);

// 🧠 PHASE 7 & 8: PERSONALIZATION & LEARNING ENGINE ROUTES
router.use('/learning', learningRoutes);

// 🔔 PHASE 14: REAL-TIME INTELLIGENCE & MOBILE NOTIFICATION ROUTES
router.use('/notifications', notificationRoutes);

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

// 🎓 LEGACY QUIZ ALIAS
router.post('/quiz/submit', submitQuiz);

export default router;
