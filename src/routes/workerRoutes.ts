import { Router } from 'express';
import { WorkerController } from '../controllers/workerController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Trigger background worker: restricted to admin and accountant
router.post('/worker/run', authenticateToken, requireRole(['admin', 'accountant']), WorkerController.triggerWorker);

// Trigger database migration: restricted to admin
router.post('/migrate/run', authenticateToken, requireRole(['admin']), WorkerController.triggerMigration);

export default router;
