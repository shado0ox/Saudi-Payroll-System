import { getDatabase, saveDatabase } from './db';
import { Employee } from '../types';
import { encryptField } from '../utils/cryptoHelper';

export class EmployeeModel {
  static getAll(companyId?: string): Employee[] {
    const db = getDatabase();
    if (!companyId) return db.employees;
    return db.employees.filter(e => e.companyId === companyId);
  }

  static getById(id: string, companyId?: string): Employee | undefined {
    const db = getDatabase();
    return db.employees.find(e => e.id === id && (!companyId || e.companyId === companyId));
  }

  static getByCode(code: string, companyId?: string): Employee | undefined {
    const db = getDatabase();
    return db.employees.find(e => 
      e.employeeCode.toLowerCase() === code.toLowerCase() && (!companyId || e.companyId === companyId)
    );
  }

  static create(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> & { companyId?: string }, targetCompanyId?: string): Employee {
    const db = getDatabase();
    const now = new Date().toISOString();
    const newId = `emp-${Date.now()}`;
    const companyId = employeeData.companyId || targetCompanyId || 'comp-101';
    
    // Encrypt sensitive PII fields before saving
    const encryptedData = {
      ...employeeData,
      companyId,
      nationalId: encryptField(employeeData.nationalId || '1000000000'),
      iban: encryptField(employeeData.iban || 'SA0000000000000000000000')
    };

    const newEmployee: Employee = {
      ...encryptedData,
      id: newId,
      createdAt: now,
      updatedAt: now
    };

    db.employees.push(newEmployee);

    // Update department count
    const dept = db.departments.find(d => d.name === newEmployee.department && (!d.companyId || d.companyId === companyId));
    if (dept) {
      dept.employeeCount += 1;
    }

    saveDatabase(db);
    return newEmployee;
  }

  static update(id: string, updates: Partial<Employee>, companyId?: string): Employee | null {
    const db = getDatabase();
    const index = db.employees.findIndex(e => e.id === id && (!companyId || e.companyId === companyId));
    if (index === -1) return null;

    const current = db.employees[index];

    // Encrypt sensitive fields if updated
    const processedUpdates = { ...updates };
    if (processedUpdates.nationalId) {
      processedUpdates.nationalId = encryptField(processedUpdates.nationalId);
    }
    if (processedUpdates.iban) {
      processedUpdates.iban = encryptField(processedUpdates.iban);
    }

    const updatedEmployee: Employee = {
      ...current,
      ...processedUpdates,
      updatedAt: new Date().toISOString()
    };

    db.employees[index] = updatedEmployee;
    saveDatabase(db);
    return updatedEmployee;
  }

  static delete(id: string, companyId?: string): boolean {
    const db = getDatabase();
    const index = db.employees.findIndex(e => e.id === id && (!companyId || e.companyId === companyId));
    if (index === -1) return false;

    const removed = db.employees[index];
    db.employees.splice(index, 1);

    const dept = db.departments.find(d => d.name === removed.department && (!d.companyId || d.companyId === removed.companyId));
    if (dept && dept.employeeCount > 0) {
      dept.employeeCount -= 1;
    }

    saveDatabase(db);
    return true;
  }
}
