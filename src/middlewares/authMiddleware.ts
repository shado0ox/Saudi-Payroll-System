import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwtHelper';
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
 * Middleware to verify JWT Access Token from Authorization Header
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing. Please log in.'
      }
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Invalid or expired access token. Please refresh token or log in again.'
      }
    });
  }

  // Header override for switching companies if authorized, or default to token's companyId
  const customCompanyHeader = req.headers['x-company-id'] as string | undefined;
  const activeCompanyId = customCompanyHeader || decoded.companyId || 'comp-101';

  req.user = {
    id: decoded.userId,
    companyId: activeCompanyId,
    username: decoded.username,
    email: decoded.email,
    role: decoded.role
  };

  req.companyId = activeCompanyId;

  next();
}

/**
 * Middleware to restrict access based on User Role(s)
 */
export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required.'
        }
      });
    }

    // Admin role has full access to all endpoints
    if (req.user.role === 'admin' || rolesArray.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Access denied. Requires one of the following roles: [${rolesArray.join(', ')}]. Current role: '${req.user.role}'.`
      }
    });
  };
}

// Backwards compatibility alias
export const authMiddleware = authenticateToken;
