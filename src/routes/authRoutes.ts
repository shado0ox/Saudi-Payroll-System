import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import {
  authenticateToken,
  requireRole
} from '../middlewares/authMiddleware';

const router = Router();

/**
 * ================================
 * Public Authentication Routes
 * ================================
 */

// Login
router.post(
  '/login',
  AuthController.login
);

// Refresh access token
router.post(
  '/refresh',
  AuthController.refresh
);


/**
 * ================================
 * Protected Authentication Routes
 * ================================
 */

// Logout
router.post(
  '/logout',
  authenticateToken,
  AuthController.logout
);

// Current logged-in user
router.get(
  '/me',
  authenticateToken,
  AuthController.getProfile
);


/**
 * ================================
 * User Management
 * ADMIN ONLY
 * ================================
 */

// Get users and roles
router.get(
  '/users',
  authenticateToken,
  requireRole('admin'),
  AuthController.getUsersAndRoles
);

// Create user
router.post(
  '/users',
  authenticateToken,
  requireRole('admin'),
  AuthController.createUser
);

// Update user
router.put(
  '/users/:id',
  authenticateToken,
  requireRole('admin'),
  AuthController.updateUser
);

// Change user password
router.put(
  '/users/:id/password',
  authenticateToken,
  requireRole('admin'),
  AuthController.changeUserPassword
);

// Activate / suspend user
router.put(
  '/users/:id/status',
  authenticateToken,
  requireRole('admin'),
  AuthController.changeUserStatus
);

// Delete user
router.delete(
  '/users/:id',
  authenticateToken,
  requireRole('admin'),
  AuthController.deleteUser
);

export default router;