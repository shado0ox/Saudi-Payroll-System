import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './src/routes';
import { authMiddleware } from './src/middlewares/authMiddleware';
import { requestLogger } from './src/middlewares/requestLogger';
import { errorHandler } from './src/middlewares/errorHandler';
import { logger } from './src/utils/logger';
import { JournalRetryService } from './src/services/journalRetryService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Initialize hourly background cron job for journal entry retries
  JournalRetryService.startHourlyCronJob();

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'payroll-system',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Router
  app.use('/api', apiRoutes);

  // Centralized Error Handler Middleware
  app.use(errorHandler);

  // Vite middleware for development / Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Payroll System Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
