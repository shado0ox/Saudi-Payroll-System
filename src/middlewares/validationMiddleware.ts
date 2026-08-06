import { Request, Response, NextFunction } from 'express';

export function validateEmployeeInput(req: Request, res: Response, next: NextFunction) {
  const { firstName, lastName, email, basicSalary, department } = req.body;

  if (!firstName || !lastName || !email || !department) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: firstName, lastName, email, department'
      }
    });
  }

  if (typeof basicSalary !== 'number' || basicSalary < 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'basicSalary must be a positive number'
      }
    });
  }

  next();
}

export function validatePayrollRunInput(req: Request, res: Response, next: NextFunction) {
  const { period } = req.body;

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Valid period parameter (YYYY-MM) is required'
      }
    });
  }

  next();
}
