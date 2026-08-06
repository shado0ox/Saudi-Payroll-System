import { Request, Response, NextFunction } from 'express';
import { PayrollModel } from '../models/PayrollModel';
import { EmployeeModel } from '../models/EmployeeModel';
import { AttendanceModel } from '../models/AttendanceModel';
import { getDatabase } from '../models/db';
import { PayrollCalculationService } from '../services/payrollCalculationService';
import { PayslipService } from '../services/payslipService';
import { PayrollRun, Payslip } from '../types';

export class PayrollController {
  static async getRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const runs = PayrollModel.getAllRuns();
      res.json({ success: true, data: runs });
    } catch (err) {
      next(err);
    }
  }

  static async getRunById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const run = PayrollModel.getRunById(id);
      if (!run) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payroll run not found' }
        });
      }
      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }

  static async createOrCalculateRun(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, title } = req.body;
      const db = getDatabase();
      const config = db.config;

      const employees = EmployeeModel.getAll().filter(e => e.status === 'active');
      const attendanceRecords = AttendanceModel.getForPeriod(period);

      const runId = `pr-${period}`;
      const runCode = `PAY-${period.replace('-', '')}`;
      
      const payslips: Payslip[] = [];
      let totalGross = 0;
      let totalDeductions = 0;
      let totalEmployerContrib = 0;
      let totalNet = 0;

      for (const emp of employees) {
        const att = attendanceRecords.find(a => a.employeeId === emp.id);
        const payslip = PayrollCalculationService.calculateEmployeePayslip(emp, att, period, config, runId);
        
        payslips.push(payslip);
        totalGross += payslip.grossPay;
        totalDeductions += payslip.totalDeductions;
        totalEmployerContrib += payslip.socialSecurityEmployer;
        totalNet += payslip.netPay;
      }

      const payrollRun: PayrollRun = {
        id: runId,
        companyId: (req as any).companyId || 'comp-101',
        runCode,
        title: title || `Monthly Payroll ${period}`,
        period,
        status: 'calculated',
        totalEmployees: employees.length,
        totalGrossPay: Math.round(totalGross * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalEmployerContributions: Math.round(totalEmployerContrib * 100) / 100,
        totalNetPay: Math.round(totalNet * 100) / 100,
        payslips,
        createdAt: new Date().toISOString(),
        calculatedAt: new Date().toISOString()
      };

      PayrollModel.saveRun(payrollRun);

      res.status(201).json({ success: true, data: payrollRun });
    } catch (err) {
      next(err);
    }
  }

  static async approveRun(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;

      const updated = PayrollModel.updateStatus(id, 'approved', approvedBy || 'Finance Director');
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payroll run not found' }
        });
      }

      // Automatically generate & post journal entry to accounting system
      try {
        const { JournalEntryModel } = await import('../models/JournalEntryModel');
        const { AccountingIntegrationService } = await import('../services/accountingIntegrationService');
        const db = getDatabase();

        const integrationService = new AccountingIntegrationService();
        const journalPayload = integrationService.generateJournalEntry(updated, db.config);

        let journalEntry = JournalEntryModel.getByRunId(updated.id);
        if (!journalEntry) {
          journalEntry = {
            id: `je-${Date.now()}`,
            companyId: updated.companyId || (req as any).companyId || 'comp-101',
            runId: updated.id,
            runCode: updated.runCode,
            reference: updated.runCode,
            period: updated.period,
            status: 'pending',
            retryCount: 0,
            maxRetries: 5,
            totalDebit: updated.totalGrossPay + updated.totalEmployerContributions,
            totalCredit: updated.totalNetPay + updated.totalDeductions + updated.totalEmployerContributions,
            journalData: journalPayload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }

        const sendRes = await integrationService.postDirectJournalPayload(journalPayload);
        if (sendRes.success) {
          journalEntry.status = 'confirmed';
          journalEntry.transactionId = sendRes.transactionId;
          journalEntry.sentAt = new Date().toISOString();
          journalEntry.lastError = undefined;
        } else {
          journalEntry.status = 'failed';
          journalEntry.retryCount = (journalEntry.retryCount || 0) + 1;
          journalEntry.lastError = sendRes.error;
        }

        JournalEntryModel.save(journalEntry);
      } catch (err) {
        console.warn('Non-blocking warning: Failed to create journal entry on run approval:', err);
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async getPayslipById(req: Request, res: Response, next: NextFunction) {
    try {
      const { payslipId } = req.params;
      const payslip = PayrollModel.getPayslipById(payslipId);

      if (!payslip) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payslip not found' }
        });
      }

      res.json({ success: true, data: payslip });
    } catch (err) {
      next(err);
    }
  }

  static async getPrintablePayslipHtml(req: Request, res: Response, next: NextFunction) {
    try {
      const { payslipId } = req.params;
      const payslip = PayrollModel.getPayslipById(payslipId);

      if (!payslip) {
        return res.status(404).send('<h1>Payslip Not Found</h1>');
      }

      const db = getDatabase();
      const html = PayslipService.generatePrintableHtml(payslip, db.config);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      next(err);
    }
  }
}
