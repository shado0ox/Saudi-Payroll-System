import { Response, NextFunction } from 'express';

import {
  AuthenticatedRequest
} from '../middlewares/authMiddleware';

import {
  SettingsModel
} from '../models/SettingsModel';

import {
  db
} from '../database/postgres';


export class SettingsController {

  /**
   * GET /api/settings
   */
  static async getConfig(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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


      const config =
        await SettingsModel.getConfig(
          req.companyId
        );


      return res.json({
        success: true,
        data: config
      });

    } catch (err) {
      next(err);
    }
  }


  /**
   * PUT /api/settings
   */
  static async updateConfig(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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


      const config =
        await SettingsModel.updateConfig(
          req.companyId,
          req.body
        );


      /*
       * Save audit log directly
       * into PostgreSQL.
       */
      const userName =
        req.user
          ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim()
            || req.user.username
          : 'System';


      await db.query(
        `
        INSERT INTO audit_logs (
          id,
          company_id,
          timestamp,
          action,
          user_name,
          details,
          module
        )
        VALUES (
          $1,
          $2,
          CURRENT_TIMESTAMP,
          $3,
          $4,
          $5,
          $6
        )
        `,
        [
          `log-${Date.now()}`,
          req.companyId,
          'UPDATE_SYSTEM_CONFIG',
          userName,
          'Updated payroll system configuration.',
          'Settings'
        ]
      );


      return res.json({
        success: true,
        data: config,
        message:
          'Settings updated successfully.'
      });

    } catch (err) {
      next(err);
    }
  }
}