import { Response, NextFunction } from 'express';

import { AuthenticatedRequest } from '../middlewares/authMiddleware';

import { PayrollModel } from '../models/PayrollModel';
import { SettingsModel } from '../models/SettingsModel';

import { PayrollExportService } from '../services/payrollExportService';

import { db } from '../database/postgres';


export class ReportController {

  /**
   * Export WPS bank file
   */
  static async exportWpsFile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {

      const companyId =
        req.companyId;


      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });
      }


      const { runId } =
        req.params;


      /*
       * Payroll run restricted
       * to current company.
       */
      const run =
        await PayrollModel.getRunById(
          runId,
          companyId
        );


      if (!run) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payroll run not found.'
          }
        });
      }


      /*
       * Load company-specific settings
       * from PostgreSQL.
       */
      const config =
        await SettingsModel.getConfig(
          companyId
        );


      const wpsContent =
        PayrollExportService.generateWpsBankFile(
          run,
          config
        );


      /*
       * Audit export operation.
       */
      const userName =
        req.user
          ? (
              `${req.user.firstName || ''} ${req.user.lastName || ''}`
                .trim() ||
              req.user.username
            )
          : 'System User';


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
          `log-wps-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 7)}`,

          companyId,

          'EXPORT_WPS_FILE',

          userName,

          `Exported WPS file for payroll run ${run.runCode}, period ${run.period}.`,

          'Reports'
        ]
      );


      res.setHeader(
        'Content-Type',
        'text/plain; charset=utf-8'
      );


      res.setHeader(
        'Content-Disposition',
        `attachment; filename="WPS_BANK_FILE_${run.period}.txt"`
      );


      return res.send(
        wpsContent
      );

    } catch (err) {
      next(err);
    }
  }


  /**
   * Export Payroll CSV summary
   */
  static async exportCsvSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {

      const companyId =
        req.companyId;


      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });
      }


      const { runId } =
        req.params;


      const run =
        await PayrollModel.getRunById(
          runId,
          companyId
        );


      if (!run) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payroll run not found.'
          }
        });
      }


      const csvContent =
        PayrollExportService.generateCsvSummary(
          run
        );


      const userName =
        req.user
          ? (
              `${req.user.firstName || ''} ${req.user.lastName || ''}`
                .trim() ||
              req.user.username
            )
          : 'System User';


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
          `log-csv-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 7)}`,

          companyId,

          'EXPORT_PAYROLL_CSV',

          userName,

          `Exported payroll CSV summary for ${run.runCode}, period ${run.period}.`,

          'Reports'
        ]
      );


      res.setHeader(
        'Content-Type',
        'text/csv; charset=utf-8'
      );


      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Payroll_Summary_${run.period}.csv"`
      );


      return res.send(
        csvContent
      );

    } catch (err) {
      next(err);
    }
  }


  /**
   * GET Audit Logs
   *
   * PostgreSQL only.
   */
  static async getAuditLogs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {

      const companyId =
        req.companyId;


      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });
      }


      /*
       * Optional query limits.
       *
       * Max 500 records to prevent
       * accidentally returning the
       * entire audit history.
       */
      const requestedLimit =
        Number(req.query.limit || 200);


      const limit =
        Number.isFinite(requestedLimit)
          ? Math.min(
              Math.max(
                requestedLimit,
                1
              ),
              500
            )
          : 200;


      const result =
        await db.query(
          `
          SELECT
            id,
            company_id,
            timestamp,
            action,
            user_name,
            details,
            module
          FROM audit_logs
          WHERE company_id = $1
          ORDER BY timestamp DESC
          LIMIT $2
          `,
          [
            companyId,
            limit
          ]
        );


      /*
       * Map DB snake_case fields
       * to frontend-compatible structure.
       */
      const auditLogs =
        result.rows.map(
          row => ({
            id:
              row.id,

            companyId:
              row.company_id,

            timestamp:
              row.timestamp,

            action:
              row.action,

            /*
             * Existing UI previously used
             * property name "user".
             */
            user:
              row.user_name,

            details:
              row.details,

            module:
              row.module
          })
        );


      return res.json({
        success: true,
        data: auditLogs
      });

    } catch (err) {
      next(err);
    }
  }
}