import { PayrollCalculationService } from '../src/services/payrollCalculationService';
import { Employee, AttendanceRecord, SystemConfig } from '../src/types';

describe('PayrollCalculationService Unit Tests', () => {
  const defaultConfig: SystemConfig = {
    companyName: 'Apex Saudi Tech',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    standardMonthlyWorkDays: 30,
    overtimeHourlyMultiplier: 1.5,
    socialSecurityEmployeeRate: 0.10, // 10%
    socialSecurityEmployerRate: 0.12, // 12%
    taxBrackets: [],
    autoProcessSchedule: '0 0 25 * *',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const baseEmployee: Employee = {
    id: 'emp-001',
    companyId: 'comp-101',
    employeeCode: 'EMP-001',
    firstName: 'Sara',
    lastName: 'Al-Harbi',
    nationalId: '1010987654',
    email: 'sara@apexpayroll.com',
    phone: '+966500000000',
    department: 'Engineering',
    position: 'Software Developer',
    status: 'active',
    employmentType: 'full_time',
    bankName: 'Al Rajhi Bank',
    iban: 'SA0380000000608010101001',
    basicSalary: 10000,
    housingAllowance: 2500,
    transportAllowance: 1000,
    customAllowances: [],
    customDeductions: [],
    taxExempt: true,
    socialSecurityEnrolled: true,
    joinDate: '2023-01-01',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  test('حساب الراتب الصحيح دون خصومات أو إضافات (Standard Calculation)', () => {
    const payslip = PayrollCalculationService.calculateEmployeePayslip(
      baseEmployee,
      undefined,
      '2026-08',
      defaultConfig,
      'run-101'
    );

    // Basic: 10000, Housing: 2500, Transport: 1000 => Gross: 13500
    expect(payslip.grossPay).toBe(13500);
    // GOSI Contributory = 10000 + 2500 = 12500
    // Employee GOSI 10% = 1250
    expect(payslip.socialSecurityEmployee).toBe(1250);
    // Employer GOSI 12% = 1500
    expect(payslip.socialSecurityEmployer).toBe(1500);
    // Net Pay = Gross (13500) - GOSI (1250) = 12250
    expect(payslip.netPay).toBe(12250);
  });

  test('خصم الغياب (Unpaid Absence Deduction)', () => {
    const attendance: AttendanceRecord = {
      id: 'att-1',
      employeeId: baseEmployee.id,
      period: '2026-08',
      workingDays: 30,
      presentDays: 27,
      unpaidAbsenceDays: 3, // 3 days absence
      overtimeHours: 0,
      updatedAt: '2026-08-01'
    };

    const payslip = PayrollCalculationService.calculateEmployeePayslip(
      baseEmployee,
      attendance,
      '2026-08',
      defaultConfig,
      'run-101'
    );

    // Daily rate = 10000 / 30 = 333.3333...
    // 3 days deduction = 1000 SAR
    expect(payslip.absentDays).toBe(3);
    const expectedAbsenceDeduction = Number((3 * (10000 / 30)).toFixed(2));
    expect(payslip.otherDeductions).toBe(expectedAbsenceDeduction);
    expect(payslip.totalDeductions).toBe(1250 + expectedAbsenceDeduction);
    expect(payslip.netPay).toBe(13500 - 1250 - expectedAbsenceDeduction);
  });

  test('تسوية السلف بالتقسيط (Custom Installment Loan Deductions)', () => {
    const employeeWithLoan: Employee = {
      ...baseEmployee,
      customDeductions: [
        { id: 'loan-ded-1', name: 'قسط سلفة الشركة (Monthly Loan Installment)', amount: 500, isPreTax: false }
      ]
    };

    const payslip = PayrollCalculationService.calculateEmployeePayslip(
      employeeWithLoan,
      undefined,
      '2026-08',
      defaultConfig,
      'run-101'
    );

    // Gross: 13500
    // Deductions: GOSI (1250) + Loan (500) = 1750
    expect(payslip.totalDeductions).toBe(1750);
    expect(payslip.netPay).toBe(13500 - 1750); // 11750
    const loanItem = payslip.items.find(i => i.code === 'DED_CUST_loan-ded-1');
    expect(loanItem).toBeDefined();
    expect(loanItem?.amount).toBe(500);
  });

  test('حساب التأمينات الاجتماعية GOSI بشكل دقيق', () => {
    const payslip = PayrollCalculationService.calculateEmployeePayslip(
      baseEmployee,
      undefined,
      '2026-08',
      defaultConfig,
      'run-101'
    );

    // Contributory Salary = 10000 + 2500 = 12500
    expect(payslip.socialSecurityEmployee).toBe(12500 * 0.10);
    expect(payslip.socialSecurityEmployer).toBe(12500 * 0.12);
  });

  test('حالة حدّية: موظفة بدون بدلات (Zero Allowances)', () => {
    const noAllowancesEmp: Employee = {
      ...baseEmployee,
      housingAllowance: 0,
      transportAllowance: 0,
      customAllowances: []
    };

    const payslip = PayrollCalculationService.calculateEmployeePayslip(
      noAllowancesEmp,
      undefined,
      '2026-08',
      defaultConfig,
      'run-101'
    );

    expect(payslip.grossPay).toBe(10000);
    // GOSI Contributory = 10000
    expect(payslip.socialSecurityEmployee).toBe(1000); // 10%
    expect(payslip.netPay).toBe(9000);
  });

  test('حالة حدّية: موظفة غير مشتركة بالتأمينات الاجتماعية (GOSI Excluded)', () => {
    const nonGosiEmp: Employee = {
      ...baseEmployee,
      socialSecurityEnrolled: false
    };

    const payslip = PayrollCalculationService.calculateEmployeePayslip(
      nonGosiEmp,
      undefined,
      '2026-08',
      defaultConfig,
      'run-101'
    );

    expect(payslip.socialSecurityEmployee).toBe(0);
    expect(payslip.socialSecurityEmployer).toBe(0);
    expect(payslip.totalDeductions).toBe(0);
    expect(payslip.netPay).toBe(13500);
  });
});
