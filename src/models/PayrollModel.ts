import { getDatabase, saveDatabase } from './db';
import { PayrollRun, Payslip, PayrollStatus } from '../types';

export class PayrollModel {
  static getAllRuns(companyId?: string): PayrollRun[] {
    const db = getDatabase();
    if (!companyId) return db.payrollRuns;
    return db.payrollRuns.filter(r => r.companyId === companyId);
  }

  static getRunById(id: string, companyId?: string): PayrollRun | undefined {
    const db = getDatabase();
    return db.payrollRuns.find(r => r.id === id && (!companyId || r.companyId === companyId));
  }

  static getRunByPeriod(period: string, companyId?: string): PayrollRun | undefined {
    const db = getDatabase();
    return db.payrollRuns.find(r => r.period === period && (!companyId || r.companyId === companyId));
  }

  static saveRun(run: PayrollRun): PayrollRun {
    const db = getDatabase();
    if (!run.companyId) run.companyId = 'comp-101';
    const existingIndex = db.payrollRuns.findIndex(r => r.id === run.id);
    
    if (existingIndex >= 0) {
      db.payrollRuns[existingIndex] = run;
    } else {
      db.payrollRuns.push(run);
    }

    saveDatabase(db);
    return run;
  }

  static updateStatus(id: string, status: PayrollStatus, approvedBy?: string, companyId?: string): PayrollRun | null {
    const db = getDatabase();
    const run = db.payrollRuns.find(r => r.id === id && (!companyId || r.companyId === companyId));
    if (!run) return null;

    run.status = status;
    if (status === 'approved' || status === 'paid') {
      run.approvedAt = new Date().toISOString();
      run.approvedBy = approvedBy || 'Finance Director';
    }

    saveDatabase(db);
    return run;
  }

  static getPayslipById(payslipId: string, companyId?: string): Payslip | undefined {
    const db = getDatabase();
    for (const run of db.payrollRuns) {
      if (companyId && run.companyId !== companyId) continue;
      const match = run.payslips.find(p => p.id === payslipId);
      if (match) return match;
    }
    return undefined;
  }

  static getPayslipsByEmployee(employeeId: string, companyId?: string): Payslip[] {
    const db = getDatabase();
    const results: Payslip[] = [];
    for (const run of db.payrollRuns) {
      if (companyId && run.companyId !== companyId) continue;
      for (const p of run.payslips) {
        if (p.employeeId === employeeId) {
          results.push(p);
        }
      }
    }
    return results;
  }
}
