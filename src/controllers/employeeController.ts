import { Response, NextFunction } from 'express';
import { EmployeeModel } from '../models/EmployeeModel';
import { DepartmentModel } from '../models/DepartmentModel';
import { maskEmployeeSensitiveData } from '../utils/cryptoHelper';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class EmployeeController {

  static async getAll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = req.companyId;

      const rawEmployees = await EmployeeModel.getAll(companyId);
      const departments = await DepartmentModel.getAll(companyId);

      const maskedEmployees = rawEmployees.map(emp =>
        maskEmployeeSensitiveData(emp)
      );

      res.json({
        success: true,
        data: {
          employees: maskedEmployees,
          departments
        }
      });

    } catch (err) {
      next(err);
    }
  }


  static async getById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const companyId = req.companyId;

      const employee = await EmployeeModel.getById(id, companyId);

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Employee not found'
          }
        });
      }

      res.json({
        success: true,
        data: maskEmployeeSensitiveData(employee)
      });

    } catch (err) {
      next(err);
    }
  }


  static async create(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Company ID is required'
          }
        });
      }

      const employees = await EmployeeModel.getAll(companyId);

      const code =
        `EMP-${String(employees.length + 1).padStart(3, '0')}`;

      const newEmployee = await EmployeeModel.create(
        {
          companyId,
          employeeCode: code,

          firstName: req.body.firstName,
          lastName: req.body.lastName,

          nationalId: req.body.nationalId || '',

          email: req.body.email,
          phone: req.body.phone || '',

          department: req.body.department,
          position: req.body.position || 'Specialist',

          joinDate:
            req.body.joinDate ||
            new Date().toISOString().split('T')[0],

          status: req.body.status || 'active',
          employmentType:
            req.body.employmentType || 'full_time',

          bankName: req.body.bankName || '',
          iban: req.body.iban || '',

          basicSalary:
            Number(req.body.basicSalary) || 0,

          housingAllowance:
            Number(req.body.housingAllowance) || 0,

          transportAllowance:
            Number(req.body.transportAllowance) || 0,

          customAllowances:
            req.body.customAllowances || [],

          customDeductions:
            req.body.customDeductions || [],

          taxExempt:
            Boolean(req.body.taxExempt),

          socialSecurityEnrolled:
            req.body.socialSecurityEnrolled !== false
        },
        companyId
      );

      res.status(201).json({
        success: true,
        data: maskEmployeeSensitiveData(newEmployee)
      });

    } catch (err) {
      next(err);
    }
  }


  static async update(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const companyId = req.companyId;

      const updated = await EmployeeModel.update(
        id,
        req.body,
        companyId
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Employee not found'
          }
        });
      }

      res.json({
        success: true,
        data: maskEmployeeSensitiveData(updated)
      });

    } catch (err) {
      next(err);
    }
  }


  static async delete(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const companyId = req.companyId;

      const success = await EmployeeModel.delete(
        id,
        companyId
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Employee not found'
          }
        });
      }

      res.json({
        success: true,
        message: 'Employee removed successfully'
      });

    } catch (err) {
      next(err);
    }
  }
}