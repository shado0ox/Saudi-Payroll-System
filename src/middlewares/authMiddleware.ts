import { Request, Response, NextFunction } from 'express';

import { verifyAccessToken } from '../utils/jwtHelper';

import { UserModel } from '../models/UserModel';

import { UserRole } from '../types';


export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    username: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
  };

  companyId?: string;
}


/**
 * Verify JWT access token.
 *
 * Important:
 * - JWT proves the user's identity.
 * - Current user/company/role are then loaded
 *   from PostgreSQL.
 *
 * This prevents company switching through
 * headers or stale JWT company information.
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {

  try {

    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {

      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message:
            'Authentication token missing. Please log in.'
        }
      });
    }


    const token =
      authHeader.substring(7).trim();


    if (!token) {

      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message:
            'Authentication token missing.'
        }
      });
    }


    /*
     * Verify JWT signature and expiration.
     */
    const decoded =
      verifyAccessToken(token);


    if (!decoded) {

      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message:
            'Invalid or expired access token. Please log in again.'
        }
      });
    }


    /*
     * Load current user directly
     * from PostgreSQL.
     *
     * Do NOT trust companyId / role from
     * browser headers.
     */
    const user =
      await UserModel.findById(
        decoded.userId
      );


    if (!user) {

      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message:
            'User account no longer exists.'
        }
      });
    }


    /*
     * Immediately block suspended users,
     * even if their JWT has not expired yet.
     */
    if (user.status !== 'active') {

      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message:
            'User account is not active.'
        }
      });
    }


    /*
     * Company comes ONLY from the
     * PostgreSQL user record.
     */
    if (!user.companyId) {

      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_COMPANY',
          message:
            'User is not assigned to a company.'
        }
      });
    }


    /*
     * Build authenticated request from
     * trusted PostgreSQL data.
     */
    req.user = {
      id:
        user.id,

      companyId:
        user.companyId,

      username:
        user.username,

      email:
        user.email,

      role:
        user.role,

      firstName:
        user.firstName,

      lastName:
        user.lastName
    };


    /*
     * Controllers use this value for
     * company isolation.
     */
    req.companyId =
      user.companyId;


    return next();

  } catch (err) {

    console.error(
      'Authentication middleware error:',
      err
    );


    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_SERVER_ERROR',
        message:
          'Authentication validation failed.'
      }
    });
  }
}


/**
 * Restrict endpoint access by role.
 */
export function requireRole(
  allowedRoles: UserRole | UserRole[]
) {

  const rolesArray =
    Array.isArray(allowedRoles)
      ? allowedRoles
      : [allowedRoles];


  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {

    if (!req.user) {

      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message:
            'User authentication required.'
        }
      });
    }


    /*
     * Administrator has full access
     * inside their assigned company.
     */
    if (
      req.user.role === 'admin' ||
      rolesArray.includes(
        req.user.role
      )
    ) {

      return next();
    }


    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',

        message:
          `Access denied. Required role: ` +
          `[${rolesArray.join(', ')}]. ` +
          `Current role: '${req.user.role}'.`
      }
    });
  };
}


/*
 * Backwards compatibility.
 */
export const authMiddleware =
  authenticateToken;