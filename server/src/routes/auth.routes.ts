import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// DB Health Check Endpoint
router.get('/health/db', AuthController.checkDbHealth);

// Authenticated User Profile
router.get('/profile', requireAuth, AuthController.getProfile);
router.post('/profile', requireAuth, AuthController.updateProfile);

// Authenticated User Saved Events (User-Private Isolation)
router.get('/saved-events', requireAuth, AuthController.getSavedEvents);
router.post('/saved-events', requireAuth, AuthController.saveEvent);
router.delete('/saved-events/:eventId', requireAuth, AuthController.removeSavedEvent);

export default router;
