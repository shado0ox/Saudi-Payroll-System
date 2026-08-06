import { PayrollRun, SystemConfig } from '../types';
import { decryptField } from '../utils/cryptoHelper';

export class PayrollExportService {
  /**
   * Service 3: Reports, WPS Bank Files, CSV Exports, Audit Logs
   */
  static generateWpsBankFile(run: PayrollRun, config: SystemConfig): string {
    const lines: string[] = [];
    
    // Header Record
    // Format: HDR,Company Name,Period,Total Employees,Total Amount,Currency
    lines.push(`HDR,${config.companyName.replace(/,/g, '')},${run.period},${run.totalEmployees},${run.totalNetPay.toFixed(2)},${config.currency}`);

    // Detail Records - Decrypt IBAN specifically for WPS bank file transmission
    // Format: EDR,EmployeeCode,EmployeeName,IBAN,BasicSalary,Housing,Transport,Other,Deductions,NetSalary
    run.payslips.forEach(p => {
      const sanitizedName = p.employeeName.replace(/,/g, '');
      const rawIban = decryptField(p.bankIban);
      lines.push(
        `EDR,${p.employeeCode},${sanitizedName},${rawIban},${p.basicSalary.toFixed(2)},${p.housingAllowance.toFixed(2)},${p.transportAllowance.toFixed(2)},${p.otherAllowances.toFixed(2)},${p.totalDeductions.toFixed(2)},${p.netPay.toFixed(2)}`
      );
    });

    return lines.join('\n');
  }

  static generateCsvSummary(run: PayrollRun): string {
    const headers = [
      'Employee Code',
      'Employee Name',
      'Department',
      'Basic Salary',
      'Housing Allowance',
      'Transport Allowance',
      'Overtime Pay',
      'Other Allowances',
      'Gross Pay',
      'Income Tax',
      'GOSI Employee Share',
      'GOSI Employer Share',
      'Other Deductions',
      'Total Deductions',
      'Net Pay',
      'IBAN'
    ];

    const rows = run.payslips.map(p => {
      const decryptedIban = decryptField(p.bankIban);
      return [
        p.employeeCode,
        `"${p.employeeName}"`,
        `"${p.department}"`,
        p.basicSalary,
        p.housingAllowance,
        p.transportAllowance,
        p.overtimePay,
        p.otherAllowances,
        p.grossPay,
        p.incomeTax,
        p.socialSecurityEmployee,
        p.socialSecurityEmployer,
        p.otherDeductions,
        p.totalDeductions,
        p.netPay,
        decryptedIban
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
