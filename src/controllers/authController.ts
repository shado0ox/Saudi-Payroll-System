import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModel';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwtHelper';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class AuthController {
  /**
   * Login endpoint: POST /api/auth/login
   */
  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Username/email and password are required.'
          }
        });
      }

      const user = UserModel.findByUsernameOrEmail(username);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username/email or password.'
          }
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Your account is suspended. Please contact system administrator.'
          }
        });
      }

      // Verify bcrypt password hash
      const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username/email or password.'
          }
        });
      }

      // Generate JWT Access and Refresh Tokens
      const tokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Store refresh token in user record
      UserModel.updateRefreshToken(user.id, refreshToken);

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 3600 // 1 hour in seconds
          }
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Login failed.'
        }
      });
    }
  }

  /**
   * Refresh token endpoint: POST /api/auth/refresh
   */
  static async refresh(req: AuthenticatedRequest, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Refresh token is required.'
          }
        });
      }

      // Verify Refresh Token JWT signature & expiration
      const decoded = verifyRefreshToken(refreshToken);

      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token is expired or invalid. Please log in again.'
          }
        });
      }

      // Ensure user exists and stored refresh token matches
      const user = UserModel.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token has been revoked or invalidated.'
          }
        });
      }

      // Issue new Access Token and Refresh Token
      const tokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      UserModel.updateRefreshToken(user.id, newRefreshToken);

      return res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Refresh token failed.'
        }
      });
    }
  }

  /**
   * Logout endpoint: POST /api/auth/logout
   */
  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user) {
        UserModel.updateRefreshToken(req.user.id, null);
      }

      return res.json({
        success: true,
        message: 'Logged out successfully. Tokens invalidated.'
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Logout failed.'
        }
      });
    }
  }

  /**
   * Get Current User Profile: GET /api/auth/me
   */
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
        });
      }

      const user = UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' }
        });
      }

      const roles = UserModel.getAllRoles();
      const userRoleDef = roles.find(r => r.name === user.role);

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status
          },
          roleDetails: userRoleDef
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  /**
   * Get all Users and Roles list: GET /api/auth/users
   */
  static async getUsersAndRoles(req: AuthenticatedRequest, res: Response) {
    try {
      const users = UserModel.getAllUsers().map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt
      }));

      const roles = UserModel.getAllRoles();

      return res.json({
        success: true,
        data: { users, roles }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }
}
