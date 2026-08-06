import { Request, Response, NextFunction } from 'express';
import { PayrollModel } from '../models/PayrollModel';
import { getDatabase } from '../models/db';
import { PayrollExportService } from '../services/payrollExportService';

export class ReportController {
  static async exportWpsFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { runId } = req.params;
      const run = PayrollModel.getRunById(runId);

      if (!run) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payroll run not found' }
        });
      }

      const db = getDatabase();
      const wpsContent = PayrollExportService.generateWpsBankFile(run, db.config);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="WPS_BANK_FILE_${run.period}.txt"`);
      res.send(wpsContent);
    } catch (err) {
      next(err);
    }
  }

  static async exportCsvSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { runId } = req.params;
      const run = PayrollModel.getRunById(runId);

      if (!run) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payroll run not found' }
        });
      }

      const csvContent = PayrollExportService.generateCsvSummary(run);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Payroll_Summary_${run.period}.csv"`);
      res.send(csvContent);
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const db = getDatabase();
      res.json({ success: true, data: db.auditLogs });
    } catch (err) {
      next(err);
    }
  }
}
