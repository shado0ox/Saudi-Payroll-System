import { Response, NextFunction } from 'express';
import { AttendanceModel } from '../models/AttendanceModel';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class AttendanceController {

  static async getByPeriod(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const period =
        (req.query.period as string) ||
        new Date().toISOString().substring(0, 7);

      if (!req.companyId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });
      }

      const records =
        await AttendanceModel.getForPeriod(
          period,
          req.companyId
        );

      return res.json({
        success: true,
        data: {
          period,
          records
        }
      });

    } catch (err) {
      next(err);
    }
  }


  static async updateRecord(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        employeeId,
        period,
        workingDays,
        presentDays,
        unpaidAbsenceDays,
        overtimeHours,
        notes
      } = req.body;

      if (!req.companyId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });
      }

      if (!employeeId || !period) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'employeeId and period are required.'
          }
        });
      }

      const record =
        await AttendanceModel.upsert(
          {
            employeeId,
            period,

            workingDays:
              workingDays !== undefined
                ? Number(workingDays)
                : 30,

            presentDays:
              presentDays !== undefined
                ? Number(presentDays)
                : 30,

            unpaidAbsenceDays:
              unpaidAbsenceDays !== undefined
                ? Number(unpaidAbsenceDays)
                : 0,

            overtimeHours:
              overtimeHours !== undefined
                ? Number(overtimeHours)
                : 0,

            notes: notes || ''
          },
          req.companyId
        );

      return res.json({
        success: true,
        data: record
      });

    } catch (err) {
      next(err);
    }
  }
}