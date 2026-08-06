import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Get system configuration: accessible by admin, hr_manager, accountant, viewer
router.get('/', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), SettingsController.getConfig);

// Update system configuration: restricted to admin
router.put('/', authenticateToken, requireRole(['admin']), SettingsController.updateConfig);

export default router;
