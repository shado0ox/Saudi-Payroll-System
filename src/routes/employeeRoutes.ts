import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';
import { validateEmployeeInput } from '../middlewares/validationMiddleware';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Read operations: accessible by admin, hr_manager, accountant, viewer
router.get('/', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), EmployeeController.getAll);
router.get('/:id', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), EmployeeController.getById);

// Write operations: restricted to admin and hr_manager
router.post('/', authenticateToken, requireRole(['admin', 'hr_manager']), validateEmployeeInput, EmployeeController.create);
router.put('/:id', authenticateToken, requireRole(['admin', 'hr_manager']), EmployeeController.update);
router.delete('/:id', authenticateToken, requireRole(['admin', 'hr_manager']), EmployeeController.delete);

export default router;
