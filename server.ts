import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import apiRoutes from './src/routes';
import { requestLogger } from './src/middlewares/requestLogger';
import { errorHandler } from './src/middlewares/errorHandler';
import { logger } from './src/utils/logger';
import { JournalRetryService } from './src/services/journalRetryService';
import { testDatabaseConnection } from './src/database/postgres';

async function startServer() {
  // اختبار اتصال PostgreSQL قبل تشغيل الموقع
  await testDatabaseConnection();

  const app = express();
  const PORT = Number(process.env.PORT || 3023);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Background job
  JournalRetryService.startHourlyCronJob();

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'payroll-system',
      database: 'payroll_db',
      timestamp: new Date().toISOString(),
    });
  });

  // API
  app.use('/api', apiRoutes);

  // Error Handler
  app.use(errorHandler);

  // Frontend
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
    logger.info(
      `Payroll System Server listening on http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((error) => {
  console.error('Failed to start Payroll System:', error);
  process.exit(1);
});