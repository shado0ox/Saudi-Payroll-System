import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Financial exports (WPS & CSV): restricted to admin and accountant
router.get('/wps/:runId', authenticateToken, requireRole(['admin', 'accountant']), ReportController.exportWpsFile);
router.get('/csv/:runId', authenticateToken, requireRole(['admin', 'accountant']), ReportController.exportCsvSummary);

// Audit logs: accessible by admin, hr_manager, accountant, viewer
router.get('/audit-logs', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), ReportController.getAuditLogs);

export default router;
