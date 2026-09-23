import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ingestionScheduler } from './services/ingestion/scheduler.js';
import { notificationScheduler } from './services/notification/notificationScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, mobile apps, or curl requests with no origin
    if (!origin) {
      return callback(null, true);
    }
    // Allow local development origins
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    // Match configured production origins or wildcard
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In production, reject unauthorized cross-origin requests
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error(`CORS origin ${origin} not permitted`));
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Routes (supports both /api prefix in dev and stripped path in serverless)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Centralized error handling
app.use(errorHandler);


// Start server if not running in a serverless environment
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 AKIRA API Server Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🌐 Allowed Origin: ${CORS_ORIGIN}`);
    console.log(`=========================================`);

    // Initialize background news ingestion scheduler
    ingestionScheduler.start();

    // Initialize background real-time intelligence & learning notification scheduler
    notificationScheduler.start();
  });
}

export default app;


