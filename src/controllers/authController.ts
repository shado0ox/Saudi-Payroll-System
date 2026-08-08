import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModel';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/jwtHelper';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class AuthController {

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

      const user = await UserModel.findByUsernameOrEmail(username);

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
            message: 'Account is suspended.'
          }
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username/email or password.'
          }
        });
      }

      const tokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      await UserModel.updateRefreshToken(
        user.id,
        refreshToken
      );

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            companyId: user.companyId,
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
            expiresIn: 3600
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

      const decoded = verifyRefreshToken(refreshToken);

      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token is expired or invalid.'
          }
        });
      }

      const user = await UserModel.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token has been revoked.'
          }
        });
      }

      if (user.status !== 'active') {
        await UserModel.updateRefreshToken(user.id, null);

        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Account is suspended.'
          }
        });
      }

      if (!user.companyId) {
        await UserModel.updateRefreshToken(user.id, null);

        return res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_COMPANY',
            message: 'User is not assigned to a company.'
          }
        });
      }

      const tokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      };

      const newAccessToken =
        generateAccessToken(tokenPayload);

      const newRefreshToken =
        generateRefreshToken(tokenPayload);

      await UserModel.updateRefreshToken(
        user.id,
        newRefreshToken
      );

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


  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user) {
        await UserModel.updateRefreshToken(
          req.user.id,
          null
        );
      }

      return res.json({
        success: true,
        message: 'Logged out successfully.'
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


  static async getProfile(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated'
          }
        });
      }

      const user =
        await UserModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      const roles =
        await UserModel.getAllRoles();

      const userRoleDef =
        roles.find(r => r.name === user.role);

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            companyId: user.companyId,
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
        error: {
          code: 'SERVER_ERROR',
          message: err.message
        }
      });
    }
  }

   static async getUsersAndRoles(req: AuthenticatedRequest, res: Response) {
  try {

    const allUsers = await UserModel.getAllUsers();

    const users = allUsers
      .filter(u => u.companyId === req.companyId)
      .map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt
      }));

    const roles = await UserModel.getAllRoles();

    return res.json({
      success: true,
      data: {
        users,
        roles
      }
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: err.message
      }
    });
  }
}
  
     static async createUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.companyId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'COMPANY_REQUIRED',
          message: 'Active company is required.'
        }
      });
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role
    } = req.body;

    if (!username || !email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'All user fields are required.'
        }
      });
    }

    const exists = await UserModel.usernameOrEmailExists(username, email);

    if (exists) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Username or email already exists.'
        }
      });
    }

    const roles = await UserModel.getAllRoles();

    if (!roles.some(r => r.name === role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Invalid user role.'
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await UserModel.createUser({
      companyId: req.companyId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        companyId: user.companyId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: err.message
      }
    });
  }
}


static async updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const current = await UserModel.findById(id);

    if (!current || current.companyId !== req.companyId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    const username = req.body.username ?? current.username;
    const email = req.body.email ?? current.email;

    const exists = await UserModel.usernameOrEmailExists(
      username,
      email,
      id
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Username or email already exists.'
        }
      });
    }

    if (req.body.role !== undefined) {
      const roles = await UserModel.getAllRoles();

      if (!roles.some(r => r.name === req.body.role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid user role.'
          }
        });
      }
    }

    if (
      req.body.status !== undefined &&
      !['active', 'suspended'].includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be active or suspended.'
        }
      });
    }

    if (
      req.user?.id === id &&
      req.body.status === 'suspended'
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_SUSPEND',
          message: 'You cannot suspend your own account.'
        }
      });
    }

    const updated = await UserModel.updateUser(id, {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
      status: req.body.status
    });

    if (
      req.body.role !== undefined ||
      req.body.status !== undefined ||
      username !== current.username ||
      email.toLowerCase() !== current.email.toLowerCase()
    ) {
      await UserModel.updateRefreshToken(id, null);
    }

    return res.json({
      success: true,
      data: updated
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: err.message
      }
    });
  }
}


static async changeUserPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must contain at least 8 characters.'
        }
      });
    }

    const user = await UserModel.findById(id);

    if (!user || user.companyId !== req.companyId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await UserModel.updatePassword(id, passwordHash);
    await UserModel.updateRefreshToken(id, null);

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: err.message
      }
    });
  }
}


static async changeUserStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be active or suspended.'
        }
      });
    }

    if (req.user?.id === id && status === 'suspended') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_SUSPEND',
          message: 'You cannot suspend your own account.'
        }
      });
    }

    const user = await UserModel.findById(id);

    if (!user || user.companyId !== req.companyId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    const updated = await UserModel.updateUser(id, {
      status
    });

    await UserModel.updateRefreshToken(id, null);

    return res.json({
      success: true,
      data: updated
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: err.message
      }
    });
  }
}


static async deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_DELETE',
          message: 'You cannot delete your own account.'
        }
      });
    }

    const user = await UserModel.findById(id);

    if (!user || user.companyId !== req.companyId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    await UserModel.updateRefreshToken(id, null);
    await UserModel.deleteUser(id);

    return res.json({
      success: true,
      message: 'User deleted successfully.'
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: err.message
      }
    });
  }
 }
}