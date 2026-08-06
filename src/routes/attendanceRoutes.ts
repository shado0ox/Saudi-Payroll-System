import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Read attendance: accessible by admin, hr_manager, accountant, viewer
router.get('/', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), AttendanceController.getByPeriod);

// Update attendance: restricted to admin and hr_manager
router.post('/', authenticateToken, requireRole(['admin', 'hr_manager']), AttendanceController.updateRecord);

export default router;
