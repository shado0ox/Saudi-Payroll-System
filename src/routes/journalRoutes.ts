import { Router } from 'express';
import { JournalController } from '../controllers/journalController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// GET all entries with filters: accessible by admin, hr_manager, accountant, viewer
router.get('/', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), JournalController.getEntries);

// GET single entry details
router.get('/:id', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), JournalController.getEntryById);

// POST manual retry: restricted to admin and accountant
router.post('/:id/retry', authenticateToken, requireRole(['admin', 'accountant']), JournalController.retryEntry);

// POST trigger hourly cron job: restricted to admin and accountant
router.post('/trigger-cron', authenticateToken, requireRole(['admin', 'accountant']), JournalController.triggerCron);

// POST sync/create journal for a payroll run
router.post('/sync-run/:runId', authenticateToken, requireRole(['admin', 'accountant']), JournalController.syncRunJournal);

export default router;
