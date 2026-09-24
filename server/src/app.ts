import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';

// Parse configured CORS origins
const allowedOrigins = CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow server-to-server, mobile apps, or curl requests with no origin
    if (!origin) {
      return callback(null, true);
    }
    // 2. Allow local development origins
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    // 3. Allow all Vercel deployment preview and production domains
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // 4. Match configured production origins or wildcard
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // 5. In production, gracefully decline CORS without throwing unhandled exceptions
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json());

// Routes (supports both /api prefix and root path)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
