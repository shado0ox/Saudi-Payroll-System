import { Response, NextFunction } from 'express';

import { PayrollModel } from '../models/PayrollModel';
import { EmployeeModel } from '../models/EmployeeModel';
import { AttendanceModel } from '../models/AttendanceModel';

import { AuthenticatedRequest } from '../middlewares/authMiddleware';

import { SettingsModel } from '../models/SettingsModel';

import { PayrollCalculationService } from '../services/payrollCalculationService';
import { PayslipService } from '../services/payslipService';

import { PayrollRun, Payslip } from '../types';


export class PayrollController {

  /**
   * GET /api/payroll/runs
   */
  static async getRuns(
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

      const runs =
        await PayrollModel.getAllRuns(
          req.companyId
        );

      return res.json({
        success: true,
        data: runs
      });

    } catch (err) {
      next(err);
    }
  }


  /**
   * GET /api/payroll/runs/:id
   */
  static async getRunById(
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

      const { id } = req.params;

      const run =
        await PayrollModel.getRunById(
          id,
          req.companyId
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

      return res.json({
        success: true,
        data: run
      });

    } catch (err) {
      next(err);
    }
  }


  /**
   * POST /api/payroll/calculate
   */
  static async createOrCalculateRun(
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

      const {
        period,
        title
      } = req.body;


      if (
        !period ||
        !/^\d{4}-\d{2}$/.test(period)
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PERIOD',
            message:
              'Payroll period must be in YYYY-MM format.'
          }
        });
      }


      /*
       * Company-specific payroll settings
       * loaded from PostgreSQL.
       */
      const config =
        await SettingsModel.getConfig(
          req.companyId
        );


      /*
       * PostgreSQL employees
       * restricted to active company.
       */
      const employees =
        (
          await EmployeeModel.getAll(
            req.companyId
          )
        ).filter(
          employee =>
            employee.status === 'active'
        );


      /*
       * PostgreSQL attendance
       * restricted to active company.
       */
      const attendanceRecords =
        await AttendanceModel.getForPeriod(
          period,
          req.companyId
        );


      /*
       * Company-specific IDs.
       * Avoid duplicate IDs between companies.
       */
      const safeCompanyId =
        req.companyId.replace(
          /[^a-zA-Z0-9_-]/g,
          ''
        );

      const runId =
        `pr-${safeCompanyId}-${period}`;

      const runCode =
        `PAY-${period.replace('-', '')}`;


      const payslips: Payslip[] = [];

      let totalGross = 0;
      let totalDeductions = 0;
      let totalEmployerContrib = 0;
      let totalNet = 0;


      for (
        const employee of employees
      ) {

        const attendance =
          attendanceRecords.find(
            record =>
              record.employeeId ===
              employee.id
          );


        const payslip =
          PayrollCalculationService
            .calculateEmployeePayslip(
              employee,
              attendance,
              period,
              config,
              runId
            );


        payslips.push(
          payslip
        );

        totalGross +=
          payslip.grossPay;

        totalDeductions +=
          payslip.totalDeductions;

        totalEmployerContrib +=
          payslip.socialSecurityEmployer;

        totalNet +=
          payslip.netPay;
      }


      const payrollRun: PayrollRun = {

        id: runId,

        companyId:
          req.companyId,

        runCode,

        title:
          title ||
          `Monthly Payroll ${period}`,

        period,

        status:
          'calculated',

        totalEmployees:
          employees.length,

        totalGrossPay:
          Math.round(
            totalGross * 100
          ) / 100,

        totalDeductions:
          Math.round(
            totalDeductions * 100
          ) / 100,

        totalEmployerContributions:
          Math.round(
            totalEmployerContrib * 100
          ) / 100,

        totalNetPay:
          Math.round(
            totalNet * 100
          ) / 100,

        payslips,

        createdAt:
          new Date().toISOString(),

        calculatedAt:
          new Date().toISOString()
      };


      const savedRun =
        await PayrollModel.saveRun(
          payrollRun
        );


      return res
        .status(201)
        .json({
          success: true,
          data: savedRun
        });

    } catch (err) {
      next(err);
    }
  }


  /**
   * POST /api/payroll/runs/:id/approve
   */
  static async approveRun(
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


      const { id } =
        req.params;


      /*
       * Security check before approval.
       */
      const existingRun =
        await PayrollModel.getRunById(
          id,
          req.companyId
        );


      if (!existingRun) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message:
              'Payroll run not found.'
          }
        });
      }


      const approvedBy =
        req.user
          ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() ||
            req.user.username
          : 'System User';


      const updated =
        await PayrollModel.updateStatus(
          id,
          'approved',
          approvedBy,
          req.companyId
        );


      if (!updated) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message:
              'Payroll run not found.'
          }
        });
      }


      /*
       * Automatically create/post
       * accounting journal.
       *
       * Journal layer will be migrated
       * to PostgreSQL next.
       */
      try {

        const {
          JournalEntryModel
        } =
          await import(
            '../models/JournalEntryModel'
          );


        const {
          AccountingIntegrationService
        } =
          await import(
            '../services/accountingIntegrationService'
          );


        const config =
          await SettingsModel.getConfig(
            req.companyId
          );


        const integrationService =
          new AccountingIntegrationService();


        const journalPayload =
          integrationService
            .generateJournalEntry(
              updated,
              config
            );


       let journalEntry =
        await JournalEntryModel.getByRunId(
         updated.id,
         req.companyId
       );


        if (!journalEntry) {

          journalEntry = {

            id:
              `je-${Date.now()}`,

            companyId:
              req.companyId,

            runId:
              updated.id,

            runCode:
              updated.runCode,

            reference:
              updated.runCode,

            period:
              updated.period,

            status:
              'pending',

            retryCount:
              0,

            maxRetries:
              5,

            totalDebit:
              updated.totalGrossPay +
              updated
                .totalEmployerContributions,

            totalCredit:
              updated.totalNetPay +
              updated.totalDeductions +
              updated
                .totalEmployerContributions,

            journalData:
              journalPayload,

            createdAt:
              new Date()
                .toISOString(),

            updatedAt:
              new Date()
                .toISOString()
          };
        }


        const sendResult =
          await integrationService
            .postDirectJournalPayload(
              journalPayload
            );


        if (sendResult.success) {

          journalEntry.status =
            'confirmed';

          journalEntry.transactionId =
            sendResult.transactionId;

          journalEntry.sentAt =
            new Date()
              .toISOString();

          journalEntry.lastError =
            undefined;

        } else {

          journalEntry.status =
            'failed';

          journalEntry.retryCount =
            (
              journalEntry.retryCount ||
              0
            ) + 1;

          journalEntry.lastError =
            sendResult.error;
        }


        await JournalEntryModel.save(
          journalEntry
        );

      } catch (err) {

        /*
         * Journal failure must not
         * rollback payroll approval.
         */
        console.warn(
          'Non-blocking warning: Failed to create journal entry on run approval:',
          err
        );
      }


      return res.json({
        success: true,
        data: updated
      });

    } catch (err) {
      next(err);
    }
  }


  /**
   * GET /api/payroll/payslips/:payslipId
   */
  static async getPayslipById(
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


      const { payslipId } =
        req.params;


      const payslip =
        await PayrollModel.getPayslipById(
          payslipId,
          req.companyId
        );


      if (!payslip) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message:
              'Payslip not found.'
          }
        });
      }


      /*
       * Verify that the employee
       * belongs to the current company.
       */
      const employee =
        await EmployeeModel.getById(
          payslip.employeeId,
          req.companyId
        );


      if (!employee) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message:
              'Payslip not found.'
          }
        });
      }


      return res.json({
        success: true,
        data: payslip
      });

    } catch (err) {
      next(err);
    }
  }


  /**
   * GET printable payslip
   */
  static async getPrintablePayslipHtml(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {

      if (!req.companyId) {
        return res.status(401).send(
          '<h1>Unauthorized</h1>'
        );
      }


      const { payslipId } =
        req.params;


      const payslip =
        await PayrollModel.getPayslipById(
          payslipId,
          req.companyId
        );


      if (!payslip) {
        return res
          .status(404)
          .send(
            '<h1>Payslip Not Found</h1>'
          );
      }


      const employee =
        await EmployeeModel.getById(
          payslip.employeeId,
          req.companyId
        );


      if (!employee) {
        return res
          .status(404)
          .send(
            '<h1>Payslip Not Found</h1>'
          );
      }


      /*
       * Company-specific settings
       * loaded from PostgreSQL.
       */
      const config =
        await SettingsModel.getConfig(
          req.companyId
        );


      const html =
        PayslipService
          .generatePrintableHtml(
            payslip,
            config
          );


      res.setHeader(
        'Content-Type',
        'text/html; charset=utf-8'
      );


      return res.send(
        html
      );

    } catch (err) {
      next(err);
    }
  }
}