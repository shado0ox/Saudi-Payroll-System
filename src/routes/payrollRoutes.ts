import { Router } from 'express';
import { PayrollController } from '../controllers/payrollController';
import { validatePayrollRunInput } from '../middlewares/validationMiddleware';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Read runs & payslips: accessible by admin, hr_manager, accountant, viewer
router.get('/runs', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), PayrollController.getRuns);
router.get('/runs/:id', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), PayrollController.getRunById);

// Calculate and approve payroll runs: restricted to admin and accountant
router.post('/runs/calculate', authenticateToken, requireRole(['admin', 'accountant']), validatePayrollRunInput, PayrollController.createOrCalculateRun);
router.post('/runs/:id/approve', authenticateToken, requireRole(['admin', 'accountant']), PayrollController.approveRun);

// Payslip details & printing: accessible by admin, hr_manager, accountant, viewer
router.get('/payslips/:payslipId', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), PayrollController.getPayslipById);
router.get('/payslips/:payslipId/print', authenticateToken, requireRole(['admin', 'hr_manager', 'accountant', 'viewer']), PayrollController.getPrintablePayslipHtml);

export default router;
