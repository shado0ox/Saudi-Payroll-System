import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from '../docs/openapi';

import authRoutes from './authRoutes';
import employeeRoutes from './employeeRoutes';
import payrollRoutes from './payrollRoutes';
import attendanceRoutes from './attendanceRoutes';
import reportRoutes from './reportRoutes';
import settingsRoutes from './settingsRoutes';
import workerRoutes from './workerRoutes';
import journalRoutes from './journalRoutes';
import companyRoutes from './companyRoutes';

const router = Router();

// Swagger API Documentation UI
router.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
router.get('/docs.json', (req, res) => {
  res.json(openapiSpec);
});

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/payroll', payrollRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/companies', companyRoutes);
router.use('/system', workerRoutes);
router.use('/payroll/journals', journalRoutes);

export default router;
