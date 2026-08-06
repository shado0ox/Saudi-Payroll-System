import { Request, Response, NextFunction } from 'express';
import { AttendanceModel } from '../models/AttendanceModel';

export class AttendanceController {
  static async getByPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || new Date().toISOString().substring(0, 7);
      const records = AttendanceModel.getForPeriod(period);
      res.json({ success: true, data: { period, records } });
    } catch (err) {
      next(err);
    }
  }

  static async updateRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, period, workingDays, presentDays, unpaidAbsenceDays, overtimeHours, notes } = req.body;

      if (!employeeId || !period) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'employeeId and period are required' }
        });
      }

      const record = AttendanceModel.upsert({
        employeeId,
        period,
        workingDays: Number(workingDays) || 30,
        presentDays: Number(presentDays) || 30,
        unpaidAbsenceDays: Number(unpaidAbsenceDays) || 0,
        overtimeHours: Number(overtimeHours) || 0,
        notes: notes || ''
      });

      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
}
