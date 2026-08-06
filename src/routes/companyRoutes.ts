import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', CompanyController.getCompanies);
router.get('/:id', CompanyController.getCompanyById);
router.post('/', CompanyController.createCompany);
router.put('/:id', CompanyController.updateCompany);
router.post('/:id/test-api', CompanyController.testAccountingApi);

export default router;
