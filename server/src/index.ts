import app from './app.js';
import { ingestionScheduler } from './services/ingestion/scheduler.js';
import { notificationScheduler } from './services/notification/notificationScheduler.js';

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Start server if not running in a serverless environment or test suite
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 AKIRA API Server Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🌐 Allowed Origin: ${CORS_ORIGIN || '*'}`);
    console.log(`=========================================`);

    // Initialize background news ingestion scheduler
    ingestionScheduler.start();

    // Initialize background real-time intelligence & learning notification scheduler
    notificationScheduler.start();
  });
}

export default app;
