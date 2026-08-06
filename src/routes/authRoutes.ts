import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Public Authentication Routes
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);

// Protected Authentication Routes
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.getProfile);
router.get('/users', authenticateToken, AuthController.getUsersAndRoles);

export default router;
