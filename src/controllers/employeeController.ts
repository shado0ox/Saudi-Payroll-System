import { Response, NextFunction } from 'express';
import { EmployeeModel } from '../models/EmployeeModel';
import { DepartmentModel } from '../models/DepartmentModel';
import { maskEmployeeSensitiveData } from '../utils/cryptoHelper';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class EmployeeController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId;
      const rawEmployees = EmployeeModel.getAll(companyId);
      const departments = DepartmentModel.getAll();
      const maskedEmployees = rawEmployees.map(emp => maskEmployeeSensitiveData(emp));

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

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.companyId;
      const employee = EmployeeModel.getById(id, companyId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' }
        });
      }
      res.json({ success: true, data: maskEmployeeSensitiveData(employee) });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId || 'comp-101';
      const count = EmployeeModel.getAll(companyId).length;
      const code = `EMP-${String(count + 1).padStart(3, '0')}`;
      
      const newEmployee = EmployeeModel.create({
        companyId,
        employeeCode: code,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        nationalId: req.body.nationalId || '1010123456',
        email: req.body.email,
        phone: req.body.phone || '+966 50 000 0000',
        department: req.body.department,
        position: req.body.position || 'Specialist',
        joinDate: req.body.joinDate || new Date().toISOString().split('T')[0],
        status: req.body.status || 'active',
        employmentType: req.body.employmentType || 'full_time',
        bankName: req.body.bankName || 'Al Rajhi Bank',
        iban: req.body.iban || 'SA0000000000000000000000',
        basicSalary: Number(req.body.basicSalary) || 5000,
        housingAllowance: Number(req.body.housingAllowance) || 1250,
        transportAllowance: Number(req.body.transportAllowance) || 500,
        customAllowances: req.body.customAllowances || [],
        customDeductions: req.body.customDeductions || [],
        taxExempt: Boolean(req.body.taxExempt),
        socialSecurityEnrolled: req.body.socialSecurityEnrolled !== false
      }, companyId);

      res.status(201).json({ success: true, data: maskEmployeeSensitiveData(newEmployee) });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.companyId;
      const updated = EmployeeModel.update(id, req.body, companyId);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' }
        });
      }
      res.json({ success: true, data: maskEmployeeSensitiveData(updated) });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.companyId;
      const success = EmployeeModel.delete(id, companyId);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' }
        });
      }
      res.json({ success: true, message: 'Employee removed successfully' });
    } catch (err) {
      next(err);
    }
  }
}
